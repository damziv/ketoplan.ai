
// File: /pages/payment.js

import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
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

  // ⏳ 15-minute Timer
  useEffect(() => {
    const savedExpiry = localStorage.getItem('countdown_expiry');
    let expiryTime;

    if (savedExpiry && parseInt(savedExpiry) > Date.now()) {
      expiryTime = parseInt(savedExpiry);
    } else {
      expiryTime = Date.now() + 15 * 60 * 1000;
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

  const scrollToPayment = () => {
    document.getElementById('payment').scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-5">
      <div className="fixed top-0 w-full bg-gray-800 py-4 text-center text-white font-bold text-2xl z-50">
      {t('topTitle')}
      </div>

      {/* What You'll Get */}
      {  /*   <div className="mt-16 w-full max-w-md mx-auto bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-2xl font-bold text-center mb-6 text-gray-800">{t('whatTitle')}</h3>
        <ul className="space-y-4">
          {t('what', { returnObjects: true }).map((text, index) => (
            <li
              key={index}
              className="flex items-start space-x-3 p-3 bg-green-50 rounded-md hover:bg-green-100 transition-colors"
            >
              <span className="text-green-600 text-xl font-bold">✓</span>
              <span className="text-gray-700 text-base">{text}</span>
            </li>
          ))}
        </ul>
        <p className="text-sm text-gray-600 mt-4 text-center">{t('whatNote')}</p> 
        <button
          className="w-full mt-4 py-3 rounded-xl bg-green-500 text-white font-semibold hover:bg-green-600 transition"
          onClick={scrollToPayment}
          aria-label="Start your personalized health plan now"
        >
          {t('getNowButton')}
        </button> 
      </div> */ }

       {/* Reviews Carousel */}
       <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md text-left mt-24 pb-8">
        <h3 className="text-2xl font-bold text-gray-800 mb-4">🍽️ {t('recipeHead')}</h3>
        <Carousel showThumbs={false} infiniteLoop autoPlay interval={4000} showStatus={false}>
        <div className="text-left">
  <div className="flex items-center gap-2 mb-2">
    <img src="/images/avatars/maria.jpg" alt="anna" className="w-5 h-5 rounded-full object-cover" style={{ width: '40px', height: '40px' }} />
    <h4 className="text-sm font-semibold text-gray-800">{t('recipeTitle1')}</h4>
  </div>
  <ul className="list-disc list-inside text-gray-700 text-sm mb-2 space-y-1">
    <li>{t('recipeIngredients1')}</li>
  </ul>
  <p className="text-sm text-gray-600">{t('recipeInstructions1')}</p>
</div>

        <div className="text-left">
          <div className="flex items-center gap-2 mb-2">
            <img src="/images/avatars/nermin.jpg" alt="Maria" className="w-5 h-5 rounded-full object-cover" style={{ width: '40px', height: '40px' }} />
            <h4 className="text-sm font-semibold text-gray-800">{t('recipeTitle2')}</h4>
          </div>
            <ul className="list-disc list-inside text-gray-700 text-sm mb-2 space-y-1">
               <li>{t('recipeIngredients2')}</li>
            </ul>
            <p className="text-sm text-gray-600">{t('recipeInstructions2')}</p>
        </div>

            <div className="text-left">
      <div className="flex items-center gap-2 mb-2">
        <img src="/images/avatars/maria.jpg" alt="Maria" className="w-5 h-5 rounded-full object-cover" style={{ width: '40px', height: '40px' }} />
        <h4 className="text-sm font-semibold text-gray-800">{t('recipeTitle3')}</h4>
      </div>
      <ul className="list-disc list-inside text-gray-700 text-sm mb-2 space-y-1">
        <li>{t('recipeIngredients3')}</li>
      </ul>
      <p className="text-sm text-gray-600">{t('recipeInstructions3')}</p>
    </div>
        </Carousel>
      </div>

      {/* Limited-Time Offer Timer */}
      <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 p-4 rounded-lg shadow-md text-center mt-8 max-w-md w-full">
        <h2 className="text-xl font-semibold mb-2">🎁 {t('discountTitle')}</h2>
        <p className="text-sm mb-2">{t('discountSubtitle')}</p>
        <div className="text-2xl font-bold mb-1 text-green-700">
          €2.99 <span className="text-sm font-medium text-gray-500 ml-2">{t('discountWeek')}</span>
          <span className="text-sm font-medium text-gray-500 line-through ml-2">{t('discountMonth')}</span>
        </div>
        <p className="text-sm text-gray-700">{t('discountOffer')}</p>
        <div className="font-bold text-xl mt-1">
          {Math.floor((timeLeft / (1000 * 60)) % 60)}m :{' '}
          {Math.floor((timeLeft / 1000) % 60)}s
        </div>
        <p className="text-sm text-green-700 mt-2">{t('discountBonus')}</p>
        <button
          className="w-full mt-4 py-3 rounded-xl bg-yellow-500 text-white font-semibold hover:bg-yellow-600 transition"
          onClick={scrollToPayment}
          aria-label="Claim your limited-time discount now"
        >
          {t('getDiscountButton')}
        </button>
      </div>

      {/* FAQ: Why €1.49/week? */}
      <div className="mt-4 w-full max-w-md text-sm text-gray-700 bg-white border border-gray-200 p-4 rounded-md shadow-sm">
        <h4 className="font-semibold text-gray-900 mb-2">{t('faqTitle')}</h4>
        <p className="mb-1">{t('faqText1')}</p>
        <p className="mb-1">{t('faqText2')}</p>
        <p>{t('faqText3')}</p>
      </div>

      {/* Payment Element */}
      <div id="payment" className="bg-white p-6 rounded-lg shadow-md w-full max-w-md text-center mt-10">
        <h2 className="text-2xl font-bold mb-2">{t('paymentTitle')}</h2>
        <p className="mb-4 text-base">{t('paymentSubtitle')}</p>
        <p className="font-bold mb-4">{t('price')}</p>

        {loading ? (
          <p>{t('loadingPayment')}</p>
        ) : (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <CheckoutForm />
          </Elements>
        )}
      </div>

      {/* Why Us */}
      <div className="mt-8 w-full max-w-md mx-auto bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-2xl font-bold text-center mb-6 text-gray-800">{t('whyTitle')}</h3>
        <ul className="space-y-4">
          {why.map((text, index) => (
            <li
              key={index}
              className="flex items-start space-x-3 p-3 bg-green-50 rounded-md hover:bg-green-100 transition-colors"
            >
              <span className="text-green-600 text-xl font-bold">✓</span>
              <span className="text-gray-700 text-base">{text}</span>
            </li>
          ))}
        </ul>
      </div>

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
      <div className="flex justify-center space-x-2 mt-2">
        <img src="/images/visa.png" alt="Visa" className="h-6" />
        <img src="/images/mastercard.png" alt="Mastercard" className="h-6" />
        <img src="/images/paypal.png" alt="PayPal" className="h-6" />
        <img src="/images/ssl.jpeg" alt="SSL Secure" className="h-6" />
      </div>
      <p className="text-sm text-gray-600 text-center">{t('paymentNote')}</p>
      <button
        type="submit"
        disabled={!stripe || loading}
        className="bg-green-600 text-white py-3 px-6 rounded-md hover:bg-green-700 transition"
      >
        {loading ? t('processing') : t('payNow')}
      </button>
      {/*
      <button
        type="button"
        className="bg-blue-500 text-white py-3 px-6 rounded-md hover:bg-blue-600 transition"
        onClick={() => alert('Redirect to PayPal')} // Replace with actual PayPal integration
      >
        Pay with PayPal
      </button> */}
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