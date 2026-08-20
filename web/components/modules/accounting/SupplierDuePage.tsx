'use client';

import { toast } from '@/lib/ui/feedback';

import { useMemo, useState } from 'react';
import { Plus, CreditCard } from 'lucide-react';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/shared/Button';
import { PageSkeleton } from '@/components/shared/PageSkeleton';
import { useRegisterModuleActions } from '@/components/layout/ModuleActionsContext';
import { AppFormFields, AppFormModal } from '@/components/shared/AppForm';
import { useAppStore } from '@/lib/state/app-store';
import { isModuleApiMode } from '@/lib/config/data-source';
import { useApiResourceStore } from '@/hooks/use-api-resource-store';
import { usePaginatedApiResource } from '@/hooks/use-paginated-api-resource';
import { ListPagination } from '@/components/shared/ListPagination';
import { mapGenericApiRow, mapGenericPayloadToApi } from '@/lib/services/generic-api-mapper';
import { mapVendorBillRecordToApi, resolveApiRowId } from '@/lib/services/entity-api-mappers';
import { ApiModeBanner } from '@/components/shared/ApiModeBanner';
import type { AppState } from '@/lib/state/types';
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

function isValidIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) return false;
  const parsed = new Date(`${value.trim()}T00:00:00`);
  return !Number.isNaN(parsed.getTime());
}

function buildPayableAppState(
  base: AppState,
  billRows: Record<string, unknown>[],
  paymentRows: Record<string, unknown>[],
  apiMode: boolean,
  billsReady: boolean,
  paymentsReady: boolean,
): AppState {
  if (!apiMode || !billsReady) return base;
  return {
    ...base,
    vendorBills: billRows,
    purchasePayments: paymentsReady ? paymentRows : base.purchasePayments,
  } as AppState;
}

export function SupplierDuePage() {
  const appState = useAppStore((s) => s.appState);
  const apiDataReady = useAppStore((s) => s.apiDataReady);
  const saveAppState = useAppStore((s) => s.saveAppState);
  const apiMode = isModuleApiMode('vendorBills');
  const billStore = usePaginatedApiResource('vendorBills', mapGenericApiRow, { pageSize: PAGE_SIZE });
  const paymentStore = useApiResourceStore('purchasePayments', mapGenericApiRow, { pageOnly: true, lookupLimit: 100 });
  const cashboxStore = useApiResourceStore('cashbox', mapGenericApiRow, { pageOnly: true, lookupLimit: 100 });

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
  const [saving, setSaving] = useState(false);

  const payableState = useMemo(
    () => buildPayableAppState(
      appState,
      billStore.rows,
      paymentStore.rows,
      apiMode,
      billStore.initialized,
      paymentStore.initialized,
    ),
    [appState, apiMode, billStore.rows, billStore.initialized, paymentStore.rows, paymentStore.initialized],
  );

  const suppliers = useMemo(() => listSuppliers(payableState), [payableState]);
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

  const allSuppliers = useMemo(() => listSupplierPayables(payableState), [payableState]);
  const metrics = useMemo(() => getSupplierPayableMetrics(payableState), [payableState]);

  const effectiveSearch = apiMode ? billStore.search : search;

  const filteredRows = useMemo(
    () => filterSupplierPayables(allSuppliers, { search: effectiveSearch, status: statusFilter }),
    [allSuppliers, effectiveSearch, statusFilter],
  );

  const onPageChange = (p: number) => {
    if (apiMode) billStore.setPage(p);
    else setPage(p);
  };

  const tablePage = apiMode ? 1 : page;
  const tablePageSize = apiMode ? Math.max(filteredRows.length, 1) : PAGE_SIZE;

  const selectedSupplier = useMemo(
    () => (selectedSupplierId ? getSupplierPayableDetail(payableState, selectedSupplierId) : null),
    [payableState, selectedSupplierId],
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

  const handleAddPayableSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addPayableForm.supplier || !addPayableForm.amount || !addPayableForm.dueDate) return;
    if (!isValidIsoDate(addPayableForm.dueDate)) {
      toast.error('Invalid date', { module: 'Supplier Due', description: 'Choose a valid due date.' });
      return;
    }
    const supplierId = supplierIdByLabel[addPayableForm.supplier] ?? addPayableForm.supplier;
    setSaving(true);
    try {
      const baseBills = (apiMode ? billStore.rows : (appState.vendorBills as Record<string, unknown>[] | undefined) ?? []).map((r) => ({ ...r }));
      const pseudo = buildPayableAppState(appState, baseBills, paymentStore.rows, apiMode, true, paymentStore.initialized);
      const beforeIds = new Set(baseBills.map((bill) => String(bill.id)));
      const result = createSupplierPayable(pseudo, { ...addPayableForm, supplier: supplierId });
      if (!result.ok) {
        toast.error('Operation failed', { module: 'Supplier Due', description: 'error' in result ? String(result.error) : 'Failed to save payable' });
        return;
      }
      if (apiMode) {
        const vendorBills = (pseudo.vendorBills ?? []) as Record<string, unknown>[];
        const created = vendorBills.filter((bill) => !beforeIds.has(String(bill.id)));
        for (const bill of created) {
          const sync = await billStore.create(mapVendorBillRecordToApi(bill as Record<string, unknown>));
          if (!sync.ok) {
            toast.error('Operation failed', { module: 'Supplier Due', description: 'error' in sync ? String(sync.error) : 'Bill sync failed' });
            return;
          }
        }
      } else {
        Object.assign(appState, { vendorBills: pseudo.vendorBills });
        saveAppState();
      }
      toast.success('Saved', { module: 'Supplier Due', description: 'Supplier payable recorded.' });
      setShowAddPayableModal(false);
      setAddPayableForm({ supplier: '', amount: '', dueDate: new Date().toISOString().slice(0, 10), notes: '' });
      if (apiMode) billStore.setSearchTerm('');
      else setSearch('');
      setStatusFilter('all_due');
      onPageChange(1);
      if (result.id) {
        setSelectedSupplierId(result.id);
        setSelectedBillIds([]);
      }
    } finally {
      setSaving(false);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentTarget || !paymentForm.amount) return;
    if (!isValidIsoDate(paymentForm.date)) {
      toast.error('Invalid date', { module: 'Supplier Due', description: 'Choose a valid payment date.' });
      return;
    }
    const payAmount = Math.min(Number(paymentForm.amount), paymentTarget.totalDue);
    if (payAmount <= 0) {
      toast.error('Invalid amount', { module: 'Supplier Due', description: 'Enter a valid payment amount.' });
      return;
    }
    setSaving(true);
    try {
      const baseBills = (apiMode ? billStore.rows : (appState.vendorBills as Record<string, unknown>[] | undefined) ?? []).map((r) => ({ ...r }));
      const beforePaymentIds = new Set((payableState.purchasePayments ?? []).map((p) => String((p as Record<string, unknown>).id)));
      const pseudo = buildPayableAppState(appState, baseBills, paymentStore.rows, apiMode, true, paymentStore.initialized);
      const result = makeSupplierPayment(
        pseudo,
        paymentTarget.supplierId,
        payAmount,
        paymentForm.date,
        paymentForm.method,
        paymentBillIds,
      );
      if (!result.ok) {
        toast.error('Operation failed', { module: 'Supplier Due', description: String(result.error ?? 'Failed to record payment') });
        return;
      }
      if (apiMode) {
        const vendorBills = (pseudo.vendorBills ?? []) as Record<string, unknown>[];
        for (const bill of vendorBills) {
          const prev = baseBills.find((r) => String(r.id) === String(bill.id));
          const prevDue = Number(prev?.due ?? prev?.balance ?? 0);
          const nextDue = Number(bill.due ?? bill.balance ?? 0);
          if (prev && prevDue !== nextDue) {
            const sync = await billStore.update(
              resolveApiRowId(bill as Record<string, unknown>),
              mapVendorBillRecordToApi(bill as Record<string, unknown>),
            );
            if (!sync.ok) {
              toast.error('Operation failed', { module: 'Supplier Due', description: 'error' in sync ? String(sync.error) : 'Bill update failed' });
              return;
            }
          }
        }
        const newPayments = (pseudo.purchasePayments ?? []).filter(
          (payment) => !beforePaymentIds.has(String((payment as Record<string, unknown>).id)),
        ) as Record<string, unknown>[];
        for (const payment of newPayments) {
          const sync = await paymentStore.create(mapGenericPayloadToApi(payment));
          if (!sync.ok) {
            toast.error('Operation failed', { module: 'Supplier Due', description: 'error' in sync ? String(sync.error) : 'Payment sync failed' });
            return;
          }
        }
        if (paymentForm.method === 'Cash' && isModuleApiMode('cashbox')) {
          const cashSync = await cashboxStore.create(mapGenericPayloadToApi({
            type: 'cash_out',
            cashIn: 0,
            cashOut: payAmount,
            amount: payAmount,
            datetime: new Date(`${paymentForm.date}T12:00:00`).toISOString(),
            category: 'Supplier Payment',
            party: paymentTarget.name,
            paymentMethod: 'Cash',
            reference: paymentForm.reference,
            description: `Payment to ${paymentTarget.name}`,
            note: paymentForm.reference,
          }));
          if (!cashSync.ok) {
            toast.error('Operation failed', { module: 'Supplier Due', description: 'error' in cashSync ? String(cashSync.error) : 'Cashbox sync failed' });
            return;
          }
        }
      } else {
        Object.assign(appState, {
          vendorBills: pseudo.vendorBills,
          purchasePayments: pseudo.purchasePayments,
        });
        saveAppState();
      }
      toast.success('Payment recorded', {
        module: 'Supplier Due',
        description: `${payAmount.toLocaleString()} recorded${paymentForm.method === 'Cash' ? ' — cashbox updated.' : '.'}`,
      });
      setShowPaymentModal(false);
      setPaymentTarget(null);
      setPaymentBillIds(undefined);
      setSelectedBillIds([]);
      if (apiMode) billStore.setSearchTerm('');
      else setSearch('');
      setStatusFilter('all_due');
      onPageChange(1);
    } finally {
      setSaving(false);
    }
  };

  useRegisterModuleActions(
    <>
      <Button
        type="button"
        onClick={() => setShowAddPayableModal(true)}
        variant="outline"
        leftIcon={<Plus className="w-4 h-4" />}
      >
        Add Payable
      </Button>
      <Button
        type="button"
        onClick={() => {
          const target = selectedSupplier ?? allSuppliers.find((s) => s.totalDue > 0);
          if (target) {
            openPay(target, selectedBillIds.length ? selectedBillIds : undefined);
          } else {
            toast.error('Action required', { module: 'Accounting', description: "Select a supplier with outstanding due first." });
          }
        }}
        variant="primary"
        leftIcon={<CreditCard className="w-4 h-4" />}
      >
        Make Payment
      </Button>
    </>,
    [selectedSupplier, allSuppliers, selectedBillIds, openPay],
  );

  if (apiMode && !apiDataReady && !billStore.initialized) {
    return <PageSkeleton variant="module-list" label="Loading payables" />;
  }

  return (
    <>
        {(billStore.error || paymentStore.error) ? (
          <ApiModeBanner module="vendorBills" error={billStore.error ?? paymentStore.error ?? ''} />
        ) : null}
        <SupplierDueMetrics metrics={metrics} />

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-3 items-stretch">
          <div className="premium-card premium-shadow overflow-hidden min-w-0 min-h-[580px] flex flex-col">
            <SupplierDueFilterBar
              search={effectiveSearch}
              statusFilter={statusFilter}
              onSearchChange={(v) => {
                if (apiMode) billStore.setSearchTerm(v);
                else setSearch(v);
                onPageChange(1);
              }}
              onStatusChange={(v) => { setStatusFilter(v); onPageChange(1); }}
            />
            <SupplierDueTable
              rows={filteredRows}
              page={tablePage}
              pageSize={tablePageSize}
              selectedSupplierId={selectedSupplierId}
              onPageChange={onPageChange}
              onRowClick={(supplier) => {
                setSelectedSupplierId(supplier.supplierId);
                setDetailTab('overview');
                setSelectedBillIds([]);
              }}
              onPay={openPay}
            />
            {apiMode ? (
              <ListPagination
                page={billStore.page}
                pageSize={billStore.pageSize}
                total={billStore.meta.total}
                onPageChange={billStore.setPage}
              />
            ) : null}
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

      <AppFormModal
        open={showAddPayableModal}
        onClose={() => setShowAddPayableModal(false)}
        title="Add Payable"
        subtitle="Record a new supplier payable balance."
        onSubmit={handleAddPayableSubmit}
        submitLabel={saving ? 'Saving…' : 'Save Payable'}
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
        submitLabel={saving ? 'Saving…' : 'Save Payment'}
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
