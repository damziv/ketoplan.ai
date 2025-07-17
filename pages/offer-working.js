
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

export default function OfferPage() {
  const router = useRouter()

  const [timeLeft, setTimeLeft] = useState(60 * 60) // 1 hour in seconds

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
      title: '1-Time Plan',
      price: '€5.99',
      originalPrice: '€17.99',
      perDay: '5.99',
      features: ['✅ Personal Plan Only'],
      route: '/payment/one-time',
      isBest: false,
    },
    {
      title: '6-Month Plan',
      price: '€9.30/month',
      originalPrice: '€18.60/month',
      perDay: '~€0.31/day',
      features: ['✅ Personal Plan', '✅ eBook'],
      route: '/payment/6-month',
      isBest: false,
    },
    {
      title: '⭐ 12-Month Plan',
      price: '€7.50/month',
      originalPrice: '€14.00/month',
      perDay: '~€0.25/day',
      features: ['✅ Personal Plan', '✅ eBook', '✅ Health Guide'],
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
          ⏰ Hurry! Offer expires in <span className="font-bold">{formatTime(timeLeft)}</span>
        </span>
        <button
        onClick={() => {
            const pricingSection = document.getElementById('pricing');
            if (pricingSection) {
            pricingSection.scrollIntoView({ behavior: 'smooth' });
            }
        }}
        className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
        >
        Get My Plan
        </button>
      </div>

      <div className="max-w-4xl mx-auto pt-24">
        {/* Exit Intent / Offer Box */}
        <div className="bg-white rounded-xl shadow p-6 mb-8 text-center">
          <div className="mb-6">
            <img alt="Present box" className="mx-auto" src="/images/naturalfix-before-after.png" width="500" height="500" />
          </div>
          <h2 className="text-2xl font-bold mb-2">
            Get your <span className="text-red-600 font-extrabold">55%</span> discount!
          </h2>
          <p className="text-gray-700 text-sm">It's a one-time offer! Don't miss it!</p>
        </div>

        {/* Before & After Comparison */}
        <div className="bg-white rounded-xl shadow p-6 mb-10">
        <h2 className="text-2xl font-bold text-center mb-6">
            Visible changes {' '}
            <span className="text-green-600 font-bold">after the first week</span>
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border border-gray-200 rounded-xl overflow-hidden">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-red-700 w-1/2">Before</th>
                  <th className="px-4 py-3 text-left text-green-700 w-1/2">After</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                <tr className="border-t">
                  <td className="px-4 py-3">Weight gain</td>
                  <td className="px-4 py-3">Fat burning & healthy weight loss</td>
                </tr>
                <tr className="bg-gray-50 border-t">
                  <td className="px-4 py-3">Night sweats, or excessive sweating</td>
                  <td className="px-4 py-3">Balanced hormones and better sleep</td>
                </tr>
                <tr className="border-t">
                  <td className="px-4 py-3">Anxiety or intense stress</td>
                  <td className="px-4 py-3">Improved mood and calmer mind</td>
                </tr>
                <tr className="bg-gray-50 border-t">
                  <td className="px-4 py-3">Depression</td>
                  <td className="px-4 py-3">More energy and confidence</td>
                </tr>
                <tr className="border-t">
                  <td className="px-4 py-3">Reduced sex drive</td>
                  <td className="px-4 py-3">Renewed libido and vitality</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div id="pricing"></div>

               {/* Pricing Table with Original Prices */}
               <div id="pricing" className="mt-12">
          <h1 className="text-4xl font-extrabold text-center text-gray-800 mb-4">
            Claim the benefits today!
          </h1>
          <p className="text-center text-gray-600 mb-10">
            Unlock your personalized program by selecting one of our flexible plan options below.
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
                  Select Plan
                </button>
              </div>
            ))}
          </div>
        </div>


        {/* What’s Included Section */}
        <div className="mt-16">
          <h3 className="text-xl font-bold text-center mb-2">What’s included?</h3>
          <p className="text-center text-gray-700 mb-4">
            The perfect combination of tips and tricks for the fastest and lasting results
          </p>
          <ul className="space-y-3 max-w-xl mx-auto text-gray-800">
            <li className="flex items-start gap-3">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="9" cy="9" r="9" fill="#03CEA4"></circle>
                <path fillRule="evenodd" clipRule="evenodd" d="M14.6913 5.69324L7.06342 13.3211L3.93555 10.1932L5.12879 9L7.06342 10.9346L13.498 4.5L14.6913 5.69324Z" fill="white" />
              </svg>
              Specifically health plan based on your lifestyle
            </li>
            <li className="flex items-start gap-3">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="9" cy="9" r="9" fill="#03CEA4"></circle>
                <path fillRule="evenodd" clipRule="evenodd" d="M14.6913 5.69324L7.06342 13.3211L3.93555 10.1932L5.12879 9L7.06342 10.9346L13.498 4.5L14.6913 5.69324Z" fill="white" />
              </svg>
              Recipes and supliments to balance your body
            </li>
            <li className="flex items-start gap-3">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="9" cy="9" r="9" fill="#03CEA4"></circle>
                <path fillRule="evenodd" clipRule="evenodd" d="M14.6913 5.69324L7.06342 13.3211L3.93555 10.1932L5.12879 9L7.06342 10.9346L13.498 4.5L14.6913 5.69324Z" fill="white" />
              </svg>
              Food, drinks and supliments guide
            </li>
            <li className="flex items-start gap-3">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="9" cy="9" r="9" fill="#03CEA4"></circle>
                <path fillRule="evenodd" clipRule="evenodd" d="M14.6913 5.69324L7.06342 13.3211L3.93555 10.1932L5.12879 9L7.06342 10.9346L13.498 4.5L14.6913 5.69324Z" fill="white" />
              </svg>
              An abundance of insights and tricks
            </li>
            <li className="flex items-start gap-3">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="9" cy="9" r="9" fill="#03CEA4"></circle>
                <path fillRule="evenodd" clipRule="evenodd" d="M14.6913 5.69324L7.06342 13.3211L3.93555 10.1932L5.12879 9L7.06342 10.9346L13.498 4.5L14.6913 5.69324Z" fill="white" />
              </svg>
              Support during your journey to ensure optimal results
            </li>
          </ul>
        </div>



               {/* Testimonials with Avatars */}
               <div className="mt-16">
          <h2 className="text-2xl font-bold text-center mb-6">What Our Users Say</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-4 rounded-xl shadow text-sm">
              <div className="flex items-center gap-3 mb-2">
                <img src="/images/avatars/maria.jpg" alt="Martina" className="w-10 h-10 rounded-full object-cover" />
                <p className="font-semibold text-gray-800">Martina, 52</p>
              </div>
              <p className="italic">“This plan helped me lose 10kg in 3 months! Simple and effective.”</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow text-sm">
              <div className="flex items-center gap-3 mb-2">
                <img src="/images/avatars/anna.jpg" alt="Anja" className="w-10 h-10 rounded-full object-cover" />
                <p className="font-semibold text-gray-800">Anja, 45</p>
              </div>
              <p className="italic">“I feel more energetic, my cravings are gone, and I love the recipes!”</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow text-sm">
              <div className="flex items-center gap-3 mb-2">
                <img src="/images/avatars/nermin.jpg" alt="Sandra" className="w-10 h-10 rounded-full object-cover" />
                <p className="font-semibold text-gray-800">Sandra, 61</p>
              </div>
              <p className="italic">“The 12-month plan was the best investment in my health I've made.”</p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-center mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-800">Can I cancel anytime?</h3>
              <p className="text-sm text-gray-600">Yes, all plans come with a cancel-anytime guarantee. No hidden fees.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Do I need to follow diet strictly?</h3>
              <p className="text-sm text-gray-600">No! We adapt your plan to your preferences and flexibility.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">What do I get after payment?</h3>
              <p className="text-sm text-gray-600">You'll receive a personalized 5-day plan, tips, and a bonus recipe book (depending on your plan).</p>
            </div>
          </div>
        </div>

        {/* Trust Badge Section */}
        <div className="mt-16 text-center">
          <img src="/images/ssl.jpeg" alt="Secure Checkout" className="mx-auto h-12 mb-2" />
          <p className="text-sm text-gray-500">SSL Secured | 256-bit encryption | Safe Payment</p>
        </div>
      </div>
    </div>
  )
}