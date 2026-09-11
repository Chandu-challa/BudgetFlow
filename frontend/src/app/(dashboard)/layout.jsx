"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { api } from "@/lib/api";
import { LayoutDashboard, Receipt, CircleDollarSign, PiggyBank, CalendarDays, Bell, Sun, Moon, LogOut, User, ShieldCheck, Menu, X, CreditCard, CheckSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function DashboardLayout({ children }) {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const pathname = usePathname();
    const router = useRouter();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
    const notifRef = useRef(null);
    // Close dropdown on click outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (notifRef.current && !notifRef.current.contains(event.target)) {
                setNotifDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    // Fetch notifications
    const fetchNotifications = async () => {
        if (!user)
            return;
        try {
            const response = await api.get("notifications/");
            setNotifications(response.data.results || response.data);
        }
        catch (error) {
            const err = error;
            console.error("Failed to load notifications", err);
        }
    };
    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 20000); // refresh every 20s
        return () => clearInterval(interval);
    }, [user]);
    const unreadCount = notifications.filter(n => !n.is_read).length;
    const markAllRead = async () => {
        try {
            await api.post("notifications/mark-all-read/");
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        }
        catch (error) {
            const err = error;
            console.error("Failed to mark all as read", err);
        }
    };
    const markAsRead = async (id) => {
        try {
            await api.post(`notifications/${id}/mark-read/`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        }
        catch (error) {
            const err = error;
            console.error("Failed to mark notification read", err);
        }
    };
    const navItems = [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { name: "Expenses", href: "/expenses", icon: Receipt },
        { name: "Income", href: "/income", icon: CircleDollarSign },
        { name: "Budgets", href: "/budgets", icon: CheckSquare },
        { name: "Savings Goals", href: "/goals", icon: PiggyBank },
        { name: "Subscriptions", href: "/subscriptions", icon: CreditCard },
        { name: "Calendar View", href: "/calendar", icon: CalendarDays },
        { name: "Profile", href: "/profile", icon: User },
    ];
    // Add Admin item if admin
    if (user?.role === "ADMIN") {
        navItems.push({ name: "Admin Portal", href: "/admin", icon: ShieldCheck });
    }
    const getPageTitle = () => {
        const matched = navItems.find(item => item.href === pathname);
        return matched ? matched.name : "BudgetFlow";
    };
    if (!user) {
        return (<div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-slate-400">Verifying session...</span>
        </div>
      </div>);
    }
    return (<div className="min-h-screen flex bg-background text-foreground transition-colors duration-200">
      {/* SIDEBAR FOR DESKTOP */}
      <aside className="hidden md:flex flex-col w-64 bg-card border-r border-border h-screen sticky top-0 transition-colors duration-200">
        <div className="h-16 flex items-center gap-3 px-6 border-b border-border">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold">
            BF
          </div>
          <span className="font-bold text-lg tracking-tight">BudgetFlow</span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (<Link key={item.name} href={item.href} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${active
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>
                <Icon className="h-4.5 w-4.5 shrink-0"/>
                {item.name}
              </Link>);
        })}
        </nav>

        {/* User profile section in sidebar footer */}
        <div className="p-4 border-t border-border bg-card/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary">
              {user.name ? user.name.charAt(0) : user.username.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user.name || user.username}</p>
              <p className="text-xs text-muted-foreground truncate">{user.role}</p>
            </div>
          </div>
          <button onClick={logout} className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-secondary hover:bg-destructive hover:text-white rounded-lg text-xs font-semibold transition-all cursor-pointer">
            <LogOut className="h-3.5 w-3.5"/> Log Out
          </button>
        </div>
      </aside>

      {/* MOBILE MENU MOBILE OVERLAY */}
      {mobileMenuOpen && (<div className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}/>)}

      {/* MOBILE SIDEBAR PANEL */}
      <aside className={`fixed top-0 bottom-0 left-0 w-64 bg-card z-50 md:hidden flex flex-col transform transition-transform duration-300 border-r border-border ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold">
              BF
            </div>
            <span className="font-bold text-lg tracking-tight text-foreground">BudgetFlow</span>
          </div>
          <button onClick={() => setMobileMenuOpen(false)} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5"/>
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (<Link key={item.name} href={item.href} onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${active
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>
                <Icon className="h-4.5 w-4.5 shrink-0"/>
                {item.name}
              </Link>);
        })}
        </nav>

        <div className="p-4 border-t border-border bg-card/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
              {user.name ? user.name.charAt(0) : user.username.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-foreground">{user.name || user.username}</p>
              <p className="text-xs text-muted-foreground truncate">{user.role}</p>
            </div>
          </div>
          <button onClick={logout} className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-secondary hover:bg-destructive hover:text-white rounded-lg text-xs font-semibold transition-all cursor-pointer">
            <LogOut className="h-3.5 w-3.5"/> Log Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* NAVBAR */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-border bg-card sticky top-0 z-30 transition-colors duration-200">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileMenuOpen(true)} className="md:hidden p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground cursor-pointer">
              <Menu className="h-5 w-5"/>
            </button>
            <h1 className="text-lg font-bold tracking-tight md:text-xl">{getPageTitle()}</h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Dark/Light mode toggle */}
            <button onClick={toggleTheme} className="p-2.5 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-all cursor-pointer" title="Toggle Theme">
              {theme === "dark" ? <Sun className="h-4.5 w-4.5"/> : <Moon className="h-4.5 w-4.5"/>}
            </button>

            {/* In-app Notification bell */}
            <div className="relative" ref={notifRef}>
              <button onClick={() => setNotifDropdownOpen(!notifDropdownOpen)} className="p-2.5 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-all relative cursor-pointer" title="Notifications">
                <Bell className="h-4.5 w-4.5"/>
                {unreadCount > 0 && (<span className="absolute top-1.5 right-1.5 w-4 h-4 bg-destructive text-[9px] font-bold text-white rounded-full flex items-center justify-center animate-bounce">
                    {unreadCount}
                  </span>)}
              </button>

              {/* Notification dropdown */}
              {notifDropdownOpen && (<div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-2xl shadow-xl z-50 overflow-hidden">
                  <div className="p-4 border-b border-border flex items-center justify-between bg-card">
                    <span className="font-semibold text-sm">Notifications</span>
                    {unreadCount > 0 && (<button onClick={markAllRead} className="text-xs text-primary hover:underline font-semibold cursor-pointer">
                        Mark all as read
                      </button>)}
                  </div>
                  
                  <div className="max-h-72 overflow-y-auto divide-y divide-border">
                    {notifications.length === 0 ? (<div className="p-6 text-center text-muted-foreground text-xs">
                        No notifications yet.
                      </div>) : (notifications.map((n) => (<div key={n.id} onClick={() => !n.is_read && markAsRead(n.id)} className={`p-4 text-xs transition-colors flex gap-2.5 cursor-pointer ${n.is_read ? "bg-card text-muted-foreground" : "bg-primary/5 hover:bg-primary/10 text-foreground font-medium"}`}>
                          <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${n.is_read ? "bg-transparent" : "bg-primary"}`}/>
                          <div className="flex-1">
                            <p className="line-clamp-3">{n.message}</p>
                            <span className="text-[10px] text-muted-foreground block mt-1.5">
                              {new Date(n.created_at).toLocaleDateString()} at {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>)))}
                  </div>
                </div>)}
            </div>

            <div className="h-6 w-px bg-border mx-1"/>

            {/* Quick Currency display */}
            <span className="text-xs font-bold bg-primary/10 text-primary py-1.5 px-3 rounded-lg uppercase">
              {user.currency}
            </span>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-background/50 transition-colors duration-200">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="w-full h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>);
}
