'use client';

import { Icon } from '@iconify/react';
import { resolveKpiIcon } from '@/lib/ui/kpi-icons';

export interface KpiCardItem {
  key: string;
  label: string;
  value: string;
  sub?: string;
  alert?: boolean;
  icon?: React.ReactNode;
  iconify?: string;
}

export function KpiCards({ items }: { items: KpiCardItem[] }) {
  return (
    <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
      {items.map((item) => {
        const iconId = item.iconify ?? resolveKpiIcon(item.key, item.label);
        return (
          <div
            key={item.key}
            className="premium-card premium-shadow p-3.5 flex items-center justify-between gap-3 transition-all hover:border-slate-300 hover:shadow-md min-h-[72px]"
          >
            <div className="flex flex-col justify-center gap-0.5 min-w-0 flex-1">
              <span className="text-xs font-bold text-slate-500 tracking-wide leading-tight">{item.label}</span>
              <span className="text-lg font-extrabold tracking-tight text-slate-900 leading-tight mt-0.5">{item.value}</span>
              {item.alert ? (
                <span className="text-[11px] text-rose-600 font-bold block">Requires attention</span>
              ) : item.sub ? (
                <span className="text-[11px] text-slate-500 font-medium block truncate">{item.sub}</span>
              ) : null}
            </div>
            <div className="flex items-center justify-center shrink-0">
              {item.icon ?? <Icon icon={iconId} width={38} height={38} className="shrink-0" />}
            </div>
          </div>
        );
      })}
    </section>
  );
}
