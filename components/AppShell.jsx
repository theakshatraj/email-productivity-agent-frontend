'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

export default function AppShell({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);
  const router = useRouter();
  const mainRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      if (e.altKey) {
        if (e.key === '1') router.push('/');
        if (e.key === '2') router.push('/inbox');
        if (e.key === '3') router.push('/prompts');
        if (e.key === '4') router.push('/agent');
        if (e.key === '5') router.push('/drafts');
      }
      if (e.key === '/') {
        const el = document.querySelector('input[type="search"]');
        el?.focus();
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [router]);

  const navigate = (href) => {
    setRouteLoading(true);
    router.push(href);
    setTimeout(() => setRouteLoading(false), 600);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:bg-white focus:text-slate-900 focus:px-3 focus:py-1 focus:rounded">
        Skip to content
      </a>

      <div className={`fixed top-0 left-0 right-0 h-0.5 ${routeLoading ? 'bg-primary' : 'bg-transparent'}`} />

      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 lg:ml-72">
          <div className="max-w-7xl mx-auto">
            <Header />
          </div>
          <main id="main" ref={mainRef} className="px-4 md:px-6 py-6">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>

      <div id="toast-root" />
      <div id="modal-root" />
    </div>
  );
}
