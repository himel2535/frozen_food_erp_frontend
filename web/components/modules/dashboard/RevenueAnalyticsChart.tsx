'use client';

import Image from 'next/image';
import { useAppStore } from '@/lib/state/app-store';

const BARS = [
  { height: '38%', label: '$340K' },
  { height: '48%', label: '$420K' },
  { height: '42%', label: '$390K' },
  { height: '60%', label: '$520K' },
  { height: '82%', label: '$820,650', active: true },
  { height: '54%', label: '$480K' },
  { height: '65%', label: '$590K' },
  { height: '52%', label: '$470K' },
  { height: '70%', label: '$620K' },
  { height: '72%', label: '$680K' },
];

const MONTHS = ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];

export function RevenueAnalyticsChart() {
  const t = useAppStore((s) => s.t);

  return (
    <div className="premium-card p-4 premium-shadow lg:col-span-1 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="dashboard-icon-wrap-sm">
            <Image src="/images/dashboard/icons/revenue-analytics.png" alt="" width={36} height={36} className="dashboard-icon-sm" unoptimized />
          </div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">{t('dashboard.revenue_analytics')}</h3>
        </div>
        <select className="bg-slate-50 border border-slate-200 text-[10px] font-semibold text-slate-600 rounded-lg px-2.5 py-1 cursor-pointer">
          <option>{t('dashboard.this_year')}</option>
          <option>{t('dashboard.last_3_years')}</option>
        </select>
      </div>
      <div className="h-56 flex items-end justify-between gap-1.5 relative pt-4 pb-6">
        {BARS.map((bar, idx) => (
          <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
            <div
              className={`${bar.active ? 'bg-blue-600/20 group-hover:bg-blue-600' : 'bg-blue-600/10 group-hover:bg-blue-600'} w-full rounded-md transition-all cursor-pointer relative`}
              style={{ height: bar.height }}
            >
              <span
                className={`${bar.active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] font-bold py-1 px-1.5 rounded whitespace-nowrap z-40 transition-opacity`}
              >
                {bar.label}
              </span>
            </div>
          </div>
        ))}
        <div className="absolute bottom-0 left-0 w-full flex justify-between text-[9px] font-bold text-slate-400/80 pt-2 border-t border-slate-100">
          {MONTHS.map((m) => (
            <span key={m}>{m}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
