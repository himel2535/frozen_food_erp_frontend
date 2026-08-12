'use client';

import { toast, confirmAction } from '@/lib/ui/feedback';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FileSpreadsheet, Filter, Plus, Package, History, FileText, Paperclip, MessageSquare, X, Search } from 'lucide-react';
import { Footer } from '@/components/layout/Footer';
import { useChromeSuppressed, useRegisterModuleActions } from '@/components/layout/ModuleActionsContext';
import { FilterTabs } from '@/components/shared/FilterTabs';
import { DateInput } from '@/components/shared/DateInput';
import { ModuleKpiSection } from '@/components/shared/ModuleKpiSection';
import { ModuleFilterBar } from '@/components/shared/ModuleFilterBar';
import { MODULE_FILTER_ACTION_BTN, MODULE_FILTER_INPUT, MODULE_FILTER_SEARCH } from '@/lib/ui/module-chrome-styles';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { TableIconAction } from '@/components/shared/TableIconAction';
import { AppTable, type AppTableColumn } from '@/components/shared/AppTable';
import { CF_BTN_OUTLINE, CF_BTN_PRIMARY } from '@/components/modules/crm/customer-form/customer-form-styles';
import { useAppStore } from '@/lib/state/app-store';
import { usePaginatedApiResource } from '@/hooks/use-paginated-api-resource';
import { ListPagination } from '@/components/shared/ListPagination';
import { mapGenericApiRow, mapGenericPayloadToApi } from '@/lib/services/generic-api-mapper';
import { ApiModeBanner } from '@/components/shared/ApiModeBanner';
import { isModuleBootLoading } from '@/lib/ui/kpi-loading';
import { isModuleApiMode } from '@/lib/config/data-source';
import type { AppState } from '@/lib/state/types';
import { syncInventoryQuantityDeltas } from '@/lib/services/inventory-api-sync';
import {
  PurchaseRmForm,
  EMPTY_PURCHASE_RM_FORM,
  type PurchaseRmFormValues,
  type PurchaseRmPayload,
  type PurchaseRmSaveAction,
} from '@/components/modules/purchases/PurchaseRmForm';
import type { PurchaseRmLineItem } from '@/components/modules/purchases/purchase-rm-form/prm-form-types';
import Link from 'next/link';
import { historyEntryToProof, PurchaseRmReceiveProofCard } from '@/components/modules/purchases/purchase-rm-form/PurchaseRmReceiveProof';
import { PurchaseRmReceiveModal, type PurchaseRmReceiveSubmitPayload } from '@/components/modules/purchases/purchase-rm-form/PurchaseRmReceiveModal';
import {
  cancelPurchaseRmOrder,
  createPurchaseRmOrder,
  deletePurchaseRmOrder,
  formatPoMoney,
  getPurchaseRmMetrics,
  getSupplierProfile,
  listPurchaseRmOrders,
  previewPoNumber,
  receivePurchaseRmOrder,
  sendPurchaseRmOrder,
  updatePurchaseRmOrder,
} from '@/lib/services/purchase-rm-service';
import { syncPurchaseRmApproval } from '@/lib/services/approvals-service';
import {
  listFinishedGoods,
  listRawMaterials,
  listSemiFinishedProducts,
} from '@/lib/services/inventory-service';
import { listVendorBills } from '@/lib/services/purchases-service';
import { listSupplierOptions } from '@/lib/services/recipes-service';

const STATUS_TABS = [
  { id: 'all', label: 'All Orders' },
  { id: 'draft', label: 'Draft' },
  { id: 'pending_approval', label: 'Pending Approval' },
  { id: 'sent', label: 'Sent' },
  { id: 'partially_received', label: 'Partially Received' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
];

const BOTTOM_TABS = [
  { id: 'items', label: 'Items', icon: Package },
  { id: 'history', label: 'Receive History', icon: History },
  { id: 'bills', label: 'Bills', icon: FileText },
  { id: 'documents', label: 'Documents', icon: Paperclip },
  { id: 'remarks', label: 'Remarks', icon: MessageSquare },
];

function recordToFormValues(record: Record<string, unknown>): PurchaseRmFormValues {
  const items = (Array.isArray(record.items) ? record.items : []) as PurchaseRmLineItem[];
  const totals = record.totals as Record<string, unknown> | undefined;
  return {
    date: String(record.date ?? new Date().toISOString().slice(0, 10)),
    expectedDelivery: String(record.expectedDelivery ?? ''),
    supplierId: String(record.supplierId ?? ''),
    supplierName: String(record.supplierName ?? ''),
    warehouseId: String(record.warehouseId ?? ''),
    warehouseName: String(record.warehouseName ?? ''),
    notes: String(record.notes ?? ''),
    vatPct: Number(totals?.vatPct ?? record.vatPct ?? 15),
    aitPct: Number(totals?.aitPct ?? record.aitPct ?? 1),
    otherCharges: Number(totals?.otherCharges ?? record.otherCharges ?? 0),
    status: String(record.status ?? 'draft'),
    items,
  };
}

function deliveryBadge(expected: string) {
  if (!expected) return null;
  const late = new Date(`${expected}T00:00:00`) < new Date();
  return (
    <span className={`text-[10px] font-bold ${late ? 'text-rose-600' : 'text-emerald-600'}`}>
      {late ? 'Late' : 'On Time'}
    </span>
  );
}

function getApprovalFocusSubtitle(status: string): string {
  if (['sent', 'partially_received'].includes(status)) {
    return 'Use Receive in Actions to record goods.';
  }
  if (status === 'pending_approval') {
    return 'Awaiting approval — approve in Approvals first.';
  }
  if (status === 'draft') {
    return 'Order is back in draft — review or resend.';
  }
  return 'Review this RM order below.';
}

const PROOF_TYPE_LABELS: Record<string, string> = {
  receipt: 'Receipt (Roshid)',
  bank: 'Bank Transaction',
  other: 'Other',
};

export function PurchaseRmPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const appState = useAppStore((s) => s.appState);
  const saveAppState = useAppStore((s) => s.saveAppState);
  const apiMode = isModuleApiMode('purchaseRm');
  const apiStore = usePaginatedApiResource('purchaseRm', mapGenericApiRow, { pageSize: 25 });
  const bootLoading = isModuleBootLoading(apiMode, apiStore.initialized);
  const focusPoId = searchParams.get('focus');
  const fromApproval = searchParams.get('from') === 'approval';
  const [view, setView] = useState<'main' | 'form'>('main');
  const [localSearch, setLocalSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [selectedPoId, setSelectedPoId] = useState<string | null>(null);
  const [bottomTab, setBottomTab] = useState('items');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [formValues, setFormValues] = useState<PurchaseRmFormValues>(EMPTY_PURCHASE_RM_FORM);
  const skipSelectionResetRef = useRef(false);
  const [focusNotFound, setFocusNotFound] = useState(false);
  const [activeProofId, setActiveProofId] = useState<string | null>(null);
  const [receiveModalPoId, setReceiveModalPoId] = useState<string | null>(null);

  const rmState = useMemo((): AppState => {
    if (apiMode && apiStore.initialized) {
      return { ...appState, purchaseRmOrders: apiStore.rows } as AppState;
    }
    return appState;
  }, [apiMode, apiStore.initialized, apiStore.rows, appState]);

  const suppliers = useMemo(() => listSupplierOptions(rmState), [rmState]);
  const warehouses = useMemo(
    () => (rmState.inventoryWarehouses ?? []).map((w) => ({ id: String(w.id), name: String(w.name) })),
    [rmState.inventoryWarehouses],
  );
  const defaultWarehouseId = warehouses.find((w) => w.name.toLowerCase().includes('main'))?.id ?? warehouses[0]?.id ?? '';

  const rows = useMemo(() => {
    let data = listPurchaseRmOrders(rmState);
    const q = (apiMode ? apiStore.search : localSearch).toLowerCase();
    if (q) {
      data = data.filter((row) => {
        const items = Array.isArray(row.items) ? row.items : [];
        const itemNames = items.map((i) => String((i as Record<string, unknown>).productName ?? '')).join(' ');
        return `${row.id} ${row.supplierName} ${itemNames}`.toLowerCase().includes(q);
      });
    }
    if (statusFilter !== 'all') data = data.filter((r) => String(r.status) === statusFilter);
    if (supplierFilter) data = data.filter((r) => String(r.supplierId) === supplierFilter);
    if (warehouseFilter) data = data.filter((r) => String(r.warehouseId) === warehouseFilter);
    if (paymentFilter) data = data.filter((r) => String(r.paymentStatus) === paymentFilter);
    if (dateFrom) data = data.filter((r) => String(r.date) >= dateFrom);
    if (dateTo) data = data.filter((r) => String(r.date) <= dateTo);
    if (lowStockOnly) {
      data = data.filter((row) => {
        const items = Array.isArray(row.items) ? row.items : [];
        return items.some((i) => Number((i as Record<string, unknown>).currentStock ?? 999) <= 100);
      });
    }
    return data.sort((a, b) =>
      String(b.createdAt ?? b.date ?? '').localeCompare(String(a.createdAt ?? a.date ?? '')),
    );
  }, [rmState, apiMode, apiStore.search, localSearch, statusFilter, supplierFilter, warehouseFilter, paymentFilter, dateFrom, dateTo, lowStockOnly]);

  useEffect(() => {
    if (skipSelectionResetRef.current) {
      skipSelectionResetRef.current = false;
      return;
    }
    if (!rows.length) {
      setSelectedPoId(null);
      return;
    }
    if (!selectedPoId || !rows.some((r) => String(r.id) === selectedPoId)) {
      setSelectedPoId(String(rows[0].id));
    }
  }, [rows, selectedPoId]);

  useEffect(() => {
    if (!fromApproval || !focusPoId) {
      setFocusNotFound(false);
      return;
    }
    const order = listPurchaseRmOrders(rmState).find((r) => String(r.id) === focusPoId);
    if (!order) {
      setFocusNotFound(true);
      return;
    }
    setFocusNotFound(false);
    if (apiMode) apiStore.setSearchTerm('');
    else setLocalSearch('');
    setSupplierFilter('');
    setWarehouseFilter('');
    setPaymentFilter('');
    setDateFrom('');
    setDateTo('');
    setLowStockOnly(false);
    setStatusFilter('all');
    skipSelectionResetRef.current = true;
    setSelectedPoId(focusPoId);
    requestAnimationFrame(() => {
      const receivable = ['sent', 'partially_received'].includes(String(order.status));
      const receiveCue = document.querySelector('[data-receive-cue="true"]');
      if (receivable && receiveCue) {
        receiveCue.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        return;
      }
      document.querySelector(`[data-row-id="${focusPoId}"]`)?.scrollIntoView({ block: 'nearest' });
    });
  }, [fromApproval, focusPoId, rmState]);

  const dismissApprovalFocus = () => {
    router.replace('/purchases/purchase-rm');
  };

  const selectedPo = rows.find((r) => String(r.id) === selectedPoId) ?? null;
  const activeProof = useMemo(() => {
    if (!activeProofId || !selectedPo) return null;
    const history = Array.isArray(selectedPo.receiveHistory) ? selectedPo.receiveHistory : [];
    const entry = history.find((h) => String((h as Record<string, unknown>).id) === activeProofId);
    return entry ? historyEntryToProof(entry as Record<string, unknown>) : null;
  }, [activeProofId, selectedPo]);
  const receiveModalOrder = useMemo(() => {
    if (!receiveModalPoId) return null;
    return listPurchaseRmOrders(rmState).find((r) => String(r.id) === receiveModalPoId) ?? null;
  }, [rmState, receiveModalPoId]);
  const linkedBill = useMemo(() => {
    if (!selectedPo?.billId) return null;
    return listVendorBills(appState).find((b) => String(b.id) === String(selectedPo.billId)) ?? null;
  }, [appState, selectedPo]);
  const proofDocuments = useMemo(() => {
    const history = Array.isArray(selectedPo?.receiveHistory) ? selectedPo.receiveHistory : [];
    return history.flatMap((entry) => {
      const proof = historyEntryToProof(entry as Record<string, unknown>);
      if (!proof?.attachments?.length) return [];
      return proof.attachments.map((file) => ({
        grnId: proof.id,
        date: proof.date,
        proofType: proof.proofType ?? file.type,
        name: file.name,
        dataUrl: file.dataUrl,
      }));
    });
  }, [selectedPo]);
  const focusedOrder = useMemo(() => {
    if (!focusPoId) return null;
    return listPurchaseRmOrders(rmState).find((r) => String(r.id) === focusPoId) ?? null;
  }, [rmState, focusPoId]);
  const selectedSupplier = selectedPo ? getSupplierProfile(rmState, String(selectedPo.supplierId)) : null;
  const kpis = useMemo(() => getPurchaseRmMetrics(rmState), [rmState]);
  const poPreviewId = useMemo(
    () => (editingId ? editingId : previewPoNumber(rmState, formValues.date)),
    [rmState, editingId, formValues.date],
  );

  const rmOrderColumns = useMemo<AppTableColumn<Record<string, unknown>>[]>(() => [
    {
      key: 'id',
      label: 'RM Order ID',
      render: (row) => (
        <>
          <div className="font-bold text-slate-900">{String(row.id)}</div>
          <div className="text-slate-500 text-[11px]">{String(row.date)}</div>
        </>
      ),
    },
    {
      key: 'supplierName',
      label: 'Supplier',
      render: (row) => (
        <>
          <div className="font-semibold text-slate-800">{String(row.supplierName ?? '—')}</div>
          <div className="text-slate-500 text-[11px]">Last order: {String(row.id).slice(-5)}</div>
        </>
      ),
    },
    {
      key: 'items',
      label: 'Items',
      render: (row) => {
        const items = Array.isArray(row.items) ? row.items : [];
        const firstItem = items[0] as Record<string, unknown> | undefined;
        return (
          <>
            <div className="font-medium text-slate-700">{String(firstItem?.productName ?? '—')}</div>
            {items.length > 1 && (
              <div className="text-blue-600 text-[11px] font-semibold">+{items.length - 1} more</div>
            )}
          </>
        );
      },
    },
    {
      key: 'warehouseName',
      label: 'Warehouse',
      render: (row) => String(row.warehouseName ?? '—'),
    },
    {
      key: 'expectedDelivery',
      label: 'Expected Delivery',
      render: (row) => (
        <>
          <div>{String(row.expectedDelivery ?? '—')}</div>
          {deliveryBadge(String(row.expectedDelivery ?? ''))}
        </>
      ),
    },
    {
      key: 'progress',
      label: 'Progress',
      render: (row) => (
        <div className="min-w-[100px]">
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full" style={{ width: `${Number(row.progress ?? 0)}%` }} />
          </div>
          <p className="text-[10px] text-slate-500 mt-1">{Number(row.progress ?? 0)}%</p>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={String(row.status).replace(/_/g, ' ')} />,
    },
    {
      key: 'grandTotal',
      label: 'Total',
      align: 'right',
      render: (row) => (
        <>
          <div className="font-bold text-slate-900">{formatPoMoney(Number(row.grandTotal ?? row.total ?? 0))}</div>
          <div className="text-slate-500 text-[11px]">Paid {Number(row.paidPercent ?? 0)}%</div>
        </>
      ),
    },
  ], []);

  const resetListFilters = () => {
    if (apiMode) apiStore.setSearchTerm('');
    else setLocalSearch('');
    setSupplierFilter('');
    setWarehouseFilter('');
    setPaymentFilter('');
    setDateFrom('');
    setDateTo('');
    setLowStockOnly(false);
  };

  const resetForm = () => {
    setFormValues({ ...EMPTY_PURCHASE_RM_FORM, warehouseId: defaultWarehouseId, expectedDelivery: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10) });
    setEditingId(null);
    setFormKey((k) => k + 1);
  };

  const openCreate = () => {
    resetForm();
    setView('form');
  };

  const openEdit = (row: Record<string, unknown>) => {
    setEditingId(String(row.id));
    setFormValues(recordToFormValues(row));
    setFormKey((k) => k + 1);
    setView('form');
  };

  const persistPo = async (payload: PurchaseRmPayload, action: PurchaseRmSaveAction) => {
    const record = {
      ...payload,
      id: editingId ?? undefined,
      grandTotal: payload.totals.grandTotal,
      total: payload.totals.grandTotal,
    };
    if (apiMode) {
      const body = mapGenericPayloadToApi(record as Record<string, unknown>);
      const result = editingId
        ? await apiStore.update(editingId, body)
        : await apiStore.create(body);
      if (!result.ok) {
        toast.error('Operation failed', { module: 'Purchases', description: 'error' in result ? String(result.error) : 'Save failed' });
        return null;
      }
      const savedId = editingId ?? ('id' in result ? String(result.id) : previewPoNumber(rmState, payload.date));
      if (String(record.status) === 'pending_approval') {
        const syncApproval = await syncPurchaseRmApproval({ ...record, id: savedId });
        if (!syncApproval.ok) {
          toast.error('Approval sync failed', { module: 'Purchases', description: syncApproval.error ?? 'Could not create approval request.' });
        }
      }
      return savedId;
    }
    const result = editingId
      ? updatePurchaseRmOrder(appState, editingId, record)
      : createPurchaseRmOrder(appState, record);
    if (!result.ok) {
      toast.error('Operation failed', { module: 'Purchases', description: 'error' in result ? String(result.error) : 'Save failed' });
      return null;
    }
    saveAppState();
    return editingId ?? ('id' in result ? result.id : previewPoNumber(rmState, payload.date));
  };

  const handleSave = async (payload: PurchaseRmPayload, action: PurchaseRmSaveAction) => {
    const savedId = await persistPo(payload, action);
    if (!savedId) return;
    resetListFilters();
    setStatusFilter(action === 'complete' ? 'pending_approval' : 'draft');
    skipSelectionResetRef.current = true;
    setView('main');
    setSelectedPoId(savedId);
    resetForm();
  };

  const runRmMutation = async (
    id: string,
    mutator: (state: AppState) => { ok: boolean; error?: string },
    successMsg?: string,
  ) => {
    if (apiMode) {
      const inventoryBefore = { ...appState } as AppState;
      const pseudo = {
        ...appState,
        purchaseRmOrders: apiStore.rows.map((r) => ({ ...r })),
        rawMaterials: listRawMaterials(appState).map((r) => ({ ...r })),
        semiFinishedProducts: listSemiFinishedProducts(appState).map((r) => ({ ...r })),
        finishedGoods: listFinishedGoods(appState).map((r) => ({ ...r })),
      } as AppState;
      const result = mutator(pseudo);
      if (!result.ok) {
        toast.error('Operation failed', { module: 'Purchases', description: String(result.error ?? 'Action failed') });
        return false;
      }
      const updated = listPurchaseRmOrders(pseudo).find((r) => String(r.id) === id);
      if (updated) {
        const sync = await apiStore.update(id, mapGenericPayloadToApi(updated as Record<string, unknown>));
        if (!sync.ok) {
          toast.error('Operation failed', { module: 'Purchases', description: 'error' in sync ? String(sync.error) : 'Sync failed' });
          return false;
        }
      }
      const invSync = await syncInventoryQuantityDeltas(inventoryBefore, pseudo);
      if (!invSync.ok) {
        toast.error('Operation failed', { module: 'Purchases', description: invSync.error });
        return false;
      }
      if (updated && String(updated.status) === 'pending_approval') {
        const syncApproval = await syncPurchaseRmApproval(updated as Record<string, unknown>);
        if (!syncApproval.ok) {
          toast.error('Approval sync failed', { module: 'Purchases', description: syncApproval.error ?? 'Could not create approval request.' });
        }
      }
      if (successMsg) toast.success('Success', { module: 'Purchases', description: successMsg });
      return true;
    }
    const result = mutator(appState);
    if (!result.ok) {
      toast.error('Operation failed', { module: 'Purchases', description: String(result.error ?? 'Action failed') });
      return false;
    }
    saveAppState();
    if (successMsg) toast.success('Success', { module: 'Purchases', description: successMsg });
    return true;
  };

  const runAction = (fn: () => { ok: boolean; error?: string }, successMsg?: string) => {
    const result = fn();
    if (!result.ok) {
      toast.error('Operation failed', { module: 'Purchases', description: String(result.error ?? 'Action failed') });
      return false;
    }
    saveAppState();
    if (successMsg) toast.success('Success', { module: 'Purchases', description: successMsg });
    return true;
  };

  const handleSendForApproval = async (id: string) => {
    if (apiMode) {
      if (!await runRmMutation(id, (s) => sendPurchaseRmOrder(s, id), 'Sent for approval.')) return;
    } else if (!runAction(() => sendPurchaseRmOrder(appState, id), 'Sent for approval.')) return;
    router.push('/workflow-approvals');
  };

  const handleReceiveSubmit = async (poId: string, payload: PurchaseRmReceiveSubmitPayload) => {
    if (apiMode) {
      if (!await runRmMutation(poId, (s) => receivePurchaseRmOrder(s, poId, {
        proofType: payload.proofType,
        proofNote: payload.proofNote,
        attachments: payload.attachments,
      }))) return;
      setReceiveModalPoId(null);
      toast.success('Success', { module: 'Purchases', description: 'Goods received.' });
      return;
    }
    const result = receivePurchaseRmOrder(appState, poId, {
      proofType: payload.proofType,
      proofNote: payload.proofNote,
      attachments: payload.attachments,
    });
    if (!result.ok) {
      toast.error('Operation failed', { module: 'Purchases', description: String(result.error ?? 'Receive failed') });
      return;
    }
    saveAppState();
    setReceiveModalPoId(null);
    if ('proofId' in result && result.proofId) {
      setSelectedPoId(poId);
      setActiveProofId(result.proofId);
      setBottomTab('history');
    }
  };

  useChromeSuppressed(view !== 'main');

  useRegisterModuleActions(
    <>
      <button type="button" onClick={() => toast.info('Feature coming soon', { module: 'Purchases', description: "Import Excel" })} className={CF_BTN_OUTLINE}>
        <FileSpreadsheet className="w-4 h-4" /> Import Excel
      </button>
      <button type="button" onClick={() => setLowStockOnly((v) => !v)} className={`${CF_BTN_OUTLINE} ${lowStockOnly ? 'ring-2 ring-blue-300' : ''}`}>
        Low Stock
      </button>
      <button type="button" onClick={openCreate} className={CF_BTN_PRIMARY}>
        <Plus className="w-4 h-4" /> Create RM Order
      </button>
    </>,
    [lowStockOnly, openCreate],
  );

  if (view === 'form') {
    return (
      <PurchaseRmForm
        key={formKey}
        mode={editingId ? 'edit' : 'create'}
        initialValues={formValues}
        poPreviewId={poPreviewId}
        appState={appState}
        suppliers={suppliers}
        warehouses={warehouses}
        onCancel={() => { setView('main'); resetForm(); }}
        onSave={handleSave}
      />
    );
  }

  const selectedItems = (Array.isArray(selectedPo?.items) ? selectedPo.items : []) as PurchaseRmLineItem[];
  const selectedTotals = selectedPo?.totals as Record<string, unknown> | undefined;
  const receiveHistory = Array.isArray(selectedPo?.receiveHistory) ? selectedPo.receiveHistory : [];
  const timeline = Array.isArray(selectedPo?.timeline) ? selectedPo.timeline : [];

  return (
    <>
      {apiStore.error ? <ApiModeBanner module="purchaseRm" error={apiStore.error} /> : null}
      <ModuleKpiSection items={kpis} loading={bootLoading} />

      <ModuleFilterBar>
        <div className="flex flex-col gap-3 min-w-0">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={apiMode ? apiStore.search : localSearch}
                onChange={(e) => {
                  if (apiMode) apiStore.setSearchTerm(e.target.value);
                  else setLocalSearch(e.target.value);
                }}
                placeholder="RM order ID, supplier, product..."
                className={MODULE_FILTER_SEARCH}
              />
            </div>
            <select value={supplierFilter} onChange={(e) => setSupplierFilter(e.target.value)} className={MODULE_FILTER_INPUT}>
              <option value="">All Suppliers</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select value={warehouseFilter} onChange={(e) => setWarehouseFilter(e.target.value)} className={MODULE_FILTER_INPUT}>
              <option value="">All Warehouses</option>
              {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
            <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className={MODULE_FILTER_INPUT}>
              <option value="">Payment Status</option>
              <option value="unpaid">Unpaid</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
            </select>
            <DateInput value={dateFrom} onChange={setDateFrom} className={MODULE_FILTER_INPUT} />
            <DateInput value={dateTo} onChange={setDateTo} className={MODULE_FILTER_INPUT} />
            <button type="button" onClick={() => { resetListFilters(); setLowStockOnly(false); }} className={MODULE_FILTER_ACTION_BTN}>
              <Filter className="w-3.5 h-3.5" /> Reset
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <FilterTabs tabs={STATUS_TABS} active={statusFilter} onChange={setStatusFilter} wrap />
          </div>
        </div>
      </ModuleFilterBar>

      {fromApproval && focusPoId && !focusNotFound && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-blue-200/80 bg-blue-50/90 px-4 py-2.5">
          <div className="flex items-start gap-2.5 min-w-0">
            <Package className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[11px] font-extrabold text-blue-800">Opened from Approvals</p>
              <p className="text-[11px] font-semibold text-blue-700/90 mt-0.5 leading-relaxed">
                {focusPoId} — {getApprovalFocusSubtitle(String(focusedOrder?.status ?? ''))}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={dismissApprovalFocus}
            className="inline-flex items-center gap-1 rounded-lg p-1 px-2 text-blue-600 hover:bg-blue-100 cursor-pointer shrink-0"
          >
            <X className="w-3.5 h-3.5" /> Dismiss
          </button>
        </div>
      )}

      {fromApproval && focusPoId && focusNotFound && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-semibold text-rose-900">
          <span>Order {focusPoId} not found.</span>
          <button
            type="button"
            onClick={dismissApprovalFocus}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-rose-800 hover:bg-rose-100 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" /> Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-4 items-start">
        <div className="bg-white rounded-xl border border-slate-200/80 premium-shadow overflow-hidden">
          <AppTable
            columns={rmOrderColumns}
            rows={rows as Record<string, unknown>[]}
            loading={bootLoading}
            emptyMessage="No RM orders found."
            onRowClick={(row) => setSelectedPoId(String(row.id))}
            rowClassName={(row) => {
              const classes: string[] = [];
              const isFocusedFromApproval = fromApproval && focusPoId && String(row.id) === focusPoId;
              const isSelected = String(row.id) === selectedPoId;
              if (isSelected || isFocusedFromApproval) {
                classes.push(isFocusedFromApproval ? 'bg-blue-50/90' : 'bg-blue-50/70');
              }
              if (isFocusedFromApproval) {
                classes.push('ring-2 ring-blue-500/25 ring-inset');
              }
              return classes.join(' ');
            }}
            renderActions={(row) => {
              const showReceiveCue = fromApproval
                && focusPoId
                && String(row.id) === focusPoId
                && ['sent', 'partially_received'].includes(String(row.status));
              const receiveButton = (
                <button
                  type="button"
                  title="Receive"
                  {...(showReceiveCue ? { 'data-receive-cue': 'true' } : {})}
                  onClick={() => setReceiveModalPoId(String(row.id))}
                  className={`p-1.5 rounded-lg hover:bg-violet-50 text-violet-600 cursor-pointer text-[10px] font-bold${
                    showReceiveCue ? ' ring-2 ring-violet-400/80 ring-offset-1 shadow-sm shadow-violet-500/20' : ''
                  }`}
                >
                  Receive
                </button>
              );

              return (
              <>
                {String(row.status) === 'draft' && <TableIconAction variant="edit" onClick={() => openEdit(row)} />}
                {String(row.status) === 'draft' && (
                  <button type="button" title="Send" onClick={() => handleSendForApproval(String(row.id))} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 cursor-pointer text-[10px] font-bold">Send</button>
                )}
                {['sent', 'partially_received'].includes(String(row.status)) && (
                  showReceiveCue ? (
                    <span className="relative inline-flex items-center">
                      <span
                        aria-hidden
                        className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-violet-600 text-white text-[9px] font-bold px-2 py-0.5 shadow-sm pointer-events-none"
                      >
                        Receive here
                      </span>
                      {receiveButton}
                    </span>
                  ) : receiveButton
                )}
                {!['completed', 'cancelled'].includes(String(row.status)) && (
                  <button
                    type="button"
                    title="Cancel"
                    onClick={() => {
                      const id = String(row.id);
                      if (apiMode) void runRmMutation(id, (s) => cancelPurchaseRmOrder(s, id));
                      else runAction(() => cancelPurchaseRmOrder(appState, id));
                    }}
                    className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 cursor-pointer text-[10px] font-bold"
                  >
                    Cancel
                  </button>
                )}
                {['draft', 'cancelled'].includes(String(row.status)) && (
                  <TableIconAction
                    variant="delete"
                    onClick={() => {
                      confirmAction({ title: 'Delete RM order', message: 'Delete this RM order?', confirmLabel: 'Delete', tone: 'danger', module: 'Purchase RM' }).then((__ok) => {
                        if (!__ok) return;
                        const id = String(row.id);
                        if (apiMode) {
                          void apiStore.remove(id);
                          return;
                        }
                        runAction(() => deletePurchaseRmOrder(appState, id));
                      });
                    }}
                  />
                )}
              </>
              );
            }}
          />
          {apiMode ? (
            <ListPagination
              page={apiStore.page}
              pageSize={apiStore.pageSize}
              total={apiStore.meta.total}
              onPageChange={apiStore.setPage}
            />
          ) : null}
        </div>

        {selectedPo && (
          <div className="bg-white rounded-xl border border-slate-200/80 premium-shadow p-4 space-y-4 xl:sticky xl:top-4">
            <div>
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-extrabold text-slate-900">{String(selectedPo.id)}</h3>
                <StatusBadge status={String(selectedPo.status).replace(/_/g, ' ')} />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Created {String(selectedPo.createdAt ?? selectedPo.date).slice(0, 10)} by {String(selectedPo.createdBy ?? 'Sarah Connor')}</p>
            </div>
            {selectedSupplier && (
              <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 space-y-1 text-xs">
                <p className="font-bold text-slate-800">{selectedSupplier.name}</p>
                <p className="text-slate-600">{selectedSupplier.phone}</p>
                <p className="text-slate-600">{selectedSupplier.email}</p>
                <p className="text-slate-500">{selectedSupplier.address}</p>
                <p className="text-rose-600 font-semibold">Outstanding: {formatPoMoney(selectedSupplier.outstanding)}</p>
                <p className="text-slate-500">Credit: {formatPoMoney(selectedSupplier.creditLimit)}</p>
              </div>
            )}
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase text-slate-500">Timeline</p>
              {timeline.map((entry, i) => {
                const e = entry as Record<string, unknown>;
                return (
                  <div key={i} className="flex gap-2 text-xs">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-slate-800">{String(e.label ?? '')}</p>
                      <p className="text-[10px] text-slate-500">{String(e.at ?? '').slice(0, 10)} {e.by ? `· ${String(e.by)}` : ''}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {selectedPo && activeProof && (
        <PurchaseRmReceiveProofCard
          proof={activeProof}
          onDismiss={() => setActiveProofId(null)}
        />
      )}

      {selectedPo && (
        <div className="bg-white rounded-xl border border-slate-200/80 premium-shadow">
          <div className="flex flex-wrap gap-1 p-2 border-b border-slate-100">
            {BOTTOM_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setBottomTab(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold cursor-pointer transition-colors ${bottomTab === tab.id ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <tab.icon className="w-3.5 h-3.5" /> {tab.label}
              </button>
            ))}
          </div>
          <div className="p-4">
            {bottomTab === 'items' && (
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-[10px] font-bold uppercase text-slate-500">
                        <th className="py-2 text-left">Product</th>
                        <th className="py-2 text-left">Warehouse</th>
                        <th className="py-2 text-right">Qty</th>
                        <th className="py-2 text-right">Unit Cost</th>
                        <th className="py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedItems.map((item) => (
                        <tr key={item.id} className="border-t border-slate-100">
                          <td className="py-2 font-semibold">{item.productName}</td>
                          <td className="py-2">{String(selectedPo.warehouseName)}</td>
                          <td className="py-2 text-right">{item.qty.toLocaleString()} {item.unit}</td>
                          <td className="py-2 text-right">{formatPoMoney(item.unitPrice)}</td>
                          <td className="py-2 text-right font-bold">{formatPoMoney(item.lineTotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-xs space-y-1">
                  <p className="flex justify-between"><span>Total Qty</span><strong>{Number(selectedTotals?.totalQty ?? 0).toLocaleString()}</strong></p>
                  <p className="flex justify-between"><span>Sub Total</span><strong>{formatPoMoney(Number(selectedTotals?.subTotal ?? 0))}</strong></p>
                  <p className="flex justify-between"><span>VAT</span><strong>{formatPoMoney(Number(selectedTotals?.vat ?? 0))}</strong></p>
                  {Number(selectedTotals?.ait ?? 0) > 0 && (
                    <p className="flex justify-between"><span>AIT ({Number(selectedTotals?.aitPct ?? 1)}%)</span><strong>{formatPoMoney(Number(selectedTotals?.ait ?? 0))}</strong></p>
                  )}
                  {Number(selectedTotals?.otherCharges ?? 0) > 0 && (
                    <p className="flex justify-between"><span>Other Charges</span><strong>{formatPoMoney(Number(selectedTotals?.otherCharges ?? 0))}</strong></p>
                  )}
                  <p className="flex justify-between font-extrabold text-blue-700 pt-2 border-t border-slate-200"><span>Total</span><span>{formatPoMoney(Number(selectedTotals?.grandTotal ?? selectedPo.grandTotal ?? 0))}</span></p>
                </div>
              </div>
            )}
            {bottomTab === 'history' && (
              <div className="space-y-2 text-xs">
                {receiveHistory.length === 0 ? (
                  <p className="text-slate-400">No receive history yet.</p>
                ) : receiveHistory.map((h, i) => {
                  const entry = h as Record<string, unknown>;
                  const proofId = entry.id ? String(entry.id) : null;
                  const isActive = proofId && proofId === activeProofId;
                  if (proofId) {
                    return (
                      <button
                        key={proofId}
                        type="button"
                        onClick={() => setActiveProofId(proofId)}
                        className={`w-full flex items-center justify-between rounded-lg border px-3 py-2 cursor-pointer transition-colors text-left ${
                          isActive
                            ? 'border-blue-200 bg-blue-50/80'
                            : 'border-slate-100 hover:bg-slate-50'
                        }`}
                      >
                        <span className="font-bold text-blue-700">{proofId}</span>
                        <span>{String(entry.date)}</span>
                        <span className="font-bold">{Number(entry.qty).toLocaleString()} units</span>
                        <span className="text-slate-500">{formatPoMoney(Number(entry.grandTotal ?? 0))}</span>
                      </button>
                    );
                  }
                  return (
                    <div key={i} className="flex justify-between rounded-lg border border-slate-100 px-3 py-2">
                      <span>{String(entry.date)}</span>
                      <span className="font-bold">{Number(entry.qty).toLocaleString()} units</span>
                      <span className="text-slate-500">{String(entry.note ?? '')}</span>
                    </div>
                  );
                })}
              </div>
            )}
            {bottomTab === 'bills' && (
              <div className="space-y-3 text-xs">
                {linkedBill ? (
                  <>
                    <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <p><span className="font-bold text-slate-500">Bill #:</span> {String(linkedBill.id)}</p>
                      <p><span className="font-bold text-slate-500">Supplier:</span> {String(linkedBill.supplier ?? '—')}</p>
                      <p><span className="font-bold text-slate-500">Amount:</span> {formatPoMoney(Number(linkedBill.amount ?? 0))}</p>
                      <p><span className="font-bold text-slate-500">Due Date:</span> {String(linkedBill.dueDate ?? '—')}</p>
                      <p><span className="font-bold text-slate-500">Status:</span> {String(linkedBill.status ?? 'draft')}</p>
                      <p><span className="font-bold text-slate-500">Reference:</span> {String(linkedBill.ref ?? selectedPo.id)}</p>
                    </div>
                    <Link href="/purchases/bills" className="inline-flex text-blue-700 font-bold hover:underline cursor-pointer">
                      Open in Vendor Bills
                    </Link>
                  </>
                ) : ['sent', 'partially_received'].includes(String(selectedPo.status)) ? (
                  <p className="text-slate-500">Bill will be created when this order is fully received.</p>
                ) : (
                  <p className="text-slate-500">No vendor bill linked yet.</p>
                )}
              </div>
            )}
            {bottomTab === 'documents' && (
              <div className="space-y-2 text-xs">
                {proofDocuments.length === 0 ? (
                  <p className="text-slate-400">No proof documents yet — upload when receiving goods.</p>
                ) : proofDocuments.map((doc, index) => (
                  <div key={`${doc.grnId}-${doc.name}-${index}`} className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2">
                    <div>
                      <p className="font-bold text-blue-700">{doc.grnId}</p>
                      <p className="text-slate-600">{doc.name}</p>
                      <p className="text-[10px] text-slate-500">{doc.date} · {PROOF_TYPE_LABELS[doc.proofType] ?? doc.proofType}</p>
                    </div>
                    <a
                      href={doc.dataUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold hover:bg-blue-100 cursor-pointer shrink-0"
                    >
                      View
                    </a>
                  </div>
                ))}
              </div>
            )}
            {bottomTab === 'remarks' && (
              <p className="text-xs text-slate-700">{String(selectedPo.notes || 'No remarks.')}</p>
            )}
          </div>
        </div>
      )}

      <Footer />

      <PurchaseRmReceiveModal
        open={Boolean(receiveModalPoId && receiveModalOrder)}
        order={receiveModalOrder}
        onClose={() => setReceiveModalPoId(null)}
        onSubmit={(payload) => {
          if (receiveModalPoId) handleReceiveSubmit(receiveModalPoId, payload);
        }}
      />
    </>
  );
}
