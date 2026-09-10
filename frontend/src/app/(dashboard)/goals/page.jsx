"use client";
import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import { Plus, Trash2, X, Loader2, PiggyBank, TrendingUp, CheckCircle2 } from "lucide-react";
const goalSchema = zod.object({
    name: zod.string().min(2, "Goal Name must be at least 2 characters"),
    target_amount: zod.coerce.number().min(0.01, "Target amount must be greater than 0"),
    current_amount: zod.coerce.number().min(0, "Current amount must be 0 or positive"),
    deadline: zod.string().min(1, "Deadline date is required"),
});
export default function SavingsGoalsPage() {
    const { user } = useAuth();
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    // Modals
    const [modalOpen, setModalOpen] = useState(false);
    const [contribModalOpen, setContribModalOpen] = useState(false);
    const [selectedGoal, setSelectedGoal] = useState(null);
    const [formError, setFormError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [contributionAmount, setContributionAmount] = useState("");
    const { register, handleSubmit, reset, formState: { errors }, } = useForm({
        resolver: zodResolver(goalSchema),
    });
    const fetchGoals = async () => {
        setLoading(true);
        try {
            const response = await api.get("savings-goals/");
            setGoals(response.data.results || response.data);
        }
        catch (error) {
            const err = error;
            console.error("Error fetching savings goals", err);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchGoals();
    }, []);
    const handleOpenAddModal = () => {
        setFormError(null);
        reset({
            name: "",
            target_amount: 0,
            current_amount: 0,
            deadline: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 6 months default
        });
        setModalOpen(true);
    };
    const onSubmit = async (data) => {
        setSubmitting(true);
        setFormError(null);
        try {
            await api.post("savings-goals/", data);
            setModalOpen(false);
            fetchGoals();
        }
        catch (error) {
            const err = error;
            setFormError(err.response?.data?.detail || "Failed to create savings goal.");
        }
        finally {
            setSubmitting(false);
        }
    };
    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this savings goal?"))
            return;
        try {
            await api.delete(`savings-goals/${id}/`);
            fetchGoals();
        }
        catch (error) {
            const err = error;
            console.error("Error deleting goal", err);
        }
    };
    const handleOpenContrib = (goal) => {
        setSelectedGoal(goal);
        setContributionAmount("");
        setContribModalOpen(true);
    };
    const handleSaveContribution = async (e) => {
        e.preventDefault();
        if (!contributionAmount || isNaN(parseFloat(contributionAmount))) {
            alert("Please enter a valid amount");
            return;
        }
        setSubmitting(true);
        try {
            await api.post(`savings-goals/${selectedGoal.id}/contribute/`, {
                amount: parseFloat(contributionAmount),
            });
            setContribModalOpen(false);
            fetchGoals();
        }
        catch (error) {
            const err = error;
            console.error("Failed to add contribution", err);
        }
        finally {
            setSubmitting(false);
        }
    };
    return (<div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Savings Goals</h2>
          <p className="text-muted-foreground text-sm">Define asset funds and track your savings trajectories.</p>
        </div>
        <button onClick={handleOpenAddModal} className="py-2.5 px-4 bg-primary text-white rounded-xl font-semibold text-xs flex items-center gap-2 hover:bg-primary/95 shadow-md shadow-primary/25 cursor-pointer">
          <Plus className="h-4 w-4"/> Add Goal
        </button>
      </div>

      {loading ? (<div className="py-20 text-center flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 text-primary animate-spin"/>
          <span className="text-sm text-muted-foreground">Loading savings goals...</span>
        </div>) : goals.length === 0 ? (<div className="bg-card border border-border rounded-3xl p-12 text-center max-w-xl mx-auto flex flex-col items-center gap-3">
          <PiggyBank className="h-12 w-12 text-slate-600 mb-2"/>
          <h3 className="text-lg font-bold">No Active Savings Goals</h3>
          <p className="text-xs text-muted-foreground">
            You don&apos;t have any active savings goals (like Emergency Fund, Vacation, or Car purchase) created yet.
          </p>
          <button onClick={handleOpenAddModal} className="py-2.5 px-4 bg-primary text-white rounded-xl font-semibold text-xs mt-3 hover:bg-primary/95 cursor-pointer">
            Create New Savings Goal
          </button>
        </div>) : (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((g) => {
                const isCompleted = g.current_amount >= g.target_amount;
                const pct = Math.min(g.progress_percentage || 0, 100);
                return (<div key={g.id} className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4 hover:shadow-md transition-all relative overflow-hidden">
                {isCompleted && (<div className="absolute top-0 right-0 bg-emerald-500 text-white py-1 px-3 rounded-bl-xl text-[9px] font-bold uppercase tracking-widest flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3"/> Reached
                  </div>)}

                {/* Header */}
                <div className="flex justify-between items-start pr-12">
                  <div>
                    <h3 className="font-bold text-sm tracking-tight truncate max-w-37.5">{g.name}</h3>
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold">Target Deadline: {new Date(g.deadline).toLocaleDateString()}</span>
                  </div>
                  <button onClick={() => handleDelete(g.id)} className="p-1.5 rounded-lg text-slate-500 hover:text-destructive hover:bg-destructive/10 transition-colors absolute top-4 right-4 cursor-pointer" title="Delete">
                    <Trash2 className="h-4 w-4"/>
                  </button>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${isCompleted ? "bg-emerald-500" : "bg-primary"}`} style={{ width: `${pct}%` }}/>
                  </div>
                  <div className="flex justify-between text-[11px] font-semibold text-slate-500">
                    <span>{pct}% Completed</span>
                    <span>{formatCurrency(g.target_amount - g.current_amount <= 0 ? 0 : g.target_amount - g.current_amount, user?.currency)} remaining</span>
                  </div>
                </div>

                {/* Grid info */}
                <div className="grid grid-cols-2 gap-4 border-t border-border pt-4 text-xs font-semibold">
                  <div>
                    <span className="text-slate-400 text-[10px] block uppercase">Current Saved</span>
                    <span className="text-sm text-foreground">{formatCurrency(g.current_amount, user?.currency)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 text-[10px] block uppercase">Target Goal</span>
                    <span className="text-sm text-foreground">{formatCurrency(g.target_amount, user?.currency)}</span>
                  </div>
                </div>

                {/* Action button */}
                {!isCompleted && (<button onClick={() => handleOpenContrib(g)} className="w-full mt-3 flex items-center justify-center gap-1.5 py-2 px-3 bg-secondary hover:bg-primary hover:text-white rounded-xl text-xs font-semibold transition-all cursor-pointer border border-border hover:border-primary">
                    <TrendingUp className="h-3.5 w-3.5"/> Save Contribution
                  </button>)}
              </div>);
            })}
        </div>)}

      {/* CREATE GOAL MODAL */}
      {modalOpen && (<div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-card border border-border w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-card">
              <h3 className="text-lg font-bold">Log Savings Target</h3>
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
                  Savings Goal Name
                </label>
                <input type="text" placeholder="e.g. Emergency Fund, New Laptop" {...register("name")} className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:border-primary text-foreground"/>
                {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Target Goal Amount
                  </label>
                  <input type="number" step="0.01" placeholder="0.00" {...register("target_amount")} className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:border-primary text-foreground"/>
                  {errors.target_amount && <p className="text-red-400 text-xs mt-1">{errors.target_amount.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Starting Amount
                  </label>
                  <input type="number" step="0.01" placeholder="0.00" {...register("current_amount")} className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:border-primary text-foreground"/>
                  {errors.current_amount && <p className="text-red-400 text-xs mt-1">{errors.current_amount.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Deadline Date
                </label>
                <input type="date" {...register("deadline")} className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:border-primary text-foreground"/>
                {errors.deadline && <p className="text-red-400 text-xs mt-1">{errors.deadline.message}</p>}
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-border">
                <button type="button" onClick={() => setModalOpen(false)} className="py-2.5 px-4 bg-secondary hover:bg-border text-foreground rounded-xl text-xs font-semibold transition-colors cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="py-2.5 px-5 bg-primary hover:bg-primary/95 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-md shadow-primary/20">
                  {submitting ? (<>
                      <Loader2 className="h-4.5 w-4.5 animate-spin"/> Saving...
                    </>) : ("Save Goal")}
                </button>
              </div>
            </form>
          </div>
        </div>)}

      {/* CONTRIBUTION MODAL */}
      {contribModalOpen && (<div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-card border border-border w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl relative">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-card">
              <h3 className="text-sm font-bold">Add Savings to: {selectedGoal?.name}</h3>
              <button onClick={() => setContribModalOpen(false)} className="text-slate-500 hover:text-foreground cursor-pointer">
                <X className="h-5 w-5"/>
              </button>
            </div>

            <form onSubmit={handleSaveContribution} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Contribution Amount ({user?.currency})
                </label>
                <input type="number" step="0.01" placeholder="0.00" value={contributionAmount} onChange={(e) => setContributionAmount(e.target.value)} className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:border-primary text-foreground" autoFocus/>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-border">
                <button type="button" onClick={() => setContribModalOpen(false)} className="py-2.5 px-4 bg-secondary hover:bg-border text-foreground rounded-xl text-xs font-semibold transition-colors cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/20">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin"/> : "Save Money"}
                </button>
              </div>
            </form>
          </div>
        </div>)}
    </div>);
}
