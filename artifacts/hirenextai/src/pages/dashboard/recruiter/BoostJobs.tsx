import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  Zap, Briefcase, CheckCircle2, Clock, TrendingUp, Crown, RefreshCw,
  MapPin, ExternalLink, Star, Sparkles,
} from "lucide-react";
import { Link } from "wouter";

const API = import.meta.env.VITE_API_URL ?? "/api";

interface RecruiterJob {
  id: number;
  title: string;
  company: string;
  location: string;
  type: string;
  isBoosted: boolean;
  isFeatured: boolean;
  boostedAt?: string;
  featuredAt?: string;
  boostExpiry?: string;
  featuredExpiry?: string;
  applicationCount: number;
  viewCount: number;
  postedAt: string;
}

interface SubInfo {
  recruiterPlan: string;
  planLabel: string;
  jobBoostCredits: number;
  featuredJobsCredits: number;
  activeJobs: number;
}

type ConfirmAction = { jobId: number; type: "boost" | "featured" };

function PlanBadge({ plan }: { plan: string }) {
  const cfg: Record<string, { cls: string; label: string }> = {
    free:       { cls: "bg-white/5 text-white/50 border-white/10", label: "Free" },
    starter:    { cls: "bg-blue-500/10 text-blue-400 border-blue-500/20", label: "Starter" },
    growth:     { cls: "bg-amber-500/10 text-amber-400 border-amber-500/20", label: "Growth" },
    enterprise: { cls: "bg-purple-500/10 text-purple-400 border-purple-500/20", label: "Enterprise" },
  };
  const c = cfg[plan] ?? cfg.free;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${c.cls}`}>
      {plan === "growth" && <Star className="w-3 h-3" />}
      {plan === "enterprise" && <Crown className="w-3 h-3" />}
      {c.label}
    </span>
  );
}

export default function BoostJobs() {
  const { token } = useAuth();
  const { toast } = useToast();

  const [jobs, setJobs] = useState<RecruiterJob[]>([]);
  const [sub, setSub] = useState<SubInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<number | null>(null);
  const [confirm, setConfirm] = useState<ConfirmAction | null>(null);

  const authHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [jobsRes, subRes] = await Promise.all([
        fetch(`${API}/recruiter/jobs`, { headers: authHeaders() }),
        fetch(`${API}/recruiter/subscription`, { headers: authHeaders() }),
      ]);
      if (jobsRes.ok) setJobs(await jobsRes.json());
      if (subRes.ok) setSub(await subRes.json());
    } catch {
      toast({ title: "Failed to load data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (token) fetchData(); }, [token]);

  const handleBoost = async (jobId: number) => {
    setActing(jobId);
    setConfirm(null);
    try {
      const res = await fetch(`${API}/recruiter/jobs/${jobId}/boost`, {
        method: "PATCH",
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.message ?? "Boost failed", variant: "destructive" });
        return;
      }
      toast({ title: "Job boosted!", description: `${data.creditsRemaining} boost credit${data.creditsRemaining !== 1 ? "s" : ""} remaining. Boost active for 7 days.` });
      await fetchData();
    } catch {
      toast({ title: "Boost failed", variant: "destructive" });
    } finally {
      setActing(null);
    }
  };

  const handleFeature = async (jobId: number) => {
    setActing(jobId);
    setConfirm(null);
    try {
      const res = await fetch(`${API}/recruiter/featured-job`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ jobId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.message ?? "Feature failed", variant: "destructive" });
        return;
      }
      toast({ title: "Job featured!", description: `${data.featuredCreditsRemaining} featured credit${data.featuredCreditsRemaining !== 1 ? "s" : ""} remaining. Featured for 14 days.` });
      await fetchData();
    } catch {
      toast({ title: "Feature failed", variant: "destructive" });
    } finally {
      setActing(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
            <Zap className="w-6 h-6 text-amber-400" />
            Boost & Feature Jobs
          </h1>
          <p className="text-sm text-white/40 mt-0.5">Increase visibility — boosted jobs rank higher, featured jobs appear first</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white/60 hover:text-white hover:bg-white/10 transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Credits banner */}
      {sub && (
        <div className="glass-card p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Boost credits */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-sm font-semibold text-white">Boost Credits</p>
                <PlanBadge plan={sub.recruiterPlan} />
              </div>
              <p className="text-xs text-white/40">
                {sub.jobBoostCredits === 0
                  ? "No credits — upgrade to boost"
                  : `${sub.jobBoostCredits} credit${sub.jobBoostCredits !== 1 ? "s" : ""} available · lasts 7 days`}
              </p>
            </div>
            <div className="text-center px-4 py-2 rounded-xl bg-white/5 border border-white/10 shrink-0">
              <p className="text-xl font-bold text-amber-400 tabular-nums">{sub.jobBoostCredits}</p>
              <p className="text-[10px] text-white/40 uppercase tracking-wider">Left</p>
            </div>
          </div>

          {/* Featured credits */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-400/10 flex items-center justify-center shrink-0">
              <Star className="w-5 h-5 text-yellow-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-sm font-semibold text-white">Featured Credits</p>
              </div>
              <p className="text-xs text-white/40">
                {sub.featuredJobsCredits === 0
                  ? "No credits — upgrade to feature"
                  : `${sub.featuredJobsCredits} credit${sub.featuredJobsCredits !== 1 ? "s" : ""} available · lasts 14 days`}
              </p>
            </div>
            <div className="text-center px-4 py-2 rounded-xl bg-white/5 border border-white/10 shrink-0">
              <p className="text-xl font-bold text-yellow-400 tabular-nums">{sub.featuredJobsCredits}</p>
              <p className="text-[10px] text-white/40 uppercase tracking-wider">Left</p>
            </div>
          </div>

          {(sub.jobBoostCredits === 0 || sub.featuredJobsCredits === 0) && (
            <div className="sm:col-span-2 flex justify-end">
              <Link href="/dashboard/subscription">
                <span className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:opacity-90 transition-all cursor-pointer whitespace-nowrap">
                  <Crown className="w-4 h-4" />
                  Upgrade Plan
                </span>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* How it works */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: TrendingUp, title: "Boost (7 Days)", desc: "Job ranks above normal listings in search results", color: "bg-amber-500/10 text-amber-400" },
          { icon: Star, title: "Featured (14 Days)", desc: "Appears at the very top of the feed with a gold badge", color: "bg-yellow-400/10 text-yellow-400" },
          { icon: Sparkles, title: "Higher Apply Rate", desc: "Featured + Boosted jobs get 3× more applications", color: "bg-blue-500/10 text-blue-400" },
        ].map(item => (
          <div key={item.title} className="glass-card p-4 flex items-start gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
              <item.icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{item.title}</p>
              <p className="text-xs text-white/40 mt-0.5">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Jobs list */}
      <div className="glass-card overflow-hidden">
        <div className="p-5 border-b border-white/[0.07]">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-primary" />
            Your Job Listings
          </h2>
        </div>

        {loading ? (
          <div className="p-8 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-white/[0.03] animate-pulse" />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="p-16 text-center">
            <Briefcase className="w-10 h-10 text-white/10 mx-auto mb-3" />
            <p className="text-white/30 text-sm mb-3">No jobs posted yet</p>
            <Link href="/dashboard/recruiter/post-job">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/20 border border-primary/30 text-primary text-sm font-medium cursor-pointer hover:bg-primary/30 transition-all">
                Post Your First Job
              </span>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.05]">
            {jobs.map(job => (
              <motion.div key={job.id} layout className="p-5 flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-white font-semibold">{job.title}</p>
                    {job.isFeatured && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-400/10 border border-yellow-400/30 text-yellow-300 text-[10px] font-bold uppercase tracking-wider">
                        <Star className="w-3 h-3" />
                        Featured
                      </span>
                    )}
                    {job.isBoosted && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                        <Zap className="w-3 h-3" />
                        Boosted
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="flex items-center gap-1 text-xs text-white/40">
                      <MapPin className="w-3 h-3" /> {job.location}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-white/40">
                      <Clock className="w-3 h-3" />
                      {new Date(job.postedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-white/40">
                      <ExternalLink className="w-3 h-3" /> {job.viewCount} views
                    </span>
                    <span className="flex items-center gap-1 text-xs text-white/40">
                      <CheckCircle2 className="w-3 h-3" /> {job.applicationCount} apps
                    </span>
                  </div>
                  <div className="flex gap-3 mt-1 flex-wrap text-[11px]">
                    {job.isFeatured && job.featuredExpiry && (
                      <span className="text-yellow-400/60">
                        Featured until {new Date(job.featuredExpiry).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </span>
                    )}
                    {job.isBoosted && job.boostExpiry && (
                      <span className="text-amber-400/60">
                        Boost until {new Date(job.boostExpiry).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  {/* Featured button */}
                  {job.isFeatured ? (
                    <span className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-yellow-400/10 border border-yellow-400/20 text-yellow-300 text-xs font-medium whitespace-nowrap">
                      <Star className="w-3.5 h-3.5" />
                      Featured
                    </span>
                  ) : (
                    <button
                      onClick={() => setConfirm({ jobId: job.id, type: "featured" })}
                      disabled={acting === job.id || !sub || sub.featuredJobsCredits === 0}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-yellow-400/10 border border-yellow-400/20 text-yellow-300 text-xs font-semibold hover:bg-yellow-400/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all whitespace-nowrap"
                    >
                      <Star className="w-3.5 h-3.5" />
                      Feature
                    </button>
                  )}

                  {/* Boost button */}
                  {job.isBoosted ? (
                    <span className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium whitespace-nowrap">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Boosted
                    </span>
                  ) : (
                    <button
                      onClick={() => setConfirm({ jobId: job.id, type: "boost" })}
                      disabled={acting === job.id || !sub || sub.jobBoostCredits === 0}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold hover:bg-amber-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all whitespace-nowrap"
                    >
                      {acting === job.id ? (
                        <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Working…</>
                      ) : (
                        <><Zap className="w-3.5 h-3.5" /> Boost</>
                      )}
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Confirm modal */}
      <AnimatePresence>
        {confirm !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={e => { if (e.target === e.currentTarget) setConfirm(null); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              className="bg-[#12111A] border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl p-6"
            >
              {confirm.type === "featured" ? (
                <>
                  <div className="w-12 h-12 rounded-xl bg-yellow-400/10 flex items-center justify-center mb-4">
                    <Star className="w-5 h-5 text-yellow-400" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">Feature this Job?</h3>
                  <p className="text-sm text-white/50 mb-1">
                    This will use <strong className="text-yellow-300">1 featured credit</strong> ({(sub?.featuredJobsCredits ?? 0) - 1} remaining after).
                  </p>
                  <p className="text-xs text-white/30 mb-6">The job will appear at the very top of the feed with a gold Featured badge for 14 days.</p>
                  <div className="flex gap-3">
                    <button onClick={() => setConfirm(null)} className="flex-1 px-4 py-2.5 rounded-xl text-sm text-white/50 hover:text-white border border-white/10 hover:bg-white/5 transition-all">
                      Cancel
                    </button>
                    <button onClick={() => handleFeature(confirm.jobId)} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-yellow-400 hover:bg-yellow-300 text-black transition-all">
                      Feature Now
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4">
                    <Zap className="w-5 h-5 text-amber-400" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">Boost this Job?</h3>
                  <p className="text-sm text-white/50 mb-1">
                    This will use <strong className="text-amber-400">1 boost credit</strong> ({(sub?.jobBoostCredits ?? 0) - 1} remaining after).
                  </p>
                  <p className="text-xs text-white/30 mb-6">The job will rank above normal listings in search results for 7 days.</p>
                  <div className="flex gap-3">
                    <button onClick={() => setConfirm(null)} className="flex-1 px-4 py-2.5 rounded-xl text-sm text-white/50 hover:text-white border border-white/10 hover:bg-white/5 transition-all">
                      Cancel
                    </button>
                    <button onClick={() => handleBoost(confirm.jobId)} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-black transition-all">
                      Boost Now
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
