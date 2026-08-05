'use client';

import { useMemo, useState } from 'react';
import { Download, Filter, Printer, Search } from 'lucide-react';
import { Footer } from '@/components/layout/Footer';
import { useRegisterModuleActions } from '@/components/layout/ModuleActionsContext';
import { useAppStore } from '@/lib/state/app-store';
import { toast } from '@/lib/ui/feedback';
import { DateInput } from '@/components/shared/DateInput';
import { CustomerReportMetrics } from '@/components/modules/reports/customers/CustomerReportMetrics';
import { CustomerSummaryTable } from '@/components/modules/reports/customers/CustomerSummaryTable';
import { CustomerBreakdownDonut } from '@/components/modules/reports/customers/CustomerBreakdownDonut';
import { CustomerRecentActivity } from '@/components/modules/reports/customers/CustomerRecentActivity';
import { CustomerPrintFrame } from '@/components/modules/reports/customers/CustomerPrintFrame';
import { ReportSectionHeader } from '@/components/modules/reports/shared/ReportSectionHeader';
import { useReportPrint } from '@/components/modules/reports/shared/useReportPrint';
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

export function CustomerReportsPage() {
  const appState = useAppStore((s) => s.appState);
  const t = useAppStore((s) => s.t);
  const { printSection, printTarget } = useReportPrint<CustomerPrintSectionId>();

  const [search, setSearch] = useState('');
  const [dateStart, setDateStart] = useState('2026-06-01');
  const [dateEnd, setDateEnd] = useState('2026-06-12');
  const [statusFilter, setStatusFilter] = useState('All');

  const allRows = useMemo(
    () => listCustomerReportRows(Array.isArray(appState.reportCustomers) ? appState.reportCustomers : []),
    [appState.reportCustomers],
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
    toast.info(t('reports.customers_export_soon'), { module: 'Reports' });
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
      <button type="button" onClick={() => printSection('full')} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer">
        <Printer className="w-4 h-4" />
        {t('reports.customers_print_report')}
      </button>
      <button type="button" onClick={handleExport} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2 cursor-pointer">
        <Download className="w-4 h-4" />
        {t('reports.customers_export')}
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
                placeholder={t('reports.customers_search_placeholder')}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 font-medium"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <DateInput value={dateStart} onChange={setDateStart} className={CR_FILTER_INPUT} aria-label={t('reports.customers_date_from')} />
              <DateInput value={dateEnd} onChange={setDateEnd} className={CR_FILTER_INPUT} aria-label={t('reports.customers_date_to')} />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={CR_FILTER_INPUT}>
                <option value="All">{t('reports.customers_all_status')}</option>
                <option value="Active">{t('reports.customers_status_active')}</option>
                <option value="Overdue">{t('reports.customers_status_overdue')}</option>
              </select>
              <button type="button" onClick={handleResetFilters} className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer">
                <Filter className="w-4 h-4" />
                {t('reports.customers_filter')}
              </button>
            </div>
          </div>
        </div>

        <section>
          <ReportSectionHeader
            title={t('reports.customers_print_metrics')}
            onPrint={() => printSection('metrics')}
            printLabel={t('reports.print_section')}
          />
          <CustomerReportMetrics items={kpis} />
        </section>

        <div className={CR_ANALYTICS_ROW}>
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
        </div>

        <CustomerSummaryTable rows={filteredRows} onPrint={() => printSection('summary')} />

        <CustomerRecentActivity rows={recentActivity} onPrint={() => printSection('activity')} />

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
