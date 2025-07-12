import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import { motion } from 'framer-motion';

export default function Home() {
  const { t } = useTranslation('common');

  const reviews = t('reviews.list', { returnObjects: true });
  const why = t('whyUs.points', { returnObjects: true });

  return (
    <div className="flex flex-col min-h-screen">
      {/* HERO SECTION */}
     
<section className="relative min-h-screen flex flex-col justify-center items-center text-white px-6 md:px-0">
  <div className="absolute inset-0">
    <picture>
      <source srcSet="/images/keto-bg-desktop.png" media="(min-width: 768px)" />
      <img
        src="/images/keto-bg-mobile.png"
        alt="Avocados Background"
        className="w-full h-full object-cover"
      />
    </picture>
    <div className="absolute inset-0 bg-white bg-opacity-60"></div>
  </div>

  <div className="relative z-10 flex flex-col items-center text-center w-full max-w-2xl">
    <h1 className="text-black text-4xl md:text-5xl font-extrabold leading-tight mb-6">
      {t('hero.titleLine1')} <span className="text-green-600">{t('hero.titleLine2')}</span>
    </h1>
    <p className="text-black text-lg md:text-xl font-medium mb-6">
      {t('hero.description')}
    </p>

    <div className="flex gap-6 justify-center mb-6">
      <button
        onClick={() => (window.location.href = '/quiz/1')}
        className="flex flex-col items-center bg-white border border-green-600 text-green-700 hover:bg-green-50 p-4 rounded-xl shadow-lg w-36 transition-transform transform hover:scale-105"
      >
        <img src="/images/female.png" alt="Female" className="w-30 h-34 object-contain mb-2" />
        <span className="font-bold">{t('gender.female')}</span>
      </button>

      <button
        onClick={() => (window.location.href = '/quiz/1')}
        className="flex flex-col items-center bg-white border border-green-600 text-green-700 hover:bg-green-50 p-4 rounded-xl shadow-lg w-36 transition-transform transform hover:scale-105"
      >
        <img src="/images/male.png" alt="Male" className="w-30 h-34 object-contain mb-2" />
        <span className="font-bold">{t('gender.male')}</span>
      </button>
    </div>

    <p className="text-gray-700 text-sm font-medium mb-3" dangerouslySetInnerHTML={{ __html: t('hero.trusted') }} />

    <ul className="text-gray-800 text-sm font-bold py-4 px-8 rounded-xl bg-[rgba(255,255,255,0.8)] shadow-md">
      <li>{t('hero.personalized')}</li>
      <li>{t('hero.noSignup')}</li>
    </ul>

    <div className="flex justify-center items-center text-yellow-500 text-xl mt-3 mb-2">
      ★★★★★ <span className="ml-2 text-sm text-gray-600">{t('hero.rating')}</span>
    </div>

    <p className="text-gray-800 text-sm font-bold py-4 px-8 rounded-xl bg-[rgba(255,255,255,0.8)] shadow-md">
      {t('hero.disclaimer')}
    </p>
  </div>
</section>


      {/* CONTENT SECTION BELOW HERO */}
      <section className="bg-green-50 text-gray-800 px-6 md:px-0 py-16">
        {/* Carousel Section */}
        <div className="max-w-md mx-auto mt-4">
          <h2 className="text-2xl font-bold text-center mb-4 text-gray-800">{t('carousel.title')}</h2>
          <Carousel
            showThumbs={false}
            autoPlay
            infiniteLoop
            interval={2000}
            showStatus={false}
          >
            <div><img src="/images/results/result1.png" alt="Before and after photo 1" /></div>
            <div><img src="/images/results/result2.png" alt="Before and after photo 2" /></div>
            <div><img src="/images/results/result3.png" alt="Before and after photo 3" /></div>
          </Carousel>
        </div>

        {/* Reviews */}
        <div className="mt-16 w-full max-w-md mx-auto">
          <h3 className="text-lg font-bold text-center mb-4">{t('reviews.title')}</h3>
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


        {/* ADDITIONAL CTA BUTTON AFTER REVIEWS */}
        <div className="flex justify-center mt-12">
          <button
            onClick={() => (window.location.href = '/quiz/1')}
            className="bg-green-500 hover:bg-green-600 text-white text-lg font-bold py-4 px-8 rounded-xl shadow-xl transition-transform transform hover:scale-105"
          >
            {t('hero.cta')}
          </button>
        </div>

        {/* Why Us */}
        <div className="mt-8 w-full max-w-md mx-auto bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-2xl font-bold text-center mb-6 text-gray-800">
            {t('whyUs.title')}
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
      </section>

      {/* Footer */}
      <footer className="w-full bg-gray-900 text-gray-300 text-sm text-center py-6">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-center gap-4">
          <p className="text-gray-400">© {new Date().getFullYear()} keto-meal.com {t('footer.rights')}</p>
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
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}
