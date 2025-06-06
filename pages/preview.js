
// File: /pages/preview.js

import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Image from 'next/image';
import { Carousel } from 'react-responsive-carousel';
import "react-responsive-carousel/lib/styles/carousel.min.css";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function PreviewPage() {
  const router = useRouter();
  const { t } = useTranslation('preview');

  useEffect(() => {
    const checkSession = async () => {
      const sessionId = sessionStorage.getItem('sessionId');
      if (!sessionId) {
        router.push('/quiz');
      }
    };
    checkSession();
  }, [router]);

  const handleContinue = () => {
    window.fbq('trackCustom', 'ClickPreviewContinue');
    router.push('/email');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-5 pb-36">
      <div className="fixed top-0 w-full bg-gray-800 py-4 text-center text-white font-bold text-2xl z-50">
        Smart Food Secrets
      </div>

      <div className="mt-16 w-full max-w-md mx-auto bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-md font-bold text-center mb-2 text-gray-800">{t('title')}</h2>
        
        {/* Recipes Carousel */}
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md text-left mb-6">
        <h3 className="text-2xl font-bold text-gray-800 mb-4">🍽️ {t('recipeHead')}</h3>
        <Carousel showThumbs={false} infiniteLoop autoPlay interval={4000} showStatus={false}>
          <div className="text-left">
            <img src="/images/preview/kale-bunch.jpg" alt={t('recipeTitle1')} className="rounded-lg mb-2" />
            <h4 className="text-lg font-semibold text-green-700">{t('recipeTitle1')}</h4>
            <ul className="list-disc list-inside text-gray-700 text-sm mb-2 space-y-1">
              <li>{t('recipeIngredients1')}</li>
            </ul>
            <p className="text-sm text-gray-600">{t('recipeInstructions1')}</p>
          </div>
          <div className="text-left">
            <img src="/images/preview/gotu-kola.jpg" alt={t('recipeTitle2')} className="rounded-lg mb-2" />
            <h4 className="text-lg font-semibold text-green-700">{t('recipeTitle2')}</h4>
            <ul className="list-disc list-inside text-gray-700 text-sm mb-2 space-y-1">
              <li>{t('recipeIngredients2')}</li>
            </ul>
            <p className="text-sm text-gray-600">{t('recipeInstructions2')}</p>
          </div>
          <div className="text-left">
            <img src="/images/preview/beef-liver.jpg" alt={t('recipeTitle3')} className="rounded-lg mb-2" />
            <h4 className="text-lg font-semibold text-green-700">{t('recipeTitle3')}</h4>
            <ul className="list-disc list-inside text-gray-700 text-sm mb-2 space-y-1">
              <li>{t('recipeIngredients3')}</li>
            </ul>
            <p className="text-sm text-gray-600">{t('recipeInstructions3')}</p>
          </div>
        </Carousel>
        <button
          onClick={handleContinue}
          className="w-full py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 transition"
          aria-label="Continue to your quiz results"
        >
          {t('continueButton')}
        </button>
      </div>

        {/* Mineral Tip */}
        <Carousel showThumbs={false} infiniteLoop autoPlay interval={4000} showStatus={false}>
        <div className="bg-green-50 p-4 rounded-md mb-6">
          <h3 className="text-lg font-semibold text-green-700 mb-2">{t('tipTitle1')}</h3>
          <p className="text-gray-700 text-base">{t('tipText1')}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-md mb-6">
          <h3 className="text-lg font-semibold text-green-700 mb-2">{t('tipTitle2')}</h3>
          <p className="text-gray-700 text-base">{t('tipText2')}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-md mb-6">
          <h3 className="text-lg font-semibold text-green-700 mb-2">{t('tipTitle3')}</h3>
          <p className="text-gray-700 text-base">{t('tipText3')}</p>
        </div>
        </Carousel>
        <p className="text-sm text-gray-600 text-center mb-4">{t('note')}</p>
        <button
          onClick={handleContinue}
          className="w-full py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 transition"
          aria-label="Continue to your quiz results"
        >
          {t('continueButton')}
        </button>
      </div>
    </div>
  );
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['preview'])),
    },
  };
}
