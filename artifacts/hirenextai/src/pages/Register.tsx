import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { BrainCircuit, Loader2, Mail, Lock, User, Phone, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

function InputField({
  icon: Icon,
  type,
  name,
  placeholder,
  value,
  onChange,
  required,
  minLength,
}: {
  icon: React.ElementType;
  type: string;
  name: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <div className="flex items-center gap-3 bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 focus-within:border-primary/60 focus-within:bg-white/[0.06] focus-within:shadow-[0_0_0_3px_rgba(99,102,241,0.15),0_0_20px_rgba(99,102,241,0.08)] transition-all duration-300 group">
      <Icon className="w-4 h-4 text-white/30 group-focus-within:text-primary/60 transition-colors duration-300 shrink-0" />
      <input
        type={type}
        name={name}
        required={required}
        minLength={minLength}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-white placeholder:text-white/30 focus:outline-none text-sm min-w-0"
      />
    </div>
  );
}

export default function Register() {
  const { register, isRegistering } = useAuth();
  const [formData, setFormData] = useState({
    name: "", email: "", password: "", phone: ""
  });
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await register({ data: formData });
    } catch (err: any) {
      setError(err.message || "Failed to register. Please try again.");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden py-12">
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="glass-panel w-full max-w-md p-8 rounded-3xl relative z-10"
      >
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.5)]">
            <BrainCircuit className="text-white w-7 h-7" />
          </div>
        </div>

        <h2 className="text-2xl font-display font-bold text-center mb-1.5">Create Account</h2>
        <p className="text-white/50 text-center mb-7 text-sm">Join HirenextAI and supercharge your search</p>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/20 text-red-300 px-4 py-3 rounded-xl mb-5 text-sm"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-white/60 ml-1">Full Name</label>
            <InputField
              icon={User}
              type="text"
              name="name"
              placeholder="John Doe"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-white/60 ml-1">Email</label>
            <InputField
              icon={Mail}
              type="email"
              name="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-white/60 ml-1">Password</label>
            <InputField
              icon={Lock}
              type="password"
              name="password"
              placeholder="Min. 6 characters"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-white/60 ml-1">
              Phone <span className="text-white/30">(Optional)</span>
            </label>
            <InputField
              icon={Phone}
              type="tel"
              name="phone"
              placeholder="+1 (555) 000-0000"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>

          <button
            type="submit"
            disabled={isRegistering}
            className="btn-primary w-full mt-2 gap-2"
          >
            {isRegistering
              ? <Loader2 className="w-5 h-5 animate-spin" />
              : <><span>Create Account</span><ArrowRight className="w-4 h-4" /></>
            }
          </button>
        </form>

        <p className="text-center text-white/40 text-sm mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:text-primary/80 font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
