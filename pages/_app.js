import '../styles/globals.css';
import Head from 'next/head';
import Script from 'next/script';
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

      {/* ✅ Meta Pixel Script */}
      <Script
        id="fb-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `

          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '1142296627565768');
          fbq('track', 'PageView');
          
          `,
        }}
      />
  

      {/* Optional noscript fallback */}
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src="https://www.facebook.com/tr?id=1185363959699161&ev=PageView&noscript=1"
        />
      </noscript>

            {/* ✅ Google Analytics */}
            <Script
        strategy="afterInteractive"
        src="https://www.googletagmanager.com/gtag/js?id=G-CYTN3T74B4"
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-CYTN3T74B4');
          `,
        }}
      />

      <Component {...pageProps} />
    </>



  );
}

export default appWithTranslation(MyApp);
