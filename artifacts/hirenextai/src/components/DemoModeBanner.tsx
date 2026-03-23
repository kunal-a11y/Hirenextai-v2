import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Zap, LogOut, UserPlus, Clock } from "lucide-react";
import { useDemoStore } from "@/store/demo";
import { useAuthStore } from "@/hooks/use-auth";

const DEMO_DURATION_MS = 120_000; // 2 minutes

function useCountdown(demoStartTime: number | null): string {
  const [label, setLabel] = useState("2:00");

  useEffect(() => {
    if (!demoStartTime) return;

    const tick = () => {
      const elapsed = Date.now() - demoStartTime;
      const remaining = Math.max(0, DEMO_DURATION_MS - elapsed);
      const mins = Math.floor(remaining / 60000);
      const secs = Math.floor((remaining % 60000) / 1000);
      setLabel(`${mins}:${secs.toString().padStart(2, "0")}`);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [demoStartTime]);

  return label;
}

export function DemoModeBanner() {
  const { isDemoMode, disableDemo, clearExpired, demoStartTime } = useDemoStore();
  const [, setLocation] = useLocation();
  const countdown = useCountdown(demoStartTime);

  if (!isDemoMode) return null;

  const isLow = (() => {
    if (!demoStartTime) return false;
    const remaining = DEMO_DURATION_MS - (Date.now() - demoStartTime);
    return remaining <= 30_000;
  })();

  const handleSignUp = () => {
    clearExpired();
    disableDemo();
    useAuthStore.getState().clearStore();
    setLocation("/register");
  };

  const handleExitDemo = () => {
    clearExpired();
    disableDemo();
    useAuthStore.getState().clearStore();
    setLocation("/");
  };

  return (
    <div className="w-full bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border-b border-amber-500/20 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 text-sm">
          <div className="flex items-center gap-1.5 shrink-0">
            <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span className="font-semibold text-amber-300">You are in Demo Mode</span>
          </div>
          <span className="text-white/50 hidden sm:inline">—</span>
          <span className="text-white/60 hidden sm:inline">
            Data will not be saved. Create a free account to unlock all features.
          </span>
          <span className="text-white/60 sm:hidden text-xs">Data won't be saved.</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Countdown timer */}
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-mono font-semibold transition-colors ${
            isLow
              ? "bg-red-500/20 border-red-500/30 text-red-300 animate-pulse"
              : "bg-black/20 border-white/10 text-white/50"
          }`}>
            <Clock className="w-3 h-3" />
            {countdown}
          </div>

          <button
            onClick={handleSignUp}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:bg-amber-500/30 transition-colors text-xs font-medium"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Create Free Account</span>
            <span className="sm:hidden">Sign Up</span>
          </button>
          <button
            onClick={handleExitDemo}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors text-xs font-medium"
            title="Exit demo and return to home"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exit Demo</span>
          </button>
        </div>
      </div>
    </div>
  );
}
