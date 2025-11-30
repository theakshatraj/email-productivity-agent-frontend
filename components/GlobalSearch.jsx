'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, FileText, CheckSquare, Search, SlidersHorizontal, X } from 'lucide-react';
import { useEmail } from '@/context/EmailContext';
import { searchEmails, highlightMatches, parseSearchQuery, buildSearchFilters } from '@/lib/searchUtils';
import Modal from '@/components/Modal';

const LS_HISTORY = 'global-search-history';
const LS_ANALYTICS = 'global-search-analytics';

export default function GlobalSearch() {
  const { emails, drafts, actions } = useEmail();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [results, setResults] = useState({ emails: [], drafts: [], actions: [] });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [history, setHistory] = useState([]);
  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(LS_HISTORY) : null;
      setHistory(raw ? JSON.parse(raw) : []);
    } catch {}
  }, []);
  const [filters, setFilters] = useState({ dateRange: null, categories: [], sender: '', hasActions: false, unread: false, processed: false });
  const inputRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 0);
        e.preventDefault();
      }
      if (e.key === 'Escape') setOpen(false);
      if (!open) return;
      if (e.key === 'ArrowDown') setActiveIndex((i) => Math.min(i + 1, allResults().length - 1));
      if (e.key === 'ArrowUp') setActiveIndex((i) => Math.max(i - 1, 0));
      if (e.key === 'Enter') openSelected();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, results]);

  useEffect(() => {
    if (!open) return;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(runSearch, 300);
    return () => clearTimeout(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, filters, open]);

  const allResults = () => {
    return [
      ...results.emails.map((e) => ({ type: 'email', item: e })),
      ...results.drafts.map((d) => ({ type: 'draft', item: d })),
      ...results.actions.map((a) => ({ type: 'action', item: a })),
    ];
  };

  const runSearch = () => {
    setBusy(true);
    const parsed = buildSearchFilters(parseSearchQuery(query));
    const em = searchEmails(query, emails).slice(0, 5);
    const dr = drafts.filter((d) => (parsed.terms?.length ? String(d.subject || '').toLowerCase().includes(parsed.terms[0].toLowerCase()) || String(d.body || '').toLowerCase().includes(parsed.terms[0].toLowerCase()) : true)).slice(0, 3);
    const ac = actions.filter((a) => (parsed.hasActions ? true : true) && (parsed.terms?.length ? String(a.task_description || '').toLowerCase().includes(parsed.terms[0].toLowerCase()) : true)).slice(0, 3);
    setResults({ emails: em, drafts: dr, actions: ac });
    setActiveIndex(0);
    setBusy(false);
    saveHistory(query);
    trackAnalytics(query);
  };

  const saveHistory = (q) => {
    if (!q?.trim()) return;
    setHistory((prev) => {
      const next = [q.trim(), ...prev.filter((x) => x !== q.trim())].slice(0, 10);
      localStorage.setItem(LS_HISTORY, JSON.stringify(next));
      return next;
    });
  };

  const trackAnalytics = (q) => {
    try {
      const raw = localStorage.getItem(LS_ANALYTICS);
      const data = raw ? JSON.parse(raw) : {};
      const key = q.trim().toLowerCase();
      if (!key) return;
      data[key] = (data[key] || 0) + 1;
      localStorage.setItem(LS_ANALYTICS, JSON.stringify(data));
    } catch {}
  };

  const openSelected = () => {
    const flat = allResults();
    const sel = flat[activeIndex];
    if (!sel) return;
    if (sel.type === 'email') router.push(`/inbox?id=${sel.item.id}`);
    if (sel.type === 'draft') router.push('/drafts');
    if (sel.type === 'action') router.push('/actions');
    setOpen(false);
  };

  return (
    <div className="relative">
      <div className="relative w-full max-w-xs">
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          placeholder="Search workspace…"
          className="w-full rounded-full border border-slate-200 bg-slate-50/60 px-4 py-2 pl-10 text-sm focus-visible:outline-primary focus-visible:bg-white transition"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <button type="button" onClick={() => setShowAdvanced(true)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:text-slate-600">
          <SlidersHorizontal className="h-4 w-4" />
        </button>
      </div>

      {open && (
        <div className="absolute z-50 mt-2 w-[28rem] max-w-[90vw] rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100">
            <p className="text-xs text-slate-500">Search results</p>
            <button type="button" onClick={() => setOpen(false)} className="rounded-full p-1 text-slate-400 hover:text-slate-600"><X className="h-4 w-4" /></button>
          </div>
          <div className="p-3 space-y-3">
            {busy && <div className="text-sm text-slate-500">Searching…</div>}
            {!busy && allResults().length === 0 && (
              <div className="text-sm text-slate-500">No results. Try category filters or advanced search.</div>
            )}
            {results.emails.length > 0 && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Emails</p>
                <ul className="space-y-1">
                  {results.emails.map((e, idx) => (
                    <li key={e.id} onMouseEnter={() => setActiveIndex(idx)} onClick={() => router.push(`/inbox?id=${e.id}`)} className={`flex items-start gap-2 rounded-lg px-2 py-1 ${activeIndex === idx ? 'bg-slate-100' : ''}`}>
                      <Mail className="h-4 w-4 text-slate-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-slate-900" dangerouslySetInnerHTML={{ __html: highlightMatches(e.subject || '', query) }} />
                        <p className="text-[11px] text-slate-500" dangerouslySetInnerHTML={{ __html: highlightMatches((e.body || '').slice(0, 90), query) }} />
                      </div>
                      <span className="text-[11px] text-slate-400">{e.category || 'Uncategorized'}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {results.drafts.length > 0 && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Drafts</p>
                <ul className="space-y-1">
                  {results.drafts.map((d, idx) => (
                    <li key={d.id} onMouseEnter={() => setActiveIndex(results.emails.length + idx)} onClick={() => router.push('/drafts')} className={`flex items-start gap-2 rounded-lg px-2 py-1 ${activeIndex === results.emails.length + idx ? 'bg-slate-100' : ''}`}>
                      <FileText className="h-4 w-4 text-slate-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-slate-900" dangerouslySetInnerHTML={{ __html: highlightMatches(d.subject || 'Draft', query) }} />
                        <p className="text-[11px] text-slate-500" dangerouslySetInnerHTML={{ __html: highlightMatches((d.body || '').slice(0, 90), query) }} />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {results.actions.length > 0 && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Actions</p>
                <ul className="space-y-1">
                  {results.actions.map((a, idx) => (
                    <li key={a.id} onMouseEnter={() => setActiveIndex(results.emails.length + results.drafts.length + idx)} onClick={() => router.push('/actions')} className={`flex items-start gap-2 rounded-lg px-2 py-1 ${activeIndex === results.emails.length + results.drafts.length + idx ? 'bg-slate-100' : ''}`}>
                      <CheckSquare className="h-4 w-4 text-slate-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-slate-900" dangerouslySetInnerHTML={{ __html: highlightMatches(a.task_description || '', query) }} />
                        <p className="text-[11px] text-slate-500">{a.status}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {history.length > 0 && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Recent</p>
                <div className="flex flex-wrap gap-2">
                  {history.map((h) => (
                    <button key={h} type="button" onClick={() => setQuery(h)} className="px-2 py-1 rounded-full bg-slate-100 text-[11px] text-slate-600">{h}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <Modal isOpen={showAdvanced} onClose={() => setShowAdvanced(false)} title="Advanced Search" size="lg">
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="text-xs text-slate-500">Sender</label>
            <input value={filters.sender} onChange={(e) => setFilters((f) => ({ ...f, sender: e.target.value }))} className="w-full rounded-lg border border-slate-200 bg-white p-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-slate-500">Category</label>
            <select multiple value={filters.categories} onChange={(e) => setFilters((f) => ({ ...f, categories: Array.from(e.target.selectedOptions).map((o) => o.value) }))} className="w-full rounded-lg border border-slate-200 bg-white p-2 text-sm">
              {['Important', 'To-Do', 'Meeting', 'Newsletter', 'Project Update', 'Spam'].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="col-span-2 grid grid-cols-2 gap-2">
            <label className="text-xs flex items-center gap-2"><input type="checkbox" checked={filters.hasActions} onChange={(e) => setFilters((f) => ({ ...f, hasActions: e.target.checked }))} />Has actions</label>
            <label className="text-xs flex items-center gap-2"><input type="checkbox" checked={filters.unread} onChange={(e) => setFilters((f) => ({ ...f, unread: e.target.checked }))} />Unread</label>
            <label className="text-xs flex items-center gap-2"><input type="checkbox" checked={filters.processed} onChange={(e) => setFilters((f) => ({ ...f, processed: e.target.checked }))} />Processed</label>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-end gap-2">
          <button type="button" onClick={() => setShowAdvanced(false)} className="rounded-full border border-slate-200 px-3 py-2 text-xs">Close</button>
          <button type="button" onClick={() => setShowAdvanced(false)} className="rounded-full bg-primary text-white px-3 py-2 text-xs">Apply</button>
        </div>
      </Modal>
    </div>
  );
}
