import { useState } from "react";
import { useGetSubscription, useUpdateSubscription, useGetAIUsage } from "@workspace/api-client-react";
import {
  CheckCircle2, X, Loader2, Crown, Zap, Sparkles, ArrowRight, Lock,
} from "lucide-react";
import { motion } from "framer-motion";

/* ── Feature comparison table data ──────────────────────────────────── */

interface Feature {
  label: string;
  free: string | false;
  pro: string | true;
  premium: string | true;
}

const FEATURES: Feature[] = [
  { label: "Job Board Access",          free: "Full access",     pro: true,            premium: true },
  { label: "Application Tracker",       free: "Up to 10 jobs",  pro: "Unlimited",     premium: "Unlimited" },
  { label: "Cover Letter Generator",    free: "3 / month",       pro: "Unlimited",     premium: "Unlimited" },
  { label: "Resume Bullet Optimizer",   free: "5 / month",       pro: "Unlimited",     premium: "Unlimited" },
  { label: "AI Chat (HireBot)",         free: "20 msg / month",  pro: "Unlimited",     premium: "Unlimited" },
  { label: "Job Match Score",           free: "3 / month",       pro: "Unlimited",     premium: "Unlimited" },
  { label: "Career Suggestions",        free: "2 / month",       pro: "Unlimited",     premium: "Unlimited" },
  { label: "Job Description Simplifier",free: "10 / month",      pro: "Unlimited",     premium: "Unlimited" },
  { label: "Recruiter Outreach AI",     free: false,             pro: "Unlimited",     premium: "Unlimited" },
  { label: "Interview Prep AI",         free: false,             pro: "Unlimited",     premium: "Unlimited" },
  { label: "Priority Support",          free: false,             pro: true,            premium: true },
  { label: "1-on-1 Career Coaching",    free: false,             pro: false,           premium: "1 session / mo" },
  { label: "Priority AI Response",      free: false,             pro: false,           premium: true },
];

/* ── Cell renderer ───────────────────────────────────────────────────── */
function Cell({ value }: { value: string | boolean | false }) {
  if (value === false) return <X className="w-4 h-4 text-white/20 mx-auto" />;
  if (value === true)  return <CheckCircle2 className="w-4 h-4 text-indigo-400 mx-auto" />;
  return <span className="text-xs text-white/70 text-center block">{value}</span>;
}

/* ── Usage mini-bar ──────────────────────────────────────────────────── */
function UsageBar({ label, used, limit }: { label: string; used: number; limit: number }) {
  const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-white/50">{label}</span>
        <span className={`font-medium ${used >= limit ? "text-red-400" : "text-white/70"}`}>{used}/{limit}</span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${pct >= 100 ? "bg-red-500" : pct >= 70 ? "bg-amber-500" : "bg-indigo-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────────────────── */
export default function SubscriptionPage() {
  const { data: sub, isLoading } = useGetSubscription();
  const { data: usage } = useGetAIUsage();
  const updateMut = useUpdateSubscription();
  const [confirmPlan, setConfirmPlan] = useState<string | null>(null);

  const handleUpgrade = async (plan: "free" | "pro" | "premium") => {
    setConfirmPlan(null);
    try {
      await updateMut.mutateAsync({ data: { plan } });
    } catch {
      /* silently handle */
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-16">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  const currentPlan = sub?.plan ?? "free";
  const resetDate = usage?.resetDate
    ? new Date(usage.resetDate).toLocaleDateString("en-IN", { month: "long", day: "numeric" })
    : "1st of next month";

  const plans = [
    {
      key: "free",
      label: "Starter",
      price: 0,
      tagline: "Try the essentials free",
      gradient: "from-gray-500/20 to-gray-600/10",
      border: "border-white/10",
      icon: <Sparkles className="w-5 h-5 text-white/50" />,
    },
    {
      key: "pro",
      label: "Pro",
      price: 199,
      tagline: "Unlimited AI for active seekers",
      gradient: "from-indigo-500/20 to-purple-600/10",
      border: "border-indigo-500/30",
      icon: <Zap className="w-5 h-5 text-indigo-400" />,
      highlight: true,
    },
    {
      key: "premium",
      label: "Premium",
      price: 499,
      tagline: "Everything + career coaching",
      gradient: "from-amber-500/20 to-orange-500/10",
      border: "border-amber-500/30",
      icon: <Crown className="w-5 h-5 text-amber-400" />,
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">

      {/* Current plan banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-indigo-500/5 to-transparent border-indigo-500/10"
      >
        <div>
          <p className="text-sm text-white/50 mb-1">Current Plan</p>
          <h2 className="text-2xl font-display font-bold capitalize flex items-center gap-2">
            {currentPlan === "pro" && <Zap className="w-6 h-6 text-indigo-400" />}
            {currentPlan === "premium" && <Crown className="w-6 h-6 text-amber-400" />}
            {currentPlan}
          </h2>
          {sub?.currentPeriodEnd && (
            <p className="text-xs text-white/40 mt-1">
              Renews {new Date(sub.currentPeriodEnd).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          )}
        </div>
        {currentPlan === "free" && (
          <div className="text-sm text-white/50 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" /> Limits reset on {resetDate}
          </div>
        )}
        {currentPlan !== "free" && (
          <div className="flex items-center gap-2 text-sm text-indigo-400 font-medium">
            <CheckCircle2 className="w-4 h-4" /> Unlimited AI access active
          </div>
        )}
      </motion.div>

      {/* Usage breakdown (free users only) */}
      {currentPlan === "free" && usage?.features && (
        <div className="glass-card p-6">
          <h3 className="font-semibold text-sm text-white/60 uppercase tracking-wider mb-5">This Month's Usage</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-4">
            {Object.entries(usage.features)
              .filter(([, f]) => !f.proOnly && f.limit !== -1)
              .map(([key, f]) => (
                <UsageBar key={key} label={f.label} used={f.used} limit={f.limit} />
              ))}
          </div>
          <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap gap-4">
            {Object.entries(usage.features)
              .filter(([, f]) => f.proOnly)
              .map(([key, f]) => (
                <div key={key} className="flex items-center gap-1.5 text-xs text-white/30">
                  <Lock className="w-3 h-3" /> {f.label}
                  <span className="ml-1 text-amber-400/60 font-medium">Pro only</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Plan cards */}
      <div>
        <h3 className="font-semibold text-sm text-white/60 uppercase tracking-wider mb-4">
          {currentPlan === "free" ? "Upgrade your plan" : "Change plan"}
        </h3>
        <div className="grid md:grid-cols-3 gap-5">
          {plans.map((plan, i) => {
            const isCurrent = currentPlan === plan.key;
            return (
              <motion.div
                key={plan.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className={`glass-card p-6 flex flex-col relative overflow-hidden ${plan.highlight ? "border-indigo-500/40" : ""} ${isCurrent ? "ring-1 ring-indigo-400/30" : ""}`}
              >
                {isCurrent && (
                  <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-xs text-indigo-400 font-semibold">
                    Current
                  </div>
                )}
                {plan.highlight && !isCurrent && (
                  <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-indigo-500 text-xs text-white font-bold">
                    Popular
                  </div>
                )}

                <div className="flex items-center gap-2 mb-1">
                  {plan.icon}
                  <h3 className="font-display font-bold text-lg">{plan.label}</h3>
                </div>
                <p className="text-xs text-white/40 mb-5">{plan.tagline}</p>

                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-display font-bold">₹{plan.price}</span>
                  {plan.price > 0 && <span className="text-white/40 text-sm">/mo</span>}
                  {plan.price === 0 && <span className="text-white/40 text-sm ml-1">forever free</span>}
                </div>

                <button
                  onClick={() => {
                    if (!isCurrent) setConfirmPlan(plan.key);
                  }}
                  disabled={isCurrent || updateMut.isPending}
                  className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all ${
                    isCurrent
                      ? "bg-white/5 text-white/30 cursor-not-allowed"
                      : plan.key === "pro"
                      ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:opacity-90 shadow-lg"
                      : plan.key === "premium"
                      ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-90"
                      : "bg-white/8 text-white/70 hover:bg-white/12 border border-white/10"
                  }`}
                >
                  {isCurrent ? "Current Plan" : plan.price === 0 ? "Downgrade to Free" : `Upgrade to ${plan.label}`}
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Feature comparison */}
      <div className="glass-card overflow-hidden">
        <div className="p-5 border-b border-white/5">
          <h3 className="font-semibold text-sm text-white/60 uppercase tracking-wider">Full Feature Comparison</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-5 py-3 text-white/40 font-medium w-1/2">Feature</th>
                <th className="text-center px-4 py-3 text-white/40 font-medium">Starter</th>
                <th className="text-center px-4 py-3 text-indigo-400 font-semibold">Pro</th>
                <th className="text-center px-4 py-3 text-amber-400 font-medium">Premium</th>
              </tr>
            </thead>
            <tbody>
              {FEATURES.map((f, i) => (
                <tr key={i} className={`border-b border-white/5 ${i % 2 === 0 ? "bg-white/[0.01]" : ""}`}>
                  <td className="px-5 py-3 text-white/70">{f.label}</td>
                  <td className="px-4 py-3 text-center"><Cell value={f.free} /></td>
                  <td className="px-4 py-3 text-center"><Cell value={f.pro} /></td>
                  <td className="px-4 py-3 text-center"><Cell value={f.premium} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirm plan change modal */}
      {confirmPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setConfirmPlan(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative z-10 w-full max-w-sm p-6 rounded-2xl"
            style={{ background: "hsl(240 32% 8% / 0.99)", border: "1px solid hsl(240 20% 20% / 0.5)" }}
            onClick={e => e.stopPropagation()}
          >
            <h3 className="font-bold text-lg mb-2">
              {confirmPlan === "free" ? "Downgrade to Free?" : `Upgrade to ${plans.find(p => p.key === confirmPlan)?.label}?`}
            </h3>
            <p className="text-white/50 text-sm mb-6">
              {confirmPlan === "free"
                ? "You'll lose access to Pro features immediately. Your usage limits will reset to the free plan."
                : `You'll get access to ${confirmPlan === "pro" ? "unlimited AI tools and Pro features" : "all Pro features plus premium perks"}.`}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleUpgrade(confirmPlan as any)}
                disabled={updateMut.isPending}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:opacity-90 transition-opacity"
              >
                {updateMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ArrowRight className="w-4 h-4" /> Confirm</>}
              </button>
              <button
                onClick={() => setConfirmPlan(null)}
                className="flex-1 py-2.5 rounded-xl text-sm text-white/50 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
