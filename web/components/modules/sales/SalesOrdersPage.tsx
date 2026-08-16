'use client';

import { confirmAction } from '@/lib/ui/feedback';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ImagePlus, Plus } from 'lucide-react';
import { InventoryItemThumb } from '@/components/shared/InventoryItemThumb';
import { Footer } from '@/components/layout/Footer';
import { useRegisterModuleActions } from '@/components/layout/ModuleActionsContext';
import { ModuleFilterBar } from '@/components/shared/ModuleFilterBar';
import { FilterTabs } from '@/components/shared/FilterTabs';
import { ModuleKpiSection } from '@/components/shared/ModuleKpiSection';
import { AppTable, type AppTableColumn } from '@/components/shared/AppTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { TableIconAction } from '@/components/shared/TableIconAction';
import { CF_BTN_PRIMARY } from '@/components/modules/crm/customer-form/customer-form-styles';
import { useAppStore } from '@/lib/state/app-store';
import { useLocaleFormat } from '@/hooks/useLocaleFormat';
import { translateStatus, type TranslateFn } from '@/lib/i18n/resolve-label';
import {
  deleteSalesOrder,
  listSalesOrders,
} from '@/lib/services/sales-service';
import { isModuleApiMode } from '@/lib/config/data-source';
import { isKpiBootLoading, pickApiListRows } from '@/lib/ui/kpi-loading';
import { getKpiGridClassName } from '@/lib/ui/kpi-grid';
import { usePaginatedApiResource } from '@/hooks/use-paginated-api-resource';
import { ListPagination } from '@/components/shared/ListPagination';
import { ApiModeBanner } from '@/components/shared/ApiModeBanner';
import { mapApiSalesOrderRow, resolveApiRowId } from '@/lib/services/entity-api-mappers';
import type { PoLineItem } from '@/lib/services/purchases-service';

function summarizeItems(row: Record<string, unknown>, t: TranslateFn): string {
  const items = Array.isArray(row.items) ? (row.items as PoLineItem[]) : [];
  if (items.length) {
    const active = items.filter((i) => String(i.description ?? (i as Record<string, unknown>).name ?? '').trim() || i.productId);
    if (!active.length) return '—';
    if (active.length === 1) {
      const desc = active[0].description || String((active[0] as Record<string, unknown>).name ?? t('sales.one_item'));
      return desc;
    }
    const first = active[0].description || String((active[0] as Record<string, unknown>).name ?? t('sales.item_label'));
    return t('sales.items_more', { first, n: active.length - 1 });
  }
  return '—';
}

function orderKpis(
  rows: Record<string, unknown>[],
  t: TranslateFn,
  formatMoney: (n: number) => string,
  formatCount: (n: number) => string,
) {
  const total = rows.reduce((s, r) => s + Number(r.total ?? 0), 0);
  const open = rows.filter((r) => !['fulfilled', 'cancelled'].includes(String(r.status).toLowerCase())).length;
  const fulfilled = rows.filter((r) => String(r.status).toLowerCase() === 'fulfilled').length;
  return [
    { key: 'count', label: t('sales.orders_kpi_total'), value: formatCount(rows.length) },
    { key: 'open', label: t('sales.orders_kpi_open'), value: formatCount(open) },
    { key: 'value', label: t('sales.kpi_total_value'), value: formatMoney(total) },
    { key: 'fulfilled', label: t('sales.orders_kpi_fulfilled'), value: formatCount(fulfilled) },
  ];
}

export function SalesOrdersPage() {
  const router = useRouter();
  const t = useAppStore((s) => s.t);
  const appState = useAppStore((s) => s.appState);
  const saveAppState = useAppStore((s) => s.saveAppState);
  const apiMode = isModuleApiMode('salesOrders');
  const apiStore = usePaginatedApiResource('salesOrders', mapApiSalesOrderRow, { pageSize: 25 });
  const bootLoading = isKpiBootLoading(apiMode, apiStore.initialized);
  const { formatMoney, formatCount } = useLocaleFormat();
  const [localSearch, setLocalSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const statusTabs = useMemo(() => [
    { id: 'all', label: t('common.all') },
    { id: 'draft', label: translateStatus(t, 'draft') },
    { id: 'confirmed', label: translateStatus(t, 'confirmed') },
    { id: 'processing', label: translateStatus(t, 'processing') },
    { id: 'fulfilled', label: translateStatus(t, 'fulfilled') },
  ], [t]);

  const allRows = useMemo(() => {
    const local = listSalesOrders(appState);
    return pickApiListRows(apiMode, apiStore.initialized, apiStore.rows, local);
  }, [apiMode, apiStore.initialized, apiStore.rows, appState]);

  const rows = useMemo(() => {
    let data = allRows;
    const q = (apiMode ? apiStore.search : localSearch).toLowerCase().trim();
    if (q) {
      data = data.filter((row) =>
        `${row.id} ${row.customer} ${summarizeItems(row, t)}`.toLowerCase().includes(q),
      );
    }
    if (statusFilter !== 'all') {
      data = data.filter((row) => String(row.status).toLowerCase() === statusFilter);
    }
    return data;
  }, [allRows, apiMode, apiStore.search, localSearch, statusFilter, t]);

  const listTotal = apiMode ? apiStore.meta.total : rows.length;
  const listPage = apiMode ? apiStore.page : 1;
  const pageSize = apiStore.pageSize;

  const kpis = useMemo(() => orderKpis(allRows, t, formatMoney, formatCount), [allRows, t, formatMoney, formatCount]);

  const columns = useMemo<AppTableColumn<Record<string, unknown>>[]>(() => [
    {
      key: 'attachment',
      label: '',
      className: 'w-12',
      render: (row) => (
        <InventoryItemThumb
          imageUrl={String(row.attachmentUrl ?? (row.meta as Record<string, unknown> | undefined)?.attachmentUrl ?? '')}
          alt=""
          fallback={(
            <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-slate-100 text-slate-400">
              <ImagePlus className="w-4 h-4" />
            </span>
          )}
        />
      ),
    },
    {
      key: 'id',
      label: t('sales.col_order_number'),
      render: (row) => <span className="font-bold text-slate-900">{String(row.id)}</span>,
    },
    {
      key: 'customer',
      label: t('sales.col_customer'),
      render: (row) => String(row.customer ?? row.customerName ?? '—'),
    },
    {
      key: 'items',
      label: t('common.items'),
      render: (row) => <span className="text-slate-600">{summarizeItems(row, t)}</span>,
    },
    {
      key: 'total',
      label: t('sales.col_total'),
      render: (row) => <span className="font-bold">{formatMoney(Number(row.total ?? 0))}</span>,
    },
    {
      key: 'date',
      label: t('sales.col_date'),
      render: (row) => String(row.date ?? '—'),
    },
    {
      key: 'status',
      label: t('sales.col_status'),
      render: (row) => <StatusBadge status={String(row.status)} />,
    },
  ], [t, formatMoney]);

  const handleDelete = async (row: Record<string, unknown>) => {
    const id = String(row.id);
    const __ok = await confirmAction({
      title: t('sales.delete_order'),
      message: t('common.delete_confirm'),
      confirmLabel: t('common.delete'),
      tone: 'danger',
      module: t('sales.orders_title'),
    });
    if (!__ok) return;
    if (apiMode) {
      await apiStore.remove(resolveApiRowId(row));
      return;
    }
    deleteSalesOrder(appState, id);
    saveAppState();
  };

  useRegisterModuleActions(
    <button
      type="button"
      onClick={() => router.push('/sales/orders/new')}
      className={CF_BTN_PRIMARY}
    >
      <Plus className="w-4 h-4" /> {t('sales.create_order')}
    </button>,
    [router, t],
  );

  return (
    <>
      {apiMode ? <ApiModeBanner module="salesOrders" error={apiStore.error} /> : null}

      <ModuleKpiSection items={kpis} loading={bootLoading} gridClassName={getKpiGridClassName(4)} kpiCount={4} />

      <ModuleFilterBar
        search={apiMode ? apiStore.search : localSearch}
        onSearchChange={(v) => {
          if (apiMode) apiStore.setSearchTerm(v);
          else setLocalSearch(v);
          if (apiMode) apiStore.setPage(1);
        }}
        searchPlaceholder={t('sales.search_orders_placeholder')}
        filters={<FilterTabs tabs={statusTabs} active={statusFilter} onChange={(v) => { setStatusFilter(v); if (apiMode) apiStore.setPage(1); }} />}
      />

      <div className="mt-4 premium-card overflow-hidden">
        <AppTable
          columns={columns}
          rows={rows}
          loading={bootLoading}
          rowKey={(row) => String(row.id)}
          emptyMessage={apiStore.loading ? 'Loading orders…' : t('sales.no_orders')}
          renderActions={(row) => (
            <div className="flex items-center gap-2">
              <TableIconAction variant="edit" onClick={() => router.push(`/sales/orders/${String(row.id)}/edit`)} />
              <TableIconAction variant="delete" onClick={() => handleDelete(row)} />
            </div>
          )}
        />
      </div>

      {apiMode ? (
        <ListPagination
          page={listPage}
          pageSize={pageSize}
          total={listTotal}
          onPageChange={apiStore.setPage}
        />
      ) : null}

      <Footer />
    </>
  );
}
