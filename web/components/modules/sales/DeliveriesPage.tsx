'use client';

import { toast, confirmAction } from '@/lib/ui/feedback';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus } from 'lucide-react';
import { Footer } from '@/components/layout/Footer';
import { useChromeSuppressed, useRegisterModuleActions } from '@/components/layout/ModuleActionsContext';
import { FilterTabs } from '@/components/shared/FilterTabs';
import { ModuleKpiSection } from '@/components/shared/ModuleKpiSection';
import { ModuleFilterBar } from '@/components/shared/ModuleFilterBar';
import { AppTable, type AppTableColumn } from '@/components/shared/AppTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { TableIconAction } from '@/components/shared/TableIconAction';
import { useAppStore } from '@/lib/state/app-store';
import { useLocaleFormat } from '@/hooks/useLocaleFormat';
import { translateStatus } from '@/lib/i18n/resolve-label';
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
import { isModuleApiMode } from '@/lib/config/data-source';
import { useApiResourceStore } from '@/hooks/use-api-resource-store';
import { mapApiSalesDocRow, mapDeliveryToApi, resolveApiRowId } from '@/lib/services/entity-api-mappers';
import { ApiModeBanner } from '@/components/shared/ApiModeBanner';
import { isModuleBootLoading, pickApiListRows } from '@/lib/ui/kpi-loading';
import { getKpiGridClassName } from '@/lib/ui/kpi-grid';
import { useCustomersOptions } from '@/hooks/use-form-options';

const statusTabsFor = (t: (key: string) => string) => [
  { id: 'all', label: t('common.all') },
  { id: 'draft', label: translateStatus(t, 'draft') },
  { id: 'dispatched', label: translateStatus(t, 'dispatched') },
  { id: 'delivered', label: translateStatus(t, 'delivered') },
  { id: 'cancelled', label: translateStatus(t, 'cancelled') },
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
    attachmentUrl: String(record.attachmentUrl ?? ''),
    notes: String(record.notes ?? ''),
    status: String(record.status ?? 'draft'),
    items,
  };
}

export function DeliveriesPage() {
  const t = useAppStore((s) => s.t);
  const { formatMoney, formatNumber, formatCount } = useLocaleFormat();
  const appState = useAppStore((s) => s.appState);
  const saveAppState = useAppStore((s) => s.saveAppState);
  const apiMode = isModuleApiMode('deliveries');
  const apiStore = useApiResourceStore('deliveries', mapApiSalesDocRow);
  const bootLoading = isModuleBootLoading(apiMode, apiStore.initialized);
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

  const customers = useCustomersOptions();

  const defaultWarehouseId = warehouses.find((w) => w.name.includes('Main'))?.id ?? warehouses[0]?.id ?? '';

  const allDeliveryRows = useMemo(() => {
    const local = listDeliveries(appState);
    return pickApiListRows(apiMode, apiStore.initialized, apiStore.rows, local);
  }, [apiMode, apiStore.initialized, apiStore.rows, appState]);

  const rows = useMemo(() => {
    let data = allDeliveryRows;
    if (search) {
      const q = search.toLowerCase();
      data = data.filter((row) =>
        `${row.id} ${apiMode ? row.customerName ?? row.customer : resolveChallanCustomerLabel(appState, row)} ${row.orderId}`.toLowerCase().includes(q),
      );
    }
    if (statusFilter !== 'all') {
      data = data.filter((row) => String(row.status).toLowerCase() === statusFilter);
    }
    return data;
  }, [allDeliveryRows, search, statusFilter]);

  const kpis = useMemo(() => {
    const allRows = allDeliveryRows;
    const open = allRows.filter((r) => !['delivered', 'cancelled'].includes(String(r.status).toLowerCase())).length;
    const delivered = allRows.filter((r) => String(r.status).toLowerCase() === 'delivered').length;
    const totalQty = allRows.reduce((s, r) => s + Number(r.totalDeliverQty ?? 0), 0);
    return [
      { key: 'count', label: t('sales.deliveries_kpi_total'), value: formatCount(allRows.length) },
      { key: 'open', label: t('sales.kpi_open'), value: formatCount(open) },
      { key: 'qty', label: t('sales.deliveries_kpi_qty'), value: `${formatNumber(totalQty)} ${t('sales.pcs_suffix')}` },
      { key: 'delivered', label: t('sales.deliveries_kpi_delivered'), value: formatCount(delivered) },
    ];
  }, [allDeliveryRows, t, formatNumber, formatCount]);

  const challanPreviewId = useMemo(
    () => (editingId ? editingId : previewChallanNumber(appState, formValues.date)),
    [appState, editingId, formValues.date],
  );

  const columns = useMemo<AppTableColumn<Record<string, unknown>>[]>(() => [
    { key: 'id', label: t('sales.col_challan_number'), render: (row) => <span className="font-bold text-slate-900">{String(row.id)}</span> },
    { key: 'customer', label: t('sales.col_customer'), render: (row) => resolveChallanCustomerLabel(appState, row) },
    { key: 'orderId', label: t('sales.col_order'), render: (row) => String(row.orderId ?? '—') },
    { key: 'status', label: t('sales.col_status'), render: (row) => <StatusBadge status={String(row.status)} /> },
  ], [appState, t]);

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

  const persistChallan = async (payload: DeliveryChallanPayload, action: DeliveryChallanSaveAction) => {
    const record = {
      ...payload,
      customer: payload.customerName,
      id: editingId ?? undefined,
    };
    if (apiMode) {
      const body = mapDeliveryToApi(record as unknown as Record<string, unknown>, editingId ?? undefined);
      const editRow = editingId ? rows.find((r) => String(r.id) === editingId) : null;
      const result = editingId && editRow
        ? await apiStore.update(resolveApiRowId(editRow), body)
        : await apiStore.create(body);
      if (!result.ok) {
        toast.error('Operation failed', { module: 'Delivery Challan', description: 'error' in result ? String(result.error) : 'Save failed' });
        return null;
      }
      return editingId ?? ('id' in result ? String(result.id) : `DC-${Date.now()}`);
    }
    const result = editingId
      ? updateDelivery(appState, editingId, record)
      : createDelivery(appState, record);
    if (!result.ok) {
      toast.error('Operation failed', { module: 'Delivery Challan', description: 'error' in result ? String(result.error) : 'Save failed' });
      return null;
    }
    saveAppState();
    const savedId = editingId ?? ('id' in result ? String(result.id) : previewChallanNumber(appState, payload.date));
    return savedId;
  };

  const handleSave = async (payload: DeliveryChallanPayload, action: DeliveryChallanSaveAction) => {
    const savedId = await persistChallan(payload, action);
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

  useChromeSuppressed(view !== 'main');

  useRegisterModuleActions(
    view === 'main' ? (
      <button
        type="button"
        onClick={openCreate}
        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2 cursor-pointer self-start"
      >
        <Plus className="w-4 h-4" /> {t('sales.new_challan')}
      </button>
    ) : null,
    [view, openCreate, t],
  );

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
        {apiMode && <ApiModeBanner module="deliveries" />}
        <ModuleKpiSection items={kpis} loading={bootLoading} gridClassName={getKpiGridClassName(4)} kpiCount={4} />

        <ModuleFilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder={t('sales.search_challan')}
          filters={<FilterTabs tabs={statusTabsFor(t)} active={statusFilter} onChange={setStatusFilter} />}
        />

        <AppTable
          columns={columns}
          rows={rows}
          loading={bootLoading}
          emptyMessage={t('sales.no_challans')}
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

      {printPortal}
    </>
  );
}
