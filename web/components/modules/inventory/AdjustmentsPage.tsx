'use client';

import { toast } from '@/lib/ui/feedback';

import { useMemo, useState } from 'react';
import { AppFormModal, FORM_GRID_CLS, FORM_INPUT_CLS, FORM_LABEL_CLS, FORM_SELECT_CLS } from '@/components/shared/AppForm';
import { DateInput } from '@/components/shared/DateInput';
import { AdvancedDetailsToggle } from '@/components/shared/AdvancedDetailsToggle';
import { ProductSelect, WarehouseSelect } from '@/components/modules/inventory/shared/selects';
import { AppTable, type AppTableColumn } from '@/components/shared/AppTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { TableIconAction } from '@/components/shared/TableIconAction';
import { InventoryListLayout, FilterBar, FilterSelect } from '@/components/modules/inventory/shared/inventory-ui';
import { useAppStore } from '@/lib/state/app-store';
import { isModuleApiMode } from '@/lib/config/data-source';
import { useApiResourceStore } from '@/hooks/use-api-resource-store';
import { usePaginatedApiResource } from '@/hooks/use-paginated-api-resource';
import { ListPagination } from '@/components/shared/ListPagination';
import { mapApiProductRow } from '@/lib/services/entity-api-mappers';
import { useInventoryLookups, resolveWarehouseName } from '@/hooks/use-inventory-lookups';
import { ApiModeBanner } from '@/components/shared/ApiModeBanner';
import { isModuleBootLoading, pickApiListRows } from '@/lib/ui/kpi-loading';
import { apiListEmptyMessage } from '@/lib/services/api-list-ui';
import {
  mapApiStockAdjustmentRow,
  mapStockAdjustmentPayloadToApi,
} from '@/lib/services/inventory-api-mappers';
import { approveStockAdjustmentApi } from '@/lib/services/inventory-api-actions';
import {
  listAdjustmentRecords,
  getAdjustmentMetrics,
  createAdjustment,
  approveAdjustment,
  getWarehouseName,
  listInventory,
  formatMoney,
  sortInventoryRowsNewestFirst,
} from '@/lib/services/inventory-service';

export function AdjustmentsPage() {
  const appState = useAppStore((s) => s.appState);
  const saveAppState = useAppStore((s) => s.saveAppState);
  const apiMode = isModuleApiMode('stockAdjustments');
  const apiStore = usePaginatedApiResource('stockAdjustments', mapApiStockAdjustmentRow, { pageSize: 25 });
  const productOptions = useApiResourceStore('products', mapApiProductRow, { pageOnly: true, lookupLimit: 100 });
  const bootLoading = isModuleBootLoading(apiMode, apiStore.initialized);
  const lookups = useInventoryLookups();
  const [view, setView] = useState<'main' | 'form'>('main');
  const [localSearch, setLocalSearch] = useState('');
  const [localPage, setLocalPage] = useState(1);
  const [localPageSize, setLocalPageSize] = useState(25);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [form, setForm] = useState({
    productId: '', warehouseId: '', type: 'Increase', qty: '', unitValue: '', date: new Date().toISOString().slice(0, 10),
    reason: '', status: 'Pending', approvedBy: '', notes: '',
  });

  const records = useMemo(
    () => pickApiListRows(apiMode, apiStore.initialized, apiStore.rows, listAdjustmentRecords(appState)),
    [apiMode, apiStore.initialized, apiStore.rows, appState],
  );
  const metrics = useMemo(() => {
    if (!apiMode) return getAdjustmentMetrics(appState);
    let totalIncreasedQty = 0;
    let totalDecreasedQty = 0;
    let netValue = 0;
    let pendingCount = 0;
    records.forEach((item) => {
      const val = Number(item.qty ?? 0) * Number(item.unitValue ?? 0);
      if (String(item.status) === 'Completed') {
        if (String(item.type) === 'Increase') {
          totalIncreasedQty += Number(item.qty ?? 0);
          netValue += val;
        } else {
          totalDecreasedQty += Number(item.qty ?? 0);
          netValue -= val;
        }
      } else if (String(item.status) === 'Pending') {
        pendingCount += 1;
      }
    });
    return { totalRuns: apiMode ? apiStore.meta.total : records.length, totalIncreasedQty, totalDecreasedQty, netValue, pendingCount };
  }, [apiMode, records, appState, apiStore.meta.total]);
  const products = useMemo(
    () => (apiMode ? productOptions.rows : listInventory(appState)),
    [apiMode, productOptions.rows, appState],
  );
  const warehouses = useMemo(
    () => (apiMode ? lookups.warehouses : appState.inventoryWarehouses ?? []),
    [apiMode, lookups.warehouses, appState.inventoryWarehouses],
  );
  const productName = (id: unknown) => products.find((p) => String(p.id) === String(id))?.name ?? String(id);
  const whName = (id: string) => (apiMode ? resolveWarehouseName(lookups.warehouses, id) : getWarehouseName(appState, id));

  const filtered = useMemo(() => {
    let data = records;
    if (statusFilter !== 'all') data = data.filter((r) => String(r.status) === statusFilter);
    if (typeFilter !== 'all') data = data.filter((r) => String(r.type) === typeFilter);
    const q = (apiMode ? apiStore.search : localSearch).toLowerCase().trim();
    if (q) {
      data = data.filter((r) => `${r.legacyId ?? ''} ${r.id} ${r.reason}`.toLowerCase().includes(q));
    }
    if (!apiMode) return sortInventoryRowsNewestFirst(data);
    return data;
  }, [records, apiMode, apiStore.search, localSearch, statusFilter, typeFilter]);

  const pageSize = apiMode ? apiStore.pageSize : localPageSize;
  const displayRows = apiMode
    ? filtered
    : filtered.slice((localPage - 1) * pageSize, localPage * pageSize);
  const listTotal = apiMode ? apiStore.meta.total : filtered.length;
  const listPage = apiMode ? apiStore.page : localPage;

  const onPageChange = (p: number) => {
    if (apiMode) apiStore.setPage(p);
    else setLocalPage(p);
  };

  const netPrefix = metrics.netValue > 0 ? '+' : '';

  const resetFilters = () => {
    if (apiMode) apiStore.setSearchTerm('');
    else setLocalSearch('');
    setStatusFilter('all');
    setTypeFilter('all');
    onPageChange(1);
  };

  const resetForm = () => {
    setForm({
      productId: '', warehouseId: '', type: 'Increase', qty: '', unitValue: '', date: new Date().toISOString().slice(0, 10),
      reason: '', status: 'Pending', approvedBy: '', notes: '',
    });
    setShowAdvanced(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (apiMode) {
      const product = products.find((p) => String(p.id) === form.productId);
      const body = mapStockAdjustmentPayloadToApi(
        { ...form, qty: Number(form.qty || 0), unitValue: Number(form.unitValue || 0) },
        product ? String(product.name) : undefined,
      );
      const result = await apiStore.create(body);
      if (!result.ok) {
        toast.error('Operation failed', { module: 'Stock Correction', description: 'error' in result ? String(result.error) : 'Save failed' });
        return;
      }
      if (form.status === 'Completed') {
        await approveStockAdjustmentApi(result.id);
        await apiStore.reload();
        await lookups.reload();
      }
      resetFilters();
      setView('main');
      resetForm();
      return;
    }
    const result = createAdjustment(appState, {
      ...form, qty: Number(form.qty || 0), unitValue: Number(form.unitValue || 0),
    });
    if (!result.ok) { toast.error('Operation failed', { module: 'Stock Correction', description: 'error' in result ? String(result.error) : 'Save failed' }); return; }
    saveAppState();
    setView('main');
    resetForm();
  };

  const handleApprove = async (id: string) => {
    if (apiMode) {
      const result = await approveStockAdjustmentApi(id);
      if (!result.ok) {
        toast.error('Operation failed', { module: 'Stock Correction', description: result.error });
        return;
      }
      await apiStore.reload();
      await lookups.reload();
      return;
    }
    const result = approveAdjustment(appState, id);
    if (!result.ok) { toast.error('Operation failed', { module: 'Stock Correction', description: 'error' in result ? String(result.error) : 'Approve failed' }); return; }
    saveAppState();
  };

  const columns = useMemo<AppTableColumn<Record<string, unknown>>[]>(() => [
    { key: 'id', label: 'ID', render: (row) => <span className="font-mono text-slate-600">{String(row.legacyId ?? row.id)}</span> },
    { key: 'product', label: 'Product', render: (row) => <span className="font-bold text-slate-800">{String(productName(row.productId))}</span> },
    { key: 'warehouse', label: 'Warehouse', render: (row) => whName(String(row.warehouseId)) },
    {
      key: 'type',
      label: 'Type',
      render: (row) => {
        const isIncrease = String(row.type) === 'Increase';
        return <span className={`font-bold ${isIncrease ? 'text-emerald-600' : 'text-red-600'}`}>{String(row.type)}</span>;
      },
    },
    { key: 'qty', label: 'Qty', render: (row) => Number(row.qty ?? 0) },
    { key: 'unitValue', label: 'Unit Value', render: (row) => formatMoney(Number(row.unitValue ?? 0)) },
    {
      key: 'impact',
      label: 'Impact',
      render: (row) => {
        const qty = Number(row.qty ?? 0);
        const val = Number(row.unitValue ?? 0);
        const isIncrease = String(row.type) === 'Increase';
        return `${isIncrease ? '+' : '-'}${formatMoney(qty * val)}`;
      },
    },
    { key: 'reason', label: 'Reason', render: (row) => String(row.reason ?? '—') },
    { key: 'date', label: 'Date', render: (row) => String(row.date ?? '—') },
    { key: 'approvedBy', label: 'Approved By', render: (row) => String(row.approvedBy ?? '—') },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={String(row.status ?? 'Pending')} /> },
  ], [productName, whName]);

  return (
    <>
    {apiMode && <ApiModeBanner module="stockAdjustments" error={apiStore.error} />}
    <InventoryListLayout
      title="Stock Adjustments"
      subtitle="Audit and approve inventory quantity corrections."
      addLabel="Create Adjustment"
      onAdd={() => { resetForm(); setView('form'); }}
      kpis={[
        { key: 'total', label: 'Total Adjustments', value: String(metrics.totalRuns) },
        { key: 'inc', label: 'Qty Increased', value: `+${metrics.totalIncreasedQty}` },
        { key: 'dec', label: 'Qty Decreased', value: `-${metrics.totalDecreasedQty}` },
        { key: 'net', label: 'Net Value Impact', value: `${netPrefix}${formatMoney(Math.abs(metrics.netValue))}` },
        { key: 'pending', label: 'Pending Approval', value: String(metrics.pendingCount), alert: metrics.pendingCount > 0 },
      ]}
      bootLoading={bootLoading}
      filters={
        <FilterBar
          search={apiMode ? apiStore.search : localSearch}
          onSearchChange={(v) => {
            if (apiMode) apiStore.setSearchTerm(v);
            else setLocalSearch(v);
            onPageChange(1);
          }}
          searchPlaceholder="Search adjustments..."
        >
          <FilterSelect label="Status" value={statusFilter} onChange={(v) => { setStatusFilter(v); onPageChange(1); }}><option value="all">All</option><option value="Pending">Pending</option><option value="Completed">Completed</option></FilterSelect>
          <FilterSelect label="Type" value={typeFilter} onChange={(v) => { setTypeFilter(v); onPageChange(1); }}><option value="all">All</option><option value="Increase">Increase</option><option value="Decrease">Decrease</option></FilterSelect>
        </FilterBar>
      }
      pagination={
        <ListPagination page={listPage} pageSize={pageSize} total={listTotal} onPageChange={onPageChange} />
      }
    >
      <AppTable
        columns={columns}
        rows={displayRows}
        loading={bootLoading}
        emptyMessage={apiListEmptyMessage(apiStore.loading, apiStore.initialized, 'adjustment records', { totalCount: records.length, filteredCount: filtered.length })}
        renderActions={(row) => (
          String(row.status) === 'Pending' ? (
            <TableIconAction variant="approve" onClick={() => void handleApprove(String(row.id))} />
          ) : null
        )}
      />
    </InventoryListLayout>
    <AppFormModal
      open={view === 'form'}
      onClose={() => { setView('main'); resetForm(); }}
      title="Create Adjustment"
      subtitle="Correct inventory quantities with audit trail."
      onSubmit={handleSubmit}
      submitLabel="Save Adjustment"
      size="lg"
    >
      <div className={FORM_GRID_CLS}>
        <div><label className={FORM_LABEL_CLS}>Product *</label><ProductSelect state={appState} items={apiMode ? products : undefined} value={form.productId} onChange={(v) => setForm({ ...form, productId: v })} required /></div>
        <div><label className={FORM_LABEL_CLS}>Warehouse *</label><WarehouseSelect state={appState} items={apiMode ? warehouses : undefined} value={form.warehouseId} onChange={(v) => setForm({ ...form, warehouseId: v })} required /></div>
        <div><label className={FORM_LABEL_CLS}>Type *</label><select className={FORM_SELECT_CLS} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option value="Increase">Increase</option><option value="Decrease">Decrease</option></select></div>
        <div><label className={FORM_LABEL_CLS}>Quantity *</label><input required type="number" min={1} className={FORM_INPUT_CLS} value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} /></div>
        <div><label className={FORM_LABEL_CLS}>Unit Value</label><input type="number" min={0} step="0.01" className={FORM_INPUT_CLS} value={form.unitValue} onChange={(e) => setForm({ ...form, unitValue: e.target.value })} /></div>
        <div><label className={FORM_LABEL_CLS}>Date</label><DateInput className={`${FORM_INPUT_CLS} cursor-pointer`} value={form.date} onChange={(v) => setForm({ ...form, date: v })} /></div>
      </div>
      <AdvancedDetailsToggle open={showAdvanced} onToggle={() => setShowAdvanced(!showAdvanced)} />
      {showAdvanced && (
        <div className={`${FORM_GRID_CLS} pt-4 border-t border-slate-100/80`}>
          <div><label className={FORM_LABEL_CLS}>Reason</label><input className={FORM_INPUT_CLS} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></div>
          <div><label className={FORM_LABEL_CLS}>Status</label><select className={FORM_SELECT_CLS} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="Pending">Pending</option><option value="Completed">Completed</option></select></div>
          <div className="md:col-span-2"><label className={FORM_LABEL_CLS}>Notes</label><textarea className={FORM_INPUT_CLS} rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        </div>
      )}
    </AppFormModal>
    </>
  );
}
