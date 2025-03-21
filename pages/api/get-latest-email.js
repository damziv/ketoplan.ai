import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST requests allowed' });
  }

  const { sessionId } = req.body;

  if (!sessionId) {
    return res.status(400).json({ error: 'Session ID is required' });
  }

  try {
    const { data, error } = await supabase
      .from('sessions')
      .select('email')
      .eq('id', sessionId)
      .single();

    if (error || !data?.email) {
      return res.status(404).json({ error: 'Email not found for session' });
    }

    res.status(200).json({ email: data.email });
  } catch (err) {
    console.error('❌ Error fetching email:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
