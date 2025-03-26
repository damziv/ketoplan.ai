// pages/api/edge-generate-meal-plan.js
export const config = {
    runtime: 'edge',
  };
  
  import { createParser } from "eventsource-parser";
  import { createClient } from '@supabase/supabase-js';
  
  // Initialize the Supabase client (this should work in Edge if using the browser‑compatible version)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  
  export default async function handler(request) {
    // Expect JSON payload with at least { email }
    const { email } = await request.json();
    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), { status: 400 });
    }
  
    // Fetch the latest session from Supabase using the email
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('id, quiz_answers, payment_status')
      .eq('email', email)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
  
    if (sessionError || !session) {
      return new Response(JSON.stringify({ error: "Session not found" }), { status: 404 });
    }
    if (!session.payment_status) {
      return new Response(JSON.stringify({ error: "Payment not completed for this session" }), { status: 403 });
    }
  
    // Build the formatted data from the stored quiz_answers using your questionMap
    const questionMap = {
      "1": "What is your gender?",
      "2": "Do you have any dietary restrictions?",
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
  
    const formattedData = Object.entries(questionMap).map(([id, question]) => ({
      question,
      answer: session.quiz_answers && session.quiz_answers[id]
        ? session.quiz_answers[id].join(", ")
        : "Not answered"
    }));
  
    // Construct the ChatGPT messages with explicit instructions
    const messages = [
      {
        role: "system",
        content:
          "You are a nutritionist generating personalized 5-day meal plans. Each meal should include a recipe with ingredients and preparation steps. Your response MUST be valid JSON. DO NOT include any extra text."
      },
      {
        role: "user",
        content: `Create a **5-day meal plan** with full recipes based on the user's profile:\n\n${JSON.stringify(formattedData, null, 2)}
  
  Follow this JSON format:
  {
    "meal_plan": [
      { "day": "Monday", 
        "breakfast": { "name": "Scrambled Eggs with Avocado", "ingredients": ["2 eggs", "1/2 avocado", "Salt"], "instructions": "Scramble the eggs and serve with sliced avocado." },
        "lunch": { "name": "Grilled Chicken with Quinoa", "ingredients": ["Chicken breast", "1/2 cup quinoa", "Olive oil"], "instructions": "Grill chicken and serve with cooked quinoa." },
        "dinner": { "name": "Salmon with Steamed Broccoli", "ingredients": ["Salmon fillet", "1 cup broccoli", "Lemon juice"], "instructions": "Bake salmon and steam broccoli, then serve together." }
      },
      { "day": "Tuesday", "breakfast": "...", "lunch": "...", "dinner": "..." }
    ]
  }
  
  DO NOT include explanations. Only return the JSON object. Ensure the response is properly formatted.`
      }
    ];
  
    const payload = {
      model: "gpt-4",
      messages,
      max_tokens: 1200,
      stream: true,
    };
  
    // Call OpenAI’s Chat Completions endpoint with streaming enabled
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify(payload),
    });
  
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
  
    // Create a ReadableStream to process and stream tokens as SSE
    const stream = new ReadableStream({
      async start(controller) {
        let buffer = "";
        const parser = createParser((event) => {
          if (event.type === "event") {
            const data = event.data;
            if (data === "[DONE]") {
              controller.close();
              return;
            }
            try {
              const json = JSON.parse(data);
              const token = json.choices[0].delta?.content || "";
              buffer += token;
              controller.enqueue(encoder.encode(token));
            } catch (e) {
              controller.error(e);
            }
          }
        });
        for await (const chunk of openaiRes.body) {
          parser.feed(decoder.decode(chunk));
        }
        // Optionally, log the full response buffer for debugging:
        console.log("Complete response:", buffer);
      }
    });
  
    return new Response(stream, {
      headers: { "Content-Type": "text/event-stream" }
    });
  }
  