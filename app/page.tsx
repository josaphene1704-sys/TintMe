"use client";

import { useConvexAuth } from "convex/react";
import { useAction, useQuery } from "convex/react";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  ClipboardList,
  Crown,
  FlaskConical,
  ShoppingBag,
  Sparkles,
  Star,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import CreditsWidget from "@/components/credits/CreditsWidget";
import { PLAN_DISPLAY } from "@/config/planDisplay";
import { api } from "@/convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";

// ─── Translation dictionary ───────────────────────────────────────────────────
const translations = {
  he: {
    switchLabel: "العربية",
    tagline: "המומחה האישי שלך לצבע שיער",
    missCosBanner: "כל מוצרי הצבע שתצטרכי — במקום אחד",
    missCosLink: "קנייה עכשיו ב-Lamis Cosmetics ←",
    lastFormulaBtn: "חזרה לנוסחה האחרונה שלי",
    lastFormulaSub: "צפי בנוסחה וסדרי את המצרכים",
    card1Title: "נוסחה מקצועית",
    card1Sub: "מתכוני צבע מבוססי AI המותאמים לפרופיל השיער שלך",
    card2Title: "אבחון חכם",
    card2Sub: "ניתוח שלב אחר שלב לתוצאות מושלמות וללא נזק",
    card3Title: "רשימת קניות מיידית",
    card3Sub: "הזמנה בלחיצה אחת דרך WhatsApp לכל מה שצריך",
    cta: "בואי נתחיל ←",
    ctaStart: "התחילי אבחון ←",
    warningTitle: "מידע בטיחותי חשוב",
    warningBody:
      "לפני כל תהליך צביעת שיער, חובה לבצע בדיקת רגישות לחומרים כדי למנוע תגובות אלרגיות. בנוסף, מומלץ תמיד לבצע בדיקת טסט על חלק קטן ונסתר לפני מריחת התערובת על כל הראש.",
    font: "var(--font-rubik), Arial, sans-serif",
    paywallTitle: "ניצלת את האבחון החינמי שלך!",
    paywallBody:
      "כדי להמשיך ולקבל נוסחאות צבע וכימיה מדויקות ללא הגבלה, אנא בחרי את אחד ממסלולי הפרימיום שלנו למטה.",
    packagesTitle: "הצעת חבילות",
    packagesSub: "בחרי את המסלול המתאים לך",
    upgradeBtn: "שדרגי עכשיו",
    recommendedBadge: "מומלץ",
    monthlyFeatures: [
      "אבחונים ונוסחאות ללא הגבלה",
      "רשימות קניות מיידיות",
      "שיתוף דרך WhatsApp",
      "תמיכה מקצועית",
    ],
  },
  ar: {
    switchLabel: "עברית",
    tagline: "خبيرتك الشخصية في تلوين الشعر",
    missCosBanner: "كل منتجات التلوين التي تحتاجينها — في مكان واحد",
    missCosLink: "تسوقي الآن في Lamis Cosmetics ←",
    lastFormulaBtn: "العودة إلى تركيبتي الأخيرة",
    lastFormulaSub: "اعرضي التركيبة واطلبي المنتجات",
    card1Title: "تركيبة احترافية",
    card1Sub: "وصفات تلوين بالذكاء الاصطناعي مخصصة لملف شعرك",
    card2Title: "تشخيص ذكي",
    card2Sub: "تحليل خطوة بخطوة لنتائج مثالية بدون أضرار",
    card3Title: "قائمة تسوق فورية",
    card3Sub: "طلب بنقرة واحدة عبر واتساب لكل ما تحتاجينه",
    cta: "هيّا نبدأ ←",
    ctaStart: "ابدئي التشخيص ←",
    warningTitle: "معلومات سلامة مهمة",
    warningBody:
      "قبل أي عملية صباغة شعر، يجب إجراء اختبار حساسية للمواد لتجنب أي تفاعلات تحسسية. كما يُنصح دائمًا بإجراء اختبار على خصلة صغيرة وخفية قبل تطبيق الخليط على كامل الشعر.",
    font: "var(--font-cairo), Arial, sans-serif",
    paywallTitle: "لقد استخدمتِ تشخيصكِ المجاني!",
    paywallBody:
      "للمتابعة والحصول على تركيبات ألوان وكيمياء دقيقة بلا حدود، يرجى اختيار إحدى خطط بريميوم أدناه.",
    packagesTitle: "عروض الباقات",
    packagesSub: "اختاري الخطة المناسبة لكِ",
    upgradeBtn: "ترقية الآن",
    recommendedBadge: "موصى به",
    monthlyFeatures: [
      "تشخيصات وتركيبات بلا حدود",
      "قوائم تسوق فورية",
      "المشاركة عبر واتساب",
      "دعم احترافي",
    ],
  },
} as const;

type Lang = keyof typeof translations;

// ─── Value prop card data ─────────────────────────────────────────────────────
const CARDS = [
  {
    key: "card1",
    Icon: Sparkles,
    gradient: "from-fuchsia-500/40 to-violet-600/40",
    glow: "shadow-fuchsia-500/25",
    iconColor: "text-fuchsia-300",
  },
  {
    key: "card2",
    Icon: ClipboardList,
    gradient: "from-violet-500/40 to-purple-700/40",
    glow: "shadow-violet-500/25",
    iconColor: "text-violet-300",
  },
  {
    key: "card3",
    Icon: ShoppingBag,
    gradient: "from-pink-500/40 to-rose-600/40",
    glow: "shadow-pink-500/25",
    iconColor: "text-pink-300",
  },
] as const;

// ─── Logo ─────────────────────────────────────────────────────────────────────
function LogoMark() {
  return (
    <div className="mb-3 drop-shadow-[0_0_40px_rgba(220,100,255,0.4)]">
      <Image src="/logo.png" alt="TintMe" width={190} height={250} priority />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Home() {
  const [lang, setLang] = useState<Lang>("he");
  const t = translations[lang];
  const router = useRouter();

  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const { signOut } = useAuthActions();
  const formulaCount = useQuery(api.formulas.getCount);
  const latestFormula = useQuery(api.formulas.getLatest);
  const currentUser = useQuery(api.users.getCurrentUser);
  const credits = useQuery(api.credits.getMyCredits);
  const generateCheckoutLink = useAction(api.polar.generateCheckoutLink);

  const [showPaywallAlert, setShowPaywallAlert] = useState(false);
  const [buyingPlan, setBuyingPlan] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState("");

  const packagesRef = useRef<HTMLDivElement>(null);
  const paywallAlertRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showPaywallAlert && paywallAlertRef.current) {
      setTimeout(() => {
        paywallAlertRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 50);
    }
  }, [showPaywallAlert]);

  const isCountLoading = isAuthenticated && formulaCount === undefined;
  // הגישה נקבעת לפי יתרת הקרדיטים בפועל, ולא לפי userType.
  // userType נשאר "paid" גם אחרי שהחבילה נוצלה, ולכן הוא לא מדד גישה תקף.
  const hasCredits = (credits?.remainingCredits ?? 0) > 0;
  const isBlocked =
    isAuthenticated && !hasCredits && typeof formulaCount === "number" && formulaCount >= 1;

  function handleLangSwitch() {
    setLang((l) => (l === "he" ? "ar" : "he"));
  }

  function handleStart() {
    localStorage.setItem("tintme_lang", lang);

    if (!isAuthenticated) {
      router.push("/sign-in");
      return;
    }

    if (isBlocked) {
      setShowPaywallAlert(true);
      setTimeout(() => {
        packagesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
      return;
    }

    // count === 0 — first free diagnosis
    router.push("/page1");
  }

  function handleViewLastFormula() {
    if (!latestFormula) return;
    localStorage.setItem("tintme_lang", lang);
    if (latestFormula.currentShadeCode) {
      localStorage.setItem("tintme_current_shade", latestFormula.currentShadeCode);
    } else {
      localStorage.removeItem("tintme_current_shade");
    }
    if (latestFormula.desiredShadeCode) {
      localStorage.setItem("tintme_desired_shade", latestFormula.desiredShadeCode);
    } else {
      localStorage.removeItem("tintme_desired_shade");
    }
    const params = new URLSearchParams({
      grayPercentage: latestFormula.grayPercentage,
      bleaching: latestFormula.bleachingHistory,
      condition: latestFormula.hairCondition,
      hairLength: latestFormula.hairLength,
      fromSaved: "1",
    });
    router.push(`/page3?${params.toString()}`);
  }

  // רכישת חבילה — מפנה ישירות ל-Polar Checkout של המוצר הנבחר
  async function handleBuy(planId: string, productId: string | undefined) {
    setCheckoutError("");

    if (!isAuthenticated) {
      localStorage.setItem("tintme_lang", lang);
      router.push("/sign-in");
      return;
    }

    if (!productId) {
      setCheckoutError(
        lang === "he"
          ? "החבילה אינה מוגדרת כרגע. נסי שוב מאוחר יותר."
          : "الباقة غير مهيأة حالياً. حاولي لاحقاً."
      );
      return;
    }

    try {
      setBuyingPlan(planId);
      const { url } = await generateCheckoutLink({
        productIds: [productId],
        origin: window.location.origin,
        // Polar מחליף את {CHECKOUT_ID} במזהה העסקה בזמן ההפניה,
        // וזה מה ש-app/success/page.tsx קורא מה-searchParams
        successUrl: `${window.location.origin}/success?checkout_id={CHECKOUT_ID}`,
      });
      window.location.href = url;
    } catch {
      setBuyingPlan(null);
      setCheckoutError(
        lang === "he"
          ? "אירעה שגיאה ביצירת הקישור לתשלום. נסי שוב."
          : "حدث خطأ أثناء إنشاء رابط الدفع. حاولي مرة أخرى."
      );
    }
  }

  const ctaLabel = isAuthenticated && !isBlocked ? t.ctaStart : t.cta;

  const PACK_1_ID = process.env.NEXT_PUBLIC_POLAR_PRODUCT_ID_1;
  const PACK_3_ID = process.env.NEXT_PUBLIC_POLAR_PRODUCT_ID_3;
  const PACK_30_ID = process.env.NEXT_PUBLIC_POLAR_PRODUCT_ID_30;

  return (
    <div dir="rtl" className="relative min-h-screen overflow-hidden" style={{ fontFamily: t.font }}>
      {/* ── Background ─────────────────────────────────────────────────────── */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#3b0764] via-[#4d074e] to-[#1e0736]" />
      <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-fuchsia-600/30 blur-3xl" />
      <div className="pointer-events-none absolute -left-32 top-[35%] h-[28rem] w-[28rem] rounded-full bg-violet-700/25 blur-3xl" />
      <div className="pointer-events-none absolute bottom-16 right-1/4 h-72 w-72 rounded-full bg-rose-500/20 blur-3xl" />

      {/* ── Content ────────────────────────────────────────────────────────── */}
      {/* Outer: full-screen. Inner: centered column capped at readable width */}
      <div className="relative z-10 flex min-h-screen flex-col px-5 pb-16 pt-6 md:px-8 lg:px-0">
        <div className="mx-auto w-full max-w-sm md:max-w-2xl lg:max-w-4xl">

        {/* Header: language switcher + auth button */}
        <div className="flex items-center justify-between gap-2">
          {/* Auth: login button or user name + logout */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-medium text-white/90 backdrop-blur-md">
                {(currentUser?.fullName && currentUser.fullName !== "User"
                  ? currentUser.fullName
                  : currentUser?.email?.split("@")[0]) ?? ""}
              </span>
              <button
                type="button"
                onClick={() => signOut()}
                className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/70 backdrop-blur-md transition-all duration-200 hover:bg-white/20 active:scale-95"
              >
                {lang === "he" ? "יציאה" : "خروج"}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => router.push("/sign-in")}
              className="rounded-full border border-fuchsia-400/50 bg-fuchsia-500/20 px-4 py-1.5 text-sm font-semibold text-fuchsia-200 backdrop-blur-md transition-all duration-200 hover:bg-fuchsia-500/30 active:scale-95"
            >
              {lang === "he" ? "כניסה / הרשמה" : "دخول / تسجيل"}
            </button>
          )}

          <button
            type="button"
            onClick={handleLangSwitch}
            className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur-md transition-all duration-200 hover:bg-white/20 active:scale-95"
          >
            {t.switchLabel}
          </button>
        </div>

        {/* Hero */}
        <div className="mt-8 flex flex-col items-center text-center">
          <LogoMark />
          <h1 className="bg-gradient-to-b from-white to-white/80 bg-clip-text text-5xl font-black tracking-tight text-transparent drop-shadow-lg md:text-6xl lg:text-7xl">
            TintMe
          </h1>
          <p className="mt-2 max-w-xs text-base font-medium leading-relaxed text-white/60 md:max-w-sm md:text-lg">
            {t.tagline}
          </p>
        </div>

        {/* Value prop cards — 1 col mobile / 3 col tablet+ */}
        <div className="mt-9 grid grid-cols-1 gap-3.5 md:grid-cols-3">
          {CARDS.map(({ key, Icon, gradient, glow, iconColor }) => {
            const title = t[`${key}Title` as keyof typeof t] as string;
            const sub = t[`${key}Sub` as keyof typeof t] as string;
            return (
              <div
                key={key}
                className="flex items-center gap-4 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md md:flex-col md:items-start md:gap-3"
              >
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-gradient-to-br shadow-lg ${gradient} ${glow}`}
                >
                  <Icon className={`h-6 w-6 ${iconColor}`} />
                </div>
                <div className="flex-1 text-right md:text-right">
                  <p className="font-bold text-white">{title}</p>
                  <p className="mt-0.5 text-sm leading-snug text-white/60">{sub}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Safety Warning */}
        <div className="mt-6 rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-500/10 via-yellow-400/5 to-orange-500/10 p-4 backdrop-blur-md shadow-lg shadow-amber-900/20">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-400/15">
              <AlertTriangle className="h-5 w-5 text-amber-300" />
            </div>
            <div className="flex-1 text-right">
              <p className="font-bold text-amber-200 text-sm tracking-wide">{t.warningTitle}</p>
              <p className="mt-1 text-xs leading-relaxed text-amber-100/70">{t.warningBody}</p>
            </div>
          </div>
        </div>

        {/* Miss Cosmetics Partner Banner */}
        <a
          href="https://www.lamis-cosmetics.com"
          target="_blank"
          rel="noopener noreferrer"
          className="group mt-6 flex items-center justify-between gap-3 rounded-2xl border border-pink-400/30 bg-gradient-to-l from-rose-500/10 via-pink-500/10 to-fuchsia-500/10 p-4 backdrop-blur-md shadow-md shadow-rose-900/20 transition-all duration-300 hover:border-pink-400/60 hover:from-rose-500/20 hover:via-pink-500/15 hover:to-fuchsia-500/15 hover:shadow-pink-900/30"
        >
          <ShoppingBag className="h-5 w-5 shrink-0 text-pink-300 transition-transform duration-300 group-hover:scale-110" />
          <div className="flex-1 text-right">
            <p className="text-sm font-semibold text-white/85">{t.missCosBanner}</p>
            <p className="mt-0.5 text-xs font-bold text-pink-300 group-hover:text-pink-200 transition-colors">
              {t.missCosLink}
            </p>
          </div>
        </a>

        {/* CTA */}
        <div className="mt-6">
          <button
            type="button"
            onClick={handleStart}
            disabled={authLoading || isCountLoading}
            className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-l from-[#7b2ff7] via-[#d4148c] to-[#f72585] px-8 py-4 text-lg font-bold text-white shadow-2xl shadow-fuchsia-900/50 transition-all duration-300 hover:scale-[1.02] active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <span className="pointer-events-none absolute inset-0 translate-x-full bg-gradient-to-l from-white/15 via-transparent to-transparent transition-transform duration-500 group-hover:translate-x-0" />
            <span className="relative">
              {authLoading || isCountLoading ? "..." : ctaLabel}
            </span>
          </button>
        </div>

        {/* Credits usage — visible once a package has been purchased */}
        {isAuthenticated && <CreditsWidget lang={lang} />}

        {/* Last Formula shortcut — visible when user has at least one saved formula */}
        {isAuthenticated && latestFormula && (
          <button
            type="button"
            onClick={handleViewLastFormula}
            className="group mt-3 flex w-full items-center justify-between gap-3 rounded-2xl border border-violet-400/30 bg-white/5 px-5 py-3.5 backdrop-blur-md transition-all duration-300 hover:border-violet-400/60 hover:bg-white/10 active:scale-[0.98]"
          >
            <ArrowLeft className="h-4 w-4 shrink-0 text-violet-300 transition-transform duration-300 group-hover:-translate-x-1" />
            <div className="flex-1 text-right">
              <p className="text-sm font-bold text-white/90">{t.lastFormulaBtn}</p>
              <p className="mt-0.5 text-xs text-white/45">{t.lastFormulaSub}</p>
            </div>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-violet-400/25 bg-violet-500/15">
              <FlaskConical className="h-4 w-4 text-violet-300" />
            </div>
          </button>
        )}

        {/* ── Paywall Alert ──────────────────────────────────────────────────── */}
        {showPaywallAlert && (
          <>
            <style>{`
              @keyframes paywallBlink {
                0%, 100% { box-shadow: 0 0 0 0 rgba(217,70,239,0); border-color: rgba(232,121,249,0.4); }
                50% { box-shadow: 0 0 32px 12px rgba(217,70,239,0.45); border-color: rgba(232,121,249,1); }
              }
              .paywall-blink { animation: paywallBlink 0.75s ease-in-out 8; }
            `}</style>
            <div ref={paywallAlertRef} className="mt-6 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="paywall-blink rounded-2xl border border-fuchsia-400/40 bg-gradient-to-br from-fuchsia-900/60 via-violet-900/50 to-purple-900/60 p-5 backdrop-blur-md shadow-xl shadow-fuchsia-900/30">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-fuchsia-400/30 bg-fuchsia-500/20">
                    <Crown className="h-5 w-5 text-fuchsia-300" />
                  </div>
                  <div className="flex-1 text-right">
                    <p className="font-bold text-fuchsia-200 text-base leading-snug">
                      {t.paywallTitle}
                    </p>
                    <p className="mt-1.5 text-sm leading-relaxed text-white/70">
                      {t.paywallBody}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── Packages Section ───────────────────────────────────────────────── */}
        <div ref={packagesRef} id="packages" className="mt-12 scroll-mt-6">
          {/* Section header */}
          <div className="mb-6 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 px-4 py-1.5 mb-3">
              <Crown className="h-3.5 w-3.5 text-fuchsia-300" />
              <span className="text-fuchsia-300 text-xs font-semibold tracking-widest uppercase">
                Premium
              </span>
            </div>
            <h2 className="text-2xl font-black text-white">{t.packagesTitle}</h2>
            <p className="mt-1 text-sm text-white/50">{t.packagesSub}</p>
          </div>

          {/* Plan cards — 1 col mobile / 3 col tablet+ */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Pack 1 */}
            <div className="relative rounded-2xl border border-white/15 bg-white/8 p-5 backdrop-blur-md">
              <div className="flex items-start justify-between gap-3">
                <div className="text-right">
                  <p className="font-bold text-lg text-white">{PLAN_DISPLAY.pack_1.title}</p>
                  <p className="text-white/50 text-sm">{PLAN_DISPLAY.pack_1.subtitle}</p>
                  <p className="mt-2 text-3xl font-extrabold text-white">
                    {PLAN_DISPLAY.pack_1.priceLine}
                  </p>
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-400/30 bg-violet-500/20">
                  <Sparkles className="h-5 w-5 text-violet-300" />
                </div>
              </div>
              <ul className="mt-4 space-y-2">
                {t.monthlyFeatures.map((feature) => (
                  <li key={feature} className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 shrink-0 text-fuchsia-400" />
                    <span className="text-sm text-white/75">{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => handleBuy("pack_1", PACK_1_ID)}
                disabled={buyingPlan !== null}
                className="mt-5 w-full rounded-xl border border-white/20 bg-white/10 py-3 text-sm font-bold text-white transition-all hover:bg-white/20 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {buyingPlan === "pack_1" ? "..." : t.upgradeBtn}
              </button>
            </div>

            {/* Pack 3 — recommended */}
            <div className="relative rounded-2xl border-2 border-fuchsia-400/60 bg-gradient-to-br from-fuchsia-900/40 via-violet-900/30 to-purple-900/40 p-5 backdrop-blur-md shadow-lg shadow-fuchsia-900/30">
              <div className="absolute -top-3 right-5 flex items-center gap-1.5 rounded-full bg-gradient-to-l from-fuchsia-500 to-violet-600 px-3 py-1 shadow-md">
                <Star className="h-3 w-3 text-white" fill="white" />
                <span className="text-white text-xs font-bold">{t.recommendedBadge}</span>
              </div>

              <div className="flex items-start justify-between gap-3 pt-1">
                <div className="text-right">
                  <p className="font-bold text-lg text-white">{PLAN_DISPLAY.pack_3.title}</p>
                  <p className="text-white/50 text-sm">{PLAN_DISPLAY.pack_3.subtitle}</p>
                  <p className="mt-2 text-3xl font-extrabold text-white">
                    {PLAN_DISPLAY.pack_3.priceLine}
                  </p>
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-fuchsia-400/30 bg-fuchsia-500/20">
                  <Crown className="h-5 w-5 text-fuchsia-300" />
                </div>
              </div>
              <ul className="mt-4 space-y-2">
                {t.monthlyFeatures.map((feature) => (
                  <li key={feature} className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 shrink-0 text-fuchsia-400" />
                    <span className="text-sm text-white/75">{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => handleBuy("pack_3", PACK_3_ID)}
                disabled={buyingPlan !== null}
                className="group mt-5 w-full overflow-hidden rounded-xl bg-gradient-to-l from-[#7b2ff7] via-[#d4148c] to-[#f72585] py-3 text-sm font-bold text-white shadow-lg shadow-fuchsia-900/40 transition-all hover:scale-[1.02] active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {buyingPlan === "pack_3" ? "..." : t.upgradeBtn}
              </button>
            </div>

            {/* Pack 30 */}
            <div className="relative rounded-2xl border border-white/15 bg-white/8 p-5 backdrop-blur-md">
              <div className="flex items-start justify-between gap-3">
                <div className="text-right">
                  <p className="font-bold text-lg text-white">{PLAN_DISPLAY.pack_30.title}</p>
                  <p className="text-white/50 text-sm">{PLAN_DISPLAY.pack_30.subtitle}</p>
                  <p className="mt-2 text-3xl font-extrabold text-white">
                    {PLAN_DISPLAY.pack_30.priceLine}
                  </p>
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-pink-400/30 bg-pink-500/20">
                  <FlaskConical className="h-5 w-5 text-pink-300" />
                </div>
              </div>
              <ul className="mt-4 space-y-2">
                {t.monthlyFeatures.map((feature) => (
                  <li key={feature} className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 shrink-0 text-fuchsia-400" />
                    <span className="text-sm text-white/75">{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => handleBuy("pack_30", PACK_30_ID)}
                disabled={buyingPlan !== null}
                className="mt-5 w-full rounded-xl border border-white/20 bg-white/10 py-3 text-sm font-bold text-white transition-all hover:bg-white/20 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {buyingPlan === "pack_30" ? "..." : t.upgradeBtn}
              </button>
            </div>
          </div>

          {checkoutError && (
            <div className="mt-4 rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-center text-sm text-red-200">
              {checkoutError}
            </div>
          )}
        </div>
        {/* /packages */}

        </div>{/* /inner max-w container */}
      </div>
    </div>
  );
}
