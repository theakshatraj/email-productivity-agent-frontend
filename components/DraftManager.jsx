"use client";

import { useEffect, useMemo, useState } from "react";
import { useEmail } from "@/context/EmailContext";
import {
  PenSquare,
  Filter,
  Search,
  Edit,
  Eye,
  Trash2,
  Plus,
  Save,
  Bot,
  Download,
} from "lucide-react";

export default function DraftManager({ selectedEmailId = null }) {
  const { drafts, generateDraft, updateDraft, deleteDraft, loadDrafts } = useEmail();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("updated_desc");
  const [emailFilter, setEmailFilter] = useState(selectedEmailId || "All");
  const [editing, setEditing] = useState(null);
  const [editSubject, setEditSubject] = useState("");
  const [editBody, setEditBody] = useState("");
  const [previewMode, setPreviewMode] = useState(false);
  const [autoSavedAt, setAutoSavedAt] = useState(null);

  useEffect(() => {
    loadDrafts(emailFilter === "All" ? null : emailFilter);
  }, [emailFilter, loadDrafts]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (editing) {
        localStorage.setItem(
          `draft-${editing}`,
          JSON.stringify({ subject: editSubject, body: editBody, ts: Date.now() })
        );
        setAutoSavedAt(new Date());
      }
    }, 30000);
    return () => clearInterval(timer);
  }, [editing, editSubject, editBody]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    let list = drafts.filter((d) => {
      const byEmail = emailFilter === "All" || String(d.email_id || "") === String(emailFilter);
      const text = `${d.subject || ""} ${d.body || ""}`.toLowerCase();
      const match = !s || text.includes(s);
      return byEmail && match;
    });
    switch (sortBy) {
      case "created_desc":
        list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
      case "created_asc":
        list.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        break;
      case "updated_asc":
        list.sort((a, b) => new Date(a.updated_at) - new Date(b.updated_at));
        break;
      default:
        list.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    }
    return list;
  }, [drafts, search, emailFilter, sortBy]);

  const openEditor = (d) => {
    setEditing(d.id);
    setEditSubject(d.subject || "");
    setEditBody(d.body || "");
    setPreviewMode(false);
  };

  const save = async () => {
    if (!editing) return;
    await updateDraft(editing, { subject: editSubject, body: editBody });
    setEditing(null);
    setEditSubject("");
    setEditBody("");
  };

  const createNew = async () => {
    if (!selectedEmailId) return;
    await generateDraft(selectedEmailId);
    await loadDrafts(selectedEmailId);
  };

  const exportSelected = () => {
    const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "drafts.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="card p-0 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <PenSquare className="h-5 w-5" />
          </div>
          <div>
            <p className="section-title">Draft manager</p>
            <p className="text-lg font-semibold text-slate-900">Compose and review</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={exportSelected} className="rounded-full border border-slate-200 px-3 py-2 text-sm"><Download className="h-4 w-4" /></button>
          {selectedEmailId && (
            <button type="button" onClick={createNew} className="inline-flex items-center gap-2 rounded-full bg-primary text-white px-3 py-2 text-sm"><Bot className="h-4 w-4" />Generate with AI</button>
          )}
        </div>
      </div>

      <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search drafts"
            className="w-64 rounded-full border border-slate-200 bg-slate-50/60 pl-10 pr-3 py-2 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select value={emailFilter} onChange={(e) => setEmailFilter(e.target.value)} className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm">
            <option value="All">All emails</option>
            {[...new Set(drafts.map((d) => d.email_id).filter(Boolean))].map((id) => (
              <option key={id} value={id}>{`Email #${id}`}</option>
            ))}
          </select>
        </div>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm">
          <option value="updated_desc">Recently updated</option>
          <option value="updated_asc">Least recently updated</option>
          <option value="created_desc">Newest</option>
          <option value="created_asc">Oldest</option>
        </select>
      </div>

      <div className="p-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((d) => {
          const preview = (d.body || "").slice(0, 100);
          return (
            <div key={d.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-slate-900">{d.subject || "Draft"}</p>
              <p className="text-xs text-slate-500">{d.updated_at || d.created_at}</p>
              <p className="text-sm text-slate-600 mt-2">{preview}</p>
              <div className="mt-3 flex items-center gap-2">
                <button type="button" onClick={() => openEditor(d)} className="rounded-full border border-slate-200 px-3 py-1 text-xs"><Edit className="h-3 w-3" /></button>
                <button type="button" onClick={() => setPreviewMode(true) || openEditor(d)} className="rounded-full border border-slate-200 px-3 py-1 text-xs"><Eye className="h-3 w-3" /></button>
                <button type="button" onClick={() => deleteDraft(d.id)} className="rounded-full border border-slate-200 px-3 py-1 text-xs"><Trash2 className="h-3 w-3 text-red-600" /></button>
              </div>
            </div>
          );
        })}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-panel p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Edit draft</p>
              <div className="flex items-center gap-2">
                {autoSavedAt && <span className="text-xs text-slate-500">Auto-saved</span>}
                <button type="button" onClick={() => setEditing(null)} className="rounded-full border border-slate-200 px-3 py-1 text-xs">Close</button>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              <input value={editSubject} onChange={(e) => setEditSubject(e.target.value)} placeholder="Subject" className="w-full rounded-lg border border-slate-200 bg-white p-2 text-sm" />
              {!previewMode ? (
                <textarea value={editBody} onChange={(e) => setEditBody(e.target.value)} placeholder="Body (markdown supported)" rows={10} className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm" />
              ) : (
                <div className="rounded-lg border border-slate-200 p-3 whitespace-pre-wrap text-sm">{editBody}</div>
              )}
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setPreviewMode((v) => !v)} className="rounded-full border border-slate-200 px-3 py-1 text-xs">{previewMode ? "Edit" : "Preview"}</button>
                <button type="button" onClick={save} className="inline-flex items-center gap-2 rounded-full bg-primary text-white px-3 py-1 text-xs"><Save className="h-3 w-3" />Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

