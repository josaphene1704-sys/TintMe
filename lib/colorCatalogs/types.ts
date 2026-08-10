// ============================================================================
// טיפוסים לקטלוג גוונים Three/ABA
// ============================================================================
// level/temperature מחושבים פעם אחת בזמן בניית הקטלוג (ראו three.ts) — כי לקודים
// של Three יש פורמט שונה מ-Igora (נקודה במקום מקף, קוררקטורים בלי קוד מספרי),
// ומנוע הנוסחה ב-page3 צריך ערך רמה/טמפרטורה מוכן, לא לפרסר את ה-code בעצמו.

export type ShadeTemperature = "warm" | "cool" | "neutral";

export interface Shade {
  code: string;
  nameHe: string;
  nameAr: string;
  hex: string;
  level: number;
  temperature: ShadeTemperature;
}

export interface ShadeCategory {
  id: string;
  labelHe: string;
  labelAr: string;
  shades: Shade[];
}

export interface ColorCatalog {
  id: string;
  nameHe: string;
  nameAr: string;
  categories: ShadeCategory[];
}
