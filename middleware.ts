import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";
import type { NextRequest } from "next/server";

// הגדרת נתיבים ציבוריים (שלא דורשים אימות)
// /api/chat ו-/api/analyze-hair "ציבוריים" רק במובן שה-middleware לא מפנה
// אותם ל-sign-in — השער האמיתי הוא בדיקת convexAuthNextjsToken() בתוך הנתיב,
// שם גם נגבית המכסה. redirect מ-middleware על נתיב API היה מחזיר HTML לפצ'.
const isPublicRoute = createRouteMatcher(["/", "/sign-in", "/sign-up", "/page1", "/page1b", "/page2", "/page3", "/api/chat", "/api/analyze-hair"]);

// Middleware לבדיקת אימות והפניות
export default convexAuthNextjsMiddleware(async (request: NextRequest, ctx) => {
  const { convexAuth } = ctx;

  // אם הנתיב אינו ציבורי והמשתמש לא מחובר -> הפניה לדף התחברות
  if (!(isPublicRoute(request) || (await convexAuth.isAuthenticated()))) {
    return nextjsMiddlewareRedirect(request, "/sign-in");
  }

  // אופציונלי: הפניה של משתמשים מחוברים מדפי אימות
  if (isPublicRoute(request) && (await convexAuth.isAuthenticated())) {
    // return nextjsMiddlewareRedirect(request, "/");
  }
});

export const config = {
  // הגדרת ה-Matcher כדי שה-Middleware ירוץ על כל הנתיבים הרלוונטיים
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
