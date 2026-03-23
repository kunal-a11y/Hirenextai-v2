import { useState, useEffect, useRef, useCallback } from "react";
import { useDemoStore } from "@/store/demo";
import { useGetProfile, useUpdateProfile } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, User, Save, Plus, X, GraduationCap, Briefcase, MapPin, Heart, IndianRupee, Upload, CheckCircle2, Phone, Camera, Globe, Award, Calendar, Languages, Clock, Target, Sparkles, AlertTriangle, FileText } from "lucide-react";
import type { Certification, InternshipExperience } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const API = import.meta.env.VITE_API_URL ?? "/api";

const POPULAR_SKILLS = [
  "JavaScript", "TypeScript", "React", "Node.js", "Python",
  "Java", "C++", "SQL", "MongoDB", "PostgreSQL",
  "HTML/CSS", "Git", "REST APIs", "GraphQL", "Docker",
  "AWS", "Linux", "Express.js", "Next.js", "Vue.js",
  "Machine Learning", "Data Analysis", "Excel", "Communication",
  "Problem Solving", "Agile/Scrum", "Figma", "Tailwind CSS",
  "Spring Boot", "Django",
];

export default function Profile() {
  const { data: profile, isLoading } = useGetProfile();
  const updateMut = useUpdateProfile();
  const { isDemoMode, openAuthModal } = useDemoStore();
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeFileName, setResumeFileName] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    avatarUrl: "",
    headline: "",
    bio: "",
    skills: [] as string[],
    skillInput: "",
    openToRemote: true,
    preferredLocations: [] as string[],
    preferredCategories: [] as string[],
    locationInput: "",
    categoryInput: "",
    expectedSalaryMin: "",
    expectedSalaryMax: "",
    education: [] as Array<{ institution: string; degree: string; field: string; startYear: number; endYear: number | null; current: boolean }>,
    experience: [] as Array<{ company: string; title: string; location: string | null; startDate: string; endDate: string | null; current: boolean; description: string | null }>,
    dateOfBirth: "",
    gender: "",
    languages: [] as string[],
    languageInput: "",
    certifications: [] as Certification[],
    portfolioLinks: [] as string[],
    portfolioInput: "",
    internshipExperience: [] as InternshipExperience[],
    jobTypePreference: [] as string[],
    availabilityStatus: "",
    careerGoal: "",
  });

  useEffect(() => {
    if (profile || user) {
      setForm(prev => ({
        ...prev,
        name: user?.name || prev.name,
        phone: user?.phone || prev.phone,
        avatarUrl: user?.avatarUrl || prev.avatarUrl,
        headline: profile?.headline || prev.headline,
        bio: profile?.bio || prev.bio,
        skills: profile?.skills || prev.skills,
        openToRemote: profile?.openToRemote ?? prev.openToRemote,
        preferredLocations: profile?.preferredLocations || prev.preferredLocations,
        preferredCategories: profile?.preferredCategories || prev.preferredCategories,
        expectedSalaryMin: profile?.expectedSalaryMin?.toString() || prev.expectedSalaryMin,
        expectedSalaryMax: profile?.expectedSalaryMax?.toString() || prev.expectedSalaryMax,
        education: (profile?.education as any[]) || prev.education,
        experience: (profile?.experience as any[]) || prev.experience,
        dateOfBirth: profile?.dateOfBirth || prev.dateOfBirth,
        gender: profile?.gender || prev.gender,
        languages: profile?.languages || prev.languages,
        certifications: profile?.certifications || prev.certifications,
        portfolioLinks: profile?.portfolioLinks || prev.portfolioLinks,
        internshipExperience: profile?.internshipExperience || prev.internshipExperience,
        jobTypePreference: profile?.jobTypePreference || prev.jobTypePreference,
        availabilityStatus: profile?.availabilityStatus || prev.availabilityStatus,
        careerGoal: (profile as any)?.careerGoal || prev.careerGoal,
      }));
      // Show filename if resume already uploaded
      if ((profile as any)?.resumeUrl) {
        const parts = ((profile as any).resumeUrl as string).split(":");
        if (parts.length >= 2) setResumeFileName(parts[1]);
      }
    }
  }, [profile, user]);

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const addSkill = () => {
    const s = form.skillInput.trim();
    if (s && !form.skills.includes(s)) setForm(prev => ({ ...prev, skills: [...prev.skills, s], skillInput: "" }));
  };
  const removeSkill = (s: string) => setForm(prev => ({ ...prev, skills: prev.skills.filter(x => x !== s) }));

  const addLocation = () => {
    const l = form.locationInput.trim();
    if (l && !form.preferredLocations.includes(l)) setForm(prev => ({ ...prev, preferredLocations: [...prev.preferredLocations, l], locationInput: "" }));
  };
  const addCategory = () => {
    const c = form.categoryInput.trim();
    if (c && !form.preferredCategories.includes(c)) setForm(prev => ({ ...prev, preferredCategories: [...prev.preferredCategories, c], categoryInput: "" }));
  };

  const addEducation = () => {
    setForm(prev => ({ ...prev, education: [...prev.education, { institution: "", degree: "", field: "", startYear: new Date().getFullYear() - 4, endYear: new Date().getFullYear(), current: false }] }));
  };
  const addExperience = () => {
    setForm(prev => ({ ...prev, experience: [...prev.experience, { company: "", title: "", location: null, startDate: "", endDate: null, current: false, description: null }] }));
  };
  const addLanguage = () => {
    const l = form.languageInput.trim();
    if (l && !form.languages.includes(l)) setForm(prev => ({ ...prev, languages: [...prev.languages, l], languageInput: "" }));
  };
  const addCertification = () => {
    setForm(prev => ({ ...prev, certifications: [...prev.certifications, { name: "", issuer: "", year: "" }] }));
  };
  const addPortfolio = () => {
    const p = form.portfolioInput.trim();
    if (p && !form.portfolioLinks.includes(p)) setForm(prev => ({ ...prev, portfolioLinks: [...prev.portfolioLinks, p], portfolioInput: "" }));
  };
  const addInternship = () => {
    setForm(prev => ({ ...prev, internshipExperience: [...prev.internshipExperience, { company: "", role: "", duration: "", description: null, current: false }] }));
  };
  const toggleJobType = (jt: string) => {
    setForm(prev => ({
      ...prev,
      jobTypePreference: prev.jobTypePreference.includes(jt)
        ? prev.jobTypePreference.filter(x => x !== jt)
        : [...prev.jobTypePreference, jt],
    }));
  };

  const handleSave = async () => {
    if (isDemoMode) { openAuthModal("Save Profile"); return; }
    await updateMut.mutateAsync({
      data: {
        name: form.name || undefined,
        phone: form.phone || null,
        avatarUrl: form.avatarUrl || null,
        headline: form.headline || null,
        bio: form.bio || null,
        skills: form.skills,
        openToRemote: form.openToRemote,
        preferredLocations: form.preferredLocations,
        preferredCategories: form.preferredCategories,
        expectedSalaryMin: form.expectedSalaryMin ? parseInt(form.expectedSalaryMin) : null,
        expectedSalaryMax: form.expectedSalaryMax ? parseInt(form.expectedSalaryMax) : null,
        education: form.education,
        experience: form.experience,
        dateOfBirth: form.dateOfBirth || null,
        gender: form.gender || null,
        languages: form.languages,
        certifications: form.certifications,
        portfolioLinks: form.portfolioLinks,
        internshipExperience: form.internshipExperience,
        jobTypePreference: form.jobTypePreference,
        availabilityStatus: form.availabilityStatus || null,
        careerGoal: form.careerGoal || null,
      } as any
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleResumeUpload = useCallback(async (file: File) => {
    if (isDemoMode) { openAuthModal("Upload Resume"); return; }
    if (!file || file.type !== "application/pdf") {
      toast({ title: "Only PDF files are accepted", variant: "destructive" }); return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large (max 5 MB)", variant: "destructive" }); return;
    }
    setResumeUploading(true);
    setResumeFileName(file.name);
    try {
      const token = localStorage.getItem("hirenext_token");
      const fd = new FormData();
      fd.append("resume", file);
      const res = await fetch(`${API}/profile/upload-resume`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Upload failed");
      const data = await res.json();
      // Refresh profile data and sync form
      await queryClient.invalidateQueries({ queryKey: ["getProfile"] });
      const parsed = data.parsed ?? {};
      setForm(prev => ({
        ...prev,
        skills: (parsed.skills ?? []).length > 0 ? parsed.skills : prev.skills,
        education: (parsed.education ?? []).length > 0 ? parsed.education : prev.education,
        experience: (parsed.experience ?? []).length > 0 ? parsed.experience : prev.experience,
        careerGoal: parsed.careerGoal || prev.careerGoal,
      }));
      toast({ title: "Resume uploaded!", description: "Your profile has been auto-filled from your resume." });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
      setResumeFileName(null);
    } finally {
      setResumeUploading(false);
    }
  }, [isDemoMode, openAuthModal, toast, queryClient]);

  const completionPct = profile?.completionPct ?? 0;

  const completionColor = completionPct >= 70 ? "text-green-400" : completionPct >= 40 ? "text-amber-400" : "text-red-400";
  const completionBarColor = completionPct >= 70 ? "from-green-500 to-emerald-400" : completionPct >= 40 ? "from-amber-500 to-yellow-400" : "from-red-500 to-rose-400";

  return (
    <div className="max-w-3xl space-y-6">
      {/* Completion Banner */}
      {completionPct < 60 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-4 border border-amber-500/30 bg-amber-500/5 flex items-start gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-300">Your profile is {completionPct}% complete</p>
            <p className="text-xs text-white/50 mt-0.5">Complete your profile to improve AI job recommendations and get better matches.</p>
          </div>
          <span className={`text-xs font-bold whitespace-nowrap ${completionColor}`}>{completionPct}%</span>
        </motion.div>
      )}

      {/* Profile Header */}
      <div className="glass-card p-6 sm:p-8">
        {/* Avatar + Progress Row */}
        <div className="flex items-center gap-6 mb-8">
          <div className="relative shrink-0">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.4)] overflow-hidden">
              {form.avatarUrl
                ? <img src={form.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                : <User className="w-12 h-12 text-white/70" />
              }
            </div>
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary flex items-center justify-center border-2 border-background shadow-lg hover:bg-primary/80 transition-colors"
              title="Change avatar URL"
            >
              <Camera className="w-3.5 h-3.5 text-white" />
            </button>
            {/* Circular progress ring */}
            <svg className="absolute -inset-1.5 w-[calc(100%+12px)] h-[calc(100%+12px)]" viewBox="0 0 110 110">
              <circle cx="55" cy="55" r="50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5" />
              <circle cx="55" cy="55" r="50" fill="none" stroke="rgb(99,102,241)" strokeWidth="5"
                strokeDasharray={`${2 * Math.PI * 50}`}
                strokeDashoffset={`${2 * Math.PI * 50 * (1 - completionPct / 100)}`}
                strokeLinecap="round"
                transform="rotate(-90 55 55)"
                style={{ transition: "stroke-dashoffset 0.8s ease" }}
              />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-display font-bold mb-1">My Profile</h2>
            <p className="text-white/50 text-sm mb-3">Complete your profile to get better AI job matches.</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                <div className={`h-full bg-gradient-to-r ${completionBarColor} rounded-full transition-all duration-700`} style={{ width: `${completionPct}%` }} />
              </div>
              <span className={`text-xs font-bold whitespace-nowrap ${completionColor}`}>{completionPct}%</span>
            </div>
          </div>
        </div>

        {/* Basic Info */}
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5 ml-1 flex items-center gap-1.5">
                <User className="w-4 h-4" /> Full Name
              </label>
              <input
                value={form.name}
                onChange={e => setForm({...form, name: e.target.value})}
                className="input-field"
                placeholder="Your full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5 ml-1 flex items-center gap-1.5">
                <Phone className="w-4 h-4" /> Phone Number
              </label>
              <input
                value={form.phone}
                onChange={e => setForm({...form, phone: e.target.value})}
                className="input-field"
                placeholder="+91 9876543210"
              />
            </div>
          </div>

          {/* Avatar URL input (hidden input toggled by Camera button) */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5 ml-1 flex items-center gap-1.5">
              <Camera className="w-4 h-4" /> Profile Photo URL
            </label>
            <input
              ref={avatarInputRef}
              value={form.avatarUrl}
              onChange={e => setForm({...form, avatarUrl: e.target.value})}
              className="input-field"
              placeholder="https://example.com/your-photo.jpg"
            />
            <p className="text-xs text-white/30 mt-1 ml-1">Paste a direct image URL for your profile photo</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5 ml-1">Professional Headline</label>
            <input value={form.headline} onChange={e => setForm({...form, headline: e.target.value})} className="input-field" placeholder="e.g. React Developer | BCA 2024 | Looking for my first role" />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5 ml-1">Bio</label>
            <textarea value={form.bio} onChange={e => setForm({...form, bio: e.target.value})} className="input-field min-h-[100px] resize-none" placeholder="Tell recruiters about your background, goals, and what makes you unique..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5 ml-1 flex items-center gap-1.5">
              <Target className="w-4 h-4" /> Career Goal
            </label>
            <textarea
              value={form.careerGoal}
              onChange={e => setForm({...form, careerGoal: e.target.value})}
              className="input-field resize-none min-h-[72px]"
              placeholder="e.g. Seeking a full-stack developer role at a product startup where I can apply my React and Node.js skills..."
            />
            <p className="text-xs text-white/30 mt-1 ml-1">Helps AI match you with better job recommendations (+10% profile strength)</p>
          </div>
        </div>
      </div>

      {/* Skills */}
      <div className="glass-card p-6">
        <h3 className="font-bold text-lg mb-5 flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-primary" /> Skills</h3>

        {/* Added skills chips */}
        <div className="flex flex-wrap gap-2 mb-4 min-h-[40px]">
          {form.skills.map(skill => (
            <span key={skill} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-sm text-primary">
              {skill}
              <button onClick={() => removeSkill(skill)} className="hover:text-white transition-colors"><X className="w-3 h-3" /></button>
            </span>
          ))}
          {form.skills.length === 0 && <span className="text-sm text-white/30 italic">No skills added yet — select from suggestions below or type your own</span>}
        </div>

        {/* Custom skill input */}
        <div className="flex gap-2 mb-5">
          <input
            value={form.skillInput}
            onChange={e => setForm({...form, skillInput: e.target.value})}
            onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addSkill())}
            className="input-field flex-1 py-2.5 text-sm" placeholder="Type a skill and press Enter (e.g. React, Python)"
          />
          <button onClick={addSkill} className="px-4 py-2 rounded-xl bg-primary/20 border border-primary/30 text-primary hover:bg-primary/30 transition-colors">
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Popular skills quick-select */}
        <div>
          <p className="text-xs font-medium text-white/40 mb-2 flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> Popular skills — click to add</p>
          <div className="flex flex-wrap gap-2">
            {POPULAR_SKILLS.filter(s => !form.skills.includes(s)).map(skill => (
              <button
                key={skill}
                onClick={() => setForm(prev => ({ ...prev, skills: [...prev.skills, skill] }))}
                className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-white/50 hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all"
              >
                + {skill}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Education */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-lg flex items-center gap-2"><GraduationCap className="w-5 h-5 text-primary" /> Education</h3>
          <button onClick={addEducation} className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors">
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
        <div className="space-y-4">
          {form.education.length === 0 && <p className="text-sm text-white/30 italic text-center py-4">No education added yet</p>}
          {form.education.map((edu, i) => (
            <div key={i} className="glass-card p-4 relative">
              <button onClick={() => setForm(prev => ({ ...prev, education: prev.education.filter((_, j) => j !== i) }))} className="absolute top-3 right-3 p-1 hover:bg-white/10 rounded text-white/40 hover:text-white">
                <X className="w-4 h-4" />
              </button>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs text-white/50 mb-1">Institution</label>
                  <input value={edu.institution} onChange={e => setForm(prev => ({ ...prev, education: prev.education.map((x, j) => j === i ? {...x, institution: e.target.value} : x) }))} className="input-field py-2 text-sm" placeholder="IIT Delhi, BITS Pilani..." />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1">Degree</label>
                  <input value={edu.degree} onChange={e => setForm(prev => ({ ...prev, education: prev.education.map((x, j) => j === i ? {...x, degree: e.target.value} : x) }))} className="input-field py-2 text-sm" placeholder="B.Tech, B.E, MCA..." />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1">Field of Study</label>
                  <input value={edu.field} onChange={e => setForm(prev => ({ ...prev, education: prev.education.map((x, j) => j === i ? {...x, field: e.target.value} : x) }))} className="input-field py-2 text-sm" placeholder="Computer Science..." />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1">Start Year</label>
                  <input type="number" value={edu.startYear} onChange={e => setForm(prev => ({ ...prev, education: prev.education.map((x, j) => j === i ? {...x, startYear: parseInt(e.target.value)} : x) }))} className="input-field py-2 text-sm" placeholder="2018" />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1">End Year</label>
                  <input type="number" value={edu.endYear ?? ""} onChange={e => setForm(prev => ({ ...prev, education: prev.education.map((x, j) => j === i ? {...x, endYear: e.target.value ? parseInt(e.target.value) : null} : x) }))} disabled={edu.current} className="input-field py-2 text-sm disabled:opacity-40" placeholder="2022" />
                </div>
                <label className="flex items-center gap-2 cursor-pointer sm:col-span-2">
                  <input type="checkbox" checked={edu.current} onChange={e => setForm(prev => ({ ...prev, education: prev.education.map((x, j) => j === i ? {...x, current: e.target.checked, endYear: e.target.checked ? null : x.endYear} : x) }))} className="rounded" />
                  <span className="text-sm text-white/60">Currently studying here</span>
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Experience */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-lg flex items-center gap-2"><Briefcase className="w-5 h-5 text-primary" /> Experience</h3>
          <button onClick={addExperience} className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors">
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
        <div className="space-y-4">
          {form.experience.length === 0 && <p className="text-sm text-white/30 italic text-center py-4">No experience added yet</p>}
          {form.experience.map((exp, i) => (
            <div key={i} className="glass-card p-4 relative">
              <button onClick={() => setForm(prev => ({ ...prev, experience: prev.experience.filter((_, j) => j !== i) }))} className="absolute top-3 right-3 p-1 hover:bg-white/10 rounded text-white/40 hover:text-white">
                <X className="w-4 h-4" />
              </button>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-white/50 mb-1">Job Title</label>
                  <input value={exp.title} onChange={e => setForm(prev => ({ ...prev, experience: prev.experience.map((x, j) => j === i ? {...x, title: e.target.value} : x) }))} className="input-field py-2 text-sm" placeholder="Frontend Developer" />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1">Company</label>
                  <input value={exp.company} onChange={e => setForm(prev => ({ ...prev, experience: prev.experience.map((x, j) => j === i ? {...x, company: e.target.value} : x) }))} className="input-field py-2 text-sm" placeholder="Infosys, TCS, Startup..." />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1">Start Date</label>
                  <input type="month" value={exp.startDate} onChange={e => setForm(prev => ({ ...prev, experience: prev.experience.map((x, j) => j === i ? {...x, startDate: e.target.value} : x) }))} className="input-field py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1">End Date</label>
                  <input type="month" value={exp.endDate ?? ""} onChange={e => setForm(prev => ({ ...prev, experience: prev.experience.map((x, j) => j === i ? {...x, endDate: e.target.value || null} : x) }))} disabled={exp.current} className="input-field py-2 text-sm disabled:opacity-40" />
                </div>
                <label className="flex items-center gap-2 cursor-pointer sm:col-span-2">
                  <input type="checkbox" checked={exp.current} onChange={e => setForm(prev => ({ ...prev, experience: prev.experience.map((x, j) => j === i ? {...x, current: e.target.checked, endDate: e.target.checked ? null : x.endDate} : x) }))} className="rounded" />
                  <span className="text-sm text-white/60">Currently working here</span>
                </label>
                <div className="sm:col-span-2">
                  <label className="block text-xs text-white/50 mb-1">Description (Optional)</label>
                  <textarea value={exp.description ?? ""} onChange={e => setForm(prev => ({ ...prev, experience: prev.experience.map((x, j) => j === i ? {...x, description: e.target.value || null} : x) }))} className="input-field py-2 text-sm resize-none min-h-[80px]" placeholder="Describe your responsibilities and achievements..." />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Career Preferences */}
      <div className="glass-card p-6">
        <h3 className="font-bold text-lg mb-5 flex items-center gap-2"><Heart className="w-5 h-5 text-primary" /> Career Preferences</h3>
        <div className="space-y-5">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="font-medium text-sm">Open to Remote Work</p>
              <p className="text-xs text-white/40 mt-0.5">Show remote job listings</p>
            </div>
            <div onClick={() => setForm(prev => ({...prev, openToRemote: !prev.openToRemote}))} className={`w-12 h-6 rounded-full transition-colors relative ${form.openToRemote ? "bg-primary" : "bg-white/10"}`}>
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${form.openToRemote ? "left-7" : "left-1"}`} />
            </div>
          </label>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2 flex items-center gap-1.5"><MapPin className="w-4 h-4" /> Preferred Locations</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {form.preferredLocations.map(loc => (
                <span key={loc} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-sm text-white/70">
                  {loc} <button onClick={() => setForm(prev => ({...prev, preferredLocations: prev.preferredLocations.filter(x => x !== loc)}))} className="hover:text-white"><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={form.locationInput} onChange={e => setForm({...form, locationInput: e.target.value})} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addLocation())} className="input-field flex-1 py-2 text-sm" placeholder="Mumbai, Bangalore, Delhi..." />
              <button onClick={addLocation} className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white"><Plus className="w-4 h-4" /></button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2 flex items-center gap-1.5"><Briefcase className="w-4 h-4" /> Preferred Job Categories</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {form.preferredCategories.map(cat => (
                <span key={cat} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-sm text-white/70">
                  {cat} <button onClick={() => setForm(prev => ({...prev, preferredCategories: prev.preferredCategories.filter(x => x !== cat)}))} className="hover:text-white"><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={form.categoryInput} onChange={e => setForm({...form, categoryInput: e.target.value})} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addCategory())} className="input-field flex-1 py-2 text-sm" placeholder="Engineering, Design, Product..." />
              <button onClick={addCategory} className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white"><Plus className="w-4 h-4" /></button>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5 flex items-center gap-1.5"><IndianRupee className="w-4 h-4" /> Expected Salary Min (₹/year)</label>
              <input type="number" value={form.expectedSalaryMin} onChange={e => setForm({...form, expectedSalaryMin: e.target.value})} className="input-field py-2.5 text-sm" placeholder="600000" />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5 flex items-center gap-1.5"><IndianRupee className="w-4 h-4" /> Expected Salary Max (₹/year)</label>
              <input type="number" value={form.expectedSalaryMax} onChange={e => setForm({...form, expectedSalaryMax: e.target.value})} className="input-field py-2.5 text-sm" placeholder="1200000" />
            </div>
          </div>
        </div>
      </div>

      {/* Internships */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-lg flex items-center gap-2"><Briefcase className="w-5 h-5 text-amber-400" /> Internships</h3>
          <button onClick={addInternship} className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors"><Plus className="w-4 h-4" /> Add</button>
        </div>
        <div className="space-y-4">
          {form.internshipExperience.length === 0 && <p className="text-sm text-white/30 italic text-center py-4">No internships added yet</p>}
          {form.internshipExperience.map((intern, i) => (
            <div key={i} className="glass-card p-4 relative">
              <button onClick={() => setForm(prev => ({ ...prev, internshipExperience: prev.internshipExperience.filter((_, j) => j !== i) }))} className="absolute top-3 right-3 p-1 hover:bg-white/10 rounded text-white/40 hover:text-white"><X className="w-4 h-4" /></button>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-white/50 mb-1">Role / Position</label>
                  <input value={intern.role} onChange={e => setForm(prev => ({ ...prev, internshipExperience: prev.internshipExperience.map((x, j) => j === i ? { ...x, role: e.target.value } : x) }))} className="input-field py-2 text-sm" placeholder="Frontend Developer Intern" />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1">Company</label>
                  <input value={intern.company} onChange={e => setForm(prev => ({ ...prev, internshipExperience: prev.internshipExperience.map((x, j) => j === i ? { ...x, company: e.target.value } : x) }))} className="input-field py-2 text-sm" placeholder="Company name" />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1">Duration</label>
                  <input value={intern.duration ?? ""} onChange={e => setForm(prev => ({ ...prev, internshipExperience: prev.internshipExperience.map((x, j) => j === i ? { ...x, duration: e.target.value } : x) }))} className="input-field py-2 text-sm" placeholder="e.g. 3 months, Jun–Aug 2024" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs text-white/50 mb-1">Description (Optional)</label>
                  <textarea value={intern.description ?? ""} onChange={e => setForm(prev => ({ ...prev, internshipExperience: prev.internshipExperience.map((x, j) => j === i ? { ...x, description: e.target.value || null } : x) }))} className="input-field py-2 text-sm resize-none min-h-[70px]" placeholder="Key tasks and achievements..." />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Certifications */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-lg flex items-center gap-2"><Award className="w-5 h-5 text-primary" /> Certifications</h3>
          <button onClick={addCertification} className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors"><Plus className="w-4 h-4" /> Add</button>
        </div>
        <div className="space-y-3">
          {form.certifications.length === 0 && <p className="text-sm text-white/30 italic text-center py-4">No certifications added yet</p>}
          {form.certifications.map((cert, i) => (
            <div key={i} className="glass-card p-4 relative">
              <button onClick={() => setForm(prev => ({ ...prev, certifications: prev.certifications.filter((_, j) => j !== i) }))} className="absolute top-3 right-3 p-1 hover:bg-white/10 rounded text-white/40 hover:text-white"><X className="w-4 h-4" /></button>
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-xs text-white/50 mb-1">Certificate Name</label>
                  <input value={cert.name} onChange={e => setForm(prev => ({ ...prev, certifications: prev.certifications.map((x, j) => j === i ? { ...x, name: e.target.value } : x) }))} className="input-field py-2 text-sm" placeholder="AWS Cloud Practitioner" />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1">Issuer</label>
                  <input value={cert.issuer ?? ""} onChange={e => setForm(prev => ({ ...prev, certifications: prev.certifications.map((x, j) => j === i ? { ...x, issuer: e.target.value } : x) }))} className="input-field py-2 text-sm" placeholder="Amazon, Google, Coursera..." />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1">Year</label>
                  <input value={cert.year ?? ""} onChange={e => setForm(prev => ({ ...prev, certifications: prev.certifications.map((x, j) => j === i ? { ...x, year: e.target.value } : x) }))} className="input-field py-2 text-sm" placeholder="2024" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Personal Details */}
      <div className="glass-card p-6">
        <h3 className="font-bold text-lg mb-5 flex items-center gap-2"><Calendar className="w-5 h-5 text-primary" /> Personal Details</h3>
        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5 ml-1">Date of Birth</label>
            <input type="date" value={form.dateOfBirth} onChange={e => setForm({ ...form, dateOfBirth: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1.5 ml-1">Gender</label>
            <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })} className="input-field">
              <option value="">Prefer not to say</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="non-binary">Non-binary</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-white/70 mb-2 flex items-center gap-1.5"><Languages className="w-4 h-4" /> Languages Known</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {form.languages.map(lang => (
              <span key={lang} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-sm text-white/70">
                {lang} <button onClick={() => setForm(prev => ({ ...prev, languages: prev.languages.filter(x => x !== lang) }))} className="hover:text-white"><X className="w-3 h-3" /></button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={form.languageInput} onChange={e => setForm({ ...form, languageInput: e.target.value })} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addLanguage())} className="input-field flex-1 py-2 text-sm" placeholder="Hindi, English, Marathi..." />
            <button onClick={addLanguage} className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white"><Plus className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      {/* Portfolio Links */}
      <div className="glass-card p-6">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Globe className="w-5 h-5 text-primary" /> Portfolio & Links</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {form.portfolioLinks.map(link => (
            <span key={link} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-sm text-indigo-400 max-w-full overflow-hidden">
              <Globe className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{link}</span>
              <button onClick={() => setForm(prev => ({ ...prev, portfolioLinks: prev.portfolioLinks.filter(x => x !== link) }))} className="hover:text-white shrink-0"><X className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={form.portfolioInput} onChange={e => setForm({ ...form, portfolioInput: e.target.value })} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addPortfolio())} className="input-field flex-1 py-2 text-sm" placeholder="https://github.com/username, https://portfolio.dev..." />
          <button onClick={addPortfolio} className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white"><Plus className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Job Type & Availability */}
      <div className="glass-card p-6">
        <h3 className="font-bold text-lg mb-5 flex items-center gap-2"><Clock className="w-5 h-5 text-primary" /> Job Type & Availability</h3>
        <div className="mb-5">
          <label className="block text-sm font-medium text-white/70 mb-3">Job Type Preference</label>
          <div className="flex flex-wrap gap-2">
            {["Full-time", "Part-time", "Internship", "Contract", "Freelance", "Remote"].map(jt => (
              <button
                key={jt}
                onClick={() => toggleJobType(jt)}
                className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${form.jobTypePreference.includes(jt) ? "bg-primary/20 border-primary/40 text-primary" : "bg-white/5 border-white/10 text-white/50 hover:text-white hover:border-white/20"}`}
              >
                {jt}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-white/70 mb-1.5 ml-1">Availability Status</label>
          <select value={form.availabilityStatus} onChange={e => setForm({ ...form, availabilityStatus: e.target.value })} className="input-field">
            <option value="">Select availability</option>
            <option value="immediately">Available Immediately</option>
            <option value="2weeks">Available in 2 Weeks</option>
            <option value="1month">Available in 1 Month</option>
            <option value="3months">Available in 3 Months</option>
            <option value="not-looking">Not actively looking</option>
          </select>
        </div>
      </div>

      {/* Resume Upload */}
      <div className="glass-card p-6">
        <h3 className="font-bold text-lg mb-5 flex items-center gap-2"><FileText className="w-5 h-5 text-primary" /> Resume</h3>

        {/* Already uploaded indicator */}
        {resumeFileName && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20 mb-4">
            <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-green-300 truncate">{resumeFileName}</p>
              <p className="text-xs text-white/40">Resume uploaded · Profile auto-filled</p>
            </div>
            <button onClick={() => resumeInputRef.current?.click()} className="text-xs text-primary hover:underline">Replace</button>
          </div>
        )}

        {/* Drop zone */}
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${dragOver ? "border-primary/60 bg-primary/5" : "border-white/10 hover:border-primary/30"}`}
          onClick={() => resumeInputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleResumeUpload(f); }}
        >
          {resumeUploading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <p className="text-sm text-white/60">Parsing your resume with AI...</p>
            </div>
          ) : (
            <>
              <Upload className="w-10 h-10 text-white/30 mx-auto mb-3" />
              <p className="text-white/70 text-sm font-medium mb-1">Drag and drop your resume, or click to browse</p>
              <p className="text-white/30 text-xs">PDF only · Max 5 MB · AI will auto-fill your profile</p>
            </>
          )}
        </div>

        <input
          ref={resumeInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleResumeUpload(f); e.target.value = ""; }}
        />
      </div>

      {/* Save Button */}
      <div className="flex justify-end pb-4">
        <button onClick={handleSave} disabled={updateMut.isPending} className="btn-primary gap-2 px-8">
          {updateMut.isPending
            ? <Loader2 className="w-5 h-5 animate-spin" />
            : saved
            ? <><CheckCircle2 className="w-5 h-5 text-green-400" /> Saved!</>
            : <><Save className="w-5 h-5" /> Save Profile</>
          }
        </button>
      </div>
    </div>
  );
}
