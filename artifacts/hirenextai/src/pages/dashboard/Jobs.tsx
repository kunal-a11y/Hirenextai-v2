import { useState, useEffect, useRef, useMemo, useCallback, type ReactNode } from "react";
import DOMPurify from "dompurify";
import { useDemoStore } from "@/store/demo";
import { useAuthStore } from "@/hooks/use-auth";
import RecommendedJobs, { type RecommendedJob } from "@/components/RecommendedJobs";
import {
  useGetJobs, useCreateApplication,
  useGenerateCoverLetter, useGenerateRecruiterMessage,
  useGetProfile,
} from "@workspace/api-client-react";
import {
  Search, MapPin, Building2, Briefcase, Clock, X, Loader2, Sparkles,
  Wifi, GraduationCap, CheckCircle2, Copy, FileText, MessageSquare,
  IndianRupee, ExternalLink, RefreshCw, Radio, Database,
  TrendingUp, Lightbulb, ChevronRight, Zap, Target,
  SlidersHorizontal, ArrowUpDown, ChevronDown, Users, Star, Bookmark, BookmarkCheck,
} from "lucide-react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import type { Job, UserProfile } from "@workspace/api-client-react";

/* ─── Static data ────────────────────────────────────────────────────────── */
const CATEGORIES = [
  "Engineering", "AI/ML", "Cyber Security", "Data Science", "DevOps",
  "IT Support", "Digital Marketing", "Data Entry", "Sales", "HR",
  "Finance", "Product", "Design", "Internship", "Government",
];

const LOCATIONS = [
  "Bangalore", "Hyderabad", "Pune", "Mumbai", "Delhi",
  "Chennai", "Gurgaon", "Noida", "Kolkata", "Remote",
];

const JOB_TYPES = ["full-time", "part-time", "internship", "freelance"];

const TRENDING_SEARCHES = [
  { label: "Cyber Security", icon: "🛡️" },
  { label: "AI/ML", icon: "🤖" },
  { label: "BCA Fresher", icon: "🎓" },
  { label: "Remote DevOps", icon: "☁️" },
  { label: "Data Science", icon: "📊" },
  { label: "Python Developer", icon: "🐍" },
  { label: "Full Stack", icon: "⚡" },
  { label: "MCA Jobs", icon: "💼" },
  { label: "IT Support", icon: "🖥️" },
  { label: "Digital Marketing", icon: "📱" },
];

const POPULAR_CATEGORIES = [
  { label: "Fresher Jobs", category: "Internship", icon: "🎓", color: "from-blue-500/20 to-blue-600/5" },
  { label: "Remote Jobs", category: "", remote: true, icon: "🌐", color: "from-green-500/20 to-green-600/5" },
  { label: "AI / ML", category: "AI/ML", icon: "🤖", color: "from-purple-500/20 to-purple-600/5" },
  { label: "Cyber Security", category: "Cyber Security", icon: "🛡️", color: "from-red-500/20 to-red-600/5" },
  { label: "Data Science", category: "Data Science", icon: "📊", color: "from-cyan-500/20 to-cyan-600/5" },
  { label: "DevOps / Cloud", category: "DevOps", icon: "☁️", color: "from-amber-500/20 to-amber-600/5" },
];

const SOURCE_COLORS: Record<string, string> = {
  JSearch:   "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Adzuna:    "bg-green-500/10 text-green-400 border-green-500/20",
  Jooble:    "bg-orange-500/10 text-orange-400 border-orange-500/20",
  Arbeitnow: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  Remotive:  "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  Database:  "bg-white/5 text-white/40 border-white/10",
  Direct:    "bg-purple-500/15 text-purple-400 border-purple-500/25",
};

/* ─── Helpers ────────────────────────────────────────────────────────────── */
type LiveJobType = Job & { source?: string | null; applyUrl?: string | null; relevanceScore?: number; matchScore?: number; isDirectPost?: boolean };

function SourceBadge({ source }: { source?: string | null }) {
  if (!source) return null;
  const cls = SOURCE_COLORS[source] ?? "bg-white/5 text-white/40 border-white/10";
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-xs font-medium ${cls}`}>
      {source !== "Database" ? <Radio className="w-2.5 h-2.5 animate-pulse" /> : <Database className="w-2.5 h-2.5" />}
      {source}
    </span>
  );
}

function JobSkeleton() {
  return (
    <div className="glass-card p-5 flex flex-col gap-3 animate-pulse">
      <div className="flex gap-3">
        <div className="w-11 h-11 rounded-lg bg-white/5 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-white/5 rounded w-3/4" />
          <div className="h-3 bg-white/5 rounded w-1/2" />
        </div>
      </div>
      <div className="flex gap-3">
        <div className="h-3 bg-white/5 rounded w-1/4" />
        <div className="h-3 bg-white/5 rounded w-1/4" />
      </div>
      <div className="flex gap-2">
        <div className="h-6 bg-white/5 rounded-md w-16" />
        <div className="h-6 bg-white/5 rounded-md w-20" />
        <div className="h-6 bg-white/5 rounded-md w-14" />
      </div>
    </div>
  );
}

/* ─── Experience levels ──────────────────────────────────────────────────── */
const EXPERIENCE_LEVELS = [
  { value: "fresher", label: "Fresher / Intern", icon: "🎓", desc: "0–1 yr" },
  { value: "1-3",     label: "Junior",           icon: "🌱", desc: "1–3 yrs" },
  { value: "3-5",     label: "Mid-Level",         icon: "⚡", desc: "3–5 yrs" },
  { value: "5+",      label: "Senior",            icon: "🚀", desc: "5+ yrs" },
];

const SORT_OPTIONS = [
  { value: "latest",      label: "Latest Jobs",     icon: "🕐" },
  { value: "salary-high", label: "Highest Salary",  icon: "💰" },
  { value: "relevant",    label: "Best Match",       icon: "✨" },
];

const POPULAR_SKILLS = [
  "React", "Node.js", "Python", "Java", "SQL", "AWS", "TypeScript",
  "JavaScript", "Docker", "MongoDB", "Machine Learning", "Data Analysis",
  "Excel", "UI/UX", "Cybersecurity", "DevOps", "Angular", "Spring Boot",
  "Django", "Flutter", "Kotlin", "Figma", "Power BI", "Tableau",
];

/* ─── Dual Range Slider ──────────────────────────────────────────────────── */
function DualRangeSlider({
  min, max, valueMin, valueMax,
  onChangeMin, onChangeMax, step = 1,
  formatLabel,
}: {
  min: number; max: number;
  valueMin: number; valueMax: number;
  onChangeMin: (v: number) => void;
  onChangeMax: (v: number) => void;
  step?: number;
  formatLabel: (v: number) => string;
}) {
  const pct = (v: number) => ((v - min) / (max - min)) * 100;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs font-semibold">
        <span className="text-indigo-400">{formatLabel(valueMin)}</span>
        <span className="text-white/30">—</span>
        <span className="text-indigo-400">{formatLabel(valueMax)}</span>
      </div>
      <div className="relative h-5 flex items-center">
        {/* Track */}
        <div className="absolute w-full h-1.5 bg-white/10 rounded-full" />
        {/* Active range */}
        <div
          className="absolute h-1.5 bg-indigo-500 rounded-full"
          style={{ left: `${pct(valueMin)}%`, right: `${100 - pct(valueMax)}%` }}
        />
        {/* Min thumb */}
        <input
          type="range" min={min} max={max} step={step} value={valueMin}
          onChange={e => { const v = Number(e.target.value); if (v <= valueMax - step) onChangeMin(v); }}
          className="absolute w-full h-full opacity-0 cursor-pointer"
          style={{ zIndex: valueMin > max - 10 ? 5 : 3 }}
        />
        {/* Max thumb */}
        <input
          type="range" min={min} max={max} step={step} value={valueMax}
          onChange={e => { const v = Number(e.target.value); if (v >= valueMin + step) onChangeMax(v); }}
          className="absolute w-full h-full opacity-0 cursor-pointer"
          style={{ zIndex: 4 }}
        />
        {/* Visual thumbs */}
        <div className="absolute w-4 h-4 rounded-full bg-indigo-500 border-2 border-white shadow-lg pointer-events-none"
          style={{ left: `calc(${pct(valueMin)}% - 8px)` }} />
        <div className="absolute w-4 h-4 rounded-full bg-indigo-500 border-2 border-white shadow-lg pointer-events-none"
          style={{ left: `calc(${pct(valueMax)}% - 8px)` }} />
      </div>
    </div>
  );
}

/* ─── Match Score Engine ─────────────────────────────────────────────────── */
function computeMatchScore(job: LiveJobType, profile: UserProfile | undefined): number {
  if (!profile || profile.skills.length === 0) return 0;

  let score = 0;

  // 1. Skill Match — 50 pts max
  const userSkills = profile.skills.map(s => s.toLowerCase().trim());
  const jobSkills = [...(job.skills ?? []), ...((job as any).requirements ?? [])]
    .filter(s => s && s !== "General" && s !== "N/A")
    .map(s => s.toLowerCase().trim());

  if (jobSkills.length === 0) {
    score += 25; // No skills listed — neutral
  } else {
    const matched = userSkills.filter(us =>
      jobSkills.some(js => js.includes(us) || us.includes(js) || (us.length > 3 && js.includes(us.slice(0, -1))))
    ).length;
    const ratio = Math.min(matched / Math.min(jobSkills.length, 6), 1);
    score += Math.round(ratio * 50);
  }

  // 2. Experience Level — 20 pts max
  if (profile.isFresher) {
    if (job.isFresher) {
      score += 20;
    } else if (!job.experienceYears || job.experienceYears <= 2) {
      score += 14;
    } else if (job.experienceYears <= 4) {
      score += 7;
    }
    // 0 for senior roles
  } else {
    // Experienced user — check if overqualified (very junior role)
    if (job.isFresher) {
      score += 10; // slight penalty for experienced in fresher role
    } else {
      score += 17;
    }
  }

  // 3. Location Match — 15 pts max
  if (job.isRemote && profile.openToRemote) {
    score += 15;
  } else if (profile.preferredLocations.length === 0) {
    score += 8; // No preference — neutral
  } else {
    const jobLoc = (job.location ?? "").toLowerCase();
    const hasMatch = profile.preferredLocations.some(pl => {
      const p = pl.toLowerCase();
      return jobLoc.includes(p) || (p === "remote" && job.isRemote);
    });
    score += hasMatch ? 15 : 3;
  }

  // 4. Salary Match — 10 pts max
  const expMin = profile.expectedSalaryMin ?? 0;
  const expMax = profile.expectedSalaryMax ?? 0;
  const jobMin = job.salaryMin ?? 0;
  const jobMax = job.salaryMax ?? 0;
  if (expMin === 0 && expMax === 0) {
    score += 6; // No salary expectation — neutral
  } else if (jobMin === 0 && jobMax === 0) {
    score += 5; // Job has no salary listed
  } else {
    const userMid = (expMin + expMax) / 2;
    const jobMid = (jobMin + (jobMax || jobMin)) / 2;
    const salRatio = jobMid >= userMid ? 1 : Math.max(0, jobMid / userMid);
    score += Math.round(salRatio * 10);
  }

  // 5. Job Type Match — 5 pts max
  if (profile.jobTypePreference.length === 0) {
    score += 3; // No preference — neutral
  } else {
    const jobType = (job.type ?? "").toLowerCase();
    const matches = profile.jobTypePreference.some(p => p.toLowerCase() === jobType);
    score += matches ? 5 : 1;
  }

  // Penalty: profile completion < 40% → reduce score by 25%
  const completionPct = (profile as any).completionPct ?? 100;
  if (completionPct < 40) {
    score = Math.round(score * 0.75);
  }

  return Math.min(100, score);
}

/* ─── Match Badge ─────────────────────────────────────────────────────────── */
function MatchBadge({ score }: { score: number }) {
  if (score >= 80) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/25 text-[11px] font-semibold">
        <Star className="w-2.5 h-2.5 fill-green-400" /> {score}% Strong Match
      </span>
    );
  }
  if (score >= 60) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25 text-[11px] font-semibold">
        <Star className="w-2.5 h-2.5 fill-amber-400" /> {score}% Good Match
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-[11px] font-semibold">
      <Star className="w-2.5 h-2.5 fill-red-400" /> {score}% Low Match
    </span>
  );
}

/* ─── Toggle component ───────────────────────────────────────────────────── */
function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${on ? "bg-primary" : "bg-white/10"}`}>
      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${on ? "left-5" : "left-0.5"}`} />
    </button>
  );
}

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

/* ─── Main Page ──────────────────────────────────────────────────────────── */
export default function Jobs() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [remote, setRemote] = useState(false);
  const [type, setType] = useState("");
  const [fresher, setFresher] = useState(false);
  // Advanced filters
  const [experience, setExperience] = useState("");
  const [minSalaryLPA, setMinSalaryLPA] = useState("");
  const [maxSalaryLPA, setMaxSalaryLPA] = useState("");
  const [sortBy, setSortBy] = useState("latest");
  const [skillsFilter, setSkillsFilter] = useState<string[]>([]);
  const [fetchLimit, setFetchLimit] = useState(30);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<LiveJobType | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // Saved jobs state
  const token = useAuthStore(s => s.token);
  const [savedJobIds, setSavedJobIds] = useState<Set<number>>(new Set());

  const loadSavedIds = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/saved-jobs/ids`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const ids: number[] = await res.json();
        setSavedJobIds(new Set(ids));
      }
    } catch {}
  }, [token]);

  useEffect(() => { loadSavedIds(); }, [loadSavedIds]);

  const handleToggleSave = useCallback(async (job: LiveJobType) => {
    if (!token) return;
    const isSaved = savedJobIds.has(job.id);
    if (isSaved) {
      setSavedJobIds(prev => { const next = new Set(prev); next.delete(job.id); return next; });
      await fetch(`${API_BASE}/saved-jobs/${job.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    } else {
      setSavedJobIds(prev => new Set([...prev, job.id]));
      await fetch(`${API_BASE}/saved-jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ jobId: job.id }),
      });
    }
  }, [token, savedJobIds]);

  // Read filter state from URL on mount
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get("q"))          setSearch(p.get("q")!);
    if (p.get("category"))   setCategory(p.get("category")!);
    if (p.get("location"))   setLocation(p.get("location")!);
    if (p.get("type"))       setType(p.get("type")!);
    if (p.get("experience")) setExperience(p.get("experience")!);
    if (p.get("minSal"))     setMinSalaryLPA(p.get("minSal")!);
    if (p.get("maxSal"))     setMaxSalaryLPA(p.get("maxSal")!);
    if (p.get("sortBy"))     setSortBy(p.get("sortBy")!);
    if (p.get("remote") === "true") setRemote(true);
    if (p.get("fresher") === "true") setFresher(true);
    const sk = p.get("skills");
    if (sk) setSkillsFilter(sk.split(",").filter(Boolean));
  }, []);

  // Write filter state to URL on change
  useEffect(() => {
    const p = new URLSearchParams();
    if (search)       p.set("q", search);
    if (category)     p.set("category", category);
    if (location)     p.set("location", location);
    if (type)         p.set("type", type);
    if (experience)   p.set("experience", experience);
    if (minSalaryLPA) p.set("minSal", minSalaryLPA);
    if (maxSalaryLPA) p.set("maxSal", maxSalaryLPA);
    if (sortBy && sortBy !== "latest") p.set("sortBy", sortBy);
    if (remote)       p.set("remote", "true");
    if (fresher)      p.set("fresher", "true");
    if (skillsFilter.length > 0) p.set("skills", skillsFilter.join(","));
    const qs = p.toString();
    const newUrl = window.location.pathname + (qs ? `?${qs}` : "");
    window.history.replaceState({}, "", newUrl);
  }, [search, category, location, type, experience, minSalaryLPA, maxSalaryLPA, sortBy, remote, fresher, skillsFilter]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 450);
    return () => clearTimeout(t);
  }, [search]);

  // Reset pagination when filters change
  useEffect(() => {
    setFetchLimit(30);
  }, [debouncedSearch, category, location, type, experience, minSalaryLPA, maxSalaryLPA, remote, fresher, skillsFilter, sortBy]);

  // Convert LPA to rupees for API
  const minSalaryRupees = minSalaryLPA ? Math.round(parseFloat(minSalaryLPA) * 100000) : undefined;
  const maxSalaryRupees = maxSalaryLPA ? Math.round(parseFloat(maxSalaryLPA) * 100000) : undefined;

  const { data: profileData } = useGetProfile();
  const profile = profileData as UserProfile | undefined;

  // When "Best Match" sort is selected, let the backend return default order
  // then we re-sort client-side using computed match scores
  const backendSortBy = sortBy === "relevant" ? undefined : sortBy !== "latest" ? sortBy : undefined;

  const { data, isLoading, refetch } = useGetJobs({
    query: {
      search: debouncedSearch || undefined,
      keyword: debouncedSearch || undefined,
      category: category || undefined,
      location: location || undefined,
      remote: remote || undefined,
      type: type || undefined,
      fresher: fresher || undefined,
      experience: experience || undefined,
      minSalary: minSalaryRupees as any,
      maxSalary: maxSalaryRupees as any,
      sortBy: backendSortBy as any,
      skills: skillsFilter.length > 0 ? skillsFilter.join(",") as any : undefined,
      limit: fetchLimit as any,
    } as any,
  });

  const rawJobs = (data?.jobs ?? []) as LiveJobType[];

  // Compute match scores for all jobs — memoized so it only recalculates
  // when jobs or profile changes (acts as an in-memory cache)
  const jobsWithScores = useMemo<LiveJobType[]>(() => {
    if (!profile || profile.skills.length === 0) return rawJobs;
    return rawJobs.map(job => ({
      ...job,
      matchScore: computeMatchScore(job, profile),
    }));
  }, [rawJobs, profile]);

  // Re-sort client-side when "Best Match" is selected
  const jobs = useMemo<LiveJobType[]>(() => {
    if (sortBy === "relevant" && profile && profile.skills.length > 0) {
      return [...jobsWithScores].sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));
    }
    return jobsWithScores;
  }, [jobsWithScores, sortBy, profile]);

  // "Best Jobs For You" — top-matched jobs (≥60%) shown as a special section
  const bestMatchJobs = useMemo<LiveJobType[]>(() => {
    if (!profile || profile.skills.length === 0) return [];
    return [...jobsWithScores]
      .filter(j => (j.matchScore ?? 0) >= 60)
      .sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0))
      .slice(0, 4);
  }, [jobsWithScores, profile]);

  const total = (data as any)?.total as number ?? jobs.length;
  const sources = (data as any)?.sources as string[] | undefined;
  const liveJobsActive = (data as any)?.liveJobsActive as boolean;
  const fromCache = (data as any)?.fromCache as boolean;
  const expandedTerms = (data as any)?.expandedTerms as string[] | undefined ?? [];
  const relatedCategories = (data as any)?.relatedCategories as string[] | undefined ?? [];
  const fallbackUsed = (data as any)?.fallbackUsed as boolean;
  const smartSearchActive = (data as any)?.smartSearchActive as boolean;
  const totalBeforeFilter = (data as any)?.totalBeforeFilter as number ?? 0;

  const hasAdvancedFilters = !!(experience || minSalaryLPA || maxSalaryLPA || skillsFilter.length > 0);
  const hasFilters = !!(category || location || type || remote || fresher || debouncedSearch || hasAdvancedFilters);
  const activeFiltersCount = [
    category, location, type,
    remote && "r", fresher && "f",
    experience, minSalaryLPA, maxSalaryLPA,
    ...skillsFilter,
  ].filter(Boolean).length;

  const clearAll = () => {
    setCategory(""); setLocation(""); setType(""); setRemote(false); setFresher(false);
    setSearch(""); setExperience(""); setMinSalaryLPA(""); setMaxSalaryLPA(""); setSortBy("latest");
    setSkillsFilter([]); setFetchLimit(30);
  };

  const toggleSkill = (skill: string) => {
    setSkillsFilter(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const applyTrending = (label: string) => {
    setSearch(label);
    setCategory("");
    searchRef.current?.focus();
  };

  const applyPopularCategory = (cat: string, rem?: boolean) => {
    if (cat) setCategory(cat);
    if (rem) setRemote(true);
  };

  /* ── Render ────────────────────────────────────────────────────────────── */
  return (
    <div className="flex gap-6 h-full">

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 gap-3 sticky top-0 self-start max-h-screen overflow-y-auto pb-4 pr-1 -mr-1" style={{ scrollbarWidth: "none" }}>

        {/* Filters card */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white/70 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5" /> Filters
            </h3>
            {activeFiltersCount > 0 && (
              <button onClick={clearAll} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
                <X className="w-3 h-3" /> Clear {activeFiltersCount}
              </button>
            )}
          </div>
          <div className="space-y-5">

            {/* Category */}
            <div>
              <label className="block text-xs text-white/40 mb-1.5">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="input-field py-2 text-sm">
                <option value="">All Categories</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs text-white/40 mb-1.5">City / Location</label>
              <select value={location} onChange={e => setLocation(e.target.value)} className="input-field py-2 text-sm">
                <option value="">All India</option>
                {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>

            {/* Job Type */}
            <div>
              <label className="block text-xs text-white/40 mb-1.5">Job Type</label>
              <select value={type} onChange={e => setType(e.target.value)} className="input-field py-2 text-sm">
                <option value="">Any Type</option>
                {JOB_TYPES.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
              </select>
            </div>

            {/* Remote toggle */}
            <label className="flex items-center justify-between cursor-pointer py-0.5">
              <span className="text-sm text-white/60 flex items-center gap-1.5"><Wifi className="w-4 h-4" /> Remote Only</span>
              <Toggle on={remote} onToggle={() => setRemote(p => !p)} />
            </label>

            {/* Fresher toggle */}
            <label className="flex items-center justify-between cursor-pointer py-0.5">
              <span className="text-sm text-white/60 flex items-center gap-1.5"><GraduationCap className="w-4 h-4" /> Fresher / Intern</span>
              <Toggle on={fresher} onToggle={() => setFresher(p => !p)} />
            </label>

            <div className="border-t border-white/[0.06]" />

            {/* Experience level */}
            <div>
              <label className="block text-xs text-white/40 mb-2 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Experience Level
              </label>
              <div className="space-y-1">
                {EXPERIENCE_LEVELS.map(lvl => (
                  <button
                    key={lvl.value}
                    onClick={() => setExperience(experience === lvl.value ? "" : lvl.value)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all ${experience === lvl.value ? "bg-primary/15 border border-primary/30 text-primary" : "hover:bg-white/5 text-white/50 hover:text-white border border-transparent"}`}
                  >
                    <span className="flex items-center gap-2">
                      <span>{lvl.icon}</span>
                      <span>{lvl.label}</span>
                    </span>
                    <span className="text-xs opacity-50">{lvl.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-white/[0.06]" />

            {/* Salary range — dual slider */}
            <div>
              <label className="block text-xs text-white/40 mb-3 flex items-center gap-1.5">
                <IndianRupee className="w-3.5 h-3.5" /> Salary Range (LPA)
              </label>
              <DualRangeSlider
                min={0} max={30} step={1}
                valueMin={Number(minSalaryLPA) || 0}
                valueMax={Number(maxSalaryLPA) || 30}
                onChangeMin={v => setMinSalaryLPA(v === 0 ? "" : String(v))}
                onChangeMax={v => setMaxSalaryLPA(v === 30 ? "" : String(v))}
                formatLabel={v => v === 0 ? "₹0" : v === 30 ? "₹30L+" : `₹${v}L`}
              />
              <div className="flex flex-wrap gap-1.5 mt-3">
                {[
                  { label: "3–6L", min: "3", max: "6" },
                  { label: "6–12L", min: "6", max: "12" },
                  { label: "12–20L", min: "12", max: "20" },
                  { label: "20L+", min: "20", max: "" },
                ].map(p => (
                  <button
                    key={p.label}
                    onClick={() => { setMinSalaryLPA(p.min); setMaxSalaryLPA(p.max); }}
                    className={`px-2.5 py-1 rounded-full text-xs border transition-all ${minSalaryLPA === p.min && maxSalaryLPA === p.max ? "bg-primary/20 border-primary/40 text-primary" : "bg-white/5 border-white/10 text-white/40 hover:text-white hover:border-white/20"}`}
                  >
                    {p.label}
                  </button>
                ))}
                {(minSalaryLPA || maxSalaryLPA) && (
                  <button onClick={() => { setMinSalaryLPA(""); setMaxSalaryLPA(""); }}
                    className="px-2.5 py-1 rounded-full text-xs border bg-red-500/10 border-red-500/20 text-red-400">
                    ✕ Clear
                  </button>
                )}
              </div>
            </div>

            <div className="border-t border-white/[0.06]" />

            {/* Skills multi-select */}
            <div>
              <label className="block text-xs text-white/40 mb-2 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" /> Skills
                {skillsFilter.length > 0 && (
                  <span className="ml-auto text-primary font-semibold">{skillsFilter.length} selected</span>
                )}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_SKILLS.map(skill => {
                  const active = skillsFilter.includes(skill);
                  return (
                    <button
                      key={skill}
                      onClick={() => toggleSkill(skill)}
                      className={`px-2 py-1 rounded-lg text-xs border transition-all ${active ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300 font-medium" : "bg-white/5 border-white/10 text-white/45 hover:text-white hover:border-white/20"}`}
                    >
                      {active && "✓ "}{skill}
                    </button>
                  );
                })}
              </div>
              {skillsFilter.length > 0 && (
                <button
                  onClick={() => setSkillsFilter([])}
                  className="mt-2 text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Clear skills
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Sort card */}
        <div className="glass-card p-4">
          <h4 className="text-xs text-white/40 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <ArrowUpDown className="w-3 h-3" /> Sort By
          </h4>
          <div className="space-y-1">
            {SORT_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setSortBy(opt.value)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${sortBy === opt.value ? "bg-primary/15 border border-primary/30 text-primary" : "hover:bg-white/5 text-white/50 hover:text-white border border-transparent"}`}
              >
                <span>{opt.icon}</span> {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Live status card */}
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            {liveJobsActive
              ? <><div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /><span className="text-xs text-green-400 font-medium">Live Jobs Active</span></>
              : <><div className="w-2 h-2 rounded-full bg-white/20" /><span className="text-xs text-white/40">Database Jobs</span></>
            }
          </div>
          {sources && sources.filter(s => s !== "Database").length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {sources.filter(s => s !== "Database").map(s => <SourceBadge key={s} source={s} />)}
            </div>
          )}
          <button onClick={() => refetch()} className="mt-1 w-full flex items-center justify-center gap-1.5 text-xs text-white/40 hover:text-white py-1.5 rounded-lg hover:bg-white/5 transition-colors">
            <RefreshCw className="w-3 h-3" /> Refresh jobs
          </button>
        </div>

        {/* Trending searches */}
        <div className="glass-card p-4">
          <h4 className="text-xs text-white/40 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <TrendingUp className="w-3 h-3" /> Trending
          </h4>
          <div className="space-y-1">
            {TRENDING_SEARCHES.slice(0, 6).map(t => (
              <button
                key={t.label}
                onClick={() => applyTrending(t.label)}
                className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 text-sm text-white/50 hover:text-white transition-colors"
              >
                <span>{t.icon}</span>
                <span className="truncate">{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* ── Main Content ──────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 gap-4">

        {/* AI Recommended Jobs */}
        <RecommendedJobs
          profileCompletion={(profileData as any)?.completionPct ?? 0}
          onSelectJob={(job: RecommendedJob) => setSelectedJob(job as any)}
          savedJobIds={savedJobIds}
          onToggleSave={handleToggleSave}
        />

        {/* Search bar */}
        <div className="glass-card p-2 flex items-center gap-2">

          {/* Search input wrapper — flex approach avoids absolute-icon padding conflicts */}
          <div className="flex items-center gap-3 flex-1 bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-2.5 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-200 min-w-0">
            <Search className="w-4 h-4 text-white/40 shrink-0" />
            <input
              ref={searchRef}
              type="search"
              placeholder="Search skills, title, company, keyword..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
              className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none min-w-0"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-white/30 hover:text-white/70 shrink-0 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort dropdown */}
          <div className="hidden sm:block shrink-0">
            <div className="relative">
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="h-10 bg-white/[0.04] border border-white/[0.08] rounded-xl pl-3 pr-8 text-xs text-white/70 focus:outline-none focus:border-primary/40 cursor-pointer appearance-none"
              >
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-white/40 pointer-events-none" />
            </div>
          </div>

          {/* Mobile: Filters button */}
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="lg:hidden flex items-center gap-1.5 h-10 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-white/60 hover:text-white hover:border-white/20 shrink-0 transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            {activeFiltersCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-primary text-white text-[10px] flex items-center justify-center font-bold leading-none">
                {activeFiltersCount}
              </span>
            )}
            <span className="hidden xs:inline">Filters</span>
          </button>

          {liveJobsActive && (
            <span className="hidden md:flex items-center gap-1.5 h-10 px-3 rounded-xl bg-green-500/10 border border-green-500/20 text-xs font-medium text-green-400 shrink-0">
              <Radio className="w-3 h-3 animate-pulse" /> Live
            </span>
          )}
        </div>

        {/* Live API sources strip */}
        {sources && sources.length > 0 && !isLoading && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-white/30">Live from:</span>
            {sources.filter(s => s !== "Database").map(s => (
              <span key={s} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-xs font-medium ${SOURCE_COLORS[s] ?? "bg-white/5 text-white/40 border-white/10"}`}>
                <Radio className="w-2 h-2 animate-pulse" /> {s}
              </span>
            ))}
          </div>
        )}

        {/* Trending chips (shown when search is empty + focused, or no filter active) */}
        <AnimatePresence>
          {!hasFilters && (searchFocused || true) && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="flex flex-wrap gap-2"
            >
              <span className="text-xs text-white/30 flex items-center gap-1 self-center shrink-0">
                <TrendingUp className="w-3 h-3" /> Try:
              </span>
              {TRENDING_SEARCHES.map(t => (
                <button
                  key={t.label}
                  onClick={() => applyTrending(t.label)}
                  className="px-3 py-1 rounded-full bg-white/5 border border-white/10 hover:border-primary/30 hover:bg-primary/10 text-xs text-white/50 hover:text-primary transition-all flex items-center gap-1.5"
                >
                  <span>{t.icon}</span> {t.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Smart expansion banner */}
        <AnimatePresence>
          {smartSearchActive && expandedTerms.length > 0 && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="glass-card px-4 py-3 flex flex-wrap items-center gap-2 border-primary/20 bg-primary/5"
            >
              <Zap className="w-4 h-4 text-primary shrink-0" />
              <span className="text-xs text-white/60 shrink-0">Smart search expanded to:</span>
              {expandedTerms.slice(0, 6).map(term => (
                <button
                  key={term}
                  onClick={() => { setSearch(term); setDebouncedSearch(term); }}
                  className="px-2.5 py-0.5 rounded-full bg-primary/15 border border-primary/25 text-xs text-primary hover:bg-primary/25 transition-colors capitalize"
                >
                  {term}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Fallback notice */}
        <AnimatePresence>
          {fallbackUsed && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="glass-card px-4 py-2.5 flex items-center gap-2 border-amber-500/20 bg-amber-500/5"
            >
              <Lightbulb className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-xs text-white/60">
                Showing related jobs — we broadened your search to ensure you always see opportunities.
              </span>
              {hasFilters && (
                <button onClick={clearAll} className="ml-auto text-xs text-amber-400 hover:underline shrink-0">
                  Clear filters
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results header with total count and active filter chips */}
        <div className="flex items-center justify-between flex-wrap gap-2 min-h-[28px]">
          {isLoading ? (
            <span className="flex items-center gap-1.5 text-sm text-white/40">
              <Loader2 className="w-3 h-3 animate-spin" /> Searching...
            </span>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">
                {total.toLocaleString()}
              </span>
              <span className="text-sm text-white/40">
                {total === 1 ? "job" : "jobs"}{hasFilters ? " found" : " available"}
              </span>
              {sortBy !== "latest" && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary/70">
                  {SORT_OPTIONS.find(o => o.value === sortBy)?.label}
                </span>
              )}
            </div>
          )}
          <div className="flex flex-wrap gap-1.5 justify-end">
            {[
              category && { label: category, clear: () => setCategory("") },
              location && { label: location, clear: () => setLocation("") },
              type && { label: type, clear: () => setType("") },
              remote && { label: "🌐 Remote", clear: () => setRemote(false) },
              fresher && { label: "🎓 Fresher", clear: () => setFresher(false) },
              experience && { label: EXPERIENCE_LEVELS.find(l => l.value === experience)?.label ?? experience, clear: () => setExperience("") },
              (minSalaryLPA || maxSalaryLPA) && { label: `₹${minSalaryLPA || "0"}–${maxSalaryLPA || "∞"}L`, clear: () => { setMinSalaryLPA(""); setMaxSalaryLPA(""); } },
              debouncedSearch && { label: `"${debouncedSearch}"`, clear: () => setSearch("") },
              ...skillsFilter.map(skill => ({ label: `⚡ ${skill}`, clear: () => toggleSkill(skill) })),
            ].filter(Boolean).map((tag: any) => (
              <button
                key={tag.label}
                onClick={tag.clear}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary hover:bg-primary/20 transition-colors"
              >
                {tag.label} <X className="w-3 h-3" />
              </button>
            ))}
            {activeFiltersCount > 0 && (
              <button onClick={clearAll} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/40 hover:text-red-400 hover:border-red-400/30 transition-colors">
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Loading skeletons */}
        {isLoading ? (
          <div className="space-y-4">
            {/* Popular category grid while loading */}
            <div className="grid grid-cols-3 gap-3">
              {POPULAR_CATEGORIES.map(pc => (
                <button
                  key={pc.label}
                  onClick={() => applyPopularCategory(pc.category, (pc as any).remote)}
                  className={`glass-card p-4 flex flex-col items-center gap-2 text-center hover:border-primary/30 transition-all bg-gradient-to-br ${pc.color}`}
                >
                  <span className="text-2xl">{pc.icon}</span>
                  <span className="text-xs font-medium text-white/70">{pc.label}</span>
                </button>
              ))}
            </div>
            <div className="grid xl:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <JobSkeleton key={i} />)}
            </div>
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-y-auto pr-0.5 space-y-6 pb-4">

            {/* Popular categories (when no filter active) */}
            {!hasFilters && (
              <div>
                <h3 className="text-sm font-semibold text-white/50 mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4" /> Browse by Category
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {POPULAR_CATEGORIES.map(pc => (
                    <button
                      key={pc.label}
                      onClick={() => applyPopularCategory(pc.category, (pc as any).remote)}
                      className={`glass-card p-4 flex flex-col items-center gap-2 text-center hover:border-primary/30 transition-all group bg-gradient-to-br ${pc.color}`}
                    >
                      <span className="text-2xl group-hover:scale-110 transition-transform">{pc.icon}</span>
                      <span className="text-xs font-medium text-white/60 group-hover:text-white transition-colors">{pc.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Best Jobs For You ─────────────────────────────────── */}
            {!hasFilters && bestMatchJobs.length > 0 && sortBy !== "relevant" && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Star className="w-3.5 h-3.5 text-primary fill-primary/60" />
                    </span>
                    Best Jobs For You
                    <span className="text-xs text-white/30 font-normal">Based on your profile</span>
                  </h3>
                  <button
                    onClick={() => setSortBy("relevant")}
                    className="text-xs text-primary hover:text-primary/70 flex items-center gap-1 transition-colors"
                  >
                    View all <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="grid xl:grid-cols-2 gap-4">
                  {bestMatchJobs.map(job => (
                    <JobCard key={`best-${job.id}`} job={job} onSelect={() => setSelectedJob(job)} isSaved={savedJobIds.has(job.id)} onToggleSave={handleToggleSave} />
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── Main Job Cards ─────────────────────────────────────── */}
            {jobs.length > 0 && (
              <div>
                {hasFilters && (
                  <h3 className="text-sm font-semibold text-white/50 mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" /> Results
                    {smartSearchActive && <span className="text-xs text-primary/70 font-normal">(AI-expanded)</span>}
                    {fallbackUsed && <span className="text-xs text-amber-400/70 font-normal">(showing related)</span>}
                  </h3>
                )}
                {!hasFilters && sortBy === "relevant" && (
                  <h3 className="text-sm font-semibold text-white/50 mb-3 flex items-center gap-2">
                    <Star className="w-4 h-4 text-primary fill-primary/50" /> Sorted by Best Match
                  </h3>
                )}
                {!hasFilters && sortBy !== "relevant" && (
                  <h3 className="text-sm font-semibold text-white/50 mb-3 flex items-center gap-2">
                    <Radio className="w-4 h-4 animate-pulse text-green-400" /> Latest Jobs
                  </h3>
                )}
                <div className="grid xl:grid-cols-2 gap-4">
                  {jobs.map(job => (
                    <JobCard key={job.id} job={job} onSelect={() => setSelectedJob(job)} isSaved={savedJobIds.has(job.id)} onToggleSave={handleToggleSave} />
                  ))}
                </div>

                {/* Load More / Pagination */}
                {jobs.length > 0 && (
                  <div className="pt-2 flex flex-col items-center gap-3">
                    <p className="text-xs text-white/30">
                      Showing <span className="text-white/60 font-semibold">{jobs.length.toLocaleString()}</span>
                      {total > jobs.length && <> of <span className="text-white/60 font-semibold">{total.toLocaleString()}</span></>}
                      {" "}jobs
                    </p>
                    {total > fetchLimit && (
                      <button
                        onClick={() => setFetchLimit(l => l + 30)}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-primary/10 hover:border-primary/30 text-sm text-white/60 hover:text-primary transition-all disabled:opacity-50"
                      >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                        Load More Jobs
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* "You may also like" — related categories */}
            {relatedCategories.length > 0 && hasFilters && (
              <div className="glass-card p-5 border-primary/10">
                <h3 className="text-sm font-semibold text-white/70 mb-3 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-400" /> You may also like
                </h3>
                <div className="flex flex-wrap gap-2">
                  {relatedCategories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => { setCategory(cat); setSearch(""); }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:border-primary/30 hover:bg-primary/10 text-sm text-white/60 hover:text-primary transition-all"
                    >
                      {cat} <ChevronRight className="w-3 h-3 opacity-50" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Trending now (when no search and no category) */}
            {!hasFilters && (
              <div className="glass-card p-5">
                <h3 className="text-sm font-semibold text-white/50 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" /> Trending Searches
                </h3>
                <div className="flex flex-wrap gap-2">
                  {TRENDING_SEARCHES.map(t => (
                    <button
                      key={t.label}
                      onClick={() => applyTrending(t.label)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:border-primary/30 hover:bg-primary/10 text-sm text-white/50 hover:text-primary transition-all"
                    >
                      <span>{t.icon}</span> {t.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Job Detail Modal ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedJob && <JobDetailModal job={selectedJob} onClose={() => setSelectedJob(null)} isSaved={savedJobIds.has(selectedJob.id)} onToggleSave={handleToggleSave} />}
      </AnimatePresence>

      {/* ── Mobile Filters Drawer ─────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileFiltersOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setMobileFiltersOpen(false)}
            />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 lg:hidden glass-panel rounded-t-3xl max-h-[85vh] flex flex-col overflow-hidden"
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-primary" /> Filters & Sort
                </h3>
                <button onClick={() => setMobileFiltersOpen(false)} className="p-2 rounded-lg hover:bg-white/10 text-white/40">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable filter content */}
              <div className="overflow-y-auto flex-1 p-5 space-y-6">

                {/* Sort */}
                <div>
                  <label className="block text-xs text-white/40 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <ArrowUpDown className="w-3.5 h-3.5" /> Sort By
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {SORT_OPTIONS.map(opt => (
                      <button key={opt.value} onClick={() => setSortBy(opt.value)}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl text-xs font-medium transition-all border ${sortBy === opt.value ? "bg-primary/15 border-primary/30 text-primary" : "bg-white/5 border-white/10 text-white/50"}`}>
                        <span className="text-lg">{opt.icon}</span>
                        <span className="text-center leading-tight">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Experience */}
                <div>
                  <label className="block text-xs text-white/40 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" /> Experience Level
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {EXPERIENCE_LEVELS.map(lvl => (
                      <button key={lvl.value} onClick={() => setExperience(experience === lvl.value ? "" : lvl.value)}
                        className={`flex items-center gap-2 p-3 rounded-xl text-sm transition-all border ${experience === lvl.value ? "bg-primary/15 border-primary/30 text-primary" : "bg-white/5 border-white/10 text-white/50"}`}>
                        <span>{lvl.icon}</span>
                        <div className="text-left">
                          <div className="font-medium text-xs">{lvl.label}</div>
                          <div className="text-[10px] opacity-60">{lvl.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">Category</label>
                  <select value={category} onChange={e => setCategory(e.target.value)} className="input-field py-2.5 text-sm w-full">
                    <option value="">All Categories</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">City / Location</label>
                  <select value={location} onChange={e => setLocation(e.target.value)} className="input-field py-2.5 text-sm w-full">
                    <option value="">All India</option>
                    {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>

                {/* Job Type */}
                <div>
                  <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">Job Type</label>
                  <select value={type} onChange={e => setType(e.target.value)} className="input-field py-2.5 text-sm w-full">
                    <option value="">Any Type</option>
                    {JOB_TYPES.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
                  </select>
                </div>

                {/* Salary */}
                <div>
                  <label className="block text-xs text-white/40 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <IndianRupee className="w-3.5 h-3.5" /> Salary Range (LPA)
                  </label>
                  <DualRangeSlider
                    min={0} max={30} step={1}
                    valueMin={Number(minSalaryLPA) || 0}
                    valueMax={Number(maxSalaryLPA) || 30}
                    onChangeMin={v => setMinSalaryLPA(v === 0 ? "" : String(v))}
                    onChangeMax={v => setMaxSalaryLPA(v === 30 ? "" : String(v))}
                    formatLabel={v => v === 0 ? "₹0" : v === 30 ? "₹30L+" : `₹${v}L`}
                  />
                  <div className="flex gap-2 mt-3">
                    {[{ label: "3–6L", min: "3", max: "6" }, { label: "6–12L", min: "6", max: "12" }, { label: "12L+", min: "12", max: "" }].map(p => (
                      <button key={p.label} onClick={() => { setMinSalaryLPA(p.min); setMaxSalaryLPA(p.max); }}
                        className={`flex-1 py-2 rounded-lg text-xs border transition-all ${minSalaryLPA === p.min && maxSalaryLPA === p.max ? "bg-primary/15 border-primary/30 text-primary" : "bg-white/5 border-white/10 text-white/50"}`}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Skills */}
                <div>
                  <label className="block text-xs text-white/40 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" /> Skills
                    {skillsFilter.length > 0 && <span className="ml-auto text-primary font-semibold">{skillsFilter.length} selected</span>}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {POPULAR_SKILLS.map(skill => {
                      const active = skillsFilter.includes(skill);
                      return (
                        <button
                          key={skill}
                          onClick={() => toggleSkill(skill)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs border transition-all ${active ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300 font-semibold" : "bg-white/5 border-white/10 text-white/50 hover:text-white"}`}
                        >
                          {active && "✓ "}{skill}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Toggles */}
                <div className="space-y-3">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm text-white/70 flex items-center gap-2"><Wifi className="w-4 h-4 text-primary" /> Remote Only</span>
                    <Toggle on={remote} onToggle={() => setRemote(p => !p)} />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm text-white/70 flex items-center gap-2"><GraduationCap className="w-4 h-4 text-primary" /> Fresher / Intern</span>
                    <Toggle on={fresher} onToggle={() => setFresher(p => !p)} />
                  </label>
                </div>
              </div>

              {/* Footer actions */}
              <div className="p-4 border-t border-white/[0.06] flex gap-3 bg-black/20">
                {activeFiltersCount > 0 && (
                  <button onClick={() => { clearAll(); setMobileFiltersOpen(false); }}
                    className="flex-1 py-3 rounded-xl border border-white/10 text-sm text-white/50 hover:text-white transition-colors">
                    Clear All ({activeFiltersCount})
                  </button>
                )}
                <button onClick={() => setMobileFiltersOpen(false)}
                  className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors">
                  Show {isLoading ? "..." : total.toLocaleString()} Jobs
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Company Logo with fallback ─────────────────────────────────────────── */
function CompanyLogo({ logoUrl, company }: { logoUrl?: string | null; company: string }) {
  const [failed, setFailed] = useState(false);
  if (logoUrl && !failed) {
    return (
      <img
        src={logoUrl}
        alt={company}
        className="w-full h-full object-contain p-0.5"
        onError={() => setFailed(true)}
      />
    );
  }
  // Fallback: coloured initial
  const initial = company.charAt(0).toUpperCase();
  const colors = ["bg-blue-600", "bg-purple-600", "bg-green-700", "bg-orange-600", "bg-pink-600", "bg-cyan-700", "bg-indigo-600"];
  const color = colors[company.charCodeAt(0) % colors.length];
  return (
    <div className={`w-full h-full ${color} flex items-center justify-center rounded-lg text-white font-bold text-base`}>
      {initial}
    </div>
  );
}

/* ─── Salary formatter ──────────────────────────────────────────────────── */
function formatSalary(min?: number | null, max?: number | null): string | null {
  if (!min && !max) return null;
  const fmt = (n: number) => n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : `₹${(n / 1000).toFixed(0)}K`;
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `${fmt(min)}+`;
  if (max) return `Up to ${fmt(max)}`;
  return null;
}

/* ─── Job Card ───────────────────────────────────────────────────────────── */
function JobCard({ job, onSelect, isSaved, onToggleSave }: {
  job: LiveJobType;
  onSelect: () => void;
  isSaved?: boolean;
  onToggleSave?: (job: LiveJobType) => void;
}) {
  const salary = formatSalary(job.salaryMin, job.salaryMax);
  const daysAgo = Math.floor((Date.now() - new Date(job.postedAt ?? Date.now()).getTime()) / 86400000);
  const postedLabel = daysAgo === 0 ? "Today" : daysAgo === 1 ? "Yesterday" : `${daysAgo}d ago`;
  const matchScore = job.matchScore;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-0 flex flex-col hover:border-primary/40 group cursor-pointer transition-all overflow-hidden"
      onClick={onSelect}
    >
      {/* Top bar */}
      <div className="p-4 pb-3 flex gap-3 items-start">
        {/* Logo */}
        <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
          <CompanyLogo logoUrl={job.companyLogoUrl} company={job.company} />
        </div>

        {/* Title + company */}
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-[13px] leading-snug group-hover:text-primary transition-colors line-clamp-2">{job.title}</h3>
          <p className="text-white/55 text-xs mt-0.5 flex items-center gap-1 truncate">
            <Building2 className="w-3 h-3 shrink-0" />
            {job.company}
          </p>
        </div>

        {/* Badges */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          {matchScore !== undefined && matchScore > 0 && (
            <MatchBadge score={matchScore} />
          )}
          {(job as any).isDirectPost && (
            <span className="px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/25 text-[11px] font-medium">🏢 Direct Post</span>
          )}
          {job.isRemote && (
            <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 text-[11px] font-medium">🌐 Remote</span>
          )}
          {job.isFresher && (
            <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[11px] font-medium">🎓 Fresher</span>
          )}
        </div>
      </div>

      {/* Meta row */}
      <div className="px-4 pb-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-white/45">
        <span className="flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {job.location}
        </span>
        {salary && (
          <span className="flex items-center gap-1 text-green-400/80 font-medium">
            <IndianRupee className="w-3 h-3" />
            {salary}
          </span>
        )}
        <span className="flex items-center gap-1 capitalize">
          <Briefcase className="w-3 h-3" />
          {job.type?.replace(/-/g, " ")}
        </span>
        <span className="flex items-center gap-1 text-white/30">
          <Clock className="w-3 h-3" />
          {postedLabel}
        </span>
      </div>

      {/* Skills */}
      {job.skills.length > 0 && job.skills[0] !== "General" && (
        <div className="px-4 pb-3 flex flex-wrap gap-1.5">
          {job.skills.slice(0, 4).map(skill => (
            <span key={skill} className="px-2 py-0.5 rounded-md bg-primary/5 border border-primary/10 text-xs text-primary/70">{skill}</span>
          ))}
          {job.skills.length > 4 && (
            <span className="px-2 py-0.5 text-xs text-white/25">+{job.skills.length - 4} more</span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-white/[0.06] bg-white/[0.02] mt-auto">
        <SourceBadge source={(job as any).source} />
        <div className="flex items-center gap-2">
          {onToggleSave && (
            <button
              onClick={e => { e.stopPropagation(); onToggleSave(job); }}
              className={`p-1.5 rounded-lg transition-all ${isSaved ? "text-indigo-400 hover:text-indigo-300" : "text-white/20 hover:text-indigo-400 opacity-0 group-hover:opacity-100"}`}
              title={isSaved ? "Remove from saved" : "Save job"}
            >
              {isSaved ? <BookmarkCheck className="w-3.5 h-3.5 fill-indigo-400" /> : <Bookmark className="w-3.5 h-3.5" />}
            </button>
          )}
          <span className="text-xs text-primary font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-1 group-hover:translate-x-0">
            View & Apply <ExternalLink className="w-3 h-3" />
          </span>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── HTML description sanitizer ────────────────────────────────────────── */
function sanitizeDescription(raw: string): { html: string; isHtml: boolean } {
  if (!raw) return { html: "", isHtml: false };

  // Detect if content has HTML tags
  const hasHtml = /<[a-z][\s\S]*>/i.test(raw);

  if (!hasHtml) {
    // Plain text: convert newlines to <br>, wrap in <p> blocks
    const paragraphs = raw.split(/\n{2,}/).filter(Boolean);
    const html = paragraphs.length > 1
      ? paragraphs.map(p => `<p>${p.replace(/\n/g, "<br>")}</p>`).join("")
      : `<p>${raw.replace(/\n/g, "<br>")}</p>`;
    return { html: DOMPurify.sanitize(html), isHtml: false };
  }

  // Sanitize HTML: allow only safe tags
  const clean = DOMPurify.sanitize(raw, {
    ALLOWED_TAGS: [
      "p", "br", "strong", "b", "em", "i", "u",
      "h1", "h2", "h3", "h4", "h5", "h6",
      "ul", "ol", "li",
      "a", "hr", "span", "div", "section",
    ],
    ALLOWED_ATTR: ["href", "target", "rel"],
    FORBID_TAGS: ["script", "iframe", "object", "embed", "form", "input"],
    FORBID_ATTR: ["style", "class", "id", "onclick", "onload"],
  });

  // Collapse 3+ consecutive <br> into just 2
  const cleaned = clean
    .replace(/(<br\s*\/?>\s*){3,}/gi, "<br><br>")
    .replace(/&nbsp;/g, " ")
    .trim();

  return { html: cleaned, isHtml: true };
}

/* ─── Expandable HTML description ───────────────────────────────────────── */
function JobDescription({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const { html } = useMemo(() => sanitizeDescription(text), [text]);

  if (!html) {
    return <p className="text-sm text-white/40 italic">No description available.</p>;
  }

  return (
    <div>
      <div className="relative">
        <div
          className={`job-desc overflow-hidden transition-all duration-500 ${expanded ? "" : "max-h-56"}`}
          dangerouslySetInnerHTML={{ __html: html }}
        />

        {/* Fade overlay — matches body/modal background exactly */}
        {!expanded && (
          <div
            className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
            style={{ background: "linear-gradient(to top, hsl(240 50% 3%) 0%, transparent 100%)" }}
          />
        )}
      </div>

      {/* Read More — always outside the overflow container so it's never clipped */}
      <button
        onClick={() => setExpanded(p => !p)}
        className="mt-3 text-xs text-primary hover:text-primary/70 font-semibold flex items-center gap-1.5 transition-colors group"
      >
        <span>{expanded ? "Show less" : "Read more"}</span>
        <span className={`inline-block transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}>↓</span>
      </button>
    </div>
  );
}

/* ─── Section header ─────────────────────────────────────────────────────── */
function SectionTitle({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-5 h-5 rounded-md bg-primary/15 flex items-center justify-center text-primary shrink-0">
        {icon}
      </div>
      <h4 className="font-semibold text-sm text-white/80 tracking-wide">{children}</h4>
    </div>
  );
}

/* ─── Job Detail Modal ───────────────────────────────────────────────────── */
function JobDetailModal({ job, onClose, isSaved, onToggleSave }: {
  job: LiveJobType;
  onClose: () => void;
  isSaved?: boolean;
  onToggleSave?: (job: LiveJobType) => void;
}) {
  const [tab, setTab] = useState<"details" | "cover-letter" | "recruiter" | "apply">("details");
  const [applied, setApplied] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [recruiterMsg, setRecruiterMsg] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const applyMutation = useCreateApplication();
  const coverLetterMut = useGenerateCoverLetter({ mutation: { onSuccess: d => setCoverLetter(d.content) } });
  const recruiterMut = useGenerateRecruiterMessage({ mutation: { onSuccess: d => setRecruiterMsg(d.content) } });
  const { isDemoMode, openAuthModal } = useDemoStore();

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  const handleApply = async () => {
    if (isDemoMode) { openAuthModal("Track & Apply"); return; }
    try {
      await applyMutation.mutateAsync({ data: { jobId: job.id, coverLetter: coverLetter || undefined } });
      setApplied(true);
    } catch (e: any) {
      alert(e.message || "Already applied or an error occurred.");
    }
  };

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const applyUrl = (job as any).applyUrl as string | null;
  const source = (job as any).source as string | null;

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 20 }}
        transition={{ type: "spring", bounce: 0.1, duration: 0.4 }}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100vw-2rem)] max-w-2xl h-[90vh] max-h-[90vh] flex flex-col glass-panel rounded-3xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/5 flex items-start justify-between gap-3 shrink-0">
          <div className="flex gap-3 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
              {job.companyLogoUrl
                ? <img src={job.companyLogoUrl} alt={job.company} className="w-full h-full object-contain p-0.5" />
                : <Building2 className="w-6 h-6 text-white/30" />
              }
            </div>
            <div className="min-w-0">
              <h2 className="font-display font-bold text-lg leading-tight line-clamp-2">{job.title}</h2>
              <p className="text-white/55 text-sm mt-0.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 shrink-0" />{job.company}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {job.isRemote && <span className="px-2 py-0.5 rounded-md bg-green-500/10 text-green-400 border border-green-500/20 text-xs">Remote</span>}
                {job.isFresher && <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs">Fresher OK</span>}
                <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-xs text-white/50 capitalize">{job.type?.replace("-", " ")}</span>
                <SourceBadge source={source} />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0 mt-0.5">
            {onToggleSave && (
              <button
                onClick={() => onToggleSave(job)}
                className={`p-1.5 rounded-lg transition-colors ${isSaved ? "text-indigo-400 hover:text-indigo-300" : "text-white/30 hover:text-indigo-400"}`}
                title={isSaved ? "Remove from saved" : "Save job"}
              >
                {isSaved ? <BookmarkCheck className="w-5 h-5 fill-indigo-400/30" /> : <Bookmark className="w-5 h-5" />}
              </button>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-3 border-b border-white/5 shrink-0">
          {([
            { id: "details", label: "Details" },
            { id: "cover-letter", label: "Cover Letter" },
            { id: "recruiter", label: "Outreach" },
            { id: "apply", label: "Apply" },
          ] as const).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id ? "bg-primary text-white" : "text-white/50 hover:text-white hover:bg-white/5"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content — split padding so bottom is never clipped by scroll container */}
        <div className="flex-1 overflow-y-auto px-6 pt-5 pb-6 scroll-smooth" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.1) transparent" }}>
          {tab === "details" && (
            <div className="space-y-6">

              {/* Quick action (external apply link) */}
              {applyUrl && (
                <a href={applyUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-between gap-3 w-full px-4 py-3 rounded-xl bg-primary/10 border border-primary/25 hover:bg-primary/20 transition-colors group">
                  <div className="flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-sm font-medium text-primary">View & Apply on {source}</span>
                  </div>
                  <span className="text-xs text-white/40 group-hover:text-primary transition-colors">→</span>
                </a>
              )}

              {/* Job meta grid */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="glass-card p-3.5">
                  <p className="text-[10px] text-white/35 uppercase tracking-wider mb-1.5">Location</p>
                  <p className="font-medium text-sm flex items-center gap-1.5 text-white/80">
                    <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />{job.location}
                  </p>
                </div>

                {(job.salaryMin || job.salaryMax) ? (
                  <div className="glass-card p-3.5">
                    <p className="text-[10px] text-white/35 uppercase tracking-wider mb-1.5">Salary</p>
                    <p className="font-semibold text-sm flex items-center gap-1.5 text-green-400">
                      <IndianRupee className="w-3.5 h-3.5 shrink-0" />
                      {formatSalary(job.salaryMin, job.salaryMax)}
                    </p>
                  </div>
                ) : (
                  <div className="glass-card p-3.5">
                    <p className="text-[10px] text-white/35 uppercase tracking-wider mb-1.5">Job Type</p>
                    <p className="font-medium text-sm text-white/70 capitalize">{job.type?.replace(/-/g, " ")}</p>
                  </div>
                )}

                <div className="glass-card p-3.5">
                  <p className="text-[10px] text-white/35 uppercase tracking-wider mb-1.5">Posted</p>
                  <p className="font-medium text-sm text-white/70 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                    {format(new Date(job.postedAt), "MMM d, yyyy")}
                  </p>
                </div>

                <div className="glass-card p-3.5">
                  <p className="text-[10px] text-white/35 uppercase tracking-wider mb-1.5">Experience</p>
                  <p className="font-medium text-sm text-white/70">
                    {job.isFresher ? "🎓 Fresher OK" :
                     job.experienceYears ? `${job.experienceYears}+ years` : "Not specified"}
                  </p>
                </div>

                {job.category && (
                  <div className="glass-card p-3.5">
                    <p className="text-[10px] text-white/35 uppercase tracking-wider mb-1.5">Category</p>
                    <p className="font-medium text-sm text-white/70">{job.category}</p>
                  </div>
                )}

                <div className="glass-card p-3.5">
                  <p className="text-[10px] text-white/35 uppercase tracking-wider mb-1.5">Work Mode</p>
                  <p className="font-medium text-sm text-white/70">
                    {job.isRemote ? "🌐 Remote" : "🏢 On-site"}
                  </p>
                </div>
              </div>

              {/* Skills */}
              {job.skills.length > 0 && job.skills[0] !== "General" && (
                <div>
                  <SectionTitle icon={<Sparkles className="w-3 h-3" />}>Required Skills</SectionTitle>
                  <div className="flex flex-wrap gap-2">
                    {job.skills.map(s => (
                      <span key={s} className="px-3 py-1.5 rounded-lg bg-primary/8 border border-primary/15 text-xs font-medium text-primary hover:bg-primary/15 transition-colors">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* About the Role — HTML rendered */}
              {job.description && (
                <div>
                  <SectionTitle icon={<Briefcase className="w-3 h-3" />}>About the Role</SectionTitle>
                  <JobDescription text={job.description} />
                </div>
              )}

              {/* Requirements */}
              {job.requirements.length > 0 && (
                <div>
                  <SectionTitle icon={<CheckCircle2 className="w-3 h-3" />}>Requirements</SectionTitle>
                  <ul className="space-y-2.5">
                    {job.requirements.map((r, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-white/60 leading-relaxed">
                        <div className="w-5 h-5 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-[10px] font-bold text-primary">{i + 1}</span>
                        </div>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {tab === "cover-letter" && (
            <div className="space-y-4">
              <p className="text-sm text-white/60">AI-generates a personalized cover letter for <strong className="text-white">{job.title}</strong> at <strong className="text-white">{job.company}</strong>.</p>
              <button onClick={() => { if (isDemoMode) { openAuthModal("AI Cover Letter"); return; } coverLetterMut.mutate({ data: { jobTitle: job.title, company: job.company, jobDescription: job.description, userSkills: job.skills } }); }}
                disabled={coverLetterMut.isPending} className="btn-primary gap-2">
                {coverLetterMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Generate Cover Letter
              </button>
              {coverLetter && (
                <div className="relative">
                  <div className="glass-card p-5 text-sm text-white/80 whitespace-pre-wrap leading-relaxed font-mono max-h-80 overflow-y-auto">{coverLetter}</div>
                  <button onClick={() => copy(coverLetter, "cl")} className="absolute top-3 right-3 p-2 rounded-lg bg-black/30 hover:bg-black/50 text-white/60 hover:text-white">
                    {copied === "cl" ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              )}
            </div>
          )}

          {tab === "recruiter" && (
            <div className="space-y-4">
              <p className="text-sm text-white/60">Generate a professional recruiter outreach message for this role.</p>
              <button onClick={() => { if (isDemoMode) { openAuthModal("Recruiter Outreach"); return; } recruiterMut.mutate({ data: { jobTitle: job.title, company: job.company, userSkills: job.skills } }); }}
                disabled={recruiterMut.isPending} className="btn-primary gap-2">
                {recruiterMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                Generate Message
              </button>
              {recruiterMsg && (
                <div className="relative">
                  <div className="glass-card p-5 text-sm text-white/80 whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto">{recruiterMsg}</div>
                  <button onClick={() => copy(recruiterMsg, "rm")} className="absolute top-3 right-3 p-2 rounded-lg bg-black/30 hover:bg-black/50 text-white/60 hover:text-white">
                    {copied === "rm" ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              )}
            </div>
          )}

          {tab === "apply" && (
            <div className="space-y-5">
              {applied ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">Application Submitted!</h3>
                  <p className="text-white/60 text-sm">Track your progress in the Applications tab.</p>
                </div>
              ) : (
                <>
                  <div>
                    <h4 className="font-semibold mb-1">Applying for: <span className="text-primary">{job.title}</span></h4>
                    <p className="text-sm text-white/60">at {job.company} · {job.location}</p>
                  </div>
                  {coverLetter
                    ? <div><label className="block text-sm text-white/60 mb-2">Cover Letter (AI-generated)</label>
                        <div className="glass-card p-4 text-sm text-white/70 whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">{coverLetter}</div>
                      </div>
                    : <div className="glass-card p-4 flex items-center gap-3 border-primary/20 bg-primary/5">
                        <FileText className="w-5 h-5 text-primary shrink-0" />
                        <p className="text-sm text-white/70">Generate a cover letter first to strengthen your application.</p>
                      </div>
                  }
                  {applyUrl && (
                    <a href={applyUrl} target="_blank" rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-sm font-medium text-white/70 transition-colors">
                      <ExternalLink className="w-4 h-4" /> Apply directly on {source}
                    </a>
                  )}
                  <button onClick={handleApply} disabled={applyMutation.isPending} className="btn-primary w-full gap-2">
                    {applyMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Sparkles className="w-4 h-4" /> Track Application</>}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}

