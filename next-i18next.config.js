module.exports = {
    i18n: {
      defaultLocale: 'en',
      locales: ['en', 'hr', 'de', 'pl',],
      domains: [
        {
          domain: 'keto-meal.com',
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
        {
          domain: 'pl.keto-meal.com',
          defaultLocale: 'pl',
        },
      ],
      localeDetection: false // ✅ Either `true` or `false`, no quotes!
    },
  };
  