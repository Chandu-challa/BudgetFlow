"use client";
import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown, Scale, PiggyBank, Calendar, Activity, ArrowRight } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import Link from "next/link";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function DashboardPage() {
    const { user } = useAuth();
    const [metrics, setMetrics] = useState(null);
    const [charts, setCharts] = useState(null);
    const [activities, setActivities] = useState(null);
    const [loading, setLoading] = useState(true);
    const [insights, setInsights] = useState(null);
    const fetchDashboardData = async () => {
        try {
            const response = await api.get("analytics/dashboard/");
            setMetrics(response.data.metrics);
            setCharts(response.data.charts);
            setActivities(response.data.recent_activity);
            // Fetch smart insights
            const insightsResponse = await api.get("analytics/smart-insights/");
            setInsights(insightsResponse.data);
        }
        catch (error) {
            const err = error;
            console.error("Error loading dashboard metrics", err);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchDashboardData();
    }, []);
    const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f43f5e"];
    if (loading) {
        return (<div className="space-y-6">
        {/* Loading skeleton for top cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (<div key={i} className="h-28 bg-card/60 animate-pulse rounded-2xl border border-border"/>))}
        </div>
        {/* Loading skeletons for charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-card/60 animate-pulse rounded-2xl border border-border"/>
          <div className="h-80 bg-card/60 animate-pulse rounded-2xl border border-border"/>
        </div>
      </div>);
    }
    return (<motion.div 
      className="space-y-6 w-full"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Welcome Header */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Hello, {user?.name || user?.username}!</h2>
          <p className="text-muted-foreground text-sm">Here is your financial workspace summary for today.</p>
        </div>
        
        {/* Smart insights banner inside header */}
        {insights?.delta_comparison && (<div className="glass px-4 py-2.5 rounded-xl border border-border flex items-center gap-2 text-xs font-semibold">
            <Activity className="h-4 w-4 text-primary animate-pulse"/>
            <span className="text-muted-foreground">{insights.delta_comparison.text}</span>
          </div>)}
      </motion.div>

      {/* Metric Summary Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Income */}
        <motion.div whileHover={{ scale: 1.02 }} className="bg-card border border-border rounded-2xl p-5 shadow-sm transition-all hover:shadow-md cursor-default">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Income</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
              <TrendingUp className="h-5 w-5"/>
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold">{formatCurrency(metrics?.total_income || 0, user?.currency)}</h3>
            <p className="text-xs text-muted-foreground mt-1">Cumulative earned lifetime</p>
          </div>
        </motion.div>

        {/* Total Expenses */}
        <motion.div whileHover={{ scale: 1.02 }} className="bg-card border border-border rounded-2xl p-5 shadow-sm transition-all hover:shadow-md cursor-default">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Expenses</span>
            <div className="p-2 bg-rose-500/10 text-rose-500 rounded-xl">
              <TrendingDown className="h-5 w-5"/>
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold">{formatCurrency(metrics?.total_expenses || 0, user?.currency)}</h3>
            <p className="text-xs text-muted-foreground mt-1">Cumulative spent lifetime</p>
          </div>
        </motion.div>

        {/* Remaining Budget / Net Savings */}
        <motion.div whileHover={{ scale: 1.02 }} className="bg-card border border-border rounded-2xl p-5 shadow-sm transition-all hover:shadow-md cursor-default">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Net Savings</span>
            <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-xl">
              <Scale className="h-5 w-5"/>
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold">
              {formatCurrency(metrics?.remaining_budget || 0, user?.currency)}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">Remaining balance sheet</p>
          </div>
        </motion.div>

        {/* Total Savings Goals */}
        <motion.div whileHover={{ scale: 1.02 }} className="bg-card border border-border rounded-2xl p-5 shadow-sm transition-all hover:shadow-md cursor-default">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Saved Goals</span>
            <div className="p-2 bg-violet-500/10 text-violet-500 rounded-xl">
              <PiggyBank className="h-5 w-5"/>
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold">{formatCurrency(metrics?.total_savings || 0, user?.currency)}</h3>
            <p className="text-xs text-muted-foreground mt-1">Current amount across goals</p>
          </div>
        </motion.div>

        {/* Current Month Spending */}
        <motion.div whileHover={{ scale: 1.02 }} className="bg-card border border-border rounded-2xl p-5 shadow-sm transition-all hover:shadow-md cursor-default">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Month Spending</span>
            <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
              <Calendar className="h-5 w-5"/>
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold">
              {formatCurrency(metrics?.current_month_spending || 0, user?.currency)}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Limit: {formatCurrency(user?.monthly_income || 0, user?.currency)} (Income)
            </p>
          </div>
        </motion.div>

        {/* Current Week Spending */}
        <motion.div whileHover={{ scale: 1.02 }} className="bg-card border border-border rounded-2xl p-5 shadow-sm transition-all hover:shadow-md cursor-default">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Week Spending</span>
            <div className="p-2 bg-blue-500/10 text-blue-500 rounded-xl">
              <Activity className="h-5 w-5"/>
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold">{formatCurrency(metrics?.current_week_spending || 0, user?.currency)}</h3>
            <p className="text-xs text-muted-foreground mt-1">Spending since Monday</p>
          </div>
        </motion.div>
      </motion.div>

      {/* Visual Analytics charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income vs Expenses Bar Chart */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold mb-4 uppercase tracking-wider text-muted-foreground">Income vs Expense</h3>
          <div className="h-72 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.income_vs_expense} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="month" tickLine={false} style={{ fontSize: 10 }}/>
                <YAxis tickLine={false} axisLine={false} style={{ fontSize: 10 }}/>
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10 }}/>
                <Legend style={{ fontSize: 11 }}/>
                <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} name="Income"/>
                <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} name="Expense"/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Expense Trend Line Chart */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold mb-4 uppercase tracking-wider text-muted-foreground">Monthly Expense Trend</h3>
          <div className="h-72 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts?.monthly_expense_trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="month" tickLine={false} style={{ fontSize: 10 }}/>
                <YAxis tickLine={false} axisLine={false} style={{ fontSize: 10 }}/>
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10 }}/>
                <Legend style={{ fontSize: 11 }}/>
                <Line type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={3} name="Total Spent" dot={{ r: 4 }} activeDot={{ r: 6 }}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Categories Distribution Pie Chart */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold mb-4 uppercase tracking-wider text-muted-foreground">Category Distribution</h3>
          <div className="h-72 min-w-0 flex flex-col sm:flex-row items-center gap-4">
            <div className="w-full sm:w-1/2 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={charts?.expense_categories} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={3} dataKey="value">
                    {charts?.expense_categories.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]}/>))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value, user?.currency)}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Custom legends for pie */}
            <div className="w-full sm:w-1/2 max-h-60 overflow-y-auto space-y-2">
              {charts?.expense_categories.map((item, index) => (<div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}/>
                    <span className="font-medium truncate max-w-25">{item.name}</span>
                  </div>
                  <span className="text-muted-foreground font-semibold">
                    {formatCurrency(item.value, user?.currency)} ({item.percentage}%)
                  </span>
                </div>))}
              {charts?.expense_categories.length === 0 && (<p className="text-xs text-muted-foreground text-center">No categories recorded this month.</p>)}
            </div>
          </div>
        </div>

        {/* Savings Trend Area Chart */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold mb-4 uppercase tracking-wider text-muted-foreground">Net Balance growth</h3>
          <div className="h-72 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts?.savings_trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tickLine={false} style={{ fontSize: 10 }}/>
                <YAxis tickLine={false} axisLine={false} style={{ fontSize: 10 }}/>
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10 }}/>
                <Area type="monotone" dataKey="savings" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorSavings)" name="Savings"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom section: budget progress & alerts + recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Budget Progress (Left) */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm lg:col-span-1">
          <h3 className="text-sm font-semibold mb-4 uppercase tracking-wider text-muted-foreground flex items-center justify-between">
            <span>Budget Progress</span>
            <Link href="/budgets" className="text-xs text-primary hover:underline flex items-center gap-0.5">
              Manage <ArrowRight className="h-3 w-3"/>
            </Link>
          </h3>
          <div className="space-y-4 max-h-87.5 overflow-y-auto pr-1">
            {charts?.budget_utilization.length === 0 ? (<div className="text-center py-8 text-xs text-muted-foreground">
                No active budgets for the current month.
              </div>) : (charts?.budget_utilization.map((b) => {
            const isOver = b.spent > b.budget;
            const pct = Math.min(b.percentage, 100);
            return (<div key={b.name} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="truncate">{b.name}</span>
                      <span className={isOver ? "text-destructive" : "text-slate-500"}>
                        {formatCurrency(b.spent, user?.currency)} / {formatCurrency(b.budget, user?.currency)}
                      </span>
                    </div>
                    <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${isOver ? "bg-destructive" : b.percentage >= 80 ? "bg-amber-500" : "bg-primary"}`} style={{ width: `${pct}%` }}/>
                    </div>
                  </div>);
        }))}
          </div>
        </div>

        {/* Recent Transactions & Alerts (Right) */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center border-b border-border pb-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Recent Activity</h3>
            <div className="flex gap-2">
              <Link href="/expenses" className="text-xs bg-secondary text-foreground font-bold px-3 py-1.5 rounded-lg hover:bg-border transition-colors">
                Expenses
              </Link>
              <Link href="/income" className="text-xs bg-secondary text-foreground font-bold px-3 py-1.5 rounded-lg hover:bg-border transition-colors">
                Income
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Latest Expenses */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Latest Expenses</h4>
              <div className="space-y-3">
                {activities?.expenses.length === 0 ? (<p className="text-xs text-muted-foreground py-4 text-center">No expenses recorded yet.</p>) : (activities?.expenses.map((e) => (<div key={e.id} className="flex justify-between items-center p-3 bg-secondary/30 rounded-xl text-xs">
                      <div>
                        <p className="font-semibold truncate max-w-30">{e.name}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{e.category_name} • {new Date(e.date).toLocaleDateString()}</p>
                      </div>
                      <span className="font-bold text-destructive flex items-center">
                        -{formatCurrency(e.amount, user?.currency)}
                      </span>
                    </div>)))}
              </div>
            </div>

            {/* Latest Income */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Latest Income</h4>
              <div className="space-y-3">
                {activities?.incomes.length === 0 ? (<p className="text-xs text-muted-foreground py-4 text-center">No income entries yet.</p>) : (activities?.incomes.map((i) => (<div key={i.id} className="flex justify-between items-center p-3 bg-secondary/30 rounded-xl text-xs">
                      <div>
                        <p className="font-semibold truncate max-w-30">{i.source}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(i.date).toLocaleDateString()}</p>
                      </div>
                      <span className="font-bold text-emerald-500">
                        +{formatCurrency(i.amount, user?.currency)}
                      </span>
                    </div>)))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>);
}
