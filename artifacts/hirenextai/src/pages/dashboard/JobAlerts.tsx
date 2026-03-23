import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, BellOff, Zap, Calendar, Clock, Mail, MailOff, CheckCircle2,
  Settings, History, ChevronRight, Loader2, X, Plus, Building2, MapPin,
  Briefcase, Star, Edit2, Save, RefreshCw, Info
} from "lucide-react";
import { useAuthStore } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

const API = import.meta.env.VITE_API_URL ?? "/api";

interface AlertPrefs {
  id: number;
  userId: number;
  enabled: boolean;
  frequency: string;
  keywords: string[];
  skills: string[];
  locations: string[];
  openToRemote: boolean;
  jobTypes: string[];
  categories: string[];
  salaryMin: number | null;
  isFresherOnly: boolean;
  emailAlerts: boolean;
  lastSentAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AlertNotification {
  id: number;
  matchCount: number;
  isRead: boolean;
  emailSent: boolean;
  sentAt: string;
  jobs: { id: number; title: string; company: string; location: string; type: string }[];
}

const FREQ_OPTIONS = [
  { value: "instant", label: "Instant", icon: Zap, desc: "As soon as new matches are found" },
  { value: "daily", label: "Daily", icon: Calendar, desc: "Once a day summary" },
  { value: "weekly", label: "Weekly", icon: Clock, desc: "Weekly digest every Monday" },
];

const LOCATION_OPTIONS = [
  "Bangalore", "Mumbai", "Delhi NCR", "Hyderabad", "Pune", "Chennai",
  "Kolkata", "Ahmedabad", "Jaipur", "Remote",
];

const CATEGORY_OPTIONS = [
  "Engineering", "Design", "Marketing", "Sales", "Data Science",
  "Finance", "HR", "Operations", "DevOps", "QA",
];

const JOB_TYPE_OPTIONS = [
  { value: "full-time", label: "Full-time" },
  { value: "part-time", label: "Part-time" },
  { value: "internship", label: "Internship" },
  { value: "contract", label: "Contract" },
  { value: "freelance", label: "Freelance" },
];

function TagInput({ label, tags, onChange, suggestions, placeholder }: {
  label: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
}) {
  const [input, setInput] = useState("");
  const addTag = (val: string) => {
    const trimmed = val.trim();
    if (trimmed && !tags.includes(trimmed)) onChange([...tags, trimmed]);
    setInput("");
  };
  const removeTag = (tag: string) => onChange(tags.filter(t => t !== tag));
  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">{label}</label>
      <div className="flex flex-wrap gap-1.5 p-3 bg-white/[0.04] border border-white/[0.1] rounded-xl min-h-[44px]">
        {tags.map(tag => (
          <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-500/15 border border-indigo-500/25 text-indigo-400 text-xs rounded-full font-medium">
            {tag}
            <button onClick={() => removeTag(tag)} className="hover:text-red-400 transition-colors">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(input); }
            if (e.key === "Backspace" && !input && tags.length > 0) removeTag(tags[tags.length - 1]);
          }}
          placeholder={tags.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[120px] bg-transparent text-sm text-white placeholder:text-white/20 focus:outline-none"
        />
      </div>
      {suggestions && suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {suggestions.filter(s => !tags.includes(s)).slice(0, 8).map(s => (
            <button
              key={s}
              onClick={() => onChange([...tags, s])}
              className="text-xs px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-white/40 hover:text-white hover:border-white/20 transition-all"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CheckRow({ label, options, selected, onChange }: {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (vals: string[]) => void;
}) {
  const toggle = (val: string) => {
    selected.includes(val) ? onChange(selected.filter(s => s !== val)) : onChange([...selected, val]);
  };
  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button
            key={opt.value}
            onClick={() => toggle(opt.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              selected.includes(opt.value)
                ? "bg-indigo-500/15 border-indigo-500/35 text-indigo-400"
                : "bg-white/[0.03] border-white/[0.1] text-white/45 hover:text-white/70"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function JobAlerts() {
  const token = useAuthStore(s => s.token);
  const { toast } = useToast();
  const authHeader = { Authorization: `Bearer ${token}` };

  const [alert, setAlert] = useState<AlertPrefs | null>(null);
  const [notifications, setNotifications] = useState<AlertNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<"settings" | "history">("settings");

  // Local editable state
  const [freq, setFreq] = useState("daily");
  const [skills, setSkills] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [jobTypes, setJobTypes] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [openToRemote, setOpenToRemote] = useState(true);
  const [isFresherOnly, setIsFresherOnly] = useState(false);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [salaryMin, setSalaryMin] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [alertRes, notifRes] = await Promise.all([
        fetch(`${API}/alerts`, { headers: authHeader }),
        fetch(`${API}/alerts/notifications`, { headers: authHeader }),
      ]);
      if (alertRes.ok) {
        const a: AlertPrefs = await alertRes.json();
        setAlert(a);
        setFreq(a.frequency);
        setSkills(a.skills);
        setLocations(a.locations);
        setKeywords(a.keywords);
        setJobTypes(a.jobTypes);
        setCategories(a.categories);
        setOpenToRemote(a.openToRemote);
        setIsFresherOnly(a.isFresherOnly);
        setEmailAlerts(a.emailAlerts);
        setSalaryMin(a.salaryMin ? String(a.salaryMin) : "");
      }
      if (notifRes.ok) setNotifications(await notifRes.json());
    } catch {}
    setLoading(false);
  }, [token]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleToggleEnabled = async () => {
    if (!alert) return;
    const newEnabled = !alert.enabled;
    try {
      const res = await fetch(`${API}/alerts`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({ enabled: newEnabled }),
      });
      if (res.ok) {
        setAlert({ ...alert, enabled: newEnabled });
        toast({ title: newEnabled ? "Job alerts enabled!" : "Job alerts paused", duration: 3000 });
      }
    } catch {}
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/alerts`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({
          frequency: freq, skills, locations, keywords, jobTypes, categories,
          openToRemote, isFresherOnly, emailAlerts,
          salaryMin: salaryMin ? parseInt(salaryMin) : null,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setAlert(updated);
        setEditing(false);
        toast({ title: "Alert preferences saved!", duration: 3000 });
      }
    } catch {
      toast({ title: "Failed to save", variant: "destructive", duration: 3000 });
    }
    setSaving(false);
  };

  const handleMarkAllRead = async () => {
    await fetch(`${API}/alerts/notifications/read-all`, { method: "POST", headers: authHeader });
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleTestSend = async () => {
    await fetch(`${API}/alerts/test-send`, { method: "POST", headers: authHeader });
    toast({ title: "Alert check triggered", description: "Checking for matching jobs now. Check back in a moment.", duration: 4000 });
    setTimeout(() => loadData(), 5000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
      </div>
    );
  }

  const unread = notifications.filter(n => !n.isRead).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto px-4 py-6 pb-20"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-indigo-400" />
            Job Alerts
          </h1>
          <p className="text-sm text-white/40 mt-1">Get notified when new jobs match your preferences</p>
        </div>
        {alert && (
          <button
            onClick={handleToggleEnabled}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all ${
              alert.enabled
                ? "bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20"
                : "bg-white/[0.05] border-white/[0.12] text-white/50 hover:text-white hover:border-white/25"
            }`}
          >
            {alert.enabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
            {alert.enabled ? "Alerts On" : "Alerts Off"}
          </button>
        )}
      </div>

      {/* Status banner */}
      {alert?.enabled && alert.lastSentAt && (
        <div className="flex items-center gap-2 px-4 py-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl mb-5 text-sm text-indigo-300">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          Last alert sent: {new Date(alert.lastSentAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-white/[0.07] mb-5">
        {[
          { id: "settings" as const, label: "Preferences", icon: Settings },
          { id: "history" as const, label: `Notification History${unread > 0 ? ` (${unread})` : ""}`, icon: History },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all relative ${
              activeTab === tab.id ? "text-white" : "text-white/40 hover:text-white/70"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="alert-tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 to-purple-500"
              />
            )}
          </button>
        ))}
      </div>

      {/* Settings tab */}
      {activeTab === "settings" && (
        <div className="space-y-4">
          {/* Frequency */}
          <div className="glass-card rounded-2xl border border-white/[0.08] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" /> Alert Frequency
              </h2>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {FREQ_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { setFreq(opt.value); setEditing(true); }}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                    freq === opt.value
                      ? "bg-indigo-500/15 border-indigo-500/40 text-indigo-400"
                      : "bg-white/[0.03] border-white/[0.08] text-white/50 hover:border-white/20"
                  }`}
                >
                  <opt.icon className="w-4 h-4" />
                  <span className="text-xs font-semibold">{opt.label}</span>
                  <span className="text-[10px] text-center leading-tight text-white/30">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Job preferences */}
          <div className="glass-card rounded-2xl border border-white/[0.08] p-5 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-purple-400" /> Job Preferences
            </h2>

            <TagInput
              label="Skills"
              tags={skills}
              onChange={v => { setSkills(v); setEditing(true); }}
              placeholder="React, Python, SQL... (press Enter)"
            />

            <TagInput
              label="Keywords"
              tags={keywords}
              onChange={v => { setKeywords(v); setEditing(true); }}
              placeholder="Frontend developer, Data analyst..."
            />

            <CheckRow
              label="Preferred Locations"
              options={LOCATION_OPTIONS.map(l => ({ value: l, label: l }))}
              selected={locations}
              onChange={v => { setLocations(v); setEditing(true); }}
            />

            <CheckRow
              label="Job Types"
              options={JOB_TYPE_OPTIONS}
              selected={jobTypes}
              onChange={v => { setJobTypes(v); setEditing(true); }}
            />

            <CheckRow
              label="Categories"
              options={CATEGORY_OPTIONS.map(c => ({ value: c, label: c }))}
              selected={categories}
              onChange={v => { setCategories(v); setEditing(true); }}
            />

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Min Salary (₹/year)</label>
                <input
                  type="number"
                  value={salaryMin}
                  onChange={e => { setSalaryMin(e.target.value); setEditing(true); }}
                  placeholder="e.g. 400000"
                  className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-indigo-500/60 transition-all"
                />
              </div>
              <div className="flex flex-col gap-3 pt-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={openToRemote}
                    onChange={e => { setOpenToRemote(e.target.checked); setEditing(true); }}
                    className="w-4 h-4 rounded accent-indigo-500"
                  />
                  <span className="text-sm text-white/70">Include remote jobs</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFresherOnly}
                    onChange={e => { setIsFresherOnly(e.target.checked); setEditing(true); }}
                    className="w-4 h-4 rounded accent-indigo-500"
                  />
                  <span className="text-sm text-white/70">Fresher jobs only</span>
                </label>
              </div>
            </div>
          </div>

          {/* Email notifications */}
          <div className="glass-card rounded-2xl border border-white/[0.08] p-5">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
              <Mail className="w-4 h-4 text-green-400" /> Email Notifications
            </h2>
            <label className="flex items-center justify-between gap-3 cursor-pointer">
              <div>
                <p className="text-sm text-white/80">Send email digests</p>
                <p className="text-xs text-white/35 mt-0.5">Receive job matches directly in your inbox</p>
              </div>
              <button
                onClick={() => { setEmailAlerts(!emailAlerts); setEditing(true); }}
                className={`relative w-12 h-6 rounded-full border transition-all ${
                  emailAlerts ? "bg-indigo-600 border-indigo-600" : "bg-white/[0.08] border-white/[0.15]"
                }`}
              >
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${emailAlerts ? "left-6" : "left-0.5"}`} />
              </button>
            </label>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <AnimatePresence>
              {editing && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)]"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Save Preferences</>}
                </motion.button>
              )}
            </AnimatePresence>
            <button
              onClick={handleTestSend}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.1] text-white/60 text-sm font-medium hover:text-white hover:border-white/20 transition-all"
            >
              <RefreshCw className="w-4 h-4" /> Test Alert
            </button>
          </div>

          <div className="flex items-start gap-2 text-xs text-white/25 mt-1">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <p>"Test Alert" manually checks for jobs matching your current preferences and creates a notification.</p>
          </div>
        </div>
      )}

      {/* History tab */}
      {activeTab === "history" && (
        <div className="space-y-3">
          {unread > 0 && (
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-white/50">{unread} unread notification{unread > 1 ? "s" : ""}</span>
              <button onClick={handleMarkAllRead} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                Mark all read
              </button>
            </div>
          )}

          {notifications.length === 0 ? (
            <div className="text-center py-16">
              <Bell className="w-12 h-12 text-white/10 mx-auto mb-4" />
              <h3 className="text-base font-semibold text-white/40 mb-2">No notifications yet</h3>
              <p className="text-sm text-white/25">Enable alerts and we'll notify you when matching jobs are found</p>
            </div>
          ) : (
            notifications.map(notif => (
              <div
                key={notif.id}
                className={`glass-card rounded-xl border p-4 transition-all ${
                  !notif.isRead ? "border-indigo-500/25 bg-indigo-500/[0.04]" : "border-white/[0.08]"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {!notif.isRead && <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0" />}
                      <p className="text-sm font-semibold text-white">
                        {notif.matchCount} new job match{notif.matchCount > 1 ? "es" : ""}
                      </p>
                      {notif.emailSent && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400">Email sent</span>
                      )}
                    </div>
                    <p className="text-xs text-white/35">
                      {new Date(notif.sentAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                    {notif.jobs.length > 0 && (
                      <div className="mt-2 space-y-1.5">
                        {notif.jobs.slice(0, 3).map(job => (
                          <div key={job.id} className="flex items-center gap-2 text-xs text-white/55">
                            <Building2 className="w-3 h-3 shrink-0 text-white/25" />
                            <span className="font-medium text-white/70">{job.title}</span>
                            <span className="text-white/30">·</span>
                            <span>{job.company}</span>
                          </div>
                        ))}
                        {notif.jobs.length > 3 && (
                          <p className="text-xs text-white/25">+{notif.jobs.length - 3} more</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </motion.div>
  );
}
