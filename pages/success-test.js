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
    // ✅ MOCKED quiz answers
    const quizAnswers = {
      mood: "High stress or anxiety",
      energy: "I get energy crashes in the afternoon",
      meals: "2 meals per day",
      vegetables: ["Broccoli", "Spinach"],
      meat: ["Chicken", "Salmon"],
      afterEating: "Sleepy or low energy"
    };

    // ✅ MOCKED type mapping
    const types = [
      {
        typeName: "The Stress Snacker",
        conditions: {
          mood: ["High stress or anxiety", "Mood swings or irritability"],
          energy: ["I get energy crashes in the afternoon"],
          meals: ["1 meal per day", "2 meals per day"]
        },
        insights: [
          "You often snack to cope with stress — your plan shows calming, satisfying swaps.",
          "Your 2-meal pattern may cause energy dips — we’ll guide you to spread meals for steady focus.",
          "You love healthy proteins like chicken & salmon — your plan will use these for balanced mood & digestion."
        ]
      }
    ];

    let matchedType = null;

    for (const type of types) {
      let matches = true;
      for (const key in type.conditions) {
        const expected = type.conditions[key];
        const answer = quizAnswers[key];
        if (Array.isArray(answer)) {
          if (!answer.some(a => expected.includes(a))) {
            matches = false;
          }
        } else {
          if (!expected.includes(answer)) {
            matches = false;
          }
        }
      }
      if (matches) {
        matchedType = type;
        break;
      }
    }

    if (matchedType) {
      setTypeName(matchedType.typeName);
      setInsights(matchedType.insights);
    } else {
      setTypeName("The Balanced Eater");
      setInsights([
        "Your habits are mostly balanced — your plan fine-tunes meals for more steady energy.",
        "You’ll get simple recipes and smart swaps you’ll actually enjoy.",
        "Subtle tweaks can boost mood, digestion & focus naturally."
      ]);
    }
  }, []);

  const handleSubmit = () => {
    // TODO: Save age/email, fire Pixel Lead, etc.
    router.push("/payment");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-5">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-3xl text-left">

        {/* Header */}
        <h2 className="text-2xl font-bold mb-2 text-center">
          🎯 Your Personalized Health Snapshot
        </h2>
        <p className="text-center text-gray-600 mb-4">
          Based on your answers, you’re <strong>{typeName}</strong>.
        </p>

        {/* Insights */}
        <div className="grid gap-4 mb-6">
            {insights.map((item, idx) => (
             <div
                key={idx}
                className="bg-green-50 border border-green-100 p-4 rounded-lg shadow-sm flex items-start" >
                <div className="text-green-600 text-xl mr-3">✅</div>
                <p className="text-gray-700">
                {item}
                </p>
            </div>
        ))}
        </div>

        <p className="italic text-gray-700 mb-6">
          🔍 Next: Unlock your full AI plan with daily recipes, food swaps & a step-by-step roadmap to your goal.
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
