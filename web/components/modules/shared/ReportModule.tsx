'use client';

import { useMemo, useState } from 'react';
import { Footer } from '@/components/layout/Footer';
import { ListToolbar } from '@/components/shared/ListToolbar';
import { KpiCards, type KpiCardItem } from '@/components/shared/KpiCards';
import { StatusBadge } from '@/components/shared/StatusBadge';
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
    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 flex flex-col">
      <ListToolbar
        title={config.title}
        subtitle={config.subtitle}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={`Search ${config.title.toLowerCase()}...`}
        filters={
          <>
            {config.dateRangeKeys && (
              <>
                <input type="date" value={dateStart} onChange={(e) => setDateStart(e.target.value)} className="bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl px-3 py-2 cursor-pointer" />
                <input type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} className="bg-slate-50 border border-slate-200 text-xs font-semibold rounded-xl px-3 py-2 cursor-pointer" />
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
      <div className="bg-white rounded-xl border border-slate-200/80 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
            <tr>
              {config.columns.map((col) => (
                <th key={col.key} className={`px-4 py-3 ${col.align === 'right' ? 'text-right' : ''}`}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 ? (
              <tr><td colSpan={config.columns.length} className="px-4 py-8 text-center text-slate-400">No records found matching filters.</td></tr>
            ) : rows.map((row, i) => (
              <tr key={String(row.id ?? row.ref ?? row.sku ?? i)} className="hover:bg-slate-50/80">
                {config.columns.map((col) => (
                  <td key={col.key} className={`px-4 py-3 font-medium text-slate-700 ${col.align === 'right' ? 'text-right' : ''}`}>
                    {col.render?.(row) ?? (col.key === 'status' ? <StatusBadge status={String(row.status ?? '—')} /> : String(row[col.key] ?? '—'))}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Footer />
    </div>
  );
}
