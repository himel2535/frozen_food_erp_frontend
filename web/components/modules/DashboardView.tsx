'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useMemo, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Icon } from '@iconify/react';
import {
  DashboardSalesTrendChartSkeleton,
  DashboardRevenueChartSkeleton,
  DashboardProjectProgressSkeleton,
} from '@/components/skeletons/DashboardLoadingSkeleton';
import { SalesTrendChart } from '@/components/modules/dashboard/SalesTrendChart';
import { RevenueAnalyticsChart } from '@/components/modules/dashboard/RevenueAnalyticsChart';
import { DashboardBusinessAlerts } from '@/components/modules/dashboard/DashboardBusinessAlerts';
import { DashboardBottomPanels } from '@/components/modules/dashboard/DashboardBottomPanels';
import { DashboardPerfCollector } from '@/components/modules/dashboard/DashboardPerfCollector';
import { useLocaleFormat } from '@/hooks/useLocaleFormat';
import { emptyDashboardShell, useDashboardReady, DashboardStateProvider } from '@/hooks/use-dashboard-api-data';
import { useAppStore } from '@/lib/state/app-store';
import { applyApiDataToAppState } from '@/lib/services/api-app-state-mapper';
import { buildDashboardMetricValues, summaryLowStock } from '@/lib/services/dashboard-summary-metrics';
import {
  fetchDashboardSummary,
  invalidateDashboardSummaryCache,
  peekDashboardSummary,
  type DashboardSummary,
} from '@/lib/services/api-resource-service';
import { onApiMutation } from '@/lib/services/api-sync-events';
import type { DashboardServerPayload } from '@/lib/server/dashboard-snapshot';
import { SkeletonText } from '@/components/skeletons/SkeletonText';
import { isMongoDbBackend } from '@/lib/config/data-source';
import { DASHBOARD_DATA_MUTATION_MODULES } from '@/lib/config/dashboard-mutation-modules';
import { DASHBOARD_KPI_CARDS, isDashboardPath } from '@/lib/ui/dashboard-kpi';
import type { DashboardMetrics } from '@/lib/services/dashboard-metrics';
import type { TranslateFn } from '@/lib/i18n/resolve-label';

const DashboardProjectProgress = dynamic(
  () => import('@/components/modules/dashboard/DashboardProjectProgress').then((m) => m.DashboardProjectProgress),
  { ssr: false, loading: () => <DashboardProjectProgressSkeleton /> },
);

const SUMMARY_MUTATION_MODULES = new Set<string>(DASHBOARD_DATA_MUTATION_MODULES);

type FormatMoney = (value: number, opts?: { decimals?: number }) => string;

function localMetricValues(
  metrics: DashboardMetrics,
  t: TranslateFn,
  formatMoney: FormatMoney,
): Record<string, { value: string; sub?: string }> {
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
}

type DashboardViewProps = {
  serverPayload?: DashboardServerPayload | null;
};

export function DashboardView({ serverPayload = null }: DashboardViewProps) {
  const serverSnapshot = serverPayload?.modules ?? null;
  const serverSummary = serverPayload?.summary ?? null;
  const baseState = useAppStore((s) => s.appState);
  const ready = useDashboardReady();
  const t = useAppStore((s) => s.t);
  const pathname = usePathname();
  const { formatMoney } = useLocaleFormat();

  const [liveSummary, setLiveSummary] = useState<DashboardSummary | null>(() => {
    const kpi = peekDashboardSummary('kpi');
    const extra = peekDashboardSummary('extra');
    if (!kpi && !extra) return null;
    return { ...(kpi ?? {}), ...(extra ?? {}) } as DashboardSummary;
  });
  const [summaryFailed, setSummaryFailed] = useState(false);
  const [demoMetrics, setDemoMetrics] = useState<DashboardMetrics | null>(null);

  const dashboardState = useMemo(() => {
    if (ready) return baseState;
    if (serverSnapshot && Object.keys(serverSnapshot).length > 0) {
      return applyApiDataToAppState(emptyDashboardShell(baseState), serverSnapshot);
    }
    return emptyDashboardShell(baseState);
  }, [ready, baseState, serverSnapshot]);

  const hasKpi = typeof (liveSummary ?? serverSummary)?.monthRevenue === 'number';

  useEffect(() => {
    document.body.classList.add('dashboard-page');
    if (typeof performance !== 'undefined') {
      performance.mark('dashboard-view-mounted');
      try {
        performance.measure(
          'dashboard-view-mount',
          'dashboard-view-chunk-evaluated',
          'dashboard-view-mounted',
        );
      } catch {
        /* mark missing on first paint without dynamic wrapper */
      }
    }
    return () => document.body.classList.remove('dashboard-page');
  }, []);

  useEffect(() => {
    if (!isMongoDbBackend() || !isDashboardPath(pathname)) return;

    let active = true;

    const mergeSummary = (next: DashboardSummary | null) => {
      if (!active || !next) return;
      setLiveSummary((prev) => {
        const base = prev ?? serverSummary;
        if (typeof next.monthRevenue === 'number') {
          return { ...(base ?? {}), ...next } as DashboardSummary;
        }
        if (!base || typeof base.monthRevenue !== 'number') return prev;
        return { ...base, ...next };
      });
    };

    const loadKpi = async () => {
      const data = await fetchDashboardSummary('kpi');
      if (!active) return;
      if (data) {
        mergeSummary(data);
        return true;
      }
      if (!serverSummary) setSummaryFailed(true);
      return false;
    };

    const loadExtra = async () => {
      const data = await fetchDashboardSummary('extra');
      if (data) {
        mergeSummary(data);
        return;
      }
      mergeSummary({ lowStock: 0 } as DashboardSummary);
    };

    const refreshAll = async () => {
      invalidateDashboardSummaryCache();
      const [kpi, extra] = await Promise.all([
        fetchDashboardSummary('kpi'),
        fetchDashboardSummary('extra'),
      ]);
      mergeSummary(kpi);
      mergeSummary(extra);
    };

    if (serverSummary) {
      if (typeof serverSummary.lowStock !== 'number') void loadExtra();
    } else {
      void loadKpi();
      void loadExtra();
    }

    const unsubscribe = onApiMutation((modules) => {
      if (modules?.some((mod) => SUMMARY_MUTATION_MODULES.has(mod))) {
        void refreshAll();
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [serverSummary, pathname]);

  useEffect(() => {
    if (isMongoDbBackend()) return;
    let cancelled = false;
    void import('@/lib/services/dashboard-metrics').then(({ getDashboardMetrics }) => {
      if (!cancelled) setDemoMetrics(getDashboardMetrics(dashboardState));
    });
    return () => {
      cancelled = true;
    };
  }, [dashboardState]);

  const activeSummary = liveSummary || serverSummary;

  const metricValues = useMemo<Record<string, { value: string; sub?: string }>>(() => {
    if (activeSummary) {
      return buildDashboardMetricValues(activeSummary, t, formatMoney);
    }
    if (demoMetrics) return localMetricValues(demoMetrics, t, formatMoney);
    return {};
  }, [t, formatMoney, demoMetrics, activeSummary]);

  const lowStockCount = activeSummary ? summaryLowStock(activeSummary) : (demoMetrics?.lowStock ?? 0);
  const extraReady =
    !isMongoDbBackend() ||
    summaryFailed ||
    typeof activeSummary?.lowStock === 'number';
  const kpiPending = isMongoDbBackend() && !hasKpi && !summaryFailed;

  return (
    <DashboardStateProvider value={dashboardState}>
      <div className="flex flex-col flex-1 min-h-0 gap-1">
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1 shrink-0">
        {DASHBOARD_KPI_CARDS.map((card) => {
          const data = metricValues[card.key];
          const className = `premium-card premium-shadow px-4 py-2.5 flex items-center justify-between gap-3 transition-[border-color,box-shadow] hover:border-slate-300 hover:shadow-md min-h-[84px]${card.href ? ' cursor-pointer' : ''}`;
          const showValueSkeleton = kpiPending || (card.key === 'low-stock' && !extraReady);
          const body = (
            <>
              <div className="flex flex-col justify-center gap-0.5 min-w-0 flex-1 my-auto">
                <span className="text-xs font-bold text-slate-500 tracking-wide leading-tight block">{t(card.labelKey)}</span>
                {showValueSkeleton ? (
                  <>
                    <SkeletonText className="h-5 w-[72px] max-w-[90%] mt-0.5" />
                    <SkeletonText className="h-2.5 w-[96px] max-w-[95%]" />
                  </>
                ) : (
                  <>
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
                  </>
                )}
              </div>
              <div className="shrink-0 my-auto self-center">
                <Icon icon={card.icon} width={40} height={40} className="shrink-0" />
              </div>
            </>
          );
          return card.href ? (
            <Link key={card.key} href={card.href} prefetch={false} className={className} data-metric={card.key}>
              {body}
            </Link>
          ) : (
            <div key={card.key} className={className} data-metric={card.key}>
              {body}
            </div>
          );
        })}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-4 gap-1 min-h-0 items-stretch" style={{ flex: '2 1 0%' }}>
        {ready ? <SalesTrendChart /> : <DashboardSalesTrendChartSkeleton />}
        {ready ? <RevenueAnalyticsChart /> : <DashboardRevenueChartSkeleton />}
        <DashboardBusinessAlerts />
      </section>

      <DashboardBottomPanels criticalPaintReady={!kpiPending} />

      <DashboardPerfCollector />
      <DashboardProjectProgress />
      </div>
    </DashboardStateProvider>
  );
}
