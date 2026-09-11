"use client";
import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Loader2, Calendar, X, TrendingUp, TrendingDown } from "lucide-react";
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

export default function CalendarPage() {
    const { user } = useAuth();
    // Date states
    const [currentDate, setCurrentDate] = useState(new Date());
    const [loading, setLoading] = useState(true);
    // Monthly transactions
    const [monthlyExpenses, setMonthlyExpenses] = useState([]);
    const [monthlyIncomes, setMonthlyIncomes] = useState([]);
    // Day Details Modal
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedDayTransactions, setSelectedDayTransactions] = useState({ expenses: [], incomes: [] });
    const [drawerOpen, setDrawerOpen] = useState(false);
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const getDaysInMonth = (y, m) => {
        return new Date(y, m + 1, 0).getDate();
    };
    
    const getFirstDayOfMonth = (y, m) => {
        return new Date(y, m, 1).getDay(); // 0 is Sunday, 1 is Monday...
    };
    
    const fetchMonthTransactions = async () => {
        setLoading(true);
        try {
            const days = getDaysInMonth(year, month);
            const firstDay = `01`;
            const lastDay = days.toString().padStart(2, "0");
            const mStr = (month + 1).toString().padStart(2, "0");
            const startStr = `${year}-${mStr}-${firstDay}`;
            const endStr = `${year}-${mStr}-${lastDay}`;
            // Fetch expenses and incomes for this date range
            const [expRes, incRes] = await Promise.all([
                api.get("expenses/", { params: { start_date: startStr, end_date: endStr, limit: 100 } }),
                api.get("income/", { params: { start_date: startStr, end_date: endStr, limit: 100 } }),
            ]);
            setMonthlyExpenses(expRes.data.results || expRes.data);
            setMonthlyIncomes(incRes.data.results || incRes.data);
        }
        catch (error) {
            const err = error;
            console.error("Error loading calendar transactions", err);
        }
        finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        fetchMonthTransactions();
    }, [currentDate]);
    
    const handlePrevMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
    };
    const handleNextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
    };
    
    // Compile totals per day
    const getDayMetrics = (day) => {
        const dStr = `${year}-${(month + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
        const dayExpenses = monthlyExpenses.filter(e => e.date === dStr);
        const dayIncomes = monthlyIncomes.filter(i => i.date === dStr);
        const totalExp = dayExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
        const totalInc = dayIncomes.reduce((sum, i) => sum + parseFloat(i.amount), 0);
        return {
            expenses: dayExpenses,
            incomes: dayIncomes,
            totalExp,
            totalInc,
        };
    };
    
    const handleDayClick = (day) => {
        const metrics = getDayMetrics(day);
        const clickDate = new Date(year, month, day);
        setSelectedDate(clickDate);
        setSelectedDayTransactions({
            expenses: metrics.expenses,
            incomes: metrics.incomes,
        });
        setDrawerOpen(true);
    };
    
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    
    // Generate grid items
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayIndex = getFirstDayOfMonth(year, month);
    const gridCells = [];
    
    // Fill empty leading days
    for (let i = 0; i < firstDayIndex; i++) {
        gridCells.push(<div key={`empty-${i}`} className="bg-secondary/10 border border-border/40 min-h-24 p-2 opacity-30 pointer-events-none"/>);
    }
    
    // Fill actual month days
    for (let d = 1; d <= daysInMonth; d++) {
        const metrics = getDayMetrics(d);
        const hasTransactions = metrics.totalInc > 0 || metrics.totalExp > 0;
        gridCells.push(
          <div key={`day-${d}`} onClick={() => handleDayClick(d)} className={`bg-card border border-border min-h-28 p-2.5 flex flex-col justify-between hover:bg-secondary/40 transition-all cursor-pointer group ${hasTransactions ? "hover:border-primary/50" : ""}`}>
            <span className="text-xs font-bold text-slate-500 group-hover:text-primary transition-colors">{d}</span>
            <div className="space-y-1 mt-2">
              {metrics.totalInc > 0 && (<div className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded truncate">
                  +{formatCurrency(metrics.totalInc, user?.currency)}
                </div>)}
              {metrics.totalExp > 0 && (<div className="text-[10px] font-bold text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded truncate">
                  -{formatCurrency(metrics.totalExp, user?.currency)}
                </div>)}
            </div>
          </div>
        );
    }
    
    return (
      <motion.div 
        className="space-y-6 w-full"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Title */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Calendar Transaction Planner</h2>
            <p className="text-muted-foreground text-sm">Visualize daily revenue inflows and spend clusters.</p>
          </div>
          <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-2 text-sm font-semibold shadow-sm">
            <Calendar className="h-4.5 w-4.5 text-primary"/>
            <span>{monthNames[month]} {year}</span>
            <div className="flex gap-1 ml-4">
              <button onClick={handlePrevMonth} className="p-1 hover:bg-secondary rounded cursor-pointer">
                <ChevronLeft className="h-4 w-4"/>
              </button>
              <button onClick={handleNextMonth} className="p-1 hover:bg-secondary rounded cursor-pointer">
                <ChevronRight className="h-4 w-4"/>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Grid */}
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-3 bg-card border border-border rounded-2xl shadow-sm">
            <Loader2 className="h-8 w-8 text-primary animate-spin"/>
            <span className="text-sm text-muted-foreground">Compiling calendar view...</span>
          </div>
        ) : (
          <motion.div variants={itemVariants} className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            {/* Days of week header */}
            <div className="grid grid-cols-7 border-b border-border bg-secondary/35 text-center text-xs font-semibold text-slate-500 uppercase tracking-widest py-3">
              {daysOfWeek.map(day => (<div key={day}>{day}</div>))}
            </div>

            {/* Calendar cell grid */}
            <div className="grid grid-cols-7 divide-x divide-y divide-border border-collapse">
              {gridCells}
            </div>
          </motion.div>
        )}

        {/* TRANSACTION LIST DRAWER MODAL */}
        <AnimatePresence>
          {drawerOpen && selectedDate && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-end p-0 md:p-4 backdrop-blur-sm">
              <motion.div 
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="bg-card border-l border-border h-full md:h-[calc(100vh-2rem)] w-full max-w-md md:rounded-3xl overflow-hidden shadow-2xl flex flex-col relative"
              >
                {/* Header */}
                <div className="px-6 py-5 border-b border-border flex justify-between items-center bg-card">
                  <div>
                    <h3 className="text-lg font-bold">Daily Ledger Details</h3>
                    <p className="text-xs text-muted-foreground">{selectedDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                  <button onClick={() => setDrawerOpen(false)} className="text-slate-500 hover:text-foreground cursor-pointer">
                    <X className="h-5 w-5"/>
                  </button>
                </div>

                {/* Content list */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Income */}
                  <div>
                    <h4 className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                      <TrendingUp className="h-4 w-4"/> Income Influxes
                    </h4>
                    <div className="space-y-3">
                      {selectedDayTransactions.incomes.length === 0 ? (<p className="text-xs text-muted-foreground bg-secondary/10 p-4 rounded-xl border border-border/30 text-center">No income records on this day.</p>) : (selectedDayTransactions.incomes.map((inc) => (<div key={inc.id} className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-xs space-y-1">
                            <div className="flex justify-between items-center font-bold">
                              <span>{inc.source}</span>
                              <span className="text-emerald-500">+{formatCurrency(inc.amount, user?.currency)}</span>
                            </div>
                            {inc.description && <p className="text-muted-foreground leading-relaxed">{inc.description}</p>}
                            {inc.proof && (<a href={inc.proof} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-[10px] font-semibold mt-1 inline-block">View slip</a>)}
                          </div>)))}
                    </div>
                  </div>

                  {/* Expenses */}
                  <div>
                    <h4 className="text-xs font-bold text-rose-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                      <TrendingDown className="h-4 w-4"/> Daily Spending
                    </h4>
                    <div className="space-y-3">
                      {selectedDayTransactions.expenses.length === 0 ? (<p className="text-xs text-muted-foreground bg-secondary/10 p-4 rounded-xl border border-border/30 text-center">No expenses logged on this day.</p>) : (selectedDayTransactions.expenses.map((exp) => (<div key={exp.id} className="p-3 bg-rose-500/5 border border-rose-500/10 rounded-xl text-xs space-y-1">
                            <div className="flex justify-between items-center font-bold">
                              <span>{exp.name}</span>
                              <span className="text-rose-500">-{formatCurrency(exp.amount, user?.currency)}</span>
                            </div>
                            <p className="text-slate-500 text-[10px] font-semibold uppercase">Category: {exp.category_name} • Paid: {exp.payment_method}</p>
                            {exp.notes && <p className="text-muted-foreground leading-relaxed">{exp.notes}</p>}
                            {exp.proof && (<a href={exp.proof} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-[10px] font-semibold mt-1 inline-block">View Receipt</a>)}
                          </div>)))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    );
}
