import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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

    // בדיקת מגבלת משתמש חינמי — מקסימום אבחון אחד
    const user = await ctx.db.get(userId);
    if (user && user.userType === "free") {
      const existingCount = await ctx.db
        .query("formulas")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .count();
      if (existingCount >= 1) {
        throw new Error("משתמש חינמי יכול לשמור אבחון אחד בלבד. אנא קנה חבילה כדי לשמור אבחונים נוספים.");
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
