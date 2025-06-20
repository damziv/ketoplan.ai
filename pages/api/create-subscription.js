// File: /pages/api/create-subscription.js

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

  const { email, sessionId } = req.body;

  if (!email || !sessionId) {
    return res.status(400).json({ error: 'Missing email or sessionId' });
  }

  try {
    // 🔁 Reuse or create Stripe customer
    const existingCustomers = await stripe.customers.list({ email, limit: 1 });
    const customer = existingCustomers.data.length > 0
      ? existingCustomers.data[0]
      : await stripe.customers.create({ email });

    // 🧾 Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: 'price_1RcBoeDUMmfKdrwUjAxu5dgI' }], // replace with your actual price_id
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
      metadata: { email, sessionId },
    });

    // 💾 Save to Supabase
    await supabase
      .from('sessions')
      .update({ stripe_session_id: subscription.id })
      .eq('id', sessionId);

    res.status(200).json({
      clientSecret: subscription.latest_invoice.payment_intent.client_secret,
      subscriptionId: subscription.id,
    });

  } catch (error) {
    console.error('❌ Subscription creation failed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
