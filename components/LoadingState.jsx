'use client';

import { Loader2 } from 'lucide-react';

const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse rounded-lg bg-slate-200/60 ${className}`} />
);

export default function LoadingState({ type = 'spinner', message = 'Loading…', size = 'md' }) {
  if (type === 'spinner') {
    const s = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-8 w-8' : 'h-6 w-6';
    return (
      <div className="flex items-center gap-3 text-slate-600">
        <Loader2 className={`${s} animate-spin`} />
        <span className="text-sm">{message}</span>
      </div>
    );
  }

  if (type === 'email-list') {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-12" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'email-detail') {
    return (
      <div className="space-y-3">
        <Skeleton className="h-7 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (type === 'card') {
    return <Skeleton className="h-32 w-full" />;
  }

  if (type === 'table') {
    return (
      <div className="space-y-2">
        <Skeleton className="h-6 w-1/3" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  return null;
}
