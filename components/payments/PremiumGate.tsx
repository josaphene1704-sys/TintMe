"use client";

// ============================================================================
// PremiumGate
// ============================================================================
// רכיב מעטפת שמאפשר "לנעול" תוכן למשתמשים חינמיים.
//
// מתי נציג Paywall?
// - PAYWALL_ENABLED דולק
// - המשתמש מחובר
// - למשתמש אין מנוי פעיל (לפי Convex Polar Component)
//
// הערה:
// - אם PAYWALL_ENABLED כבוי — אנחנו לא נפריע למשתמש ונציג את התוכן.
// - משתמש ב-Convex Polar Component לבדיקת סטטוס מנוי

import { useMutation, useQuery } from "convex/react";
import { useEffect, useMemo, useState } from "react";

import PaywallModal from "@/components/payments/PaywallModal";
import { MOCK_PAYMENTS, PAYWALL_ENABLED } from "@/config/appConfig";
import { api } from "@/convex/_generated/api";

type PremiumGateProps = {
  children: React.ReactNode;
  // מאפשר Preview ידני (למשל מהדיבאג)
  forcePreview?: boolean;
};

export default function PremiumGate({ children, forcePreview }: PremiumGateProps) {
  const user = useQuery(api.users.getCurrentUser);
  const updateUserType = useMutation(api.users.updateUserType);

  // יתרת הקרדיטים של החבילה שנרכשה
  const credits = useQuery(api.credits.getMyCredits);
  // מספר האבחונים שכבר בוצעו — קובע אם המכסה החינמית עדיין זמינה
  // כולל אבחון חינמי שנוצל בחשבון קודם עם אותו אימייל שנמחק
  const freeUsed = useQuery(api.formulas.getFreeDiagnosisUsed);

  const [paywallOpen, setPaywallOpen] = useState(false);

  // הערה: לא בודקים כאן getSubscriptionStatus. המוצרים ב-Polar חד-פעמיים
  // (recurring=false), ולכן טבלת המנויים של הרכיב לעולם לא מתמלאת והבדיקה
  // הזו תמיד הייתה מחזירה false. מקור האמת הוא remainingCredits.
  const isPaid = useMemo(() => {
    // מצב בדיקה בלבד — userType לבדו כבר לא מקנה גישה, כי הוא נשאר "paid"
    // גם אחרי שהקרדיטים נגמרו
    const isMockPaid = MOCK_PAYMENTS && user?.userType === "paid";
    const hasCredits = (credits?.remainingCredits ?? 0) > 0;
    // המכסה החינמית: אבחון ראשון אחד לכל משתמשת
    const hasFreeDiagnosis = freeUsed === false;
    return isMockPaid || hasCredits || hasFreeDiagnosis;
  }, [user?.userType, credits?.remainingCredits, freeUsed]);

  // פתיחה אוטומטית של Paywall כשהעמוד "נעול"
  useEffect(() => {
    if (!PAYWALL_ENABLED) {
      return;
    }

    // forcePreview: לא תלוי בסטטוס משתמש (מטרת דיבאג)
    if (forcePreview) {
      setPaywallOpen(true);
      return;
    }

    if (user && !isPaid) {
      setPaywallOpen(true);
    }
  }, [forcePreview, isPaid, user]);

  const handleMockUpgradeToPaid = async () => {
    if (!MOCK_PAYMENTS) {
      return;
    }

    // מצב בדיקה: מאפשר לסמן את המשתמש כ-paid בלי Checkout אמיתי
    await updateUserType({ userType: "paid" });
  };

  if (!PAYWALL_ENABLED) {
    return <>{children}</>;
  }

  // כפתור האיפוס לבדיקות הוסר: הוא הפעיל את users.resetAllUsersToFreePublic,
  // שהפך לפונקציה פנימית ולכן לא ניתן לקרוא לו מהדפדפן. איפוס מריצים מלוח
  // הבקרה של Convex (Functions → users:resetAllUsersToFreePublic).

  // אם המשתמש או נתוני הגישה עדיין נטענים, נמתין.
  // בלי ההמתנה על credits/freeUsed, משתמשת משלמת הייתה רואה הבזק של
  // ה-Paywall (וה-useEffect היה פותח אותו) לפני שהיתרה מגיעה מהשרת.
  if (user === undefined || credits === undefined || freeUsed === undefined) {
    return <div className="min-h-[60vh]" />; // מצב טעינה
  }

  // אם המשתמש לא מחובר, נציג את התוכן (ההגנה על נתיבים מתבצעת ב-middleware)
  if (user === null) {
    return <>{children}</>;
  }

  // אם המשתמש בתשלום, נציג את התוכן
  if (isPaid) {
    return <>{children}</>;
  }

  return (
    <>
      <PaywallModal
        onMockUpgradeToPaid={handleMockUpgradeToPaid}
        onOpenChange={setPaywallOpen}
        open={paywallOpen}
        preview={Boolean(forcePreview)}
      />

      {/* במצב נעול אנחנו לא מציגים את התוכן מאחורי Paywall */}
      <div className="min-h-[60vh]" />
    </>
  );
}
