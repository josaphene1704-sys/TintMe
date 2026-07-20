"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  Palette,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils";

// ─── Translations ─────────────────────────────────────────────────────────────
const T = {
  he: {
    switchLabel:    "العربية",
    font:           "var(--font-rubik), Arial, sans-serif",
    stepBadge:      "שלב 2 מתוך 3",
    pageTitle:      "מה הגוון שחלמת עליו?",
    pageSubtitle:   "העלי תמונת השראה ובחרי את הגוון היעד – נבנה עבורך את הנוסחה המדויקת",
    backBtn:        "חזרה",
    uploadBadge:    "תמונת השראה",
    uploadTitle:    "תמונת השיער הרצוי שלך",
    uploadSubtitle: "תמונת השראה לגוון אליו תרצי להגיע",
    uploadCta:      "לחצי להעלאת תמונת השראה",
    uploadOr:       "או גרירת קובץ לכאן",
    uploadedLabel:  "תמונה הועלתה",
    uploadedChange: "לחצי להחלפה",
    catalogBadge:   "גוון יעד",
    catalogTitle:   "בחרי את גוון היעד",
    catalogSub:     "בחרי את הגוון אליו תרצי להגיע מתוך קטלוג הצבעים Igora Royal של Schwarzkopf",
    selectedPrefix: "גוון יעד נבחר:",
    nextBtn:        "המשך לאבחון השיער ←",
    nextPending:    "בחרי גוון יעד להמשך",
    checkPhoto:     "תמונת השראה (אופציונלי)",
    checkShade:     "בחירת גוון יעד",
  },
  ar: {
    switchLabel:    "עברית",
    font:           "var(--font-cairo), Arial, sans-serif",
    stepBadge:      "الخطوة 2 من 3",
    pageTitle:      "ما اللون الذي حلمتِ به؟",
    pageSubtitle:   "ارفعي صورة إلهام واختاري الدرجة المستهدفة – سنبني لكِ التركيبة الدقيقة",
    backBtn:        "رجوع",
    uploadBadge:    "صورة إلهام",
    uploadTitle:    "صورة شعرك المرغوب",
    uploadSubtitle: "صورة إلهام للدرجة التي تريدين الوصول إليها",
    uploadCta:      "اضغطي لرفع صورة الإلهام",
    uploadOr:       "أو اسحبي الملف هنا",
    uploadedLabel:  "تم رفع الصورة",
    uploadedChange: "اضغطي للتغيير",
    catalogBadge:   "درجة الهدف",
    catalogTitle:   "اختاري الدرجة المستهدفة",
    catalogSub:     "اختاري الدرجة التي تريدين الوصول إليها من كتالوج ألوان Igora Royal من Schwarzkopf",
    selectedPrefix: "الدرجة المختارة:",
    nextBtn:        "التالي – تشخيص الشعر ←",
    nextPending:    "اختاري درجة هدف للمتابعة",
    checkPhoto:     "صورة إلهام (اختياري)",
    checkShade:     "اختيار درجة هدف",
  },
} as const;

type Lang = keyof typeof T;

// ─── Catalog data (Igora Royal, desired-hair context) ────────────────────────
interface Shade    { code: string; nameHe: string; nameAr: string; hex: string }
interface Category { id: string;  labelHe: string; labelAr: string; shades: Shade[] }

const CATEGORIES: Category[] = [
  {
    id: "natural", labelHe: "טבעיים", labelAr: "طبيعي",
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
      { code: "9-00", nameHe: "בלונד בהיר מאוד טבעי אינטנסיב", nameAr: "أشقر فاتح جداً مكثف",  hex: "#D4B870" },
    ],
  },
  {
    id: "brown", labelHe: "חומים", labelAr: "البني",
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
    id: "darkblonde", labelHe: "בלונד כהה", labelAr: "أشقر غامق",
    shades: [
      { code: "6-1",   nameHe: "בלונד כהה אפרפר",          nameAr: "أشقر غامق رمادي",         hex: "#6A5848" },
      { code: "6-12",  nameHe: "בלונד כהה אפרפר פנינה",    nameAr: "أشقر غامق لؤلؤي",        hex: "#6A5C5C" },
      { code: "6-50",  nameHe: "בלונד כהה זהב",            nameAr: "أشقر غامق ذهبي",         hex: "#A88A4A" },
      { code: "6-70",  nameHe: "בלונד כהה מהוגני",         nameAr: "أشقر غامق ماهوجني",      hex: "#7A3A2A" },
      { code: "6-80",  nameHe: "בלונד כהה אדום",           nameAr: "أشقر غامق أحمر",         hex: "#7A2A2A" },
      { code: "7-1",   nameHe: "בלונד בינוני אפרפר",       nameAr: "أشقر وسط رمادي",         hex: "#887868" },
      { code: "7-21",  nameHe: "בלונד בינוני פנינה אפרפר", nameAr: "أشقر وسط لؤلؤي",        hex: "#908080" },
      { code: "7-24",  nameHe: "בלונד בינוני פנינה בז'",   nameAr: "أشقر وسط لؤلؤي بيج",    hex: "#9A8870" },
      { code: "7-50",  nameHe: "בלונד בינוני זהב",         nameAr: "أشقر وسط ذهبي",          hex: "#C0A05A" },
      { code: "7-60",  nameHe: "בלונד בינוני שוקולד",      nameAr: "أشقر وسط شوكولاتة",      hex: "#A0704A" },
      { code: "7-70",  nameHe: "בלונד בינוני מהוגני",      nameAr: "أشقر وسط ماهوجني",       hex: "#8A4A3A" },
      { code: "7-710", nameHe: "בלונד בינוני מהוגני טבעי", nameAr: "أشقر وسط ماهوجني طبيعي", hex: "#8A5A4A" },
    ],
  },
  {
    id: "blonde", labelHe: "בלונד", labelAr: "أشقر",
    shades: [
      { code: "8-1",  nameHe: "בלונד בהיר אפרפר",          nameAr: "أشقر فاتح رمادي",           hex: "#A89888" },
      { code: "8-11", nameHe: "בלונד בהיר אפרפר כפול",     nameAr: "أشقر فاتح رمادي مضاعف",     hex: "#A09898" },
      { code: "8-19", nameHe: "בלונד בהיר אפרפר סגול",     nameAr: "أشقر فاتح رمادي بنفسجي",    hex: "#9090A8" },
      { code: "8-21", nameHe: "בלונד בהיר פנינה אפרפר",    nameAr: "أشقر فاتح لؤلؤي",           hex: "#B8AAAA" },
      { code: "8-50", nameHe: "בלונד בהיר זהב",            nameAr: "أشقر فاتح ذهبي",            hex: "#D2B46A" },
      { code: "8-60", nameHe: "בלונד בהיר שוקולד",         nameAr: "أشقر فاتح شوكولاتة",        hex: "#B88A5A" },
      { code: "9-1",  nameHe: "בלונד בהיר מאוד אפרפר",    nameAr: "أشقر فاتح جداً رمادي",      hex: "#C0B0A0" },
      { code: "9-24", nameHe: "בלונד בהיר מאוד פנינה בז'", nameAr: "أشقر فاتح جداً لؤلؤي بيج", hex: "#CCBAA8" },
      { code: "9-50", nameHe: "בלונד בהיר מאוד זהב",      nameAr: "أشقر فاتح جداً ذهبي",       hex: "#E5C46A" },
      { code: "9-60", nameHe: "בלונד בהיר מאוד שוקולד",   nameAr: "أشقر فاتح جداً شوكولاتة",   hex: "#C89A6A" },
    ],
  },
  {
    id: "lightblonde", labelHe: "בלונד בהיר", labelAr: "أشقر مضاء",
    shades: [
      { code: "9.5-1",  nameHe: "פסטל אפרפר",    nameAr: "باستيل رمادي",     hex: "#D8D0C8" },
      { code: "9.5-22", nameHe: "פסטל פנינה",     nameAr: "باستيل لؤلؤي",     hex: "#D8D0E8" },
      { code: "9.5-31", nameHe: "פסטל בז' זהב",   nameAr: "باستيل بيج ذهبي",  hex: "#E0C8A8" },
      { code: "9.5-4",  nameHe: "פסטל בז'",       nameAr: "باستيل بيج",        hex: "#E6D2B8" },
      { code: "9.5-49", nameHe: "פסטל בז' נחושת", nameAr: "باستيل بيج نحاسي", hex: "#D8B48A" },
      { code: "10-0",   nameHe: "בלונד טבעי",     nameAr: "أشقر طبيعي",       hex: "#F0E8D8" },
      { code: "10-1",   nameHe: "בלונד אפרפר",    nameAr: "أشقر رمادي",        hex: "#E0D8C8" },
      { code: "10-4",   nameHe: "בלונד בז'",      nameAr: "أشقر بيج",          hex: "#E8D2B8" },
      { code: "10-14",  nameHe: "בלונד אפרפר בז'",   nameAr: "أشقر رمادي بيج",   hex: "#E4D4C4" },
      { code: "10-21",  nameHe: "בלונד פנינה אפרפר", nameAr: "أشقر لؤلؤي رمادي", hex: "#E6D8CC" },
      { code: "10-46",  nameHe: "בלונד בז' נחושת",   nameAr: "أشقر بيج نحاسي",   hex: "#E0B88A" },
    ],
  },
  {
    id: "ultrablonde", labelHe: "אולטרה בלונד", labelAr: "أشقر فائق",
    shades: [
      { code: "12-0",  nameHe: "אולטרה בלונד טבעי",       nameAr: "أشقر فائق طبيعي",          hex: "#F4ECDC" },
      { code: "12-1",  nameHe: "אולטרה בלונד אפרפר",      nameAr: "أشقر فائق رمادي",          hex: "#E8E0D0" },
      { code: "12-2",  nameHe: "אולטרה בלונד פנינה",      nameAr: "أشقر فائق لؤلؤي",          hex: "#E8DCE8" },
      { code: "12-4",  nameHe: "אולטרה בלונד בז'",        nameAr: "أشقر فائق بيج",            hex: "#EAD8C4" },
      { code: "12-11", nameHe: "אולטרה בלונד אפרפר כפול", nameAr: "أشقر فائق رمادي مضاعف",   hex: "#E0D8C8" },
      { code: "12-19", nameHe: "אולטרה בלונד אפרפר סגול", nameAr: "أشقر فائق رمادي بنفسجي",  hex: "#D8C8D8" },
    ],
  },
  {
    id: "grey", labelHe: "אפור / סילבר", labelAr: "رمادي / فضي",
    shades: [
      { code: "slate-grey", nameHe: "אפור כהה", nameAr: "رمادي داكن",  hex: "#7A7A7A" },
      { code: "grey-lilac", nameHe: "אפור לילך", nameAr: "رمادي ليلكي", hex: "#8A7A8A" },
      { code: "dove-grey",  nameHe: "אפור יונה", nameAr: "رمادي حمامة", hex: "#B0B0B0" },
      { code: "silver",     nameHe: "סילבר",     nameAr: "فضي",         hex: "#C8C8C8" },
    ],
  },
  {
    id: "fashion", labelHe: "אופנה / בוסטרים", labelAr: "موضة / معززات",
    shades: [
      { code: "0-99", nameHe: "בוסטר סגול",       nameAr: "معزز بنفسجي",      hex: "#6A2A8A" },
      { code: "L-89", nameHe: "אופנה אדום-סגול",  nameAr: "موضة أحمر-بنفسجي", hex: "#8A2A5A" },
      { code: "0-89", nameHe: "בוסטר אדום-סגול",  nameAr: "معزز أحمر-بنفسجي", hex: "#8A2A5A" },
      { code: "0-33", nameHe: "נייטרלייזר זהב",   nameAr: "محيد ذهبي",         hex: "#C8A84A" },
      { code: "L-88", nameHe: "אופנה סגול",       nameAr: "موضة بنفسجي",      hex: "#7A2A8A" },
      { code: "0-22", nameHe: "נייטרלייזר פנינה", nameAr: "محيد لؤلؤي",       hex: "#C0C0D8" },
      { code: "0-11", nameHe: "נייטרלייזר אפרפר", nameAr: "محيد رمادي",        hex: "#A0A0A0" },
      { code: "0-00", nameHe: "מחזק נייטרל",      nameAr: "معزز محايد",        hex: "#D8D8D0" },
    ],
  },
];

const ALL_SHADES = CATEGORIES.flatMap((c) => c.shades);

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
          ? "border-fuchsia-400 shadow-[0_0_18px_4px_rgba(232,121,249,0.5)] scale-[1.07]"
          : "border-transparent hover:border-fuchsia-400/40 hover:scale-[1.04]",
      )}
    >
      <div className="aspect-square w-full overflow-hidden">
        <Image
          src={`/hair-colors/${shade.code}.png`}
          alt={name}
          width={80}
          height={80}
          className="h-full w-full object-cover"
          onError={(e) => {
            const img = e.currentTarget;
            img.style.display = "none";
            const parent = img.parentElement;
            if (parent) parent.style.background = shade.hex;
          }}
        />
      </div>
      <div className="bg-white/10 px-1 py-1 text-center backdrop-blur-sm">
        <p className="truncate text-[10px] font-bold text-white/90 leading-none mb-0.5">{shade.code}</p>
        <p className="text-[9px] font-medium text-white/60 leading-tight line-clamp-2 break-words">
          {name}
        </p>
      </div>
      {selected && (
        <div className="absolute left-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-fuchsia-500 shadow-lg">
          <CheckCircle2 className="h-3 w-3 text-white" />
        </div>
      )}
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DesiredHairPage() {
  const router = useRouter();
  const [lang, setLang]               = useState<Lang>("he");
  const [photo, setPhoto]             = useState<{ preview: string } | null>(null);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [activeTab, setActiveTab]     = useState(CATEGORIES[0].id);
  const [isDragging, setIsDragging]   = useState(false);
  const fileInputRef                  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("tintme_lang") as Lang | null;
    if (saved === "he" || saved === "ar") setLang(saved);
  }, []);

  const t          = T[lang];
  const currentCat = CATEGORIES.find((c) => c.id === activeTab) ?? CATEGORIES[0];
  const canGo      = !!selectedCode;
  const selectedShadeObj = selectedCode ? ALL_SHADES.find((s) => s.code === selectedCode) : null;

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    setPhoto({ preview: URL.createObjectURL(file) });
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile],
  );

  return (
    <div
      dir="rtl"
      className="relative min-h-screen overflow-x-hidden"
      style={{ fontFamily: t.font }}
    >
      {/* ── Sparkle keyframes ─────────────────────────────────────────────── */}
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0; transform: scale(0.4) rotate(0deg); }
          50%       { opacity: 1; transform: scale(1)   rotate(20deg); }
        }
        @keyframes twinkle-slow {
          0%, 100% { opacity: 0;    transform: scale(0.3) rotate(0deg); }
          40%       { opacity: 0.9; transform: scale(1.1) rotate(-15deg); }
          60%       { opacity: 0.7; transform: scale(0.9) rotate(10deg); }
        }
        @keyframes drift {
          0%, 100% { transform: translateY(0px)   scale(1); }
          50%       { transform: translateY(-6px)  scale(1.1); }
        }
      `}</style>

      {/* ── Background – rose/pink magical gradient ───────────────────────── */}
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-br from-[#3a0530] via-[#6e1055] to-[#1f0428]" />
      {/* Ambient blobs – warmer & rosier */}
      <div className="pointer-events-none fixed -right-24 -top-24 h-[480px] w-[480px] rounded-full bg-rose-500/30 blur-[120px]" />
      <div className="pointer-events-none fixed -left-32 top-[25%] h-[420px] w-[420px] rounded-full bg-pink-600/22 blur-[110px]" />
      <div className="pointer-events-none fixed bottom-0 left-1/4 h-80 w-80 rounded-full bg-fuchsia-500/20 blur-[100px]" />
      <div className="pointer-events-none fixed top-[55%] right-[10%] h-64 w-64 rounded-full bg-rose-400/15 blur-[90px]" />

      {/* ── Sparkles ──────────────────────────────────────────────────────── */}
      {([
        // [top, left, size(px), delay, duration, color]
        ["4%",  "8%",  "✦", "0s",    "2.8s", "#fda4af"],
        ["7%",  "55%", "✧", "0.6s",  "3.5s", "#f9a8d4"],
        ["3%",  "82%", "✦", "1.1s",  "2.4s", "#ffffff"],
        ["12%", "30%", "✧", "1.8s",  "3.1s", "#fbcfe8"],
        ["14%", "70%", "✦", "0.3s",  "2.6s", "#fda4af"],
        ["22%", "5%",  "✧", "2.2s",  "3.8s", "#f9a8d4"],
        ["20%", "45%", "✦", "0.9s",  "2.2s", "#ffffff"],
        ["18%", "90%", "✧", "1.5s",  "3.3s", "#fbcfe8"],
        ["30%", "20%", "✦", "0.1s",  "2.9s", "#fda4af"],
        ["33%", "62%", "✧", "2.5s",  "3.6s", "#ffffff"],
        ["28%", "78%", "✦", "1.3s",  "2.3s", "#f9a8d4"],
        ["40%", "10%", "✧", "0.7s",  "3.2s", "#fbcfe8"],
        ["42%", "35%", "✦", "1.9s",  "2.7s", "#fda4af"],
        ["38%", "88%", "✧", "0.4s",  "3.9s", "#ffffff"],
        ["50%", "52%", "✦", "2.1s",  "2.5s", "#f9a8d4"],
        ["48%", "25%", "✧", "1.6s",  "3.4s", "#fbcfe8"],
        ["55%", "72%", "✦", "0.8s",  "2.1s", "#fda4af"],
        ["58%", "3%",  "✧", "2.4s",  "3.7s", "#ffffff"],
        ["60%", "40%", "✦", "1.2s",  "2.8s", "#f9a8d4"],
        ["65%", "85%", "✧", "0.2s",  "3.0s", "#fbcfe8"],
        ["68%", "15%", "✦", "1.7s",  "2.4s", "#fda4af"],
        ["70%", "60%", "✧", "2.7s",  "3.5s", "#ffffff"],
        ["75%", "30%", "✦", "0.5s",  "2.6s", "#f9a8d4"],
        ["72%", "92%", "✧", "1.4s",  "3.1s", "#fbcfe8"],
        ["80%", "48%", "✦", "2.0s",  "2.3s", "#fda4af"],
        ["82%", "7%",  "✧", "0.9s",  "3.8s", "#ffffff"],
        ["78%", "75%", "✦", "1.8s",  "2.7s", "#f9a8d4"],
        ["88%", "22%", "✧", "0.3s",  "3.2s", "#fbcfe8"],
        ["85%", "58%", "✦", "2.3s",  "2.5s", "#fda4af"],
        ["90%", "88%", "✧", "1.0s",  "3.6s", "#ffffff"],
        ["93%", "42%", "✦", "1.5s",  "2.2s", "#f9a8d4"],
        ["95%", "12%", "✧", "2.6s",  "3.4s", "#fbcfe8"],
        ["92%", "68%", "✦", "0.6s",  "2.9s", "#fda4af"],
        ["8%",  "95%", "✧", "2.0s",  "2.6s", "#ffffff"],
        ["45%", "97%", "✦", "1.1s",  "3.3s", "#f9a8d4"],
      ] as [string, string, string, string, string, string][]).map(([top, left, char, delay, duration, color], i) => (
        <div
          key={i}
          className="pointer-events-none fixed z-[1] select-none"
          style={{
            top, left,
            color,
            fontSize: i % 3 === 0 ? "10px" : i % 3 === 1 ? "7px" : "13px",
            animation: `${i % 2 === 0 ? "twinkle" : "twinkle-slow"} ${duration} ${delay} infinite ease-in-out`,
            textShadow: `0 0 6px ${color}, 0 0 12px ${color}80`,
          }}
        >
          {char}
        </div>
      ))}

      <div className="relative z-10 mx-auto max-w-6xl px-4 pb-12 pt-4 sm:px-6">

        {/* ── Top bar ─────────────────────────────────────────────────────── */}
        <div className="mb-5 flex items-center justify-between">
          {/* Left: back + logo */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/page1")}
              className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/8 px-3 py-1.5 text-sm font-medium text-white/65 backdrop-blur-md transition-all hover:bg-white/15 hover:text-white active:scale-95"
            >
              <ArrowRight className="h-4 w-4" />
              {t.backBtn}
            </button>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-violet-600 shadow-lg shadow-fuchsia-900/40">
                <Palette className="h-4 w-4 text-white" />
              </div>
              <span className="font-black text-lg tracking-tight text-white">TintMe</span>
            </div>
          </div>

          {/* Right: step badge + lang switcher */}
          <div className="flex items-center gap-3">
            <span className="hidden rounded-full border border-fuchsia-400/30 bg-fuchsia-500/15 px-3 py-1 text-xs font-semibold text-fuchsia-300 sm:inline-block">
              {t.stepBadge}
            </span>
            <button
              type="button"
              onClick={() => setLang((l) => (l === "he" ? "ar" : "he"))}
              className="rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium text-white/85 backdrop-blur-md transition-all hover:bg-white/18 active:scale-95"
            >
              {t.switchLabel}
            </button>
          </div>
        </div>

        {/* ── Hero ────────────────────────────────────────────────────────── */}
        <div className="mb-6 text-center">
          <h1 className="bg-gradient-to-l from-fuchsia-300 via-white to-violet-300 bg-clip-text text-3xl font-black tracking-tight text-transparent sm:text-4xl">
            {t.pageTitle}
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-white/50">
            {t.pageSubtitle}
          </p>
        </div>

        {/* ── Main grid: Catalog (wide) + Photo (narrow) ──────────────────── */}
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">

          {/* ── Catalog panel ─────────────────────────────────────────────── */}
          <div className="flex flex-col overflow-hidden rounded-3xl border border-white/15 bg-white/[0.07] shadow-2xl shadow-black/30 backdrop-blur-xl">

            {/* Panel header */}
            <div className="border-b border-white/10 px-5 pt-5 pb-4">
              <div className="mb-1 flex items-center gap-2">
                <span className="rounded-full border border-violet-400/35 bg-violet-500/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-violet-300">
                  {t.catalogBadge}
                </span>
              </div>
              <p className="text-base font-bold text-white">{t.catalogTitle}</p>
              <p className="mt-0.5 text-xs text-white/40">{t.catalogSub}</p>
            </div>

            {/* Category tabs */}
            <div
              className="flex gap-1.5 overflow-x-auto px-5 py-3"
              style={{ scrollbarWidth: "none" }}
            >
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveTab(cat.id)}
                  className={cn(
                    "shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-200",
                    activeTab === cat.id
                      ? "bg-gradient-to-l from-fuchsia-600 to-violet-600 text-white shadow-lg shadow-fuchsia-900/40"
                      : "border border-white/15 bg-white/[0.06] text-white/55 hover:bg-white/[0.12] hover:text-white/90",
                  )}
                >
                  {lang === "he" ? cat.labelHe : cat.labelAr}
                </button>
              ))}
            </div>

            {/* Shade grid */}
            <div className="flex-1 overflow-y-auto px-5 pb-5">
              <div
                className="grid grid-cols-4 gap-2.5 sm:grid-cols-5 md:grid-cols-6"
              >
                {currentCat.shades.map((shade) => (
                  <ColorChip
                    key={shade.code}
                    shade={shade}
                    lang={lang}
                    selected={selectedCode === shade.code}
                    onSelect={() =>
                      setSelectedCode((prev) =>
                        prev === shade.code ? null : shade.code,
                      )
                    }
                  />
                ))}
              </div>
            </div>

            {/* Selected shade strip */}
            {selectedShadeObj && (
              <div className="mx-5 mb-5 flex items-center gap-3 rounded-2xl border border-fuchsia-400/25 bg-fuchsia-500/10 px-4 py-3">
                <div
                  className="relative h-9 w-9 shrink-0 overflow-hidden rounded-xl border-2 border-fuchsia-400/50 shadow-[0_0_10px_2px_rgba(232,121,249,0.4)]"
                >
                  <Image
                    src={`/hair-colors/${selectedShadeObj.code}.png`}
                    alt={selectedShadeObj.code}
                    fill
                    className="object-cover"
                    sizes="36px"
                    onError={(e) => {
                      const img = e.currentTarget;
                      img.style.display = "none";
                      const parent = img.parentElement;
                      if (parent) parent.style.background = selectedShadeObj.hex;
                    }}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-fuchsia-300/70">{t.selectedPrefix}</p>
                  <p className="truncate text-sm font-bold text-white">
                    {selectedShadeObj.code} —{" "}
                    {lang === "he" ? selectedShadeObj.nameHe : selectedShadeObj.nameAr}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCode(null)}
                  className="text-white/30 transition-colors hover:text-white/70"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* ── Photo upload panel ────────────────────────────────────────── */}
          <div className="flex flex-col overflow-hidden rounded-3xl border border-white/15 bg-white/[0.07] shadow-2xl shadow-black/30 backdrop-blur-xl">

            {/* Panel header */}
            <div className="border-b border-white/10 px-5 pt-5 pb-4">
              <div className="mb-1 flex items-center gap-2">
                <span className="rounded-full border border-fuchsia-400/35 bg-fuchsia-500/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-fuchsia-300">
                  {t.uploadBadge}
                </span>
              </div>
              <p className="text-base font-bold text-white">{t.uploadTitle}</p>
              <p className="mt-0.5 text-xs text-white/40">{t.uploadSubtitle}</p>
            </div>

            {/* Upload area */}
            <div className="flex flex-1 flex-col p-5">
              {photo ? (
                /* Preview */
                <div className="relative flex-1 overflow-hidden rounded-2xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.preview}
                    alt="Desired hair"
                    className="h-full min-h-60 w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                  {/* Confirmed badge */}
                  <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full border border-fuchsia-400/40 bg-black/55 px-3 py-1.5 backdrop-blur-sm">
                    <CheckCircle2 className="h-3.5 w-3.5 text-fuchsia-400" />
                    <span className="text-xs font-semibold text-fuchsia-200">{t.uploadedLabel}</span>
                  </div>

                  {/* Clear + change */}
                  <div className="absolute left-3 top-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPhoto(null)}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/55 text-white backdrop-blur-sm transition hover:bg-black/75"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-full border border-white/20 bg-black/55 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition hover:bg-black/75"
                    >
                      {t.uploadedChange}
                    </button>
                  </div>
                </div>
              ) : (
                /* Dropzone */
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "group flex flex-1 min-h-60 cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed transition-all duration-300",
                    isDragging
                      ? "scale-[1.01] border-fuchsia-400 bg-fuchsia-500/10"
                      : "border-white/20 bg-white/[0.03] hover:border-fuchsia-400/60 hover:bg-fuchsia-500/[0.06]",
                  )}
                >
                  <div className={cn(
                    "flex h-16 w-16 items-center justify-center rounded-2xl border bg-gradient-to-br shadow-lg transition-all duration-300",
                    isDragging
                      ? "scale-110 border-fuchsia-400/60 from-fuchsia-500/40 to-violet-600/40"
                      : "border-fuchsia-400/20 from-fuchsia-500/25 to-violet-600/25 group-hover:scale-110 group-hover:border-fuchsia-400/50",
                  )}>
                    <Camera className="h-7 w-7 text-fuchsia-300" />
                  </div>

                  <div className="px-4 text-center">
                    <p className="font-semibold text-white/80">{t.uploadCta}</p>
                    <p className="mt-1 text-xs text-white/35">{t.uploadOr}</p>
                  </div>

                  <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-4 py-2">
                    <Upload className="h-3.5 w-3.5 text-white/50" />
                    <span className="text-xs text-white/50">JPG, PNG, HEIC</span>
                  </div>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
            </div>
          </div>
        </div>

        {/* ── CTA ─────────────────────────────────────────────────────────── */}
        <div className="mt-5 space-y-2.5">
          <button
            type="button"
            disabled={!canGo}
            onClick={() => {
              if (selectedCode) localStorage.setItem("tintme_desired_shade", selectedCode);
              if (photo?.preview) localStorage.setItem("tintme_desired_photo", photo.preview);
              router.push("/page2");
            }}
            className={cn(
              "group relative w-full overflow-hidden rounded-2xl px-8 py-4 text-base font-bold text-white transition-all duration-300",
              canGo
                ? "bg-gradient-to-l from-[#7b2ff7] via-[#c4158a] to-[#f72585] shadow-2xl shadow-fuchsia-900/50 hover:scale-[1.015] active:scale-[0.98]"
                : "cursor-not-allowed bg-white/[0.08] text-white/30",
            )}
          >
            {canGo && (
              <span className="pointer-events-none absolute inset-0 translate-x-full bg-gradient-to-l from-white/15 via-transparent to-transparent transition-transform duration-500 group-hover:translate-x-0" />
            )}
            <span className="relative flex items-center justify-center gap-2">
              <Sparkles className={cn("h-5 w-5", canGo ? "text-yellow-200" : "text-white/25")} />
              {canGo ? t.nextBtn : t.nextPending}
            </span>
          </button>

          {/* Progress checklist */}
          {!canGo && (
            <div className="flex justify-center gap-6 text-xs text-white/35">
              <span className={cn("flex items-center gap-1.5 transition-colors", photo ? "text-emerald-400" : "text-white/25")}>
                <span className={cn(
                  "inline-block h-2 w-2 rounded-full border transition-all",
                  photo ? "border-emerald-400 bg-emerald-400" : "border-white/20 border-dashed",
                )} />
                {t.checkPhoto}
              </span>
              <span className={cn("flex items-center gap-1.5 transition-colors", selectedCode && "text-fuchsia-400")}>
                <span className={cn(
                  "inline-block h-2 w-2 rounded-full border transition-all",
                  selectedCode ? "border-fuchsia-400 bg-fuchsia-400" : "border-white/25",
                )} />
                {t.checkShade}
              </span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
