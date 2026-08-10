'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react';
import {
  TENANT_SIDEBAR_SECTIONS,
  getActiveSidebarModule,
  getActiveSidebarView,
  getSectionColor,
  type SidebarItem,
  type SidebarSection,
  type SidebarAccent,
} from '@/lib/navigation/tenant-sidebar';
import { useAppStore } from '@/lib/state/app-store';
import { getVisibleSections, isMainAdmin } from '@/lib/services/access-control-service';
import { SidebarIcon } from './SidebarIcon';
import { SidebarCollapsedTooltip } from './SidebarCollapsedTooltip';
import { PageSkeleton } from '@/components/shared/PageSkeleton';

function sidebarLabel(t: (k: string) => string, key: string, fallback: string) {
  const id = `sidebar.${key}`;
  const translated = t(id);
  return translated !== id ? translated : fallback;
}

const SUBMENU_ACCENT: Record<
  SidebarAccent,
  { activeRing: string; activeText: string; connector: string; nestedBorder: string; childBorder: string }
> = {
  blue: {
    activeRing: 'ring-blue-500/20',
    activeText: 'text-blue-600',
    connector: 'before:bg-blue-500/30',
    nestedBorder: 'border-blue-500/30',
    childBorder: 'border-blue-500/20',
  },
  violet: {
    activeRing: 'ring-violet-500/20',
    activeText: 'text-violet-700',
    connector: 'before:bg-violet-500/30',
    nestedBorder: 'border-violet-500/30',
    childBorder: 'border-violet-500/20',
  },
};

function nestedGroupKey(sectionId: string, item: SidebarItem) {
  return `${sectionId}-${item.view ?? item.href}`;
}

function isNestedGroupActiveForView(item: SidebarItem, activeView: string | null) {
  if (!item.children?.length || !activeView) return false;
  if (activeView === item.view) return true;
  return item.children.some((child) => child.view === activeView);
}

function buildInitialSubmenus(activeModule: string, sections: SidebarSection[]) {
  const initial: Record<string, boolean> = {};
  sections.forEach((section) => {
    if (section.items.length > 0) {
      initial[section.id] = section.id === activeModule;
    }
  });
  return initial;
}

function buildInitialNestedGroups(
  activeModule: string,
  activeView: string | null,
  sections: SidebarSection[],
) {
  const initial: Record<string, boolean> = {};
  sections.forEach((section) => {
    section.items.forEach((item) => {
      if (item.children?.length && section.id === activeModule && isNestedGroupActiveForView(item, activeView)) {
        initial[nestedGroupKey(section.id, item)] = true;
      }
    });
  });
  return initial;
}

export function Sidebar() {
  const pathname = usePathname();
  const collapsed = useAppStore((s) => s.appState.sidebarCollapsed);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const t = useAppStore((s) => s.t);
  const authUser = useAppStore((s) => s.authUser);
  const authReady = useAppStore((s) => s.authReady);

  const visibleSections = useMemo(() => {
    const sections = getVisibleSections(authUser);
    if (isMainAdmin(authUser)) return sections;
    return sections.map((section) => {
      if (section.id !== 'administration') return section;
      return {
        ...section,
        items: section.items.filter(
          (item) => item.href !== '/settings/users' && item.href !== '/settings/roles',
        ),
      };
    });
  }, [authUser]);

  const activeModule = getActiveSidebarModule(pathname);
  const activeView = getActiveSidebarView(pathname);
  const [openSubmenus, setOpenSubmenus] = useState(() =>
    buildInitialSubmenus(activeModule, TENANT_SIDEBAR_SECTIONS),
  );
  const [openNestedGroups, setOpenNestedGroups] = useState(() =>
    buildInitialNestedGroups(activeModule, activeView, TENANT_SIDEBAR_SECTIONS),
  );

  const isNestedGroupActive = (item: SidebarItem) => isNestedGroupActiveForView(item, activeView);

  useEffect(() => {
    setOpenNestedGroups(buildInitialNestedGroups(activeModule, activeView, visibleSections));
  }, [activeModule, activeView, visibleSections]);

  useEffect(() => {
    setOpenSubmenus(buildInitialSubmenus(activeModule, visibleSections));
  }, [activeModule, visibleSections]);

  const toggleSubmenu = (id: string) => {
    if (collapsed) toggleSidebar();
    setOpenSubmenus((prev) => {
      const next: Record<string, boolean> = {};
      visibleSections.forEach((s) => {
        if (s.items.length > 0) next[s.id] = false;
      });
      next[id] = !prev[id];
      return next;
    });
  };

  const toggleNestedGroup = (key: string) => {
    setOpenNestedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const renderSidebarItemLink = (
    item: SidebarItem,
    isActiveItem: boolean,
    key: string,
    size = 22,
    accent: SidebarAccent = 'blue',
  ) => {
    const a = SUBMENU_ACCENT[accent];
    const itemClasses = isActiveItem
      ? `bg-white/95 border border-white shadow-md ring-1 ${a.activeRing} ${a.activeText} font-black`
      : 'bg-white/45 hover:bg-white/75 backdrop-blur-md border border-white/80 shadow-[0_4px_16px_rgba(31,38,135,0.03)] text-slate-700 hover:text-slate-950 font-extrabold';
    return (
      <Link
        key={key}
        href={item.href}
        className={`group/item relative rounded-2xl px-3 py-2.5 text-sm tracking-[0.01em] transition-all flex items-center gap-2.5 ${itemClasses} before:absolute before:-left-3.5 before:top-1/2 before:-translate-y-1/2 before:w-2.5 before:h-[2px] ${a.connector} before:rounded-full`}
      >
        <span className="flex items-center justify-center shrink-0">
          <SidebarIcon imageIcon={item.imageIcon} iconifyIcon={item.iconifyIcon} size={size} />
        </span>
        <span className="truncate text-xs md:text-sm font-extrabold">
          {t(`sidebar.${item.view}`) !== `sidebar.${item.view}` ? t(`sidebar.${item.view}`) : item.label}
        </span>
      </Link>
    );
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
          {!authReady ? (
            <PageSkeleton variant="sidebar" collapsed={collapsed} />
          ) : (
          visibleSections.map((section) => {
            const hasSubmenu = section.items.length > 0;
            const isActiveModule = activeModule === section.id;
            const c = getSectionColor(section);
            const containerClasses = isActiveModule
              ? 'bg-white/95 border border-white shadow-md ring-1 ring-slate-950/5'
              : 'bg-white/45 hover:bg-white/75 backdrop-blur-md border border-white/80 shadow-[0_4px_16px_rgba(31,38,135,0.03)]';
            const linkClasses = isActiveModule ? `${c.text} font-black` : 'text-slate-700 hover:text-slate-950 font-extrabold';

            return (
              <div key={section.id} className="space-y-2">
                <div
                  className={`sidebar-group flex items-center justify-between rounded-2xl transition-all duration-200 overflow-hidden ${containerClasses}`}
                >
                  <SidebarCollapsedTooltip
                    label={sidebarLabel(t, section.id, section.label)}
                    collapsed={collapsed}
                  >
                    <Link
                      href={section.href}
                      id={`side-${section.id}`}
                      className={`side-btn sidebar-primary-link flex min-w-0 flex-1 items-center px-3.5 py-2.5 text-sm tracking-[0.01em] transition-all ${linkClasses}`}
                    >
                      <span className="flex items-center justify-center shrink-0">
                        <SidebarIcon
                          imageIcon={section.imageIcon}
                          iconifyIcon={section.iconifyIcon}
                          size={28}
                        />
                      </span>
                      {!collapsed && (
                        <span className="sidebar-label truncate ml-3 text-sm font-extrabold">
                          {sidebarLabel(t, section.id, section.label)}
                        </span>
                      )}
                    </Link>
                  </SidebarCollapsedTooltip>
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
                  <div className="sidebar-submenu sidebar-label relative ml-4 pl-3.5 border-l-2 border-blue-500/30 space-y-2 my-1">
                    {section.items.map((item) => {
                      if (item.children?.length) {
                        const groupKey = nestedGroupKey(section.id, item);
                        const accent = item.accent ?? 'blue';
                        const a = SUBMENU_ACCENT[accent];
                        const groupActive = isActiveModule && isNestedGroupActive(item);
                        const groupClasses = groupActive
                          ? `bg-white/95 border border-white shadow-md ring-1 ${a.activeRing} ${a.activeText} font-black`
                          : 'bg-white/45 hover:bg-white/75 backdrop-blur-md border border-white/80 shadow-[0_4px_16px_rgba(31,38,135,0.03)] text-slate-700 hover:text-slate-950 font-extrabold';
                        return (
                          <div key={groupKey} className="space-y-2">
                            <div className={`relative rounded-2xl transition-all flex items-center justify-between ${groupClasses} before:absolute before:-left-3.5 before:top-1/2 before:-translate-y-1/2 before:w-2.5 before:h-[2px] ${a.connector} before:rounded-full`}>
                              <Link
                                href={item.href}
                                className="group/item flex min-w-0 flex-1 items-center gap-2.5 px-3 py-2.5 text-sm tracking-[0.01em]"
                              >
                                <span className="flex items-center justify-center shrink-0">
                                  <SidebarIcon imageIcon={item.imageIcon} iconifyIcon={item.iconifyIcon} size={22} />
                                </span>
                                <span className="truncate text-xs md:text-sm font-extrabold">
                                  {t(`sidebar.${item.view}`) !== `sidebar.${item.view}` ? t(`sidebar.${item.view}`) : item.label}
                                </span>
                              </Link>
                              <button
                                type="button"
                                onClick={() => toggleNestedGroup(groupKey)}
                                className="mr-2 flex h-7 w-7 items-center justify-center rounded-xl text-slate-400 transition-all hover:bg-black/5 hover:text-slate-700 focus:outline-none cursor-pointer"
                                aria-label={`Toggle ${item.label} submenu`}
                              >
                                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${openNestedGroups[groupKey] ? 'rotate-180' : ''}`} />
                              </button>
                            </div>
                            {openNestedGroups[groupKey] && (
                              <div className={`relative ml-3 pl-3 border-l-2 ${a.childBorder} space-y-2`}>
                                {item.children.map((child) =>
                                  renderSidebarItemLink(
                                    child,
                                    isActiveModule && activeView === child.view,
                                    child.href,
                                    20,
                                    accent,
                                  ),
                                )}
                              </div>
                            )}
                          </div>
                        );
                      }

                      return renderSidebarItemLink(
                        item,
                        isActiveModule && activeView === item.view,
                        item.href,
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
          )}
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
