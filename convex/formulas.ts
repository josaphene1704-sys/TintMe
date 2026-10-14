import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { consumeOneCredit } from "./credits";
import type { Id } from "./_generated/dataModel";
import { mutation, type QueryCtx, query } from "./_generated/server";

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

// האם המשתמשת כבר ניצלה את האבחון החינמי — מקור אמת אחד לשרת ול-UI.
// נוצל אם יש לה אבחון שמור, או אם האימייל שלה ניצל אותו בחשבון שנמחק
// (ראה freeDiagnosisClaims ב-schema.ts ו-users.deleteMyAccount).
export async function hasUsedFreeDiagnosis(ctx: QueryCtx, userId: Id<"users">): Promise<boolean> {
  const existing = await ctx.db
    .query("formulas")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .first();
  if (existing) return true;

  const user = await ctx.db.get(userId);
  if (!user?.email) return false;
  const claim = await ctx.db
    .query("freeDiagnosisClaims")
    .withIndex("by_email", (q) => q.eq("email", normalizeEmail(user.email)))
    .first();
  return claim !== null;
}

export const save = mutation({
  args: {
    currentShadeCode: v.optional(v.string()),
    desiredShadeCode: v.optional(v.string()),
    grayPercentage: v.string(),
    bleachingHistory: v.string(),
    hairCondition: v.string(),
    hairLength: v.string(),
    developerPct: v.number(),
    gramsPrimary: v.number(),
    gramsBase: v.optional(v.number()),
    gramsTotal: v.number(),
    processingTimeMin: v.number(),
    processingTimeMax: v.number(),
    isHighLift: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    // ── בקרת גישה: קרדיטים תחילה, ואז המכסה החינמית ──────────────────────
    // הניכוי מתבצע כאן ולא בצד הלקוח, כדי שלא יהיה ניתן לעקוף אותו מהדפדפן.
    // ההערכה חייבת להתבצע לפני ה-insert כדי שאבחון שנחסם לא ייכתב.
    const user = await ctx.db.get(userId);
    if (user) {
      const consumed = await consumeOneCredit(ctx, userId);

      if (!consumed) {
        // אין יתרת קרדיטים — נופלים למכסה החינמית של אבחון אחד
        if (await hasUsedFreeDiagnosis(ctx, userId)) {
          throw new Error(
            "נגמרו האבחונים בחבילה שלך. אנא רכשי חבילה חדשה כדי להמשיך."
          );
        }
      }
    }

    return await ctx.db.insert("formulas", {
      userId,
      ...args,
      savedAt: Date.now(),
    });
  },
});

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("formulas")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const getLatest = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const results = await ctx.db
      .query("formulas")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .first();
    return results ?? null;
  },
});

// עבור ה-UI: האם האבחון החינמי כבר נוצל (כולל בחשבון קודם שנמחק).
// null כשלא מחוברת.
export const getFreeDiagnosisUsed = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return await hasUsedFreeDiagnosis(ctx, userId);
  },
});

export const getCount = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return 0;
    const formulas = await ctx.db
      .query("formulas")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    return formulas.length;
  },
});
