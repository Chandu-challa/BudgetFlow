"use client";
import React, { useState, useEffect } from "react";
import { api, API_BASE_URL } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as zod from "zod";
import { Search, Plus, Trash2, Edit2, Download, Calendar, X, Loader2, ChevronLeft, ChevronRight, Upload, Paperclip } from "lucide-react";
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

const incomeSchema = zod.object({
    source: zod.string().min(1, "Please select an income source"),
    amount: zod.coerce.number().min(0.01, "Amount must be greater than 0"),
    date: zod.string().min(1, "Date is required"),
    description: zod.string().optional(),
});
export default function IncomePage() {
    const { user } = useAuth();
    const [incomes, setIncomes] = useState([]);
    const [loading, setLoading] = useState(true);
    // Filtering & Pagination
    const [search, setSearch] = useState("");
    const [selectedSource, setSelectedSource] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    // Selection
    const [selectedIds, setSelectedIds] = useState([]);
    // Modals
    const [modalOpen, setModalOpen] = useState(false);
    const [editingIncome, setEditingIncome] = useState(null);
    const [formError, setFormError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [fileToUpload, setFileToUpload] = useState(null);
    const { register, handleSubmit, reset, formState: { errors }, } = useForm({
        resolver: zodResolver(incomeSchema),
    });
    const fetchIncomes = async () => {
        setLoading(true);
        try {
            const params = {
                page,
                search,
                source: selectedSource,
                start_date: startDate,
                end_date: endDate,
            };
            const response = await api.get("income/", { params });
            setIncomes(response.data.results || response.data);
            const count = response.data.count || response.data.length || 0;
            setTotalCount(count);
            setTotalPages(Math.ceil(count / 10) || 1);
        }
        catch (error) {
            const err = error;
            console.error("Error fetching incomes", err);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchIncomes();
        setSelectedIds([]);
    }, [page, search, selectedSource, startDate, endDate]);
    const handleOpenAddModal = () => {
        setEditingIncome(null);
        setFormError(null);
        setFileToUpload(null);
        reset({
            source: "Salary",
            amount: 0,
            date: new Date().toISOString().split("T")[0],
            description: "",
        });
        setModalOpen(true);
    };
    const handleOpenEditModal = (income) => {
        setEditingIncome(income);
        setFormError(null);
        setFileToUpload(null);
        reset({
            source: income.source,
            amount: parseFloat(income.amount),
            date: income.date,
            description: income.description,
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
            formData.append("source", data.source);
            formData.append("amount", data.amount.toString());
            formData.append("date", data.date);
            if (data.description)
                formData.append("description", data.description);
            if (fileToUpload) {
                formData.append("proof", fileToUpload);
            }
            if (editingIncome) {
                await api.patch(`income/${editingIncome.id}/`, formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
            }
            else {
                await api.post("income/", formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
            }
            setModalOpen(false);
            fetchIncomes();
        }
        catch (error) {
            const err = error;
            setFormError(err.response?.data?.detail || "Failed to save income record.");
        }
        finally {
            setSubmitting(false);
        }
    };
    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this income record?"))
            return;
        try {
            await api.delete(`income/${id}/`);
            fetchIncomes();
        }
        catch (error) {
            const err = error;
            console.error("Failed to delete income", err);
        }
    };
    const handleBulkDelete = async () => {
        if (selectedIds.length === 0)
            return;
        if (!confirm(`Are you sure you want to delete ${selectedIds.length} selected income entries?`))
            return;
        try {
            await api.post("income/bulk-delete/", { ids: selectedIds });
            setSelectedIds([]);
            fetchIncomes();
        }
        catch (error) {
            const err = error;
            console.error("Failed to perform bulk delete", err);
        }
    };
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(incomes.map(i => i.id));
        }
        else {
            setSelectedIds([]);
        }
    };
    const handleSelectRow = (id, checked) => {
        if (checked) {
            setSelectedIds(prev => [...prev, id]);
        }
        else {
            setSelectedIds(prev => prev.filter(rowId => rowId !== id));
        }
    };
    const handleExport = (format) => {
        const query = new URLSearchParams({
            format,
            type: "income",
            range: "custom",
            start_date: startDate || "1970-01-01",
            end_date: endDate || new Date().toISOString().split("T")[0],
            search,
            source: selectedSource,
        }).toString();
        window.open(`${API_BASE_URL}reports/export/?${query}`, "_blank");
    };
    const sources = ["Salary", "Freelancing", "Business", "Investment", "Rental Income", "Bonus", "Other"];
    return (<motion.div 
      className="space-y-6 w-full"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Income Ledger</h2>
          <p className="text-muted-foreground text-sm">Monitor salary, projects, and cash influxes.</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {selectedIds.length > 0 && (<button onClick={handleBulkDelete} className="py-2.5 px-4 bg-destructive text-white rounded-xl font-semibold text-xs flex items-center gap-2 hover:bg-destructive/90 transition-colors shadow-sm cursor-pointer">
              <Trash2 className="h-4 w-4"/> Bulk Delete ({selectedIds.length})
            </button>)}
          
          <button onClick={() => handleExport("excel")} className="py-2.5 px-4 bg-secondary border border-border text-emerald-600 rounded-xl font-semibold text-xs flex items-center gap-2 hover:bg-emerald-500/10 transition-colors cursor-pointer">
            <Download className="h-4 w-4"/> Excel
          </button>
          
          <button onClick={() => handleExport("pdf")} className="py-2.5 px-4 bg-secondary border border-border text-rose-600 rounded-xl font-semibold text-xs flex items-center gap-2 hover:bg-rose-500/10 transition-colors cursor-pointer">
            <Download className="h-4 w-4"/> PDF
          </button>

          <button onClick={handleOpenAddModal} className="py-2.5 px-4 bg-emerald-600 text-white rounded-xl font-semibold text-xs flex items-center gap-2 hover:bg-emerald-500 shadow-md shadow-emerald-600/25 cursor-pointer">
            <Plus className="h-4 w-4"/> Add Income
          </button>
        </div>
      </motion.div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-500"/>
            </span>
            <input type="text" placeholder="Search description" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:border-primary text-foreground"/>
          </div>

          <select value={selectedSource} onChange={(e) => setSelectedSource(e.target.value)} className="px-3.5 py-2 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:border-primary text-foreground">
            <option value="">All Sources</option>
            {sources.map((src) => (<option key={src} value={src}>{src}</option>))}
          </select>

          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Calendar className="h-4 w-4 text-slate-500"/>
            </span>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:border-primary text-foreground" title="Start Date"/>
          </div>

          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Calendar className="h-4 w-4 text-slate-500"/>
            </span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:border-primary text-foreground" title="End Date"/>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        {loading ? (<div className="py-20 text-center flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 text-emerald-500 animate-spin"/>
            <span className="text-sm text-muted-foreground">Loading income ledger...</span>
          </div>) : incomes.length === 0 ? (<div className="py-20 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
            <Plus className="h-10 w-10 text-slate-600 mb-2"/>
            <span>No income records recorded for the current search query.</span>
          </div>) : (<div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-secondary/40 border-b border-border text-xs font-semibold text-muted-foreground uppercase">
                  <th className="px-6 py-4 w-12">
                    <input type="checkbox" onChange={handleSelectAll} checked={selectedIds.length === incomes.length && incomes.length > 0} className="rounded border-border text-primary focus:ring-primary w-4 h-4 cursor-pointer"/>
                  </th>
                  <th className="px-6 py-4">Source</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Attachment</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {incomes.map((inc) => (<tr key={inc.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-6 py-4">
                      <input type="checkbox" checked={selectedIds.includes(inc.id)} onChange={(e) => handleSelectRow(inc.id, e.target.checked)} className="rounded border-border text-primary focus:ring-primary w-4 h-4 cursor-pointer"/>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block py-1 px-2.5 bg-emerald-500/10 text-emerald-500 text-xs font-bold rounded-full">
                        {inc.source}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium max-w-xs truncate">
                      {inc.description || <span className="text-slate-500 italic">No description</span>}
                    </td>
                    <td className="px-6 py-4 font-bold text-emerald-500">
                      {formatCurrency(inc.amount, user?.currency)}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-500">
                      {new Date(inc.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      {inc.proof ? (<a href={inc.proof} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1 text-xs font-semibold">
                          <Paperclip className="h-3.5 w-3.5"/> Attachment
                        </a>) : (<span className="text-xs text-slate-500">-</span>)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button onClick={() => handleOpenEditModal(inc)} className="p-1.5 rounded-lg text-slate-500 hover:text-foreground hover:bg-secondary cursor-pointer" title="Edit">
                          <Edit2 className="h-4 w-4"/>
                        </button>
                        <button onClick={() => handleDelete(inc.id)} className="p-1.5 rounded-lg text-slate-500 hover:text-destructive hover:bg-destructive/10 cursor-pointer" title="Delete">
                          <Trash2 className="h-4 w-4"/>
                        </button>
                      </div>
                    </td>
                  </tr>))}
              </tbody>
            </table>
          </div>)}

        {/* Pagination */}
        {totalPages > 1 && (<div className="px-6 py-4 border-t border-border flex items-center justify-between text-xs font-semibold bg-secondary/10">
            <span className="text-muted-foreground">
              Showing page {page} of {totalPages} (Total {totalCount} records)
            </span>
            <div className="flex gap-2">
              <button onClick={() => setPage(prev => Math.max(prev - 1, 1))} disabled={page === 1} className="p-2 border border-border rounded-lg bg-card hover:bg-secondary disabled:opacity-50 transition-colors cursor-pointer">
                <ChevronLeft className="h-4 w-4"/>
              </button>
              <button onClick={() => setPage(prev => Math.min(prev + 1, totalPages))} disabled={page === totalPages} className="p-2 border border-border rounded-lg bg-card hover:bg-secondary disabled:opacity-50 transition-colors cursor-pointer">
                <ChevronRight className="h-4 w-4"/>
              </button>
            </div>
          </div>)}
      </div>

      {/* MODAL */}
      {modalOpen && (<div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-card border border-border w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl relative">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-card">
              <h3 className="text-lg font-bold">
                {editingIncome ? "Modify Income Entry" : "Record New Income"}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-500 hover:text-foreground cursor-pointer">
                <X className="h-5 w-5"/>
              </button>
            </div>

            {formError && (<div className="mx-6 mt-4 p-3 bg-red-950/40 border border-red-900/50 rounded-xl text-red-200 text-xs font-medium">
                {formError}
              </div>)}

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Income Source
                  </label>
                  <select {...register("source")} className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:border-primary text-foreground">
                    {sources.map((src) => (<option key={src} value={src}>{src}</option>))}
                  </select>
                  {errors.source && <p className="text-red-400 text-xs mt-1">{errors.source.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Amount ({user?.currency})
                  </label>
                  <input type="number" step="0.01" placeholder="0.00" {...register("amount")} className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:border-primary text-foreground"/>
                  {errors.amount && <p className="text-red-400 text-xs mt-1">{errors.amount.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Deposit Date
                </label>
                <input type="date" {...register("date")} className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:border-primary text-foreground"/>
                {errors.date && <p className="text-red-400 text-xs mt-1">{errors.date.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Attachment / Proof (Optional)
                </label>
                <div className="relative border border-dashed border-border hover:border-emerald-500 rounded-xl p-4 flex flex-col items-center justify-center gap-2 bg-secondary/10 transition-colors">
                  <Upload className="h-5 w-5 text-slate-500"/>
                  <span className="text-xs text-muted-foreground font-semibold">
                    {fileToUpload ? fileToUpload.name : "Select deposit slip or pdf"}
                  </span>
                  <input type="file" accept="image/*,.pdf" onChange={handleFileChange} className="absolute inset-0 opacity-0 w-full cursor-pointer"/>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Description
                </label>
                <textarea placeholder="Notes about this cash flow..." rows={2} {...register("description")} className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:border-primary text-foreground resize-none"/>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-border">
                <button type="button" onClick={() => setModalOpen(false)} className="py-2.5 px-4 bg-secondary hover:bg-border text-foreground rounded-xl text-xs font-semibold transition-colors cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/20">
                  {submitting ? (<>
                      <Loader2 className="h-4.5 w-4.5 animate-spin"/> Saving...
                    </>) : ("Save Income")}
                </button>
              </div>
            </form>
          </div>
        </div>)}
    </motion.div>);
}
