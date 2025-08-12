module.exports = {
    i18n: {
      defaultLocale: 'en',
      locales: ['en', 'hr', 'de', 'pl',],
      domains: [
        {
          domain: 'naturalfix.me',
          defaultLocale: 'en',
        },
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
  