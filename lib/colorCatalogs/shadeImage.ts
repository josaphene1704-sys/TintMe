// ============================================================================
// בחירת תמונת swatch לגוון — לפי קוד הגוון
// ============================================================================
// תמונות Igora Royal יושבות ב-public/hair-colors/{code}.png (קודים עם מקף,
// למשל "6-34"). תמונות קטלוג Three יושבות ב-public/hair-colors-three/{code}.jpg.
// אין התנגשות בין המרחבים: קודי Igora תמיד מכילים מקף, קודי Three לא.
//
// בעבר הייתה כאן רשימה קשיחה של קודי Three שיש להם צילום. זה נשבר בפועל:
// התיקייה התמלאה בעשרות תמונות שהרשימה לא הכירה, והן נפלו לנתיב של Igora
// והחזירו 404. מכיוון שקטלוג Three ממשיך להתמלא בתמונות, השיוך נגזר עכשיו
// מהקטלוג עצמו — אפשר להוסיף קובץ לתיקייה בלי לגעת בקוד.
//
// קוד Three שעדיין אין לו קובץ יחזיר 404, ומרכיבי התצוגה (ShadeImage /
// ColorChip / ShadeSuggestion) נופלים ב-onError ל-Swatch המדורג. כלומר חוסר
// תמונה מתבטא ב-gradient, לא באייקון שבור.

import { THREE_SHADES_BY_CODE } from "./three";

export function shadeImageSrc(code: string): string {
  return THREE_SHADES_BY_CODE.has(code)
    ? `/hair-colors-three/${code}.jpg`
    : `/hair-colors/${code}.png`;
}
