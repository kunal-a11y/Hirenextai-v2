import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import {
  Users, Briefcase, FileText, TicketCheck, X, Send, RefreshCw,
  TrendingUp, AlertCircle, CheckCircle2, Clock, ShieldAlert, Eye,
} from "lucide-react";

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
  totalJobs: number;
  totalApplications: number;
  totalTickets: number;
  openTickets: number;
}

function StatusBadge({ status }: { status: string }) {
  const open = status === "open";
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold
        ${open
          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
          : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
        }`}
    >
      {open ? <AlertCircle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
      {open ? "Open" : "Closed"}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  sub?: string;
  color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 flex items-start gap-4"
    >
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-white/40 uppercase tracking-wider mb-1">{label}</p>
        <p className="text-2xl font-bold text-white tabular-nums">{value.toLocaleString()}</p>
        {sub && <p className="text-xs text-white/40 mt-0.5">{sub}</p>}
      </div>
    </motion.div>
  );
}

export default function Admin() {
  const { user, token } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "closed">("all");

  useEffect(() => {
    if (!user) return;
    if (user.role !== "admin") {
      setLocation("/dashboard/jobs");
    }
  }, [user, setLocation]);

  const authHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  });

  const fetchTickets = async () => {
    setLoadingTickets(true);
    try {
      const res = await fetch(`${API}/admin/tickets`, { headers: authHeaders() });
      if (!res.ok) throw new Error();
      setTickets(await res.json());
    } catch {
      toast({ title: "Failed to load tickets", variant: "destructive" });
    } finally {
      setLoadingTickets(false);
    }
  };

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await fetch(`${API}/admin/stats`, { headers: authHeaders() });
      if (!res.ok) throw new Error();
      setStats(await res.json());
    } catch {
      toast({ title: "Failed to load stats", variant: "destructive" });
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchTickets();
      fetchStats();
    }
  }, [token]);

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
        prev.map(t =>
          t.id === selectedTicket.id
            ? { ...t, adminReply: reply, status: "closed" }
            : t
        )
      );
      setSelectedTicket(null);
      setReply("");
      fetchStats();
    } catch {
      toast({ title: "Failed to send reply", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const filteredTickets = tickets.filter(t =>
    statusFilter === "all" ? true : t.status === statusFilter
  );

  if (!user || (user as any).role !== "admin") return null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-display font-bold text-white">Admin Panel</h1>
          </div>
          <p className="text-sm text-white/40">Platform management &amp; support tickets</p>
        </div>
        <button
          onClick={() => { fetchTickets(); fetchStats(); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white/60 hover:text-white hover:bg-white/10 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {loadingStats ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass-card p-6 h-24 animate-pulse" />
          ))
        ) : stats ? (
          <>
            <StatCard icon={Users} label="Total Users" value={stats.totalUsers} color="bg-blue-500/10 text-blue-400" />
            <StatCard icon={TrendingUp} label="Active Users" value={stats.activeUsers} sub="Last 7 days" color="bg-purple-500/10 text-purple-400" />
            <StatCard icon={Briefcase} label="Total Jobs" value={stats.totalJobs} color="bg-indigo-500/10 text-indigo-400" />
            <StatCard icon={FileText} label="Applications" value={stats.totalApplications} color="bg-pink-500/10 text-pink-400" />
            <StatCard icon={TicketCheck} label="Total Tickets" value={stats.totalTickets} color="bg-amber-500/10 text-amber-400" />
            <StatCard icon={AlertCircle} label="Open Tickets" value={stats.openTickets} sub="Needs attention" color="bg-red-500/10 text-red-400" />
          </>
        ) : null}
      </div>

      {/* Tickets Section */}
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
                    <td className="px-5 py-3.5">
                      <StatusBadge status={ticket.status} />
                    </td>
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

      {/* Ticket Modal */}
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
              {/* Modal header */}
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

              {/* Message */}
              <div className="p-5">
                <p className="text-xs text-white/40 uppercase tracking-wider mb-2">User Message</p>
                <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4 text-sm text-white/70 leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {selectedTicket.message}
                </div>

                {/* Previous reply */}
                {selectedTicket.adminReply && (
                  <div className="mt-4">
                    <p className="text-xs text-emerald-400/70 uppercase tracking-wider mb-2">Previous Reply</p>
                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 text-sm text-white/60 leading-relaxed whitespace-pre-wrap">
                      {selectedTicket.adminReply}
                    </div>
                  </div>
                )}

                {/* Reply textarea */}
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

              {/* Footer */}
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
                  {sending ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /> Sending…</>
                  ) : (
                    <><Send className="w-4 h-4" /> Send Reply &amp; Close</>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
