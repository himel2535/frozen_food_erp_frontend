'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Icon } from '@iconify/react';
import { Footer } from '@/components/layout/Footer';
import { MODULE_LIST_SHELL } from '@/lib/ui/module-layout';
import { useAppStore } from '@/lib/state/app-store';
import { useNavMessages } from '@/components/modules/messages/useNavMessages';
import {
  getMessageHeadline,
  getMessageRelativeTime,
  getMessageSubtext,
  getMessageVisual,
} from '@/components/layout/message-dropdown-utils';
import type { NavMessageChannel } from '@/lib/services/messages-service';
import {
  ALERT_COUNT_BADGE,
  ALERT_COUNT_BADGE_ACTIVE,
  ALERT_FILTER_PILL,
  ALERT_FILTER_PILL_ACTIVE,
  ALERT_FILTER_ROW,
} from '@/components/modules/alerts/alert-page-styles';

type MessageFilter = NavMessageChannel | 'all';

const FILTER_CHANNELS: MessageFilter[] = ['all', 'whatsapp', 'email', 'call', 'internal'];

const FILTER_LABEL_KEYS: Record<MessageFilter, string> = {
  all: 'messages.filter_all',
  whatsapp: 'messages.filter_whatsapp',
  email: 'messages.filter_email',
  call: 'messages.filter_call',
  internal: 'messages.filter_team',
};

export function MessagesPage() {
  const t = useAppStore((s) => s.t);
  const searchParams = useSearchParams();
  const activeFilter = (searchParams.get('channel') ?? 'all') as MessageFilter;
  const { messages } = useNavMessages();

  const displayed =
    activeFilter === 'all' ? messages : messages.filter((m) => m.channel === activeFilter);

  const countFor = (filter: MessageFilter) =>
    filter === 'all' ? messages.length : messages.filter((m) => m.channel === filter).length;

  return (
    <div className={MODULE_LIST_SHELL}>
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0">
          <div className="w-14 h-14 rounded-full bg-amber-500 flex items-center justify-center shrink-0 shadow-md shadow-amber-500/25">
            <Icon icon="fluent-color:comment-multiple-24" width={32} height={32} className="shrink-0" />
          </div>
          <div className="min-w-0">
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">{t('messages.title')}</h2>
            <p className="text-sm text-slate-500 mt-1 font-medium">{t('messages.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className={ALERT_FILTER_ROW}>
        {FILTER_CHANNELS.map((filter) => {
          const count = countFor(filter);
          const isActive = activeFilter === filter;
          if (!count && filter !== 'all' && !isActive) return null;

          return (
            <Link
              key={filter}
              href={filter === 'all' ? '/messages' : `/messages?channel=${filter}`}
              className={isActive ? ALERT_FILTER_PILL_ACTIVE : ALERT_FILTER_PILL}
            >
              {t(FILTER_LABEL_KEYS[filter])}
              <span className={isActive ? ALERT_COUNT_BADGE_ACTIVE : ALERT_COUNT_BADGE}>{count}</span>
            </Link>
          );
        })}
      </div>

      <div className="space-y-3">
        {displayed.length ? (
          displayed.map((message, index) => {
            const visual = getMessageVisual(message);
            const headline = getMessageHeadline(message);
            const subtext = getMessageSubtext(message);
            const time = getMessageRelativeTime(index);

            return (
              <Link
                key={message.id}
                href={message.href}
                className="premium-card premium-shadow p-4 rounded-2xl border border-slate-200/80 bg-white hover:shadow-md transition-shadow cursor-pointer block"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${visual.iconBg}`}
                  >
                    <Icon icon={visual.icon} width={22} height={22} className="shrink-0" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-extrabold text-slate-900">
                        {headline.bold}
                        <span className="font-semibold text-slate-600">{headline.rest}</span>
                      </p>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide bg-slate-100 text-slate-600">
                        {t(FILTER_LABEL_KEYS[message.channel])}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-700 mt-1">{message.subject}</p>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{subtext}</p>
                    <p className="text-[11px] text-slate-400 mt-2">{time}</p>
                  </div>
                </div>
              </Link>
            );
          })
        ) : (
          <p className="text-sm text-slate-400 font-medium text-center py-16">{t('messages.dropdown_empty')}</p>
        )}
      </div>

      <Footer />
    </div>
  );
}
