import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import {
  Star, MapPin, Building2, IndianRupee, Loader2, Sparkles,
  ChevronLeft, ChevronRight, UserCheck, ArrowRight, Bookmark, BookmarkCheck,
  Zap, Trophy,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/hooks/use-auth";

const API = import.meta.env.VITE_API_URL ?? "/api";

export interface RecommendedJob {
  id: number;
  title: string;
  company: string;
  companyLogoUrl: string | null;
  location: string;
  salaryMin: number | null;
  salaryMax: number | null;
  type: string;
  postedAt: string;
  matchScore: number;
  isRemote: boolean;
  isFresher: boolean;
  skills: string[];
  applyUrl: string | null;
  source: string;
}

function formatSalary(min: number | null, max: number | null): string | null {
  if (!min && !max) return null;
  const fmt = (v: number) => `₹${(v / 100000).toFixed(0)}L`;
  if (min && max) return `${fmt(min)}–${fmt(max)}`;
  if (max) return `Up to ${fmt(max)}`;
  return `${fmt(min!)}+`;
}

function MatchBadge({ score, rank }: { score: number; rank: number }) {
  const isBest = rank < 3;
  const color = score >= 80
    ? "bg-green-500/15 text-green-400 border-green-500/25"
    : score >= 60
    ? "bg-amber-500/15 text-amber-400 border-amber-500/25"
    : "bg-white/8 text-white/50 border-white/15";

  return (
    <div className="flex items-center gap-1.5">
      {isBest && (
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-[10px] font-bold">
          <Trophy className="w-2.5 h-2.5" /> Best Match
        </span>
      )}
      <span className={`px-2.5 py-0.5 rounded-full border text-xs font-bold ${color}`}>
        {score}% match
      </span>
    </div>
  );
}

function RecoCardSkeleton() {
  return (
    <div className="glass-card p-5 min-w-[280px] max-w-[280px] flex flex-col gap-3 animate-pulse shrink-0">
      <div className="flex gap-3">
        <div className="w-12 h-12 rounded-xl bg-white/5 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-white/5 rounded w-3/4" />
          <div className="h-3 bg-white/5 rounded w-1/2" />
        </div>
      </div>
      <div className="h-3 bg-white/5 rounded w-2/3" />
      <div className="h-6 bg-white/5 rounded-full w-1/3" />
      <div className="flex gap-2">
        <div className="h-6 bg-white/5 rounded-lg w-16" />
        <div className="h-6 bg-white/5 rounded-lg w-16" />
      </div>
    </div>
  );
}

interface Props {
  profileCompletion: number;
  onSelectJob: (job: RecommendedJob) => void;
  savedJobIds: Set<number>;
  onToggleSave: (job: any) => void;
}

export default function RecommendedJobs({ profileCompletion, onSelectJob, savedJobIds, onToggleSave }: Props) {
  const token = useAuthStore(s => s.token);
  const [jobs, setJobs] = useState<RecommendedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    (async () => {
      try {
        const res = await fetch(`${API}/jobs/recommended`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setJobs(data);
        }
      } catch {}
      setLoading(false);
    })();
  }, [token]);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll);
    return () => el.removeEventListener("scroll", checkScroll);
  }, [jobs]);

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "right" ? 296 : -296, behavior: "smooth" });
  };

  // Hide section if profile is very incomplete and no recommendations
  if (!loading && jobs.length === 0 && profileCompletion < 40) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-5 border-primary/10 bg-gradient-to-r from-primary/5 to-indigo-500/5"
      >
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
              <UserCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">Complete your profile to unlock AI recommendations</h3>
              <p className="text-xs text-white/50 mt-0.5">We'll show personalised jobs matching your skills and preferences.</p>
            </div>
          </div>
          <a
            href="/dashboard/profile"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors shrink-0"
          >
            Complete Profile <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
        <div className="mt-3 h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-indigo-500 rounded-full transition-all"
            style={{ width: `${profileCompletion}%` }}
          />
        </div>
        <p className="text-[10px] text-white/30 mt-1">{profileCompletion}% complete</p>
      </motion.div>
    );
  }

  if (!loading && jobs.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-base flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500/30 to-yellow-500/20 flex items-center justify-center">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400/60" />
            </span>
            Recommended For You
            <span className="text-xs font-normal text-white/35 ml-1">Based on your profile & skills</span>
          </h2>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Scroll arrows */}
          <button
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Horizontal scroll strip */}
      <div className="relative">
        {/* Left fade */}
        {canScrollLeft && (
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[hsl(240_32%_8%/0.9)] to-transparent z-10 pointer-events-none rounded-l-xl" />
        )}
        {/* Right fade */}
        {canScrollRight && (
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[hsl(240_32%_8%/0.9)] to-transparent z-10 pointer-events-none rounded-r-xl" />
        )}

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-1"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {loading
            ? Array.from({ length: 5 }).map((_, i) => <RecoCardSkeleton key={i} />)
            : jobs.map((job, idx) => (
              <RecoCard
                key={job.id}
                job={job}
                rank={idx}
                isSaved={savedJobIds.has(job.id)}
                onToggleSave={onToggleSave}
                onClick={() => onSelectJob(job)}
              />
            ))
          }
        </div>
      </div>

      {/* Low profile completion nudge */}
      {!loading && jobs.length > 0 && profileCompletion < 60 && (
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.07]">
          <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
          <p className="text-xs text-white/45 flex-1">
            Complete your profile to improve recommendations — currently {profileCompletion}% done.
          </p>
          <a href="/dashboard/profile" className="text-xs text-primary hover:underline shrink-0 flex items-center gap-1">
            Update <ArrowRight className="w-3 h-3" />
          </a>
        </div>
      )}
    </motion.div>
  );
}

function RecoCard({
  job, rank, isSaved, onToggleSave, onClick,
}: {
  job: RecommendedJob;
  rank: number;
  isSaved: boolean;
  onToggleSave: (job: any) => void;
  onClick: () => void;
}) {
  const salary = formatSalary(job.salaryMin, job.salaryMax);
  const isBest = rank < 3;

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.06 }}
      onClick={onClick}
      className={`glass-card min-w-[284px] max-w-[284px] shrink-0 flex flex-col gap-3 cursor-pointer hover:border-primary/40 transition-all group relative overflow-hidden ${isBest ? "border-amber-500/20" : ""}`}
    >
      {/* Top glow for top-3 */}
      {isBest && (
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-amber-500/50 via-yellow-400/60 to-amber-500/50" />
      )}

      {/* Header */}
      <div className="flex items-start gap-3 pt-4 px-4">
        <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
          {job.companyLogoUrl
            ? <img src={job.companyLogoUrl} alt={job.company} className="w-full h-full object-contain p-1" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
            : <span className="text-base font-bold text-white/30">{job.company.charAt(0)}</span>
          }
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-[13px] leading-tight line-clamp-2 group-hover:text-primary transition-colors">{job.title}</h3>
          <p className="text-xs text-white/45 flex items-center gap-1 mt-0.5">
            <Building2 className="w-3 h-3 shrink-0" />
            <span className="truncate">{job.company}</span>
          </p>
        </div>
        {/* Save button */}
        <button
          onClick={e => { e.stopPropagation(); onToggleSave(job); }}
          className={`p-1.5 rounded-lg transition-colors shrink-0 mt-0.5 ${isSaved ? "text-indigo-400" : "text-white/20 hover:text-indigo-400 opacity-0 group-hover:opacity-100"}`}
          title={isSaved ? "Remove from saved" : "Save job"}
        >
          {isSaved ? <BookmarkCheck className="w-3.5 h-3.5 fill-indigo-400/30" /> : <Bookmark className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Meta */}
      <div className="px-4 space-y-1.5">
        <div className="flex items-center gap-1 text-xs text-white/40">
          <MapPin className="w-3 h-3 shrink-0" />
          <span className="truncate">{job.isRemote ? "Remote" : job.location}</span>
          {job.isRemote && <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] bg-green-500/10 text-green-400 border border-green-500/20">Remote</span>}
        </div>
        {salary && (
          <div className="flex items-center gap-1 text-xs text-green-400/80 font-medium">
            <IndianRupee className="w-3 h-3 shrink-0" />
            {salary} / year
          </div>
        )}
      </div>

      {/* Skills */}
      {job.skills.length > 0 && (
        <div className="px-4 flex flex-wrap gap-1">
          {job.skills.slice(0, 3).map(s => (
            <span key={s} className="px-1.5 py-0.5 rounded bg-white/5 border border-white/8 text-[10px] text-white/40">{s}</span>
          ))}
          {job.skills.length > 3 && (
            <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/8 text-[10px] text-white/30">+{job.skills.length - 3}</span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="px-4 pb-4 flex items-center justify-between gap-2 mt-auto">
        <MatchBadge score={job.matchScore} rank={rank} />
        <span className="text-[10px] text-white/30 capitalize">{job.type?.replace("-", " ")}</span>
      </div>
    </motion.div>
  );
}
