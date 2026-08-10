'use client';

import { useEffect, useMemo } from 'react';
import { Icon, loadIcons } from '@iconify/react';
import { resolveKpiIconsForRow } from '@/lib/ui/kpi-icons';
import { getKpiGridClassName } from '@/lib/ui/kpi-grid';
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
}: {
  items: KpiCardItem[];
  gridClassName?: string;
  loading?: boolean;
}) {
  const { formatCount } = useLocaleFormat();
  const grid = gridClassName ?? getKpiGridClassName(items.length);
  const iconIds = useMemo(() => resolveKpiIconsForRow(items), [items]);

  useEffect(() => {
    const toLoad = iconIds.filter(Boolean);
    if (toLoad.length > 0) loadIcons(toLoad);
  }, [iconIds]);

  const displayValue = (value: string) => {
    const raw = String(value ?? '').trim();
    if (/^\d+$/.test(raw)) return formatCount(Number(raw));
    return value;
  };

  return (
    <section className={grid} aria-busy={loading || undefined}>
      {items.map((item, index) => {
        const iconId = iconIds[index];
        return (
          <div
            key={item.key}
            className="premium-card premium-shadow p-3.5 flex items-center justify-between gap-3 transition-[border-color,box-shadow] hover:border-slate-300 hover:shadow-md min-h-[72px]"
          >
            <div className="flex flex-col justify-center gap-0.5 min-w-0 flex-1">
              <span className="text-xs font-bold text-slate-500 tracking-wide leading-tight">{item.label}</span>
              <span className="text-lg font-extrabold tracking-tight text-slate-900 leading-tight mt-0.5 min-h-[1.75rem] flex items-center tabular-nums">
                {loading ? (
                  <span className="app-skeleton inline-block h-6 w-12 rounded" aria-hidden="true" />
                ) : (
                  displayValue(item.value)
                )}
              </span>
              {item.alert ? (
                <span className="text-[11px] text-rose-600 font-bold block">Requires attention</span>
              ) : item.sub ? (
                <span className="text-[11px] text-slate-500 font-medium block truncate">{item.sub}</span>
              ) : null}
            </div>
            <div className="kpi-card-icon-wrap shrink-0" aria-hidden={loading || undefined}>
              {item.icon ?? (
                <Icon
                  icon={iconId || 'flat-color-icons:statistics'}
                  width={38}
                  height={38}
                  className="kpi-card-icon shrink-0"
                />
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}
