import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { useAuth } from "@/hooks/use-auth";
import { useDemoStore } from "@/store/demo";
import { useEffect, useLayoutEffect } from "react";

import Landing from "@/pages/Landing";
import Auth from "@/pages/Auth";
import Features from "@/pages/Features";
import Pricing from "@/pages/Pricing";
import Contact from "@/pages/Contact";
import About from "@/pages/About";
import HelpCenter from "@/pages/HelpCenter";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import Terms from "@/pages/Terms";
import Cookies from "@/pages/Cookies";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { RecruiterLayout } from "@/components/layout/RecruiterLayout";
import BoostJobs from "@/pages/dashboard/recruiter/BoostJobs";
import Jobs from "@/pages/dashboard/Jobs";
import Applications from "@/pages/dashboard/Applications";
import AITools from "@/pages/dashboard/AITools";
import Profile from "@/pages/dashboard/Profile";
import ResumePage from "@/pages/dashboard/Resume";
import ChatPage from "@/pages/dashboard/Chat";
import SubscriptionPage from "@/pages/dashboard/Subscription";
import RecruiterDashboard from "@/pages/dashboard/recruiter/RecruiterDashboard";
import PostJob from "@/pages/dashboard/recruiter/PostJob";
import RecruiterSetup from "@/pages/dashboard/recruiter/RecruiterSetup";
import RecruiterProfile from "@/pages/dashboard/recruiter/RecruiterProfile";
import RecruiterAnalytics from "@/pages/dashboard/recruiter/RecruiterAnalytics";
import EditJob from "@/pages/dashboard/recruiter/EditJob";
import RecruiterSubscription from "@/pages/dashboard/recruiter/RecruiterSubscription";
import JobAlerts from "@/pages/dashboard/JobAlerts";
import SavedJobs from "@/pages/dashboard/SavedJobs";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminUsers from "@/pages/admin/AdminUsers";
import RefundPolicy from "@/pages/RefundPolicy";
import { CookieConsent } from "@/components/CookieConsent";
import { DemoTimeoutModal } from "@/components/DemoTimeoutModal";

// Inject JWT token into all /api/ requests
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  let [resource, config] = args;
  const url = typeof resource === "string" ? resource : resource instanceof Request ? resource.url : "";
  if (url.startsWith("/api/")) {
    const token = localStorage.getItem("hirenext_token");
    if (token) {
      config = config ? { ...config } : {};
      const headers = new Headers(config.headers as HeadersInit | undefined);
      headers.set("Authorization", `Bearer ${token}`);
      config.headers = headers;
    }
  }
  return originalFetch(resource, config);
};

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } }
});

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading, token } = useAuth();
  const { isDemoMode, demoExpired } = useDemoStore();
  const [, setLocation] = useLocation();

  // Demo users (active or expired-but-modal-showing) bypass auth entirely.
  // When demoExpired, DemoTimeoutModal handles UX; user stays on current page
  // until they choose an exit action (Back to Home / Register / Sign In).
  const isDemo = isDemoMode || demoExpired;

  useEffect(() => {
    if (isDemo) return;
    if (!token) setLocation("/");
    else if (!isLoading && !isAuthenticated) setLocation("/");
  }, [isDemo, token, isLoading, isAuthenticated, setLocation]);

  if (isDemo) {
    return (
      <DashboardLayout>
        <Component />
      </DashboardLayout>
    );
  }

  if (!token) return null;
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!isAuthenticated) return null;

  return (
    <DashboardLayout>
      <Component />
    </DashboardLayout>
  );
}

function AdminRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading, token, user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!token) { setLocation("/"); return; }
    if (!isLoading && (!isAuthenticated || user?.role !== "admin")) setLocation("/dashboard/jobs");
  }, [token, isLoading, isAuthenticated, user, setLocation]);

  if (!token) return null;
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!isAuthenticated || user?.role !== "admin") return null;

  return (
    <AdminLayout>
      <Component />
    </AdminLayout>
  );
}

function RecruiterRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading, token, user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!token) { setLocation("/"); return; }
    if (!isLoading && (!isAuthenticated || user?.role !== "recruiter")) setLocation("/dashboard/jobs");
  }, [token, isLoading, isAuthenticated, user, setLocation]);

  if (!token) return null;
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!isAuthenticated || user?.role !== "recruiter") return null;

  return (
    <RecruiterLayout>
      <Component />
    </RecruiterLayout>
  );
}

function PublicRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, token, isLoading, user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (token && !isLoading && isAuthenticated) {
      const role = user?.role;
      setLocation(role === "admin" ? "/dashboard/admin" : role === "recruiter" ? "/dashboard/recruiter" : "/dashboard/jobs");
    }
  }, [token, isLoading, isAuthenticated, user, setLocation]);

  if (token && isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <Component />;
}

function JobsWithRecruiterRedirect() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  useEffect(() => {
    if (!isLoading && user?.role === "recruiter") setLocation("/dashboard/recruiter");
  }, [isLoading, user, setLocation]);
  if (user?.role === "recruiter") return null;
  return <ProtectedRoute component={Jobs} />;
}

function DashboardIndex() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  useEffect(() => {
    if (isLoading) return;
    const role = user?.role;
    setLocation(role === "admin" ? "/dashboard/admin" : role === "recruiter" ? "/dashboard/recruiter" : "/dashboard/jobs");
  }, [isLoading, user, setLocation]);
  return null;
}

function ScrollToTop() {
  const [pathname] = useLocation();
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);
  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/features" component={Features} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/contact" component={Contact} />
      <Route path="/about" component={About} />
      <Route path="/help-center" component={HelpCenter} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route path="/terms" component={Terms} />
      <Route path="/cookies" component={Cookies} />
      <Route path="/refund-policy" component={RefundPolicy} />
      <Route path="/login" component={() => <PublicRoute component={Auth} />} />
      <Route path="/register" component={() => <PublicRoute component={Auth} />} />
      <Route path="/dashboard" component={DashboardIndex} />
      <Route path="/dashboard/jobs" component={JobsWithRecruiterRedirect} />
      <Route path="/dashboard/applications" component={() => <ProtectedRoute component={Applications} />} />
      <Route path="/dashboard/ai-tools" component={() => <ProtectedRoute component={AITools} />} />
      <Route path="/dashboard/profile" component={() => <ProtectedRoute component={Profile} />} />
      <Route path="/dashboard/resume" component={() => <ProtectedRoute component={ResumePage} />} />
      <Route path="/dashboard/chat" component={() => <ProtectedRoute component={ChatPage} />} />
      <Route path="/dashboard/subscription" component={() => <ProtectedRoute component={SubscriptionPage} />} />
      <Route path="/dashboard/recruiter/setup" component={RecruiterSetup} />
      <Route path="/dashboard/recruiter/boost-jobs" component={() => <RecruiterRoute component={BoostJobs} />} />
      <Route path="/dashboard/recruiter/post-job" component={() => <RecruiterRoute component={PostJob} />} />
      <Route path="/dashboard/recruiter/edit-job/:jobId" component={() => <RecruiterRoute component={EditJob} />} />
      <Route path="/dashboard/recruiter/analytics" component={() => <RecruiterRoute component={RecruiterAnalytics} />} />
      <Route path="/dashboard/recruiter/profile" component={() => <RecruiterRoute component={RecruiterProfile} />} />
      <Route path="/dashboard/recruiter/subscription" component={() => <RecruiterRoute component={RecruiterSubscription} />} />
      <Route path="/dashboard/recruiter" component={() => <RecruiterRoute component={RecruiterDashboard} />} />
      <Route path="/dashboard/job-alerts" component={() => <ProtectedRoute component={JobAlerts} />} />
      <Route path="/dashboard/saved-jobs" component={() => <ProtectedRoute component={SavedJobs} />} />
      <Route path="/dashboard/admin/users" component={() => <AdminRoute component={AdminUsers} />} />
      <Route path="/dashboard/admin/tickets" component={() => <AdminRoute component={AdminDashboard} />} />
      <Route path="/dashboard/admin/credits" component={() => <AdminRoute component={AdminDashboard} />} />
      <Route path="/dashboard/admin" component={() => <AdminRoute component={AdminDashboard} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <ScrollToTop />
          <Router />
          <CookieConsent />
          <DemoTimeoutModal />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
