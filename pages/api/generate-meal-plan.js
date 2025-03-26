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
            model: "gpt-4",
            stream: true,
            messages: [
              {
                role: "system",
                content:
                  "You are a JSON API that returns only strict, valid JSON. No explanations, no markdown. Reply ONLY with a JSON object containing a 5-day meal plan, each with breakfast, lunch, dinner — all with names, ingredients, and instructions.",
              },
              {
                role: "user",
                content: `Create a 5-day meal plan with full recipes based on: \n${JSON.stringify(
                  formattedData,
                  null,
                  2
                )}`,
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
        let done = false;

        while (!done) {
          const { value, done: doneReading } = await reader.read();
          done = doneReading;
          const chunk = decoder.decode(value);

          chunk.split("\n").forEach(line => {
            if (line.startsWith("data: ")) {
              const text = line.replace("data: ", "");
              if (text === "[DONE]") {
                controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              } else {
                controller.enqueue(encoder.encode(`data: ${text}\n\n`));
              }
            }
          });
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
