import { useState } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useToast } from "@/hooks/use-toast";
import {
  Mail, Phone, MapPin, MessageSquare, Clock, ChevronDown, Send, Loader2, CheckCircle2
} from "lucide-react";

const API = import.meta.env.VITE_API_URL ?? "/api";

const faqs = [
  {
    q: "How do I reset my password?",
    a: "Go to the login page and click 'Forgot password'. We'll email you a reset link within a few minutes.",
  },
  {
    q: "Can I downgrade from Pro to Free?",
    a: "Yes. You can cancel your subscription anytime from the Subscription page inside your dashboard. Your Pro access continues until the billing period ends.",
  },
  {
    q: "How do AI generations work?",
    a: "Each time you generate a cover letter, optimize a resume section, or create an interview prep set, it counts as one generation. Your limit resets at the start of each billing month.",
  },
  {
    q: "Is my resume data safe?",
    a: "Yes. All your data is encrypted at rest and in transit. We never share your personal information with employers or third parties without your explicit consent.",
  },
  {
    q: "How quickly do you respond to support requests?",
    a: "We aim to reply to all support emails within 24 hours on business days. Pro and Premium subscribers receive priority responses.",
  },
  {
    q: "Do you offer refunds?",
    a: "We offer a 7-day refund policy for new subscribers if you're not satisfied. Contact us within 7 days of your first payment to request one.",
  },
];

const contactDetails = [
  {
    icon: Mail,
    label: "Support Email",
    value: "support@hirenextai.com",
    href: "mailto:support@hirenextai.com",
    desc: "We reply within 24 business hours",
  },
  {
    icon: Phone,
    label: "Contact Phone",
    value: "+91 99999 99999",
    href: "tel:+919999999999",
    desc: "Mon–Sat, 9 AM – 6 PM IST",
  },
  {
    icon: MapPin,
    label: "Office Address",
    value: "Koramangala, Bengaluru, Karnataka 560034, India",
    href: null,
    desc: "Not open for walk-ins",
  },
  {
    icon: Clock,
    label: "Support Hours",
    value: "Mon – Sat, 9:00 AM – 6:00 PM IST",
    href: null,
    desc: "Closed on national holidays",
  },
];

const MAX_MSG = 1000;

export default function Contact() {
  const { toast } = useToast();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const token = localStorage.getItem("hirenext_token");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API}/support/ticket`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          subject: form.subject,
          message: form.message.slice(0, MAX_MSG),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message ?? "Failed to submit ticket");
      }

      setSent(true);
      toast({
        title: "Support ticket submitted",
        description: "Our team will contact you soon. Average response time: 24 hours.",
      });
    } catch (err: any) {
      toast({
        title: "Submission failed",
        description: err.message ?? "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-20 mix-blend-screen pointer-events-none">
        <div className="absolute top-0 left-1/3 w-[500px] h-[500px] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-purple-600/20 blur-[100px]" />
      </div>

      <Navbar />

      {/* Header */}
      <section className="relative z-10 pt-40 pb-16 px-6 max-w-7xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-md"
        >
          <MessageSquare className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-white/80">We're here to help</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-6xl font-display font-extrabold tracking-tight mb-6"
        >
          Get in <span className="text-gradient">Touch</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg text-white/60 max-w-xl mx-auto"
        >
          Have a question, feedback, or need help? Our support team is ready to assist you.
        </motion.p>
      </section>

      {/* Contact Details */}
      <section className="relative z-10 pb-20 px-6 max-w-5xl mx-auto">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-20">
          {contactDetails.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="glass-card p-6 group"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <item.icon className="w-5 h-5 text-primary" />
              </div>
              <p className="text-xs text-white/40 uppercase tracking-wider mb-1">{item.label}</p>
              {item.href ? (
                <a href={item.href} className="text-sm font-semibold text-white hover:text-purple-400 transition-colors block mb-1">
                  {item.value}
                </a>
              ) : (
                <p className="text-sm font-semibold text-white mb-1">{item.value}</p>
              )}
              <p className="text-xs text-white/40">{item.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Two column: form + FAQ */}
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl font-display font-bold mb-2">Send Us a Message</h2>
            <p className="text-white/50 text-sm mb-6">Fill out the form and we'll get back to you within one business day.</p>

            {sent ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="glass-card p-10 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 18 }}
                  className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-5"
                >
                  <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                </motion.div>
                <h3 className="text-xl font-bold text-white mb-2">Ticket Submitted!</h3>
                <p className="text-white/60 text-sm mb-1">
                  We'll reply to <strong className="text-white">{form.email}</strong> soon.
                </p>
                <p className="text-xs text-white/30 mb-6">Average response time: 24 hours</p>
                <button
                  onClick={() => { setSent(false); setForm({ name: "", email: "", subject: "", message: "" }); }}
                  className="text-sm text-primary hover:text-white transition-colors underline underline-offset-4"
                >
                  Submit another ticket
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-white/50 mb-1.5 uppercase tracking-wider">Your Name</label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="John Doe"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-white/50 mb-1.5 uppercase tracking-wider">Email Address</label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="you@email.com"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-white/50 mb-1.5 uppercase tracking-wider">Subject</label>
                  <select
                    value={form.subject}
                    onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors appearance-none"
                    required
                  >
                    <option value="" className="bg-gray-900">Select a topic…</option>
                    <option value="billing" className="bg-gray-900">Billing & Subscription</option>
                    <option value="technical" className="bg-gray-900">Technical Issue</option>
                    <option value="feature" className="bg-gray-900">Feature Request</option>
                    <option value="account" className="bg-gray-900">Account Help</option>
                    <option value="other" className="bg-gray-900">Other</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs text-white/50 uppercase tracking-wider">Message</label>
                    <span className={`text-xs tabular-nums ${form.message.length >= MAX_MSG ? "text-red-400" : "text-white/30"}`}>
                      {form.message.length}/{MAX_MSG}
                    </span>
                  </div>
                  <textarea
                    required
                    rows={5}
                    maxLength={MAX_MSG}
                    value={form.message}
                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    placeholder="Describe your issue or question in detail…"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <button
                    type="submit"
                    disabled={sending}
                    className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {sending ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
                    ) : (
                      <><Send className="w-4 h-4" /> Send Message</>
                    )}
                  </button>
                  <p className="text-center text-xs text-white/30">
                    Average response time: 24 hours
                  </p>
                </div>
              </form>
            )}
          </motion.div>

          {/* FAQ */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl font-display font-bold mb-2">Frequently Asked</h2>
            <p className="text-white/50 text-sm mb-6">Quick answers to common support questions.</p>

            <div className="space-y-2">
              {faqs.map((faq, i) => (
                <div key={i} className="glass-card overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-4 text-left gap-3"
                  >
                    <span className="text-sm font-medium text-white/90 leading-snug">{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-white/40 shrink-0 transition-transform duration-300 ${openFaq === i ? "rotate-180" : ""}`} />
                  </button>
                  {openFaq === i && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="px-4 pb-4"
                    >
                      <p className="text-white/60 text-sm leading-relaxed">{faq.a}</p>
                    </motion.div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
