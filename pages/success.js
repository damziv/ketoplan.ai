// Updated SuccessPage with debug logging
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

        console.log("✅ Successfully parsed OpenAI response");

        let extractedPlan = [];
        if (parsedMealPlan.mealPlan && typeof parsedMealPlan.mealPlan === "object") {
          extractedPlan = Object.entries(parsedMealPlan.mealPlan).map(([key, value]) => ({
            day: key,
            ...value
          }));
        } else {
          throw new Error("Meal plan format is invalid or empty.");
        }

        try {
          setMealPlan({ meal_plan: extractedPlan });
        } catch (err) {
          console.error("❌ Error while setting mealPlan state:", err);
        }

        console.log("📦 Sending meal_plan to /api/save-meal-plan:", extractedPlan);

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

  return null; // Keep the UI part unchanged for brevity
}
