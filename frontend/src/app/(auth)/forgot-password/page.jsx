"use client";
import React, { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import { KeyRound, ArrowLeft, Loader2, ShieldCheck, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

const forgotSchema = zod.object({
  email: zod.string().email("Invalid email address"),
});

const staggerVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [mockToken, setMockToken] = useState(null);
  const [error, setError] = useState(null);
  
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (data) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setMockToken(null);
    try {
      const response = await api.post("auth/forgot-password/", data);
      setSuccess(response.data.message || "Reset link instructions sent!");
      if (response.data.reset_token) {
        setMockToken(response.data.reset_token);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to process request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial="hidden" 
      animate="visible" 
      transition={{ staggerChildren: 0.08 }}
      className="w-full"
    >
      {/* Header */}
      <motion.div variants={staggerVariants} className="mb-8">
        <Link 
          href="/login" 
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-emerald-400 transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Login
        </Link>
        <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-5 border border-emerald-500/20 backdrop-blur-sm">
          <KeyRound className="h-6 w-6 text-emerald-400" />
        </div>
        <h2 className="text-3xl font-bold text-white tracking-tight mb-2">Reset Password</h2>
        <p className="text-slate-400 text-sm leading-relaxed">
          Enter your email and we will generate instructions to reset your password.
        </p>
      </motion.div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-start gap-3 backdrop-blur-md"
        >
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </motion.div>
      )}

      {success && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex flex-col gap-3 backdrop-blur-md"
        >
          <div className="flex items-start gap-3 font-medium">
            <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
          
          {mockToken && (
            <div className="bg-slate-900/50 p-3 rounded-xl border border-emerald-500/30 mt-2 shadow-sm">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Development Token</p>
              <code className="text-xs text-emerald-300 font-mono block select-all break-all bg-slate-950 p-2 rounded-lg border border-slate-800">{mockToken}</code>
              <div className="mt-4 flex justify-between items-center">
                <span className="text-[10px] text-slate-400 font-medium">Copy this token to complete reset:</span>
                <Link 
                  href={`/reset-password?email=${encodeURIComponent(localStorage.getItem("lastResetEmail") || "")}`} 
                  className="text-xs bg-emerald-600 text-white font-bold py-1.5 px-3 rounded-lg hover:bg-emerald-500 transition-colors shadow-sm"
                  onClick={() => {
                    const emailInput = document.getElementById("email-field")?.value;
                    if (emailInput) {
                      localStorage.setItem("lastResetEmail", emailInput);
                    }
                  }}
                >
                  Go to Reset Page
                </Link>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {!success && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <motion.div variants={staggerVariants}>
            <label className="block text-slate-300 text-[13px] font-medium mb-2.5">
              Email Address
            </label>
            <div className="relative group">
              <input 
                id="email-field"
                type="email" 
                placeholder="john@example.com" 
                {...register("email")} 
                className="w-full px-4 h-[50px] bg-white/[0.02] border border-white/10 rounded-[12px] text-white placeholder-slate-500 focus:outline-none focus:border-[#10b981] focus:bg-white/[0.04] transition-all text-[15px] backdrop-blur-md"
              />
            </div>
            {errors.email && <p className="text-rose-400 text-[13px] mt-1.5 flex items-center gap-1.5"><AlertCircle className="h-3.5 w-3.5"/> {errors.email.message}</p>}
          </motion.div>

          <motion.div variants={staggerVariants}>
            <button 
              type="submit" 
              disabled={loading} 
              className="w-full h-[50px] px-4 bg-[#22c55e] hover:bg-[#16a34a] active:scale-[0.98] disabled:bg-slate-700 disabled:text-slate-500 disabled:active:scale-100 text-white rounded-[12px] font-semibold text-[15px] transition-all flex items-center justify-center gap-2 mt-4 shadow-[0_0_30px_-5px_rgba(34,197,94,0.4)]"
            >
              {loading ? (
                <><Loader2 className="h-5 w-5 animate-spin" /> Processing...</>
              ) : "Generate Reset Token"}
            </button>
          </motion.div>
        </form>
      )}
    </motion.div>
  );
}
