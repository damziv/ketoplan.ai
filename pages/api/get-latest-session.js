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

  const { data, error } = await supabase
    .from('sessions')
    .select('quiz_answers')
    .eq('email', email)
    .eq('payment_status', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return res.status(404).json({ error: 'Session not found' });
  }

  return res.status(200).json(data);
}
