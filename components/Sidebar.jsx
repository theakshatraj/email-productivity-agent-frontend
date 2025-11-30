'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import {
  Home,
  Mail,
  Settings,
  MessageSquare,
  FileText,
  CheckSquare,
  X,
  LogOut,
} from 'lucide-react';
import { useEmail } from '@/context/EmailContext';

const navItems = [
  { label: 'Dashboard', href: '/', icon: Home },
  { label: 'Inbox', href: '/inbox', icon: Mail },
  { label: 'Prompts', href: '/prompts', icon: Settings },
  { label: 'Agent', href: '/agent', icon: MessageSquare },
  { label: 'Drafts', href: '/drafts', icon: FileText },
  { label: 'Actions', href: '/actions', icon: CheckSquare },
];

const badgeStyles =
  'ml-auto inline-flex items-center justify-center rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-white';

export default function Sidebar({ isOpen = false, onClose = () => {} }) {
  const pathname = usePathname();
  const {
    drafts,
    pendingActionsCount,
    getUnprocessedEmails,
    stats,
  } = useEmail();

  const inboxCount = getUnprocessedEmails()?.length || 0;
  const actionCount = pendingActionsCount || stats?.actions?.pending || 0;
  const draftCount = drafts?.length || 0;

  const counts = useMemo(
    () => ({
      Inbox: inboxCount,
      Actions: actionCount,
      Drafts: draftCount,
    }),
    [inboxCount, actionCount, draftCount],
  );

  const sidebarContent = (
    <div className="flex h-full flex-col bg-slate-900 text-white">
      <div className="flex items-center justify-between px-6 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-primary text-white font-semibold flex items-center justify-center shadow-lg shadow-primary/30">
            EA
          </div>
          <div>
            <p className="text-lg font-semibold tracking-wide">Email Agent</p>
            <p className="text-xs text-white/60">Productivity cockpit</p>
          </div>
        </div>
        <button
          type="button"
          className="text-white/70 transition hover:text-white lg:hidden"
          onClick={onClose}
          aria-label="Close sidebar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 px-3 py-4">
        {navItems.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href || (href === '/' && pathname === '/');
          const count = counts[label];
          return (
            <Link
              key={href}
              href={href}
              title={label}
              onClick={onClose}
              className={`group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium tracking-wide transition-all active:scale-[0.98] ${
                isActive
                  ? 'bg-primary text-white shadow-lg shadow-primary/30'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
              {count > 0 && <span className={badgeStyles}>{count}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-white/5 px-6 py-5 text-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-white font-semibold">
            JD
          </div>
          <div className="flex-1">
            <p className="font-semibold text-white">Jordan D.</p>
            <p className="text-xs text-white/50">Product Operations</p>
          </div>
          <button
            type="button"
            className="rounded-full border border-white/10 p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
            aria-label="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity lg:hidden ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-200 lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
