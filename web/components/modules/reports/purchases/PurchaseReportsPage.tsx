'use client';

import { useMemo, useState } from 'react';
import { Download, Filter, Printer } from 'lucide-react';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/shared/Button';
import { useRegisterModuleActions } from '@/components/layout/ModuleActionsContext';
import { usePurchaseReportApiRows } from '@/hooks/use-report-api-data';
import { ApiModeBanner } from '@/components/shared/ApiModeBanner';
import { useAppStore } from '@/lib/state/app-store';
import { isMongoDbBackend } from '@/lib/config/data-source';
import { isKpiBootLoading, pickApiReportRows } from '@/lib/ui/kpi-loading';
import { toast } from '@/lib/ui/feedback';
import { DateInput } from '@/components/shared/DateInput';
import { PurchaseReportMetrics } from '@/components/modules/reports/purchases/PurchaseReportMetrics';
import { PurchaseSpendChart } from '@/components/modules/reports/purchases/PurchaseSpendChart';
import { PurchaseStatusDonut } from '@/components/modules/reports/purchases/PurchaseStatusDonut';
import { PurchaseTopSuppliers } from '@/components/modules/reports/purchases/PurchaseTopSuppliers';
import { PurchaseOrdersTable } from '@/components/modules/reports/purchases/PurchaseOrdersTable';
import { PR_CHARTS_ROW, PR_FILTER_INPUT } from '@/components/modules/reports/purchases/purchase-report-styles';
import {
  buildPurchaseChartSeries,
  buildPurchaseKpis,
  buildPurchaseStatusSummary,
  buildTopSuppliers,
  filterPurchaseRows,
  formatFilterSummary,
  listPurchaseReportRows,
  uniqueSuppliers,
} from '@/components/modules/reports/purchases/purchase-report-utils';
import { exportPurchaseReportCsv } from '@/lib/services/report-export';
import { ReportPrintFrame } from '@/components/modules/reports/shared/ReportPrintFrame';
import { ModuleFilterBar } from '@/components/shared/ModuleFilterBar';
import { useReportPrint } from '@/components/modules/reports/shared/useReportPrint';
import {
  ReportDonutSkeleton,
  ReportLineChartSkeleton,
  ReportTableSkeleton,
  ReportTopListSkeleton,
} from '@/components/modules/reports/shared/ReportSectionSkeleton';
import type { ReportPrintSectionId } from '@/components/modules/reports/shared/report-print-styles';
import { MODULE_FILTER_ACTION_BTN, MODULE_PRINT_BTN } from '@/lib/ui/module-chrome-styles';

const STATUS_OPTIONS = ['All', 'Received', 'Sent', 'Draft', 'Cancelled'] as const;

export function PurchaseReportsPage() {
  const appState = useAppStore((s) => s.appState);
  const apiMode = isMongoDbBackend();
  const apiReport = usePurchaseReportApiRows();
  const kpiLoading = isKpiBootLoading(apiMode, apiReport.initialized);
  const t = useAppStore((s) => s.t);
  const { printSection, printTarget } = useReportPrint<ReportPrintSectionId>();

  const [search, setSearch] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const allRows = useMemo(
    () => listPurchaseReportRows(
      pickApiReportRows(
        apiMode,
        apiReport.initialized,
        apiReport.rows,
        Array.isArray(appState.reportPurchases) ? appState.reportPurchases : [],
      ),
    ),
    [apiMode, apiReport.initialized, apiReport.rows, appState.reportPurchases],
  );

  const suppliers = useMemo(() => uniqueSuppliers(allRows), [allRows]);

  const filters = useMemo(
    () => ({ search, dateStart, dateEnd, supplier: supplierFilter, status: statusFilter }),
    [search, dateStart, dateEnd, supplierFilter, statusFilter],
  );

  const filteredRows = useMemo(() => filterPurchaseRows(allRows, filters), [allRows, filters]);

  const kpis = useMemo(() => {
    const trendSuffix = t('reports.purchases_trend_suffix');
    const items = buildPurchaseKpis(filteredRows, allRows, trendSuffix);
    const labelKeys: Record<string, string> = {
      spend: 'reports.purchases_kpi_spend',
      count: 'reports.purchases_kpi_count',
      avg: 'reports.purchases_kpi_avg',
      received: 'reports.purchases_kpi_received',
      pending: 'reports.purchases_kpi_pending',
    };
    return items.map((item) => ({ ...item, label: t(labelKeys[item.key] ?? item.label) }));
  }, [filteredRows, allRows, t]);

  const statusSummary = useMemo(() => buildPurchaseStatusSummary(filteredRows), [filteredRows]);
  const topSuppliers = useMemo(() => buildTopSuppliers(filteredRows), [filteredRows]);
  const chartData = useMemo(() => buildPurchaseChartSeries(allRows), [allRows]);

  const filterSummary = useMemo(() => formatFilterSummary(filters), [filters]);

  const handleExport = () => {
    const count = exportPurchaseReportCsv({
      title: t('reports.purchases_title'),
      filterSummary,
      kpis,
      rows: filteredRows,
    });
    if (count === 0) {
      toast.warning(t('reports.export_empty'), { module: 'Reports' });
      return;
    }
    toast.success(t('reports.export_success', { rows: count }), { module: 'Reports' });
  };

  const handleResetFilters = () => {
    setSearch('');
    setDateStart('');
    setDateEnd('');
    setSupplierFilter('All');
    setStatusFilter('All');
  };

  const sectionTitles = {
    metrics: t('reports.purchases_print_metrics'),
    chart: t('reports.purchases_spend_overview'),
    status: t('reports.purchases_by_status'),
    suppliers: t('reports.purchases_top_suppliers'),
    orders: t('reports.purchases_orders'),
    full: t('reports.purchases_title'),
  };

  useRegisterModuleActions(
    <>
      <Button
        type="button"
        onClick={() => printSection('full')}
        variant="outline"
        leftIcon={<Printer className="w-4 h-4" />}
      >
        {t('reports.print_full')}
      </Button>
      <Button
        type="button"
        onClick={handleExport}
        variant="outline"
        leftIcon={<Download className="w-4 h-4" />}
      >
        {t('reports.purchases_export')}
      </Button>
    </>,
    [printSection, handleExport, t],
  );

  return (
    <>
        <PurchaseReportMetrics items={kpis} loading={kpiLoading} />

        <ModuleFilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder={t('reports.purchases_search_placeholder')}
          filters={
            <>
              <DateInput
                value={dateStart}
                onChange={setDateStart}
                className={PR_FILTER_INPUT}
                aria-label={t('reports.purchases_date_from')}
              />
              <DateInput
                value={dateEnd}
                onChange={setDateEnd}
                className={PR_FILTER_INPUT}
                aria-label={t('reports.purchases_date_to')}
              />
              <select
                value={supplierFilter}
                onChange={(e) => setSupplierFilter(e.target.value)}
                className={PR_FILTER_INPUT}
              >
                <option value="All">{t('reports.purchases_all_suppliers')}</option>
                {suppliers.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={PR_FILTER_INPUT}
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status === 'All' ? t('reports.purchases_all_status') : status}
                  </option>
                ))}
              </select>
              <button type="button" onClick={handleResetFilters} className={MODULE_FILTER_ACTION_BTN}>
                <Filter className="w-4 h-4" />
                {t('reports.purchases_filter')}
              </button>
            </>
          }
        />

        <div className={PR_CHARTS_ROW}>
          {kpiLoading ? (
            <>
              <ReportLineChartSkeleton />
              <ReportDonutSkeleton />
              <ReportTopListSkeleton />
            </>
          ) : (
            <>
              <PurchaseSpendChart data={chartData} onPrint={() => printSection('chart')} />
              <PurchaseStatusDonut summary={statusSummary} onPrint={() => printSection('status')} />
              <PurchaseTopSuppliers suppliers={topSuppliers} onPrint={() => printSection('suppliers')} />
            </>
          )}
        </div>

        {kpiLoading ? (
          <ReportTableSkeleton columns={6} />
        ) : (
          <PurchaseOrdersTable rows={filteredRows} onPrint={() => printSection('orders')} />
        )}

        <Footer />

      <ReportPrintFrame
        printTarget={printTarget}
        reportTitle={t('reports.purchases_title')}
        generatedLabel={t('reports.print_generated')}
        filterSummary={filterSummary}
        confidentialLabel={t('reports.print_confidential')}
        sectionTitles={sectionTitles}
        kpis={kpis}
        chartData={chartData}
        statusSummary={statusSummary}
        topSuppliers={topSuppliers}
        rows={filteredRows}
        chartLegend={{
          thisMonth: t('reports.purchases_this_month'),
          lastMonth: t('reports.purchases_last_month'),
        }}
        statusLabels={{
          received: t('reports.purchases_status_received'),
          pending: t('reports.purchases_status_pending'),
          cancelled: t('reports.purchases_status_cancelled'),
          total: t('reports.purchases_total_label'),
        }}
        tableHeaders={{
          date: t('reports.purchases_col_date'),
          ref: t('reports.purchases_col_ref'),
          supplier: t('reports.purchases_col_supplier'),
          total: t('reports.purchases_col_total'),
          received: t('reports.purchases_col_received'),
          pending: t('reports.purchases_col_pending'),
          status: t('reports.purchases_col_status'),
          paymentStatus: t('reports.purchases_col_payment_status'),
        }}
        supplierPoLabel={(n) => t('reports.purchases_po_count', { n })}
      />
    </>
  );
}
