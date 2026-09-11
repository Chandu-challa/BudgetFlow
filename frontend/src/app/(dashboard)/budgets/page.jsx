"use client";
import React, { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import { Plus, Trash2, Calendar, X, Loader2, PiggyBank } from "lucide-react";
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

const budgetSchema = zod.object({
  budget_type: zod.string().min(1, "Please select budget type"),
  period: zod.string().min(1, "Please select period"),
  category: zod.string().optional(),
  budget_amount: zod.coerce.number().min(0.01, "Amount must be greater than 0"),
});

export default function BudgetsPage() {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Date Filter
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split("T")[0]);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formBudgetType, setFormBudgetType] = useState("Category");

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      budget_type: "Category",
      period: "Monthly",
      budget_amount: 0,
    }
  });

  const fetchCategories = async () => {
    try {
      const response = await api.get("categories/");
      setCategories(response.data.results || response.data);
    } catch (error) {
      console.error("Error fetching categories", error);
    }
  };

  const fetchBudgets = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("budgets/compare/", {
        params: { target_date: targetDate },
      });
      setBudgets(response.data);
    } catch (error) {
      console.error("Error loading budgets", error);
    } finally {
      setLoading(false);
    }
  }, [targetDate]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets, targetDate]);

  const handleOpenAddModal = () => {
    setFormError(null);
    setFormBudgetType("Category");
    reset({
      budget_type: "Category",
      period: "Monthly",
      category: "",
      budget_amount: 0,
    });
    setModalOpen(true);
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    setFormError(null);
    const payload = {
      budget_type: data.budget_type,
      budget_amount: data.budget_amount,
      period: data.period,
      category: data.budget_type === "Fixed" ? null : data.category || null,
      month: null, // Makes this a recurring generic budget
      year: null,
    };
    
    if (data.budget_type === "Category" && !data.category) {
      setFormError("Category is required for Category-specific budgets.");
      setSubmitting(false);
      return;
    }
    
    try {
      await api.post("budgets/", payload);
      setModalOpen(false);
      fetchBudgets();
    } catch (error) {
      setFormError(error.response?.data?.non_field_errors?.[0] || "Failed to create budget.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this budget entry?")) return;
    try {
      await api.delete(`budgets/${id}/`);
      fetchBudgets();
    } catch (error) {
      console.error("Error deleting budget", error);
    }
  };

  return (
    <motion.div 
      className="space-y-6 w-full"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
            Budget Planning
          </h2>
          <p className="text-muted-foreground text-sm">
            Set daily, monthly, or yearly spending boundaries.
          </p>
        </div>
        <button onClick={handleOpenAddModal} className="py-2.5 px-4 bg-primary text-white rounded-xl font-semibold text-xs flex items-center gap-2 hover:bg-primary/95 shadow-md cursor-pointer">
          <Plus className="h-4 w-4"/> Create Budget
        </button>
      </motion.div>

      <motion.div variants={itemVariants} className="bg-card border border-border rounded-2xl p-4 shadow-sm flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <Calendar className="h-4.5 w-4.5 text-slate-500"/>
          <span className="text-sm font-semibold text-muted-foreground">
            View status for date:
          </span>
        </div>
        <input 
          type="date" 
          value={targetDate} 
          onChange={(e) => setTargetDate(e.target.value)} 
          className="px-3.5 py-2 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:border-primary text-foreground"
        />
        <span className="text-xs text-muted-foreground max-w-sm ml-2">
          (Shows utilization for that exact day for Daily budgets, that month for Monthly budgets, etc.)
        </span>
      </motion.div>

      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 text-primary animate-spin"/>
          <span className="text-sm text-muted-foreground">Loading budgets...</span>
        </div>
      ) : budgets.length === 0 ? (
        <motion.div variants={itemVariants} className="bg-card border border-border rounded-3xl p-12 text-center max-w-xl mx-auto flex flex-col items-center gap-3">
          <PiggyBank className="h-12 w-12 text-slate-600 mb-2"/>
          <h3 className="text-lg font-bold">No Active Budgets</h3>
          <p className="text-xs text-muted-foreground">
            You haven&apos;t set any limits yet. Set a daily or monthly budget to start tracking!
          </p>
          <button onClick={handleOpenAddModal} className="py-2.5 px-4 bg-primary text-white rounded-xl font-semibold text-xs mt-3 hover:bg-primary/95 cursor-pointer">
            Create Budget Limit
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {budgets.map((b) => {
            const isOver = b.actual_amount > b.budget_amount;
            const pct = Math.min(b.utilization_pct, 100);
            return (
              <motion.div variants={itemVariants} key={b.id} className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4 hover:shadow-md transition-all">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-sm tracking-tight truncate max-w-37.5">
                      {b.category}
                    </h3>
                    <span className="text-[10px] text-primary uppercase tracking-widest font-bold">
                      {b.period} • {b.budget_type}
                    </span>
                  </div>
                  <button onClick={() => handleDelete(b.id)} className="p-1.5 rounded-lg text-slate-500 hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer" title="Delete">
                    <Trash2 className="h-4 w-4"/>
                  </button>
                </div>

                <div className="space-y-1.5">
                  <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${isOver ? "bg-destructive" : b.utilization_pct >= 80 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${pct}%` }}/>
                  </div>
                  <div className="flex justify-between text-[11px] font-semibold text-slate-500">
                    <span>{b.utilization_pct}% Utilized</span>
                    <span className={isOver ? "text-destructive font-bold" : ""}>
                      {isOver ? "Over budget" : `${formatCurrency(b.remaining, user?.currency)} left`}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-border pt-4 text-xs font-semibold">
                  <div>
                    <span className="text-slate-400 text-[10px] block uppercase">Limit ({b.period})</span>
                    <span className="text-foreground text-sm">{formatCurrency(b.budget_amount, user?.currency)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 text-[10px] block uppercase">Actual spent</span>
                    <span className="text-sm text-foreground">{formatCurrency(b.actual_amount, user?.currency)}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-card border border-border w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-card">
              <h3 className="text-lg font-bold">Configure Budget</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-500 hover:text-foreground cursor-pointer">
                <X className="h-5 w-5"/>
              </button>
            </div>

            {formError && (
              <div className="mx-6 mt-4 p-3 bg-red-950/40 border border-red-900/50 rounded-xl text-red-200 text-xs font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Period</label>
                  <select {...register("period")} className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:border-primary text-foreground">
                    <option value="Daily">Daily</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Yearly">Yearly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Type</label>
                  <select {...register("budget_type")} onChange={(e) => { setValue("budget_type", e.target.value); setFormBudgetType(e.target.value); }} className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:border-primary text-foreground">
                    <option value="Category">Category Limit</option>
                    <option value="Fixed">Overall Fixed Limit</option>
                  </select>
                </div>
              </div>

              {formBudgetType === "Category" && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Category</label>
                  <select {...register("category")} className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:border-primary text-foreground">
                    <option value="">Select Category</option>
                    {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                  </select>
                  {errors.category && <p className="text-red-400 text-xs mt-1">{errors.category.message}</p>}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Budget Amount ({user?.currency})</label>
                <input type="number" step="0.01" placeholder="0.00" {...register("budget_amount")} className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:border-primary text-foreground"/>
                {errors.budget_amount && <p className="text-red-400 text-xs mt-1">{errors.budget_amount.message}</p>}
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-border">
                <button type="button" onClick={() => setModalOpen(false)} className="py-2.5 px-4 bg-secondary hover:bg-border text-foreground rounded-xl text-xs font-semibold transition-colors cursor-pointer">Cancel</button>
                <button type="submit" disabled={submitting} className="py-2.5 px-5 bg-primary hover:bg-primary/95 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-md shadow-primary/20">
                  {submitting ? <><Loader2 className="h-4.5 w-4.5 animate-spin"/> Saving...</> : "Save Budget"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
}
