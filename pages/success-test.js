import { useEffect } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

export default function WellnessSuccessPage() {
  const { t } = useTranslation("success");
  const router = useRouter();

  useEffect(() => {
    // Optional: any tracking here
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-5">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-3xl text-left">
        <h2 className="text-2xl font-bold mb-4 text-center">
          🎯 Personalized Wellness Guidance
        </h2>

        <p className="mb-4">
          ✅ <strong>Issues spotted:</strong>
          <ul className="list-disc pl-6 mt-2">
            <li>Blood sugar swings due to low fiber and high animal fat.</li>
            <li>Limited vegetable variety means low micronutrient range.</li>
            <li>Heavy meals = sleepy digestion + afternoon crashes.</li>
            <li>Possible lack of healthy Omega-3 fats for brain + mood.</li>
          </ul>
        </p>

        <p className="mb-4">
          ✅ <strong>Key fixes:</strong>
          <ul className="list-disc pl-6 mt-2">
            <li>Add more colorful veggies: spinach, peppers, carrots, broccoli.</li>
            <li>Include slow carbs: quinoa, oats, brown rice, beans.</li>
            <li>Use healthy fats daily: nuts, seeds, avocado, olive oil.</li>
            <li>Drink 1.5–2L water daily. Swap some coffee for green tea.</li>
            <li>Try adaptogens (Ashwagandha, Rhodiola) for stress (optional).</li>
          </ul>
        </p>

        <p className="mb-4">
          ✅ <strong>Easy daily checklist:</strong>
          <ul className="list-disc pl-6 mt-2">
            <li><strong>Breakfast:</strong> Eggs + greens + avocado.</li>
            <li><strong>Lunch:</strong> Lean meat or fish + lots of veggies + whole grains.</li>
            <li><strong>Snack:</strong> Nuts or berries to keep blood sugar stable.</li>
            <li><strong>Dinner:</strong> Light — veggies + fish or legumes.</li>
            <li>Get fresh air + short walk after meals if possible.</li>
          </ul>
        </p>

        <p className="mb-4">
          ✅ <strong>Focus + mood:</strong> Stay hydrated, get daylight, breathe deeply, sleep well, and keep dinners lighter.
        </p>

        <button
          className="mt-4 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
          onClick={() => router.push("/")}
        >
          Back Home
        </button>
      </div>
    </div>
  );
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["success"])),
    },
  };
}
