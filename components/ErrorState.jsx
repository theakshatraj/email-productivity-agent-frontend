'use client';

import { AlertCircle } from 'lucide-react';
import { useState } from 'react';

export default function ErrorState({ error = 'Something went wrong', details = null, onRetry, onBack }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4">
      <div className="flex items-center gap-2 text-red-700">
        <AlertCircle className="h-5 w-5" />
        <p className="text-sm font-medium">{String(error)}</p>
      </div>
      {details && (
        <div className="mt-2">
          <button type="button" onClick={() => setOpen((v) => !v)} className="text-xs text-red-700 underline">{open ? 'Hide details' : 'Show details'}</button>
          {open && <pre className="mt-1 whitespace-pre-wrap text-xs text-red-800">{String(details)}</pre>}
        </div>
      )}
      <div className="mt-3 flex items-center gap-2">
        {onRetry && (
          <button type="button" onClick={onRetry} className="rounded-full bg-red-600 text-white px-3 py-1 text-xs">Retry</button>
        )}
        {onBack && (
          <button type="button" onClick={onBack} className="rounded-full border border-red-300 text-red-700 px-3 py-1 text-xs">Go back</button>
        )}
      </div>
    </div>
  );
}
