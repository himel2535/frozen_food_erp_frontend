'use client';

import { useMemo, useState } from 'react';
import { Download, Filter, Printer } from 'lucide-react';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/shared/Button';
import { useRegisterModuleActions } from '@/components/layout/ModuleActionsContext';
import { useCustomerReportApiRows } from '@/hooks/use-report-api-data';
import { ApiModeBanner } from '@/components/shared/ApiModeBanner';
import { useAppStore } from '@/lib/state/app-store';
import { isMongoDbBackend } from '@/lib/config/data-source';
import { isKpiBootLoading, pickApiReportRows } from '@/lib/ui/kpi-loading';
import { toast } from '@/lib/ui/feedback';
import { DateInput } from '@/components/shared/DateInput';
import { CustomerReportMetrics } from '@/components/modules/reports/customers/CustomerReportMetrics';
import { CustomerSummaryTable } from '@/components/modules/reports/customers/CustomerSummaryTable';
import { CustomerBreakdownDonut } from '@/components/modules/reports/customers/CustomerBreakdownDonut';
import { CustomerRecentActivity } from '@/components/modules/reports/customers/CustomerRecentActivity';
import { CustomerPrintFrame } from '@/components/modules/reports/customers/CustomerPrintFrame';
import { useReportPrint } from '@/components/modules/reports/shared/useReportPrint';
import { ModuleFilterBar } from '@/components/shared/ModuleFilterBar';
import { MODULE_FILTER_ACTION_BTN, MODULE_PRINT_BTN } from '@/lib/ui/module-chrome-styles';
import {
  ReportDonutSkeleton,
  ReportPanelSkeleton,
  ReportTableSkeleton,
} from '@/components/modules/reports/shared/ReportSectionSkeleton';
import {
  CR_ANALYTICS_ROW,
  CR_CUSTOMER_SLICE,
  CR_FILTER_INPUT,
  CR_STATUS_SLICE,
  type CustomerPrintSectionId,
} from '@/components/modules/reports/customers/customer-report-styles';
import {
  buildCustomerKpis,
  buildOutstandingByCustomer,
  buildRecentActivity,
  buildSalesByCustomer,
  buildStatusBreakdown,
  filterCustomerRows,
  formatFilterSummary,
  formatReportingPeriod,
  listCustomerReportRows,
} from '@/components/modules/reports/customers/customer-report-utils';
import { exportCustomerReportCsv } from '@/lib/services/report-export';

export function CustomerReportsPage() {
  const appState = useAppStore((s) => s.appState);
  const apiMode = isMongoDbBackend();
  const apiReport = useCustomerReportApiRows();
  const kpiLoading = isKpiBootLoading(apiMode, apiReport.initialized);
  const t = useAppStore((s) => s.t);
  const { printSection, printTarget } = useReportPrint<CustomerPrintSectionId>();

  const [search, setSearch] = useState('');
  const [dateStart, setDateStart] = useState('2026-06-01');
  const [dateEnd, setDateEnd] = useState('2026-06-12');
  const [statusFilter, setStatusFilter] = useState('All');

  const allRows = useMemo(
    () => listCustomerReportRows(
      pickApiReportRows(
        apiMode,
        apiReport.initialized,
        apiReport.rows,
        Array.isArray(appState.reportCustomers) ? appState.reportCustomers : [],
      ),
    ),
    [apiMode, apiReport.initialized, apiReport.rows, appState.reportCustomers],
  );

  const filters = useMemo(
    () => ({ search, dateStart, dateEnd, status: statusFilter }),
    [search, dateStart, dateEnd, statusFilter],
  );

  const filteredRows = useMemo(() => filterCustomerRows(allRows, filters), [allRows, filters]);

  const kpis = useMemo(() => {
    const items = buildCustomerKpis(filteredRows, t('reports.customers_trend_suffix'));
    const labelKeys: Record<string, string> = {
      sales: 'reports.customers_kpi_sales',
      due: 'reports.customers_kpi_due',
      count: 'reports.customers_kpi_count',
      active: 'reports.customers_kpi_active',
      overdue: 'reports.customers_kpi_overdue',
    };
    return items.map((item) => ({ ...item, label: t(labelKeys[item.key] ?? item.label) }));
  }, [filteredRows, t]);

  const salesSlices = useMemo(() => buildSalesByCustomer(filteredRows), [filteredRows]);
  const outstandingSlices = useMemo(() => buildOutstandingByCustomer(filteredRows), [filteredRows]);
  const statusSlices = useMemo(() => buildStatusBreakdown(filteredRows), [filteredRows]);
  const totalSales = useMemo(() => filteredRows.reduce((s, r) => s + r.sales, 0), [filteredRows]);
  const totalDue = useMemo(() => filteredRows.reduce((s, r) => s + r.due, 0), [filteredRows]);
  const totalCustomers = filteredRows.length;

  const recentActivity = useMemo(
    () =>
      buildRecentActivity(
        Array.isArray(appState.reportSales) ? appState.reportSales : [],
        filteredRows.map((r) => r.name),
      ),
    [appState.reportSales, filteredRows],
  );

  const filterSummary = useMemo(() => formatFilterSummary(filters), [filters]);
  const reportingPeriod = useMemo(() => formatReportingPeriod(filters), [filters]);

  const handleExport = () => {
    const count = exportCustomerReportCsv({
      title: t('reports.customers_title'),
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
    setDateStart('2026-06-01');
    setDateEnd('2026-06-12');
    setStatusFilter('All');
  };

  const sectionTitles: Record<CustomerPrintSectionId, string> = {
    metrics: t('reports.customers_print_metrics'),
    summary: t('reports.customers_summary'),
    salesChart: t('reports.customers_sales_chart'),
    outstandingChart: t('reports.customers_outstanding_chart'),
    statusChart: t('reports.customers_status_chart'),
    activity: t('reports.customers_recent_activity'),
    full: t('reports.customers_title'),
  };

  useRegisterModuleActions(
    <>
      <Button
        type="button"
        onClick={() => printSection('full')}
        variant="outline"
        leftIcon={<Printer className="w-4 h-4" />}
      >
        {t('reports.customers_print_report')}
      </Button>
      <Button
        type="button"
        onClick={handleExport}
        variant="outline"
        leftIcon={<Download className="w-4 h-4" />}
      >
        {t('reports.customers_export')}
      </Button>
    </>,
    [printSection, handleExport, t],
  );

  return (
    <>
        {apiReport.error ? <ApiModeBanner module="customers" error={apiReport.error} /> : null}
        <CustomerReportMetrics items={kpis} loading={kpiLoading} />

        <ModuleFilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder={t('reports.customers_search_placeholder')}
          filters={
            <>
              <DateInput value={dateStart} onChange={setDateStart} className={CR_FILTER_INPUT} aria-label={t('reports.customers_date_from')} />
              <DateInput value={dateEnd} onChange={setDateEnd} className={CR_FILTER_INPUT} aria-label={t('reports.customers_date_to')} />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={CR_FILTER_INPUT}>
                <option value="All">{t('reports.customers_all_status')}</option>
                <option value="Active">{t('reports.customers_status_active')}</option>
                <option value="Overdue">{t('reports.customers_status_overdue')}</option>
              </select>
              <button type="button" onClick={handleResetFilters} className={MODULE_FILTER_ACTION_BTN}>
                <Filter className="w-4 h-4" />
                {t('reports.customers_filter')}
              </button>
            </>
          }
        />

        <div className={CR_ANALYTICS_ROW}>
          {kpiLoading ? (
            <>
              <ReportDonutSkeleton />
              <ReportDonutSkeleton />
              <ReportDonutSkeleton />
            </>
          ) : (
            <>
              <CustomerBreakdownDonut
                title={t('reports.customers_sales_chart')}
                icon="flat-color-icons:line-chart"
                slices={salesSlices}
                totalAmount={totalSales}
                colorMap={CR_CUSTOMER_SLICE}
                onPrint={() => printSection('salesChart')}
                printLabel={t('reports.print_section')}
                totalLabel={t('reports.customers_total_label')}
                prefix="cr-sales"
              />
              <CustomerBreakdownDonut
                title={t('reports.customers_outstanding_chart')}
                icon="flat-color-icons:currency-exchange"
                slices={outstandingSlices}
                totalAmount={totalDue}
                colorMap={CR_CUSTOMER_SLICE}
                onPrint={() => printSection('outstandingChart')}
                printLabel={t('reports.print_section')}
                totalLabel={t('reports.customers_total_label')}
                prefix="cr-due"
              />
              <CustomerBreakdownDonut
                title={t('reports.customers_status_chart')}
                icon="fluent-color:people-24"
                slices={statusSlices}
                totalAmount={totalCustomers}
                colorMap={CR_STATUS_SLICE}
                onPrint={() => printSection('statusChart')}
                printLabel={t('reports.print_section')}
                totalLabel={t('reports.customers_total_label')}
                formatCenter={(n) => `${n}`}
                prefix="cr-status"
              />
            </>
          )}
        </div>

        {kpiLoading ? (
          <>
            <ReportTableSkeleton columns={5} />
            <ReportPanelSkeleton lines={5} />
          </>
        ) : (
          <>
            <CustomerSummaryTable rows={filteredRows} onPrint={() => printSection('summary')} />
            <CustomerRecentActivity rows={recentActivity} onPrint={() => printSection('activity')} />
          </>
        )}

        <Footer />

      <CustomerPrintFrame
        printTarget={printTarget}
        reportTitle={t('reports.customers_title')}
        reportingPeriod={reportingPeriod}
        generatedLabel={t('reports.print_generated')}
        filterSummary={filterSummary}
        confidentialLabel={t('reports.print_confidential')}
        preparedByLabel={t('reports.customers_prepared_by')}
        preparedByName={String(appState.currentUser?.name ?? '—')}
        thankYouLabel={t('reports.customers_thank_you')}
        company={appState.companyProfile ?? {}}
        sectionTitles={sectionTitles}
        kpis={kpis}
        rows={filteredRows}
        salesSlices={salesSlices}
        outstandingSlices={outstandingSlices}
        statusSlices={statusSlices}
        recentActivity={recentActivity}
        customersLabel={t('reports.customers_count_label')}
        tableHeaders={{
          sl: t('reports.customers_col_sl'),
          customer: t('reports.customers_col_customer'),
          company: t('reports.customers_col_company'),
          contact: t('reports.customers_col_contact'),
          sales: t('reports.customers_col_sales'),
          outstanding: t('reports.customers_col_outstanding'),
          lastSale: t('reports.customers_col_last_sale'),
          status: t('reports.customers_col_status'),
        }}
        activityHeaders={{
          date: t('reports.customers_activity_date'),
          invoice: t('reports.customers_activity_invoice'),
          customer: t('reports.customers_col_customer'),
          amount: t('reports.customers_activity_amount'),
          payment: t('reports.customers_activity_payment'),
        }}
        totalLabel={t('reports.customers_total_label')}
      />
    </>
  );
}
