"use client";

import { CheckoutLink } from "@convex-dev/polar/react";
import { useQuery } from "convex/react";
import { Check, ChevronRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  IS_DEV_MODE,
  MOCK_PAYMENTS,
  PAYMENT_SYSTEM_ENABLED,
  PRIVACY_URL,
  TERMS_URL,
} from "@/config/appConfig";
import { PLAN_DISPLAY } from "@/config/planDisplay";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";

export type PaywallPlanId = "free" | "monthly" | "yearly";

type PaywallModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMockUpgradeToPaid?: () => Promise<void> | void;
  preview?: boolean;
};

const FEATURES_FREE: string[] = ["אבחון בסיסי אחד (להתחלה)"];

const FEATURES_PAID: string[] = [
  "אבחון צבע מקצועי ומלא",
  "פורמולה מותאמת אישית",
  "רשימת קנייה חכמה",
  "גישה לקטלוג גוונים מלא",
];

export default function PaywallModal({
  open,
  onOpenChange,
  onMockUpgradeToPaid,
  preview,
}: PaywallModalProps) {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<PaywallPlanId>("yearly");
  const [error, setError] = useState<string>("");

  const isPreviewMode = Boolean(preview && IS_DEV_MODE);

  const products = useQuery(api.polar.getConfiguredProducts);

  const monthlyProductId = products?.premiumMonthly?.id;
  const yearlyProductId = products?.premiumYearly?.id;

  const handleBack = () => {
    onOpenChange(false);
    router.back();
  };

  const continueLabel = useMemo(() => {
    if (selectedPlan === "free") return "המשיכי בחינם";
    return "המשיכי";
  }, [selectedPlan]);

  const handleFreeContinue = () => {
    setError("");
    onOpenChange(false);
  };

  const handleMockContinue = async () => {
    setError("");
    if (MOCK_PAYMENTS && onMockUpgradeToPaid) {
      await onMockUpgradeToPaid();
      onOpenChange(false);
    } else {
      setError(
        "מצב תצוגה מקדימה: מערכת התשלומים כבויה כרגע. ניתן להפעיל אותה דרך appConfig.ts לאחר הגדרה מלאה."
      );
    }
  };

  const selectedProductId = useMemo(() => {
    if (selectedPlan === "monthly") return monthlyProductId;
    if (selectedPlan === "yearly") return yearlyProductId;
    return;
  }, [selectedPlan, monthlyProductId, yearlyProductId]);

  const hasProductConfigured = selectedPlan === "free" || Boolean(selectedProductId);

  const showRealCheckout =
    PAYMENT_SYSTEM_ENABLED && !isPreviewMode && selectedPlan !== "free" && hasProductConfigured;

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent
        className="border-0 bg-transparent p-0 sm:max-w-3xl shadow-2xl"
        hideCloseButton={!isPreviewMode}
      >
        {/* Gradient background matching TintMe branding */}
        <div
          className="relative overflow-hidden rounded-3xl p-[1px]"
          style={{
            background: "linear-gradient(135deg, #7c3aed, #d946ef, #fb7185)",
          }}
        >
          <div
            className="rounded-3xl p-6"
            dir="rtl"
            style={{
              background: "linear-gradient(145deg, #1a0533 0%, #2d0a4e 40%, #1a0533 100%)",
            }}
          >
            {/* Decorative blobs */}
            <div
              className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full opacity-20 blur-3xl"
              style={{ background: "radial-gradient(circle, #d946ef, transparent)" }}
            />
            <div
              className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full opacity-20 blur-3xl"
              style={{ background: "radial-gradient(circle, #7c3aed, transparent)" }}
            />

            <DialogHeader className="relative mb-6">
              <div className="flex items-center justify-between">
                <button
                  aria-label="חזרי"
                  className="flex items-center gap-1 text-purple-300 transition hover:text-pink-300"
                  onClick={handleBack}
                  type="button"
                >
                  <ChevronRight className="h-5 w-5" />
                  <span className="text-sm">חזרי</span>
                </button>
                <DialogTitle className="flex-1 text-center font-bold text-3xl text-white">
                  בחרי תוכנית לצבע שלך
                </DialogTitle>
                <div className="w-16" />
              </div>
              <p className="mt-2 text-center text-purple-300 text-sm">
                תוכלי לשדרג בכל עת. בטלי מתי שתרצי.
              </p>
            </DialogHeader>

            <div className="relative grid grid-cols-1 gap-4 md:grid-cols-3">
              <PlanCard
                features={FEATURES_FREE}
                onSelect={setSelectedPlan}
                planId="free"
                selectedPlan={selectedPlan}
                subtitle={PLAN_DISPLAY.free.subtitle}
                title={PLAN_DISPLAY.free.title}
              />
              <PlanCard
                features={FEATURES_PAID}
                onSelect={setSelectedPlan}
                planId="monthly"
                priceLine={PLAN_DISPLAY.monthly.priceLine}
                selectedPlan={selectedPlan}
                subtitle={PLAN_DISPLAY.monthly.subtitle}
                title={PLAN_DISPLAY.monthly.title}
              />
              <PlanCard
                features={FEATURES_PAID}
                isRecommended={true}
                onSelect={setSelectedPlan}
                planId="yearly"
                priceLine={PLAN_DISPLAY.yearly.priceLine}
                selectedPlan={selectedPlan}
                subtitle={PLAN_DISPLAY.yearly.subtitle}
                title={PLAN_DISPLAY.yearly.title}
              />
            </div>

            {isPreviewMode && (
              <div className="mt-5 rounded-xl border border-yellow-400/30 bg-yellow-400/10 px-4 py-3 text-sm text-yellow-200">
                מצב תצוגה מקדימה פעיל — רכישות מושבתות
              </div>
            )}

            {error && (
              <div className="mt-4 rounded-xl border border-pink-500/30 bg-pink-500/10 px-4 py-3 text-pink-200 text-sm">
                {error}
              </div>
            )}

            <div className="relative mt-6">
              {selectedPlan === "free" && (
                <button
                  className="w-full rounded-2xl px-6 py-4 font-bold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-pink-500/30 focus:outline-none"
                  onClick={handleFreeContinue}
                  style={{
                    background: "linear-gradient(135deg, #7c3aed 0%, #d946ef 50%, #fb7185 100%)",
                    boxShadow: "0 4px 20px rgba(217, 70, 239, 0.35)",
                  }}
                  type="button"
                >
                  {continueLabel}
                </button>
              )}

              {showRealCheckout && selectedProductId && (
                <div
                  className="rounded-2xl shadow-lg"
                  style={{
                    background: "linear-gradient(135deg, #7c3aed 0%, #d946ef 50%, #fb7185 100%)",
                    boxShadow: "0 4px 20px rgba(217, 70, 239, 0.35)",
                  }}
                >
                  <CheckoutLink
                    className="block w-full rounded-2xl px-6 py-4 text-center font-bold text-white transition-all duration-300 hover:scale-[1.02] focus:outline-none"
                    polarApi={api.polar}
                    productIds={[selectedProductId]}
                  >
                    {continueLabel}
                  </CheckoutLink>
                </div>
              )}

              {selectedPlan !== "free" && !showRealCheckout && (
                <button
                  className="w-full rounded-2xl px-6 py-4 font-bold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] focus:outline-none"
                  onClick={handleMockContinue}
                  style={{
                    background: "linear-gradient(135deg, #7c3aed 0%, #d946ef 50%, #fb7185 100%)",
                    boxShadow: "0 4px 20px rgba(217, 70, 239, 0.35)",
                  }}
                  type="button"
                >
                  {continueLabel}
                </button>
              )}

              <p className="mt-3 text-center text-purple-400 text-xs">
                המשך עם התחייבות להחזר כספי (דוגמה). את הטקסט הזה אפשר לשנות לפי הצורך.
              </p>
            </div>

            <div className="mt-6 flex items-center justify-center gap-6 text-sm">
              <Link
                className="text-purple-400 transition-colors hover:text-pink-300"
                href={TERMS_URL}
                rel="noopener noreferrer"
                target="_blank"
              >
                תנאי שימוש
              </Link>
              <span className="text-purple-700">•</span>
              <Link
                className="text-purple-400 transition-colors hover:text-pink-300"
                href={PRIVACY_URL}
                rel="noopener noreferrer"
                target="_blank"
              >
                פרטיות
              </Link>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

type PlanCardProps = {
  planId: PaywallPlanId;
  title: string;
  subtitle: string;
  priceLine?: string;
  features: string[];
  selectedPlan: PaywallPlanId;
  onSelect: (plan: PaywallPlanId) => void;
  isRecommended?: boolean;
};

function PlanCard({
  planId,
  title,
  subtitle,
  priceLine,
  features,
  selectedPlan,
  onSelect,
  isRecommended,
}: PlanCardProps) {
  const isSelected = selectedPlan === planId;

  return (
    <button
      className={cn(
        "relative rounded-2xl p-5 text-right transition-all duration-300",
        "hover:scale-[1.02]",
        isSelected
          ? "ring-2 ring-pink-400/70"
          : "ring-1 ring-purple-700/40 hover:ring-purple-500/60"
      )}
      onClick={() => onSelect(planId)}
      style={{
        background: isSelected
          ? "linear-gradient(145deg, rgba(124,58,237,0.25) 0%, rgba(217,70,239,0.15) 100%)"
          : "rgba(255,255,255,0.04)",
        boxShadow: isSelected ? "0 0 24px rgba(217, 70, 239, 0.2)" : "none",
      }}
      type="button"
    >
      {isRecommended && (
        <div
          className="-top-3 absolute right-4 flex items-center gap-1 rounded-full px-3 py-1 font-bold text-white text-xs"
          style={{
            background: "linear-gradient(135deg, #7c3aed, #d946ef)",
            boxShadow: "0 2px 10px rgba(217,70,239,0.5)",
          }}
        >
          <Sparkles className="h-3 w-3" />
          מומלץ
        </div>
      )}

      {/* Selection indicator */}
      <div
        aria-hidden="true"
        className={cn(
          "absolute top-4 left-4 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all duration-200",
          isSelected ? "border-pink-400 bg-pink-400" : "border-purple-600"
        )}
      >
        {isSelected && <Check className="h-4 w-4 text-white" strokeWidth={3} />}
      </div>

      <div className="mb-3 mt-1">
        <div className="font-bold text-lg text-white">{title}</div>
        <div className="mt-1 text-purple-300 text-sm">{subtitle}</div>

        {priceLine && (
          <div
            className="mt-3 bg-clip-text font-extrabold text-4xl text-transparent"
            style={{
              backgroundImage: "linear-gradient(135deg, #c084fc, #f0abfc, #fb7185)",
            }}
          >
            {priceLine}
          </div>
        )}
      </div>

      <div className="mt-4 space-y-2">
        {features.map((feature) => (
          <div className="flex items-center gap-2" key={feature}>
            <Check className="h-4 w-4 shrink-0 text-pink-400" strokeWidth={2.5} />
            <span className="text-purple-100 text-sm">{feature}</span>
          </div>
        ))}
      </div>
    </button>
  );
}
