
// File: /pages/payment.js

import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Carousel } from 'react-responsive-carousel';
import "react-responsive-carousel/lib/styles/carousel.min.css";
import { useTranslation } from 'next-i18next';
import fs from 'fs';
import path from 'path';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';


const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY);

export default function PaymentPage() {
  const router = useRouter();
  const { t } = useTranslation('payment');
  const { plan } = router.query;
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
          body: JSON.stringify({ email, sessionId, plan }),
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

  useEffect(() => {
    if (!['one-time', '6-month', '12-month'].includes(plan)) {
      router.push('/offer'); // Redirect to safe page
    }
  }, [plan]);

  

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

    </div>
  );
}

function CheckoutForm() {
  const { t } = useTranslation('payment');
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const { plan } = router.query;
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const renderPayPalButton = (plan) => {
      const email = sessionStorage.getItem('email');
      const sessionId = sessionStorage.getItem('sessionId');

      let paypalPlanId;
      switch (plan) {
        case 'one-time':
          paypalPlanId = process.env.NEXT_PUBLIC_PAYPAL_PLAN_ONE_TIME;
          break;
        case '6-month':
          paypalPlanId = process.env.NEXT_PUBLIC_PAYPAL_PLAN_6_MONTH;
          break;
        case '12-month':
          paypalPlanId = process.env.NEXT_PUBLIC_PAYPAL_PLAN_12_MONTH;
          break;
        default:
          return;
      }

      if (!email || !sessionId || !window.paypal || !paypalPlanId) return;

      window.paypal.Buttons({
        style: {
          shape: 'pill',
          color: 'gold',
          layout: 'vertical',
          label: 'subscribe'
        },
        createSubscription: (data, actions) => {
          return actions.subscription.create({ plan_id: paypalPlanId });
        },
        onApprove: async (data) => {
          const subscriptionID = data.subscriptionID;

          const res = await fetch('/api/paypal-subscription-success', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, sessionId, subscriptionID, plan }),
          });

          if (res.ok) {
            window.location.href = '/success';
          } else {
            alert('Something went wrong. Please try again.');
          }
        },
        onError: (err) => {
          console.error('❌ PayPal error:', err);
          alert('Something went wrong with PayPal');
        },
      }).render('#paypal-subscription-button');
    };

    const loadPayPalScript = () => {
      if (document.getElementById('paypal-sdk')) return;

      const script = document.createElement('script');
      script.id = 'paypal-sdk';
      script.src = `https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}&vault=true&intent=subscription&currency=EUR`;
      script.async = true;
      script.onload = () => renderPayPalButton(plan);
      document.body.appendChild(script);
    };

    loadPayPalScript();
  }, [plan]);

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
      <div className="mb-4">
        <div id="paypal-subscription-button" className="flex justify-center mb-2" />
        <p className="text-gray-600 text-sm text-center mt-2">{t('cardOption')}</p>
      </div>

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
    </form>
  );
}

export async function getServerSideProps({ locale }) {
  // 👇 Print which locale is being requested
  console.log('🧭 Requested locale:', locale);

  // 👇 Check if the translation file exists for the current locale
  const filePath = path.resolve(`./public/locales/${locale}/payment.json`);
  const fileExists = fs.existsSync(filePath);
  console.log(`📄 Does ${filePath} exist?`, fileExists);

  return {
    props: {
      ...(await serverSideTranslations(locale, ['payment'])),
    },
  };
}