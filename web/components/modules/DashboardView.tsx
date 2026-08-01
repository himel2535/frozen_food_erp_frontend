'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Icon } from '@iconify/react';
import { Footer } from '@/components/layout/Footer';
import { useAppStore } from '@/lib/state/app-store';
import type { AppState } from '@/lib/state/types';
import { SalesTrendChart } from '@/components/modules/dashboard/SalesTrendChart';
import { RevenueAnalyticsChart } from '@/components/modules/dashboard/RevenueAnalyticsChart';
import { DashboardNotifications } from '@/components/modules/dashboard/DashboardNotifications';
import { DashboardBottomPanels } from '@/components/modules/dashboard/DashboardBottomPanels';

function formatMoney(value: number) {
  return `৳ ${Number(value || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

function stockValue(list: Array<Record<string, unknown>>) {
  return list.reduce((sum, product) => sum + Number(product.stock || 0) * Number(product.cost || 0), 0);
}

function getDashboardMetrics(appState: AppState) {
  const inventory = Array.isArray(appState.inventory) ? appState.inventory : [];
  const production = Array.isArray(appState.productionOrders) ? appState.productionOrders : [];
  const purchases = Array.isArray(appState.purchases) ? appState.purchases : [];
  const sales = Array.isArray(appState.salesOrders) ? appState.salesOrders : [];
  const customers = Array.isArray(appState.crmCustomers) ? appState.crmCustomers : [];
  const suppliers = Array.isArray(appState.purchasesSuppliers) ? appState.purchasesSuppliers : [];

  const rm = inventory.filter((p) => p.productType === 'Raw Materials');
  const sf = inventory.filter((p) => p.productType === 'Semi-Finished Goods');
  const fg = inventory.filter((p) => p.productType === 'Finished Goods');

  const lowStock = inventory.filter((p) => {
    const min = Number(p.minStock ?? p.reorderLevel ?? 0);
    return min > 0 && Number(p.stock || 0) < min;
  }).length;

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
    rmStockValue: stockValue(rm),
    sfStockValue: stockValue(sf),
    fgStockValue: stockValue(fg),
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

const QUICK_ACTIONS: { href: string; labelKey: string; icon: string; className: string }[] = [
  {
    href: '/sales/orders',
    labelKey: 'dashboard.new_sale',
    icon: 'fluent-color:clipboard-task-24',
    className: 'bg-sky-50 text-sky-900 border border-sky-200/80 hover:bg-sky-100/80 shadow-xs',
  },
  {
    href: '/purchases/purchase-rm',
    labelKey: 'dashboard.purchase_rm',
    icon: 'fluent-color:document-add-24',
    className: 'bg-violet-50 text-violet-900 border border-violet-200/80 hover:bg-violet-100/80 shadow-xs',
  },
  {
    href: '/inventory/stock-in',
    labelKey: 'dashboard.receive_goods',
    icon: 'flat-color-icons:download',
    className: 'bg-emerald-50 text-emerald-900 border border-emerald-200/80 hover:bg-emerald-100/80 shadow-xs',
  },
];

export function DashboardView() {
  const appState = useAppStore((s) => s.appState);
  const t = useAppStore((s) => s.t);
  const [date, setDate] = useState('');

  useEffect(() => {
    setDate(new Date().toISOString().slice(0, 10));
    document.body.classList.add('dashboard-page');
    return () => document.body.classList.remove('dashboard-page');
  }, []);

  const metrics = useMemo(() => getDashboardMetrics(appState), [appState]);

  const metricValues: Record<string, { value: string; sub?: string }> = {
    'production-summary': {
      value: t('dashboard.metric_completed', { n: metrics.productionSummary.completed }),
      sub: t('dashboard.metric_pcs_produced', { n: metrics.productionSummary.qty.toLocaleString() }),
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
    'low-stock': { value: t('dashboard.metric_items', { n: metrics.lowStock }) },
    'pending-production': {
      value: t('dashboard.metric_orders', { n: metrics.pendingProduction }),
      sub: t('dashboard.metric_pcs_planned', { n: metrics.pendingProductionQty.toLocaleString() }),
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
  };

  return (
    <div className="flex-1 overflow-y-auto p-2 space-y-2 flex flex-col">
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div className="hidden md:flex overflow-x-auto gap-2 min-w-0">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={`flex items-center gap-2.5 whitespace-nowrap px-4 py-2.5 rounded-xl font-bold text-xs transition-all shrink-0 cursor-pointer ${action.className}`}
            >
              <Icon icon={action.icon} width={22} height={22} className="shrink-0" />
              {t(action.labelKey)}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-2 justify-end shrink-0 md:ml-auto">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 premium-shadow focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
          />
        </div>
      </section>

      <section className="flex md:hidden overflow-x-auto gap-2 pb-1">
        {QUICK_ACTIONS.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className={`flex items-center gap-2.5 whitespace-nowrap px-4 py-2.5 rounded-xl font-bold text-xs transition-all shrink-0 cursor-pointer ${action.className}`}
          >
            <Icon icon={action.icon} width={22} height={22} className="shrink-0" />
            {t(action.labelKey)}
          </Link>
        ))}
      </section>

      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {KPI_CARDS.map((card) => {
          const data = metricValues[card.key];
          return (
            <div
              key={card.key}
              className="premium-card premium-shadow p-3.5 flex items-center justify-between gap-3 transition-all hover:border-slate-300 hover:shadow-md min-h-[86px]"
              data-metric={card.key}
            >
              <div className="flex flex-col justify-center gap-0.5 min-w-0 flex-1 my-auto">
                <span className="text-xs font-bold text-slate-500 tracking-wide leading-tight">{t(card.labelKey)}</span>
                <span className="text-lg md:text-xl font-extrabold tracking-tight text-slate-900 leading-tight mt-0.5">{data?.value ?? '—'}</span>
                {card.alert ? (
                  <span className="text-[11px] text-rose-600 font-bold block">{t('dashboard.requires_attention')}</span>
                ) : data?.sub ? (
                  <span className="text-[11px] text-slate-500 font-medium block truncate">{data.sub}</span>
                ) : null}
              </div>
              <div className="flex items-center justify-center shrink-0 my-auto self-center">
                <Icon icon={card.icon} width={38} height={38} className="shrink-0" />
              </div>
            </div>
          );
        })}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-4 gap-2">
        <SalesTrendChart />
        <RevenueAnalyticsChart />
        <DashboardNotifications />
      </section>

      <DashboardBottomPanels />

      <Footer />
    </div>
  );
}
