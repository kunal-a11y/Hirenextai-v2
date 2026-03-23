import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Crown, Zap, Briefcase, CheckCircle2, Lock, Loader2, Star, Building2,
} from "lucide-react";
import { useAuthStore } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

const API = import.meta.env.VITE_API_URL ?? "/api";

interface SubInfo {
  recruiterPlan: string;
  planLabel: string;
  jobLimit: number;
  boostCreditsTotal: number;
  featuredCreditsTotal: number;
  jobBoostCredits: number;
  featuredJobsCredits: number;
  planValidTill: string | null;
  activeJobs: number;
  boostedJobs: number;
  featuredJobs: number;
  plans: Array<{
    key: string;
    label: string;
    jobLimit: number;
    boostCredits: number;
    featuredCredits: number;
    price: number;
  }>;
}

const PLAN_FEATURES: Record<string, string[]> = {
  free: [
    "Post up to 3 job listings",
    "Basic applicant management",
    "Shortlist / Reject applicants",
    "Company profile page",
  ],
  starter: [
    "Post up to 15 job listings",
    "5 job boost credits / month",
    "2 featured job credits / month",
    "Basic analytics dashboard",
    "Priority applicant sorting",
    "Everything in Free",
  ],
  growth: [
    "Post up to 50 job listings",
    "20 job boost credits / month",
    "5 featured job credits / month",
    "Advanced AI applicant ranking",
    "Full analytics & insights",
    "Priority support",
    "Everything in Starter",
  ],
  enterprise: [
    "Unlimited job postings",
    "50 job boost credits / month",
    "20 featured job credits / month",
    "Dedicated account manager",
    "Custom integrations & ATS sync",
    "SLA-backed support",
    "Everything in Growth",
  ],
};

const PLAN_COLORS: Record<string, { card: string; badge: string; button: string }> = {
  free: {
    card: "border-white/[0.08]",
    badge: "bg-white/5 text-white/50 border-white/10",
    button: "bg-white/10 text-white/60 hover:bg-white/15",
  },
  starter: {
    card: "border-blue-500/25",
    badge: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    button: "bg-blue-600 text-white hover:bg-blue-500",
  },
  growth: {
    card: "border-amber-500/30",
    badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    button: "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-90",
  },
  enterprise: {
    card: "border-purple-500/30",
    badge: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    button: "bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:opacity-90",
  },
};

function PlanIcon({ plan }: { plan: string }) {
  if (plan === "enterprise") return <Crown className="w-5 h-5" />;
  if (plan === "growth") return <Star className="w-5 h-5" />;
  if (plan === "starter") return <Zap className="w-5 h-5" />;
  return <Briefcase className="w-5 h-5" />;
}

export default function RecruiterSubscription() {
  const token = useAuthStore(s => s.token);
  const { toast } = useToast();
  const authHeader = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const [info, setInfo] = useState<SubInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);

  const fetchSub = async () => {
    try {
      const res = await fetch(`${API}/recruiter/subscription`, { headers: authHeader });
      if (res.ok) setInfo(await res.json());
    } catch {}
  };

  useEffect(() => {
    const load = async () => {
      await fetchSub();
      setLoading(false);
    };
    load();
  }, []);

  const handleUpgrade = async (planKey: string) => {
    if (planKey === (info?.recruiterPlan ?? "free")) return;
    setUpgrading(planKey);
    try {
      const res = await fetch(`${API}/recruiter/upgrade`, {
        method: "POST",
        headers: authHeader,
        body: JSON.stringify({ plan_name: planKey }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.message ?? "Upgrade failed", variant: "destructive" });
        return;
      }
      toast({
        title: `Upgraded to ${data.planLabel}!`,
        description: `Plan active until ${new Date(data.validTill).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`,
      });
      await fetchSub();
    } catch {
      toast({ title: "Upgrade failed", variant: "destructive" });
    } finally {
      setUpgrading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
      </div>
    );
  }

  const currentPlan = info?.recruiterPlan ?? "free";
  const usedJobs = info?.activeJobs ?? 0;
  const jobLimit = info?.jobLimit ?? 3;
  const boostCredits = info?.jobBoostCredits ?? 0;
  const boostTotal = info?.boostCreditsTotal ?? 0;
  const featuredCredits = info?.featuredJobsCredits ?? 0;
  const featuredTotal = info?.featuredCreditsTotal ?? 0;

  const usagePct = jobLimit === -1 ? 0 : Math.min(100, Math.round((usedJobs / jobLimit) * 100));
  const boostPct = boostTotal === 0 ? 0 : Math.min(100, Math.round((boostCredits / boostTotal) * 100));
  const featuredPct = featuredTotal === 0 ? 0 : Math.min(100, Math.round((featuredCredits / featuredTotal) * 100));

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto px-4 py-6"
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Recruiter Plans</h1>
        <p className="text-sm text-white/40 mt-1">Manage your plan and usage limits</p>
      </div>

      {/* Current usage */}
      <div className="glass-card rounded-xl border border-white/[0.08] p-5 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-white">Current Usage</h2>
          {info?.planValidTill && (
            <span className="text-xs text-white/30">
              Plan valid till{" "}
              <span className="text-white/60 font-medium">
                {new Date(info.planValidTill).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Job postings */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-white/40 flex items-center gap-1">
                <Briefcase className="w-3 h-3" /> Job Postings
              </span>
              <span className="text-xs font-semibold text-white">
                {usedJobs} / {jobLimit === -1 ? "∞" : jobLimit}
              </span>
            </div>
            <div className="h-2 bg-white/[0.07] rounded-full overflow-hidden">
              {jobLimit !== -1 ? (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${usagePct}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className={`h-full rounded-full ${usagePct >= 100 ? "bg-red-500" : usagePct >= 75 ? "bg-amber-500" : "bg-purple-500"}`}
                />
              ) : (
                <div className="h-full rounded-full bg-purple-500 w-full opacity-30" />
              )}
            </div>
          </div>

          {/* Boost credits */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-white/40 flex items-center gap-1">
                <Zap className="w-3 h-3" /> Boost Credits
              </span>
              <span className="text-xs font-semibold text-white">
                {boostCredits} / {boostTotal}
              </span>
            </div>
            <div className="h-2 bg-white/[0.07] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${boostPct}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full rounded-full bg-amber-500"
              />
            </div>
          </div>

          {/* Featured credits */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-white/40 flex items-center gap-1">
                <Star className="w-3 h-3" /> Featured Credits
              </span>
              <span className="text-xs font-semibold text-white">
                {featuredCredits} / {featuredTotal}
              </span>
            </div>
            <div className="h-2 bg-white/[0.07] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${featuredPct}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full rounded-full bg-yellow-400"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-5 pt-4 border-t border-white/[0.07]">
          <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${PLAN_COLORS[currentPlan]?.badge ?? ""}`}>
            <PlanIcon plan={currentPlan} />
          </div>
          <div>
            <p className="text-xs text-white/40">Current Plan</p>
            <p className="text-sm font-bold text-white capitalize">{info?.planLabel ?? "Free"}</p>
          </div>
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {(info?.plans ?? []).map((plan, i) => {
          const colors = PLAN_COLORS[plan.key] ?? PLAN_COLORS.free;
          const isCurrent = plan.key === currentPlan;
          const isPopular = plan.key === "growth";
          const isDowngrade = ["free", "starter", "growth", "enterprise"].indexOf(plan.key) <
            ["free", "starter", "growth", "enterprise"].indexOf(currentPlan);

          return (
            <motion.div
              key={plan.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className={`glass-card rounded-xl border p-5 flex flex-col relative ${colors.card} ${isCurrent ? "ring-1 ring-purple-500/40" : ""}`}
            >
              {isPopular && !isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider shadow-lg whitespace-nowrap">
                    Most Popular
                  </span>
                </div>
              )}
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30 text-green-400 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
                    Current Plan
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2 mb-3 mt-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${colors.badge}`}>
                  <PlanIcon plan={plan.key} />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{plan.label}</p>
                  {plan.price > 0 ? (
                    <p className="text-xs text-white/40">₹{plan.price.toLocaleString("en-IN")}/mo</p>
                  ) : (
                    <p className="text-xs text-white/40">Free forever</p>
                  )}
                </div>
              </div>

              {/* Credits summary */}
              <div className="flex gap-2 mb-3">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {plan.boostCredits} boosts
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-400/10 text-yellow-300 border border-yellow-400/20">
                  {plan.featuredCredits} featured
                </span>
              </div>

              <div className="space-y-2 flex-1 mb-4">
                {(PLAN_FEATURES[plan.key] ?? []).map((f, fi) => (
                  <div key={fi} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0 mt-0.5" />
                    <span className="text-xs text-white/60">{f}</span>
                  </div>
                ))}
                {plan.boostCredits === 0 && (
                  <div className="flex items-start gap-2">
                    <Lock className="w-3.5 h-3.5 text-white/20 shrink-0 mt-0.5" />
                    <span className="text-xs text-white/25">No boost or featured credits</span>
                  </div>
                )}
              </div>

              <button
                disabled={isCurrent || upgrading === plan.key}
                onClick={() => handleUpgrade(plan.key)}
                className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  isCurrent
                    ? "bg-white/[0.05] text-white/30 cursor-default border border-white/10"
                    : upgrading === plan.key
                    ? "opacity-60 cursor-not-allowed " + colors.button
                    : colors.button + " cursor-pointer"
                }`}
              >
                {upgrading === plan.key ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Upgrading…</>
                ) : isCurrent ? "Current Plan" : isDowngrade ? "Downgrade" : "Upgrade Now"}
              </button>
            </motion.div>
          );
        })}
      </div>

      <p className="text-center text-xs text-white/20 mt-8">
        Plan upgrades are instant. Payment gateway (Razorpay) integration coming soon.
      </p>
    </motion.div>
  );
}
