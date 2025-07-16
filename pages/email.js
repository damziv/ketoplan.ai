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
  // const [age, setAge] = useState('');
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

      let quizAnswers = JSON.parse(sessionStorage.getItem('quizAnswers'));

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
        if (goal.includes('energie') || goal.includes('konzentration') || goal.includes('energy') || goal.includes('focus')) {
          return 'energySeeker';
        }
        if (goal.includes('immunität') || goal.includes('verdauung') || goal.includes('immunity') || goal.includes('digestion')) {
          return 'gutHealer';
        }
        if (goal.includes('übergewicht') || goal.includes('weight') || goal.includes('aktiv') || goal.includes('active')) {
          return 'fatBurner';
        }
        if (goal.includes('fatigue') || goal.includes('müdigkeit') || goal.includes('müde') || goal.includes('tired')) {
          return 'stressReducer';
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
        // age: parseInt(age),
        country: router.locale || 'en',
      })
      .eq('id', sessionId);
  };

  const handleNext = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
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
        router.push('/pre-payment');
      }
    }
  };

  return (
    <div className="bg-white min-h-screen flex flex-col items-center justify-between px-4 pt-24 pb-48 font-sans">
      <div className="max-w-md w-full">
        {/* Header */}
        <h1 className="text-2xl font-semibold text-center text-gray-900 mb-4">
          {t('topTitle')}
        </h1>
  
        {/* Subtitle */}
        <p className="text-center text-gray-600 text-sm mb-6">
          {t('subtitle')}
        </p>
  
        {/* Email Input */}
        <div className="mb-4">
          <input
            type="email"
            placeholder={t('fields.email')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
        </div>
  
        {/* Security Notice */}
        <div className="flex items-start bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
          <svg className="w-5 h-5 text-gray-500 mr-2 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
              d="M12 11c0-1.657 1.343-3 3-3s3 1.343 3 3v2m-6 4h6a2 2 0 002-2v-2a6 6 0 10-12 0v2a2 2 0 002 2z" />
          </svg>
          <p className="text-sm text-gray-600">{t('privacy')}</p>
        </div>
  
        {/* What You Get */}
        <div className="bg-green-50 border border-green-100 rounded-xl p-4 mb-4">
          <h3 className="text-md font-semibold text-gray-800 mb-2">{t('whatYouGetTitle')}</h3>
          <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
            <li>{t('whatYouGet1')}</li>
            <li>{t('whatYouGet2')}</li>
            <li>{t('whatYouGet3')}</li>
          </ul>
        </div>
  
        {/* Terms notice */}
        <p className="text-xs text-center text-gray-400 mt-6">
          {t('info.rules')}
        </p>
      </div>
  
      {/* Fixed CTA */}
      <div className="fixed bottom-0 left-0 w-full bg-white p-4 border-t border-gray-200 shadow-lg">
        <button
          onClick={handleNext}
          disabled={!email}
          className={`w-full py-4 text-center rounded-xl font-bold transition-all text-sm ${
            email
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-blue-300 text-white cursor-not-allowed'
          }`}
        >
          {t('continue', 'Continue')} →
        </button>
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
