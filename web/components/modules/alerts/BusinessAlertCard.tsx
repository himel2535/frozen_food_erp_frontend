'use client';

import Link from 'next/link';
import { Calendar, CheckCircle2, Eye, Phone, Tag } from 'lucide-react';
import type { BusinessAlert } from '@/lib/services/business-alert-types';
import { useAppStore } from '@/lib/state/app-store';
import {
  deriveOverdueDays,
  priorityLabel,
  resolveAlertActions,
} from '@/components/modules/alerts/alert-card-utils';
import {
  ALERT_ACTIONS_COLUMN,
  ALERT_BTN_OUTLINE,
  ALERT_BTN_PRIMARY,
  ALERT_BTN_VIEW,
  ALERT_CARD,
  ALERT_CARD_BODY,
  ALERT_CARD_GRID,
  ALERT_CARD_GRID_CELL,
  priorityBadgeClassName,
} from '@/components/modules/alerts/alert-page-styles';

function lineIcon(label: string) {
  const lower = label.toLowerCase();
  if (lower.includes('status')) return Tag;
  if (lower.includes('follow') || lower.includes('due') || lower.includes('contact') || lower.includes('date') || lower.includes('delivery')) {
    return Calendar;
  }
  return Tag;
}

type BusinessAlertCardProps = {
  alert: BusinessAlert;
  variant?: 'full' | 'compact';
  onNavigate?: () => void;
};

export function BusinessAlertCard({ alert, variant = 'full', onNavigate }: BusinessAlertCardProps) {
  const t = useAppStore((s) => s.t);
  const overdueDays = deriveOverdueDays(alert);
  const { primaryAction, secondaryAction, primaryLabel, secondaryLabel } = resolveAlertActions(alert);
  const gridLines = alert.lines.slice(0, 4);

  if (variant === 'compact') {
    const metrics = alert.lines.filter((l) => l.label.toLowerCase() !== 'type').slice(0, 2);
    return (
      <Link
        href={alert.href}
        onClick={onNavigate}
        className="block space-y-2 cursor-pointer"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
            <span className={priorityBadgeClassName(alert.priority)}>{priorityLabel(alert.priority)}</span>
            {alert.subtitle ? (
              <span className="text-[10px] font-semibold text-slate-500 truncate">{alert.subtitle}</span>
            ) : null}
          </div>
          {overdueDays != null ? (
            <span className="text-[10px] font-bold text-rose-600 whitespace-nowrap shrink-0">
              {t('alerts.overdue_days', { n: overdueDays })}
            </span>
          ) : null}
        </div>
        <p className="text-sm font-extrabold text-slate-900 truncate">{alert.title}</p>
        {metrics.length ? (
          <div className="grid grid-cols-2 gap-2">
            {metrics.map((line) => (
              <div key={`${alert.id}-${line.label}-compact`} className="min-w-0">
                <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide truncate">{line.label}</p>
                <p className="text-[11px] font-bold text-slate-800 truncate">{line.value}</p>
              </div>
            ))}
          </div>
        ) : null}
        {primaryAction ? (
          <div className="flex items-center gap-2 pt-1">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#3B4B95]">
              <Phone className="w-3 h-3" aria-hidden />
              {primaryLabel}
            </span>
            {secondaryAction ? (
              <span className="text-[10px] font-semibold text-slate-400">·</span>
            ) : null}
            {secondaryAction ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600">
                <CheckCircle2 className="w-3 h-3" aria-hidden />
                {secondaryLabel}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600">
              <Eye className="w-3 h-3" aria-hidden />
              {t('alerts.view_details')}
            </span>
          </div>
        ) : (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 pt-1">
            <Eye className="w-3 h-3" aria-hidden />
            {t('alerts.view_details')}
          </span>
        )}
      </Link>
    );
  }

  return (
    <article className={ALERT_CARD}>
      <div className="flex flex-col gap-3 h-full">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <span className={priorityBadgeClassName(alert.priority)}>{priorityLabel(alert.priority)}</span>
            {alert.subtitle ? (
              <span className="text-[11px] font-semibold text-slate-500 truncate">{alert.subtitle}</span>
            ) : null}
          </div>
          {overdueDays != null ? (
            <span className="text-[11px] font-bold text-rose-600 whitespace-nowrap shrink-0">
              {t('alerts.overdue_days', { n: overdueDays })}
            </span>
          ) : null}
        </div>

        <Link
          href={alert.href}
          onClick={onNavigate}
          className="block text-base font-extrabold text-slate-900 cursor-pointer truncate"
        >
          {alert.title}
        </Link>

        <div className={ALERT_CARD_BODY}>
          {gridLines.length ? (
            <dl className={ALERT_CARD_GRID}>
              {gridLines.map((line) => {
                const Icon = lineIcon(line.label);
                return (
                  <div key={`${alert.id}-${line.label}`} className={ALERT_CARD_GRID_CELL}>
                    <dt className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                      <Icon className="w-3 h-3 shrink-0" aria-hidden />
                      {line.label}
                    </dt>
                    <dd className="text-xs font-bold text-slate-800 mt-1 truncate">{line.value}</dd>
                  </div>
                );
              })}
            </dl>
          ) : (
            <div className="min-w-0" />
          )}

          {alert.actions.length ? (
            <div className={ALERT_ACTIONS_COLUMN}>
              {primaryAction ? (
                <Link href={primaryAction.href} onClick={onNavigate} className={ALERT_BTN_PRIMARY}>
                  <Phone className="w-3.5 h-3.5 shrink-0" aria-hidden />
                  {primaryLabel}
                </Link>
              ) : null}
              {secondaryAction && secondaryAction !== primaryAction ? (
                <Link href={secondaryAction.href} onClick={onNavigate} className={ALERT_BTN_OUTLINE}>
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden />
                  {secondaryLabel}
                </Link>
              ) : null}
              <Link href={alert.href} onClick={onNavigate} className={ALERT_BTN_VIEW}>
                <Eye className="w-3.5 h-3.5 shrink-0" aria-hidden />
                {t('alerts.view_details')}
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
