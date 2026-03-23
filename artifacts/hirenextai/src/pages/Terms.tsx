import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { FileText } from "lucide-react";

const sections = [
  {
    title: "1. Acceptance of Terms",
    content: [
      "By accessing or using HirenextAI, you agree to be bound by these Terms and Conditions.",
      "If you do not agree to these terms, please do not use our services.",
      "These terms are governed by the laws of India and the jurisdiction of Bangalore, Karnataka.",
    ],
  },
  {
    title: "2. Use of Service",
    content: [
      "HirenextAI is an AI-powered job search and career assistance platform intended for individual job seekers.",
      "You must be at least 18 years old to create an account.",
      "You agree to provide accurate information when creating your account and profile.",
      "You may not use our platform for commercial scraping, bulk data extraction, or any automated misuse.",
      "Each account is for a single user. Sharing accounts is not permitted.",
    ],
  },
  {
    title: "3. AI-Generated Content",
    content: [
      "HirenextAI uses AI to generate cover letters, resume suggestions, and interview guides.",
      "AI-generated content is provided as a starting point. We do not guarantee outcomes from using AI-generated materials.",
      "You are responsible for reviewing and personalising all AI-generated content before submitting to employers.",
      "Do not submit AI-generated content verbatim without review — it may not accurately reflect your personal voice or experience.",
    ],
  },
  {
    title: "4. Subscription & Billing",
    content: [
      "Free plan users have access to limited AI generations per month (as specified in our pricing page).",
      "Paid subscriptions are billed monthly or annually in Indian Rupees (INR).",
      "Subscription fees are non-refundable except where required by Indian consumer protection law.",
      "We reserve the right to modify pricing with 30 days advance notice.",
      "You may cancel your subscription at any time; access continues until the end of the billing period.",
    ],
  },
  {
    title: "5. Intellectual Property",
    content: [
      "All platform code, design, AI models, and content are the intellectual property of HirenextAI.",
      "Content you create using our AI tools (cover letters, etc.) belongs to you.",
      "You grant us a limited license to process your profile data to provide the service.",
    ],
  },
  {
    title: "6. Prohibited Conduct",
    content: [
      "Attempting to hack, reverse-engineer, or circumvent our security measures.",
      "Uploading malicious code, viruses, or harmful content.",
      "Creating fake profiles or misrepresenting yourself to employers.",
      "Using our platform to harass, defame, or harm others.",
      "Violating any applicable Indian or international law.",
    ],
  },
  {
    title: "7. Disclaimers",
    content: [
      "HirenextAI does not guarantee job placement, interview callbacks, or employment outcomes.",
      "Job listings are aggregated from third-party sources. We are not responsible for the accuracy or availability of external job postings.",
      "Our AI tools are designed to assist, not replace, professional judgment.",
    ],
  },
  {
    title: "8. Termination",
    content: [
      "We reserve the right to suspend or terminate accounts that violate these terms.",
      "You may delete your account at any time from your profile settings.",
      "Upon termination, your right to access the platform ceases immediately.",
    ],
  },
  {
    title: "9. Changes to Terms",
    content: [
      "We may update these Terms periodically. Material changes will be notified via email.",
      "Continued use of the platform after changes constitutes acceptance of the updated terms.",
      "If you disagree with the updated terms, please delete your account.",
    ],
  },
];

export default function Terms() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full bg-purple-600/20 blur-[120px]" />
      </div>

      <Navbar />

      <section className="relative z-10 pt-40 pb-12 px-6 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-14"
        >
          <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto mb-6">
            <FileText className="w-7 h-7 text-purple-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-extrabold mb-4">Terms & Conditions</h1>
          <p className="text-white/50">Last updated: January 1, 2026</p>
          <p className="text-white/60 mt-4 max-w-2xl mx-auto text-sm leading-relaxed">
            Please read these Terms and Conditions carefully before using HirenextAI. By using our platform, you agree to be bound by these terms.
          </p>
        </motion.div>

        <div className="space-y-6">
          {sections.map((section, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
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
