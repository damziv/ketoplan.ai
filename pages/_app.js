import '../styles/globals.css';

import Head from 'next/head';

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <link rel="icon" href="/favicon.png" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="description" content="Your personalized Keto Meal Plan App" />
        <meta property="og:title" content="AI Keto Meal Plan" />
        <meta property="og:image" content="/favicon.png" />
        {/* You can also try: <link rel="shortcut icon" href="/favicon.png" /> */}
      </Head>
      <Component {...pageProps} />
    </>
  );
}
export default MyApp;