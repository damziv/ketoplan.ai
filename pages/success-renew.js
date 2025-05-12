import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

export default function SuccessRenewPage() {
  const { t } = useTranslation("success");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [mealPlan, setMealPlan] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [animationsComplete, setAnimationsComplete] = useState(false);
  const [allowed, setAllowed] = useState(false);

  const steps = t("steps", { returnObjects: true });

  // Step 1: Get email
  useEffect(() => {
    const stored = sessionStorage.getItem("email") || router.query.email;
    if (!stored) {
      setError(t("error"));
      setLoading(false);
    } else {
      setEmail(stored);
    }
  }, [router, t]);

  // Step 2: Check last plan date
  useEffect(() => {
    if (!email) return;

    const checkEligibility = async () => {
      try {
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
            setError(`✅ You already generated your plan. Come back in ${30 - daysDiff} day(s).`);
            setAllowed(false);
            setLoading(false);
            return;
          }
        }

        setQuizAnswers(data.quiz_answers);
        setAllowed(true);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    checkEligibility();
  }, [email]);

  // Step 3: Generate plan
  useEffect(() => {
    if (!allowed || !quizAnswers) return;

    const generatePlan = async () => {
      try {
        const resp = await fetch("/api/generate-meal-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, quiz_answers: quizAnswers, locale: router.locale }),
        });

        if (!resp.ok || !resp.body) {
          const errData = await resp.json();
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
            if (line.startsWith("data: ")) {
              const json = line.slice("data: ".length).trim();
              if (json === "[DONE]") streamFinished = true;
              else {
                const parsed = JSON.parse(json);
                if (!parsed?.choices?.[0]?.delta?.content) continue;
                setError("");
                jsonBuffer += parsed.choices?.[0]?.delta?.content || "";
              }
            }
          }
        }

        if (!streamFinished) throw new Error("Stream ended unexpectedly");

        const parsed = JSON.parse(jsonBuffer);
        const entries = Object.entries(parsed.mealPlan).map(([day, meals]) => ({
          day,
          ...meals,
        }));

        setMealPlan({ meal_plan: entries });

        await fetch("/api/save-meal-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, meal_plan: entries }),
        });

        setTimeout(() => {
          setAnimationsComplete(true);
        }, 3000);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    generatePlan();
  }, [allowed, quizAnswers, email, router]);

  // Progress animation
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => (prev < 100 ? prev + 25 : 100));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const downloadPDF = async () => {
    const input = document.getElementById("meal-plan-content");
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

    pdf.save("Keto-Meal-Plan.pdf");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-5">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-3xl text-center">
        <h2 className="text-2xl font-bold mb-4">{t("renewalTitle")}</h2>

        {error && <p className="text-red-500 text-lg font-semibold mb-4">{error}</p>}

        {!allowed && (
          <button
            className="mt-4 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
            onClick={() => router.push("/")}
          >
            {t("backHome")}
          </button>
        )}

        {loading && !error && (
          <>
            <p className="text-gray-800 text-lg font-semibold mb-1">{t("generating")}</p>
            <p className="text-sm text-gray-500 mb-4">{t("warning")}</p>

            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: progress >= (index + 1) * 25 ? 1 : 0.3, x: 0 }}
                transition={{ duration: 1 }}
                className="mb-4 text-left"
              >
                <p className="font-medium text-gray-700 mb-1">{step}</p>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-green-500"
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
                className="w-8 h-8 border-4 border-t-green-500 border-gray-300 rounded-full"
              />
            </div>
          </>
        )}

        {mealPlan && animationsComplete && (
          <>
            <h3 className="text-lg font-semibold mt-4">{t("planTitle")}</h3>
            <p className="text-gray-600 text-sm">{t("planEmailNote")}</p>
            <button
              onClick={downloadPDF}
              className="mt-4 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
            >
              {t("downloadBtn")}
            </button>

            <div id="meal-plan-content" className="mt-4 bg-gray-100 p-4 rounded-md text-left">
              {mealPlan.meal_plan.map((day, idx) => (
                <div key={idx} className="mb-6 p-4 bg-white rounded-lg shadow-md">
                  <h3 className="text-lg font-bold text-green-600">📅 {day.day}</h3>
                  {Object.entries(day).map(([mealType, meal]) => {
                    if (mealType === "day") return null;
                    return (
                      <div key={mealType} className="mt-4">
                        <h4 className="font-semibold">{meal.name}</h4>
                        <p className="text-sm font-bold">{t("ingredients")}</p>
                        <ul className="list-disc pl-5 text-sm">
                          {meal.ingredients?.map((i, j) => <li key={j}>{i}</li>)}
                        </ul>
                        <p className="text-sm font-bold mt-2">{t("instructions")}</p>
                        <p className="text-sm">{meal.instructions}</p>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </>
        )}
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
