// File: pages/api/save-meal-plan.js

import { createClient } from '@supabase/supabase-js';
import sgMail from '@sendgrid/mail';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

function generateEmailTemplate(mealPlan) {
  let html = `<div style="font-family: sans-serif;">`;
  html += `<h2>Your 5-Day Meal Plan 🍽️</h2>`;

  mealPlan.meal_plan.forEach(day => {
    html += `<h3>${day.day}</h3>`;
    ['breakfast', 'lunch', 'dinner'].forEach(meal => {
      const m = day[meal];
      html += `<h4>${meal.toUpperCase()}: ${m.name}</h4>`;
      html += `<p><strong>Ingredients:</strong></p><ul>${m.ingredients.map(i => `<li>${i}</li>`).join('')}</ul>`;
      html += `<p><strong>Instructions:</strong> ${m.instructions}</p>`;
    });
  });

  html += `<p>Bon appétit! 🥦</p></div>`;
  return html;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST allowed' });

  const { email, meal_plan } = req.body;

  if (!email || !meal_plan) {
    return res.status(400).json({ error: 'Missing email or meal_plan' });
  }

  try {
    const { data, error } = await supabase
      .from('sessions')
      .update({ meal_plan })
      .eq('email', email)
      .eq('payment_status', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .select();

    if (error) throw error;

    const html = generateEmailTemplate(meal_plan);

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