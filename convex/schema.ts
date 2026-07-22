import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// הגדרת הסכמה (Schema) של מסד הנתונים
// קובץ זה מגדיר את מבנה הטבלאות והקשרים ב-Database
export default defineSchema({
  // יבוא טבלאות ברירת מחדל של ספריית האימות (users, sessions, etc.)
  ...authTables,

  // טבלת נוסחאות שמורות
  formulas: defineTable({
    userId: v.id("users"),
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
    savedAt: v.number(),
  }).index("by_user", ["userId"]),

  // טבלת משתמשים מורחבת
  // מכילה מידע נוסף על המשתמשים מעבר לבסיס של ספריית האימות
  users: defineTable({
    email: v.string(), // כתובת אימייל
    emailVerified: v.optional(v.boolean()), // האם האימייל אומת
    fullName: v.optional(v.string()), // שם מלא
    role: v.union(v.literal("admin"), v.literal("user")), // תפקיד המשתמש
    userType: v.optional(v.union(v.literal("free"), v.literal("paid"))), // סוג משתמש (חינמי או בתשלום) - אופציונלי לתאימות לאחור
    isActive: v.boolean(), // האם המשתמש פעיל
    createdAt: v.number(), // זמן יצירה (Timestamp)
    updatedAt: v.number(), // זמן עדכון אחרון (Timestamp)

    // ── קרדיטים של חבילות בתשלום ──────────────────────────────────────────
    // אופציונליים בכוונה: משתמשים שנוצרו לפני הפיצ'ר לא מכילים את השדות,
    // ושדה חובה היה מפיל את ה-schema push על המסמכים הקיימים.
    // קוראים דרך getUserCredits() ב-convex/credits.ts שמנרמל undefined ל-0.
    totalCredits: v.optional(v.number()), // סך הקרדיטים שנרכשו אי פעם (מצטבר)
    usedCredits: v.optional(v.number()), // כמה נוצלו בפועל
    remainingCredits: v.optional(v.number()), // כמה נשארו למימוש

    // ── מכסת שאלות לבוט ───────────────────────────────────────────────────
    // מאגר מצטבר: כל משתמשת מתחילה עם FREE_BOT_QUESTIONS שאלות חינם,
    // וכל קרדיט אבחון שנרכש מוסיף BOT_QUESTIONS_PER_CREDIT שאלות.
    // אופציונליים מאותה סיבה כמו הקרדיטים — ראה getBotQuota() ב-convex/credits.ts.
    botQuestionsTotal: v.optional(v.number()), // סך השאלות שהוקצו אי פעם
    botQuestionsUsed: v.optional(v.number()), // כמה שאלות נשאלו
    botQuestionsRemaining: v.optional(v.number()), // כמה נשארו
  })
    .index("by_email", ["email"]) // אינדקס לחיפוש מהיר לפי אימייל
    .index("by_role", ["role"]) // אינדקס לסינון מהיר לפי תפקיד
    .index("by_userType", ["userType"]), // אינדקס לסינון מהיר לפי סוג משתמש

  // רישום הזמנות שכבר טופלו מ-Polar
  // מטרה: אידמפוטנטיות. Polar שולח order.created ו-order.paid על אותה עסקה,
  // ומבצע retry על כשלים — בלי הטבלה הזו לקוחה הייתה מקבלת קרדיטים כפולים.
  polarOrders: defineTable({
    orderId: v.string(), // מזהה ההזמנה ב-Polar (מפתח הדדופליקציה)
    userId: v.id("users"),
    productId: v.string(),
    creditsGranted: v.number(),
    eventType: v.string(), // האירוע שגרם לזיכוי בפועל
    processedAt: v.number(),
  }).index("by_orderId", ["orderId"]),
});
