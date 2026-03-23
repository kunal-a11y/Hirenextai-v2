import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { BrainCircuit, Loader2, Mail, Lock, Phone, ArrowRight, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Tab = "email" | "phone";

function InputField({
  icon: Icon,
  type,
  placeholder,
  value,
  onChange,
  required,
  maxLength,
  className = "",
}: {
  icon: React.ElementType;
  type: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  maxLength?: number;
  className?: string;
}) {
  return (
    <div className="flex items-center gap-3 bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 focus-within:border-primary/60 focus-within:bg-white/[0.06] focus-within:shadow-[0_0_0_3px_rgba(99,102,241,0.15),0_0_20px_rgba(99,102,241,0.08)] transition-all duration-300 group">
      <Icon className="w-5 h-5 text-white/30 group-focus-within:text-primary/60 transition-colors duration-300 shrink-0" />
      <input
        type={type}
        required={required}
        value={value}
        onChange={onChange}
        maxLength={maxLength}
        placeholder={placeholder}
        className={`flex-1 bg-transparent text-white placeholder:text-white/30 focus:outline-none text-sm min-w-0 ${className}`}
      />
    </div>
  );
}

export default function Login() {
  const { login, isLoggingIn } = useAuth();
  const [tab, setTab] = useState<Tab>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState("");

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await login({ data: { email, password } });
    } catch (err: any) {
      setError(err.message || "Invalid email or password.");
    }
  };

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) { setError("Enter a valid phone number."); return; }
    setError("");
    setOtpSent(true);
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("Phone OTP login is coming soon. Please use email login.");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="glass-panel w-full max-w-md p-8 rounded-3xl relative z-10"
      >
        <div className="flex justify-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.5)]">
            <BrainCircuit className="text-white w-8 h-8" />
          </div>
        </div>

        <h2 className="text-3xl font-display font-bold text-center mb-2">Welcome Back</h2>
        <p className="text-white/50 text-center mb-8 text-sm">Sign in to continue your career journey</p>

        {/* Tab Switcher */}
        <div className="flex p-1 rounded-xl bg-white/5 border border-white/10 mb-8">
          {(["email", "phone"] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(""); setOtpSent(false); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                tab === t
                  ? "bg-primary text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]"
                  : "text-white/50 hover:text-white"
              }`}
            >
              {t === "email" ? <Mail className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
              {t === "email" ? "Email" : "Phone OTP"}
            </button>
          ))}
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/20 text-red-300 px-4 py-3 rounded-xl mb-6 text-sm"
          >
            {error}
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {tab === "email" ? (
            <motion.form
              key="email-form"
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleEmailSubmit}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-white/60 ml-1">Email</label>
                <InputField
                  icon={Mail}
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center mx-1">
                  <label className="block text-sm font-medium text-white/60">Password</label>
                  <span className="text-xs text-primary/70 hover:text-primary cursor-pointer transition-colors">Forgot?</span>
                </div>
                <InputField
                  icon={Lock}
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="btn-primary w-full mt-2 gap-2"
              >
                {isLoggingIn
                  ? <Loader2 className="w-5 h-5 animate-spin" />
                  : <><span>Sign In</span><ArrowRight className="w-4 h-4" /></>
                }
              </button>
            </motion.form>
          ) : (
            <motion.div
              key="phone-form"
              initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-white/60 ml-1">Phone Number</label>
                    <InputField
                      icon={Phone}
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" className="btn-primary w-full gap-2">
                    <span>Send OTP</span><ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleOtpSubmit} className="space-y-4">
                  <p className="text-sm text-white/60 text-center">OTP sent to <span className="text-white font-medium">{phone}</span></p>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-white/60 ml-1">Enter OTP</label>
                    <div className="flex items-center bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 focus-within:border-primary/60 focus-within:shadow-[0_0_0_3px_rgba(99,102,241,0.15)] transition-all duration-300">
                      <input
                        type="text"
                        maxLength={6}
                        value={otp}
                        onChange={e => setOtp(e.target.value)}
                        className="flex-1 bg-transparent text-white placeholder:text-white/30 focus:outline-none text-center text-xl tracking-[0.75rem] font-mono"
                        placeholder="• • • • • •"
                      />
                    </div>
                  </div>
                  <button type="submit" className="btn-primary w-full">Verify OTP</button>
                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    className="w-full flex items-center justify-center gap-2 text-sm text-white/40 hover:text-white/70 py-2 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" /> Resend OTP
                  </button>
                </form>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Divider */}
        <div className="flex items-center gap-4 my-7">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs text-white/30">or continue with</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Google OAuth placeholder */}
        <button
          onClick={() => alert("Google login coming soon! Use email login for now.")}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/20 transition-all duration-200 text-sm font-medium text-white/70 hover:text-white"
        >
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
          <span className="text-xs text-white/30">(Coming Soon)</span>
        </button>

        <p className="text-center text-white/40 text-sm mt-7">
          Don't have an account?{" "}
          <Link href="/register" className="text-primary hover:text-primary/80 font-medium transition-colors">
            Create one
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
