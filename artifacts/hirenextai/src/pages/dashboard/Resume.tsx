import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGetProfile } from "@workspace/api-client-react";
import { useAuthStore } from "@/hooks/use-auth";
import { useDemoStore } from "@/store/demo";
import {
  Upload, Sparkles, FileText, Download, CheckCircle2, AlertCircle,
  Loader2, BarChart3, Lightbulb, Target, IndianRupee, Star,
  Code, GraduationCap, Briefcase, Award, ChevronRight,
  RefreshCw
} from "lucide-react";

type Tab = "analyze" | "generate";

interface ResumeAnalysis {
  strengthScore: number;
  overallFeedback: string;
  strengths: string[];
  improvements: string[];
  missingSkills: string[];
  recommendedRoles: string[];
  salaryRange: { min: number; max: number };
  atsScore: number;
  keywordsFound: string[];
  formatTips: string[];
}

interface GeneratedResume {
  name: string;
  contactInfo: { email: string; phone: string; location: string };
  summary: string;
  skills: string[];
  education: Array<{ institution: string; degree: string; field: string; year: string }>;
  experience: Array<{ company: string; role: string; duration: string; bullets: string[] }>;
  internships: Array<{ company: string; role: string; duration: string; bullets: string[] }>;
  certifications: Array<{ name: string; issuer: string; year: string }>;
  projects: Array<{ name: string; description: string; tech: string[] }>;
  languages: string[];
}

function ScoreRing({ score, label, color }: { score: number; label: string; color: string }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative w-24 h-24">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 88 88">
          <circle cx="44" cy="44" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
          <circle cx="44" cy="44" r={r} fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s ease" }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold text-white">{score}</span>
        </div>
      </div>
      <p className="text-xs text-white/50 font-medium">{label}</p>
    </div>
  );
}

function ResumePreview({ resume, isPaid }: { resume: GeneratedResume; isPaid: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    const { default: jsPDF } = await import("jspdf");
    const { default: html2canvas } = await import("html2canvas");
    if (!ref.current) return;
    const canvas = await html2canvas(ref.current, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = (canvas.height * pdfW) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfW, pdfH);
    pdf.save(`${resume.name?.replace(/\s+/g, "_") ?? "resume"}_HirenextAI.pdf`);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" /> Resume Preview
        </h3>
        <button onClick={handleDownload} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/80 transition-colors">
          <Download className="w-4 h-4" /> Download PDF
        </button>
      </div>

      <div ref={ref} className="bg-white text-gray-900 rounded-xl p-8 text-sm leading-relaxed shadow-xl font-sans">
        <div className="border-b-2 border-indigo-600 pb-4 mb-5">
          <h1 className="text-2xl font-bold text-indigo-700 mb-1">{resume.name}</h1>
          <div className="flex flex-wrap gap-4 text-gray-600 text-xs">
            {resume.contactInfo?.email && <span>✉ {resume.contactInfo.email}</span>}
            {resume.contactInfo?.phone && <span>📞 {resume.contactInfo.phone}</span>}
            {resume.contactInfo?.location && <span>📍 {resume.contactInfo.location}</span>}
          </div>
        </div>

        {resume.summary && (
          <div className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-2 border-b border-gray-200 pb-1">Professional Summary</h2>
            <p className="text-gray-700">{resume.summary}</p>
          </div>
        )}

        {(resume.skills?.length ?? 0) > 0 && (
          <div className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-2 border-b border-gray-200 pb-1">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {resume.skills.map((s, i) => (
                <span key={i} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs border border-indigo-100">{s}</span>
              ))}
            </div>
          </div>
        )}

        {(resume.education?.length ?? 0) > 0 && (
          <div className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-2 border-b border-gray-200 pb-1">Education</h2>
            {resume.education.map((e, i) => (
              <div key={i} className="mb-2">
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-800">{e.degree} in {e.field}</span>
                  <span className="text-gray-500 text-xs">{e.year}</span>
                </div>
                <p className="text-gray-600">{e.institution}</p>
              </div>
            ))}
          </div>
        )}

        {(resume.experience?.length ?? 0) > 0 && (
          <div className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-2 border-b border-gray-200 pb-1">Work Experience</h2>
            {resume.experience.map((e, i) => (
              <div key={i} className="mb-3">
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-800">{e.role}</span>
                  <span className="text-gray-500 text-xs">{e.duration}</span>
                </div>
                <p className="text-gray-600 mb-1">{e.company}</p>
                <ul className="list-disc list-inside text-gray-700 space-y-0.5">
                  {e.bullets?.map((b, j) => <li key={j}>{b}</li>)}
                </ul>
              </div>
            ))}
          </div>
        )}

        {(resume.internships?.length ?? 0) > 0 && (
          <div className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-2 border-b border-gray-200 pb-1">Internships</h2>
            {resume.internships.map((e, i) => (
              <div key={i} className="mb-3">
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-800">{e.role}</span>
                  <span className="text-gray-500 text-xs">{e.duration}</span>
                </div>
                <p className="text-gray-600 mb-1">{e.company}</p>
                <ul className="list-disc list-inside text-gray-700 space-y-0.5">
                  {e.bullets?.map((b, j) => <li key={j}>{b}</li>)}
                </ul>
              </div>
            ))}
          </div>
        )}

        {(resume.projects?.length ?? 0) > 0 && (
          <div className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-2 border-b border-gray-200 pb-1">Projects</h2>
            {resume.projects.map((p, i) => (
              <div key={i} className="mb-2">
                <span className="font-semibold text-gray-800">{p.name}</span>
                {p.tech?.length > 0 && <span className="text-gray-500 text-xs ml-2">({p.tech.join(", ")})</span>}
                <p className="text-gray-700">{p.description}</p>
              </div>
            ))}
          </div>
        )}

        {(resume.certifications?.length ?? 0) > 0 && (
          <div className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-2 border-b border-gray-200 pb-1">Certifications</h2>
            {resume.certifications.map((c, i) => (
              <div key={i} className="flex justify-between">
                <span className="font-medium text-gray-800">{c.name} — <span className="text-gray-600">{c.issuer}</span></span>
                <span className="text-gray-500 text-xs">{c.year}</span>
              </div>
            ))}
          </div>
        )}

        {(resume.languages?.length ?? 0) > 0 && (
          <div className="mb-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-2 border-b border-gray-200 pb-1">Languages</h2>
            <p className="text-gray-700">{resume.languages.join(" · ")}</p>
          </div>
        )}

        {!isPaid && (
          <div className="border-t border-gray-200 pt-3 mt-4 text-center text-xs text-gray-400">
            Resume generated using <span className="text-indigo-500 font-medium">HirenextAI.com</span> · Upgrade to Pro to remove branding
          </div>
        )}
      </div>
    </div>
  );
}

export default function Resume() {
  const [tab, setTab] = useState<Tab>("analyze");
  const [resumeText, setResumeText] = useState("");
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [generatedResume, setGeneratedResume] = useState<GeneratedResume | null>(null);
  const [isPaid, setIsPaid] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const { data: profile } = useGetProfile();
  const { isDemoMode, openAuthModal } = useDemoStore();

  function authFetch(path: string, opts: RequestInit = {}) {
    const token = useAuthStore.getState().token;
    const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
    return fetch(`${base}${path}`, {
      ...opts,
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...opts.headers },
    });
  }

  const handleAnalyze = async () => {
    if (isDemoMode) { openAuthModal("Analyze Resume"); return; }
    if (resumeText.trim().length < 50) { setError("Please paste at least 50 characters of your resume text."); return; }
    setError("");
    setAnalyzing(true);
    try {
      const res = await authFetch("/api/resume/analyze", { method: "POST", body: JSON.stringify({ resumeText }) });
      const data = await res.json();
      if (!res.ok) { setError(data.message ?? "Analysis failed."); return; }
      setAnalysis(data.analysis);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGenerate = async () => {
    if (isDemoMode) { openAuthModal("Build Resume with AI"); return; }
    setError("");
    setGenerating(true);
    try {
      const res = await authFetch("/api/resume/generate", { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setError(data.message ?? "Generation failed."); return; }
      setGeneratedResume(data.resume);
      setIsPaid(data.isPaid);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const profileCompletePct = profile?.completionPct ?? 0;

  return (
    <div className="max-w-4xl space-y-6">
      <div className="glass-card p-6">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600/30 to-purple-600/30 border border-indigo-500/20 flex items-center justify-center">
            <FileText className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold">AI Resume Studio</h1>
            <p className="text-white/50 text-sm">Analyze your resume or build a professional one with AI</p>
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          {([
            { id: "analyze", label: "Upload & Analyze", icon: BarChart3 },
            { id: "generate", label: "Build with AI", icon: Sparkles },
          ] as const).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                tab === id
                  ? "bg-primary text-white shadow-[0_4px_12px_rgba(99,102,241,0.4)]"
                  : "bg-white/5 text-white/60 hover:text-white hover:bg-white/10"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {tab === "analyze" && (
          <motion.div key="analyze" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-5">
            <div className="glass-card p-6">
              <h2 className="font-bold text-lg mb-1 flex items-center gap-2"><Upload className="w-5 h-5 text-primary" /> Paste Your Resume</h2>
              <p className="text-sm text-white/50 mb-4">Paste the text content of your resume below. Our AI will scan and give you a detailed review.</p>
              <textarea
                value={resumeText}
                onChange={e => setResumeText(e.target.value)}
                className="input-field w-full min-h-[200px] resize-y text-sm font-mono"
                placeholder="Paste your resume text here... (education, skills, work experience, projects, certifications, etc.)"
              />
              {error && <p className="text-red-400 text-sm mt-2 flex items-center gap-1.5"><AlertCircle className="w-4 h-4" />{error}</p>}
              <div className="flex items-center justify-between mt-4">
                <p className="text-xs text-white/30">{resumeText.length} characters</p>
                <button
                  onClick={handleAnalyze}
                  disabled={analyzing || resumeText.trim().length < 50}
                  className="btn-primary gap-2 px-6 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {analyzing ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</> : <><Sparkles className="w-4 h-4" /> Analyze Resume</>}
                </button>
              </div>
            </div>

            {analysis && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <div className="glass-card p-6">
                  <h3 className="font-bold text-lg mb-5 flex items-center gap-2"><Star className="w-5 h-5 text-amber-400" /> Resume Scores</h3>
                  <div className="flex flex-wrap justify-center gap-8 mb-5">
                    <ScoreRing score={analysis.strengthScore} label="Overall Strength" color="#6366f1" />
                    <ScoreRing score={analysis.atsScore} label="ATS Score" color="#10b981" />
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-white/80 text-sm leading-relaxed">{analysis.overallFeedback}</p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="glass-card p-5">
                    <h4 className="font-semibold mb-3 flex items-center gap-2 text-emerald-400"><CheckCircle2 className="w-4 h-4" /> Strengths</h4>
                    <ul className="space-y-2">
                      {analysis.strengths.map((s, i) => <li key={i} className="flex items-start gap-2 text-sm text-white/70"><span className="text-emerald-400 mt-0.5">✓</span>{s}</li>)}
                    </ul>
                  </div>
                  <div className="glass-card p-5">
                    <h4 className="font-semibold mb-3 flex items-center gap-2 text-amber-400"><Lightbulb className="w-4 h-4" /> Improvements</h4>
                    <ul className="space-y-2">
                      {analysis.improvements.map((s, i) => <li key={i} className="flex items-start gap-2 text-sm text-white/70"><span className="text-amber-400 mt-0.5">→</span>{s}</li>)}
                    </ul>
                  </div>
                  <div className="glass-card p-5">
                    <h4 className="font-semibold mb-3 flex items-center gap-2 text-red-400"><Code className="w-4 h-4" /> Missing Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysis.missingSkills.map((s, i) => <span key={i} className="px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">{s}</span>)}
                    </div>
                  </div>
                  <div className="glass-card p-5">
                    <h4 className="font-semibold mb-3 flex items-center gap-2 text-primary"><Target className="w-4 h-4" /> Recommended Roles</h4>
                    <ul className="space-y-1.5">
                      {analysis.recommendedRoles.map((r, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-white/70">
                          <ChevronRight className="w-3.5 h-3.5 text-primary" />{r}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="glass-card p-5">
                  <h4 className="font-semibold mb-3 flex items-center gap-2"><IndianRupee className="w-4 h-4 text-green-400" /> Estimated Salary Range</h4>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-green-400">₹{analysis.salaryRange.min}L</span>
                    <span className="text-white/40">—</span>
                    <span className="text-2xl font-bold text-green-400">₹{analysis.salaryRange.max}L</span>
                    <span className="text-white/40 text-sm">per annum</span>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="glass-card p-5">
                    <h4 className="font-semibold mb-3 text-sm text-white/70">Keywords Found</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysis.keywordsFound.map((k, i) => <span key={i} className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs">{k}</span>)}
                    </div>
                  </div>
                  <div className="glass-card p-5">
                    <h4 className="font-semibold mb-3 text-sm text-white/70">Format Tips</h4>
                    <ul className="space-y-1.5">
                      {analysis.formatTips.map((t, i) => <li key={i} className="text-xs text-white/60 flex items-start gap-1.5"><span className="text-primary mt-0.5">•</span>{t}</li>)}
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {tab === "generate" && (
          <motion.div key="generate" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-5">
            {!generatedResume ? (
              <div className="glass-card p-8 text-center">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-indigo-500/20 flex items-center justify-center mx-auto mb-5">
                  <Sparkles className="w-10 h-10 text-indigo-400" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Build Your Resume with AI</h2>
                <p className="text-white/50 mb-2 max-w-md mx-auto">AI will generate a professional, ATS-optimized resume using your profile data.</p>

                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6">
                  <div className={`w-2 h-2 rounded-full ${profileCompletePct >= 60 ? "bg-green-400" : profileCompletePct >= 30 ? "bg-amber-400" : "bg-red-400"}`} />
                  <span className="text-sm text-white/60">Profile {profileCompletePct}% complete</span>
                </div>

                {profileCompletePct < 30 && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6 text-left max-w-md mx-auto">
                    <p className="text-amber-400 text-sm font-medium mb-1">⚠ Low profile completion</p>
                    <p className="text-amber-400/70 text-xs">For a better resume, complete your profile first — add skills, education, and experience.</p>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8 max-w-lg mx-auto text-left">
                  {[
                    { icon: GraduationCap, label: "Education", done: (profile?.education?.length ?? 0) > 0 },
                    { icon: Briefcase, label: "Experience", done: (profile?.experience?.length ?? 0) > 0 },
                    { icon: Code, label: "Skills", done: (profile?.skills?.length ?? 0) > 0 },
                    { icon: Award, label: "Certifications", done: (profile?.certifications?.length ?? 0) > 0 },
                  ].map(({ icon: Icon, label, done }) => (
                    <div key={label} className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-xs ${done ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-white/5 border-white/10 text-white/40"}`}>
                      <Icon className="w-5 h-5" />
                      <span>{label}</span>
                      {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : <div className="w-3.5 h-3.5 rounded-full border border-white/20" />}
                    </div>
                  ))}
                </div>

                {error && <p className="text-red-400 text-sm mb-4 flex items-center justify-center gap-1.5"><AlertCircle className="w-4 h-4" />{error}</p>}

                <button onClick={handleGenerate} disabled={generating} className="btn-primary gap-2 px-8 py-3 text-base disabled:opacity-50">
                  {generating ? <><Loader2 className="w-5 h-5 animate-spin" /> Generating Resume...</> : <><Sparkles className="w-5 h-5" /> Generate My Resume</>}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-green-400 font-semibold">
                    <CheckCircle2 className="w-5 h-5" /> Resume generated successfully!
                  </div>
                  <button onClick={() => { setGeneratedResume(null); setError(""); }} className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors">
                    <RefreshCw className="w-4 h-4" /> Regenerate
                  </button>
                </div>
                <ResumePreview resume={generatedResume} isPaid={isPaid} />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
