// File: /pages/api/generate-meal-plan.js

export const config = {
  runtime: 'edge',
};

const questionMap = {
  "1": "What is your gender?",
  "2": "How much variety do you want in your meal plan?",
  "3": "Choose the meat you want to include",
  "4": "Choose the vegetable you want to include",
  "5": "Choose other products you want to include",
  "6": "What is your activity level?",
  "7": "Do you have any allergies?",
  "8": "What is your primary goal?",
  "9": "Do you have a budget preference for meal prep?",
  "10": "Do you snack frequently?",
  "11": "What is your preferred cooking time?",
  "12": "What motivates you the most?"
};

const localePrompts = {
  en: "Respond in English.",
  hr: "Odgovori na hrvatskom jeziku.",
  de: "Antworte auf Deutsch.",
  fr: "Répondez en français."
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Only POST allowed' }), { status: 405 });
  }

  const { email, quiz_answers, locale = 'en' } = await req.json();

  if (!email || !quiz_answers) {
    return new Response(JSON.stringify({ error: 'Missing email or quiz_answers' }), { status: 400 });
  }

  const languageInstruction = localePrompts[locale] || localePrompts.en;

  const formattedData = Object.entries(questionMap).map(([id, question]) => ({
    question,
    answer: quiz_answers[id]?.join(", ") || "Not answered",
  }));

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo-0125",
            stream: true,
            messages: [
              {
                role: "system",
                content: `${languageInstruction}
                You are a JSON API that only replies with valid JSON. No markdown, no explanation, no placeholders. Use METRIC units. Strictly return:
{
  "mealPlan": {
    "Day1": {
      "Breakfast": { "name": "...", "ingredients": [...], "instructions": "..." },
      "Lunch": { ... },
      "Dinner": { ... }
    },
    ...
  }
}
${languageInstruction}

Use ONLY double quotes. Escape invalid characters. No trailing commas.`,
              },
              {
                role: "user",
                content: `${languageInstruction}
                Create a 5-day personalized keto meal plan with full recipes based on:
${JSON.stringify(formattedData)}`,
              },
            ],
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
          buffer = lines.pop(); // handle partial

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
