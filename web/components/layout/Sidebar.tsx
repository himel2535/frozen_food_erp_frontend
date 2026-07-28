'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';
import {
  TENANT_SIDEBAR_SECTIONS,
  getActiveSidebarModule,
  getActiveSidebarView,
  getSectionColor,
} from '@/lib/navigation/tenant-sidebar';
import { useAppStore } from '@/lib/state/app-store';
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
        className={`sidebar-transition ${collapsed ? 'w-20 sidebar-is-collapsed' : 'w-72'} bg-white text-slate-600 hidden md:flex flex-col shrink-0 sticky top-0 z-30 h-[100dvh] border-r border-slate-200/80`}
      >
        <div className="h-16 px-5 border-b border-slate-100 flex items-center justify-between overflow-hidden">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-lg shadow-lg shadow-blue-500/20 shrink-0">
              H
            </div>
            {!collapsed && (
              <div className="sidebar-label min-w-0">
                <span className="block truncate text-lg font-bold tracking-tight text-slate-900">Toys Factory ERP</span>
                <span className="block truncate text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Enterprise Workspace</span>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-0">
          {TENANT_SIDEBAR_SECTIONS.map((section) => {
            const hasSubmenu = section.items.length > 0;
            const isActiveModule = activeModule === section.id;
            const c = getSectionColor(section);
            const rowClasses = isActiveModule
              ? `${c.bg} ring-1 ${c.ring} shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]`
              : 'hover:bg-slate-100/60';
            const linkClasses = isActiveModule ? c.text : 'text-slate-500 hover:text-slate-900';
            const primaryIconClass =
              section.id === 'dashboard' || section.id === 'projects' || section.id === 'approvals'
                ? 'sidebar-icon-primary-sm'
                : 'sidebar-icon-primary';

            return (
              <div key={section.id} className="sidebar-group flex flex-col">
                <div className={`sidebar-main-row flex items-center justify-between rounded-2xl transition-all ${rowClasses}`}>
                  <Link
                    href={section.href}
                    id={`side-${section.id}`}
                    className={`side-btn sidebar-primary-link flex min-w-0 flex-1 items-center px-3 py-1 text-sm font-semibold tracking-[0.01em] transition-all ${linkClasses}`}
                  >
                    <span className="flex items-center justify-center shrink-0">
                      <SidebarIcon
                        imageIcon={section.imageIcon}
                        iconifyIcon={section.iconifyIcon}
                        className={primaryIconClass}
                        size={section.id === 'dashboard' ? 32 : 40}
                      />
                    </span>
                    {!collapsed && (
                      <span className="sidebar-label truncate ml-2">{t(`sidebar.${section.id}`) !== `sidebar.${section.id}` ? t(`sidebar.${section.id}`) : section.label}</span>
                    )}
                  </Link>
                  {hasSubmenu && !collapsed && (
                    <button
                      type="button"
                      onClick={() => toggleSubmenu(section.id)}
                      className="sidebar-trigger sidebar-label mr-1 flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600 focus:outline-none"
                      aria-label={`Toggle ${section.label} submenu`}
                    >
                      <ChevronDown className={`w-4 h-4 transition-transform ${openSubmenus[section.id] ? 'rotate-180' : ''}`} />
                    </button>
                  )}
                </div>
                {hasSubmenu && openSubmenus[section.id] && !collapsed && (
                  <div className="sidebar-submenu sidebar-label ml-4 mt-1 space-y-0.5 border-l border-slate-200 pl-5">
                    {section.items.map((item) => {
                      const isActiveItem = isActiveModule && activeView === item.view;
                      const itemClasses = isActiveItem
                        ? `${c.bg} ${c.text} border ${c.border} shadow-sm`
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 border border-transparent';
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`group/item rounded-xl px-3 py-1.5 text-[13px] font-semibold tracking-[0.01em] transition-all grid grid-cols-[24px_minmax(0,1fr)] column-gap-1 items-center ${itemClasses}`}
                        >
                          <SidebarIcon imageIcon={item.imageIcon} iconifyIcon={item.iconifyIcon} className="sidebar-icon-sm" size={24} />
                          <span>{t(`sidebar.${item.view}`) !== `sidebar.${item.view}` ? t(`sidebar.${item.view}`) : item.label}</span>
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
