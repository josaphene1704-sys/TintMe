// ============================================================================
// Polar Client (Convex Component)
// ============================================================================
// אתחול רכיב Polar של Convex
// מספק אינטגרציה פשוטה למערכת תשלומים ומנויים
// Docs: https://www.convex.dev/components/polar

import { Polar } from "@convex-dev/polar";
import { v } from "convex/values";
import { components, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { query } from "./_generated/server";

// טיפוס עבור תוצאת getUserInfo
type UserInfo = { userId: Id<"users">; email: string };

// יצירת מופע Polar
export const polar = new Polar(components.polar, {
  // פונקציה לקבלת פרטי המשתמש הנוכחי
  getUserInfo: async (ctx): Promise<UserInfo> => {
    const userInfo = (await ctx.runQuery(
      internal.users._getCurrentUserForPolar
    )) as UserInfo | null;
    if (!userInfo) {
      throw new Error("Not authenticated");
    }
    return userInfo;
  },

  // מיפוי מפתחות לProduct IDs
  products: {
    pack1: process.env.NEXT_PUBLIC_POLAR_PRODUCT_ID_1 || "",
    pack3: process.env.NEXT_PUBLIC_POLAR_PRODUCT_ID_3 || "",
    pack30: process.env.NEXT_PUBLIC_POLAR_PRODUCT_ID_30 || "",
  },
});

// ייצוא פונקציות ה-API של Polar
export const {
  changeCurrentSubscription,
  cancelCurrentSubscription,
  getConfiguredProducts,
  listAllProducts,
  generateCheckoutLink,
  generateCustomerPortalUrl,
} = polar.api();

// Query לשליפת סטטוס מנוי עבור ה-client
export const getSubscriptionStatus = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => await polar.getCurrentSubscription(ctx, { userId }),
});
