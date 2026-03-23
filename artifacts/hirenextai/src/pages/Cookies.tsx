import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Cookie } from "lucide-react";

const cookieTypes = [
  {
    name: "Strictly Necessary Cookies",
    required: true,
    desc: "These cookies are essential for the platform to function. They maintain your login session and security tokens. You cannot opt out of these.",
    examples: ["Session authentication token", "CSRF protection", "Load balancer preference"],
    color: "border-indigo-500/30 bg-indigo-500/5",
    badge: "Always Active",
    badgeColor: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  },
  {
    name: "Analytics Cookies",
    required: false,
    desc: "These help us understand how users interact with our platform so we can improve it. We use anonymised, aggregated data only.",
    examples: ["Page view counts", "Feature usage patterns", "Search term frequency"],
    color: "border-amber-500/30 bg-amber-500/5",
    badge: "Optional",
    badgeColor: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  },
  {
    name: "Preference Cookies",
    required: false,
    desc: "These remember your in-app preferences to give you a more personalised experience.",
    examples: ["Dark/light mode preference", "Dashboard layout preference", "Search filter defaults"],
    color: "border-purple-500/30 bg-purple-500/5",
    badge: "Optional",
    badgeColor: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  },
];

export default function Cookies() {
  const handleManageCookies = () => {
    localStorage.removeItem("cookie_consent");
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-[400px] h-[400px] rounded-full bg-primary/20 blur-[100px]" />
      </div>

      <Navbar />

      <section className="relative z-10 pt-40 pb-12 px-6 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-14"
        >
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-6">
            <Cookie className="w-7 h-7 text-amber-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-extrabold mb-4">Cookie Policy</h1>
          <p className="text-white/50">Last updated: January 1, 2026</p>
          <p className="text-white/60 mt-4 max-w-2xl mx-auto text-sm leading-relaxed">
            HirenextAI uses cookies to provide a secure, functional, and personalised experience. This page explains what cookies we use and why.
          </p>
        </motion.div>

        {/* What are cookies */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card p-8 mb-8"
        >
          <h2 className="text-xl font-bold text-white mb-4">What Are Cookies?</h2>
          <p className="text-white/60 text-sm leading-relaxed">
            Cookies are small text files stored on your device when you visit a website. They allow the website to remember information about your visit — like your login state or preferences. Cookies are widely used to make websites work efficiently and to provide analytics information to site owners.
          </p>
        </motion.div>

        {/* Cookie Types */}
        <div className="space-y-5 mb-10">
          {cookieTypes.map((type, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className={`glass-card p-8 border ${type.color}`}
            >
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <h3 className="text-lg font-bold text-white">{type.name}</h3>
                <span className={`text-xs px-3 py-1 rounded-full border font-semibold ${type.badgeColor}`}>
                  {type.badge}
                </span>
              </div>
              <p className="text-white/60 text-sm leading-relaxed mb-4">{type.desc}</p>
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider mb-2 font-semibold">Examples</p>
                <ul className="space-y-1">
                  {type.examples.map((ex, j) => (
                    <li key={j} className="flex items-center gap-2 text-xs text-white/50">
                      <div className="w-1 h-1 rounded-full bg-white/30 shrink-0" />
                      {ex}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Manage Preferences */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card p-8 text-center"
        >
          <h2 className="text-xl font-bold text-white mb-3">Manage Your Preferences</h2>
          <p className="text-white/60 text-sm mb-6">
            You can reset your cookie consent at any time. The cookie banner will reappear on your next visit.
          </p>
          <button
            onClick={handleManageCookies}
            className="btn-primary py-3 px-8 inline-flex items-center gap-2"
          >
            Reset Cookie Preferences
          </button>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}
