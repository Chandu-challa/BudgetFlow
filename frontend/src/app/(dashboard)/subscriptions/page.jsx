"use client";
import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import { Plus, Trash2, Edit2, X, Loader2, AlertTriangle, CreditCard } from "lucide-react";
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

const subscriptionSchema = zod.object({
    name: zod.string().min(2, "Subscription name must be at least 2 characters"),
    amount: zod.coerce.number().min(0.01, "Amount must be greater than 0"),
    renewal_date: zod.string().min(1, "Renewal date is required"),
    frequency: zod.string().min(1, "Please select frequency"),
});

export default function SubscriptionsPage() {
    const { user } = useAuth();
    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    // Modal
    const [modalOpen, setModalOpen] = useState(false);
    const [editingSubscription, setEditingSubscription] = useState(null);
    const [formError, setFormError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const { register, handleSubmit, reset, formState: { errors }, } = useForm({
        resolver: zodResolver(subscriptionSchema),
    });
    
    const fetchSubscriptions = async () => {
        setLoading(true);
        try {
            const response = await api.get("subscriptions/");
            setSubscriptions(response.data.results || response.data);
        }
        catch (error) {
            console.error("Error loading subscriptions", error);
        }
        finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        fetchSubscriptions();
    }, []);
    
    const handleOpenAddModal = () => {
        setEditingSubscription(null);
        setFormError(null);
        reset({
            name: "",
            amount: 0,
            renewal_date: new Date().toISOString().split("T")[0],
            frequency: "Monthly",
        });
        setModalOpen(true);
    };
    
    const handleOpenEditModal = (sub) => {
        setEditingSubscription(sub);
        setFormError(null);
        reset({
            name: sub.name,
            amount: parseFloat(sub.amount),
            renewal_date: sub.renewal_date,
            frequency: sub.frequency,
        });
        setModalOpen(true);
    };
    
    const onSubmit = async (data) => {
        setSubmitting(true);
        setFormError(null);
        try {
            if (editingSubscription) {
                await api.put(`subscriptions/${editingSubscription.id}/`, data);
            }
            else {
                await api.post("subscriptions/", data);
            }
            setModalOpen(false);
            fetchSubscriptions();
        }
        catch (error) {
            setFormError(error.response?.data?.detail || "Failed to save subscription.");
        }
        finally {
            setSubmitting(false);
        }
    };
    
    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this subscription entry?"))
            return;
        try {
            await api.delete(`subscriptions/${id}/`);
            fetchSubscriptions();
        }
        catch (error) {
            console.error("Error deleting subscription", error);
        }
    };
    
    // Calculate monthly subscription costs
    const calculateTotalMonthlyCost = () => {
        let total = 0;
        subscriptions.forEach((sub) => {
            const amt = parseFloat(sub.amount);
            if (sub.frequency === "Weekly") {
                total += amt * 4.33;
            }
            else if (sub.frequency === "Monthly") {
                total += amt;
            }
            else if (sub.frequency === "Yearly") {
                total += amt / 12;
            }
        });
        return total;
    };
    
    // Check if renewal is due in next 7 days
    const isRenewalSoon = (dateStr) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const renewal = new Date(dateStr);
        renewal.setHours(0, 0, 0, 0);
        const diffTime = renewal.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 7;
    };
    
    return (<motion.div 
      className="space-y-6 w-full flex flex-col h-[calc(100vh-8rem)]"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Subscriptions Tracker</h2>
          <p className="text-muted-foreground text-sm">Control recurring memberships, streaming packages, and renewals.</p>
        </div>
        <button onClick={handleOpenAddModal} className="py-2.5 px-4 bg-primary text-white rounded-xl font-semibold text-xs flex items-center gap-2 hover:bg-primary/95 shadow-md shadow-primary/25 cursor-pointer">
          <Plus className="h-4 w-4"/> Add Subscription
        </button>
      </motion.div>

      {/* Aggregate Stats Card */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm md:col-span-1 flex items-center gap-4">
          <div className="p-3 bg-primary/10 text-primary rounded-2xl">
            <CreditCard className="h-6 w-6"/>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Monthly Spend</span>
            <h3 className="text-xl font-bold">{formatCurrency(calculateTotalMonthlyCost(), user?.currency)}</h3>
          </div>
        </div>

        {/* Warning panel if renewals are due soon */}
        {subscriptions.some((sub) => isRenewalSoon(sub.renewal_date)) && (<div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 shadow-sm md:col-span-2 flex items-center gap-4 text-amber-500">
            <div className="p-3 bg-amber-500/15 text-amber-500 rounded-2xl">
              <AlertTriangle className="h-6 w-6"/>
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider block">Upcoming Renewals</span>
              <p className="text-xs text-muted-foreground mt-0.5">
                Some subscriptions are renewing within the next 7 days! Make sure your wallets are funded.
              </p>
            </div>
          </div>)}
      </motion.div>

      {/* List */}
      <motion.div variants={itemVariants} className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex-1 flex flex-col min-h-0">
        {loading ? (<div className="py-20 text-center flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 text-primary animate-spin"/>
            <span className="text-sm text-muted-foreground">Loading subscriptions...</span>
          </div>) : subscriptions.length === 0 ? (<div className="bg-card p-12 text-center max-w-md mx-auto flex flex-col items-center gap-2">
            <CreditCard className="h-10 w-10 text-slate-600 mb-2"/>
            <h3 className="text-md font-bold">No Subscriptions Tracked</h3>
            <p className="text-xs text-muted-foreground">
              You are currently not tracking any recurring services like Netflix, Gym, or SaaS tools.
            </p>
          </div>) : (<div className="flex-1 overflow-auto scrollbar-thin">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 z-10 bg-secondary/95 backdrop-blur-md shadow-sm">
                <tr className="border-b border-border text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  <th className="px-4 py-2.5">Service Name</th>
                  <th className="px-4 py-2.5">Billing Cycle</th>
                  <th className="px-4 py-2.5">Amount</th>
                  <th className="px-4 py-2.5">Renewal Date</th>
                  <th className="px-4 py-2.5">Alert</th>
                  <th className="px-4 py-2.5 text-right sticky right-0 bg-secondary/95 backdrop-blur-md z-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {subscriptions.map((sub) => {
                const soon = isRenewalSoon(sub.renewal_date);
                return (<tr key={sub.id} className="hover:bg-secondary/40 transition-colors group">
                      <td className="px-4 py-2 font-semibold text-foreground">{sub.name}</td>
                      <td className="px-4 py-2">
                        <span className="inline-block py-0.5 px-2 bg-secondary text-foreground text-[10px] font-semibold rounded-md border border-border/50">
                          {sub.frequency}
                        </span>
                      </td>
                      <td className="px-4 py-2 font-bold text-primary">
                        {formatCurrency(parseFloat(sub.amount), user?.currency)}
                      </td>
                      <td className="px-4 py-2 font-medium text-slate-500">
                        {new Date(sub.renewal_date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2">
                        {soon ? (<span className="inline-flex items-center gap-1 py-0.5 px-2 bg-amber-500/10 text-amber-500 text-[10px] font-bold rounded-lg border border-amber-500/20 uppercase">
                            Due soon
                          </span>) : (<span className="text-slate-500">-</span>)}
                      </td>
                      <td className="px-4 py-2 text-right sticky right-0 bg-background/95 backdrop-blur-md z-10 group-hover:bg-secondary/40">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => handleOpenEditModal(sub)} className="p-1.5 rounded-md text-slate-500 hover:text-foreground hover:bg-secondary cursor-pointer" title="Edit">
                            <Edit2 className="h-3.5 w-3.5"/>
                          </button>
                          <button onClick={() => handleDelete(sub.id)} className="p-1.5 rounded-md text-slate-500 hover:text-destructive hover:bg-destructive/10 cursor-pointer" title="Delete">
                            <Trash2 className="h-3.5 w-3.5"/>
                          </button>
                        </div>
                      </td>
                    </tr>);
            })}
              </tbody>
            </table>
          </div>)}
      </motion.div>

      {/* MODAL */}
      <AnimatePresence>
      {modalOpen && (<div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-card border border-border w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative"
          >
            <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-card">
              <h3 className="text-lg font-bold">
                {editingSubscription ? "Edit Subscription" : "New Subscription"}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-500 hover:text-foreground cursor-pointer">
                <X className="h-5 w-5"/>
              </button>
            </div>

            {formError && (<div className="mx-6 mt-4 p-3 bg-red-950/40 border border-red-900/50 rounded-xl text-red-200 text-xs font-medium">
                {formError}
              </div>)}

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Service Name
                </label>
                <input type="text" placeholder="e.g. Netflix, Spotify" {...register("name")} className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:border-primary text-foreground" autoFocus/>
                {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Amount ({user?.currency})
                  </label>
                  <input type="number" step="0.01" placeholder="0.00" {...register("amount")} className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:border-primary text-foreground"/>
                  {errors.amount && <p className="text-red-400 text-xs mt-1">{errors.amount.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Billing Cycle
                  </label>
                  <select {...register("frequency")} className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:border-primary text-foreground">
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Yearly">Yearly</option>
                  </select>
                  {errors.frequency && <p className="text-red-400 text-xs mt-1">{errors.frequency.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Next Renewal Date
                </label>
                <input type="date" {...register("renewal_date")} className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:border-primary text-foreground"/>
                {errors.renewal_date && <p className="text-red-400 text-xs mt-1">{errors.renewal_date.message}</p>}
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-border">
                <button type="button" onClick={() => setModalOpen(false)} className="py-2.5 px-4 bg-secondary hover:bg-border text-foreground rounded-xl text-xs font-semibold transition-colors cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="py-2.5 px-5 bg-primary hover:bg-primary/95 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-md shadow-primary/20">
                  {submitting ? (<>
                      <Loader2 className="h-4.5 w-4.5 animate-spin"/> Saving...
                    </>) : ("Save Subscription")}
                </button>
              </div>
            </form>
          </motion.div>
        </div>)}
        </AnimatePresence>
    </motion.div>);
}
