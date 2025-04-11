import { buffer } from 'micro';
import { createClient } from '@supabase/supabase-js';
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const config = {
  api: {
    bodyParser: false, // Required for Stripe signature verification
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
    console.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log('✅ Stripe webhook event received:', event.type);

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const stripePaymentIntentId = paymentIntent.id;
    const email = paymentIntent.metadata?.email;

    if (!email) {
      console.error('❌ Missing email metadata in Stripe payment intent');
      return res.status(400).send('Missing email in metadata');
    }

    try {
      console.log(`🔎 Searching for unpaid session for email: ${email}`);

      const { data: latestSession, error: fetchError } = await supabase
        .from('sessions')
        .select('id, payment_status')
        .eq('email', email)
        .eq('payment_status', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (fetchError) {
        console.error('❌ Supabase fetch error:', fetchError);
        return res.status(500).send('Database query failed');
      }

      if (!latestSession) {
        console.error('⚠️ No unpaid session found for email:', email);
        return res.status(404).send('Session not found');
      }

      console.log(`✅ Found session: ${latestSession.id}`);

      const { error: updateError } = await supabase
        .from('sessions')
        .update({
          payment_status: true,
          stripe_session_id: stripePaymentIntentId,
        })
        .eq('id', latestSession.id);

      if (updateError) {
        console.error('❌ Error updating payment status:', updateError);
        return res.status(500).send('Failed to update session');
      }

      console.log(`✅ Session ${latestSession.id} updated successfully`);
      return res.status(200).send('Session updated');
    } catch (err) {
      console.error('❌ Exception in webhook handler:', err.message);
      return res.status(500).send('Internal error');
    }
  }

  res.status(200).json({ received: true });
}
