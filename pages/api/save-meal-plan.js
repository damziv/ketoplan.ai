// File: pages/api/save-meal-plan.js
import { createClient } from '@supabase/supabase-js';
// import sgMail from '@sendgrid/mail';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;


// if (!process.env.SENDGRID_API_KEY) {
//   console.warn("SENDGRID_API_KEY is not set");
// } else {
//  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
// }

// --- Minimal email i18n dictionary ---
const I18N = {
  en: {
    subject: "Your NaturalFix Personalized Wellness Plan",
    tagline: "Simple, food-first routines for steadier energy, calmer stress, and better digestion.",
    sections: {
      profile: "Profile Summary",
      nutrition: "Nutrition Targets",
      dailyTargets: "Daily Targets",
      emphasize: "Emphasize",
      limit: "Limit/Avoid",
      routine: "Daily Routine",
      morning: "Morning",
      daytime: "Daytime",
      evening: "Evening",
      supplements: "Supplements (Optional)",
      supplementsNote: "This section is educational; consult your healthcare provider before starting any supplement.",
      movement: "Movement Plan",
      weeklyStructure: "Weekly Structure",
      extras: "Simple Extras",
      stressSleep: "Stress & Sleep Support",
      stressTools: "Stress Tools",
      sleepHygiene: "Sleep Hygiene",
      microHabits: "7‑Day Micro‑Habits",
      checklist: "Weekly Checklist",
      sentWith: "Sent with ❤️ by NaturalFix",
      dash: "—",
    },
  },
  hr: {
    subject: "Vaš personalizirani NaturalFix plan zdravlja",
    tagline: "Jednostavne, prirodne navike za stabilniju energiju, smireniji stres i bolju probavu.",
    sections: {
      profile: "Sažetak profila",
      nutrition: "Prehrambene smjernice",
      dailyTargets: "Dnevne smjernice",
      emphasize: "Naglasiti",
      limit: "Ograničiti/Izbjegavati",
      routine: "Dnevna rutina",
      morning: "Jutro",
      daytime: "Dan",
      evening: "Večer",
      supplements: "Dodaci prehrani (neobavezno)",
      supplementsNote: "Ovaj odjeljak je edukativan; savjetujte se s liječnikom prije uzimanja dodataka.",
      movement: "Plan kretanja",
      weeklyStructure: "Tjedna struktura",
      extras: "Jednostavni dodaci",
      stressSleep: "Stres i san",
      stressTools: "Tehnike za stres",
      sleepHygiene: "Higijena sna",
      microHabits: "7-dnevne mikro-navike",
      checklist: "Tjedna kontrolna lista",
      sentWith: "Poslano s ❤️ od NaturalFix",
      dash: "—",
    },
  },
  de: {
    subject: "Ihr personalisierter NaturalFix Wellness-Plan",
    tagline: "Einfache, natürliche Routinen für mehr Energie, weniger Stress und bessere Verdauung.",
    sections: {
      profile: "Profilübersicht",
      nutrition: "Ernährungsziele",
      dailyTargets: "Tägliche Ziele",
      emphasize: "Betonen",
      limit: "Begrenzen/Meiden",
      routine: "Tägliche Routine",
      morning: "Morgen",
      daytime: "Tag",
      evening: "Abend",
      supplements: "Nahrungsergänzung (optional)",
      supplementsNote: "Dieser Abschnitt ist informativ; sprechen Sie vor der Einnahme mit Ihrem Arzt.",
      movement: "Bewegungsplan",
      weeklyStructure: "Wochenstruktur",
      extras: "Einfache Extras",
      stressSleep: "Stress & Schlaf",
      stressTools: "Stresstools",
      sleepHygiene: "Schlafhygiene",
      microHabits: "7‑Tage‑Mikro‑Gewohnheiten",
      checklist: "Wöchentliche Checkliste",
      sentWith: "Gesendet mit ❤️ von NaturalFix",
      dash: "—",
    },
  },
  pl: {
    subject: "Twój spersonalizowany plan NaturalFix",
    tagline: "Proste, naturalne nawyki dla stabilniejszej energii, mniejszego stresu i lepszego trawienia.",
    sections: {
      profile: "Podsumowanie profilu",
      nutrition: "Cele żywieniowe",
      dailyTargets: "Codzienne cele",
      emphasize: "Zalecane",
      limit: "Ogranicz / Unikaj",
      routine: "Codzienna rutyna",
      morning: "Poranek",
      daytime: "Dzień",
      evening: "Wieczór",
      supplements: "Suplementy (opcjonalnie)",
      supplementsNote: "Sekcja ma charakter informacyjny; skonsultuj się z lekarzem przed rozpoczęciem suplementacji.",
      movement: "Plan aktywności",
      weeklyStructure: "Struktura tygodniowa",
      extras: "Proste dodatki",
      stressSleep: "Wsparcie dla redukcji stresu i snu",
      stressTools: "Techniki redukcji stresu",
      sleepHygiene: "Higiena snu",
      microHabits: "7-dniowe mikro-nawyki",
      checklist: "Tygodniowa lista kontrolna",
      sentWith: "Wysłano z ❤️ przez NaturalFix",
      dash: "—",
    },
  },
};

function tFactory(locale) {
  const base = I18N.en;
  const L = I18N[locale] || base;
  return {
    ...L,
    sections: { ...base.sections, ...(L.sections || {}) },
  };
}

function esc(s) {
  if (s == null) return "";
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function labelize(key) {
  return String(key)
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase());
}

// ---------- NaturalFix Email (localized) ----------
function generateEmailTemplate(plan, t) {
  const p = plan || {};
  const S = t.sections;

  const focus = Array.isArray(p.profile?.focusAreas) ? p.profile.focusAreas : [];
  const emphasize = Array.isArray(p.nutrition?.emphasize) ? p.nutrition.emphasize : [];
  const avoid = Array.isArray(p.nutrition?.avoidOrLimit) ? p.nutrition.avoidOrLimit : [];
  const morning = Array.isArray(p.routine?.morning) ? p.routine.morning : [];
  const daytime = Array.isArray(p.routine?.daytime) ? p.routine.daytime : [];
  const evening = Array.isArray(p.routine?.evening) ? p.routine.evening : [];
  const supplements = Array.isArray(p.supplements) ? p.supplements : [];
  const weeklyPlan = Array.isArray(p.movement?.weeklyPlan) ? p.movement.weeklyPlan : [];
  const extras = Array.isArray(p.movement?.extras) ? p.movement.extras : [];
  const stressTools = Array.isArray(p.stressSleep?.stressTools) ? p.stressSleep.stressTools : [];
  const sleepHygiene = Array.isArray(p.stressSleep?.sleepHygiene) ? p.stressSleep.sleepHygiene : [];
  const micro = Array.isArray(p.microHabits7Day) ? p.microHabits7Day : [];
  const checklist = Array.isArray(p.weeklyChecklist) ? p.weeklyChecklist : [];
  const disclaimers = Array.isArray(p.disclaimers) ? p.disclaimers : [];
  const targets = p.nutrition?.targets || {};

  const sectionCard = (title, body) => `
    <div style="background:#ffffff;padding:16px;border-radius:14px;margin:12px 0;box-shadow:0 3px 12px rgba(0,0,0,0.06)">
      <h3 style="margin:0 0 8px;color:#065f46;font-size:18px;font-weight:700">${esc(title)}</h3>
      ${body}
    </div>
  `;

  const list = (items) => items.length
    ? `<ul style="margin:8px 0 0 18px;padding:0;color:#374151;font-size:14px;line-height:1.5">
        ${items.map(i => `<li>${esc(i)}</li>`).join("")}
      </ul>`
    : `<p style="margin:8px 0 0;color:#6b7280;font-size:14px">${esc(t.sections.dash)}</p>`;

  const pillList = (items) => items.length
    ? `<div>${items.map(i => `
        <span style="display:inline-block;margin:4px 4px 0 0;padding:6px 10px;background:#d1fae5;color:#065f46;border-radius:999px;font-size:12px">
          ${esc(i)}
        </span>`).join("")}
      </div>`
    : "";

  const keyValueList = (obj) => {
    const entries = Object.entries(obj || {});
    if (!entries.length) {
      return `<p style="margin:8px 0 0;color:#6b7280;font-size:14px">${esc(S.dash)}</p>`;
    }
    return `<ul style="margin:8px 0 0 18px;padding:0;color:#374151;font-size:14px;line-height:1.5">
      ${entries.map(([k,v]) => `<li><strong>${esc(labelize(k))}:</strong> ${esc(v)}</li>`).join("")}
    </ul>`;
  };

  return `
  <div style="background:#f0fdf4;padding:24px;border-radius:18px;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:680px;margin:0 auto">
    <div style="background:#ffffff;border-radius:18px;padding:20px;box-shadow:0 6px 24px rgba(0,0,0,0.08)">
      <h2 style="margin:0 0 6px;color:#111827;font-size:22px;text-align:center;font-weight:800">
        ${esc(t.subject)}
      </h2>
      <p style="margin:0 0 16px;color:#6b7280;font-size:14px;text-align:center">
        ${esc(t.tagline)}
      </p>

      ${sectionCard(S.profile, `
        ${focus.length ? pillList(focus) : ""}
        ${p.profile?.summary ? `<p style="margin:8px 0;color:#374151;font-size:14px">${esc(p.profile.summary)}</p>` : ""}
        ${p.profile?.calorieHint ? `<p style="margin:6px 0;color:#6b7280;font-size:13px">${esc(p.profile.calorieHint)}</p>` : ""}
        ${p.profile?.hormoneSupportNote ? `<p style="margin:6px 0;color:#6b7280;font-size:13px">${esc(p.profile.hormoneSupportNote)}</p>` : ""}
      `)}

      ${sectionCard(S.nutrition, `
        <div style="display:flex;gap:12px;flex-wrap:wrap">
          <div style="flex:1;min-width:260px;background:#ecfdf5;border-radius:12px;padding:12px">
            <h4 style="margin:0 0 6px;font-size:14px;color:#111827">${esc(S.dailyTargets)}</h4>
            ${keyValueList(targets)}
          </div>
          <div style="flex:1;min-width:260px;display:flex;flex-direction:column;gap:12px">
            <div style="background:#ecfdf5;border-radius:12px;padding:12px">
              <h4 style="margin:0 0 6px;font-size:14px;color:#111827">${esc(S.emphasize)}</h4>
              ${emphasize.length ? `<p style="margin:0;color:#374151;font-size:14px">${esc(emphasize.join(", "))}</p>` : `<p style="margin:0;color:#6b7280;font-size:14px">${esc(S.dash)}</p>`}
            </div>
            <div style="background:#ecfdf5;border-radius:12px;padding:12px">
              <h4 style="margin:0 0 6px;font-size:14px;color:#111827">${esc(S.limit)}</h4>
              ${avoid.length ? `<p style="margin:0;color:#374151;font-size:14px">${esc(avoid.join(", "))}</p>` : `<p style="margin:0;color:#6b7280;font-size:14px">${esc(S.dash)}</p>`}
            </div>
          </div>
        </div>
      `)}

      ${sectionCard(S.routine, `
        <div style="display:flex;gap:12px;flex-wrap:wrap">
          <div style="flex:1;min-width:200px;background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:10px">
            <h4 style="margin:0 0 6px;font-size:14px;color:#111827">${esc(S.morning)}</h4>
            ${list(morning)}
          </div>
          <div style="flex:1;min-width:200px;background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:10px">
            <h4 style="margin:0 0 6px;font-size:14px;color:#111827">${esc(S.daytime)}</h4>
            ${list(daytime)}
          </div>
          <div style="flex:1;min-width:200px;background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:10px">
            <h4 style="margin:0 0 6px;font-size:14px;color:#111827">${esc(S.evening)}</h4>
            ${list(evening)}
          </div>
        </div>
      `)}

      ${sectionCard(S.supplements, `
        ${supplements.length ? `
          <div style="display:flex;gap:12px;flex-wrap:wrap">
            ${supplements.map(s => `
              <div style="flex:1;min-width:260px;background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:10px">
                <p style="margin:0;font-weight:600;color:#111827">${esc(s.name || "")}</p>
                <p style="margin:4px 0 0;color:#374151;font-size:14px">${esc(s.dose || "")}</p>
                ${s.note ? `<p style="margin:6px 0 0;color:#6b7280;font-size:13px">${esc(s.note)}</p>` : ""}
              </div>
            `).join("")}
          </div>
        ` : `<p style="margin:8px 0 0;color:#6b7280;font-size:14px">${esc(S.dash)}</p>`}
        <p style="margin:10px 0 0;color:#9ca3af;font-size:12px">${esc(S.supplementsNote)}</p>
      `)}

      ${sectionCard(S.movement, `
        <div style="display:flex;gap:12px;flex-wrap:wrap">
          <div style="flex:1;min-width:260px;background:#ecfdf5;border-radius:12px;padding:12px">
            <h4 style="margin:0 0 6px;font-size:14px;color:#111827">${esc(S.weeklyStructure)}</h4>
            ${list(weeklyPlan)}
          </div>
          <div style="flex:1;min-width:260px;background:#ecfdf5;border-radius:12px;padding:12px">
            <h4 style="margin:0 0 6px;font-size:14px;color:#111827">${esc(S.extras)}</h4>
            ${list(extras)}
          </div>
        </div>
      `)}

      ${sectionCard(S.stressSleep, `
        <div style="display:flex;gap:12px;flex-wrap:wrap">
          <div style="flex:1;min-width:260px;background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:10px">
            <h4 style="margin:0 0 6px;font-size:14px;color:#111827">${esc(S.stressTools)}</h4>
            ${list(stressTools)}
          </div>
          <div style="flex:1;min-width:260px;background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:10px">
            <h4 style="margin:0 0 6px;font-size:14px;color:#111827">${esc(S.sleepHygiene)}</h4>
            ${list(sleepHygiene)}
          </div>
        </div>
      `)}

      ${sectionCard(S.microHabits, `
        ${micro.length ? `
          <div style="display:flex;gap:12px;flex-wrap:wrap">
            ${micro.map(h => `
              <div style="flex:1;min-width:220px;background:#ecfdf5;border-radius:12px;padding:12px">
                <p style="margin:0;font-weight:600;color:#111827">${esc(h.day || "")}</p>
                <p style="margin:6px 0 0;color:#374151;font-size:14px">${esc(h.habit || "")}</p>
              </div>
            `).join("")}
          </div>
        ` : `<p style="margin:8px 0 0;color:#6b7280;font-size:14px">${esc(S.dash)}</p>`}
      `)}

      ${sectionCard(S.checklist, list(checklist))}

      ${disclaimers.length ? `
        <div style="margin-top:8px;color:#9ca3af;font-size:12px">
          ${disclaimers.map(d => `<p style="margin:4px 0">• ${esc(d)}</p>`).join("")}
        </div>` : ""}

      <p style="text-align:center;margin:16px 0 0;color:#9ca3af;font-size:12px">
        ${esc(S.sentWith)}
      </p>
    </div>
  </div>
  `;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') 
    return res.status(405).json({ error: 'Only POST allowed' });

  const { email, plan, locale } = req.body;
  const loc = (locale || "en").split("-")[0]; // e.g. "hr-HR" -> "hr"
  const t = tFactory(loc);

  if (!email || !plan || typeof plan !== "object") {
    return res.status(400).json({ error: 'Missing or invalid email or plan' });
  }

  try {
    // Save the NaturalFix plan JSON into the latest paid session
    const { data, error } = await supabase
      .from('sessions')
      .update({ meal_plan: plan })
      .eq('email', email)
      .eq('payment_status', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .select();

    if (error) throw error;

    const html = generateEmailTemplate(plan, t);

    if (resend) {
      try {
        await resend.emails.send({
          from: process.env.RESEND_SENDER,
          to: email,
          subject: t.subject,     // your localized subject
          html,                   // your localized body
        });
      } catch (e) {
        console.error('Resend error:', e);
        // Decide: fail or continue (see fallback below)
      }
    } else {
      console.warn('RESEND_API_KEY missing; skipping email send');
    }

    res.status(200).json({ message: 'Plan saved and emailed.' });
  } catch (err) {
    console.error('❌ Error saving plan or sending email:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
