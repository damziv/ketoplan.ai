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

  console.log(`✅ Stripe event received: ${event.type}`);

  // ✅ Handle subscription payments
  if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object;
    const subscriptionId = invoice.subscription;
    const email = invoice.customer_email || invoice.customer?.email;
    const sessionId = invoice.lines.data[0]?.metadata?.sessionId || invoice.metadata?.sessionId;

    if (!email || !subscriptionId) {
      console.error('❌ Missing email or subscriptionId in invoice');
      return res.status(400).send('Missing data');
    }

    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const periodEnd = subscription.current_period_end;

      // ✅ Always update subscription fields
      await supabase
        .from('sessions')
        .update({
          payment_status: true,
          is_subscriber: true,
          stripe_session_id: subscriptionId,
          subscription_id: subscriptionId,
          subscription_active_until: new Date(periodEnd * 1000).toISOString(),
        })
        .eq('id', sessionId);

      console.log(`✅ Supabase session ${sessionId} updated`);

      // ✅ Check if it's a renewal (not first invoice)
      const isRenewal = invoice.billing_reason === 'subscription_cycle';
      if (isRenewal) {
        console.log(`📧 Sending renewal email to ${email}`);

        const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://yourdomain.com';
        const renewLink = `${baseUrl}/success?email=${encodeURIComponent(email)}&fromRenewal=true`;

        await fetch(`${baseUrl}/api/send-renewal-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, link: renewLink }),
        });

        console.log('📨 Renewal email sent!');
      }

      return res.status(200).send('Subscription processed');
    } catch (err) {
      console.error('❌ Error processing invoice:', err.message);
      return res.status(500).send('Internal server error');
    }
  }

  // ✅ Handle one-time payment fallback
  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object;
    const email = intent.metadata?.email;
    const sessionId = intent.metadata?.sessionId;

    if (!email || !sessionId) {
      console.error('❌ Missing metadata in one-time payment');
      return res.status(400).send('Missing metadata');
    }

    try {
      await supabase
        .from('sessions')
        .update({
          payment_status: true,
          stripe_session_id: intent.id,
        })
        .eq('id', sessionId);

      console.log(`✅ One-time payment updated session ${sessionId}`);
      return res.status(200).send('One-time payment updated');
    } catch (err) {
      console.error('❌ Webhook error:', err.message);
      return res.status(500).send('Internal error');
    }
  }

  return res.status(200).json({ received: true });
}
