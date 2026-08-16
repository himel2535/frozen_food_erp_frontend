'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { Icon } from '@iconify/react';
import { useAppStore } from '@/lib/state/app-store';
import { useDashboardAppState } from '@/hooks/use-dashboard-api-data';
import type { AppState } from '@/lib/state/types';
import { useLocaleFormat } from '@/hooks/useLocaleFormat';
import { listSystemAuditLogRecords } from '@/lib/services/audit-log-service';
import { formatRelativeTime, getTopProducts } from '@/lib/services/dashboard-service';
import { InventoryItemThumb } from '@/components/shared/InventoryItemThumb';

function customerName(state: AppState, customerId: unknown) {
  const customers = Array.isArray(state.crmCustomers) ? state.crmCustomers : [];
  const match = customers.find((c) => String(c.id) === String(customerId));
  return match ? String(match.company || match.name) : 'Customer';
}

function moduleBadgeClass(module: string) {
  const m = module.toLowerCase();
  if (m.includes('sales')) return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
  if (m.includes('purchase')) return 'bg-blue-50 text-blue-600 border border-blue-100';
  if (m.includes('inventory')) return 'bg-orange-50 text-orange-600 border border-orange-100';
  return 'bg-slate-50 text-slate-600 border border-slate-100';
}

function moduleInitial(module: string) {
  return (module.trim()[0] ?? 'A').toUpperCase();
}

export function DashboardBottomPanels() {
  const appState = useDashboardAppState();
  const t = useAppStore((s) => s.t);
  const { formatNumber, formatMoney } = useLocaleFormat();

  const recentInvoices = useMemo(() => {
    const rows = Array.isArray(appState.invoices) ? [...appState.invoices] : [];
    return rows.slice(0, 5);
  }, [appState.invoices]);

  const topProducts = useMemo(() => getTopProducts(appState, 5), [appState]);

  const activityItems = useMemo(
    () => listSystemAuditLogRecords(appState).slice(0, 5),
    [appState],
  );

  return (
    <section className="grid grid-cols-1 lg:grid-cols-4 gap-1 items-stretch min-h-0" style={{ flex: '1.5 1 0%' }}>
      <div className="premium-card p-2.5 premium-shadow lg:col-span-2 flex flex-col">
        <div className="flex items-center justify-between mb-1.5 border-b border-slate-100 pb-1.5">
          <div className="flex items-center gap-2">
            <Icon icon="fluent-color:ribbon-24" width={22} height={22} className="shrink-0" />
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">{t('dashboard.top_products')}</h3>
          </div>
          <Link
            href="/inventory/products"
            className="text-[10px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
          >
            {t('dashboard.view_all')}
          </Link>
        </div>
        <div className="flex flex-col gap-1 flex-1 overflow-y-auto min-h-0 justify-between">
          {topProducts.length ? (
            topProducts.map((product, idx) => (
              <div key={`${product.name}-${idx}`} className="flex items-center justify-between text-xs min-h-[2rem] py-0.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-8 w-8 rounded-md bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                    <InventoryItemThumb
                      imageUrl={product.imageUrl}
                      alt={product.name}
                      className="h-8 w-8 rounded-md object-cover"
                      fallback={<Icon icon="fluent-color:box-24" width={16} height={16} />}
                    />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-slate-800 truncate">{product.name}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5 truncate">
                      {product.category || '—'} • {formatNumber(product.sold)} {t('common.sold').toLowerCase()}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end shrink-0 ml-2">
                  <span className="font-extrabold text-slate-950">{formatMoney(product.revenue)}</span>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded mt-0.5 bg-blue-50 text-blue-600">
                    #{idx + 1}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs font-medium text-slate-400 text-center py-2">{t('common.no_data')}</p>
          )}
        </div>
      </div>

      <div className="premium-card p-2.5 premium-shadow lg:col-span-1 flex flex-col">
        <div className="flex items-center justify-between mb-1.5 border-b border-slate-100 pb-1.5">
          <div className="flex items-center gap-2">
            <Icon icon="fluent-color:receipt-24" width={22} height={22} className="shrink-0" />
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">{t('dashboard.recent_invoices')}</h3>
          </div>
          <Link
            href="/sales/invoices"
            className="text-[10px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
          >
            {t('dashboard.view_all')}
          </Link>
        </div>
        <div className="flex flex-col gap-1 flex-1 overflow-y-auto min-h-0 justify-between">
          {recentInvoices.map((inv) => {
            const status = String(inv.status ?? 'pending').toLowerCase();
            const paid = status === 'paid';
            return (
              <div key={String(inv.id)} className="flex items-center justify-between text-xs min-h-[2rem] py-0.5">
                <div className="flex flex-col">
                  <span className="font-bold text-slate-800 hover:text-blue-600 cursor-pointer">
                    {String(inv.id)}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    {customerName(appState, inv.customerId)} • {String(inv.date ?? '')}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="font-extrabold text-slate-950">
                    {formatMoney(Number(inv.amount ?? 0), { decimals: 2 })}
                  </span>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded mt-0.5 ${paid ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}
                  >
                    {paid ? t('common.paid') : t('common.pending')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="premium-card p-2.5 premium-shadow flex flex-col">
        <div className="flex items-center justify-between mb-1.5 border-b border-slate-100 pb-1.5">
          <div className="flex items-center gap-2">
            <Icon icon="fluent-color:history-24" width={22} height={22} className="shrink-0" />
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">{t('dashboard.activity_feed')}</h3>
          </div>
          <Link
            href="/settings/audit-logs"
            className="text-[10px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
          >
            {t('dashboard.view_all')}
          </Link>
        </div>
        <div className="flex flex-col gap-1 flex-1 overflow-y-auto min-h-0 justify-between">
          {activityItems.length ? (
            activityItems.map((log) => (
              <div key={log.id} className="flex items-center gap-2 min-h-[2rem] py-0.5">
                <div
                  className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${moduleBadgeClass(log.module)}`}
                >
                  {moduleInitial(log.module)}
                </div>
                <div className="flex flex-col text-xs text-slate-600 leading-tight min-w-0">
                  <span className="truncate">
                    <span className="font-semibold text-slate-800">{log.actorName}</span> — {log.description}
                  </span>
                  <span className="text-[9px] text-slate-400 mt-0.5">{formatRelativeTime(log.timestamp)}</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs font-medium text-slate-400 text-center py-2">{t('common.no_data')}</p>
          )}
        </div>
      </div>
    </section>
  );
}
