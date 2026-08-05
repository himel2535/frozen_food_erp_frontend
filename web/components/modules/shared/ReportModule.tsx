'use client';

import { useMemo, useState } from 'react';
import { Footer } from '@/components/layout/Footer';
import { ListToolbar } from '@/components/shared/ListToolbar';
import { KpiCards, type KpiCardItem } from '@/components/shared/KpiCards';
import { AppTable } from '@/components/shared/AppTable';
import { DateDisplay } from '@/components/shared/DateDisplay';
import { DateInput } from '@/components/shared/DateInput';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { isLikelyDateColumnKey } from '@/lib/i18n/date-utils';
import { useAppStore } from '@/lib/state/app-store';
import type { AppState } from '@/lib/state/types';

export interface ReportColumn {
  key: string;
  label: string;
  align?: 'left' | 'right';
  render?: (row: Record<string, unknown>) => React.ReactNode;
}

export interface ReportFilter {
  key: string;
  label: string;
  type: 'select' | 'date';
  options?: { value: string; label: string }[];
}

export interface ReportModuleConfig {
  title: string;
  subtitle: string;
  searchKeys: string[];
  columns: ReportColumn[];
  filters?: ReportFilter[];
  statusFilterKey?: string;
  statusOptions?: { value: string; label: string }[];
  list: (state: AppState) => Record<string, unknown>[];
  kpi: (rows: Record<string, unknown>[]) => KpiCardItem[];
  dateRangeKeys?: { start: string; end: string };
}

export function ReportModule({ config }: { config: ReportModuleConfig }) {
  const appState = useAppStore((s) => s.appState);
  const [search, setSearch] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const rows = useMemo(() => {
    let data = config.list(appState);
    if (search) {
      const q = search.toLowerCase();
      data = data.filter((row) => config.searchKeys.some((k) => String(row[k] ?? '').toLowerCase().includes(q)));
    }
    config.filters?.forEach((f) => {
      if (f.type === 'select') {
        const val = filterValues[f.key] ?? 'All';
        if (val !== 'All') data = data.filter((row) => String(row[f.key] ?? '') === val);
      }
    });
    if (config.dateRangeKeys && dateStart) {
      data = data.filter((row) => String(row[config.dateRangeKeys!.start] ?? '') >= dateStart);
    }
    if (config.dateRangeKeys && dateEnd) {
      data = data.filter((row) => String(row[config.dateRangeKeys!.end] ?? '') <= dateEnd);
    }
    if (config.statusFilterKey && statusFilter !== 'All') {
      data = data.filter((row) => String(row[config.statusFilterKey!] ?? '') === statusFilter);
    }
    return data;
  }, [appState, config, search, filterValues, dateStart, dateEnd, statusFilter]);

  const kpis = useMemo(() => config.kpi(rows), [config, rows]);

  return (
    <>
      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={`Search ${config.title.toLowerCase()}...`}
        filters={
          <>
            {config.dateRangeKeys && (
              <>
                <DateInput
                  value={dateStart}
                  onChange={setDateStart}
                  aria-label="Start date"
                  className="bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl px-3 py-2 cursor-pointer"
                />
                <DateInput
                  value={dateEnd}
                  onChange={setDateEnd}
                  aria-label="End date"
                  className="bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl px-3 py-2 cursor-pointer"
                />
              </>
            )}
            {config.statusFilterKey && config.statusOptions && (
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl px-3 py-2 cursor-pointer">
                {config.statusOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            )}
            {config.filters?.map((f) => f.type === 'select' && (
              <select key={f.key} value={filterValues[f.key] ?? 'All'} onChange={(e) => setFilterValues({ ...filterValues, [f.key]: e.target.value })} className="bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl px-3 py-2 cursor-pointer">
                <option value="All">All {f.label}</option>
                {(f.options ?? []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            ))}
          </>
        }
      />
      {kpis.length > 0 && <KpiCards items={kpis} />}
      <AppTable
        columns={config.columns.map((col) => ({
          key: col.key,
          label: col.label,
          align: col.align === 'right' ? 'right' : 'left',
          render: (row) => {
            if (col.render) return col.render(row);
            if (col.key === 'status') return <StatusBadge status={String(row.status ?? '—')} />;
            if (isLikelyDateColumnKey(col.key)) {
              return <DateDisplay value={row[col.key] as string} variant="slash" />;
            }
            return String(row[col.key] ?? '—');
          },
        }))}
        rows={rows}
        rowKey={(row, i) => String(row.id ?? row.ref ?? row.sku ?? i)}
        emptyMessage="No records found matching filters."
      />
      <Footer />
    </>
  );
}
