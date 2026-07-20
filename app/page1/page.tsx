"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CheckCircle2, Palette, Sparkles, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useConvexAuth } from "convex/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";

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
interface Shade {
  code: string;
  nameHe: string;
  nameAr: string;
  hex: string;
}

interface Category {
  id: string;
  labelHe: string;
  labelAr: string;
  shades: Shade[];
}

const CATEGORIES: Category[] = [
  {
    id: "natural",
    labelHe: "טבעיים",
    labelAr: "طبيعي",
    shades: [
      { code: "1-0",  nameHe: "שחור טבעי",                    nameAr: "أسود طبيعي",            hex: "#0D0D0D" },
      { code: "3-0",  nameHe: "חום כהה טבעי",                  nameAr: "بني غامق طبيعي",        hex: "#251510" },
      { code: "4-0",  nameHe: "חום בינוני טבעי",               nameAr: "بني متوسط طبيعي",       hex: "#4A2A15" },
      { code: "5-0",  nameHe: "חום בהיר טבעי",                 nameAr: "بني فاتح طبيعي",        hex: "#5A3620" },
      { code: "5-00", nameHe: "חום בהיר טבעי אינטנסיב",        nameAr: "بني فاتح مكثف",         hex: "#5C3820" },
      { code: "6-0",  nameHe: "בלונד כהה טבעי",                nameAr: "أشقر غامق طبيعي",       hex: "#785832" },
      { code: "6-00", nameHe: "בלונד כהה טבעי אינטנסיב",       nameAr: "أشقر غامق مكثف",        hex: "#7A5A30" },
      { code: "7-0",  nameHe: "בלונד בינוני טבעי",             nameAr: "أشقر وسط طبيعي",        hex: "#987840" },
      { code: "7-00", nameHe: "בלונד בינוני טבעי אינטנסיב",    nameAr: "أشقر وسط مكثف",         hex: "#9A7A3A" },
      { code: "8-0",  nameHe: "בלונד בהיר טבעי",               nameAr: "أشقر فاتح طبيعي",       hex: "#BEA062" },
      { code: "8-00", nameHe: "בלונד בהיר טבעי אינטנסיב",      nameAr: "أشقر فاتح مكثف",        hex: "#C0A060" },
      { code: "9-0",  nameHe: "בלונד בהיר מאוד טבעי",          nameAr: "أشقر فاتح جداً",        hex: "#D2B668" },
      { code: "9-00", nameHe: "בלונד בהיר מאוד טבעי אינטנסיב", nameAr: "أشقر فاتح جداً مكثف",   hex: "#D4B870" },
    ],
  },
  {
    id: "brown",
    labelHe: "חומים",
    labelAr: "البني",
    shades: [
      { code: "4-60", nameHe: "חום שוקולד",          nameAr: "بني شوكولاتة",        hex: "#6A4A2A" },
      { code: "5-1",  nameHe: "חום בהיר אפרפר",       nameAr: "بني فاتح رمادي",      hex: "#4E3C30" },
      { code: "5-13", nameHe: "חום בהיר אפרפר זהב",   nameAr: "بني فاتح رمادي ذهبي", hex: "#5A4228" },
      { code: "5-21", nameHe: "חום בהיר פנינה אפרפר", nameAr: "بني لؤلؤي رمادي",    hex: "#5A4044" },
      { code: "5-50", nameHe: "חום בהיר זהב",         nameAr: "بني فاتح ذهبي",       hex: "#9A7A4A" },
      { code: "5-60", nameHe: "חום בהיר שוקולד",      nameAr: "بني شوكولاتة فاتح",   hex: "#8A6A4A" },
      { code: "5-80", nameHe: "חום בהיר אדום",        nameAr: "بني فاتح أحمر",       hex: "#7A1E1E" },
    ],
  },
  {
    id: "darkblonde",
    labelHe: "בלונד כהה",
    labelAr: "أشقر غامق",
    shades: [
      { code: "6-1",   nameHe: "בלונד כהה אפרפר",          nameAr: "أشقر غامق رمادي",          hex: "#6A5848" },
      { code: "6-12",  nameHe: "בלונד כהה אפרפר פנינה",    nameAr: "أشقر غامق لؤلؤي",         hex: "#6A5C5C" },
      { code: "6-50",  nameHe: "בלונד כהה זהב",            nameAr: "أشقر غامق ذهبي",          hex: "#A88A4A" },
      { code: "6-70",  nameHe: "בלונד כהה מהוגני",         nameAr: "أشقر غامق ماهوجني",       hex: "#7A3A2A" },
      { code: "6-80",  nameHe: "בלונד כהה אדום",           nameAr: "أشقر غامق أحمر",          hex: "#7A2A2A" },
      { code: "7-1",   nameHe: "בלונד בינוני אפרפר",       nameAr: "أشقر وسط رمادي",          hex: "#887868" },
      { code: "7-21",  nameHe: "בלונד בינוני פנינה אפרפר", nameAr: "أشقر وسط لؤلؤي",         hex: "#908080" },
      { code: "7-24",  nameHe: "בלונד בינוני פנינה בז'",   nameAr: "أشقر وسط لؤلؤي بيج",     hex: "#9A8870" },
      { code: "7-50",  nameHe: "בלונד בינוני זהב",         nameAr: "أشقر وسط ذهبي",           hex: "#C0A05A" },
      { code: "7-60",  nameHe: "בלונד בינוני שוקולד",      nameAr: "أشقر وسط شوكولاتة",       hex: "#A0704A" },
      { code: "7-70",  nameHe: "בלונד בינוני מהוגני",      nameAr: "أشقر وسط ماهوجني",        hex: "#8A4A3A" },
      { code: "7-710", nameHe: "בלונד בינוני מהוגני טבעי", nameAr: "أشقر وسط ماهوجني طبيعي",  hex: "#8A5A4A" },
    ],
  },
  {
    id: "blonde",
    labelHe: "בלונד",
    labelAr: "أشقر",
    shades: [
      { code: "8-1",  nameHe: "בלונד בהיר אפרפר",          nameAr: "أشقر فاتح رمادي",            hex: "#A89888" },
      { code: "8-11", nameHe: "בלונד בהיר אפרפר כפול",     nameAr: "أشقر فاتح رمادي مضاعف",      hex: "#A09898" },
      { code: "8-19", nameHe: "בלונד בהיר אפרפר סגול",     nameAr: "أشقر فاتح رمادي بنفسجي",     hex: "#9090A8" },
      { code: "8-21", nameHe: "בלונד בהיר פנינה אפרפר",    nameAr: "أشقر فاتح لؤلؤي",            hex: "#B8AAAA" },
      { code: "8-50", nameHe: "בלונד בהיר זהב",            nameAr: "أشقر فاتح ذهبي",             hex: "#D2B46A" },
      { code: "8-60", nameHe: "בלונד בהיר שוקולד",         nameAr: "أشقر فاتح شوكولاتة",         hex: "#B88A5A" },
      { code: "9-1",  nameHe: "בלונד בהיר מאוד אפרפר",    nameAr: "أشقر فاتح جداً رمادي",       hex: "#C0B0A0" },
      { code: "9-24", nameHe: "בלונד בהיר מאוד פנינה בז'", nameAr: "أشقر فاتح جداً لؤلؤي بيج",  hex: "#CCBAA8" },
      { code: "9-50", nameHe: "בלונד בהיר מאוד זהב",      nameAr: "أشقر فاتح جداً ذهبي",        hex: "#E5C46A" },
      { code: "9-60", nameHe: "בלונד בהיר מאוד שוקולד",   nameAr: "أشقر فاتح جداً شوكولاتة",    hex: "#C89A6A" },
    ],
  },
  {
    id: "lightblonde",
    labelHe: "בלונד בהיר",
    labelAr: "أشقر مضاء",
    shades: [
      { code: "9.5-1",  nameHe: "פסטל אפרפר",       nameAr: "باستيل رمادي",      hex: "#D8D0C8" },
      { code: "9.5-22", nameHe: "פסטל פנינה",        nameAr: "باستيل لؤلؤي",      hex: "#D8D0E8" },
      { code: "9.5-31", nameHe: "פסטל בז' זהב",      nameAr: "باستيل بيج ذهبي",   hex: "#E0C8A8" },
      { code: "9.5-4",  nameHe: "פסטל בז'",          nameAr: "باستيل بيج",         hex: "#E6D2B8" },
      { code: "9.5-49", nameHe: "פסטל בז' נחושת",    nameAr: "باستيل بيج نحاسي",  hex: "#D8B48A" },
      { code: "10-0",   nameHe: "בלונד טבעי",        nameAr: "أشقر طبيعي",        hex: "#F0E8D8" },
      { code: "10-1",   nameHe: "בלונד אפרפר",       nameAr: "أشقر رمادي",         hex: "#E0D8C8" },
      { code: "10-4",   nameHe: "בלונד בז'",         nameAr: "أشقر بيج",           hex: "#E8D2B8" },
      { code: "10-14",  nameHe: "בלונד אפרפר בז'",   nameAr: "أشقر رمادي بيج",    hex: "#E4D4C4" },
      { code: "10-21",  nameHe: "בלונד פנינה אפרפר", nameAr: "أشقر لؤلؤي رمادي",  hex: "#E6D8CC" },
      { code: "10-46",  nameHe: "בלונד בז' נחושת",   nameAr: "أشقر بيج نحاسي",    hex: "#E0B88A" },
    ],
  },
  {
    id: "ultrablonde",
    labelHe: "אולטרה בלונד",
    labelAr: "أشقر فائق",
    shades: [
      { code: "12-0",  nameHe: "אולטרה בלונד טבעי",         nameAr: "أشقر فائق طبيعي",           hex: "#F4ECDC" },
      { code: "12-1",  nameHe: "אולטרה בלונד אפרפר",        nameAr: "أشقر فائق رمادي",           hex: "#E8E0D0" },
      { code: "12-2",  nameHe: "אולטרה בלונד פנינה",        nameAr: "أشقر فائق لؤلؤي",           hex: "#E8DCE8" },
      { code: "12-4",  nameHe: "אולטרה בלונד בז'",          nameAr: "أشقر فائق بيج",             hex: "#EAD8C4" },
      { code: "12-11", nameHe: "אולטרה בלונד אפרפר כפול",   nameAr: "أشقر فائق رمادي مضاعف",    hex: "#E0D8C8" },
      { code: "12-19", nameHe: "אולטרה בלונד אפרפר סגול",   nameAr: "أشقر فائق رمادي بنفسجي",   hex: "#D8C8D8" },
    ],
  },
  {
    id: "grey",
    labelHe: "אפור / סילבר",
    labelAr: "رمادي / فضي",
    shades: [
      { code: "slate-grey", nameHe: "אפור כהה", nameAr: "رمادي داكن",  hex: "#7A7A7A" },
      { code: "grey-lilac", nameHe: "אפור לילך", nameAr: "رمادي ليلكي", hex: "#8A7A8A" },
      { code: "dove-grey",  nameHe: "אפור יונה", nameAr: "رمادي حمامة", hex: "#B0B0B0" },
      { code: "silver",     nameHe: "סילבר",     nameAr: "فضي",         hex: "#C8C8C8" },
    ],
  },
  {
    id: "fashion",
    labelHe: "אופנה / בוסטרים",
    labelAr: "موضة / معززات",
    shades: [
      { code: "0-99", nameHe: "בוסטר סגול",       nameAr: "معزز بنفسجي",       hex: "#6A2A8A" },
      { code: "L-89", nameHe: "אופנה אדום-סגול",  nameAr: "موضة أحمر-بنفسجي",  hex: "#8A2A5A" },
      { code: "0-89", nameHe: "בוסטר אדום-סגול",  nameAr: "معزز أحمر-بنفسجي",  hex: "#8A2A5A" },
      { code: "0-33", nameHe: "נייטרלייזר זהב",   nameAr: "محيد ذهبي",          hex: "#C8A84A" },
      { code: "L-88", nameHe: "אופנה סגול",       nameAr: "موضة بنفسجي",       hex: "#7A2A8A" },
      { code: "0-22", nameHe: "נייטרלייזר פנינה", nameAr: "محيد لؤلؤي",        hex: "#C0C0D8" },
      { code: "0-11", nameHe: "נייטרלייזר אפרפר", nameAr: "محيد رمادي",         hex: "#A0A0A0" },
      { code: "0-00", nameHe: "מחזק נייטרל",      nameAr: "معزز محايد",         hex: "#D8D8D0" },
    ],
  },
];

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
          src={`/hair-colors/${shade.code}.png`}
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
  selectedCode,
  onSelect,
}: {
  t: (typeof T)[Lang];
  lang: Lang;
  selectedCode: string | null;
  onSelect: (code: string) => void;
}) {
  const [activeId, setActiveId] = useState(CATEGORIES[0].id);
  const active = CATEGORIES.find((c) => c.id === activeId) ?? CATEGORIES[0];

  return (
    <div className="flex h-full flex-col gap-4">
      <div>
        <p className="text-lg font-bold text-white">{t.catalogTitle}</p>
        <p className="mt-0.5 text-sm text-white/55">{t.catalogSub}</p>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {CATEGORIES.map((cat) => (
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
        const found = CATEGORIES.flatMap((c) => c.shades).find((s) => s.code === selectedCode);
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
              selectedCode={selectedCode}
              onSelect={(code) => setSelectedCode(code === "" ? null : code)}
            />
          </div>
          <div className="flex min-h-[380px] flex-col rounded-3xl border border-white/12 bg-white/6 p-5 shadow-2xl shadow-black/30 backdrop-blur-xl lg:min-h-[580px]">
            <PhotoDropzone
              t={t}
              photo={photo}
              onSelect={(f, p) => setPhoto({ file: f, preview: p })}
              onClear={() => setPhoto(null)}
            />
          </div>
        </div>

        {/* CTA */}
        <div className="mt-5">
          <button
            type="button"
            onClick={() => {
              if (selectedCode) localStorage.setItem("tintme_current_shade", selectedCode);
              if (photo?.preview) localStorage.setItem("tintme_current_photo", photo.preview);
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
