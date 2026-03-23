import { useState, useEffect, useRef } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { motion } from "framer-motion";
import {
  Sparkles, Zap, BrainCircuit, Target, Briefcase, ArrowRight,
  Star, Shield, CheckCircle2, MessageSquare, FileSearch, Users,
  TrendingUp, Award, Lock, ChevronDown, Github, Linkedin,
  MapPin, IndianRupee,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useDemoStore } from "@/store/demo";

/* ── Typing effect hook ──────────────────────────────────────────────────── */
function useTypingText(phrases: string[], speed = 60, pause = 2000) {
  const [displayed, setDisplayed] = useState("");
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = phrases[phraseIdx];
    let timeout: ReturnType<typeof setTimeout>;

    if (!deleting && charIdx <= current.length) {
      timeout = setTimeout(() => {
        setDisplayed(current.slice(0, charIdx));
        setCharIdx(c => c + 1);
      }, speed);
    } else if (!deleting && charIdx > current.length) {
      timeout = setTimeout(() => setDeleting(true), pause);
    } else if (deleting && charIdx > 0) {
      timeout = setTimeout(() => {
        setCharIdx(c => c - 1);
        setDisplayed(current.slice(0, charIdx - 1));
      }, speed / 2);
    } else if (deleting && charIdx === 0) {
      setDeleting(false);
      setPhraseIdx(i => (i + 1) % phrases.length);
    }

    return () => clearTimeout(timeout);
  }, [charIdx, deleting, phraseIdx, phrases, speed, pause]);

  return displayed;
}

/* ── Section fade-up wrapper ─────────────────────────────────────────────── */
function FadeUp({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function Landing() {
  const { enableDemo } = useDemoStore();
  const [, setLocation] = useLocation();
  const [demoLoading, setDemoLoading] = useState(false);

  const typedText = useTypingText(
    ["Smarter with AI", "Faster with AI", "Smarter — Not Harder"],
    65,
    2200
  );

  const handleDemo = () => {
    setDemoLoading(true);
    enableDemo();
    setLocation("/dashboard/jobs");
  };

  const featureCards = [
    { icon: BrainCircuit, title: "Smart Cover Letters",     desc: "Personalized, keyword-rich cover letters generated in seconds from any job description.", color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20" },
    { icon: Target,       title: "ATS Resume Optimizer",   desc: "Analyze and rewrite your resume to beat applicant tracking systems every time.",          color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
    { icon: Briefcase,    title: "Intelligent Job Matching",desc: "Curated job recommendations matched to your skills, experience, and career goals.",        color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
    { icon: MessageSquare,title: "Interview Prep AI",      desc: "Practice with AI-generated role-specific questions and get instant feedback.",             color: "text-blue-400",    bg: "bg-blue-500/10 border-blue-500/20" },
    { icon: FileSearch,   title: "Skill Match Score",      desc: "See exactly how well your profile matches any job before you apply.",                      color: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/20" },
    { icon: TrendingUp,   title: "Application Tracker",   desc: "Track every application from applied to offer in one intelligent dashboard.",               color: "text-cyan-400",    bg: "bg-cyan-500/10 border-cyan-500/20" },
  ];

  const testimonials = [
    { name: "Riya Sharma", role: "BCA Graduate · Hired at TCS",    city: "Bangalore", rating: 5, quote: "I was applying for 2 months with zero responses. HirenextAI's cover letter tool changed everything — I got 4 interview calls in 2 weeks.", initials: "RS", color: "from-indigo-600 to-purple-700" },
    { name: "Aman Verma",  role: "MCA Fresher · Hired at Wipro",   city: "Hyderabad", rating: 5, quote: "The job matching is insanely accurate. It knew I wanted Cyber Security roles before I even set filters. The AI tools saved me hours every day.",   initials: "AV", color: "from-purple-600 to-pink-700"  },
    { name: "Priya Nair",  role: "Python Dev · Hired at Infosys",  city: "Pune",      rating: 5, quote: "Best ₹199 I ever spent. The resume optimizer helped me rewrite my entire experience section and I started getting callbacks immediately.",         initials: "PN", color: "from-emerald-600 to-teal-700" },
  ];

  const trustBadges = [
    { icon: Shield, label: "100% Secure",  desc: "AES-256 encrypted" },
    { icon: Lock,   label: "Privacy First",desc: "We never sell data" },
    { icon: Users,  label: "50,000+ Users",desc: "Across India" },
    { icon: Award,  label: "4.9/5 Rating", desc: "1,200+ reviews" },
  ];

  const howItWorks = [
    { step: "01", title: "Set Up Your Profile",   desc: "Tell us your degree, skills, target cities and salary expectations. Takes 2 minutes." },
    { step: "02", title: "Get Matched Jobs",       desc: "Our AI immediately surfaces the most relevant openings from thousands of live listings across India." },
    { step: "03", title: "Apply Smarter",          desc: "Generate a personalized cover letter, optimize your resume for ATS, and track every application in one place." },
    { step: "04", title: "Land the Interview",    desc: "Use AI Interview Prep to practice role-specific questions and walk in over-prepared." },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">

      {/* ── Animated Background Glow Blobs ─────────────────────────────────── */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="blob-1 absolute top-[-80px] left-[15%]  w-[720px] h-[720px] rounded-full bg-indigo-600/12 blur-[160px]" />
        <div className="blob-2 absolute top-[30%]  right-[-60px] w-[520px] h-[520px] rounded-full bg-purple-600/10 blur-[130px]" />
        <div className="blob-3 absolute bottom-[5%] left-[-40px]  w-[600px] h-[600px] rounded-full bg-violet-700/8  blur-[140px]" />
        {/* Extra accent blob near hero */}
        <div className="blob-1 absolute top-[60%] left-[50%]    w-[400px] h-[400px] rounded-full bg-blue-600/6   blur-[120px]" style={{ animationDelay: "6s" }} />
        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.5) 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="relative z-10 pt-40 pb-20 px-6 max-w-7xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-md"
        >
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-white/80">India's #1 AI Job Search Platform</span>
        </motion.div>

        {/* Headline with typing effect */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-7xl font-display font-extrabold tracking-tight mb-8 leading-tight"
        >
          Find Your Next Job <br />
          <span className="text-gradient">
            {typedText}
            <span className="cursor-blink text-indigo-400 ml-0.5">|</span>
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-10"
        >
          Generate perfect cover letters, optimize your resume for ATS, and get AI-matched with jobs in Bangalore, Hyderabad, Pune, and across India. Built for BCA, MCA, BTech freshers and experienced professionals.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link href="/register" className="btn-primary py-4 px-8 text-lg w-full sm:w-auto hover:shadow-[0_0_40px_rgba(99,102,241,0.5)] hover:scale-[1.03] transition-all duration-300">
            Start for Free
          </Link>
          <button
            onClick={handleDemo}
            disabled={demoLoading}
            className="btn-secondary py-4 px-8 text-lg w-full sm:w-auto flex items-center justify-center gap-2 disabled:opacity-60 hover:bg-white/10 hover:shadow-[0_0_20px_rgba(255,255,255,0.06)] transition-all duration-300"
          >
            {demoLoading ? <><Zap className="w-5 h-5 animate-pulse" /> Loading Demo...</> : <><Zap className="w-5 h-5" /> View Live Demo</>}
          </button>
        </motion.div>

        {/* Social Proof */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-white/40"
        >
          <div className="flex items-center gap-1.5">
            {[1,2,3,4,5].map(n => <Star key={n} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
            <span className="ml-1">4.9/5 from 1,200+ reviews</span>
          </div>
          <div className="hidden sm:block w-px h-4 bg-white/10" />
          <span>50,000+ job seekers across India</span>
          <div className="hidden sm:block w-px h-4 bg-white/10" />
          <span>No credit card required</span>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-16 flex flex-col items-center gap-2"
        >
          <span className="text-xs text-white/20 tracking-widest uppercase">Scroll</span>
          <ChevronDown className="scroll-bounce w-5 h-5 text-white/25" />
        </motion.div>
      </section>

      {/* ── Trust Badges ─────────────────────────────────────────────────────── */}
      <section className="relative z-10 py-8 px-6 max-w-4xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {trustBadges.map((badge, i) => (
            <FadeUp key={i} delay={i * 0.08}>
              <div className="glass-card hover-glow p-4 flex flex-col items-center text-center gap-2 h-full">
                <badge.icon className="w-5 h-5 text-purple-400" />
                <p className="text-sm font-semibold text-white">{badge.label}</p>
                <p className="text-xs text-white/40">{badge.desc}</p>
              </div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ── Live Job Cards Preview ────────────────────────────────────────────── */}
      <section className="relative z-10 py-16 px-6 max-w-5xl mx-auto">
        <FadeUp className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-3">Live Jobs Across India</h2>
          <p className="text-white/50 max-w-xl mx-auto">Aggregated from top job boards — updated in real time.</p>
        </FadeUp>

        <div className="grid md:grid-cols-3 gap-4">
          {[
            { title: "Cyber Security Analyst", company: "HCL Technologies", location: "Bangalore", salary: "₹6–10 LPA", badge: "Remote OK", color: "border-red-500/20 bg-red-500/5", delay: 0 },
            { title: "Python Developer",        company: "Infosys",          location: "Pune",      salary: "₹5–8 LPA",  badge: "Fresher OK", color: "border-indigo-500/20 bg-indigo-500/5", delay: 0.1 },
            { title: "AI/ML Engineer",          company: "TCS",              location: "Hyderabad", salary: "₹8–14 LPA", badge: "Hot 🔥",     color: "border-amber-500/20 bg-amber-500/5", delay: 0.2 },
          ].map((job, i) => (
            <FadeUp key={i} delay={job.delay}>
              <div className={`glass-card hover-glow p-5 border h-full cursor-default ${job.color}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-lg font-bold text-white/60">
                    {job.company[0]}
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/50">{job.badge}</span>
                </div>
                <h4 className="font-bold text-white text-sm mb-1">{job.title}</h4>
                <p className="text-xs text-white/50 flex items-center gap-1 mb-3">
                  <MapPin className="w-3 h-3 shrink-0" />{job.company} · {job.location}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-400 flex items-center gap-0.5">
                    {job.salary}
                  </span>
                  <span className="text-xs text-white/30">Apply with AI →</span>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>

        <FadeUp delay={0.3} className="text-center mt-6">
          <Link href="/register" className="inline-flex items-center gap-2 text-primary hover:text-white border border-primary/30 hover:border-primary/60 hover:bg-primary/10 px-6 py-3 rounded-xl font-medium text-sm transition-all duration-200">
            Browse All Jobs <ArrowRight className="w-4 h-4" />
          </Link>
        </FadeUp>
      </section>

      {/* ── Feature Cards ─────────────────────────────────────────────────────── */}
      <section className="relative z-10 py-16 px-6 max-w-7xl mx-auto">
        <FadeUp className="text-center mb-14">
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">Your AI Career Advantage</h2>
          <p className="text-white/60 max-w-xl mx-auto">Everything you need to stand out in today's competitive market.</p>
        </FadeUp>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
          {featureCards.map((feature, i) => (
            <FadeUp key={i} delay={i * 0.07}>
              <div className="glass-card hover-glow p-7 group h-full">
                <div className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 ${feature.bg}`}>
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h3 className="text-lg font-bold mb-3">{feature.title}</h3>
                <p className="text-white/60 leading-relaxed text-sm">{feature.desc}</p>
              </div>
            </FadeUp>
          ))}
        </div>

        <FadeUp delay={0.4} className="mt-10 text-center">
          <Link href="/features" className="inline-flex items-center gap-2 text-primary hover:text-white border border-primary/30 hover:border-primary/60 hover:bg-primary/10 px-6 py-3 rounded-xl font-medium text-sm transition-all duration-200">
            Explore All Features <ArrowRight className="w-4 h-4" />
          </Link>
        </FadeUp>
      </section>

      {/* ── How It Works ─────────────────────────────────────────────────────── */}
      <section className="relative z-10 py-16 px-6 max-w-5xl mx-auto">
        <FadeUp className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">How It Works</h2>
          <p className="text-white/60 max-w-xl mx-auto">From zero to interview-ready in minutes.</p>
        </FadeUp>

        <div className="grid md:grid-cols-4 gap-6">
          {howItWorks.map((step, i) => (
            <FadeUp key={i} delay={i * 0.1}>
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4 hover-glow cursor-default">
                  <span className="text-xl font-display font-extrabold text-primary">{step.step}</span>
                </div>
                <h4 className="font-bold text-white mb-2 text-sm">{step.title}</h4>
                <p className="text-white/50 text-sm leading-relaxed">{step.desc}</p>
              </div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ── Founder Section ───────────────────────────────────────────────────── */}
      <section className="relative z-10 py-20 px-6 max-w-5xl mx-auto">
        <FadeUp className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-4">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-xs font-medium text-white/60 uppercase tracking-wider">The Person Behind It</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-display font-bold">Meet The Founder</h2>
        </FadeUp>

        <FadeUp delay={0.15}>
          <div className="glass-card hover-glow relative overflow-hidden p-8 md:p-12">
            {/* Decorative glow in card */}
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-purple-600/8 blur-[80px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-indigo-600/6 blur-[60px] pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
              {/* Avatar */}
              <div className="shrink-0 flex flex-col items-center gap-4">
                <div className="float-avatar relative">
                  {/* Gradient ring */}
                  <div className="absolute inset-[-3px] rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 blur-[2px]" />
                  <div className="absolute inset-[-3px] rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 opacity-60" />
                  {/* Avatar circle */}
                  <div className="relative w-36 h-36 rounded-full overflow-hidden border-2 border-white/10">
                    <img
                      src="/founder.jpg"
                      alt="Kunal Purohit"
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                  {/* Online indicator */}
                  <div className="absolute bottom-2 right-2 w-4 h-4 bg-green-400 rounded-full border-2 border-background shadow-[0_0_8px_rgba(74,222,128,0.6)]" />
                </div>

                {/* Social links */}
                <div className="flex items-center gap-3">
                  <a
                    href="https://www.linkedin.com/in/kunal-purohit-74a0933b6/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-lg bg-[#0A66C2]/15 border border-[#0A66C2]/30 flex items-center justify-center hover:bg-[#0A66C2]/25 hover:border-[#0A66C2]/50 transition-all duration-200 hover:scale-105"
                    title="LinkedIn"
                  >
                    <Linkedin className="w-4 h-4 text-[#0A66C2]" />
                  </a>
                  <a
                    href="https://github.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-lg bg-white/5 border border-white/15 flex items-center justify-center hover:bg-white/10 hover:border-white/25 transition-all duration-200 hover:scale-105"
                    title="GitHub"
                  >
                    <Github className="w-4 h-4 text-white/70" />
                  </a>
                </div>
              </div>

              {/* Content */}
              <div className="text-center md:text-left flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-4">
                  <Sparkles className="w-3 h-3" /> Founder & Developer
                </div>
                <h3 className="text-3xl md:text-4xl font-display font-extrabold text-white mb-1">Kunal Purohit</h3>
                <p className="text-white/50 text-sm mb-6">Founder & Developer of HirenextAI</p>

                <p className="text-white/70 leading-relaxed text-base max-w-xl">
                  HirenextAI was built with the vision to make job searching <span className="text-white font-medium">smarter and faster</span> for students and freshers. By combining real job data with AI-powered career tools, the platform aims to simplify career growth and reduce job search stress.
                </p>

                <div className="mt-8 flex flex-wrap gap-3 justify-center md:justify-start">
                  {[
                    { label: "50,000+", sub: "Users Helped" },
                    { label: "4.9★",   sub: "App Rating"   },
                    { label: "2024",   sub: "Founded"       },
                  ].map((stat, i) => (
                    <div key={i} className="glass-card px-5 py-3 text-center min-w-[90px]">
                      <p className="text-lg font-display font-extrabold text-white">{stat.label}</p>
                      <p className="text-[10px] text-white/40 mt-0.5">{stat.sub}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </FadeUp>
      </section>

      {/* ── Testimonials ──────────────────────────────────────────────────────── */}
      <section className="relative z-10 py-16 px-6 max-w-6xl mx-auto">
        <FadeUp className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Loved by Job Seekers Across India</h2>
          <p className="text-white/60 max-w-xl mx-auto">Real stories from real people who landed their dream jobs.</p>
        </FadeUp>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <FadeUp key={i} delay={i * 0.1}>
              <div className="glass-card hover-glow p-7 flex flex-col gap-4 h-full">
                <div className="flex items-center gap-1">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-white/80 text-sm leading-relaxed flex-1">"{t.quote}"</p>
                <div className="flex items-center gap-3 pt-2 border-t border-white/5">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-xs font-bold text-white shrink-0`}>
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{t.name}</p>
                    <p className="text-xs text-white/40">{t.role}</p>
                  </div>
                  <div className="ml-auto">
                    <span className="text-xs text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Verified
                    </span>
                  </div>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ── Pricing Teaser ────────────────────────────────────────────────────── */}
      <section className="relative z-10 py-16 px-6 max-w-5xl mx-auto text-center">
        <FadeUp>
          <div className="glass-card hover-glow p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/8 to-purple-500/8 pointer-events-none" />
            {/* Glow accent */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-1 bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Simple, Transparent Pricing</h2>
              <p className="text-white/60 mb-8 max-w-lg mx-auto">
                Start for free. Upgrade when you're ready. Plans from ₹199/month — less than a single coaching session.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/pricing" className="btn-primary py-3 px-8 flex items-center justify-center gap-2 hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] hover:scale-[1.03] transition-all">
                  View Plans <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/register" className="btn-secondary py-3 px-8 hover:shadow-[0_0_20px_rgba(255,255,255,0.06)] transition-all">
                  Start Free
                </Link>
              </div>
            </div>
          </div>
        </FadeUp>
      </section>

      <Footer />
    </div>
  );
}
