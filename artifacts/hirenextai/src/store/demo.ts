import { create } from "zustand";

interface DemoState {
  isDemoMode: boolean;
  showAuthModal: boolean;
  authModalFeature: string;
  demoStartTime: number | null;
  demoExpired: boolean;

  enableDemo: () => void;
  disableDemo: () => void;
  openAuthModal: (feature: string) => void;
  closeAuthModal: () => void;
  expireDemo: () => void;
  clearExpired: () => void;
}

const DEMO_MODE_KEY = "hirenext_demo_mode";
const DEMO_START_KEY = "demoStartTime";
const DEMO_EXPIRED_KEY = "demoExpired";
const DEMO_USER_KEY = "demoUser";

function readDemoStart(): number | null {
  const raw = localStorage.getItem(DEMO_START_KEY);
  if (!raw) return null;
  const parsed = parseInt(raw, 10);
  return isNaN(parsed) ? null : parsed;
}

function readDemoExpired(): boolean {
  return localStorage.getItem(DEMO_EXPIRED_KEY) === "true";
}

export const useDemoStore = create<DemoState>((set) => ({
  isDemoMode: localStorage.getItem(DEMO_MODE_KEY) === "true",
  showAuthModal: false,
  authModalFeature: "",
  demoStartTime: readDemoStart(),
  demoExpired: readDemoExpired(),

  enableDemo: () => {
    const now = Date.now();
    localStorage.setItem(DEMO_MODE_KEY, "true");
    localStorage.setItem(DEMO_START_KEY, String(now));
    localStorage.removeItem(DEMO_EXPIRED_KEY);
    set({ isDemoMode: true, demoStartTime: now, demoExpired: false });
  },

  disableDemo: () => {
    localStorage.removeItem(DEMO_MODE_KEY);
    localStorage.removeItem(DEMO_START_KEY);
    localStorage.removeItem(DEMO_EXPIRED_KEY);
    localStorage.removeItem(DEMO_USER_KEY);
    set({ isDemoMode: false, showAuthModal: false, demoStartTime: null, demoExpired: false });
  },

  expireDemo: () => {
    localStorage.setItem(DEMO_EXPIRED_KEY, "true");
    localStorage.removeItem(DEMO_MODE_KEY);
    localStorage.removeItem(DEMO_USER_KEY);
    set({ isDemoMode: false, demoExpired: true });
  },

  clearExpired: () => {
    localStorage.removeItem(DEMO_EXPIRED_KEY);
    localStorage.removeItem(DEMO_START_KEY);
    localStorage.removeItem(DEMO_USER_KEY);
    set({ demoExpired: false, demoStartTime: null });
  },

  openAuthModal: (feature: string) => {
    set({ showAuthModal: true, authModalFeature: feature });
  },

  closeAuthModal: () => {
    set({ showAuthModal: false, authModalFeature: "" });
  },
}));
