'use client';

import dynamic from 'next/dynamic';
import { useMemo, useEffect } from 'react';
import { loadIcons } from '@iconify/react';
import { Icon } from '@iconify/react';
import { Footer } from '@/components/layout/Footer';
import { PageSkeleton } from '@/components/shared/PageSkeleton';
import { useLocaleFormat } from '@/hooks/useLocaleFormat';
import { pageSkeletonLoader } from '@/components/shared/PageSkeleton';
import { emptyDashboardShell, useDashboardReady, DashboardStateProvider } from '@/hooks/use-dashboard-api-data';
import { useAppStore } from '@/lib/state/app-store';
import { applyApiDataToAppState } from '@/lib/services/api-app-state-mapper';
import { getDashboardMetrics } from '@/lib/services/dashboard-metrics';
import type { ApiModuleSnapshot } from '@/lib/server/fetch-modules';

const SalesTrendChart = dynamic(
  () => import('@/components/modules/dashboard/SalesTrendChart').then((m) => m.SalesTrendChart),
  { ssr: false, loading: pageSkeletonLoader('chart', { chartClassName: 'lg:col-span-2' }) },
);
const RevenueAnalyticsChart = dynamic(
  () => import('@/components/modules/dashboard/RevenueAnalyticsChart').then((m) => m.RevenueAnalyticsChart),
  { ssr: false, loading: pageSkeletonLoader('chart') },
);
const DashboardBusinessAlerts = dynamic(
  () => import('@/components/modules/dashboard/DashboardBusinessAlerts').then((m) => m.DashboardBusinessAlerts),
  { ssr: false, loading: pageSkeletonLoader('generic', { count: 3, className: 'min-h-[280px]' }) },
);
const DashboardBottomPanels = dynamic(
  () => import('@/components/modules/dashboard/DashboardBottomPanels').then((m) => m.DashboardBottomPanels),
  { ssr: false, loading: pageSkeletonLoader('generic', { count: 3, className: 'lg:col-span-4 min-h-[220px]' }) },
);
const DashboardProjectProgress = dynamic(
  () => import('@/components/modules/dashboard/DashboardProjectProgress').then((m) => m.DashboardProjectProgress),
  { ssr: false, loading: pageSkeletonLoader('generic', { count: 2, className: 'min-h-[160px]' }) },
);

const KPI_CARDS: { key: string; labelKey: string; icon: string; alert?: boolean }[] = [
  { key: 'month-revenue', labelKey: 'dashboard.total_revenue', icon: 'flat-color-icons:currency-exchange' },
  { key: 'sales-summary', labelKey: 'dashboard.sales_summary', icon: 'fluent-color:data-trending-24' },
  { key: 'pending-sales', labelKey: 'dashboard.pending_sales', icon: 'flat-color-icons:shipped' },
  { key: 'customer-due', labelKey: 'dashboard.customer_due', icon: 'fluent-color:person-24' },
  { key: 'low-stock', labelKey: 'dashboard.low_stock', icon: 'fluent-color:alert-badge-24', alert: true },
  { key: 'pending-production', labelKey: 'dashboard.pending_production', icon: 'fluent-color:clock-24' },
  { key: 'production-summary', labelKey: 'dashboard.production_summary', icon: 'flat-color-icons:factory' },
  { key: 'open-leads', labelKey: 'dashboard.open_leads', icon: 'fluent-color:people-interwoven-24' },
  { key: 'total-inventory', labelKey: 'dashboard.total_inventory', icon: 'flat-color-icons:shop' },
  { key: 'pending-purchase', labelKey: 'dashboard.pending_purchase', icon: 'fluent-color:document-add-24' },
  { key: 'purchase-summary', labelKey: 'dashboard.purchase_summary', icon: 'fluent-color:notebook-24' },
  { key: 'rm-stock', labelKey: 'dashboard.rm_stock', icon: 'flat-color-icons:tree-structure' },
  { key: 'fg-stock', labelKey: 'dashboard.fg_stock', icon: 'flat-color-icons:filing-cabinet' },
  { key: 'sf-stock', labelKey: 'dashboard.sf_stock', icon: 'fluent-color:puzzle-piece-24' },
  { key: 'supplier-due', labelKey: 'dashboard.supplier_due', icon: 'fluent-color:building-store-24' },
];

type DashboardViewProps = {
  serverSnapshot?: ApiModuleSnapshot | null;
};

export function DashboardView({ serverSnapshot = null }: DashboardViewProps) {
  const baseState = useAppStore((s) => s.appState);
  const ready = useDashboardReady();
  const t = useAppStore((s) => s.t);
  const { formatMoney } = useLocaleFormat();

  const dashboardState = useMemo(() => {
    if (ready) return baseState;
    if (serverSnapshot && Object.keys(serverSnapshot).length > 0) {
      return applyApiDataToAppState(emptyDashboardShell(baseState), serverSnapshot);
    }
    return emptyDashboardShell(baseState);
  }, [ready, baseState, serverSnapshot]);

  const hasInitialData = ready || Boolean(serverSnapshot && Object.keys(serverSnapshot).length > 0);

  useEffect(() => {
    document.body.classList.add('dashboard-page');
    loadIcons(KPI_CARDS.map((card) => card.icon));
    return () => document.body.classList.remove('dashboard-page');
  }, []);

  const metrics = useMemo(
    () => getDashboardMetrics(dashboardState),
    [dashboardState],
  );

  const metricValues = useMemo<Record<string, { value: string; sub?: string }>>(
    () => ({
      'production-summary': {
        value: t('dashboard.metric_completed', { n: metrics.productionSummary.completed }),
        sub: t('dashboard.metric_pcs_produced', { n: metrics.productionSummary.qty }),
      },
      'purchase-summary': {
        value: t('dashboard.metric_orders_lower', { n: metrics.purchaseSummary.count }),
        sub: t('dashboard.metric_total_suffix', { amount: formatMoney(metrics.purchaseSummary.total) }),
      },
      'sales-summary': {
        value: t('dashboard.metric_orders_lower', { n: metrics.salesSummary.count }),
        sub: t('dashboard.metric_total_suffix', { amount: formatMoney(metrics.salesSummary.total) }),
      },
      'rm-stock': { value: formatMoney(metrics.rmStockValue), sub: t('dashboard.raw_materials') },
      'sf-stock': { value: formatMoney(metrics.sfStockValue), sub: t('dashboard.metric_parts_wip') },
      'fg-stock': { value: formatMoney(metrics.fgStockValue), sub: t('dashboard.ready_dispatch') },
      'low-stock': {
        value: t('dashboard.metric_items', { n: metrics.lowStock }),
        sub: metrics.lowStock > 0 ? t('dashboard.requires_attention') : t('dashboard.stock_levels_ok'),
      },
      'pending-production': {
        value: t('dashboard.metric_orders', { n: metrics.pendingProduction }),
        sub: t('dashboard.metric_pcs_planned', { n: metrics.pendingProductionQty }),
      },
      'pending-purchase': {
        value: t('dashboard.metric_orders', { n: metrics.pendingPurchase }),
        sub: t('dashboard.raw_materials'),
      },
      'pending-sales': {
        value: t('dashboard.metric_orders', { n: metrics.pendingSales }),
        sub: t('dashboard.awaiting_dispatch'),
      },
      'customer-due': {
        value: formatMoney(metrics.customerDue),
        sub: t('dashboard.metric_across_customers', { n: metrics.customerDueCount }),
      },
      'supplier-due': {
        value: formatMoney(metrics.supplierDue),
        sub: t('dashboard.metric_across_suppliers', { n: metrics.supplierDueCount }),
      },
      'total-inventory': {
        value: formatMoney(metrics.totalInventoryValue),
        sub: t('dashboard.metric_all_stock'),
      },
      'open-leads': {
        value: t('dashboard.metric_leads', { n: metrics.openLeadsCount }),
        sub: t('dashboard.metric_pipeline_suffix', { amount: formatMoney(metrics.openLeadsValue) }),
      },
      'month-revenue': {
        value: formatMoney(metrics.monthRevenue),
        sub: t('dashboard.metric_month_orders', { n: metrics.monthSalesCount }),
      },
    }),
    [t, formatMoney, metrics],
  );

  if (!hasInitialData) {
    return <PageSkeleton variant="dashboard" label="Loading dashboard" />;
  }

  return (
    <DashboardStateProvider value={dashboardState}>
      <div className="space-y-2 flex flex-col">
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {KPI_CARDS.map((card) => {
          const data = metricValues[card.key];
          return (
            <div
              key={card.key}
              className="premium-card premium-shadow p-3.5 flex items-center justify-between gap-3 transition-[border-color,box-shadow] hover:border-slate-300 hover:shadow-md min-h-[80px]"
              data-metric={card.key}
            >
              <div className="flex flex-col justify-center gap-0.5 min-w-0 flex-1 my-auto">
                <span className="text-xs font-bold text-slate-500 tracking-wide leading-tight">{t(card.labelKey)}</span>
                <span className="text-base md:text-lg font-extrabold tracking-tight text-slate-900 leading-tight mt-0.5 tabular-nums">{data?.value ?? '—'}</span>
                {card.alert && data?.sub ? (
                  <span
                    className={`text-[11px] font-bold block ${metrics.lowStock > 0 ? 'text-rose-600' : 'text-emerald-600'}`}
                  >
                    {data.sub}
                  </span>
                ) : data?.sub ? (
                  <span className="text-[11px] text-slate-500 font-medium block truncate">{data.sub}</span>
                ) : null}
              </div>
              <div className="kpi-card-icon-wrap shrink-0 my-auto self-center">
                <Icon icon={card.icon} width={38} height={38} className="kpi-card-icon shrink-0" />
              </div>
            </div>
          );
        })}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-4 gap-2 items-stretch">
        <SalesTrendChart />
        <RevenueAnalyticsChart />
        <DashboardBusinessAlerts />
      </section>

      <DashboardBottomPanels />

      <DashboardProjectProgress />

      <Footer />
      </div>
    </DashboardStateProvider>
  );
}
