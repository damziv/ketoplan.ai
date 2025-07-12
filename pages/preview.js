// File: /pages/preview.js

import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { Carousel } from 'react-responsive-carousel';
import "react-responsive-carousel/lib/styles/carousel.min.css";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function PreviewPage() {
  const router = useRouter();
  const { t } = useTranslation('preview');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      router.push('/quiz/1');
    }
  }, [router]);

  // Progress animation effect
  useEffect(() => {
    if (progress < 100) {
      const timer = setTimeout(() => setProgress(progress + 1), 100);
      return () => clearTimeout(timer);
    } else {
      router.push('/email');
    }
  }, [progress, router]);

  // Dynamic label text
  const progressLabel = progress < 50 ? t('progress.analyzing') : t('progress.generating');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-5 pb-36">
      <div className="fixed top-0 w-full bg-gray-800 py-4 text-center text-white font-bold text-2xl z-50">
        {t('topTitle')}
      </div>

      <div className="mt-16 w-full max-w-md mx-auto bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-md font-bold text-center mb-4 text-gray-800">{t('title')}</h2>

        {/* Weight Progress Chart */}
        <div className="flex justify-center mb-6">
          <svg width="339" height="190" viewBox="0 0 339 190" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M114 166V0M226 166V0M338 166V0M2 166V0" stroke="#F0EEEC" strokeWidth="2" strokeDasharray="1 6" />
            <path d="M13 40c35.154 0 59.761 6.498 81.44 19.492 29.294 17.561 53.472 31.488 79.681 45.483 63.277 33.786 150.575 29.888 162.879 29.888" stroke="url(#a)" strokeWidth="3" />
            <defs>
              <linearGradient id="a" x1="12.154" y1="82.107" x2="328.929" y2="82.547" gradientUnits="userSpaceOnUse">
                <stop stopColor="#F2556F" />
                <stop offset="0.433" stopColor="#FFD96B" />
                <stop offset="1" stopColor="#00C27C" />
              </linearGradient>
            </defs>
            <text fill="#F2556F" fontSize="16" fontWeight="bold" x="10" y="22">{t('yChart1')}</text>
            <text fill="#FF974D" fontSize="16" fontWeight="bold" x="92" y="46"></text>
            <text fill="#FEC226" fontSize="16" fontWeight="bold" x="204" y="101">{t('yChart2')}</text>
            <text fill="#fff" fontSize="16" fontWeight="bold" textAnchor="middle" x="302" y="75">Goal</text>
            <text fill="#fff" fontSize="16" fontWeight="bold" textAnchor="middle" x="302" y="94">65 kg</text>
            <text fill="#999999" fontSize="14" x="2" y="186">{t('xChart1')}</text>
            <text fill="#999999" fontSize="14" x="100" y="186"></text>
            <text fill="#999999" fontSize="14" x="212" y="186">{t('xChart2')}</text>
            <text fill="#999999" fontSize="14" x="313" y="186"></text>
          </svg>
        </div>

        {/* Analyzer Progress */}
        <div className="mb-4 pb-2 text-left font-normal">
          <div className="mb-1 flex items-center justify-between gap-3">
            <div>{progressLabel}</div>
            <div className="flex items-center gap-2 tabular-nums">
              <svg className="animate-spin h-4 w-4 text-rose-500" viewBox="25 25 50 50">
                <circle
                  className="path"
                  cx="50"
                  cy="50"
                  r="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="6"
                  strokeMiterlimit="10"
                />
              </svg>
              <span>{progress}%</span>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-full bg-stone-100 dark:bg-zinc-900 h-4">
            <div
              className="h-full rounded-r-lg bg-rose-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Mineral Tips */}
        <Carousel showThumbs={false} infiniteLoop autoPlay interval={5000} showStatus={false}>
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

        <p className="text-sm text-gray-600 text-center">{t('note')}</p>
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
