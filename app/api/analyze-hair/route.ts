import Anthropic from "@anthropic-ai/sdk";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { type NextRequest, NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import {
  type CatalogId,
  matchShades,
  parseColorReading,
} from "@/lib/colorCatalogs/match";
import { splitDataUrl } from "@/lib/photo";

// ============================================================================
// ניתוח תמונת שיער → רמה + טון (לא קוד גוון)
// ============================================================================
// המודל מתבקש במפורש להעריך *תיאור צבע* ולא לבחור קוד מהקטלוג. הוא לא רואה
// את הקטלוג בכלל, ולכן לא יכול להמציא קוד שאינו קיים. המיפוי לקודים נעשה
// אחרי כן ב-matchShades(), דטרמיניסטית וניתן לביקורת.
//
// המכסה נגבית לפני הקריאה ל-Anthropic ומוחזרת בכישלון שלנו — אותו מבנה בדיוק
// כמו app/api/chat/route.ts, ומאותה סיבה: כל מונה בצד הלקוח ניתן לעקיפה ע"י
// קריאה ישירה ל-endpoint.

const MODEL = "claude-haiku-4-5";
const MAX_TOKENS = 512;
const CANDIDATE_COUNT = 3;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

const SUPPORTED_MEDIA_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const BASE_INSTRUCTION = `You are a professional hair colorist assessing a photograph.

Return ONLY a JSON object, no prose and no markdown fences:
{"level": <number 1-12>, "temperature": "warm"|"cool"|"neutral", "toneFamily": "natural"|"ash"|"pearl"|"gold"|"beige"|"copper"|"chocolate"|"mahogany"|"red"|"violet", "confidence": "high"|"medium"|"low"}

"level" is the international hair depth scale: 1 black, 2 very dark brown, 3 dark brown,
4 medium brown, 5 light brown, 6 dark blonde, 7 medium blonde, 8 light blonde,
9 very light blonde, 10 lightest blonde, 11-12 ultra/platinum blonde.

Do NOT name a shade code or product. Estimate the colour only.

Set "confidence" honestly and prefer "low" when the photo works against you:
warm indoor or coloured lighting, a heavy filter, overexposure, motion blur,
strong shadow, very little hair visible, or hair whose colour is clearly uneven.
A cautious "low" is far more useful to us than a confident guess.`;

const CURRENT_MODE_INSTRUCTION = `Assess the hair as it is at the MID-LENGTHS — not the roots
(which may be regrowth) and not the ends (which may be faded, dyed differently, or sun-bleached).
This estimate feeds a chemical formula, so err toward caution.`;

const DESIRED_MODE_INSTRUCTION = `This is an inspiration photo: assess the overall hair colour
the person is aiming for. If the photo is heavily styled or filtered, lower the confidence.`;

const JSON_OBJECT = /\{[\s\S]*\}/;

type AnalyzeMode = "current" | "desired";

function extractJson(text: string): unknown {
  const match = text.match(JSON_OBJECT);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

// כשל שהוא שלנו ולא של המשתמשת — מפתח חסר, יתרת API שנגמרה, נפילת רשת.
// 503 ולא 500 כדי שהקליינט יוכל להבדיל בינו לבין תמונה שלא ניתנת לקריאה:
// "נסי שוב" הוא עצה טובה לתמונה מטושטשת ועצה גרועה לשירות שנפל.
function serviceUnavailable(reason: string) {
  console.error("Hair analysis unavailable:", reason);
  return NextResponse.json({ error: "service_unavailable" }, { status: 503 });
}

export async function POST(req: NextRequest) {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    return serviceUnavailable("NEXT_PUBLIC_CONVEX_URL missing");
  }

  const token = await convexAuthNextjsToken();
  if (!token) {
    return NextResponse.json(
      { error: "unauthenticated", text: "יש להתחבר כדי לנתח תמונה." },
      { status: 401 }
    );
  }

  const convex = new ConvexHttpClient(convexUrl);
  convex.setAuth(token);

  // ── ולידציה של הקלט לפני שגובים מכסה ────────────────────────────────────
  // גבייה על בקשה פגומה תגזול מהמשתמשת שאלה בלי סיבה.
  let imageDataUrl: string;
  let mode: AnalyzeMode;
  let catalogId: CatalogId;
  try {
    const body = (await req.json()) as {
      imageDataUrl?: string;
      mode?: AnalyzeMode;
      catalogId?: CatalogId;
    };
    if (!body.imageDataUrl) throw new Error("missing imageDataUrl");
    imageDataUrl = body.imageDataUrl;
    mode = body.mode === "desired" ? "desired" : "current";
    catalogId = body.catalogId === "three" ? "three" : "igora";
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const image = splitDataUrl(imageDataUrl);
  if (!(image && SUPPORTED_MEDIA_TYPES.has(image.mediaType))) {
    return NextResponse.json({ error: "unsupported_image" }, { status: 400 });
  }
  if (image.data.length > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: "image_too_large" }, { status: 413 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return serviceUnavailable("ANTHROPIC_API_KEY missing");
  }

  // ניתוח תמונה חינם עד FREE_PHOTO_ANALYSES, ורק אחר כך גורע שאלת בוט.
  const quota = await convex.mutation(api.credits.consumePhotoAnalysis, {});
  if (!quota.ok) {
    const text =
      quota.reason === "exhausted"
        ? "נגמרו לך הניתוחים החינמיים והשאלות. רכשי חבילת אבחונים כדי להמשיך."
        : "יש להתחבר כדי לנתח תמונה.";
    return NextResponse.json(
      { error: quota.reason, text },
      { status: quota.reason === "exhausted" ? 402 : 401 }
    );
  }

  try {
    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: image.mediaType as "image/jpeg" | "image/png" | "image/webp" | "image/gif",
                data: image.data,
              },
            },
            {
              type: "text",
              text: `${BASE_INSTRUCTION}\n\n${
                mode === "current" ? CURRENT_MODE_INSTRUCTION : DESIRED_MODE_INSTRUCTION
              }`,
            },
          ],
        },
      ],
    });

    const text = response.content[0]?.type === "text" ? response.content[0].text : "";
    const reading = parseColorReading(extractJson(text));

    // פלט לא תקין הוא כישלון שלנו, לא של המשתמשת — מחזירים את הניתוח שנגבה.
    if (!reading) {
      await convex.mutation(api.credits.refundPhotoAnalysis, { source: quota.source });
      return NextResponse.json({ error: "unreadable" }, { status: 422 });
    }

    const candidates = matchShades(reading, catalogId, CANDIDATE_COUNT);

    return NextResponse.json({
      reading,
      candidates,
      source: quota.source,
      freeRemaining: quota.freeRemaining,
      freeTotal: quota.freeTotal,
    });
  } catch (err) {
    // כאן נוחתת גם יתרת Anthropic שנגמרה וגם מפתח פסול — שתיהן תקלות תשתית
    // שלנו, ולא סיבה לבקש מהלקוחה לצלם שוב.
    const message = err instanceof Error ? err.message : String(err);
    await convex.mutation(api.credits.refundPhotoAnalysis, { source: quota.source });
    return serviceUnavailable(message);
  }
}
