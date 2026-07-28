'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo } from 'react';
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
    badgeClass: 'bg-emerald-50 text-emerald-600',
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
    badgeClass: 'bg-orange-50 text-orange-600',
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

  return (
    <section className="grid grid-cols-1 lg:grid-cols-4 gap-2">
      <div className="premium-card p-4 premium-shadow lg:col-span-2 flex flex-col">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="dashboard-icon-wrap-sm">
              <Image src="/images/dashboard/icons/top-products.png" alt="" width={36} height={36} className="dashboard-icon-sm" unoptimized />
            </div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">{t('dashboard.top_products')}</h3>
          </div>
          <Link href="/inventory/products" className="text-[10px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer">
            {t('dashboard.view_all')}
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-medium text-slate-600">
            <thead>
              <tr className="text-[10px] uppercase font-bold text-slate-400/80 border-b border-slate-100">
                <th className="pb-2.5">{t('common.product')}</th>
                <th className="pb-2.5">{t('common.category')}</th>
                <th className="pb-2.5 text-center">{t('common.sold')}</th>
                <th className="pb-2.5 text-right">{t('common.revenue')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150">
              {TOP_PRODUCTS.map((row) => (
                <tr key={row.name} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <img src={row.image} className="h-7 w-7 rounded-md object-cover bg-slate-100 border border-slate-200" alt="" />
                      <span className="font-bold text-slate-950">{row.name}</span>
                    </div>
                  </td>
                  <td className="py-3">
                    <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-lg">{row.category}</span>
                  </td>
                  <td className="py-3 text-center font-bold text-slate-800">{row.sold}</td>
                  <td className="py-3 text-right font-extrabold text-slate-950">${row.revenue.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="premium-card p-4 premium-shadow lg:col-span-1 flex flex-col">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="dashboard-icon-wrap-sm">
              <Image src="/images/dashboard/icons/recent-invoices.png" alt="" width={36} height={36} className="dashboard-icon-sm" unoptimized />
            </div>
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
            <div className="dashboard-icon-wrap-sm">
              <Image src="/images/dashboard/icons/activity-feed.png" alt="" width={36} height={36} className="dashboard-icon-sm" unoptimized />
            </div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">{t('dashboard.activity_feed')}</h3>
          </div>
          <Link href="/settings/audit-logs" className="text-[10px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer">
            {t('dashboard.view_all')}
          </Link>
        </div>
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
          {ACTIVITY.map((item, idx) => (
            <div key={idx} className="flex gap-3">
              {item.type === 'avatar' ? (
                <img src={item.avatar} className="h-6 w-6 rounded-full object-cover shrink-0" alt="" />
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
