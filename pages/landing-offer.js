// pages/landing-offer.js
import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

export default function LandingOffer() {
  const router = useRouter()
  const { t } = useTranslation('landing')

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('trackCustom', '1TimeRetarget')
    }
  }, [])

  const handleCheckout = async (e) => {
    e.preventDefault()
    setError('')
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setError(t('errors.invalidEmail'))
      return
    }

    try {
      setLoading(true)

      if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('trackCustom', 'InitiateCheckoutRetarget', { email })
        window.fbq('track', 'Lead', { email })
      }

      const res = await fetch('/api/create-one-time-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error || t('errors.checkoutStartFailed'))
      }

      const { url } = await res.json()
      if (url) window.location.href = url
    } catch (err) {
      setError(err.message || t('errors.generic'))
    } finally {
      setLoading(false)
    }
  }

  const bulletsLeft = t('left.bullets', { returnObjects: true })
  const getBullets = t('right.get.bullets', { returnObjects: true })

  return (
    <div className="bg-white min-h-screen">
      {/* Hero */}
      <section className="px-4 py-12 md:py-16 max-w-6xl mx-auto grid md:grid-cols-2 gap-10 items-start">
        {/* Left: Social proof + image */}
        <div className="flex flex-col">
          <Image
            src="/images/acne-before-after.png"
            alt={t('images.beforeAfterAlt')}
            width={700}
            height={840}
            className="rounded-xl shadow-lg object-cover w-full h-auto"
            priority
          />

          <div className="mt-8 bg-gray-50 border border-gray-200 rounded-xl p-6 shadow">
            <h1 className="text-3xl font-bold">{t('left.title')}</h1>
            <p className="text-lg font-medium text-gray-700 mt-2">
              {t('left.subtitle')}
            </p>
            <ul className="space-y-3 mt-4">
              {bulletsLeft.map((b, i) => (
                <li key={i} className="flex items-start">
                  <span className="text-green-600 mr-2">✔</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right: People reached + CTA + Payment block */}
        <div className="space-y-6">
          {/* People reached */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 flex flex-col md:flex-row items-center gap-6 shadow mt-2">
            <div className="flex-1">
              <p className="text-lg font-medium leading-relaxed text-gray-700">
                <span className="font-bold text-green-700">{t('right.reached.prefix')} </span>
                <span className="text-2xl font-bold text-green-700">{t('right.reached.number')}</span>
                <span className="font-bold text-green-700"> {t('right.reached.suffix')}</span>
              </p>
            </div>
            <div className="flex-shrink-0 w-full md:w-1/3">
              <Image
                src="/images/people-reached.webp"
                alt={t('images.peopleReachedAlt')}
                width={620}
                height={260}
                className="w-full h-auto object-contain"
              />
            </div>
          </div>

          {/* What you’ll get */}
          <div className="bg-green-50 border border-green-100 p-6 rounded-xl shadow-md space-y-4">
            <h3 className="text-xl font-bold text-center">🎯 {t('right.get.title')}</h3>
            {getBullets.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start bg-white border-l-4 border-green-500 p-3 rounded-md shadow-sm"
              >
                <span className="text-green-600 mr-2">✓</span>
                <p className="text-gray-700 text-sm">{item}</p>
              </div>
            ))}
            <p className="italic text-gray-600 text-center">
              {t('right.get.note')}
            </p>
          </div>

          {/* Price highlight */}
          <div className="text-center pt-2">
            <p className="text-xl font-semibold mb-1">{t('right.price.headline')}</p>
            <p className="text-sm text-gray-600 mb-4">{t('right.price.subline')}</p>
            <span className="inline-block bg-green-600 text-white px-6 py-3 rounded-full font-medium">
              {t('right.price.badge')}
            </span>
          </div>

          {/* Email + One-time Checkout */}
          <form
            onSubmit={handleCheckout}
            className="mt-4 bg-white border border-gray-200 rounded-xl p-6 shadow space-y-4"
          >
            <label className="block text-sm font-medium text-gray-700">
              {t('form.label')}
            </label>
            <input
              type="email"
              className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder={t('form.placeholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full rounded-full px-6 py-3 font-semibold text-white transition ${
                loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {loading ? t('form.loading') : t('form.cta')}
            </button>

            <p className="text-xs text-gray-500 text-center">
              {t('form.secureNote')}
            </p>
          </form>

          {/* Money-back note */}
          <div className="text-sm text-gray-600 bg-gray-100 p-4 rounded-lg">
            <p><strong>{t('guarantee.title')}</strong> — {t('guarantee.text')}</p>
          </div>

          {/* Optional: link back to main site */}
          <div className="text-center text-sm">
            <Link href="/" className="text-gray-500 underline">{t('footer.backHome')}</Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['landing'])),
    },
  }
}
