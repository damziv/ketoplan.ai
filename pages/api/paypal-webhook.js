// pages/api/paypal-webhook.js

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const event = req.body;

  // Debugging
  console.log('📥 Received PayPal webhook:', event.event_type);

  const subscriptionId = event.resource.id;
  const now = new Date();
  const in30Days = new Date(now);
  in30Days.setDate(in30Days.getDate() + 30);

  if (!subscriptionId) {
    return res.status(400).json({ error: 'Missing subscription ID' });
  }

  // Subscription activated (first time)
  if (event.event_type === 'BILLING.SUBSCRIPTION.ACTIVATED') {
    console.log('✅ PayPal Subscription ACTIVATED');

    const email = event.resource.subscriber?.email_address;

    if (!email) {
      return res.status(400).json({ error: 'Missing subscriber email' });
    }

    // Update Supabase session
    const { data, error } = await supabase
      .from('sessions')
      .update({
        is_subscriber: true,
        subscription_id: subscriptionId,
        subscription_active_until: in30Days.toISOString(),
        last_meal_plan_at: new Date().toISOString(),
      })
      .eq('email', email)
      .order('created_at', { ascending: false })
      .limit(1)
      .select();

    if (error) {
      console.error('❌ Supabase update error:', error);
      return res.status(500).json({ error: 'Database update failed' });
    }

    console.log('✅ Supabase subscription activated for:', email);
    return res.status(200).json({ success: true });
  }

  // Subscription renewed
  if (event.event_type === 'BILLING.SUBSCRIPTION.RENEWED') {
    console.log('🔁 PayPal Subscription RENEWED');

    const { data, error } = await supabase
      .from('sessions')
      .update({
        subscription_active_until: in30Days.toISOString(),
      })
      .eq('subscription_id', subscriptionId)
      .order('created_at', { ascending: false })
      .limit(1)
      .select();

    if (error) {
      console.error('❌ Supabase renewal update error:', error);
      return res.status(500).json({ error: 'Database renewal update failed' });
    }

    // TODO: Optionally email user to generate new meal plan manually via success-renew
    console.log('✅ Supabase subscription renewed for:', subscriptionId);
    return res.status(200).json({ success: true });
  }

  // Subscription cancelled
  if (event.event_type === 'BILLING.SUBSCRIPTION.CANCELLED') {
    console.log('⛔ PayPal Subscription CANCELLED');

    await supabase
      .from('sessions')
      .update({
        is_subscriber: false,
        subscription_active_until: null,
      })
      .eq('subscription_id', subscriptionId);

    return res.status(200).json({ success: true });
  }

  // Optional fallback
  if (event.event_type === 'PAYMENT.SALE.COMPLETED') {
    console.log('💳 Payment sale completed');
    return res.status(200).json({ message: 'Payment sale handled' });
  }

  // Default handler
  return res.status(200).json({ message: 'Unhandled event type' });
}
