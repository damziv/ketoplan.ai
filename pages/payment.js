// File: /pages/payment.js

import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { motion } from 'framer-motion';
import { Carousel } from 'react-responsive-carousel';
import "react-responsive-carousel/lib/styles/carousel.min.css";
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
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const fetchSubscriptionIntent = async () => {
      const email = sessionStorage.getItem('email');
      const sessionId = sessionStorage.getItem('sessionId');

      if (!email || !sessionId) {
        router.push('/email');
        return;
      }

      try {
        const response = await fetch('/api/create-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, sessionId }),
        });

        if (!response.ok) throw new Error('Failed to create subscription');

        const { clientSecret } = await response.json();
        setClientSecret(clientSecret);
        setLoading(false);
      } catch (error) {
        console.error('❌ Failed to create subscription:', error);
        setLoading(false);
      }
    };

    fetchSubscriptionIntent();
  }, [router]);

  // ⏳ 48h Timer
  useEffect(() => {
    const savedExpiry = localStorage.getItem('countdown_expiry');
    let expiryTime;

    if (savedExpiry && parseInt(savedExpiry) > Date.now()) {
      expiryTime = parseInt(savedExpiry);
    } else {
      expiryTime = Date.now() + 5 * 60 * 1000;
      localStorage.setItem('countdown_expiry', expiryTime);
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, expiryTime - now);
      setTimeLeft(remaining);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const reviews = t('reviews', { returnObjects: true });
  const why = t('why', { returnObjects: true });

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-5 pb-36">
      <div className="fixed top-0 w-full bg-gray-800 py-4 text-center text-white font-bold text-2xl z-50">
        Keto AI App
      </div>

      {/* Carousel */}
      <div className="max-w-md mx-auto mt-16">
        <h2 className="text-2xl font-bold text-center mb-4 text-gray-800">🔥 {t('title')}</h2>
        <Carousel showThumbs={false} autoPlay infiniteLoop interval={2000} showStatus={false}>
          <div><img src="/images/results/result1.png" alt="Before and After 1" /></div>
          <div><img src="/images/results/result2.png" alt="Before and After 2" /></div>
          <div><img src="/images/results/result3.png" alt="Before and After 3" /></div>
        </Carousel>
      </div>

      {/* Reviews */}
      <div className="mt-16 w-full max-w-md">
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

      {/* Limited-Time Offer Timer */}
      <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 p-4 rounded-lg shadow-md text-center mt-8 max-w-md w-full">
        <h2 className="text-xl font-semibold mb-2">🎁 {t('discountTitle')}</h2>
        <p className="text-sm mb-2">{t('discountSubtitle')}</p>
        <div className="text-2xl font-bold mb-1 text-green-700">
          €1.49 <span className="text-sm font-medium text-gray-500 ml-2">{t('discountWeek')}</span><span className="text-sm font-medium text-gray-500 line-through ml-2">{t('discountMonth')}</span>
        </div>
        <p className="text-sm text-gray-700">{t('discountOffer')}</p>
        <div className="font-bold text-xl mt-1">
          {Math.floor((timeLeft / (1000 * 60)) % 60)}m :{' '}
          {Math.floor((timeLeft / 1000) % 60)}s
        </div>
      </div>

{/* Recipe Carousel */}
<div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md text-left mt-10">
  <h3 className="text-2xl font-bold text-gray-800 mb-4">🍽️ {t('recipeHead')}</h3>
  <Carousel showThumbs={false} infiniteLoop autoPlay interval={4000} showStatus={false}>
    {/* Recipe 1 */}
    <div className="text-left">
      <img src="/images/recipes/cheesy-bacon-ranch.png" alt="Cheesy Bacon Ranch Chicken" className="rounded-lg mb-2" />
      <h4 className="text-lg font-semibold text-green-700">{t('recipeTitle1')}</h4>
      <ul className="list-disc list-inside text-gray-700 text-sm mb-2 space-y-1">
        <li>{t('recipeIngredients1')}</li>
      </ul>
      <p className="text-sm text-gray-600">{t('recipeInstructions1')}</p>
    </div>

    {/* Recipe 2 */}
    <div className="text-left">
      <img src="/images/recipes/keto-lasagna.png" alt="Keto Zucchini Lasagna" className="rounded-lg mb-2" />
      <h4 className="text-lg font-semibold text-green-700">{t('recipeTitle2')}</h4>
      <ul className="list-disc list-inside text-gray-700 text-sm mb-2 space-y-1">
        <li>{t('recipeIngredients2')}</li>
      </ul>
      <p className="text-sm text-gray-600">{t('recipeInstructions2')}</p>
    </div>

    {/* Recipe 3 */}
    <div className="text-left">
      <img src="/images/recipes/egg-avocado.jpg" alt="Avocado Egg Bowl" className="rounded-lg mb-2" />
      <h4 className="text-lg font-semibold text-green-700">{t('recipeTitle3')}</h4>
      <ul className="list-disc list-inside text-gray-700 text-sm mb-2 space-y-1">
        <li>{t('recipeIngredients3')}</li>
      </ul>
      <p className="text-sm text-gray-600">{t('recipeInstructions3')}</p>
    </div>
  </Carousel>
</div>

  {/* Warum nur €1.49? */}
  <div className="mt-4 w-full max-w-md text-sm text-gray-700 bg-white border border-gray-200 p-4 rounded-md shadow-sm">
  <h4 className="font-semibold text-gray-900 mb-2">❓ Warum kostet es nur €1.49 pro Woche?</h4>
  <p className="mb-1">Gute Frage! Der Preis ist ein zeitlich begrenztes Sonderangebot.</p>
  <p className="mb-1">Wir können ihn so niedrig halten, weil alles digital ist – keine Versand- oder Lagerkosten.</p>
  <p>Und: Wir hoffen, dass dir der Plan so gut gefällt, dass du ihn weiterempfiehlst. 💚</p>
  </div>

      {/* Payment Element */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white p-6 rounded-lg shadow-md w-full max-w-md text-center mt-10"
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
      confirmParams: {
        return_url: `${window.location.origin}/success`,
      },
    });

    if (error) {
      console.error(error.message);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
      <PaymentElement />
      <p className="text-sm text-gray-600 text-center">
       Du kannst jederzeit kündigen – kein Risiko.
      </p>
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

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['payment'])),
    },
  };
}
