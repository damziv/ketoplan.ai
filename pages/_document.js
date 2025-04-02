// pages/_document.js
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>

        <link rel="icon" href="/favicon.png" type="image/png" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="description" content="Your personalized Keto Meal Plan App" />
        <meta property="og:title" content="AI Keto Meal Plan" />
        <meta property="og:image" content="/favicon.png" />
        <meta property="og:description" content="Get your personalized 5-day keto meal plan with full recipes and PDF download." />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
