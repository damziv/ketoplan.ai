// pages/api/paypal-subscription-success.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST allowed' });

  const { email, sessionId, subscriptionID, plan } = req.body;
  if (!email || !sessionId || !subscriptionID || !plan) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  try {
    // ⏳ Set duration based on plan
    let durationDays = 30;
    switch (plan) {
      case '6-month':
        durationDays = 180;
        break;
      case '12-month':
        durationDays = 365;
        break;
    }

    const activeUntil = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

    const { error } = await supabase
      .from('sessions')
      .update({
        payment_status: true,
        is_subscriber: true,
        subscription_id: subscriptionID,
        subscription_active_until: activeUntil,
        selected_plan: plan,
      })
      .eq('id', sessionId);

    if (error) {
      console.error('❌ Supabase update error:', error);
      return res.status(500).json({ error: 'DB update failed' });
    }

    await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/save-meal-plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('❌ Server error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
