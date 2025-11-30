"use client";
import { useEffect, useMemo, useState } from 'react';
import PromptEditor from '@/components/PromptEditor';
import { useEmail } from '@/context/EmailContext';
import * as api from '@/lib/api';
import { Download, Upload, RotateCcw, TestTube2 } from 'lucide-react';



export default function PromptsPage() {
  const { prompts, loadPrompts, resetPrompts } = useEmail();
  const [tab, setTab] = useState('active');
  const [selected, setSelected] = useState(null);
  const [emailText, setEmailText] = useState('');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    loadPrompts();
  }, [loadPrompts]);

  const exportAll = () => {
    const blob = new Blob([JSON.stringify(prompts || [], null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'prompts.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importAll = async (file) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      for (const p of data) {
        await api.createPrompt({ name: p.name, prompt_text: p.prompt_text, description: p.description });
      }
      await loadPrompts();
    } catch {
      alert('Invalid JSON');
    }
  };

  const runTest = async () => {
    if (!selected) return;
    setBusy(true);
    const start = Date.now();
    const sampleEmailId = null;
    const res = await api.testPrompt({ prompt_text: selected.prompt_text, email_id: sampleEmailId, prompt_type: selected.name, sample_text: emailText });
    const timeMs = Date.now() - start;
    setResult(res.success ? { output: res.data, timeMs } : { error: res.error, timeMs });
    setBusy(false);
  };

  const templates = [
    { name: 'Categorization', text: 'Categorize emails into Important, To-Do, Meeting, Newsletter, Project Update, Spam.' },
    { name: 'Extraction', text: 'Extract tasks with owners and deadlines. Reply in JSON array.' },
    { name: 'Drafting', text: 'Draft concise, polite replies with clear next steps. Limit 180 words.' },
    { name: 'Summarization', text: 'Summarize in 3 bullets including dates and decisions.' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="section-title">Prompts</p>
          <h1 className="text-2xl font-semibold text-slate-900">Prompt Configuration</h1>
          <p className="text-sm text-slate-500">Customize how the AI processes your emails</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => resetPrompts()} className="inline-flex items-center gap-2 rounded-full bg-slate-800 text-white px-3 py-2 text-sm"><RotateCcw className="h-4 w-4" />Reset to Defaults</button>
          <button type="button" onClick={exportAll} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm"><Download className="h-4 w-4" />Export All</button>
          <label className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm cursor-pointer">
            <Upload className="h-4 w-4" /> Import
            <input type="file" accept="application/json" hidden onChange={(e) => e.target.files?.[0] && importAll(e.target.files[0])} />
          </label>
        </div>
      </div>

      <div className="flex gap-2 text-sm">
        {[
          { id: 'active', label: 'Active Prompts' },
          { id: 'library', label: 'Prompt Library' },
          { id: 'playground', label: 'Test Playground' },
          { id: 'docs', label: 'Documentation' },
        ].map((t) => (
          <button key={t.id} type="button" onClick={() => setTab(t.id)} className={`rounded-full px-3 py-1 ${tab === t.id ? 'bg-primary text-white' : 'border border-slate-200'}`}>{t.label}</button>
        ))}
      </div>

      {tab === 'active' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <PromptEditor />
        </div>
      )}

      {tab === 'library' && (
        <div className="grid gap-3 md:grid-cols-2">
          {templates.map((t) => (
            <div key={t.name} className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-slate-900 mb-2">{t.name}</p>
              <pre className="text-sm text-slate-700 whitespace-pre-wrap">{t.text}</pre>
              <button type="button" onClick={() => navigator.clipboard.writeText(t.text)} className="mt-3 rounded-full border border-slate-200 px-3 py-1 text-xs">Copy</button>
            </div>
          ))}
        </div>
      )}

      {tab === 'playground' && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
          <div className="flex items-center gap-2">
            <select value={selected?.id || ''} onChange={(e) => setSelected(prompts.find((p) => String(p.id) === e.target.value) || null)} className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm">
              <option value="">Select prompt</option>
              {prompts.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <button type="button" onClick={runTest} className="inline-flex items-center gap-2 rounded-full bg-primary text-white px-3 py-2 text-sm"><TestTube2 className="h-4 w-4" />Test</button>
          </div>
          <textarea value={emailText} onChange={(e) => setEmailText(e.target.value)} rows={6} placeholder="Paste sample email text" className="w-full rounded-lg border border-slate-200 bg-slate-50/60 p-3 text-sm" />
          {!busy && result && (
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="text-xs text-slate-500 mb-2">Result</p>
                <pre className="text-sm whitespace-pre-wrap">{JSON.stringify(result.output || result.error, null, 2)}</pre>
              </div>
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="text-xs text-slate-500 mb-2">Performance</p>
                <p className="text-sm text-slate-700">Time: {result.timeMs} ms</p>
                <p className="text-xs text-slate-400">Token metrics depends on backend reporting</p>
              </div>
            </div>
          )}
          {busy && <div className="text-slate-500">Running…</div>}
        </div>
      )}

      {tab === 'docs' && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 text-sm">
          <p className="font-semibold">Writing effective prompts</p>
          <ul className="list-disc pl-5 space-y-1 text-slate-700">
            <li>Be explicit about outputs and formats (JSON schemas).</li>
            <li>Provide examples and edge cases.</li>
            <li>Constrain tone and length for drafting.</li>
            <li>Prefer declarative instructions over vague requests.</li>
          </ul>
          <p className="font-semibold">Variable placeholders</p>
          <ul className="list-disc pl-5 space-y-1 text-slate-700">
            <li>{`{{email.subject}}`} – the subject line</li>
            <li>{`{{email.body}}`} – the email body</li>
            <li>{`{{user.tone}}`} – preferred reply tone</li>
          </ul>
          <p className="font-semibold">Examples</p>
          <pre className="whitespace-pre-wrap bg-slate-50 p-3 rounded">Categorize emails into Important, To-Do, Meeting, Newsletter, Project Update, Spam. Return one label only.</pre>
        </div>
      )}
    </div>
  );
}
