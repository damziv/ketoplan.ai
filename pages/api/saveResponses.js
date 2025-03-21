// File: /pages/api/saveResponses.js
// Save user responses to Supabase
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Only POST requests allowed' });
    return;
  }

  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const { sessionId, responses } = req.body;

  // Validate input
  if (!sessionId || !responses) {
    res.status(400).json({ message: 'sessionId and responses are required' });
    return;
  }

  try {
    // Update the session's quiz_answers in the database
    const { error } = await supabase
      .from('sessions')
      .update({ quiz_answers: responses })
      .eq('id', sessionId);

    if (error) {
      console.error('Error updating responses in the database:', error);
      res.status(500).json({ message: 'Error saving responses', error: error.message });
      return;
    }

    res.status(200).json({ message: 'Responses saved successfully' });
  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({ message: 'An unexpected error occurred', error: err.message });
  }
}
