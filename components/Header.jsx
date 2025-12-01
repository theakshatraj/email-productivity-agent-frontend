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
    <header className="sticky top-0 z-40 border-b border-secondary-100 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="flex flex-col gap-4 px-4 md:px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-secondary-500 mb-1">Control center</p>
            <h1 className="text-2xl font-bold text-secondary-900">Email Productivity Agent</h1>
          </div>
          <div className="flex items-center gap-4">
            <GlobalSearch />
            <button
              type="button"
              className="relative p-2.5 rounded-lg bg-secondary-100 text-secondary-600 hover:bg-secondary-200 hover:text-secondary-900 transition-all duration-200"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-1 top-1 inline-flex h-2.5 w-2.5 rounded-full bg-danger-500 animate-pulse-soft" />
            </button>
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-primary-dark text-white flex items-center justify-center font-semibold text-sm">
              JD
            </div>
          </div>
        </div>
        <nav className="flex gap-1.5 text-sm font-semibold lg:hidden overflow-x-auto pb-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

