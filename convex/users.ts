import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";

// Internal query לשליפת המשתמש הנוכחי עבור Polar Component
// (משמש את polar.ts לקבלת userId ו-email)
export const _getCurrentUserForPolar = internalQuery({
  args: {},
  handler: async (ctx): Promise<{ userId: Id<"users">; email: string } | null> => {
    // שימוש ב-getAuthUserId — אותה שיטה אמינה שעובדת ב-getCurrentUser
    const userId = await getAuthUserId(ctx);
    if (userId) {
      const user = await ctx.db.get(userId);
      if (user) {
        return { userId: user._id, email: user.email };
      }
    }

    // Fallback: חיפוש לפי אימייל מה-identity
    const identity = await ctx.auth.getUserIdentity();
    if (identity?.email) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", identity.email ?? ""))
        .unique();
      if (user) {
        return { userId: user._id, email: user.email };
      }
    }

    return null;
  },
});

// שליפת המשתמש הנוכחי המחובר
// מחזיר null אם המשתמש לא מחובר
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return await ctx.db.get(userId);
  },
});

// שליפת משתמש לפי מזהה (ID)
export const getById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => await ctx.db.get(userId),
});

// שליפת רשימת כל המשתמשים הפעילים
export const listActive = query({
  args: {},
  handler: async (ctx) =>
    await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect(),
});

// יצירה או עדכון של משתמש (נקרא בדרך כלל מתהליך האימות)
export const createOrUpdateUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const email = identity.email ?? "";
    const now = Date.now();

    // בדיקה אם המשתמש כבר קיים
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();

    const userData = {
      email,
      emailVerified: identity.emailVerified ?? false,
      fullName: identity.name || identity.nickname || "User",
      role: "user" as const,
      userType: "free" as const, // ברירת מחדל - משתמש חינמי
      isActive: true,
      updatedAt: now,
    };

    // עדכון משתמש קיים
    if (existing) {
      await ctx.db.patch(existing._id, userData);
      return existing._id;
    }

    // יצירת משתמש חדש
    return await ctx.db.insert("users", {
      ...userData,
      createdAt: now,
    });
  },
});

// עדכון פרופיל המשתמש (למשל, שינוי שם)
export const updateProfile = mutation({
  args: {
    userId: v.id("users"),
    fullName: v.optional(v.string()),
  },
  handler: async (ctx, { userId, fullName }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    await ctx.db.patch(userId, {
      fullName,
      updatedAt: Date.now(),
    });

    return userId;
  },
});

// מחיקת משתמש (פעולה למנהלים או למשתמש עצמו)
export const remove = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    await ctx.db.delete(userId);
  },
});

// ============================================================================
// תשלומים / סטטוס משתמש
// ============================================================================

// עדכון סוג המשתמש (חינמי/בתשלום)
// נועד לשימוש במצב בדיקה (Mock)
export const updateUserType = mutation({
  args: {
    userType: v.union(v.literal("free"), v.literal("paid")),
  },
  handler: async (ctx, { userType }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("לא מחובר למערכת");
    }

    // ב-Convex Auth, ה-subject מכיל: authAccountId|userId
    const subjectParts = identity.subject.split("|");

    // ניסיון לשלוף משתמש לפי ID
    if (subjectParts.length >= 2) {
      const userId = subjectParts[1] as import("./_generated/dataModel").Id<"users">;
      try {
        const user = await ctx.db.get(userId);
        if (user) {
          await ctx.db.patch(user._id, {
            userType,
            updatedAt: Date.now(),
          });
          return user._id;
        }
      } catch {
        // ID לא תקין, נמשיך לחלופות
      }
    }

    // Fallback: חיפוש לפי אימייל
    if (identity.email) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", identity.email ?? ""))
        .unique();

      if (user) {
        await ctx.db.patch(user._id, {
          userType,
          updatedAt: Date.now(),
        });
        return user._id;
      }
    }

    throw new Error("משתמש לא נמצא");
  },
});

// ============================================================================
// איפוס משתמשים (לצורך בדיקות בלבד)
// ============================================================================

// מאפסת את כל המשתמשים ל-userType = "free" (לשימוש פנימי / בדיקות)
export const resetAllUsersToFree = internalMutation({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const now = Date.now();
    let count = 0;
    for (const user of users) {
      if (user.userType !== "free") {
        await ctx.db.patch(user._id, { userType: "free", updatedAt: now });
        count++;
      }
    }
    return { reset: count, total: users.length };
  },
});

// wrapper ציבורי — מאפס userType ל-free ומוחק את כל הנוסחאות (לבדיקות)
export const resetAllUsersToFreePublic = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // 1. אפס userType ל-free לכל המשתמשים
    const users = await ctx.db.query("users").collect();
    let resetUsers = 0;
    for (const user of users) {
      await ctx.db.patch(user._id, { userType: "free", updatedAt: now });
      resetUsers++;
    }

    // 2. מחק את כל הנוסחאות (כך שהספירה תחזור ל-0)
    const formulas = await ctx.db.query("formulas").collect();
    for (const formula of formulas) {
      await ctx.db.delete(formula._id);
    }

    return { resetUsers, deletedFormulas: formulas.length };
  },
});

// ============================================================================
// מחיקת כל הנתונים (איפוס מלא)
// ============================================================================

// מוחק את כל האבחונים (formulas) וכל הלקוחות (users)
// לאחר המחיקה, כל מי שנרשם מחדש יקבל אבחון חינמי אחד
export const clearAllData = mutation({
  args: {},
  handler: async (ctx) => {
    // מחיקת כל הנוסחאות/אבחונים
    const formulas = await ctx.db.query("formulas").collect();
    for (const formula of formulas) {
      await ctx.db.delete(formula._id);
    }

    // מחיקת כל הלקוחות מטבלת users
    const users = await ctx.db.query("users").collect();
    for (const user of users) {
      await ctx.db.delete(user._id);
    }

    return {
      deletedFormulas: formulas.length,
      deletedUsers: users.length,
    };
  },
});

// ============================================================================
// מחיקת חשבון
// ============================================================================

// מחיקת חשבון המשתמש הנוכחי וכל הנתונים המשויכים אליו
// ⚠️ אזהרה: פעולה זו בלתי הפיכה ותמחק את כל הנתונים לצמיתות!
export const deleteMyAccount = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("לא מחובר למערכת");
    }

    // קבלת מזהה המשתמש מה-identity
    const userId = identity.subject;
    let deletedCount = 0;

    // מחיקת המשתמש מטבלת המשתמשים
    // הערה: Convex Auth מנהל את טבלת המשתמשים, אך אנחנו יכולים למחוק את הרשומה
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("_id"), userId))
      .first();

    if (user) {
      await ctx.db.delete(user._id);
      deletedCount += 1;
    }

    return {
      success: true,
      message: `נמחקו ${deletedCount} רשומות עבור משתמש ${userId}`,
      deletedCount,
    };
  },
});
