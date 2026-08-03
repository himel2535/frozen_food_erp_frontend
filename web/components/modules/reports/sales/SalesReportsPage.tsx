'use client';

import { useMemo, useState } from 'react';
import { Download, Filter, Printer, Search } from 'lucide-react';
import { Icon } from '@iconify/react';
import { Footer } from '@/components/layout/Footer';
import { MODULE_LIST_SHELL } from '@/lib/ui/module-layout';
import { useAppStore } from '@/lib/state/app-store';
import { toast } from '@/lib/ui/feedback';
import { SalesReportMetrics } from '@/components/modules/reports/sales/SalesReportMetrics';
import { SalesRevenueChart } from '@/components/modules/reports/sales/SalesRevenueChart';
import { SalesStatusDonut } from '@/components/modules/reports/sales/SalesStatusDonut';
import { SalesTopCustomers } from '@/components/modules/reports/sales/SalesTopCustomers';
import { SalesTransactionsTable } from '@/components/modules/reports/sales/SalesTransactionsTable';
import { SalesPrintFrame } from '@/components/modules/reports/sales/SalesPrintFrame';
import { ReportSectionHeader } from '@/components/modules/reports/shared/ReportSectionHeader';
import { useReportPrint } from '@/components/modules/reports/shared/useReportPrint';
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

const STATUS_OPTIONS = ['All', 'Paid', 'Unpaid', 'Partial', 'Cancelled'] as const;

export function SalesReportsPage() {
  const appState = useAppStore((s) => s.appState);
  const t = useAppStore((s) => s.t);
  const { printSection, printTarget } = useReportPrint<SalesPrintSectionId>();

  const [search, setSearch] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [customerFilter, setCustomerFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const allRows = useMemo(
    () => listSalesReportRows(Array.isArray(appState.reportSales) ? appState.reportSales : []),
    [appState.reportSales],
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
    toast.info(t('reports.sales_export_soon'), { module: 'Reports' });
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

  return (
    <>
      <div className={MODULE_LIST_SHELL}>
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <Icon icon="fluent-color:data-trending-24" width={32} height={32} className="shrink-0 mt-0.5" />
            <div className="min-w-0">
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">{t('reports.sales_title')}</h2>
              <p className="text-xs text-slate-500 mt-1 font-medium">{t('reports.sales_subtitle')}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 self-start xl:self-center shrink-0">
            <button
              type="button"
              onClick={() => printSection('full')}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              {t('reports.print_full')}
            </button>
            <button
              type="button"
              onClick={handleExport}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              {t('reports.sales_export')}
            </button>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 premium-shadow">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
            <div className="relative min-w-[240px] flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('reports.sales_search_placeholder')}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 font-medium"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={dateStart}
                onChange={(e) => setDateStart(e.target.value)}
                className={SR_FILTER_INPUT}
                aria-label={t('reports.sales_date_from')}
              />
              <input
                type="date"
                value={dateEnd}
                onChange={(e) => setDateEnd(e.target.value)}
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
              <button
                type="button"
                onClick={handleResetFilters}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer"
              >
                <Filter className="w-4 h-4" />
                {t('reports.sales_filter')}
              </button>
            </div>
          </div>
        </div>

        <section>
          <ReportSectionHeader
            title={t('reports.sales_print_metrics')}
            onPrint={() => printSection('metrics')}
            printLabel={t('reports.print_section')}
          />
          <SalesReportMetrics items={kpis} />
        </section>

        <div className={SR_CHARTS_ROW}>
          <SalesRevenueChart data={chartData} onPrint={() => printSection('revenue')} />
          <SalesStatusDonut summary={statusSummary} onPrint={() => printSection('status')} />
          <SalesTopCustomers customers={topCustomers} onPrint={() => printSection('customers')} />
        </div>

        <SalesTransactionsTable
          rows={filteredRows}
          onPrint={() => printSection('transactions')}
          printLabel={t('reports.print_section')}
        />

        <Footer />
      </div>

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
