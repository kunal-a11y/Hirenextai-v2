import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  LayoutDashboard, Users, TicketCheck, BarChart3, Briefcase, Zap,
  LogOut, ShieldAlert, ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { Logo } from "@/components/Logo";

const adminNavItems = [
  { href: "/dashboard/admin", icon: LayoutDashboard, label: "Dashboard", exact: true },
  { href: "/dashboard/admin/users", icon: Users, label: "Users" },
  { href: "/dashboard/admin/tickets", icon: TicketCheck, label: "Tickets" },
  { href: "/dashboard/admin/credits", icon: Zap, label: "Credits" },
];

function AdminNavItem({
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
        className={`relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap cursor-pointer select-none
          ${active
            ? "text-white bg-white/10"
            : "text-white/50 hover:text-white/80 hover:bg-white/5"
          }`}
      >
        <Icon className="w-4 h-4 shrink-0" />
        {label}
        {active && (
          <motion.div
            layoutId="admin-nav-indicator"
            className="absolute inset-0 rounded-lg border border-white/10 bg-white/[0.07]"
            style={{ zIndex: -1 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
        )}
      </span>
    </Link>
  );
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();

  const initials = user?.name
    ? user.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : "A";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Admin Navbar */}
      <header className="h-16 shrink-0 border-b border-white/[0.07] bg-[#0d0c14]/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="h-full px-4 flex items-center gap-4 max-w-[1600px] mx-auto">
          {/* Logo + badge */}
          <div className="flex items-center gap-2 shrink-0">
            <Logo className="h-7 w-auto" />
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-wider">
              <ShieldAlert className="w-3 h-3" />
              Admin
            </span>
          </div>

          <ChevronRight className="w-3.5 h-3.5 text-white/20 shrink-0" />

          {/* Nav links — horizontally scrollable on small screens */}
          <nav className="flex items-center gap-1 overflow-x-auto scrollbar-none flex-1 min-w-0">
            {adminNavItems.map(item => (
              <AdminNavItem key={item.href} {...item} />
            ))}
          </nav>

          {/* Right side: avatar + logout */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/60 to-purple-600/60 flex items-center justify-center text-xs font-bold text-white select-none border border-white/10">
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

      {/* Page content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
