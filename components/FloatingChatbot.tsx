"use client";

import { useQuery } from "convex/react";
import { Send, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { api } from "@/convex/_generated/api";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const GREETING: Message = {
  role: "assistant",
  content:
    "שלום! אני TintMe AI ✨ המומחית האישית שלך לצביעת שיער. שאלי אותי על הנוסחה, זמני עיבוד, טכניקת מריחה — הכל!",
};

const QUICK_PILLS = [
  "כמה זמן להשאיר את החומר על השיער?",
  "איך למרוח בצורה אחידה?",
  "מה לעשות אם יש לי גוון תת-עורי אדמדם?",
] as const;

interface Props {
  hairContext?: string;
}

export default function FloatingChatbot({ hairContext }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [displayMessages, setDisplayMessages] = useState<Message[]>([GREETING]);
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // מכסת השאלות. השרת הוא מקור האמת (app/api/chat/route.ts) — כאן זו תצוגה
  // בלבד, כדי שהמשתמשת תדע כמה נשאר לה לפני שהיא נחסמת.
  const botQuota = useQuery(api.credits.getMyBotQuota);
  const remaining = botQuota?.remaining ?? null;
  const isExhausted = remaining !== null && remaining <= 0;

  // כותרת המשנה: כל עוד המכסה לא נטענה מציגים את התיאור הרגיל
  let quotaLabel = "מומחית צביעת שיער";
  if (isExhausted) {
    quotaLabel = "נגמרו השאלות";
  } else if (remaining !== null) {
    quotaLabel = `נותרו ${remaining} שאלות`;
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayMessages, isLoading]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  async function handleSend(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isLoading || isExhausted) return;

    const userMsg: Message = { role: "user", content: trimmed };
    const newHistory = [...chatHistory, userMsg];

    setDisplayMessages((prev) => [...prev, userMsg]);
    setChatHistory(newHistory);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newHistory, hairContext }),
      });

      const data = await res.json();
      const assistantMsg: Message = {
        role: "assistant",
        content: data.text ?? "מצטערת, נתקלתי בבעיה. אנא נסי שוב.",
      };

      setDisplayMessages((prev) => [...prev, assistantMsg]);

      // הודעת חסימה/שגיאה מוצגת למשתמשת אבל לא נכנסת להיסטוריה שנשלחת
      // למודל — אחרת ההקשר של השיחה מזדהם בהודעות מערכת.
      if (res.ok) {
        setChatHistory((prev) => [...prev, assistantMsg]);
      } else {
        setChatHistory((prev) => prev.slice(0, -1)); // הסרת השאלה שלא נענתה
      }
    } catch {
      setDisplayMessages((prev) => [
        ...prev,
        { role: "assistant", content: "שגיאת חיבור. אנא בדקי את החיבור לאינטרנט ונסי שוב." },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      {/* ── Chat Window ───────────────────────────────────────────────────────── */}
      {isOpen && (
        <div
          className="fixed right-4 bottom-[88px] left-4 z-50 sm:right-6 sm:left-auto sm:w-[380px] md:right-6"
          style={{ animation: "chatSlideUp 0.28s cubic-bezier(0.22,1,0.36,1)" }}
        >
          {/*
            הגובה חייב להיות מוגבל לגובה המסך בפועל.
            520px קבוע + bottom-[88px] דורשים 608px, ובנייד עם שורת כתובת
            גלויה החלק העליון של החלון נדחף מחוץ למסך והתשובות נחתכות.
            dvh (ולא vh) מתעדכן כשסרגלי הדפדפן נכנסים ויוצאים.
            בדפדפן ישן שלא מכיר dvh, ה-max-height פשוט מתעלם ונשארת
            ההתנהגות הקודמת — כלומר אין רגרסיה.
          */}
          <div
            className="flex h-[520px] max-h-[calc(100dvh-104px)] flex-col overflow-hidden rounded-3xl border border-white/15 shadow-2xl sm:max-h-[calc(100dvh-120px)]"
            style={{
              background: "linear-gradient(160deg, rgba(55,7,96,0.97) 0%, rgba(24,5,48,0.98) 100%)",
              boxShadow: "0 24px 64px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.06)",
              backdropFilter: "blur(24px)",
            }}
          >
            {/* Header */}
            <div
              className="flex shrink-0 items-center justify-between border-white/10 border-b px-4 py-3"
              style={{
                background: "linear-gradient(90deg, rgba(91,33,182,0.45), rgba(112,26,117,0.3))",
              }}
            >
              <button
                aria-label="סגור צ'אט"
                className="rounded-full p-2 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="font-bold text-sm text-white leading-tight">TintMe AI</p>
                  <p
                    className={`text-xs leading-tight ${
                      isExhausted ? "text-pink-300" : "text-fuchsia-300"
                    }`}
                  >
                    {quotaLabel}
                  </p>
                </div>
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-fuchsia-400/30"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(217,70,239,0.45), rgba(109,40,217,0.45))",
                  }}
                >
                  <Sparkles className="h-4 w-4 text-fuchsia-300" />
                </div>
              </div>
            </div>

            {/*
              Messages
              min-h-0 מאפשר לאזור ההודעות להתכווץ מתחת לגובה התוכן שלו.
              בלעדיו, במסכים נמוכים הוא דוחף את שדה הקלט מחוץ לחלון.
            */}
            <div
              aria-label="שיחה עם TintMe AI"
              aria-live="polite"
              className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-4"
              style={{ scrollbarWidth: "none" }}
            >
              {displayMessages.map((msg, i) => (
                <div
                  className={`flex ${msg.role === "user" ? "justify-start" : "justify-end"}`}
                  key={i}
                >
                  <div
                    className={`max-w-[82%] break-words rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "rounded-tr-sm text-white"
                        : "rounded-tl-sm border border-white/10 bg-white/8 text-white/90"
                    }`}
                    dir="rtl"
                    style={
                      msg.role === "user"
                        ? { background: "linear-gradient(135deg, #7b2ff7, #d4148c)" }
                        : {}
                    }
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isLoading && (
                <div className="flex justify-end">
                  <div className="rounded-2xl rounded-tl-sm border border-white/10 bg-white/8 px-4 py-3">
                    <div className="flex h-3 items-center gap-1.5">
                      {[0, 1, 2].map((i) => (
                        <span
                          className="block h-1.5 w-1.5 rounded-full bg-fuchsia-400"
                          key={i}
                          style={{
                            animation: "typingDot 1.2s infinite ease-in-out",
                            animationDelay: `${i * 0.2}s`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Quick-action pills */}
            <div className="shrink-0 border-white/8 border-t px-4 pt-2.5 pb-2">
              <div className="flex gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: "none" }}>
                {QUICK_PILLS.map((pill) => (
                  <button
                    className="shrink-0 whitespace-nowrap rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 px-3 py-1.5 font-medium text-fuchsia-200 text-xs transition-all hover:border-fuchsia-400/55 hover:bg-fuchsia-500/22 active:scale-95 disabled:opacity-40"
                    disabled={isLoading || isExhausted}
                    key={pill}
                    onClick={() => handleSend(pill)}
                    type="button"
                  >
                    {pill}
                  </button>
                ))}
              </div>
            </div>

            {/* Text input */}
            <div className="shrink-0 px-4 pt-2 pb-4">
              <div className="flex items-center gap-2.5 rounded-2xl border border-white/15 bg-white/6 px-3 py-2 transition-colors focus-within:border-fuchsia-400/50">
                <button
                  aria-label="שלחי הודעה"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
                  disabled={!input.trim() || isLoading || isExhausted}
                  onClick={() => handleSend(input)}
                  style={{ background: "linear-gradient(135deg, #7b2ff7, #d4148c)" }}
                  type="button"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
                <input
                  aria-label="הקלידי שאלה"
                  className="min-w-0 flex-1 bg-transparent text-right text-sm text-white outline-none placeholder:text-white/30"
                  dir="rtl"
                  disabled={isExhausted}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSend(input);
                    }
                  }}
                  placeholder={isExhausted ? "נגמרו השאלות — רכשי חבילה" : "שאלי אותי הכל..."}
                  ref={inputRef}
                  type="text"
                  value={input}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Floating Action Button ────────────────────────────────────────────── */}
      <div className="fixed right-6 bottom-6 z-50 flex items-center gap-3">
        {!isOpen && (
          <div
            className="rounded-2xl border border-white/20 px-3.5 py-2 font-medium text-sm text-white backdrop-blur-md"
            dir="rtl"
            style={{
              background: "linear-gradient(135deg, rgba(167,40,230,0.75), rgba(109,40,217,0.75))",
              boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
            }}
          >
            ייעוץ שיער אונליין ✨
          </div>
        )}
        <button
          aria-label={isOpen ? "סגור עוזרת AI" : "פתחי עוזרת AI"}
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/20 text-white backdrop-blur-md transition-all duration-300 hover:scale-110 active:scale-95"
          onClick={() => setIsOpen((o) => !o)}
          style={{
            background: "linear-gradient(135deg, rgba(167,40,230,0.9), rgba(109,40,217,0.9))",
            boxShadow: "0 0 28px rgba(200,50,240,0.5), 0 8px 32px rgba(0,0,0,0.55)",
          }}
          type="button"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
        </button>
      </div>
    </>
  );
}
