import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  Users, Briefcase, FileText, TicketCheck, X, Send, RefreshCw,
  TrendingUp, AlertCircle, CheckCircle2, Clock, Eye, Zap, Ban,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

const API = import.meta.env.VITE_API_URL ?? "/api";

interface Ticket {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  adminReply: string | null;
  createdAt: string;
  userId: number | null;
}

interface Stats {
  totalUsers: number;
  activeUsers: number;
  bannedUsers: number;
  totalJobs: number;
  totalApplications: number;
  totalTickets: number;
  openTickets: number;
  creditsUsedToday: number;
}

interface GrowthRow { month: string; count: number }

function StatusBadge({ status }: { status: string }) {
  const open = status === "open";
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
      open
        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
        : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
    }`}>
      {open ? <AlertCircle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
      {open ? "Open" : "Closed"}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  sub?: string;
  color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-5 flex items-start gap-4"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-4.5 h-4.5" />
      </div>
      <div>
        <p className="text-xs text-white/40 uppercase tracking-wider mb-1">{label}</p>
        <p className="text-2xl font-bold text-white tabular-nums">
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
        {sub && <p className="text-xs text-white/40 mt-0.5">{sub}</p>}
      </div>
    </motion.div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1825] border border-white/10 rounded-xl px-3 py-2 shadow-xl text-xs">
      <p className="text-white/50 mb-1">{label}</p>
      <p className="text-white font-semibold">{payload[0].value} {payload[0].name}</p>
    </div>
  );
};

export default function AdminDashboard() {
  const { token } = useAuth();
  const { toast } = useToast();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [growth, setGrowth] = useState<{ users: GrowthRow[]; applications: GrowthRow[] } | null>(null);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "closed">("all");

  const authHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  });

  const fetchAll = async () => {
    setLoadingTickets(true);
    setLoadingStats(true);
    try {
      const [ticketsRes, statsRes, growthRes] = await Promise.all([
        fetch(`${API}/admin/tickets`, { headers: authHeaders() }),
        fetch(`${API}/admin/stats`, { headers: authHeaders() }),
        fetch(`${API}/admin/growth`, { headers: authHeaders() }),
      ]);
      if (ticketsRes.ok) setTickets(await ticketsRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
      if (growthRes.ok) setGrowth(await growthRes.json());
    } catch {
      toast({ title: "Failed to load dashboard data", variant: "destructive" });
    } finally {
      setLoadingTickets(false);
      setLoadingStats(false);
    }
  };

  useEffect(() => { if (token) fetchAll(); }, [token]);

  const sendReply = async () => {
    if (!selectedTicket || !reply.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`${API}/admin/ticket/${selectedTicket.id}/reply`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ reply }),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Reply sent", description: "Ticket marked as closed." });
      setTickets(prev =>
        prev.map(t => t.id === selectedTicket.id ? { ...t, adminReply: reply, status: "closed" } : t)
      );
      setSelectedTicket(null);
      setReply("");
      fetchAll();
    } catch {
      toast({ title: "Failed to send reply", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const filteredTickets = tickets.filter(t =>
    statusFilter === "all" ? true : t.status === statusFilter
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Platform Overview</h1>
          <p className="text-sm text-white/40 mt-0.5">Real-time platform statistics & support management</p>
        </div>
        <button
          onClick={fetchAll}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white/60 hover:text-white hover:bg-white/10 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loadingStats ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="glass-card p-5 h-24 animate-pulse" />
          ))
        ) : stats ? (
          <>
            <StatCard icon={Users} label="Total Users" value={stats.totalUsers} color="bg-blue-500/10 text-blue-400" />
            <StatCard icon={TrendingUp} label="Active (7d)" value={stats.activeUsers} sub="Unique sessions" color="bg-purple-500/10 text-purple-400" />
            <StatCard icon={Ban} label="Banned" value={stats.bannedUsers} color="bg-red-500/10 text-red-400" />
            <StatCard icon={Briefcase} label="Total Jobs" value={stats.totalJobs} color="bg-indigo-500/10 text-indigo-400" />
            <StatCard icon={FileText} label="Applications" value={stats.totalApplications} color="bg-pink-500/10 text-pink-400" />
            <StatCard icon={TicketCheck} label="Total Tickets" value={stats.totalTickets} color="bg-amber-500/10 text-amber-400" />
            <StatCard icon={AlertCircle} label="Open Tickets" value={stats.openTickets} sub="Needs attention" color="bg-orange-500/10 text-orange-400" />
            <StatCard icon={Zap} label="Credits Used Today" value={stats.creditsUsedToday} color="bg-emerald-500/10 text-emerald-400" />
          </>
        ) : null}
      </div>

      {/* Charts */}
      {growth && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-white mb-4">User Growth (6 months)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={growth.users} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Users" fill="url(#grad1)" radius={[6, 6, 0, 0]} />
                <defs>
                  <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7C3AED" />
                    <stop offset="100%" stopColor="#4F46E5" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-white mb-4">Application Growth (6 months)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={growth.applications} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Applications" fill="url(#grad2)" radius={[6, 6, 0, 0]} />
                <defs>
                  <linearGradient id="grad2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#EC4899" />
                    <stop offset="100%" stopColor="#DB2777" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Support Tickets */}
      <div className="glass-card overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-white/[0.07]">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <TicketCheck className="w-4 h-4 text-primary" />
            Support Tickets
          </h2>
          <div className="flex gap-1">
            {(["all", "open", "closed"] as const).map(f => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                  statusFilter === f
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : "text-white/40 hover:text-white hover:bg-white/5"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {loadingTickets ? (
          <div className="p-8 text-center text-white/30 text-sm">Loading tickets…</div>
        ) : filteredTickets.length === 0 ? (
          <div className="p-12 text-center">
            <TicketCheck className="w-10 h-10 text-white/10 mx-auto mb-3" />
            <p className="text-white/30 text-sm">No tickets found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-white/30 text-xs uppercase tracking-wider border-b border-white/[0.07]">
                  <th className="px-5 py-3 text-left">User</th>
                  <th className="px-5 py-3 text-left">Subject</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-left">Date</th>
                  <th className="px-5 py-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {filteredTickets.map(ticket => (
                  <tr key={ticket.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="text-white font-medium truncate max-w-[160px]">{ticket.name}</p>
                      <p className="text-white/40 text-xs truncate max-w-[160px]">{ticket.email}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-white/80 truncate max-w-[200px]">{ticket.subject}</p>
                    </td>
                    <td className="px-5 py-3.5"><StatusBadge status={ticket.status} /></td>
                    <td className="px-5 py-3.5 text-white/40 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        {new Date(ticket.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => { setSelectedTicket(ticket); setReply(ticket.adminReply ?? ""); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs font-medium hover:bg-primary/20 transition-all"
                      >
                        <Eye className="w-3 h-3" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Ticket modal */}
      <AnimatePresence>
        {selectedTicket && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={e => { if (e.target === e.currentTarget) { setSelectedTicket(null); setReply(""); } }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              className="bg-[#12111A] border border-white/10 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-start justify-between p-5 border-b border-white/[0.07]">
                <div className="flex-1 min-w-0 pr-4">
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Ticket #{selectedTicket.id}</p>
                  <h3 className="text-base font-bold text-white truncate">{selectedTicket.subject}</h3>
                  <p className="text-xs text-white/40 mt-0.5">
                    From: <span className="text-white/60">{selectedTicket.name}</span> &lt;{selectedTicket.email}&gt;
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={selectedTicket.status} />
                  <button
                    onClick={() => { setSelectedTicket(null); setReply(""); }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-5">
                <p className="text-xs text-white/40 uppercase tracking-wider mb-2">User Message</p>
                <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4 text-sm text-white/70 leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {selectedTicket.message}
                </div>

                {selectedTicket.adminReply && (
                  <div className="mt-4">
                    <p className="text-xs text-emerald-400/70 uppercase tracking-wider mb-2">Previous Reply</p>
                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 text-sm text-white/60 leading-relaxed whitespace-pre-wrap">
                      {selectedTicket.adminReply}
                    </div>
                  </div>
                )}

                <div className="mt-4">
                  <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">
                    {selectedTicket.status === "closed" ? "Update Reply" : "Write Reply"}
                  </label>
                  <textarea
                    rows={4}
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    placeholder="Type your reply to the user…"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors resize-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 px-5 pb-5">
                <button
                  onClick={() => { setSelectedTicket(null); setReply(""); }}
                  className="px-4 py-2 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/10 transition-all border border-white/10"
                >
                  Cancel
                </button>
                <button
                  onClick={sendReply}
                  disabled={sending || !reply.trim()}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all"
                >
                  {sending ? <><RefreshCw className="w-4 h-4 animate-spin" /> Sending…</> : <><Send className="w-4 h-4" /> Send Reply &amp; Close</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
