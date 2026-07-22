import { validateEvent, WebhookVerificationError } from "@polar-sh/sdk/webhooks";
import { httpRouter } from "convex/server";
import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";
import { auth } from "./auth";
import { polar } from "./polar";

const http = httpRouter();

// הגדרת נתיבי HTTP עבור אימות (Convex Auth)
// זה מאפשר ביצוע פעולות אימות דרך HTTP Endpoints
auth.addHttpRoutes(http);

// הגדרת נתיבי HTTP עבור Polar webhooks
// Polar ישלח אירועים ל-/polar/events (ברירת מחדל)
polar.registerRoutes(http as any, {
  // אופציונלי: התאמה אישית של נתיב ה-webhook
  // path: "/polar/events",
  // אופציונלי: Callbacks לאירועים ספציפיים
  // אפשר להוסיף לוגיקה מותאמת אישית כאן
  // onSubscriptionUpdated: async (ctx, event) => {
  //   // Handle subscription updates
  // },
});

// ============================================================================
// Webhook ייעודי לרכישות חד-פעמיות (order.*)
// ============================================================================
// למה נתיב נפרד ולא callback ברכיב:
// @convex-dev/polar מטפל רק ב-subscription.* וב-product.*, ואין בו שום התייחסות
// ל-order.*. ה-switch שלו גם חסר default, כך שאירוע הזמנה מוחזר כ-202 בשקט
// ואף אחד לא מזוכה. החבילות שלנו הן חד-פעמיות, ולכן זה הנתיב היחיד שמזכה קרדיטים.
//
// ⚠️ דורש endpoint שני ב-Polar Dashboard שמצביע לכאן. ל-Polar יש סוד ייחודי
// לכל endpoint, ולכן הנתיב הזה קורא את POLAR_ORDERS_WEBHOOK_SECRET (ולא את
// POLAR_WEBHOOK_SECRET, ששייך ל-/polar/events).

type PolarOrderData = {
  id?: string;
  status?: string;
  paid?: boolean;
  product_id?: string;
  productId?: string;
  product?: { id?: string };
  customer?: {
    email?: string;
    metadata?: Record<string, unknown>;
  };
  metadata?: Record<string, unknown>;
};

// חילוץ מזהה המוצר — ה-payload של Polar משתנה מעט בין גרסאות/אירועים
function extractProductId(data: PolarOrderData): string | undefined {
  return data.product_id ?? data.productId ?? data.product?.id;
}

// מזהה המשתמשת שהרכיב שותל ב-customer.metadata בעת יצירת הלקוח ב-Polar
function extractUserId(data: PolarOrderData): string | undefined {
  const fromCustomer = data.customer?.metadata?.userId;
  if (typeof fromCustomer === "string") return fromCustomer;
  const fromOrder = data.metadata?.userId;
  if (typeof fromOrder === "string") return fromOrder;
  return;
}

// האם ההזמנה באמת שולמה. order.created עשוי להגיע לפני התשלום בפועל,
// ולכן לא מזכים עליו אלא אם הוא כבר מסומן כמשולם.
function isPaid(eventType: string, data: PolarOrderData): boolean {
  if (eventType === "order.paid") return true;
  return data.paid === true || data.status === "paid";
}

http.route({
  path: "/polar/orders",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // סוד נפרד משלו: Polar מייצר סוד ייחודי לכל endpoint ולא מאפשר להזין
    // אותו ידנית, ולכן ל-/polar/orders יש סוד משלו.
    // ⚠️ POLAR_WEBHOOK_SECRET שייך ל-/polar/events של הרכיב — לא לדרוס אותו.
    // ה-fallback קיים רק לתאימות לאחור עבור סביבה שטרם הוגדרה.
    const secret =
      process.env.POLAR_ORDERS_WEBHOOK_SECRET ?? process.env.POLAR_WEBHOOK_SECRET;
    if (!secret) {
      console.error("[polar/orders] POLAR_ORDERS_WEBHOOK_SECRET לא מוגדר");
      return new Response("Server misconfigured", { status: 500 });
    }

    const body = await request.text();
    // forEach ולא Object.fromEntries(headers.entries()) — ה-lib של סביבת Convex
    // לא כוללת את האיטרטור של Headers
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });

    let event: { type: string; data: PolarOrderData };
    try {
      event = validateEvent(body, headers, secret) as typeof event;
    } catch (error) {
      if (error instanceof WebhookVerificationError) {
        console.error("[polar/orders] אימות חתימה נכשל");
        return new Response("Forbidden", { status: 403 });
      }
      // כאן החתימה כבר אומתה בהצלחה — validateEvent מריץ verify() לפני
      // ה-parsing, וזורק WebhookVerificationError בלבד על חתימה פסולה.
      // לכן כל שגיאה אחרת היא אי-התאמת סכימה בין גרסת ה-SDK הנעוצה לבין
      // ה-payload של Polar. לא נותנים לזה להפיל את הזיכוי: ממשיכים עם
      // ה-JSON הגולמי, שממנו בלאו הכי נדרשים רק id/product_id/customer.
      console.warn(`[polar/orders] parsing של ה-SDK נכשל, ממשיכים עם JSON גולמי: ${String(error)}`);
      try {
        event = JSON.parse(body) as typeof event;
      } catch {
        console.error("[polar/orders] גוף הבקשה אינו JSON תקין");
        return new Response("Bad Request", { status: 400 });
      }
    }

    if (event.type !== "order.created" && event.type !== "order.paid") {
      // אירוע שלא מעניין את הנתיב הזה (הרכיב מטפל בשאר) — מאשרים ויוצאים
      return new Response("Ignored", { status: 202 });
    }

    const data = event.data;
    const orderId = data.id;
    const productId = extractProductId(data);

    if (!(orderId && productId)) {
      console.error(`[polar/orders] ${event.type} ללא orderId/productId — מדלגים`);
      return new Response("Accepted", { status: 202 });
    }

    if (!isPaid(event.type, data)) {
      // עדיין לא שולם — נחכה ל-order.paid
      return new Response("Accepted", { status: 202 });
    }

    const result = await ctx.runMutation(internal.credits.grantCreditsForOrder, {
      orderId,
      productId,
      eventType: event.type,
      customerUserId: extractUserId(data),
      customerEmail: data.customer?.email,
    });

    console.log(`[polar/orders] ${event.type} ${orderId} -> ${result.status}`);
    return new Response("Accepted", { status: 202 });
  }),
});

export default http;
