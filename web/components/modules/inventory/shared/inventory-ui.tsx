'use client';

import type { FormEvent, ReactNode } from 'react';
import { Footer } from '@/components/layout/Footer';
import { AppFormModal } from '@/components/shared/AppForm';
import { KpiCards, type KpiCardItem } from '@/components/shared/KpiCards';
import { MODULE_LIST_SHELL } from '@/lib/ui/module-layout';
import {
  FORM_BTN_PRIMARY,
  FORM_BTN_SECONDARY,
  FORM_INPUT_CLS,
  FORM_SELECT_CLS,
} from '@/lib/ui/form-styles';

export const INPUT_CLS = FORM_INPUT_CLS;
export const SELECT_CLS = FORM_SELECT_CLS;
export const BTN_PRIMARY = FORM_BTN_PRIMARY;
export const BTN_SECONDARY = FORM_BTN_SECONDARY;

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
  open,
  title,
  subtitle,
  onClose,
  onSubmit,
  submitLabel,
  children,
  size = 'md',
}: {
  open: boolean;
  title: string;
  subtitle: string;
  onClose: () => void;
  onSubmit: (e: FormEvent) => void;
  submitLabel: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}) {
  return (
    <AppFormModal
      open={open}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      onSubmit={onSubmit}
      submitLabel={submitLabel}
      size={size}
    >
      {children}
    </AppFormModal>
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
