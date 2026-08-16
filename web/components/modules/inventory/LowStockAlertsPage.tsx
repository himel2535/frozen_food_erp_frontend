'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Package } from 'lucide-react';
import { Footer } from '@/components/layout/Footer';
import { ModuleFilterBar } from '@/components/shared/ModuleFilterBar';
import { ModuleKpiSection } from '@/components/shared/ModuleKpiSection';
import { AppTable, type AppTableColumn } from '@/components/shared/AppTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { InventoryItemThumb } from '@/components/shared/InventoryItemThumb';
import { ListPagination } from '@/components/shared/ListPagination';
import { ApiModeBanner } from '@/components/shared/ApiModeBanner';
import { MODULE_FILTER_INPUT } from '@/lib/ui/module-chrome-styles';
import { INVENTORY_STANDARD_KPI_ICONS as KPI_ICON } from '@/lib/ui/kpi-icons';
import { isModuleApiMode } from '@/lib/config/data-source';
import { useAppStore } from '@/lib/state/app-store';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { isKpiBootLoading } from '@/lib/ui/kpi-loading';
import { fetchLowStockAlertsPage } from '@/lib/services/low-stock-alerts-api';
import {
  collectLocalLowStockAlertRows,
  countLowStockAlertRows,
  filterLowStockAlertRows,
  type LowStockAlertCounts,
  type LowStockAlertRow,
  type LowStockItemType,
} from '@/lib/services/stock-duration';

const PAGE_SIZE = 10;
const EMPTY_COUNTS: LowStockAlertCounts = { total: 0, products: 0, rawMaterials: 0, overdue: 0 };

function formatDays(value: number | null | undefined): string {
  if (value == null || Number.isNaN(Number(value))) return '—';
  const n = Number(value);
  return n === 1 ? '1 day' : `${n} days`;
}

export function LowStockAlertsPage() {
  const router = useRouter();
  const t = useAppStore((s) => s.t);
  const appState = useAppStore((s) => s.appState);
  const apiMode = isModuleApiMode('products');

  const [search, setSearch] = useState('');
  const [itemType, setItemType] = useState<LowStockItemType | 'all'>('all');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<LowStockAlertRow[]>([]);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState<LowStockAlertCounts>(EMPTY_COUNTS);
  const [loading, setLoading] = useState(apiMode);
  const [initialized, setInitialized] = useState(!apiMode);
  const [error, setError] = useState<string | null>(null);
  const fetchGenRef = useRef(0);
  const debouncedSearch = useDebouncedValue(search, 300);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, itemType]);

  const loadApi = useCallback(async () => {
    if (!apiMode) return;
    const generation = ++fetchGenRef.current;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchLowStockAlertsPage({
        page,
        limit: PAGE_SIZE,
        search: debouncedSearch,
        itemType,
      });
      if (generation !== fetchGenRef.current) return;
      setRows(result.rows);
      setTotal(result.meta.total);
      setCounts(result.counts);
    } catch (err) {
      if (generation !== fetchGenRef.current) return;
      setRows([]);
      setTotal(0);
      setCounts(EMPTY_COUNTS);
      setError(err instanceof Error ? err.message : 'Failed to load low stock alerts');
    } finally {
      if (generation === fetchGenRef.current) {
        setLoading(false);
        setInitialized(true);
      }
    }
  }, [apiMode, page, debouncedSearch, itemType]);

  useEffect(() => {
    void loadApi();
  }, [loadApi]);

  const localFiltered = useMemo(() => {
    if (apiMode) return [];
    return filterLowStockAlertRows(collectLocalLowStockAlertRows(appState), search, itemType);
  }, [apiMode, appState, search, itemType]);

  const displayRows = apiMode
    ? rows
    : localFiltered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const listTotal = apiMode ? total : localFiltered.length;
  const metrics = apiMode ? counts : countLowStockAlertRows(localFiltered);
  const bootLoading = isKpiBootLoading(apiMode, initialized);

  const columns = useMemo<AppTableColumn<LowStockAlertRow>[]>(() => [
    {
      key: 'item',
      label: t('inventory.item_label'),
      render: (row) => (
        <div className="flex items-center gap-2.5 min-w-0">
          <InventoryItemThumb
            imageUrl={row.imageUrl}
            alt={row.name}
            fallback={(
              <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-slate-100 text-slate-500">
                <Package className="w-4 h-4" />
              </span>
            )}
          />
          <div className="min-w-0">
            <div className="font-bold text-slate-800 truncate">{row.name || '—'}</div>
            <div className="text-[10px] text-slate-500 truncate">
              {[row.sku, row.legacyId].filter(Boolean).join(' · ') || row.itemTypeLabel}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'itemType',
      label: t('inventory.item_type'),
      render: (row) => (
        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold text-[10px]">
          {row.itemTypeLabel}
        </span>
      ),
    },
    {
      key: 'qty',
      label: t('inventory.on_hand'),
      render: (row) => (
        <div>
          <div className="font-extrabold text-slate-900">{row.qty.toLocaleString()}</div>
          <div className="text-[10px] text-slate-400">{row.unit}</div>
        </div>
      ),
    },
    {
      key: 'min',
      label: t('inventory.min_level'),
      render: (row) => <span className="font-semibold text-slate-600">{row.min.toLocaleString()}</span>,
    },
    {
      key: 'expectedDays',
      label: t('inventory.expected_days'),
      render: (row) => <span className="font-semibold text-slate-700">{formatDays(row.expectedDays)}</span>,
    },
    {
      key: 'timeLeft',
      label: t('inventory.time_left'),
      render: (row) => {
        if (row.remainingRatio == null || row.remainingDays == null) {
          return <span className="font-semibold text-slate-400">—</span>;
        }
        const pct = Math.max(0, Math.round(row.remainingRatio * 100));
        const daysLabel = row.overdue
          ? formatDays(Math.abs(row.remainingDays))
          : formatDays(row.remainingDays);
        return (
          <div>
            <div className={`font-extrabold ${row.overdue ? 'text-rose-600' : 'text-slate-800'}`}>
              {row.overdue ? t('inventory.time_over', { n: daysLabel }) : daysLabel}
            </div>
            <div className={`text-[10px] font-bold ${row.overdue ? 'text-rose-500' : 'text-slate-400'}`}>
              {pct}%
            </div>
          </div>
        );
      },
    },
    {
      key: 'status',
      label: t('common.status'),
      render: (row) => (
        <StatusBadge status={row.overdue ? 'Overdue' : row.expectedDays ? 'On track' : 'Low Stock'} />
      ),
    },
  ], [t]);

  return (
    <>
      {apiMode ? <ApiModeBanner module="products" error={error} /> : null}

      <ModuleKpiSection
        gridClassName="grid grid-cols-2 md:grid-cols-4 gap-2"
        kpiCount={4}
        loading={bootLoading}
        items={[
          { key: 'total', label: t('inventory.low_alerts'), value: String(metrics.total), alert: metrics.total > 0, iconify: KPI_ICON.low },
          { key: 'products', label: t('inventory.item_type_product'), value: String(metrics.products), iconify: KPI_ICON.skus },
          { key: 'raw', label: t('inventory.raw_materials'), value: String(metrics.rawMaterials), iconify: KPI_ICON.stock },
          { key: 'overdue', label: t('inventory.overdue_duration'), value: String(metrics.overdue), alert: metrics.overdue > 0, iconify: KPI_ICON.oos },
        ]}
      />

      <ModuleFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder={t('inventory.search_low_stock')}
        filters={
          <select
            value={itemType}
            onChange={(e) => setItemType(e.target.value as LowStockItemType | 'all')}
            className={MODULE_FILTER_INPUT}
          >
            <option value="all">{t('inventory.all_item_types')}</option>
            <option value="product">{t('inventory.item_type_product')}</option>
            <option value="rawMaterial">{t('inventory.raw_materials')}</option>
            <option value="semiFinished">{t('inventory.semi_finished')}</option>
            <option value="finishedGood">{t('inventory.finished_goods')}</option>
          </select>
        }
      />

      <AppTable
        columns={columns}
        rows={displayRows}
        loading={bootLoading}
        emptyMessage={loading ? t('inventory.loading_low_stock') : t('inventory.no_low_stock')}
        rowClassName="cursor-pointer hover:bg-slate-50/80"
        onRowClick={(row) => router.push(row.href)}
      />

      <ListPagination
        page={page}
        pageSize={PAGE_SIZE}
        total={listTotal}
        onPageChange={setPage}
      />
      <Footer />
    </>
  );
}
