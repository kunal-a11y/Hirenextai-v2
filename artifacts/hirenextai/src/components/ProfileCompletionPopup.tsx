import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { useUpdateProfile } from "@workspace/api-client-react";
import {
  User, Phone, MapPin, Zap, GraduationCap, FileText, Camera,
  Rocket, CheckCircle2, Circle, Loader2, Clock, X, ChevronRight
} from "lucide-react";

const POPUP_COOLDOWN_KEY = "profilePopupTime";
const POPUP_COOLDOWN_MS = 3 * 60 * 1000; // 3 minutes

export function shouldShowProfilePopup(
  profile: { completionPct: number; setupCompleted: boolean } | null | undefined,
  isDemoMode: boolean,
  role?: string | null
): boolean {
  if (!profile || isDemoMode) return false;
  if (role === "recruiter" || role === "admin") return false;
  if (profile.completionPct >= 60) return false;

  const lastShown = localStorage.getItem(POPUP_COOLDOWN_KEY);
  if (lastShown) {
    const diff = Date.now() - Number(lastShown);
    if (diff < POPUP_COOLDOWN_MS) return false;
  }
  return true;
}

export function markProfilePopupShown() {
  localStorage.setItem(POPUP_COOLDOWN_KEY, String(Date.now()));
}

interface UserSnap {
  name?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
}

interface ProfileSnap {
  completionPct: number;
  setupCompleted: boolean;
  skills: string[];
  education: unknown[];
  resumeUrl?: string | null;
  preferredLocations: string[];
}

interface Props {
  profile: ProfileSnap;
  user: UserSnap | null | undefined;
  onCompleteNow: () => void;
  onRemindLater: () => void;
}

const FIELDS = [
  { label: "Full Name",       icon: User,          done: (u: UserSnap, _p: ProfileSnap) => !!u?.name },
  { label: "Profile Photo",   icon: Camera,        done: (u: UserSnap, _p: ProfileSnap) => !!u?.avatarUrl },
  { label: "Phone Number",    icon: Phone,         done: (u: UserSnap, _p: ProfileSnap) => !!u?.phone },
  { label: "City / Location", icon: MapPin,        done: (_u: UserSnap, p: ProfileSnap) => (p.preferredLocations?.length ?? 0) > 0 },
  { label: "Skills",          icon: Zap,           done: (_u: UserSnap, p: ProfileSnap) => (p.skills?.length ?? 0) > 0 },
  { label: "Education",       icon: GraduationCap, done: (_u: UserSnap, p: ProfileSnap) => (p.education?.length ?? 0) > 0 },
  { label: "Resume",          icon: FileText,      done: (_u: UserSnap, p: ProfileSnap) => !!p.resumeUrl },
];

export default function ProfileCompletionPopup({ profile, user, onCompleteNow, onRemindLater }: Props) {
  const [, setLocation] = useLocation();
  const updateProfile = useUpdateProfile();

  const userSnap: UserSnap = user ?? {};
  const fields = FIELDS.map(f => ({ ...f, isDone: f.done(userSnap, profile) }));
  const doneCount = fields.filter(f => f.isDone).length;
  const pct = profile.completionPct;

  const markSeen = async () => {
    if (!profile.setupCompleted) {
      await updateProfile.mutateAsync({ data: { setupCompleted: true } });
    }
  };

  const handleCompleteNow = async () => {
    await markSeen();
    onCompleteNow();
    setLocation("/dashboard/profile");
  };

  const handleRemindLater = async () => {
    await markSeen();
    onRemindLater();
  };

  const busy = updateProfile.isPending;

  return (
    <AnimatePresence>
      <div className="fixed bottom-4 right-4 z-[9999] sm:bottom-6 sm:right-6" aria-modal="true" role="dialog">
        {/* Modal - slides in from bottom-right */}
        <motion.div
          key="modal"
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.96 }}
          transition={{ type: "spring", duration: 0.45, bounce: 0.2 }}
          className="relative w-[340px] sm:w-[380px] flex flex-col bg-[#0f0f14] border border-white/10 rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.8)] overflow-hidden"
          style={{ maxHeight: "80vh" }}
        >
          {/* Top gradient bar */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 z-10 shrink-0" />

          {/* Ambient glows */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-24 -right-16 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-purple-600/10 rounded-full blur-3xl" />
          </div>

          {/* Close (X) button */}
          <button
            onClick={handleRemindLater}
            disabled={busy}
            className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all disabled:cursor-not-allowed"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Scrollable content */}
          <div className="relative overflow-y-auto flex-1 p-6 sm:p-8 pb-4">
            {/* Header */}
            <div className="text-center mb-6 pr-6">
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.15, type: "spring", bounce: 0.4 }}
                className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600/30 to-purple-600/30 border border-indigo-500/30 flex items-center justify-center mx-auto mb-3 shadow-[0_0_30px_rgba(99,102,241,0.25)]"
              >
                <Rocket className="w-7 h-7 text-indigo-400" />
              </motion.div>

              <h2 className="text-lg sm:text-xl font-bold leading-tight mb-1.5 text-white">
                Complete your profile to get<br />
                <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  better job matches 🚀
                </span>
              </h2>
              <p className="text-xs text-white/50">
                Profiles with 80%+ completion get{" "}
                <span className="text-indigo-400 font-semibold">3× more recruiter views</span>
              </p>
            </div>

            {/* Progress bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-white/60">Profile Strength</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-indigo-400">{pct}%</span>
                  <span className="text-xs text-white/30">/ Goal: 80%</span>
                </div>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.9, ease: "easeOut", delay: 0.25 }}
                />
              </div>
              <p className="text-xs text-white/35 mt-1">{doneCount} of {fields.length} sections completed</p>
            </div>

            {/* Checklist */}
            <div className="grid grid-cols-2 gap-1.5 pb-2">
              {fields.map(({ label, icon: Icon, isDone }, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 + i * 0.04 }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium ${
                    isDone
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                      : "bg-white/[0.03] border-white/[0.07] text-white/40"
                  }`}
                >
                  {isDone
                    ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                    : <Circle className="w-3.5 h-3.5 shrink-0 text-white/20" />
                  }
                  <Icon className="w-3 h-3 shrink-0" />
                  <span className="truncate">{label}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Sticky footer with action buttons */}
          <div className="relative shrink-0 px-6 sm:px-8 pb-5 pt-3 border-t border-white/[0.06] bg-[#0f0f14]/95 backdrop-blur-sm space-y-2">
            <motion.button
              onClick={handleCompleteNow}
              disabled={busy}
              whileHover={{ scale: busy ? 1 : 1.02 }}
              whileTap={{ scale: busy ? 1 : 0.98 }}
              className="w-full py-3 rounded-2xl font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-[0_4px_20px_rgba(99,102,241,0.35)] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed text-sm"
            >
              {busy
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Rocket className="w-4 h-4" />
              }
              Complete Profile Now
            </motion.button>

            <button
              onClick={handleRemindLater}
              disabled={busy}
              className="w-full py-2 text-xs text-white/40 hover:text-white/70 transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              <Clock className="w-3.5 h-3.5" />
              Remind me in 3 minutes
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
