"use client";

import { useEffect, useMemo, useState } from "react";
import { useEmail } from "@/context/EmailContext";
import { Save, Edit, X, Plus, RefreshCcw, TestTube2, Upload, Download, Clipboard } from "lucide-react";
import * as api from "@/lib/api";

const PromptCard = ({ prompt, onSave, onDelete, onTest }) => {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(prompt.prompt_text || "");
  const [description, setDescription] = useState(prompt.description || "");
  const count = text.length;

  const save = async () => {
    if (!text.trim()) return;
    await onSave(prompt.id, { prompt_text: text, description });
    setEditing(false);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">{prompt.name}</p>
          <p className="text-xs text-slate-500">{prompt.updated_at ? new Date(prompt.updated_at).toLocaleString() : ""}</p>
        </div>
        <div className="flex items-center gap-2">
          {!editing ? (
            <>
              <button type="button" onClick={() => setEditing(true)} className="rounded-full border border-slate-200 px-3 py-1 text-xs"><Edit className="h-3 w-3" /></button>
              <button type="button" onClick={() => onTest(prompt)} className="rounded-full border border-slate-200 px-3 py-1 text-xs"><TestTube2 className="h-3 w-3" /></button>
              {prompt.is_default ? null : (
                <button type="button" onClick={() => onDelete(prompt.id)} className="rounded-full border border-slate-200 px-3 py-1 text-xs">Delete</button>
              )}
            </>
          ) : (
            <>
              <button type="button" onClick={() => setEditing(false)} className="rounded-full border border-slate-200 px-3 py-1 text-xs"><X className="h-3 w-3" /></button>
              <button type="button" onClick={save} className="rounded-full bg-primary text-white px-3 py-1 text-xs"><Save className="h-3 w-3" /></button>
            </>
          )}
        </div>
      </div>

      {!editing ? (
        <pre className="text-sm text-slate-700 whitespace-pre-wrap">{text}</pre>
      ) : (
        <div className="space-y-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full h-40 rounded-lg border border-slate-200 bg-slate-50/60 p-3 text-sm"
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            className="w-full rounded-lg border border-slate-200 bg-white p-2 text-sm"
          />
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">{count} characters</span>
            <button type="button" onClick={() => navigator.clipboard.writeText(text)} className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2 py-1"><Clipboard className="h-3 w-3" />Copy</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default function PromptEditor() {
  const { prompts, loadPrompts, updatePrompt, resetPrompts } = useEmail();
  const [showTemplates, setShowTemplates] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    loadPrompts();
  }, [loadPrompts]);

  const onCreate = async () => {
    const name = prompt("Prompt name?");
    if (!name) return;
    const text = prompt("Prompt text?") || "";
    await api.createPrompt({ name, prompt_text: text, description: "Custom" });
    await loadPrompts();
  };

  const onDelete = async (id) => {
    if (!confirm("Delete this prompt?")) return;
    await api.deletePrompt(id);
    await loadPrompts();
  };

  const onTest = async (p) => {
    setShowModal(true);
    setTestResult(null);
    const emails = await api.getAllEmails();
    const sample = emails.success && emails.data.length ? emails.data[0] : null;
    if (!sample) {
      setTestResult({ error: "No sample email" });
      return;
    }
    const res = await api.testPrompt({ prompt_text: p.prompt_text, email_id: sample.id, prompt_type: p.name });
    setTestResult(res.success ? { output: res.data } : { error: res.error });
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(prompts || [], null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "prompts.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJson = async (file) => {
    setImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (Array.isArray(data)) {
        for (const p of data) {
          if (p.id) await updatePrompt(p.id, { prompt_text: p.prompt_text, description: p.description });
          else await api.createPrompt({ name: p.name, prompt_text: p.prompt_text, description: p.description });
        }
        await loadPrompts();
      }
    } finally {
      setImporting(false);
    }
  };

  const templates = [
    { name: "Categorization", text: "Classify emails into: Important, To-Do, Meeting, Newsletter, Project Update, Spam." },
    { name: "Action Item Extraction", text: "Extract actionable tasks with clear owners and deadlines in JSON." },
    { name: "Auto-Reply", text: "Draft concise, professional replies adhering to sender tone and context." },
    { name: "Summarization", text: "Summarize the email in 3 bullet points with key dates and commitments." },
  ];

  return (
    <div className="card p-0 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <p className="section-title">Prompt management</p>
          <p className="text-lg font-semibold text-slate-900">Configure agent intelligence</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onCreate} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm"><Plus className="h-4 w-4" />New</button>
          <button type="button" onClick={exportJson} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm"><Download className="h-4 w-4" />Export</button>
          <label className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm cursor-pointer">
            <Upload className="h-4 w-4" />
            Import
            <input type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files?.[0] && importJson(e.target.files[0])} />
          </label>
          <button type="button" onClick={() => resetPrompts()} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm"><RefreshCcw className="h-4 w-4" />Reset</button>
        </div>
      </div>

      <div className="p-6 grid gap-4 md:grid-cols-2">
        {prompts && prompts.length ? (
          prompts.map((p) => (
            <PromptCard key={`${p.id}-${p.updated_at || ''}`} prompt={p} onSave={updatePrompt} onDelete={onDelete} onTest={onTest} />
          ))
        ) : (
          <div className="text-slate-500">No prompts</div>
        )}
      </div>

      <div className="px-6 pb-6">
        <button type="button" onClick={() => setShowTemplates((v) => !v)} className="rounded-full border border-slate-200 px-3 py-2 text-sm">Templates</button>
        {showTemplates && (
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {templates.map((t) => (
              <div key={t.name} className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-900 mb-2">{t.name}</p>
                <pre className="text-sm text-slate-700 whitespace-pre-wrap">{t.text}</pre>
                <button type="button" onClick={() => navigator.clipboard.writeText(t.text)} className="mt-3 rounded-full border border-slate-200 px-3 py-1 text-xs">Copy</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center">
          <div className="w-full md:max-w-3xl bg-white rounded-t-2xl md:rounded-2xl shadow-panel p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold">Test Result</p>
              <button type="button" onClick={() => setShowModal(false)} className="rounded-full border border-slate-200 px-3 py-1 text-xs">Close</button>
            </div>
            {!testResult ? (
              <div className="text-slate-500">Running test...</div>
            ) : testResult.error ? (
              <div className="text-red-600 text-sm">{testResult.error}</div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-slate-200 p-3">
                  <p className="text-xs text-slate-500 mb-2">LLM Output</p>
                  <pre className="text-sm whitespace-pre-wrap">{JSON.stringify(testResult.output, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
