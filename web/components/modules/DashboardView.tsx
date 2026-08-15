'use client';

import dynamic from 'next/dynamic';
import { useMemo, useEffect, useState } from 'react';
import { loadIcons } from '@iconify/react';
import { Icon } from '@iconify/react';
import {
  DashboardLoadingSkeleton,
  DashboardSalesTrendChartSkeleton,
  DashboardRevenueChartSkeleton,
  DashboardBusinessAlertsSkeleton,
  DashboardBottomPanelsSkeleton,
  DashboardProjectProgressSkeleton,
} from '@/components/skeletons/DashboardLoadingSkeleton';
import { useLocaleFormat } from '@/hooks/useLocaleFormat';
import { emptyDashboardShell, useDashboardReady, DashboardStateProvider } from '@/hooks/use-dashboard-api-data';
import { useAppStore } from '@/lib/state/app-store';
import { applyApiDataToAppState } from '@/lib/services/api-app-state-mapper';
import { getDashboardMetrics } from '@/lib/services/dashboard-metrics';
import { buildDashboardMetricValues, summaryLowStock } from '@/lib/services/dashboard-summary-metrics';
import { fetchDashboardSummary, type DashboardSummary } from '@/lib/services/api-resource-service';
import { onApiMutation } from '@/lib/services/api-sync-events';
import type { DashboardServerPayload } from '@/lib/server/dashboard-snapshot';

const SalesTrendChart = dynamic(
  () => import('@/components/modules/dashboard/SalesTrendChart').then((m) => m.SalesTrendChart),
  { ssr: false, loading: () => <DashboardSalesTrendChartSkeleton /> },
);
const RevenueAnalyticsChart = dynamic(
  () => import('@/components/modules/dashboard/RevenueAnalyticsChart').then((m) => m.RevenueAnalyticsChart),
  { ssr: false, loading: () => <DashboardRevenueChartSkeleton /> },
);
const DashboardBusinessAlerts = dynamic(
  () => import('@/components/modules/dashboard/DashboardBusinessAlerts').then((m) => m.DashboardBusinessAlerts),
  { ssr: false, loading: () => <DashboardBusinessAlertsSkeleton /> },
);
const DashboardBottomPanels = dynamic(
  () => import('@/components/modules/dashboard/DashboardBottomPanels').then((m) => m.DashboardBottomPanels),
  { ssr: false, loading: () => <DashboardBottomPanelsSkeleton /> },
);
const DashboardProjectProgress = dynamic(
  () => import('@/components/modules/dashboard/DashboardProjectProgress').then((m) => m.DashboardProjectProgress),
  { ssr: false, loading: () => <DashboardProjectProgressSkeleton /> },
);

const SUMMARY_MUTATION_MODULES = new Set(['invoices', 'salesOrders', 'payments']);

const KPI_CARDS: { key: string; labelKey: string; icon: string; alert?: boolean }[] = [
  { key: 'month-revenue', labelKey: 'dashboard.total_revenue', icon: 'flat-color-icons:currency-exchange' },
  { key: 'customer-due', labelKey: 'dashboard.customer_due', icon: 'fluent-color:person-24' },
  { key: 'low-stock', labelKey: 'dashboard.low_stock', icon: 'fluent-color:alert-badge-24', alert: true },
  { key: 'pending-sales', labelKey: 'dashboard.pending_sales', icon: 'flat-color-icons:shipped' },
  { key: 'open-leads', labelKey: 'dashboard.open_leads', icon: 'fluent-color:people-interwoven-24' },
  { key: 'pending-production', labelKey: 'dashboard.pending_production', icon: 'fluent-color:clock-24' },
];

type DashboardViewProps = {
  serverPayload?: DashboardServerPayload | null;
};

export function DashboardView({ serverPayload = null }: DashboardViewProps) {
  const serverSnapshot = serverPayload?.modules ?? null;
  const serverSummary = serverPayload?.summary ?? null;
  const baseState = useAppStore((s) => s.appState);
  const ready = useDashboardReady();
  const t = useAppStore((s) => s.t);
  const { formatMoney } = useLocaleFormat();

  const [liveSummary, setLiveSummary] = useState<DashboardSummary | null>(null);

  const dashboardState = useMemo(() => {
    if (ready) return baseState;
    if (serverSnapshot && Object.keys(serverSnapshot).length > 0) {
      return applyApiDataToAppState(emptyDashboardShell(baseState), serverSnapshot);
    }
    return emptyDashboardShell(baseState);
  }, [ready, baseState, serverSnapshot]);

  const hasInitialData = ready || Boolean(serverSummary) || Boolean(serverSnapshot && Object.keys(serverSnapshot).length > 0);

  useEffect(() => {
    document.body.classList.add('dashboard-page');
    loadIcons(KPI_CARDS.map((card) => card.icon));
    return () => document.body.classList.remove('dashboard-page');
  }, []);

  useEffect(() => {
    let active = true;

    const loadSummary = async () => {
      try {
        const data = await fetchDashboardSummary();
        if (active && data) setLiveSummary(data);
      } catch (err) {
        console.error('Failed to fetch live dashboard summary:', err);
      }
    };

    void loadSummary();
    const unsubscribe = onApiMutation((modules) => {
      if (!modules || modules.some((mod) => SUMMARY_MUTATION_MODULES.has(mod))) {
        void loadSummary();
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const metrics = useMemo(
    () => getDashboardMetrics(dashboardState),
    [dashboardState],
  );

  const activeSummary = liveSummary || serverSummary;

  const metricValues = useMemo<Record<string, { value: string; sub?: string }>>(() => {
    if (activeSummary) {
      return buildDashboardMetricValues(activeSummary, t, formatMoney);
    }
    return {
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
    };
  }, [t, formatMoney, metrics, activeSummary]);

  const lowStockCount = activeSummary ? summaryLowStock(activeSummary) : metrics.lowStock;

  if (!hasInitialData) {
    return <DashboardLoadingSkeleton />;
  }

  return (
    <DashboardStateProvider value={dashboardState}>
      <div className="flex flex-col flex-1 min-h-0 gap-1">
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1 shrink-0">
        {KPI_CARDS.map((card) => {
          const data = metricValues[card.key];
          return (
            <div
              key={card.key}
              className="premium-card premium-shadow px-4 py-2.5 flex items-center justify-between gap-3 transition-[border-color,box-shadow] hover:border-slate-300 hover:shadow-md min-h-[84px]"
              data-metric={card.key}
            >
              <div className="flex flex-col justify-center gap-0.5 min-w-0 flex-1 my-auto">
                <span className="text-xs font-bold text-slate-500 tracking-wide leading-tight block">{t(card.labelKey)}</span>
                <span className="text-lg font-extrabold tracking-tight text-slate-900 mt-0.5 tabular-nums">{data?.value ?? '—'}</span>
                {card.alert && data?.sub ? (
                  <span
                    className={`text-[10px] font-bold block ${lowStockCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}
                  >
                    {data.sub}
                  </span>
                ) : data?.sub ? (
                  <span className="text-[10px] text-slate-500 font-medium block truncate">{data.sub}</span>
                ) : null}
              </div>
              <div className="shrink-0 my-auto self-center">
                <Icon icon={card.icon} width={40} height={40} className="shrink-0" />
              </div>
            </div>
          );
        })}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-4 gap-1 min-h-0 items-stretch" style={{ flex: '2 1 0%' }}>
        <SalesTrendChart />
        <RevenueAnalyticsChart />
        <DashboardBusinessAlerts />
      </section>

      <DashboardBottomPanels />

      <DashboardProjectProgress />
      </div>
    </DashboardStateProvider>
  );
}
