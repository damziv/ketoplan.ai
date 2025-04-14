// File: /pages/email.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { createClient } from '@supabase/supabase-js';
import { motion } from 'framer-motion';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function EmailPage() {
  const { t } = useTranslation('email');
  const [email, setEmail] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [currentWeight, setCurrentWeight] = useState('');
  const [desiredWeight, setDesiredWeight] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const savedEmail = sessionStorage.getItem('email');
    const storedSessionId = sessionStorage.getItem('sessionId');

    if (savedEmail) setEmail(savedEmail);
    if (storedSessionId) {
      setSessionId(storedSessionId);
    } else if (savedEmail) {
      fetchSessionIdFromSupabase(savedEmail);
    }
  }, []);

  const fetchSessionIdFromSupabase = async (email) => {
    const { data, error } = await supabase
      .from('sessions')
      .select('id')
      .eq('email', email)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!error && data) {
      setSessionId(data.id);
      sessionStorage.setItem('sessionId', data.id);
    }
  };

  const saveEmailToDatabase = async () => {
    const sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) return;
    await supabase.from('sessions').update({ email }).eq('id', sessionId);
  };

  const handleNext = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !age || !height || !currentWeight || !desiredWeight) {
      setError(t('error.fillAll'));
    } else if (!emailRegex.test(email)) {
      setError(t('error.invalidEmail'));
    } else {
      setError('');
      sessionStorage.setItem('email', email);
      await saveEmailToDatabase();

    // ✅ Fire Facebook Pixel Lead event
    if (typeof window !== 'undefined' && window.fbq) {
      fbq('track', 'Lead');
    }
    
      router.push('/payment');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
      <div className="fixed top-0 w-full bg-gray-800 py-4 text-center text-white font-bold text-2xl z-50">
      Smart Keto-Meal
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md text-center mt-16"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex justify-center items-center">
          🏁 {t('title')}
        </h1>
        <p className="text-gray-600 mb-5">{t('subtitle')}</p>

        <input
          type="number"
          placeholder={t('fields.age')}
          value={age}
          onChange={(e) => setAge(e.target.value)}
          className="w-full border rounded-xl p-3 mb-4 focus:ring-2 focus:ring-blue-500 outline-none transition"
        />

        <input
          type="number"
          placeholder={t('fields.height')}
          value={height}
          onChange={(e) => setHeight(e.target.value)}
          className="w-full border rounded-xl p-3 mb-4 focus:ring-2 focus:ring-blue-500 outline-none transition"
        />

        <input
          type="number"
          placeholder={t('fields.currentWeight')}
          value={currentWeight}
          onChange={(e) => setCurrentWeight(e.target.value)}
          className="w-full border rounded-xl p-3 mb-4 focus:ring-2 focus:ring-blue-500 outline-none transition"
        />

        <input
          type="number"
          placeholder={t('fields.desiredWeight')}
          value={desiredWeight}
          onChange={(e) => setDesiredWeight(e.target.value)}
          className="w-full border rounded-xl p-3 mb-4 focus:ring-2 focus:ring-blue-500 outline-none transition"
        />

        <input
          type="email"
          placeholder={t('fields.email')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded-xl p-3 mb-4 focus:ring-2 focus:ring-blue-500 outline-none transition"
        />

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <motion.button
          whileTap={{ scale: 0.95 }}
          className={`w-full py-3 rounded-xl font-semibold transition-all 
            ${email && age && height && currentWeight && desiredWeight ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
          onClick={handleNext}
          disabled={!email || !age || !height || !currentWeight || !desiredWeight}
        >
          {t('continue')} →
        </motion.button>
      </motion.div>
    </div>
  );
}

export async function getStaticProps({ locale }) {
  console.log('📣 Detected locale:', locale); // <-- 👈 Add this line
  return {
    props: {
      ...(await serverSideTranslations(locale, ['email'])),
    },
  };
}

