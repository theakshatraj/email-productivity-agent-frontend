'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const sizes = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-none',
};

export default function Modal({ isOpen, onClose, title, children, size = 'md', closeButton = true }) {
  const ref = useRef(null);
  const focusablesRef = useRef([]);

  useEffect(() => {
    const body = document.body;
    if (isOpen) body.classList.add('overflow-hidden');
    else body.classList.remove('overflow-hidden');
    return () => body.classList.remove('overflow-hidden');
  }, [isOpen]);

  useEffect(() => {
    const onKey = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose?.();
      if (e.key === 'Tab') {
        const els = focusablesRef.current;
        if (!els.length) return;
        const idx = els.indexOf(document.activeElement);
        if (e.shiftKey) {
          const next = idx <= 0 ? els[els.length - 1] : els[idx - 1];
          next.focus();
          e.preventDefault();
        } else {
          const next = idx === els.length - 1 ? els[0] : els[idx + 1];
          next.focus();
          e.preventDefault();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const root = ref.current;
    const els = root?.querySelectorAll('a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])') || [];
    focusablesRef.current = Array.from(els);
    focusablesRef.current[0]?.focus();
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const content = (
    <div className="fixed inset-0 z-[1100]" aria-modal="true" role="dialog">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 flex items-end md:items-center justify-center p-4">
        <div ref={ref} className={`w-full ${sizes[size]} ${size === 'full' ? '' : 'md:' + sizes[size]} bg-white rounded-t-2xl md:rounded-2xl shadow-panel`}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
            <p className="text-sm font-semibold text-slate-900">{title}</p>
            {closeButton && (
              <button type="button" onClick={onClose} className="rounded-full p-1 text-slate-400 hover:text-slate-600"><X className="h-4 w-4" /></button>
            )}
          </div>
          <div className="p-4">{children}</div>
        </div>
      </div>
    </div>
  );

  return typeof window !== 'undefined' ? createPortal(content, document.getElementById('modal-root') || document.body) : null;
}
