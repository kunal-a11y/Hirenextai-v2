import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGetProfile } from "@workspace/api-client-react";
import { useAuthStore } from "@/hooks/use-auth";
import { useDemoStore } from "@/store/demo";
import {
  Send, Bot, User, Loader2, Sparkles, RefreshCw,
  MessageSquare, Lightbulb, Briefcase, FileText, GraduationCap
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  id: string;
}

const SUGGESTED_PROMPTS = [
  { icon: Briefcase,      text: "What jobs should I target as a BCA fresher with React and Node.js skills?" },
  { icon: FileText,       text: "How do I write a strong resume summary with no experience?" },
  { icon: GraduationCap,  text: "Which skills should I learn first to land a ₹5-8 LPA job?" },
  { icon: Lightbulb,      text: "How do I prepare for a technical interview at a product startup?" },
  { icon: Sparkles,       text: "What are the best companies hiring freshers in Bangalore right now?" },
  { icon: MessageSquare,  text: "How do I negotiate salary as a fresher with a competing offer?" },
];

function MarkdownText({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-1 text-sm leading-relaxed">
      {lines.map((line, i) => {
        if (line.startsWith("### ")) return <p key={i} className="font-bold text-white mt-2">{line.slice(4)}</p>;
        if (line.startsWith("## ")) return <p key={i} className="font-bold text-white text-base mt-2">{line.slice(3)}</p>;
        if (line.startsWith("**") && line.endsWith("**")) return <p key={i} className="font-semibold text-white">{line.slice(2, -2)}</p>;
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

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [usageRemaining, setUsageRemaining] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: profile } = useGetProfile();
  const { isDemoMode, openAuthModal } = useDemoStore();

  function authFetch(path: string, opts: RequestInit = {}) {
    const token = useAuthStore.getState().token;
    const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
    return fetch(`${base}${path}`, {
      ...opts,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...opts.headers,
      },
    });
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
      const res = await authFetch("/api/ai/chat", {
        method: "POST",
        body: JSON.stringify({
          messages: newHistory.map(m => ({ role: m.role, content: m.content })),
          userContext: {
            skills: profile?.skills ?? [],
            education: profile?.education?.map((e: any) => `${e.degree} in ${e.field}`).join(", "),
            preferredLocations: profile?.preferredLocations ?? [],
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const errMsg = data.message ?? "Failed to get a response. Please try again.";
        setMessages(prev => [...prev, { role: "assistant", content: errMsg, id: crypto.randomUUID() }]);
        return;
      }
      setMessages(prev => [...prev, { role: "assistant", content: data.reply, id: crypto.randomUUID() }]);
      if (data.usageRemaining != null) setUsageRemaining(data.usageRemaining);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Network error. Please check your connection and try again.", id: crypto.randomUUID() }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setInput("");
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-3xl">
      {/* Header */}
      <div className="glass-card p-4 mb-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600/30 to-purple-600/30 border border-indigo-500/20 flex items-center justify-center">
            <Bot className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-none">HireBot</h1>
            <p className="text-xs text-white/40 mt-0.5">AI Career Assistant · Indian job market expert</p>
          </div>
          <span className="ml-2 w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        </div>
        <div className="flex items-center gap-3">
          {usageRemaining != null && (
            <span className="text-xs text-white/40">{usageRemaining} AI credits left</span>
          )}
          {!isEmpty && (
            <button onClick={clearChat} className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white transition-colors">
              <RefreshCw className="w-3.5 h-3.5" /> New Chat
            </button>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto space-y-4 px-1 pb-4 min-h-0">
        {isEmpty ? (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="h-full flex flex-col items-center justify-center text-center px-4 py-8">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-indigo-500/20 flex items-center justify-center mb-5">
              <Bot className="w-10 h-10 text-indigo-400" />
            </div>
            <h2 className="text-xl font-bold mb-2">Hey! I'm HireBot 👋</h2>
            <p className="text-white/50 text-sm mb-8 max-w-sm">Your AI career assistant for the Indian job market. Ask me anything about jobs, resumes, interviews, or skills.</p>
            <div className="grid sm:grid-cols-2 gap-2 w-full max-w-lg">
              {SUGGESTED_PROMPTS.map(({ icon: Icon, text }) => (
                <button
                  key={text}
                  onClick={() => sendMessage(text)}
                  className="flex items-start gap-2.5 p-3 rounded-xl bg-white/[0.03] border border-white/[0.07] hover:bg-white/[0.07] hover:border-primary/30 text-left text-xs text-white/60 hover:text-white transition-all"
                >
                  <Icon className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{text}</span>
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          <>
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${msg.role === "assistant" ? "bg-gradient-to-br from-indigo-600/30 to-purple-600/30 border border-indigo-500/20" : "bg-primary/20 border border-primary/30"}`}>
                    {msg.role === "assistant"
                      ? <Bot className="w-4 h-4 text-indigo-400" />
                      : <User className="w-4 h-4 text-primary" />
                    }
                  </div>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === "assistant" ? "bg-white/[0.04] border border-white/[0.07] text-white/85 rounded-tl-sm" : "bg-primary/15 border border-primary/20 text-white rounded-tr-sm"}`}>
                    {msg.role === "assistant"
                      ? <MarkdownText text={msg.content} />
                      : <p className="text-sm leading-relaxed">{msg.content}</p>
                    }
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {loading && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-gradient-to-br from-indigo-600/30 to-purple-600/30 border border-indigo-500/20">
                  <Bot className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span className="text-xs text-white/40">HireBot is thinking...</span>
                </div>
              </motion.div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="glass-card p-3 mt-2 shrink-0">
        <div className="flex items-end gap-3">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about jobs, resume tips, interview prep, salary negotiation..."
            rows={1}
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 resize-none focus:outline-none max-h-32 min-h-[2.25rem] leading-relaxed py-1.5"
            style={{ scrollbarWidth: "none" }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="w-9 h-9 rounded-xl bg-primary hover:bg-primary/80 disabled:bg-white/5 disabled:text-white/20 text-white flex items-center justify-center transition-all shrink-0"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-xs text-white/20 mt-2 text-center">Enter to send · Shift+Enter for new line · Specialised for Indian IT job market</p>
      </div>
    </div>
  );
}
