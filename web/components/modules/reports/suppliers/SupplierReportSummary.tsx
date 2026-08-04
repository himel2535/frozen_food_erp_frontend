'use client';

import { useMemo } from 'react';
import { Icon } from '@iconify/react';
import { useAppStore } from '@/lib/state/app-store';
import type { KpiCardItem } from '@/components/shared/KpiCards';
import { resolveKpiIconsForRow } from '@/lib/ui/kpi-icons';
import { SR_CARD } from '@/components/modules/reports/suppliers/supplier-report-styles';

export function SupplierReportSummary({ items }: { items: KpiCardItem[] }) {
  const t = useAppStore((s) => s.t);
  const iconIds = useMemo(() => resolveKpiIconsForRow(items), [items]);

  return (
    <section className="space-y-2">
      <h3 className="text-sm font-extrabold text-slate-900 tracking-tight px-1">{t('reports.suppliers_sidebar_summary')}</h3>
      <div className={`${SR_CARD} space-y-3`}>
        {items.map((item, index) => {
          const iconId = iconIds[index];
          return (
            <div key={item.key} className="flex items-center justify-between gap-3 py-1 border-b border-slate-100 last:border-0">
              <span className="inline-flex items-center gap-2 min-w-0">
                {iconId ? <Icon icon={iconId} width={28} height={28} className="shrink-0" /> : null}
                <span className="text-[11px] font-bold text-slate-500 leading-tight">{item.label}</span>
              </span>
              <span className="text-sm font-extrabold text-slate-900 tabular-nums shrink-0">{item.value}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
