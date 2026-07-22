import Anthropic from "@anthropic-ai/sdk";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { type NextRequest, NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";

const SYSTEM_PROMPT = `אתה עוזר מקצועי ברמת סלון עולמי לצביעת שיער עבור אפליקציית 'TintMe'.
עליך לענות אך ורק בעברית (RTL), בצורה תמציתית, מדויקת ואמפתית.
תמיד הזהיר לגבי בטיחות כימית.

== כללי הנוסחה שעליך ליישם ==

## 1. כיסוי שיער לבן (לפי אחוז לבן)
- 0% לבן: 100% צבע יעד (גוון אופנה). אין צורך בבסיס.
- עד 30% לבן: 100% צבע יעד (אפשרי 1/4 בסיס טבעי אם השיער עמיד).
- 30%–50% לבן: 1/3 בסיס טבעי (סדרה 0) + 2/3 צבע יעד באותה רמה.
- מעל 50% לבן: יחס 1:1 — 50% בסיס טבעי (סדרה 0 או 00) + 50% צבע יעד.

## 2. בהרה עדינה (הבהרה של 1–2 רמות)
- כאשר הגוון היעד בהיר ב-1 או 2 רמות מהשיער הנוכחי:
  יש להוסיף מבהיר טבעי (סדרה 0 או 00 באותה רמה) ביחס 1:1 עם צבע האופנה.
  לדוגמה: 60 גרם צבע → 30 גרם צבע + 30 גרם מבהיר טבעי.
  חוק זה חל לפני הכפלה לשיער ארוך.
  אוקסידנט: 6% לטווח זה.
  אל תחיל כלל זה כאשר: מבהירים 3+ רמות (יש להשתמש בלוגיקת High-Lift), צובעים באותה רמה/כהה יותר, או כשכללי כיסוי לבן כבר מגדירים בסיס טבעי.

## 3. יחסי ערבוב ואוקסידנט
- צביעה רגילה (באותה רמה / כהה יותר / כיסוי לבן):
  יחס 1:1 — לדוגמה: 60 גרם צבע + 60 גרם אוקסידנט.
  אוקסיד: 3% או 6% לפי מצב השיער.
- הבהרה חזקה (3+ רמות / אבקת הלבנה):
  יחס 1:2 — האוקסיד תמיד כפול מכמות האבקה.
  לדוגמה: 40 גרם אבקה + 80 גרם אוקסיד = 120 גרם.
  אוקסיד — כלל קריטי:
  * 12% אך ורק לשיער טבעי ובריא (שמעולם לא נצבע ולא הובהר).
  * 9% לשיער צבוע שזקוק להבהרה של 3 רמות. לעולם אין למרוח 12% על שיער צבוע!
  חובה להציג אזהרה מיוחדת לגבי מריחה מדויקת ולציין את אחוז החמצן שנבחר.

## 4. התאמה לאורך שיער
- קצר / בינוני (עד הכתפיים): כמויות בסיס (ראה סעיפים 1–2).
  דוגמה רגיל: 60 גרם + 60 גרם = 120 גרם סה"כ.
  דוגמה High-Lift: 40 גרם + 80 גרם = 120 גרם סה"כ.
- ארוך (מתחת לכתפיים): כל הכמויות מוכפלות אוטומטית.
  דוגמה רגיל: 120 גרם + 120 גרם = 240 גרם סה"כ.
  דוגמה High-Lift: 80 גרם + 160 גרם = 240 גרם סה"כ.

## 5. תזמון ומריחה
- שיער טבעי: 35–45 דקות עיבוד.
- שיער צבוע רגיל: מרחי קודם על השורשים (זמן מלא), ואז מתחי לקצוות ב-10–15 הדקות האחרונות בלבד.
- שיער פגום / יבש: הפחיתי 5–10 דקות מזמן העיבוד. מומלץ אוקסיד חלש יותר על הקצוות (או טונר ללא אמוניה).
- שיער מולבן לאחרונה: אזהרה! אל תמרחי צבע קבוע עם אוקסיד חזק על אזורים מולבנים. מומלץ טונר 1.9% או 3% בלבד.

== סיום ==
כאשר המשתמשת שואלת על נוסחה, חשבי לפי הכללים הנ"ל ותני תשובה מספרית מדויקת.
השתמשי בנתוני השיער שסופקו (אם קיימים) כהקשר אישי לתשובות.`;

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export async function POST(req: NextRequest) {
  // ── אימות ומכסה ─────────────────────────────────────────────────────────
  // הנתיב הזה היה פתוח לחלוטין: כל אחד יכול היה להפציץ אותו ולשרוף את
  // תקציב ה-API. הניכוי חייב לקרות בשרת ולפני הקריאה ל-Anthropic, אחרת
  // אפשר לעקוף כל מונה ע"י קריאה ישירה ל-endpoint.
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    return NextResponse.json({ error: "Convex URL not configured" }, { status: 500 });
  }

  const token = await convexAuthNextjsToken();
  if (!token) {
    return NextResponse.json(
      { error: "unauthenticated", text: "יש להתחבר כדי לשוחח עם הבוט." },
      { status: 401 }
    );
  }

  const convex = new ConvexHttpClient(convexUrl);
  convex.setAuth(token);

  const quota = await convex.mutation(api.credits.consumeBotQuestion, {});
  if (!quota.ok) {
    const text =
      quota.reason === "exhausted"
        ? "נגמרו לך השאלות לבוט. רכשי חבילת אבחונים כדי לקבל שאלות נוספות."
        : "יש להתחבר כדי לשוחח עם הבוט.";
    return NextResponse.json(
      { error: quota.reason, text, remaining: quota.remaining, total: quota.total },
      { status: quota.reason === "exhausted" ? 402 : 401 }
    );
  }

  try {
    const { messages, hairContext } = (await req.json()) as {
      messages: ChatMessage[];
      hairContext?: string;
    };

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      await convex.mutation(api.credits.refundBotQuestion, {});
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    const client = new Anthropic({ apiKey });

    const systemText = hairContext
      ? `${SYSTEM_PROMPT}\n\n--- נתוני שיער של המשתמשת ---\n${hairContext}`
      : SYSTEM_PROMPT;

    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 1024,
      system: systemText,
      messages,
    });

    const text =
      response.content[0]?.type === "text"
        ? response.content[0].text
        : "מצטערת, לא הצלחתי לעבד את הבקשה. אנא נסי שוב.";

    return NextResponse.json({ text, remaining: quota.remaining, total: quota.total });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Claude API error:", message);
    // התקלה אצלנו — לא הוגן לגבות על כך שאלה
    await convex.mutation(api.credits.refundBotQuestion, {});
    return NextResponse.json({ error: "Internal server error", detail: message }, { status: 500 });
  }
}
