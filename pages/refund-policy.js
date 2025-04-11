import Link from "next/link";

export default function RefundPolicy() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-3xl text-left">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">🔄 Refund Policy</h1>

        <p className="text-gray-700 mb-4">
          Last updated: <strong>March 2025</strong>
        </p>

        <h2 className="text-xl font-semibold text-gray-800 mt-6">1. Introduction</h2>
        <p className="text-gray-700">
          keto-meal.com ("we", "our", "us") aims to provide high-quality digital meal plans tailored to your needs. 
          As our services are digital products, our refund policy complies with the **EU Consumer Rights Directive**.
        </p>

        <h2 className="text-xl font-semibold text-gray-800 mt-6">2. Right to Withdrawal (EU Law)</h2>
        <p className="text-gray-700">
          Under **EU law**, digital purchases are **not eligible for a refund once the service has started** or the 
          digital product has been accessed. By purchasing our digital meal plan, you agree that **you waive your right 
          to withdraw** once the service is delivered.
        </p>

        <h2 className="text-xl font-semibold text-gray-800 mt-6">3. Eligibility for Refund</h2>
        <p className="text-gray-700">
          Refunds will only be considered in the following cases:
        </p>
        <ul className="list-disc pl-5 text-gray-700">
          <li>❌ You were charged multiple times due to a technical issue.</li>
          <li>❌ The digital meal plan was **not delivered** within 24 hours.</li>
          <li>❌ There was an error on our part, such as sending **incorrect meal plans**.</li>
          <li>❌ The service did not match the description on our website.</li>
        </ul>
        <p className="text-gray-700 mt-2">
          If you qualify for a refund under these conditions, please **contact us within 7 days** of purchase.
        </p>

        <h2 className="text-xl font-semibold text-gray-800 mt-6">4. How to Request a Refund</h2>
        <p className="text-gray-700">
          To request a refund, send an email to:
        </p>
        <p className="text-gray-700 font-bold">
          📩 <a href="mailto:support@ai-mealprep.com" className="text-blue-600 hover:underline">support@keto-meal.com</a>
        </p>
        <p className="text-gray-700 mt-2">Please include:</p>
        <ul className="list-disc pl-5 text-gray-700">
          <li>✅ Your **order ID** or **email used for purchase**.</li>
          <li>✅ A brief explanation of your issue.</li>
          <li>✅ Screenshots (if applicable).</li>
        </ul>

        <h2 className="text-xl font-semibold text-gray-800 mt-6">5. Refund Processing Time</h2>
        <p className="text-gray-700">
          If your refund request is **approved**, the amount will be credited back to your original payment method within:
        </p>
        <ul className="list-disc pl-5 text-gray-700">
          <li>💳 **Credit/Debit Card**: 5-10 business days</li>
          <li>💰 **PayPal/Stripe**: 3-5 business days</li>
          <li>🏦 **Bank Transfer**: 7-14 business days</li>
        </ul>

        <h2 className="text-xl font-semibold text-gray-800 mt-6">6. Non-Refundable Cases</h2>
        <p className="text-gray-700">
          The following cases are **not eligible** for a refund:
        </p>
        <ul className="list-disc pl-5 text-gray-700">
          <li>⚠️ You changed your mind after purchasing.</li>
          <li>⚠️ You completed the quiz and received your **personalized meal plan**.</li>
          <li>⚠️ Your dissatisfaction is based on **subjective personal preference**.</li>
          <li>⚠️ You failed to provide the correct email and did not receive the plan.</li>
        </ul>

        <h2 className="text-xl font-semibold text-gray-800 mt-6">7. Contact Us</h2>
        <p className="text-gray-700">
          If you have further questions about refunds, reach out to:
        </p>
        <p className="text-gray-700 font-bold">
          📩 <a href="mailto:support@keto-meal.com" className="text-blue-600 hover:underline">support@keto-meal.com</a>
        </p>

        {/* Back to Home Button */}
        <div className="text-center mt-6">
          <Link href="/" className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
