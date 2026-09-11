"use client";
import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import { User, Mail, Coins, Landmark, Upload, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

const profileSchema = zod.object({
    name: zod.string().min(2, "Name must be at least 2 characters"),
    email: zod.string().email("Invalid email address"),
    currency: zod.string().min(1, "Please select currency"),
    monthly_income: zod.coerce.number().min(0, "Income must be 0 or positive"),
});
export default function ProfilePage() {
    const { user, updateProfile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);
    const [fileToUpload, setFileToUpload] = useState(null);
    const { register, handleSubmit, formState: { errors }, } = useForm({
        resolver: zodResolver(profileSchema),
        values: {
            name: user?.name || "",
            email: user?.email || "",
            currency: user?.currency || "USD",
            monthly_income: user?.monthly_income || 0,
        }
    });
    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setFileToUpload(e.target.files[0]);
        }
    };
    const onSubmit = async (data) => {
        setLoading(true);
        setError(null);
        setSuccess(false);
        try {
            const formData = new FormData();
            formData.append("name", data.name);
            formData.append("email", data.email);
            formData.append("currency", data.currency);
            formData.append("monthly_income", data.monthly_income.toString());
            if (fileToUpload) {
                formData.append("profile_image", fileToUpload);
            }
            await updateProfile(formData);
            setSuccess(true);
            setFileToUpload(null);
            setTimeout(() => setSuccess(false), 4000);
        }
        catch (error) {
            const err = error;
            setError(err.message || "Failed to update profile settings.");
        }
        finally {
            setLoading(false);
        }
    };
    return (
      <motion.div 
        className="space-y-6 w-full max-w-2xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
      <motion.div variants={itemVariants}>
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Profile Settings</h2>
        <p className="text-muted-foreground text-sm">Manage personal configurations and defaults.</p>
      </motion.div>

      <motion.div variants={itemVariants} className="bg-card border border-border rounded-3xl p-8 shadow-sm">
        {success && (<div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="h-4.5 w-4.5"/>
            <span>Profile settings updated successfully!</span>
          </div>)}

        {error && (<div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="h-4.5 w-4.5"/>
            <span>{error}</span>
          </div>)}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-border">
            <div className="w-24 h-24 rounded-3xl bg-primary/10 border border-primary/20 overflow-hidden flex items-center justify-center relative font-bold text-4xl text-primary shadow-inner">
              {user?.profile_image ? (<img src={user.profile_image} alt="Profile" className="w-full h-full object-cover"/>) : (user?.name ? user.name.charAt(0) : user?.username.charAt(0))}
            </div>
            
            <div className="flex-1 text-center sm:text-left space-y-2">
              <h3 className="font-bold text-sm text-foreground">Avatar Image</h3>
              <p className="text-xs text-muted-foreground">Select a custom JPEG or PNG profile picture.</p>
              
              <div className="relative inline-block">
                <button type="button" className="py-2 px-3 bg-secondary hover:bg-border border border-border rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer">
                  <Upload className="h-3.5 w-3.5"/> {fileToUpload ? fileToUpload.name : "Select Image"}
                </button>
                <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 w-full cursor-pointer"/>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="h-4.5 w-4.5 text-slate-500"/>
                </span>
                <input type="text" placeholder="John Doe" {...register("name")} className="w-full pl-11 pr-4 py-2.5 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:border-primary text-foreground"/>
              </div>
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-4.5 w-4.5 text-slate-500"/>
                </span>
                <input type="email" placeholder="john@example.com" {...register("email")} className="w-full pl-11 pr-4 py-2.5 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:border-primary text-foreground"/>
              </div>
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Workspace Currency
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Coins className="h-4.5 w-4.5 text-slate-500"/>
                </span>
                <select {...register("currency")} className="w-full pl-11 pr-4 py-2.5 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:border-primary text-foreground appearance-none">
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="INR">INR (₹)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="CAD">CAD (C$)</option>
                  <option value="AUD">AUD (A$)</option>
                </select>
              </div>
              {errors.currency && <p className="text-red-400 text-xs mt-1">{errors.currency.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Default Monthly Income
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Landmark className="h-4.5 w-4.5 text-slate-500"/>
                </span>
                <input type="number" step="0.01" placeholder="5000.00" {...register("monthly_income")} className="w-full pl-11 pr-4 py-2.5 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:border-primary text-foreground"/>
              </div>
              {errors.monthly_income && <p className="text-red-400 text-xs mt-1">{errors.monthly_income.message}</p>}
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-border">
            <button type="submit" disabled={loading} className="py-2.5 px-6 bg-primary text-white rounded-xl font-semibold text-xs flex items-center gap-1.5 hover:bg-primary/95 transition-all shadow-md shadow-primary/20 cursor-pointer">
              {loading ? (<>
                  <Loader2 className="h-4 w-4 animate-spin"/> Saving Changes...
                </>) : ("Save Profile Settings")}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>);
}
