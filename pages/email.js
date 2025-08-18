import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import { createClient } from "@supabase/supabase-js";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function EmailPage() {
  const { t } = useTranslation(["email", "success"]);
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [error, setError] = useState("");
  const [typeName, setTypeName] = useState("");
  const [insights, setInsights] = useState([]);
  const [quizAnswers, setQuizAnswers] = useState(null);

  // --- Restore session + detect type ---
  useEffect(() => {
    const run = async () => {
      const savedEmail = sessionStorage.getItem("email");
      const storedSessionId = sessionStorage.getItem("sessionId");
      if (savedEmail) setEmail(savedEmail);
      if (storedSessionId) setSessionId(storedSessionId);
      else if (savedEmail) await fetchSessionIdFromSupabase(savedEmail);

      let qa = null;
      try {
        qa = JSON.parse(sessionStorage.getItem("quizAnswers"));
      } catch {}

      if (!qa && (storedSessionId || sessionId)) {
        const { data, error } = await supabase
          .from("sessions")
          .select("quiz_answers")
          .eq("id", storedSessionId || sessionId)
          .single();
        if (!error && data?.quiz_answers) {
          qa = data.quiz_answers;
          sessionStorage.setItem("quizAnswers", JSON.stringify(qa));
        }
      }
      if (qa) setQuizAnswers(qa);

      // derive type from quiz answers
      const types = t("types", { ns: "email", returnObjects: true }) || {};
      const goal = qa?.["1"]?.[0]?.toLowerCase?.() || "";
      let typeKey = "balancedType";
      if (goal.includes("energy") || goal.includes("focus")) typeKey = "energySeeker";
      if (goal.includes("immunity") || goal.includes("digestion")) typeKey = "gutHealer";
      if (goal.includes("weight") || goal.includes("active")) typeKey = "fatBurner";
      if (goal.includes("tired") || goal.includes("fatigue")) typeKey = "stressReducer";
      const matched = types[typeKey] || {};
      setTypeName(matched.name || "");
      setInsights(matched.insights || []);
    };
    run();
  }, [t, sessionId]);

  const fetchSessionIdFromSupabase = async (email) => {
    const { data } = await supabase
      .from("sessions")
      .select("id")
      .eq("email", email)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    if (data) {
      setSessionId(data.id);
      sessionStorage.setItem("sessionId", data.id);
    }
  };

  const saveEmailToDatabase = async () => {
    const sid = sessionStorage.getItem("sessionId") || sessionId;
    if (!sid) return;
    await supabase.from("sessions").update({
      email,
      country: router.locale || "en",
    }).eq("id", sid);
  };

  const handleNext = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return setError(t("error.fillAll", { ns: "email" }));
    if (!emailRegex.test(email)) return setError(t("error.invalidEmail", { ns: "email" }));

    setError("");
    sessionStorage.setItem("email", email);
    await saveEmailToDatabase();

    if (typeof window !== "undefined" && window.fbq) window.fbq("track", "Lead");

    const { data } = await supabase
      .from("sessions")
      .select("is_subscriber,last_meal_plan_at")
      .eq("email", email)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (data?.is_subscriber) {
      const last = new Date(data.last_meal_plan_at);
      const diffDays = (Date.now() - last) / (1000 * 60 * 60 * 24);
      if (isNaN(diffDays) || diffDays >= 30) router.push("/success");
      else {
        alert("✅ You already received a plan this month. We’ll notify you when you can generate a new one.");
        router.push("/");
      }
    } else {
      router.push("/pre-payment");
    }
  };

  // Section component like success page
  const Section = ({ title, children }) => (
    <div className="mb-6 p-5 bg-white rounded-2xl shadow-sm text-left">
      <h3 className="text-xl font-semibold text-emerald-700 mb-2">{title}</h3>
      <div className="text-gray-700">{children}</div>
    </div>
  );

  // --- Preview data ---
  const profileSummary = useMemo(() => {
    const goal = quizAnswers?.["1"]?.[0];
    const gender = quizAnswers?.["2"]?.[0];
    const activity = quizAnswers?.["7"]?.[0];
    const focusAreas = [typeName, ...(insights.slice(0, 2) || [])].filter(Boolean);
    return {
      focusAreas,
      summary: goal
        ? t("preview.profileSummary", { ns: "email", goal })
        : t("preview.profileFallback", { ns: "email" }),
      details: [
        gender ? { label: t("preview.gender", { ns: "email" }), value: gender } : null,
        activity ? { label: t("preview.activity", { ns: "email" }), value: activity } : null,
      ].filter(Boolean),
    };
  }, [quizAnswers, typeName, insights, t]);

  const nutritionTargets = useMemo(() => {
    const base = [
      { k: t("preview.netCarbs", { ns: "email" }), v: "20–40 g/day" },
      { k: t("preview.protein", { ns: "email" }), v: "1.6–2.0 g/kg" },
      { k: t("preview.fats", { ns: "email" }), v: t("preview.fatsValue", { ns: "email" }) },
    ];
    if (typeName.toLowerCase().includes("stress")) {
      base.push({ k: t("preview.magnesium", { ns: "email" }), v: t("preview.magnesiumValue", { ns: "email" }) });
    }
    if (typeName.toLowerCase().includes("gut")) {
      base.push({ k: t("preview.fiber", { ns: "email" }), v: t("preview.fiberValue", { ns: "email" }) });
    }
    return base;
  }, [typeName, t]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-emerald-50 p-5">
      <div className="bg-white p-6 rounded-2xl shadow-md w-full max-w-4xl">
        {/* Title & email */}
        <h2 className="text-2xl font-bold mb-2 text-center">{t("preview.headline", { ns: "email" })}</h2>
        <p className="text-gray-600 text-center mb-4">{t("preview.subheadline", { ns: "email" })}</p>
        <div className="max-w-xl mx-auto mb-4 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
          <input
            type="email"
            placeholder={t("fields.email", { ns: "email" })}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            onClick={handleNext}
            disabled={!email}
            className={`w-full md:w-auto px-6 py-4 text-center rounded-xl font-bold transition-all text-sm ${
              email ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-emerald-300 text-white cursor-not-allowed"
            }`}
          >
            {t("continue", { ns: "email" })} →
          </button>
        </div>
        {error && <p className="text-sm text-red-500 text-center mb-2">{error}</p>}

        {/* Preview sections (Profile + Nutrition visible, rest blurred) */}
        <Section title={t("sections.profile", { ns: "success" })}>
          <ul className="flex flex-wrap gap-2 mb-3">
            {profileSummary.focusAreas.map((tag, i) => (
              <li key={i} className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm">{tag}</li>
            ))}
          </ul>
          <p>{profileSummary.summary}</p>
          {profileSummary.details.map((row, i) => (
            <p key={i} className="flex justify-between text-sm"><span>{row.label}</span><span>{row.value}</span></p>
          ))}
        </Section>

        <Section title={t("sections.nutrition", { ns: "success" })}>
          <ul className="list-disc ml-5">
            {nutritionTargets.map((row, i) => (
              <li key={i}><strong>{row.k}:</strong> {row.v}</li>
            ))}
          </ul>
        </Section>

        {/* Blurred lock overlay for rest */}
        <div className="relative">
          <div className="filter blur-sm select-none">
            <Section title={t("sections.routine", { ns: "success" })}>
              <p>…</p>
            </Section>
            <Section title={t("sections.movement", { ns: "success" })}>
              <p>…</p>
            </Section>
            {/* etc */}
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white/80 rounded-xl p-4 text-center shadow-sm">
              <p className="font-medium">{t("preview.lockTitle", { ns: "email" })}</p>
              <p className="text-xs">{t("preview.lockCopy", { ns: "email" })}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["email", "success"])),
    },
  };
}
