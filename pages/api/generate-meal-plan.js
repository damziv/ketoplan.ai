// File: /pages/api/generate-meal-plan.js

export const config = {
  runtime: 'edge',
};

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

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Only POST allowed' }), {
      status: 405,
    });
  }

  const { email, quiz_answers } = await req.json();

  if (!email || !quiz_answers) {
    return new Response(JSON.stringify({ error: 'Missing email or quiz_answers' }), {
      status: 400,
    });
  }

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
            model: "gpt-3.5-turbo-0125", // or "gpt-3.5-turbo" for faster/lighter
            stream: true,
            messages: [
              {
                role: "system",
                content: `You are a JSON API that only replies with valid JSON. No markdown, no explanation, do not include '...' or placeholders. Strict JSON object like:
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
Use ONLY double quotes. No trailing commas. Escape newlines and invalid characters if needed.`,
              },
              {
                role: "user",
                content: `Create a 5-day personalized meal plan with full recipes (name, ingredients, instructions) based on:
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
          buffer = lines.pop(); // last line might be incomplete

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
