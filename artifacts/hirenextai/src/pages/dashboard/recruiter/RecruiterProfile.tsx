import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Building2, User, Mail, Phone, Globe, Loader2, Save, CheckCircle2,
  Linkedin, Image, MapPin, FileText, Briefcase, TrendingUp,
} from "lucide-react";
import { useAuthStore } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

const API = import.meta.env.VITE_API_URL ?? "/api";

const COMPANY_SIZES = [
  { value: "1-10", label: "1–10 employees" },
  { value: "11-50", label: "11–50 employees" },
  { value: "51-200", label: "51–200 employees" },
  { value: "201-500", label: "201–500 employees" },
  { value: "500+", label: "500+ employees" },
];

const INDUSTRIES = [
  "Technology", "Finance / FinTech", "Healthcare", "E-commerce",
  "Education / EdTech", "Manufacturing", "Consulting", "Media / Entertainment",
  "Logistics", "Real Estate", "Gaming", "Other",
];

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">
        {label}{required && <span className="text-purple-400 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-purple-500/60 focus:bg-white/[0.07] focus:shadow-[0_0_0_3px_rgba(168,85,247,0.12)] transition-all";

function calcRecruiterCompletion(fields: Record<string, string>) {
  const required = ["companyName", "industry", "companyLocation", "recruiterName", "workEmail"];
  const optional = ["companyLogoUrl", "companyWebsite", "companySize", "description", "recruiterPosition", "phone", "linkedinUrl"];
  let score = 0;
  for (const k of required) { if (fields[k]?.trim()) score += 12; }
  for (const k of optional) { if (fields[k]?.trim()) score += Math.round(40 / optional.length); }
  return Math.min(100, score);
}

export default function RecruiterProfile() {
  const token = useAuthStore(s => s.token);
  const { toast } = useToast();
  const authHeader = { Authorization: `Bearer ${token}` };

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [companyName, setCompanyName] = useState("");
  const [companyLogoUrl, setCompanyLogoUrl] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [industry, setIndustry] = useState("");
  const [companyLocation, setCompanyLocation] = useState("");
  const [description, setDescription] = useState("");
  const [recruiterName, setRecruiterName] = useState("");
  const [recruiterPosition, setRecruiterPosition] = useState("");
  const [workEmail, setWorkEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API}/recruiter/profile`, { headers: authHeader });
        if (res.ok) {
          const data = await res.json();
          if (data.profile) {
            const p = data.profile;
            setCompanyName(p.companyName ?? "");
            setCompanyLogoUrl(p.companyLogoUrl ?? "");
            setCompanyWebsite(p.companyWebsite ?? "");
            setCompanySize(p.companySize ?? "");
            setIndustry(p.industry ?? "");
            setCompanyLocation(p.companyLocation ?? "");
            setDescription(p.description ?? "");
            setRecruiterName(p.recruiterName ?? "");
            setRecruiterPosition(p.recruiterPosition ?? "");
            setWorkEmail(p.workEmail ?? "");
            setPhone(p.phone ?? "");
            setLinkedinUrl(p.linkedinUrl ?? "");
          }
        }
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${API}/recruiter/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({
          companyName, companyLogoUrl: companyLogoUrl || null,
          companyWebsite: companyWebsite || null,
          companySize: companySize || null,
          industry: industry || null,
          companyLocation: companyLocation || null,
          description: description || null,
          recruiterName, workEmail,
          recruiterPosition: recruiterPosition || null,
          phone: phone || null,
          linkedinUrl: linkedinUrl || null,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || "Save failed");
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      toast({ title: "Profile saved successfully!", duration: 3000 });
    } catch (err: any) {
      toast({ title: err.message || "Failed to save profile", variant: "destructive", duration: 4000 });
    } finally {
      setSaving(false);
    }
  };

  const fieldValues = { companyName, companyLogoUrl, companyWebsite, companySize, industry, companyLocation, description, recruiterName, recruiterPosition, workEmail, phone, linkedinUrl };
  const completionPct = calcRecruiterCompletion(fieldValues);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto px-4 py-6"
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Company Profile</h1>
        <p className="text-sm text-white/40 mt-1">Build trust with candidates by completing your profile</p>
      </div>

      {/* Profile strength meter */}
      <div className="glass-card rounded-xl border border-white/[0.08] p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-semibold text-white">Profile Strength</span>
          </div>
          <span className={`text-sm font-bold ${completionPct >= 80 ? "text-green-400" : completionPct >= 50 ? "text-amber-400" : "text-red-400"}`}>
            {completionPct}%
          </span>
        </div>
        <div className="h-2.5 bg-white/[0.07] rounded-full overflow-hidden mb-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${completionPct}%` }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className={`h-full rounded-full ${completionPct >= 80 ? "bg-green-500" : completionPct >= 50 ? "bg-amber-500" : "bg-gradient-to-r from-purple-500 to-indigo-500"}`}
          />
        </div>
        <p className="text-xs text-white/40">
          {completionPct >= 80
            ? "Great! Your profile builds strong trust with candidates."
            : "Complete your company profile to build trust with candidates and attract better applicants."}
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Company Logo Preview */}
        {companyLogoUrl && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-4 p-4 glass-card rounded-xl border border-white/[0.08]"
          >
            <img
              src={companyLogoUrl}
              alt="Company Logo"
              className="w-16 h-16 rounded-xl object-cover border border-white/10 bg-white/5"
              onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            <div>
              <p className="text-sm font-semibold text-white">{companyName || "Your Company"}</p>
              <p className="text-xs text-white/40 mt-0.5">Logo preview</p>
            </div>
          </motion.div>
        )}

        {/* Company Info Section */}
        <div className="glass-card rounded-xl border border-white/[0.08] p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-4 h-4 text-purple-400" />
            <h2 className="text-sm font-bold text-white">Company Information</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Company Name" required>
              <input
                className={inputCls}
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                placeholder="Acme Technologies Pvt Ltd"
                required
              />
            </Field>
            <Field label="Industry">
              <select
                className={inputCls}
                value={industry}
                onChange={e => setIndustry(e.target.value)}
              >
                <option value="" className="bg-[#0f0f1a]">Select industry...</option>
                {INDUSTRIES.map(i => (
                  <option key={i} value={i} className="bg-[#0f0f1a]">{i}</option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Company Size">
              <select
                className={inputCls}
                value={companySize}
                onChange={e => setCompanySize(e.target.value)}
              >
                <option value="" className="bg-[#0f0f1a]">Select size...</option>
                {COMPANY_SIZES.map(s => (
                  <option key={s.value} value={s.value} className="bg-[#0f0f1a]">{s.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Company Location">
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                <input
                  className={inputCls + " pl-10"}
                  value={companyLocation}
                  onChange={e => setCompanyLocation(e.target.value)}
                  placeholder="Bangalore, India"
                />
              </div>
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Company Website">
              <div className="relative">
                <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                <input
                  type="url"
                  className={inputCls + " pl-10"}
                  value={companyWebsite}
                  onChange={e => setCompanyWebsite(e.target.value)}
                  placeholder="https://acme.com"
                />
              </div>
            </Field>
            <Field label="Company Logo URL">
              <div className="relative">
                <Image className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                <input
                  type="url"
                  className={inputCls + " pl-10"}
                  value={companyLogoUrl}
                  onChange={e => setCompanyLogoUrl(e.target.value)}
                  placeholder="https://acme.com/logo.png"
                />
              </div>
            </Field>
          </div>

          <Field label="Company Description">
            <div className="relative">
              <FileText className="absolute left-3.5 top-3.5 w-4 h-4 text-white/30 pointer-events-none" />
              <textarea
                className={inputCls + " pl-10 resize-none"}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="What does your company do? Culture, mission, growth opportunities..."
                rows={4}
              />
            </div>
          </Field>
        </div>

        {/* HR / Recruiter Info */}
        <div className="glass-card rounded-xl border border-white/[0.08] p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <User className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-bold text-white">Recruiter Information</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Your Name" required>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                <input
                  className={inputCls + " pl-10"}
                  value={recruiterName}
                  onChange={e => setRecruiterName(e.target.value)}
                  placeholder="Priya Sharma"
                  required
                />
              </div>
            </Field>
            <Field label="Recruiter Position">
              <div className="relative">
                <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                <input
                  className={inputCls + " pl-10"}
                  value={recruiterPosition}
                  onChange={e => setRecruiterPosition(e.target.value)}
                  placeholder="HR Manager / Talent Acquisition"
                />
              </div>
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Work Email" required>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                <input
                  type="email"
                  className={inputCls + " pl-10"}
                  value={workEmail}
                  onChange={e => setWorkEmail(e.target.value)}
                  placeholder="hr@acme.com"
                  required
                />
              </div>
            </Field>
            <Field label="Phone">
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                <input
                  className={inputCls + " pl-10"}
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                />
              </div>
            </Field>
          </div>

          <Field label="LinkedIn Profile">
            <div className="relative">
              <Linkedin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
              <input
                type="url"
                className={inputCls + " pl-10"}
                value={linkedinUrl}
                onChange={e => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/priya-sharma"
              />
            </div>
          </Field>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)]"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saved ? (
            <><CheckCircle2 className="w-4 h-4 text-green-400" /> Saved!</>
          ) : (
            <><Save className="w-4 h-4" /> Save Profile</>
          )}
        </button>
      </form>
    </motion.div>
  );
}
