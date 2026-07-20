"use client";

import { Send, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

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
    if (!trimmed || isLoading) return;

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
      setChatHistory((prev) => [...prev, assistantMsg]);
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
          className="fixed bottom-[88px] left-4 right-4 z-50 sm:left-auto sm:right-6 sm:w-[380px] md:right-6"
          style={{ animation: "chatSlideUp 0.28s cubic-bezier(0.22,1,0.36,1)" }}
        >
          <div
            className="flex flex-col overflow-hidden rounded-3xl border border-white/15 shadow-2xl"
            style={{
              height: "520px",
              background: "linear-gradient(160deg, rgba(55,7,96,0.97) 0%, rgba(24,5,48,0.98) 100%)",
              boxShadow: "0 24px 64px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.06)",
              backdropFilter: "blur(24px)",
            }}
          >
            {/* Header */}
            <div
              className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3"
              style={{ background: "linear-gradient(90deg, rgba(91,33,182,0.45), rgba(112,26,117,0.3))" }}
            >
              <button
                type="button"
                aria-label="סגור צ'אט"
                onClick={() => setIsOpen(false)}
                className="rounded-full p-2 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-bold leading-tight text-white">TintMe AI</p>
                  <p className="text-xs leading-tight text-fuchsia-300">מומחית צביעת שיער</p>
                </div>
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-fuchsia-400/30"
                  style={{ background: "linear-gradient(135deg, rgba(217,70,239,0.45), rgba(109,40,217,0.45))" }}
                >
                  <Sparkles className="h-4 w-4 text-fuchsia-300" />
                </div>
              </div>
            </div>

            {/* Messages */}
            <div
              className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4"
              style={{ scrollbarWidth: "none" }}
              aria-live="polite"
              aria-label="שיחה עם TintMe AI"
            >
              {displayMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-start" : "justify-end"}`}
                >
                  <div
                    dir="rtl"
                    className={`max-w-[82%] break-words rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "rounded-tr-sm text-white"
                        : "rounded-tl-sm border border-white/10 bg-white/8 text-white/90"
                    }`}
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
                          key={i}
                          className="block h-1.5 w-1.5 rounded-full bg-fuchsia-400"
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
            <div className="shrink-0 border-t border-white/8 px-4 pb-2 pt-2.5">
              <div
                className="flex gap-2 overflow-x-auto pb-0.5"
                style={{ scrollbarWidth: "none" }}
              >
                {QUICK_PILLS.map((pill) => (
                  <button
                    key={pill}
                    type="button"
                    onClick={() => handleSend(pill)}
                    disabled={isLoading}
                    className="shrink-0 whitespace-nowrap rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 px-3 py-1.5 text-xs font-medium text-fuchsia-200 transition-all hover:border-fuchsia-400/55 hover:bg-fuchsia-500/22 active:scale-95 disabled:opacity-40"
                  >
                    {pill}
                  </button>
                ))}
              </div>
            </div>

            {/* Text input */}
            <div className="shrink-0 px-4 pb-4 pt-2">
              <div className="flex items-center gap-2.5 rounded-2xl border border-white/15 bg-white/6 px-3 py-2 transition-colors focus-within:border-fuchsia-400/50">
                <button
                  type="button"
                  aria-label="שלחי הודעה"
                  onClick={() => handleSend(input)}
                  disabled={!input.trim() || isLoading}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
                  style={{ background: "linear-gradient(135deg, #7b2ff7, #d4148c)" }}
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSend(input);
                    }
                  }}
                  placeholder="שאלי אותי הכל..."
                  dir="rtl"
                  aria-label="הקלידי שאלה"
                  className="min-w-0 flex-1 bg-transparent text-right text-sm text-white outline-none placeholder:text-white/30"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Floating Action Button ────────────────────────────────────────────── */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
        {!isOpen && (
          <div
            dir="rtl"
            className="rounded-2xl border border-white/20 px-3.5 py-2 text-sm font-medium text-white backdrop-blur-md"
            style={{
              background: "linear-gradient(135deg, rgba(167,40,230,0.75), rgba(109,40,217,0.75))",
              boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
            }}
          >
            ייעוץ שיער אונליין ✨
          </div>
        )}
        <button
          type="button"
          aria-label={isOpen ? "סגור עוזרת AI" : "פתחי עוזרת AI"}
          onClick={() => setIsOpen((o) => !o)}
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/20 text-white backdrop-blur-md transition-all duration-300 hover:scale-110 active:scale-95"
          style={{
            background: "linear-gradient(135deg, rgba(167,40,230,0.9), rgba(109,40,217,0.9))",
            boxShadow: "0 0 28px rgba(200,50,240,0.5), 0 8px 32px rgba(0,0,0,0.55)",
          }}
        >
          {isOpen ? <X className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
        </button>
      </div>
    </>
  );
}
