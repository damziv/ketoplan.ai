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
    console.error('❌ Missing required fields:', { email, sessionId });
    return res.status(400).json({ error: 'Email and Session ID are required' });
  }

  try {
    console.log('📌 Creating Payment Intent for:', email);

    // ✅ Create a Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 59, // $5.99 USD (change if needed)
      currency: 'usd',
      payment_method_types: ['card'],
      metadata: { email, sessionId },
    });

    console.log('✅ Payment Intent created:', paymentIntent.id);

    // ✅ Store Payment Intent ID in Supabase
    const { error: dbError } = await supabase
      .from('sessions')
      .update({ stripe_session_id: paymentIntent.id })
      .eq('id', sessionId);

    if (dbError) {
      console.error('❌ Error saving Payment Intent to database:', dbError);
      return res.status(500).json({ error: 'Failed to update database' });
    }

    return res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('❌ Error creating Payment Intent:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
