"use client";

// ============================================================================
// CreditsWidget — תצוגת ניצול החבילה
// ============================================================================
// מציג ללקוחה כמה אבחונים ניצלה מתוך החבילה שרכשה וכמה נשארו.
// מקור הנתונים: convex/credits.ts -> getMyCredits (totalCredits/usedCredits/remainingCredits).

import { useQuery } from "convex/react";
import { Sparkles } from "lucide-react";

import { api } from "@/convex/_generated/api";

type Lang = "he" | "ar";

const copy = {
  he: {
    title: "החבילה שלי",
    usage: (used: number, total: number) => `ניצלת ${used} מתוך ${total} אבחונים`,
    remaining: (n: number) => (n === 1 ? "נותר אבחון אחד" : `נותרו ${n} אבחונים`),
    depleted: "נגמרו האבחונים בחבילה",
  },
  ar: {
    title: "باقتي",
    usage: (used: number, total: number) => `استخدمتِ ${used} من ${total} تشخيصات`,
    remaining: (n: number) => (n === 1 ? "بقي تشخيص واحد" : `بقيت ${n} تشخيصات`),
    depleted: "انتهت التشخيصات في الباقة",
  },
} as const;

export default function CreditsWidget({ lang = "he" }: { lang?: Lang }) {
  const credits = useQuery(api.credits.getMyCredits);
  const t = copy[lang];

  // לא מחוברת, עדיין נטען, או שמעולם לא נרכשה חבילה — אין מה להציג
  if (!credits || credits.totalCredits === 0) {
    return null;
  }

  const { totalCredits, usedCredits, remainingCredits } = credits;
  const percentUsed = Math.min(100, Math.round((usedCredits / totalCredits) * 100));
  const isDepleted = remainingCredits === 0;

  return (
    <div className="mt-4 rounded-2xl border border-violet-400/30 bg-white/5 px-5 py-4 backdrop-blur-md">
      <div className="flex items-center justify-between gap-3">
        <span className={`font-bold text-xs ${isDepleted ? "text-pink-300" : "text-violet-200"}`}>
          {isDepleted ? t.depleted : t.remaining(remainingCredits)}
        </span>
        <div className="flex items-center gap-2">
          <p className="font-bold text-sm text-white/90">{t.title}</p>
          <Sparkles className="h-4 w-4 shrink-0 text-violet-300" />
        </div>
      </div>

      {/* פס התקדמות — ממולא לפי אחוז הניצול */}
      <div
        aria-label={t.usage(usedCredits, totalCredits)}
        aria-valuemax={totalCredits}
        aria-valuemin={0}
        aria-valuenow={usedCredits}
        className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10"
        role="progressbar"
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isDepleted
              ? "bg-gradient-to-l from-pink-500 to-rose-500"
              : "bg-gradient-to-l from-[#7b2ff7] to-[#f72585]"
          }`}
          style={{ width: `${percentUsed}%` }}
        />
      </div>

      <p className="mt-2 text-right text-white/50 text-xs">{t.usage(usedCredits, totalCredits)}</p>
    </div>
  );
}
