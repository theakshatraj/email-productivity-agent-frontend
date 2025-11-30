'use client';

export default function EmptyState({ icon = null, title = 'Nothing here', message = 'No data available', action = null, onAction }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
      <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-600">
        {icon || <span>∅</span>}
      </div>
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="text-xs text-slate-500 mt-1">{message}</p>
      {action && (
        <button type="button" onClick={onAction} className="mt-3 rounded-full bg-primary text-white px-3 py-2 text-xs">{action}</button>
      )}
    </div>
  );
}
