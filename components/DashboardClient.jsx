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
  <div className="card flex flex-col">
    <div className="flex items-center justify-between">
      <p className="text-sm text-slate-500">{label}</p>
      <div className={`h-8 w-8 rounded-xl ${color} text-white flex items-center justify-center`}>
        <Icon className="h-4 w-4" />
      </div>
    </div>
    <p className="text-3xl font-semibold text-slate-900 mt-2">{value}</p>
    <p className="text-xs text-slate-400 mt-auto">{hint}</p>
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
    <div className="space-y-6">
      <section className="card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="section-title">Welcome</p>
            <h1 className="text-2xl font-semibold text-slate-900">Email Productivity Agent</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={loadMockEmails} className="btn-secondary">Load Mock Inbox</button>
            <button type="button" onClick={processEmails} className="btn-secondary">Process All Emails</button>
            <Link href="/agent" className="btn-primary">Open Agent</Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total emails" value={totalEmails} hint="All items" icon={Mail} color="bg-primary" />
        <StatCard label="Pending actions" value={pendingActions} hint="Needs attention" icon={ListChecks} color="bg-orange-500" />
        <StatCard label="Drafts" value={draftCount} hint="Agent generated" icon={FileText} color="bg-blue-500" />
        <StatCard label="Processing" value={`${processed}/${totalEmails}`} hint={`${processingPct}% processed`} icon={Zap} color="bg-emerald-500" />
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="card lg:col-span-1 flex flex-col">
          <p className="text-sm font-semibold text-slate-900 mb-4">Emails by category</p>
          <div className="flex-1 min-h-[14rem]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={40} outerRadius={80}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card lg:col-span-2 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-slate-900">Recent emails</p>
            <button type="button" onClick={refreshStats} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs hover:bg-slate-50"><RefreshCcw className="h-3 w-3" />Refresh</button>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {recent.map((e) => (
              <li key={e.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900 line-clamp-2">{e.subject}</p>
                <p className="text-xs text-slate-500 mt-1">{e.sender}</p>
                <p className="text-xs text-slate-400 mt-1">{new Date(e.timestamp).toLocaleString()}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <p className="text-sm font-semibold text-slate-900 mb-2">Quick insights</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs text-slate-500">Most active sender</p>
              <p className="text-sm font-semibold text-slate-900">{mostActiveSender.sender}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs text-slate-500">Needs attention</p>
              <p className="text-sm font-semibold text-slate-900">{attention.length}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <p className="text-sm font-semibold text-slate-900 mb-2">Action required</p>
          <ul className="space-y-2">
            {actions.filter((a) => a.status === "pending").slice(0, 5).map((a) => (
              <li key={a.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                <span className="text-sm text-slate-800">{a.task_description}</span>
                <span className="text-xs text-slate-400">{a.deadline || "No deadline"}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <EmailList />
        <EmailDetail />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <PromptEditor />
        <div className="grid gap-6">
          <EmailAgent />
          <DraftManager />
        </div>
      </section>
    </div>
  );
}
