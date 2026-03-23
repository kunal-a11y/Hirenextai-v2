import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import {
  BrainCircuit, Target, Briefcase, MessageSquare, FileSearch,
  CheckCircle2, Zap, ArrowRight
} from "lucide-react";
import { Link } from "wouter";

const features = [
  {
    icon: BrainCircuit,
    title: "Smart Job Matching",
    subtitle: "AI-powered precision",
    desc: "Our advanced AI analyzes your skills, experience, and career goals to surface the jobs most likely to result in an offer — not just keyword matches. Rank higher on recruiter radars before you apply.",
    benefits: ["Skills-to-role fit scoring", "Salary range estimation", "Company culture alignment", "Remote/hybrid filter intelligence"],
    color: "from-indigo-500/20 to-purple-500/20",
    border: "border-indigo-500/20",
    iconColor: "text-indigo-400",
  },
  {
    icon: MessageSquare,
    title: "AI Cover Letter Generator",
    subtitle: "Personalized in seconds",
    desc: "Stop writing generic cover letters. Our AI reads the exact job description and your profile to craft compelling, personalized cover letters that feel human — because the best ones do.",
    benefits: ["Tone-matched writing", "Keyword-rich for ATS", "One-click regeneration", "Multiple style variants"],
    color: "from-purple-500/20 to-pink-500/20",
    border: "border-purple-500/20",
    iconColor: "text-purple-400",
  },
  {
    icon: Briefcase,
    title: "Application Tracker",
    subtitle: "Never lose track again",
    desc: "Manage every application in one intelligent dashboard. Track status from applied to offer, log interview notes, set follow-up reminders, and spot patterns in what's working.",
    benefits: ["Pipeline Kanban view", "Status timeline history", "Interview date reminders", "Offer comparison tools"],
    color: "from-blue-500/20 to-cyan-500/20",
    border: "border-blue-500/20",
    iconColor: "text-blue-400",
  },
  {
    icon: MessageSquare,
    title: "Interview Prep AI",
    subtitle: "Practice until you're perfect",
    desc: "Generate role-specific interview questions, practice with AI-driven mock sessions, and get instant feedback on your answers. Walk into every interview over-prepared.",
    benefits: ["Role-specific Q&A banks", "Behavioral question library", "Answer scoring & tips", "Company research briefings"],
    color: "from-emerald-500/20 to-teal-500/20",
    border: "border-emerald-500/20",
    iconColor: "text-emerald-400",
  },
  {
    icon: FileSearch,
    title: "Resume Optimizer",
    subtitle: "Beat the ATS, impress humans",
    desc: "Most resumes never reach a human reviewer. Our ATS optimizer rewrites your bullets, adds missing keywords, and scores your resume against any job description — so you get past the bots.",
    benefits: ["ATS keyword gap analysis", "Bullet point rewriter", "Formatting compliance check", "Score vs job description"],
    color: "from-amber-500/20 to-orange-500/20",
    border: "border-amber-500/20",
    iconColor: "text-amber-400",
  },
];

const stats = [
  { value: "3×", label: "More Interview Callbacks" },
  { value: "87%", label: "ATS Pass Rate" },
  { value: "2min", label: "Cover Letter Generation" },
  { value: "50K+", label: "Jobs Analyzed Daily" },
];

export default function Features() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-20 mix-blend-screen pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-purple-600/20 blur-[100px]" />
      </div>

      <Navbar />

      {/* Hero */}
      <section className="relative z-10 pt-40 pb-20 px-6 max-w-7xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-md"
        >
          <Zap className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-white/80">Built for serious job seekers</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-6xl font-display font-extrabold tracking-tight mb-6 leading-tight"
        >
          Every Tool You Need<br />
          <span className="text-gradient">to Land the Job</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg text-white/60 max-w-2xl mx-auto mb-12"
        >
          HirenextAI gives you an unfair advantage at every stage of your job search — from finding the right role to acing the interview.
        </motion.p>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto"
        >
          {stats.map((s, i) => (
            <div key={i} className="glass-card p-4 text-center">
              <p className="text-3xl font-display font-bold text-gradient mb-1">{s.value}</p>
              <p className="text-xs text-white/50">{s.label}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Feature Sections */}
      <section className="relative z-10 py-12 px-6 max-w-7xl mx-auto space-y-20">
        {features.map((feature, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className={`grid md:grid-cols-2 gap-12 items-center ${i % 2 === 1 ? "md:[&>*:first-child]:order-2" : ""}`}
          >
            {/* Text */}
            <div>
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r ${feature.color} border ${feature.border} mb-4`}>
                <feature.icon className={`w-4 h-4 ${feature.iconColor}`} />
                <span className={`text-xs font-semibold uppercase tracking-wider ${feature.iconColor}`}>{feature.subtitle}</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">{feature.title}</h2>
              <p className="text-white/60 text-lg leading-relaxed mb-8">{feature.desc}</p>
              <ul className="space-y-3">
                {feature.benefits.map((b, j) => (
                  <li key={j} className="flex items-center gap-3">
                    <CheckCircle2 className={`w-5 h-5 shrink-0 ${feature.iconColor}`} />
                    <span className="text-white/80">{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Visual Card */}
            <div className={`glass-card p-8 bg-gradient-to-br ${feature.color} border ${feature.border} relative overflow-hidden group hover:-translate-y-2 transition-transform duration-500`}>
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              <div className="relative z-10">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} border ${feature.border} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`w-8 h-8 ${feature.iconColor}`} />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-white/60 text-sm">{feature.desc.slice(0, 100)}…</p>

                <div className="mt-6 pt-6 border-t border-white/10">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="flex -space-x-2">
                      {[1,2,3].map(n => (
                        <div key={n} className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 border-2 border-background flex items-center justify-center text-xs font-bold">
                          {n}
                        </div>
                      ))}
                    </div>
                    <span className="text-white/50 text-xs">Used by thousands of job seekers</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </section>

      {/* CTA */}
      <section className="relative z-10 py-24 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center glass-card p-12 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-purple-500/10 pointer-events-none" />
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Ready to Accelerate Your Search?</h2>
            <p className="text-white/60 mb-8">Start for free — no credit card required. Upgrade anytime.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="btn-primary py-4 px-8 flex items-center justify-center gap-2">
                Get Started Free <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/pricing" className="btn-secondary py-4 px-8">
                View Pricing
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}
