import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase, Users, Eye, BarChart3, Plus, ChevronRight, ExternalLink,
  Loader2, CheckCircle2, XCircle, Clock, Building2, MapPin, Trash2,
  ThumbsUp, ThumbsDown, FileText, Mail, Phone, Star, Calendar, Pencil, Zap,
} from "lucide-react";
import { useAuthStore } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

const API = import.meta.env.VITE_API_URL ?? "/api";

interface RecruiterJob {
  id: number;
  title: string;
  company: string;
  location: string;
  type: string;
  category: string;
  isRemote: boolean;
  viewCount: number;
  applicationCount: number;
  isFresher: boolean;
  skills: string[];
  postedAt: string;
  applicationDeadline?: string;
}

interface Analytics {
  totalJobs: number;
  totalViews: number;
  totalApplications: number;
  shortlisted: number;
  rejected: number;
  pending: number;
}

interface Applicant {
  applicationId: number;
  userId: number;
  name: string;
  email: string;
  avatarUrl?: string;
  phone?: string;
  status: string;
  recruiterStatus: string;
  coverLetter?: string;
  resumeUrl?: string;
  notes?: string;
  appliedAt: string;
  profile?: {
    skills: string[];
    education: string;
    experience: string;
    headline?: string;
    isFresher?: boolean;
    degreeLevel?: string;
    specialization?: string;
  };
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number | string; color: string }) {
  return (
    <div className="glass-card rounded-xl border border-white/[0.08] p-4 flex items-start gap-3">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-xs text-white/40 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { cls: string; label: string }> = {
    pending: { cls: "bg-amber-500/10 text-amber-400 border-amber-500/20", label: "Pending" },
    shortlisted: { cls: "bg-green-500/10 text-green-400 border-green-500/20", label: "Shortlisted" },
    rejected: { cls: "bg-red-500/10 text-red-400 border-red-500/20", label: "Rejected" },
  };
  const c = cfg[status] ?? cfg.pending;
  return (
    <span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold uppercase tracking-wider ${c.cls}`}>
      {c.label}
    </span>
  );
}

function ApplicantCard({
  applicant, onUpdate,
}: { applicant: Applicant; onUpdate: (id: number, status: string) => void }) {
  const [actionLoading, setActionLoading] = useState(false);
  const token = useAuthStore(s => s.token);
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);

  const initials = applicant.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="glass-card rounded-xl border border-white/[0.08] p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-sm font-bold text-white shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-white truncate">{applicant.name}</p>
              <p className="text-xs text-white/40 truncate">{applicant.email}</p>
            </div>
            <StatusBadge status={applicant.recruiterStatus} />
          </div>

          {applicant.profile?.headline && (
            <p className="text-xs text-white/50 mt-1 truncate">{applicant.profile.headline}</p>
          )}
          {applicant.profile?.degreeLevel && (
            <p className="text-xs text-white/40 mt-0.5">{applicant.profile.degreeLevel} {applicant.profile.specialization ? `· ${applicant.profile.specialization}` : ""}</p>
          )}

          <p className="text-xs text-white/25 mt-1.5">Applied {new Date(applicant.appliedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
        </div>
      </div>

      {/* Skills */}
      {applicant.profile?.skills?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {applicant.profile.skills.slice(0, 5).map(s => (
            <span key={s} className="px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-xs text-white/50">{s}</span>
          ))}
          {applicant.profile.skills.length > 5 && (
            <span className="text-xs text-white/25">+{applicant.profile.skills.length - 5} more</span>
          )}
        </div>
      )}

      {/* Expandable details */}
      {(applicant.coverLetter || applicant.resumeUrl) && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 text-xs text-indigo-400/70 hover:text-indigo-400 transition-colors flex items-center gap-1"
        >
          <FileText className="w-3 h-3" />
          {expanded ? "Hide" : "View"} cover letter{applicant.resumeUrl ? " & resume" : ""}
        </button>
      )}

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 p-3 bg-white/[0.03] rounded-lg border border-white/[0.06] space-y-2">
              {applicant.coverLetter && (
                <div>
                  <p className="text-xs text-white/40 font-semibold mb-1">Cover Letter</p>
                  <p className="text-xs text-white/60 leading-relaxed">{applicant.coverLetter}</p>
                </div>
              )}
              {applicant.resumeUrl && (
                <a
                  href={applicant.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  <FileText className="w-3 h-3" /> View Resume <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      {applicant.recruiterStatus === "pending" && (
        <div className="flex gap-2 mt-3">
          <button
            disabled={actionLoading}
            onClick={async () => {
              setActionLoading(true);
              try {
                const res = await fetch(`${API}/recruiter/jobs/${(applicant as any).jobId}/applicants/${applicant.applicationId}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                  body: JSON.stringify({ recruiterStatus: "shortlisted" }),
                });
                if (!res.ok) throw new Error("Failed");
                onUpdate(applicant.applicationId, "shortlisted");
                toast({ title: `${applicant.name} shortlisted!`, duration: 3000 });
              } catch { toast({ title: "Action failed", variant: "destructive", duration: 3000 }); }
              finally { setActionLoading(false); }
            }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold hover:bg-green-500/20 transition-colors disabled:opacity-50"
          >
            <ThumbsUp className="w-3 h-3" /> Shortlist
          </button>
          <button
            disabled={actionLoading}
            onClick={async () => {
              setActionLoading(true);
              try {
                const res = await fetch(`${API}/recruiter/jobs/${(applicant as any).jobId}/applicants/${applicant.applicationId}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                  body: JSON.stringify({ recruiterStatus: "rejected" }),
                });
                if (!res.ok) throw new Error("Failed");
                onUpdate(applicant.applicationId, "rejected");
                toast({ title: `${applicant.name} rejected`, duration: 3000 });
              } catch { toast({ title: "Action failed", variant: "destructive", duration: 3000 }); }
              finally { setActionLoading(false); }
            }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold hover:bg-red-500/20 transition-colors disabled:opacity-50"
          >
            <ThumbsDown className="w-3 h-3" /> Reject
          </button>
        </div>
      )}
      {applicant.recruiterStatus !== "pending" && (
        <button
          disabled={actionLoading}
          onClick={async () => {
            setActionLoading(true);
            try {
              const res = await fetch(`${API}/recruiter/jobs/${(applicant as any).jobId}/applicants/${applicant.applicationId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ recruiterStatus: "pending" }),
              });
              if (!res.ok) throw new Error("Failed");
              onUpdate(applicant.applicationId, "pending");
            } catch { toast({ title: "Action failed", variant: "destructive", duration: 3000 }); }
            finally { setActionLoading(false); }
          }}
          className="mt-3 w-full text-center text-xs text-white/25 hover:text-white/50 transition-colors py-1"
        >
          Reset status
        </button>
      )}
    </div>
  );
}

export default function RecruiterDashboard() {
  const [, setLocation] = useLocation();
  const token = useAuthStore(s => s.token);
  const { toast } = useToast();

  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [jobs, setJobs] = useState<RecruiterJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<RecruiterJob | null>(null);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [applicantsLoading, setApplicantsLoading] = useState(false);
  const [deletingJobId, setDeletingJobId] = useState<number | null>(null);

  const authHeader = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [analyticsRes, jobsRes] = await Promise.all([
          fetch(`${API}/recruiter/analytics`, { headers: authHeader }),
          fetch(`${API}/recruiter/jobs`, { headers: authHeader }),
        ]);
        if (analyticsRes.ok) setAnalytics(await analyticsRes.json());
        if (jobsRes.ok) setJobs(await jobsRes.json());
      } catch {}
      finally { setLoading(false); }
    };
    load();
  }, [token]);

  const loadApplicants = async (job: RecruiterJob) => {
    setSelectedJob(job);
    setApplicantsLoading(true);
    setApplicants([]);
    try {
      const res = await fetch(`${API}/recruiter/jobs/${job.id}/applicants`, { headers: authHeader });
      if (res.ok) {
        const data = await res.json();
        // attach jobId to each applicant for the action buttons
        setApplicants(data.applicants.map((a: any) => ({ ...a, jobId: job.id })));
      }
    } catch {}
    finally { setApplicantsLoading(false); }
  };

  const handleApplicantUpdate = (appId: number, newStatus: string) => {
    setApplicants(prev => prev.map(a => a.applicationId === appId ? { ...a, recruiterStatus: newStatus } : a));
  };

  const handleDeleteJob = async (jobId: number) => {
    if (!confirm("Delete this job post? This action cannot be undone.")) return;
    setDeletingJobId(jobId);
    try {
      const res = await fetch(`${API}/recruiter/jobs/${jobId}`, { method: "DELETE", headers: authHeader });
      if (!res.ok) throw new Error("Failed");
      setJobs(prev => prev.filter(j => j.id !== jobId));
      if (selectedJob?.id === jobId) setSelectedJob(null);
      toast({ title: "Job deleted", duration: 3000 });
    } catch {
      toast({ title: "Failed to delete job", variant: "destructive", duration: 3000 });
    } finally { setDeletingJobId(null); }
  };

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
      className="px-4 py-6 max-w-6xl mx-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Recruiter Dashboard</h1>
          <p className="text-sm text-white/40 mt-1">Manage your job posts and applicants</p>
        </div>
        <button
          onClick={() => setLocation("/dashboard/recruiter/post-job")}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-semibold hover:opacity-90 transition-all shadow-[0_0_16px_rgba(168,85,247,0.3)]"
        >
          <Plus className="w-4 h-4" /> Post a Job
        </button>
      </div>

      {/* Analytics */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <StatCard icon={Briefcase} label="Jobs Posted" value={analytics.totalJobs} color="bg-purple-500/10 text-purple-400" />
          <StatCard icon={Eye} label="Total Views" value={analytics.totalViews} color="bg-blue-500/10 text-blue-400" />
          <StatCard icon={Users} label="Applications" value={analytics.totalApplications} color="bg-indigo-500/10 text-indigo-400" />
          <StatCard icon={Clock} label="Pending" value={analytics.pending} color="bg-amber-500/10 text-amber-400" />
          <StatCard icon={CheckCircle2} label="Shortlisted" value={analytics.shortlisted} color="bg-green-500/10 text-green-400" />
          <StatCard icon={XCircle} label="Rejected" value={analytics.rejected} color="bg-red-500/10 text-red-400" />
        </div>
      )}

      {jobs.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-8 h-8 text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No jobs posted yet</h3>
          <p className="text-white/40 text-sm mb-6">Post your first job to start receiving applications from talented freshers</p>
          <button
            onClick={() => setLocation("/dashboard/recruiter/post-job")}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-semibold hover:opacity-90 transition-all"
          >
            <Plus className="w-4 h-4" /> Post Your First Job
          </button>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[1fr_1.2fr] gap-4">
          {/* Jobs list */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-white/60 uppercase tracking-wider mb-3">Your Job Posts</h2>
            {jobs.map(job => (
              <div
                key={job.id}
                onClick={() => loadApplicants(job)}
                className={`glass-card rounded-xl border p-4 cursor-pointer transition-all hover:border-purple-500/30 ${
                  selectedJob?.id === job.id ? "border-purple-500/40 bg-purple-500/[0.05]" : "border-white/[0.08]"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-white truncate">{job.title}</h3>
                      {(job as any).isFeatured && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-yellow-400/10 border border-yellow-400/30 text-yellow-300 text-[10px] font-bold">
                          <Star className="w-2.5 h-2.5" />
                          Featured
                        </span>
                      )}
                      {(job as any).isBoosted && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold">
                          <Zap className="w-2.5 h-2.5" />
                          Boosted
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs text-white/40 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {job.location}
                      </span>
                      <span className="text-xs text-white/40 capitalize">{job.type.replace("-", " ")}</span>
                      {job.isFresher && (
                        <span className="px-1.5 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-semibold">Fresher</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={e => { e.stopPropagation(); setLocation(`/dashboard/recruiter/edit-job/${job.id}`); }}
                      className="p-1.5 rounded-lg text-white/20 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
                      title="Edit job"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); handleDeleteJob(job.id); }}
                      disabled={deletingJobId === job.id}
                      className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all"
                      title="Delete job"
                    >
                      {deletingJobId === job.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-3 text-xs text-white/40">
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {job.viewCount ?? 0} views</span>
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {job.applicationCount ?? 0} applicants</span>
                  <span>{new Date(job.postedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                </div>

                {job.applicationDeadline && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-amber-400/70">
                    <Calendar className="w-3 h-3" />
                    Deadline: {new Date(job.applicationDeadline).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Applicants panel */}
          <div>
            <h2 className="text-sm font-bold text-white/60 uppercase tracking-wider mb-3">
              {selectedJob ? `Applicants · ${selectedJob.title}` : "Select a job to view applicants"}
            </h2>

            {!selectedJob && (
              <div className="glass-card rounded-xl border border-white/[0.08] p-8 text-center">
                <Users className="w-10 h-10 text-white/20 mx-auto mb-3" />
                <p className="text-sm text-white/30">Click on a job post to view its applicants</p>
              </div>
            )}

            {selectedJob && applicantsLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
              </div>
            )}

            {selectedJob && !applicantsLoading && applicants.length === 0 && (
              <div className="glass-card rounded-xl border border-white/[0.08] p-8 text-center">
                <Users className="w-10 h-10 text-white/20 mx-auto mb-3" />
                <p className="text-sm text-white/30">No applicants yet for this job</p>
                <p className="text-xs text-white/20 mt-1">Share the listing to attract candidates</p>
              </div>
            )}

            {selectedJob && !applicantsLoading && applicants.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-white/40">
                  <span className="px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.08]">
                    {applicants.filter(a => a.recruiterStatus === "pending").length} pending
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400">
                    {applicants.filter(a => a.recruiterStatus === "shortlisted").length} shortlisted
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400">
                    {applicants.filter(a => a.recruiterStatus === "rejected").length} rejected
                  </span>
                </div>
                {applicants.map(applicant => (
                  <ApplicantCard key={applicant.applicationId} applicant={applicant} onUpdate={handleApplicantUpdate} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
