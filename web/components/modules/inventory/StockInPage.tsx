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
  mapApiStockInRow,
  mapStockInPayloadToApi,
} from '@/lib/services/inventory-api-mappers';
import { approveStockInApi } from '@/lib/services/inventory-api-actions';
import {
  listStockInRecords,
  getStockInMetrics,
  createStockIn,
  approveStockIn,
  getWarehouseName,
  listInventory,
  formatMoney,
  sortInventoryRowsNewestFirst,
} from '@/lib/services/inventory-service';

export function StockInPage() {
  const appState = useAppStore((s) => s.appState);
  const saveAppState = useAppStore((s) => s.saveAppState);
  const apiMode = isModuleApiMode('stockIn');
  const apiStore = usePaginatedApiResource('stockIn', mapApiStockInRow, { pageSize: 25 });
  const productOptions = useApiResourceStore('products', mapApiProductRow, { pageOnly: true, lookupLimit: 100 });
  const bootLoading = isModuleBootLoading(apiMode, apiStore.initialized);
  const lookups = useInventoryLookups();
  const [view, setView] = useState<'main' | 'form'>('main');
  const [localSearch, setLocalSearch] = useState('');
  const [localPage, setLocalPage] = useState(1);
  const [localPageSize, setLocalPageSize] = useState(25);
  const [statusFilter, setStatusFilter] = useState('all');
  const [warehouseFilter, setWarehouseFilter] = useState('all');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [form, setForm] = useState({
    productId: '', warehouseId: '', qty: '', unitCost: '', date: new Date().toISOString().slice(0, 10),
    sourceType: 'Purchase', refDocId: '', supplier: '', status: 'Pending', batchNumber: '', expiryDate: '', notes: '',
  });

  const records = useMemo(
    () => pickApiListRows(apiMode, apiStore.initialized, apiStore.rows, listStockInRecords(appState)),
    [apiMode, apiStore.initialized, apiStore.rows, appState],
  );
  const metrics = useMemo(() => {
    const list = records;
    const totalQty = list.reduce((s, i) => s + Number(i.qty ?? 0), 0);
    const totalVal = list.reduce((s, i) => s + Number(i.qty ?? 0) * Number(i.unitCost ?? 0), 0);
    const pending = list.filter((i) => String(i.status) === 'Pending').length;
    return { totalRuns: apiMode ? apiStore.meta.total : list.length, totalQty, totalVal, pending };
  }, [records, apiMode, apiStore.meta.total]);
  const products = useMemo(
    () => (apiMode ? productOptions.rows : listInventory(appState)),
    [apiMode, productOptions.rows, appState],
  );
  const warehouses = useMemo(
    () => (apiMode ? lookups.warehouses : appState.inventoryWarehouses ?? []),
    [apiMode, lookups.warehouses, appState.inventoryWarehouses],
  );
  const whName = (id: string) => (apiMode ? resolveWarehouseName(lookups.warehouses, id) : getWarehouseName(appState, id));

  const filtered = useMemo(() => {
    let data = records;
    if (statusFilter !== 'all') data = data.filter((r) => String(r.status) === statusFilter);
    if (warehouseFilter !== 'all') data = data.filter((r) => String(r.warehouseId) === warehouseFilter);
    const q = (apiMode ? apiStore.search : localSearch).toLowerCase().trim();
    if (q) {
      data = data.filter((r) => `${r.legacyId ?? ''} ${r.id} ${r.refDocId} ${r.supplier}`.toLowerCase().includes(q));
    }
    if (!apiMode) return sortInventoryRowsNewestFirst(data);
    return data;
  }, [records, apiMode, apiStore.search, localSearch, statusFilter, warehouseFilter]);

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

  const totalValue = Number(form.qty || 0) * Number(form.unitCost || 0);

  const productName = (id: unknown) => products.find((p) => String(p.id) === String(id))?.name ?? String(id);

  const resetFilters = () => {
    if (apiMode) apiStore.setSearchTerm('');
    else setLocalSearch('');
    setStatusFilter('all');
    setWarehouseFilter('all');
    onPageChange(1);
  };

  const resetForm = () => {
    setForm({
      productId: '', warehouseId: '', qty: '', unitCost: '', date: new Date().toISOString().slice(0, 10),
      sourceType: 'Purchase', refDocId: '', supplier: '', status: 'Pending', batchNumber: '', expiryDate: '', notes: '',
    });
    setShowAdvanced(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (apiMode) {
      const product = products.find((p) => String(p.id) === form.productId);
      const body = mapStockInPayloadToApi(
        { ...form, qty: Number(form.qty || 0), unitCost: Number(form.unitCost || 0) },
        product ? String(product.name) : undefined,
      );
      const result = await apiStore.create(body);
      if (!result.ok) {
        toast.error('Operation failed', { module: 'Inventory', description: 'error' in result ? String(result.error) : 'Save failed' });
        return;
      }
      if (form.status === 'Approved') {
        await approveStockInApi(result.id);
        await apiStore.reload();
        await lookups.reload();
      }
      resetFilters();
      setView('main');
      resetForm();
      return;
    }
    const result = createStockIn(appState, {
      ...form, qty: Number(form.qty || 0), unitCost: Number(form.unitCost || 0),
    });
    if (!result.ok) { toast.error('Operation failed', { module: 'Inventory', description: 'error' in result ? String(result.error) : 'Save failed' }); return; }
    saveAppState();
    setView('main');
    resetForm();
  };

  const handleApprove = async (id: string) => {
    if (apiMode) {
      const result = await approveStockInApi(id);
      if (!result.ok) {
        toast.error('Operation failed', { module: 'Inventory', description: result.error });
        return;
      }
      await apiStore.reload();
      await lookups.reload();
      return;
    }
    const result = approveStockIn(appState, id);
    if (!result.ok) { toast.error('Operation failed', { module: 'Inventory', description: 'error' in result ? String(result.error) : 'Approve failed' }); return; }
    saveAppState();
  };

  const columns = useMemo<AppTableColumn<Record<string, unknown>>[]>(() => [
    { key: 'id', label: 'ID', render: (row) => <span className="font-mono text-slate-600">{String(row.legacyId ?? row.id)}</span> },
    { key: 'product', label: 'Product', render: (row) => <span className="font-bold text-slate-800">{String(productName(row.productId))}</span> },
    { key: 'warehouse', label: 'Warehouse', render: (row) => whName(String(row.warehouseId)) },
    { key: 'qty', label: 'Qty', render: (row) => Number(row.qty ?? 0) },
    { key: 'unitCost', label: 'Unit Cost', render: (row) => formatMoney(Number(row.unitCost ?? 0)) },
    {
      key: 'total',
      label: 'Total',
      render: (row) => formatMoney(Number(row.qty ?? 0) * Number(row.unitCost ?? 0)),
    },
    { key: 'sourceType', label: 'Source', render: (row) => String(row.sourceType ?? '—') },
    { key: 'refDocId', label: 'Ref Doc', render: (row) => String(row.refDocId ?? '—') },
    { key: 'date', label: 'Date', render: (row) => String(row.date ?? '—') },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={String(row.status ?? 'Pending')} /> },
  ], [products, whName]);

  return (
    <>
    {apiMode && <ApiModeBanner module="stockIn" error={apiStore.error} />}
    <InventoryListLayout
      title="Stock In"
      subtitle="Record and verify incoming inventory runs."
      addLabel="Create Stock In"
      onAdd={() => { resetForm(); setView('form'); }}
      kpis={[
        { key: 'runs', label: 'Total Stock-In Runs', value: `${metrics.totalRuns} runs` },
        { key: 'qty', label: 'Total Incoming Qty', value: `${metrics.totalQty.toLocaleString()} units` },
        { key: 'val', label: 'Total Stock-In Value', value: formatMoney(metrics.totalVal) },
        { key: 'pending', label: 'Pending Verification', value: `${metrics.pending} pending`, alert: metrics.pending > 0 },
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
          searchPlaceholder="Search ref, supplier..."
        >
          <FilterSelect label="Status" value={statusFilter} onChange={(v) => { setStatusFilter(v); onPageChange(1); }}><option value="all">All</option><option value="Pending">Pending</option><option value="Approved">Approved</option></FilterSelect>
          <FilterSelect label="Warehouse" value={warehouseFilter} onChange={(v) => { setWarehouseFilter(v); onPageChange(1); }}><option value="all">All Warehouses</option>{warehouses.map((w) => <option key={String(w.id)} value={String(w.id)}>{String(w.name)}</option>)}</FilterSelect>
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
        emptyMessage={apiListEmptyMessage(apiStore.loading, apiStore.initialized, 'stock-in records', { totalCount: records.length, filteredCount: filtered.length })}
        renderActions={(row) => (
          String(row.status) === 'Pending' ? (
            <TableIconAction variant="approve" onClick={() => handleApprove(String(row.id))} />
          ) : null
        )}
      />
    </InventoryListLayout>
    <AppFormModal
      open={view === 'form'}
      onClose={() => { setView('main'); resetForm(); }}
      title="Create Stock In"
      subtitle="Record incoming inventory with product, warehouse, and cost details."
      onSubmit={handleSubmit}
      submitLabel="Save Stock-In"
      size="lg"
    >
      <div className={FORM_GRID_CLS}>
        <div><label className={FORM_LABEL_CLS}>Product *</label><ProductSelect state={appState} items={apiMode ? products : undefined} value={form.productId} onChange={(v) => setForm({ ...form, productId: v })} required /></div>
        <div><label className={FORM_LABEL_CLS}>Warehouse *</label><WarehouseSelect state={appState} items={apiMode ? warehouses : undefined} value={form.warehouseId} onChange={(v) => setForm({ ...form, warehouseId: v })} required /></div>
        <div><label className={FORM_LABEL_CLS}>Quantity *</label><input required type="number" min={1} className={FORM_INPUT_CLS} value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} /></div>
        <div><label className={FORM_LABEL_CLS}>Unit Cost *</label><input required type="number" min={0} step="0.01" className={FORM_INPUT_CLS} value={form.unitCost} onChange={(e) => setForm({ ...form, unitCost: e.target.value })} /></div>
        <div><label className={FORM_LABEL_CLS}>Date</label><DateInput className={`${FORM_INPUT_CLS} cursor-pointer`} value={form.date} onChange={(v) => setForm({ ...form, date: v })} /></div>
        <div><label className={FORM_LABEL_CLS}>Source Type</label><select className={FORM_SELECT_CLS} value={form.sourceType} onChange={(e) => setForm({ ...form, sourceType: e.target.value })}><option>Purchase</option><option>Production</option><option>Return</option><option>Transfer</option></select></div>
        <div className="md:col-span-2 bg-emerald-50/80 border border-emerald-200/80 rounded-xl p-4"><span className="text-[11px] font-bold uppercase tracking-wide text-emerald-700">Total Value</span><p className="text-lg font-bold text-emerald-700 mt-1">{formatMoney(totalValue)}</p></div>
      </div>
      <AdvancedDetailsToggle open={showAdvanced} onToggle={() => setShowAdvanced(!showAdvanced)} />
      {showAdvanced && (
        <div className={`${FORM_GRID_CLS} pt-4 border-t border-slate-100/80`}>
          <div><label className={FORM_LABEL_CLS}>Reference Doc ID</label><input className={FORM_INPUT_CLS} value={form.refDocId} onChange={(e) => setForm({ ...form, refDocId: e.target.value })} /></div>
          <div><label className={FORM_LABEL_CLS}>Supplier</label><input className={FORM_INPUT_CLS} value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} /></div>
          <div><label className={FORM_LABEL_CLS}>Batch Number</label><input className={FORM_INPUT_CLS} value={form.batchNumber} onChange={(e) => setForm({ ...form, batchNumber: e.target.value })} /></div>
          <div><label className={FORM_LABEL_CLS}>Expiry Date</label><DateInput className={`${FORM_INPUT_CLS} cursor-pointer`} value={form.expiryDate} onChange={(v) => setForm({ ...form, expiryDate: v })} /></div>
          <div><label className={FORM_LABEL_CLS}>Status</label><select className={FORM_SELECT_CLS} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="Pending">Pending</option><option value="Approved">Approved</option></select></div>
          <div className="md:col-span-2"><label className={FORM_LABEL_CLS}>Notes</label><textarea className={FORM_INPUT_CLS} rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        </div>
      )}
    </AppFormModal>
    </>
  );
}
