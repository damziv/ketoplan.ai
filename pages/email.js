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
  const [error, setError] = useState('');
  const router = useRouter();

  const why = t('whyUs.points', { returnObjects: true });

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

    await supabase.from('sessions').update({
      email,
      age: parseInt(age),
      country: router.locale || 'en'
    }).eq('id', sessionId);
  };

  const handleNext = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !age) {
      setError(t('error.fillAll'));
    } else if (!emailRegex.test(email)) {
      setError(t('error.invalidEmail'));
    } else {
      setError('');
      sessionStorage.setItem('email', email);
      await saveEmailToDatabase();

      // Facebook Pixel Event
      if (typeof window !== 'undefined' && window.fbq) {
        fbq('track', 'Lead');
      }

      // Check subscription status before redirecting
      const { data: subscriberData, error: subError } = await supabase
        .from('sessions')
        .select('is_subscriber, last_meal_plan_at')
        .eq('email', email)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!subError && subscriberData?.is_subscriber) {
        const lastGenerated = new Date(subscriberData.last_meal_plan_at);
        const now = new Date();
        const diffInMs = now - lastGenerated;
        const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

        if (isNaN(diffInDays) || diffInDays >= 30) {
          router.push('/success');
        } else {
          alert('✅ You already received a plan this month. We’ll notify you when you can generate a new one.');
          router.push('/');
        }
      } else {
        router.push('/payment');
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6 pb-36">
      <div className="fixed top-0 w-full bg-gray-800 py-4 text-center text-white font-bold text-2xl z-50">
      {t('topTitle')}
      </div>

        {/* Preview & What You Get Section */}
        <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md mt-6"
        >

        {/* Testimonial */}
        <div className="bg-white p-3 rounded-md shadow text-sm text-gray-700 italic mt-24">
        "{t('testimonial')}“
          <span className="block mt-1 text-right font-medium text-gray-600">— Maria, 52, Austria</span>
        </div>
      </motion.div>


      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md text-center mt-8"
      >
        {/* Step Info */}
        <p className="text-sm text-gray-500 mb-3">
          {t('stepInfo')}
        </p>

        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex justify-center items-center">
          🏁 {t('title')}
        </h1>
        <p className="text-gray-600 mb-5">{t('subtitle')}</p>

        <input
          type="email"
          placeholder={t('fields.email')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded-xl p-3 mb-2 focus:ring-2 focus:ring-blue-500 outline-none transition"
        />
        
        <input
          type="number"
          placeholder={t('fields.age')}
          value={age}
          onChange={(e) => setAge(e.target.value)}
          className="w-full border rounded-xl p-3 mb-4 focus:ring-2 focus:ring-blue-500 outline-none transition"
        />
        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

        <p className="text-sm text-gray-500 italic mb-2">
          {t('privacy')}
        </p>

        <p className="text-sm text-gray-600 mb-4">
          {t('socialProof')}
        </p>

        <motion.button
          whileTap={{ scale: 0.95 }}
          className={`w-full py-3 rounded-xl font-semibold transition-all 
            ${email && age
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-blue-600 text-white cursor-not-allowed'}`}
          onClick={handleNext}
          disabled={!email || !age}
        >
          {t('continue', 'Generate My Plan')} →
        </motion.button>

        {/* What You’ll Get */}
        <div className="bg-green-50 p-4 rounded-xl shadow mb-4">
          <h3 className="text-md font-semibold text-gray-800 mb-2">{t('whatYouGetTitle')}</h3>
          <ul className="list-disc pl-5 text-gray-700 text-sm space-y-1">
            <li>{t('whatYouGet1')}</li>
            <li>{t('whatYouGet2')}</li>
            <li>{t('whatYouGet3')}</li>
          </ul>
        </div>


      </motion.div>

              {/* Why Us */}
              <div className="mt-6 w-full max-w-md mx-auto bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-bold text-center mb-6 text-gray-800">
          🔒 {t('whyUs.title')}
          </h3>
          <ul className="space-y-4">
            {why.map((text, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.3 }}
                className="flex items-start space-x-3 p-3 bg-green-100 rounded-md hover:bg-green-200 transition-colors"
              >
                <span className="text-green-600 text-xl font-bold">✓</span>
                <span className="text-gray-700 text-lg">{text}</span>
              </motion.li>
            ))}
          </ul>
        </div>
      
    </div>
  );
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['email'])),
    },
  };
}
