import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useDemoStore } from "@/store/demo";
import {
  Loader2, Mail, Lock, User, Phone,
  ArrowRight, ChevronDown, RefreshCw, Sparkles, Briefcase, Building2
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { motion, AnimatePresence } from "framer-motion";

type Mode = "signin" | "signup";
type EmailStep = "idle" | "form";
type PhoneStep = "idle" | "enter_phone" | "enter_otp";
type Role = "job_seeker" | "recruiter";

function InputRow({
  icon: Icon,
  type,
  name,
  placeholder,
  value,
  onChange,
  required,
  minLength,
  autoFocus,
}: {
  icon: React.ElementType;
  type: string;
  name?: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  minLength?: number;
  autoFocus?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3.5 focus-within:border-indigo-500/60 focus-within:bg-white/[0.07] focus-within:shadow-[0_0_0_3px_rgba(99,102,241,0.12)] transition-all duration-200 group">
      <Icon className="w-4 h-4 text-white/30 group-focus-within:text-indigo-400/70 transition-colors duration-200 shrink-0" />
      <input
        type={type}
        name={name}
        required={required}
        minLength={minLength}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="flex-1 bg-transparent text-white placeholder:text-white/25 focus:outline-none text-sm min-w-0 leading-none"
      />
    </div>
  );
}


export default function Auth() {
  const { login, register, isLoggingIn, isRegistering } = useAuth();
  const { enableDemo } = useDemoStore();
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<Mode>("signin");
  const [emailStep, setEmailStep] = useState<EmailStep>("idle");
  const [phoneStep, setPhoneStep] = useState<PhoneStep>("idle");
  const [role, setRole] = useState<Role>("job_seeker");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");

  const reset = (newMode: Mode) => {
    setMode(newMode);
    setEmailStep("idle");
    setPhoneStep("idle");
    setRole("job_seeker");
    setError("");
    setName(""); setEmail(""); setPassword(""); setPhone(""); setOtp("");
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      if (mode === "signin") {
        await login({ data: { email, password } });
      } else {
        await register({ data: { name, email, password, role } as any });
        if (role === "recruiter") {
          setLocation("/dashboard/recruiter/setup");
        }
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    }
  };

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.replace(/\D/g, "").length < 10) {
      setError("Enter a valid 10-digit phone number.");
      return;
    }
    setError("");
    setPhoneStep("enter_otp");
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("Phone OTP login is coming soon. Please use email or try the demo.");
  };

  const handleDemo = () => {
    // Demo mode is entirely client-side — no API credentials needed.
    enableDemo();
    setLocation("/dashboard/jobs");
  };

  const isLoading = isLoggingIn || isRegistering;

  return (
    <div className="min-h-screen bg-[#09090f] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[20%] left-[15%] w-[500px] h-[500px] bg-indigo-600/[0.12] rounded-full blur-[120px]" />
        <div className="absolute bottom-[15%] right-[10%] w-[400px] h-[400px] bg-purple-600/[0.08] rounded-full blur-[100px]" />
        <div className="absolute top-[60%] left-[60%] w-[300px] h-[300px] bg-violet-500/[0.06] rounded-full blur-[80px]" />
      </div>

      {/* Logo above card */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8 relative z-10"
      >
        <Logo size="md" />
      </motion.div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
        className="relative z-10 w-full max-w-[400px]"
      >
        <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] rounded-2xl shadow-[0_32px_64px_rgba(0,0,0,0.5)] overflow-hidden">
          {/* Mode toggle tabs */}
          <div className="flex border-b border-white/[0.07]">
            {(["signin", "signup"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => reset(m)}
                className={`flex-1 py-4 text-sm font-semibold transition-all duration-200 relative ${
                  mode === m ? "text-white" : "text-white/40 hover:text-white/70"
                }`}
              >
                {m === "signin" ? "Sign In" : "Sign Up"}
                {mode === m && (
                  <motion.div
                    layoutId="auth-tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 to-purple-500"
                  />
                )}
              </button>
            ))}
          </div>

          <div className="p-7">
            {/* Headline */}
            <div className="mb-7 text-center">
              <h1 className="text-[1.4rem] font-display font-bold text-white leading-tight">
                {mode === "signin" ? "Welcome back" : "Get started free"}
              </h1>
              <p className="text-white/40 text-sm mt-1.5">
                {mode === "signin"
                  ? "Sign in to your AI career assistant"
                  : "Your AI-powered job search starts here"}
              </p>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  className="bg-red-500/10 border border-red-500/20 text-red-300 px-4 py-3 rounded-xl text-sm overflow-hidden"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-3">

              {/* ── 1. Google ── */}
              <button
                onClick={() => alert("Google login is coming soon! Use email or try the demo below.")}
                className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl bg-white text-gray-800 font-semibold text-sm hover:bg-gray-50 active:bg-gray-100 transition-all duration-200 shadow-[0_2px_12px_rgba(0,0,0,0.3)]"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
                <span className="text-xs text-gray-400 font-normal">(Soon)</span>
              </button>

              {/* ── 2. Phone OTP ── */}
              <AnimatePresence mode="wait">
                {phoneStep === "idle" && (
                  <motion.button
                    key="phone-btn"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={() => { setPhoneStep("enter_phone"); setEmailStep("idle"); setError(""); }}
                    className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl border border-white/[0.12] bg-white/[0.04] text-white/80 text-sm font-medium hover:bg-white/[0.08] hover:border-white/[0.2] hover:text-white transition-all duration-200"
                  >
                    <Phone className="w-4 h-4 shrink-0 text-indigo-400" />
                    Continue with Phone OTP
                  </motion.button>
                )}

                {phoneStep === "enter_phone" && (
                  <motion.form
                    key="phone-input"
                    initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                    onSubmit={handleSendOtp}
                    className="space-y-2.5"
                  >
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => { setPhoneStep("idle"); setError(""); }}
                        className="text-white/30 hover:text-white/60 transition-colors text-xs px-1 shrink-0">✕</button>
                      <span className="text-xs text-white/40 font-medium">Phone OTP</span>
                    </div>
                    <InputRow icon={Phone} type="tel" name="phone" placeholder="+91 98765 43210" value={phone} onChange={e => setPhone(e.target.value)} required autoFocus />
                    <button type="submit" className="w-full py-3 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 text-white text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2">
                      Send OTP <ArrowRight className="w-4 h-4" />
                    </button>
                  </motion.form>
                )}

                {phoneStep === "enter_otp" && (
                  <motion.form
                    key="otp-input"
                    initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                    onSubmit={handleOtpSubmit}
                    className="space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/40">OTP sent to <strong className="text-white/70">{phone}</strong></span>
                      <button type="button" onClick={() => setPhoneStep("enter_phone")} className="text-xs text-indigo-400/70 hover:text-indigo-400 flex items-center gap-1 transition-colors"><RefreshCw className="w-3 h-3" /> Resend</button>
                    </div>
                    <div className="flex items-center gap-3 bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3.5 focus-within:border-indigo-500/60 focus-within:shadow-[0_0_0_3px_rgba(99,102,241,0.12)] transition-all duration-200">
                      <input
                        type="text" maxLength={6} value={otp} onChange={e => setOtp(e.target.value)} autoFocus
                        placeholder="6-digit OTP"
                        className="flex-1 bg-transparent text-white placeholder:text-white/25 focus:outline-none text-sm tracking-[0.5rem] font-mono text-center"
                      />
                    </div>
                    <button type="submit" className="w-full py-3 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 text-white text-sm font-semibold transition-all duration-200">
                      Verify OTP
                    </button>
                    <button type="button" onClick={() => { setPhoneStep("idle"); setError(""); }}
                      className="w-full text-center text-xs text-white/30 hover:text-white/50 transition-colors py-1">
                      ← Back to sign in options
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* ── Divider ── */}
              {phoneStep === "idle" && (
                <div className="flex items-center gap-3 py-1">
                  <div className="flex-1 h-px bg-white/[0.08]" />
                  <span className="text-[11px] text-white/25 uppercase tracking-wider font-medium">or</span>
                  <div className="flex-1 h-px bg-white/[0.08]" />
                </div>
              )}

              {/* ── 3. Email & Password ── */}
              {phoneStep === "idle" && (
                <AnimatePresence mode="wait">
                  {emailStep === "idle" ? (
                    <motion.button
                      key="email-btn"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      onClick={() => setEmailStep("form")}
                      className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl border border-white/[0.12] bg-white/[0.04] text-white/60 text-sm font-medium hover:bg-white/[0.08] hover:border-white/[0.2] hover:text-white transition-all duration-200 group"
                    >
                      <Mail className="w-4 h-4 shrink-0 text-white/40 group-hover:text-indigo-400 transition-colors" />
                      Continue with Email
                      <ChevronDown className="w-3.5 h-3.5 text-white/20 group-hover:text-white/50 transition-colors" />
                    </motion.button>
                  ) : (
                    <motion.form
                      key="email-form"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.2 }}
                      onSubmit={handleEmailSubmit}
                      className="space-y-2.5"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <button type="button" onClick={() => { setEmailStep("idle"); setError(""); }}
                          className="text-white/30 hover:text-white/60 transition-colors text-xs px-1 shrink-0">✕</button>
                        <span className="text-xs text-white/40 font-medium">
                          {mode === "signin" ? "Sign in with email" : "Sign up with email"}
                        </span>
                      </div>

                      {mode === "signup" && (
                        <>
                          {/* Role selector */}
                          <div className="grid grid-cols-2 gap-2 mb-1">
                            <button
                              type="button"
                              onClick={() => setRole("job_seeker")}
                              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-semibold transition-all ${role === "job_seeker" ? "bg-indigo-500/15 border-indigo-500/40 text-indigo-400" : "bg-white/[0.03] border-white/10 text-white/40 hover:text-white/70"}`}
                            >
                              <Briefcase className="w-3.5 h-3.5" /> Job Seeker
                            </button>
                            <button
                              type="button"
                              onClick={() => setRole("recruiter")}
                              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-semibold transition-all ${role === "recruiter" ? "bg-purple-500/15 border-purple-500/40 text-purple-400" : "bg-white/[0.03] border-white/10 text-white/40 hover:text-white/70"}`}
                            >
                              <Building2 className="w-3.5 h-3.5" /> Recruiter
                            </button>
                          </div>
                          <InputRow icon={User} type="text" name="name" placeholder={role === "recruiter" ? "Your full name" : "Full name"} value={name} onChange={e => setName(e.target.value)} required autoFocus />
                        </>
                      )}

                      <InputRow icon={Mail} type="email" name="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required autoFocus={mode === "signin"} />
                      <InputRow icon={Lock} type="password" name="password" placeholder={mode === "signin" ? "Password" : "Create password (min. 6)"} value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold hover:opacity-90 active:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(99,102,241,0.3)]"
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            {mode === "signin" ? "Sign In" : role === "recruiter" ? "Create Recruiter Account" : "Create Account"}
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </motion.form>
                  )}
                </AnimatePresence>
              )}
            </div>

            {/* ── 4. Try Demo ── */}
            {phoneStep === "idle" && emailStep === "idle" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="mt-5 text-center"
              >
                <button
                  onClick={handleDemo}
                  className="inline-flex items-center gap-1.5 text-sm text-white/30 hover:text-white/60 transition-colors group"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400/50 group-hover:text-indigo-400 transition-colors" />
                  Try Demo
                </button>
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="px-7 pb-6 text-center">
            <p className="text-xs text-white/25 leading-relaxed">
              By continuing, you agree to HirenextAI's{" "}
              <span className="text-white/40 hover:text-white/60 cursor-pointer transition-colors">Terms</span>
              {" "}and{" "}
              <span className="text-white/40 hover:text-white/60 cursor-pointer transition-colors">Privacy Policy</span>
            </p>
          </div>
        </div>

        {/* Below card link */}
        <p className="text-center text-white/30 text-sm mt-5">
          {mode === "signin" ? (
            <>New here?{" "}
              <button onClick={() => reset("signup")} className="text-indigo-400/80 hover:text-indigo-400 font-medium transition-colors">
                Create a free account
              </button>
            </>
          ) : (
            <>Already have an account?{" "}
              <button onClick={() => reset("signin")} className="text-indigo-400/80 hover:text-indigo-400 font-medium transition-colors">
                Sign in
              </button>
            </>
          )}
        </p>
      </motion.div>
    </div>
  );
}
