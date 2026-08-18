'use client';

import Link from 'next/link';
import { Icon } from '@iconify/react';
import { useAppStore } from '@/lib/state/app-store';
import { useLocaleFormat } from '@/hooks/useLocaleFormat';
import { useBusinessAlerts } from '@/components/modules/alerts/useBusinessAlerts';
import { DashboardBusinessAlertsSkeleton } from '@/components/skeletons/DashboardLoadingSkeleton';
import { priorityDotClass, type AlertCategory } from '@/lib/services/business-alert-service';

const CATEGORY_LABEL_KEYS: Record<AlertCategory, string> = {
  customer_due: 'alerts.category_customer_due',
  lead_followup: 'alerts.category_lead_followup',
  low_stock: 'alerts.category_low_stock',
  pending_purchase: 'alerts.category_pending_purchase',
  production: 'alerts.category_production',
  payment_collection: 'alerts.category_payment_collection',
  supplier_due: 'alerts.category_supplier_due',
};

export function DashboardBusinessAlerts() {
  const t = useAppStore((s) => s.t);
  const { formatNumber } = useLocaleFormat();
  const { summaries, loading } = useBusinessAlerts();

  if (loading) return <DashboardBusinessAlertsSkeleton />;

  return (
    <div className="premium-card p-3 premium-shadow flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between mb-1.5 border-b border-slate-100 pb-1.5 shrink-0">
        <div className="flex items-center gap-2 my-auto">
          <Icon icon="fluent-color:alert-24" width={22} height={22} className="shrink-0 my-auto" />
          <h3 className="text-sm font-bold text-slate-900 tracking-tight my-auto">{t('dashboard.business_alerts')}</h3>
        </div>
        <Link href="/alerts" className="text-[10px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer my-auto">
          {t('alerts.view_all')}
        </Link>
      </div>

      <div className="flex flex-col gap-1 flex-1 overflow-y-auto min-h-0 justify-between">
        {summaries.length ? (
          summaries.map((item) => (
            <Link
              key={item.category}
              href={`/alerts?category=${item.category}`}
              className="flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-slate-50 transition-colors cursor-pointer group"
            >
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${priorityDotClass(item.priority)}`} aria-hidden />
              <span className="text-xs font-bold text-slate-800 group-hover:text-blue-700 flex-1 min-w-0 truncate">
                {formatNumber(item.count)} {t(CATEGORY_LABEL_KEYS[item.category])}
              </span>
            </Link>
          ))
        ) : (
          <p className="text-xs font-medium text-slate-400 text-center py-6">{t('alerts.empty')}</p>
        )}
      </div>
    </div>
  );
}
