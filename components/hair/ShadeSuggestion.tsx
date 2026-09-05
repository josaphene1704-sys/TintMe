"use client";

// ============================================================================
// כרטיס "נסי לזהות לפי התמונה"
// ============================================================================
// כלל היסוד: זו **הצעה**, לא קביעה. הבחירה מהקטלוג היא מקור האמת, והכרטיס
// הזה רק ממלא את אותו selectedCode הקיים. לכן:
//   • בלי תמונה הקומפוננטה לא מרונדרת בכלל — העמוד מתנהג כמו לפני התכונה.
//   • הניתוח רץ רק בלחיצה מפורשת, אף פעם לא אוטומטית (הוא עולה שאלה).
//   • כישלון מכל סוג משאיר את הלקוחה עם הקטלוג הידני ולא חוסם את ההמשך.
// זה גם מה שהופך את המסלול לבטוח כימית: מנוע הנוסחה ב-page3 רואה תמיד קוד
// גוון שאדם אישר, ולא הערכה של מודל.

import { useQuery } from "convex/react";
import { AlertTriangle, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { useCallback, useState } from "react";
import { api } from "@/convex/_generated/api";
import type { CatalogId, ColorReading } from "@/lib/colorCatalogs/match";
import { shadeImageSrc } from "@/lib/colorCatalogs/shadeImage";
import type { Shade } from "@/lib/colorCatalogs/types";
import { cn } from "@/lib/utils";

type Lang = "he" | "ar";
export type AnalyzeMode = "current" | "desired";

const T = {
  he: {
    cta: "נסי לזהות לפי התמונה",
    ctaAgain: "נסי שוב",
    analyzing: "מנתחת את התמונה…",
    // ניסוח מכוון: "נראה כמו", לא "הצבע שלך הוא". אי אפשר לדעת קוד מדויק
    // מתמונת טלפון, ואסור להישמע בטוחות יותר ממה שאנחנו.
    resultPrefix: "נראה כמו",
    level: "רמה",
    question: "האם אחד מאלה מתאים?",
    disclaimer: "התאורה בתמונה משפיעה על הזיהוי. תמיד אפשר לבחור ידנית מהקטלוג.",
    lowConfidence: "התמונה קשה לקריאה (תאורה, פילטר או צבע לא אחיד). כדאי לצלם באור טבעי — בינתיים עדיף לבחור ידנית.",
    noMatch: "לא נמצאו גוונים מתאימים בקטלוג הזה. נסי את המותג השני או בחרי ידנית.",
    remaining: (n: number) => `נותרו ${n} שימושים`,
    errGeneric: "הזיהוי נכשל. אפשר לנסות שוב או לבחור ידנית מהקטלוג.",
    errUnreadable: "לא הצלחתי לקרוא את התמונה. נסי תמונה ברורה יותר של השיער.",
    errAuth: "יש להתחבר כדי לנתח תמונה.",
    warm: "בגוון חם",
    cool: "בגוון קר",
    neutral: "בגוון ניטרלי",
  },
  ar: {
    cta: "حاولي التعرف من الصورة",
    ctaAgain: "حاولي مرة أخرى",
    analyzing: "جاري تحليل الصورة…",
    resultPrefix: "يبدو مثل",
    level: "درجة",
    question: "هل أحد هذه مناسب؟",
    disclaimer: "الإضاءة في الصورة تؤثر على التعرف. يمكنك دائماً الاختيار يدوياً من الكتالوج.",
    lowConfidence: "الصورة صعبة القراءة (إضاءة، فلتر أو لون غير متجانس). يُفضّل التصوير بضوء طبيعي — حالياً الأفضل الاختيار يدوياً.",
    noMatch: "لم يتم العثور على درجات مناسبة في هذا الكتالوج. جرّبي العلامة الأخرى أو اختاري يدوياً.",
    remaining: (n: number) => `تبقى ${n} استخدامات`,
    errGeneric: "فشل التعرف. يمكنك المحاولة مجدداً أو الاختيار يدوياً.",
    errUnreadable: "لم أتمكن من قراءة الصورة. جرّبي صورة أوضح للشعر.",
    errAuth: "يجب تسجيل الدخول لتحليل الصورة.",
    warm: "بدرجة دافئة",
    cool: "بدرجة باردة",
    neutral: "بدرجة محايدة",
  },
} as const;

type Status = "idle" | "loading" | "done" | "error";

export function ShadeSuggestion({
  lang,
  photoDataUrl,
  catalogId,
  mode,
  selectedCode,
  onSelect,
}: {
  lang: Lang;
  /** null כשעדיין אין תמונה — ואז הקומפוננטה לא מציגה כלום. */
  photoDataUrl: string | null;
  catalogId: CatalogId;
  mode: AnalyzeMode;
  selectedCode: string | null;
  onSelect: (code: string) => void;
}) {
  const t = T[lang];
  const quota = useQuery(api.credits.getMyBotQuota);

  const [status, setStatus] = useState<Status>("idle");
  const [reading, setReading] = useState<ColorReading | null>(null);
  const [candidates, setCandidates] = useState<Shade[]>([]);
  const [errorText, setErrorText] = useState<string | null>(null);

  const analyze = useCallback(async () => {
    if (!photoDataUrl) return;
    setStatus("loading");
    setErrorText(null);

    try {
      const res = await fetch("/api/analyze-hair", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageDataUrl: photoDataUrl, mode, catalogId }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        if (res.status === 401 || res.status === 402) setErrorText(data.text ?? t.errAuth);
        else if (res.status === 422) setErrorText(t.errUnreadable);
        else setErrorText(t.errGeneric);
        return;
      }

      setReading(data.reading as ColorReading);
      setCandidates((data.candidates ?? []) as Shade[]);
      setStatus("done");
    } catch {
      setStatus("error");
      setErrorText(t.errGeneric);
    }
  }, [photoDataUrl, mode, catalogId, t]);

  // בלי תמונה אין מה להציע — ואין לרמוז שחסר משהו כדי להמשיך.
  if (!photoDataUrl) return null;

  const isLow = reading?.confidence === "low";

  return (
    <div className="mt-4 rounded-2xl border border-white/12 bg-black/20 p-3.5 backdrop-blur-sm">
      {status !== "done" && (
        <button
          type="button"
          onClick={analyze}
          disabled={status === "loading"}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-bold text-sm text-white transition-all duration-200",
            status === "loading"
              ? "cursor-wait bg-white/10 text-white/50"
              : "bg-gradient-to-l from-violet-600 to-fuchsia-500 shadow-[0_0_14px_2px_rgba(232,121,249,0.3)] hover:scale-[1.01] active:scale-[0.99]",
          )}
        >
          {status === "loading" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t.analyzing}
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 text-yellow-200" />
              {status === "error" ? t.ctaAgain : t.cta}
            </>
          )}
        </button>
      )}

      {status === "error" && errorText && (
        <p className="mt-2.5 flex items-start gap-1.5 text-amber-300/90 text-xs leading-relaxed">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {errorText}
        </p>
      )}

      {status === "done" && reading && (
        <div className="flex flex-col gap-2.5">
          <p className="font-semibold text-sm text-white">
            {t.resultPrefix} {t.level} {reading.level} {t[reading.temperature]}
            {candidates.length > 0 && <span className="text-white/60"> — {t.question}</span>}
          </p>

          {isLow && (
            <p className="flex items-start gap-1.5 rounded-lg bg-amber-500/10 px-2.5 py-2 text-amber-300/90 text-xs leading-relaxed">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {t.lowConfidence}
            </p>
          )}

          {candidates.length === 0 ? (
            <p className="text-white/55 text-xs leading-relaxed">{t.noMatch}</p>
          ) : (
            <div className={cn("grid grid-cols-3 gap-2", isLow && "opacity-60")}>
              {candidates.map((shade) => (
                <CandidateChip
                  key={shade.code}
                  shade={shade}
                  lang={lang}
                  selected={selectedCode === shade.code}
                  onSelect={() => onSelect(shade.code)}
                />
              ))}
            </div>
          )}

          <p className="text-[11px] text-white/45 leading-relaxed">{t.disclaimer}</p>

          <button
            type="button"
            onClick={analyze}
            className="self-start font-medium text-[11px] text-fuchsia-300/70 underline-offset-2 hover:text-fuchsia-300 hover:underline"
          >
            {t.ctaAgain}
          </button>
        </div>
      )}

      {quota !== undefined && quota !== null && status !== "done" && (
        <p className="mt-2 text-center text-[11px] text-white/35">
          {t.remaining(quota.remaining)}
        </p>
      )}
    </div>
  );
}

function CandidateChip({
  shade,
  lang,
  selected,
  onSelect,
}: {
  shade: Shade;
  lang: Lang;
  selected: boolean;
  onSelect: () => void;
}) {
  const name = lang === "he" ? shade.nameHe : shade.nameAr;
  return (
    <button
      type="button"
      onClick={onSelect}
      title={`${shade.code} – ${name}`}
      className={cn(
        "relative flex flex-col overflow-hidden rounded-xl border-2 transition-all duration-200 focus:outline-none",
        selected
          ? "border-fuchsia-400 shadow-[0_0_14px_2px_rgba(232,121,249,0.45)]"
          : "border-transparent hover:scale-[1.03] hover:border-fuchsia-400/40",
      )}
    >
      <div className="aspect-square w-full overflow-hidden" style={{ background: shade.hex }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={shadeImageSrc(shade.code)}
          alt={name}
          loading="lazy"
          className="h-full w-full bg-white object-cover"
          // אין קובץ swatch לקוד הזה — נופלים ל-hex של הקטלוג במקום אייקון שבור
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      </div>
      <div className="bg-white/10 px-1 py-1 text-center backdrop-blur-sm">
        <p className="mb-0.5 truncate font-bold text-[10px] text-white/90 leading-none">{shade.code}</p>
        <p className="break-words font-medium text-[9px] text-white/65 leading-tight">{name}</p>
      </div>
      {selected && (
        <div className="absolute top-1.5 left-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-fuchsia-500 shadow-md">
          <CheckCircle2 className="h-3 w-3 text-white" />
        </div>
      )}
    </button>
  );
}
