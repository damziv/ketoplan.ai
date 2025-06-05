// pages/_document.js
import Script from 'next/script';
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>

        <link rel="icon" href="/favicon.png" type="image/png" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="description" content="Your personalized heatlh meal plan App" />
        <meta property="og:title" content="SmartMeal Plan" />
        <meta property="og:image" content="/favicon.png" />
        <meta property="og:description" content="Get your personalized health plan with full recipes and PDF download." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

      </Head>
{/* ✅ DigitalQA Meta Pixel Script */}
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


      {/* ✅ VericonEMUS Meta Pixel Script */}
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
          fbq('init', '9290041274439815');
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
          src="https://www.facebook.com/tr?id=9290041274439815&ev=PageView&noscript=1"
        />
      </noscript>

      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
