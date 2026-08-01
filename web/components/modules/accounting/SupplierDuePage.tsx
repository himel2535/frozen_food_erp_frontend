'use client';

import { useMemo, useState } from 'react';
import { Plus, CreditCard } from 'lucide-react';
import { Footer } from '@/components/layout/Footer';
import { AppFormFields, AppFormModal } from '@/components/shared/AppForm';
import { MODULE_LIST_SHELL } from '@/lib/ui/module-layout';
import { useAppStore } from '@/lib/state/app-store';
import type { PortField } from '@/lib/modules/port-types';
import { listSuppliers } from '@/lib/services/purchases-service';
import {
  createSupplierPayable,
  filterSupplierPayables,
  getSupplierPayableDetail,
  getSupplierPayableMetrics,
  listSupplierPayables,
  makeSupplierPayment,
  type SupplierPayable,
} from '@/lib/services/supplier-payables-service';
import { SupplierDueMetrics } from './supplier-due/SupplierDueMetrics';
import { SupplierDueFilterBar } from './supplier-due/SupplierDueFilterBar';
import { SupplierDueTable } from './supplier-due/SupplierDueTable';
import { SupplierDueDetailPanel } from './supplier-due/SupplierDueDetailPanel';
import { MAKE_PAYMENT_FIELDS } from './supplier-due/supplier-due-options';
import type { SupplierDueDetailTab } from './supplier-due/supplier-due-types';

const PAGE_SIZE = 8;

const PAYMENT_FORM_FIELDS: PortField[] = MAKE_PAYMENT_FIELDS.map((f) => ({ ...f }));

function supplierOptionLabel(name: string) {
  return name;
}

export function SupplierDuePage() {
  const appState = useAppStore((s) => s.appState);
  const saveAppState = useAppStore((s) => s.saveAppState);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all_due');
  const [page, setPage] = useState(1);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<SupplierDueDetailTab>('overview');
  const [selectedBillIds, setSelectedBillIds] = useState<string[]>([]);

  const [showAddPayableModal, setShowAddPayableModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentTarget, setPaymentTarget] = useState<SupplierPayable | null>(null);
  const [paymentBillIds, setPaymentBillIds] = useState<string[] | undefined>(undefined);
  const [showAdvancedAdd, setShowAdvancedAdd] = useState(false);
  const [showAdvancedPay, setShowAdvancedPay] = useState(false);

  const [addPayableForm, setAddPayableForm] = useState({
    supplier: '', amount: '', dueDate: new Date().toISOString().slice(0, 10), notes: '',
  });
  const [paymentForm, setPaymentForm] = useState({
    amount: '', date: new Date().toISOString().slice(0, 10), method: 'Bank Transfer', reference: '',
  });

  const suppliers = useMemo(() => listSuppliers(appState), [appState]);
  const supplierIdByLabel = useMemo(() => {
    const map: Record<string, string> = {};
    suppliers.forEach((supplier) => {
      map[supplierOptionLabel(String(supplier.name))] = String(supplier.id);
    });
    return map;
  }, [suppliers]);

  const addPayableFields = useMemo<PortField[]>(() => [
    {
      key: 'supplier',
      label: 'Supplier',
      type: 'select',
      required: true,
      placeholder: 'Select supplier…',
      options: suppliers.map((supplier) => supplierOptionLabel(String(supplier.name))),
    },
    { key: 'amount', label: 'Amount Due', type: 'number', required: true },
    { key: 'dueDate', label: 'Due Date', type: 'date', required: true },
    { key: 'notes', label: 'Notes', type: 'textarea', advanced: true },
  ], [suppliers]);

  const allSuppliers = useMemo(() => listSupplierPayables(appState), [appState]);
  const metrics = useMemo(() => getSupplierPayableMetrics(appState), [appState]);

  const filteredRows = useMemo(
    () => filterSupplierPayables(allSuppliers, { search, status: statusFilter }),
    [allSuppliers, search, statusFilter],
  );

  const selectedSupplier = useMemo(
    () => (selectedSupplierId ? getSupplierPayableDetail(appState, selectedSupplierId) : null),
    [appState, selectedSupplierId],
  );

  const computePaymentAmount = (supplier: SupplierPayable, billIds?: string[]) => {
    const openBills = supplier.bills.filter((bill) => bill.due > 0);
    const targetBills = billIds?.length
      ? openBills.filter((bill) => billIds.includes(bill.entryId))
      : openBills;
    return targetBills.reduce((sum, bill) => sum + bill.due, 0);
  };

  const openPay = (supplier: SupplierPayable, billIds?: string[]) => {
    setPaymentTarget(supplier);
    setPaymentBillIds(billIds);
    setPaymentForm({
      amount: String(computePaymentAmount(supplier, billIds)),
      date: new Date().toISOString().slice(0, 10),
      method: 'Bank Transfer',
      reference: '',
    });
    setShowPaymentModal(true);
  };

  const handleToggleBill = (entryId: string) => {
    setSelectedBillIds((prev) => (
      prev.includes(entryId) ? prev.filter((id) => id !== entryId) : [...prev, entryId]
    ));
  };

  const handleAddPayableSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addPayableForm.supplier || !addPayableForm.amount || !addPayableForm.dueDate) return;
    const supplierId = supplierIdByLabel[addPayableForm.supplier] ?? addPayableForm.supplier;
    const result = createSupplierPayable(appState, { ...addPayableForm, supplier: supplierId });
    if (!result.ok) {
      window.alert('error' in result ? result.error : 'Failed to save payable');
      return;
    }
    saveAppState();
    setShowAddPayableModal(false);
    setAddPayableForm({ supplier: '', amount: '', dueDate: new Date().toISOString().slice(0, 10), notes: '' });
    if (result.id) {
      setSelectedSupplierId(result.id);
      setSelectedBillIds([]);
    }
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentTarget || !paymentForm.amount) return;
    const result = makeSupplierPayment(
      appState,
      paymentTarget.supplierId,
      Number(paymentForm.amount),
      paymentForm.date,
      paymentForm.method,
      paymentBillIds,
    );
    if (!result.ok) {
      window.alert(result.error ?? 'Failed to record payment');
      return;
    }
    saveAppState();
    setShowPaymentModal(false);
    setPaymentTarget(null);
    setPaymentBillIds(undefined);
    setSelectedBillIds([]);
  };

  return (
    <>
      <div className={MODULE_LIST_SHELL}>
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Supplier Due</h2>
            <p className="text-xs text-slate-500 mt-1 font-medium">Track and manage outstanding payments to your suppliers.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 self-start xl:self-auto">
            <button
              type="button"
              onClick={() => setShowAddPayableModal(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Payable
            </button>
            <button
              type="button"
              onClick={() => {
                const target = selectedSupplier ?? allSuppliers.find((s) => s.totalDue > 0);
                if (target) {
                  openPay(target, selectedBillIds.length ? selectedBillIds : undefined);
                } else {
                  window.alert('Select a supplier with outstanding due first.');
                }
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              Make Payment
            </button>
          </div>
        </div>

        <SupplierDueMetrics metrics={metrics} />

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-3 items-stretch">
          <div className="premium-card premium-shadow overflow-hidden min-w-0 min-h-[580px] flex flex-col">
            <SupplierDueFilterBar
              search={search}
              statusFilter={statusFilter}
              onSearchChange={(v) => { setSearch(v); setPage(1); }}
              onStatusChange={(v) => { setStatusFilter(v); setPage(1); }}
            />
            <SupplierDueTable
              rows={filteredRows}
              page={page}
              pageSize={PAGE_SIZE}
              selectedSupplierId={selectedSupplierId}
              onPageChange={setPage}
              onRowClick={(supplier) => {
                setSelectedSupplierId(supplier.supplierId);
                setDetailTab('overview');
                setSelectedBillIds([]);
              }}
              onPay={openPay}
            />
          </div>

          <SupplierDueDetailPanel
            supplier={selectedSupplier}
            detailTab={detailTab}
            onDetailTabChange={setDetailTab}
            selectedBillIds={selectedBillIds}
            onToggleBill={handleToggleBill}
            onPay={openPay}
          />
        </div>

        <Footer />
      </div>

      <AppFormModal
        open={showAddPayableModal}
        onClose={() => setShowAddPayableModal(false)}
        title="Add Payable"
        subtitle="Record a new supplier payable balance."
        onSubmit={handleAddPayableSubmit}
        submitLabel="Save Payable"
        size="md"
      >
        <AppFormFields
          fields={addPayableFields}
          values={addPayableForm}
          onChange={(k, v) => setAddPayableForm((f) => ({ ...f, [k]: v }))}
          showAdvanced={showAdvancedAdd}
          onToggleAdvanced={() => setShowAdvancedAdd((p) => !p)}
        />
      </AppFormModal>

      <AppFormModal
        open={showPaymentModal}
        onClose={() => { setShowPaymentModal(false); setPaymentTarget(null); setPaymentBillIds(undefined); }}
        title="Make Payment"
        subtitle={paymentTarget ? paymentTarget.name : ''}
        onSubmit={handlePaymentSubmit}
        submitLabel="Save Payment"
        size="md"
      >
        <AppFormFields
          fields={PAYMENT_FORM_FIELDS}
          values={paymentForm}
          onChange={(k, v) => setPaymentForm((f) => ({ ...f, [k]: v }))}
          showAdvanced={showAdvancedPay}
          onToggleAdvanced={() => setShowAdvancedPay((p) => !p)}
        />
      </AppFormModal>
    </>
  );
}
