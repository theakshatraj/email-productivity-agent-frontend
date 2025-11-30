'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Toast from '@/components/Toast';

const ToastContext = createContext(undefined);

const MAX_VISIBLE = 5;

export const ToastProvider = ({ children, position = 'top-right' }) => {
  const [toasts, setToasts] = useState([]);
  const [queue, setQueue] = useState([]);
  const [mounted, setMounted] = useState(false);
  const escRef = useRef(null);

  const pushToast = useCallback((t) => {
    setToasts((prev) => {
      if (prev.length < MAX_VISIBLE) return [...prev, t];
      setQueue((q) => [...q, t]);
      return prev;
    });
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => {
      const next = prev.filter((x) => x.id !== id);
      if (next.length < MAX_VISIBLE && queue.length) {
        const [first, ...rest] = queue;
        setQueue(rest);
        return [...next, first];
      }
      return next;
    });
  }, [queue]);

  const dismissAll = useCallback(() => {
    setToasts([]);
    setQueue([]);
  }, []);

  const pauseToast = useCallback((id, paused) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, paused } : t)));
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') dismissAll();
    };
    escRef.current = onKey;
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dismissAll]);

  useEffect(() => {
    Promise.resolve().then(() => {
      const { startTransition } = require('react');
      startTransition(() => setMounted(true));
    });
  }, []);

  useEffect(() => {
    const tick = setInterval(() => {
      setToasts((prev) =>
        prev.map((t) => {
          if (!t.duration || t.paused) return t;
          const remaining = (t.remaining ?? t.duration) - 100;
          return remaining <= 0 ? { ...t, remaining: 0, expired: true } : { ...t, remaining };
        }),
      );
    }, 100);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    const expired = toasts.filter((t) => t.expired).map((t) => t.id);
    expired.forEach((id) => dismissToast(id));
  }, [toasts, dismissToast]);

  const show = useCallback((type, message, duration = 4000) => {
    const id = Date.now() + Math.random();
    pushToast({ id, type, message, duration, remaining: duration, paused: false });
    return id;
  }, [pushToast]);

  const showSuccess = useCallback((message, duration) => show('success', message, duration), [show]);
  const showError = useCallback((message, duration) => show('error', message, duration), [show]);
  const showWarning = useCallback((message, duration) => show('warning', message, duration), [show]);
  const showInfo = useCallback((message, duration) => show('info', message, duration), [show]);
  const showLoading = useCallback((message) => show('loading', message, null), [show]);

  const value = useMemo(() => ({
    toasts,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoading,
    dismissToast,
    dismissAll,
  }), [toasts, showSuccess, showError, showWarning, showInfo, showLoading, dismissToast, dismissAll]);

  const posClass = position === 'top-right'
    ? 'top-4 right-4'
    : position === 'top-left'
    ? 'top-4 left-4'
    : position === 'bottom-right'
    ? 'bottom-4 right-4'
    : 'bottom-4 left-4';

  const stack = (
    <div className={`fixed z-[1000] ${posClass} space-y-2 w-80`} aria-live="polite" aria-atomic="true">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onClose={() => dismissToast(t.id)} onPause={(p) => pauseToast(t.id, p)} />
      ))}
    </div>
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {mounted && createPortal(stack, document.getElementById('toast-root') || document.body)}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};
