import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import sgMail from '@sendgrid/mail';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Ensure your .env.local has OPENAI_API_KEY
});

// Helper function to extract JSON substring
function extractJSON(text) {
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1) {
    return text.substring(firstBrace, lastBrace + 1);
  }
  throw new Error("Valid JSON not found in string.");
}

// ✅ Map Question IDs to Text
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

// ✅ Function to generate a structured email template for recipes
const generateEmailTemplate = (mealPlan) => {
  let emailHTML = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; background-color: #f9f9f9; border-radius: 10px;">
      <h2 style="text-align: center; color: #333;">🍽️ Your 5-Day Personalized Meal Plan with Recipes 📖</h2>
      <p style="text-align: center; font-size: 14px; color: #666;">Each meal includes a full recipe with ingredients and instructions.</p>
  `;

  mealPlan.meal_plan.forEach(day => {
    emailHTML += `
      <div style="background: white; padding: 15px; margin-top: 20px; border-radius: 10px; box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);">
        <h3 style="color: #4CAF50;">📅 ${day.day}</h3>
        ${["breakfast", "lunch", "dinner"].map(meal => `
          <h4 style="color: #333;">🍴 ${day[meal].name}</h4>
          <p><strong>Ingredients:</strong></p>
          <ul>
            ${day[meal].ingredients.map(ing => `<li>${ing}</li>`).join("")}
          </ul>
          <p><strong>Instructions:</strong></p>
          <p>${day[meal].instructions}</p>
        `).join("")}
      </div>
    `;
  });

  emailHTML += `
      <p style="text-align: center; margin-top: 20px;">
        <a href="#" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Download as PDF</a>
      </p>
      <p style="text-align: center; font-size: 12px; color: #999;">Enjoy your meals! 🍎</p>
    </div>
  `;

  return emailHTML;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send({ message: 'Only POST requests allowed' });
  }

  const { email, stream: shouldStream } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    console.log(`📌 Fetching session for email: ${email}`);

    // ✅ Fetch latest session
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('id, quiz_answers, payment_status, meal_plan')
      .eq('email', email)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (sessionError || !session) {
      console.error('❌ Error fetching session:', sessionError);
      return res.status(404).json({ error: 'Session not found' });
    }

    if (!session.payment_status) {
      return res.status(403).json({ error: 'Payment not completed for this session' });
    }

    console.log('✅ Found latest paid session. Generating a new meal plan...');

    // ✅ Format ALL questions
    const formattedData = Object.entries(questionMap).map(([questionId, questionText]) => ({
      question: questionText,
      answer: session.quiz_answers[questionId] ? session.quiz_answers[questionId].join(", ") : "Not answered"
    }));

    // ✅ Prepare OpenAI request
    const openAIRequest = {
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a nutritionist generating personalized 5-day meal plans. Each meal should include a recipe with ingredients and preparation steps. Your response MUST be valid JSON. DO NOT include any extra text."
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
      ],
      max_tokens: 1200
    };

    // If streaming is requested, use streaming mode.
    if (shouldStream === true) {
      // Set headers for Server-Sent Events (SSE)
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      });

      console.log('✅ Starting OpenAI streaming request...');
      let buffer = '';

      try {
        // Add the stream flag to the OpenAI request
        const streamRequest = { ...openAIRequest, stream: true };
        // The openai.chat.completions.create() now returns an async iterable when stream: true is set
        const stream = await openai.chat.completions.create(streamRequest);

        // Iterate over streamed chunks
        for await (const chunk of stream) {
          // Each chunk may contain a delta with new token content
          const token = chunk.choices[0].delta?.content || '';
          buffer += token;
          // Send the token to the client as an SSE message
          res.write(`data: ${token}\n\n`);
          if (res.flush) res.flush();
        }

        // Signal stream end to the client
        res.write('data: [DONE]\n\n');
        res.end();

        console.log('✅ OpenAI streaming complete.');

        // After streaming, extract and parse the full response
        let mealPlanText;
        try {
          mealPlanText = JSON.parse(extractJSON(buffer));
        } catch (parseError) {
          console.error('❌ OpenAI streaming response is not valid JSON:', parseError);
          return;
        }

        console.log('✅ 5-day meal plan with recipes generated successfully (streaming).');

        // Store meal plan in Supabase
        const { error: saveError } = await supabase
          .from('sessions')
          .update({ meal_plan: mealPlanText })
          .eq('id', session.id)
          .select();

        if (saveError) {
          console.error('❌ Error saving meal plan:', saveError);
        }

        // Send meal plan via email
        const emailTemplate = generateEmailTemplate(mealPlanText);
        await sgMail.send({
          to: email,
          from: process.env.SENDGRID_SENDER,
          subject: '🍽️ Your 5-Day Personalized Meal Plan with Recipes',
          html: emailTemplate,
        });

        console.log('✅ Meal plan emailed successfully (streaming).');
      } catch (streamError) {
        console.error('❌ Error streaming meal plan:', streamError);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Error streaming meal plan' });
        }
      }
      return; // End streaming branch here.
    }

    // If not streaming, proceed with the synchronous request (original behavior)
    const openAIResponse = await openai.chat.completions.create(openAIRequest);
    let mealPlanText;
    try {
      const rawContent = openAIResponse.choices[0]?.message?.content;
      mealPlanText = JSON.parse(extractJSON(rawContent));
    } catch (parseError) {
      console.error('❌ OpenAI response is not valid JSON:', parseError);
      return res.status(500).json({ error: 'Invalid meal plan format' });
    }

    console.log('✅ 5-day meal plan with recipes generated successfully.');

    // Store meal plan in Supabase
    const { error: saveError } = await supabase
      .from('sessions')
      .update({ meal_plan: mealPlanText })
      .eq('id', session.id)
      .select();

    if (saveError) {
      console.error('❌ Error saving meal plan:', saveError);
      return res.status(500).json({ error: 'Error saving meal plan' });
    }

    // Send meal plan via email
    const emailTemplate = generateEmailTemplate(mealPlanText);
    await sgMail.send({
      to: email,
      from: process.env.SENDGRID_SENDER,
      subject: '🍽️ Your 5-Day Personalized Meal Plan with Recipes',
      html: emailTemplate,
    });

    console.log('✅ Meal plan emailed successfully.');
    res.status(200).json({ message: 'Meal plan generated, stored, and emailed successfully', meal_plan: mealPlanText });
  } catch (error) {
    console.error('❌ Error processing request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
