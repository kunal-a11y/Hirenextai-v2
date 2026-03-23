import { useEffect, useRef } from "react";
import { useDemoStore } from "@/store/demo";

const DEMO_DURATION_MS = 120_000; // 2 minutes

export function useDemoTimeout() {
  const { isDemoMode, demoStartTime, demoExpired, expireDemo } = useDemoStore();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Clear any existing timer first
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // If demo is not active or already expired, do nothing
    if (!isDemoMode || demoExpired || !demoStartTime) return;

    const elapsed = Date.now() - demoStartTime;
    const remaining = DEMO_DURATION_MS - elapsed;

    if (remaining <= 0) {
      // Already expired (e.g. user came back after tab was hidden)
      expireDemo();
      return;
    }

    timerRef.current = setTimeout(() => {
      expireDemo();
    }, remaining);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isDemoMode, demoStartTime, demoExpired, expireDemo]);

  return { demoExpired };
}
