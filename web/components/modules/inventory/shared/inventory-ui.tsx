'use client';

import type { FormEvent, ReactNode } from 'react';
import { Footer } from '@/components/layout/Footer';
import { useRegisterModuleActions } from '@/components/layout/ModuleActionsContext';
import { useInventoryEditAccess } from '@/hooks/use-inventory-edit-access';
import { AppFormModal } from '@/components/shared/AppForm';
import { ModuleKpiSection } from '@/components/shared/ModuleKpiSection';
import type { KpiCardItem } from '@/components/shared/KpiCards';
import { shouldShowModuleKpis } from '@/lib/ui/kpi-loading';
import { ModuleFilterBar } from '@/components/shared/ModuleFilterBar';
import { MODULE_FILTER_ACTION_BTN, MODULE_FILTER_INPUT } from '@/lib/ui/module-chrome-styles';
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

export function InventoryEditActions({
  canEdit,
  children,
}: {
  canEdit: boolean;
  children: ReactNode;
}) {
  if (!canEdit) return null;
  return <>{children}</>;
}

export function InventoryListLayout({
  title,
  subtitle,
  addLabel,
  onAdd,
  canEdit: canEditProp,
  kpis,
  kpiGridClassName,
  kpiCount,
  bootLoading = false,
  filters,
  children,
  pagination,
}: {
  title: string;
  subtitle: string;
  addLabel: string;
  onAdd: () => void;
  canEdit?: boolean;
  kpis: KpiCardItem[];
  kpiGridClassName?: string;
  kpiCount?: number;
  bootLoading?: boolean;
  filters?: React.ReactNode;
  children: React.ReactNode;
  pagination?: React.ReactNode;
}) {
  const { canEdit: canEditFromHook } = useInventoryEditAccess();
  const canEdit = canEditProp ?? canEditFromHook;

  useRegisterModuleActions(
    canEdit ? (
      <button type="button" onClick={onAdd} className={BTN_PRIMARY}>+ {addLabel}</button>
    ) : null,
    [onAdd, addLabel, canEdit],
  );

  return (
    <>
      {shouldShowModuleKpis(bootLoading, kpis.length) && (
        <ModuleKpiSection
          items={kpis}
          gridClassName={kpiGridClassName}
          kpiCount={kpiCount ?? kpis.length}
          loading={bootLoading}
        />
      )}
      {filters}
      {children}
      {pagination}
      <Footer />
    </>
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

export function FilterBar({
  search,
  onSearchChange,
  searchPlaceholder,
  children,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  searchPlaceholder: string;
  children: React.ReactNode;
}) {
  return (
    <ModuleFilterBar
      search={search}
      onSearchChange={onSearchChange}
      searchPlaceholder={searchPlaceholder}
      filters={children}
    />
  );
}

export function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      aria-label={label}
      title={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`${MODULE_FILTER_INPUT} min-w-[120px] shrink-0`}
    >
      {children}
    </select>
  );
}

/** @deprecated Use FilterBar search props instead. */
export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <input
      type="search"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`${MODULE_FILTER_INPUT} min-w-[160px] shrink-0`}
    />
  );
}

export function FilterResetButton({ onClick, label = 'Reset' }: { onClick: () => void; label?: string }) {
  return (
    <button type="button" onClick={onClick} className={`${MODULE_FILTER_ACTION_BTN} shrink-0`}>
      {label}
    </button>
  );
}
