'use client';

import Modal from '@/components/Modal';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel', isDangerous = false, icon = null }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-slate-700">
          {icon || <AlertTriangle className="h-5 w-5 text-yellow-600" />}
          <p className="text-sm">{message}</p>
        </div>
        <div className="flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-full border border-slate-200 px-3 py-2 text-xs transition hover:bg-slate-100 active:opacity-90">{cancelText}</button>
          <button type="button" onClick={onConfirm} className={`rounded-full px-3 py-2 text-xs text-white transition ${isDangerous ? 'bg-red-600 hover:bg-red-700' : 'bg-primary hover:bg-primary/90'} active:opacity-90`}>{confirmText}</button>
        </div>
      </div>
    </Modal>
  );
}
