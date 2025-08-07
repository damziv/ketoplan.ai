import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { createClient } from '@supabase/supabase-js'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function PlanPreview() {
  const router = useRouter()
  const { t } = useTranslation('prepayment')

  const [typeName, setTypeName] = useState('')
  const [insights, setInsights] = useState([])
  const [quizAnswers, setQuizAnswers] = useState(null)

  useEffect(() => {
    const init = async () => {
      const sessionId = sessionStorage.getItem('sessionId')
      if (!sessionId) {
        router.push('/')
        return
      }

      if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('trackCustom', 'PrePaymentView')
      }

      let quiz = JSON.parse(sessionStorage.getItem('quizAnswers'))

      if (!quiz) {
        const { data, error } = await supabase
          .from('sessions')
          .select('quiz_answers')
          .eq('id', sessionId)
          .single()

        if (!error && data?.quiz_answers) {
          quiz = data.quiz_answers
          sessionStorage.setItem('quizAnswers', JSON.stringify(quiz))
        }
      }

      if (!quiz) return
      setQuizAnswers(quiz)

      const types = t('types', { returnObjects: true })

      const matchTypeKey = () => {
        const goal = quiz['1']?.[0]?.toLowerCase() || ''
        if (goal.includes('energy') || goal.includes('focus')) return 'energySeeker'
        if (goal.includes('immunity') || goal.includes('digestion')) return 'gutHealer'
        if (goal.includes('weight') || goal.includes('active')) return 'fatBurner'
        if (goal.includes('tired') || goal.includes('fatigue')) return 'stressReducer'
        return 'balancedType'
      }

      const typeKey = matchTypeKey()
      const matched = types[typeKey] || {}
      setTypeName(matched.name || '')
      setInsights(matched.insights || [])
    }

    init()
  }, [])

  return (
    <div className="bg-white min-h-screen px-4 py-10">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8 items-start">

       {/* Left Column: Image + People Reached */}
       <div className="w-full md:w-1/2 mt-8 flex flex-col">
  <Image
    src="/images/acne-before-after.png"
    alt="Before and After"
    width={600}
    height={700}
    className="rounded-xl shadow-lg object-cover w-full h-auto"
  />

  {/* Price and CTA */}
  <div className="text-center pt-4 mt-8">
    <p className="text-xl font-semibold mb-3">{t('goalHeadline')}</p>
    <Link href="/offer">
      <span className="inline-block bg-green-600 text-white px-6 py-3 rounded-full font-medium hover:bg-green-700 transition">
        {t('unlockButton')}
      </span>
    </Link>
    <p className="text-sm text-gray-600 bg-gray-100 p-4 rounded-lg">
      {t('priceNote')}
    </p>
  </div>

  {/* Transformation promise */}
  <div className="mt-8 md:mt-24">
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 gap-6 shadow">
      <h1 className="text-3xl font-bold">{t('sectionTitle')}</h1>
      <p className="text-lg font-medium text-gray-700">{t('socialProof')}</p>
      <ul className="space-y-3">
        {t('benefits', { returnObjects: true }).map((benefit, i) => (
          <li key={i} className="flex items-start">
            <span className="text-green-600 mr-2">✔</span>
            <span>{benefit}</span>
          </li>
        ))}
      </ul>
    </div>
  </div>
</div>


         {/* Right Column: Content */}
        <div className="w-full md:w-1/2 space-y-6">

            {/* People Reached Section */}
            <div className="mt-16 md:mt-8">
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 flex flex-col md:flex-row items-center gap-6 shadow">
                
                {/* Text */}
                <div className="flex-1">
                <p className="text-lg font-medium leading-relaxed text-gray-700">
                <span className="font-bold text-green-700">{t('peopleReached.prefix')} </span>
                <span className="text-2xl font-bold text-green-700">{t('peopleReached.number')}</span>
                <span className="font-bold text-green-700"> {t('peopleReached.suffix')}</span>
                </p>
                 </div>

                {/* Image */}
                <div className="flex-shrink-0 w-full md:w-1/3">
                    <Image
                    src="/images/people-reached.webp"
                    alt="People reached"
                    width={620}
                    height={260}
                    className="w-full h-auto object-contain"
                    />
                </div>
                </div>
            </div>
          {/* Type + Insights */}
          {typeName && insights.length > 0 && (
            <div className="bg-green-50 border border-green-100 p-6 rounded-xl shadow-md space-y-4">
              <h3 className="text-xl font-bold text-center">🎯 {t('title')}</h3>
              <p className="text-center text-gray-700 font-bold font-medium">{typeName}</p>
              {insights.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start bg-white border-l-4 border-green-500 p-3 rounded-md shadow-sm"
                >
                  <span className="text-green-600 mr-2">✓</span>
                  <p className="text-gray-700 text-sm">{item}</p>
                </div>
              ))}
              <p className="italic text-gray-600 text-center">{t('stepInfo')}</p>
            </div>
          )}

          {/* Price and CTA */}
          <div className="text-center pt-4">
          <p className="text-xl font-semibold mb-3">{t('ctaHeadline')}</p>
          <p className="text-sm text-gray-600 mb-4">{t('priceAnchor')}</p>
          <Link href="/offer">
            <span className="inline-block bg-green-600 text-white px-6 py-3 rounded-full font-medium hover:bg-green-700 transition">
              {t('buttonCta')}
            </span>
          </Link>
        </div>

        <div className="text-sm text-gray-600 bg-gray-100 p-4 rounded-lg">
          <p><strong>{t('guarantee')}</strong></p>
        </div>
        </div>
      </div>
    </div>
  )
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['prepayment'])),
    },
  }
}
