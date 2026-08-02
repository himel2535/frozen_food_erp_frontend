'use client';

import { toast } from '@/lib/ui/feedback';

import { FileText, BookOpen, History, StickyNote, MoreHorizontal, Building2 } from 'lucide-react';
import {
  formatDueDate,
  formatDueMoney,
  getPartyInitials,
  getSupplierStatusLabel,
  type SupplierPayable,
} from '@/lib/services/supplier-payables-service';
import {
  DUE_AVATAR_CLS,
  DUE_PANEL_CLS,
  DUE_TAB_ACTIVE,
  DUE_TAB_INACTIVE,
  SUPPLIER_DUE_BTN_PAY,
  SUPPLIER_DUE_STATUS_BADGE,
} from './supplier-due-styles';
import type { SupplierDueDetailTab } from './supplier-due-types';

const PANEL_SHELL = `${DUE_PANEL_CLS} min-h-[580px] h-full flex flex-col`;

function SummaryMini({ label, value, tone }: { label: string; value: string; tone?: 'red' | 'green' | 'default' }) {
  const valueCls = tone === 'red' ? 'text-rose-600' : tone === 'green' ? 'text-emerald-600' : 'text-slate-900';
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-sm font-extrabold ${valueCls}`}>{value}</p>
    </div>
  );
}

const DETAIL_TABS: { id: SupplierDueDetailTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'purchases', label: 'Purchases' },
  { id: 'payments', label: 'Payments' },
  { id: 'ledger', label: 'Ledger' },
  { id: 'notes', label: 'Notes' },
];

function BillList({
  bills,
  selectedBillIds,
  onToggleBill,
  onPay,
}: {
  bills: SupplierPayable['bills'];
  selectedBillIds: string[];
  onToggleBill: (entryId: string) => void;
  onPay: () => void;
}) {
  const openBills = bills.filter((bill) => bill.due > 0);
  if (!openBills.length) {
    return <p className="text-xs text-slate-500 py-4 text-center">No outstanding bills.</p>;
  }

  return (
    <div className="space-y-2 max-h-[240px] overflow-y-auto">
      {openBills.map((bill) => {
        const checked = selectedBillIds.includes(bill.entryId);
        return (
          <div key={bill.entryId} className="rounded-lg border border-slate-200 p-2.5 flex items-start gap-2">
            <input
              type="checkbox"
              checked={checked}
              onChange={() => onToggleBill(bill.entryId)}
              className="mt-1 h-4 w-4 rounded border-slate-300 cursor-pointer"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-sm text-slate-900">{bill.billId}</p>
                  <p className="text-[11px] text-slate-500">
                    {formatDueDate(bill.billDate)} · Due {formatDueDate(bill.dueDate)}
                  </p>
                </div>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold shrink-0 ${SUPPLIER_DUE_STATUS_BADGE[bill.status] ?? SUPPLIER_DUE_STATUS_BADGE.active}`}>
                  {bill.status === 'overdue' ? 'Overdue' : bill.status === 'due_today' ? 'Due Today' : 'Due Soon'}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-rose-600">{formatDueMoney(bill.due)} due</span>
                <button type="button" className={SUPPLIER_DUE_BTN_PAY} onClick={onPay}>
                  Pay
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PanelFooter({
  disabled,
  onPay,
}: {
  disabled?: boolean;
  onPay?: () => void;
}) {
  return (
    <div className="space-y-2 pt-2 border-t border-slate-100 mt-auto">
      <button
        type="button"
        disabled={disabled}
        className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-sm font-bold py-2.5 cursor-pointer"
        onClick={disabled ? undefined : onPay}
      >
        Make Payment
      </button>
      <div className="flex items-center justify-center gap-2">
        {[
          { icon: BookOpen, label: 'View Ledger' },
          { icon: History, label: 'Payment History' },
          { icon: StickyNote, label: 'Add Note' },
          { icon: MoreHorizontal, label: 'More' },
        ].map(({ icon: Icon, label }) => (
          <button
            key={label}
            type="button"
            title={label}
            disabled={disabled}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            onClick={disabled ? undefined : () => toast.info('Feature coming soon', { module: 'Supplier Due', description: "${label} coming soon." })}
          >
            <Icon className="w-4 h-4" />
          </button>
        ))}
      </div>
    </div>
  );
}

export function SupplierDueDetailPanel({
  supplier,
  detailTab,
  onDetailTabChange,
  selectedBillIds,
  onToggleBill,
  onPay,
}: {
  supplier: SupplierPayable | null;
  detailTab: SupplierDueDetailTab;
  onDetailTabChange: (tab: SupplierDueDetailTab) => void;
  selectedBillIds: string[];
  onToggleBill: (entryId: string) => void;
  onPay: (supplier: SupplierPayable, billIds?: string[]) => void;
}) {
  if (!supplier) {
    return (
      <aside className={PANEL_SHELL}>
        <div className="flex flex-col items-center justify-center text-center py-8 flex-1">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3">
            <Building2 className="w-7 h-7" />
          </span>
          <h3 className="font-extrabold text-slate-900">Select a supplier</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-[240px]">
            Click a row in the table to view outstanding bills and payment actions.
          </p>
        </div>
        <div className="flex border-b border-slate-200 overflow-x-auto opacity-50 pointer-events-none">
          {DETAIL_TABS.map((tab) => (
            <button key={tab.id} type="button" className={`flex-1 pb-2 text-[11px] whitespace-nowrap px-1 ${DUE_TAB_INACTIVE}`}>
              {tab.label}
            </button>
          ))}
        </div>
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-6 text-center flex-1">
          <p className="text-xs text-slate-400">Supplier details will appear here</p>
        </div>
        <PanelFooter disabled />
      </aside>
    );
  }

  const overdueAmount = supplier.bills
    .filter((bill) => bill.due > 0 && bill.status === 'overdue')
    .reduce((sum, bill) => sum + bill.due, 0);

  return (
    <aside className={PANEL_SHELL}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className={`${DUE_AVATAR_CLS} h-11 w-11 text-sm`}>{getPartyInitials(supplier.name)}</span>
          <div className="min-w-0">
            <h3 className="font-extrabold text-slate-900 truncate">{supplier.name}</h3>
            <p className="text-[11px] text-slate-400">{supplier.phone}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-3 text-center">
        <p className="text-[10px] font-bold uppercase tracking-wide text-rose-500">Outstanding</p>
        <p className="text-2xl font-extrabold text-rose-600 mt-0.5">{formatDueMoney(supplier.totalDue)}</p>
        <span className={`inline-flex mt-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${SUPPLIER_DUE_STATUS_BADGE[supplier.status] ?? SUPPLIER_DUE_STATUS_BADGE.active}`}>
          {getSupplierStatusLabel(supplier.status)}
        </span>
      </div>

      <div className="flex border-b border-slate-200 overflow-x-auto">
        {DETAIL_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`flex-1 pb-2 text-[11px] whitespace-nowrap px-1 ${detailTab === tab.id ? DUE_TAB_ACTIVE : DUE_TAB_INACTIVE}`}
            onClick={() => onDetailTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {(detailTab === 'overview' || detailTab === 'purchases') && (
          <div className="space-y-3">
            {detailTab === 'overview' && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <SummaryMini label="Total Due" value={formatDueMoney(supplier.totalDue)} tone="red" />
                  <SummaryMini label="Overdue" value={formatDueMoney(overdueAmount)} tone="red" />
                  <SummaryMini label="Total Purchase" value={formatDueMoney(supplier.totalPurchase)} />
                  <SummaryMini label="Last Payment" value={supplier.lastPaymentAmount > 0 ? formatDueMoney(supplier.lastPaymentAmount) : '—'} tone="green" />
                  <SummaryMini label="Credit Limit" value={formatDueMoney(supplier.creditLimit)} />
                  <SummaryMini label="Available Credit" value={formatDueMoney(supplier.availableCredit)} tone="green" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-700 mb-2">Outstanding Purchases / Bills</h4>
                  <BillList
                    bills={supplier.bills}
                    selectedBillIds={selectedBillIds}
                    onToggleBill={onToggleBill}
                    onPay={() => onPay(supplier, selectedBillIds.length ? selectedBillIds : undefined)}
                  />
                </div>
                <div className="rounded-lg border border-slate-200 p-3 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Next Payment Due</p>
                    <p className="font-bold text-rose-600 mt-1">{supplier.nextPaymentDue ? formatDueDate(supplier.nextPaymentDue) : '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Preferred Method</p>
                    <p className="font-semibold text-slate-700 mt-1 flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" />
                      {supplier.preferredMethod}
                    </p>
                  </div>
                </div>
              </>
            )}
            {detailTab === 'purchases' && (
              <BillList
                bills={supplier.bills}
                selectedBillIds={selectedBillIds}
                onToggleBill={onToggleBill}
                onPay={() => onPay(supplier, selectedBillIds.length ? selectedBillIds : undefined)}
              />
            )}
          </div>
        )}

        {detailTab === 'payments' && (
          <p className="text-xs text-slate-500 py-6 text-center">No payment history yet.</p>
        )}
        {detailTab === 'ledger' && (
          <p className="text-xs text-slate-500 py-6 text-center">No ledger entries yet.</p>
        )}
        {detailTab === 'notes' && (
          <p className="text-xs text-slate-500 py-6 text-center">No notes yet.</p>
        )}
      </div>

      <PanelFooter onPay={() => onPay(supplier, selectedBillIds.length ? selectedBillIds : undefined)} />
    </aside>
  );
}
