import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CheckCircle2, X, Crown, Zap, ArrowRight, Building2, Rocket } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";

const jobSeekerPlans = [
  {
    name: "Free",
    price: { monthly: 0, annual: 0 },
    tagline: "Try before you commit",
    highlight: false,
    features: [
      { text: "Full Job Board Access", included: true },
      { text: "Application Tracker (10 jobs)", included: true },
      { text: "⚡ 20 AI Credits / month", included: true },
      { text: "Cover Letter (2 credits each)", included: true },
      { text: "Resume Review (3 credits each)", included: true },
      { text: "AI Chat (1 credit each)", included: true },
      { text: "Recruiter Outreach AI", included: false },
      { text: "Interview Prep AI", included: false },
    ],
  },
  {
    name: "Pro",
    price: { monthly: 199, annual: 149 },
    tagline: "Most popular for active seekers",
    highlight: true,
    badge: "Most Popular",
    features: [
      { text: "Full Job Board Access", included: true },
      { text: "Unlimited Application Tracking", included: true },
      { text: "⚡ 200 AI Credits / month", included: true },
      { text: "Unlimited Cover Letters", included: true },
      { text: "Unlimited Resume Optimization", included: true },
      { text: "Unlimited AI Chat", included: true },
      { text: "Recruiter Outreach AI", included: true },
      { text: "Interview Prep AI", included: true },
    ],
  },
  {
    name: "Premium",
    price: { monthly: 499, annual: 379 },
    tagline: "For professionals who mean business",
    highlight: false,
    badge: "Best Value",
    features: [
      { text: "Everything in Pro", included: true },
      { text: "⚡ Unlimited AI Credits", included: true },
      { text: "1-on-1 Career Coaching Session", included: true },
      { text: "Priority AI Response", included: true },
      { text: "24/7 Dedicated Support", included: true },
      { text: "Early Access to New Features", included: true },
      { text: "Recruiter Outreach AI", included: true },
      { text: "Unlimited Everything", included: true },
    ],
  },
];

const recruiterPlans = [
  {
    name: "Free",
    price: { monthly: 0, annual: 0 },
    tagline: "Get started hiring",
    highlight: false,
    features: [
      { text: "1 Active Job Posting", included: true },
      { text: "View All Applicants", included: true },
      { text: "Applicant Status Management", included: true },
      { text: "Basic Analytics", included: true },
      { text: "Boost Credits", included: false },
      { text: "Priority Support", included: false },
    ],
  },
  {
    name: "Starter",
    price: { monthly: 999, annual: 749 },
    tagline: "For growing teams",
    highlight: true,
    badge: "Most Popular",
    features: [
      { text: "Up to 5 Active Job Postings", included: true },
      { text: "View All Applicants", included: true },
      { text: "Applicant Status Management", included: true },
      { text: "Full Analytics Dashboard", included: true },
      { text: "3 Boost Credits / month", included: true },
      { text: "Priority Support", included: false },
    ],
  },
  {
    name: "Growth",
    price: { monthly: 2499, annual: 1899 },
    tagline: "For serious hiring at scale",
    highlight: false,
    badge: "Best Value",
    features: [
      { text: "Unlimited Job Postings", included: true },
      { text: "View All Applicants", included: true },
      { text: "Applicant Status Management", included: true },
      { text: "Full Analytics Dashboard", included: true },
      { text: "10 Boost Credits / month", included: true },
      { text: "Priority Support", included: true },
    ],
  },
];

const faqs = [
  {
    q: "Can I cancel anytime?",
    a: "Yes, you can cancel your subscription at any time. Your access continues until the end of the billing period.",
  },
  {
    q: "Is there a free trial for paid plans?",
    a: "The Free plan lets you explore core features without a credit card. You can upgrade whenever you're ready.",
  },
  {
    q: "How do AI credits work?",
    a: "All AI features run on a shared monthly credit pool. Free users get 20 credits/month, Pro gets 200, Premium gets unlimited. Each action costs: Cover Letter 2 credits, Resume Review 3 credits, Chat/Job Match/Career Suggestions 1 credit each. Your credits reset on the 1st of every month.",
  },
  {
    q: "Do unused AI uses roll over?",
    a: "Feature usage resets at the start of each billing cycle and does not roll over to the next month.",
  },
  {
    q: "What are Boost Credits?",
    a: "Boost Credits let recruiters give their job listings priority ranking and a featured badge to attract more candidates. Each boost costs 1 credit and stays active indefinitely.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit/debit cards and UPI. Enterprise billing available on request.",
  },
];

function PlanCard({
  plan,
  annual,
  cta,
  ctaHref,
}: {
  plan: typeof jobSeekerPlans[0];
  annual: boolean;
  cta?: string;
  ctaHref?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`glass-card p-8 flex flex-col relative ${
        plan.highlight
          ? "border-primary/40 shadow-[0_0_40px_rgba(99,102,241,0.15)] scale-105 z-10"
          : ""
      }`}
    >
      {plan.badge && (
        <div
          className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
            plan.highlight
              ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
              : "bg-gradient-to-r from-amber-500/80 to-orange-500/80 text-white"
          }`}
        >
          {plan.badge}
        </div>
      )}

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          {plan.name === "Premium" && <Crown className="w-4 h-4 text-amber-400" />}
          {plan.name === "Growth" && <Rocket className="w-4 h-4 text-amber-400" />}
          {plan.name === "Pro" && <Zap className="w-4 h-4 text-primary" />}
          {plan.name === "Starter" && <Zap className="w-4 h-4 text-primary" />}
          <h3 className="text-lg font-bold">{plan.name}</h3>
        </div>
        <p className="text-white/50 text-sm mb-4">{plan.tagline}</p>
        <div className="flex items-baseline gap-1">
          <span className="text-5xl font-display font-bold">
            ₹{annual ? plan.price.annual : plan.price.monthly}
          </span>
          <span className="text-white/40 text-sm">/month</span>
        </div>
        {annual && plan.price.monthly > 0 && (
          <p className="text-white/40 text-xs mt-1">
            Billed ₹{plan.price.annual * 12}/year (save ₹{(plan.price.monthly - plan.price.annual) * 12})
          </p>
        )}
      </div>

      <ul className="space-y-3 flex-1 mb-8">
        {plan.features.map((f, j) => (
          <li key={j} className="flex items-center gap-3">
            {f.included
              ? <CheckCircle2 className="w-4 h-4 shrink-0 text-primary" />
              : <X className="w-4 h-4 shrink-0 text-white/20" />
            }
            <span className={f.included ? "text-white/80 text-sm" : "text-white/30 text-sm line-through"}>
              {f.text}
            </span>
          </li>
        ))}
      </ul>

      <Link
        href={ctaHref ?? "/register"}
        className={`w-full py-3 rounded-xl font-semibold text-sm text-center transition-all duration-200 flex items-center justify-center gap-2 ${
          plan.highlight
            ? "btn-primary hover:shadow-[0_0_20px_rgba(99,102,241,0.4)]"
            : "btn-secondary hover:bg-white/10"
        }`}
      >
        {cta ?? "Get Started"} {plan.name !== "Free" && <ArrowRight className="w-4 h-4" />}
      </Link>
    </motion.div>
  );
}

export default function Pricing() {
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [tab, setTab] = useState<"seeker" | "recruiter">("seeker");

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-20 mix-blend-screen pointer-events-none">
        <div className="absolute top-0 right-1/3 w-[500px] h-[500px] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute bottom-1/3 left-1/4 w-[400px] h-[400px] rounded-full bg-purple-600/20 blur-[100px]" />
      </div>

      <Navbar />

      {/* Header */}
      <section className="relative z-10 pt-40 pb-16 px-6 max-w-7xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-md"
        >
          <Crown className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-medium text-white/80">Simple, transparent pricing</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-6xl font-display font-extrabold tracking-tight mb-6"
        >
          Invest in Your Future.<br />
          <span className="text-gradient">Grow Faster.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg text-white/60 max-w-xl mx-auto mb-10"
        >
          Start free. Upgrade when you're ready. Cancel anytime. No hidden fees.
        </motion.p>

        {/* Tab switcher: Job Seeker vs Recruiter */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="inline-flex items-center bg-white/5 border border-white/10 rounded-xl p-1 mb-8"
        >
          <button
            onClick={() => setTab("seeker")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
              tab === "seeker"
                ? "bg-primary text-white shadow"
                : "text-white/50 hover:text-white/80"
            }`}
          >
            <Zap className="w-4 h-4" />
            Job Seekers
          </button>
          <button
            onClick={() => setTab("recruiter")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
              tab === "recruiter"
                ? "bg-primary text-white shadow"
                : "text-white/50 hover:text-white/80"
            }`}
          >
            <Building2 className="w-4 h-4" />
            Recruiters
          </button>
        </motion.div>

        {/* Billing Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-center gap-4"
        >
          <span className={`text-sm font-medium ${!annual ? "text-white" : "text-white/40"}`}>Monthly</span>
          <button
            onClick={() => setAnnual(!annual)}
            className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${annual ? "bg-primary" : "bg-white/10"}`}
          >
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform duration-300 ${annual ? "translate-x-7" : "translate-x-1"}`} />
          </button>
          <span className={`text-sm font-medium ${annual ? "text-white" : "text-white/40"}`}>
            Annual
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">Save 25%</span>
          </span>
        </motion.div>
      </section>

      {/* Job Seeker Plans */}
      {tab === "seeker" && (
        <section className="relative z-10 pb-24 px-6 max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6 items-stretch">
            {jobSeekerPlans.map((plan, i) => (
              <PlanCard key={i} plan={plan} annual={annual} cta="Get Started" ctaHref="/register" />
            ))}
          </div>
        </section>
      )}

      {/* Recruiter Plans */}
      {tab === "recruiter" && (
        <section className="relative z-10 pb-24 px-6 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <p className="text-white/50 text-sm max-w-lg mx-auto">
              Post jobs, manage applicants, and boost visibility — all in a dedicated recruiter dashboard.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6 items-stretch">
            {recruiterPlans.map((plan, i) => (
              <PlanCard key={i} plan={plan} annual={annual} cta="Start Hiring" ctaHref="/register" />
            ))}
          </div>

          {/* Recruiter perks strip */}
          <div className="mt-10 grid sm:grid-cols-3 gap-4">
            {[
              { icon: Building2, title: "Dedicated Recruiter Dashboard", desc: "Separate workspace — post jobs, review applicants, track analytics" },
              { icon: Zap, title: "Boost Credits Included", desc: "Starter & Growth plans include monthly boost credits for priority listing" },
              { icon: Rocket, title: "Reach 10,000+ Freshers", desc: "Tap into a pool of BCA/MCA/BTech graduates actively seeking opportunities" },
            ].map(item => (
              <div key={item.title} className="glass-card p-5 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <item.icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white mb-0.5">{item.title}</p>
                  <p className="text-xs text-white/40">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="relative z-10 py-20 px-6 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-display font-bold mb-3">Frequently Asked</h2>
          <p className="text-white/50">Everything you need to know before signing up.</p>
        </motion.div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="glass-card overflow-hidden"
            >
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left"
              >
                <span className="font-medium text-white/90">{faq.q}</span>
                <span className={`text-white/40 transition-transform duration-300 ${openFaq === i ? "rotate-45" : ""}`}>+</span>
              </button>
              {openFaq === i && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-5 pb-5"
                >
                  <p className="text-white/60 text-sm leading-relaxed">{faq.a}</p>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
