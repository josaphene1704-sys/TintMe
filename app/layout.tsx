import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import type { Metadata } from "next";
import { Cairo, Rubik } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Providers } from "@/components/providers/providers";

const rubik = Rubik({
  subsets: ["hebrew", "latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-rubik",
  display: "swap",
});

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-cairo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TintMe",
  description: "TintMe - אבחון שיער והתאמת פורמולה",
};

// רכיב ה-Layout הראשי של האפליקציה
// עוטף את כל העמודים ומספק את ההגדרות הגלובליות (RTL, פונטים, ספקים)
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // ספק האימות של Convex בצד השרת
    <ConvexAuthNextjsServerProvider>
      {/* הגדרת כיוון האתר לימין-לשמאל (RTL) ושפה לעברית */}
      <html dir="rtl" lang="he" className={`${rubik.variable} ${cairo.variable}`}>
        <body className="antialiased">
          {/* ספקי הקונטקסט של האפליקציה (Convex Client, וכו') */}
          <Providers>
            {/* סרגל הניווט העליון */}
            <Navbar />
            {/* תוכן העמוד הספציפי */}
            {children}
            {/* כותרת תחתונה */}
            <Footer />
          </Providers>
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}
