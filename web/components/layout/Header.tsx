'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { HeaderAlertsDropdown } from '@/components/layout/HeaderAlertsDropdown';
import { HeaderMessagesDropdown } from '@/components/layout/HeaderMessagesDropdown';
import { SidebarCollapseToggle } from '@/components/layout/SidebarCollapseToggle';
import { DateInput } from '@/components/shared/DateInput';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search, User, Settings, LogOut } from 'lucide-react';
import { Icon } from '@iconify/react';
import { useAppStore } from '@/lib/state/app-store';
import type { AppState } from '@/lib/state/types';
import { getProfileView } from '@/lib/services/settings-service';
import { employeeInitials } from '@/lib/services/hrm-service';
import { useClickOutside } from '@/hooks/useClickOutside';
import Image from 'next/image';

interface HeaderProps {
  title?: string;
}

type HeaderPanel = 'messages' | 'alerts' | 'profile' | 'search' | null;

export function Header({ title }: HeaderProps) {
  const router = useRouter();
  const currentUser = useAppStore((s) => s.appState.currentUser);
  const employees = useAppStore((s) => s.appState.employees);
  const toggleLanguage = useAppStore((s) => s.toggleLanguage);
  const toggleMobileSidebar = useAppStore((s) => s.toggleMobileSidebar);
  const mobileSidebarOpen = useAppStore((s) => s.mobileSidebarOpen);
  const logout = useAppStore((s) => s.logout);
  const lang = useAppStore((s) => s.appState.lang);
  const [openPanel, setOpenPanel] = useState<HeaderPanel>(null);
  const [navDate, setNavDate] = useState('');
  const [mobileSearchQuery, setMobileSearchQuery] = useState('');
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const showBrand = !title || title === 'Enterprise Workspace';
  const displayTitle = showBrand ? '' : title;

  const profile = useMemo(
    () => getProfileView({ currentUser, employees } as AppState),
    [currentUser, employees],
  );
  const userName = profile.name || 'User';
  const userEmail = profile.email || '';
  const userInitials = employeeInitials(userName);

  const setMessagesOpen = useCallback(
    (open: boolean) => setOpenPanel(open ? 'messages' : null),
    [],
  );
  const setAlertsOpen = useCallback(
    (open: boolean) => setOpenPanel(open ? 'alerts' : null),
    [],
  );
  const closeProfile = useCallback(() => setOpenPanel((p) => (p === 'profile' ? null : p)), []);
  const closeMobileSearch = useCallback(() => setOpenPanel((p) => (p === 'search' ? null : p)), []);
  useClickOutside(profileMenuRef, closeProfile, openPanel === 'profile');
  useClickOutside(mobileSearchRef, closeMobileSearch, openPanel === 'search');

  useEffect(() => {
    setNavDate(new Date().toISOString().slice(0, 10));
  }, []);

  useEffect(() => {
    if (!openPanel) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenPanel(null);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [openPanel]);

  const handleLogout = () => {
    void logout().finally(() => {
      router.push('/login');
    });
  };

  return (
    <header className="h-16 glass-header px-2 sm:px-3 md:px-5 flex flex-nowrap items-center justify-between gap-1.5 sm:gap-2 shrink-0 sticky top-0 z-20 border-b border-white/40 bg-white/20 backdrop-blur-2xl">
      {/* Left: sidebar toggle + brand */}
      <div className="flex items-center gap-1 sm:gap-1.5 min-w-0 flex-1 md:ml-3">
        <SidebarCollapseToggle
          variant="inline"
          expanded={mobileSidebarOpen}
          onClick={toggleMobileSidebar}
          aria-label={mobileSidebarOpen ? 'Close navigation' : 'Open navigation'}
          aria-expanded={mobileSidebarOpen}
        />
        <div className="min-w-0 shrink-0">
          {showBrand ? (
            <h2 className="m-0 leading-none flex items-center gap-2 whitespace-nowrap">
              <Image
                src="/images/logo-toys.png"
                alt="Toys Factory"
                width={20}
                height={20}
                className="object-contain shrink-0 drop-shadow-xs h-5 w-auto"
                style={{ width: 'auto', height: '1.25rem' }}
                unoptimized
              />
              <span className="inline-flex items-baseline shrink-0 whitespace-nowrap">
                <span className="text-[15px] font-black tracking-tight">
                  <span className="text-amber-700">Toys</span>
                  <span className="text-cyan-600 ml-0.5">Factory</span>
                </span>
                <span className="ml-1.5 text-xs font-black tracking-widest text-slate-400 uppercase">
                  ERP
                </span>
              </span>
            </h2>
          ) : (
            <h2 className="text-sm md:text-[15px] font-black text-slate-900 tracking-tight truncate">
              {displayTitle}
            </h2>
          )}
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 truncate max-md:hidden -mt-0.5">
            <Icon icon="fluent-color:database-24" width={13} height={13} className="shrink-0 opacity-80" />
            <span>Real-time manufacturing, sales, stock &amp; factory management</span>
          </div>
        </div>
      </div>

      {/* Right: search, date (desktop), chat, alerts, language, profile */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 flex-nowrap relative z-30">
        {/* Desktop search */}
        <div className="hidden lg:block w-[min(16rem,28vw)]">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
            <input
              type="text"
              className="w-full bg-white/40 hover:bg-white/70 focus:bg-white border border-white/80 focus:border-blue-500/80 text-xs font-semibold rounded-xl pl-8.5 pr-10 py-1.5 shadow-2xs transition-all placeholder:text-slate-400 text-slate-800"
              placeholder="Search anything..."
            />
            <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
              <span className="text-[9px] font-extrabold text-slate-400 bg-white/80 border border-slate-200/80 px-1.5 py-0.5 rounded-md shadow-2xs">
                ⌘K
              </span>
            </div>
          </div>
        </div>

        {/* Mobile/tablet search icon + popover */}
        <div className="relative lg:hidden" ref={mobileSearchRef}>
          <button
            type="button"
            onClick={() => setOpenPanel((p) => (p === 'search' ? null : 'search'))}
            className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-white/50 hover:bg-white/90 border border-white/80 shadow-xs flex items-center justify-center transition-all cursor-pointer shrink-0"
            aria-label="Search"
            aria-expanded={openPanel === 'search'}
          >
            <Search className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-slate-800" />
          </button>
          {openPanel === 'search' ? (
            <div className="absolute right-0 top-full mt-2 w-[min(calc(100vw-2rem),18rem)] rounded-xl border border-white/90 bg-white/95 backdrop-blur-2xl shadow-xl p-2 z-50">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                <input
                  type="text"
                  autoFocus
                  value={mobileSearchQuery}
                  onChange={(e) => setMobileSearchQuery(e.target.value)}
                  className="w-full bg-white/40 hover:bg-white/70 focus:bg-white border border-white/80 focus:border-blue-500/80 text-xs font-semibold rounded-xl pl-8.5 pr-3 py-1.5 shadow-2xs transition-all placeholder:text-slate-400 text-slate-800"
                  placeholder="Search anything..."
                />
              </div>
            </div>
          ) : null}
        </div>

        <DateInput
          value={navDate}
          onChange={setNavDate}
          aria-label="Business date"
          className="max-md:hidden h-9 w-[9.5rem] bg-white/50 hover:bg-white/90 border border-white/80 rounded-xl px-3 text-xs font-semibold text-slate-700 shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer shrink-0"
        />

        <HeaderMessagesDropdown
          open={openPanel === 'messages'}
          onOpenChange={setMessagesOpen}
        />

        <HeaderAlertsDropdown
          open={openPanel === 'alerts'}
          onOpenChange={setAlertsOpen}
        />

        <button
          type="button"
          onClick={toggleLanguage}
          className="h-8 w-8 sm:h-9 sm:max-w-none sm:w-auto sm:px-2.5 rounded-xl bg-white/50 hover:bg-white/90 border border-white/80 shadow-xs flex items-center justify-center sm:justify-start gap-1.5 transition-all cursor-pointer shrink-0"
          title="Switch Language"
        >
          <Icon icon="fluent-color:globe-24" width={18} height={18} className="shrink-0" />
          <span className="hidden sm:inline uppercase text-[11px] font-extrabold text-slate-800">
            {lang === 'en' ? 'EN' : 'বাংলা'}
          </span>
        </button>

        <div className="relative" ref={profileMenuRef}>
          <button
            type="button"
            onClick={() => setOpenPanel((p) => (p === 'profile' ? null : 'profile'))}
            onMouseDown={(e) => e.stopPropagation()}
            className="relative z-[60] h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-white flex items-center justify-center font-black text-[10px] sm:text-xs shadow-md shadow-amber-500/25 border-2 border-white hover:scale-105 transition-all cursor-pointer focus:outline-none shrink-0"
            title="User Profile"
            aria-expanded={openPanel === 'profile'}
            aria-haspopup="true"
          >
            {userInitials}
          </button>

          {openPanel === 'profile' && (
            <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl bg-white/95 backdrop-blur-2xl border border-white/90 shadow-2xl z-50 p-1.5 space-y-1">
              <div className="p-2.5 border-b border-slate-100/80 bg-amber-50/50 rounded-xl mb-1">
                <p className="text-xs font-extrabold text-slate-900">{userName}</p>
                <p className="text-[11px] font-medium text-slate-400 truncate">{userEmail || 'No email set'}</p>
              </div>
              <Link
                href="/settings/profile"
                prefetch={false}
                onClick={() => setOpenPanel(null)}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 rounded-xl transition-all cursor-pointer"
              >
                <User className="w-4 h-4 text-amber-600" /> My Profile
              </Link>
              <Link
                href="/settings/company"
                prefetch={false}
                onClick={() => setOpenPanel(null)}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 rounded-xl transition-all cursor-pointer"
              >
                <Settings className="w-4 h-4 text-cyan-600" /> Company Settings
              </Link>
              <div className="pt-1 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all text-left cursor-pointer"
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
