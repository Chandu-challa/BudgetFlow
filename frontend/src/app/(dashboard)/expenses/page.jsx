"use client";
import React, { useState, useEffect } from "react";
import { api, API_BASE_URL } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import { Search, Plus, Trash2, Edit2, Download, Calendar, X, Loader2, ChevronLeft, ChevronRight, Upload, Paperclip, Copy, TrendingUp, BarChart3, CreditCard } from "lucide-react";
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

const expenseSchema = zod.object({
  name: zod.string().min(2, "Name must be at least 2 characters"),
  amount: zod.coerce.number().min(0.01, "Amount must be greater than 0"),
  category: zod.string().min(1, "Please select a category"),
  payment_method: zod.string().min(1, "Please select payment method"),
  date: zod.string().min(1, "Date is required"),
  notes: zod.string().optional(),
});

export default function ExpensesPage() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering & Pagination
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  // Stats
  const [stats, setStats] = useState({ total_spent: 0, top_category: "N/A", avg_daily_spend: 0 });

  // Selection
  const [selectedIds, setSelectedIds] = useState([]);
  
  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [fileToUpload, setFileToUpload] = useState(null);
  
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(expenseSchema),
  });

  const fetchCategories = async () => {
    try {
      const response = await api.get("categories/");
      setCategories(response.data.results || response.data);
    } catch (error) {
      console.error("Error loading categories", error);
    }
  };

  const fetchExpensesAndStats = async () => {
    setLoading(true);
    try {
      const params = {
        page, search, category: selectedCategory, payment_method: paymentMethod,
        start_date: startDate, end_date: endDate,
      };
      
      const [expenseRes, statsRes] = await Promise.all([
        api.get("expenses/", { params }),
        api.get("expenses/stats/", { params })
      ]);

      setExpenses(expenseRes.data.results || expenseRes.data);
      setStats(statsRes.data);
      
      const count = expenseRes.data.count || expenseRes.data.length || 0;
      setTotalCount(count);
      setTotalPages(Math.ceil(count / 10) || 1);
    } catch (error) {
      console.error("Error fetching data", error);
    } finally {
      setLoading(false);
    }
  };

  const [budgets, setBudgets] = useState([]);
  
  const fetchBudgets = async () => {
    try {
      const response = await api.get("budgets/compare/", {
        params: { target_date: startDate || new Date().toISOString().split("T")[0] },
      });
      setBudgets(response.data);
    } catch (error) {
      console.error("Error loading budgets", error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchExpensesAndStats();
    fetchBudgets();
    setSelectedIds([]); // clear selection on filters change
  }, [page, search, selectedCategory, paymentMethod, startDate, endDate]);

  const handleOpenAddModal = (duplicateExpense = null) => {
    setEditingExpense(null);
    setFormError(null);
    setFileToUpload(null);
    if (duplicateExpense) {
      reset({
        name: duplicateExpense.name,
        amount: parseFloat(duplicateExpense.amount),
        category: duplicateExpense.category.toString(),
        payment_method: duplicateExpense.payment_method,
        date: new Date().toISOString().split("T")[0],
        notes: duplicateExpense.notes,
      });
    } else {
      reset({
        name: "",
        amount: 0,
        category: "",
        payment_method: "Cash",
        date: new Date().toISOString().split("T")[0],
        notes: "",
      });
    }
    setModalOpen(true);
  };

  const handleOpenEditModal = (expense) => {
    setEditingExpense(expense);
    setFormError(null);
    setFileToUpload(null);
    reset({
      name: expense.name,
      amount: parseFloat(expense.amount),
      category: expense.category.toString(),
      payment_method: expense.payment_method,
      date: expense.date,
      notes: expense.notes,
    });
    setModalOpen(true);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFileToUpload(e.target.files[0]);
    }
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    setFormError(null);
    try {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("amount", data.amount.toString());
      formData.append("category", data.category);
      formData.append("payment_method", data.payment_method);
      formData.append("date", data.date);
      if (data.notes) formData.append("notes", data.notes);
      if (fileToUpload) {
        formData.append("proof", fileToUpload);
      }
      
      if (editingExpense) {
        await api.patch(`expenses/${editingExpense.id}/`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await api.post("expenses/", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      setModalOpen(false);
      fetchExpensesAndStats();
      fetchBudgets();
    } catch (error) {
      setFormError(error.response?.data?.detail || "Failed to save expense details.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this expense record?")) return;
    try {
      await api.delete(`expenses/${id}/`);
      fetchExpensesAndStats();
      fetchBudgets();
    } catch (error) {
      console.error("Failed to delete expense", error);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} selected expenses?`)) return;
    try {
      await api.post("expenses/bulk-delete/", { ids: selectedIds });
      setSelectedIds([]);
      fetchExpensesAndStats();
      fetchBudgets();
    } catch (error) {
      console.error("Failed to perform bulk delete", error);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(expenses.map(exp => exp.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id, checked) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(rowId => rowId !== id));
    }
  };

  const handleExport = (format) => {
    const query = new URLSearchParams({
      format,
      type: "expense",
      range: "custom",
      start_date: startDate || "1970-01-01",
      end_date: endDate || new Date().toISOString().split("T")[0],
      search,
      category: selectedCategory,
    }).toString();
    window.open(`${API_BASE_URL}reports/export/?${query}`, "_blank");
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col h-[calc(100vh-7rem)] overflow-hidden w-full gap-3"
    >
      
      {/* Actions Row (Very Compact) */}
      <motion.div variants={itemVariants} className="flex justify-end items-center shrink-0">
        <div className="flex gap-2">
          {selectedIds.length > 0 && (
            <button onClick={handleBulkDelete} className="h-8 px-3 bg-destructive text-white rounded-lg font-semibold text-[11px] flex items-center gap-1.5 hover:bg-destructive/90 transition-colors shadow-sm cursor-pointer">
              <Trash2 className="h-3.5 w-3.5"/> Delete ({selectedIds.length})
            </button>
          )}
          
          <button onClick={() => handleExport("excel")} className="h-8 px-3 bg-secondary border border-border text-emerald-600 rounded-lg font-semibold text-[11px] flex items-center gap-1.5 hover:bg-emerald-500/10 transition-colors cursor-pointer">
            <Download className="h-3.5 w-3.5"/> Excel
          </button>
          
          <button onClick={() => handleExport("pdf")} className="h-8 px-3 bg-secondary border border-border text-rose-600 rounded-lg font-semibold text-[11px] flex items-center gap-1.5 hover:bg-rose-500/10 transition-colors cursor-pointer">
            <Download className="h-3.5 w-3.5"/> PDF
          </button>

          <button onClick={() => handleOpenAddModal()} className="h-8 px-3 bg-primary text-white rounded-lg font-semibold text-[11px] flex items-center gap-1.5 hover:bg-primary/95 shadow-sm shadow-primary/25 cursor-pointer">
            <Plus className="h-3.5 w-3.5"/> Add Expense
          </button>
        </div>
      </motion.div>



      {/* COMPACT BUDGETS */}
      {budgets.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-2.5 shadow-sm shrink-0">
          <div className="flex items-center gap-1.5 mb-2">
            <Calendar className="h-3.5 w-3.5 text-primary" /> 
            <h3 className="text-xs font-bold">Active Budgets</h3>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin">
            {budgets.map(b => {
              const isOver = b.actual_amount > b.budget_amount;
              const pct = Math.min(b.utilization_pct, 100);
              return (
                <div key={b.id} className="min-w-45 p-2 border border-border rounded-lg bg-secondary/30 shrink-0">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] font-bold truncate max-w-20">{b.category} <span className="text-[9px] text-primary ml-0.5 uppercase">{b.period}</span></span>
                    <span className="text-[10px] font-semibold text-muted-foreground">{formatCurrency(b.actual_amount, user?.currency)} / {formatCurrency(b.budget_amount, user?.currency)}</span>
                  </div>
                  <div className="w-full bg-secondary h-1 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${isOver ? "bg-destructive" : pct > 80 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* COMPACT FILTERS */}
      <div className="bg-card border border-border rounded-xl p-2 shadow-sm shrink-0 flex gap-2 overflow-x-auto">
        <div className="relative min-w-37.5 flex-1">
          <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500"/>
          <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-8 pr-3 h-8 bg-secondary border border-border rounded-lg text-xs focus:outline-none focus:border-primary transition-colors text-foreground"/>
        </div>
        <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="px-2 h-8 min-w-30 bg-secondary border border-border rounded-lg text-xs focus:outline-none focus:border-primary text-foreground cursor-pointer">
          <option value="">All Categories</option>
          {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
        </select>
        <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="px-2 h-8 min-w-27.5 bg-secondary border border-border rounded-lg text-xs focus:outline-none focus:border-primary text-foreground cursor-pointer">
          <option value="">All Payments</option>
          <option value="Cash">Cash</option>
          <option value="Card">Card</option>
          <option value="UPI">UPI</option>
          <option value="Net Banking">Net Banking</option>
        </select>
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="px-2 h-8 bg-secondary border border-border rounded-lg text-xs focus:outline-none focus:border-primary text-foreground cursor-pointer" title="Start Date"/>
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="px-2 h-8 bg-secondary border border-border rounded-lg text-xs focus:outline-none focus:border-primary text-foreground cursor-pointer" title="End Date"/>
        
        <div className="flex items-center gap-2 px-3 h-8 bg-primary/10 rounded-lg shrink-0 ml-auto border border-primary/20">
          <span className="text-[10px] font-bold text-primary uppercase">Total:</span>
          <span className="text-xs font-extrabold text-primary">{formatCurrency(stats.total_spent, user?.currency)}</span>
        </div>
      </div>

      {/* SCROLLABLE TABLE CONTAINER */}
      <div className="bg-card border border-border rounded-xl shadow-sm flex-1 min-h-0 flex flex-col overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 z-20 bg-background/50 backdrop-blur-sm flex items-center justify-center">
             <Loader2 className="h-6 w-6 text-primary animate-spin"/>
          </div>
        )}
        
        <div className="flex-1 overflow-auto scrollbar-thin">
          {expenses.length === 0 && !loading ? (
            <div className="py-16 text-center text-muted-foreground text-xs flex flex-col items-center gap-2">
              <Trash2 className="h-8 w-8 text-slate-600 mb-1"/>
              <span>No expenses matches your current search filters.</span>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 z-10 bg-secondary/95 backdrop-blur-md shadow-sm">
                <tr className="border-b border-border text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  <th className="px-4 py-2.5 w-10">
                    <input type="checkbox" onChange={handleSelectAll} checked={selectedIds.length === expenses.length && expenses.length > 0} className="rounded border-border text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer"/>
                  </th>
                  <th className="px-4 py-2.5">Expense Name</th>
                  <th className="px-4 py-2.5">Category</th>
                  <th className="px-4 py-2.5">Amount</th>
                  <th className="px-4 py-2.5">Method</th>
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">Proof</th>
                  <th className="px-4 py-2.5 text-right sticky right-0 bg-secondary/95 backdrop-blur-md z-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-secondary/40 transition-colors group">
                    <td className="px-4 py-2">
                      <input type="checkbox" checked={selectedIds.includes(exp.id)} onChange={(e) => handleSelectRow(exp.id, e.target.checked)} className="rounded border-border text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer"/>
                    </td>
                    <td className="px-4 py-2 font-medium">
                      <div>
                        <p className="font-semibold text-foreground">{exp.name}</p>
                        {exp.notes && <p className="text-[10px] text-muted-foreground mt-0.5 max-w-37.5 truncate">{exp.notes}</p>}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <span className="inline-block py-0.5 px-2 bg-secondary text-foreground text-[10px] font-semibold rounded-md border border-border/50">
                        {exp.category_name}
                      </span>
                    </td>
                    <td className="px-4 py-2 font-bold text-destructive">
                      {formatCurrency(exp.amount, user?.currency)}
                    </td>
                    <td className="px-4 py-2 font-medium text-slate-500">{exp.payment_method}</td>
                    <td className="px-4 py-2 font-medium text-slate-500">
                      {new Date(exp.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2">
                      {exp.proof ? (
                        <div className="relative inline-block group/receipt">
                          <a href={exp.proof} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1 font-semibold">
                            <Paperclip className="h-3 w-3"/>
                          </a>
                          <div className="absolute hidden z-50 bottom-full left-1/2 -translate-x-1/2 mb-1 w-24 bg-card border border-border shadow-xl rounded-lg p-0.5 pointer-events-none group-hover/receipt:block">
                             <img src={exp.proof} alt="Preview" className="w-full h-auto object-cover rounded bg-secondary/50" onError={(e) => e.target.style.display = 'none'} />
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right sticky right-0 bg-background/95 backdrop-blur-md z-10 group-hover:bg-secondary/40">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => handleOpenAddModal(exp)} className="p-1.5 rounded-md text-slate-500 hover:text-primary hover:bg-primary/10 cursor-pointer" title="Duplicate">
                          <Copy className="h-3.5 w-3.5"/>
                        </button>
                        <button onClick={() => handleOpenEditModal(exp)} className="p-1.5 rounded-md text-slate-500 hover:text-foreground hover:bg-secondary cursor-pointer" title="Edit">
                          <Edit2 className="h-3.5 w-3.5"/>
                        </button>
                        <button onClick={() => handleDelete(exp.id)} className="p-1.5 rounded-md text-slate-500 hover:text-destructive hover:bg-destructive/10 cursor-pointer" title="Delete">
                          <Trash2 className="h-3.5 w-3.5"/>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* COMPACT PAGINATION */}
        <div className="px-4 py-2 border-t border-border flex items-center justify-between text-[11px] font-semibold bg-secondary/20 shrink-0">
          <span className="text-muted-foreground">
            Page {page} of {totalPages} (Total {totalCount})
          </span>
          <div className="flex gap-1.5">
            <button onClick={() => setPage(prev => Math.max(prev - 1, 1))} disabled={page === 1} className="h-6 w-6 flex items-center justify-center border border-border rounded bg-card hover:bg-secondary disabled:opacity-50 transition-colors cursor-pointer">
              <ChevronLeft className="h-3.5 w-3.5"/>
            </button>
            <button onClick={() => setPage(prev => Math.min(prev + 1, totalPages))} disabled={page === totalPages} className="h-6 w-6 flex items-center justify-center border border-border rounded bg-card hover:bg-secondary disabled:opacity-50 transition-colors cursor-pointer">
              <ChevronRight className="h-3.5 w-3.5"/>
            </button>
          </div>
        </div>
      </div>

      {/* ADD/EDIT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-card border border-border w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl relative">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-card">
              <h3 className="text-lg font-bold">
                {editingExpense ? "Modify Expense Record" : "Log New Expense"}
              </h3>
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
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Expense Name / Merchant
                </label>
                <input type="text" placeholder="e.g. Whole Foods Groceries" {...register("name")} className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:border-primary text-foreground"/>
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
                    Category
                  </label>
                  <select {...register("category")} className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:border-primary text-foreground">
                    <option value="">Select Category</option>
                    {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                  </select>
                  {errors.category && <p className="text-red-400 text-xs mt-1">{errors.category.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Payment Method
                  </label>
                  <select {...register("payment_method")} className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:border-primary text-foreground">
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                    <option value="UPI">UPI</option>
                    <option value="Net Banking">Net Banking</option>
                  </select>
                  {errors.payment_method && <p className="text-red-400 text-xs mt-1">{errors.payment_method.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Expense Date
                  </label>
                  <input type="date" {...register("date")} className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:border-primary text-foreground"/>
                  {errors.date && <p className="text-red-400 text-xs mt-1">{errors.date.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Receipt / Proof Upload (Optional)
                </label>
                <div className="relative border border-dashed border-border hover:border-primary rounded-xl p-4 flex flex-col items-center justify-center gap-2 bg-secondary/10 transition-colors">
                  <Upload className="h-5 w-5 text-slate-500"/>
                  <span className="text-xs text-muted-foreground font-semibold">
                    {fileToUpload ? fileToUpload.name : "Click to select JPG, PNG or PDF"}
                  </span>
                  <input type="file" accept="image/*,.pdf" onChange={handleFileChange} className="absolute inset-0 opacity-0 w-full cursor-pointer"/>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Notes
                </label>
                <textarea placeholder="Additional merchant notes, items, etc." rows={2} {...register("notes")} className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:border-primary text-foreground resize-none"/>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-border">
                <button type="button" onClick={() => setModalOpen(false)} className="py-2.5 px-4 bg-secondary hover:bg-border text-foreground rounded-xl text-xs font-semibold transition-colors cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="py-2.5 px-5 bg-primary hover:bg-primary/95 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-md shadow-primary/20">
                  {submitting ? (
                    <><Loader2 className="h-4.5 w-4.5 animate-spin"/> Saving...</>
                  ) : (
                    "Save Record"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
}
