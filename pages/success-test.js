import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

export default function WellnessEmailPageTeaser() {
  const { t } = useTranslation("success");
  const router = useRouter();

  const [typeName, setTypeName] = useState("");
  const [insights, setInsights] = useState([]);
  const [age, setAge] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    // ✅ Real visitor answers — as if pulled from DB/session
    const quizAnswers = {
      "1": ["Energie und Konzentration steigern"], // Boost energy & focus
      "2": ["3 Mahlzeiten pro Tag"],               // 3 meals per day
      "3": ["Weiblich"],                           // Female
      "4": ["Hähnchen"],                           // Chicken
      "5": ["Spinat", "Kopfsalat"],                // Spinach, Lettuce
      "6": ["Eier", "Butter"],                     // Eggs, Butter
      "7": ["Ich fühle mich die meiste Zeit müde"],// Tired most of the time
      "8": ["Niedergeschlagene Stimmung oder Müdigkeit"], // Low mood or fatigue
      "9": ["Keine"],                              // No allergies
      "10": ["Müde oder energielos"]               // Sleepy or low energy
    };

    // ✅ Simple manual match for this scenario
    const type = {
      typeName: "The Energy Seeker",
      insights: [
        "Your goal is to boost energy & focus — your plan rebuilds steady fuel for mind & mood.",
        "You eat 3 meals daily with chicken, eggs & greens — perfect base for balanced energy, but timing & pairing matter.",
        "Feeling tired & low mood shows your meals may spike & drop your energy — your plan balances this naturally.",
        "Get step-by-step recipes, food swaps & daily tips to feel steady energy, clear mind & lifted mood — without cutting your favorites."
      ]
    };

    setTypeName(type.typeName);
    setInsights(type.insights);
  }, []);

  const handleSubmit = () => {
    // 🔑 Here you’d save to DB + fire Pixel event
    router.push("/payment");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-5">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-3xl text-left">

        {/* Header */}
        <h2 className="text-2xl font-bold mb-2 text-center">
          🎯 Your Personalized Health Snapshot
        </h2>
        <p className="text-center text-gray-600 mb-6">
          Based on your answers, you’re <strong>{typeName}</strong>.
        </p>

        {/* Premium Insights */}
        <div className="grid gap-4 mb-6">
          {insights.map((item, idx) => (
            <div
              key={idx}
              className="bg-green-50 border border-green-100 p-4 rounded-lg shadow-sm flex items-start"
            >
              <div className="text-green-600 text-xl mr-3">✅</div>
              <p className="text-gray-700">{item}</p>
            </div>
          ))}
        </div>

        <p className="italic text-gray-700 mb-6">
          🔍 Next: Unlock your full AI plan with daily recipes, food swaps & a clear step-by-step roadmap to feel your best.
        </p>

        {/* Form */}
        <div className="mt-4">
          <label htmlFor="age" className="block text-sm font-medium mb-1">Your age</label>
          <input
            id="age"
            type="number"
            placeholder="e.g. 35"
            className="w-full border p-2 rounded mb-4"
            value={age}
            onChange={(e) => setAge(e.target.value)}
          />

          <label htmlFor="email" className="block text-sm font-medium mb-1">Your email</label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            className="w-full border p-2 rounded mb-4"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <button
            className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700"
            onClick={handleSubmit}
          >
            📩 Send my full plan
          </button>

          <p className="text-xs text-gray-500 mt-2 text-center">
            Your plan unlocks instantly after secure checkout.
          </p>
        </div>
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
