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
import { useInventoryLookups, resolveWarehouseName } from '@/hooks/use-inventory-lookups';
import { ApiModeBanner } from '@/components/shared/ApiModeBanner';
import { isModuleBootLoading, pickApiListRows } from '@/lib/ui/kpi-loading';
import { apiListEmptyMessage } from '@/lib/services/api-list-ui';
import {
  mapApiStockOutRow,
  mapStockOutPayloadToApi,
} from '@/lib/services/inventory-api-mappers';
import { completeStockOutApi } from '@/lib/services/inventory-api-actions';
import {
  listStockOutRecords,
  getStockOutMetrics,
  createStockOut,
  completeStockOut,
  getWarehouseName,
  listInventory,
  formatMoney,
  sortInventoryRowsNewestFirst,
} from '@/lib/services/inventory-service';

const REASON_CODES = ['Manufacturing', 'Order Fulfillment', 'Damage', 'Expiry', 'Sample', 'Internal Use'];

export function StockOutPage() {
  const appState = useAppStore((s) => s.appState);
  const saveAppState = useAppStore((s) => s.saveAppState);
  const apiMode = isModuleApiMode('stockOut');
  const apiStore = useApiResourceStore('stockOut', mapApiStockOutRow);
  const bootLoading = isModuleBootLoading(apiMode, apiStore.initialized);
  const lookups = useInventoryLookups();
  const [view, setView] = useState<'main' | 'form'>('main');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [warehouseFilter, setWarehouseFilter] = useState('all');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [form, setForm] = useState({
    productId: '', warehouseId: '', qty: '', unitValue: '', date: new Date().toISOString().slice(0, 10),
    sourceType: 'Production', reasonCode: 'Manufacturing', refDocId: '', status: 'Pending', notes: '',
  });

  const records = useMemo(
    () => pickApiListRows(apiMode, apiStore.initialized, apiStore.rows, listStockOutRecords(appState)),
    [apiMode, apiStore.initialized, apiStore.rows, appState],
  );
  const metrics = useMemo(() => {
    if (!apiMode) return getStockOutMetrics(appState);
    let totalQty = 0;
    let totalValue = 0;
    let pendingQty = 0;
    let lostValue = 0;
    records.forEach((item) => {
      const val = Number(item.qty ?? 0) * Number(item.unitValue ?? 0);
      if (String(item.status) === 'Completed') {
        totalQty += Number(item.qty ?? 0);
        totalValue += val;
        if (String(item.sourceType) === 'Damage' || ['Damage', 'Expiry'].includes(String(item.reasonCode))) {
          lostValue += val;
        }
      } else if (String(item.status) === 'Pending') {
        pendingQty += Number(item.qty ?? 0);
      }
    });
    return { totalRuns: records.length, totalQty, totalValue, pendingQty, lostValue };
  }, [apiMode, records, appState]);
  const products = useMemo(
    () => (apiMode ? lookups.products : listInventory(appState)),
    [apiMode, lookups.products, appState],
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
    if (warehouseFilter !== 'all') data = data.filter((r) => String(r.warehouseId) === warehouseFilter);
    if (search) {
      const q = search.toLowerCase();
      data = data.filter((r) => `${r.legacyId ?? ''} ${r.id} ${r.refDocId} ${r.reasonCode}`.toLowerCase().includes(q));
    }
    return sortInventoryRowsNewestFirst(data);
  }, [records, search, statusFilter, warehouseFilter]);

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setWarehouseFilter('all');
  };

  const resetForm = () => {
    setForm({
      productId: '', warehouseId: '', qty: '', unitValue: '', date: new Date().toISOString().slice(0, 10),
      sourceType: 'Production', reasonCode: 'Manufacturing', refDocId: '', status: 'Pending', notes: '',
    });
    setShowAdvanced(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (apiMode) {
      const product = products.find((p) => String(p.id) === form.productId);
      const body = mapStockOutPayloadToApi(
        { ...form, qty: Number(form.qty || 0), unitValue: Number(form.unitValue || 0) },
        product ? String(product.name) : undefined,
      );
      const result = await apiStore.create(body);
      if (!result.ok) {
        toast.error('Operation failed', { module: 'Inventory', description: 'error' in result ? String(result.error) : 'Save failed' });
        return;
      }
      if (form.status === 'Completed') {
        await completeStockOutApi(result.id);
        await apiStore.reload();
        await lookups.reload();
      }
      resetFilters();
      setView('main');
      resetForm();
      return;
    }
    const result = createStockOut(appState, {
      ...form, qty: Number(form.qty || 0), unitValue: Number(form.unitValue || 0),
    });
    if (!result.ok) { toast.error('Operation failed', { module: 'Inventory', description: 'error' in result ? String(result.error) : 'Save failed' }); return; }
    saveAppState();
    setView('main');
    resetForm();
  };

  const handleComplete = async (id: string) => {
    if (apiMode) {
      const result = await completeStockOutApi(id);
      if (!result.ok) {
        toast.error('Operation failed', { module: 'Inventory', description: result.error });
        return;
      }
      await apiStore.reload();
      await lookups.reload();
      return;
    }
    const result = completeStockOut(appState, id);
    if (!result.ok) { toast.error('Operation failed', { module: 'Inventory', description: 'error' in result ? String(result.error) : 'Complete failed' }); return; }
    saveAppState();
  };

  const columns = useMemo<AppTableColumn<Record<string, unknown>>[]>(() => [
    { key: 'id', label: 'ID', render: (row) => <span className="font-mono text-slate-600">{String(row.legacyId ?? row.id)}</span> },
    { key: 'product', label: 'Product', render: (row) => <span className="font-bold text-slate-800">{String(productName(row.productId))}</span> },
    { key: 'warehouse', label: 'Warehouse', render: (row) => whName(String(row.warehouseId)) },
    { key: 'qty', label: 'Qty', render: (row) => Number(row.qty ?? 0) },
    { key: 'unitValue', label: 'Unit Value', render: (row) => formatMoney(Number(row.unitValue ?? 0)) },
    {
      key: 'total',
      label: 'Total',
      render: (row) => formatMoney(Number(row.qty ?? 0) * Number(row.unitValue ?? 0)),
    },
    { key: 'reasonCode', label: 'Reason', render: (row) => String(row.reasonCode ?? '—') },
    { key: 'sourceType', label: 'Source', render: (row) => String(row.sourceType ?? '—') },
    { key: 'refDocId', label: 'Ref', render: (row) => String(row.refDocId ?? '—') },
    { key: 'date', label: 'Date', render: (row) => String(row.date ?? '—') },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={String(row.status ?? 'Pending')} /> },
  ], [productName, whName]);

  return (
    <>
    {apiMode && <ApiModeBanner module="stockOut" error={apiStore.error} />}
    <InventoryListLayout
      title="Stock Out"
      subtitle="Track inventory issues, reasons, and fulfillment runs."
      addLabel="Create Stock Out"
      onAdd={() => { resetForm(); setView('form'); }}
      kpis={[
        { key: 'runs', label: 'Total Runs', value: String(metrics.totalRuns) },
        { key: 'qty', label: 'Total Issued Qty', value: String(metrics.totalQty) },
        { key: 'val', label: 'Total Out Value', value: formatMoney(metrics.totalValue) },
        { key: 'pending', label: 'Pending Stock-Out', value: String(metrics.pendingQty), alert: metrics.pendingQty > 0 },
        { key: 'lost', label: 'Lost/Damaged Value', value: formatMoney(metrics.lostValue), alert: metrics.lostValue > 0 },
      ]}
      bootLoading={bootLoading}
      filters={
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search ref, reason..."
        >
          <FilterSelect label="Status" value={statusFilter} onChange={setStatusFilter}><option value="all">All</option><option value="Pending">Pending</option><option value="Completed">Completed</option></FilterSelect>
          <FilterSelect label="Warehouse" value={warehouseFilter} onChange={setWarehouseFilter}><option value="all">All Warehouses</option>{warehouses.map((w) => <option key={String(w.id)} value={String(w.id)}>{String(w.name)}</option>)}</FilterSelect>
        </FilterBar>
      }
    >
      <AppTable
        columns={columns}
        rows={filtered}
        loading={bootLoading}
        emptyMessage={apiListEmptyMessage(apiStore.loading, apiStore.initialized, 'stock-out records', { totalCount: records.length, filteredCount: filtered.length })}
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
      title="Create Stock Out"
      subtitle="Issue inventory with reason codes and reference documents."
      onSubmit={handleSubmit}
      submitLabel="Save Stock-Out"
      size="lg"
    >
      <div className={FORM_GRID_CLS}>
        <div><label className={FORM_LABEL_CLS}>Product *</label><ProductSelect state={appState} items={apiMode ? products : undefined} value={form.productId} onChange={(v) => setForm({ ...form, productId: v })} required /></div>
        <div><label className={FORM_LABEL_CLS}>Warehouse *</label><WarehouseSelect state={appState} items={apiMode ? warehouses : undefined} value={form.warehouseId} onChange={(v) => setForm({ ...form, warehouseId: v })} required /></div>
        <div><label className={FORM_LABEL_CLS}>Quantity *</label><input required type="number" min={1} className={FORM_INPUT_CLS} value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} /></div>
        <div><label className={FORM_LABEL_CLS}>Unit Value *</label><input required type="number" min={0} step="0.01" className={FORM_INPUT_CLS} value={form.unitValue} onChange={(e) => setForm({ ...form, unitValue: e.target.value })} /></div>
        <div><label className={FORM_LABEL_CLS}>Date</label><DateInput className={`${FORM_INPUT_CLS} cursor-pointer`} value={form.date} onChange={(v) => setForm({ ...form, date: v })} /></div>
        <div><label className={FORM_LABEL_CLS}>Source Type</label><select className={FORM_SELECT_CLS} value={form.sourceType} onChange={(e) => setForm({ ...form, sourceType: e.target.value })}><option>Production</option><option>Sales</option><option>Damage</option><option>Sample</option></select></div>
      </div>
      <AdvancedDetailsToggle open={showAdvanced} onToggle={() => setShowAdvanced(!showAdvanced)} />
      {showAdvanced && (
        <div className={`${FORM_GRID_CLS} pt-4 border-t border-slate-100/80`}>
          <div><label className={FORM_LABEL_CLS}>Reason Code</label><select className={FORM_SELECT_CLS} value={form.reasonCode} onChange={(e) => setForm({ ...form, reasonCode: e.target.value })}>{REASON_CODES.map((r) => <option key={r}>{r}</option>)}</select></div>
          <div><label className={FORM_LABEL_CLS}>Reference Doc ID</label><input className={FORM_INPUT_CLS} value={form.refDocId} onChange={(e) => setForm({ ...form, refDocId: e.target.value })} /></div>
          <div><label className={FORM_LABEL_CLS}>Status</label><select className={FORM_SELECT_CLS} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="Pending">Pending</option><option value="Completed">Completed</option></select></div>
          <div className="md:col-span-2"><label className={FORM_LABEL_CLS}>Notes</label><textarea className={FORM_INPUT_CLS} rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        </div>
      )}
    </AppFormModal>
    </>
  );
}
