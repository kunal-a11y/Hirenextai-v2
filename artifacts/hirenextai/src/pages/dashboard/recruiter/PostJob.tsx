import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Briefcase, MapPin, DollarSign, Calendar, Tag, ChevronDown } from "lucide-react";
import { useAuthStore } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

const API = import.meta.env.VITE_API_URL ?? "/api";

const JOB_TYPES = [
  { value: "full-time", label: "Full-time" },
  { value: "part-time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
  { value: "freelance", label: "Freelance" },
];

const CATEGORIES = [
  "Engineering", "Design", "Marketing", "Sales", "Finance", "HR", "Operations",
  "Product", "Data Science", "DevOps", "QA", "Support", "Legal", "Other",
];

const LOCATIONS = [
  "Bangalore", "Mumbai", "Delhi NCR", "Hyderabad", "Pune", "Chennai",
  "Kolkata", "Ahmedabad", "Jaipur", "Remote", "Other",
];

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">{label}{required && <span className="text-purple-400 ml-1">*</span>}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-purple-500/60 focus:bg-white/[0.07] focus:shadow-[0_0_0_3px_rgba(168,85,247,0.12)] transition-all";

export default function PostJob() {
  const [, setLocation] = useLocation();
  const token = useAuthStore(s => s.token);
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [location, setLocation2] = useState("");
  const [isRemote, setIsRemote] = useState(false);
  const [type, setType] = useState("full-time");
  const [category, setCategory] = useState("Engineering");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");
  const [skillsInput, setSkillsInput] = useState("");
  const [isFresher, setIsFresher] = useState(true);
  const [experienceYears, setExperienceYears] = useState("");
  const [applicationDeadline, setApplicationDeadline] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const skills = skillsInput.split(",").map(s => s.trim()).filter(Boolean);
      const reqs = requirements.split("\n").map(s => s.trim()).filter(Boolean);
      const res = await fetch(`${API}/recruiter/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title, location: location, isRemote, type, category,
          salaryMin: salaryMin || undefined, salaryMax: salaryMax || undefined,
          description, requirements: reqs, skills, isFresher,
          experienceYears: experienceYears || undefined,
          applicationDeadline: applicationDeadline || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to post job");
      toast({ title: "Job posted successfully!", description: "Applicants can now find and apply to your job.", duration: 4000 });
      setLocation("/dashboard/recruiter");
    } catch (err: any) {
      toast({ title: "Failed to post job", description: err.message, variant: "destructive", duration: 4000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto px-4 py-6 pb-20"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => setLocation("/dashboard/recruiter")}
          className="p-2 rounded-lg bg-white/[0.05] border border-white/[0.08] text-white/60 hover:text-white hover:bg-white/[0.1] transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">Post a New Job</h1>
          <p className="text-sm text-white/40 mt-0.5">Fill in the details to attract the right candidates</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Basic Info */}
        <div className="glass-card rounded-2xl border border-white/[0.08] p-5 space-y-4">
          <h2 className="text-sm font-bold text-white/80 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-purple-400" /> Job Details
          </h2>

          <Field label="Job Title" required>
            <input className={inputCls} placeholder="e.g. Frontend Developer, React Engineer" value={title} onChange={e => setTitle(e.target.value)} required />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Category" required>
              <select className={inputCls + " appearance-none"} value={category} onChange={e => setCategory(e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c} className="bg-[#0f0f1a]">{c}</option>)}
              </select>
            </Field>
            <Field label="Job Type" required>
              <select className={inputCls + " appearance-none"} value={type} onChange={e => setType(e.target.value)}>
                {JOB_TYPES.map(t => <option key={t.value} value={t.value} className="bg-[#0f0f1a]">{t.label}</option>)}
              </select>
            </Field>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="fresher"
              checked={isFresher}
              onChange={e => setIsFresher(e.target.checked)}
              className="w-4 h-4 rounded accent-purple-500"
            />
            <label htmlFor="fresher" className="text-sm text-white/70">Fresher-friendly (0–2 years experience)</label>
          </div>

          {!isFresher && (
            <Field label="Experience Required (years)">
              <input className={inputCls} type="number" min="0" max="30" placeholder="e.g. 3" value={experienceYears} onChange={e => setExperienceYears(e.target.value)} />
            </Field>
          )}
        </div>

        {/* Location & Salary */}
        <div className="glass-card rounded-2xl border border-white/[0.08] p-5 space-y-4">
          <h2 className="text-sm font-bold text-white/80 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-indigo-400" /> Location & Salary
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Location" required>
              <select
                className={inputCls + " appearance-none"}
                value={location}
                onChange={e => setLocation2(e.target.value)}
                required
              >
                <option value="" className="bg-[#0f0f1a]">Select city...</option>
                {LOCATIONS.map(l => <option key={l} value={l} className="bg-[#0f0f1a]">{l}</option>)}
              </select>
            </Field>
            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 text-sm text-white/70 pb-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRemote}
                  onChange={e => setIsRemote(e.target.checked)}
                  className="w-4 h-4 rounded accent-indigo-500"
                />
                Remote / Hybrid OK
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Min Salary (₹/year, LPA)">
              <input className={inputCls} type="number" min="0" placeholder="e.g. 400000" value={salaryMin} onChange={e => setSalaryMin(e.target.value)} />
            </Field>
            <Field label="Max Salary (₹/year, LPA)">
              <input className={inputCls} type="number" min="0" placeholder="e.g. 800000" value={salaryMax} onChange={e => setSalaryMax(e.target.value)} />
            </Field>
          </div>

          <Field label="Application Deadline">
            <input
              className={inputCls}
              type="date"
              value={applicationDeadline}
              onChange={e => setApplicationDeadline(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
            />
          </Field>
        </div>

        {/* Skills & Requirements */}
        <div className="glass-card rounded-2xl border border-white/[0.08] p-5 space-y-4">
          <h2 className="text-sm font-bold text-white/80 flex items-center gap-2">
            <Tag className="w-4 h-4 text-green-400" /> Skills & Requirements
          </h2>

          <Field label="Required Skills">
            <input
              className={inputCls}
              placeholder="React, TypeScript, Node.js, SQL (comma-separated)"
              value={skillsInput}
              onChange={e => setSkillsInput(e.target.value)}
            />
            <p className="text-xs text-white/25 mt-1">Separate skills with commas</p>
          </Field>

          <Field label="Job Description" required>
            <textarea
              className={inputCls + " resize-none"}
              rows={5}
              placeholder="Describe the role, responsibilities, company culture, and what makes this opportunity exciting..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              required
            />
          </Field>

          <Field label="Requirements (one per line)">
            <textarea
              className={inputCls + " resize-none"}
              rows={4}
              placeholder={"B.Tech/MCA in Computer Science\nStrong knowledge of React.js\nGood communication skills"}
              value={requirements}
              onChange={e => setRequirements(e.target.value)}
            />
          </Field>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(168,85,247,0.3)]"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Publish Job Post"}
        </button>
      </form>
    </motion.div>
  );
}
