import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Link } from "wouter";
import { Search, ChevronRight, Zap, Briefcase, User, CreditCard, Shield, MessageCircle } from "lucide-react";
import { useState } from "react";

const categories = [
  {
    icon: Zap,
    title: "AI Tools",
    color: "text-indigo-400",
    bg: "bg-indigo-500/10 border-indigo-500/20",
    questions: [
      "How many AI generations do I get on the free plan?",
      "How do I generate a cover letter?",
      "Can I regenerate a cover letter?",
      "What is Resume Optimizer?",
      "How does Interview Prep AI work?",
    ],
  },
  {
    icon: Briefcase,
    title: "Job Search",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    questions: [
      "Where do job listings come from?",
      "How do I search for remote jobs in India?",
      "Why am I seeing jobs from other fields?",
      "How often are jobs updated?",
      "Can I filter jobs by city?",
    ],
  },
  {
    icon: User,
    title: "Account & Profile",
    color: "text-purple-400",
    bg: "bg-purple-500/10 border-purple-500/20",
    questions: [
      "How do I update my skills?",
      "Can I change my email address?",
      "How do I reset my password?",
      "What is profile completion percentage?",
      "How do I delete my account?",
    ],
  },
  {
    icon: CreditCard,
    title: "Billing & Plans",
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
    questions: [
      "What is included in the free plan?",
      "How do I upgrade to Pro?",
      "Can I get a refund?",
      "Will my plan auto-renew?",
      "What payment methods are accepted?",
    ],
  },
];

const faqs = [
  {
    q: "How many AI generations do I get on the free plan?",
    a: "Free plan users get 5 AI generations per month. This resets on the 1st of each month. Upgrade to Pro for 100 generations/month, or Premium for unlimited.",
  },
  {
    q: "Where do job listings come from?",
    a: "HirenextAI aggregates jobs from multiple trusted sources including JSearch, Adzuna, Remotive, and our own curated database. We focus heavily on India-specific job listings from companies hiring in Bangalore, Hyderabad, Pune, Mumbai, Delhi, Chennai, and remote roles.",
  },
  {
    q: "Is my data safe?",
    a: "Yes. We encrypt all personal data at rest and in transit. We never sell your data to third parties. You can export or delete your data at any time from your profile settings.",
  },
  {
    q: "How do I use the Demo mode?",
    a: "Click 'Try Demo' on the login page or 'View Live Demo' on the landing page. Demo mode gives you a preview of the dashboard with sample data. Some actions will prompt you to sign up.",
  },
  {
    q: "How do I cancel my subscription?",
    a: "Go to Dashboard → Subscription → click 'Cancel Plan'. Your plan remains active until the end of your billing period. No questions asked.",
  },
];

export default function HelpCenter() {
  const [search, setSearch] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const filteredFaqs = faqs.filter(f =>
    f.q.toLowerCase().includes(search.toLowerCase()) ||
    f.a.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full bg-primary/20 blur-[120px]" />
      </div>

      <Navbar />

      {/* Hero */}
      <section className="relative z-10 pt-40 pb-16 px-6 max-w-4xl mx-auto text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-display font-extrabold mb-4"
        >
          Help <span className="text-gradient">Center</span>
        </motion.h1>
        <p className="text-white/60 mb-10 text-lg">Find answers, guides, and support for HirenextAI.</p>

        {/* Search */}
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
          <input
            type="text"
            placeholder="Search for help (e.g. 'cover letter', 'billing', 'remote jobs')…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-white placeholder:text-white/30 focus:outline-none focus:border-primary/40 focus:bg-white/[0.07] transition-all text-sm"
          />
        </div>
      </section>

      {/* Categories */}
      {!search && (
        <section className="relative z-10 py-8 px-6 max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {categories.map((cat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="glass-card p-6"
              >
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-4 ${cat.bg}`}>
                  <cat.icon className={`w-5 h-5 ${cat.color}`} />
                </div>
                <h3 className="font-semibold text-white mb-3">{cat.title}</h3>
                <ul className="space-y-2">
                  {cat.questions.map((q, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-white/50 hover:text-white/80 cursor-pointer transition-colors">
                      <ChevronRight className="w-3.5 h-3.5 mt-0.5 shrink-0 text-white/30" />
                      {q}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* FAQs */}
      <section className="relative z-10 py-12 px-6 max-w-3xl mx-auto">
        <h2 className="text-2xl font-display font-bold mb-8 text-center">
          {search ? `Results for "${search}"` : "Frequently Asked Questions"}
        </h2>
        <div className="space-y-3">
          {filteredFaqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass-card overflow-hidden"
            >
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-4 text-left"
              >
                <span className="text-sm font-medium text-white/90">{faq.q}</span>
                <ChevronRight className={`w-4 h-4 text-white/40 transition-transform shrink-0 ml-4 ${openFaq === i ? "rotate-90" : ""}`} />
              </button>
              {openFaq === i && (
                <div className="px-6 pb-5 text-sm text-white/60 leading-relaxed border-t border-white/5 pt-4">
                  {faq.a}
                </div>
              )}
            </motion.div>
          ))}
          {filteredFaqs.length === 0 && (
            <div className="text-center py-12 text-white/40">
              No results found. Try a different search term.
            </div>
          )}
        </div>
      </section>

      {/* Contact CTA */}
      <section className="relative z-10 py-16 px-6 max-w-3xl mx-auto text-center">
        <div className="glass-card p-10">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-xl font-bold mb-2">Still need help?</h3>
          <p className="text-white/50 mb-6 text-sm">Our support team typically responds within 24 hours.</p>
          <Link href="/contact" className="btn-primary py-3 px-8 inline-flex items-center gap-2">
            Contact Support
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
