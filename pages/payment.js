import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY);

export default function PaymentPage() {
  const router = useRouter();
  const { t } = useTranslation('payment');
  const [clientSecret, setClientSecret] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentWeight, setCurrentWeight] = useState(80);
  const [targetWeight, setTargetWeight] = useState(72);

  useEffect(() => {
    const fetchPaymentIntent = async () => {
      const email = sessionStorage.getItem('email');
      const sessionId = sessionStorage.getItem('sessionId');

      if (!email || !sessionId) {
        router.push('/email');
        return;
      }

      try {
        const response = await fetch('/api/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, sessionId }),
        });

        if (!response.ok) throw new Error('Failed to create payment intent');

        const { clientSecret } = await response.json();
        setClientSecret(clientSecret);
        setLoading(false);
      } catch (error) {
        console.error('Failed to get clientSecret:', error);
        setLoading(false);
      }
    };

    fetchPaymentIntent();
  }, [router]);

  const weightData = [
    { week: 'Now', weight: currentWeight },
    { week: 'Week 1', weight: currentWeight - 1.5 },
    { week: 'Week 2', weight: currentWeight - 3 },
    { week: 'Week 3', weight: currentWeight - 5 },
    { week: 'Week 4', weight: targetWeight },
  ];

  const reviews = t('reviews', { returnObjects: true });
  const why = t('why', { returnObjects: true });

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-5">
      <div className="fixed top-0 w-full bg-gray-800 py-4 text-center text-white font-bold text-2xl z-50">AImealPrep</div>

      {/* Weight Chart */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white shadow-lg rounded-2xl p-6 w-full max-w-md text-center mt-16"
      >
        <h2 className="text-2xl font-bold text-gray-800 mb-2">🏆 {t('title')}</h2>
        <p className="text-gray-500 mb-4">{t('subtitle')}</p>

        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weightData}>
              <XAxis dataKey="week" />
              <YAxis domain={[targetWeight - 2, currentWeight + 2]} hide />
              <Line type="monotone" dataKey="weight" stroke="#4CAF50" strokeWidth={3} dot={{ fill: "#4CAF50" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <p className="text-sm text-gray-400 mt-2">{t('chartNote')}</p>
      </motion.div>

      {/* Reviews */}
      <div className="mt-8 w-full max-w-md">
        <h3 className="text-lg font-bold text-center mb-4">{t('reviewsTitle')}</h3>
        <div className="flex flex-wrap gap-4 justify-center md:flex-nowrap">
          {reviews.map((review, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.3 }}
              className="bg-white p-4 rounded-lg shadow-md w-full md:w-1/3 text-center"
            >
              <p className="text-gray-700">{review}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Why Us */}
      <div className="mt-8 w-full max-w-md mx-auto bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-2xl font-bold text-center mb-6 text-gray-800">{t('whyTitle')}</h3>
        <ul className="space-y-4">
          {why.map((text, index) => (
            <motion.li
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.3 }}
              className="flex items-start space-x-3 p-3 bg-green-50 rounded-md hover:bg-green-100 transition-colors"
            >
              <span className="text-green-600 text-xl font-bold">✓</span>
              <span className="text-gray-700 text-lg">{text}</span>
            </motion.li>
          ))}
        </ul>
      </div>

      {/* Payment */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white p-6 rounded-lg shadow-md w-full max-w-md text-center mt-6"
      >
        <h2 className="text-2xl font-bold mb-2">{t('paymentTitle')}</h2>
        <p className="mb-4">{t('paymentSubtitle')}</p>
        <p className="font-bold mb-4">{t('price')}</p>

        {loading ? (
          <p>{t('loadingPayment')}</p>
        ) : (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <CheckoutForm />
          </Elements>
        )}
      </motion.div>
    </div>
  );
}

function CheckoutForm() {
  const { t } = useTranslation('payment');
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    if (!stripe || !elements) return;

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/success` },
    });

    if (error) {
      console.error(error.message);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
      <PaymentElement />
      <button
        type="submit"
        disabled={!stripe || loading}
        className="bg-green-600 text-white py-3 px-6 rounded-md hover:bg-green-700 transition"
      >
        {loading ? t('processing') : t('payNow')}
      </button>
    </form>
  );
}

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['payment']))
    }
  };
}
