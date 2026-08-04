'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Icon } from '@iconify/react';
import { Footer } from '@/components/layout/Footer';
import { useRegisterModuleActions } from '@/components/layout/ModuleActionsContext';
import { useAppStore } from '@/lib/state/app-store';
import { BusinessAlertCard } from '@/components/modules/alerts/BusinessAlertCard';
import { useBusinessAlerts } from '@/components/modules/alerts/useBusinessAlerts';
import {
  ALERT_COUNT_BADGE,
  ALERT_COUNT_BADGE_ACTIVE,
  ALERT_FILTER_PILL,
  ALERT_FILTER_PILL_ACTIVE,
  ALERT_FILTER_ROW,
  categoryFilterDotClass,
} from '@/components/modules/alerts/alert-page-styles';
import { ALERT_CATEGORY_ORDER, type AlertCategory } from '@/lib/services/business-alert-service';

const CATEGORY_FILTER_LABEL_KEYS: Record<AlertCategory, string> = {
  customer_due: 'alerts.filter_customer_followups',
  lead_followup: 'alerts.filter_lead_followups',
  low_stock: 'alerts.filter_low_stock_items',
  pending_purchase: 'alerts.filter_purchases_pending',
  production: 'alerts.filter_production_issues',
  payment_collection: 'alerts.filter_payments_due',
  supplier_due: 'alerts.filter_supplier_payments',
};

export function BusinessAlertsPage() {
  const t = useAppStore((s) => s.t);
  const searchParams = useSearchParams();
  const activeCategory = (searchParams.get('category') ?? 'all') as AlertCategory | 'all';
  const { alerts, summaries, visibleCategories } = useBusinessAlerts();

  const displayed =
    activeCategory === 'all' ? alerts : alerts.filter((a) => a.category === activeCategory);

  useRegisterModuleActions(
    <Link
      href="/settings/alert-settings"
      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer self-start xl:self-center shrink-0"
    >
      <Icon icon="fluent-color:settings-24" width={18} height={18} />
      {t('alerts.settings_link')}
    </Link>,
    [t],
  );

  return (
    <>
      <div className={ALERT_FILTER_ROW}>
        <Link
          href="/alerts"
          className={activeCategory === 'all' ? ALERT_FILTER_PILL_ACTIVE : ALERT_FILTER_PILL}
        >
          {t('alerts.filter_all_label')}
          <span className={activeCategory === 'all' ? ALERT_COUNT_BADGE_ACTIVE : ALERT_COUNT_BADGE}>
            {alerts.length}
          </span>
        </Link>
        {ALERT_CATEGORY_ORDER.filter((c) => visibleCategories.includes(c)).map((category) => {
          const summary = summaries.find((s) => s.category === category);
          const count = summary?.count ?? 0;
          if (!count && activeCategory !== category) return null;
          const isActive = activeCategory === category;
          return (
            <Link
              key={category}
              href={`/alerts?category=${category}`}
              className={isActive ? ALERT_FILTER_PILL_ACTIVE : ALERT_FILTER_PILL}
            >
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${isActive ? 'bg-white' : categoryFilterDotClass(category)}`}
                aria-hidden
              />
              {t(CATEGORY_FILTER_LABEL_KEYS[category])}
              <span className={isActive ? ALERT_COUNT_BADGE_ACTIVE : ALERT_COUNT_BADGE}>{count}</span>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
        {displayed.length ? (
          displayed.map((alert) => <BusinessAlertCard key={alert.id} alert={alert} />)
        ) : (
          <div className="premium-card premium-shadow p-8 text-center xl:col-span-2">
            <Icon icon="fluent-color:checkmark-circle-24" width={40} height={40} className="mx-auto mb-3 opacity-80" />
            <p className="text-sm font-bold text-slate-700">{t('alerts.empty')}</p>
            <p className="text-xs text-slate-500 mt-1">{t('alerts.empty_hint')}</p>
          </div>
        )}
      </div>

      <Footer />
    </>
  );
}
