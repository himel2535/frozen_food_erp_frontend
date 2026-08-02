'use client';

import { toast, confirmAction } from '@/lib/ui/feedback';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus } from 'lucide-react';
import { Footer } from '@/components/layout/Footer';
import { FilterTabs } from '@/components/shared/FilterTabs';
import { KpiCards } from '@/components/shared/KpiCards';
import { AppTable, type AppTableColumn } from '@/components/shared/AppTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { TableIconAction } from '@/components/shared/TableIconAction';
import { MODULE_LIST_SHELL } from '@/lib/ui/module-layout';
import { useAppStore } from '@/lib/state/app-store';
import { getCustomerList } from '@/lib/services/crm-service';
import {
  buildChallanItemsFromOrder,
  createDelivery,
  getCustomerDeliveryDefaults,
  getSalesOrdersForCustomer,
  listDeliveries,
  previewChallanNumber,
  resolveChallanCustomerLabel,
  updateDelivery,
} from '@/lib/services/sales-service';
import {
  DeliveryChallanForm,
  EMPTY_DELIVERY_CHALLAN_FORM,
  type DeliveryChallanPayload,
  type DeliveryChallanSaveAction,
} from '@/components/modules/sales/DeliveryChallanForm';
import type { DeliveryChallanFormValues, DeliveryChallanLineItem } from '@/components/modules/sales/delivery-challan-form/dc-form-types';
import { DeliveryChallanPrint } from '@/components/modules/sales/delivery-challan-form/DeliveryChallanPrint';
import { deleteFromState } from '@/lib/services/domain-service';

const STATUS_TABS = [
  { id: 'all', label: 'All' },
  { id: 'draft', label: 'Draft' },
  { id: 'dispatched', label: 'Dispatched' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'cancelled', label: 'Cancelled' },
];

function buildEmptyForm(warehouseId: string): DeliveryChallanFormValues {
  return { ...EMPTY_DELIVERY_CHALLAN_FORM, warehouseId };
}

function recordToFormValues(record: Record<string, unknown>, warehouseFallback: string): DeliveryChallanFormValues {
  const items = (Array.isArray(record.items) ? record.items : []) as DeliveryChallanLineItem[];
  return {
    date: String(record.date ?? new Date().toISOString().slice(0, 10)),
    customerId: String(record.customerId ?? ''),
    customerName: String(record.customerName ?? record.customer ?? ''),
    orderId: String(record.orderId ?? ''),
    deliveryAddress: String(record.deliveryAddress ?? ''),
    contactPerson: String(record.contactPerson ?? ''),
    contactPhone: String(record.contactPhone ?? ''),
    expectedDeliveryDate: String(record.expectedDeliveryDate ?? ''),
    deliveryMethod: String(record.deliveryMethod ?? 'By Our Transport'),
    vehicleNo: String(record.vehicleNo ?? ''),
    driverName: String(record.driverName ?? ''),
    driverPhone: String(record.driverPhone ?? ''),
    warehouseId: String(record.warehouseId ?? warehouseFallback),
    attachmentName: String(record.attachmentName ?? ''),
    notes: String(record.notes ?? ''),
    status: String(record.status ?? 'draft'),
    items,
  };
}

export function DeliveriesPage() {
  const appState = useAppStore((s) => s.appState);
  const saveAppState = useAppStore((s) => s.saveAppState);
  const [view, setView] = useState<'main' | 'form'>('main');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [formValues, setFormValues] = useState<DeliveryChallanFormValues>(EMPTY_DELIVERY_CHALLAN_FORM);
  const [printPayload, setPrintPayload] = useState<{ id: string; data: DeliveryChallanPayload } | null>(null);

  const warehouses = useMemo(
    () => (appState.inventoryWarehouses ?? []).map((w) => ({
      id: String(w.id),
      name: String(w.name),
    })),
    [appState.inventoryWarehouses],
  );

  const customers = useMemo(
    () => getCustomerList(appState).map((c) => ({
      id: String(c.id),
      name: String(c.name ?? ''),
      company: String(c.company ?? ''),
    })),
    [appState],
  );

  const defaultWarehouseId = warehouses.find((w) => w.name.includes('Main'))?.id ?? warehouses[0]?.id ?? '';

  const rows = useMemo(() => {
    let data = listDeliveries(appState);
    if (search) {
      const q = search.toLowerCase();
      data = data.filter((row) =>
        `${row.id} ${resolveChallanCustomerLabel(appState, row)} ${row.orderId}`.toLowerCase().includes(q),
      );
    }
    if (statusFilter !== 'all') {
      data = data.filter((row) => String(row.status).toLowerCase() === statusFilter);
    }
    return data;
  }, [appState, search, statusFilter]);

  const kpis = useMemo(() => {
    const open = rows.filter((r) => !['delivered', 'cancelled'].includes(String(r.status))).length;
    const totalQty = rows.reduce((s, r) => s + Number(r.totalDeliverQty ?? 0), 0);
    return [
      { key: 'count', label: 'Total Deliveries', value: String(rows.length) },
      { key: 'open', label: 'Open', value: String(open) },
      { key: 'qty', label: 'Total Deliver Qty', value: `${totalQty.toLocaleString()} Pcs` },
    ];
  }, [rows]);

  const challanPreviewId = useMemo(
    () => (editingId ? editingId : previewChallanNumber(appState, formValues.date)),
    [appState, editingId, formValues.date],
  );

  const columns = useMemo<AppTableColumn<Record<string, unknown>>[]>(() => [
    { key: 'id', label: 'Challan #', render: (row) => <span className="font-bold text-slate-900">{String(row.id)}</span> },
    { key: 'customer', label: 'Customer', render: (row) => resolveChallanCustomerLabel(appState, row) },
    { key: 'orderId', label: 'Order', render: (row) => String(row.orderId ?? '—') },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={String(row.status)} /> },
  ], [appState]);

  const resetForm = () => {
    setFormValues(buildEmptyForm(defaultWarehouseId));
    setEditingId(null);
    setFormKey((k) => k + 1);
  };

  const openCreate = () => {
    resetForm();
    setView('form');
  };

  const openEdit = (row: Record<string, unknown>) => {
    setEditingId(String(row.id));
    setFormValues(recordToFormValues(row, defaultWarehouseId));
    setFormKey((k) => k + 1);
    setView('form');
  };

  const handleCustomerChange = (customerId: string) => {
    if (!customerId) return;
    const customer = customers.find((c) => c.id === customerId);
    const customerName = customer
      ? `${customer.name}${customer.company ? ` (${customer.company})` : ''}`
      : '';
    const defaults = getCustomerDeliveryDefaults(appState, customerId);
    setFormValues((prev) => ({
      ...prev,
      ...defaults,
      customerId,
      customerName,
      orderId: '',
      items: [],
    }));
  };

  const handleOrderChange = (orderId: string, customerId: string) => {
    if (!orderId) {
      setFormValues((prev) => ({ ...prev, orderId: '', items: [] }));
      return;
    }
    const customer = customers.find((c) => c.id === customerId);
    const order = getSalesOrdersForCustomer(
      appState,
      customerId,
      customer?.name,
      customer?.company,
    ).find((o) => String(o.id) === orderId);
    const items = buildChallanItemsFromOrder(appState, orderId, editingId ?? undefined) as DeliveryChallanLineItem[];
    setFormValues((prev) => ({
      ...prev,
      orderId,
      items,
      deliveryAddress: String(order?.deliveryAddress ?? prev.deliveryAddress),
      contactPerson: String(order?.contactPerson ?? prev.contactPerson),
      contactPhone: String(order?.contactPhone ?? prev.contactPhone),
    }));
  };

  const persistChallan = (payload: DeliveryChallanPayload, action: DeliveryChallanSaveAction) => {
    const record = {
      ...payload,
      customer: payload.customerName,
      id: editingId ?? undefined,
    };
    const result = editingId
      ? updateDelivery(appState, editingId, record)
      : createDelivery(appState, record);
    if (!result.ok) {
      toast.error('Operation failed', { module: 'Delivery Challan', description: 'error' in result ? String(result.error) : 'Save failed' });
      return null;
    }
    saveAppState();
    const savedId = editingId ?? ('id' in result ? result.id : previewChallanNumber(appState, payload.date));
    return savedId;
  };

  const handleSave = (payload: DeliveryChallanPayload, action: DeliveryChallanSaveAction) => {
    const savedId = persistChallan(payload, action);
    if (!savedId) return;
    if (action === 'print') {
      setPrintPayload({ id: savedId, data: payload });
      return;
    }
    setView('main');
    resetForm();
  };

  const handlePrint = (payload: DeliveryChallanPayload) => {
    setPrintPayload({ id: challanPreviewId, data: payload });
  };

  useEffect(() => {
    if (!printPayload) return;
    document.body.classList.add('print-challan-active');
    let cancelled = false;
    const runPrint = async () => {
      try {
        await document.fonts.ready;
      } catch {
        /* fonts API unavailable */
      }
      await new Promise((resolve) => window.setTimeout(resolve, 300));
      if (!cancelled) window.print();
    };
    void runPrint();
    const onAfterPrint = () => {
      document.body.classList.remove('print-challan-active');
      setPrintPayload(null);
    };
    window.addEventListener('afterprint', onAfterPrint);
    return () => {
      cancelled = true;
      window.removeEventListener('afterprint', onAfterPrint);
      document.body.classList.remove('print-challan-active');
    };
  }, [printPayload]);

  const handleDelete = async (id: string) => {
    const __ok = await confirmAction({ title: "Delete this challan", message: "Delete this challan?", confirmLabel: 'Delete', tone: 'danger', module: 'Delivery Challan' }); if (!__ok) return;
    deleteFromState(appState, 'salesDeliveries', id);
    saveAppState();
  };

  const printPortal =
    printPayload && typeof document !== 'undefined'
      ? createPortal(
          <div className="delivery-challan-print-root hidden print:block bg-white">
            <DeliveryChallanPrint challanId={printPayload.id} data={printPayload.data} />
          </div>,
          document.body,
        )
      : null;

  if (view === 'form') {
    return (
      <>
        <DeliveryChallanForm
          key={formKey}
          mode={editingId ? 'edit' : 'create'}
          initialValues={formValues}
          challanPreviewId={challanPreviewId}
          appState={appState}
          customers={customers}
          warehouses={warehouses}
          onCustomerChange={handleCustomerChange}
          onOrderChange={handleOrderChange}
          onCancel={() => { setView('main'); resetForm(); }}
          onSave={handleSave}
          onPrint={handlePrint}
        />
        {printPortal}
      </>
    );
  }

  return (
    <>
      <div className={MODULE_LIST_SHELL}>
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Delivery Challan</h2>
            <p className="text-xs text-slate-500 mt-1 font-medium">Create delivery challans linked to sales orders.</p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2 cursor-pointer self-start"
          >
            <Plus className="w-4 h-4" /> New Challan
          </button>
        </div>

        <KpiCards items={kpis} />

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 premium-shadow space-y-4">
          <FilterTabs tabs={STATUS_TABS} active={statusFilter} onChange={setStatusFilter} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search challan, customer, order..."
            className="w-full max-w-md px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 font-medium"
          />
        </div>

        <AppTable
          columns={columns}
          rows={rows}
          emptyMessage="No delivery challans found."
          renderActions={(row) => (
            <>
              <TableIconAction variant="edit" onClick={() => openEdit(row)} />
              <TableIconAction
                variant="view"
                onClick={() => {
                  const data = recordToFormValues(row, defaultWarehouseId);
                  setPrintPayload({
                    id: String(row.id),
                    data: {
                      ...data,
                      warehouseName: warehouses.find((w) => w.id === data.warehouseId)?.name ?? '',
                      preparedBy: String(row.preparedBy ?? 'Sarah Connor'),
                      authorizedBy: String(row.authorizedBy ?? 'John Wick'),
                      totalItems: Number(row.totalItems ?? 0),
                      totalDeliverQty: Number(row.totalDeliverQty ?? 0),
                    },
                  });
                }}
              />
              <TableIconAction variant="delete" onClick={() => handleDelete(String(row.id))} />
            </>
          )}
        />

        <Footer />
      </div>

      {printPortal}
    </>
  );
}
