import { Link, useLocation } from "wouter";
import { useAuth, useAuthStore } from "@/hooks/use-auth";
import { useGetAIUsage, useGetSubscription, useGetProfile } from "@workspace/api-client-react";
import {
  Briefcase, FileText, Sparkles, User as UserIcon,
  CreditCard, LogOut, Menu, X, Crown, ChevronDown, ScrollText, Building2, Plus, Users, Bell, Bookmark, ShieldAlert, Zap, BarChart3
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ProfileCompletionPopup, { shouldShowProfilePopup, markProfilePopupShown } from "@/components/ProfileCompletionPopup";
import { DemoModeBanner } from "@/components/DemoModeBanner";
import { AuthPromptModal } from "@/components/AuthPromptModal";
import { Logo } from "@/components/Logo";
import { useDemoStore } from "@/store/demo";
import { useToast } from "@/hooks/use-toast";
import { FloatingChat } from "@/components/FloatingChat";

const PAGE_TITLES: Record<string, string> = {
  jobs: "Find Jobs",
  applications: "My Applications",
  "ai-tools": "AI Tools",
  chat: "AI Career Chat",
  resume: "AI Resume Studio",
  profile: "Profile",
  subscription: "Subscription",
  recruiter: "Recruiter Dashboard",
  "post-job": "Post a Job",
  "job-alerts": "Job Alerts",
  "saved-jobs": "Saved Jobs",
};

const jobSeekerNavItems = [
  { href: "/dashboard/jobs", icon: Briefcase, label: "Find Jobs" },
  { href: "/dashboard/applications", icon: FileText, label: "Applications" },
  { href: "/dashboard/saved-jobs", icon: Bookmark, label: "Saved Jobs" },
  { href: "/dashboard/ai-tools", icon: Sparkles, label: "AI Tools" },
  { href: "/dashboard/resume", icon: ScrollText, label: "Resume Studio" },
  { href: "/dashboard/job-alerts", icon: Bell, label: "Job Alerts" },
  { href: "/dashboard/profile", icon: UserIcon, label: "Profile" },
  { href: "/dashboard/subscription", icon: CreditCard, label: "Subscription" },
];

const recruiterNavItems = [
  { href: "/dashboard/recruiter", icon: Building2, label: "Dashboard", exact: true },
  { href: "/dashboard/recruiter/post-job", icon: Plus, label: "Post Job" },
  { href: "/dashboard/recruiter/boost-jobs", icon: Zap, label: "Boost Jobs" },
  { href: "/dashboard/recruiter/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/dashboard/recruiter/profile", icon: UserIcon, label: "Company Profile" },
  { href: "/dashboard/subscription", icon: CreditCard, label: "Subscription" },
];

const API = import.meta.env.VITE_API_URL ?? "/api";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { user, logout, token } = useAuth();
  const { isDemoMode, demoExpired, disableDemo, clearExpired } = useDemoStore();
  const isAnyDemoMode = isDemoMode || demoExpired;
  const { toast } = useToast();
  const isRecruiter = !isAnyDemoMode && user?.role === "recruiter";
  const isAdmin = !isAnyDemoMode && user?.role === "admin";
  const navItems = isRecruiter ? recruiterNavItems : jobSeekerNavItems;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [profilePopupShown, setProfilePopupShown] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const remindTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [unreadAlerts, setUnreadAlerts] = useState(0);

  const { data: usage } = useGetAIUsage();
  const { data: subscription } = useGetSubscription();
  const { data: profile, isLoading: isProfileLoading } = useGetProfile();

  const profileRef = useRef(profile);
  profileRef.current = profile;

  const lowCreditWarnedRef = useRef(false);

  // Poll unread alert count every 2 minutes (skip for demo/recruiter)
  const fetchUnreadAlerts = useCallback(async () => {
    if (isAnyDemoMode || isRecruiter || !token) return;
    try {
      const res = await fetch(`${API}/alerts/unread-count`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const { count } = await res.json();
        setUnreadAlerts(count);
      }
    } catch {}
  }, [token, isAnyDemoMode, isRecruiter]);

  useEffect(() => {
    fetchUnreadAlerts();
    const interval = setInterval(fetchUnreadAlerts, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchUnreadAlerts]);

  // Clear badge when user visits Job Alerts page
  useEffect(() => {
    if (location === "/dashboard/job-alerts" && unreadAlerts > 0) {
      setUnreadAlerts(0);
    }
  }, [location]);

  // Warn when AI credits are running low (< 5)
  useEffect(() => {
    if (isAnyDemoMode || !usage) return;
    const creditsLeft = (usage as any).creditsLeft;
    if (creditsLeft == null || creditsLeft < 0) return; // unlimited plan
    if (!lowCreditWarnedRef.current && creditsLeft > 0 && creditsLeft < 5) {
      lowCreditWarnedRef.current = true;
      toast({
        title: `⚡ Only ${creditsLeft} AI credit${creditsLeft === 1 ? "" : "s"} left`,
        description: "Upgrade to Pro for 200 credits per month.",
      });
    }
    if (creditsLeft === 0 && !lowCreditWarnedRef.current) {
      lowCreditWarnedRef.current = true;
      toast({
        title: "⚡ AI credits exhausted",
        description: "You've used all your AI credits. Upgrade to continue.",
        variant: "destructive",
      });
    }
  }, [(usage as any)?.creditsLeft, isAnyDemoMode]);

  useEffect(() => {
    // Never show popup for recruiters, admins, or demo sessions
    if (isRecruiter || isAdmin || isAnyDemoMode) return;
    if (!isProfileLoading && profile) {
      if (profile.completionPct >= 60) {
        setShowProfilePopup(false);
        if (remindTimerRef.current) {
          clearTimeout(remindTimerRef.current);
          remindTimerRef.current = null;
        }
      } else if (!profilePopupShown && shouldShowProfilePopup(profile, isDemoMode, user?.role)) {
        setShowProfilePopup(true);
        setProfilePopupShown(true);
        markProfilePopupShown();
      }
    }
  }, [isDemoMode, isProfileLoading, profile, isRecruiter, isAdmin, isAnyDemoMode]);

  useEffect(() => {
    return () => {
      if (remindTimerRef.current) clearTimeout(remindTimerRef.current);
    };
  }, []);

  const handlePopupCompleteNow = () => {
    setShowProfilePopup(false);
    if (remindTimerRef.current) {
      clearTimeout(remindTimerRef.current);
      remindTimerRef.current = null;
    }
  };

  const handlePopupRemindLater = () => {
    setShowProfilePopup(false);
    // localStorage cooldown is already set when popup opened; nothing more needed here
    if (remindTimerRef.current) {
      clearTimeout(remindTimerRef.current);
      remindTimerRef.current = null;
    }
  };


  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  const handleExitDemo = () => {
    setDropdownOpen(false);
    setIsMobileMenuOpen(false);
    clearExpired();
    disableDemo();
    // Clear any stale auth token so PublicRoutes don't misbehave after demo
    useAuthStore.getState().clearStore();
    toast({ title: "Demo session ended", description: "Create a free account to save your progress.", duration: 3000 });
    setLocation("/");
  };

  const handleLogout = async () => {
    setDropdownOpen(false);
    setIsMobileMenuOpen(false);
    await logout();
    clearExpired();
    disableDemo();
    toast({ title: "Logged out successfully", description: "See you next time!", duration: 3000 });
    setLocation("/");
  };

  const currentPage = location.split("/").pop() || "jobs";
  const pageTitle = PAGE_TITLES[currentPage] || "Dashboard";
  const plan = subscription?.plan ?? user?.subscriptionPlan ?? "free";
  const displayName = isAnyDemoMode ? "Demo User" : (user?.name ?? "User");
  const displayEmail = isAnyDemoMode ? "demo@hirenextai.com" : (user?.email ?? "");
  const initials = displayName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  const PlanBadge = ({ size = "sm" }: { size?: "xs" | "sm" }) => {
    const colors: Record<string, string> = {
      free: "bg-white/5 text-white/60 border-white/10",
      pro: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
      premium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    };
    return (
      <span className={`px-2 py-0.5 rounded-md border font-semibold uppercase tracking-wider ${size === "xs" ? "text-[10px]" : "text-xs"} ${colors[plan] || colors.free}`}>
        {plan === "premium" && <Crown className="w-2.5 h-2.5 inline mr-1" />}
        {plan}
      </span>
    );
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <DemoModeBanner />
      <AuthPromptModal />

      {showProfilePopup && !isDemoMode && !isRecruiter && !isAdmin && profile && (
        <ProfileCompletionPopup
          profile={profile}
          user={user}
          onCompleteNow={handlePopupCompleteNow}
          onRemindLater={handlePopupRemindLater}
        />
      )}

      <div className="flex flex-1 flex-col bg-background overflow-hidden min-h-0">
        {/* Top Navigation Bar */}
        <header className="sticky top-0 h-14 shrink-0 z-40 border-b border-white/[0.07] bg-[#0a0a14]/80 backdrop-blur-[12px]">
          <div className="h-full max-w-[1200px] mx-auto px-4 flex items-center gap-2">

            {/* Logo — always visible, never shrinks */}
            <Link href="/dashboard/jobs" className="shrink-0 flex items-center mr-1">
              <Logo size="sm" />
            </Link>

            {/* Nav — fills remaining space, horizontally scrollable */}
            <nav className="hidden sm:flex flex-1 min-w-0 overflow-x-auto scrollbar-none items-center gap-0.5">
              {navItems.map((item) => {
                const isActive = (item as any).exact ? location === item.href : location.startsWith(item.href);
                const isAlertItem = item.href === "/dashboard/job-alerts";
                const showBadge = isAlertItem && unreadAlerts > 0 && !isActive;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-200 whitespace-nowrap ${
                      isActive
                        ? "bg-primary/[0.12] text-primary"
                        : "text-white/60 hover:text-white hover:bg-white/[0.08]"
                    }`}
                  >
                    <span className="relative shrink-0">
                      <item.icon className={`w-3.5 h-3.5 ${isActive ? "text-primary" : "text-white/50"}`} />
                      {showBadge && (
                        <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 flex items-center justify-center rounded-full bg-indigo-500 text-[8px] font-bold text-white leading-none">
                          {unreadAlerts > 9 ? "9+" : unreadAlerts}
                        </span>
                      )}
                    </span>
                    <span className="hidden min-[900px]:inline">{item.label}</span>
                  </Link>
                );
              })}
              {isAdmin && (
                <Link
                  href="/dashboard/admin"
                  className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-200 whitespace-nowrap ${
                    location.startsWith("/dashboard/admin")
                      ? "bg-red-500/[0.12] text-red-400"
                      : "text-red-400/60 hover:text-red-400 hover:bg-red-500/[0.08]"
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden min-[900px]:inline">Admin</span>
                </Link>
              )}
            </nav>

            {/* Right section — always visible, never shrinks */}
            <div className="flex items-center gap-1.5 shrink-0 ml-auto">
              {/* AI Credits badge */}
              {!isAnyDemoMode && (usage as any)?.creditsLeft != null && (usage as any).creditsLeft >= 0 && (
                <Link href="/dashboard/ai-tools">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-[11px] font-semibold transition-colors cursor-pointer ${
                    (usage as any).creditsLeft === 0
                      ? "bg-red-500/10 border-red-500/30 text-red-400"
                      : (usage as any).creditsLeft < 5
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                      : "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
                  }`}>
                    <Zap className="w-3 h-3" />
                    <span className="hidden sm:inline">
                      {(usage as any).creditsLeft === 0 ? "0" : (usage as any).creditsLeft}
                    </span>
                  </span>
                </Link>
              )}

              {/* Plan badge */}
              {!isAnyDemoMode && <PlanBadge />}

              {isAnyDemoMode && (
                <button
                  onClick={handleExitDemo}
                  className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-medium hover:bg-amber-500/20 transition-colors whitespace-nowrap"
                >
                  Demo · <span className="underline">Exit</span>
                </button>
              )}

              {/* Avatar Dropdown */}
              <div ref={dropdownRef} className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  title="Profile Settings"
                  className="flex items-center gap-1.5 px-1.5 py-1.5 rounded-xl hover:bg-white/[0.08] border border-transparent hover:border-white/[0.12] transition-all duration-200"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
                    {initials}
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-white/40 transition-transform duration-200 hidden sm:block ${dropdownOpen ? "rotate-180" : ""}`} />
                </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-80 glass-panel rounded-2xl border border-white/10 shadow-2xl z-50 flex flex-col max-h-[calc(100vh-5rem)] overflow-y-auto overflow-x-hidden"
                  >
                    {/* User Info Header */}
                    <div className="p-4 border-b border-white/[0.07]">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-sm font-bold text-white shrink-0">
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white text-sm truncate">{displayName}</p>
                          <p className="text-xs text-white/40 truncate">{displayEmail}</p>
                        </div>
                        <PlanBadge size="xs" />
                      </div>
                    </div>

                    {/* Nav items inside dropdown */}
                    <div className="p-2 border-b border-white/[0.07]">
                      <p className="text-[10px] text-white/40 uppercase tracking-wider px-3 py-1.5 font-semibold">Navigate</p>
                      {navItems.map((item) => {
                        const isActive = (item as any).exact ? location === item.href : location.startsWith(item.href);
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setDropdownOpen(false)}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors group w-full ${
                              isActive ? "bg-primary/[0.12] text-primary" : "hover:bg-white/[0.09] text-white/80 hover:text-white"
                            }`}
                          >
                            <item.icon className={`w-4 h-4 ${isActive ? "text-primary" : "text-white/50 group-hover:text-white/80"}`} />
                            <span className="text-sm font-medium flex-1">{item.label}</span>
                            {false && (
                              <span className="hidden">
                                placeholder
                              </span>
                            )}
                          </Link>
                        );
                      })}
                      {isAdmin && (
                        <Link
                          href="/dashboard/admin"
                          onClick={() => setDropdownOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors group w-full mt-1 ${
                            location.startsWith("/dashboard/admin")
                              ? "bg-red-500/[0.15] text-red-400"
                              : "hover:bg-white/[0.09] text-white/80 hover:text-white"
                          }`}
                        >
                          <ShieldAlert className={`w-4 h-4 ${location.startsWith("/dashboard/admin") ? "text-red-400" : "text-white/50 group-hover:text-white/80"}`} />
                          <span className="text-sm font-medium flex-1">Admin Panel</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-bold uppercase tracking-wide">Admin</span>
                        </Link>
                      )}
                    </div>


                    {/* Upgrade CTA */}
                    {!isAnyDemoMode && plan === "free" && (
                      <div className="p-3 border-b border-white/[0.07]">
                        <Link
                          href="/dashboard/subscription"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gradient-to-r from-primary/20 to-purple-500/20 border border-primary/30 hover:border-primary/50 transition-all group"
                        >
                          <Crown className="w-4 h-4 text-amber-400" />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-white">Upgrade Plan</p>
                            <p className="text-[11px] text-white/40">Unlock Recruiter Outreach, Interview Prep & more</p>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/30 text-primary border border-primary/30 font-semibold">Pro</span>
                        </Link>
                      </div>
                    )}

                    {/* Exit Demo (demo sessions only) + Logout (real auth only) — sticky at bottom */}
                    <div className="sticky bottom-0 px-2 pt-1 pb-2 border-t border-white/[0.07] space-y-0.5" style={{ background: "hsl(240 32% 8% / 0.98)" }}>
                      {isDemoMode && (
                        <button
                          onClick={handleExitDemo}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-500/[0.12] active:bg-red-500/20 transition-colors w-full"
                        >
                          <LogOut className="w-4 h-4 text-red-400" />
                          <div className="flex-1 text-left">
                            <span className="text-sm font-semibold text-red-400 block">Exit Demo</span>
                            <span className="text-[10px] text-white/40">Return to home page</span>
                          </div>
                        </button>
                      )}
                      {token && !isDemoMode && (
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-500/[0.12] active:bg-red-500/20 transition-colors w-full"
                        >
                          <LogOut className="w-4 h-4 text-red-400" />
                          <div className="flex-1 text-left">
                            <span className="text-sm font-semibold text-red-400 block">Logout</span>
                            <span className="text-[10px] text-white/40">Clear session and return home</span>
                          </div>
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              </div>{/* /dropdownRef */}

              {/* Mobile Hamburger — only on very small screens */}
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="sm:hidden p-1.5 text-white/70 hover:text-white hover:bg-white/[0.09] rounded-lg transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>{/* /right section */}
          </div>{/* /max-width wrapper */}
        </header>

        {/* Mobile Drawer */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden"
                onClick={() => setIsMobileMenuOpen(false)}
              />
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                className="fixed right-0 top-0 h-full w-72 glass-panel z-50 flex flex-col"
              >
                <div className="flex items-center justify-between p-5 border-b border-white/[0.07]">
                  <Logo size="sm" />
                  <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 hover:bg-white/10 rounded-lg text-white/50 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
                  {navItems.map((item) => {
                    const isActive = (item as any).exact ? location === item.href : location.startsWith(item.href);
                    const isAlertItem = item.href === "/dashboard/job-alerts";
                    const showBadge = isAlertItem && unreadAlerts > 0 && !isActive;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 group ${
                          isActive
                            ? "bg-primary/[0.12] text-primary border border-primary/25"
                            : "text-white/75 hover:text-white hover:bg-white/[0.09] border border-transparent"
                        }`}
                      >
                        <span className="relative">
                          <item.icon className={`w-5 h-5 shrink-0 ${isActive ? "text-primary" : "text-white/50 group-hover:text-white/80"}`} />
                          {showBadge && (
                            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 flex items-center justify-center rounded-full bg-indigo-500 text-[9px] font-bold text-white leading-none">
                              {unreadAlerts > 9 ? "9+" : unreadAlerts}
                            </span>
                          )}
                        </span>
                        <span className="flex-1">{item.label}</span>
                        {showBadge && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/25 text-indigo-400 font-semibold">
                            {unreadAlerts} new
                          </span>
                        )}
                      </Link>
                    );
                  })}
                  {isAdmin && (
                    <Link
                      href="/dashboard/admin"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 group ${
                        location.startsWith("/dashboard/admin")
                          ? "bg-red-500/[0.12] text-red-400 border border-red-500/20"
                          : "text-white/75 hover:text-white hover:bg-white/[0.09] border border-transparent"
                      }`}
                    >
                      <ShieldAlert className={`w-5 h-5 shrink-0 ${location.startsWith("/dashboard/admin") ? "text-red-400" : "text-white/50 group-hover:text-white/80"}`} />
                      <span className="flex-1">Admin Panel</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-bold uppercase tracking-wide">Admin</span>
                    </Link>
                  )}
                </nav>
                <div className="px-3 pb-4 border-t border-white/[0.07] pt-3 space-y-2">
                  {isDemoMode && (
                    <button
                      onClick={handleExitDemo}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-red-400 hover:bg-red-500/10 active:bg-red-500/20 transition-colors text-sm border border-red-500/20 hover:border-red-500/30"
                    >
                      <LogOut className="w-4 h-4" />
                      Exit Demo
                    </button>
                  )}
                  {token && !isDemoMode && (
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-red-400 hover:bg-red-500/10 active:bg-red-500/20 transition-colors text-sm border border-red-500/20 hover:border-red-500/30"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Full-Width Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-8 max-w-7xl mx-auto">
            <motion.div
              key={location}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </div>
        </main>

        {/* Floating AI Chat — visible on all dashboard pages */}
        <FloatingChat />
      </div>
    </div>
  );
}
