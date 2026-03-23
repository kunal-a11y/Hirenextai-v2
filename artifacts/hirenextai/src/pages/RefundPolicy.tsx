import { useEffect } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { RotateCcw, Clock, Mail, ShieldCheck, AlertTriangle, CheckCircle2 } from "lucide-react";

const sections = [
  {
    icon: CheckCircle2,
    iconColor: "text-green-400",
    iconBg: "bg-green-500/10 border-green-500/20",
    title: "1. Eligibility for Refund",
    content: [
      "You may request a refund within 3 days (72 hours) of purchasing a premium subscription if you encounter verified technical issues that prevent you from using the platform.",
      "Accidental payments — where a subscription was purchased unintentionally — are eligible for a refund within the same 3-day window.",
      "Refund eligibility applies only to the most recent subscription charge and is available once per account.",
    ],
  },
  {
    icon: Mail,
    iconColor: "text-indigo-400",
    iconBg: "bg-indigo-500/10 border-indigo-500/20",
    title: "2. How to Request a Refund",
    content: [
      "All refund requests must be submitted by email to support@hirenextai.com with the subject line: \"Refund Request – [Your Registered Email]\".",
      "Your email must include: your registered email address, the date of payment, the transaction/order ID from your payment confirmation, and a brief description of the reason for your refund request.",
      "Requests submitted without the required payment details may be delayed or rejected. Please ensure all information is accurate and complete.",
    ],
  },
  {
    icon: Clock,
    iconColor: "text-purple-400",
    iconBg: "bg-purple-500/10 border-purple-500/20",
    title: "3. Processing Timeline",
    content: [
      "Once your refund request is received and verified, you will receive an acknowledgement email within 2 business days.",
      "Approved refunds will be processed and credited back to your original payment method within 7–10 business days from the date of approval.",
      "Actual credit timelines may vary depending on your bank or payment provider. HirenextAI is not responsible for additional delays caused by financial institutions.",
    ],
  },
  {
    icon: AlertTriangle,
    iconColor: "text-amber-400",
    iconBg: "bg-amber-500/10 border-amber-500/20",
    title: "4. Non-Refundable Circumstances",
    content: [
      "Refunds will not be issued after 3 days of purchase, regardless of the reason, unless a verified technical fault on our end is established.",
      "If you have successfully accessed and used premium features — such as AI-generated cover letters, resume reviews, or recruiter outreach — the subscription is considered consumed and is no longer eligible for a refund.",
      "Subscription renewals (monthly or annual auto-renewals) are non-refundable. It is your responsibility to cancel your subscription before the renewal date.",
      "Partial refunds for unused subscription days within a billing period are not offered.",
    ],
  },
  {
    icon: ShieldCheck,
    iconColor: "text-red-400",
    iconBg: "bg-red-500/10 border-red-500/20",
    title: "5. Fraudulent or Abusive Requests",
    content: [
      "HirenextAI reserves the right to reject any refund request that is found to be fraudulent, dishonest, or intended to abuse the refund policy.",
      "Accounts found to be misusing the refund process (e.g. subscribing, using premium features, and then claiming accidental payment) will have their refund requests rejected and may be permanently suspended.",
      "Any attempt to initiate a chargeback without first contacting our support team will result in immediate account termination and may be reported to the relevant payment processor.",
    ],
  },
  {
    icon: RotateCcw,
    iconColor: "text-blue-400",
    iconBg: "bg-blue-500/10 border-blue-500/20",
    title: "6. Policy Updates",
    content: [
      "HirenextAI reserves the right to modify this Refund Policy at any time. Changes will be effective immediately upon being posted on this page.",
      "Continued use of the platform after any modification to the Refund Policy constitutes acceptance of the updated terms.",
      "For any questions regarding this policy, please contact us at support@hirenextai.com.",
    ],
  },
];

export default function RefundPolicy() {
  useEffect(() => {
    document.title = "Refund Policy - Hirenextai";
  }, []);

  return (
    <div className="min-h-screen bg-background text-white">
      <Navbar />

      <main>
        {/* Hero */}
        <section className="relative pt-28 pb-16 px-6 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-600/10 rounded-full blur-[100px]" />
          </div>
          <div className="max-w-3xl mx-auto text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 text-sm font-medium mb-6">
                <RotateCcw className="w-3.5 h-3.5" />
                Last updated: March 2026
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-5 leading-tight">
                Refund Policy
              </h1>
              <p className="text-white/55 text-lg leading-relaxed max-w-xl mx-auto">
                We want you to feel confident subscribing to HirenextAI. Please read this policy carefully to understand when refunds are available and how to request one.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Quick Summary Card */}
        <section className="px-6 pb-10">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="max-w-3xl mx-auto"
          >
            <div className="rounded-2xl bg-gradient-to-br from-indigo-500/[0.08] to-purple-500/[0.08] border border-indigo-500/20 p-6 grid grid-cols-1 sm:grid-cols-3 gap-5">
              {[
                { label: "Refund Window", value: "3 Days", sub: "From purchase date" },
                { label: "Processing Time", value: "7–10 Days", sub: "After approval" },
                { label: "Contact", value: "Email Support", sub: "support@hirenextai.com" },
              ].map(item => (
                <div key={item.label} className="text-center">
                  <p className="text-xs text-white/40 uppercase tracking-wider font-semibold mb-1">{item.label}</p>
                  <p className="text-xl font-bold text-white">{item.value}</p>
                  <p className="text-xs text-white/40 mt-0.5">{item.sub}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Policy Sections */}
        <section className="px-6 pb-20">
          <div className="max-w-3xl mx-auto space-y-6">
            {sections.map((section, i) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.07, duration: 0.45 }}
                className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-6 md:p-7 hover:border-white/[0.14] transition-colors"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${section.iconBg}`}>
                    <section.icon className={`w-4 h-4 ${section.iconColor}`} />
                  </div>
                  <h2 className="text-base md:text-lg font-bold text-white">{section.title}</h2>
                </div>
                <ul className="space-y-3">
                  {section.content.map((text, j) => (
                    <li key={j} className="flex items-start gap-3 text-sm text-white/60 leading-relaxed">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-white/20 shrink-0" />
                      {text}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}

            {/* Contact CTA */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.45 }}
              className="rounded-2xl bg-gradient-to-br from-indigo-600/10 to-purple-600/10 border border-indigo-500/25 p-6 md:p-7 text-center"
            >
              <Mail className="w-8 h-8 text-indigo-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white mb-2">Need help with a refund?</h3>
              <p className="text-sm text-white/50 mb-4 max-w-sm mx-auto">
                Our support team typically responds within 2 business days. Include your payment details for faster processing.
              </p>
              <a
                href="mailto:support@hirenextai.com"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors"
              >
                <Mail className="w-4 h-4" />
                support@hirenextai.com
              </a>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
