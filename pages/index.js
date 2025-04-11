import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export default function Home() {
  const { t } = useTranslation('common');

  return (
    <div className="relative min-h-screen flex flex-col justify-between text-white">
      {/* Background Image */}
      <div className="absolute inset-0">
        <picture>
          <source srcSet="/images/keto-bg-desktop.png" media="(min-width: 768px)" />
          <img src="/images/keto-bg-mobile.png" alt="Avocados Background" className="w-full h-full object-cover" />
        </picture>
        <div className="absolute inset-0 bg-black bg-opacity-10"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-grow text-center px-6 md:px-0">
        <h1 className="text-black text-5xl md:text-6xl font-extrabold leading-tight mb-4">
        {t('hero.titleLine1')} <br />
        {t('hero.titleLine2')}
        </h1>
        <p className="text-black text-lg md:text-xl font-medium mb-6 max-w-xl mx-auto">
          {t('hero.description')}
        </p>

        <button
          onClick={() => window.location.href = '/quiz/1'}
          className="bg-green-500 hover:bg-green-600 text-white text-lg font-bold py-4 px-8 rounded-xl shadow-xl transition-transform transform hover:scale-105"
        >
          {t('hero.cta')}
        </button>

        <p className="relative z-10 text-gray-800 text-sm mb-2 font-bold py-4 px-8 rounded-xl bg-[rgba(255,255,255,0.8)] shadow-md">
          {t('hero.disclaimer')}
        </p>
      </div>

      {/* Footer */}
      <footer className="relative z-10 w-full bg-gray-900 text-gray-300 text-sm text-center py-6 mt-10">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-center gap-4">
          <p className="text-gray-400">© {new Date().getFullYear()} AImealPrep. All rights reserved.</p>
          <div className="flex space-x-4">
            <a href="/privacy-policy" className="hover:text-white transition">{t('footer.privacy')}</a>
            <a href="/terms" className="hover:text-white transition">{t('footer.terms')}</a>
            <a href="/cookie-policy" className="hover:text-white transition">{t('footer.cookies')}</a>
            <a href="/refund-policy" className="hover:text-white transition">{t('footer.refunds')}</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export async function getStaticProps({ locale }) {
  console.log('📣 Detected locale:', locale); // <-- 👈 Add this line
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}
