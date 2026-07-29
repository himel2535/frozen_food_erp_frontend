'use client';

import { Footer } from '@/components/layout/Footer';
import { FormHeader } from '@/components/layout/FormHeader';
import { KpiCards, type KpiCardItem } from '@/components/shared/KpiCards';
import { MODULE_FORM_SHELL, MODULE_LIST_SHELL } from '@/lib/ui/module-layout';

export const INPUT_CLS = 'w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/10';
export const SELECT_CLS = `${INPUT_CLS} cursor-pointer`;
export const BTN_PRIMARY = 'bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl cursor-pointer';
export const BTN_SECONDARY = 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-4 py-2.5 rounded-xl cursor-pointer';

export function InventoryListLayout({
  title,
  subtitle,
  addLabel,
  onAdd,
  kpis,
  filters,
  children,
  pagination,
}: {
  title: string;
  subtitle: string;
  addLabel: string;
  onAdd: () => void;
  kpis: KpiCardItem[];
  filters?: React.ReactNode;
  children: React.ReactNode;
  pagination?: React.ReactNode;
}) {
  return (
    <div className={MODULE_LIST_SHELL}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900">{title}</h1>
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        </div>
        <button type="button" onClick={onAdd} className={BTN_PRIMARY}>+ {addLabel}</button>
      </div>
      {kpis.length > 0 && <KpiCards items={kpis} />}
      {filters}
      {children}
      {pagination}
      <Footer />
    </div>
  );
}

export function InventoryFormLayout({
  title,
  subtitle,
  onBack,
  onSubmit,
  submitLabel,
  children,
}: {
  title: string;
  subtitle: string;
  onBack: () => void;
  onSubmit: (e: React.FormEvent) => void;
  submitLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className={MODULE_FORM_SHELL}>
      <div className="max-w-4xl mx-auto w-full space-y-6">
        <FormHeader title={title} subtitle={subtitle} onBack={onBack} />
        <form onSubmit={onSubmit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
          {children}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={onBack} className={BTN_SECONDARY}>Cancel</button>
            <button type="submit" className={BTN_PRIMARY}>{submitLabel}</button>
          </div>
        </form>
      </div>
      <Footer />
    </div>
  );
}

export function PaginationBar({
  page,
  pageSize,
  total,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (p: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  return (
    <div className="flex items-center justify-between text-xs text-slate-500">
      <span>Showing {start} to {end} of {total}</span>
      <div className="flex gap-2">
        <button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)} className="px-3 py-1.5 border border-slate-200 rounded-lg cursor-pointer disabled:opacity-50">Previous</button>
        <span className="px-2 py-1.5">Page {page} of {totalPages}</span>
        <button type="button" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} className="px-3 py-1.5 border border-slate-200 rounded-lg cursor-pointer disabled:opacity-50">Next</button>
      </div>
    </div>
  );
}

export function FilterBar({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-3 items-end bg-white p-4 rounded-xl border border-slate-200/80">{children}</div>;
}

export function FilterSelect({ label, value, onChange, children }: { label: string; value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <div className="text-xs font-semibold text-slate-700">
      <label className="block mb-1 text-slate-500">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={`${SELECT_CLS} min-w-[140px]`}>{children}</select>
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="flex-1 min-w-[200px] text-xs">
      <input type="search" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} className={`${INPUT_CLS} w-full`} />
    </div>
  );
}
