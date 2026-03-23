import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Building2, User, Mail, Phone, Globe, Loader2, ChevronRight, ArrowRight } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useAuthStore } from "@/hooks/use-auth";

const API = import.meta.env.VITE_API_URL ?? "/api";

function InputField({
  label, value, onChange, placeholder, type = "text", required,
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; required?: boolean }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-white/50 uppercase tracking-wider">{label}{required && " *"}</label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-purple-500/60 focus:bg-white/[0.07] focus:shadow-[0_0_0_3px_rgba(168,85,247,0.12)] transition-all"
      />
    </div>
  );
}

function SelectField({
  label, value, onChange, options, required,
}: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; required?: boolean }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-white/50 uppercase tracking-wider">{label}{required && " *"}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
        className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500/60 focus:bg-white/[0.07] transition-all appearance-none"
      >
        <option value="" className="bg-[#0f0f1a]">Select...</option>
        {options.map(o => (
          <option key={o.value} value={o.value} className="bg-[#0f0f1a]">{o.label}</option>
        ))}
      </select>
    </div>
  );
}

export default function RecruiterSetup() {
  const [, setLocation] = useLocation();
  const token = useAuthStore(s => s.token);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [companyName, setCompanyName] = useState("");
  const [recruiterName, setRecruiterName] = useState("");
  const [recruiterPosition, setRecruiterPosition] = useState("");
  const [workEmail, setWorkEmail] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [industry, setIndustry] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/recruiter/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ companyName, recruiterName, recruiterPosition, workEmail, companyWebsite, companySize, industry, phone, description }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save profile");
      setLocation("/dashboard/recruiter");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090f] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[20%] right-[15%] w-[500px] h-[500px] bg-purple-600/[0.1] rounded-full blur-[120px]" />
        <div className="absolute bottom-[15%] left-[10%] w-[400px] h-[400px] bg-indigo-600/[0.07] rounded-full blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 relative z-10"
      >
        <Logo size="md" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-[520px]"
      >
        <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] rounded-2xl shadow-[0_32px_64px_rgba(0,0,0,0.5)] overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-white/[0.07] flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/20 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white">Set up your Recruiter Profile</h1>
              <p className="text-xs text-white/40 mt-0.5">Tell us about your company to start posting jobs</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-300 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <InputField label="Company Name" value={companyName} onChange={setCompanyName} placeholder="Acme Corp" required />
              <InputField label="Your Name" value={recruiterName} onChange={setRecruiterName} placeholder="Priya Sharma" required />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <InputField label="Work Email" value={workEmail} onChange={setWorkEmail} type="email" placeholder="hr@acmecorp.com" required />
              <InputField label="Your Designation" value={recruiterPosition} onChange={setRecruiterPosition} placeholder="HR Manager" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <SelectField
                label="Company Size"
                value={companySize}
                onChange={setCompanySize}
                options={[
                  { value: "1-10", label: "1–10 employees" },
                  { value: "11-50", label: "11–50 employees" },
                  { value: "51-200", label: "51–200 employees" },
                  { value: "201-500", label: "201–500 employees" },
                  { value: "500+", label: "500+ employees" },
                ]}
              />
              <SelectField
                label="Industry"
                value={industry}
                onChange={setIndustry}
                options={[
                  { value: "Technology", label: "Technology" },
                  { value: "Finance", label: "Finance / FinTech" },
                  { value: "Healthcare", label: "Healthcare" },
                  { value: "E-commerce", label: "E-commerce" },
                  { value: "Education", label: "Education / EdTech" },
                  { value: "Manufacturing", label: "Manufacturing" },
                  { value: "Consulting", label: "Consulting" },
                  { value: "Media", label: "Media / Entertainment" },
                  { value: "Other", label: "Other" },
                ]}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <InputField label="Website" value={companyWebsite} onChange={setCompanyWebsite} placeholder="https://acmecorp.com" />
              <InputField label="Phone (optional)" value={phone} onChange={setPhone} placeholder="+91 98765 43210" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/50 uppercase tracking-wider">Company Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Brief description of your company and what you do..."
                rows={3}
                className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-purple-500/60 focus:bg-white/[0.07] focus:shadow-[0_0_0_3px_rgba(168,85,247,0.12)] transition-all resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(168,85,247,0.3)]"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Complete Setup <ArrowRight className="w-4 h-4" /></>}
            </button>

            <button
              type="button"
              onClick={() => setLocation("/dashboard/recruiter")}
              className="w-full text-center text-xs text-white/25 hover:text-white/50 transition-colors py-1"
            >
              Skip for now — I'll do this later
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
