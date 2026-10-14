import { getAuthSessionId, getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { hasUsedFreeDiagnosis, normalizeEmail } from "./formulas";
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
// פנימי: כ-query ציבורי כל אחד יכול היה לשלוף פרטים (כולל אימייל) של כל משתמשת.
export const getById = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => await ctx.db.get(userId),
});

// שליפת רשימת כל המשתמשים הפעילים
// פנימי: כ-query ציבורי זו הייתה רשימת אימיילים של כל הלקוחות, פתוחה לכל אחד.
export const listActive = internalQuery({
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
// המזהה נלקח מההתחברות ולא מהדפדפן — אחרת כל משתמשת מחוברת יכלה לשנות
// פרטים של משתמשת אחרת ע"י שליחת userId זר.
export const updateProfile = mutation({
  args: {
    fullName: v.optional(v.string()),
  },
  handler: async (ctx, { fullName }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    await ctx.db.patch(userId, {
      fullName,
      updatedAt: Date.now(),
    });

    return userId;
  },
});

// מחיקת משתמש לפי מזהה (פעולת מנהלת)
// פנימי: כ-mutation ציבורי כל משתמשת מחוברת יכלה למחוק חשבון של אחרת.
// מריצים מלוח הבקרה של Convex בלבד.
export const remove = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
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

// מאפס userType ל-free ומוחק את כל הנוסחאות (לבדיקות)
// פנימי בכוונה: כ-mutation ציבורי כל אחד יכול היה להפעיל אותו מהדפדפן, גם בלי
// להתחבר, ולמחוק את כל האבחונים. מריצים מלוח הבקרה של Convex בלבד (Functions).
export const resetAllUsersToFreePublic = internalMutation({
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
// פנימי בכוונה — מאותה סיבה כמו resetAllUsersToFreePublic. מריצים מלוח הבקרה בלבד.
export const clearAllData = internalMutation({
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
    // getAuthUserId ולא identity.subject: ה-subject הוא "userId|sessionId",
    // ולכן ההשוואה שלו ל-_id לא מצאה אף פעם את המשתמשת — והמחיקה "הצליחה"
    // בלי למחוק כלום.
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("לא מחובר למערכת");
    }
    const currentSessionId = await getAuthSessionId(ctx);
    let deletedCount = 0;

    // 0. אם האבחון החינמי נוצל — שומרים את האימייל, כדי שהרשמה מחדש איתו
    // לא תעניק אבחון חינמי נוסף. חייב לרוץ לפני מחיקת האבחונים והמשתמשת,
    // כי hasUsedFreeDiagnosis נשען על שניהם.
    const user = await ctx.db.get(userId);
    if (user?.email && (await hasUsedFreeDiagnosis(ctx, userId))) {
      const email = normalizeEmail(user.email);
      const alreadyClaimed = await ctx.db
        .query("freeDiagnosisClaims")
        .withIndex("by_email", (q) => q.eq("email", email))
        .first();
      if (!alreadyClaimed) {
        await ctx.db.insert("freeDiagnosisClaims", { email, claimedAt: Date.now() });
      }
    }

    // 1. האבחונים השמורים
    const formulas = await ctx.db
      .query("formulas")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const formula of formulas) {
      await ctx.db.delete(formula._id);
      deletedCount++;
    }

    // 2. חשבונות ההתחברות (סיסמה / Google) וקודי האימות שלהם.
    // בלעדיהם האימייל נשאר "תפוס" ולא ניתן להירשם איתו מחדש.
    const accounts = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) => q.eq("userId", userId))
      .collect();
    for (const account of accounts) {
      const codes = await ctx.db
        .query("authVerificationCodes")
        .withIndex("accountId", (q) => q.eq("accountId", account._id))
        .collect();
      for (const code of codes) {
        await ctx.db.delete(code._id);
      }
      await ctx.db.delete(account._id);
      deletedCount++;
    }

    // 3. התחברויות פעילות במכשירים אחרים. את ההתחברות הנוכחית משאירים —
    // ה-signOut שהלקוח מריץ מיד אחר כך מוחק אותה בצורה מסודרת.
    const sessions = await ctx.db
      .query("authSessions")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .collect();
    for (const session of sessions) {
      if (session._id === currentSessionId) continue;
      const tokens = await ctx.db
        .query("authRefreshTokens")
        .withIndex("sessionId", (q) => q.eq("sessionId", session._id))
        .collect();
      for (const token of tokens) {
        await ctx.db.delete(token._id);
      }
      await ctx.db.delete(session._id);
    }

    // 4. רשומת המשתמשת עצמה.
    // polarOrders לא נמחקות בכוונה: הן תיעוד חשבונאי, ומשמשות למניעת זיכוי
    // כפול אם Polar ישלח שוב webhook על הזמנה ישנה.
    await ctx.db.delete(userId);
    deletedCount++;

    return {
      success: true,
      message: `נמחקו ${deletedCount} רשומות עבור משתמש ${userId}`,
      deletedCount,
    };
  },
});
