module.exports = {
    i18n: {
      defaultLocale: 'en',
      locales: ['en', 'hr', 'de'],
      domains: [
        {
          domain: 'localhost',
          defaultLocale: 'en',
        },
        {
          domain: 'hr.localhost',
          defaultLocale: 'hr',
        },
        {
          domain: 'de.localhost',
          defaultLocale: 'de',
        },
      ],
      localeDetection: false // ✅ Either `true` or `false`, no quotes!
    },
  };
  