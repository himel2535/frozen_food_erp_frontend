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
    <div className="p-4 border-b border-slate-100 space-y-3">
      <div className="flex flex-wrap items-center gap-2 lg:gap-3">
        <div className="relative w-full sm:w-[240px] lg:w-[280px] shrink-0">
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
          className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium cursor-pointer"
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
          className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium cursor-pointer"
        >
          {PAYMENT_OPTIONS.map((opt) => (
            <option key={opt.id || 'all'} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <DateInput
          value={dateFrom}
          onChange={onDateFromChange}
          className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium cursor-pointer"
        />
        <DateInput
          value={dateTo}
          onChange={onDateToChange}
          className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium cursor-pointer"
        />
        <div className="flex flex-wrap items-center gap-1.5 min-w-0">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onStatusChange(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
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
