// pages/success-1time.js
import { useEffect } from 'react'
import Link from 'next/link'

export default function SuccessOneTime() {
  useEffect(() => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('trackCustom', 'PurchaseRetarget')
      // Standard Purchase event (optional):
      window.fbq('track', 'Purchase', { value: 5.99, currency: 'EUR' })
    }
  }, [])

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-xl w-full bg-gray-50 border border-gray-200 rounded-xl p-8 text-center shadow">
        <h1 className="text-3xl font-bold mb-3">Thank you for your purchase! 🎉</h1>
        <p className="text-gray-700">
          Your <strong>4-Week Hormone Balance Health Guide</strong> is on the way.
          <br />Please check your inbox—if you don’t see it in a few minutes, check spam as well.
        </p>
        <p className="text-sm text-gray-500 mt-4">
          Didn’t get it? Contact us at <a className="underline" href="mailto:support@keto-meal.com">support@keto-meal.com</a>.
        </p>

        <Link href="/" className="inline-block mt-6 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full font-medium">
          Back to Home
        </Link>
      </div>
    </div>
  )
}
