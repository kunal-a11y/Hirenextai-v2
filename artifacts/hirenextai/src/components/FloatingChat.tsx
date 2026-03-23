import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGetProfile } from "@workspace/api-client-react";
import { useAuthStore } from "@/hooks/use-auth";
import { useDemoStore } from "@/store/demo";
import {
  MessageSquare, X, Minus, Send, Bot, User,
  Loader2, RefreshCw, Sparkles, Briefcase, FileText,
  GraduationCap, Lightbulb, Zap,
} from "lucide-react";

/* ── Types ─────────────────────────────────────────────────────────── */
interface Message {
  role: "user" | "assistant";
  content: string;
  id: string;
}

/* ── Suggested prompts ──────────────────────────────────────────────── */
const PROMPTS = [
  { icon: Briefcase,     text: "What jobs should I target as a BCA fresher?" },
  { icon: FileText,      text: "How do I write a resume with no experience?" },
  { icon: GraduationCap, text: "Which skills get me ₹5–8 LPA quickly?" },
  { icon: Lightbulb,     text: "How do I prepare for a startup interview?" },
  { icon: Sparkles,      text: "Best companies hiring freshers in Bangalore?" },
  { icon: MessageSquare, text: "How do I negotiate salary as a fresher?" },
];

/* ── Simple markdown renderer ──────────────────────────────────────── */
function MD({ text }: { text: string }) {
  return (
    <div className="space-y-1 text-sm leading-relaxed">
      {text.split("\n").map((line, i) => {
        if (line.startsWith("### ")) return <p key={i} className="font-bold text-white mt-2">{line.slice(4)}</p>;
        if (line.startsWith("## "))  return <p key={i} className="font-bold text-white text-base mt-2">{line.slice(3)}</p>;
        if (line.match(/^\*\*.+\*\*$/)) return <p key={i} className="font-semibold text-white">{line.slice(2, -2)}</p>;
        if (line.match(/^\d+\.\s/)) return <p key={i} className="ml-2">{line}</p>;
        if (line.startsWith("- ") || line.startsWith("• ")) return (
          <p key={i} className="ml-2 flex items-start gap-1.5">
            <span className="text-primary mt-0.5 shrink-0">•</span>
            <span>{line.replace(/^[-•]\s/, "")}</span>
          </p>
        );
        if (line.trim() === "") return <div key={i} className="h-1" />;
        return <p key={i}>{line}</p>;
      })}
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────────────── */
export function FloatingChat() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [usageLeft, setUsageLeft] = useState<number | null>(null);
  const [unread, setUnread] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef    = useRef<HTMLTextAreaElement>(null);

  const { data: profile } = useGetProfile();
  const { isDemoMode, openAuthModal } = useDemoStore();

  /* scroll to bottom on new messages */
  useEffect(() => {
    if (open && !minimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open, minimized]);

  /* clear unread when panel opens */
  useEffect(() => {
    if (open && !minimized) setUnread(0);
  }, [open, minimized]);

  /* auto-focus textarea when panel opens */
  useEffect(() => {
    if (open && !minimized) {
      setTimeout(() => textareaRef.current?.focus(), 300);
    }
  }, [open, minimized]);

  /* auth-aware fetch */
  const authFetch = useCallback((path: string, opts: RequestInit = {}) => {
    const token = useAuthStore.getState().token;
    const base  = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
    return fetch(`${base}${path}`, {
      ...opts,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...opts.headers,
      },
    });
  }, []);

  const sendMessage = async (text?: string) => {
    const userText = (text ?? input).trim();
    if (!userText || loading) return;
    if (isDemoMode) { openAuthModal("AI Career Chat"); return; }

    const userMsg: Message = { role: "user", content: userText, id: crypto.randomUUID() };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput("");
    setLoading(true);

    try {
      const res  = await authFetch("/api/ai/chat", {
        method: "POST",
        body: JSON.stringify({
          messages: newHistory.map(m => ({ role: m.role, content: m.content })),
          userContext: {
            skills:             profile?.skills ?? [],
            education:          profile?.education?.map((e: any) => `${e.degree} in ${e.field}`).join(", "),
            preferredLocations: profile?.preferredLocations ?? [],
          },
        }),
      });
      const data = await res.json();
      const reply = res.ok
        ? data.reply
        : (data.message ?? "Failed to get a response. Please try again.");

      setMessages(prev => [...prev, { role: "assistant", content: reply, id: crypto.randomUUID() }]);
      if (data.usageRemaining != null) setUsageLeft(data.usageRemaining);

      /* bump unread count if panel is closed/minimized */
      if (!open || minimized) setUnread(n => n + 1);
    } catch {
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: "Network error. Please check your connection.", id: crypto.randomUUID() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const isEmpty = messages.length === 0;

  return (
    <>
      {/* ── Chat panel ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <>
            {/* Mobile backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 sm:hidden"
              onClick={() => setOpen(false)}
            />

            <motion.div
              key="chat-panel"
              initial={{ opacity: 0, x: "100%", scale: 0.98 }}
              animate={minimized
                ? { opacity: 1, x: 0, scale: 1, height: "3.5rem" }
                : { opacity: 1, x: 0, scale: 1, height: "auto" }}
              exit={{ opacity: 0, x: "100%", scale: 0.98 }}
              transition={{ type: "spring", bounce: 0.12, duration: 0.4 }}
              className={[
                "fixed z-50 bottom-24 right-4",
                "w-[calc(100vw-2rem)] sm:w-[26rem]",
                minimized ? "h-14 overflow-hidden" : "max-h-[min(640px,calc(100vh-7rem))]",
                "flex flex-col",
                "glass-panel rounded-3xl overflow-hidden",
                "shadow-[0_20px_60px_rgba(0,0,0,0.5)]",
              ].join(" ")}
              style={{ border: "1px solid rgba(255,255,255,0.08)" }}
            >
              {/* Panel header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.07] shrink-0 bg-gradient-to-r from-indigo-600/10 to-purple-600/10">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600/40 to-purple-600/40 border border-indigo-500/30 flex items-center justify-center shrink-0">
                  <Bot className="w-4.5 h-4.5 text-indigo-300" style={{ width: "1.125rem", height: "1.125rem" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold leading-none text-white">HireBot</p>
                  <p className="text-[11px] text-white/40 mt-0.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block animate-pulse" />
                    AI Career Assistant
                  </p>
                </div>

                {/* Usage pill */}
                {usageLeft != null && !minimized && (
                  <span className="hidden sm:flex items-center gap-1 text-[11px] text-white/40 shrink-0">
                    <Zap className="w-3 h-3" />{usageLeft} left
                  </span>
                )}

                {/* Clear chat */}
                {!isEmpty && !minimized && (
                  <button
                    onClick={() => { setMessages([]); setInput(""); }}
                    title="New chat"
                    className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/10 transition-colors shrink-0"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Minimize */}
                <button
                  onClick={() => setMinimized(m => !m)}
                  title={minimized ? "Restore" : "Minimize"}
                  className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/10 transition-colors shrink-0"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>

                {/* Close */}
                <button
                  onClick={() => { setOpen(false); setMinimized(false); }}
                  title="Close"
                  className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/10 transition-colors shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Messages */}
              {!minimized && (
                <div
                  className="flex-1 overflow-y-auto space-y-3 p-4 min-h-0"
                  style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.08) transparent" }}
                >
                  {isEmpty ? (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col items-center text-center py-4"
                    >
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-indigo-500/20 flex items-center justify-center mb-4">
                        <Bot className="w-8 h-8 text-indigo-400" />
                      </div>
                      <h3 className="font-bold text-base mb-1">Hey! I'm HireBot 👋</h3>
                      <p className="text-white/45 text-xs mb-5 max-w-xs">AI career assistant for the Indian job market. Ask me anything!</p>
                      <div className="grid grid-cols-1 gap-1.5 w-full">
                        {PROMPTS.map(({ icon: Icon, text }) => (
                          <button
                            key={text}
                            onClick={() => sendMessage(text)}
                            className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.07] hover:border-primary/30 text-left text-xs text-white/55 hover:text-white transition-all"
                          >
                            <Icon className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span className="line-clamp-1">{text}</span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  ) : (
                    <AnimatePresence initial={false}>
                      {messages.map(msg => (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2 }}
                          className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                        >
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${msg.role === "assistant" ? "bg-gradient-to-br from-indigo-600/30 to-purple-600/30 border border-indigo-500/20" : "bg-primary/20 border border-primary/30"}`}>
                            {msg.role === "assistant"
                              ? <Bot  className="w-3.5 h-3.5 text-indigo-400" />
                              : <User className="w-3.5 h-3.5 text-primary" />
                            }
                          </div>
                          <div className={`max-w-[85%] rounded-2xl px-3 py-2.5 text-sm ${msg.role === "assistant" ? "bg-white/[0.04] border border-white/[0.07] text-white/85 rounded-tl-sm" : "bg-primary/15 border border-primary/20 text-white rounded-tr-sm"}`}>
                            {msg.role === "assistant"
                              ? <MD text={msg.content} />
                              : <p className="text-sm leading-relaxed">{msg.content}</p>
                            }
                          </div>
                        </motion.div>
                      ))}

                      {loading && (
                        <motion.div key="typing" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 bg-gradient-to-br from-indigo-600/30 to-purple-600/30 border border-indigo-500/20">
                            <Bot className="w-3.5 h-3.5 text-indigo-400" />
                          </div>
                          <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl rounded-tl-sm px-3 py-2.5 flex items-center gap-2">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                            <span className="text-xs text-white/40">Thinking...</span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}

              {/* Input */}
              {!minimized && (
                <div className="p-3 border-t border-white/[0.07] shrink-0">
                  <div className="flex items-end gap-2 bg-white/[0.04] border border-white/[0.08] rounded-2xl px-3 py-2 focus-within:border-primary/40 transition-colors">
                    <textarea
                      ref={textareaRef}
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={handleKey}
                      placeholder="Ask about jobs, resume, interviews..."
                      rows={1}
                      className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 resize-none focus:outline-none max-h-24 min-h-[1.75rem] leading-relaxed py-0.5"
                      style={{ scrollbarWidth: "none" }}
                    />
                    <button
                      onClick={() => sendMessage()}
                      disabled={!input.trim() || loading}
                      className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 hover:opacity-90 disabled:opacity-30 text-white flex items-center justify-center transition-all shrink-0 mb-0.5"
                    >
                      {loading
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Send className="w-3.5 h-3.5" />
                      }
                    </button>
                  </div>
                  <p className="text-[10px] text-white/20 mt-1.5 text-center">Enter to send · Shift+Enter for new line</p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Floating button ──────────────────────────────────────────── */}
      <div
        className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2"
        onMouseEnter={() => !open && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {/* Tooltip */}
        <AnimatePresence>
          {showTooltip && !open && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="glass-panel px-3 py-1.5 rounded-xl text-xs font-medium text-white/80 whitespace-nowrap shadow-xl border border-white/10"
            >
              We are here to help 💬
            </motion.div>
          )}
        </AnimatePresence>

        {/* Button */}
        <div className="relative">
          {/* Pulse ring — only when chat is closed */}
          {!open && (
            <span className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 opacity-40 animate-ping" />
          )}

          <button
            onClick={() => {
              setOpen(o => !o);
              setMinimized(false);
              setShowTooltip(false);
            }}
            aria-label="Open AI Chat"
            className={[
              "relative w-14 h-14 sm:w-14 sm:h-14",
              "rounded-full flex items-center justify-center",
              "bg-gradient-to-br from-indigo-600 to-purple-600",
              "shadow-[0_8px_32px_rgba(99,102,241,0.45)]",
              "hover:shadow-[0_12px_40px_rgba(99,102,241,0.6)]",
              "hover:scale-105 active:scale-95",
              "transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-indigo-500/50",
            ].join(" ")}
          >
            <AnimatePresence mode="wait">
              {open ? (
                <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.18 }}>
                  <X className="w-6 h-6 text-white" />
                </motion.span>
              ) : (
                <motion.span key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.18 }}>
                  <MessageSquare className="w-6 h-6 text-white" />
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          {/* Unread badge */}
          <AnimatePresence>
            {unread > 0 && !open && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center shadow-lg"
              >
                {unread > 9 ? "9+" : unread}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
