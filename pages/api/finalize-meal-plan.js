// pages/api/finalize-meal-plan.js
import { createClient } from '@supabase/supabase-js';
import sgMail from '@sendgrid/mail';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Helper function to extract JSON substring (if needed)
function extractJSON(text) {
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1) {
    return text.substring(firstBrace, lastBrace + 1);
  }
  throw new Error("Valid JSON not found in string.");
}

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
    return res.status(405).json({ error: "Only POST requests allowed" });
  }
  const { email, fullResponse } = req.body;
  if (!email || !fullResponse) {
    return res.status(400).json({ error: "Email and fullResponse are required" });
  }
  let mealPlanText;
  try {
    // Use extractJSON if necessary, or assume fullResponse is valid JSON
    mealPlanText = JSON.parse(extractJSON(fullResponse));
  } catch (error) {
    console.error("Error parsing JSON:", error);
    return res.status(500).json({ error: "Invalid meal plan format" });
  }
  // Update Supabase session
  const { error: saveError } = await supabase
    .from('sessions')
    .update({ meal_plan: mealPlanText })
    .eq('email', email)
    .select();
  if (saveError) {
    console.error("Error saving meal plan:", saveError);
    return res.status(500).json({ error: "Error saving meal plan" });
  }
  // Send email via SendGrid
  const emailTemplate = generateEmailTemplate(mealPlanText);
  try {
    await sgMail.send({
      to: email,
      from: process.env.SENDGRID_SENDER,
      subject: '🍽️ Your 5-Day Personalized Meal Plan with Recipes',
      html: emailTemplate,
    });
  } catch (err) {
    console.error("Error sending email:", err);
    return res.status(500).json({ error: "Error sending email" });
  }
  res.status(200).json({ message: "Meal plan generated, stored, and emailed successfully", meal_plan: mealPlanText });
}
