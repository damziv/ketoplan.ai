import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

export default function SuccessPage() {
  const { t } = useTranslation("success");
  const router = useRouter();
  const [mealPlan, setMealPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [allowed, setAllowed] = useState(true);
  const [progress, setProgress] = useState(0);
  const [animationsComplete, setAnimationsComplete] = useState(false);

  const steps = t("steps", { returnObjects: true });

  useEffect(() => {
    const storedEmail = sessionStorage.getItem("email") || router.query.email;
    if (storedEmail) setEmail(storedEmail);
    else setError(t("error"));
  }, [router, t]);

  useEffect(() => {
    if (!email) return;

    const fetchPlan = async () => {
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
            setAllowed(false);
            setError("⏳ You can generate a new plan in " + (30 - daysDiff) + " days.");
            setLoading(false);
            return;
          }
        }

        // Continue if allowed
        const resp = await fetch("/api/generate-meal-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, quiz_answers: data.quiz_answers, locale: router.locale }),
        });

        if (!resp.ok || !resp.body) throw new Error("Plan generation failed");

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
              if (json === "[DONE]") {
                streamFinished = true;
              } else {
                const parsed = JSON.parse(json);
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

        // ✅ Save to DB
        await fetch("/api/save-meal-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, meal_plan: entries }),
        });

        // ✅ Track FB event
        if (typeof window !== "undefined" && window.fbq) {
          window.fbq("track", "Purchase", {
            value: 2.99,
            currency: "EUR",
          });
        }

        setTimeout(() => setAnimationsComplete(true), 3000);
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
  }, [email, router]);

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
        <h2 className="text-2xl font-bold mb-4">{t("title")}</h2>

        {error && (
          <p className="text-red-500 text-lg font-semibold mb-4">{error}</p>
        )}

        {!allowed && (
          <button
            className="mt-4 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
            onClick={() => router.push("/")}
          >
            {t("backHome")}
          </button>
        )}

        {loading && !error && (
          <div>
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
                  ></motion.div>
                </div>
              </motion.div>
            ))}
            <div className="flex justify-center mt-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="w-8 h-8 border-4 border-t-green-500 border-gray-300 rounded-full"
              ></motion.div>
            </div>
          </div>
        )}

        {mealPlan && allowed && animationsComplete && (
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
