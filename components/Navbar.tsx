"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { Bug, Home, LogOut, Sparkles, Trash2, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import PaywallModal from "@/components/payments/PaywallModal";
import SignInModal from "@/components/SignInModal";
import SignUpModal from "@/components/SignUpModal";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  APP_ENV,
  IS_DEV_MODE,
  MOCK_PAYMENTS,
  PAYMENT_SYSTEM_ENABLED,
  PAYWALL_ENABLED,
} from "@/config/appConfig";
import { api } from "@/convex/_generated/api";

const STEPS = [
  { label: "שיער נוכחי", paths: ["/page1"] },
  { label: "שיער רצוי",  paths: ["/page1b"] },
  { label: "אבחון שיער", paths: ["/page2"] },
  { label: "נוסחה",      paths: ["/page3"] },
];

export default function Navbar() {
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useConvexAuth(); // סטטוס אימות
  const { signOut } = useAuthActions(); // פעולת התנתקות
  const user = useQuery(api.users.getCurrentUser); // פרטי המשתמש המחובר
  const [isOpen, setIsOpen] = useState(false); // מצב תפריט המשתמש (Dropdown)
  const [showSignInModal, setShowSignInModal] = useState(false); // הצגת מודל התחברות
  const [showSignUpModal, setShowSignUpModal] = useState(false); // הצגת מודל הרשמה
  const [showPaywallModal, setShowPaywallModal] = useState(false); // הצגת מודל Paywall (Preview)
  const [isDebugOpen, setIsDebugOpen] = useState(false); // מצב קונסולת דיבאג
  const [showLogoutDialog, setShowLogoutDialog] = useState(false); // דיאלוג התנתקות/מחיקה
  const [logoutStep, setLogoutStep] = useState<"main" | "deleteConfirm">("main"); // שלבי הדיאלוג
  const [isDeleteLoading, setIsDeleteLoading] = useState(false); // מצב טעינה למחיקה
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debugRef = useRef<HTMLDivElement>(null);
  const [showWelcomeToast, setShowWelcomeToast] = useState(false);
  const toastShownRef = useRef(false);

  // הצגת toast ברכה — מופעל כשהדגל קיים ב-sessionStorage והמשתמש וה-user נטענו
  useEffect(() => {
    if (isLoading || !isAuthenticated || !user || toastShownRef.current) return;
    if (sessionStorage.getItem("tintme_just_logged_in") !== "1") return;
    sessionStorage.removeItem("tintme_just_logged_in");
    toastShownRef.current = true;
    setShowWelcomeToast(true);
    const t = setTimeout(() => setShowWelcomeToast(false), 4500);
    return () => clearTimeout(t);
  }, [isAuthenticated, isLoading, user]);

  // סגירת התפריט בעת לחיצה מחוץ לו
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }

      // סגירת קונסולת דיבאג בעת לחיצה מחוץ לה
      if (debugRef.current && !debugRef.current.contains(event.target as Node)) {
        setIsDebugOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // מיקום השלב הנוכחי ברצף — משמש גם לתצוגה המקוצרת בנייד
  const activeStepIndex = STEPS.findIndex((step) => step.paths.includes(pathname ?? ""));

  const displayName =
    (user?.fullName && user.fullName !== "User" ? user.fullName : null) ??
    user?.email?.split("@")[0] ??
    "משתמש";
  const updateUserType = useMutation(api.users.updateUserType); // שינוי סטטוס משתמש (למצב בדיקה)
  const deleteMyAccount = useMutation(api.users.deleteMyAccount); // מחיקת חשבון (Convex)

  // פתיחת דיאלוג התנתקות (במקום התנתקות מיידית)
  const openLogoutDialog = () => {
    setIsOpen(false);
    setLogoutStep("main");
    setShowLogoutDialog(true);
  };

  // ביצוע התנתקות
  const confirmSignOut = async () => {
    await signOut();
    setShowLogoutDialog(false);
  };

  // מעבר למסך אישור מחיקה
  const goToDeleteConfirm = () => {
    setIsOpen(false); // סגירת ה-dropdown
    setLogoutStep("deleteConfirm");
    setShowLogoutDialog(true); // פתיחת הדיאלוג עם שלב המחיקה
  };

  // ביצוע מחיקת חשבון (2 שלבים — זהו השלב הסופי)
  const confirmDeleteAccount = async () => {
    setIsDeleteLoading(true);
    try {
      await deleteMyAccount();
      // התנתקות אוטומטית לאחר מחיקת החשבון
      await signOut();
      setShowLogoutDialog(false);
      // הערה: בדפדפן, ההתנתקות תפנה את המשתמש אוטומטית, אז לא צריך הודעת הצלחה נפרדת
    } catch (_error) {
      // במקרה של שגיאה, נשארים בדיאלוג כדי שהמשתמש יוכל לנסות שוב
      // ניתן להוסיף כאן toast notification או הודעת שגיאה ב-UI
    } finally {
      setIsDeleteLoading(false);
    }
  };

  return (
    <nav className="sticky top-0 z-50 border-border border-b bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto px-3 py-4 md:px-6">
        <div className="flex items-center justify-between gap-2">
          {/* ניווט - צד ימין (RTL) */}
          <div className="flex min-w-0 items-center gap-2 md:gap-6">
            <Link
              aria-label="דף הבית"
              className="shrink-0 text-2xl transition-transform hover:scale-110"
              href="/"
            >
              <Home className="h-6 w-6 text-foreground" />
            </Link>

            {/*
              אינדיקטור שלבים.
              ארבע התוויות יחד עם כפתור הפרופיל הגיעו ל-~450px ברוחב מסך של
              390px, מה שגרם לגלישה אופקית בכל עמודי האפליקציה. בנייד מוצג
              רק השלב הפעיל עם מונה, ומ-md ומעלה חוזרת הרשימה המלאה.
            */}
            <div className="flex min-w-0 items-center gap-1" dir="rtl">
              {/* נייד: שלב פעיל בלבד */}
              {activeStepIndex >= 0 && (
                <span className="truncate rounded-full bg-fuchsia-500/15 px-2 py-0.5 font-medium text-fuchsia-400 text-xs md:hidden">
                  {STEPS[activeStepIndex].label} · {activeStepIndex + 1}/{STEPS.length}
                </span>
              )}

              {/* md ומעלה: כל השלבים */}
              <div className="hidden items-center gap-1 md:flex">
                {STEPS.map((step, i) => {
                  const isActive = i === activeStepIndex;
                  return (
                    <div key={step.label} className="flex items-center gap-1">
                      <span
                        className={`rounded-full px-2 py-0.5 font-medium text-sm transition-colors ${
                          isActive ? "bg-fuchsia-500/15 text-fuchsia-400" : "text-foreground/35"
                        }`}
                      >
                        {step.label}
                      </span>
                      {i < STEPS.length - 1 && (
                        <span className="text-foreground/20 text-xs">·</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* פרופיל משתמש או כפתור התחברות - צד שמאל (RTL) */}
          <div className="mr-auto flex shrink-0 items-center gap-3">
            {/* כפתור דיבאג (Dev בלבד) - אייקון באג בצד שמאל למעלה */}
            {IS_DEV_MODE && (
              <div className="relative" ref={debugRef}>
                <Button
                  aria-label="קונסולת דיבאג"
                  className="h-10 w-10 rounded-lg border border-yellow-500/50 bg-yellow-500/20 hover:border-yellow-500/70 hover:bg-yellow-500/30"
                  onClick={() => setIsDebugOpen((v) => !v)}
                  variant="ghost"
                >
                  <Bug className="h-5 w-5 text-yellow-400" />
                </Button>

                {/* קונסולת דיבאג - popup שנפתח כלפי מטה */}
                <div
                  className={[
                    "absolute left-0 mt-2 w-80 overflow-hidden rounded-xl border border-orange-500/30 bg-gray-900/95 shadow-xl backdrop-blur-sm transition-all",
                    isDebugOpen ? "max-h-[480px] opacity-100" : "max-h-0 opacity-0",
                  ].join(" ")}
                >
                  <div className="p-4" dir="rtl">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="font-bold text-sm text-white">קונסולת דיבאג</div>
                      <div className="text-gray-400 text-xs">{APP_ENV}</div>
                    </div>

                    {/* שורות מצב */}
                    <div className="mb-4 space-y-1 text-gray-300 text-xs">
                      <DebugRow label="Paywall פעיל" value={PAYWALL_ENABLED ? "כן" : "לא"} />
                      <DebugRow
                        label="תשלומים פעילים"
                        value={PAYMENT_SYSTEM_ENABLED ? "כן" : "לא"}
                      />
                      <DebugRow label="Mock Payments" value={MOCK_PAYMENTS ? "כן" : "לא"} />
                      <DebugRow
                        label="סטטוס משתמש"
                        value={(() => {
                          if (!user) {
                            return "לא מחובר";
                          }
                          return user.userType === "paid" ? "פרימיום" : "חינמי";
                        })()}
                      />
                    </div>

                    {/* כפתורי Preview */}
                    <div className="space-y-2">
                      <button
                        className="w-full rounded-lg border border-gray-700 bg-gray-800/60 px-3 py-2 text-right text-sm text-white transition hover:border-orange-500/40"
                        onClick={() => setShowSignInModal(true)}
                        type="button"
                      >
                        פתח מודל התחברות (Preview)
                      </button>
                      <button
                        className="w-full rounded-lg border border-gray-700 bg-gray-800/60 px-3 py-2 text-right text-sm text-white transition hover:border-orange-500/40"
                        onClick={() => setShowSignUpModal(true)}
                        type="button"
                      >
                        פתח מודל הרשמה (Preview)
                      </button>
                      <button
                        className="w-full rounded-lg border border-gray-700 bg-gray-800/60 px-3 py-2 text-right text-sm text-white transition hover:border-orange-500/40"
                        onClick={() => setShowPaywallModal(true)}
                        type="button"
                      >
                        פתח Paywall (Preview)
                      </button>

                      {/* כפתור בדיקה: סימון המשתמש כ-paid (רק אם MOCK_PAYMENTS) */}
                      {MOCK_PAYMENTS && (
                        <button
                          className="w-full rounded-lg border border-orange-500/40 bg-orange-500/10 px-3 py-2 text-right text-orange-100 text-sm transition hover:bg-orange-500/15"
                          onClick={async () => {
                            await updateUserType({ userType: "paid" });
                          }}
                          type="button"
                        >
                          מצב בדיקה: שדרג אותי לפרימיום
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Loading state */}
            {isLoading && (
              <div className="h-9 w-32 animate-pulse rounded-full bg-gradient-to-l from-violet-500/20 to-fuchsia-500/20" />
            )}

            {/* Authenticated user menu */}
            {!isLoading && isAuthenticated && (
              <div className="relative" ref={dropdownRef}>
                {/* ── Trigger button ── */}
                <button
                  type="button"
                  onClick={() => setIsOpen(!isOpen)}
                  className="group flex items-center gap-2.5 rounded-full border border-white/10 bg-gradient-to-l from-violet-600/20 via-fuchsia-600/15 to-rose-500/15 px-3 py-1.5 shadow-md backdrop-blur-sm transition-all duration-200 hover:border-fuchsia-400/40 hover:from-violet-600/30 hover:via-fuchsia-600/25 hover:to-rose-500/25 hover:shadow-fuchsia-900/30"
                >
                  {/* Avatar circle with gradient */}
                  <div className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-rose-500 shadow-sm">
                    <span className="text-[11px] font-bold text-white">
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="max-w-[120px] truncate text-sm font-semibold text-white/90">
                    שלום, {displayName}
                  </span>
                </button>

                {/* ── Dropdown ── */}
                {isOpen && (
                  <div className="absolute left-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-white/10 bg-[#1a0830]/95 shadow-2xl shadow-fuchsia-900/40 backdrop-blur-xl" dir="rtl">
                    {/* Header */}
                    <div className="relative overflow-hidden px-4 py-4">
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-600/20 via-fuchsia-600/10 to-transparent" />
                      <div className="relative flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-rose-500 shadow-lg shadow-fuchsia-900/40">
                          <span className="text-sm font-bold text-white">
                            {displayName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-bold text-sm text-white">{displayName}</p>
                          <p className="truncate text-[11px] text-white/45">{user?.email}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mx-3 h-px bg-white/8" />

                    <div className="space-y-1 p-2">
                        <Button
                          className="w-full justify-start rounded-xl px-3 py-2 text-right text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
                          onClick={openLogoutDialog}
                          variant="ghost"
                        >
                          <LogOut className="ml-2 h-4 w-4" />
                          <span className="font-medium text-sm">התנתקי</span>
                        </Button>

                        <Button
                          className="w-full justify-start rounded-xl border border-red-900/20 px-3 py-2 text-right text-red-500/80 hover:bg-red-950/20 hover:text-red-400"
                          onClick={goToDeleteConfirm}
                          variant="ghost"
                        >
                          <Trash2 className="ml-2 h-4 w-4" />
                          <span className="font-medium text-sm">מחקי חשבון</span>
                        </Button>
                      </div>
                  </div>
                )}
              </div>
            )}

            {/* Sign in button for unauthenticated users */}
            {!(isLoading || isAuthenticated) && (
              <Link
                href="/sign-in"
                className="rounded-lg bg-gradient-to-l from-violet-600 via-fuchsia-600 to-rose-500 px-6 py-2 font-medium text-white shadow-md transition-all hover:opacity-90"
              >
                התחברות
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* מודל התחברות */}
      <SignInModal
        onOpenChange={setShowSignInModal}
        onSwitchToSignUp={() => setShowSignUpModal(true)}
        open={showSignInModal}
      />

      {/* מודל הרשמה */}
      <SignUpModal
        onOpenChange={setShowSignUpModal}
        onSwitchToSignIn={() => setShowSignInModal(true)}
        open={showSignUpModal}
      />

      {/* מודל Paywall (Preview לדיבאג) */}
      <PaywallModal onOpenChange={setShowPaywallModal} open={showPaywallModal} preview={true} />

      {/* ── Welcome toast ── */}
      <div
        className={`fixed bottom-6 right-6 z-[100] transition-all duration-500 ${
          showWelcomeToast
            ? "translate-y-0 opacity-100"
            : "translate-y-4 opacity-0 pointer-events-none"
        }`}
        dir="rtl"
      >
        <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-gradient-to-l from-violet-600/90 via-fuchsia-600/90 to-rose-500/90 px-5 py-4 shadow-2xl shadow-fuchsia-900/50 backdrop-blur-xl">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-sm text-white">שלום, {displayName}! 👋</p>
            <p className="text-xs text-white/70">ברוכה הבאה ל-TintMe</p>
          </div>
          <button
            type="button"
            onClick={() => setShowWelcomeToast(false)}
            className="mr-2 text-white/50 transition hover:text-white text-lg leading-none"
          >
            ×
          </button>
        </div>
      </div>

      {/* דיאלוג התנתקות + מחיקת חשבון */}
      <Dialog
        onOpenChange={(open) => {
          setShowLogoutDialog(open);
          if (!open) {
            setLogoutStep("main");
          }
        }}
        open={showLogoutDialog}
      >
        <DialogContent className="border-white/15 bg-gradient-to-br from-[#2d0a4e] via-[#3b0764] to-[#1e0736] p-0 shadow-2xl shadow-fuchsia-900/50 backdrop-blur-xl sm:max-w-md">
          <div className="p-7" dir="rtl">
            {logoutStep === "main" ? (
              <>
                {/* אייקון */}
                <div className="mb-5 flex justify-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-gradient-to-br from-violet-500/30 to-fuchsia-600/30 shadow-lg shadow-fuchsia-900/30">
                    <LogOut className="h-6 w-6 text-fuchsia-300" />
                  </div>
                </div>

                <DialogHeader className="mb-5">
                  <DialogTitle className="text-center font-bold text-2xl text-white">
                    התנתקות מהחשבון
                  </DialogTitle>
                  <p className="mt-2 text-center text-sm leading-relaxed text-white/55">
                    האם את בטוחה שברצונך להתנתק? ניתן גם למחוק את החשבון לצמיתות.
                  </p>
                </DialogHeader>

                {/* פרטי משתמש */}
                <div className="mb-5 rounded-xl border border-white/10 bg-white/8 p-4 text-right backdrop-blur-sm">
                  <div className="text-xs text-white/40">מחוברת בתור</div>
                  <div className="mt-1 font-semibold text-base text-white">{displayName}</div>
                  <div className="mt-0.5 truncate text-xs text-white/30">{user?.email || ""}</div>
                </div>

                <div className="space-y-2.5">
                  <button
                    className="w-full rounded-xl bg-gradient-to-l from-[#7b2ff7] via-[#d4148c] to-[#f72585] px-6 py-3 font-bold text-white shadow-lg shadow-fuchsia-900/40 transition-all hover:scale-[1.02] active:scale-[0.97]"
                    onClick={confirmSignOut}
                    type="button"
                  >
                    התנתקי
                  </button>

                  <button
                    className="w-full rounded-xl border border-rose-500/30 bg-rose-500/10 px-6 py-3 font-bold text-rose-300 transition-all hover:bg-rose-500/20 hover:text-rose-200 active:scale-[0.97]"
                    onClick={goToDeleteConfirm}
                    type="button"
                  >
                    מחיקת חשבון
                  </button>

                  <button
                    className="w-full rounded-xl border border-white/10 bg-white/6 px-6 py-3 font-semibold text-white/60 transition-all hover:bg-white/10 hover:text-white/80 active:scale-[0.97]"
                    onClick={() => setShowLogoutDialog(false)}
                    type="button"
                  >
                    ביטול
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* אייקון */}
                <div className="mb-5 flex justify-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-500/30 bg-rose-500/15 shadow-lg shadow-rose-900/30">
                    <Trash2 className="h-6 w-6 text-rose-400" />
                  </div>
                </div>

                <DialogHeader className="mb-5">
                  <DialogTitle className="text-center font-bold text-2xl text-white">
                    אישור מחיקת חשבון
                  </DialogTitle>
                  <p className="mt-2 text-center text-sm leading-relaxed text-white/55">
                    פעולה זו תמחק לצמיתות את החשבון שלך ואת כל הנתונים המשויכים אליו.
                    <br />
                    <span className="font-semibold text-rose-300/80">לא ניתן לשחזר את הנתונים לאחר המחיקה.</span>
                  </p>
                </DialogHeader>

                <div className="space-y-2.5">
                  <button
                    className="w-full rounded-xl border border-rose-500/40 bg-rose-600/80 px-6 py-3 font-bold text-white shadow-lg shadow-rose-900/30 transition-all hover:bg-rose-600 hover:scale-[1.02] active:scale-[0.97] disabled:opacity-60 disabled:hover:scale-100"
                    disabled={isDeleteLoading}
                    onClick={confirmDeleteAccount}
                    type="button"
                  >
                    {isDeleteLoading ? "מוחקת חשבון..." : "כן, מחקי את החשבון"}
                  </button>

                  <button
                    className="w-full rounded-xl border border-white/10 bg-white/6 px-6 py-3 font-semibold text-white/60 transition-all hover:bg-white/10 hover:text-white/80 active:scale-[0.97]"
                    onClick={() => setLogoutStep("main")}
                    type="button"
                  >
                    חזור
                  </button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </nav>
  );
}

// שורת דיבאג קצרה להצגת ערך/תווית
function DebugRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-gray-200">{value}</div>
      <div className="text-gray-500">{label}</div>
    </div>
  );
}
