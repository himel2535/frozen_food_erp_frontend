'use client';

import { DateInput } from '@/components/shared/DateInput';
import { ModuleFilterBar } from '@/components/shared/ModuleFilterBar';
import { PO_PILL_ACTIVE, PO_PILL_INACTIVE } from './purchase-orders-styles';
import { MODULE_FILTER_INPUT } from '@/lib/ui/module-chrome-styles';

const STATUS_TABS = [
  { id: 'all', label: 'All' },
  { id: 'draft', label: 'Draft' },
  { id: 'sent', label: 'Sent' },
  { id: 'received', label: 'Received' },
] as const;

const PAYMENT_OPTIONS = [
  { id: '', label: 'All Payments' },
  { id: 'unpaid', label: 'Unpaid' },
  { id: 'partial', label: 'Partial' },
  { id: 'paid', label: 'Paid' },
] as const;

export function PurchaseOrdersFilterBar({
  search,
  statusFilter,
  supplierFilter,
  paymentFilter,
  dateFrom,
  dateTo,
  suppliers,
  onSearchChange,
  onStatusChange,
  onSupplierChange,
  onPaymentChange,
  onDateFromChange,
  onDateToChange,
}: {
  search: string;
  statusFilter: string;
  supplierFilter: string;
  paymentFilter: string;
  dateFrom: string;
  dateTo: string;
  suppliers: { id: string; name: string }[];
  onSearchChange: (v: string) => void;
  onStatusChange: (v: string) => void;
  onSupplierChange: (v: string) => void;
  onPaymentChange: (v: string) => void;
  onDateFromChange: (v: string) => void;
  onDateToChange: (v: string) => void;
}) {
  return (
    <ModuleFilterBar
      search={search}
      onSearchChange={onSearchChange}
      searchPlaceholder="Search PO ID, supplier, items..."
      filters={
        <>
          <select value={supplierFilter} onChange={(e) => onSupplierChange(e.target.value)} className={`${MODULE_FILTER_INPUT} min-w-[130px]`}>
            <option value="">All Suppliers</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <select value={paymentFilter} onChange={(e) => onPaymentChange(e.target.value)} className={`${MODULE_FILTER_INPUT} min-w-[120px]`}>
            {PAYMENT_OPTIONS.map((opt) => (
              <option key={opt.id || 'all'} value={opt.id}>{opt.label}</option>
            ))}
          </select>
          <DateInput value={dateFrom} onChange={onDateFromChange} className={`${MODULE_FILTER_INPUT} w-[130px]`} aria-label="From date" />
          <DateInput value={dateTo} onChange={onDateToChange} className={`${MODULE_FILTER_INPUT} w-[130px]`} aria-label="To date" />
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onStatusChange(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
                statusFilter === tab.id ? PO_PILL_ACTIVE : PO_PILL_INACTIVE
              }`}
            >
              {tab.label}
            </button>
          ))}
        </>
      }
    />
  );
}
