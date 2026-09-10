"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import { Eye, EyeOff, ShieldCheck, AlertCircle, Loader2, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

const resetSchema = zod.object({
  email: zod.string().email("Invalid email address"),
  token: zod.string().min(1, "Reset token is required"),
  password: zod.string().min(6, "New password must be at least 6 characters"),
});

const staggerVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

function ResetPasswordForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(resetSchema),
  });

  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setValue("email", emailParam);
    } else {
      const storedEmail = localStorage.getItem("lastResetEmail");
      if (storedEmail) {
        setValue("email", storedEmail);
      }
    }
  }, [searchParams, setValue]);

  const onSubmit = async (data) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await api.post("auth/reset-password/", data);
      setSuccess(response.data.message || "Password has been successfully updated!");
      localStorage.removeItem("lastResetEmail");
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Password reset failed. Please check your token or email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial="hidden" 
      animate="visible" 
      transition={{ staggerChildren: 0.08 }}
      className="w-full font-sans"
    >
      {/* Brand Block */}
      <motion.div variants={staggerVariants} className="mb-10">
        <Link 
          href="/login" 
          className="inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider text-slate-400 hover:text-emerald-400 transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Login
        </Link>
        <br/>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/50 text-slate-200 text-sm font-bold tracking-tight mb-6 backdrop-blur-md">
          <span className="text-emerald-400 text-lg leading-none shadow-emerald-500">◈</span> BudgetFlow
        </div>
        <h1 className="text-[32px] font-bold text-white tracking-tight leading-tight drop-shadow-sm">
          New password
        </h1>
        <p className="text-slate-400 text-[15px] font-medium mt-2">
          Enter the reset token sent to your email to complete password update.
        </p>
      </motion.div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-start gap-3 backdrop-blur-md"
        >
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <span className="font-medium">{error}</span>
        </motion.div>
      )}

      {success && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-start gap-3 backdrop-blur-md"
        >
          <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-[15px]">{success}</p>
            <p className="text-[13px] text-slate-400 mt-1 font-medium">Redirecting to login page in 3 seconds...</p>
          </div>
        </motion.div>
      )}

      {!success && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <motion.div variants={staggerVariants}>
            <label className="block text-slate-300 text-[13px] font-medium mb-2.5">
              Email address
            </label>
            <div className="relative group">
              <input 
                type="email" 
                placeholder="john@example.com" 
                {...register("email")} 
                className="w-full px-4 h-[50px] bg-white/[0.02] border border-white/10 rounded-[12px] text-white placeholder-slate-500 focus:outline-none focus:border-[#10b981] focus:bg-white/[0.04] transition-all text-[15px] backdrop-blur-md"
              />
            </div>
            {errors.email && <p className="text-rose-400 text-[13px] mt-1.5 flex items-center gap-1.5"><AlertCircle className="h-3.5 w-3.5"/> {errors.email.message}</p>}
          </motion.div>

          <motion.div variants={staggerVariants}>
            <label className="block text-slate-300 text-[13px] font-medium mb-2.5">
              Reset token
            </label>
            <div className="relative group">
              <input 
                type="text" 
                placeholder="Enter reset token" 
                {...register("token")} 
                className="w-full px-4 h-[50px] bg-white/[0.02] border border-white/10 rounded-[12px] text-white placeholder-slate-500 focus:outline-none focus:border-[#10b981] focus:bg-white/[0.04] transition-all text-[15px] font-mono tracking-wide backdrop-blur-md"
              />
            </div>
            {errors.token && <p className="text-rose-400 text-[13px] mt-1.5 flex items-center gap-1.5"><AlertCircle className="h-3.5 w-3.5"/> {errors.token.message}</p>}
          </motion.div>

          <motion.div variants={staggerVariants}>
            <label className="block text-slate-300 text-[13px] font-medium mb-2.5">
              New password
            </label>
            <div className="relative group">
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••••" 
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
            {errors.password && <p className="text-rose-400 text-[13px] mt-1.5 flex items-center gap-1.5"><AlertCircle className="h-3.5 w-3.5"/> {errors.password.message}</p>}
          </motion.div>

          <motion.div variants={staggerVariants}>
            <button 
              type="submit" 
              disabled={loading} 
              className="w-full h-[50px] px-4 bg-[#22c55e] hover:bg-[#16a34a] active:scale-[0.98] disabled:bg-slate-700 disabled:text-slate-500 disabled:active:scale-100 text-white rounded-[12px] font-semibold text-[15px] transition-all flex items-center justify-center gap-2 mt-4 shadow-[0_0_30px_-5px_rgba(34,197,94,0.4)]"
            >
              {loading ? (
                <><Loader2 className="h-5 w-5 animate-spin" /> Saving password...</>
              ) : "Reset password"}
            </button>
          </motion.div>
        </form>
      )}
    </motion.div>
  );
}

export default function ResetPasswordPage() {
  return (
    <React.Suspense fallback={<div className="w-full flex justify-center py-12"><Loader2 className="h-8 w-8 text-emerald-500 animate-spin" /></div>}>
      <ResetPasswordForm />
    </React.Suspense>
  );
}
