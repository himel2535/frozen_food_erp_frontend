'use client';

import { Search } from 'lucide-react';
import { DateInput } from '@/components/shared/DateInput';
import { PO_PILL_ACTIVE, PO_PILL_INACTIVE } from './purchase-orders-styles';

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
    <div className="p-4 border-b border-slate-100">
      <div className="flex flex-wrap xl:flex-nowrap items-center gap-2 xl:gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-none xl:max-w-[280px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search PO ID, supplier, items..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
          />
        </div>
        <select
          value={supplierFilter}
          onChange={(e) => onSupplierChange(e.target.value)}
          className="shrink-0 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium cursor-pointer min-w-[130px]"
        >
          <option value="">All Suppliers</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          value={paymentFilter}
          onChange={(e) => onPaymentChange(e.target.value)}
          className="shrink-0 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium cursor-pointer min-w-[120px]"
        >
          {PAYMENT_OPTIONS.map((opt) => (
            <option key={opt.id || 'all'} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
        <DateInput
          value={dateFrom}
          onChange={onDateFromChange}
          className="shrink-0 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium cursor-pointer w-[130px]"
        />
        <DateInput
          value={dateTo}
          onChange={onDateToChange}
          className="shrink-0 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium cursor-pointer w-[130px]"
        />
        <div className="flex flex-wrap items-center gap-1.5 xl:ml-auto shrink-0">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onStatusChange(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors whitespace-nowrap ${
                statusFilter === tab.id ? PO_PILL_ACTIVE : PO_PILL_INACTIVE
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
