'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react';
import {
  TENANT_SIDEBAR_SECTIONS,
  getActiveSidebarModule,
  getActiveSidebarView,
  getSectionColor,
} from '@/lib/navigation/tenant-sidebar';
import { useAppStore } from '@/lib/state/app-store';
import { Icon } from '@iconify/react';
import { SidebarIcon } from './SidebarIcon';

export function Sidebar() {
  const pathname = usePathname();
  const collapsed = useAppStore((s) => s.appState.sidebarCollapsed);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const t = useAppStore((s) => s.t);
  const activeModule = getActiveSidebarModule(pathname);
  const activeView = getActiveSidebarView(pathname);
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const initial: Record<string, boolean> = {};
    TENANT_SIDEBAR_SECTIONS.forEach((section) => {
      if (section.items.length > 0) {
        initial[section.id] = section.id === activeModule;
      }
    });
    setOpenSubmenus(initial);
  }, [activeModule]);

  const toggleSubmenu = (id: string) => {
    if (collapsed) toggleSidebar();
    setOpenSubmenus((prev) => {
      const next: Record<string, boolean> = {};
      TENANT_SIDEBAR_SECTIONS.forEach((s) => {
        if (s.items.length > 0) next[s.id] = false;
      });
      next[id] = !prev[id];
      return next;
    });
  };

  return (
    <>
      <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-20 hidden md:hidden" data-sidebar-toggle />
      <aside
        id="sidebar"
        className={`sidebar-transition ${collapsed ? 'w-20 sidebar-is-collapsed' : 'w-72'} glass-sidebar text-slate-600 hidden md:flex flex-col shrink-0 sticky top-0 z-30 h-[100dvh] relative`}
      >
        {/* Transparent Water Glass Toggle Tab Button */}
        <button
          type="button"
          onClick={toggleSidebar}
          className="absolute -right-6 top-4 z-50 h-8 w-6 rounded-r-xl rounded-l-none bg-white/40 hover:bg-white/80 backdrop-blur-2xl text-slate-800 shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-l-0 border-white/80 flex items-center justify-center transition-all duration-200 cursor-pointer hover:w-7 group focus:outline-none"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4 text-slate-800 transition-transform duration-200 group-hover:scale-110" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-slate-800 transition-transform duration-200 group-hover:scale-110" />
          )}
        </button>

        <div className="h-16 pl-6.5 pr-3.5 border-b border-white/40 bg-white/10 flex items-center justify-between overflow-hidden shrink-0">
          <div className="flex items-center min-w-0 flex-1">
            <div className="w-[32px] h-[32px] flex items-center justify-center shrink-0">
              <Image src="/images/logo-toys.png" alt="Toys Factory Logo" width={32} height={32} className="w-[32px] h-[32px] object-contain shrink-0 drop-shadow-xs" unoptimized />
            </div>
            {!collapsed && (
              <div className="sidebar-label min-w-0 ml-3 flex items-baseline">
                <span className="text-lg font-black tracking-tight">
                  <span className="text-amber-700">Toys</span>
                  <span className="text-cyan-600 ml-0.5">Factory</span>
                </span>
                <span className="ml-1.5 text-xs font-black tracking-widest text-slate-400 uppercase">
                  ERP
                </span>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3.5 py-3.5 space-y-2.5">
          {TENANT_SIDEBAR_SECTIONS.map((section) => {
            const hasSubmenu = section.items.length > 0;
            const isActiveModule = activeModule === section.id;
            const c = getSectionColor(section);
            const containerClasses = isActiveModule
              ? `${c.bg} border ${c.border} ring-1 ${c.ring} shadow-sm`
              : 'bg-white/45 hover:bg-white/75 backdrop-blur-md border border-white/80 shadow-[0_4px_16px_rgba(31,38,135,0.03)]';
            const linkClasses = isActiveModule ? c.text : 'text-slate-700 hover:text-slate-950';

            return (
              <div
                key={section.id}
                className={`sidebar-group flex flex-col rounded-2xl transition-all duration-200 overflow-hidden ${containerClasses}`}
              >
                <div className="sidebar-main-row flex items-center justify-between transition-all">
                  <Link
                    href={section.href}
                    id={`side-${section.id}`}
                    className={`side-btn sidebar-primary-link flex min-w-0 flex-1 items-center px-3.5 py-2.5 text-sm font-extrabold tracking-[0.01em] transition-all ${linkClasses}`}
                  >
                    <span className="flex items-center justify-center shrink-0">
                      <SidebarIcon
                        imageIcon={section.imageIcon}
                        iconifyIcon={section.iconifyIcon}
                        size={28}
                      />
                    </span>
                    {!collapsed && (
                      <span className="sidebar-label truncate ml-3 text-sm font-extrabold">{t(`sidebar.${section.id}`) !== `sidebar.${section.id}` ? t(`sidebar.${section.id}`) : section.label}</span>
                    )}
                  </Link>
                  {hasSubmenu && !collapsed && (
                    <button
                      type="button"
                      onClick={() => toggleSubmenu(section.id)}
                      className="sidebar-trigger sidebar-label mr-2 flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition-all hover:bg-black/5 hover:text-slate-700 focus:outline-none cursor-pointer"
                      aria-label={`Toggle ${section.label} submenu`}
                    >
                      <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${openSubmenus[section.id] ? 'rotate-180' : ''}`} />
                    </button>
                  )}
                </div>
                {hasSubmenu && openSubmenus[section.id] && !collapsed && (
                  <div className="sidebar-submenu sidebar-label mx-2.5 mb-2.5 pt-1.5 space-y-1 border-t border-slate-200/60">
                    {section.items.map((item) => {
                      const isActiveItem = isActiveModule && activeView === item.view;
                      const itemClasses = isActiveItem
                        ? `${c.bg} ${c.text} border ${c.border} shadow-xs font-bold`
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/70 border border-transparent';
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`group/item rounded-xl px-2.5 py-1.5 text-xs font-semibold tracking-[0.01em] transition-all flex items-center gap-2.5 ${itemClasses}`}
                        >
                          <SidebarIcon imageIcon={item.imageIcon} iconifyIcon={item.iconifyIcon} size={20} />
                          <span className="truncate">{t(`sidebar.${item.view}`) !== `sidebar.${item.view}` ? t(`sidebar.${item.view}`) : item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

export function MobileSidebarBackdrop({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-20 md:hidden" onClick={onClose}>
      <aside className="w-72 h-full bg-white border-r border-slate-200 p-4" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={onClose} className="mb-4 p-2 rounded-xl hover:bg-slate-100">
          <X className="w-5 h-5" />
        </button>
        <p className="text-sm font-bold text-slate-900">Navigation</p>
        <p className="text-xs text-slate-500 mt-1">Use desktop sidebar or bottom menu on mobile.</p>
      </aside>
    </div>
  );
}
