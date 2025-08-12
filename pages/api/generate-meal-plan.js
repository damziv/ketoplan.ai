// /api/generate-naturalfix-plan.js
import { createClient } from '@supabase/supabase-js';

export const config = {
  runtime: 'edge',
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const localePrompts = {
  en: "Respond in English.",
  hr: "Odgovori na hrvatskom jeziku.",
  de: "Antworte auf Deutsch.",
  pl: "Odpowiedź po polsku."
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Only POST allowed' }), { status: 405 });
  }

  const { email, quiz_answers, locale = 'en' } = await req.json();

  if (!email || !quiz_answers) {
    return new Response(JSON.stringify({ error: 'Missing email or quiz_answers' }), { status: 400 });
  }

  // 🔎 Fetch session (same protections)
  const { data: session, error } = await supabase
    .from('sessions')
    .select('id, is_subscriber, last_meal_plan_at')
    .eq('email', email)
    .eq('payment_status', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !session) {
    return new Response(JSON.stringify({ error: 'No paid session found' }), { status: 404 });
  }

  const isSubscriber = session.is_subscriber;
  const lastGenerated = session.last_meal_plan_at ? new Date(session.last_meal_plan_at) : null;
  const now = new Date();

  // ⏳ 30‑day cooldown for subscribers (unchanged)
  if (isSubscriber && lastGenerated) {
    const daysSince = Math.floor((now - lastGenerated) / (1000 * 60 * 60 * 24));
    if (daysSince < 30) {
      return new Response(JSON.stringify({ error: `You can generate a new plan in ${30 - daysSince} days.` }), { status: 403 });
    }
  }

  // Map quiz answers to readable QA pairs (generic; works with your current data)
  const formattedData = Object.entries(quiz_answers).map(([id, ans]) => ({
    questionId: id,
    answer: Array.isArray(ans) ? ans.join(", ") : String(ans ?? "Not answered")
  }));

  const languageInstruction = localePrompts[locale] || localePrompts.en;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const systemPrompt = `${languageInstruction}
You are a JSON API that ONLY replies with valid JSON. No markdown, no explanations, no placeholders. Use METRIC units. Be concise, practical, supportive.
Strictly return a single object with this schema:

{
  "plan": {
    "profile": {
      "focusAreas": ["energy","digestion","stress"], 
      "summary": "2-3 sentences tailored to the user’s lifestyle, mood, main goals.",
      "calorieHint": "Optional gentle note; no strict dieting.",
      "hormoneSupportNote": "Optional, friendly hormone-support tip."
    },
    "nutrition": {
      "targets": {
        "proteinPerDay": "e.g. 80–100 g",
        "carbsPerDay": "e.g. 70–120 g (mostly veg/fruit)",
        "fatsPerDay": "e.g. 60–80 g (olive oil, avocado, nuts)",
        "hydration": "e.g. 2.0–2.5 L water"
      },
      "emphasize": ["foods to emphasize"],
      "avoidOrLimit": ["items to limit"]
    },
    "routine": {
      "morning": ["simple steps"],
      "daytime": ["simple steps"],
      "evening": ["simple steps"]
    },
    "supplements": [
      { "name":"...", "dose":"...", "note":"..." }
    ],
    "movement": {
      "weeklyPlan": ["3× walks ...","2× strength ...","1× mobility ..."],
      "extras": ["short add-ons"]
    },
    "stressSleep": {
      "stressTools": ["2–3 very short tools"],
      "sleepHygiene": ["2–3 simple rules"]
    },
    "microHabits7Day": [
      { "day":"Day 1", "habit":"..." },
      { "day":"Day 2", "habit":"..." },
      { "day":"Day 3", "habit":"..." },
      { "day":"Day 4", "habit":"..." },
      { "day":"Day 5", "habit":"..." },
      { "day":"Day 6", "habit":"..." },
      { "day":"Day 7", "habit":"..." }
    ],
    "weeklyChecklist": ["3–6 concise checklist items"],
    "disclaimers": [
      "This plan is educational and not medical advice.",
      "Consult your healthcare provider before supplements."
    ]
  }
}

Rules:
- Use ONLY double quotes.
- Escape any special characters.
- No trailing commas.
- Keep advice natural, food-first, and gentle (no extreme diets or medical claims).
- Supplements must be optional with conservative, commonly used ranges only; avoid contraindications or disease claims.`;

        const userPrompt = `Create a personalized NaturalFix wellness plan (not keto-only) based on these quiz answers:
${JSON.stringify(formattedData)}

User goals: balance energy, support digestion, reduce stress-related fatigue, gentle weight support, hormone-friendly habits.
Tailor tone and specifics to the answers. Keep sections concrete and doable.`;

        const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo-0125", // keep your current model; upgrade later if you want
            stream: true,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            // You can cap max_tokens if needed
          }),
        });

        if (!openaiRes.ok || !openaiRes.body) {
          controller.enqueue(encoder.encode("data: [ERROR]\n\n"));
          controller.close();
          return;
        }

        const reader = openaiRes.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;

          const lines = buffer.split("\n");
          buffer = lines.pop();

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.replace("data: ", "").trim();
              if (data === "[DONE]") {
                controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              } else {
                controller.enqueue(encoder.encode(`data: ${data}\n\n`));
              }
            }
          }
        }

        // ✅ Update last_meal_plan_at AFTER successful stream
        await supabase
          .from('sessions')
          .update({ last_meal_plan_at: now.toISOString() })
          .eq('id', session.id);

        controller.close();
      } catch (err) {
        controller.enqueue(encoder.encode("data: [ERROR]\n\n"));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
