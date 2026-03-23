import { useState } from "react";
import { useDemoStore } from "@/store/demo";
import {
  FileText, MessageSquare, FileCheck2, Presentation,
  Loader2, Copy, CheckCircle2, ArrowLeft, Sparkles, Lock, Crown,
} from "lucide-react";
import {
  useGenerateCoverLetter, useGenerateRecruiterMessage,
  useOptimizeResumeBullet, useGenerateInterviewPrep, useGetAIUsage,
} from "@workspace/api-client-react";
import type { FeatureUsage } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";
import { UpgradeModal } from "@/components/UpgradeModal";

type ToolId = "cover-letter" | "recruiter" | "resume" | "interview";

interface ToolDef {
  id: ToolId;
  featureKey: string;
  icon: React.ElementType;
  title: string;
  desc: string;
  proOnly?: boolean;
}

const TOOLS: ToolDef[] = [
  { id: "cover-letter", featureKey: "cover-letter",      icon: FileText,       title: "Cover Letter Generator",  desc: "Craft personalized cover letters tailored to specific job descriptions." },
  { id: "recruiter",   featureKey: "recruiter-message",  icon: MessageSquare,  title: "Recruiter Outreach",      desc: "Generate professional LinkedIn messages to reach hiring managers.", proOnly: true },
  { id: "resume",      featureKey: "resume-optimize",    icon: FileCheck2,     title: "Resume Bullet Optimizer", desc: "Rewrite experience bullets to be impactful, ATS-friendly, and results-driven." },
  { id: "interview",   featureKey: "interview-prep",     icon: Presentation,   title: "Interview Prep",          desc: "Get custom interview questions, strategies, and talking points for any role.", proOnly: true },
];

/* ── Usage chip ─────────────────────────────────────────────────────── */
function UsageChip({ feature, proOnly }: { feature?: FeatureUsage; proOnly?: boolean }) {
  if (proOnly || feature?.proOnly) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">
        <Crown className="w-3 h-3" /> Pro
      </span>
    );
  }
  if (!feature) return null;
  if (feature.limit === -1) {
    return <span className="text-xs text-indigo-400 font-medium">Unlimited</span>;
  }
  const pct = feature.limit > 0 ? (feature.used / feature.limit) * 100 : 100;
  const color = pct >= 100 ? "text-red-400" : pct >= 70 ? "text-amber-400" : "text-white/40";
  return (
    <span className={`text-xs font-medium ${color}`}>
      {feature.remaining === 0
        ? "Limit reached"
        : `${feature.remaining} of ${feature.limit} left`}
    </span>
  );
}

/* ── Main component ─────────────────────────────────────────────────── */
export default function AITools() {
  const [activeTool, setActiveTool] = useState<ToolId | null>(null);
  const { data: usage } = useGetAIUsage();

  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeCtx, setUpgradeCtx] = useState<{ label?: string; proOnly?: boolean; message?: string }>({});

  const openUpgrade = (label?: string, proOnly?: boolean, message?: string) => {
    setUpgradeCtx({ label, proOnly, message });
    setUpgradeOpen(true);
  };

  const resetDate = usage?.resetDate
    ? new Date(usage.resetDate).toLocaleDateString("en-IN", { month: "long", day: "numeric" })
    : "the 1st";

  return (
    <div className="h-full flex flex-col">
      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        featureLabel={upgradeCtx.label}
        isProOnly={upgradeCtx.proOnly}
        message={upgradeCtx.message}
      />

      <AnimatePresence mode="wait">
        {!activeTool ? (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -10 }}
          >
            {/* Header info */}
            <div className="glass-card p-5 mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-white/50">
                  <span className="capitalize text-white/75 font-medium">{usage?.plan ?? "Free"} plan</span>
                  {" · "}Limits reset on {resetDate}
                </p>
              </div>
              {usage?.plan === "free" && (
                <button
                  onClick={() => openUpgrade(undefined, false)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold hover:bg-indigo-500/20 transition-colors"
                >
                  <Crown className="w-3.5 h-3.5" /> Upgrade to Pro
                </button>
              )}
            </div>

            {/* Tool grid */}
            <div className="grid md:grid-cols-2 gap-5">
              {TOOLS.map(tool => {
                const feature = usage?.features?.[tool.featureKey];
                const isLocked = feature?.proOnly || tool.proOnly;
                const isExhausted = !isLocked && feature && feature.limit !== -1 && feature.remaining === 0;

                return (
                  <button
                    key={tool.id}
                    onClick={() => {
                      if (isLocked) {
                        openUpgrade(tool.title, true);
                        return;
                      }
                      if (isExhausted) {
                        openUpgrade(feature?.label ?? tool.title, false);
                        return;
                      }
                      setActiveTool(tool.id);
                    }}
                    className="glass-card p-7 text-left hover:-translate-y-1 transition-all group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-purple-500/0 group-hover:from-primary/10 group-hover:to-purple-500/5 transition-all duration-300" />

                    {/* Lock overlay for Pro-only */}
                    {isLocked && (
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] rounded-2xl flex items-center justify-center z-20">
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                            <Lock className="w-5 h-5 text-amber-400" />
                          </div>
                          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Pro Feature</span>
                        </div>
                      </div>
                    )}

                    <div className="relative z-10 flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-primary/30 transition-colors ${isExhausted ? "opacity-50" : ""}`}>
                        <tool.icon className="w-6 h-6 text-primary" />
                      </div>
                      <UsageChip feature={feature} proOnly={isLocked} />
                    </div>

                    <h3 className={`text-lg font-bold mb-2 relative z-10 ${isExhausted ? "opacity-50" : ""}`}>{tool.title}</h3>
                    <p className={`text-white/50 text-sm relative z-10 leading-relaxed mb-4 ${isExhausted ? "opacity-50" : ""}`}>{tool.desc}</p>

                    {!isLocked && !isExhausted && (
                      <div className="flex items-center gap-1.5 text-xs text-primary font-medium relative z-10">
                        <Sparkles className="w-3.5 h-3.5" /> Try now
                      </div>
                    )}
                    {isExhausted && (
                      <div className="flex items-center gap-1.5 text-xs text-amber-400 font-medium relative z-10">
                        <Crown className="w-3.5 h-3.5" /> Upgrade to continue
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Free plan summary bar */}
            {usage?.plan === "free" && usage.features && (
              <div className="mt-6 glass-card p-5">
                <h4 className="text-sm font-semibold text-white/60 mb-4 uppercase tracking-wider">This month's usage</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(usage.features)
                    .filter(([, f]) => !f.proOnly && f.limit !== -1)
                    .map(([key, f]) => {
                      const pct = f.limit > 0 ? Math.min((f.used / f.limit) * 100, 100) : 0;
                      return (
                        <div key={key}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs text-white/50 truncate">{f.label}</span>
                            <span className={`text-xs font-bold ${f.remaining === 0 ? "text-red-400" : "text-white/70"}`}>{f.used}/{f.limit}</span>
                          </div>
                          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${pct >= 100 ? "bg-red-500" : pct >= 70 ? "bg-amber-500" : "bg-indigo-500"}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="tool"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="flex-1 flex flex-col min-h-0"
          >
            <button
              onClick={() => setActiveTool(null)}
              className="flex items-center gap-2 text-sm text-white/50 hover:text-white mb-6 self-start transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to AI Tools
            </button>
            <div className="flex-1 min-h-0">
              {activeTool === "cover-letter" && <CoverLetterTool onLimitReached={openUpgrade} />}
              {activeTool === "recruiter"    && <RecruiterTool onLimitReached={openUpgrade} />}
              {activeTool === "resume"       && <ResumeTool onLimitReached={openUpgrade} />}
              {activeTool === "interview"    && <InterviewTool onLimitReached={openUpgrade} />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Shared Output Panel ─────────────────────────────────────────────── */
function OutputPanel({ content, label = "Generated Result" }: { content: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(content); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div className="glass-card p-6 flex flex-col bg-black/20 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-white/80">{label}</h3>
        {content && (
          <button onClick={copy} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/50 hover:text-white">
            {copied ? <CheckCircle2 className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
          </button>
        )}
      </div>
      <div className="flex-1 p-4 rounded-xl bg-white/5 border border-white/5 overflow-y-auto whitespace-pre-wrap text-sm text-white/80 leading-relaxed min-h-[280px]">
        {content || <span className="text-white/25 italic">Your AI-generated content will appear here...</span>}
      </div>
    </div>
  );
}

type OnLimitReached = (label?: string, proOnly?: boolean, message?: string) => void;

/* ── Cover Letter ────────────────────────────────────────────────────── */
function CoverLetterTool({ onLimitReached }: { onLimitReached: OnLimitReached }) {
  const [form, setForm] = useState({ jobTitle: "", company: "", jobDescription: "", userSkills: "" });
  const [result, setResult] = useState("");
  const { isDemoMode, openAuthModal } = useDemoStore();

  const mut = useGenerateCoverLetter({
    mutation: {
      onSuccess: d => setResult(d.content),
      onError: (err: any) => {
        if (err.status === 402) {
          onLimitReached(err.data?.featureLabel ?? "Cover Letters", false, err.data?.message);
        }
      },
    },
  });

  return (
    <div className="grid lg:grid-cols-2 gap-6 h-full">
      <div className="glass-card p-6 flex flex-col">
        <h3 className="font-bold text-lg mb-6 flex items-center gap-2"><FileText className="text-primary w-5 h-5" /> Cover Letter</h3>
        <div className="space-y-4 flex-1">
          <div>
            <label className="block text-sm text-white/60 mb-1.5">Job Title *</label>
            <input value={form.jobTitle} onChange={e => setForm({...form, jobTitle: e.target.value})} className="input-field py-2.5" placeholder="e.g. Senior Frontend Engineer" />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1.5">Company *</label>
            <input value={form.company} onChange={e => setForm({...form, company: e.target.value})} className="input-field py-2.5" placeholder="e.g. Google" />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1.5">Your Key Skills</label>
            <input value={form.userSkills} onChange={e => setForm({...form, userSkills: e.target.value})} className="input-field py-2.5" placeholder="React, TypeScript, Node.js" />
          </div>
          <div className="flex-1 flex flex-col">
            <label className="block text-sm text-white/60 mb-1.5">Job Description</label>
            <textarea value={form.jobDescription} onChange={e => setForm({...form, jobDescription: e.target.value})} className="input-field flex-1 min-h-[140px] resize-none" placeholder="Paste the job description..." />
          </div>
        </div>
        <button
          onClick={() => {
            if (isDemoMode) { openAuthModal("AI Cover Letter Generator"); return; }
            mut.mutate({ data: { jobTitle: form.jobTitle, company: form.company, jobDescription: form.jobDescription, userSkills: form.userSkills.split(",").map(s => s.trim()) } });
          }}
          disabled={mut.isPending || !form.jobTitle || !form.company}
          className="btn-primary w-full mt-5 gap-2"
        >
          {mut.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Sparkles className="w-4 h-4" /> Generate</>}
        </button>
      </div>
      <OutputPanel content={result} label="Cover Letter" />
    </div>
  );
}

/* ── Recruiter Outreach ──────────────────────────────────────────────── */
function RecruiterTool({ onLimitReached }: { onLimitReached: OnLimitReached }) {
  const [form, setForm] = useState({ jobTitle: "", company: "", recruiterName: "", userSkills: "" });
  const [result, setResult] = useState("");
  const { isDemoMode, openAuthModal } = useDemoStore();

  const mut = useGenerateRecruiterMessage({
    mutation: {
      onSuccess: d => setResult(d.content),
      onError: (err: any) => {
        if (err.status === 402) {
          onLimitReached(err.data?.featureLabel ?? "Recruiter Outreach", err.data?.limit === 0, err.data?.message);
        }
      },
    },
  });

  return (
    <div className="grid lg:grid-cols-2 gap-6 h-full">
      <div className="glass-card p-6 flex flex-col">
        <h3 className="font-bold text-lg mb-6 flex items-center gap-2"><MessageSquare className="text-primary w-5 h-5" /> Recruiter Outreach</h3>
        <div className="space-y-4 flex-1">
          <div>
            <label className="block text-sm text-white/60 mb-1.5">Target Role *</label>
            <input value={form.jobTitle} onChange={e => setForm({...form, jobTitle: e.target.value})} className="input-field py-2.5" placeholder="e.g. Product Manager" />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1.5">Company *</label>
            <input value={form.company} onChange={e => setForm({...form, company: e.target.value})} className="input-field py-2.5" placeholder="e.g. Flipkart" />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1.5">Recruiter Name (Optional)</label>
            <input value={form.recruiterName} onChange={e => setForm({...form, recruiterName: e.target.value})} className="input-field py-2.5" placeholder="e.g. Priya Sharma" />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1.5">Your Key Skills</label>
            <input value={form.userSkills} onChange={e => setForm({...form, userSkills: e.target.value})} className="input-field py-2.5" placeholder="Product strategy, SQL, Figma" />
          </div>
        </div>
        <button
          onClick={() => {
            if (isDemoMode) { openAuthModal("Recruiter Outreach Generator"); return; }
            mut.mutate({ data: { jobTitle: form.jobTitle, company: form.company, recruiterName: form.recruiterName || null, userSkills: form.userSkills.split(",").map(s => s.trim()) } });
          }}
          disabled={mut.isPending || !form.jobTitle || !form.company}
          className="btn-primary w-full mt-5 gap-2"
        >
          {mut.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <><MessageSquare className="w-4 h-4" /> Generate</>}
        </button>
      </div>
      <OutputPanel content={result} label="Outreach Message" />
    </div>
  );
}

/* ── Resume Optimizer ────────────────────────────────────────────────── */
function ResumeTool({ onLimitReached }: { onLimitReached: OnLimitReached }) {
  const [form, setForm] = useState({ bullet: "", jobTitle: "", targetRole: "" });
  const [result, setResult] = useState("");
  const { isDemoMode, openAuthModal } = useDemoStore();

  const mut = useOptimizeResumeBullet({
    mutation: {
      onSuccess: d => setResult(d.content),
      onError: (err: any) => {
        if (err.status === 402) {
          onLimitReached(err.data?.featureLabel ?? "Resume Reviews", false, err.data?.message);
        }
      },
    },
  });

  return (
    <div className="grid lg:grid-cols-2 gap-6 h-full">
      <div className="glass-card p-6 flex flex-col">
        <h3 className="font-bold text-lg mb-6 flex items-center gap-2"><FileCheck2 className="text-primary w-5 h-5" /> Resume Optimizer</h3>
        <div className="space-y-4 flex-1">
          <div>
            <label className="block text-sm text-white/60 mb-1.5">Your Current Bullet *</label>
            <textarea value={form.bullet} onChange={e => setForm({...form, bullet: e.target.value})} className="input-field min-h-[100px] resize-none" placeholder="e.g. Worked on improving website performance and fixing bugs" />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1.5">Current/Previous Role *</label>
            <input value={form.jobTitle} onChange={e => setForm({...form, jobTitle: e.target.value})} className="input-field py-2.5" placeholder="e.g. Frontend Developer" />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1.5">Target Role</label>
            <input value={form.targetRole} onChange={e => setForm({...form, targetRole: e.target.value})} className="input-field py-2.5" placeholder="e.g. Senior Frontend Engineer" />
          </div>
        </div>
        <button
          onClick={() => {
            if (isDemoMode) { openAuthModal("Resume Bullet Optimizer"); return; }
            mut.mutate({ data: { bullet: form.bullet, jobTitle: form.jobTitle, targetRole: form.targetRole } });
          }}
          disabled={mut.isPending || !form.bullet || !form.jobTitle}
          className="btn-primary w-full mt-5 gap-2"
        >
          {mut.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Sparkles className="w-4 h-4" /> Optimize</>}
        </button>
      </div>
      <OutputPanel content={result} label="Optimized Bullets" />
    </div>
  );
}

/* ── Interview Prep ──────────────────────────────────────────────────── */
function InterviewTool({ onLimitReached }: { onLimitReached: OnLimitReached }) {
  const [form, setForm] = useState({ jobTitle: "", company: "", jobDescription: "" });
  const [result, setResult] = useState("");
  const { isDemoMode, openAuthModal } = useDemoStore();

  const mut = useGenerateInterviewPrep({
    mutation: {
      onSuccess: d => setResult(d.content),
      onError: (err: any) => {
        if (err.status === 402) {
          onLimitReached(err.data?.featureLabel ?? "Interview Prep", err.data?.limit === 0, err.data?.message);
        }
      },
    },
  });

  return (
    <div className="grid lg:grid-cols-2 gap-6 h-full">
      <div className="glass-card p-6 flex flex-col">
        <h3 className="font-bold text-lg mb-6 flex items-center gap-2"><Presentation className="text-primary w-5 h-5" /> Interview Prep</h3>
        <div className="space-y-4 flex-1">
          <div>
            <label className="block text-sm text-white/60 mb-1.5">Job Title *</label>
            <input value={form.jobTitle} onChange={e => setForm({...form, jobTitle: e.target.value})} className="input-field py-2.5" placeholder="e.g. Data Scientist" />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1.5">Company *</label>
            <input value={form.company} onChange={e => setForm({...form, company: e.target.value})} className="input-field py-2.5" placeholder="e.g. Swiggy" />
          </div>
          <div className="flex-1 flex flex-col">
            <label className="block text-sm text-white/60 mb-1.5">Job Description (Optional)</label>
            <textarea value={form.jobDescription} onChange={e => setForm({...form, jobDescription: e.target.value})} className="input-field flex-1 min-h-[140px] resize-none" placeholder="Paste the job description for more targeted prep..." />
          </div>
        </div>
        <button
          onClick={() => {
            if (isDemoMode) { openAuthModal("Interview Prep Generator"); return; }
            mut.mutate({ data: { jobTitle: form.jobTitle, company: form.company, jobDescription: form.jobDescription } });
          }}
          disabled={mut.isPending || !form.jobTitle || !form.company}
          className="btn-primary w-full mt-5 gap-2"
        >
          {mut.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Sparkles className="w-4 h-4" /> Prepare Me</>}
        </button>
      </div>
      <OutputPanel content={result} label="Interview Prep Guide" />
    </div>
  );
}
