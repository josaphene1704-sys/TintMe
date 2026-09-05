// ============================================================================
// התאמת קריאת צבע מתמונה → גוונים מועמדים מהקטלוג
// ============================================================================
// ההתאמה נעשית על רמה + טמפרטורה + משפחת טון בלבד — **לא על hex**.
// הסיבה מתועדת ב-three.ts:10-18: רוב ערכי ה-hex של קטלוג Three סונתזו מסולם
// הרמות ולא נדגמו מהצילומים, כך שמרחק צבע (delta-E) מולם היה משווה מול ערכים
// מומצאים ומחזיר תוצאה שנשמעת מדויקת אבל חסרת בסיס. רמה וטון, לעומת זאת, הם
// בדיוק מה שקולוריסטית מעריכה בעין — וזו הרזולוציה שאנחנו באמת יכולים לספק.
//
// המודל בצד השרת מחזיר ColorReading בלבד ולא רואה את הקטלוג, כדי שלא יוכל
// להמציא קוד גוון שאינו קיים. המיפוי לקודים קורה כאן, דטרמיניסטית.

import { IGORA_CATALOG, IGORA_SHADES_BY_CODE } from "./igora";
import { THREE_CATALOG, THREE_SHADES_BY_CODE } from "./three";
import type { ColorCatalog, Shade, ShadeTemperature } from "./types";

export type CatalogId = "igora" | "three";

export type ToneFamily =
  | "natural"
  | "ash"
  | "pearl"
  | "gold"
  | "beige"
  | "copper"
  | "chocolate"
  | "mahogany"
  | "red"
  | "violet";

export const TONE_FAMILIES: readonly ToneFamily[] = [
  "natural", "ash", "pearl", "gold", "beige", "copper", "chocolate", "mahogany", "red", "violet",
];

export type Confidence = "high" | "medium" | "low";

/** מה שמודל הראייה מעריך מהתמונה — תיאור צבע, לא קוד גוון. */
export interface ColorReading {
  level: number;
  temperature: ShadeTemperature;
  toneFamily?: ToneFamily;
  confidence: Confidence;
}

export const CATALOGS: Record<CatalogId, ColorCatalog> = {
  igora: IGORA_CATALOG,
  three: THREE_CATALOG,
};

export function allShades(catalogId: CatalogId): Shade[] {
  return CATALOGS[catalogId].categories.flatMap((c) => c.shades);
}

// מאתר גוון לפי קוד בשני הקטלוגים. אין דו-משמעות: קודי Igora תמיד מכילים מקף,
// קודי Three נקודה / שם / ספרות בלבד. Three נבדק ראשון כי הוא Map (O(1)).
export function findShadeByCode(code: string | null | undefined): Shade | null {
  if (!code) return null;
  return THREE_SHADES_BY_CODE.get(code) ?? IGORA_SHADES_BY_CODE.get(code) ?? null;
}

// ─── משפחת טון ────────────────────────────────────────────────────────────────
// כל מותג מפרש את ספרת הטון אחרת (ב-Three "4" = נחושת, ב-Igora "4" = בז'),
// ולכן שתי טבלאות נפרדות. משמש כשובר-שוויון בלבד, אז מספיקה ספרה ראשונה
// של הסיומת + חריגים בודדים שאינם נגזרים ממנה.

const IGORA_TONE_BY_FIRST_DIGIT: Record<string, ToneFamily> = {
  "0": "natural", "1": "ash", "2": "pearl", "3": "gold", "4": "beige",
  "5": "gold", "6": "chocolate", "7": "mahogany", "8": "red", "9": "violet",
};

const IGORA_NAMED_TONE: Record<string, ToneFamily> = {
  "slate-grey": "ash", "grey-lilac": "violet", "dove-grey": "ash", "silver": "ash",
  "L-88": "violet", "L-89": "violet",
};

const THREE_TONE_BY_FIRST_DIGIT: Record<string, ToneFamily> = {
  "0": "natural", "1": "ash", "2": "violet", "3": "gold", "4": "copper",
  "5": "mahogany", "6": "red", "9": "pearl",
};

// סיומות שהספרה הראשונה שלהן מטעה: ב-Three ספרת האפס/שלוש המובילה היא
// עוצמה ולא משפחת טון (4.032 = שוקולד ולא טבעי, 12.01 = אפור ולא טבעי,
// 6.31 = חול/בז' ולא זהב).
const THREE_TONE_OVERRIDES: Record<string, ToneFamily> = {
  "032": "chocolate", "34": "chocolate", "37": "copper", "62": "red", "91": "pearl",
  "01": "ash", "03": "gold", "31": "beige",
};

const THREE_NAMED_TONE: Record<string, ToneFamily> = {
  "1B": "natural", "900": "natural", "901": "ash", "903": "gold", "Booster": "natural",
  "cenere": "ash", "blu": "ash", "argento": "ash", "perla": "pearl",
  "giallo": "gold", "rosso-extra": "red", "biondo-svedese": "beige",
};

export function toneFamilyOf(code: string, catalogId: CatalogId): ToneFamily {
  if (catalogId === "igora") {
    const named = IGORA_NAMED_TONE[code];
    if (named) return named;
    const suffix = code.split("-")[1];
    return (suffix && IGORA_TONE_BY_FIRST_DIGIT[suffix[0]]) || "natural";
  }
  const named = THREE_NAMED_TONE[code];
  if (named) return named;
  const suffix = code.split(".")[1];
  if (!suffix) return "natural";
  return THREE_TONE_OVERRIDES[suffix] ?? THREE_TONE_BY_FIRST_DIGIT[suffix[0]] ?? "natural";
}

// ─── מועמדים ──────────────────────────────────────────────────────────────────
// קוררקטורים ובוסטרים לא מוצעים לעולם: הם לא צבע שאפשר "לזהות על שיער" ולא
// יעד עצמאי — הם מתערבבים לתוך נוסחה. detectNeutralization ב-page3 הוא זה
// שבוחר אותם, לפי הפרש הטמפרטורות בין הגוון הנוכחי ליעד.
const NON_SUGGESTABLE_CODES = new Set([
  "0-99", "0-89", "0-33", "0-22", "0-11", "0-00",
  "cenere", "blu", "rosso-extra", "giallo", "argento", "perla", "Booster",
]);

/** מעבר לפער הזה ברמות אין טעם להציע — זה כבר צבע אחר. */
const MAX_LEVEL_DISTANCE = 2;

const LEVEL_WEIGHT = 10;
const TEMPERATURE_PENALTY = 4;
const TONE_FAMILY_PENALTY = 2;

function scoreShade(shade: Shade, reading: ColorReading, catalogId: CatalogId): number {
  let score = Math.abs(shade.level - reading.level) * LEVEL_WEIGHT;
  if (shade.temperature !== reading.temperature) score += TEMPERATURE_PENALTY;
  if (reading.toneFamily && toneFamilyOf(shade.code, catalogId) !== reading.toneFamily) {
    score += TONE_FAMILY_PENALTY;
  }
  return score;
}

/**
 * מחזיר עד `limit` גוונים מהקטלוג שהכי מתאימים לקריאה — מהטוב לפחות טוב.
 * עלול להחזיר מערך ריק (למשל רמה שאין לה גוונים בקטלוג הנבחר); הקורא חייב
 * לטפל בכך ולהשאיר את הלקוחה עם הבחירה הידנית.
 */
export function matchShades(
  reading: ColorReading,
  catalogId: CatalogId,
  limit = 3
): Shade[] {
  return allShades(catalogId)
    .filter(
      (s) =>
        !NON_SUGGESTABLE_CODES.has(s.code) &&
        Math.abs(s.level - reading.level) <= MAX_LEVEL_DISTANCE
    )
    .map((s) => ({ shade: s, score: scoreShade(s, reading, catalogId) }))
    .sort((a, b) => a.score - b.score || a.shade.level - b.shade.level)
    .slice(0, limit)
    .map((x) => x.shade);
}

// ─── ולידציה של פלט המודל ─────────────────────────────────────────────────────
// המודל מחזיר JSON חופשי; אסור לתת לו לזלוג פנימה בלי בדיקה. מחזיר null אם
// המבנה לא תקין — הקורא מתרגם את זה לכישלון ניתוח ולנפילה חזרה לבחירה ידנית.

const MIN_LEVEL = 1;
const MAX_LEVEL = 12;
const TEMPERATURES: readonly ShadeTemperature[] = ["warm", "cool", "neutral"];
const CONFIDENCES: readonly Confidence[] = ["high", "medium", "low"];

export function parseColorReading(raw: unknown): ColorReading | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;

  const level = typeof r.level === "number" ? r.level : Number.NaN;
  if (!Number.isFinite(level) || level < MIN_LEVEL || level > MAX_LEVEL) return null;

  const temperature = r.temperature as ShadeTemperature;
  if (!TEMPERATURES.includes(temperature)) return null;

  const confidence = r.confidence as Confidence;
  if (!CONFIDENCES.includes(confidence)) return null;

  const toneFamily = TONE_FAMILIES.includes(r.toneFamily as ToneFamily)
    ? (r.toneFamily as ToneFamily)
    : undefined;

  return { level, temperature, toneFamily, confidence };
}
