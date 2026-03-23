import { useLocation } from "wouter";
import { Lock, X, Sparkles } from "lucide-react";
import { useDemoStore } from "@/store/demo";

export function AuthPromptModal() {
  const { showAuthModal, authModalFeature, closeAuthModal, disableDemo } = useDemoStore();
  const [, setLocation] = useLocation();

  if (!showAuthModal) return null;

  const handleAuth = (path: "/login" | "/register") => {
    disableDemo();
    closeAuthModal();
    setLocation(path);
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200]"
        onClick={closeAuthModal}
      />
      <div className="fixed inset-0 z-[201] flex items-center justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-sm glass-card p-8 rounded-2xl shadow-2xl border border-white/10 text-center">
          <button
            onClick={closeAuthModal}
            className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/30 to-purple-600/30 border border-primary/30 flex items-center justify-center mx-auto mb-5">
            <Lock className="w-7 h-7 text-primary" />
          </div>

          <h2 className="text-xl font-display font-bold text-white mb-2">
            Feature Locked
          </h2>
          <p className="text-white/60 text-sm mb-1 leading-relaxed">
            {authModalFeature
              ? `"${authModalFeature}" requires an account.`
              : "This feature requires an account."}
          </p>
          <p className="text-white/40 text-xs mb-7">
            Create a free account to unlock all AI-powered features.
          </p>

          <div className="space-y-3">
            <button
              onClick={() => handleAuth("/register")}
              className="btn-primary w-full gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Create Free Account
            </button>
            <button
              onClick={() => handleAuth("/login")}
              className="btn-secondary w-full"
            >
              Sign In
            </button>
          </div>

          <p className="text-xs text-white/30 mt-5">
            Free plan · No credit card required
          </p>
        </div>
      </div>
    </>
  );
}
