import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Only GET requests allowed' });
  }

  try {
    console.log('📌 Fetching the latest email from Supabase...');

    const { data, error } = await supabase
      .from('sessions')
      .select('email')
      .eq('payment_status', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      console.error('❌ Error fetching email:', error);
      return res.status(404).json({ error: 'No email found' });
    }

    res.status(200).json({ email: data.email });
  } catch (err) {
    console.error('❌ Error processing request:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
