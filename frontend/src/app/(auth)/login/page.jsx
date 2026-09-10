"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import { Eye, EyeOff, Loader2, AlertCircle, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const loginSchema = zod.object({
  username: zod.string().min(3, "Username or Email must be at least 3 characters"),
  password: zod.string().min(6, "Password must be at least 6 characters"),
});

const staggerVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

export default function LoginPage() {
  const { login, loading } = useAuth();
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    setError(null);
    try {
      await login(data.username, data.password);
    } catch (err) {
      setError(err.message || "Incorrect username or password.");
    }
  };

  return (
    <motion.div 
      initial="hidden" 
      animate="visible" 
      transition={{ staggerChildren: 0.05 }}
      className="w-full font-sans"
    >
      {/* Brand Block */}
      <motion.div variants={staggerVariants} className="mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#141b2c]/80 border border-white/5 text-white text-sm font-bold tracking-tight mb-6 backdrop-blur-sm">
          <span className="text-[#10b981] text-lg leading-none">◈</span> BudgetFlow
        </div>
        <h1 className="text-[36px] font-bold text-white tracking-tight leading-tight">
          Welcome back
        </h1>
        <p className="text-slate-400 text-[15px] mt-2 font-medium">
          Good to see you again. Sign in to continue<br/>managing your finances.
        </p>
      </motion.div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-start gap-3 backdrop-blur-sm"
        >
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-rose-400" />
          <span className="font-medium">{error}</span>
        </motion.div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <motion.div variants={staggerVariants}>
          <label className="block text-slate-300 text-[13px] font-medium mb-2.5">
            Email or username
          </label>
          <div className="relative group">
            <input 
              type="text" 
              placeholder="Challa Chandu" 
              {...register("username")} 
              className="w-full px-4 h-12.5 bg-white/2 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#10b981] focus:bg-white/4 transition-all text-[15px] backdrop-blur-md"
            />
          </div>
          {errors.username && <p className="text-rose-400 text-[13px] mt-1.5 flex items-center gap-1.5"><AlertCircle className="h-3.5 w-3.5"/> {errors.username.message}</p>}
        </motion.div>

        <motion.div variants={staggerVariants}>
          <label className="block text-slate-300 text-[13px] font-medium mb-2.5">
            Password
          </label>
          <div className="relative group">
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="••••••••••" 
              {...register("password")} 
              className="w-full px-4 pr-12 h-12.5 bg-white/2 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#10b981] focus:bg-white/4 transition-all text-[15px] backdrop-blur-md"
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

        <motion.div variants={staggerVariants} className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2.5 cursor-pointer group">
            <div className="relative flex items-center justify-center">
              <input type="checkbox" className="peer sr-only" />
              <div className="w-4.5 h-4.5 border border-white/20 rounded-full peer-checked:bg-[#10b981] peer-checked:border-[#10b981] transition-colors bg-white/2 backdrop-blur-sm"></div>
              <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" viewBox="0 0 14 10" fill="none">
                <path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-[14px] text-slate-400 group-hover:text-slate-300 transition-colors">Remember me</span>
          </label>
          <Link href="/forgot-password" className="text-[14px] text-[#10b981] hover:text-emerald-400 transition-colors font-medium">
            Forgot password?
          </Link>
        </motion.div>

        <motion.div variants={staggerVariants}>
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full h-12.5 px-4 bg-[#22c55e] hover:bg-[#16a34a] active:scale-[0.98] disabled:bg-slate-700 disabled:text-slate-500 disabled:active:scale-100 text-white rounded-xl font-semibold text-[15px] transition-all flex items-center justify-center gap-2 mt-4 shadow-[0_0_30px_-5px_rgba(34,197,94,0.4)]"
          >
            {loading ? (
              <><Loader2 className="h-5 w-5 animate-spin" /> Signing you in...</>
            ) : (
              <>Sign in <ArrowRight className="h-4 w-4 ml-1" /></>
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
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-semibold text-[#10b981] hover:text-emerald-400 transition-colors">
          Create account
        </Link>
      </motion.p>
    </motion.div>
  );
}
