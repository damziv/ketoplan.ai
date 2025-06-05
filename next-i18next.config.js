module.exports = {
    i18n: {
      defaultLocale: 'en',
      locales: ['en', 'hr', 'de',],
      domains: [
        {
          domain: 'localhost',
          defaultLocale: 'en',
        },
        {
          domain: 'hr.keto-meal.com',
          defaultLocale: 'hr',
        },
        {
          domain: 'de.keto-meal.com',
          defaultLocale: 'de',
        },
      ],
      localeDetection: false // ✅ Either `true` or `false`, no quotes!
    },
  };
  