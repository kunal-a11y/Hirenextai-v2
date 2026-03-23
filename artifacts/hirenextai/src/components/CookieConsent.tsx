import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X } from "lucide-react";
import { Link } from "wouter";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem("cookie_consent", "accepted");
    setVisible(false);
  };

  const deny = () => {
    localStorage.setItem("cookie_consent", "denied");
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 80 }}
          transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
          className="fixed bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-[200]"
        >
          <div className="bg-black border border-white/10 rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.8)] overflow-hidden backdrop-blur-xl">
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                  <Cookie className="w-4 h-4 text-purple-400" />
                </div>
                <span className="font-semibold text-white text-sm">Cookie Preferences</span>
              </div>
              <button
                onClick={deny}
                className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-4">
              <p className="text-sm text-white/60 leading-relaxed">
                We use cookies to improve your experience, personalise job recommendations, and analyse usage.{" "}
                <Link href="/cookies" className="text-purple-400 hover:text-purple-300 underline underline-offset-2">
                  Cookie Policy
                </Link>
              </p>
            </div>

            {/* Actions */}
            <div className="px-5 pb-5 flex items-center gap-3">
              <button
                onClick={accept}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-[0_0_15px_rgba(99,102,241,0.3)]"
              >
                Accept All
              </button>
              <button
                onClick={deny}
                className="flex-1 py-2.5 rounded-xl border border-white/15 text-white/70 text-sm font-medium hover:bg-white/5 hover:text-white transition-all"
              >
                Deny
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
