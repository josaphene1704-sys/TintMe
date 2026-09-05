// ============================================================================
// המרת תמונה שהועלתה ל-data-URL מוקטן
// ============================================================================
// עד כה התמונה נשמרה ב-localStorage כ-URL.createObjectURL(file) — כתובת blob:
// שתקפה רק כל עוד ה-document שיצר אותה חי. אחרי מעבר עמוד ורענון ב-page3
// ה-src היה מת והתמונה פשוט לא הופיעה. data-URL שורד רענון, ובנוסף הוא בדיוק
// הפורמט ש-Anthropic מצפה לו ב-image content block.
//
// ההקטנה ל-768px היא גם בגלל מגבלת ~5MB של localStorage וגם כי מעבר לרזולוציה
// הזו אין שום ערך מוסף לזיהוי רמה/טון — רק tokens ו-latency.

export const MAX_PHOTO_EDGE = 768;
const JPEG_QUALITY = 0.85;

/**
 * קורא קובץ תמונה, מקטין אותו כך שהקצה הארוך לא יעלה על `maxEdge`,
 * ומחזיר data-URL של JPEG.
 * זורק אם הקובץ אינו תמונה תקינה — הקורא אחראי לנפילה־לאחור.
 */
export async function fileToDataUrl(file: File, maxEdge = MAX_PHOTO_EDGE): Promise<string> {
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas 2d context unavailable");

    // רקע לבן: JPEG לא תומך בשקיפות, ובלי זה PNG שקוף יוצא עם רקע שחור
    // ומטה את הערכת הרמה כלפי מטה.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);

    return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  } finally {
    bitmap.close();
  }
}

const DATA_URL = /^data:([^;,]+);base64,(.+)$/;

/** מפריד data-URL ל-media type ול-base64 נקי, כפי ש-Anthropic דורש. */
export function splitDataUrl(dataUrl: string): { mediaType: string; data: string } | null {
  const m = dataUrl.match(DATA_URL);
  return m ? { mediaType: m[1], data: m[2] } : null;
}
