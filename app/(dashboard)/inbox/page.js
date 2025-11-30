"use client";
import EmailList from '@/components/EmailList';
import EmailDetail from '@/components/EmailDetail';
import { useEffect, useMemo, useState } from 'react';
import { useEmail } from '@/context/EmailContext';
import { useSearchParams, useRouter } from 'next/navigation';
import { RefreshCcw, Zap, List, Grid2X2 } from 'lucide-react';



export default function InboxPage() {
  const { emails, processEmails, loadEmails, selectEmail, selectedEmail } = useEmail();
  const params = useSearchParams();
  const router = useRouter();
  const [viewMode, setViewMode] = useState('list');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    const id = params.get('id');
    if (id) selectEmail(Number(id));
  }, [params, selectEmail]);

  useEffect(() => {
    if (!autoRefresh) return;
    const t = setInterval(() => loadEmails(), 30000);
    return () => clearInterval(t);
  }, [autoRefresh, loadEmails]);

  const total = emails.length;

  const openEmail = (email) => {
    router.push(`/inbox?id=${email.id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="section-title">Inbox</p>
          <h1 className="text-2xl font-semibold text-slate-900">All high-priority threads</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">{total} total</span>
          <button type="button" onClick={() => loadEmails()} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm transition hover:bg-slate-50 active:opacity-90">
            <RefreshCcw className="h-4 w-4" /> Refresh
          </button>
          <button type="button" onClick={() => processEmails()} className="inline-flex items-center gap-2 rounded-full bg-secondary text-white px-3 py-2 text-sm transition hover:bg-secondary/90 active:opacity-90">
            <Zap className="h-4 w-4" /> Process All
          </button>
          <button type="button" onClick={() => setViewMode((v) => (v === 'list' ? 'compact' : 'list'))} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm transition hover:bg-slate-50 active:opacity-90">
            {viewMode === 'list' ? <Grid2X2 className="h-4 w-4" /> : <List className="h-4 w-4" />} View
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[40%_60%]">
        <div className="space-y-3 min-w-0">
          <EmailList onEmailSelect={openEmail} showFilters={true} compact={viewMode === 'compact'} />
        </div>
        <div className="min-w-0">
          <EmailDetail onClose={() => router.push('/inbox')} />
        </div>
      </div>
    </div>
  );
}
