'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo } from 'react';
import { Icon } from '@iconify/react';
import { Footer } from '@/components/layout/Footer';
import { useAppStore } from '@/lib/state/app-store';
import type { AppState } from '@/lib/state/types';
import { useLocaleFormat } from '@/hooks/useLocaleFormat';
import { DashboardBusinessAlerts } from '@/components/modules/dashboard/DashboardBusinessAlerts';
import { DashboardBottomPanels } from '@/components/modules/dashboard/DashboardBottomPanels';
import { pageSkeletonLoader } from '@/components/shared/PageSkeleton';
import { countLowStockItems } from '@/lib/services/business-alert-service';
import {
  getFinishedGoodsMetrics,
  getRawMaterialMetrics,
  getSemiFinishedMetrics,
} from '@/lib/services/inventory-service';

const SalesTrendChart = dynamic(
  () => import('@/components/modules/dashboard/SalesTrendChart').then((m) => m.SalesTrendChart),
  { ssr: false, loading: pageSkeletonLoader('chart', { chartClassName: 'lg:col-span-2' }) },
);
const RevenueAnalyticsChart = dynamic(
  () => import('@/components/modules/dashboard/RevenueAnalyticsChart').then((m) => m.RevenueAnalyticsChart),
  { ssr: false, loading: pageSkeletonLoader('chart') },
);

function getDashboardMetrics(appState: AppState) {
  const production = Array.isArray(appState.productionOrders) ? appState.productionOrders : [];
  const purchases = Array.isArray(appState.purchases) ? appState.purchases : [];
  const sales = Array.isArray(appState.salesOrders) ? appState.salesOrders : [];
  const customers = Array.isArray(appState.crmCustomers) ? appState.crmCustomers : [];
  const suppliers = Array.isArray(appState.purchasesSuppliers) ? appState.purchasesSuppliers : [];

  const lowStock = countLowStockItems(appState);

  const pendingProd = production.filter((p) => ['Planned', 'In Progress'].includes(String(p.status)));
  const pendingPurchase = purchases.filter((p) => ['Draft', 'Sent'].includes(String(p.status)));
  const pendingSales = sales.filter((s) => ['confirmed', 'processing', 'draft'].includes(String(s.status || '').toLowerCase()));
  const completedProd = production.filter((p) => p.status === 'Completed');
  const prodQty = completedProd.reduce((s, p) => s + Number(p.actualQuantity || p.plannedQuantity || 0), 0);
  const pendingProdQty = pendingProd.reduce((s, p) => s + Number(p.plannedQuantity || 0), 0);
  const customersWithDue = customers.filter((c) => Number(c.due || 0) > 0);
  const suppliersWithDue = suppliers.filter((s) => Number(s.due || s.balance || 0) > 0);

  return {
    pendingProduction: pendingProd.length,
    pendingProductionQty: pendingProdQty,
    pendingPurchase: pendingPurchase.length,
    pendingSales: pendingSales.length,
    lowStock,
    rmStockValue: getRawMaterialMetrics(appState).totalValue,
    sfStockValue: getSemiFinishedMetrics(appState).totalValue,
    fgStockValue: getFinishedGoodsMetrics(appState).totalValue,
    customerDue: customers.reduce((s, c) => s + Number(c.due || 0), 0),
    customerDueCount: customersWithDue.length || customers.length,
    supplierDue: suppliers.reduce((s, item) => s + Number(item.due || item.balance || 0), 0),
    supplierDueCount: suppliersWithDue.length || suppliers.length,
    productionSummary: { completed: completedProd.length, qty: prodQty },
    purchaseSummary: { count: purchases.length, total: purchases.reduce((s, o) => s + Number(o.total || 0), 0) },
    salesSummary: { count: sales.length, total: sales.reduce((s, o) => s + Number(o.total || 0), 0) },
  };
}

const KPI_CARDS: { key: string; labelKey: string; icon: string; alert?: boolean }[] = [
  { key: 'production-summary', labelKey: 'dashboard.production_summary', icon: 'flat-color-icons:factory' },
  { key: 'purchase-summary', labelKey: 'dashboard.purchase_summary', icon: 'fluent-color:notebook-24' },
  { key: 'sales-summary', labelKey: 'dashboard.sales_summary', icon: 'fluent-color:data-trending-24' },
  { key: 'rm-stock', labelKey: 'dashboard.rm_stock', icon: 'flat-color-icons:tree-structure' },
  { key: 'sf-stock', labelKey: 'dashboard.sf_stock', icon: 'fluent-color:puzzle-piece-24' },
  { key: 'fg-stock', labelKey: 'dashboard.fg_stock', icon: 'flat-color-icons:filing-cabinet' },
  { key: 'low-stock', labelKey: 'dashboard.low_stock', icon: 'fluent-color:alert-badge-24', alert: true },
  { key: 'pending-production', labelKey: 'dashboard.pending_production', icon: 'fluent-color:clock-24' },
  { key: 'pending-purchase', labelKey: 'dashboard.pending_purchase', icon: 'fluent-color:document-add-24' },
  { key: 'pending-sales', labelKey: 'dashboard.pending_sales', icon: 'flat-color-icons:shipped' },
  { key: 'customer-due', labelKey: 'dashboard.customer_due', icon: 'fluent-color:person-24' },
  { key: 'supplier-due', labelKey: 'dashboard.supplier_due', icon: 'fluent-color:building-store-24' },
];

export function DashboardView() {
  const appState = useAppStore((s) => s.appState);
  const t = useAppStore((s) => s.t);
  const { formatMoney } = useLocaleFormat();

  useEffect(() => {
    document.body.classList.add('dashboard-page');
    return () => document.body.classList.remove('dashboard-page');
  }, []);

  const metrics = useMemo(() => getDashboardMetrics(appState), [appState]);

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
    }),
    [t, formatMoney, metrics],
  );

  return (
    <div className="space-y-2 flex flex-col">
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {KPI_CARDS.map((card) => {
          const data = metricValues[card.key];
          return (
            <div
              key={card.key}
              className="premium-card premium-shadow p-3.5 flex items-center justify-between gap-3 transition-[border-color,box-shadow] hover:border-slate-300 hover:shadow-md min-h-[86px]"
              data-metric={card.key}
            >
              <div className="flex flex-col justify-center gap-0.5 min-w-0 flex-1 my-auto">
                <span className="text-xs font-bold text-slate-500 tracking-wide leading-tight">{t(card.labelKey)}</span>
                <span className="text-lg md:text-xl font-extrabold tracking-tight text-slate-900 leading-tight mt-0.5 tabular-nums">{data?.value ?? '—'}</span>
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

      <section className="grid grid-cols-1 lg:grid-cols-4 gap-2">
        <SalesTrendChart />
        <RevenueAnalyticsChart />
        <DashboardBusinessAlerts />
      </section>

      <DashboardBottomPanels />

      <Footer />
    </div>
  );
}
