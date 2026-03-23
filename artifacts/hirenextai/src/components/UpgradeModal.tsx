import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, Crown, CheckCircle2, ArrowRight, Lock } from "lucide-react";
import { Link } from "wouter";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  featureLabel?: string;
  isProOnly?: boolean;
  message?: string;
}

const PRO_PERKS = [
  "Unlimited cover letters every month",
  "Recruiter Outreach AI (Pro exclusive)",
  "Interview Prep AI (Pro exclusive)",
  "Unlimited resume bullet optimization",
  "AI Job Match scoring",
  "AI career suggestions",
  "Priority support",
];

export function UpgradeModal({ open, onClose, featureLabel, isProOnly, message }: UpgradeModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onClick={e => e.stopPropagation()}
            className="relative z-10 w-full max-w-md"
            style={{ background: "hsl(240 32% 8% / 0.98)", border: "1px solid hsl(240 20% 20% / 0.6)", borderRadius: "1.25rem", boxShadow: "0 25px 60px rgba(0,0,0,0.6), 0 0 0 1px hsl(240 20% 18% / 0.4)" }}
          >
            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="p-7">
              {/* Icon */}
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center mb-5">
                {isProOnly ? <Lock className="w-7 h-7 text-indigo-400" /> : <Zap className="w-7 h-7 text-indigo-400" />}
              </div>

              {/* Headline */}
              <h2 className="text-xl font-display font-bold mb-2">
                {isProOnly ? `${featureLabel ?? "This feature"} is Pro-exclusive` : "You've hit your monthly limit"}
              </h2>
              <p className="text-white/55 text-sm leading-relaxed mb-6">
                {message ?? (isProOnly
                  ? `Upgrade to Pro to unlock ${featureLabel ?? "this feature"} along with all other premium AI tools.`
                  : `You've used all your ${featureLabel ?? "AI"} credits for this month. Upgrade to Pro for unlimited access.`)}
              </p>

              {/* Perks */}
              <ul className="space-y-2.5 mb-7">
                {PRO_PERKS.map((perk, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-sm text-white/75">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-indigo-400" />
                    {perk}
                  </li>
                ))}
              </ul>

              {/* Price hint */}
              <div className="flex items-baseline gap-1 mb-5 px-4 py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                <span className="text-2xl font-display font-bold">₹199</span>
                <span className="text-white/40 text-sm">/month</span>
                <span className="ml-auto text-xs text-indigo-400 font-medium">Cancel anytime</span>
              </div>

              {/* CTA */}
              <Link
                href="/dashboard/subscription"
                onClick={onClose}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:opacity-90 transition-opacity shadow-lg shadow-indigo-500/20"
              >
                <Crown className="w-4 h-4" /> Upgrade to Pro <ArrowRight className="w-4 h-4" />
              </Link>

              <button
                onClick={onClose}
                className="w-full mt-3 py-2 text-sm text-white/40 hover:text-white/70 transition-colors"
              >
                Maybe later
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
