"use client";

import { useEffect, useMemo, useState } from "react";
import DraftManager from "@/components/DraftManager";
import { useEmail } from "@/context/EmailContext";
import { Plus, Wand2, Grid2X2, List } from "lucide-react";
import * as api from "@/lib/api";

export default function DraftsPage() {
  const { drafts, loadDrafts, emails } = useEmail();
  const [view, setView] = useState("list");

  useEffect(() => {
    loadDrafts();
  }, [loadDrafts]);

  const count = drafts.length;

  const generateAI = async () => {
    const e = emails[0];
    if (!e) return alert("No emails available to generate from");
    const res = await api.generateDraft(e.id, { instruction: "Create a polite reply acknowledging receipt and next steps." });
    if (!res.success) return alert(res.error || "Failed");
    await loadDrafts();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="section-title">Drafts</p>
          <h1 className="text-2xl font-semibold text-slate-900">Email Drafts</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">{count} total</span>
          <button type="button" className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm"><Plus className="h-4 w-4" />New Draft</button>
          <button type="button" onClick={generateAI} className="inline-flex items-center gap-2 rounded-full bg-secondary text-white px-3 py-2 text-sm"><Wand2 className="h-4 w-4" />Generate with AI</button>
          <button type="button" onClick={() => setView((v) => (v === 'list' ? 'grid' : 'list'))} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm">
            {view === 'list' ? <Grid2X2 className="h-4 w-4" /> : <List className="h-4 w-4" />} View
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[40%_60%]">
        <div className="space-y-3 min-w-0">
          {/* Filters are implemented within DraftManager */}
          <DraftManager />
        </div>
        <div className="hidden lg:block min-w-0">
          {/* Right panel reserved for future embedded editor; current editor opens as modal within DraftManager */}
          <div className="rounded-xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">Select a draft to edit</div>
        </div>
      </div>
    </div>
  );
}
