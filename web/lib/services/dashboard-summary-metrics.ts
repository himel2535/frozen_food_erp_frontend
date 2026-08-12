import type { DashboardSummary } from '@/lib/services/api-resource-service';
import type { TranslateFn } from '@/lib/i18n/resolve-label';

type FormatMoney = (value: number, opts?: { decimals?: number }) => string;

export function buildDashboardMetricValues(
  summary: DashboardSummary,
  t: TranslateFn,
  formatMoney: FormatMoney,
) {
  return {
    'production-summary': {
      value: t('dashboard.metric_completed', { n: summary.productionCompleted }),
      sub: t('dashboard.metric_pcs_produced', { n: summary.productionQty }),
    },
    'purchase-summary': {
      value: t('dashboard.metric_orders_lower', { n: summary.purchaseSummary.count }),
      sub: t('dashboard.metric_total_suffix', { amount: formatMoney(summary.purchaseSummary.total) }),
    },
    'sales-summary': {
      value: t('dashboard.metric_orders_lower', { n: summary.salesSummary.count }),
      sub: t('dashboard.metric_total_suffix', { amount: formatMoney(summary.salesSummary.total) }),
    },
    'rm-stock': { value: formatMoney(summary.rmStockValue), sub: t('dashboard.raw_materials') },
    'sf-stock': { value: formatMoney(summary.sfStockValue), sub: t('dashboard.metric_parts_wip') },
    'fg-stock': { value: formatMoney(summary.fgStockValue), sub: t('dashboard.ready_dispatch') },
    'low-stock': {
      value: t('dashboard.metric_items', { n: summary.lowStock }),
      sub: summary.lowStock > 0 ? t('dashboard.requires_attention') : t('dashboard.stock_levels_ok'),
    },
    'pending-production': {
      value: t('dashboard.metric_orders', { n: summary.pendingProduction }),
      sub: t('dashboard.metric_pcs_planned', { n: summary.pendingProductionQty }),
    },
    'pending-purchase': {
      value: t('dashboard.metric_orders', { n: summary.pendingPurchase }),
      sub: t('dashboard.raw_materials'),
    },
    'pending-sales': {
      value: t('dashboard.metric_orders', { n: summary.pendingSales }),
      sub: t('dashboard.awaiting_dispatch'),
    },
    'customer-due': {
      value: formatMoney(summary.customerDue),
      sub: t('dashboard.metric_across_customers', { n: summary.customerDueCount }),
    },
    'supplier-due': {
      value: formatMoney(summary.supplierDue),
      sub: t('dashboard.metric_across_suppliers', { n: summary.supplierDueCount }),
    },
    'total-inventory': {
      value: formatMoney(summary.totalInventoryValue),
      sub: t('dashboard.metric_all_stock'),
    },
    'open-leads': {
      value: t('dashboard.metric_leads', { n: summary.openLeadsCount }),
      sub: t('dashboard.metric_pipeline_suffix', { amount: formatMoney(summary.openLeadsValue) }),
    },
    'month-revenue': {
      value: formatMoney(summary.monthRevenue),
      sub: t('dashboard.metric_month_orders', { n: summary.monthSalesCount }),
    },
  };
}

export function summaryLowStock(summary: DashboardSummary): number {
  return summary.lowStock;
}
