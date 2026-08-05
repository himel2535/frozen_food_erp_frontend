'use client';

import { useMemo, useState } from 'react';
import { Download, Filter, Printer, Search } from 'lucide-react';
import { Footer } from '@/components/layout/Footer';
import { useRegisterModuleActions } from '@/components/layout/ModuleActionsContext';
import { useAppStore } from '@/lib/state/app-store';
import { toast } from '@/lib/ui/feedback';
import { DateInput } from '@/components/shared/DateInput';
import { InventoryReportMetrics } from '@/components/modules/reports/inventory/InventoryReportMetrics';
import { InventoryDetailsTable } from '@/components/modules/reports/inventory/InventoryDetailsTable';
import { InventoryCategoryDonut } from '@/components/modules/reports/inventory/InventoryCategoryDonut';
import { InventoryWarehouseDonut } from '@/components/modules/reports/inventory/InventoryWarehouseDonut';
import { InventoryStockMovement } from '@/components/modules/reports/inventory/InventoryStockMovement';
import { InventoryLowStockAlerts } from '@/components/modules/reports/inventory/InventoryLowStockAlerts';
import { InventoryPrintFrame } from '@/components/modules/reports/inventory/InventoryPrintFrame';
import { ReportSectionHeader } from '@/components/modules/reports/shared/ReportSectionHeader';
import { useReportPrint } from '@/components/modules/reports/shared/useReportPrint';
import { IR_ANALYTICS_ROW, IR_FILTER_INPUT, type InventoryPrintSectionId } from '@/components/modules/reports/inventory/inventory-report-styles';
import {
  buildCategoryBreakdown,
  buildInventoryKpis,
  buildLowStockRows,
  buildWarehouseBreakdown,
  filterInventoryRows,
  formatFilterSummary,
  formatReportingPeriod,
  getStockMovement,
  listInventoryReportRows,
  uniqueCategories,
  uniqueWarehouses,
} from '@/components/modules/reports/inventory/inventory-report-utils';

export function InventoryReportsPage() {
  const appState = useAppStore((s) => s.appState);
  const t = useAppStore((s) => s.t);
  const { printSection, printTarget } = useReportPrint<InventoryPrintSectionId>();

  const [search, setSearch] = useState('');
  const [dateStart, setDateStart] = useState('2026-06-01');
  const [dateEnd, setDateEnd] = useState('2026-06-12');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [warehouseFilter, setWarehouseFilter] = useState('All');

  const allRows = useMemo(
    () => listInventoryReportRows(Array.isArray(appState.reportInventory) ? appState.reportInventory : []),
    [appState.reportInventory],
  );

  const categories = useMemo(() => uniqueCategories(allRows), [allRows]);
  const warehouses = useMemo(() => uniqueWarehouses(allRows), [allRows]);

  const filters = useMemo(
    () => ({ search, dateStart, dateEnd, category: categoryFilter, warehouse: warehouseFilter }),
    [search, dateStart, dateEnd, categoryFilter, warehouseFilter],
  );

  const filteredRows = useMemo(() => filterInventoryRows(allRows, filters), [allRows, filters]);

  const kpis = useMemo(() => {
    const items = buildInventoryKpis(filteredRows, t('reports.inventory_trend_suffix'));
    const labelKeys: Record<string, string> = {
      value: 'reports.inventory_kpi_value',
      skus: 'reports.inventory_kpi_skus',
      qty: 'reports.inventory_kpi_qty',
      low: 'reports.inventory_kpi_low',
    };
    return items.map((item) => ({ ...item, label: t(labelKeys[item.key] ?? item.label) }));
  }, [filteredRows, t]);

  const categorySlices = useMemo(() => buildCategoryBreakdown(filteredRows), [filteredRows]);
  const warehouseSlices = useMemo(() => buildWarehouseBreakdown(filteredRows), [filteredRows]);
  const totalValue = useMemo(() => filteredRows.reduce((s, r) => s + r.value, 0), [filteredRows]);
  const lowStockRows = useMemo(() => buildLowStockRows(filteredRows), [filteredRows]);
  const movement = useMemo(() => getStockMovement(), []);

  const filterSummary = useMemo(() => formatFilterSummary(filters), [filters]);
  const reportingPeriod = useMemo(() => formatReportingPeriod(filters), [filters]);

  const handleExport = () => {
    toast.info(t('reports.inventory_export_soon'), { module: 'Reports' });
  };

  const handleResetFilters = () => {
    setSearch('');
    setDateStart('2026-06-01');
    setDateEnd('2026-06-12');
    setCategoryFilter('All');
    setWarehouseFilter('All');
  };

  const sectionTitles: Record<InventoryPrintSectionId, string> = {
    metrics: t('reports.inventory_print_metrics'),
    details: t('reports.inventory_details'),
    category: t('reports.inventory_by_category'),
    warehouse: t('reports.inventory_by_warehouse'),
    movement: t('reports.inventory_stock_movement'),
    alerts: t('reports.inventory_low_stock_alerts'),
    full: t('reports.inventory_title'),
  };

  useRegisterModuleActions(
    <>
      <button type="button" onClick={() => printSection('full')} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer">
        <Printer className="w-4 h-4" />
        {t('reports.inventory_print_report')}
      </button>
      <button type="button" onClick={handleExport} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2 cursor-pointer">
        <Download className="w-4 h-4" />
        {t('reports.inventory_export')}
      </button>
    </>,
    [printSection, handleExport, t],
  );

  return (
    <>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 premium-shadow">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
            <div className="relative min-w-[240px] flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('reports.inventory_search_placeholder')}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 font-medium"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <DateInput value={dateStart} onChange={setDateStart} className={IR_FILTER_INPUT} aria-label={t('reports.inventory_date_from')} />
              <DateInput value={dateEnd} onChange={setDateEnd} className={IR_FILTER_INPUT} aria-label={t('reports.inventory_date_to')} />
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className={IR_FILTER_INPUT}>
                <option value="All">{t('reports.inventory_all_category')}</option>
                {categories.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
              <select value={warehouseFilter} onChange={(e) => setWarehouseFilter(e.target.value)} className={IR_FILTER_INPUT}>
                <option value="All">{t('reports.inventory_all_warehouse')}</option>
                {warehouses.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
              <button type="button" onClick={handleResetFilters} className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer">
                <Filter className="w-4 h-4" />
                {t('reports.inventory_filter')}
              </button>
            </div>
          </div>
        </div>

        <section>
          <ReportSectionHeader
            title={t('reports.inventory_print_metrics')}
            onPrint={() => printSection('metrics')}
            printLabel={t('reports.print_section')}
          />
          <InventoryReportMetrics items={kpis} />
        </section>

        <div className={IR_ANALYTICS_ROW}>
          <InventoryCategoryDonut slices={categorySlices} totalAmount={totalValue} onPrint={() => printSection('category')} />
          <InventoryWarehouseDonut slices={warehouseSlices} totalAmount={totalValue} onPrint={() => printSection('warehouse')} />
          <InventoryStockMovement movement={movement} onPrint={() => printSection('movement')} />
        </div>

        <InventoryDetailsTable rows={filteredRows} onPrint={() => printSection('details')} />

        <InventoryLowStockAlerts rows={lowStockRows} onPrint={() => printSection('alerts')} />

        <Footer />

      <InventoryPrintFrame
        printTarget={printTarget}
        reportTitle={t('reports.inventory_title')}
        reportingPeriod={reportingPeriod}
        generatedLabel={t('reports.print_generated')}
        filterSummary={filterSummary}
        confidentialLabel={t('reports.print_confidential')}
        preparedByLabel={t('reports.inventory_prepared_by')}
        preparedByName={String(appState.currentUser?.name ?? '—')}
        thankYouLabel={t('reports.inventory_thank_you')}
        company={appState.companyProfile ?? {}}
        sectionTitles={sectionTitles}
        kpis={kpis}
        rows={filteredRows}
        categorySlices={categorySlices}
        warehouseSlices={warehouseSlices}
        movement={movement}
        lowStockRows={lowStockRows}
        tableHeaders={{
          sl: t('reports.inventory_col_sl'),
          sku: t('reports.inventory_col_sku'),
          product: t('reports.inventory_col_product'),
          category: t('reports.inventory_col_category'),
          warehouse: t('reports.inventory_col_warehouse'),
          qty: t('reports.inventory_col_qty'),
          cost: t('reports.inventory_col_cost'),
          value: t('reports.inventory_col_value'),
          reorder: t('reports.inventory_col_reorder'),
          status: t('reports.inventory_col_status'),
        }}
        movementLabels={{
          in: t('reports.inventory_stock_in'),
          out: t('reports.inventory_stock_out'),
          adj: t('reports.inventory_adjustments'),
          net: t('reports.inventory_net_change'),
        }}
        totalLabel={t('reports.inventory_total_label')}
      />
    </>
  );
}
