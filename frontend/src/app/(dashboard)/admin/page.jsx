"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { Users, TrendingUp, TrendingDown, Activity, Trash2, ShieldAlert, Plus, Loader2, Lock, Tag } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from "recharts";
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

export default function AdminPage() {
    const { user: currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState("dashboard");
    const [loading, setLoading] = useState(true);
    // Admin Data states
    const [metrics, setMetrics] = useState(null);
    const [users, setUsers] = useState([]);
    const [categories, setCategories] = useState([]);
    // Category Form
    const [newCatName, setNewCatName] = useState("");
    const [submittingCat, setSubmittingCat] = useState(false);
    const [userError, setUserError] = useState(null);
    const fetchAdminDashboard = async () => {
        try {
            const response = await api.get("admin/analytics/");
            setMetrics(response.data);
        }
        catch (error) {
            const err = error;
            console.error("Failed to load admin dashboard statistics", err);
        }
    };
    const fetchUsers = async () => {
        try {
            const response = await api.get("auth/admin/users/");
            setUsers(response.data.results || response.data);
        }
        catch (error) {
            const err = error;
            console.error("Failed to load user listing", err);
        }
    };
    const fetchCategories = async () => {
        try {
            const response = await api.get("categories/");
            setCategories(response.data.results || response.data);
        }
        catch (error) {
            const err = error;
            console.error("Failed to load default categories", err);
        }
    };
    const loadAllData = async () => {
        setLoading(true);
        await Promise.all([fetchAdminDashboard(), fetchUsers(), fetchCategories()]);
        setLoading(false);
    };
    useEffect(() => {
        if (currentUser?.role === "ADMIN") {
            loadAllData();
        }
    }, [currentUser]);
    // Auth Guard
    if (currentUser?.role !== "ADMIN") {
        return (<div className="min-h-[60vh] flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-4">
        <Lock className="h-14 w-14 text-destructive animate-bounce"/>
        <h3 className="text-xl font-bold">Access Denied</h3>
        <p className="text-sm text-muted-foreground">
          This portal is reserved strictly for administrative personnel. You do not possess the required credentials.
        </p>
      </div>);
    }
    // Toggle user active status
    const handleToggleUserActive = async (user) => {
        setUserError(null);
        if (user.id === currentUser.id) {
            setUserError("You cannot deactivate your own admin profile.");
            return;
        }
        try {
            await api.patch(`auth/admin/users/${user.id}/`, {
                is_active: !user.is_active,
            });
            fetchUsers();
        }
        catch (error) {
            const err = error;
            console.error("Failed to toggle status", err);
        }
    };
    // Change user role
    const handleToggleUserRole = async (user) => {
        setUserError(null);
        if (user.id === currentUser.id) {
            setUserError("You cannot downgrade your own administrative privileges.");
            return;
        }
        const newRole = user.role === "ADMIN" ? "USER" : "ADMIN";
        try {
            await api.patch(`auth/admin/users/${user.id}/`, {
                role: newRole,
            });
            fetchUsers();
        }
        catch (error) {
            const err = error;
            console.error("Failed to update user privileges", err);
        }
    };
    // Delete user
    const handleDeleteUser = async (id) => {
        setUserError(null);
        if (id === currentUser.id) {
            setUserError("You cannot delete your own admin account.");
            return;
        }
        if (!confirm("Are you sure you want to permanently delete this user account? All their financial records will be destroyed."))
            return;
        try {
            await api.delete(`auth/admin/users/${id}/`);
            fetchUsers();
        }
        catch (error) {
            const err = error;
            console.error("Failed to delete user", err);
        }
    };
    // Add category
    const handleAddCategory = async (e) => {
        e.preventDefault();
        if (!newCatName)
            return;
        setSubmittingCat(true);
        try {
            await api.post("categories/", { name: newCatName });
            setNewCatName("");
            fetchCategories();
        }
        catch (error) {
            const err = error;
            console.error("Failed to add category", err);
        }
        finally {
            setSubmittingCat(false);
        }
    };
    // Delete category
    const handleDeleteCategory = async (id) => {
        if (!confirm("Are you sure you want to delete this category? Systems utilizing this category may experience read-only exceptions."))
            return;
        try {
            await api.delete(`categories/${id}/`);
            fetchCategories();
        }
        catch (error) {
            const err = error;
            console.error("Failed to delete category", err);
        }
    };
    const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f43f5e"];
    if (loading) {
        return (<div className="py-20 text-center flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 text-primary animate-spin"/>
        <span className="text-sm text-muted-foreground">Loading administrator portal...</span>
      </div>);
    }
    return (
      <motion.div 
        className="space-y-6 w-full"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
      {/* Title */}
      <motion.div variants={itemVariants}>
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Admin Control Console</h2>
        <p className="text-muted-foreground text-sm">System-wide monitoring, category management, and user auditing.</p>
      </motion.div>

      {/* Navigation tabs */}
      <motion.div variants={itemVariants} className="flex border-b border-border gap-2">
        <button onClick={() => setActiveTab("dashboard")} className={`pb-3 px-4 text-sm font-semibold transition-all border-b-2 cursor-pointer ${activeTab === "dashboard"
            ? "border-primary text-primary"
            : "border-transparent text-muted-foreground hover:text-foreground"}`}>
          System Health
        </button>
        <button onClick={() => setActiveTab("users")} className={`pb-3 px-4 text-sm font-semibold transition-all border-b-2 cursor-pointer ${activeTab === "users"
            ? "border-primary text-primary"
            : "border-transparent text-muted-foreground hover:text-foreground"}`}>
          User Management
        </button>
        <button onClick={() => setActiveTab("categories")} className={`pb-3 px-4 text-sm font-semibold transition-all border-b-2 cursor-pointer ${activeTab === "categories"
            ? "border-primary text-primary"
            : "border-transparent text-muted-foreground hover:text-foreground"}`}>
          Categories Manager
        </button>
      </motion.div>

      {/* DASHBOARD TAB */}
      {activeTab === "dashboard" && metrics && (<div className="space-y-6">
          {/* Top Aggregate Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Users */}
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Users</span>
                <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-xl">
                  <Users className="h-5 w-5"/>
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold">{metrics.total_users}</h3>
                <p className="text-xs text-muted-foreground mt-1">Registered normal users</p>
              </div>
            </div>

            {/* Active Accounts */}
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Users</span>
                <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
                  <Activity className="h-5 w-5"/>
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold">{metrics.active_users}</h3>
                <p className="text-xs text-muted-foreground mt-1">Unblocked, active users</p>
              </div>
            </div>

            {/* Total Global Revenue */}
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Global Income</span>
                <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
                  <TrendingUp className="h-5 w-5"/>
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold">{formatCurrency(metrics.total_income, "INR")}</h3>
                <p className="text-xs text-muted-foreground mt-1">System-wide deposit totals</p>
              </div>
            </div>

            {/* Total Global Outflow */}
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Global Expenses</span>
                <div className="p-2 bg-rose-500/10 text-rose-500 rounded-xl">
                  <TrendingDown className="h-5 w-5"/>
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold">{formatCurrency(metrics.total_expenses, "INR")}</h3>
                <p className="text-xs text-muted-foreground mt-1">System-wide spending totals</p>
              </div>
            </div>
          </div>

          {/* Visual System charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System Categories distribution */}
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-semibold mb-4 uppercase tracking-wider text-muted-foreground">Global Categories Spend</h3>
              <div className="h-80 min-w-0 flex flex-col sm:flex-row items-center gap-4">
                <div className="w-full sm:w-1/2 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={metrics.category_analytics} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={3} dataKey="amount" nameKey="category">
                        {metrics.category_analytics.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]}/>))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value, "INR")}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="w-full sm:w-1/2 max-h-64 overflow-y-auto space-y-2">
                  {metrics.category_analytics.map((item, index) => (<div key={item.category} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}/>
                        <span className="font-medium truncate max-w-[100px]">{item.category}</span>
                      </div>
                      <span className="text-muted-foreground font-semibold">
                        {formatCurrency(item.amount, "INR")} ({item.transactions} tx)
                      </span>
                    </div>))}
                </div>
              </div>
            </div>

            {/* Monthly velocity volumes */}
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-semibold mb-4 uppercase tracking-wider text-muted-foreground">System Transaction Velocity</h3>
              <div className="h-80 min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.monthly_velocity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="month" tickLine={false} style={{ fontSize: 10 }}/>
                    <YAxis tickLine={false} axisLine={false} style={{ fontSize: 10 }}/>
                    <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10 }}/>
                    <Legend style={{ fontSize: 11 }}/>
                    <Bar dataKey="transactions" fill="#6366f1" radius={[4, 4, 0, 0]} name="Transactions (In + Out)"/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>)}

      {/* USER MANAGEMENT TAB */}
      {activeTab === "users" && (<div className="space-y-4">
          {userError && (<div className="p-3 bg-red-950/40 border border-red-900/50 rounded-xl text-red-200 text-xs font-semibold flex items-center gap-2">
              <ShieldAlert className="h-4.5 w-4.5"/>
              <span>{userError}</span>
            </div>)}

          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex-1 flex flex-col">
            <div className="flex-1 overflow-auto scrollbar-thin">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 z-10 bg-secondary/95 backdrop-blur-md shadow-sm">
                  <tr className="border-b border-border text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    <th className="px-4 py-2.5">Username</th>
                    <th className="px-4 py-2.5">Email</th>
                    <th className="px-4 py-2.5">Full Name</th>
                    <th className="px-4 py-2.5">User Role</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5 text-right sticky right-0 bg-secondary/95 backdrop-blur-md z-20">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map((u) => (<tr key={u.id} className="hover:bg-secondary/40 transition-colors group">
                      <td className="px-4 py-2 font-semibold text-foreground">{u.username}</td>
                      <td className="px-4 py-2 text-slate-500 font-medium">{u.email}</td>
                      <td className="px-4 py-2 text-slate-500 font-medium">{u.name || "-"}</td>
                      <td className="px-4 py-2">
                        <button onClick={() => handleToggleUserRole(u)} className={`inline-flex items-center gap-1 py-0.5 px-2 rounded-md text-[10px] font-bold transition-all cursor-pointer ${u.role === "ADMIN"
                    ? "bg-indigo-500/10 text-indigo-500 border border-indigo-500/20"
                    : "bg-secondary text-foreground"}`}>
                          {u.role}
                        </button>
                      </td>
                      <td className="px-4 py-2">
                        <button onClick={() => handleToggleUserActive(u)} className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors" title={u.is_active ? "Block User" : "Activate User"}>
                          {u.is_active ? (<span className="inline-flex items-center gap-1 py-0.5 px-2 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold rounded-md border border-emerald-500/20 uppercase">Active</span>) : (<span className="inline-flex items-center gap-1 py-0.5 px-2 bg-destructive/10 text-destructive text-[10px] font-bold rounded-md border border-destructive/20 uppercase">Blocked</span>)}
                        </button>
                      </td>
                      <td className="px-4 py-2 text-right sticky right-0 bg-background/95 backdrop-blur-md z-10 group-hover:bg-secondary/40">
                        <button onClick={() => handleDeleteUser(u.id)} className="p-1.5 rounded-md text-slate-500 hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer" title="Delete User" disabled={u.id === currentUser.id}>
                          <Trash2 className="h-3.5 w-3.5"/>
                        </button>
                      </td>
                    </tr>))}
                </tbody>
              </table>
            </div>
          </div>
        </div>)}

      {/* CATEGORY MANAGEMENT TAB */}
      {activeTab === "categories" && (<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Add Category Form (Left) */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm h-fit">
            <h3 className="font-bold text-sm mb-4 uppercase tracking-wider text-muted-foreground">Log Default Category</h3>
            <form onSubmit={handleAddCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Category Name</label>
                <input type="text" placeholder="e.g. Subscriptions, Travel" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} className="w-full px-4 py-2.5 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:border-primary text-foreground"/>
              </div>
              <button type="submit" disabled={submittingCat || !newCatName} className="w-full py-2.5 bg-primary text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 hover:bg-primary/95 transition-all shadow-md shadow-primary/20 cursor-pointer">
                {submittingCat ? <Loader2 className="h-4 w-4 animate-spin"/> : <><Plus className="h-4 w-4"/> Log Category</>}
              </button>
            </form>
          </div>

          {/* Categories list (Right) */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm md:col-span-2 space-y-4">
            <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Default Categories</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {categories.map((c) => (<div key={c.id} className="flex justify-between items-center p-3 bg-secondary/40 border border-border rounded-xl text-xs">
                  <span className="font-semibold flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5 text-primary"/> {c.name}
                  </span>
                  
                  {/* Delete category if it's default or created by user */}
                  <button onClick={() => handleDeleteCategory(c.id)} className="p-1 rounded text-slate-400 hover:text-destructive hover:bg-destructive/10 cursor-pointer" title="Delete Category">
                    <Trash2 className="h-3.5 w-3.5"/>
                  </button>
                </div>))}
            </div>
          </div>
        </div>)}
    </motion.div>);
}
