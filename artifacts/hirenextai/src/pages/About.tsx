import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Link } from "wouter";
import { BrainCircuit, Target, Users, Sparkles, MapPin, ArrowRight } from "lucide-react";

const values = [
  {
    icon: BrainCircuit,
    title: "AI-First Approach",
    desc: "We believe artificial intelligence should amplify human potential, not replace it. Every feature we build starts with the question: how does this help a real job seeker?",
    color: "text-indigo-400",
    bg: "bg-indigo-500/10 border-indigo-500/20",
  },
  {
    icon: Target,
    title: "India-Focused",
    desc: "Built specifically for the Indian job market — from Tier-1 cities to Tier-3 towns. We understand the unique challenges of BCA/MCA freshers, lateral moves, and the Indian hiring ecosystem.",
    color: "text-purple-400",
    bg: "bg-purple-500/10 border-purple-500/20",
  },
  {
    icon: Users,
    title: "Community Driven",
    desc: "Our product roadmap is shaped by our users. Over 50,000 job seekers give us feedback daily and we listen — features are shipped weekly based on real user needs.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
];

const team = [
  { name: "Arjun Mehta", role: "Founder & CEO", city: "Bangalore" },
  { name: "Priya Sharma", role: "Head of AI/ML", city: "Hyderabad" },
  { name: "Rahul Verma", role: "Head of Product", city: "Pune" },
  { name: "Ananya Singh", role: "Lead Designer", city: "Mumbai" },
];

export default function About() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-purple-600/20 blur-[100px]" />
      </div>

      <Navbar />

      {/* Hero */}
      <section className="relative z-10 pt-40 pb-20 px-6 max-w-5xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8"
        >
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-white/80">Our Story</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-6xl font-display font-extrabold mb-6 leading-tight"
        >
          About <span className="text-gradient">HirenextAI</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg text-white/60 max-w-3xl mx-auto leading-relaxed"
        >
          HirenextAI was founded in 2024 by a team of engineers and product designers who were tired of watching brilliant people fail at job hunting — not because they lacked talent, but because they lacked tools.
          We set out to build an AI-powered career assistant that actually works for the Indian job market.
        </motion.p>
      </section>

      {/* Mission */}
      <section className="relative z-10 py-12 px-6 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card p-10 md:p-14 text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-500/5" />
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">Our Mission</h2>
            <p className="text-xl text-white/70 leading-relaxed max-w-3xl mx-auto">
              To democratize access to career intelligence — giving every job seeker in India the same unfair advantage that only top-tier recruiters and expensive career coaches used to provide.
            </p>
          </div>
        </motion.div>
      </section>

      {/* Values */}
      <section className="relative z-10 py-16 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">What We Stand For</h2>
          <p className="text-white/50 max-w-xl mx-auto">Our values guide every product decision we make.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {values.map((v, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-8"
            >
              <div className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-5 ${v.bg}`}>
                <v.icon className={`w-6 h-6 ${v.color}`} />
              </div>
              <h3 className="text-lg font-bold mb-3">{v.title}</h3>
              <p className="text-white/60 text-sm leading-relaxed">{v.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Team */}
      <section className="relative z-10 py-16 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-display font-bold mb-4">The Team</h2>
          <p className="text-white/50 max-w-xl mx-auto">A small but mighty team spread across India's major tech hubs.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {team.map((member, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="glass-card p-5 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center mx-auto mb-4 text-xl font-bold text-white">
                {member.name.split(" ").map(w => w[0]).join("")}
              </div>
              <p className="font-semibold text-white text-sm">{member.name}</p>
              <p className="text-xs text-white/50 mt-1">{member.role}</p>
              <div className="flex items-center justify-center gap-1 mt-2">
                <MapPin className="w-3 h-3 text-purple-400" />
                <span className="text-xs text-white/40">{member.city}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="relative z-10 py-12 px-6 max-w-4xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {[
            { value: "50K+", label: "Active Users" },
            { value: "2M+", label: "Jobs Analyzed" },
            { value: "4.9★", label: "User Rating" },
            { value: "2024", label: "Founded" },
          ].map((stat, i) => (
            <div key={i} className="glass-card p-6 text-center">
              <p className="text-3xl font-display font-bold text-gradient mb-1">{stat.value}</p>
              <p className="text-xs text-white/50">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 py-20 px-6 text-center">
        <h2 className="text-3xl font-display font-bold mb-4">Ready to Join the Community?</h2>
        <p className="text-white/60 mb-8">Start your AI-powered job search for free today.</p>
        <Link href="/register" className="btn-primary py-4 px-8 inline-flex items-center gap-2">
          Get Started Free <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      <Footer />
    </div>
  );
}
