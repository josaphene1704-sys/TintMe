"use client";

import FloatingChatbot from "@/components/FloatingChatbot";
import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation, useQuery } from "convex/react";
import { useConvexAuth } from "convex/react";
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import {
  AlertTriangle,
  ArrowRight,
  BookmarkPlus,
  Calendar,
  CheckCircle2,
  Clock,
  Crown,
  Droplets,
  Flame,
  FlaskConical,
  Layers,
  Leaf,
  MessageCircle,
  Paintbrush,
  Palette,
  RefreshCw,
  Shield,
  ShoppingBag,
  Sparkles,
  Star,
  X,
  Zap,
} from "lucide-react";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Shade catalog ────────────────────────────────────────────────────────────
interface Shade { code: string; nameHe: string; nameAr: string; hex: string }

const ALL_SHADES: Shade[] = [
  { code: "1-0",     nameHe: "שחור טבעי",                    nameAr: "أسود طبيعي",              hex: "#0D0D0D" },
  { code: "3-0",     nameHe: "חום כהה טבעי",                  nameAr: "بني غامق طبيعي",          hex: "#251510" },
  { code: "4-0",     nameHe: "חום בינוני טבעי",               nameAr: "بني متوسط طبيعي",         hex: "#4A2A15" },
  { code: "4-60",    nameHe: "חום שוקולד",                    nameAr: "بني شوكولاتة",            hex: "#6A4A2A" },
  { code: "5-0",     nameHe: "חום בהיר טבעי",                 nameAr: "بني فاتح طبيعي",          hex: "#5A3620" },
  { code: "5-00",    nameHe: "חום בהיר טבעי אינטנסיב",        nameAr: "بني فاتح مكثف",           hex: "#5C3820" },
  { code: "5-1",     nameHe: "חום בהיר אפרפר",                nameAr: "بني فاتح رمادي",          hex: "#4E3C30" },
  { code: "5-13",    nameHe: "חום בהיר אפרפר זהב",            nameAr: "بني فاتح رمادي ذهبي",    hex: "#5A4228" },
  { code: "5-21",    nameHe: "חום בהיר פנינה אפרפר",          nameAr: "بني لؤلؤي رمادي",        hex: "#5A4044" },
  { code: "5-50",    nameHe: "חום בהיר זהב",                  nameAr: "بني فاتح ذهبي",           hex: "#9A7A4A" },
  { code: "5-60",    nameHe: "חום בהיר שוקולד",               nameAr: "بني شوكولاتة فاتح",       hex: "#8A6A4A" },
  { code: "5-80",    nameHe: "חום בהיר אדום",                 nameAr: "بني فاتح أحمر",           hex: "#7A1E1E" },
  { code: "6-0",     nameHe: "בלונד כהה טבעי",                nameAr: "أشقر غامق طبيعي",         hex: "#785832" },
  { code: "6-00",    nameHe: "בלונד כהה טבעי אינטנסיב",       nameAr: "أشقر غامق مكثف",          hex: "#7A5A30" },
  { code: "6-1",     nameHe: "בלונד כהה אפרפר",               nameAr: "أشقر غامق رمادي",         hex: "#6A5848" },
  { code: "6-12",    nameHe: "בלונד כהה אפרפר פנינה",         nameAr: "أشقر غامق لؤلؤي",        hex: "#6A5C5C" },
  { code: "6-50",    nameHe: "בלונד כהה זהב",                 nameAr: "أشقر غامق ذهبي",          hex: "#A88A4A" },
  { code: "6-70",    nameHe: "בלונד כהה מהוגני",              nameAr: "أشقر غامق ماهوجني",       hex: "#7A3A2A" },
  { code: "6-80",    nameHe: "בלונד כהה אדום",                nameAr: "أشقر غامق أحمر",          hex: "#7A2A2A" },
  { code: "7-0",     nameHe: "בלונד בינוני טבעי",             nameAr: "أشقر وسط طبيعي",          hex: "#987840" },
  { code: "7-00",    nameHe: "בלונד בינוני טבעי אינטנסיב",    nameAr: "أشقر وسط مكثف",           hex: "#9A7A3A" },
  { code: "7-1",     nameHe: "בלונד בינוני אפרפר",            nameAr: "أشقر وسط رمادي",          hex: "#887868" },
  { code: "7-21",    nameHe: "בלונד בינוני פנינה אפרפר",      nameAr: "أشقر وسط لؤلؤي",         hex: "#908080" },
  { code: "7-24",    nameHe: "בלונד בינוני פנינה בז'",        nameAr: "أشقر وسط لؤلؤي بيج",     hex: "#9A8870" },
  { code: "7-50",    nameHe: "בלונד בינוני זהב",              nameAr: "أشقر وسط ذهبي",           hex: "#C0A05A" },
  { code: "7-60",    nameHe: "בלונד בינוני שוקולד",           nameAr: "أشقر وسط شوكولاتة",       hex: "#A0704A" },
  { code: "7-70",    nameHe: "בלונד בינוני מהוגני",           nameAr: "أشقر وسط ماهوجني",        hex: "#8A4A3A" },
  { code: "7-710",   nameHe: "בלונד בינוני מהוגני טבעי",      nameAr: "أشقر وسط ماهوجني طبيعي",  hex: "#8A5A4A" },
  { code: "8-0",     nameHe: "בלונד בהיר טבעי",               nameAr: "أشقر فاتح طبيعي",         hex: "#BEA062" },
  { code: "8-00",    nameHe: "בלונד בהיר טבעי אינטנסיב",      nameAr: "أشقر فاتح مكثف",          hex: "#C0A060" },
  { code: "8-1",     nameHe: "בלונד בהיר אפרפר",              nameAr: "أشقر فاتح رمادي",         hex: "#A89888" },
  { code: "8-11",    nameHe: "בלונד בהיר אפרפר כפול",         nameAr: "أشقر فاتح رمادي مضاعف",  hex: "#A09898" },
  { code: "8-19",    nameHe: "בלונד בהיר אפרפר סגול",         nameAr: "أشقر فاتح رمادي بنفسجي", hex: "#9090A8" },
  { code: "8-21",    nameHe: "בלונד בהיר פנינה אפרפר",        nameAr: "أشقر فاتح لؤلؤي",         hex: "#B8AAAA" },
  { code: "8-50",    nameHe: "בלונד בהיר זהב",                nameAr: "أشقر فاتح ذهبي",          hex: "#D2B46A" },
  { code: "8-60",    nameHe: "בלונד בהיר שוקולד",             nameAr: "أشقر فاتح شوكولاتة",      hex: "#B88A5A" },
  { code: "9-0",     nameHe: "בלונד בהיר מאוד טבעי",          nameAr: "أشقر فاتح جداً",          hex: "#D2B668" },
  { code: "9-00",    nameHe: "בלונד בהיר מאוד אינטנסיב",      nameAr: "أشقر فاتح جداً مكثف",     hex: "#D4B870" },
  { code: "9-1",     nameHe: "בלונד בהיר מאוד אפרפר",         nameAr: "أشقر فاتح جداً رمادي",    hex: "#C0B0A0" },
  { code: "9-24",    nameHe: "בלונד בהיר מאוד פנינה בז'",     nameAr: "أشقر فاتح جداً لؤلؤي",    hex: "#CCBAA8" },
  { code: "9-50",    nameHe: "בלונד בהיר מאוד זהב",           nameAr: "أشقر فاتح جداً ذهبي",     hex: "#E5C46A" },
  { code: "9-60",    nameHe: "בלונד בהיר מאוד שוקולד",        nameAr: "أشقر فاتح جداً شوكولاتة",  hex: "#C89A6A" },
  { code: "9.5-1",   nameHe: "פסטל אפרפר",                    nameAr: "باستيل رمادي",            hex: "#D8D0C8" },
  { code: "9.5-22",  nameHe: "פסטל פנינה",                    nameAr: "باستيل لؤلؤي",            hex: "#D8D0E8" },
  { code: "9.5-31",  nameHe: "פסטל בז' זהב",                  nameAr: "باستيل بيج ذهبي",         hex: "#E0C8A8" },
  { code: "9.5-4",   nameHe: "פסטל בז'",                      nameAr: "باستيل بيج",              hex: "#E6D2B8" },
  { code: "9.5-49",  nameHe: "פסטל בז' נחושת",                nameAr: "باستيل بيج نحاسي",        hex: "#D8B48A" },
  { code: "10-0",    nameHe: "בלונד טבעי",                    nameAr: "أشقر طبيعي",              hex: "#F0E8D8" },
  { code: "10-1",    nameHe: "בלונד אפרפר",                   nameAr: "أشقر رمادي",               hex: "#E0D8C8" },
  { code: "10-4",    nameHe: "בלונד בז'",                     nameAr: "أشقر بيج",                hex: "#E8D2B8" },
  { code: "10-14",   nameHe: "בלונד אפרפר בז'",               nameAr: "أشقر رمادي بيج",          hex: "#E4D4C4" },
  { code: "10-21",   nameHe: "בלונד פנינה אפרפר",             nameAr: "أشقر لؤلؤي رمادي",        hex: "#E6D8CC" },
  { code: "10-46",   nameHe: "בלונד בז' נחושת",               nameAr: "أشقر بيج نحاسي",          hex: "#E0B88A" },
  { code: "12-0",    nameHe: "אולטרה בלונד טבעי",             nameAr: "أشقر فائق طبيعي",         hex: "#F4ECDC" },
  { code: "12-1",    nameHe: "אולטרה בלונד אפרפר",            nameAr: "أشقر فائق رمادي",         hex: "#E8E0D0" },
  { code: "12-2",    nameHe: "אולטרה בלונד פנינה",            nameAr: "أشقر فائق لؤلؤي",         hex: "#E8DCE8" },
  { code: "12-4",    nameHe: "אולטרה בלונד בז'",              nameAr: "أشقر فائق بيج",           hex: "#EAD8C4" },
  { code: "12-11",   nameHe: "אולטרה בלונד אפרפר כפול",       nameAr: "أشقر فائق رمادي مضاعف",   hex: "#E0D8C8" },
  { code: "12-19",   nameHe: "אולטרה בלונד אפרפר סגול",       nameAr: "أشقر فائق رمادي بنفسجي",  hex: "#D8C8D8" },
  { code: "slate-grey", nameHe: "אפור כהה",                   nameAr: "رمادي داكن",              hex: "#7A7A7A" },
  { code: "grey-lilac", nameHe: "אפור לילך",                  nameAr: "رمادي ليلكي",             hex: "#8A7A8A" },
  { code: "dove-grey",  nameHe: "אפור יונה",                  nameAr: "رمادي حمامة",             hex: "#B0B0B0" },
  { code: "silver",     nameHe: "סילבר",                      nameAr: "فضي",                     hex: "#C8C8C8" },
  { code: "0-99",    nameHe: "בוסטר סגול",                    nameAr: "معزز بنفسجي",             hex: "#6A2A8A" },
  { code: "L-89",    nameHe: "אופנה אדום-סגול",               nameAr: "موضة أحمر-بنفسجي",        hex: "#8A2A5A" },
  { code: "0-89",    nameHe: "בוסטר אדום-סגול",               nameAr: "معزز أحمر-بنفسجي",        hex: "#8A2A5A" },
  { code: "0-33",    nameHe: "נייטרלייזר זהב",                nameAr: "محيد ذهبي",                hex: "#C8A84A" },
  { code: "L-88",    nameHe: "אופנה סגול",                    nameAr: "موضة بنفسجي",             hex: "#7A2A8A" },
  { code: "0-22",    nameHe: "נייטרלייזר פנינה",              nameAr: "محيد لؤلؤي",               hex: "#C0C0D8" },
  { code: "0-11",    nameHe: "נייטרלייזר אפרפר",              nameAr: "محيد رمادي",               hex: "#A0A0A0" },
  { code: "0-00",    nameHe: "מחזק נייטרל",                   nameAr: "معزز محايد",               hex: "#D8D8D0" },
];

// ─── Process steps (bilingual, icon-keyed – outside translation dict) ─────────
type StepIconKey = "flask" | "brush" | "flame" | "layers" | "leaf" | "clock" | "droplets" | "alert" | "sparkles" | "calendar" | "shield" | "zap";

interface ProcessStep {
  icon: StepIconKey;
  titleHe: string;
  titleAr: string;
  descHe: string;
  descAr: string;
}

const PROCESS_STEPS: Record<string, ProcessStep[]> = {
  natural: [
    {
      icon: "flask",
      titleHe: "ערבבי בקערה לא מתכתית",
      titleAr: "اخلطي في وعاء غير معدني",
      descHe: "ערבבי את שפופרת הצבע עם קרם החמצן לפי יחס 1:1 עד לקבלת תערובת אחידה וחלקה.",
      descAr: "اخلطي أنبوب اللون مع كريم الأكسجين بنسبة 1:1 حتى تحصلي على خليط متجانس وناعم.",
    },
    {
      icon: "layers",
      titleHe: "התחילי מהשורשים",
      titleAr: "ابدئي من الجذور",
      descHe: "מרחי את התערובת על שורשי השיער תחילה בסמוך לקרקפת, תוך חלוקה לסעיפים ברורים.",
      descAr: "ضعي الخليط على جذور الشعر أولاً بالقرب من فروة الرأس، مع تقسيم الشعر إلى أقسام واضحة.",
    },
    {
      icon: "leaf",
      titleHe: "פרשי על כל אורך השיער",
      titleAr: "وزّعي على كامل طول الشعر",
      descHe: "הרחיבי את מריחת הצבע לאורכי השיער ועד הקצוות, והבטיחי כיסוי אחיד ומלא.",
      descAr: "وسّعي تطبيق اللون على طول الشعر حتى الأطراف، وتأكدي من تغطية كاملة ومتساوية.",
    },
    {
      icon: "clock",
      titleHe: "המתיני 35–45 דקות",
      titleAr: "انتظري 35–45 دقيقة",
      descHe: "השאירי את הצבע לפעול בטמפרטורת חדר, ללא חום מלאכותי. בדקי את עוצמת הגוון לאחר 35 דקות.",
      descAr: "اتركي اللون يعمل في درجة حرارة الغرفة، بدون حرارة اصطناعية. تحققي من شدة اللون بعد 35 دقيقة.",
    },
    {
      icon: "droplets",
      titleHe: "שטפי היטב ועשי מרכך",
      titleAr: "اشطفي جيداً وضعي بلسماً",
      descHe: "שטפי עם מים פושרים עד שהמים יוצאים צלולים. מרחי מרכך מזין לאיטום הצבע ולהגנה על השיער.",
      descAr: "اشطفي بالماء الدافئ حتى يخرج الماء صافياً. ضعي بلسماً مغذياً لإغلاق اللون وحماية الشعر.",
    },
  ],

  normal: [
    {
      icon: "flask",
      titleHe: "ערבבי לפי הנוסחה שנקבעה",
      titleAr: "اخلطي وفق التركيبة المحددة",
      descHe: "ערבבי את גוון היעד (ואם נדרש – גם בסיס טבעי) עם קרם החמצן ביחס 1:1 בקערת פלסטיק.",
      descAr: "اخلطي درجة الهدف (وإذا لزم – القاعدة الطبيعية أيضاً) مع كريم الأكسجين بنسبة 1:1 في وعاء بلاستيكي.",
    },
    {
      icon: "layers",
      titleHe: "שורשים תחילה – גדילה חדשה",
      titleAr: "الجذور أولاً – النمو الجديد",
      descHe: "מרחי את הצבע על האזורים החדשים של הגדילה (השורשים) בלבד. המתיני 20–30 דקות.",
      descAr: "ضعي اللون على مناطق النمو الجديد (الجذور) فقط. انتظري 20–30 دقيقة.",
    },
    {
      icon: "brush",
      titleHe: "10–15 דקות לפני הסיום – פרשי לאורכים",
      titleAr: "10–15 دقيقة قبل النهاية – وزّعي على الأطراف",
      descHe: "בשלב זה בלבד פרשי את הצבע על אורכי השיער לרענון הגוון. אל תשאירי יותר מ-15 דקות על הקצוות.",
      descAr: "في هذه المرحلة فقط، وزّعي اللون على طول الشعر لتجديد اللون. لا تتركي أكثر من 15 دقيقة على الأطراف.",
    },
    {
      icon: "clock",
      titleHe: "סה״כ 35–45 דקות",
      titleAr: "إجمالاً 35–45 دقيقة",
      descHe: "זמן עיבוד שורשים מלא + 10–15 דקות לרענון האורכים. סה״כ לא יעלה על 45 דקות.",
      descAr: "وقت معالجة الجذور الكامل + 10–15 دقيقة لتجديد الأطراف. الإجمالي لا يتجاوز 45 دقيقة.",
    },
    {
      icon: "droplets",
      titleHe: "שטפי ועשי טיפול מרכך",
      titleAr: "اشطفي وضعي بلسماً مغذياً",
      descHe: "שטפי היטב במים פושרים ועשי מרכך מיוחד לשיער צבוע לאיטום הגוון ולשמירת הברק.",
      descAr: "اشطفي جيداً بالماء الدافئ وضعي بلسماً خاصاً للشعر المصبوغ لإغلاق اللون والحفاظ على اللمعان.",
    },
  ],

  damaged: [
    {
      icon: "flask",
      titleHe: "ערבבי עם חמצן נמוך (3%–6%)",
      titleAr: "اخلطي بأكسجين منخفض (3%–6%)",
      descHe: "על שיער פגוע, השתמשי בחמצן 3% על האורכים ו-6% על השורשים בלבד. ערבבי ביחס 1:1.",
      descAr: "على الشعر التالف، استخدمي أكسجين 3% على الأطراف و6% على الجذور فقط. اخلطي بنسبة 1:1.",
    },
    {
      icon: "brush",
      titleHe: "יישמי בעדינות מרבית",
      titleAr: "طبّقي بلطف شديد",
      descHe: "מרחי את הצבע בתנועות עדינות ורכות. אין ללחוץ, לשפשף, או לגרד את השיער הפגוע.",
      descAr: "ضعي اللون بحركات ناعمة ولطيفة. لا تضغطي أو تفركي أو تحكّي الشعر التالف.",
    },
    {
      icon: "layers",
      titleHe: "שורשים לפני האורכים",
      titleAr: "الجذور قبل الأطراف",
      descHe: "מרחי על השורשים ב-6%, המתיני 15–20 דקות, ואז הרחיבי לאורכים עם 3% בלבד.",
      descAr: "ضعي على الجذور بـ6%، انتظري 15–20 دقيقة، ثم وسّعي الأطراف بـ3% فقط.",
    },
    {
      icon: "clock",
      titleHe: "25–35 דקות בלבד – לא יותר!",
      titleAr: "25–35 دقيقة فقط – لا أكثر!",
      descHe: "שיער פגוע רגיש לאחיזת צבע מהירה. עקבי בדיקדוק אחר הזמן ואל תחרגי מ-35 דקות.",
      descAr: "الشعر التالف حساس ويمتص اللون بسرعة. تابعي الوقت بدقة ولا تتجاوزي 35 دقيقة.",
    },
    {
      icon: "shield",
      titleHe: "טיפול שיקומי חובה לאחר הצביעה",
      titleAr: "علاج تأهيلي إلزامي بعد التلوين",
      descHe: "מסיכת חלבון, קרטין, או אמפולת שיקום בתוך 48 שעות. הימני מחום, מגיהוץ וסלסלה ל-72 שעות.",
      descAr: "ماسك بروتين أو كيراتين أو أمبولة إصلاح خلال 48 ساعة. تجنبي الحرارة والمكواة والجعد لمدة 72 ساعة.",
    },
  ],

  recent_bleach: [
    {
      icon: "alert",
      titleHe: "צביעה קבועה – אסורה כרגע",
      titleAr: "التلوين الدائم – محظور الآن",
      descHe: "אין להשתמש בצבע קבוע עם חמצן גבוה על שיער שעבר הבהרה בפחות מ-6 חודשים. הסיכון: שבירה ונשירה.",
      descAr: "لا تستخدمي لوناً دائماً بأكسجين عالٍ على شعر تم تفتيحه منذ أقل من 6 أشهر. الخطر: الكسر والتساقط.",
    },
    {
      icon: "sparkles",
      titleHe: "טונר בלבד – הפתרון הנכון",
      titleAr: "تونر فقط – الحل الصحيح",
      descHe: "השתמשי בטונר עם חמצן 1.9% עד 3% בלבד. הטונר מאזן את הגוון מבלי לפגוע במבנה השיער.",
      descAr: "استخدمي تونر بأكسجين 1.9% حتى 3% فقط. التونر يوازن اللون دون الإضرار ببنية الشعر.",
    },
    {
      icon: "clock",
      titleHe: "20–25 דקות – לא יותר",
      titleAr: "20–25 دقيقة – لا أكثر",
      descHe: "המתיני בדיוק לפי הוראות הטונר הספציפי שבחרת. בדקי את הגוון כל 5 דקות.",
      descAr: "انتظري بدقة وفق تعليمات التونر المحدد الذي اخترتِه. تحققي من اللون كل 5 دقائق.",
    },
    {
      icon: "droplets",
      titleHe: "שטפי בעדינות במים קרים",
      titleAr: "اشطفي بلطف بماء بارد",
      descHe: "מים קרים עדיפים לאחר טונר – הם עוזרים לאטום הקשקשים ולשמירת הגוון לאורך זמן.",
      descAr: "الماء البارد أفضل بعد التونر – يساعد في إغلاق قشور الشعر والحفاظ على اللون لفترة أطول.",
    },
    {
      icon: "calendar",
      titleHe: "המתיני 3–6 חודשים לצביעה קבועה",
      titleAr: "انتظري 3–6 أشهر للتلوين الدائم",
      descHe: "תני לשיער להתחזק ולהתאושש לפני תהליך צביעה עם חמצן גבוה. הסבלנות תשמור על שלמות השיער.",
      descAr: "اتركي الشعر يتقوى ويتعافى قبل عملية تلوين بأكسجين عالٍ. الصبر سيحافظ على سلامة شعرك.",
    },
  ],

  high_lift: [
    {
      icon: "flask",
      titleHe: "הכנה: ערבבי ביחס 1:2 בקערה לא מתכתית",
      titleAr: "التحضير: اخلطي بنسبة 1:2 في وعاء غير معدني",
      descHe: "ערבבי 40 גרם אבקת הבהרה עם 80 גרם קרם חמצן {DEV_PCT}% (כמות חמצן כפולה!) עד לקבלת תערובת אחידה. אל תשתמשי בכלי מתכת.",
      descAr: "اخلطي 40 غراماً من مسحوق التفتيح مع 80 غراماً من كريم الأكسجين {DEV_PCT}% (ضعف كمية الأكسجين!) حتى تحصلي على خليط متجانس. لا تستخدمي أواني معدنية.",
    },
    {
      icon: "brush",
      titleHe: "מריחה: אורכים וקצוות תחילה",
      titleAr: "التطبيق: الأطراف أولاً",
      descHe: "מרחי את התערובת בצורה נדיבה על אורכי השיער והקצוות תחילה, במרחק של 2 ס\"מ מהקרקפת. המתיני 15–20 דקות.",
      descAr: "ضعي الخليط بسخاء على أطراف الشعر وأطوله أولاً، على بُعد 2 سم من فروة الرأس. انتظري 15–20 دقيقة.",
    },
    {
      icon: "flame",
      titleHe: "שורשים: חום הקרקפת מאיץ את ההבהרה",
      titleAr: "الجذور: حرارة فروة الرأس تسرّع التفتيح",
      descHe: "מרחי את שארית התערובת על שורשי השיער. חום הגוף הטבעי מסייע להבהיר את אזור הגדילה החדשה מהר יותר.",
      descAr: "ضعي بقية الخليط على جذور الشعر. حرارة الجسم الطبيعية تساعد على تفتيح منطقة النمو الجديد بشكل أسرع.",
    },
    {
      icon: "clock",
      titleHe: "סה״כ 45–50 דקות מרגע מריחת השורשים",
      titleAr: "إجمالاً 45–50 دقيقة من لحظة تطبيق الجذور",
      descHe: "בדקי את עוצמת ההבהרה כל 10 דקות. אל תחרגי מ-50 דקות סה״כ – הבהרה יתר עלולה לפגוע בשיער.",
      descAr: "تحققي من شدة التفتيح كل 10 دقائق. لا تتجاوزي 50 دقيقة إجمالاً – التفتيح الزائد قد يضر بالشعر.",
    },
    {
      icon: "droplets",
      titleHe: "שטפי היטב ויבשי במגבת",
      titleAr: "اشطفي جيداً وجففي بالمنشفة",
      descHe: "שטפי את השיער במים פושרים בלבד עד שהמים יוצאים צלולים לחלוטין. ייבשי בעדינות במגבת ללא שפשוף – השיער צריך להיות לח אך לא טפטוף.",
      descAr: "اشطفي الشعر بالماء الفاتر فقط حتى يخرج الماء صافياً تماماً. جففي بلطف بالمنشفة بدون فرك – يجب أن يكون الشعر رطباً وليس مبللاً.",
    },
    {
      icon: "sparkles",
      titleHe: "מריחת גוון יעד + נטרול צהוב / כתום",
      titleAr: "تطبيق لون الهدف + تعادل الأصفر / البرتقالي",
      descHe: "ערבבי את גוון היעד עם גוון מתקן (כגון 0-11 אפרפר / 0-22 פנינה) ביחס 1:1 עם חמצן 1.9%–3%. מרחי על השיער הלח ל-15 דקות בדיוק לנטרול גוונים צהובים וכתומים.",
      descAr: "اخلطي لون الهدف مع محيد اللون (مثل 0-11 رمادي / 0-22 لؤلؤي) بنسبة 1:1 مع أكسجين 1.9%–3%. ضعي على الشعر الرطب لمدة 15 دقيقة بالضبط لتعادل النبرات الصفراء والبرتقالية.",
    },
    {
      icon: "shield",
      titleHe: "שטיפה וטיפול גמר לפי גוון היעד",
      titleAr: "الشطف والعلاج النهائي حسب لون الهدف",
      descHe: "שטפי היטב במים קרים. לגוונים אפורים / כסופים: חפיפה עם שמפו כספי ומסיכת סילבר. לגוונים בלונד: חפיפה עם שמפו ומסיכת קרטין לברק ולחות מיטביים.",
      descAr: "اشطفي جيداً بالماء البارد. للدرجات الرمادية / الفضية: غسل بشامبو فضي وماسك سيلفر. لدرجات الأشقر: غسل بشامبو وماسك كيراتين لأقصى لمعان ورطوبة.",
    },
  ],
};

// ─── Translations ─────────────────────────────────────────────────────────────
const T = {
  he: {
    font: "var(--font-rubik), Arial, sans-serif",
    switchLabel: "العربية",
    backBtn: "אבחון חדש",
    savedFormulaBanner: "זוהי הנוסחה האחרונה שמורה שלך",
    savedFormulaOrder: "הזמיני מצרכים עכשיו",
    resultsBadge: "הנוסחה שלך מוכנה",
    heroTitle: "הנוסחה המותאמת עבורך",
    heroSub: "מבוססת על אבחון מקצועי של שיערך",
    previewTitle: "תוצאת האבחון שלך",
    currentHairLabel: "שיער נוכחי",
    desiredShadeLabel: "גוון יעד",
    noPhoto: "לא הועלתה תמונה",
    // Formula block
    formulaTitle: "הנוסחה המותאמת עבורך",
    formulaSub: "ערבבי בדיוק לפי היחסים הבאים:",
    formulaSubHighLift: "תהליך הבהרה – קראי את כל השלבים בקפידה!",
    colorComponents: "רכיבי הצבע",
    developerComponent: "קרם חמצן",
    primary: "גוון יעד",
    base: "בסיס טבעי",
    grams: "גרם",
    developerLabel: "חמצן מומלץ",
    ratioLabel: "יחס ערבוב",
    totalLabel: "סה״כ תערובת",
    ratioStandard: "1:1 – כמות שווה",
    ratioHighLift: "1:2 – חמצן כפול!",
    developerNote3: "טונר בלבד – שיער מולבן לאחרונה",
    developerNote6: "כיסוי / רמה זהה / הבהרה עדינה עד 2 רמות",
    developerNote9: "הבהרה על שיער צבוע – אסור 12% על שיער צבוע",
    developerNote12: "הבהרה של 3+ רמות – שיער טבעי ובריא בלבד",
    highLiftAlert: "⚠️ יחס 1:2 – כמות החמצן כפולה מאבקת ההבהרה. חובה להשתמש בחמצן {DEV_PCT}% בלבד.",
    lengthBadgeLong: "הכמויות הוכפלו אוטומטית לשיער ארוך",
    lengthBadgeShort: "הכמויות מותאמות לשיער קצר / בינוני",
    bleachingComponent: "חומר הבהרה – שלב 1",
    bleachingPowder: "אבקת הבהרה",
    phase1Label: "שלב 1 – הבהרה",
    phase2Label: "שלב 2 – גוון יעד (טינטינג)",
    rinseLabel: "שטפי היטב לפני שלב 2",
    tonerLabel: "גוון יעד (טונר)",
    phase2Desc: "לאחר שטיפה מלאה ויבוש: ערבבי את גוון היעד עם קרם חמצן 1.9%–3% ויישמי למשך 20–25 דקות.",
    // Process
    processTitle: "תהליך העבודה",
    processSub: "הוראות שלב-אחר-שלב מותאמות לשיערך",
    processSubHighLift: "תהליך הבהרה High-Lift – הוראות מדויקות",
    processTime: "זמן עיבוד",
    processTimeUnit: "דקות",
    // Warnings
    warningDamaged: "שיער פגום זוהה – הפחיתי חמצן על האורכים ועשי טיפול מזין לפני הצביעה.",
    warningBleach: "שיער מולבן לאחרונה – אין להשתמש בצבע קבוע. השתמשי בטונר עם חמצן נמוך (1.9%–3%) בלבד.",
    warningLift12: "נדרשת הבהרה של 3+ רמות – תהליך High-Lift עם חמצן 12%. מיועד לשיער טבעי ובריא בלבד.",
    warningLift9: "נדרשת הבהרה של 3+ רמות על שיער צבוע – תהליך High-Lift עם חמצן 9% בלבד. אסור להשתמש ב-12% על שיער צבוע!",
    warningTitle: "שים לב – אזהרה מקצועית",
    specialShadeTitle: "גוון מיוחד – נדרש שיער מוסבן",
    specialShadeSilver: "סדרת סילבר",
    specialShadeFashion: "סדרת אופנה",
    specialShadeBooster: "בוסטר / נטרלייזר",
    specialShadeBody: "גוונים אלו מיועדים לשיער שהוסב לרמה 10–12 בלבד. על שיער כהה נדרשות מספר הבהרות לפני הוספת הגוון הסופי.",
    // Tips
    tipsTitle: "טיפים מהמומחים",
    tipsList: {
      natural: [
        "שיערך טבעי – מגיב מצוין לצבע, תוצאה עשירה ואחידה",
        "הוסיפי כמה טיפות שמן ארגן לתערובת לברק נוסף",
        "מרחי וזלין על קצוות האוזניים כדי למנוע כתמים",
      ],
      normal: [
        "שיערך עבר צביעות קודמות – הגני על האורכים עם חמצן נמוך יותר",
        "אל תפרשי על האורכים עד 10–15 דק' לפני הסיום כדי לא לשרוף",
        "שמפו ייעודי לצבע (sulfate-free) יאריך את חיי הצבע",
      ],
      damaged: [
        "שיערך פגיע – עדיפי חמצן 3% על האורכים, 6% על השורשים",
        "מרכך עמוק 48 שעות לאחר הצביעה – חובה",
        "הימני מגיהוץ וסלסלה ב-72 שעות הראשונות",
      ],
      high_lift: [
        "תהליך High-Lift מיועד לשיער טבעי בלבד – אין לבצע על שיער שעבר צביעה קודמת",
        "השתמשי תמיד בקערת פלסטיק – כלי מתכת עלולים להשפיע על תגובת החמצן",
        "לאחר ההבהרה, עשי טיפול חלבון לחיזוק מבנה השיער בתוך 48 שעות",
      ],
    },
    // CTA
    saveTitle: "שמרי את הנוסחה שלך",
    saveSub: "פתחי פרופיל אישי ושמרי את כל הנוסחאות שלך לתמיד",
    saveBtn: "שמרי את הנוסחה לפרופיל האישי שלך",
    saveBtnSub: "הצטרפי בחינם – ניסיון 7 ימים ללא עלות",
    whatsappBtn: "ייעוץ אישי בוואטסאפ",
    restartBtn: "אבחון חדש",
    premiumBadge: "✦ פרימיום",
    upsellPoints: [
      "שמירת כל הנוסחאות שלך",
      "היסטוריית צביעות מלאה",
      "תזכורות חכמות למועד צביעה הבא",
      "הנחות בלעדיות על מוצרי צבע",
    ],
    // Save-flow states
    savingAuthLabel: "מתחברת באמצעות Google ושומרת את הנוסחה...",
    savingFormulaLabel: "שומרת את הנוסחה שלך...",
    savedTitle: "הנוסחה נשמרה!",
    savedSub: "הנוסחה שלך נשמרה בהצלחה לפרופיל האישי שלך.",
    savedAction: "צפי בפרופיל שלי",
    savedContinue: "המשיכי לחקור",
    saveErrorLabel: "אירעה שגיאה. אנא נסי שוב.",
    saveRetry: "נסי שוב",
    alreadySignedIn: "הנוסחה תישמר מיד...",
    // Shopping list
    shoppingTitle: "רשימת קניות",
    shoppingSubtitle: "סמני את המוצרים שתרצי להזמין ושלחי ישירות לוואטסאפ",
    shoppingBtn: "שלחי הזמנה ב-WhatsApp",
    shoppingNoneSelected: "סמני לפחות מוצר אחד",
    shoppingSelectAll: "סמני הכל",
    shoppingClearAll: "נקי הכל",
    shoppingGrams: "גרם",
    lamisCta: "מחפשת מוצרים מקצועיים לשיער?",
    lamisBtn: "כנסי לחנות Lamis Cosmetics וגלי את כל המוצרים המקצועיים ←",
  },
  ar: {
    font: "var(--font-cairo), Arial, sans-serif",
    switchLabel: "עברית",
    backBtn: "تشخيص جديد",
    savedFormulaBanner: "هذه هي تركيبتكِ الأخيرة المحفوظة",
    savedFormulaOrder: "اطلبي المنتجات الآن",
    resultsBadge: "تركيبتكِ جاهزة",
    heroTitle: "التركيبة المخصصة لكِ",
    heroSub: "مبنية على تشخيص احترافي لشعركِ",
    previewTitle: "نتيجة تشخيصكِ",
    currentHairLabel: "الشعر الحالي",
    desiredShadeLabel: "الدرجة المستهدفة",
    noPhoto: "لم يتم رفع صورة",
    formulaTitle: "التركيبة المخصصة لكِ",
    formulaSub: "اخلطي بدقة وفق النسب التالية:",
    formulaSubHighLift: "عملية تفتيح – اقرئي جميع الخطوات بعناية!",
    colorComponents: "مكونات اللون",
    developerComponent: "كريم الأكسجين",
    primary: "لون الهدف",
    base: "قاعدة طبيعية",
    grams: "غرام",
    developerLabel: "الأكسجين الموصى به",
    ratioLabel: "نسبة الخلط",
    totalLabel: "إجمالي الخليط",
    ratioStandard: "1:1 – كمية متساوية",
    ratioHighLift: "1:2 – أكسجين مضاعف!",
    developerNote3: "تونر فقط – شعر مفتح حديثاً",
    developerNote6: "تغطية / نفس المستوى / تفتيح خفيف حتى مستويين",
    developerNote9: "تفتيح على شعر مصبوغ – يُمنع 12% على الشعر المصبوغ",
    developerNote12: "تفتيح 3+ مستويات – للشعر الطبيعي والصحي فقط",
    highLiftAlert: "⚠️ نسبة 1:2 – كمية الأكسجين ضعف مسحوق التفتيح. يجب استخدام أكسجين {DEV_PCT}% فقط.",
    lengthBadgeLong: "تم مضاعفة الكميات تلقائياً للشعر الطويل",
    lengthBadgeShort: "الكميات مناسبة للشعر القصير / المتوسط",
    bleachingComponent: "مكون التفتيح – المرحلة 1",
    bleachingPowder: "مسحوق التفتيح",
    phase1Label: "المرحلة 1 – التفتيح",
    phase2Label: "المرحلة 2 – لون الهدف (تونر)",
    rinseLabel: "اشطفي جيداً قبل المرحلة 2",
    tonerLabel: "لون الهدف (تونر)",
    phase2Desc: "بعد الشطف الكامل والتجفيف: اخلطي درجة اللون مع أكسجين 1.9%–3% وطبّقي لمدة 20–25 دقيقة.",
    processTitle: "خطوات العمل",
    processSub: "تعليمات خطوة بخطوة مخصصة لشعركِ",
    processSubHighLift: "عملية تفتيح High-Lift – تعليمات دقيقة",
    processTime: "وقت المعالجة",
    processTimeUnit: "دقيقة",
    warningDamaged: "تم الكشف عن شعر تالف – قللي الأكسجين على الأطراف وضعي علاجاً مغذياً قبل التلوين.",
    warningBleach: "شعر مفتح حديثاً – لا تستخدمي لوناً دائماً. استخدمي تونر بأكسجين منخفض (1.9%–3%) فقط.",
    warningLift12: "مطلوب تفتيح 3+ مستويات – عملية High-Lift بأكسجين 12%. مخصصة للشعر الطبيعي والصحي فقط.",
    warningLift9: "مطلوب تفتيح 3+ مستويات على شعر مصبوغ – عملية High-Lift بأكسجين 9% فقط. يُمنع استخدام 12% على الشعر المصبوغ!",
    warningTitle: "انتبهي – تحذير مهني",
    specialShadeTitle: "درجة خاصة – يتطلب شعراً مفتحاً",
    specialShadeSilver: "سلسلة سيلفر",
    specialShadeFashion: "سلسلة أزياء",
    specialShadeBooster: "معزز / محيد",
    specialShadeBody: "هذه الدرجات مخصصة للشعر المفتح حتى المستوى 10–12 فقط. على الشعر الداكن قد تلزم جلسات تفتيح متعددة قبل تطبيق اللون النهائي.",
    tipsTitle: "نصائح من الخبراء",
    tipsList: {
      natural: [
        "شعركِ طبيعي – يستجيب بشكل ممتاز للصبغة، نتيجة غنية ومتساوية",
        "أضيفي بضع قطرات من زيت الأرغان للخليط لمزيد من اللمعان",
        "ضعي فازلين على أطراف الأذنين لتجنب البقع",
      ],
      normal: [
        "شعركِ مصبوغ سابقاً – احمي الأطراف بأكسجين أقل",
        "لا توزعي على الأطراف إلا قبل 10–15 دقيقة من النهاية",
        "شامبو مخصص للألوان (خالٍ من السلفات) يطيل عمر اللون",
      ],
      damaged: [
        "شعركِ حساس – يفضل أكسجين 3% على الأطراف، 6% على الجذور",
        "بلسم عميق 48 ساعة بعد التلوين – ضروري",
        "تجنبي المكواة والجعد خلال 72 ساعة الأولى",
      ],
      high_lift: [
        "عملية High-Lift مخصصة للشعر الطبيعي فقط – لا تجريها على شعر مصبوغ مسبقاً",
        "استخدمي دائماً وعاء بلاستيكياً – الأواني المعدنية قد تؤثر على تفاعل الأكسجين",
        "بعد التفتيح، ضعي علاج بروتين لتقوية بنية الشعر خلال 48 ساعة",
      ],
    },
    saveTitle: "احفظي تركيبتكِ",
    saveSub: "أنشئي ملفاً شخصياً واحفظي جميع تركيباتكِ للأبد",
    saveBtn: "احفظي التركيبة في ملفكِ الشخصي",
    saveBtnSub: "انضمي مجاناً – تجربة 7 أيام بدون رسوم",
    whatsappBtn: "استشارة شخصية عبر واتساب",
    restartBtn: "تشخيص جديد",
    premiumBadge: "✦ بريميوم",
    // Save-flow states
    savingAuthLabel: "جارٍ تسجيل الدخول عبر Google وحفظ التركيبة...",
    savingFormulaLabel: "جارٍ حفظ تركيبتكِ...",
    savedTitle: "تم حفظ التركيبة!",
    savedSub: "تم حفظ تركيبتكِ بنجاح في ملفكِ الشخصي.",
    savedAction: "عرض ملفي الشخصي",
    savedContinue: "مواصلة الاستكشاف",
    saveErrorLabel: "حدث خطأ. يرجى المحاولة مرة أخرى.",
    saveRetry: "حاولي مجدداً",
    alreadySignedIn: "سيتم حفظ التركيبة في لحظات...",
    // Shopping list
    shoppingTitle: "قائمة التسوق",
    shoppingSubtitle: "اختاري المنتجات التي تريدين طلبها وأرسليها عبر واتساب",
    shoppingBtn: "أرسلي الطلب عبر WhatsApp",
    shoppingNoneSelected: "اختاري منتجاً على الأقل",
    shoppingSelectAll: "اختاري الكل",
    shoppingClearAll: "امسحي الكل",
    shoppingGrams: "غرام",
    lamisCta: "هل تبحثين عن منتجات شعر احترافية؟",
    lamisBtn: "ادخلي لمتجر Lamis Cosmetics واكتشفي المنتجات الاحترافية ←",
    upsellPoints: [
      "حفظ جميع تركيباتكِ",
      "سجل كامل لعمليات الصبغ",
      "تذكيرات ذكية لموعد الصبغ القادم",
      "خصومات حصرية على منتجات الصبغة",
    ],
  },
} as const;

type Lang = keyof typeof T;
type Condition = "natural" | "normal" | "damaged";
type Bleaching  = "never" | "recent" | "months_ago";

// ─── Special shade categories (treated as level 12 targets) ─────────────────
// Silver shades and fashion/booster series require pre-lightened (level 10-12) hair.
const SILVER_CODES = new Set(["slate-grey", "grey-lilac", "dove-grey", "silver"]);
const FASHION_CODES = new Set(["L-88", "L-89"]);
const BOOSTER_CODES = new Set(["0-99", "0-89", "0-33", "0-22", "0-11", "0-00"]);
const SPECIAL_LEVEL_12_CODES = new Set([
  ...SILVER_CODES, ...FASHION_CODES, ...BOOSTER_CODES,
]);

// ─── Formula engine ───────────────────────────────────────────────────────────
function getLevel(code: string): number | null {
  if (SPECIAL_LEVEL_12_CODES.has(code)) return 12;
  const m = code.match(/^(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : null;
}

function calcDeveloper(
  currCode: string | null,
  destCode: string | null,
  condition: Condition,
  bleaching: Bleaching,
): number {
  if (bleaching === "recent") return 3;
  const curr = currCode ? getLevel(currCode) : null;
  const dest = destCode ? getLevel(destCode) : null;
  if (!curr || !dest) return 6;
  const lift = dest - curr;
  // 12% is allowed ONLY on natural, healthy hair with no bleaching history.
  // Colored / previously-treated hair lifting 3+ levels gets 9% (never 12%).
  if (lift >= 3) return condition === "natural" && bleaching === "never" ? 12 : 9;
  // Subtle lift (1–2 levels): developer remains 6% per the color rules (not high-lift).
  if (lift < -1 && condition === "natural") return 3;
  return 6;
}

interface MixResult {
  // Dye components (always sum to 60g for standard, 40g for high-lift)
  primaryGrams: number;
  baseGrams: number | null;
  baseCode: string | null;
  // Developer (oxygen) – separate from dye
  developerGrams: number;
  // Flags
  isHighLift: boolean;
  // Labels
  ratioHe: string;
  ratioAr: string;
  colorCompositionHe: string;
  colorCompositionAr: string;
}

function calcMixture(grayPct: string, destLevel: number | null, isLiftProcess: boolean): MixResult {
  const isHighLift = isLiftProcess;
  const lvl  = Math.round(destLevel ?? 7);
  const base = `${lvl}-0`;

  if (isHighLift) {
    // 1:2 ratio – 40g color + 80g developer = 120g total
    return {
      primaryGrams: 40, baseGrams: null, baseCode: null,
      developerGrams: 80, isHighLift: true,
      ratioHe: "1:2 – חמצן כפול!",
      ratioAr: "1:2 – أكسجين مضاعف!",
      colorCompositionHe: "100% גוון יעד",
      colorCompositionAr: "100% لون الهدف",
    };
  }

  // Standard 1:1 – dye total always 60g, developer always 60g
  switch (grayPct) {
    case "50":
      return {
        primaryGrams: 40, baseGrams: 20, baseCode: base,
        developerGrams: 60, isHighLift: false,
        ratioHe: "1:1 – כמות שווה",
        ratioAr: "1:1 – كمية متساوية",
        colorCompositionHe: "2/3 גוון יעד + 1/3 בסיס טבעי",
        colorCompositionAr: "2/3 لون الهدف + 1/3 قاعدة طبيعية",
      };
    case "100":
      return {
        primaryGrams: 30, baseGrams: 30, baseCode: base,
        developerGrams: 60, isHighLift: false,
        ratioHe: "1:1 – כמות שווה",
        ratioAr: "1:1 – كمية متساوية",
        colorCompositionHe: "1:1 גוון יעד + בסיס טבעי",
        colorCompositionAr: "1:1 لون الهدف + قاعدة طبيعية",
      };
    default:
      return {
        primaryGrams: 60, baseGrams: null, baseCode: null,
        developerGrams: 60, isHighLift: false,
        ratioHe: "1:1 – כמות שווה",
        ratioAr: "1:1 – كمية متساوية",
        colorCompositionHe: "100% גוון יעד",
        colorCompositionAr: "100% لون الهدف",
      };
  }
}

function calcTime(condition: Condition, bleaching: Bleaching, isHighLift: boolean): { min: number; max: number } {
  if (bleaching === "recent") return { min: 20, max: 25 };
  if (isHighLift) return { min: 45, max: 50 };
  if (condition === "damaged") return { min: 25, max: 35 };
  return { min: 35, max: 45 };
}

function developerNote(pct: number, lang: Lang): string {
  const key = `developerNote${pct}` as keyof (typeof T)[Lang];
  return T[lang][key] as string;
}

// ─── Icon map ─────────────────────────────────────────────────────────────────
const ICON_MAP: Record<StepIconKey, LucideIcon> = {
  flask:    FlaskConical,
  brush:    Paintbrush,
  flame:    Flame,
  layers:   Layers,
  leaf:     Leaf,
  clock:    Clock,
  droplets: Droplets,
  alert:    AlertTriangle,
  sparkles: Sparkles,
  calendar: Calendar,
  shield:   Shield,
  zap:      Zap,
};

// ─── Sub-components ───────────────────────────────────────────────────────────
function Swatch({ hex, code }: { hex: string; code: string }) {
  return (
    <div
      className="h-full w-full"
      style={{ background: `linear-gradient(135deg, ${hex}ee 0%, ${hex} 60%, ${hex}bb 100%)` }}
    >
      <div className="flex h-full items-end p-3">
        <span className="rounded-lg bg-black/40 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-sm">
          {code}
        </span>
      </div>
    </div>
  );
}

function ShadeImage({ code, hex }: { code: string; hex: string }) {
  const [imgErr, setImgErr] = useState(false);
  if (imgErr) return <Swatch hex={hex} code={code} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/hair-colors/${code}.png`}
      alt={code}
      className="h-full w-full object-cover"
      onError={() => setImgErr(true)}
    />
  );
}

function DeveloperBadge({ pct }: { pct: number }) {
  const color =
    pct <= 3  ? "from-emerald-500/30 to-teal-600/30 border-emerald-400/40 text-emerald-300 shadow-emerald-500/20" :
    pct === 6  ? "from-violet-500/30 to-fuchsia-600/30 border-violet-400/40 text-violet-200 shadow-violet-500/20" :
    pct === 9  ? "from-amber-500/30 to-orange-600/30 border-amber-400/40 text-amber-200 shadow-amber-500/20"      :
                 "from-rose-500/30 to-red-600/30 border-rose-400/40 text-rose-200 shadow-rose-500/20";
  return (
    <div className={cn("inline-flex items-center gap-2 rounded-2xl border bg-gradient-to-br px-5 py-3 shadow-lg backdrop-blur-sm", color)}>
      <Droplets className="h-5 w-5 shrink-0" />
      <span className="text-2xl font-black tracking-tight">{pct}%</span>
    </div>
  );
}

function ComponentRow({
  grams,
  label,
  sub,
  hex,
  variant,
}: {
  grams: number;
  label: string;
  sub?: string;
  hex?: string;
  variant: "color" | "base" | "developer";
}) {
  const ring =
    variant === "developer"
      ? "border-cyan-400/25 bg-gradient-to-br from-cyan-500/10 to-teal-600/10"
      : variant === "base"
      ? "border-amber-400/20 bg-gradient-to-br from-amber-500/8 to-orange-600/8"
      : "border-white/15 bg-white/[0.06]";

  const iconColor =
    variant === "developer" ? "text-cyan-400" : "text-fuchsia-400/60";

  const Icon = variant === "developer" ? Droplets : FlaskConical;

  return (
    <div className={cn("flex items-center gap-3 rounded-2xl border px-4 py-3.5 backdrop-blur-sm", ring)}>
      {hex && variant !== "developer" && (
        <div
          className="h-8 w-8 shrink-0 rounded-xl border-2 border-white/25 shadow-md"
          style={{ background: hex }}
        />
      )}
      {variant === "developer" && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border-2 border-cyan-400/30 bg-cyan-500/15">
          <Droplets className="h-4 w-4 text-cyan-300" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-white/45">{label}</p>
        {sub && <p className="text-[10px] text-white/30">{sub}</p>}
        <p className="text-xl font-black tabular-nums text-white leading-none">
          {grams} <span className="text-sm font-medium text-white/55">גרם</span>
        </p>
      </div>
      <Icon className={cn("h-5 w-5 shrink-0", iconColor)} />
    </div>
  );
}

function StepItem({
  step,
  lang,
  index,
  isLast,
  isHighLift,
  devPct,
}: {
  step: ProcessStep;
  lang: Lang;
  index: number;
  isLast: boolean;
  isHighLift: boolean;
  devPct?: number;
}) {
  const Icon  = ICON_MAP[step.icon];
  const title = lang === "he" ? step.titleHe : step.titleAr;
  const raw   = lang === "he" ? step.descHe  : step.descAr;
  const desc  = devPct !== undefined
    ? raw.replace("{DEV_PCT}", String(devPct))
    : raw;

  const iconBg = isHighLift
    ? "border-amber-400/35 bg-gradient-to-br from-amber-500/20 to-orange-600/20 shadow-amber-900/20"
    : "border-fuchsia-400/30 bg-gradient-to-br from-fuchsia-500/20 to-violet-600/20 shadow-fuchsia-900/20";

  const iconColor = isHighLift
    ? (step.icon === "flame" ? "text-orange-300" : step.icon === "alert" ? "text-red-300" : "text-amber-300")
    : (step.icon === "alert" ? "text-red-300" : "text-fuchsia-300");

  const numberBg = isHighLift
    ? "bg-amber-500/20 text-amber-300 border-amber-400/30"
    : "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-400/30";

  return (
    <div className="flex gap-4">
      {/* Timeline column */}
      <div className="flex flex-col items-center">
        <div className={cn(
          "relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border shadow-md",
          iconBg,
        )}>
          <Icon className={cn("h-5 w-5", iconColor)} />
          {/* Step number pip */}
          <span className={cn(
            "absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full border text-[9px] font-black",
            numberBg,
          )}>
            {index + 1}
          </span>
        </div>
        {!isLast && (
          <div className={cn(
            "mt-1.5 w-px flex-1",
            isHighLift
              ? "bg-gradient-to-b from-amber-400/35 to-transparent"
              : "bg-gradient-to-b from-fuchsia-400/30 to-transparent",
          )} style={{ minHeight: "28px" }} />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 pb-5">
        <p className="font-bold leading-snug text-white">{title}</p>
        <p className="mt-1 text-sm leading-relaxed text-white/60">{desc}</p>
      </div>
    </div>
  );
}

// ─── Pending-save key (survives Google OAuth redirect) ────────────────────────
const PENDING_SAVE_KEY = "tintme_pending_save";

type SaveState = "idle" | "auth" | "saving" | "done" | "error";

// ─── Main component ───────────────────────────────────────────────────────────
function FormulaInner() {
  const router = useRouter();
  const params = useSearchParams();

  // ── Auth hooks ──
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const { signIn } = useAuthActions();
  const saveFormulaFn = useMutation(api.formulas.save);
  const currentUser = useQuery(api.users.getCurrentUser);

  const [lang, setLang]               = useState<Lang>("he");
  const [currentCode, setCurrentCode] = useState<string | null>(null);
  const [desiredCode, setDesiredCode] = useState<string | null>(null);
  const [currentPhoto, setCurrentPhoto] = useState<string | null>(null);
  const [desiredPhoto, setDesiredPhoto] = useState<string | null>(null);
  const [saveState, setSaveState]     = useState<SaveState>("idle");
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [dataLoaded, setDataLoaded]       = useState(false);
  const [showLimitBanner, setShowLimitBanner] = useState(false);
  const autoSaveRef = useRef(false);

  const fromSaved  = params.get("fromSaved") === "1";
  const grayPct   = (params.get("grayPercentage") ?? "0") as string;
  const bleaching = (params.get("bleaching")      ?? "never")   as Bleaching;
  const condition = (params.get("condition")      ?? "natural") as Condition;
  const hairLength = params.get("hairLength") ?? "short_normal";
  const isLongHair = hairLength === "long";
  const gramMultiplier = isLongHair ? 2 : 1;

  useEffect(() => {
    const saved = localStorage.getItem("tintme_lang") as Lang | null;
    if (saved === "he" || saved === "ar") setLang(saved);
    setCurrentCode(localStorage.getItem("tintme_current_shade"));
    setDesiredCode(localStorage.getItem("tintme_desired_shade"));
    setCurrentPhoto(localStorage.getItem("tintme_current_photo"));
    setDesiredPhoto(localStorage.getItem("tintme_desired_photo"));
    setDataLoaded(true);
  }, []);

  // ── Post-OAuth redirect: auto-save if a pending payload was stored ───────────
  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    const raw = sessionStorage.getItem(PENDING_SAVE_KEY);
    if (!raw) return;
    sessionStorage.removeItem(PENDING_SAVE_KEY);
    const payload = JSON.parse(raw);
    setSaveState("saving");
    saveFormulaFn(payload)
      .then(() => setSaveState("done"))
      .catch(() => setSaveState("error"));
  }, [isAuthenticated, authLoading, saveFormulaFn]);

  // ── Auto-track free diagnosis usage ──────────────────────────────────────────
  useEffect(() => {
    if (fromSaved) return; // viewing a saved formula — don't re-save or trigger limit
    if (!dataLoaded || authLoading || !isAuthenticated) return;
    if (currentUser === undefined) return;
    if (currentUser?.userType === "paid") return;
    if (autoSaveRef.current) return;
    autoSaveRef.current = true;

    const totalDye = (mix.primaryGrams + (mix.baseGrams ?? 0)) * gramMultiplier;
    saveFormulaFn({
      currentShadeCode: currentCode ?? undefined,
      desiredShadeCode: desiredCode ?? undefined,
      grayPercentage: grayPct,
      bleachingHistory: bleaching,
      hairCondition: condition,
      hairLength,
      developerPct: devPct,
      gramsPrimary: mix.primaryGrams * gramMultiplier,
      gramsBase: mix.baseGrams ? mix.baseGrams * gramMultiplier : undefined,
      gramsTotal: totalDye + mix.developerGrams * gramMultiplier,
      processingTimeMin: time.min,
      processingTimeMax: time.max,
      isHighLift: mix.isHighLift,
    })
      .then(() => setShowLimitBanner(true))
      .catch(() => { autoSaveRef.current = false; });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataLoaded, isAuthenticated, authLoading, currentUser]);

  const t = T[lang];

  const desiredShade  = ALL_SHADES.find((s) => s.code === desiredCode) ?? null;
  const currentShade  = ALL_SHADES.find((s) => s.code === currentCode) ?? null;
  const desiredLevel  = desiredCode ? getLevel(desiredCode) : null;
  const devPct        = calcDeveloper(currentCode, desiredCode, condition, bleaching);

  const liftCount     = (() => {
    const c = currentCode ? getLevel(currentCode) : null;
    return (c && desiredLevel) ? desiredLevel - c : null;
  })();

  // Lift process = 3+ levels AND not recently bleached (bleach = toner only, handled separately)
  const isLiftProcess = bleaching !== "recent" && liftCount !== null && liftCount >= 3;
  const mix           = calcMixture(grayPct, desiredLevel, isLiftProcess);
  const time          = calcTime(condition, bleaching, mix.isHighLift);

  const showBleachWarn  = bleaching === "recent";
  const showDamagedWarn = condition === "damaged";
  const showLiftWarn    = !showBleachWarn && liftCount !== null && liftCount >= 3;

  // Special shade detection
  const isSpecialTargetShade = desiredCode ? SPECIAL_LEVEL_12_CODES.has(desiredCode) : false;
  const specialShadeCategory = !desiredCode ? null
    : SILVER_CODES.has(desiredCode)  ? "silver"
    : FASHION_CODES.has(desiredCode) ? "fashion"
    : BOOSTER_CODES.has(desiredCode) ? "booster"
    : null;

  const processKey =
    showBleachWarn        ? "recent_bleach" :
    mix.isHighLift        ? "high_lift"     :
    condition === "damaged" ? "damaged"     :
    condition === "normal"  ? "normal"      : "natural";

  const processSteps = PROCESS_STEPS[processKey];

  const tipCondition: keyof typeof t.tipsList =
    mix.isHighLift          ? "high_lift" :
    condition === "damaged" ? "damaged"   :
    condition === "normal"  ? "normal"    : "natural";

  const baseShadeHex = mix.baseCode
    ? (ALL_SHADES.find((s) => s.code === mix.baseCode)?.hex ?? "#987840")
    : undefined;

  async function handleSaveFormula() {
    // Build the payload from all current wizard state
    const totalDye = (mix.primaryGrams + (mix.baseGrams ?? 0)) * gramMultiplier;
    const payload = {
      currentShadeCode: currentCode ?? undefined,
      desiredShadeCode: desiredCode ?? undefined,
      grayPercentage: grayPct,
      bleachingHistory: bleaching,
      hairCondition: condition,
      hairLength,
      developerPct: devPct,
      gramsPrimary: mix.primaryGrams * gramMultiplier,
      gramsBase: mix.baseGrams ? mix.baseGrams * gramMultiplier : undefined,
      gramsTotal: totalDye + mix.developerGrams * gramMultiplier,
      processingTimeMin: time.min,
      processingTimeMax: time.max,
      isHighLift: mix.isHighLift,
    };

    if (isAuthenticated) {
      // Already signed in → save immediately
      setSaveState("saving");
      try {
        await saveFormulaFn(payload);
        setSaveState("done");
      } catch {
        setSaveState("error");
      }
    } else {
      // Persist payload across the OAuth redirect, then trigger Google sign-in
      sessionStorage.setItem(PENDING_SAVE_KEY, JSON.stringify(payload));
      setSaveState("auth");
      try {
        await signIn("google", { redirectTo: window.location.href });
      } catch {
        sessionStorage.removeItem(PENDING_SAVE_KEY);
        setSaveState("error");
      }
    }
  }

  function handleRestart() {
    localStorage.removeItem("tintme_current_shade");
    localStorage.removeItem("tintme_desired_shade");
    sessionStorage.removeItem("tintme_current_photo");
    sessionStorage.removeItem("tintme_desired_photo");
    router.push("/");
  }

  // ── Shopping list items ──────────────────────────────────────────────────────
  interface ShopItem { id: string; labelHe: string; labelAr: string; gramsHe: string; gramsAr: string }

  const shoppingItems: ShopItem[] = (() => {
    const items: ShopItem[] = [];
    const g = (n: number) => `${n} ${t.shoppingGrams}`;
    const gar = (n: number) => `${n} ${T.ar.shoppingGrams}`;

    if (mix.isHighLift) {
      items.push({
        id: "bleach-powder",
        labelHe: "אבקת הבהרה מקצועית",
        labelAr: "مسحوق تفتيح احترافي",
        gramsHe: g(mix.primaryGrams * gramMultiplier),
        gramsAr: gar(mix.primaryGrams * gramMultiplier),
      });
      items.push({
        id: "dev-lift",
        labelHe: `קרם חמצן ${devPct}%`,
        labelAr: `كريم أكسجين ${devPct}%`,
        gramsHe: g(mix.developerGrams * gramMultiplier),
        gramsAr: gar(mix.developerGrams * gramMultiplier),
      });
      if (desiredShade) {
        items.push({
          id: "toner",
          labelHe: `גוון יעד / טונר – ${desiredShade.code} ${desiredShade.nameHe}`,
          labelAr: `درجة الهدف / تونر – ${desiredShade.code} ${desiredShade.nameAr}`,
          gramsHe: g(60 * gramMultiplier),
          gramsAr: gar(60 * gramMultiplier),
        });
      }
      items.push({
        id: "dev-toner",
        labelHe: "קרם חמצן 1.9%–3% (לטונר)",
        labelAr: "كريم أكسجين 1.9%–3% (للتونر)",
        gramsHe: g(60 * gramMultiplier),
        gramsAr: gar(60 * gramMultiplier),
      });
    } else {
      if (desiredShade) {
        items.push({
          id: "primary",
          labelHe: `גוון יעד – ${desiredShade.code} ${desiredShade.nameHe}`,
          labelAr: `درجة الهدف – ${desiredShade.code} ${desiredShade.nameAr}`,
          gramsHe: g(mix.primaryGrams * gramMultiplier),
          gramsAr: gar(mix.primaryGrams * gramMultiplier),
        });
      }
      if (mix.baseCode) {
        const baseObj = ALL_SHADES.find(s => s.code === mix.baseCode);
        items.push({
          id: "base",
          labelHe: `בסיס טבעי – ${mix.baseCode}${baseObj ? ` ${baseObj.nameHe}` : ""}`,
          labelAr: `قاعدة طبيعية – ${mix.baseCode}${baseObj ? ` ${baseObj.nameAr}` : ""}`,
          gramsHe: g((mix.baseGrams ?? 0) * gramMultiplier),
          gramsAr: gar((mix.baseGrams ?? 0) * gramMultiplier),
        });
      }
      items.push({
        id: "developer",
        labelHe: `קרם חמצן ${devPct}%`,
        labelAr: `كريم أكسجين ${devPct}%`,
        gramsHe: g(mix.developerGrams * gramMultiplier),
        gramsAr: gar(mix.developerGrams * gramMultiplier),
      });
    }
    return items;
  })();

  const allChecked = checkedItems.size === shoppingItems.length;

  function toggleItem(id: string) {
    setCheckedItems(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (allChecked) {
      setCheckedItems(new Set());
    } else {
      setCheckedItems(new Set(shoppingItems.map(i => i.id)));
    }
  }

  function handleWhatsAppOrder() {
    const selected = shoppingItems.filter(i => checkedItems.has(i.id));
    if (selected.length === 0) return;
    const lines = selected
      .map(i => `• ${lang === "he" ? i.labelHe : i.labelAr} (${lang === "he" ? i.gramsHe : i.gramsAr})`)
      .join("\n");
    const prefix = lang === "he"
      ? "שלום, אני מעוניינת להזמין את המוצרים הבאים לצביעת שיער:\n"
      : "مرحباً، أرغب في طلب المنتجات التالية لصبغ شعري:\n";
    window.open(`https://wa.me/972522903783?text=${encodeURIComponent(prefix + lines)}`, "_blank");
  }

  return (
    <>
    <div
      dir="rtl"
      className="relative min-h-screen overflow-x-hidden"
      style={{ fontFamily: t.font }}
    >
      {/* ── Background ─────────────────────────────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-br from-[#1e0535] via-[#3d0650] to-[#180430]" />
      <div className="pointer-events-none fixed -right-24 -top-24 h-[480px] w-[480px] rounded-full bg-fuchsia-700/20 blur-[130px]" />
      <div className="pointer-events-none fixed -left-32 top-[30%] h-[440px] w-[440px] rounded-full bg-violet-800/15 blur-[120px]" />
      <div className="pointer-events-none fixed bottom-0 right-1/4 h-96 w-96 rounded-full bg-rose-600/12 blur-[100px]" />
      {mix.isHighLift && (
        <div className="pointer-events-none fixed top-1/4 left-1/4 h-64 w-64 rounded-full bg-amber-500/8 blur-[90px]" />
      )}

      <div className="relative z-10 mx-auto max-w-2xl px-4 pb-16 pt-4 sm:px-6">

        {/* ── Top bar ──────────────────────────────────────────────────── */}
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={handleRestart}
            className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/8 px-3 py-1.5 text-sm font-medium text-white/60 backdrop-blur-md transition-all hover:bg-white/15 hover:text-white active:scale-95"
          >
            <ArrowRight className="h-4 w-4" />
            {t.backBtn}
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-violet-600 shadow-lg shadow-fuchsia-900/40">
              <Palette className="h-4 w-4 text-white" />
            </div>
            <span className="font-black text-lg tracking-tight text-white">TintMe</span>
          </div>
          <button
            type="button"
            onClick={() => setLang((l) => (l === "he" ? "ar" : "he"))}
            className="rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-sm font-medium text-white/80 backdrop-blur-md transition-all hover:bg-white/18 active:scale-95"
          >
            {t.switchLabel}
          </button>
        </div>

        {/* ── Saved formula banner ─────────────────────────────────────── */}
        {fromSaved && (
          <div className="mb-5">
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-violet-400/40 bg-gradient-to-l from-violet-900/50 via-fuchsia-900/40 to-purple-900/50 px-4 py-3 backdrop-blur-md shadow-lg shadow-violet-900/20">
              <button
                type="button"
                onClick={() => {
                  document.getElementById("shopping-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="flex shrink-0 items-center gap-1.5 rounded-xl border border-violet-400/30 bg-violet-500/20 px-3 py-1.5 text-xs font-bold text-violet-200 transition-all hover:bg-violet-500/30 active:scale-95"
              >
                <ShoppingBag className="h-3.5 w-3.5" />
                {t.savedFormulaOrder}
              </button>
              <div className="flex items-center gap-2 text-right">
                <p className="text-sm font-semibold text-violet-200">{t.savedFormulaBanner}</p>
                <BookmarkPlus className="h-4 w-4 shrink-0 text-violet-300" />
              </div>
            </div>
          </div>
        )}

        {/* ── Free limit banner ────────────────────────────────────────── */}
        {showLimitBanner && (
          <div className="mb-5 animate-in fade-in slide-in-from-top-3 duration-500">
            <div className="relative overflow-hidden rounded-2xl border border-amber-400/40 bg-gradient-to-l from-amber-900/50 via-orange-900/40 to-rose-900/50 p-4 backdrop-blur-md shadow-lg shadow-amber-900/20">
              <div className="pointer-events-none absolute -left-8 -top-8 h-32 w-32 rounded-full bg-amber-500/15 blur-2xl" />
              <div className="relative flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-amber-400/35 bg-amber-500/20">
                  <Crown className="h-5 w-5 text-amber-300" />
                </div>
                <div className="flex-1 text-right">
                  <p className="font-bold text-amber-200 text-sm leading-snug">
                    {lang === "he"
                      ? "ניצלת את האבחון החינמי שלך!"
                      : "لقد استخدمتِ تشخيصكِ المجاني!"}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-amber-100/70">
                    {lang === "he"
                      ? "לאבחונים נוספים ונוסחאות ללא הגבלה — שדרגי לפרימיום מהדף הראשי."
                      : "لتشخيصات إضافية وتركيبات بلا حدود — قومي بالترقية من الصفحة الرئيسية."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLimitBanner(false)}
                  className="shrink-0 text-amber-300/50 transition hover:text-amber-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <div className="mb-6 text-center">
          <div className={cn(
            "mb-3 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 backdrop-blur-sm",
            mix.isHighLift
              ? "border-amber-400/35 bg-amber-500/15"
              : "border-fuchsia-400/35 bg-fuchsia-500/15",
          )}>
            <Sparkles className={cn("h-3.5 w-3.5", mix.isHighLift ? "text-amber-300" : "text-fuchsia-300")} />
            <span className={cn("text-xs font-bold", mix.isHighLift ? "text-amber-200" : "text-fuchsia-200")}>
              {t.resultsBadge}
            </span>
          </div>
          <h1 className="bg-gradient-to-l from-fuchsia-300 via-white to-violet-300 bg-clip-text text-3xl font-black tracking-tight text-transparent sm:text-4xl">
            {t.heroTitle}
          </h1>
          <p className="mx-auto mt-2 max-w-xs text-sm text-white/50">{t.heroSub}</p>
        </div>

        {/* ── Warnings ─────────────────────────────────────────────────── */}
        {(showBleachWarn || showDamagedWarn || showLiftWarn) && (
          <div className={cn(
            "mb-5 rounded-2xl border p-4",
            showBleachWarn ? "border-red-400/40 bg-red-500/12" : "border-amber-400/40 bg-amber-500/10",
          )}>
            <div className="flex items-start gap-3">
              <div className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                showBleachWarn ? "bg-red-500/20" : "bg-amber-500/20",
              )}>
                <AlertTriangle className={cn("h-5 w-5", showBleachWarn ? "text-red-300" : "text-amber-300")} />
              </div>
              <div>
                <p className={cn("text-sm font-bold", showBleachWarn ? "text-red-200" : "text-amber-200")}>
                  {t.warningTitle}
                </p>
                <p className={cn("mt-0.5 text-xs leading-relaxed", showBleachWarn ? "text-red-200/75" : "text-amber-200/75")}>
                  {showBleachWarn ? t.warningBleach : showLiftWarn ? (devPct === 12 ? t.warningLift12 : t.warningLift9) : t.warningDamaged}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Special shade info banner ────────────────────────────────── */}
        {isSpecialTargetShade && (
          <div className="mb-5 overflow-hidden rounded-2xl border border-violet-400/35 bg-gradient-to-br from-violet-500/12 to-fuchsia-600/10 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/20">
                <Sparkles className="h-5 w-5 text-violet-300" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1.5 flex flex-wrap items-center gap-2">
                  <p className="text-sm font-bold text-violet-200">{t.specialShadeTitle}</p>
                  <span className={cn(
                    "rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider",
                    specialShadeCategory === "silver"
                      ? "border-slate-400/40 bg-slate-500/20 text-slate-200"
                      : specialShadeCategory === "fashion"
                      ? "border-fuchsia-400/40 bg-fuchsia-500/20 text-fuchsia-200"
                      : "border-amber-400/40 bg-amber-500/20 text-amber-200",
                  )}>
                    {specialShadeCategory === "silver"  ? t.specialShadeSilver
                     : specialShadeCategory === "fashion" ? t.specialShadeFashion
                     : t.specialShadeBooster}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-violet-200/70">{t.specialShadeBody}</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Preview split card ───────────────────────────────────────── */}
        <div className="mb-5 overflow-hidden rounded-3xl border border-white/12 bg-white/[0.06] shadow-2xl shadow-black/30 backdrop-blur-xl">
          <div className="border-b border-white/10 px-5 py-4">
            <p className="font-bold text-white">{t.previewTitle}</p>
          </div>
          <div className="grid grid-cols-2">
            {/* Current */}
            <div className="relative aspect-[4/3] overflow-hidden border-l border-white/10">
              {currentPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={currentPhoto} alt="current hair" className="h-full w-full object-cover"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
              ) : currentShade ? (
                <ShadeImage code={currentShade.code} hex={currentShade.hex} />
              ) : (
                <div className="flex h-full items-center justify-center bg-white/5">
                  <p className="px-3 text-center text-xs text-white/30">{t.noPhoto}</p>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-0 right-0 p-3">
                <span className="rounded-lg bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white/80 backdrop-blur-sm">
                  {t.currentHairLabel}
                </span>
              </div>
            </div>
            {/* Desired */}
            <div className="relative aspect-[4/3] overflow-hidden">
              {desiredPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={desiredPhoto} alt="desired hair" className="h-full w-full object-cover"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
              ) : desiredShade ? (
                <ShadeImage code={desiredShade.code} hex={desiredShade.hex} />
              ) : (
                <div className="h-full bg-gradient-to-br from-fuchsia-600/30 to-violet-700/30" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-0 right-0 p-3">
                <span className="rounded-lg bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white/80 backdrop-blur-sm">
                  {t.desiredShadeLabel}
                </span>
              </div>
            </div>
          </div>
          {/* Names row */}
          <div className="grid grid-cols-2 border-t border-white/10">
            <div className="border-l border-white/10 p-3 text-center">
              <p className="text-[11px] text-white/40">{t.currentHairLabel}</p>
              <p className="mt-0.5 truncate text-sm font-bold text-white">{currentShade?.code ?? "—"}</p>
              {currentShade && (
                <p className="truncate text-[10px] text-white/50">
                  {lang === "he" ? currentShade.nameHe : currentShade.nameAr}
                </p>
              )}
            </div>
            <div className="p-3 text-center">
              <p className="text-[11px] text-white/40">{t.desiredShadeLabel}</p>
              <p className="mt-0.5 truncate text-sm font-bold text-white">{desiredShade?.code ?? "—"}</p>
              {desiredShade && (
                <p className="truncate text-[10px] text-white/50">
                  {lang === "he" ? desiredShade.nameHe : desiredShade.nameAr}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Formula block ─────────────────────────────────────────────── */}
        <div className={cn(
          "mb-5 overflow-hidden rounded-3xl border shadow-2xl shadow-black/30 backdrop-blur-xl",
          mix.isHighLift
            ? "border-amber-400/20 bg-gradient-to-br from-amber-950/20 via-white/[0.05] to-white/[0.03]"
            : "border-white/12 bg-white/[0.06]",
        )}>
          {/* Header */}
          <div className={cn("border-b px-5 py-4", mix.isHighLift ? "border-amber-400/15" : "border-white/10")}>
            <div className="flex items-center gap-2">
              <FlaskConical className={cn("h-5 w-5", mix.isHighLift ? "text-amber-300" : "text-fuchsia-300")} />
              <p className="font-bold text-white">{t.formulaTitle}</p>
              {mix.isHighLift && (
                <span className="ml-auto rounded-full border border-amber-400/40 bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-amber-200">
                  High-Lift
                </span>
              )}
            </div>
            <p className={cn("mt-0.5 text-xs", mix.isHighLift ? "text-amber-200/60" : "text-white/40")}>
              {mix.isHighLift ? t.formulaSubHighLift : t.formulaSub}
            </p>
          </div>

          <div className="space-y-3 p-5">
            {/* High-lift inline alert */}
            {mix.isHighLift && (
              <div className="flex items-center gap-2.5 rounded-xl border border-amber-400/30 bg-amber-500/12 px-4 py-2.5">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-300" />
                <p className="text-xs leading-relaxed text-amber-200/85">{t.highLiftAlert.replace("{DEV_PCT}", String(devPct))}</p>
              </div>
            )}

            {/* Phase 1 badge – high-lift only */}
            {mix.isHighLift && (
              <div className="flex items-center gap-2 rounded-xl border border-amber-400/25 bg-amber-500/10 px-3.5 py-2">
                <Flame className="h-4 w-4 text-amber-300" />
                <p className="text-xs font-bold text-amber-200">{t.phase1Label}</p>
              </div>
            )}

            {/* Section label – bleaching powder OR target color */}
            <p className="text-[11px] font-semibold uppercase tracking-widest text-white/35">
              {mix.isHighLift ? t.bleachingComponent : t.colorComponents}
            </p>

            {/* Primary row: אבקת הבהרה (high-lift) OR גוון יעד (standard) */}
            <ComponentRow
              grams={mix.primaryGrams * gramMultiplier}
              label={mix.isHighLift
                ? t.bleachingPowder
                : (desiredShade ? `${t.primary} – ${desiredShade.code}` : t.primary)}
              sub={mix.isHighLift
                ? (lang === "he" ? "אבקה מקצועית להבהרה – ללא טינטינג" : "مسحوق احترافي للتفتيح – بدون تلوين")
                : (lang === "he" ? mix.colorCompositionHe : mix.colorCompositionAr)}
              hex={mix.isHighLift ? undefined : desiredShade?.hex}
              variant="color"
            />

            {/* Base (gray coverage – standard only) */}
            {!mix.isHighLift && mix.baseCode && (
              <ComponentRow
                grams={mix.baseGrams! * gramMultiplier}
                label={`${t.base} – ${mix.baseCode}`}
                hex={baseShadeHex}
                variant="base"
              />
            )}

            {/* Divider with "+" */}
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-white/10" />
              <span className="rounded-full border border-white/15 bg-white/8 px-2.5 py-0.5 text-xs font-bold text-white/40">+</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            {/* Developer label */}
            <p className="text-[11px] font-semibold uppercase tracking-widest text-white/35">
              {t.developerComponent}
            </p>

            {/* Developer row */}
            <ComponentRow
              grams={mix.developerGrams * gramMultiplier}
              label={`${t.developerComponent} ${devPct}%`}
              sub={developerNote(devPct, lang)}
              variant="developer"
            />

            {/* Ratio + developer badges */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className={cn(
                "flex flex-col gap-1.5 rounded-2xl border p-3.5",
                mix.isHighLift ? "border-amber-400/25 bg-amber-500/10" : "border-white/12 bg-white/5",
              )}>
                <p className="text-[11px] text-white/40">{t.ratioLabel}</p>
                <p className={cn("text-sm font-black leading-snug", mix.isHighLift ? "text-amber-200" : "text-fuchsia-200")}>
                  {lang === "he" ? mix.ratioHe : mix.ratioAr}
                </p>
              </div>
              <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-fuchsia-400/20 bg-fuchsia-500/8 p-3">
                <p className="text-[11px] text-white/40">{t.developerLabel}</p>
                <DeveloperBadge pct={devPct} />
              </div>
            </div>

            {/* Total */}
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/4 px-4 py-2.5">
              <div className="flex items-center gap-2 text-sm text-white/50">
                <Zap className="h-4 w-4 text-yellow-400/60" />
                {t.totalLabel}
              </div>
              <span className="text-base font-black text-white">
                {(mix.primaryGrams + (mix.baseGrams ?? 0) + mix.developerGrams) * gramMultiplier}{" "}
                <span className="text-sm font-medium text-white/55">גרם</span>
              </span>
            </div>

            {/* Hair-length auto-scaling badge */}
            <div className={cn(
              "flex items-center gap-2 rounded-xl border px-3.5 py-2.5",
              isLongHair ? "border-violet-400/25 bg-violet-500/10" : "border-white/10 bg-white/4",
            )}>
              <span className="text-base">{isLongHair ? "✂️" : "💇"}</span>
              <p className={cn("text-xs font-semibold", isLongHair ? "text-violet-200" : "text-white/45")}>
                {isLongHair ? t.lengthBadgeLong : t.lengthBadgeShort}
              </p>
              {isLongHair && (
                <span className="ms-auto shrink-0 rounded-full border border-violet-400/40 bg-violet-500/20 px-2 py-0.5 text-[9px] font-black text-violet-200 uppercase tracking-wider">
                  ×2
                </span>
              )}
            </div>

            {/* ── Phase 2: Toning / גוון יעד – high-lift only ── */}
            {mix.isHighLift && (
              <>
                {/* Rinse divider */}
                <div className="flex items-center gap-3 py-1">
                  <div className="h-px flex-1 bg-white/10" />
                  <div className="flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                    <Droplets className="h-3 w-3" />
                    {t.rinseLabel}
                  </div>
                  <div className="h-px flex-1 bg-white/10" />
                </div>

                {/* Phase 2 badge */}
                <div className="flex items-center gap-2 rounded-xl border border-fuchsia-400/25 bg-fuchsia-500/10 px-3.5 py-2">
                  <Sparkles className="h-4 w-4 text-fuchsia-300" />
                  <p className="text-xs font-bold text-fuchsia-200">{t.phase2Label}</p>
                </div>

                {/* Target shade (toner) card */}
                <div className="flex items-center gap-3 rounded-2xl border border-fuchsia-400/20 bg-gradient-to-br from-fuchsia-500/10 to-violet-600/10 px-4 py-3.5">
                  {desiredShade && (
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl border-2 border-white/25 shadow-md">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/hair-colors/${desiredShade.code}.png`}
                        alt={desiredShade.code}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          const wrap = e.currentTarget.parentElement as HTMLElement;
                          wrap.style.background = desiredShade.hex;
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] text-white/40">{t.tonerLabel}</p>
                    <p className="font-bold text-white">{desiredShade?.code ?? "—"}</p>
                    <p className="text-[10px] text-fuchsia-200/60">
                      {desiredShade ? (lang === "he" ? desiredShade.nameHe : desiredShade.nameAr) : ""}
                    </p>
                  </div>
                  <Sparkles className="h-4 w-4 shrink-0 text-fuchsia-300/50" />
                </div>

                {/* Phase 2 instructions */}
                <p className="rounded-xl border border-fuchsia-400/15 bg-fuchsia-500/8 px-3.5 py-3 text-xs leading-relaxed text-white/55">
                  {t.phase2Desc}
                </p>
              </>
            )}
          </div>
        </div>

        {/* ── Process timeline ──────────────────────────────────────────── */}
        <div className={cn(
          "mb-5 overflow-hidden rounded-3xl border shadow-2xl shadow-black/30 backdrop-blur-xl",
          mix.isHighLift
            ? "border-amber-400/20 bg-gradient-to-br from-amber-950/15 via-white/[0.05] to-white/[0.03]"
            : "border-white/12 bg-white/[0.06]",
        )}>
          <div className={cn("border-b px-5 py-4", mix.isHighLift ? "border-amber-400/15" : "border-white/10")}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className={cn("h-5 w-5", mix.isHighLift ? "text-amber-400/80" : "text-yellow-400/70")} />
                <p className="font-bold text-white">{t.processTitle}</p>
              </div>
              <div className={cn(
                "flex items-center gap-1.5 rounded-xl border px-3 py-1.5",
                mix.isHighLift
                  ? "border-amber-400/30 bg-amber-500/15"
                  : "border-violet-400/25 bg-violet-500/15",
              )}>
                <Clock className={cn("h-3.5 w-3.5", mix.isHighLift ? "text-amber-300" : "text-violet-300")} />
                <span className={cn("text-xs font-bold", mix.isHighLift ? "text-amber-200" : "text-violet-200")}>
                  {time.min}–{time.max} {t.processTimeUnit}
                </span>
              </div>
            </div>
            <p className={cn("mt-0.5 text-xs", mix.isHighLift ? "text-amber-200/50" : "text-white/40")}>
              {mix.isHighLift ? t.processSubHighLift : t.processSub}
            </p>
          </div>

          <div className="p-5">
            {processSteps.map((step, i) => (
              <StepItem
                key={i}
                step={step}
                lang={lang}
                index={i}
                isLast={i === processSteps.length - 1}
                isHighLift={mix.isHighLift}
                devPct={mix.isHighLift ? devPct : undefined}
              />
            ))}
          </div>
        </div>

        {/* ── Tips ─────────────────────────────────────────────────────── */}
        <div className="mb-7 rounded-3xl border border-white/12 bg-white/[0.06] shadow-2xl shadow-black/30 backdrop-blur-xl">
          <div className="border-b border-white/10 px-5 py-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              <p className="font-bold text-white">{t.tipsTitle}</p>
            </div>
          </div>
          <div className="space-y-3 p-5">
            {t.tipsList[tipCondition].map((tip, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-fuchsia-400" />
                <p className="text-sm leading-relaxed text-white/70">{tip}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Shopping list ────────────────────────────────────────────── */}
        <div id="shopping-section" className="mb-7 overflow-hidden rounded-3xl border border-pink-400/25 bg-gradient-to-br from-[#1e0535]/80 via-pink-950/35 to-violet-950/40 shadow-2xl shadow-black/30 backdrop-blur-xl">
          {/* Header */}
          <div className="border-b border-pink-400/15 px-5 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-pink-300" />
                <p className="font-bold text-white">{t.shoppingTitle}</p>
              </div>
              <button
                type="button"
                onClick={toggleAll}
                className="text-xs font-semibold text-pink-400/80 transition hover:text-pink-300"
              >
                {allChecked ? t.shoppingClearAll : t.shoppingSelectAll}
              </button>
            </div>
            <p className="mt-0.5 text-xs text-white/40">{t.shoppingSubtitle}</p>
          </div>

          {/* Items */}
          <div className="divide-y divide-white/[0.06] px-5">
            {shoppingItems.map((item) => {
              const checked = checkedItems.has(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleItem(item.id)}
                  className="flex w-full items-center gap-4 py-4 text-right transition-colors hover:bg-white/[0.03]"
                >
                  {/* Custom checkbox */}
                  <div className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition-all duration-200",
                    checked
                      ? "border-pink-400 bg-gradient-to-br from-pink-400 via-fuchsia-500 to-violet-600 shadow-lg shadow-pink-500/30"
                      : "border-white/25 bg-white/5",
                  )}>
                    {checked && (
                      <svg className="h-3.5 w-3.5 text-white" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>

                  {/* Label + grams */}
                  <div className="min-w-0 flex-1">
                    <p className={cn(
                      "text-sm font-semibold leading-snug transition-colors",
                      checked ? "text-white" : "text-white/65",
                    )}>
                      {lang === "he" ? item.labelHe : item.labelAr}
                    </p>
                    <p className={cn(
                      "mt-0.5 text-xs transition-colors",
                      checked ? "text-pink-300/80" : "text-white/30",
                    )}>
                      {lang === "he" ? item.gramsHe : item.gramsAr}
                    </p>
                  </div>

                  {/* Color dot */}
                  <div className={cn(
                    "h-2 w-2 shrink-0 rounded-full transition-all",
                    checked ? "bg-pink-400 shadow-[0_0_6px_2px_rgba(244,114,182,0.5)]" : "bg-white/15",
                  )} />
                </button>
              );
            })}
          </div>

          {/* WhatsApp CTA */}
          <div className="px-5 pb-5 pt-3 space-y-3">
            <button
              type="button"
              onClick={handleWhatsAppOrder}
              disabled={checkedItems.size === 0}
              className={cn(
                "group relative w-full overflow-hidden rounded-2xl px-6 py-4 text-sm font-bold text-white transition-all duration-300",
                checkedItems.size > 0
                  ? "bg-gradient-to-l from-emerald-600 via-teal-500 to-emerald-400 shadow-xl shadow-emerald-900/40 hover:scale-[1.015] active:scale-[0.98]"
                  : "cursor-not-allowed bg-white/8 text-white/30",
              )}
            >
              {checkedItems.size > 0 && (
                <span className="pointer-events-none absolute inset-0 translate-x-full bg-gradient-to-l from-white/15 via-transparent to-transparent transition-transform duration-500 group-hover:translate-x-0" />
              )}
              <span className="relative flex items-center justify-center gap-2.5">
                {/* WhatsApp icon */}
                <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                {checkedItems.size > 0
                  ? `${t.shoppingBtn} (${checkedItems.size})`
                  : t.shoppingNoneSelected}
              </span>
            </button>

            {/* Lamis Cosmetics store link */}
            <div className="rounded-2xl border border-fuchsia-400/25 bg-gradient-to-br from-fuchsia-500/10 to-violet-600/10 px-4 py-3 text-center">
              <p className="mb-2 text-xs font-semibold text-white/60">{t.lamisCta}</p>
              <a
                href="https://www.lamis-cosmetics.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-fuchsia-600 via-violet-500 to-fuchsia-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-fuchsia-900/40 transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
              >
                <ShoppingBag className="h-4 w-4 shrink-0" />
                {t.lamisBtn}
              </a>
            </div>
          </div>
        </div>

        {/* ── WhatsApp CTA ─────────────────────────────────────────────── */}
        <a
          href="https://wa.me/972522903783"
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-6 py-4 text-sm font-semibold text-emerald-300 shadow-lg transition-all duration-200 hover:bg-emerald-500/18 hover:text-emerald-200 active:scale-[0.98]"
        >
          <MessageCircle className="h-5 w-5" />
          {t.whatsappBtn}
        </a>

        {/* Restart */}
        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={handleRestart}
            className="inline-flex items-center gap-1.5 text-sm text-white/35 transition-colors hover:text-white/60 active:scale-95"
          >
            <RefreshCw className="h-4 w-4" />
            {t.restartBtn}
          </button>
        </div>

      </div>
    </div>

    {/* ── Floating AI Chatbot ──────────────────────────────────────────────── */}
    <FloatingChatbot hairContext={[
      `רמת בסיס נוכחית: ${currentCode ?? "לא צוין"}`,
      `גוון יעד: ${desiredCode ?? "לא צוין"}`,
      `אחוז אפור: ${grayPct}`,
      `מצב שיער: ${condition} | אורך: ${hairLength}`,
      `היסטוריית הלבנה: ${bleaching}`,
      `חמצן: ${devPct}%`,
      `גרמים — ראשי: ${mix.primaryGrams * gramMultiplier}g, בסיס: ${(mix.baseGrams ?? 0) * gramMultiplier}g, סה"כ: ${(mix.primaryGrams + (mix.baseGrams ?? 0) + mix.developerGrams) * gramMultiplier}g`,
      `זמן עיבוד: ${time.min}–${time.max} דקות`,
      `הייליפט: ${mix.isHighLift ? "כן" : "לא"}`,
    ].join("\n")} />
    </>
  );
}

// ─── Suspense wrapper (required for useSearchParams) ──────────────────────────
export default function FormulaPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#1e0535]">
          <div className="flex items-center gap-3 text-white/60">
            <Sparkles className="h-5 w-5 animate-spin text-fuchsia-400" />
            <span className="text-sm font-medium">מחשבת נוסחה...</span>
          </div>
        </div>
      }
    >
      <FormulaInner />
    </Suspense>
  );
}
