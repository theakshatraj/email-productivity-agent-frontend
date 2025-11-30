'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell } from 'lucide-react';
import GlobalSearch from '@/components/GlobalSearch';

const navLinks = [
  { name: 'Overview', href: '/' },
  { name: 'Inbox', href: '/inbox' },
  { name: 'Prompts', href: '/prompts' },
  { name: 'Agent', href: '/agent' },
  { name: 'Drafts', href: '/drafts' },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="flex flex-col gap-4 px-4 md:px-6 py-5 border-b border-slate-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Control center</p>
          <h1 className="text-2xl font-semibold text-slate-900">Email Productivity Agent</h1>
        </div>
        <div className="flex items-center gap-3">
          <GlobalSearch />
          <button
            type="button"
            className="relative rounded-full border border-slate-200 p-2 text-slate-500 hover:text-primary transition"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-1 top-1 inline-flex h-2 w-2 rounded-full bg-accent" />
          </button>
          <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center font-semibold">
            JD
          </div>
        </div>
      </div>
      <nav className="flex gap-2 text-sm font-medium lg:hidden overflow-x-auto">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-2 rounded-full border ${
                isActive
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-transparent bg-slate-100 text-slate-600'
              }`}
            >
              {link.name}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}

