// Updated SuccessPage with transformation of mealPlan object into array
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function SuccessPage() {
  const router = useRouter();
  const [mealPlan, setMealPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [quizAnswers, setQuizAnswers] = useState(null);
  const [progress, setProgress] = useState(0);
  const [animationsComplete, setAnimationsComplete] = useState(false);
  const [streamingText, setStreamingText] = useState("");

  const steps = [
    "Demographic Profile",
    "Health and Medical Conditions",
    "Calculating Nutrition Needs",
    "Activity and Habits",
    "Finalizing Your Meal Plan",
  ];

  useEffect(() => {
    let storedEmail = sessionStorage.getItem("email") || router.query.email;

    if (!storedEmail) {
      fetch("/api/fetch-latest-email")
        .then((res) => res.json())
        .then((data) => {
          if (data.email) {
            setEmail(data.email);
            sessionStorage.setItem("email", data.email);
          } else {
            setError("No email found. Please restart the process.");
          }
        })
        .catch(() => setError("Error retrieving email from database."))
        .finally(() => setLoading(false));
    } else {
      setEmail(storedEmail);
    }
  }, [router]);

  useEffect(() => {
    if (!email) return;

    const fetchSessionAndGenerate = async () => {
      try {
        const sessionRes = await fetch("/api/get-latest-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        const sessionData = await sessionRes.json();
        if (!sessionRes.ok || !sessionData.quiz_answers) {
          throw new Error("No quiz data found for this session.");
        }

        setQuizAnswers(sessionData.quiz_answers);

        const response = await fetch("/api/generate-meal-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, quiz_answers: sessionData.quiz_answers }),
        });

        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(errorData || "Failed to generate meal plan");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let result = "";
        let done = false;

        while (!done) {
          const { value, done: doneReading } = await reader.read();
          done = doneReading;
          const chunkValue = decoder.decode(value, { stream: true });
          const lines = chunkValue.split("\n");
          for (let line of lines) {
            if (line.startsWith("data: ")) {
              const json = line.slice("data: ".length).trim();
              if (json === "[DONE]") {
                done = true;
                break;
              }
              try {
                const parsed = JSON.parse(json);
                const token = parsed.choices?.[0]?.delta?.content || "";
                result += token;
                setStreamingText((prev) => prev + token);
              } catch (err) {
                console.warn("Could not parse chunk line:", line);
              }
            }
          }
        }

        let cleaned = result.trim();
        const match = cleaned.match(/{[\s\S]*}/);

        let parsedMealPlan;
        try {
          if (!match) throw new Error("No JSON object found in stream");
          const jsonEndIndex = match[0].lastIndexOf("}") + 1;
          const safeJSON = match[0].slice(0, jsonEndIndex);
          parsedMealPlan = JSON.parse(safeJSON);
        } catch (e) {
          console.error("❌ Failed to parse streamed JSON:", e, match ? match[0] : cleaned);
          throw new Error("Received invalid meal plan format.");
        }

        setStreamingText("");

        let extractedPlan = [];
        if (parsedMealPlan.mealPlan && typeof parsedMealPlan.mealPlan === "object") {
          extractedPlan = Object.entries(parsedMealPlan.mealPlan).map(([key, value]) => ({
            day: key,
            ...value
          }));
        } else {
          throw new Error("Meal plan format is invalid or empty.");
        }

        setMealPlan({ meal_plan: extractedPlan });

        try {
          const saveRes = await fetch("/api/save-meal-plan", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, meal_plan: extractedPlan }),
          });

          if (!saveRes.ok) {
            const text = await saveRes.text();
            console.error("❌ Failed to save meal plan:", text);
          }
        } catch (e) {
          console.error("❌ Exception during save-meal-plan request:", e);
        }

        setTimeout(() => setAnimationsComplete(true), 3000);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    let interval = setInterval(() => {
      setProgress((prev) => {
        if (prev < 100) return prev + 25;
        clearInterval(interval);
        fetchSessionAndGenerate();
        return prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [email]);

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

    pdf.save("Meal_Plan.pdf");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-5">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-3xl text-center">
        <h2 className="text-2xl font-bold mb-4">Payment Successful 🎉</h2>

        {(!animationsComplete || loading) && (
          <>
            <p className="mb-4">Your meal plan is being generated. Please wait...</p>
            <p className="text-gray-600 text-sm mb-2">Process can take 1min, do not leave this page!</p>
          </>
        )}

        {loading && (
          <div className="w-full text-left">
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
                    className="h-full bg-green-500"
                    initial={{ width: '0%' }}
                    animate={{ width: progress >= (index + 1) * 25 ? '100%' : '0%' }}
                    transition={{ duration: 1.3 }}
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

        {error && <p className="text-red-500">{error}</p>}

        {mealPlan && animationsComplete && mealPlan.meal_plan && Array.isArray(mealPlan.meal_plan) && (
          <>
            <h3 className="text-lg font-semibold mt-4">
              Your 5-Day Personalized Meal Plan with Recipes 📖
            </h3>

            <button
              onClick={downloadPDF}
              className="mt-4 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
            >
              📥 Download PDF
            </button>

            <div id="meal-plan-content" className="text-left bg-gray-100 p-4 rounded-md overflow-auto mt-2">
              {mealPlan.meal_plan.map((day, index) => (
                <div key={index} className="mb-6 p-4 bg-white rounded-lg shadow-md">
                  <h3 className="text-lg font-bold text-green-600">📅 {day.day}</h3>
                  {["breakfast", "lunch", "dinner"].map((mealType) => (
                    <div key={mealType} className="mt-4">
                      <h4 className="text-md font-semibold text-gray-900">
                        🍴 {day[mealType]?.name || "No meal available"}
                      </h4>
                      <p className="text-sm font-bold text-gray-700">Ingredients:</p>
                      <ul className="list-disc pl-5 text-sm text-gray-700">
                        {day[mealType]?.ingredients?.map((ingredient, i) => (
                          <li key={i}>{ingredient}</li>
                        )) || <li>No ingredients available</li>}
                      </ul>
                      <p className="text-sm font-bold text-gray-700 mt-2">Instructions:</p>
                      <p className="text-sm text-gray-700">
                        {day[mealType]?.instructions || "No instructions available"}
                      </p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </>
        )}

        <button
          className="mt-4 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
          onClick={() => router.push("/")}
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}
