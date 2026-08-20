'use client';



import { useMemo, useState } from 'react';

import { Download, Filter, Printer } from 'lucide-react';

import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/shared/Button';
import { useRegisterModuleActions } from '@/components/layout/ModuleActionsContext';

import { useSalesReportApiRows } from '@/hooks/use-report-api-data';
import { ApiModeBanner } from '@/components/shared/ApiModeBanner';
import { isMongoDbBackend } from '@/lib/config/data-source';
import { isKpiBootLoading, pickApiReportRows } from '@/lib/ui/kpi-loading';
import { useAppStore } from '@/lib/state/app-store';

import { toast } from '@/lib/ui/feedback';

import { DateInput } from '@/components/shared/DateInput';

import { SalesReportMetrics } from '@/components/modules/reports/sales/SalesReportMetrics';

import { SalesRevenueChart } from '@/components/modules/reports/sales/SalesRevenueChart';

import { SalesStatusDonut } from '@/components/modules/reports/sales/SalesStatusDonut';

import { SalesTopCustomers } from '@/components/modules/reports/sales/SalesTopCustomers';

import { SalesTransactionsTable } from '@/components/modules/reports/sales/SalesTransactionsTable';

import { SalesPrintFrame } from '@/components/modules/reports/sales/SalesPrintFrame';

import { useReportPrint } from '@/components/modules/reports/shared/useReportPrint';

import { ModuleFilterBar } from '@/components/shared/ModuleFilterBar';
import { MODULE_FILTER_ACTION_BTN, MODULE_PRINT_BTN } from '@/lib/ui/module-chrome-styles';
import {
  ReportDonutSkeleton,
  ReportLineChartSkeleton,
  ReportTableSkeleton,
  ReportTopListSkeleton,
} from '@/components/modules/reports/shared/ReportSectionSkeleton';

import {

  SR_CHARTS_ROW,

  SR_FILTER_INPUT,

  type SalesPrintSectionId,

} from '@/components/modules/reports/sales/sales-report-styles';

import {
  buildChartSeries,
  buildSalesKpis,
  buildStatusSummary,
  buildTopCustomers,
  filterSalesRows,
  formatFilterSummary,
  listSalesReportRows,
  uniqueCustomers,
} from '@/components/modules/reports/sales/sales-report-utils';
import { exportSalesReportCsv } from '@/lib/services/report-export';



const STATUS_OPTIONS = ['All', 'Paid', 'Unpaid', 'Partial', 'Cancelled'] as const;



export function SalesReportsPage() {

  const appState = useAppStore((s) => s.appState);
  const apiMode = isMongoDbBackend();
  const apiReport = useSalesReportApiRows();
  const kpiLoading = isKpiBootLoading(apiMode, apiReport.initialized);

  const t = useAppStore((s) => s.t);

  const { printSection, printTarget } = useReportPrint<SalesPrintSectionId>();



  const [search, setSearch] = useState('');

  const [dateStart, setDateStart] = useState('');

  const [dateEnd, setDateEnd] = useState('');

  const [customerFilter, setCustomerFilter] = useState('All');

  const [statusFilter, setStatusFilter] = useState('All');



  const allRows = useMemo(
    () => listSalesReportRows(
      pickApiReportRows(
        apiMode,
        apiReport.initialized,
        apiReport.rows,
        Array.isArray(appState.reportSales) ? appState.reportSales : [],
      ),
    ),
    [apiMode, apiReport.initialized, apiReport.rows, appState.reportSales],
  );



  const customers = useMemo(() => uniqueCustomers(allRows), [allRows]);



  const filters = useMemo(

    () => ({ search, dateStart, dateEnd, customer: customerFilter, status: statusFilter }),

    [search, dateStart, dateEnd, customerFilter, statusFilter],

  );



  const filteredRows = useMemo(() => filterSalesRows(allRows, filters), [allRows, filters]);



  const kpis = useMemo(() => {

    const trendSuffix = t('reports.sales_trend_suffix');

    const items = buildSalesKpis(filteredRows, allRows, trendSuffix);

    const labelKeys: Record<string, string> = {

      revenue: 'reports.sales_kpi_revenue',

      orders: 'reports.sales_kpi_orders',

      avg: 'reports.sales_kpi_avg',

      paid: 'reports.sales_kpi_paid',

      unpaid: 'reports.sales_kpi_unpaid',

    };

    return items.map((item) => ({ ...item, label: t(labelKeys[item.key] ?? item.label) }));

  }, [filteredRows, allRows, t]);



  const statusSummary = useMemo(() => buildStatusSummary(filteredRows), [filteredRows]);

  const topCustomers = useMemo(() => buildTopCustomers(filteredRows), [filteredRows]);

  const chartData = useMemo(() => buildChartSeries(allRows), [allRows]);



  const filterSummary = useMemo(() => formatFilterSummary(filters), [filters]);



  const handleExport = () => {
    const count = exportSalesReportCsv({
      title: t('reports.sales_title'),
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

    setCustomerFilter('All');

    setStatusFilter('All');

  };



  const sectionTitles: Record<SalesPrintSectionId, string> = {

    metrics: t('reports.sales_print_metrics'),

    revenue: t('reports.sales_revenue_overview'),

    status: t('reports.sales_by_status'),

    customers: t('reports.sales_top_customers'),

    transactions: t('reports.sales_transactions'),

    full: t('reports.sales_title'),

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
        {t('reports.sales_export')}
      </Button>
    </>,
    [printSection, handleExport, t],
  );

  return (

    <>
        {apiReport.error ? <ApiModeBanner module="invoices" error={apiReport.error} /> : null}
        <SalesReportMetrics items={kpis} loading={kpiLoading} />



        <ModuleFilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder={t('reports.sales_search_placeholder')}
          filters={
            <>
              <DateInput
                value={dateStart}
                onChange={setDateStart}
                className={SR_FILTER_INPUT}
                aria-label={t('reports.sales_date_from')}
              />
              <DateInput
                value={dateEnd}
                onChange={setDateEnd}
                className={SR_FILTER_INPUT}
                aria-label={t('reports.sales_date_to')}
              />
              <select
                value={customerFilter}
                onChange={(e) => setCustomerFilter(e.target.value)}
                className={SR_FILTER_INPUT}
              >
                <option value="All">{t('reports.sales_all_customers')}</option>
                {customers.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={SR_FILTER_INPUT}
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status === 'All' ? t('reports.sales_all_status') : status}
                  </option>
                ))}
              </select>
              <button type="button" onClick={handleResetFilters} className={MODULE_FILTER_ACTION_BTN}>
                <Filter className="w-4 h-4" />
                {t('reports.sales_filter')}
              </button>
            </>
          }
        />



        <div className={SR_CHARTS_ROW}>
          {kpiLoading ? (
            <>
              <ReportLineChartSkeleton />
              <ReportDonutSkeleton />
              <ReportTopListSkeleton />
            </>
          ) : (
            <>
              <SalesRevenueChart data={chartData} onPrint={() => printSection('revenue')} />
              <SalesStatusDonut summary={statusSummary} onPrint={() => printSection('status')} />
              <SalesTopCustomers customers={topCustomers} onPrint={() => printSection('customers')} />
            </>
          )}
        </div>

        {kpiLoading ? (
          <ReportTableSkeleton columns={7} />
        ) : (
          <SalesTransactionsTable
            rows={filteredRows}
            onPrint={() => printSection('transactions')}
            printLabel={t('reports.print_section')}
          />
        )}



        <Footer />

      <SalesPrintFrame

        printTarget={printTarget}

        reportTitle={t('reports.sales_title')}

        generatedLabel={t('reports.print_generated')}

        filterSummary={filterSummary}

        confidentialLabel={t('reports.print_confidential')}

        sectionTitles={sectionTitles}

        kpis={kpis}

        chartData={chartData}

        statusSummary={statusSummary}

        topCustomers={topCustomers}

        rows={filteredRows}

        chartLegend={{

          thisMonth: t('reports.sales_this_month'),

          lastMonth: t('reports.sales_last_month'),

        }}

        statusLabels={{

          paid: t('reports.sales_status_paid'),

          unpaid: t('reports.sales_status_unpaid'),

          partial: t('reports.sales_status_partial'),

          cancelled: t('reports.sales_status_cancelled'),

          total: t('reports.sales_kpi_orders'),

        }}

        tableHeaders={{

          date: t('reports.sales_col_date'),

          ref: t('reports.sales_col_reference'),

          customer: t('reports.sales_col_customer'),

          status: t('reports.sales_col_status'),

          payment: t('reports.sales_col_payment'),

          total: t('reports.sales_col_total'),

        }}

        customerOrdersLabel={(n) => t('reports.sales_orders_count', { n })}

      />

    </>

  );

}


