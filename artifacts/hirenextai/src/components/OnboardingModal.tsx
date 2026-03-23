import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUpdateProfile } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetProfileQueryKey } from "@workspace/api-client-react";
import {
  GraduationCap, Briefcase, MapPin, Zap, ChevronRight, ChevronLeft,
  Plus, X, Check, Target, Sparkles, BrainCircuit, IndianRupee
} from "lucide-react";

const DEGREES = ["B.Tech / B.E.", "BCA", "B.Sc", "BBA", "B.Com", "MBA / PGDM", "MCA", "M.Tech", "M.Sc", "Other"];

const POPULAR_SKILLS = [
  { group: "Programming", items: ["JavaScript", "Python", "Java", "C++", "C#", "TypeScript", "Go", "Rust", "PHP", "Swift"] },
  { group: "Web & Frontend", items: ["React", "Angular", "Vue.js", "HTML/CSS", "Next.js", "Node.js", "Express"] },
  { group: "Data & AI", items: ["Machine Learning", "Data Science", "SQL", "TensorFlow", "Data Analysis", "Power BI", "Excel"] },
  { group: "Cloud & DevOps", items: ["AWS", "Azure", "Docker", "Kubernetes", "CI/CD", "Linux", "Git"] },
  { group: "Design & Product", items: ["UI/UX Design", "Figma", "Product Management", "Agile / Scrum"] },
  { group: "Business", items: ["Digital Marketing", "SEO", "Content Writing", "Finance", "Accounting", "HR"] },
];

const JOB_CATEGORIES = [
  "Software Development", "Data Science & AI", "Cloud & DevOps", "Cybersecurity",
  "Web Development", "Mobile Development", "Digital Marketing", "Finance & Accounting",
  "HR & Operations", "UI/UX Design", "Product Management", "Content & Media",
];

const POPULAR_CITIES = ["Bangalore", "Mumbai", "Delhi / NCR", "Hyderabad", "Pune", "Chennai", "Kolkata", "Remote"];

const STEPS = [
  { id: 1, label: "About You", icon: GraduationCap },
  { id: 2, label: "Your Skills", icon: Zap },
  { id: 3, label: "Job Preferences", icon: Target },
  { id: 4, label: "Salary & Goals", icon: IndianRupee },
];

interface Props {
  userName: string;
  onComplete: () => void;
}

export default function OnboardingModal({ userName, onComplete }: Props) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const [degree, setDegree] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [isFresher, setIsFresher] = useState(true);

  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [customSkillInput, setCustomSkillInput] = useState("");

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [cityInput, setCityInput] = useState("");
  const [openToRemote, setOpenToRemote] = useState(true);

  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");

  const updateProfile = useUpdateProfile();
  const queryClient = useQueryClient();

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const addCustomSkill = () => {
    const s = customSkillInput.trim();
    if (s && !selectedSkills.includes(s)) {
      setSelectedSkills(prev => [...prev, s]);
      setCustomSkillInput("");
    }
  };

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const toggleCity = (city: string) => {
    setSelectedCities(prev =>
      prev.includes(city) ? prev.filter(c => c !== city) : [...prev, city]
    );
  };

  const addCustomCity = () => {
    const c = cityInput.trim();
    if (c && !selectedCities.includes(c)) {
      setSelectedCities(prev => [...prev, c]);
      setCityInput("");
    }
  };

  const canProceed = () => {
    if (step === 1) return degree.trim().length > 0;
    if (step === 2) return selectedSkills.length > 0;
    if (step === 3) return selectedCategories.length > 0;
    return true;
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      const educationEntry = degree ? [{
        institution: "University / College",
        degree: degree,
        field: specialization || degree,
        startYear: isFresher ? new Date().getFullYear() - 4 : new Date().getFullYear() - 6,
        endYear: isFresher ? new Date().getFullYear() : new Date().getFullYear() - 2,
        current: false,
      }] : [];

      await updateProfile.mutateAsync({
        data: {
          skills: selectedSkills,
          preferredCategories: selectedCategories,
          preferredLocations: selectedCities,
          openToRemote,
          expectedSalaryMin: salaryMin ? parseInt(salaryMin) * 100000 : null,
          expectedSalaryMax: salaryMax ? parseInt(salaryMax) * 100000 : null,
          isFresher,
          degreeLevel: degree || null,
          specialization: specialization || null,
          setupCompleted: true,
          education: educationEntry as any,
        }
      });
      await queryClient.invalidateQueries({ queryKey: getGetProfileQueryKey() });
      onComplete();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const firstName = userName.split(" ")[0];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
        className="w-full max-w-2xl glass-panel rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(99,102,241,0.25)]"
        style={{ border: "1px solid rgba(255,255,255,0.08)" }}
      >
        {/* Header */}
        <div className="relative px-8 pt-8 pb-6 bg-gradient-to-br from-indigo-600/20 via-purple-600/10 to-transparent">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)]">
              <BrainCircuit className="text-white w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-xl text-white">Setup Your AI Career Assistant</h2>
              <p className="text-sm text-white/50">Hey {firstName}! Let's personalise your experience ✨</p>
            </div>
          </div>

          {/* Step Progress */}
          <div className="flex items-center gap-2 mt-5">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const done = step > s.id;
              const active = step === s.id;
              return (
                <div key={s.id} className="flex items-center gap-2 flex-1">
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 whitespace-nowrap ${
                    done ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
                    active ? "bg-primary/20 text-primary border border-primary/30" :
                    "bg-white/5 text-white/30 border border-white/5"
                  }`}>
                    {done ? <Check className="w-3 h-3" /> : <Icon className="w-3 h-3" />}
                    <span className="hidden sm:inline">{s.label}</span>
                    <span className="sm:hidden">{s.id}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`flex-1 h-px transition-colors ${done ? "bg-emerald-500/40" : "bg-white/10"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="px-8 py-6 overflow-y-auto max-h-[50vh]">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                <h3 className="font-semibold text-white mb-1">Tell us about your education</h3>
                <p className="text-sm text-white/40 mb-5">This helps us match you with the right opportunities</p>

                {/* Degree */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-white/70 mb-2">Highest Degree <span className="text-red-400">*</span></label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {DEGREES.map(d => (
                      <button
                        key={d}
                        onClick={() => setDegree(d)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all text-left ${
                          degree === d
                            ? "bg-primary/20 border-primary/50 text-primary"
                            : "bg-white/3 border-white/10 text-white/60 hover:border-white/20 hover:text-white/80"
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Specialization */}
                <div className="mb-5">
                  <label className="block text-sm font-medium text-white/70 mb-2">Specialization / Major</label>
                  <input
                    type="text"
                    placeholder="e.g. Computer Science, Finance, Marketing…"
                    value={specialization}
                    onChange={e => setSpecialization(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/40 transition-colors"
                  />
                </div>

                {/* Fresher / Experienced */}
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Experience Level</label>
                  <div className="flex gap-3">
                    {[{ label: "Fresher", sub: "0–1 year", val: true }, { label: "Experienced", sub: "1+ years", val: false }].map(opt => (
                      <button
                        key={opt.label}
                        onClick={() => setIsFresher(opt.val)}
                        className={`flex-1 px-4 py-3 rounded-xl border text-left transition-all ${
                          isFresher === opt.val
                            ? "bg-primary/15 border-primary/40 text-white"
                            : "bg-white/3 border-white/10 text-white/50 hover:border-white/20"
                        }`}
                      >
                        <div className="font-semibold text-sm">{opt.label}</div>
                        <div className="text-xs text-white/40">{opt.sub}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                <h3 className="font-semibold text-white mb-1">What are your top skills?</h3>
                <p className="text-sm text-white/40 mb-5">Select all that apply — AI will match smarter jobs for you</p>

                {/* Selected skills pills */}
                {selectedSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4 p-3 bg-primary/5 rounded-xl border border-primary/15">
                    {selectedSkills.map(s => (
                      <span key={s} className="flex items-center gap-1 px-2.5 py-1 bg-primary/20 text-primary rounded-lg text-xs font-medium border border-primary/30">
                        {s}
                        <button onClick={() => toggleSkill(s)} className="ml-0.5 hover:text-white"><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Groups */}
                <div className="space-y-4">
                  {POPULAR_SKILLS.map(group => (
                    <div key={group.group}>
                      <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">{group.group}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {group.items.map(skill => {
                          const sel = selectedSkills.includes(skill);
                          return (
                            <button
                              key={skill}
                              onClick={() => toggleSkill(skill)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                                sel
                                  ? "bg-primary/20 border-primary/40 text-primary"
                                  : "bg-white/3 border-white/10 text-white/60 hover:border-white/20 hover:text-white/80"
                              }`}
                            >
                              {sel && <Check className="w-2.5 h-2.5 inline mr-1" />}{skill}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Custom skill */}
                <div className="flex gap-2 mt-4">
                  <input
                    type="text"
                    placeholder="Add a custom skill…"
                    value={customSkillInput}
                    onChange={e => setCustomSkillInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && addCustomSkill()}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/40"
                  />
                  <button onClick={addCustomSkill} className="px-4 py-2.5 bg-primary/20 border border-primary/30 text-primary rounded-xl hover:bg-primary/30 transition-colors">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                <h3 className="font-semibold text-white mb-1">What kind of jobs are you looking for?</h3>
                <p className="text-sm text-white/40 mb-5">Pick your preferred roles and target cities</p>

                {/* Job categories */}
                <div className="mb-5">
                  <label className="block text-sm font-medium text-white/70 mb-2">Preferred Job Categories <span className="text-red-400">*</span></label>
                  <div className="grid grid-cols-2 gap-2">
                    {JOB_CATEGORIES.map(cat => {
                      const sel = selectedCategories.includes(cat);
                      return (
                        <button
                          key={cat}
                          onClick={() => toggleCategory(cat)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all text-left ${
                            sel
                              ? "bg-primary/20 border-primary/40 text-primary"
                              : "bg-white/3 border-white/10 text-white/60 hover:border-white/20 hover:text-white/80"
                          }`}
                        >
                          {sel && <Check className="w-3 h-3 inline mr-1.5 text-primary" />}{cat}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Cities */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-white/70 mb-2">Preferred Locations</label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {POPULAR_CITIES.map(city => {
                      const sel = selectedCities.includes(city);
                      return (
                        <button
                          key={city}
                          onClick={() => toggleCity(city)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                            sel
                              ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                              : "bg-white/3 border-white/10 text-white/60 hover:border-white/20"
                          }`}
                        >
                          <MapPin className="w-2.5 h-2.5 inline mr-1" />{city}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add another city…"
                      value={cityInput}
                      onChange={e => setCityInput(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && addCustomCity()}
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/40"
                    />
                    <button onClick={addCustomCity} className="px-3 py-2 bg-white/5 border border-white/10 text-white/60 rounded-xl hover:bg-white/10 transition-colors">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Remote toggle */}
                <div className="flex items-center justify-between p-3 bg-white/3 rounded-xl border border-white/10">
                  <div>
                    <p className="text-sm font-medium text-white/80">Open to Remote / Hybrid</p>
                    <p className="text-xs text-white/40">Include remote-friendly roles in your feed</p>
                  </div>
                  <button
                    onClick={() => setOpenToRemote(v => !v)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${openToRemote ? "bg-primary" : "bg-white/10"}`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${openToRemote ? "translate-x-5.5 left-0.5" : "left-0.5"}`} />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                <h3 className="font-semibold text-white mb-1">What's your salary expectation?</h3>
                <p className="text-sm text-white/40 mb-6">Enter expected CTC in Lakhs Per Annum (LPA). You can skip this.</p>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">Minimum CTC (LPA)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">₹</span>
                      <input
                        type="number"
                        min="0"
                        max="200"
                        placeholder="e.g. 4"
                        value={salaryMin}
                        onChange={e => setSalaryMin(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-7 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/40"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">Maximum CTC (LPA)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">₹</span>
                      <input
                        type="number"
                        min="0"
                        max="200"
                        placeholder="e.g. 8"
                        value={salaryMax}
                        onChange={e => setSalaryMax(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-7 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/40"
                      />
                    </div>
                  </div>
                </div>

                {/* Summary card */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-600/10 to-purple-600/10 border border-indigo-500/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold text-white">Your AI Career Profile</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-white/60">
                    {degree && <div><span className="text-white/40">Degree:</span> {degree}</div>}
                    {specialization && <div><span className="text-white/40">Major:</span> {specialization}</div>}
                    <div><span className="text-white/40">Level:</span> {isFresher ? "Fresher" : "Experienced"}</div>
                    <div><span className="text-white/40">Skills:</span> {selectedSkills.length} selected</div>
                    {selectedCategories.length > 0 && <div className="col-span-2"><span className="text-white/40">Roles:</span> {selectedCategories.slice(0, 3).join(", ")}{selectedCategories.length > 3 ? ` +${selectedCategories.length - 3}` : ""}</div>}
                    {selectedCities.length > 0 && <div className="col-span-2"><span className="text-white/40">Cities:</span> {selectedCities.join(", ")}</div>}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-white/5 flex items-center justify-between bg-black/20">
          <button
            onClick={() => setStep(s => Math.max(1, s - 1))}
            disabled={step === 1}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white/50 hover:text-white hover:bg-white/5 disabled:opacity-0 transition-all"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>

          <div className="flex items-center gap-1.5">
            {STEPS.map(s => (
              <div key={s.id} className={`rounded-full transition-all ${step === s.id ? "w-5 h-1.5 bg-primary" : step > s.id ? "w-1.5 h-1.5 bg-emerald-500/60" : "w-1.5 h-1.5 bg-white/15"}`} />
            ))}
          </div>

          {step < 4 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!canProceed()}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-primary text-white hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)]"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(99,102,241,0.4)]"
            >
              {saving ? (
                <><div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> Setting up…</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Complete Setup</>
              )}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
