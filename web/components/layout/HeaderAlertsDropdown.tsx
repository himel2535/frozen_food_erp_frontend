'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '@iconify/react';
import { useAppStore } from '@/lib/state/app-store';
import { useBusinessAlerts } from '@/components/modules/alerts/useBusinessAlerts';
import {
  countUnread,
  filterAlertsByTab,
  getNotificationHeadline,
  getNotificationRelativeTime,
  getNotificationSubtext,
  getNotificationVisual,
  isDefaultUnread,
  type NotificationTab,
} from '@/components/layout/notification-dropdown-utils';

export function HeaderAlertsDropdown() {
  const t = useAppStore((s) => s.t);
  const { alerts, totalCount } = useBusinessAlerts();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<NotificationTab>('all');
  const [readIds, setReadIds] = useState<Set<string>>(() => new Set());
  const menuRef = useRef<HTMLDivElement>(null);

  const unreadCount = useMemo(() => countUnread(alerts, readIds), [alerts, readIds]);
  const displayedAlerts = useMemo(
    () => filterAlertsByTab(alerts, activeTab, readIds),
    [alerts, activeTab, readIds],
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const badgeLabel = unreadCount > 99 ? '99+' : String(unreadCount || totalCount);
  const showBadge = unreadCount > 0 || totalCount > 0;
  const closeMenu = () => setOpen(false);

  const markAllRead = () => {
    setReadIds(new Set(alerts.map((a) => a.id)));
  };

  const markRead = (id: string) => {
    setReadIds((prev) => new Set([...prev, id]));
  };

  const tabs: { id: NotificationTab; label: string; badge?: number }[] = [
    { id: 'all', label: t('alerts.dropdown_tab_all') },
    { id: 'unread', label: t('alerts.dropdown_tab_unread'), badge: unreadCount || undefined },
    { id: 'mentions', label: t('alerts.dropdown_tab_mentions') },
  ];

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="h-9 w-9 rounded-xl bg-white/50 hover:bg-white/90 border border-white/80 shadow-xs flex items-center justify-center transition-all relative cursor-pointer"
        title={t('alerts.dropdown_title')}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Icon icon="fluent-color:alert-badge-24" width={20} height={20} className="shrink-0" />
        {showBadge ? (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[9px] font-extrabold flex items-center justify-center border-2 border-white">
            {badgeLabel}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-full mt-3 z-50">
          <div
            className="absolute -top-1.5 right-3.5 w-3 h-3 bg-white border-l border-t border-slate-200 rotate-45"
            aria-hidden
          />

          <div className="w-[380px] max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden">
            <div className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-slate-900">{t('alerts.dropdown_title')}</h3>
                {totalCount > 0 ? (
                  <span className="inline-flex items-center justify-center min-w-[1.35rem] h-[1.35rem] px-1 rounded-full bg-rose-100 text-rose-600 text-[10px] font-extrabold">
                    {totalCount > 99 ? '99+' : totalCount}
                  </span>
                ) : null}
              </div>

              <div className="flex items-end justify-between gap-2 mt-3 border-b border-slate-200">
                <div className="flex items-center gap-4">
                  {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`relative pb-2.5 text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                          isActive ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        {tab.label}
                        {tab.badge ? (
                          <span className="inline-flex items-center justify-center min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-rose-100 text-rose-600 text-[9px] font-extrabold">
                            {tab.badge > 99 ? '99+' : tab.badge}
                          </span>
                        ) : null}
                        {isActive ? (
                          <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-slate-900 rounded-full" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
                {unreadCount > 0 ? (
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="pb-2.5 text-[11px] font-bold text-[#3B4B95] hover:text-[#334585] whitespace-nowrap cursor-pointer shrink-0"
                  >
                    {t('alerts.dropdown_mark_all_read')}
                  </button>
                ) : (
                  <span className="pb-2.5 text-[11px] invisible select-none" aria-hidden>
                    —
                  </span>
                )}
              </div>
            </div>

            <div className="max-h-[420px] overflow-y-auto">
              {displayedAlerts.length ? (
                displayedAlerts.map((alert, index) => {
                  const unread = isDefaultUnread(alert) && !readIds.has(alert.id);
                  const visual = getNotificationVisual(alert);
                  const headline = getNotificationHeadline(alert);
                  const subtext = getNotificationSubtext(alert);
                  const time = getNotificationRelativeTime(index);

                  return (
                    <Link
                      key={alert.id}
                      href={alert.href}
                      onClick={() => {
                        markRead(alert.id);
                        closeMenu();
                      }}
                      className={`flex items-start gap-3 px-4 py-3.5 border-b border-slate-100 transition-colors cursor-pointer ${
                        unread ? 'bg-blue-50/70 hover:bg-blue-50' : 'bg-white hover:bg-slate-50/80'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${visual.iconBg}`}
                      >
                        <Icon icon={visual.icon} width={22} height={22} className="shrink-0" />
                      </div>

                      <div className="flex-1 min-w-0 pr-1">
                        <p className="text-[13px] leading-snug text-slate-800">
                          <span className="font-extrabold">{headline.bold}</span>
                          {headline.rest}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{subtext}</p>
                        <p className="text-[11px] text-slate-400 mt-1">{time}</p>
                      </div>

                      {unread ? (
                        <span
                          className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-2"
                          aria-label="Unread"
                        />
                      ) : (
                        <span className="w-2 shrink-0" aria-hidden />
                      )}
                    </Link>
                  );
                })
              ) : (
                <p className="px-4 py-10 text-xs font-medium text-slate-400 text-center">
                  {activeTab === 'unread'
                    ? t('alerts.dropdown_empty_unread')
                    : activeTab === 'mentions'
                      ? t('alerts.dropdown_empty_mentions')
                      : t('alerts.empty')}
                </p>
              )}
            </div>

            <div className="px-4 py-3 border-t border-slate-100 bg-white">
              <Link
                href="/alerts"
                onClick={closeMenu}
                className="block text-center text-xs font-extrabold text-[#3B4B95] hover:text-[#334585] cursor-pointer"
              >
                {t('alerts.dropdown_view_all')}
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
