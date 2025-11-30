"use client";

import { useEffect, useMemo, useState } from "react";
import EmailAgent from "@/components/EmailAgent";
import { useEmail } from "@/context/EmailContext";
import { Plus, Trash2, FolderOpen, Filter, X, Mic, Download, Copy } from "lucide-react";

const LS_KEY = "agent-conversations";

export default function AgentPage() {
  const { emails, selectedEmail, selectEmail, actions, drafts } = useEmail();
  const [currentConversation, setCurrentConversation] = useState(null);
  const [conversationHistory, setConversationHistory] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [attachedEmails, setAttachedEmails] = useState([]);
  const [filters, setFilters] = useState({ urgent: false, category: null });
  const [showAttach, setShowAttach] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(conversationHistory));
    } catch {}
  }, [conversationHistory]);

  const newConversation = () => {
    const convo = {
      id: Date.now(),
      title: "New conversation",
      messages: [],
      createdAt: new Date().toISOString(),
    };
    setConversationHistory((prev) => [convo, ...prev]);
    setCurrentConversation(convo);
  };

  const deleteConversation = (id) => {
    setConversationHistory((prev) => prev.filter((c) => c.id !== id));
    if (currentConversation?.id === id) setCurrentConversation(null);
  };

  const clearAll = () => {
    setConversationHistory([]);
    setCurrentConversation(null);
  };

  const onMessagesChange = (msgs) => {
    if (!currentConversation) return;
    const title = msgs.find((m) => m.role === "user")?.content?.slice(0, 40) || currentConversation.title;
    setConversationHistory((prev) => prev.map((c) => (c.id === currentConversation.id ? { ...c, messages: msgs, title } : c)));
  };

  const initialMessages = currentConversation?.messages || null;

  const contextEmail = selectedEmail || (attachedEmails.length ? emails.find((e) => e.id === attachedEmails[0]) : null);

  const related = useMemo(() => {
    if (!contextEmail) return { actions: [], drafts: [] };
    return {
      actions: actions.filter((a) => a.email_id === contextEmail.id),
      drafts: drafts.filter((d) => d.email_id === contextEmail.id),
    };
  }, [actions, drafts, contextEmail]);

  return (
    <div className="min-h-[calc(100vh-8rem)] grid grid-cols-1 lg:grid-cols-[22%_53%_25%] gap-0">
      <aside className="border-r border-slate-200 bg-white p-4 overflow-y-auto">
        <div className="flex flex-col gap-2 mb-4">
          <button type="button" onClick={newConversation} className="btn-primary w-full"><Plus className="h-4 w-4" />New Conversation</button>
          <button type="button" onClick={clearAll} className="btn-secondary w-full text-xs">Clear All</button>
        </div>
        <ul className="space-y-2">
          {conversationHistory.map((c) => (
            <li key={c.id} className={`flex items-start gap-2 rounded-lg border p-3 transition ${currentConversation?.id === c.id ? 'bg-primary/5 border-primary/30' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
              <button type="button" onClick={() => setCurrentConversation(c)} className="text-left flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 line-clamp-2">{c.title}</p>
                <p className="text-xs text-slate-500 mt-1">{new Date(c.createdAt).toLocaleString()}</p>
              </button>
              <button type="button" onClick={() => deleteConversation(c.id)} className="rounded-full p-1 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5 text-red-600" /></button>
            </li>
          ))}
          {conversationHistory.length === 0 && <p className="text-sm text-slate-500 text-center py-8">No conversations</p>}
        </ul>
      </aside>

      <main className="bg-white border-r border-slate-200 overflow-y-auto">
        <div className="h-full">
          <EmailAgent selectedEmail={contextEmail} initialMessages={initialMessages} onMessagesChange={onMessagesChange} />
        </div>
      </main>

      <aside className="bg-white p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold">Context</p>
          <button type="button" onClick={() => setShowAttach(true)} className="rounded-full border border-slate-200 px-2 py-1 text-xs">Add Context</button>
        </div>
        <div className="space-y-3">
          <div className="rounded-xl border border-slate-200 p-3">
            <p className="text-xs text-slate-500 mb-1">Selected email</p>
            {contextEmail ? (
              <div>
                <p className="text-sm font-semibold text-slate-900">{contextEmail.subject}</p>
                <p className="text-xs text-slate-500">{contextEmail.sender}</p>
              </div>
            ) : (
              <p className="text-xs text-slate-500">None</p>
            )}
          </div>
          <div className="rounded-xl border border-slate-200 p-3">
            <p className="text-xs text-slate-500 mb-1">Filters</p>
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" checked={filters.urgent} onChange={(e) => setFilters((f) => ({ ...f, urgent: e.target.checked }))} /> Urgent only
            </label>
          </div>
          {contextEmail && (
            <div className="rounded-xl border border-slate-200 p-3 space-y-2">
              <p className="text-xs text-slate-500">Email Context</p>
              <div>
                <p className="text-sm font-semibold">Action Items</p>
                <ul className="mt-1 space-y-1">
                  {related.actions.map((a) => (
                    <li key={a.id} className="text-xs text-slate-700">• {a.task_description}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-sm font-semibold">Drafts</p>
                <ul className="mt-1 space-y-1">
                  {related.drafts.map((d) => (
                    <li key={d.id} className="text-xs text-slate-700">• {d.subject || 'Draft'}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          <div className="rounded-xl border border-slate-200 p-3 space-y-2">
            <p className="text-xs text-slate-500">Suggested prompts</p>
            <div className="flex flex-wrap gap-2">
              {['Summarize emails from today', 'What meetings do I have this week?', 'Show emails needing replies'].map((t) => (
                <span key={t} className="px-2 py-1 rounded-full bg-slate-100 text-xs text-slate-600">{t}</span>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {showAttach && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div className="w-full max-w-xl bg-white rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold">Attach emails</p>
              <button type="button" onClick={() => setShowAttach(false)} className="rounded-full border border-slate-200 px-2 py-1 text-xs"><X className="h-3 w-3" /></button>
            </div>
            <div className="max-h-80 overflow-y-auto space-y-2">
              {emails.map((e) => (
                <label key={e.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={attachedEmails.includes(e.id)} onChange={(ev) => {
                    const checked = ev.target.checked;
                    setAttachedEmails((prev) => {
                      const next = new Set(prev);
                      checked ? next.add(e.id) : next.delete(e.id);
                      return Array.from(next);
                    });
                  }} />
                  <span className="line-clamp-1">#{e.id} {e.subject}</span>
                </label>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-end gap-2">
              <button type="button" onClick={() => setShowAttach(false)} className="rounded-full border border-slate-200 px-3 py-1 text-xs">Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
