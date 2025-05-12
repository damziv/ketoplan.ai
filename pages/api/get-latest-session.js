// File: /pages/api/get-latest-session.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST allowed' });

  const { email } = req.body;

  if (!email) return res.status(400).json({ error: 'Email required' });

  try {
    // ✅ Only allow if user is an active subscriber
    const { data: session, error } = await supabase
      .from('sessions')
      .select('id, quiz_answers, is_subscriber, subscription_active_until')
      .eq('email', email)
      .eq('is_subscriber', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!session || !session.subscription_active_until) {
      return res.status(403).json({ error: 'No active subscription found' });
    }

    const isActive = new Date(session.subscription_active_until) > new Date();

    if (!isActive) {
      return res.status(403).json({ error: 'Subscription expired' });
    }

    return res.status(200).json(session);

  } catch (err) {
    console.error('❌ Error in get-latest-session:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
