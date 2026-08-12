'use client';

import { useLayoutEffect, useMemo } from 'react';
import { loadIcons } from '@iconify/react';
import { IconifyIcon } from '@/components/shared/IconifyIcon';
import { KpiCardSkeleton } from '@/components/shared/KpiCardSkeleton';
import { resolveKpiIconsForRow } from '@/lib/ui/kpi-icons';
import { resolveKpiGridClassName, resolveKpiSlotCount } from '@/lib/ui/module-kpi-layout';
import { useLocaleFormat } from '@/hooks/useLocaleFormat';

export interface KpiCardItem {
  key: string;
  label: string;
  value: string;
  sub?: string;
  alert?: boolean;
  icon?: React.ReactNode;
  iconify?: string;
}

export function KpiCards({
  items,
  gridClassName,
  loading = false,
  kpiCount,
}: {
  items: KpiCardItem[];
  gridClassName?: string;
  loading?: boolean;
  kpiCount?: number;
}) {
  const { formatCount } = useLocaleFormat();
  const slotCount = resolveKpiSlotCount(loading, items.length, kpiCount);
  const grid = resolveKpiGridClassName(slotCount, gridClassName);
  const iconIds = useMemo(() => resolveKpiIconsForRow(items), [items]);

  useLayoutEffect(() => {
    if (loading) return;
    const toLoad = iconIds.filter(Boolean);
    if (toLoad.length > 0) loadIcons(toLoad);
  }, [iconIds, loading]);

  const displayValue = (value: string) => {
    const raw = String(value ?? '').trim();
    if (/^\d+$/.test(raw)) return formatCount(Number(raw));
    return value;
  };

  if (loading) {
    return (
      <section className={grid} aria-busy="true">
        {Array.from({ length: slotCount }).map((_, index) => (
          <KpiCardSkeleton key={`boot-kpi-${index}`} />
        ))}
      </section>
    );
  }

  return (
    <section className={grid}>
      {items.map((item, index) => (
        <div
          key={item.key}
          className="premium-card premium-shadow p-3.5 flex items-center justify-between gap-3 transition-[border-color,box-shadow] hover:border-slate-300 hover:shadow-md min-h-[72px]"
        >
          <div className="flex flex-col justify-center gap-0.5 min-w-0 flex-1">
            <span className="text-xs font-bold text-slate-500 tracking-wide leading-tight">
              {item.label}
            </span>
            <span className="text-lg font-extrabold tracking-tight text-slate-900 leading-tight mt-0.5 min-h-[1.75rem] flex items-center tabular-nums">
              {displayValue(item.value)}
            </span>
            {item.alert ? (
              <span className="text-[11px] text-rose-600 font-bold block min-h-[1rem]">Requires attention</span>
            ) : item.sub ? (
              <span className="text-[11px] text-slate-500 font-medium block truncate min-h-[1rem]">{item.sub}</span>
            ) : (
              <span className="text-[11px] min-h-[1rem] block" aria-hidden />
            )}
          </div>
          <div className="kpi-card-icon-wrap shrink-0">
            {item.icon ?? (
              <IconifyIcon
                icon={iconIds[index] || 'flat-color-icons:statistics'}
                width={38}
                height={38}
                className="kpi-card-icon shrink-0"
                skeletonClassName="iconify-icon-skeleton--kpi"
              />
            )}
          </div>
        </div>
      ))}
    </section>
  );
}
