import { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { Clock, UserPlus, LogIn, Sparkles, Home } from "lucide-react";
import { useDemoStore } from "@/store/demo";
import { useDemoTimeout } from "@/hooks/use-demo-timeout";
import { useAuthStore } from "@/hooks/use-auth";

export function DemoTimeoutModal() {
  useDemoTimeout();

  const { demoExpired, clearExpired, disableDemo } = useDemoStore();
  const [, setLocation] = useLocation();

  const clearDemoSession = useCallback(() => {
    clearExpired();
    disableDemo();
    // Also wipe any stale auth token so PublicRoutes don't redirect back to dashboard
    useAuthStore.getState().clearStore();
  }, [clearExpired, disableDemo]);

  const handleGoHome = useCallback(() => {
    clearDemoSession();
    setLocation("/");
  }, [clearDemoSession, setLocation]);

  const handleLogin = useCallback(() => {
    clearDemoSession();
    setLocation("/login");
  }, [clearDemoSession, setLocation]);

  const handleRegister = useCallback(() => {
    clearDemoSession();
    setLocation("/register");
  }, [clearDemoSession, setLocation]);

  // Escape key → go home (safe dismissal)
  useEffect(() => {
    if (!demoExpired) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleGoHome();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [demoExpired, handleGoHome]);

  // Lock background scroll while visible
  useEffect(() => {
    document.body.style.overflow = demoExpired ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [demoExpired]);

  return (
    <AnimatePresence>
      {demoExpired && (
        <>
          {/* Blur overlay — clicking it goes home instead of blocking forever */}
          <motion.div
            key="demo-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="fixed inset-0 z-[999] bg-black/70 backdrop-blur-md cursor-pointer"
            aria-hidden="true"
            onClick={handleGoHome}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              key="demo-modal"
              initial={{ opacity: 0, scale: 0.88, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 16 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              className="pointer-events-auto w-full max-w-md"
              role="dialog"
              aria-modal="true"
              aria-labelledby="demo-timeout-title"
            >
              <div className="relative bg-[#0d0d18] border border-white/10 rounded-3xl shadow-[0_40px_100px_rgba(0,0,0,0.9)] overflow-hidden">
                {/* Glow accents */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[150px] bg-indigo-600/20 blur-[80px] pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-[200px] h-[150px] bg-purple-600/15 blur-[60px] pointer-events-none" />

                {/* Escape hint */}
                <div className="absolute top-4 right-4">
                  <kbd className="px-2 py-1 text-[10px] text-white/20 border border-white/10 rounded-md font-mono">ESC</kbd>
                </div>

                <div className="relative z-10 p-8 text-center">
                  {/* Icon */}
                  <div className="flex items-center justify-center mb-6">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-600/30 to-purple-600/30 border border-indigo-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.3)]">
                        <Clock className="w-9 h-9 text-indigo-400" />
                      </div>
                      <motion.div
                        animate={{ scale: [1, 1.25, 1], opacity: [0.4, 0, 0.4] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute inset-0 rounded-2xl border border-indigo-400/40"
                      />
                    </div>
                  </div>

                  <h2
                    id="demo-timeout-title"
                    className="text-2xl font-display font-extrabold text-white mb-3 tracking-tight"
                  >
                    Demo Session Ended
                  </h2>

                  <p className="text-white/60 text-sm leading-relaxed mb-2 max-w-xs mx-auto">
                    Your 2-minute demo has expired.
                  </p>
                  <p className="text-white/80 text-sm leading-relaxed mb-7 max-w-xs mx-auto font-medium">
                    Create a free account to continue exploring HirenextAI — no credit card required.
                  </p>

                  {/* Perks */}
                  <div className="flex flex-col gap-2 mb-7 text-left">
                    {[
                      "Unlimited job browsing",
                      "5 free AI generations per month",
                      "Full application tracker",
                      "Personalised AI job matching",
                    ].map((perk) => (
                      <div key={perk} className="flex items-center gap-2.5">
                        <div className="w-4 h-4 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center shrink-0">
                          <Sparkles className="w-2.5 h-2.5 text-indigo-400" />
                        </div>
                        <span className="text-white/70 text-sm">{perk}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA Buttons */}
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={handleRegister}
                      className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-sm hover:opacity-90 active:opacity-80 transition-all shadow-[0_0_25px_rgba(99,102,241,0.4)] hover:shadow-[0_0_35px_rgba(99,102,241,0.5)]"
                    >
                      <UserPlus className="w-4 h-4" />
                      Create Free Account
                    </button>

                    <button
                      onClick={handleLogin}
                      className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl border border-white/15 bg-white/[0.04] text-white/80 font-medium text-sm hover:bg-white/[0.08] hover:border-white/25 hover:text-white transition-all"
                    >
                      <LogIn className="w-4 h-4" />
                      Sign In
                    </button>

                    {/* Back to Home — safe escape hatch */}
                    <button
                      onClick={handleGoHome}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl text-white/30 hover:text-white/60 text-sm transition-colors"
                    >
                      <Home className="w-3.5 h-3.5" />
                      Back to Home
                    </button>
                  </div>

                  <p className="mt-4 text-xs text-white/20 leading-relaxed">
                    Press <kbd className="px-1 py-0.5 border border-white/10 rounded text-[10px] font-mono">ESC</kbd> or click outside to go home
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
