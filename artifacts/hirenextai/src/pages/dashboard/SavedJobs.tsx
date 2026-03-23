import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bookmark, Trash2, ExternalLink, MapPin, Building2, Briefcase,
  IndianRupee, Clock, Loader2, Star, SlidersHorizontal, X,
  FileText, Sparkles, Search, GraduationCap, Wifi
} from "lucide-react";
import { useAuthStore } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useDemoStore } from "@/store/demo";
import { format } from "date-fns";

const API = import.meta.env.VITE_API_URL ?? "/api";

interface SavedJobEntry {
  id: number;
  jobId: number;
  notes: string | null;
  savedAt: string;
  job: {
    id: number;
    title: string;
    company: string;
    location: string;
    type: string;
    salaryMin: number | null;
    salaryMax: number | null;
    skills: string[];
    isFresher: boolean;
    isRemote: boolean;
    applyUrl: string | null;
    postedAt: string;
    matchScore?: number;
    source?: string | null;
  };
}

function formatSalary(min?: number | null, max?: number | null) {
  if (!min && !max) return "";
  const toL = (n: number) => `${(n / 100000).toFixed(1)}L`;
  if (min && max) return `${toL(min)}–${toL(max)} PA`;
  if (min) return `${toL(min)}+ PA`;
  return `Up to ${toL(max!)} PA`;
}

function MatchPill({ score }: { score: number }) {
  if (score >= 80) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/25 text-[11px] font-semibold"><Star className="w-2.5 h-2.5 fill-green-400" />{score}% Match</span>;
  if (score >= 60) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25 text-[11px] font-semibold"><Star className="w-2.5 h-2.5 fill-amber-400" />{score}% Match</span>;
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 text-white/40 border border-white/10 text-[11px] font-semibold">{score}% Match</span>;
}

export default function SavedJobs() {
  const token = useAuthStore(s => s.token);
  const { isDemoMode, openAuthModal } = useDemoStore();
  const { toast } = useToast();

  const [entries, setEntries] = useState<SavedJobEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "match">("date");
  const [editingNotes, setEditingNotes] = useState<number | null>(null);
  const [notesDraft, setNotesDraft] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  const authHeader = { Authorization: `Bearer ${token}` };

  const load = useCallback(async () => {
    if (isDemoMode) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/saved-jobs`, { headers: authHeader });
      if (res.ok) setEntries(await res.json());
    } catch {}
    setLoading(false);
  }, [token, isDemoMode]);

  useEffect(() => { load(); }, [load]);

  const handleUnsave = async (entry: SavedJobEntry) => {
    if (isDemoMode) { openAuthModal("Save Jobs"); return; }
    await fetch(`${API}/saved-jobs/${entry.jobId}`, { method: "DELETE", headers: authHeader });
    setEntries(prev => prev.filter(e => e.id !== entry.id));
    toast({ title: "Job removed from saved", duration: 2500 });
  };

  const handleSaveNotes = async (entryId: number) => {
    setSavingNotes(true);
    try {
      await fetch(`${API}/saved-jobs/${entryId}/notes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({ notes: notesDraft }),
      });
      setEntries(prev => prev.map(e => e.id === entryId ? { ...e, notes: notesDraft } : e));
      setEditingNotes(null);
      toast({ title: "Notes saved", duration: 2000 });
    } catch {}
    setSavingNotes(false);
  };

  const filtered = entries
    .filter(e => {
      if (!search) return true;
      const q = search.toLowerCase();
      return e.job.title.toLowerCase().includes(q) || e.job.company.toLowerCase().includes(q) || e.job.location.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sortBy === "match") return (b.job.matchScore ?? 0) - (a.job.matchScore ?? 0);
      return new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime();
    });

  if (isDemoMode) {
    return (
      <div className="glass-card p-16 text-center flex flex-col items-center gap-4">
        <Bookmark className="w-12 h-12 text-white/15" />
        <h3 className="text-xl font-bold">Sign in to save jobs</h3>
        <p className="text-white/45 text-sm">Create a free account to bookmark jobs and track your favourites.</p>
        <button onClick={() => openAuthModal("Save Jobs")} className="btn-primary px-6 py-2.5 text-sm">Get Started Free</button>
      </div>
    );
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-indigo-400" /></div>;

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bookmark className="w-6 h-6 text-indigo-400" /> Saved Jobs
          </h1>
          <p className="text-sm text-white/40 mt-1">{entries.length} job{entries.length !== 1 ? "s" : ""} saved</p>
        </div>
      </div>

      {/* Controls */}
      {entries.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-3 flex-1 bg-white/[0.03] border border-white/[0.1] rounded-xl px-4 py-2.5 focus-within:border-indigo-500/50 transition-all">
            <Search className="w-4 h-4 text-white/30 shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search saved jobs..."
              className="flex-1 bg-transparent text-sm text-white placeholder:text-white/25 focus:outline-none"
            />
          </div>
          <div className="flex gap-1 bg-white/[0.04] border border-white/[0.08] rounded-xl p-1">
            {[
              { value: "date", label: "By Date" },
              { value: "match", label: "By Match" },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => setSortBy(opt.value as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${sortBy === opt.value ? "bg-indigo-600 text-white" : "text-white/45 hover:text-white"}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {entries.length === 0 && (
        <div className="glass-card p-16 text-center flex flex-col items-center gap-4">
          <Bookmark className="w-12 h-12 text-white/10" />
          <h3 className="text-lg font-bold text-white/50">No saved jobs yet</h3>
          <p className="text-sm text-white/30">Click the bookmark icon on any job card to save it here for later.</p>
          <a href="/dashboard/jobs" className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">Browse Jobs →</a>
        </div>
      )}

      {/* No filter results */}
      {entries.length > 0 && filtered.length === 0 && (
        <div className="glass-card p-10 text-center text-white/35 text-sm">No saved jobs match your search.</div>
      )}

      {/* Job cards */}
      <div className="space-y-3">
        {filtered.map((entry, i) => {
          const job = entry.job;
          const salary = formatSalary(job.salaryMin, job.salaryMax);
          const daysAgo = Math.floor((Date.now() - new Date(job.postedAt).getTime()) / 86400000);
          const postedLabel = daysAgo === 0 ? "Today" : daysAgo === 1 ? "Yesterday" : `${daysAgo}d ago`;
          const isEditing = editingNotes === entry.id;

          return (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ delay: i * 0.04 }}
              className="glass-card p-5 space-y-3 hover:border-white/[0.12] transition-colors"
            >
              {/* Top row */}
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-sm font-bold text-white/40">
                  {job.company.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-sm text-white leading-snug">{job.title}</h3>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-white/45">
                        <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{job.company}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>
                        {salary && <span className="flex items-center gap-1 text-green-400/80 font-medium"><IndianRupee className="w-3 h-3" />{salary}</span>}
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{postedLabel}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {job.matchScore !== undefined && job.matchScore > 0 && <MatchPill score={job.matchScore} />}
                    </div>
                  </div>
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-1.5">
                {job.isFresher && <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[11px] font-medium">🎓 Fresher</span>}
                {job.isRemote && <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 text-[11px] font-medium">🌐 Remote</span>}
                <span className="px-2 py-0.5 rounded-full bg-white/5 text-white/35 border border-white/10 text-[11px] capitalize">{job.type?.replace(/-/g, " ")}</span>
                {job.skills.slice(0, 3).map(s => (
                  <span key={s} className="px-2 py-0.5 rounded-md bg-indigo-500/5 border border-indigo-500/10 text-indigo-400/70 text-[11px]">{s}</span>
                ))}
              </div>

              {/* Notes */}
              {isEditing ? (
                <div className="space-y-2">
                  <textarea
                    autoFocus
                    value={notesDraft}
                    onChange={e => setNotesDraft(e.target.value)}
                    placeholder="Add your notes about this job..."
                    rows={3}
                    className="w-full bg-white/[0.04] border border-white/[0.12] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50 resize-none transition-all"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveNotes(entry.id)}
                      disabled={savingNotes}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                    >
                      {savingNotes ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                      Save Notes
                    </button>
                    <button onClick={() => setEditingNotes(null)} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/50 text-xs rounded-lg transition-colors">Cancel</button>
                  </div>
                </div>
              ) : entry.notes ? (
                <div
                  className="flex items-start gap-2 px-3 py-2.5 bg-white/[0.03] border border-white/[0.07] rounded-xl cursor-pointer hover:border-white/[0.12] transition-all"
                  onClick={() => { setEditingNotes(entry.id); setNotesDraft(entry.notes ?? ""); }}
                >
                  <FileText className="w-3.5 h-3.5 text-indigo-400/60 mt-0.5 shrink-0" />
                  <p className="text-xs text-white/50 leading-relaxed line-clamp-2">{entry.notes}</p>
                </div>
              ) : null}

              {/* Footer actions */}
              <div className="flex items-center justify-between pt-1 border-t border-white/[0.06]">
                <p className="text-[11px] text-white/25">Saved {format(new Date(entry.savedAt), "MMM d, yyyy")}</p>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => { setEditingNotes(entry.id); setNotesDraft(entry.notes ?? ""); }}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/45 hover:text-white text-xs transition-colors"
                  >
                    <FileText className="w-3 h-3" />
                    {entry.notes ? "Edit Notes" : "Add Notes"}
                  </button>
                  {job.applyUrl && (
                    <a
                      href={job.applyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
                    >
                      Apply <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  <button
                    onClick={() => handleUnsave(entry)}
                    className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Remove from saved"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
