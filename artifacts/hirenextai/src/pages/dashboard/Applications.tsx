import { useState, useEffect, useCallback } from "react";
import { useGetApplications, useUpdateApplication } from "@workspace/api-client-react";
import { format, isPast, isFuture, differenceInDays } from "date-fns";
import {
  Building2, Calendar, MapPin, Loader2, Briefcase, ChevronDown, IndianRupee,
  Search, FileText, Bell, BellOff, ChevronUp, Bookmark, TrendingUp,
  Clock, CheckCircle2, X, ExternalLink, Edit2, Save, Star, Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useDemoStore } from "@/store/demo";
import { useAuthStore } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

const API = import.meta.env.VITE_API_URL ?? "/api";

const STATUS_CONFIG = {
  applied:     { label: "Applied",     color: "bg-blue-500/10 text-blue-400 border-blue-500/20",     dot: "bg-blue-400",     icon: "📨" },
  viewed:      { label: "Viewed",      color: "bg-purple-500/10 text-purple-400 border-purple-500/20", dot: "bg-purple-400", icon: "👀" },
  shortlisted: { label: "Shortlisted", color: "bg-amber-500/10 text-amber-400 border-amber-500/20",   dot: "bg-amber-400",   icon: "⭐" },
  interview:   { label: "Interview",   color: "bg-pink-500/10 text-pink-400 border-pink-500/20",      dot: "bg-pink-400",    icon: "🎤" },
  rejected:    { label: "Rejected",    color: "bg-red-500/10 text-red-400 border-red-500/20",         dot: "bg-red-400",     icon: "❌" },
  offered:     { label: "Offered",     color: "bg-green-500/10 text-green-400 border-green-500/20",   dot: "bg-green-400",   icon: "🎉" },
};

type Status = keyof typeof STATUS_CONFIG;
const STATUSES = Object.keys(STATUS_CONFIG) as Status[];

interface AppWithExtras {
  id: number;
  jobId: number;
  status: string;
  recruiterStatus?: string;
  notes?: string | null;
  followUpDate?: string | null;
  reminderSent?: boolean;
  appliedAt: string;
  updatedAt: string;
  job: {
    id: number;
    title: string;
    company: string;
    location: string;
    type: string;
    salaryMin?: number | null;
    salaryMax?: number | null;
    applyUrl?: string | null;
    skills: string[];
    isFresher?: boolean;
    isRemote?: boolean;
  };
}

function SummaryBar({ apps }: { apps: AppWithExtras[] }) {
  const total = apps.length;
  const interviews = apps.filter(a => a.status === "interview").length;
  const offers = apps.filter(a => a.status === "offered").length;
  const shortlisted = apps.filter(a => a.status === "shortlisted").length;
  const upcoming = apps.filter(a => {
    if (!a.followUpDate) return false;
    const d = new Date(a.followUpDate);
    return isFuture(d) && differenceInDays(d, new Date()) <= 7;
  }).length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[
        { label: "Total Applied", value: total, color: "text-white", bg: "bg-white/[0.04]", icon: Briefcase },
        { label: "Interviews", value: interviews, color: "text-pink-400", bg: "bg-pink-500/8", icon: Star },
        { label: "Offers", value: offers, color: "text-green-400", bg: "bg-green-500/8", icon: CheckCircle2 },
        { label: "Follow-ups Due", value: upcoming, color: "text-amber-400", bg: "bg-amber-500/8", icon: Bell },
      ].map(stat => (
        <div key={stat.label} className={`glass-card p-4 flex items-center gap-3 ${stat.bg}`}>
          <stat.icon className={`w-5 h-5 ${stat.color} shrink-0`} />
          <div>
            <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-white/40">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Applications() {
  const { data: rawApps, isLoading, refetch } = useGetApplications();
  const updateMut = useUpdateApplication();
  const [filter, setFilter] = useState<Status | "all">("all");
  const [search, setSearch] = useState("");
  const { isDemoMode, openAuthModal } = useDemoStore();
  const token = useAuthStore(s => s.token);
  const { toast } = useToast();

  // Expanded row state
  const [expandedId, setExpandedId] = useState<number | null>(null);
  // Notes editing
  const [noteDraft, setNoteDraft] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  // Follow-up editing
  const [followUpDraft, setFollowUpDraft] = useState("");
  const [savingFollowUp, setSavingFollowUp] = useState(false);

  const authHeader = { Authorization: `Bearer ${token}` };

  const applications = (rawApps ?? []) as AppWithExtras[];

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  const filtered = applications.filter(app => {
    const matchStatus = filter === "all" || app.status === filter;
    const matchSearch = !search || app.job.title.toLowerCase().includes(search.toLowerCase()) || app.job.company.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const counts = STATUSES.reduce((acc, s) => {
    acc[s] = applications.filter(a => a.status === s).length;
    return acc;
  }, {} as Record<Status, number>);

  const handleStatusChange = async (appId: number, newStatus: Status) => {
    if (isDemoMode) { openAuthModal("Track Applications"); return; }
    await updateMut.mutateAsync({ applicationId: appId, data: { status: newStatus } });
    refetch();
  };

  const handleSaveNote = async (appId: number) => {
    if (isDemoMode) { openAuthModal("Add Notes"); return; }
    setSavingNote(true);
    try {
      await fetch(`${API}/applications/${appId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({ notes: noteDraft }),
      });
      refetch();
      toast({ title: "Note saved", duration: 2000 });
    } catch {}
    setSavingNote(false);
  };

  const handleSaveFollowUp = async (appId: number) => {
    if (isDemoMode) { openAuthModal("Set Reminders"); return; }
    setSavingFollowUp(true);
    try {
      await fetch(`${API}/applications/${appId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({ followUpDate: followUpDraft || null }),
      });
      refetch();
      toast({ title: followUpDraft ? "Follow-up reminder set!" : "Follow-up removed", duration: 2000 });
    } catch {}
    setSavingFollowUp(false);
  };

  const openExpanded = (app: AppWithExtras) => {
    if (expandedId === app.id) { setExpandedId(null); return; }
    setExpandedId(app.id);
    setNoteDraft(app.notes ?? "");
    setFollowUpDraft(app.followUpDate ? app.followUpDate.split("T")[0] : "");
  };

  if (!applications.length) {
    return (
      <div className="glass-card p-16 text-center flex flex-col items-center">
        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-5">
          <Briefcase className="w-10 h-10 text-white/20" />
        </div>
        <h3 className="text-xl font-display font-bold mb-2">No applications yet</h3>
        <p className="text-white/50 mb-6 text-sm">Browse jobs and apply to start tracking your progress here.</p>
        <a href="/dashboard/jobs" className="btn-primary text-sm px-6 py-2.5">Browse Jobs</a>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Summary bar */}
      <SummaryBar apps={applications} />

      {/* Status filter chips */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {STATUSES.map(s => {
          const cfg = STATUS_CONFIG[s];
          return (
            <button
              key={s}
              onClick={() => setFilter(filter === s ? "all" : s)}
              className={`glass-card p-3 text-center transition-all hover:-translate-y-0.5 ${filter === s ? "border-white/20 bg-white/5 shadow-lg" : ""}`}
            >
              <div className="text-lg mb-0.5">{cfg.icon}</div>
              <div className="text-sm font-bold">{counts[s]}</div>
              <p className="text-[10px] text-white/40">{cfg.label}</p>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.1] rounded-xl px-4 py-2.5 focus-within:border-primary/50 transition-all">
        <Search className="w-4 h-4 text-white/30 shrink-0" />
        <input
          type="search"
          placeholder="Search by job title or company..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-transparent text-white placeholder:text-white/30 focus:outline-none text-sm"
        />
        {search && <button onClick={() => setSearch("")}><X className="w-4 h-4 text-white/30 hover:text-white" /></button>}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="glass-card p-10 text-center text-white/40">No applications match your filter.</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((app, i) => {
            const cfg = STATUS_CONFIG[app.status as Status] ?? STATUS_CONFIG.applied;
            const isExpanded = expandedId === app.id;
            const hasFollowUp = !!app.followUpDate;
            const followUpDate = hasFollowUp ? new Date(app.followUpDate!) : null;
            const followUpOverdue = followUpDate && isPast(followUpDate);
            const followUpSoon = followUpDate && isFuture(followUpDate) && differenceInDays(followUpDate, new Date()) <= 3;

            return (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`glass-card overflow-hidden transition-all hover:border-white/[0.12] ${isExpanded ? "border-white/[0.14]" : ""}`}
              >
                {/* Main row */}
                <div
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
                  onClick={() => openExpanded(app)}
                >
                  <div className="flex gap-3 items-start sm:items-center">
                    <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-sm font-bold text-white/40">
                      {app.job.company.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-[13px] leading-tight">{app.job.title}</h3>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-white/45">
                        <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{app.job.company}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{app.job.location}</span>
                        {(app.job.salaryMin || app.job.salaryMax) && (
                          <span className="flex items-center gap-1 text-green-400/70">
                            <IndianRupee className="w-3 h-3" />
                            {app.job.salaryMin ? `${(app.job.salaryMin / 100000).toFixed(1)}L` : ""}
                            {app.job.salaryMax ? `–${(app.job.salaryMax / 100000).toFixed(1)}L` : ""}
                          </span>
                        )}
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Applied {format(new Date(app.appliedAt), "MMM d")}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pl-14 sm:pl-0 shrink-0">
                    {/* Follow-up indicator */}
                    {hasFollowUp && (
                      <span className={`text-[10px] flex items-center gap-1 px-2 py-1 rounded-full border font-semibold ${
                        followUpOverdue ? "bg-red-500/10 text-red-400 border-red-500/20" :
                        followUpSoon ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                        "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                      }`}>
                        <Bell className="w-2.5 h-2.5" />
                        {followUpOverdue ? "Overdue" : followUpSoon ? "Due soon" : format(followUpDate!, "MMM d")}
                      </span>
                    )}
                    {app.notes && <FileText className="w-3.5 h-3.5 text-white/30" />}

                    <span className={`px-3 py-1 rounded-full border text-xs font-semibold flex items-center gap-1.5 ${cfg.color}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                      {cfg.label}
                    </span>

                    {/* Status dropdown */}
                    <div className="relative group" onClick={e => e.stopPropagation()}>
                      <button className="p-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-white transition-colors">
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <div className="absolute right-0 top-full mt-1 w-44 glass-panel rounded-xl overflow-hidden z-20 hidden group-hover:block shadow-xl border border-white/10">
                        <p className="px-3 py-2 text-xs text-white/40 border-b border-white/5">Update Status</p>
                        {STATUSES.map(s => (
                          <button
                            key={s}
                            onClick={() => handleStatusChange(app.id, s)}
                            disabled={s === app.status}
                            className={`w-full text-left px-3 py-2 text-sm transition-colors flex items-center gap-2 ${
                              s === app.status ? "text-white/25 cursor-default" : "text-white/65 hover:text-white hover:bg-white/5"
                            }`}
                          >
                            <div className={`w-2 h-2 rounded-full ${STATUS_CONFIG[s].dot}`} />
                            {STATUS_CONFIG[s].label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {isExpanded ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/20" />}
                  </div>
                </div>

                {/* Expanded panel */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-0 border-t border-white/[0.07] grid sm:grid-cols-2 gap-4 mt-0">
                        {/* Notes */}
                        <div className="space-y-2 pt-3">
                          <label className="text-xs font-semibold text-white/50 uppercase tracking-wider flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5" /> Personal Notes
                          </label>
                          <textarea
                            value={noteDraft}
                            onChange={e => setNoteDraft(e.target.value)}
                            rows={4}
                            placeholder="Interview prep notes, company research, contact name..."
                            className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50 resize-none transition-all"
                          />
                          <button
                            onClick={() => handleSaveNote(app.id)}
                            disabled={savingNote}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                          >
                            {savingNote ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                            Save Note
                          </button>
                        </div>

                        {/* Follow-up reminder */}
                        <div className="space-y-2 pt-3">
                          <label className="text-xs font-semibold text-white/50 uppercase tracking-wider flex items-center gap-1.5">
                            <Bell className="w-3.5 h-3.5" /> Follow-up Reminder
                          </label>
                          <input
                            type="date"
                            value={followUpDraft}
                            onChange={e => setFollowUpDraft(e.target.value)}
                            min={new Date().toISOString().split("T")[0]}
                            className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSaveFollowUp(app.id)}
                              disabled={savingFollowUp}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                            >
                              {savingFollowUp ? <Loader2 className="w-3 h-3 animate-spin" /> : <Bell className="w-3 h-3" />}
                              {hasFollowUp ? "Update" : "Set Reminder"}
                            </button>
                            {hasFollowUp && (
                              <button
                                onClick={() => { setFollowUpDraft(""); handleSaveFollowUp(app.id); }}
                                className="px-3 py-1.5 bg-white/5 hover:bg-red-500/10 text-white/40 hover:text-red-400 text-xs rounded-lg transition-colors"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                          {hasFollowUp && (
                            <p className={`text-xs flex items-center gap-1 ${followUpOverdue ? "text-red-400" : followUpSoon ? "text-amber-400" : "text-indigo-400"}`}>
                              <Clock className="w-3 h-3" />
                              {followUpOverdue
                                ? `Overdue by ${Math.abs(differenceInDays(followUpDate!, new Date()))} day(s)`
                                : `Due in ${differenceInDays(followUpDate!, new Date())} day(s)`}
                            </p>
                          )}

                          {/* Apply link */}
                          {app.job.applyUrl && (
                            <a
                              href={app.job.applyUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2 flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" /> View original job posting
                            </a>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
