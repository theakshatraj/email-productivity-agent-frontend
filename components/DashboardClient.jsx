"use client";

import EmailList from "@/components/EmailList";
import EmailDetail from "@/components/EmailDetail";
import PromptEditor from "@/components/PromptEditor";
import EmailAgent from "@/components/EmailAgent";
import DraftManager from "@/components/DraftManager";
import Link from "next/link";
import { useEmail } from "@/context/EmailContext";
import { Mail, ListChecks, FileText, Zap, RefreshCcw } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const StatCard = ({ label, value, hint, icon: Icon, color }) => (
  <div className="card-interactive group">
    <div className="flex items-start justify-between mb-4">
      <div>
        <p className="text-sm font-medium text-secondary-600">{label}</p>
      </div>
      <div className={`h-12 w-12 rounded-lg ${color} text-white flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110`}>
        <Icon className="h-6 w-6" />
      </div>
    </div>
    <div className="space-y-3">
      <p className="text-4xl font-bold text-secondary-900">{value}</p>
      <div className="h-px bg-gradient-to-r from-primary/50 to-transparent" />
      <p className="text-xs text-secondary-500 font-medium">{hint}</p>
    </div>
  </div>
);

export default function DashboardClient() {
  const { emails, actions, stats, emailsByCategory, processEmails, loadMockEmails, refreshStats } = useEmail();

  const totalEmails = emails.length;
  const pendingActions = actions.filter((a) => a.status === "pending").length;
  const draftCount = stats?.emails?.drafts || 0;
  const processed = emails.filter((e) => e.is_processed).length;
  const processingPct = totalEmails ? Math.round((processed / totalEmails) * 100) : 0;
  const categoryData = Object.entries(emailsByCategory).map(([name, list]) => ({ name, value: list.length }));
  const colors = ["#ef4444", "#f59e0b", "#3b82f6", "#8b5cf6", "#22c55e", "#64748b"];

  const recent = [...emails].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 5);
  const attention = emails.filter((e) => ["Important", "To-Do"].includes(e.category));
  const mostActiveSender = (() => {
    const map = new Map();
    emails.forEach((e) => map.set(e.sender, (map.get(e.sender) || 0) + 1));
    let max = { sender: "—", count: 0 };
    map.forEach((count, sender) => {
      if (count > max.count) max = { sender, count };
    });
    return max;
  })();

  return (
    <div className="space-y-8">
      <div className="page-header">
        <div>
          <p className="section-title">Dashboard</p>
          <h1 className="page-title">Inbox Intelligence</h1>
          <p className="page-subtitle">AI-powered email management and automation</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={loadMockEmails} className="btn-secondary">Load Mock Inbox</button>
          <button type="button" onClick={processEmails} className="btn-secondary">Process All Emails</button>
          <Link href="/agent" className="btn-primary">Open Agent</Link>
        </div>
      </div>

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4 animate-slide-up">
        <StatCard label="Total emails" value={totalEmails} hint="All items" icon={Mail} color="bg-gradient-to-br from-primary to-primary-dark" />
        <StatCard label="Pending actions" value={pendingActions} hint="Needs attention" icon={ListChecks} color="bg-gradient-to-br from-warning-500 to-warning-600" />
        <StatCard label="Drafts" value={draftCount} hint="Agent generated" icon={FileText} color="bg-gradient-to-br from-accent to-accent-dark" />
        <StatCard label="Processing" value={`${processed}/${totalEmails}`} hint={`${processingPct}% processed`} icon={Zap} color="bg-gradient-to-br from-success-500 to-success-600" />
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="card lg:col-span-1 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-secondary-900">Email Distribution</h3>
            <button type="button" onClick={refreshStats} className="btn-ghost"><RefreshCcw className="h-4 w-4" /></button>
          </div>
          <div className="flex-1 min-h-[16rem]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card lg:col-span-2 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-secondary-900">Recent Activity</h3>
            <span className="badge badge-primary">{recent.length} new</span>
          </div>
          <div className="space-y-3">
            {recent.map((e) => (
              <div key={e.id} className="group card-interactive">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-secondary-900 line-clamp-1 group-hover:text-primary transition-colors">{e.subject}</p>
                    <p className="text-xs text-secondary-500 mt-1">{e.sender}</p>
                  </div>
                  <span className="flex-shrink-0 text-xs text-secondary-400">{new Date(e.timestamp).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h3 className="text-lg font-bold text-secondary-900 mb-6">Insights</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 p-4">
              <p className="text-xs font-semibold text-secondary-600 uppercase tracking-wider">Top Sender</p>
              <p className="text-lg font-bold text-secondary-900 mt-2">{mostActiveSender.sender}</p>
              <p className="text-xs text-secondary-500 mt-1">{mostActiveSender.count} emails</p>
            </div>
            <div className="rounded-lg bg-gradient-to-br from-warning-50 to-warning-100 border border-warning-200 p-4">
              <p className="text-xs font-semibold text-secondary-600 uppercase tracking-wider">Urgent</p>
              <p className="text-lg font-bold text-secondary-900 mt-2">{attention.length}</p>
              <p className="text-xs text-secondary-500 mt-1">Need attention</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-secondary-900">Pending Actions</h3>
            <span className="badge badge-danger">{pendingActions}</span>
          </div>
          <div className="space-y-3">
            {actions.filter((a) => a.status === "pending").slice(0, 4).map((a) => (
              <div key={a.id} className="flex items-start gap-3 p-3 rounded-lg bg-danger-50 border border-danger-100 hover:bg-danger-100 transition-colors duration-200">
                <div className="h-2 w-2 rounded-full bg-danger-500 mt-1.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-secondary-900">{a.task_description}</p>
                  <p className="text-xs text-secondary-500 mt-1">{a.deadline || "No deadline"}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
