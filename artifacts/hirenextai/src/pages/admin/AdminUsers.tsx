import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  Users, RefreshCw, Search, ChevronDown, Ban, CheckCircle2,
  Trash2, Zap, UserCheck, X, AlertTriangle, MoreVertical,
  Crown, Briefcase,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL ?? "/api";

interface AdminUser {
  id: number;
  name: string;
  email: string;
  subscriptionPlan: string;
  role: string;
  banned: boolean;
  creditsUsed: number;
  creditsLeft: number;
  monthlyLimit: number;
  createdAt: string;
}

const PLAN_COLORS: Record<string, string> = {
  free: "bg-white/5 text-white/50 border-white/10",
  pro: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  premium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

const ROLE_LABELS: Record<string, string> = {
  job_seeker: "Job Seeker",
  recruiter: "Recruiter",
  admin: "Admin",
};

function PlanBadge({ plan }: { plan: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border capitalize ${PLAN_COLORS[plan] ?? PLAN_COLORS.free}`}>
      {plan === "premium" && <Crown className="w-3 h-3" />}
      {plan}
    </span>
  );
}

function StatusBadge({ banned }: { banned: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
      banned
        ? "bg-red-500/10 text-red-400 border border-red-500/20"
        : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
    }`}>
      {banned ? <Ban className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
      {banned ? "Banned" : "Active"}
    </span>
  );
}

interface ConfirmModal {
  title: string;
  description: string;
  danger?: boolean;
  onConfirm: () => void;
}

function ConfirmDialog({
  modal,
  onClose,
}: {
  modal: ConfirmModal;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        className="bg-[#12111A] border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl p-6"
      >
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${modal.danger ? "bg-red-500/10" : "bg-primary/10"}`}>
          {modal.danger ? <AlertTriangle className="w-5 h-5 text-red-400" /> : <CheckCircle2 className="w-5 h-5 text-primary" />}
        </div>
        <h3 className="text-base font-bold text-white mb-2">{modal.title}</h3>
        <p className="text-sm text-white/50 mb-6">{modal.description}</p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm text-white/50 hover:text-white border border-white/10 hover:bg-white/5 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => { modal.onConfirm(); onClose(); }}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              modal.danger
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-primary hover:opacity-90 text-white"
            }`}
          >
            Confirm
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ActionsMenu({
  user,
  onAction,
}: {
  user: AdminUser;
  onAction: (action: string, user: AdminUser) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const actions: { label: string; icon: React.ComponentType<{ className?: string }>; key: string; danger?: boolean; hide?: boolean }[] = [
    { label: "+10 Credits", icon: Zap, key: "credits_10" },
    { label: "+50 Credits", icon: Zap, key: "credits_50" },
    { label: "+100 Credits", icon: Zap, key: "credits_100" },
    { label: "Reset Credits", icon: RefreshCw, key: "credits_reset" },
    { label: "Promote to Recruiter", icon: Briefcase, key: "role_recruiter", hide: user.role === "recruiter" },
    { label: "Set to Job Seeker", icon: UserCheck, key: "role_job_seeker", hide: user.role === "job_seeker" },
    { label: user.banned ? "Activate User" : "Ban User", icon: user.banned ? CheckCircle2 : Ban, key: user.banned ? "activate" : "ban", danger: !user.banned },
    { label: "Delete Account", icon: Trash2, key: "delete", danger: true },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            className="absolute right-0 top-10 z-30 w-52 bg-[#1a1825] border border-white/10 rounded-xl shadow-2xl overflow-hidden py-1"
          >
            {actions.filter(a => !a.hide).map(action => (
              <button
                key={action.key}
                onClick={() => { setOpen(false); onAction(action.key, user); }}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-left transition-colors ${
                  action.danger
                    ? "text-red-400 hover:bg-red-500/10"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                }`}
              >
                <action.icon className="w-3.5 h-3.5 shrink-0" />
                {action.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AdminUsers() {
  const { token } = useAuth();
  const { toast } = useToast();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [confirmModal, setConfirmModal] = useState<ConfirmModal | null>(null);

  const authHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/users`, { headers: authHeaders() });
      if (!res.ok) throw new Error();
      setUsers(await res.json());
    } catch {
      toast({ title: "Failed to load users", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (token) fetchUsers(); }, [token]);

  const handleAction = (action: string, user: AdminUser) => {
    const run = async (fn: () => Promise<void>) => {
      try {
        await fn();
        await fetchUsers();
      } catch {
        toast({ title: "Action failed", variant: "destructive" });
      }
    };

    const api = (path: string, opts: RequestInit = {}) =>
      fetch(`${API}${path}`, { headers: authHeaders(), ...opts });

    if (action.startsWith("credits_")) {
      const amountMap: Record<string, number> = { credits_10: 10, credits_50: 50, credits_100: 100 };
      if (action === "credits_reset") {
        setConfirmModal({
          title: "Reset Credits",
          description: `Reset all credits used this month for ${user.name}?`,
          onConfirm: () => run(() =>
            api(`/admin/user/${user.id}/credits`, {
              method: "PATCH",
              body: JSON.stringify({ action: "reset" }),
            }).then(r => { if (!r.ok) throw new Error(); toast({ title: "Credits reset" }); })
          ),
        });
      } else {
        const amount = amountMap[action];
        setConfirmModal({
          title: `Give ${amount} Credits`,
          description: `Add ${amount} bonus credits to ${user.name}'s account for this month?`,
          onConfirm: () => run(() =>
            api(`/admin/user/${user.id}/credits`, {
              method: "PATCH",
              body: JSON.stringify({ amount }),
            }).then(r => { if (!r.ok) throw new Error(); toast({ title: `+${amount} credits granted` }); })
          ),
        });
      }
      return;
    }

    if (action === "ban") {
      setConfirmModal({
        title: "Ban User",
        description: `Ban ${user.name}? They will not be able to log in.`,
        danger: true,
        onConfirm: () => run(() =>
          api(`/admin/user/${user.id}/ban`, { method: "PATCH" })
            .then(r => { if (!r.ok) throw new Error(); toast({ title: "User banned" }); })
        ),
      });
      return;
    }

    if (action === "activate") {
      run(() =>
        api(`/admin/user/${user.id}/activate`, { method: "PATCH" })
          .then(r => { if (!r.ok) throw new Error(); toast({ title: "User activated" }); })
      );
      return;
    }

    if (action === "role_recruiter" || action === "role_job_seeker") {
      const role = action === "role_recruiter" ? "recruiter" : "job_seeker";
      setConfirmModal({
        title: `Set role: ${ROLE_LABELS[role]}`,
        description: `Change ${user.name}'s role to ${ROLE_LABELS[role]}?`,
        onConfirm: () => run(() =>
          api(`/admin/user/${user.id}/role`, {
            method: "PATCH",
            body: JSON.stringify({ role }),
          }).then(r => { if (!r.ok) throw new Error(); toast({ title: "Role updated" }); })
        ),
      });
      return;
    }

    if (action === "delete") {
      setConfirmModal({
        title: "Delete Account",
        description: `Permanently delete ${user.name}'s account? This cannot be undone.`,
        danger: true,
        onConfirm: () => run(() =>
          api(`/admin/user/${user.id}`, { method: "DELETE" })
            .then(r => { if (!r.ok) throw new Error(); toast({ title: "Account deleted" }); })
        ),
      });
    }
  };

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const matchPlan = planFilter === "all" || u.subscriptionPlan === planFilter;
    return matchSearch && matchPlan;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">User Management</h1>
          <p className="text-sm text-white/40 mt-0.5">{users.length} total users</p>
        </div>
        <button
          onClick={fetchUsers}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white/60 hover:text-white hover:bg-white/10 transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors"
          />
        </div>
        <div className="relative">
          <select
            value={planFilter}
            onChange={e => setPlanFilter(e.target.value)}
            className="appearance-none pl-4 pr-9 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white/70 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors cursor-pointer"
          >
            <option value="all">All Plans</option>
            <option value="free">Free</option>
            <option value="pro">Pro</option>
            <option value="premium">Premium</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-14 rounded-xl bg-white/[0.03] animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <Users className="w-10 h-10 text-white/10 mx-auto mb-3" />
            <p className="text-white/30 text-sm">No users found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-white/30 text-xs uppercase tracking-wider border-b border-white/[0.07]">
                  <th className="px-5 py-3.5 text-left">User</th>
                  <th className="px-5 py-3.5 text-left">Plan</th>
                  <th className="px-5 py-3.5 text-left">Role</th>
                  <th className="px-5 py-3.5 text-left">Credits Left</th>
                  <th className="px-5 py-3.5 text-left">Status</th>
                  <th className="px-5 py-3.5 text-left">Joined</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {filtered.map(u => (
                  <motion.tr
                    key={u.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/40 to-purple-600/40 flex items-center justify-center text-xs font-bold text-white shrink-0 border border-white/10">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-white font-medium truncate max-w-[160px]">{u.name}</p>
                          <p className="text-white/40 text-xs truncate max-w-[160px]">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4"><PlanBadge plan={u.subscriptionPlan} /></td>
                    <td className="px-5 py-4">
                      <span className="text-white/60 text-xs">{ROLE_LABELS[u.role] ?? u.role}</span>
                    </td>
                    <td className="px-5 py-4">
                      {u.monthlyLimit === -1 ? (
                        <span className="text-amber-400 text-xs font-semibold">Unlimited</span>
                      ) : (
                        <div>
                          <span className="text-white font-medium tabular-nums">{u.creditsLeft}</span>
                          <span className="text-white/30 text-xs ml-1">/ {u.monthlyLimit}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4"><StatusBadge banned={u.banned} /></td>
                    <td className="px-5 py-4 text-white/40 text-xs whitespace-nowrap">
                      {new Date(u.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <ActionsMenu user={u} onAction={handleAction} />
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirm dialog */}
      <AnimatePresence>
        {confirmModal && (
          <ConfirmDialog
            modal={confirmModal}
            onClose={() => setConfirmModal(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
