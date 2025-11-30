"use client";

import { useEffect, useMemo, useState } from "react";
import { useEmail } from "@/context/EmailContext";
import {
  User,
  Clock,
  Tag,
  CheckCircle2,
  XCircle,
  Printer,
  Reply,
  Bot,
  Trash2,
  RefreshCcw,
} from "lucide-react";

const formatWhen = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const opts = { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" };
  return d.toLocaleString(undefined, opts);
};

export default function EmailDetail({ email = null, onClose, onReprocess, onDelete }) {
  const {
    selectedEmail,
    actions,
    drafts,
    updateActionStatus,
    generateDraft,
    reprocessEmail,
    deleteEmail,
  } = useEmail();

  const data = email || selectedEmail;

  const relatedActions = useMemo(() => {
    const id = data?.id;
    return id ? actions.filter((a) => a.email_id === id) : [];
  }, [actions, data]);
  const relatedDrafts = useMemo(() => {
    const id = data?.id;
    return id ? drafts.filter((d) => d.email_id === id) : [];
  }, [drafts, data]);

  const [expanded, setExpanded] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 1800);
    return () => clearTimeout(t);
  }, [toast]);

  if (!data) {
    return (
      <div className="card flex items-center justify-center text-slate-500">Select an email to view details.</div>
    );
  }

  const catClassMap = {
    Important: "bg-red-600 text-white",
    "To-Do": "bg-emerald-500 text-white",
    Meeting: "bg-indigo-500 text-white",
    Newsletter: "bg-blue-500 text-white",
    "Project Update": "bg-indigo-700 text-white",
    Spam: "bg-gray-400 text-white",
  };
  const catBadge = catClassMap[data.category || "Uncategorized"] || "bg-slate-100 text-slate-600";

  const process = async () => {
    const fn = onReprocess || reprocessEmail;
    await fn(data.id);
    setToast("Processed");
  };

  const remove = async () => {
    if (!confirm("Delete this email?")) return;
    const fn = onDelete || deleteEmail;
    await fn(data.id);
    setToast("Deleted");
  };

  const reply = async () => {
    await generateDraft(data.id);
    setToast("Draft generated");
  };

  const bodyText = !expanded ? (data.body || "").slice(0, 1000) : data.body || "";

  return (
    <div className="card space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-semibold">
            {(data.sender || "?").charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm text-slate-500">{data.sender}</p>
            <h3 className="text-2xl font-semibold text-slate-900">{data.subject}</h3>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1 text-slate-500"><Clock className="h-3 w-3" />{formatWhen(data.timestamp)}</span>
              <span className={`inline-flex px-2.5 py-1 rounded-full font-medium ${catBadge}`}>{data.category || "Uncategorized"}</span>
              {data.is_processed ? (
                <span className="inline-flex items-center gap-1 text-green-700"><CheckCircle2 className="h-3 w-3" />Processed</span>
              ) : (
                <span className="inline-flex items-center gap-1 text-orange-700"><XCircle className="h-3 w-3" />Unprocessed</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => window.print()} className="rounded-full border border-slate-200 p-2 text-slate-600 hover:bg-slate-100"><Printer className="h-4 w-4" /></button>
          {onClose && (
            <button type="button" onClick={onClose} className="rounded-full border border-slate-200 px-3 py-2 text-sm">Close</button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
              <span className="inline-flex items-center gap-2"><User className="h-4 w-4" />From {data.sender}</span>
              <span className="inline-flex items-center gap-2"><Tag className="h-4 w-4" />{data.category || "Uncategorized"}</span>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="whitespace-pre-line text-slate-700 leading-relaxed">{bodyText}</p>
            {data.body && data.body.length > 1000 && (
              <button type="button" onClick={() => setExpanded((v) => !v)} className="mt-4 rounded-full bg-slate-100 px-3 py-1 text-xs">
                {expanded ? "Show less" : "Show more"}
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
          <button type="button" onClick={reply} className="inline-flex items-center gap-2 rounded-full bg-primary text-white px-4 py-2 text-sm transition hover:bg-primary/90 active:opacity-90"><Reply className="h-4 w-4" />Generate Reply</button>
            {!data.is_processed && (
              <button type="button" onClick={process} className="inline-flex items-center gap-2 rounded-full bg-secondary text-white px-4 py-2 text-sm transition hover:bg-secondary/90 active:opacity-90"><Bot className="h-4 w-4" />Process Email</button>
            )}
            {data.is_processed && (
              <button type="button" onClick={process} className="inline-flex items-center gap-2 rounded-full bg-slate-800 text-white px-4 py-2 text-sm transition hover:bg-slate-700 active:opacity-90"><RefreshCcw className="h-4 w-4" />Reprocess</button>
            )}
            <button type="button" onClick={remove} className="inline-flex items-center gap-2 rounded-full bg-red-600 text-white px-4 py-2 text-sm transition hover:bg-red-700 active:opacity-90"><Trash2 className="h-4 w-4" />Delete</button>
          </div>
        </div>

        <div className="space-y-6">
          {relatedActions.length > 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-slate-900 mb-3">Action Items</p>
              <ul className="space-y-2">
                {relatedActions.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={a.status === "completed"}
                        onChange={() => updateActionStatus(a.id, a.status === "completed" ? "pending" : "completed")}
                      />
                      <span className="text-slate-700">{a.task_description}</span>
                    </label>
                    <span className="text-xs text-slate-400">{a.deadline || "No deadline"}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-600">No action items</p>
              {!data.is_processed && (
                <button type="button" onClick={process} className="mt-3 rounded-full bg-secondary text-white px-3 py-2 text-xs">Extract Actions</button>
              )}
            </div>
          )}

          {relatedDrafts.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-slate-900 mb-3">Drafts</p>
              <ul className="space-y-2">
                {relatedDrafts.map((d) => (
                  <li key={d.id} className="rounded-lg border border-slate-200 p-3">
                    <p className="text-sm font-medium text-slate-900">{d.subject || "Draft"}</p>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{d.body}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {toast && <div className="fixed bottom-6 right-6 rounded-full bg-slate-900 text-white px-4 py-2 text-sm">{toast}</div>}
    </div>
  );
}
