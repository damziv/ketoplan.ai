// next.config.js
module.exports = {
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'hr', 'de', 'pl'],
    domains: [
      // Keto-Meal
      { domain: 'keto-meal.com', defaultLocale: 'en', locales: ['en'] },
      { domain: 'hr.keto-meal.com', defaultLocale: 'hr', locales: ['hr'] },
      { domain: 'de.keto-meal.com', defaultLocale: 'de', locales: ['de'] },
      { domain: 'pl.keto-meal.com', defaultLocale: 'pl', locales: ['pl'] },

      // NaturalFix (exact same app)
      { domain: 'naturalfix.me', defaultLocale: 'en', locales: ['en'] },
      { domain: 'hr.naturalfix.me', defaultLocale: 'hr', locales: ['hr'] },
      { domain: 'de.naturalfix.me', defaultLocale: 'de', locales: ['de'] },
      { domain: 'pl.naturalfix.me', defaultLocale: 'pl', locales: ['pl'] },
    ],
    localeDetection: false,
  },

  // Optional: redirect www → apex
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.keto-meal.com' }],
        destination: 'https://keto-meal.com/:path*',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.naturalfix.me' }],
        destination: 'https://naturalfix.me/:path*',
        permanent: true,
      },
    ];
  },
};
