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
  const [typeName, setTypeName] = useState('');
  const [insights, setInsights] = useState([]);
  const router = useRouter();

  const why = t('whyUs.points', { returnObjects: true });

  useEffect(() => {
    const run = async () => {
      const savedEmail = sessionStorage.getItem('email');
      const storedSessionId = sessionStorage.getItem('sessionId');
      if (savedEmail) setEmail(savedEmail);
      if (storedSessionId) {
        setSessionId(storedSessionId);
      } else if (savedEmail) {
        await fetchSessionIdFromSupabase(savedEmail);
      }

      // ✅ Try sessionStorage first
      let quizAnswers = JSON.parse(sessionStorage.getItem('quizAnswers'));

      // ✅ Fallback: fetch from Supabase
      if (!quizAnswers && storedSessionId) {
        const { data, error } = await supabase
          .from('sessions')
          .select('quiz_answers')
          .eq('id', storedSessionId)
          .single();

        if (!error && data?.quiz_answers) {
          quizAnswers = data.quiz_answers;
          sessionStorage.setItem('quizAnswers', JSON.stringify(quizAnswers));
        }
      }

      if (!quizAnswers) return;

      const types = t('types', { returnObjects: true });

      const matchTypeKey = () => {
        const goal = quizAnswers['1']?.[0]?.toLowerCase() || '';
        if (goal.includes('immunity') || goal.includes('digestion')) {
          return 'gutHealer';
        }
        if (goal.includes('energy') || goal.includes('focus')) {
          return 'energySeeker';
        }
        return 'balancedType';
      };

      const typeKey = matchTypeKey();
      const matched = types[typeKey] || {};
      setTypeName(matched.name || '');
      setInsights(matched.insights || []);
    };

    run();
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

    await supabase
      .from('sessions')
      .update({
        email,
        age: parseInt(age),
        country: router.locale || 'en',
      })
      .eq('id', sessionId);
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

      if (typeof window !== 'undefined' && window.fbq) {
        fbq('track', 'Lead');
      }

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
          alert(
            '✅ You already received a plan this month. We’ll notify you when you can generate a new one.'
          );
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

      {typeName && insights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white shadow-lg rounded-2xl p-6 w-full max-w-md mt-24 mb-8 text-left"
        >
          <h2 className="text-xl font-bold mb-2 text-center">
            🎯 {t('title')}
          </h2>
          <p className="text-center text-gray-600 mb-4">
            You’re <strong>{typeName}</strong>.
          </p>
          <div className="space-y-3 mb-4">
            {insights.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start bg-green-50 border border-green-100 p-3 rounded-lg shadow-sm"
              >
                <div className="text-green-600 text-lg mr-3">✅</div>
                <p className="text-gray-700 text-sm">{item}</p>
              </div>
            ))}
          </div>
          <p className="italic text-gray-600 text-center">
          {t('stepInfo')}
          </p>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md text-center"
        >
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex justify-center items-center">
          
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

        <p className="text-sm text-gray-500 italic mb-2">{t('privacy')}</p>
        <p className="text-sm text-gray-600 mb-4">{t('socialProof')}</p>

        <motion.button
          whileTap={{ scale: 0.95 }}
          className={`w-full py-3 rounded-xl font-semibold transition-all ${
            email && age
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-blue-600 text-white cursor-not-allowed'
          }`}
          onClick={handleNext}
          disabled={!email || !age}
        >
          {t('continue', 'Generate My Guide')} →
        </motion.button>

        <div className="bg-green-50 p-4 rounded-xl shadow mb-4 mt-4">
          <h3 className="text-md font-semibold text-gray-800 mb-2">
            {t('whatYouGetTitle')}
          </h3>
          <ul className="list-disc pl-5 text-gray-700 text-sm space-y-1">
            <li>{t('whatYouGet1')}</li>
            <li>{t('whatYouGet2')}</li>
            <li>{t('whatYouGet3')}</li>
          </ul>
        </div>
      </motion.div>

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
