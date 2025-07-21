import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js';
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export default function OfferPage() {
  const router = useRouter()
  const { t } = useTranslation('offer')

  const [timeLeft, setTimeLeft] = useState(15 * 60) // 1 hour in seconds

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const pricingOptions = [
    {
      title: t('planTitles.oneTime'),
      price: '€8.99',
      originalPrice: '€17.99',
      perDay: '€8.99',
      features: [t('planFeatures.personalPlan')],
      route: '/payment/one-time',
      isBest: false,
    },
    {
      title: t('planTitles.sixMonth'),
      price: '€9.30/month',
      originalPrice: '€18.60/month',
      perDay: '~€0.31/day',
      features: [t('planFeatures.personalPlan'), t('planFeatures.ebook')],
      route: '/payment/6-month',
      isBest: false,
    },
    {
      title: t('planTitles.twelveMonth'),
      price: '€7.50/month',
      originalPrice: '€14.00/month',
      perDay: '~€0.25/day',
      features: [t('planFeatures.personalPlan'), t('planFeatures.ebook'), t('planFeatures.healthGuide')],
      route: '/payment/12-month',
      isBest: true,
    },
  ]

  const handleSelect = (route) => {
    router.push(route)
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
              {/* Fixed Countdown Timer with CTA */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-red-100 border-b border-red-300 text-red-700 text-center py-3 flex flex-col md:flex-row items-center justify-center gap-4">
        <span>
          {t('countdownMessage', { time: formatTime(timeLeft) })}
        </span>
        <button
          onClick={() => {
            const pricingSection = document.getElementById('pricing')
            if (pricingSection) {
              pricingSection.scrollIntoView({ behavior: 'smooth' })
            }
          }}
          className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
        >
          {t('getMyPlan')}
        </button>
      </div>

      <div className="max-w-4xl mx-auto pt-24">
         {/* Exit Intent / Offer Box */}
        <div className="bg-white rounded-xl shadow p-6 mb-8 text-center">
          <div className="mb-6">
            <img alt="Present box" className="mx-auto" src="/images/naturalfix-before-after.png" width="500" height="500" />
          </div>
          <h2 className="text-2xl font-bold mb-2">
            {t('discountHeadline')}{' '}<span className="text-red-600 font-extrabold">{t('discountNumber')}</span>{' '}{t('discountText')} 
          </h2>
          <p className="text-gray-700 text-sm">{t('discountSubtext')}</p>
        </div>

        {/* Before & After Comparison */}
        <div className="bg-white rounded-xl shadow p-6 mb-10">
          <h2 className="text-2xl font-bold text-center mb-6">
            {t('visibleChangesFirst')} {' '}
            <span className="text-green-600 font-bold">{t('visibleChangesSecond')}</span>
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border border-gray-200 rounded-xl overflow-hidden">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-red-700 w-1/2">{t('comparisonBefore')}</th>
                  <th className="px-4 py-3 text-left text-green-700 w-1/2">{t('comparisonAfter')}</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                {t('comparisonItems', { returnObjects: true }).map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'border-t bg-white' : 'border-t bg-gray-50'}>
                    <td className="px-4 py-3">{item.before}</td>
                    <td className="px-4 py-3">{item.after}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

{/* Pricing Table with Original Prices */}
        <div id="pricing" className="mt-12">
          <h1 className="text-4xl font-extrabold text-center text-gray-800 mb-4">
            {t('pricingHeadline')}
          </h1>
          <p className="text-center text-gray-600 mb-10">
            {t('pricingSubtext')}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pricingOptions.map((option, idx) => (
              <div
                key={idx}
                className={`rounded-2xl border-2 p-6 flex flex-col justify-between transition-shadow ${
                  option.isBest
                    ? 'border-yellow-400 shadow-lg bg-yellow-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h2 className="text-l font-semibold text-gray-800">
                      {option.title}
                    </h2>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">{option.perDay}</p>
                    </div>
                  </div>
                  {option.perDay && (
                    <p className="text-sm text-green-500 mb-2">{option.price}</p>
                  )}
                  <p className="text-sm text-gray-400 line-through">{option.originalPrice}</p>
                  <ul className="list-disc list-inside mb-4 text-gray-700 text-sm">
                    {option.features.map((feature, i) => (
                      <li key={i}>{feature}</li>
                    ))}
                  </ul>
                </div>
                <button
                  onClick={() => handleSelect(option.route)}
                  className="mt-4 w-full bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  {t('selectPlan')}
                </button>
              </div>
            ))}
          </div>
        </div>
        {/* What’s Included Section */}
        <div className="mt-16">
          <h3 className="text-xl font-bold text-center mb-2">{t('whatsIncludedTitle')}</h3>
          <p className="text-center text-gray-700 mb-4">{t('whatsIncludedSubtext')}</p>
          <ul className="space-y-3 max-w-xl mx-auto text-gray-800">
            {t('whatsIncludedItems', { returnObjects: true }).map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="9" cy="9" r="9" fill="#03CEA4"></circle>
                  <path fillRule="evenodd" clipRule="evenodd" d="M14.6913 5.69324L7.06342 13.3211L3.93555 10.1932L5.12879 9L7.06342 10.9346L13.498 4.5L14.6913 5.69324Z" fill="white" />
                </svg>
                {item}
              </li>
            ))}
          </ul>
        </div>

         {/* Testimonials with Avatars */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-center mb-6">{t('testimonialsTitle')}</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {t('testimonials', { returnObjects: true }).map((testimonial, i) => (
              <div key={i} className="bg-white p-4 rounded-xl shadow text-sm">
                <div className="flex items-center gap-3 mb-2">
                  <img src={`/images/avatars/${testimonial.name.toLowerCase()}.jpg`} alt={testimonial.name} className="w-10 h-10 rounded-full object-cover" />
                  <p className="font-semibold text-gray-800">{testimonial.name}, {testimonial.age}</p>
                </div>
                <p className="italic">{testimonial.text}</p>
              </div>
            ))}
          </div>
        </div>

  {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-center mb-6">{t('faqTitle')}</h2>
          <div className="space-y-4">
            {t('faqItems', { returnObjects: true }).map((faq, i) => (
              <div key={i}>
                <h3 className="font-semibold text-gray-800">{faq.question}</h3>
                <p className="text-sm text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

  {/* Trust Badge Section */}
        <div className="mt-16 text-center">
          <img src="/images/ssl.jpeg" alt="Secure Checkout" className="mx-auto h-12 mb-2" />
          <p className="text-sm text-gray-500">{t('trustBadgeNote')}</p>
        </div>
      </div>
    </div>
  )
}

export async function getStaticProps({ locale }) {
    return {
      props: {
        ...(await serverSideTranslations(locale, ['offer'])),
      },
    };
  }
  