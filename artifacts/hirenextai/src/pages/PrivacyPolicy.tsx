import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Shield } from "lucide-react";

const sections = [
  {
    title: "1. Information We Collect",
    content: [
      "Account information: When you create an account, we collect your name, email address, and password (stored as a secure hash).",
      "Profile data: Skills, education history, preferred job categories, target cities, and salary expectations you provide during onboarding.",
      "Usage data: How you interact with our platform — searches, AI generations, and applications tracked.",
      "Device & technical data: IP address, browser type, operating system, and access timestamps for security and debugging.",
    ],
  },
  {
    title: "2. How We Use Your Information",
    content: [
      "To personalize job recommendations and AI outputs specifically for your profile.",
      "To enforce usage quotas and subscription plan limits fairly.",
      "To improve our AI models and product features (using aggregated, anonymised data only).",
      "To send important account notifications such as usage alerts and subscription renewals.",
      "To maintain platform security and prevent fraud or abuse.",
    ],
  },
  {
    title: "3. Data Sharing",
    content: [
      "We do NOT sell your personal data to any third party — ever.",
      "We may share anonymised, aggregated data with partners for analytics purposes. This data cannot identify you.",
      "We use trusted third-party services (e.g. OpenAI for AI features, payment processors for billing). These providers are contractually bound to protect your data.",
      "We may disclose data if required by Indian law or a valid court order.",
    ],
  },
  {
    title: "4. Data Retention",
    content: [
      "Your account data is retained for as long as your account is active.",
      "Upon account deletion, all personal data is permanently removed within 30 days.",
      "Anonymised usage logs may be retained for up to 2 years for product improvement purposes.",
    ],
  },
  {
    title: "5. Your Rights",
    content: [
      "Access: You may request a copy of all personal data we hold about you.",
      "Correction: You may update or correct your data at any time through your profile settings.",
      "Deletion: You may permanently delete your account and all associated data.",
      "Portability: You may export your profile data in JSON format from your account settings.",
      "Opt-out: You may opt out of non-essential communications at any time.",
    ],
  },
  {
    title: "6. Security",
    content: [
      "All data is encrypted at rest using AES-256 and in transit using TLS 1.3.",
      "We conduct regular security audits and penetration testing.",
      "Passwords are hashed using bcrypt — we never store plaintext passwords.",
      "Access to production systems is restricted to authorised personnel only.",
    ],
  },
  {
    title: "7. Cookies",
    content: [
      "We use strictly necessary cookies to maintain your login session.",
      "With your consent, we use analytics cookies to understand how users navigate our platform.",
      "You can manage cookie preferences at any time using our cookie consent tool.",
      "See our Cookie Policy for full details.",
    ],
  },
  {
    title: "8. Contact",
    content: [
      "For privacy-related questions, contact us at: support@hirenextai.com",
      "HirenextAI, Bengaluru, Karnataka, India",
      "We will respond to all privacy requests within 7 business days.",
    ],
  },
];

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/20 blur-[120px]" />
      </div>

      <Navbar />

      <section className="relative z-10 pt-40 pb-12 px-6 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-14"
        >
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-6">
            <Shield className="w-7 h-7 text-indigo-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-extrabold mb-4">Privacy Policy</h1>
          <p className="text-white/50">Last updated: January 1, 2026</p>
          <p className="text-white/60 mt-4 max-w-2xl mx-auto text-sm leading-relaxed">
            At HirenextAI, your privacy is not a checkbox — it's a core commitment. This policy explains what data we collect, why we collect it, and how we protect it.
          </p>
        </motion.div>

        <div className="space-y-8">
          {sections.map((section, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="glass-card p-8"
            >
              <h2 className="text-lg font-bold text-white mb-4">{section.title}</h2>
              <ul className="space-y-3">
                {section.content.map((item, j) => (
                  <li key={j} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 shrink-0" />
                    <p className="text-white/60 text-sm leading-relaxed">{item}</p>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
