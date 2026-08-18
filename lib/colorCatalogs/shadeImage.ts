// ============================================================================
// בחירת תמונת swatch לגוון — לפי קוד הגוון
// ============================================================================
// תמונות Igora Royal יושבות ב-public/hair-colors/{code}.png (קודים עם מקף,
// למשל "6-34"). תמונות קטלוג Three יושבות ב-public/hair-colors-three/{code}.jpg
// (צילומי הקטלוג הפיזי שסופקו על ידי המשתמשת — כרגע רק סדרת הטבעיים).
// אין התנגשות בין המרחבים: קודי Igora תמיד מכילים מקף, קודי Three לא.

// קודי Three שיש להם צילום אמיתי בתיקייה public/hair-colors-three
const THREE_IMAGE_CODES = new Set(["1B", "1", "3", "4", "5", "6", "7", "8", "9", "10"]);

export function shadeImageSrc(code: string): string {
  return THREE_IMAGE_CODES.has(code)
    ? `/hair-colors-three/${code}.jpg`
    : `/hair-colors/${code}.png`;
}
