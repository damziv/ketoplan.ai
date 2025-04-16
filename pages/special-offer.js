// pages/special-offer.js
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';

export default function SpecialOffer() {
  const router = useRouter();

  useEffect(() => {
    // Optionally store ref in session to track special offer funnel
    sessionStorage.setItem('fromSpecialOffer', 'true');
  }, []);

  const handleClaimOffer = () => {
    router.push('/payment');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-yellow-50 px-6 text-center">
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white shadow-lg rounded-2xl p-8 max-w-lg"
      >
        <h1 className="text-3xl font-extrabold text-green-600 mb-4">
          🎉 Special Limited-Time Offer!
        </h1>
        <p className="text-gray-700 text-lg mb-4">
          Get your personalized 5-day Keto Meal Plan <strong>for only €2.99</strong> (was €5.99).
        </p>
        <p className="text-gray-600 mb-6">
          Plus, receive a bonus recipe book full of delicious keto meals!
        </p>

        <button
          onClick={handleClaimOffer}
          className="bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition"
        >
          Claim My Plan Now →
        </button>

        <p className="text-sm text-gray-500 mt-4">
          This offer is available for a limited time only.
        </p>
      </motion.div>
    </div>
  );
}
