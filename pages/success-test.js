import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

/**
 * EXPECTED API STREAM (SSE) SCHEMA from /api/generate-naturalfix-plan
 * {
 *   "plan": {
 *     "profile": {
 *       "focusAreas": ["energy","digestion","stress"],
 *       "summary": "Short 2-3 sentence overview tailored to user",
 *       "calorieHint": "Optional, gentle—not diet-y",
 *       "hormoneSupportNote": "Optional, friendly tip"
 *     },
 *     "nutrition": {
 *       "targets": {
 *         "proteinPerDay": "80–100 g",
 *         "carbsPerDay": "70–120 g (mostly from veg/fruit)",
 *         "fatsPerDay": "Healthy fats, 60–80 g",
 *         "hydration": "2.0–2.5 L water"
 *       },
 *       "emphasize": ["eggs","berries","leafy greens","olives","yogurt (if tolerated)"],
 *       "avoidOrLimit": ["ultra-processed snacks","sugary drinks","late caffeine"]
 *     },
 *     "routine": {
 *       "morning": ["Wake, hydrate w/ mineral water + pinch of salt","Light mobility 5–8 min","Protein-forward breakfast"],
 *       "daytime": ["Balanced lunch template","Walk 10–15 min after meals","Sunlight break"],
 *       "evening": ["Digital dimming 60–90 min before bed","Magnesium glycinate 200–300 mg (optional)","Sleep wind-down ritual"]
 *     },
 *     "supplements": [
 *       {"name":"Magnesium glycinate","dose":"200–300 mg in evening","note":"sleep & muscle relaxation"},
 *       {"name":"Omega-3 (EPA/DHA)","dose":"1–2 g/day with meals","note":"mood & inflammation"}
 *     ],
 *     "movement": {
 *       "weeklyPlan": [
 *         "3× brisk walks (20–30 min)",
 *         "2× strength sessions (full body, 25–35 min)",
 *         "1× mobility or yoga (20 min)"
 *       ],
 *       "extras": ["Post-meal strolls 5–10 min", "Take stairs when possible"]
 *     },
 *     "stressSleep": {
 *       "stressTools": ["Box breathing 4×4×4×4 (2–3 min)","Journaling prompt"],
 *       "sleepHygiene": ["Consistent bed/wake times","Cool, dark room","No heavy meals 2–3h pre-bed"]
 *     },
 *     "microHabits7Day": [
 *       {"day":"Day 1","habit":"Hydration target + 10-min walk"},
 *       {"day":"Day 2","habit":"Protein at breakfast + sunlight 5–10 min"},
 *       {"day":"Day 3","habit":"Strength mini-circuit 20–25 min"},
 *       {"day":"Day 4","habit":"Wind-down ritual 30–45 min"},
 *       {"day":"Day 5","habit":"Veg-loaded lunch template"},
 *       {"day":"Day 6","habit":"Yoga/mobility 15–20 min"},
 *       {"day":"Day 7","habit":"Reflect: wins & tweaks"}
 *     ],
 *     "weeklyChecklist": [
 *       "Hit hydration target 5+ days",
 *       "2+ strength sessions",
 *       "Screens off 60 min before bed, 4 nights"
 *     ],
 *     "disclaimers": [
 *       "This plan is educational and not medical advice.",
 *       "Consult your healthcare provider before supplements."
 *     ]
 *   }
 * }
 */

export default function NaturalFixPreview() {
  const router = useRouter();
  const { t } = useTranslation("success"); // reuse if you like; or make a new ns later

  const [loading, setLoading] = useState(true);
  const [streamError, setStreamError] = useState("");
  const [plan, setPlan] = useState(null);
  const [progress, setProgress] = useState(0);
  const [useMock, setUseMock] = useState(true); // toggle to preview layout without API
  const pdfRef = useRef(null);

  // --- mock payload for layout/dev ---
  const mockPlan = useMemo(
    () => ({
      plan: {
        profile: {
          focusAreas: ["energy", "digestion", "stress"],
          summary:
            "Based on your answers, this plan emphasizes steady energy, calmer stress response, and gentler digestion with food-first habits and simple daily routines.",
          calorieHint:
            "We’ll keep portions satisfying—no extreme dieting needed.",
          hormoneSupportNote:
            "We’ll use fiber-rich veggies, quality fats, and sleep-friendly routines to support hormone balance naturally.",
        },
        nutrition: {
          targets: {
            proteinPerDay: "80–100 g",
            carbsPerDay: "70–120 g (mostly from veg/fruit)",
            fatsPerDay: "60–80 g (olive oil, avocado, nuts)",
            hydration: "2.0–2.5 L water",
          },
          emphasize: [
            "eggs",
            "berries",
            "leafy greens",
            "olive oil",
            "Greek yogurt (if tolerated)",
          ],
          avoidOrLimit: [
            "ultra-processed snacks",
            "sugary drinks",
            "late caffeine",
          ],
        },
        routine: {
          morning: [
            "Hydrate on waking (water + pinch of sea salt)",
            "Sunlight 5–10 min",
            "Protein-forward breakfast",
          ],
          daytime: [
            "Balanced lunch template (protein + veg + olive oil)",
            "Walk 10–15 min after meals",
            "2–3 stretch breaks",
          ],
          evening: [
            "Screens dim 60–90 min pre-bed",
            "Optional: magnesium glycinate 200–300 mg",
            "Light reading or breathwork",
          ],
        },
        supplements: [
          {
            name: "Magnesium glycinate",
            dose: "200–300 mg in the evening",
            note: "sleep & relaxation",
          },
          {
            name: "Omega-3 (EPA/DHA)",
            dose: "1–2 g/day with meals",
            note: "mood & inflammation",
          },
        ],
        movement: {
          weeklyPlan: [
            "3× brisk walks (20–30 min)",
            "2× strength sessions (25–35 min)",
            "1× mobility or yoga (20 min)",
          ],
          extras: ["Post-meal strolls 5–10 min", "Take stairs when possible"],
        },
        stressSleep: {
          stressTools: [
            "Box breathing 4-4-4-4 (2–3 min)",
            "Brief journaling: 3 wins, 1 tweak",
          ],
          sleepHygiene: [
            "Consistent bed/wake times",
            "Cool, dark room",
            "No heavy meals 2–3h pre-bed",
          ],
        },
        microHabits7Day: [
          { day: "Day 1", habit: "Hydration target + 10-min walk" },
          { day: "Day 2", habit: "Protein at breakfast + sunlight 5–10 min" },
          { day: "Day 3", habit: "Strength mini-circuit 20–25 min" },
          { day: "Day 4", habit: "Wind-down ritual 30–45 min" },
          { day: "Day 5", habit: "Veg-loaded lunch template" },
          { day: "Day 6", habit: "Yoga/mobility 15–20 min" },
          { day: "Day 7", habit: "Reflect: wins & tweaks" },
        ],
        weeklyChecklist: [
          "Hit hydration target 5+ days",
          "2+ strength sessions",
          "Screens off 60 min before bed, 4 nights",
        ],
        disclaimers: [
          "This plan is educational and not medical advice.",
          "Consult your healthcare provider before supplements.",
        ],
      },
    }),
    []
  );

  useEffect(() => {
    let interval;
    if (loading) {
      interval = setInterval(() => {
        setProgress((p) => (p < 95 ? p + 5 : 95));
      }, 400);
    }
    return () => interval && clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    if (useMock) {
      setPlan(mockPlan);
      setLoading(false);
      setProgress(100);
      return;
    }

    // ---- live stream from API ----
    (async () => {
      try {
        setLoading(true);
        setStreamError("");

        // You can pass email/quiz_answers/locale if needed; for now this is a smoke test
        const resp = await fetch("/api/generate-naturalfix-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            // email,
            // quiz_answers,
            locale: router.locale || "en",
          }),
        });

        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          throw new Error(err.error || "Failed to start plan generation");
        }

        const reader = resp.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let jsonText = "";
        let streamFinished = false;

        // Same SSE approach you already use
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          for (const line of chunk.split("\n")) {
            if (!line.startsWith("data: ")) continue;
            const payload = line.replace("data: ", "").trim();
            if (payload === "[DONE]") {
              streamFinished = true;
              break;
            }
            // OpenAI chunk
            const parsed = JSON.parse(payload);
            const part = parsed?.choices?.[0]?.delta?.content || "";
            if (part) jsonText += part;
          }
        }

        if (!streamFinished) throw new Error("Stream ended unexpectedly");

        const fullJson = JSON.parse(jsonText);
        setPlan(fullJson);
      } catch (e) {
        console.error(e);
        setStreamError(e.message || "Unknown error");
      } finally {
        setLoading(false);
        setProgress(100);
      }
    })();
  }, [useMock, router.locale, mockPlan]);

  const downloadPDF = async () => {
    if (!pdfRef.current) return;
    const canvas = await html2canvas(pdfRef.current, { scale: 2, useCORS: true });
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
    <div className="mb-6 p-5 bg-white rounded-2xl shadow-sm">
      <h3 className="text-xl font-semibold text-emerald-700 mb-2">{title}</h3>
      <div className="text-gray-700">{children}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-emerald-50">
      {/* Header / Promise */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow p-6"
        >
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            NaturalFix — Your Personalized Wellness Plan
          </h1>
          <p className="mt-3 text-gray-700">
            NaturalFix is your personal guide to restoring balance, energy, and vitality through proven natural strategies. 
            We focus on simple, sustainable routines built around healing foods, natural supplements, and holistic habits.
          </p>
          <div className="mt-4 grid md:grid-cols-2 gap-3">
            {[
              "More consistent energy and focus throughout the day",
              "Improved digestion and reduced bloating using food-based solutions",
              "Better mood balance and reduced stress-related fatigue",
              "Gentle weight loss through supportive lifestyle changes",
              "Natural support for hormonal health",
            ].map((b, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="mt-1">✅</span>
                <p className="text-gray-800">{b}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={downloadPDF}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl"
            >
              Download PDF
            </button>
            <label className="inline-flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={useMock}
                onChange={(e) => setUseMock(e.target.checked)}
              />
              Use mock data (design preview)
            </label>
          </div>
        </motion.div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="max-w-4xl mx-auto px-4">
          <div className="mt-6 bg-white rounded-2xl p-6 shadow">
            <p className="font-medium mb-2">Building your personalized plan...</p>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-emerald-500"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Tailoring nutrition, habits, stress & sleep—just for you.
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {streamError && !loading && (
        <div className="max-w-4xl mx-auto px-4">
          <div className="mt-6 bg-white rounded-2xl p-6 shadow border border-red-200">
            <p className="text-red-600 font-semibold">
              {streamError}
            </p>
          </div>
        </div>
      )}

      {/* Plan */}
      {plan && !loading && (
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div ref={pdfRef} id="naturalfix-plan" className="space-y-6">
            <Section title="Profile Summary">
              <ul className="flex flex-wrap gap-2 mb-3">
                {(plan.plan.profile?.focusAreas || []).map((tag, i) => (
                  <li key={i} className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm">
                    {tag}
                  </li>
                ))}
              </ul>
              <p className="mb-2">{plan.plan.profile?.summary}</p>
              {plan.plan.profile?.calorieHint && (
                <p className="text-gray-600 text-sm">{plan.plan.profile.calorieHint}</p>
              )}
              {plan.plan.profile?.hormoneSupportNote && (
                <p className="text-gray-600 text-sm">{plan.plan.profile.hormoneSupportNote}</p>
              )}
            </Section>

            <Section title="Nutrition Targets">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-emerald-50">
                  <h4 className="font-semibold mb-2">Daily Targets</h4>
                  <ul className="list-disc ml-5">
                    {Object.entries(plan.plan.nutrition?.targets || {}).map(([k, v]) => (
                      <li key={k}><span className="font-medium">{labelize(k)}:</span> {v}</li>
                    ))}
                  </ul>
                </div>
                <div className="grid gap-4">
                  <div className="p-4 rounded-xl bg-emerald-50">
                    <h4 className="font-semibold mb-2">Emphasize</h4>
                    <p className="text-sm text-gray-700">{(plan.plan.nutrition?.emphasize || []).join(", ")}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-emerald-50">
                    <h4 className="font-semibold mb-2">Limit/Avoid</h4>
                    <p className="text-sm text-gray-700">{(plan.plan.nutrition?.avoidOrLimit || []).join(", ")}</p>
                  </div>
                </div>
              </div>
            </Section>

            <Section title="Daily Routine">
              <div className="grid md:grid-cols-3 gap-4">
                {["morning", "daytime", "evening"].map((part) => (
                  <div key={part} className="p-4 rounded-xl bg-white border">
                    <h4 className="font-semibold capitalize mb-2">{part}</h4>
                    <ul className="list-disc ml-5 text-sm">
                      {(plan.plan.routine?.[part] || []).map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Supplements (Optional)">
              <div className="grid md:grid-cols-2 gap-4">
                {(plan.plan.supplements || []).map((s, i) => (
                  <div key={i} className="p-4 rounded-xl bg-white border">
                    <p className="font-semibold">{s.name}</p>
                    <p className="text-sm text-gray-700">{s.dose}</p>
                    {s.note && <p className="text-sm text-gray-600 mt-1">{s.note}</p>}
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-3">
                This section is educational; check with your healthcare provider before starting any supplement.
              </p>
            </Section>

            <Section title="Movement Plan">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-emerald-50">
                  <h4 className="font-semibold mb-2">Weekly Structure</h4>
                  <ul className="list-disc ml-5">
                    {(plan.plan.movement?.weeklyPlan || []).map((x, i) => <li key={i}>{x}</li>)}
                  </ul>
                </div>
                <div className="p-4 rounded-xl bg-emerald-50">
                  <h4 className="font-semibold mb-2">Simple Extras</h4>
                  <ul className="list-disc ml-5">
                    {(plan.plan.movement?.extras || []).map((x, i) => <li key={i}>{x}</li>)}
                  </ul>
                </div>
              </div>
            </Section>

            <Section title="Stress & Sleep Support">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white border">
                  <h4 className="font-semibold mb-2">Stress Tools</h4>
                  <ul className="list-disc ml-5">
                    {(plan.plan.stressSleep?.stressTools || []).map((x, i) => <li key={i}>{x}</li>)}
                  </ul>
                </div>
                <div className="p-4 rounded-xl bg-white border">
                  <h4 className="font-semibold mb-2">Sleep Hygiene</h4>
                  <ul className="list-disc ml-5">
                    {(plan.plan.stressSleep?.sleepHygiene || []).map((x, i) => <li key={i}>{x}</li>)}
                  </ul>
                </div>
              </div>
            </Section>

            <Section title="7‑Day Micro‑Habits">
              <div className="grid md:grid-cols-2 gap-4">
                {(plan.plan.microHabits7Day || []).map((h, i) => (
                  <div key={i} className="p-4 rounded-xl bg-emerald-50">
                    <p className="font-semibold">{h.day}</p>
                    <p className="text-gray-700">{h.habit}</p>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Weekly Checklist">
              <ul className="list-disc ml-5">
                {(plan.plan.weeklyChecklist || []).map((x, i) => <li key={i}>{x}</li>)}
              </ul>
            </Section>

            {plan.plan.disclaimers?.length > 0 && (
              <div className="text-xs text-gray-500">
                {plan.plan.disclaimers.map((d, i) => (
                  <p key={i}>• {d}</p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
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
      ...(await serverSideTranslations(locale, ["success"])), // reuse existing, or swap later
    },
  };
}
