import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Logo } from "@/components/Logo";
import { useState } from "react";

export function Navbar() {
  const { isAuthenticated } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-background/50 backdrop-blur-xl"
    >
      <div className="max-w-7xl mx-auto px-6 h-[76px] md:h-24 flex items-center justify-between">
        <Link href="/">
          <Logo size="sm" />
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="/features" className="text-sm font-medium text-white/70 hover:text-white transition-colors">Features</Link>
          <Link href="/pricing" className="text-sm font-medium text-white/70 hover:text-white transition-colors">Pricing</Link>

          <div className="h-6 w-px bg-white/10" />

          {isAuthenticated ? (
            <Link href="/dashboard" className="btn-primary py-2.5 px-5 text-sm">
              Go to Dashboard
            </Link>
          ) : (
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-sm font-medium text-white hover:text-primary transition-colors">
                Sign In
              </Link>
              <Link href="/register" className="btn-primary py-2.5 px-5 text-sm hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all">
                Get Started
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-white/70 hover:text-white p-2"
          onClick={() => setMobileOpen(o => !o)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t border-white/5 bg-background/95 backdrop-blur-xl px-6 py-5 space-y-3"
          >
            <Link href="/features" onClick={() => setMobileOpen(false)} className="block text-sm font-medium text-white/70 hover:text-white py-2">Features</Link>
            <Link href="/pricing" onClick={() => setMobileOpen(false)} className="block text-sm font-medium text-white/70 hover:text-white py-2">Pricing</Link>
            <div className="h-px bg-white/5" />
            {isAuthenticated ? (
              <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="block btn-primary py-2.5 px-5 text-sm text-center">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" onClick={() => setMobileOpen(false)} className="block text-sm font-medium text-white/70 hover:text-white py-2">Sign In</Link>
                <Link href="/register" onClick={() => setMobileOpen(false)} className="block btn-primary py-2.5 px-5 text-sm text-center">
                  Get Started
                </Link>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
