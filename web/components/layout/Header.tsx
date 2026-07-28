'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Search,
  Bell,
  MessageSquare,
  ChevronDown,
  User,
  Settings,
  LogOut,
} from 'lucide-react';
import { useAppStore } from '@/lib/state/app-store';

interface HeaderProps {
  title?: string;
}

export function Header({ title = 'Enterprise Workspace' }: HeaderProps) {
  const router = useRouter();
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const toggleLanguage = useAppStore((s) => s.toggleLanguage);
  const setLoggedIn = useAppStore((s) => s.setLoggedIn);
  const lang = useAppStore((s) => s.appState.lang);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const handleLogout = () => {
    setLoggedIn(false);
    router.push('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <button
          type="button"
          onClick={toggleSidebar}
          className="hidden md:inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-4 h-4" />
        </button>
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-slate-900 tracking-tight truncate">{title}</h2>
          <p className="text-[11px] font-medium text-slate-500 truncate max-md:hidden">Shared navigation and workspace tools</p>
        </div>
      </div>

      <div className="flex-1 max-w-xl px-4 md:px-8 hidden lg:block">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <input
            type="text"
            className="w-full bg-slate-100/50 border border-transparent text-sm rounded-xl pl-10 pr-4 py-2.5 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-400"
            placeholder="Global search..."
          />
          <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
            <span className="text-[10px] font-medium text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-sm">Ctrl K</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Link href="/notifications" className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all relative cursor-pointer">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-blue-600 rounded-full border border-white" />
        </Link>
        <button type="button" className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all cursor-pointer">
          <MessageSquare className="w-4 h-4" />
        </button>

        <div className="h-8 w-px bg-slate-200" />

        <button
          type="button"
          onClick={toggleLanguage}
          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-bold tracking-wider transition-colors cursor-pointer"
        >
          <span className={lang === 'en' ? 'text-slate-900' : 'text-slate-400'}>EN</span>
          {' | '}
          <span className={lang === 'bn' ? 'text-slate-900' : 'text-slate-400'}>বাংলা</span>
        </button>

        <div className="h-8 w-px bg-slate-200" />

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 p-1 hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
          >
            <div className="h-7 w-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">JD</div>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 rounded-xl bg-white border border-slate-200 shadow-lg z-50">
              <div className="p-3 border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-800">John Doe</p>
                <p className="text-xs text-slate-500">Administrator</p>
              </div>
              <div className="p-1">
                <Link href="/settings/profile" className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer">
                  <User className="w-4 h-4" /> Profile
                </Link>
                <Link href="/settings/company" className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer">
                  <Settings className="w-4 h-4" /> Settings
                </Link>
              </div>
              <div className="p-1 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors text-left cursor-pointer"
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
