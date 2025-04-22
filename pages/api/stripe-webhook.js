// File: /pages/api/stripe-webhook.js

import { buffer } from 'micro';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  console.log('📩 Incoming Stripe webhook');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).send('Method Not Allowed');
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    const rawBody = await buffer(req);
    event = stripe.webhooks.constructEvent(
      rawBody.toString(),
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('❌ Signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log('✅ Stripe event received:', event.type);

  // ✅ Handle subscription success
  if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object;
    const subscriptionId = invoice.subscription;
    const email = invoice.customer_email || invoice.customer?.email;
  
    const sessionId = invoice.lines.data[0]?.metadata?.sessionId || invoice.metadata?.sessionId;
  
    console.log(`📦 Subscription succeeded for ${email} (sub: ${subscriptionId})`);
  
    if (!email || !sessionId || !subscriptionId) {
      console.error('❌ Missing email, sessionId or subscriptionId in subscription metadata');
      return res.status(400).send('Missing metadata');
    }
  
    try {
      // Fetch subscription details from Stripe
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const periodEnd = subscription.current_period_end;
  
      const { error: updateError } = await supabase
        .from('sessions')
        .update({
          payment_status: true,
          is_subscriber: true,
          stripe_session_id: subscriptionId,
          subscription_id: subscriptionId,
          subscription_active_until: new Date(periodEnd * 1000).toISOString(),
        })
        .eq('id', sessionId);
  
      if (updateError) {
        console.error('❌ Failed to update Supabase for subscription:', updateError);
        return res.status(500).send('Supabase update failed');
      }
  
      console.log(`✅ Supabase session ${sessionId} updated as subscribed`);
      return res.status(200).send('Subscription updated');
    } catch (err) {
      console.error('❌ Webhook processing failed:', err.message);
      return res.status(500).send('Internal error');
    }
  }
  

  // ✅ Handle fallback one-time payments
  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object;
    const email = intent.metadata?.email;
    const sessionId = intent.metadata?.sessionId;

    if (!email || !sessionId) {
      console.error('❌ Missing email or sessionId in payment intent metadata');
      return res.status(400).send('Missing metadata');
    }

    try {
      const { error } = await supabase
        .from('sessions')
        .update({
          payment_status: true,
          stripe_session_id: intent.id,
        })
        .eq('id', sessionId);

      if (error) {
        console.error('❌ Failed to update Supabase for one-time payment:', error);
        return res.status(500).send('Database update error');
      }

      console.log(`✅ One-time payment updated session ${sessionId}`);
      return res.status(200).send('Payment updated');
    } catch (err) {
      console.error('❌ Webhook failed:', err.message);
      return res.status(500).send('Internal error');
    }
  }

  // 👋 Default fallback
  return res.status(200).json({ received: true });
}
