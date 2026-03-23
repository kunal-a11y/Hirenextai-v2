import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowLeft, Loader2, Briefcase, MapPin, DollarSign, Calendar, Tag, ChevronDown, Save,
} from "lucide-react";
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
      <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">
        {label}{required && <span className="text-purple-400 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-purple-500/60 focus:bg-white/[0.07] focus:shadow-[0_0_0_3px_rgba(168,85,247,0.12)] transition-all";

export default function EditJob() {
  const { jobId } = useParams<{ jobId: string }>();
  const [, setLocation] = useLocation();
  const token = useAuthStore(s => s.token);
  const { toast } = useToast();

  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const [title, setTitle] = useState("");
  const [location2, setLocation2] = useState("");
  const [isRemote, setIsRemote] = useState(false);
  const [type, setType] = useState("full-time");
  const [category, setCategory] = useState("Engineering");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");
  const [skillsInput, setSkillsInput] = useState("");
  const [isFresher, setIsFresher] = useState(false);
  const [experienceYears, setExperienceYears] = useState("");
  const [deadline, setDeadline] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API}/recruiter/jobs`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) { setNotFound(true); return; }
        const jobs = await res.json();
        const job = jobs.find((j: any) => String(j.id) === String(jobId));
        if (!job) { setNotFound(true); return; }

        setTitle(job.title ?? "");
        setLocation2(job.location ?? "");
        setIsRemote(job.isRemote ?? false);
        setType(job.type ?? "full-time");
        setCategory(job.category ?? "Engineering");
        setSalaryMin(job.salaryMin != null ? String(job.salaryMin) : "");
        setSalaryMax(job.salaryMax != null ? String(job.salaryMax) : "");
        setDescription(job.description ?? "");
        setRequirements(Array.isArray(job.requirements) ? job.requirements.join("\n") : "");
        setSkillsInput(Array.isArray(job.skills) ? job.skills.join(", ") : "");
        setIsFresher(job.isFresher ?? false);
        setExperienceYears(job.experienceYears != null ? String(job.experienceYears) : "");
        setDeadline(job.applicationDeadline ? job.applicationDeadline.slice(0, 10) : "");
      } catch {
        setNotFound(true);
      } finally {
        setFetching(false);
      }
    };
    load();
  }, [jobId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const skills = skillsInput.split(",").map(s => s.trim()).filter(Boolean);
      const requirementsArr = requirements.split("\n").map(r => r.trim()).filter(Boolean);

      const res = await fetch(`${API}/recruiter/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title, location: location2, isRemote, type, category,
          salaryMin: salaryMin ? parseInt(salaryMin) : null,
          salaryMax: salaryMax ? parseInt(salaryMax) : null,
          description,
          requirements: requirementsArr,
          skills,
          isFresher,
          experienceYears: experienceYears ? parseInt(experienceYears) : null,
          applicationDeadline: deadline || null,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || "Failed to update job");
      }

      toast({ title: "Job updated successfully!", duration: 3000 });
      setLocation("/dashboard/recruiter");
    } catch (err: any) {
      toast({ title: err.message || "Failed to update job", variant: "destructive", duration: 4000 });
    } finally {
      setSaving(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="text-center py-20">
        <p className="text-white/40 text-sm">Job not found or you don't have permission to edit it.</p>
        <button onClick={() => setLocation("/dashboard/recruiter")} className="mt-4 text-purple-400 text-sm hover:underline">
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto px-4 py-6"
    >
      <button
        onClick={() => setLocation("/dashboard/recruiter")}
        className="flex items-center gap-2 text-sm text-white/40 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Edit Job Post</h1>
        <p className="text-sm text-white/40 mt-1">Update job details — changes are live immediately</p>
      </div>

      <form onSubmit={handleSubmit} className="glass-card rounded-xl border border-white/[0.08] p-6 space-y-5">
        <Field label="Job Title" required>
          <div className="relative">
            <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
            <input
              className={inputCls + " pl-10"}
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Junior Software Engineer"
              required
            />
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Location" required>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
              <select
                className={inputCls + " pl-10 appearance-none"}
                value={location2}
                onChange={e => setLocation2(e.target.value)}
                required
              >
                <option value="" className="bg-[#0f0f1a]">Select...</option>
                {LOCATIONS.map(l => <option key={l} value={l} className="bg-[#0f0f1a]">{l}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
            </div>
          </Field>

          <Field label="Job Type">
            <div className="relative">
              <select
                className={inputCls + " appearance-none"}
                value={type}
                onChange={e => setType(e.target.value)}
              >
                {JOB_TYPES.map(t => <option key={t.value} value={t.value} className="bg-[#0f0f1a]">{t.label}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
            </div>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Category">
            <div className="relative">
              <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
              <select
                className={inputCls + " pl-10 appearance-none"}
                value={category}
                onChange={e => setCategory(e.target.value)}
              >
                {CATEGORIES.map(c => <option key={c} value={c} className="bg-[#0f0f1a]">{c}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
            </div>
          </Field>

          <Field label="Experience (years)">
            <input
              type="number"
              className={inputCls}
              value={experienceYears}
              onChange={e => setExperienceYears(e.target.value)}
              placeholder="0"
              min="0"
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Min Salary (₹/mo)">
            <div className="relative">
              <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
              <input
                type="number"
                className={inputCls + " pl-10"}
                value={salaryMin}
                onChange={e => setSalaryMin(e.target.value)}
                placeholder="20000"
                min="0"
              />
            </div>
          </Field>
          <Field label="Max Salary (₹/mo)">
            <div className="relative">
              <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
              <input
                type="number"
                className={inputCls + " pl-10"}
                value={salaryMax}
                onChange={e => setSalaryMax(e.target.value)}
                placeholder="40000"
                min="0"
              />
            </div>
          </Field>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <div
              onClick={() => setIsRemote(!isRemote)}
              className={`w-10 h-5.5 rounded-full transition-colors relative cursor-pointer ${isRemote ? "bg-purple-600" : "bg-white/10"}`}
              style={{ width: 40, height: 22 }}
            >
              <div className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 rounded-full bg-white transition-transform ${isRemote ? "translate-x-[18px]" : ""}`}
                style={{ width: 18, height: 18, transform: isRemote ? "translateX(18px)" : "translateX(0)" }}
              />
            </div>
            <span className="text-sm text-white/60">Remote friendly</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <div
              onClick={() => setIsFresher(!isFresher)}
              className={`relative rounded-full transition-colors cursor-pointer`}
              style={{ width: 40, height: 22, backgroundColor: isFresher ? "#16a34a" : "rgba(255,255,255,0.1)" }}
            >
              <div
                className="absolute top-0.5 left-0.5 rounded-full bg-white transition-transform"
                style={{ width: 18, height: 18, transform: isFresher ? "translateX(18px)" : "translateX(0)" }}
              />
            </div>
            <span className="text-sm text-white/60">Fresher friendly</span>
          </label>
        </div>

        <Field label="Job Description" required>
          <textarea
            className={inputCls + " resize-none"}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Describe the role, responsibilities, and what success looks like..."
            rows={5}
            required
          />
        </Field>

        <Field label="Requirements (one per line)">
          <textarea
            className={inputCls + " resize-none"}
            value={requirements}
            onChange={e => setRequirements(e.target.value)}
            placeholder={"Bachelor's degree in CS or related\nStrong problem-solving skills\nFamiliarity with REST APIs"}
            rows={4}
          />
        </Field>

        <Field label="Skills (comma-separated)">
          <div className="relative">
            <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
            <input
              className={inputCls + " pl-10"}
              value={skillsInput}
              onChange={e => setSkillsInput(e.target.value)}
              placeholder="React, Node.js, TypeScript, PostgreSQL"
            />
          </div>
        </Field>

        <Field label="Application Deadline">
          <div className="relative">
            <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
            <input
              type="date"
              className={inputCls + " pl-10"}
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
              min={new Date().toISOString().slice(0, 10)}
            />
          </div>
        </Field>

        <button
          type="submit"
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(168,85,247,0.25)]"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Update Job</>}
        </button>
      </form>
    </motion.div>
  );
}
