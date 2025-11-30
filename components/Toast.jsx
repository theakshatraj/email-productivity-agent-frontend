'use client';

import { CheckCircle, XCircle, AlertTriangle, Info, Loader2, X } from 'lucide-react';
import { useRef } from 'react';

export default function Toast({ toast, onClose, onPause }) {
  const hoverRef = useRef(false);

  const icon = {
    success: <CheckCircle className="h-5 w-5 text-green-600" />,
    error: <XCircle className="h-5 w-5 text-red-600" />,
    warning: <AlertTriangle className="h-5 w-5 text-yellow-600" />,
    info: <Info className="h-5 w-5 text-blue-600" />,
    loading: <Loader2 className="h-5 w-5 animate-spin text-slate-600" />,
  }[toast.type];

  const barWidth = toast.duration ? Math.max(0, Math.min(100, (toast.remaining / toast.duration) * 100)) : 0;

  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white shadow-xl transition-all opacity-100 translate-y-0 p-3`}
      onMouseEnter={() => {
        hoverRef.current = true;
        onPause(true);
      }}
      onMouseLeave={() => {
        hoverRef.current = false;
        onPause(false);
      }}
      role="status"
    >
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-sm text-slate-800 flex-1">{toast.message}</p>
        <button type="button" onClick={onClose} className="rounded-full p-1 text-slate-400 hover:text-slate-600">
          <X className="h-4 w-4" />
        </button>
      </div>
      {toast.duration && (
        <div className="mt-2 h-1 rounded bg-slate-100">
          <div className="h-1 rounded bg-slate-400" style={{ width: `${barWidth}%` }} />
        </div>
      )}
    </div>
  );
}
