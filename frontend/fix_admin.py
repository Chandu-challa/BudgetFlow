import re

content = open('src/app/(dashboard)/admin/page.jsx', encoding='utf-8').read()

# Let's fix the duplicated stuff
# The original file was broken by replace_file_content at around line 320.
# We will just write the original block replacing EVERYTHING from
# {/* DASHBOARD TAB */} up to {/* CATEGORY MANAGEMENT TAB */}

import urllib.request
import json
import os

start_marker = "      {/* DASHBOARD TAB */}"
end_marker = "      {/* CATEGORY MANAGEMENT TAB */}"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

new_tab = """      {/* DASHBOARD TAB */}
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

"""

if start_idx != -1 and end_idx != -1:
    new_content = content[:start_idx] + new_tab + content[end_idx:]
    open('src/app/(dashboard)/admin/page.jsx', 'w', encoding='utf-8').write(new_content)
    print('Fixed admin/page.jsx')
else:
    print('Failed to find indices')
