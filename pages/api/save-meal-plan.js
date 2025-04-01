import { createClient } from '@supabase/supabase-js';
import sgMail from '@sendgrid/mail';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Updated email template to mimic your webpage design.
function generateEmailTemplate(plan) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; background: #f9f9f9; border-radius: 10px;">
      <h2 style="text-align: center; color: #333; font-size: 24px; margin-bottom: 10px;">
        🍽️ Your 5-Day Personalized Meal Plan with Recipes 📖
      </h2>
      <p style="text-align: center; font-size: 14px; color: #666; margin-bottom: 20px;">
        Each meal includes a full recipe with ingredients and instructions.
      </p>
      ${plan.map(day => `
        <div style="background: #fff; padding: 15px; margin-bottom: 20px; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
          <h3 style="color: #4CAF50; font-size: 20px; margin: 0 0 10px;">📅 ${day.day}</h3>
          ${["breakfast", "lunch", "dinner"].map(mealType => {
            const meal = day[mealType];
            if (!meal) return "";
            return `
              <div style="margin-bottom: 15px;">
                <h4 style="color: #333; font-size: 18px; margin: 5px 0;">
                  🍴 ${mealType.toUpperCase()}: ${meal.name || "No meal available"}
                </h4>
                <p style="margin: 5px 0; font-weight: bold; color: #555; font-size: 14px;">
                  Ingredients:
                </p>
                <ul style="margin: 5px 0 10px 20px; color: #555; font-size: 14px; list-style: disc;">
                  ${(meal.ingredients && meal.ingredients.length > 0)
                    ? meal.ingredients.map(ing => `<li>${ing}</li>`).join("")
                    : "<li>No ingredients available</li>"}
                </ul>
                <p style="margin: 5px 0; font-weight: bold; color: #555; font-size: 14px;">
                  Instructions:
                </p>
                <p style="margin: 5px 0; color: #555; font-size: 14px;">
                  ${meal.instructions || "No instructions available"}
                </p>
              </div>
            `;
          }).join("")}
        </div>
      `).join("")}
      <p style="text-align: center; font-size: 12px; color: #999; margin-top: 20px;">
        Enjoy your meals! 🍎
      </p>
    </div>
  `;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  const { email, meal_plan } = req.body;

  if (!email || !meal_plan) {
    return res.status(400).json({ error: 'Missing email or meal_plan' });
  }

  // Ensure we work with an array.
  const plan = Array.isArray(meal_plan) ? meal_plan : (meal_plan.meal_plan || []);
  if (!plan.length) {
    return res.status(400).json({ error: 'Meal plan is empty or invalid' });
  }

  try {
    // Update the most recent paid session for this email with the meal plan.
    const { data, error } = await supabase
      .from('sessions')
      .update({ meal_plan: plan })
      .eq('email', email)
      .eq('payment_status', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .select();

    if (error) throw error;

    const html = generateEmailTemplate(plan);

    await sgMail.send({
      to: email,
      from: process.env.SENDGRID_SENDER,
      subject: 'Your 5-Day Meal Plan with Recipes 🍽️',
      html,
    });

    res.status(200).json({ message: 'Meal plan saved and emailed.' });
  } catch (err) {
    console.error('❌ Error saving meal plan or sending email:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
