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
    const email = paymentIntent.metadata?.email; // Extract email from metadata

    if (!email) {
      console.error('❌ Missing email metadata in Stripe payment intent');
      return res.status(400).send('Missing email in metadata');
    }

    try {
      console.log(`🔎 Searching for latest unpaid session for email: ${email}`);

      // ✅ Get the latest unpaid session
      const { data: latestSession, error: fetchError } = await supabase
        .from('sessions')
        .select('id, payment_status')
        .eq('email', email)
        .eq('payment_status', false) // Ensure it's an unpaid session
        .order('created_at', { ascending: false }) // Get the latest session
        .limit(1)
        .single();

      if (fetchError || !latestSession) {
        console.error('❌ No unpaid session found for email:', email);
        return res.status(404).send('No unpaid session found');
      }

      console.log(`✅ Found latest session: ${latestSession.id}`);

      // ✅ Update existing session with payment status & Stripe session ID
      const { error: updateError } = await supabase
        .from('sessions')
        .update({
          payment_status: true,
          stripe_session_id: stripePaymentIntentId,
        })
        .eq('id', latestSession.id);

      if (updateError) {
        console.error('❌ Error updating payment status:', updateError);
        return res.status(500).send('Failed to update session payment status');
      }

      console.log(`✅ Payment status updated for session: ${latestSession.id}`);

      // ✅ Trigger meal plan generation for the same session
      console.log(`🚀 Generating a new meal plan for session: ${latestSession.id}`);

      const generateMealPlanResponse = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/generate-meal-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!generateMealPlanResponse.ok) {
        console.error('❌ Error generating meal plan:', await generateMealPlanResponse.text());
        return res.status(500).send('Meal plan generation failed');
      }

      console.log('✅ Meal plan successfully generated.');

      return res.status(200).send('Payment status updated & new meal plan generated');
    } catch (err) {
      console.error('❌ Error processing webhook:', err.message);
      return res.status(500).send('Server error processing webhook');
    }
  }

  res.json({ received: true });
}
