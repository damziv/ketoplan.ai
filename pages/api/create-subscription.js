// /pages/api/create-subscription.js

import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST requests allowed' });
  }

  const { email, sessionId, plan } = req.body;

  if (!email || !sessionId || !plan) {
    return res.status(400).json({ error: 'Missing email, sessionId or plan' });
  }

  let priceId;
  switch (plan) {
    case 'one-time':
      priceId = process.env.STRIPE_PRICE_ONE_TIME;
      break;
    case '6-month':
      priceId = process.env.STRIPE_PRICE_6_MONTH;
      break;
    case '12-month':
      priceId = process.env.STRIPE_PRICE_12_MONTH;
      break;
    default:
      return res.status(400).json({ error: 'Invalid plan' });
  }

  try {
    // 🔁 Reuse or create Stripe customer
    const existingCustomers = await stripe.customers.list({ email, limit: 1 });
    const customer = existingCustomers.data.length > 0
      ? existingCustomers.data[0]
      : await stripe.customers.create({ email });

    let clientSecret;
    let subscriptionId = null;

    if (plan === 'one-time') {
      // ✅ Create one-time payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: 599, // €5.99 in cents
        currency: 'eur',
        customer: customer.id,
        metadata: { email, sessionId, plan },
      });
      clientSecret = paymentIntent.client_secret;
    } else {
      // 🧾 Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
        metadata: { email, sessionId, plan },
      });
      clientSecret = subscription.latest_invoice.payment_intent.client_secret;
      subscriptionId = subscription.id;
    }

    // 💾 Save to Supabase
    await supabase
      .from('sessions')
      .update({
        stripe_session_id: subscriptionId,
        selected_plan: plan,
      })
      .eq('id', sessionId);

    return res.status(200).json({ clientSecret, subscriptionId });
  } catch (error) {
    console.error('❌ Subscription creation failed:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
