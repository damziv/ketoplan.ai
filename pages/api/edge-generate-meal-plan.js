// pages/api/edge-generate-meal-plan.js
export const config = {
    runtime: 'edge',
  };
  
  import { createParser } from "eventsource-parser";
  
  export default async function handler(request) {
    // Expect JSON payload with at least { email, quiz_answers }
    const { email, quiz_answers } = await request.json();
  
    // Build formattedData using your question map
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
      answer: quiz_answers && quiz_answers[id] ? quiz_answers[id].join(", ") : "Not answered"
    }));
  
    // Create OpenAI messages with explicit instructions
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
  
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
  
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });
  
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
        // Optionally log the full buffer if needed
        console.log("Complete buffer:", buffer);
      }
    });
  
    return new Response(stream, {
      headers: { "Content-Type": "text/event-stream" }
    });
  }
  