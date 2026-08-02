'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo } from 'react';
import { Icon } from '@iconify/react';
import { AppTable, type AppTableColumn } from '@/components/shared/AppTable';
import { useAppStore } from '@/lib/state/app-store';
import type { AppState } from '@/lib/state/types';

const TOP_PRODUCTS = [
  {
    name: 'Super Hero Action Figure',
    image: 'https://images.unsplash.com/photo-1588449668365-d15e397f6787?auto=format&fit=crop&q=80&w=50',
    category: 'Action Figures',
    sold: 312,
    revenue: 78000,
  },
  {
    name: 'Action Figure Arms',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=50',
    category: 'Parts & WIP',
    sold: 89,
    revenue: 178000,
  },
  {
    name: 'Red Dye Colorant',
    image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&q=80&w=50',
    category: 'Colorants',
    sold: 245,
    revenue: 367500,
  },
];

const ACTIVITY = [
  {
    type: 'avatar' as const,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100',
    text: (
      <>
        <span className="font-bold text-slate-800">John Doe</span> created invoice{' '}
        <span className="font-bold text-blue-600">INV-2025-00145</span>
      </>
    ),
    time: '2 minutes ago',
  },
  {
    type: 'badge' as const,
    badge: 'P',
    badgeClass: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
    text: (
      <>
        Payment received from <span className="font-bold text-slate-800">Acme Corp</span> ($2,450)
      </>
    ),
    time: '15 minutes ago',
  },
  {
    type: 'badge' as const,
    badge: 'S',
    badgeClass: 'bg-orange-50 text-orange-600 border border-orange-100',
    text: (
      <>
        Stock updated for <span className="font-bold text-slate-800">Super Hero Action Figure</span> by Mike
      </>
    ),
    time: '1 hour ago',
  },
];

function customerName(state: AppState, customerId: unknown) {
  const customers = Array.isArray(state.crmCustomers) ? state.crmCustomers : [];
  const match = customers.find((c) => String(c.id) === String(customerId));
  return match ? String(match.company || match.name) : 'Customer';
}

export function DashboardBottomPanels() {
  const appState = useAppStore((s) => s.appState);
  const t = useAppStore((s) => s.t);

  const recentInvoices = useMemo(() => {
    const rows = Array.isArray(appState.invoices) ? [...appState.invoices] : [];
    return rows.slice(0, 3);
  }, [appState.invoices]);

  const topProductColumns = useMemo<AppTableColumn<(typeof TOP_PRODUCTS)[number]>[]>(() => [
    {
      key: 'name',
      label: t('common.product'),
      render: (row) => (
        <div className="flex items-center gap-3">
          <Image
            src={row.image}
            alt=""
            width={28}
            height={28}
            className="h-7 w-7 rounded-md object-cover bg-slate-100 border border-slate-200"
            loading="lazy"
          />
          <span className="font-bold text-slate-950">{row.name}</span>
        </div>
      ),
    },
    {
      key: 'category',
      label: t('common.category'),
      render: (row) => (
        <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-lg">{row.category}</span>
      ),
    },
    {
      key: 'sold',
      label: t('common.sold'),
      render: (row) => <span className="font-bold text-slate-800">{row.sold}</span>,
    },
    {
      key: 'revenue',
      label: t('common.revenue'),
      render: (row) => (
        <span className="font-extrabold text-slate-950">${row.revenue.toLocaleString()}</span>
      ),
    },
  ], [t]);

  return (
    <section className="grid grid-cols-1 lg:grid-cols-4 gap-2">
      <div className="premium-card p-4 premium-shadow lg:col-span-2 flex flex-col">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Icon icon="fluent-color:ribbon-24" width={22} height={22} className="shrink-0" />
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">{t('dashboard.top_products')}</h3>
          </div>
          <Link href="/inventory/products" className="text-[10px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer">
            {t('dashboard.view_all')}
          </Link>
        </div>
        <AppTable
          className="app-table--embedded"
          columns={topProductColumns}
          rows={TOP_PRODUCTS}
          rowKey={(row) => row.name}
        />
      </div>

      <div className="premium-card p-4 premium-shadow lg:col-span-1 flex flex-col">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Icon icon="fluent-color:receipt-24" width={22} height={22} className="shrink-0" />
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">{t('dashboard.recent_invoices')}</h3>
          </div>
          <Link href="/sales/invoices" className="text-[10px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer">
            {t('dashboard.view_all')}
          </Link>
        </div>
        <div className="flex-1 flex flex-col gap-3.5 overflow-y-auto">
          {recentInvoices.map((inv) => {
            const status = String(inv.status ?? 'pending').toLowerCase();
            const paid = status === 'paid';
            return (
              <div key={String(inv.id)} className="flex items-center justify-between text-xs">
                <div className="flex flex-col">
                  <span className="font-bold text-slate-800 hover:text-blue-600 cursor-pointer">{String(inv.id)}</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    {customerName(appState, inv.customerId)} • {String(inv.date ?? '')}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="font-extrabold text-slate-950">${Number(inv.amount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded mt-0.5 ${paid ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                    {paid ? t('common.paid') : t('common.pending')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="premium-card p-4 premium-shadow flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Icon icon="fluent-color:history-24" width={22} height={22} className="shrink-0" />
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">{t('dashboard.activity_feed')}</h3>
          </div>
          <Link href="/settings/audit-logs" className="text-[10px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer">
            {t('dashboard.view_all')}
          </Link>
        </div>
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
          {ACTIVITY.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3">
              {item.type === 'avatar' ? (
                <Image
                  src={item.avatar!}
                  alt=""
                  width={24}
                  height={24}
                  className="h-6 w-6 rounded-full object-cover shrink-0"
                  loading="lazy"
                />
              ) : (
                <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${item.badgeClass}`}>
                  {item.badge}
                </div>
              )}
              <div className="flex flex-col text-xs text-slate-600 leading-tight">
                <span>{item.text}</span>
                <span className="text-[9px] text-slate-400 mt-0.5">{item.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
