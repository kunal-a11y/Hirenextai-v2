import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BarChart3, Eye, Users, Briefcase, CheckCircle2, XCircle,
  Clock, TrendingUp, Loader2,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from "recharts";
import { useAuthStore } from "@/hooks/use-auth";

const API = import.meta.env.VITE_API_URL ?? "/api";

interface Analytics {
  totalJobs: number;
  totalViews: number;
  totalApplications: number;
  shortlisted: number;
  rejected: number;
  pending: number;
}

interface RecruiterJob {
  id: number;
  title: string;
  company: string;
  location: string;
  type: string;
  viewCount: number;
  applicationCount: number;
  isBoosted: boolean;
  postedAt: string;
}

function StatCard({ icon: Icon, label, value, color, sub }: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  color: string;
  sub?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-xl border border-white/[0.08] p-5 flex items-start gap-4"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-xs text-white/40 mt-0.5">{label}</p>
        {sub && <p className="text-xs text-white/25 mt-1">{sub}</p>}
      </div>
    </motion.div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-[#1a1a2e] border border-white/[0.1] rounded-xl px-4 py-3 shadow-2xl">
        <p className="text-xs text-white/50 mb-1 truncate max-w-[180px]">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} className="text-sm font-semibold" style={{ color: p.color }}>
            {p.name}: <span className="text-white">{p.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const COLORS = ["#8b5cf6", "#6366f1", "#3b82f6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];

export default function RecruiterAnalytics() {
  const token = useAuthStore(s => s.token);
  const authHeader = { Authorization: `Bearer ${token}` };

  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [jobs, setJobs] = useState<RecruiterJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [analyticsRes, jobsRes] = await Promise.all([
          fetch(`${API}/recruiter/analytics`, { headers: authHeader }),
          fetch(`${API}/recruiter/jobs`, { headers: authHeader }),
        ]);
        if (analyticsRes.ok) setAnalytics(await analyticsRes.json());
        if (jobsRes.ok) setJobs(await jobsRes.json());
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  const applicationsData = jobs.map((j, i) => ({
    name: j.title.length > 22 ? j.title.slice(0, 22) + "…" : j.title,
    Applications: j.applicationCount ?? 0,
    Views: j.viewCount ?? 0,
    color: COLORS[i % COLORS.length],
  }));

  const conversionRate = analytics && analytics.totalViews > 0
    ? ((analytics.totalApplications / analytics.totalViews) * 100).toFixed(1)
    : "0.0";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-4 py-6 max-w-5xl mx-auto"
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Hiring Analytics</h1>
        <p className="text-sm text-white/40 mt-1">Track your job posting performance and applicant pipeline</p>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
        <StatCard icon={Briefcase} label="Jobs Posted" value={analytics?.totalJobs ?? 0} color="bg-purple-500/10 text-purple-400" />
        <StatCard icon={Eye} label="Total Views" value={analytics?.totalViews ?? 0} color="bg-blue-500/10 text-blue-400" />
        <StatCard icon={Users} label="Total Applications" value={analytics?.totalApplications ?? 0} color="bg-indigo-500/10 text-indigo-400" />
        <StatCard icon={CheckCircle2} label="Shortlisted" value={analytics?.shortlisted ?? 0} color="bg-green-500/10 text-green-400" />
        <StatCard icon={XCircle} label="Rejected" value={analytics?.rejected ?? 0} color="bg-red-500/10 text-red-400" />
        <StatCard icon={TrendingUp} label="Conversion Rate" value={`${conversionRate}%`} color="bg-amber-500/10 text-amber-400" sub="Views → Applications" />
      </div>

      {/* Pipeline breakdown */}
      {analytics && analytics.totalApplications > 0 && (
        <div className="glass-card rounded-xl border border-white/[0.08] p-5 mb-6">
          <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" /> Applicant Pipeline
          </h2>
          <div className="space-y-3">
            {[
              { label: "Pending Review", value: analytics.pending, total: analytics.totalApplications, color: "bg-amber-500" },
              { label: "Shortlisted", value: analytics.shortlisted, total: analytics.totalApplications, color: "bg-green-500" },
              { label: "Rejected", value: analytics.rejected, total: analytics.totalApplications, color: "bg-red-500" },
            ].map(({ label, value, total, color }) => {
              const pct = total > 0 ? Math.round((value / total) * 100) : 0;
              return (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-white/50">{label}</span>
                    <span className="text-xs font-semibold text-white">{value} <span className="text-white/30">({pct}%)</span></span>
                  </div>
                  <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className={`h-full rounded-full ${color}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Applications per job chart */}
      {applicationsData.length > 0 ? (
        <div className="glass-card rounded-xl border border-white/[0.08] p-5 mb-6">
          <h2 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-purple-400" /> Applications per Job
          </h2>
          <p className="text-xs text-white/30 mb-5">Click a bar to see details</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={applicationsData} margin={{ top: 4, right: 8, left: -20, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "rgba(255,255,255,0.35)" }}
                axisLine={false}
                tickLine={false}
                interval={0}
                angle={applicationsData.length > 4 ? -25 : 0}
                textAnchor={applicationsData.length > 4 ? "end" : "middle"}
                height={applicationsData.length > 4 ? 54 : 30}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "rgba(255,255,255,0.35)" }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
              <Bar dataKey="Applications" radius={[6, 6, 0, 0]} maxBarSize={52}>
                {applicationsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : null}

      {/* Views per job chart */}
      {applicationsData.length > 0 && (
        <div className="glass-card rounded-xl border border-white/[0.08] p-5">
          <h2 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
            <Eye className="w-4 h-4 text-blue-400" /> Views per Job
          </h2>
          <p className="text-xs text-white/30 mb-5">Job listing visibility across the platform</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={applicationsData} margin={{ top: 4, right: 8, left: -20, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "rgba(255,255,255,0.35)" }}
                axisLine={false}
                tickLine={false}
                interval={0}
                angle={applicationsData.length > 4 ? -25 : 0}
                textAnchor={applicationsData.length > 4 ? "end" : "middle"}
                height={applicationsData.length > 4 ? 54 : 30}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "rgba(255,255,255,0.35)" }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
              <Bar dataKey="Views" radius={[6, 6, 0, 0]} maxBarSize={52} fill="#3b82f6" fillOpacity={0.75} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {applicationsData.length === 0 && (
        <div className="glass-card rounded-xl border border-white/[0.08] p-12 text-center">
          <BarChart3 className="w-12 h-12 text-white/15 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white/50 mb-1">No data yet</h3>
          <p className="text-sm text-white/25">Post your first job to start seeing analytics</p>
        </div>
      )}
    </motion.div>
  );
}
