"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useEmail } from "@/context/EmailContext";
import {
  Mail,
  Search,
  Filter,
  ChevronsUpDown,
  CheckCircle2,
  Trash2,
  MoreHorizontal,
  Clock,
} from "lucide-react";
import * as api from "@/lib/api";

const categoryColors = {
  Important: "bg-red-600 text-white",
  "To-Do": "bg-emerald-500 text-white",
  Meeting: "bg-indigo-500 text-white",
  Newsletter: "bg-blue-500 text-white",
  "Project Update": "bg-indigo-700 text-white",
  Spam: "bg-gray-400 text-white",
};

const formatWhen = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now - d;
  const diffH = Math.floor(diffMs / 3600000);
  if (diffH < 24) return diffH <= 1 ? "1 hour ago" : `${diffH} hours ago`;
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();
  if (isYesterday) return "Yesterday";
  const opts = { month: "short", day: "numeric" };
  return d.toLocaleDateString(undefined, opts);
};

export default function EmailList({ onEmailSelect, showFilters = true, compact = false }) {
  const {
    emails,
    loading,
    error,
    selectedEmail,
    selectEmail,
    deleteEmail,
    refreshStats,
  } = useEmail();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [processedOnly, setProcessedOnly] = useState(false);
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [sortBy, setSortBy] = useState("date_desc");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [menuOpenId, setMenuOpenId] = useState(null);

  const gridRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(-1);

  const handleOpen = useMemo(() => {
    return async (id) => {
      await selectEmail(id);
      if (onEmailSelect) onEmailSelect(emails.find((e) => e.id === id));
    };
  }, [selectEmail, emails, onEmailSelect]);

  const categories = useMemo(() => {
    const set = new Set(["All"]);
    emails.forEach((e) => set.add(e.category || "Uncategorized"));
    return Array.from(set);
  }, [emails]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    const start = dateStart ? new Date(dateStart).getTime() : null;
    const end = dateEnd ? new Date(dateEnd).getTime() : null;
    let list = emails.filter((e) => {
      const matchCat = category === "All" || (e.category || "Uncategorized") === category;
      const proc = processedOnly ? e.is_processed === 1 || e.is_processed === true : true;
      const t = e.timestamp ? new Date(e.timestamp).getTime() : null;
      const inRange = (!start || (t && t >= start)) && (!end || (t && t <= end));
      const text = `${e.sender || ""} ${e.subject || ""} ${e.body || ""}`.toLowerCase();
      const matchSearch = !s || text.includes(s);
      return matchCat && proc && inRange && matchSearch;
    });
    switch (sortBy) {
      case "date_asc":
        list.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        break;
      case "sender_asc":
        list.sort((a, b) => (a.sender || "").localeCompare(b.sender || ""));
        break;
      case "sender_desc":
        list.sort((a, b) => (b.sender || "").localeCompare(a.sender || ""));
        break;
      case "category":
        list.sort((a, b) => (a.category || "").localeCompare(b.category || ""));
        break;
      default:
        list.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }
    return list;
  }, [emails, search, category, processedOnly, dateStart, dateEnd, sortBy]);

  useEffect(() => {
    const el = gridRef.current;
    const onKey = (e) => {
      if (!filtered.length) return;
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        const item = filtered[Math.max(activeIndex, 0)];
        if (item) handleOpen(item.id);
      }
    };
    el?.addEventListener("keydown", onKey);
    return () => el?.removeEventListener("keydown", onKey);
  }, [filtered, activeIndex, handleOpen]);

  useEffect(() => {
    if (activeIndex >= 0 && gridRef.current) {
      const child = gridRef.current.querySelectorAll("[data-email-card]")[activeIndex];
      child?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);


  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const bulkDelete = async () => {
    const ids = Array.from(selectedIds);
    for (const id of ids) {
      await deleteEmail(id);
    }
    setSelectedIds(new Set());
  };

  const quickProcess = async (id) => {
    await api.processEmail(id);
    await refreshStats();
  };

  const header = (
    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
          <Mail className="h-5 w-5" />
        </div>
        <div>
          <p className="section-title">Inbox</p>
          <p className="text-lg font-semibold text-slate-900">Emails</p>
        </div>
      </div>
      <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
        {filtered.length} shown
      </span>
    </div>
  );

  const filters = (
    <div className="px-6 py-4 flex flex-col gap-3 border-b border-slate-100">
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search sender, subject, body"
            className="w-64 rounded-full border border-slate-200 bg-slate-50/60 pl-10 pr-3 py-2 text-sm focus-visible:outline-primary"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <label className="inline-flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={processedOnly}
            onChange={(e) => setProcessedOnly(e.target.checked)}
          />
          Processed
        </label>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-slate-400" />
          <input
            type="date"
            value={dateStart}
            onChange={(e) => setDateStart(e.target.value)}
            className="rounded-full border border-slate-200 px-2 py-1"
          />
          <span className="text-slate-400">to</span>
          <input
            type="date"
            value={dateEnd}
            onChange={(e) => setDateEnd(e.target.value)}
            className="rounded-full border border-slate-200 px-2 py-1"
          />
        </div>
        <div className="flex items-center gap-2">
          <ChevronsUpDown className="h-4 w-4 text-slate-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            <option value="date_desc">Newest</option>
            <option value="date_asc">Oldest</option>
            <option value="sender_asc">Sender A–Z</option>
            <option value="sender_desc">Sender Z–A</option>
            <option value="category">Category</option>
          </select>
        </div>
        {selectedIds.size > 0 && (
          <button
            type="button"
            onClick={bulkDelete}
            className="ml-auto inline-flex items-center gap-2 rounded-full bg-red-600 text-white px-3 py-2 text-xs"
          >
            <Trash2 className="h-4 w-4" /> Delete selected
          </button>
        )}
      </div>
    </div>
  );

  const skeleton = (
    <div className="grid gap-4 p-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: compact ? 6 : 9 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 animate-pulse">
          <div className="h-4 bg-slate-200 rounded w-2/3 mb-2" />
          <div className="h-3 bg-slate-200 rounded w-1/3 mb-4" />
          <div className="h-3 bg-slate-200 rounded w-full mb-2" />
          <div className="h-3 bg-slate-200 rounded w-5/6" />
        </div>
      ))}
    </div>
  );

  const empty = (
    <div className="p-8 text-center text-slate-500">
      No emails match your filters.
    </div>
  );

  const errorState = (
    <div className="p-8 text-center">
      <p className="text-red-600">{error}</p>
      <button
        type="button"
        onClick={() => onEmailSelect ? null : null}
        className="mt-3 rounded-full bg-primary text-white px-4 py-2 text-sm"
      >
        Retry
      </button>
    </div>
  );

  const cards = (
    <div
      ref={gridRef}
      tabIndex={0}
      className={`grid gap-4 p-6 outline-none ${
        compact ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
      }`}
    >
      {filtered.map((email, idx) => {
        const isActive = selectedEmail?.id === email.id;
        const avatar = (email.sender || "?").trim().charAt(0).toUpperCase();
        const subject = (email.subject || "").slice(0, 60);
        const bodyPreview = (email.body || "").slice(0, 100);
        const when = formatWhen(email.timestamp);
        const cat = email.category || "Uncategorized";
        const badgeClass = categoryColors[cat] || "bg-slate-100 text-slate-600";
        const unread = !email.is_processed;

        return (
          <div
            key={email.id}
            data-email-card
            className={`group rounded-xl border border-slate-200 bg-white p-4 transition shadow-sm hover:shadow-md ${
              isActive ? "ring-2 ring-primary/40" : ""
            }`}
          >
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={selectedIds.has(email.id)}
                onChange={() => toggleSelect(email.id)}
                className="mt-1"
              />
              <button
                type="button"
                onClick={() => handleOpen(email.id)}
                className="flex-1 text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center font-semibold text-slate-700">
                      {avatar}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">{email.sender}</p>
                      <p className="text-xs text-slate-400">{when}</p>
                    </div>
                  </div>
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${badgeClass}`}>
                    {cat}
                  </span>
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-900">{subject}</p>
                <p className="text-sm text-slate-500 mt-1">{bodyPreview}</p>
                <div className="mt-3 flex items-center gap-3">
                  {unread && <span className="inline-flex h-2 w-2 rounded-full bg-primary" />}
                  <span className="text-xs text-slate-400">ID #{email.id}</span>
                </div>
              </button>
              <div className="relative">
                <button
                  type="button"
                  className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
                  onClick={() => setMenuOpenId((v) => (v === email.id ? null : email.id))}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
                {menuOpenId === email.id && (
                  <div className="absolute right-0 mt-2 w-36 rounded-xl border border-slate-200 bg-white shadow">
                    {!email.is_processed && (
                      <button
                        type="button"
                        onClick={() => quickProcess(email.id)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50"
                      >
                        <CheckCircle2 className="h-4 w-4 text-green-600" /> Process
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => deleteEmail(email.id)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" /> Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="card p-0 overflow-hidden">
      {header}
      {showFilters && filters}
      {loading ? skeleton : error ? errorState : filtered.length ? cards : empty}
    </div>
  );
}
