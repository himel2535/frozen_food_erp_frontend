'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useAppStore } from '@/lib/state/app-store';

const NOTIFICATIONS: { icon: string; titleKey: string; meta: string }[] = [
  {
    icon: '/images/dashboard/icons/notif-sales-order.png',
    titleKey: 'dashboard.notif_new_sale',
    meta: 'SO-2025-00125 • 2 mins ago',
  },
  {
    icon: '/images/dashboard/icons/notif-payment.png',
    titleKey: 'dashboard.notif_payment',
    meta: '$2,450.00 • 15 mins ago',
  },
  {
    icon: '/images/dashboard/icons/notif-low-stock.png',
    titleKey: 'dashboard.notif_low_stock',
    meta: 'Super Hero Action Figure • 1 hour ago',
  },
];

export function DashboardNotifications() {
  const t = useAppStore((s) => s.t);

  return (
    <div className="premium-card p-4 premium-shadow flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
        <div className="flex items-center gap-2">
          <div className="dashboard-icon-wrap-sm">
            <Image src="/images/dashboard/icons/notifications.png" alt="" width={36} height={36} className="dashboard-icon-sm" unoptimized />
          </div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">{t('dashboard.notifications')}</h3>
        </div>
        <Link href="/notifications" className="text-[10px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer">
          {t('dashboard.view_all')}
        </Link>
      </div>
      <div className="flex-1 flex flex-col gap-3.5 overflow-y-auto">
        {NOTIFICATIONS.map((item) => (
          <div key={item.titleKey} className="flex gap-3">
            <div className="dashboard-icon-wrap-sm mt-0.5">
              <Image src={item.icon} alt="" width={36} height={36} className="dashboard-icon-sm" unoptimized />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-slate-800">{t(item.titleKey)}</span>
              <span className="text-[10px] text-slate-400 mt-0.5">{item.meta}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
