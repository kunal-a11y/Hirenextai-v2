import { Link, useLocation } from "wouter";
import { useAuth, useAuthStore } from "@/hooks/use-auth";
import {
  LayoutDashboard, Plus, Briefcase, Users, Zap, CreditCard,
  BarChart3, LogOut, Building2, ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { Logo } from "@/components/Logo";

const recruiterNavItems = [
  { href: "/dashboard/recruiter", icon: LayoutDashboard, label: "Dashboard", exact: true },
  { href: "/dashboard/recruiter/post-job", icon: Plus, label: "Post Job" },
  { href: "/dashboard/recruiter/boost-jobs", icon: Zap, label: "Boost Jobs" },
  { href: "/dashboard/recruiter/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/dashboard/recruiter/profile", icon: Building2, label: "Profile" },
  { href: "/dashboard/recruiter/subscription", icon: CreditCard, label: "Plans" },
];

function RecruiterNavItem({
  href,
  icon: Icon,
  label,
  exact,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  exact?: boolean;
}) {
  const [location] = useLocation();
  const active = exact ? location === href : location.startsWith(href);

  return (
    <Link href={href}>
      <span
        className={`relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all whitespace-nowrap cursor-pointer select-none
          ${active
            ? "text-white bg-white/10"
            : "text-white/50 hover:text-white/80 hover:bg-white/5"
          }`}
      >
        <Icon className="w-3.5 h-3.5 shrink-0" />
        {label}
        {active && (
          <motion.div
            layoutId="recruiter-nav-indicator"
            className="absolute inset-0 rounded-lg border border-white/10 bg-white/[0.07]"
            style={{ zIndex: -1 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
        )}
      </span>
    </Link>
  );
}

export function RecruiterLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();

  const initials = user?.name
    ? user.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : "R";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="h-14 shrink-0 border-b border-white/[0.07] bg-[#0d0c14]/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="h-full max-w-[1200px] mx-auto px-4 flex items-center gap-2">
          {/* Logo + recruiter badge */}
          <div className="flex items-center gap-2 shrink-0 mr-1">
            <Logo className="h-7 w-auto" />
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-wider">
              <Building2 className="w-3 h-3" />
              Recruiter
            </span>
          </div>

          <ChevronRight className="w-3.5 h-3.5 text-white/20 shrink-0" />

          {/* Nav links — scrollable */}
          <nav className="flex items-center gap-0.5 overflow-x-auto scrollbar-none flex-1 min-w-0">
            {recruiterNavItems.map(item => (
              <RecruiterNavItem key={item.href} {...item} />
            ))}
          </nav>

          {/* Right: avatar + logout */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/60 to-indigo-600/60 flex items-center justify-center text-xs font-bold text-white select-none border border-white/10">
              {initials}
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-white/40 hover:text-white hover:bg-white/5 transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
