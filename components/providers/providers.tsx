"use client";

import { ConvexAuthNextjsProvider } from "@convex-dev/auth/nextjs";
import { ConvexReactClient } from "convex/react";
import type React from "react";

// אתחול לקוח Convex עם כתובת השרת
const convex = new ConvexReactClient(
  process.env.NEXT_PUBLIC_CONVEX_URL ?? "https://descriptive-grasshopper-402.convex.cloud"
);

type ProvidersProps = {
  children: React.ReactNode;
};

// רכיב ספקים (Providers) העוטף את האפליקציה
// מספק את הקונטקסט של Convex Auth לכל הרכיבים בתוך האפליקציה
export function Providers({ children }: ProvidersProps) {
  return <ConvexAuthNextjsProvider client={convex}>{children}</ConvexAuthNextjsProvider>;
}
