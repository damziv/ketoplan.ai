// pages/success.js
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

export default function SuccessPage() {
  const { t } = useTranslation("success");
  const router = useRouter();

  const [planData, setPlanData] = useState(null); // NEW: NaturalFix plan holder
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [allowed, setAllowed] = useState(true);
  const [progress, setProgress] = useState(0);
  const [animationsComplete, setAnimationsComplete] = useState(false);

  const steps = t("steps", { returnObjects: true });
  const isFromRenewal = router.query.fromRenewal === "true";
  const pdfRef = useRef(null);

  useEffect(() => {
    const storedEmail = sessionStorage.getItem("email") || router.query.email;
    if (storedEmail) setEmail(storedEmail);
    else setError(t("error"));
  }, [router, t]);

  useEffect(() => {
    if (!email) return;

    const fetchPlan = async () => {
      try {
        // 1) Get session & cooldown (unchanged)
        const res = await fetch("/api/get-latest-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to get session");

        const lastGenerated = data.last_meal_plan_at;
        const isSubscriber = data.is_subscriber;

        if (isSubscriber && lastGenerated) {
          const last = new Date(lastGenerated);
          const now = new Date();
          const daysDiff = Math.floor((now - last) / (1000 * 60 * 60 * 24));

          if (daysDiff < 30) {
            setAllowed(false);
            const daysLeft = 30 - daysDiff;
            const message = router.query.fromRenewal
               ? t("alreadyGenerated", { daysLeft })
               : t("canGenerateIn", { daysLeft });
            setError(message);
            setLoading(false);
            return;
          }
        }

        // 2) Generate NaturalFix plan (same endpoint name)
        const resp = await fetch("/api/generate-meal-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            quiz_answers: data.quiz_answers,
            locale: router.locale,
          }),
        });

        if (!resp.ok) {
          const errData = await resp.json().catch(() => ({}));
          throw new Error(errData.error || "Plan generation failed");
        }

        const reader = resp.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let jsonBuffer = "";
        let streamFinished = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const json = line.slice("data: ".length).trim();
            if (json === "[DONE]") {
              streamFinished = true;
            } else {
              const parsed = JSON.parse(json);

              // As soon as we see content tokens, clear any stale error
              if (!parsed?.choices?.[0]?.delta?.content) continue;
              if (error) setError("");

              jsonBuffer += parsed.choices?.[0]?.delta?.content || "";
            }
          }
        }

        if (!streamFinished) throw new Error("Stream ended unexpectedly");

        // NaturalFix JSON shape: { "plan": { ... } }
        const full = JSON.parse(jsonBuffer);

        if (!full?.plan) {
          throw new Error("Invalid plan format");
        }

        setPlanData(full);

        // Optional: Save to DB (update your API to accept { plan } OR keep disabled)
         await fetch("/api/save-meal-plan", {
           method: "POST",
          headers: { "Content-Type": "application/json" },
           body: JSON.stringify({ email, plan: full.plan, locale: router.locale || "en" })
         });

        if (typeof window !== "undefined" && window.fbq) {
          window.fbq("track", "Purchase", { value: 2.99, currency: "EUR" });
        }

        setTimeout(() => {
          setAnimationsComplete(true);
          setError("");
        }, 1200);
      } catch (err) {
        console.error("❌", err);
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();

    const interval = setInterval(() => {
      setProgress((prev) => (prev < 100 ? prev + 25 : 100));
    }, 1000);
    return () => clearInterval(interval);
  }, [email, router, error]);

  const downloadPDF = async () => {
    const input = pdfRef.current || document.getElementById("naturalfix-plan");
    if (!input) return;
    const canvas = await html2canvas(input, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position -= pageHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save("NaturalFix-Personalized-Plan.pdf");
  };

  const Section = ({ title, children }) => (
    <div className="mb-6 p-5 bg-white rounded-2xl shadow-sm text-left">
      <h3 className="text-xl font-semibold text-emerald-700 mb-2">{title}</h3>
      <div className="text-gray-700">{children}</div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-emerald-50 p-5">
      <div className="bg-white p-6 rounded-2xl shadow-md w-full max-w-4xl">
        <h2 className="text-2xl font-bold mb-2 text-center">
         {isFromRenewal ? t("renewalTitle") : t("pageTitle")}
        </h2>
        <p className="text-gray-600 text-center mb-4">
          {t("tagline")}
        </p>

        {error && (
          <p className="text-red-500 text-lg font-semibold mb-4 text-center">{error}</p>
        )}

        {!allowed && (
          <div className="text-center">
            <button
              className="mt-2 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
              onClick={() => router.push("/")}
            >
              {t("backHome")}
            </button>
          </div>
        )}

        {loading && !error && (
          <div className="mt-2">
            <p className="text-gray-800 text-lg font-semibold mb-1 text-center">{t("generating")}</p>
            <p className="text-sm text-gray-500 mb-4 text-center">{t("warning")}</p>

            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: progress >= (index + 1) * 25 ? 1 : 0.3, x: 0 }}
                transition={{ duration: 1 }}
                className="mb-4"
              >
                <p className="font-medium text-gray-700 mb-1">{step}</p>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-emerald-500"
                    animate={{ width: progress >= (index + 1) * 25 ? "100%" : "0%" }}
                    transition={{ duration: 1.2 }}
                  />
                </div>
              </motion.div>
            ))}

            <div className="flex justify-center mt-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="w-8 h-8 border-4 border-t-emerald-500 border-gray-300 rounded-full"
              />
            </div>
          </div>
        )}

        {planData && allowed && animationsComplete && (
          <>
            <div className="flex flex-col items-center gap-3 mt-4">
              <button
                onClick={downloadPDF}
                className="bg-emerald-600 text-white py-2 px-4 rounded-xl hover:bg-emerald-700"
              >
                {t("downloadBtn")}
              </button>
              <p className="text-gray-500 text-xs">
                {t("planEmailNote")}
              </p>
            </div>

            <div id="naturalfix-plan" ref={pdfRef} className="mt-6 bg-gray-50 p-4 rounded-xl">
              {/* Profile Summary */}
              <Section title={t("sections.profile")}>
                <ul className="flex flex-wrap gap-2 mb-3">
                  {(planData.plan.profile?.focusAreas || []).map((tag, i) => (
                    <li key={i} className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm">
                      {tag}
                    </li>
                  ))}
                </ul>
                {planData.plan.profile?.summary && <p className="mb-2">{planData.plan.profile.summary}</p>}
                {planData.plan.profile?.calorieHint && (
                  <p className="text-gray-600 text-sm">{planData.plan.profile.calorieHint}</p>
                )}
                {planData.plan.profile?.hormoneSupportNote && (
                  <p className="text-gray-600 text-sm">{planData.plan.profile.hormoneSupportNote}</p>
                )}
              </Section>

              {/* Nutrition Targets */}
              <Section title={t("sections.nutrition")}>
                  <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-emerald-50">
                    <h4 className="font-semibold mb-2">{t("sections.dailyTargets")}</h4>
                    <ul className="list-disc ml-5">
                      {Object.entries(planData.plan.nutrition?.targets || {}).map(([k, v]) => (
                        <li key={k}>
                          <span className="font-medium">{labelize(k)}:</span> {v}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="grid gap-4">
                    <div className="p-4 rounded-xl bg-emerald-50">
                     <h4 className="font-semibold mb-2">{t("sections.emphasize")}</h4>
                      <p className="text-sm text-gray-700">
                        {(planData.plan.nutrition?.emphasize || []).join(", ")}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-emerald-50">
                     <h4 className="font-semibold mb-2">{t("sections.limit")}</h4>
                      <p className="text-sm text-gray-700">
                        {(planData.plan.nutrition?.avoidOrLimit || []).join(", ")}
                      </p>
                    </div>
                  </div>
                </div>
              </Section>

              {/* Routine */}
              <Section title={t("sections.routine")}>
                <div className="grid md:grid-cols-3 gap-4">
                  {["morning", "daytime", "evening"].map((part) => (
                    <div key={part} className="p-4 rounded-xl bg-white border">
                      <h4 className="font-semibold capitalize mb-2">
                        {t(`sections.${part}`)}
                       </h4>
                      <ul className="list-disc ml-5 text-sm">
                        {(planData.plan.routine?.[part] || []).map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </Section>

              {/* Supplements */}
              <Section title={t("sections.supplements")}>
                <div className="grid md:grid-cols-2 gap-4">
                  {(planData.plan.supplements || []).map((s, i) => (
                    <div key={i} className="p-4 rounded-xl bg-white border">
                      <p className="font-semibold">{s.name}</p>
                      <p className="text-sm text-gray-700">{s.dose}</p>
                      {s.note && <p className="text-sm text-gray-600 mt-1">{s.note}</p>}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-3">
                 {t("sections.supplementsNote")}
                </p>
              </Section>

              {/* Movement */}
              <Section title={t("sections.movement")}>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-emerald-50">
                    <h4 className="font-semibold mb-2">{t("sections.weeklyStructure")}</h4>
                    <ul className="list-disc ml-5">
                      {(planData.plan.movement?.weeklyPlan || []).map((x, i) => <li key={i}>{x}</li>)}
                    </ul>
                  </div>
                  <div className="p-4 rounded-xl bg-emerald-50">
                    <h4 className="font-semibold mb-2">{t("sections.extras")}</h4>
                    <ul className="list-disc ml-5">
                      {(planData.plan.movement?.extras || []).map((x, i) => <li key={i}>{x}</li>)}
                    </ul>
                  </div>
                </div>
              </Section>

              {/* Stress & Sleep */}
              <Section title={t("sections.stressSleep")}>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-white border">
                    <h4 className="font-semibold mb-2">{t("sections.stressTools")}</h4>
                    <ul className="list-disc ml-5">
                      {(planData.plan.stressSleep?.stressTools || []).map((x, i) => <li key={i}>{x}</li>)}
                    </ul>
                  </div>
                  <div className="p-4 rounded-xl bg-white border">
                    <h4 className="font-semibold mb-2">{t("sections.sleepHygiene")}</h4>
                    <ul className="list-disc ml-5">
                      {(planData.plan.stressSleep?.sleepHygiene || []).map((x, i) => <li key={i}>{x}</li>)}
                    </ul>
                  </div>
                </div>
              </Section>

              {/* 7-Day Micro-Habits */}
              <Section title={t("sections.microHabits")}>
                <div className="grid md:grid-cols-2 gap-4">
                  {(planData.plan.microHabits7Day || []).map((h, i) => (
                    <div key={i} className="p-4 rounded-xl bg-emerald-50">
                      <p className="font-semibold">{h.day}</p>
                      <p className="text-gray-700">{h.habit}</p>
                    </div>
                  ))}
                </div>
              </Section>

              {/* Weekly Checklist */}
              <Section title={t("sections.microHabits")}>
                <ul className="list-disc ml-5">
                  {(planData.plan.weeklyChecklist || []).map((x, i) => <li key={i}>{x}</li>)}
                </ul>
              </Section>

              {/* Disclaimers */}
              {Array.isArray(planData.plan.disclaimers) && planData.plan.disclaimers.length > 0 && (
                <div className="text-xs text-gray-500">
                  {planData.plan.disclaimers.map((d, i) => (
                    <p key={i}>• {d}</p>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function labelize(key) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["success"])),
    },
  };
}
