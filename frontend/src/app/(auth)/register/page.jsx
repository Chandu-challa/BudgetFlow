"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import { Eye, EyeOff, Loader2, AlertCircle, ArrowRight, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

const registerSchema = zod.object({
  name: zod.string().min(2, "Name must be at least 2 characters"),
  username: zod.string().min(3, "Username must be at least 3 characters").regex(/^[a-zA-Z0-9_ ]+$/, "Only alphanumeric characters, spaces and underscores allowed"),
  email: zod.string().email("Invalid email address"),
  password: zod.string().min(6, "Password must be at least 6 characters"),
});

const checkStrength = (pass) => {
  if (!pass) return { score: 0, label: "Empty" };
  let score = 0;
  if (pass.length >= 8) score++;
  if (pass.match(/[a-z]/) && pass.match(/[A-Z]/)) score++;
  if (pass.match(/\d/)) score++;
  if (pass.match(/[^a-zA-Z\d]/)) score++;
  
  if (score === 0 || score === 1) return { score: 1, label: "Weak", color: "bg-rose-500" };
  if (score === 2) return { score: 2, label: "Fair", color: "bg-amber-500" };
  if (score === 3) return { score: 3, label: "Good", color: "bg-[#10b981]" };
  return { score: 4, label: "Strong", color: "bg-[#22c55e]" };
};

const staggerVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

export default function RegisterPage() {
  const { register: authRegister } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema)
  });

  const passwordValue = watch("password");
  const strength = checkStrength(passwordValue);

  const onSubmit = async (data) => {
    setLoading(true);
    setError(null);
    try {
      await authRegister({
        ...data,
        currency: "USD",
        monthly_income: 0,
      });
      setSuccess(true);
      setTimeout(() => {
        router.push("/login?registered=true");
      }, 2500);
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-12 text-center font-sans">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="w-16 h-16 bg-[#22c55e]/20 border border-[#22c55e]/30 rounded-full flex items-center justify-center mb-6"
        >
          <CheckCircle2 className="h-8 w-8 text-[#22c55e]" />
        </motion.div>
        <motion.h2 
          initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
          className="text-[28px] font-bold text-white tracking-tight mb-2"
        >
          Account created successfully
        </motion.h2>
        <motion.p 
          initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
          className="text-slate-400 text-[15px]"
        >
          Your account is ready. Redirecting you to sign in...
        </motion.p>
      </div>
    );
  }

  return (
    <motion.div 
      initial="hidden" 
      animate="visible" 
      transition={{ staggerChildren: 0.05 }}
      className="w-full font-sans"
    >
      {/* Brand Block */}
      <motion.div variants={staggerVariants} className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#141b2c]/80 border border-white/5 text-white text-sm font-bold tracking-tight mb-6 backdrop-blur-sm">
          <span className="text-[#10b981] text-lg leading-none">◈</span> BudgetFlow
        </div>
        <h1 className="text-[32px] font-bold text-white tracking-tight leading-tight">
          Create your account
        </h1>
        <p className="text-slate-400 text-[15px] mt-2 font-medium">
          Start building better financial habits today.
        </p>
      </motion.div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-start gap-3 backdrop-blur-sm"
        >
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <span className="font-medium">{error}</span>
        </motion.div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <motion.div variants={staggerVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-300 text-[13px] font-medium mb-2">
              Full name
            </label>
            <input 
              type="text" 
              placeholder="John Doe" 
              {...register("name")} 
              className="w-full px-4 h-[50px] bg-white/[0.02] border border-white/10 rounded-[12px] text-white placeholder-slate-500 focus:outline-none focus:border-[#10b981] focus:bg-white/[0.04] transition-all text-[15px] backdrop-blur-md"
            />
            {errors.name && <p className="text-rose-400 text-[13px] mt-1.5 flex items-center gap-1.5"><AlertCircle className="h-3.5 w-3.5"/> {errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-slate-300 text-[13px] font-medium mb-2">
              Username
            </label>
            <input 
              type="text" 
              placeholder="johndoe" 
              {...register("username")} 
              className="w-full px-4 h-[50px] bg-white/[0.02] border border-white/10 rounded-[12px] text-white placeholder-slate-500 focus:outline-none focus:border-[#10b981] focus:bg-white/[0.04] transition-all text-[15px] backdrop-blur-md"
            />
            {errors.username && <p className="text-rose-400 text-[13px] mt-1.5 flex items-center gap-1.5"><AlertCircle className="h-3.5 w-3.5"/> {errors.username.message}</p>}
          </div>
        </motion.div>

        <motion.div variants={staggerVariants}>
          <label className="block text-slate-300 text-[13px] font-medium mb-2">
            Email address
          </label>
          <input 
            type="email" 
            placeholder="john@example.com" 
            {...register("email")} 
            className="w-full px-4 h-[50px] bg-white/[0.02] border border-white/10 rounded-[12px] text-white placeholder-slate-500 focus:outline-none focus:border-[#10b981] focus:bg-white/[0.04] transition-all text-[15px] backdrop-blur-md"
          />
          {errors.email && <p className="text-rose-400 text-[13px] mt-1.5 flex items-center gap-1.5"><AlertCircle className="h-3.5 w-3.5"/> {errors.email.message}</p>}
        </motion.div>

        <motion.div variants={staggerVariants}>
          <label className="block text-slate-300 text-[13px] font-medium mb-2">
            Password
          </label>
          <div className="relative group mb-2">
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="••••••••" 
              {...register("password")} 
              className="w-full px-4 pr-12 h-[50px] bg-white/[0.02] border border-white/10 rounded-[12px] text-white placeholder-slate-500 focus:outline-none focus:border-[#10b981] focus:bg-white/[0.04] transition-all text-[15px] backdrop-blur-md"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-white transition-colors"
              aria-label="Toggle password visibility"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          
          {/* Password Strength Indicator */}
          {passwordValue && passwordValue.length > 0 && (
            <div className="flex items-center gap-3 mt-2">
              <div className="flex gap-1 flex-1">
                {[1, 2, 3, 4].map((step) => (
                  <div 
                    key={step} 
                    className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                      strength.score >= step ? strength.color : "bg-white/10"
                    }`}
                  />
                ))}
              </div>
              <span className={`text-[12px] font-bold w-12 ${
                strength.score <= 1 ? "text-rose-400" : 
                strength.score === 2 ? "text-amber-400" : "text-[#10b981]"
              }`}>
                {strength.label}
              </span>
            </div>
          )}
          {errors.password && <p className="text-rose-400 text-[13px] mt-1.5 flex items-center gap-1.5"><AlertCircle className="h-3.5 w-3.5"/> {errors.password.message}</p>}
        </motion.div>

        <motion.div variants={staggerVariants} className="pt-2 pb-1">
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative flex items-center justify-center mt-0.5 shrink-0">
              <input type="checkbox" className="peer sr-only" required />
              <div className="w-[18px] h-[18px] border border-white/20 rounded-full peer-checked:bg-[#10b981] peer-checked:border-[#10b981] transition-colors bg-white/[0.02] backdrop-blur-sm"></div>
              <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" viewBox="0 0 14 10" fill="none">
                <path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-[14px] text-slate-400 leading-relaxed font-medium">
              I agree to the <a href="#" className="text-[#10b981] hover:text-emerald-400 hover:underline">Terms of Service</a> and <a href="#" className="text-[#10b981] hover:text-emerald-400 hover:underline">Privacy Policy</a>.
            </span>
          </label>
        </motion.div>

        <motion.div variants={staggerVariants}>
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full h-[50px] px-4 bg-[#22c55e] hover:bg-[#16a34a] active:scale-[0.98] disabled:bg-slate-700 disabled:text-slate-500 disabled:active:scale-100 text-white rounded-[12px] font-semibold text-[15px] transition-all flex items-center justify-center gap-2 mt-4 shadow-[0_0_30px_-5px_rgba(34,197,94,0.4)]"
          >
            {loading ? (
              <><Loader2 className="h-5 w-5 animate-spin" /> Creating account...</>
            ) : (
              <>Create account <ArrowRight className="h-4 w-4 ml-1" /></>
            )}
          </button>
        </motion.div>
      </form>

      <motion.div variants={staggerVariants} className="mt-8 relative flex items-center py-2">
        <div className="grow border-t border-white/5"></div>
        <span className="shrink-0 mx-4 text-slate-500 text-[13px]">or</span>
        <div className="grow border-t border-white/5"></div>
      </motion.div>

      <motion.p variants={staggerVariants} className="text-center text-slate-400 text-[14px] mt-6">
        Already a member?{" "}
        <Link href="/login" className="font-semibold text-[#10b981] hover:text-emerald-400 transition-colors">
          Sign in
        </Link>
      </motion.p>
    </motion.div>
  );
}
