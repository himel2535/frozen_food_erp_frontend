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
  mapApiStockTransferRow,
  mapStockTransferPayloadToApi,
} from '@/lib/services/inventory-api-mappers';
import { completeStockTransferApi } from '@/lib/services/inventory-api-actions';
import {
  listTransferRecords,
  getTransferMetrics,
  createTransfer,
  completeTransfer,
  getWarehouseName,
  listInventory,
  sortInventoryRowsNewestFirst,
} from '@/lib/services/inventory-service';

export function TransfersPage() {
  const appState = useAppStore((s) => s.appState);
  const saveAppState = useAppStore((s) => s.saveAppState);
  const apiMode = isModuleApiMode('stockTransfers');
  const apiStore = usePaginatedApiResource('stockTransfers', mapApiStockTransferRow, { pageSize: 25 });
  const productOptions = useApiResourceStore('products', mapApiProductRow, { pageOnly: true, lookupLimit: 100 });
  const bootLoading = isModuleBootLoading(apiMode, apiStore.initialized);
  const lookups = useInventoryLookups();
  const [view, setView] = useState<'main' | 'form'>('main');
  const [localSearch, setLocalSearch] = useState('');
  const [localPage, setLocalPage] = useState(1);
  const [localPageSize, setLocalPageSize] = useState(25);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [form, setForm] = useState({
    productId: '', fromWarehouseId: '', toWarehouseId: '', qty: '', date: new Date().toISOString().slice(0, 10), status: 'Pending', notes: '',
  });

  const records = useMemo(
    () => pickApiListRows(apiMode, apiStore.initialized, apiStore.rows, listTransferRecords(appState)),
    [apiMode, apiStore.initialized, apiStore.rows, appState],
  );
  const metrics = useMemo(() => {
    if (!apiMode) return getTransferMetrics(appState);
    const pending = records.filter((i) => String(i.status) === 'Pending').length;
    const completed = records.filter((i) => String(i.status) === 'Completed').length;
    const totalQty = records.reduce((s, i) => s + Number(i.qty ?? 0), 0);
    return { total: apiMode ? apiStore.meta.total : records.length, pending, completed, totalQty };
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
    const q = (apiMode ? apiStore.search : localSearch).toLowerCase().trim();
    if (q) {
      data = data.filter((r) => String(r.id).toLowerCase().includes(q) || String(r.legacyId ?? '').toLowerCase().includes(q));
    }
    if (!apiMode) return sortInventoryRowsNewestFirst(data);
    return data;
  }, [records, apiMode, apiStore.search, localSearch, statusFilter]);

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

  const resetFilters = () => {
    if (apiMode) apiStore.setSearchTerm('');
    else setLocalSearch('');
    setStatusFilter('all');
    onPageChange(1);
  };

  const resetForm = () => {
    setForm({ productId: '', fromWarehouseId: '', toWarehouseId: '', qty: '', date: new Date().toISOString().slice(0, 10), status: 'Pending', notes: '' });
    setShowAdvanced(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (apiMode) {
      const product = products.find((p) => String(p.id) === form.productId);
      const body = mapStockTransferPayloadToApi(
        { ...form, qty: Number(form.qty || 0) },
        product ? String(product.name) : undefined,
      );
      const result = await apiStore.create(body);
      if (!result.ok) {
        toast.error('Operation failed', { module: 'Stock Transfers', description: 'error' in result ? String(result.error) : 'Save failed' });
        return;
      }
      if (form.status === 'Completed') {
        await completeStockTransferApi(result.id);
        await apiStore.reload();
        await lookups.reload();
      }
      resetFilters();
      setView('main');
      resetForm();
      return;
    }
    const result = createTransfer(appState, { ...form, qty: Number(form.qty || 0) });
    if (!result.ok) { toast.error('Operation failed', { module: 'Stock Transfers', description: 'error' in result ? String(result.error) : 'Save failed' }); return; }
    saveAppState();
    setView('main');
    resetForm();
  };

  const handleComplete = async (id: string) => {
    if (apiMode) {
      const result = await completeStockTransferApi(id);
      if (!result.ok) {
        toast.error('Operation failed', { module: 'Stock Transfers', description: result.error });
        return;
      }
      await apiStore.reload();
      await lookups.reload();
      return;
    }
    const result = completeTransfer(appState, id);
    if (!result.ok) { toast.error('Operation failed', { module: 'Stock Transfers', description: 'error' in result ? String(result.error) : 'Complete failed' }); return; }
    saveAppState();
  };

  const columns = useMemo<AppTableColumn<Record<string, unknown>>[]>(() => [
    { key: 'id', label: 'ID', render: (row) => <span className="font-mono text-slate-600">{String(row.legacyId ?? row.id)}</span> },
    { key: 'product', label: 'Product', render: (row) => <span className="font-bold text-slate-800">{String(productName(row.productId))}</span> },
    { key: 'from', label: 'From', render: (row) => whName(String(row.fromWarehouseId ?? row.fromWh)) },
    { key: 'to', label: 'To', render: (row) => whName(String(row.toWarehouseId ?? row.toWh)) },
    { key: 'qty', label: 'Qty', render: (row) => Number(row.qty ?? 0) },
    { key: 'date', label: 'Date', render: (row) => String(row.date ?? '—') },
    { key: 'notes', label: 'Notes', className: 'max-w-[120px] truncate', render: (row) => String(row.notes ?? '—') },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={String(row.status ?? 'Pending')} /> },
  ], [productName, whName]);

  return (
    <>
    {apiMode && <ApiModeBanner module="stockTransfers" error={apiStore.error} />}
    <InventoryListLayout
      title="Stock Transfers"
      subtitle="Move inventory between warehouse locations."
      addLabel="Create Transfer"
      onAdd={() => { resetForm(); setView('form'); }}
      kpis={[
        { key: 'total', label: 'Total Transfers', value: String(metrics.total) },
        { key: 'pending', label: 'Pending', value: String(metrics.pending), alert: metrics.pending > 0 },
        { key: 'completed', label: 'Completed', value: String(metrics.completed) },
        { key: 'qty', label: 'Total Qty Moved', value: String(metrics.totalQty) },
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
          searchPlaceholder="Search transfers..."
        >
          <FilterSelect label="Status" value={statusFilter} onChange={(v) => { setStatusFilter(v); onPageChange(1); }}><option value="all">All</option><option value="Pending">Pending</option><option value="Completed">Completed</option></FilterSelect>
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
        emptyMessage={apiListEmptyMessage(apiStore.loading, apiStore.initialized, 'transfer records', { totalCount: records.length, filteredCount: filtered.length })}
        renderActions={(row) => (
          String(row.status) === 'Pending' ? (
            <TableIconAction variant="approve" label="Complete" onClick={() => void handleComplete(String(row.id))} />
          ) : null
        )}
      />
    </InventoryListLayout>
    <AppFormModal
      open={view === 'form'}
      onClose={() => { setView('main'); resetForm(); }}
      title="Create Transfer"
      subtitle="Move stock from one warehouse to another."
      onSubmit={handleSubmit}
      submitLabel="Save Transfer"
      size="lg"
    >
      <div className={FORM_GRID_CLS}>
        <div><label className={FORM_LABEL_CLS}>Product *</label><ProductSelect state={appState} items={apiMode ? products : undefined} value={form.productId} onChange={(v) => setForm({ ...form, productId: v })} required /></div>
        <div><label className={FORM_LABEL_CLS}>From Warehouse *</label><WarehouseSelect state={appState} items={apiMode ? warehouses : undefined} value={form.fromWarehouseId} onChange={(v) => setForm({ ...form, fromWarehouseId: v })} required /></div>
        <div><label className={FORM_LABEL_CLS}>To Warehouse *</label><WarehouseSelect state={appState} items={apiMode ? warehouses : undefined} value={form.toWarehouseId} onChange={(v) => setForm({ ...form, toWarehouseId: v })} required /></div>
        <div><label className={FORM_LABEL_CLS}>Quantity *</label><input required type="number" min={1} className={FORM_INPUT_CLS} value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} /></div>
        <div><label className={FORM_LABEL_CLS}>Date</label><DateInput className={`${FORM_INPUT_CLS} cursor-pointer`} value={form.date} onChange={(v) => setForm({ ...form, date: v })} /></div>
      </div>
      <AdvancedDetailsToggle open={showAdvanced} onToggle={() => setShowAdvanced(!showAdvanced)} />
      {showAdvanced && (
        <div className={`${FORM_GRID_CLS} pt-4 border-t border-slate-100/80`}>
          <div><label className={FORM_LABEL_CLS}>Status</label><select className={FORM_SELECT_CLS} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="Pending">Pending</option><option value="Completed">Completed</option></select></div>
          <div className="md:col-span-2"><label className={FORM_LABEL_CLS}>Notes</label><textarea className={FORM_INPUT_CLS} rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        </div>
      )}
    </AppFormModal>
    </>
  );
}
