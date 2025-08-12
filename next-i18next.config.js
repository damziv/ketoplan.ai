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
              // Optional: subdomains for naturalfix.me in other languages
      {
        domain: 'hr.naturalfix.me',
        defaultLocale: 'hr',
      },
      {
        domain: 'de.naturalfix.me',
        defaultLocale: 'de',
      },
      {
        domain: 'pl.naturalfix.me',
        defaultLocale: 'pl',
      },
      ],
      localeDetection: false // ✅ Either `true` or `false`, no quotes!
    },
  };
  