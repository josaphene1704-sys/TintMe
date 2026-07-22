// ============================================================================
// Credits — ניהול קרדיטים של חבילות אבחון בתשלום
// ============================================================================
// המוצרים ב-Polar הם חד-פעמיים (recurring=false), ולכן הרכיב @convex-dev/polar
// לא מזכה אותם — הוא מטפל רק ב-subscription.*. הקובץ הזה מממש את הזיכוי
// מאירועי order.* שמגיעים ל-convex/http.ts.

import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { internalMutation, type MutationCtx, query } from "./_generated/server";

// ── מיפוי מוצר -> כמות קרדיטים ───────────────────────────────────────────────
// אותם משתני סביבה שמשמשים את convex/polar.ts, כדי שלא ייווצר מקור אמת שני.
export function creditsForProduct(productId: string): number {
  const map: Record<string, number> = {};
  const pack1 = process.env.NEXT_PUBLIC_POLAR_PRODUCT_ID_1;
  const pack3 = process.env.NEXT_PUBLIC_POLAR_PRODUCT_ID_3;
  const pack30 = process.env.NEXT_PUBLIC_POLAR_PRODUCT_ID_30;
  if (pack1) map[pack1] = 1;
  if (pack3) map[pack3] = 3;
  if (pack30) map[pack30] = 30;
  return map[productId] ?? 0;
}

// ── קריאה מנורמלת של המונים ─────────────────────────────────────────────────
// משתמשים ותיקים נוצרו לפני הפיצ'ר ואין להם את השדות כלל.
export function getUserCredits(user: Doc<"users">) {
  return {
    totalCredits: user.totalCredits ?? 0,
    usedCredits: user.usedCredits ?? 0,
    remainingCredits: user.remainingCredits ?? 0,
  };
}

// ── זיכוי קרדיטים בעקבות הזמנה ששולמה ───────────────────────────────────────
// אידמפוטנטי: הזמנה שכבר טופלה לא תזוכה שוב, גם אם Polar ישלח אותה שוב.
export const grantCreditsForOrder = internalMutation({
  args: {
    orderId: v.string(),
    productId: v.string(),
    eventType: v.string(),
    customerUserId: v.optional(v.string()),
    customerEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 1. דדופליקציה — order.created ו-order.paid מגיעים שניהם על אותה עסקה
    const existing = await ctx.db
      .query("polarOrders")
      .withIndex("by_orderId", (q) => q.eq("orderId", args.orderId))
      .unique();
    if (existing) {
      return { status: "duplicate" as const, orderId: args.orderId };
    }

    // 2. כמה קרדיטים מגיעים על המוצר הזה
    const credits = creditsForProduct(args.productId);
    if (credits === 0) {
      console.error(
        `[credits] מוצר לא מוכר בהזמנה ${args.orderId}: ${args.productId} — לא זוכו קרדיטים`
      );
      return { status: "unknown_product" as const, productId: args.productId };
    }

    // 3. איתור המשתמשת
    const user = await resolveUser(ctx, args.customerUserId, args.customerEmail);
    if (!user) {
      console.error(
        `[credits] לא נמצאה משתמשת להזמנה ${args.orderId} (email=${args.customerEmail ?? "-"})`
      );
      return { status: "user_not_found" as const, orderId: args.orderId };
    }

    // 4. עדכון המונים
    const current = getUserCredits(user);
    await ctx.db.patch(user._id, {
      totalCredits: current.totalCredits + credits,
      remainingCredits: current.remainingCredits + credits,
      usedCredits: current.usedCredits, // מנרמל undefined לאפס עבור משתמשים ותיקים
      userType: "paid",
      updatedAt: Date.now(),
    });

    // 5. סימון ההזמנה כמטופלת
    await ctx.db.insert("polarOrders", {
      orderId: args.orderId,
      userId: user._id,
      productId: args.productId,
      creditsGranted: credits,
      eventType: args.eventType,
      processedAt: Date.now(),
    });

    return {
      status: "granted" as const,
      userId: user._id,
      creditsGranted: credits,
      remainingCredits: current.remainingCredits + credits,
    };
  },
});

// איתור משתמשת מתוך פרטי הלקוח שב-webhook.
// עדיפות ל-userId שהרכיב שותל ב-customer.metadata בזמן יצירת הלקוח,
// ונפילה לאימייל עבור לקוחות שנוצרו מחוץ לזרימה הזו.
async function resolveUser(
  ctx: MutationCtx,
  customerUserId?: string,
  customerEmail?: string
): Promise<Doc<"users"> | null> {
  if (customerUserId) {
    try {
      const byId = await ctx.db.get(customerUserId as Id<"users">);
      if (byId) return byId;
    } catch {
      // מזהה לא תקין — ממשיכים לחיפוש לפי אימייל
    }
  }

  if (customerEmail) {
    // לא .unique() — בבסיס הנתונים קיימות כפילויות אימייל, ו-unique() היה זורק
    // שגיאה שגורמת ל-webhook להחזיר 500 ול-Polar לנסות שוב בלי סוף.
    // בכפילות בוחרים את החשבון שנוצר אחרון, שהוא הפעיל בפועל.
    const matches = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", customerEmail))
      .collect();

    if (matches.length > 1) {
      console.warn(
        `[credits] נמצאו ${matches.length} חשבונות לאימייל ${customerEmail} — נבחר האחרון שנוצר`
      );
    }
    if (matches.length > 0) {
      return matches.reduce((newest, u) => (u._creationTime > newest._creationTime ? u : newest));
    }
  }

  return null;
}

// ── ניצול קרדיט אחד ─────────────────────────────────────────────────────────
// נקרא מתוך formulas.save בצד השרת, כך שלא ניתן לעקוף אותו מהדפדפן.
// מחזיר true אם נוצל קרדיט, false אם אין יתרה.
export async function consumeOneCredit(ctx: MutationCtx, userId: Id<"users">): Promise<boolean> {
  const user = await ctx.db.get(userId);
  if (!user) return false;

  const { totalCredits, usedCredits, remainingCredits } = getUserCredits(user);
  if (remainingCredits <= 0) return false;

  await ctx.db.patch(userId, {
    totalCredits,
    usedCredits: usedCredits + 1,
    remainingCredits: remainingCredits - 1,
    updatedAt: Date.now(),
  });
  return true;
}

// ── שליפת מצב הקרדיטים עבור ה-UI ────────────────────────────────────────────
export const getMyCredits = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const user = await ctx.db.get(userId);
    if (!user) return null;

    return getUserCredits(user);
  },
});
