"use client";

import { ShadeSuggestion } from "@/components/hair/ShadeSuggestion";
import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CheckCircle2, Palette, Sparkles, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useConvexAuth } from "convex/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { IGORA_CATALOG } from "@/lib/colorCatalogs/igora";
import type { CatalogId } from "@/lib/colorCatalogs/match";
import type { Shade } from "@/lib/colorCatalogs/types";
import { shadeImageSrc } from "@/lib/colorCatalogs/shadeImage";
import { THREE_CATALOG } from "@/lib/colorCatalogs/three";
import { cn } from "@/lib/utils";
import { fileToDataUrl } from "@/lib/photo";

// ─── Translations ─────────────────────────────────────────────────────────────
const T = {
  he: {
    switchLabel: "العربية",
    pageTitle: "אבחון צבע שיער",
    pageSubtitle: "העלי תמונת שיער ובחרי גוון – נוסחת הצבע המושלמת עבורך",
    uploadTitle: "תמונת השיער שלך",
    uploadSubtitle: "תמונה ברורה של שיערך הנוכחי באור טבעי",
    uploadCta: "לחצי להעלאת תמונה",
    uploadOr: "או גרירת קובץ לכאן",
    uploadedLabel: "תמונה הועלתה",
    uploadedChange: "לחצי להחלפה",
    catalogTitle: "בחרי את הגוון הנוכחי שלך",
    catalogSub: "בחרי את הגוון הקרוב ביותר לצבע שיערך הנוכחי מתוך קטלוג הצבעים Igora Royal של Schwarzkopf",
    selectedPrefix: "נבחר:",
    nextBtn: "המשך לבחירת שיער החלומות ←",
    nextPending: "בחרי גוון להמשך",
    font: "var(--font-rubik), Arial, sans-serif",
  },
  ar: {
    switchLabel: "עברית",
    pageTitle: "تشخيص لون الشعر",
    pageSubtitle: "ارفعي صورة شعرك واختاري درجة اللون – سنحسب لك التركيبة المثالية",
    uploadTitle: "صورة شعرك",
    uploadSubtitle: "صورة واضحة لشعرك الحالي في ضوء طبيعي",
    uploadCta: "اضغطي لرفع صورة",
    uploadOr: "أو اسحبي الملف هنا",
    uploadedLabel: "تم رفع الصورة",
    uploadedChange: "اضغطي للتغيير",
    catalogTitle: "اختاري درجة لونك الحالية",
    catalogSub: "اختاري الدرجة الأقرب للون شعرك الحالي من كتالوج ألوان Igora Royal من Schwarzkopf",
    selectedPrefix: "مختار:",
    nextBtn: "التالي – اختيار شعر الأحلام ←",
    nextPending: "اختاري درجة للمتابعة",
    font: "var(--font-cairo), Arial, sans-serif",
  },
} as const;

type Lang = keyof typeof T;

// ─── Color catalog data ───────────────────────────────────────────────────────
// הקטלוגים מוגדרים פעם אחת ב-lib/colorCatalogs ומשותפים ל-page1/page1b/page3.
const CATEGORIES = IGORA_CATALOG.categories;

// ─── Dropzone ─────────────────────────────────────────────────────────────────
function PhotoDropzone({
  t,
  photo,
  onSelect,
  onClear,
}: {
  t: (typeof T)[Lang];
  photo: { file: File; preview: string } | null;
  onSelect: (file: File, preview: string) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const f = files?.[0];
      if (!f || !f.type.startsWith("image/")) return;
      onSelect(f, URL.createObjectURL(f));
    },
    [onSelect],
  );

  return (
    <div className="flex h-full flex-col gap-4">
      <div>
        <p className="text-lg font-bold text-white">{t.uploadTitle}</p>
        <p className="mt-0.5 text-sm text-white/55">{t.uploadSubtitle}</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {photo ? (
        <div className="relative flex-1 overflow-hidden rounded-2xl border border-white/20 shadow-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo.preview} alt="hair" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          <button
            type="button"
            onClick={onClear}
            className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-colors hover:bg-black/80"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-emerald-500/90 px-3 py-1.5 backdrop-blur-sm">
            <CheckCircle2 className="h-3.5 w-3.5 text-white" />
            <span className="text-xs font-semibold text-white">{t.uploadedLabel}</span>
          </div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute bottom-3 left-3 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/25"
          >
            {t.uploadedChange}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
          className={cn(
            "flex flex-1 flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed transition-all duration-200",
            dragging
              ? "border-fuchsia-400 bg-fuchsia-500/15 scale-[1.01]"
              : "border-white/25 bg-white/5 hover:border-fuchsia-400/60 hover:bg-white/10",
          )}
          style={{ minHeight: "220px" }}
        >
          <div className={cn(
            "flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-200",
            dragging ? "bg-fuchsia-500/30 scale-110" : "bg-white/10",
          )}>
            <Camera className="h-7 w-7 text-white/70" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-white/90">{t.uploadCta}</p>
            <p className="mt-1 text-sm text-white/45">{t.uploadOr}</p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2">
            <Upload className="h-3.5 w-3.5 text-white/60" />
            <span className="text-xs text-white/60">JPG, PNG, HEIC</span>
          </div>
        </button>
      )}
    </div>
  );
}

// ─── Color chip ───────────────────────────────────────────────────────────────
function ColorChip({
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
        "group relative flex flex-col overflow-hidden rounded-xl border-2 transition-all duration-200 focus:outline-none",
        selected
          ? "border-fuchsia-400 shadow-[0_0_18px_3px_rgba(232,121,249,0.45)] scale-[1.06]"
          : "border-transparent hover:border-fuchsia-400/40 hover:scale-[1.03]",
      )}
    >
      <div className="aspect-square w-full overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={shadeImageSrc(shade.code)}
          alt={name}
          loading="lazy"
          className="h-full w-full object-cover bg-white"
          onError={(e) => {
            const target = e.currentTarget as HTMLImageElement;
            target.style.display = "none";
            const parent = target.parentElement;
            if (parent) parent.style.background = shade.hex;
          }}
        />
      </div>
      <div className="bg-white/10 px-1 py-1 text-center backdrop-blur-sm">
        <p className="truncate text-[10px] font-bold text-white/90 leading-none mb-0.5">{shade.code}</p>
        <p className="text-[9px] font-medium text-white/65 leading-tight break-words hyphens-auto">
          {name}
        </p>
      </div>
      {selected && (
        <div className="absolute left-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-fuchsia-500 shadow-md">
          <CheckCircle2 className="h-3 w-3 text-white" />
        </div>
      )}
    </button>
  );
}

// ─── Color catalog panel ──────────────────────────────────────────────────────
function ColorCatalog({
  t,
  lang,
  brand,
  onBrandChange,
  selectedCode,
  onSelect,
}: {
  t: (typeof T)[Lang];
  lang: Lang;
  brand: CatalogId;
  onBrandChange: (brand: CatalogId) => void;
  selectedCode: string | null;
  onSelect: (code: string) => void;
}) {
  const categories = brand === "three" ? THREE_CATALOG.categories : CATEGORIES;

  const [activeId, setActiveId] = useState(CATEGORIES[0].id);
  const active = categories.find((c) => c.id === activeId) ?? categories[0];

  return (
    <div className="flex h-full flex-col gap-4">
      <div>
        <p className="text-lg font-bold text-white">{t.catalogTitle}</p>
        <p className="mt-0.5 text-sm text-white/55">{t.catalogSub}</p>
      </div>

      <div className="flex gap-1.5">
        {(["igora", "three"] as const).map((b) => (
          <button
            key={b}
            type="button"
            onClick={() => onBrandChange(b)}
            className={cn(
              "flex-1 rounded-xl px-3 py-2 text-sm font-bold transition-all duration-200",
              brand === b
                ? "bg-gradient-to-l from-fuchsia-500 to-violet-600 text-white shadow-[0_0_14px_2px_rgba(232,121,249,0.4)]"
                : "bg-white/10 text-white/60 hover:bg-white/18 hover:text-white",
            )}
          >
            {b === "igora" ? "Igora Royal" : "Three"}
          </button>
        ))}
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveId(cat.id)}
            className={cn(
              "shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-200",
              activeId === cat.id
                ? "bg-fuchsia-500 text-white shadow-[0_0_12px_2px_rgba(232,121,249,0.35)]"
                : "bg-white/10 text-white/65 hover:bg-white/18 hover:text-white",
            )}
          >
            {lang === "he" ? cat.labelHe : cat.labelAr}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl bg-black/20 p-3 backdrop-blur-sm">
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-4 lg:grid-cols-5">
          {active.shades.map((shade) => (
            <ColorChip
              key={shade.code}
              shade={shade}
              lang={lang}
              selected={selectedCode === shade.code}
              onSelect={() => onSelect(shade.code)}
            />
          ))}
        </div>
      </div>

      {selectedCode && (() => {
        const found = [...CATEGORIES, ...THREE_CATALOG.categories]
          .flatMap((c) => c.shades)
          .find((s) => s.code === selectedCode);
        if (!found) return null;
        const name = lang === "he" ? found.nameHe : found.nameAr;
        return (
          <div className="flex items-center gap-2.5 rounded-xl border border-fuchsia-400/30 bg-fuchsia-500/10 px-3 py-2.5">
            <div
              className="h-7 w-7 shrink-0 rounded-lg border-2 border-fuchsia-400/50"
              style={{ background: found.hex }}
            />
            <div className="min-w-0">
              <p className="text-xs text-white/50">{t.selectedPrefix}</p>
              <p className="truncate text-sm font-semibold text-white">{found.code} – {name}</p>
            </div>
            <button
              type="button"
              onClick={() => onSelect("")}
              className="mr-auto text-white/40 hover:text-white/70"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })()}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function PhotoAndColorPage() {
  const router = useRouter();
  const { isAuthenticated } = useConvexAuth();
  const formulaCount = useQuery(api.formulas.getCount);
  const currentUser = useQuery(api.users.getCurrentUser);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (formulaCount === undefined || currentUser === undefined) return;
    const isPaid = currentUser?.userType === "paid";
    if (!isPaid && formulaCount >= 1) {
      router.replace("/");
    }
  }, [isAuthenticated, formulaCount, currentUser, router]);

  const [lang, setLang]                 = useState<Lang>("he");
  const [photo, setPhoto]               = useState<{ file: File; preview: string } | null>(null);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [brand, setBrand]               = useState<CatalogId>("igora");
  // data-URL של התמונה. נשמר ל-localStorage (blob: לא שורד רענון) ומשמש גם
  // כקלט לניתוח. null כל עוד ההמרה לא הסתיימה או נכשלה — ואז פשוט אין ניתוח.
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);

  const handlePhotoSelect = useCallback((file: File, preview: string) => {
    setPhoto({ file, preview });
    setPhotoDataUrl(null);
    fileToDataUrl(file)
      .then(setPhotoDataUrl)
      .catch(() => setPhotoDataUrl(null)); // התמונה עדיין מוצגת; רק הניתוח לא יוצע
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("tintme_lang") as Lang | null;
    if (saved === "he" || saved === "ar") setLang(saved);
  }, []);

  const t     = T[lang];
  const canGo = !!selectedCode;

  return (
    <div
      dir="rtl"
      className="relative min-h-screen overflow-x-hidden"
      style={{ fontFamily: t.font }}
    >
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-br from-[#2d0645] via-[#4a0650] to-[#1a0535]" />
      <div className="pointer-events-none fixed -right-32 -top-32 h-[500px] w-[500px] rounded-full bg-fuchsia-700/25 blur-3xl" />
      <div className="pointer-events-none fixed -left-40 top-[30%] h-[420px] w-[420px] rounded-full bg-violet-800/20 blur-3xl" />
      <div className="pointer-events-none fixed bottom-0 right-1/3 h-80 w-80 rounded-full bg-rose-600/15 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-6xl px-4 pb-10 pt-4 sm:px-6">

        {/* Top bar */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-violet-600 shadow-lg shadow-fuchsia-900/40">
              <Palette className="h-5 w-5 text-white" />
            </div>
            <span className="font-black text-xl tracking-tight text-white">TintMe</span>
          </div>
          <button
            type="button"
            onClick={() => setLang((l) => (l === "he" ? "ar" : "he"))}
            className="rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium text-white/85 backdrop-blur-md transition-all hover:bg-white/18 active:scale-95"
          >
            {t.switchLabel}
          </button>
        </div>

        {/* Hero */}
        <div className="mb-7 text-center">
          <h1 className="bg-gradient-to-l from-fuchsia-300 via-white to-violet-300 bg-clip-text text-3xl font-black tracking-tight text-transparent sm:text-4xl">
            {t.pageTitle}
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-white/55">
            {t.pageSubtitle}
          </p>
        </div>

        {/* Two-panel layout */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_340px]">
          <div className="flex min-h-[520px] flex-col rounded-3xl border border-white/12 bg-white/6 p-5 shadow-2xl shadow-black/30 backdrop-blur-xl lg:min-h-[580px]">
            <ColorCatalog
              t={t}
              lang={lang}
              brand={brand}
              onBrandChange={setBrand}
              selectedCode={selectedCode}
              onSelect={(code) => setSelectedCode(code === "" ? null : code)}
            />
          </div>
          <div className="flex min-h-[380px] flex-col rounded-3xl border border-white/12 bg-white/6 p-5 shadow-2xl shadow-black/30 backdrop-blur-xl lg:min-h-[580px]">
            <PhotoDropzone
              t={t}
              photo={photo}
              onSelect={handlePhotoSelect}
              onClear={() => {
                setPhoto(null);
                setPhotoDataUrl(null);
              }}
            />
            <ShadeSuggestion
              lang={lang}
              photoDataUrl={photoDataUrl}
              catalogId={brand}
              mode="current"
              selectedCode={selectedCode}
              onSelect={setSelectedCode}
            />
          </div>
        </div>

        {/* CTA */}
        <div className="mt-5">
          <button
            type="button"
            onClick={() => {
              if (selectedCode) localStorage.setItem("tintme_current_shade", selectedCode);
              // רק data-URL נשמר: blob: URL מת ברגע שהעמוד הזה נפרק, ואז
              // page3 מציג src שבור.
              if (photoDataUrl) localStorage.setItem("tintme_current_photo", photoDataUrl);
              else localStorage.removeItem("tintme_current_photo");
              router.push("/page1b");
            }}
            disabled={!canGo}
            className={cn(
              "group relative w-full overflow-hidden rounded-2xl px-8 py-4 text-base font-bold text-white transition-all duration-300",
              canGo
                ? "bg-gradient-to-l from-[#7b2ff7] via-[#d4148c] to-[#f72585] shadow-2xl shadow-fuchsia-900/50 hover:scale-[1.015] active:scale-[0.98]"
                : "cursor-not-allowed bg-white/8 text-white/35",
            )}
          >
            {canGo && (
              <span className="pointer-events-none absolute inset-0 translate-x-full bg-gradient-to-l from-white/15 via-transparent to-transparent transition-transform duration-500 group-hover:translate-x-0" />
            )}
            <span className="relative flex items-center justify-center gap-2">
              <Sparkles className={cn("h-5 w-5", canGo ? "text-yellow-200" : "text-white/30")} />
              {canGo ? t.nextBtn : t.nextPending}
            </span>
          </button>
        </div>

        {/* Progress hints */}
        {!canGo && (
          <div className="mt-3 flex justify-center gap-5 text-xs text-white/38">
            <span className={cn("flex items-center gap-1.5", photo ? "text-emerald-400" : "text-white/25")}>
              <span className={cn("inline-block h-2 w-2 rounded-full border", photo ? "border-emerald-400 bg-emerald-400" : "border-white/20 border-dashed")} />
              {lang === "he" ? "תמונה (אופציונלי)" : "صورة (اختياري)"}
            </span>
            <span className={cn("flex items-center gap-1.5", selectedCode && "text-fuchsia-400")}>
              <span className={cn("inline-block h-2 w-2 rounded-full border", selectedCode ? "border-fuchsia-400 bg-fuchsia-400" : "border-white/30")} />
              {lang === "he" ? "בחירת גוון" : "اختيار درجة"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
