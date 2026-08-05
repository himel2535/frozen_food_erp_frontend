'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { HeaderAlertsDropdown } from '@/components/layout/HeaderAlertsDropdown';
import { HeaderMessagesDropdown } from '@/components/layout/HeaderMessagesDropdown';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search, User, Settings, LogOut } from 'lucide-react';
import { Icon } from '@iconify/react';
import { useAppStore } from '@/lib/state/app-store';
import { getProfileView } from '@/lib/services/settings-service';
import { employeeInitials } from '@/lib/services/hrm-service';
import { useClickOutside } from '@/hooks/useClickOutside';

interface HeaderProps {
  title?: string;
}

type HeaderPanel = 'messages' | 'alerts' | 'profile' | null;

export function Header({ title }: HeaderProps) {
  const router = useRouter();
  const appState = useAppStore((s) => s.appState);
  const toggleLanguage = useAppStore((s) => s.toggleLanguage);
  const logout = useAppStore((s) => s.logout);
  const lang = useAppStore((s) => s.appState.lang);
  const [openPanel, setOpenPanel] = useState<HeaderPanel>(null);
  const [navDate, setNavDate] = useState('');
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const displayTitle = title && title !== 'Enterprise Workspace' ? title : 'Toys Factory Operations Hub';

  const profile = useMemo(() => getProfileView(appState), [appState]);
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
  useClickOutside(profileMenuRef, closeProfile, openPanel === 'profile');

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
    <header className="h-16 glass-header px-5 flex items-center justify-between shrink-0 sticky top-0 z-20 border-b border-white/40 bg-white/20 backdrop-blur-2xl">
      {/* Left: Title + Live Badge */}
      <div className="flex items-center gap-3 min-w-0 flex-1 ml-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm md:text-[15px] font-black text-slate-900 tracking-tight truncate flex items-center gap-1.5">
              {displayTitle.startsWith('Toys') ? (
                <span>
                  <span className="text-amber-600">T</span>
                  {displayTitle.slice(1)}
                </span>
              ) : (
                <span>{displayTitle}</span>
              )}
            </h2>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-[10px] font-extrabold tracking-wide shrink-0">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              System Active
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 truncate max-md:hidden -mt-0.5">
            <Icon icon="fluent-color:database-24" width={13} height={13} className="shrink-0 opacity-80" />
            <span>Real-time manufacturing, sales, stock &amp; factory management</span>
          </div>
        </div>
      </div>

      {/* Center: Search + Date */}
      <div className="flex items-center gap-2 flex-1 justify-end px-3 min-w-0">
        <div className="flex-1 max-w-md hidden lg:block">
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
        <input
          type="date"
          value={navDate}
          onChange={(e) => setNavDate(e.target.value)}
          aria-label="Business date"
          className="h-9 bg-white/50 hover:bg-white/90 border border-white/80 rounded-xl px-3 text-xs font-semibold text-slate-700 shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer shrink-0"
        />
      </div>

      {/* Right: Vibrant Colorful Controls & Matching Brand Avatar */}
      <div className="flex items-center gap-2 shrink-0 relative z-30">
        <HeaderMessagesDropdown
          open={openPanel === 'messages'}
          onOpenChange={setMessagesOpen}
        />

        <HeaderAlertsDropdown
          open={openPanel === 'alerts'}
          onOpenChange={setAlertsOpen}
        />

        {/* Language Switcher with Vibrant Colorful Globe Icon */}
        <button
          type="button"
          onClick={toggleLanguage}
          className="h-9 px-2.5 rounded-xl bg-white/50 hover:bg-white/90 border border-white/80 shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
          title="Switch Language"
        >
          <Icon icon="fluent-color:globe-location-24" width={18} height={18} className="shrink-0" />
          <span className="uppercase text-[11px] font-extrabold text-slate-800">{lang === 'en' ? 'EN' : 'বাংলা'}</span>
        </button>

        {/* User Profile Circular Avatar with Matching Toys Amber Brand Palette (NO violet!) */}
        <div className="relative" ref={profileMenuRef}>
          <button
            type="button"
            onClick={() => setOpenPanel((p) => (p === 'profile' ? null : 'profile'))}
            onMouseDown={(e) => e.stopPropagation()}
            className="relative z-[60] h-9 w-9 rounded-full bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-white flex items-center justify-center font-black text-xs shadow-md shadow-amber-500/25 border-2 border-white hover:scale-105 transition-all cursor-pointer focus:outline-none"
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
                onClick={() => setOpenPanel(null)}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 rounded-xl transition-all cursor-pointer"
              >
                <User className="w-4 h-4 text-amber-600" /> My Profile
              </Link>
              <Link
                href="/settings/company"
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
