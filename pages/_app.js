import '../styles/globals.css';
import Head from 'next/head';
import { appWithTranslation } from 'next-i18next';

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>AI Keto Meal Plan</title>
        <link rel="icon" href="/favicon.png" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="description" content="Your personalized Keto Meal Plan App" />
        <meta property="og:title" content="AI Keto Meal Plan" />
        <meta property="og:image" content="/favicon.png" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}

export default appWithTranslation(MyApp);
