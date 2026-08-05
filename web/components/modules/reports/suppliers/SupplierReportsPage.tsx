'use client';

import { useMemo, useState } from 'react';
import { Download, Filter, Printer, Search } from 'lucide-react';
import { Footer } from '@/components/layout/Footer';
import { useRegisterModuleActions } from '@/components/layout/ModuleActionsContext';
import { useAppStore } from '@/lib/state/app-store';
import { toast } from '@/lib/ui/feedback';
import { DateInput } from '@/components/shared/DateInput';
import { formatCurrency } from '@/lib/services/domain-service';
import { SupplierReportMetrics } from '@/components/modules/reports/suppliers/SupplierReportMetrics';
import { SupplierSummaryTable } from '@/components/modules/reports/suppliers/SupplierSummaryTable';
import { SupplierBreakdownDonut } from '@/components/modules/reports/suppliers/SupplierBreakdownDonut';
import { SupplierRecentActivity } from '@/components/modules/reports/suppliers/SupplierRecentActivity';
import { SupplierReportSummary } from '@/components/modules/reports/suppliers/SupplierReportSummary';
import { SupplierPrintFrame } from '@/components/modules/reports/suppliers/SupplierPrintFrame';
import { ReportSectionHeader } from '@/components/modules/reports/shared/ReportSectionHeader';
import { useReportPrint } from '@/components/modules/reports/shared/useReportPrint';
import {
  SR_ANALYTICS_ROW,
  SR_BOTTOM_ROW,
  SR_FILTER_INPUT,
  SR_PAYABLES_STATUS_SLICE,
  SR_SUPPLIER_SLICE,
  type SupplierPrintSectionId,
} from '@/components/modules/reports/suppliers/supplier-report-styles';
import {
  buildPayablesBySupplier,
  buildPayablesStatusBreakdown,
  buildPurchasesBySupplier,
  buildRecentPurchaseActivity,
  buildSupplierKpis,
  filterSupplierRows,
  formatFilterSummary,
  formatReportingPeriod,
  listSupplierReportRows,
} from '@/components/modules/reports/suppliers/supplier-report-utils';

export function SupplierReportsPage() {
  const appState = useAppStore((s) => s.appState);
  const t = useAppStore((s) => s.t);
  const { printSection, printTarget } = useReportPrint<SupplierPrintSectionId>();

  const [search, setSearch] = useState('');
  const [dateStart, setDateStart] = useState('2026-06-01');
  const [dateEnd, setDateEnd] = useState('2026-06-12');
  const [statusFilter, setStatusFilter] = useState('All');

  const allRows = useMemo(
    () => listSupplierReportRows(Array.isArray(appState.reportSuppliers) ? appState.reportSuppliers : []),
    [appState.reportSuppliers],
  );

  const filters = useMemo(
    () => ({ search, dateStart, dateEnd, status: statusFilter }),
    [search, dateStart, dateEnd, statusFilter],
  );

  const filteredRows = useMemo(() => filterSupplierRows(allRows, filters), [allRows, filters]);

  const kpis = useMemo(() => {
    const items = buildSupplierKpis(filteredRows, t('reports.suppliers_trend_suffix'));
    const labelKeys: Record<string, string> = {
      purchases: 'reports.suppliers_kpi_purchases',
      payables: 'reports.suppliers_kpi_payables',
      count: 'reports.suppliers_kpi_count',
      active: 'reports.suppliers_kpi_active',
      overdue: 'reports.suppliers_kpi_overdue',
    };
    return items.map((item) => ({ ...item, label: t(labelKeys[item.key] ?? item.label) }));
  }, [filteredRows, t]);

  const purchasesSlices = useMemo(() => buildPurchasesBySupplier(filteredRows), [filteredRows]);
  const payablesSlices = useMemo(() => buildPayablesBySupplier(filteredRows), [filteredRows]);
  const payablesStatusSlices = useMemo(() => buildPayablesStatusBreakdown(filteredRows), [filteredRows]);
  const totalPurchases = useMemo(() => filteredRows.reduce((s, r) => s + r.purchases, 0), [filteredRows]);
  const totalPayables = useMemo(() => filteredRows.reduce((s, r) => s + r.due, 0), [filteredRows]);
  const totalSuppliers = filteredRows.length;

  const recentActivity = useMemo(
    () =>
      buildRecentPurchaseActivity(
        Array.isArray(appState.reportPurchases) ? appState.reportPurchases : [],
        filteredRows.map((r) => r.name),
      ),
    [appState.reportPurchases, filteredRows],
  );

  const filterSummary = useMemo(() => formatFilterSummary(filters), [filters]);
  const reportingPeriod = useMemo(() => formatReportingPeriod(filters), [filters]);

  const handleExport = () => {
    toast.info(t('reports.suppliers_export_soon'), { module: 'Reports' });
  };

  const handleResetFilters = () => {
    setSearch('');
    setDateStart('2026-06-01');
    setDateEnd('2026-06-12');
    setStatusFilter('All');
  };

  const sectionTitles: Record<SupplierPrintSectionId, string> = {
    metrics: t('reports.suppliers_print_metrics'),
    purchasesChart: t('reports.suppliers_purchases_chart'),
    payablesChart: t('reports.suppliers_payables_chart'),
    payablesStatusChart: t('reports.suppliers_payables_status_chart'),
    summary: t('reports.suppliers_summary'),
    activity: t('reports.suppliers_recent_activity'),
    full: t('reports.suppliers_title'),
  };

  useRegisterModuleActions(
    <>
      <button type="button" onClick={() => printSection('full')} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer">
        <Printer className="w-4 h-4" />
        {t('reports.suppliers_print_report')}
      </button>
      <button type="button" onClick={handleExport} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2 cursor-pointer">
        <Download className="w-4 h-4" />
        {t('reports.suppliers_export')}
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
                placeholder={t('reports.suppliers_search_placeholder')}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 font-medium"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <DateInput value={dateStart} onChange={setDateStart} className={SR_FILTER_INPUT} aria-label={t('reports.suppliers_date_from')} />
              <DateInput value={dateEnd} onChange={setDateEnd} className={SR_FILTER_INPUT} aria-label={t('reports.suppliers_date_to')} />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={SR_FILTER_INPUT}>
                <option value="All">{t('reports.suppliers_all_status')}</option>
                <option value="Active">{t('reports.suppliers_status_active')}</option>
                <option value="Inactive">{t('reports.suppliers_status_inactive')}</option>
              </select>
              <button type="button" onClick={handleResetFilters} className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer">
                <Filter className="w-4 h-4" />
                {t('reports.suppliers_filter')}
              </button>
            </div>
          </div>
        </div>

        <section>
          <ReportSectionHeader
            title={t('reports.suppliers_print_metrics')}
            onPrint={() => printSection('metrics')}
            printLabel={t('reports.print_section')}
          />
          <SupplierReportMetrics items={kpis} />
        </section>

        <div className={SR_ANALYTICS_ROW}>
          <SupplierBreakdownDonut
            title={t('reports.suppliers_purchases_chart')}
            icon="flat-color-icons:shop"
            slices={purchasesSlices}
            totalAmount={totalPurchases}
            colorMap={SR_SUPPLIER_SLICE}
            onPrint={() => printSection('purchasesChart')}
            printLabel={t('reports.print_section')}
            totalLabel={t('reports.suppliers_total_label')}
            prefix="sr-purchases"
          />
          <SupplierBreakdownDonut
            title={t('reports.suppliers_payables_chart')}
            icon="flat-color-icons:currency-exchange"
            slices={payablesSlices}
            totalAmount={totalPayables}
            colorMap={SR_SUPPLIER_SLICE}
            onPrint={() => printSection('payablesChart')}
            printLabel={t('reports.print_section')}
            totalLabel={t('reports.suppliers_total_label')}
            prefix="sr-payables"
          />
          <SupplierBreakdownDonut
            title={t('reports.suppliers_payables_status_chart')}
            icon="fluent-color:payment-24"
            slices={payablesStatusSlices}
            totalAmount={totalSuppliers}
            colorMap={SR_PAYABLES_STATUS_SLICE}
            onPrint={() => printSection('payablesStatusChart')}
            printLabel={t('reports.print_section')}
            totalLabel={t('reports.suppliers_total_label')}
            formatCenter={() => formatCurrency(totalPayables)}
            prefix="sr-status"
          />
        </div>

        <SupplierSummaryTable rows={filteredRows} onPrint={() => printSection('summary')} />

        <div className={SR_BOTTOM_ROW}>
          <SupplierRecentActivity rows={recentActivity} onPrint={() => printSection('activity')} />
          <SupplierReportSummary items={kpis} />
        </div>

        <Footer />

      <SupplierPrintFrame
        printTarget={printTarget}
        reportTitle={t('reports.suppliers_title')}
        reportSubtitle={t('reports.suppliers_subtitle')}
        reportingPeriod={reportingPeriod}
        reportingPeriodLabel={t('reports.suppliers_reporting_period')}
        generatedLabel={t('reports.print_generated')}
        filterSummary={filterSummary}
        preparedByLabel={t('reports.suppliers_prepared_by')}
        preparedByName={String(appState.currentUser?.name ?? '—')}
        thankYouLabel={t('reports.suppliers_thank_you')}
        pageLabel={t('reports.suppliers_page_label')}
        company={appState.companyProfile ?? {}}
        sectionTitles={sectionTitles}
        kpis={kpis}
        rows={filteredRows}
        purchasesSlices={purchasesSlices}
        payablesSlices={payablesSlices}
        payablesStatusSlices={payablesStatusSlices}
        recentActivity={recentActivity}
        suppliersLabel={t('reports.suppliers_count_label')}
        tableHeaders={{
          sl: t('reports.suppliers_col_sl'),
          supplier: t('reports.suppliers_col_supplier'),
          contactPerson: t('reports.suppliers_col_contact_person'),
          phone: t('reports.suppliers_col_phone'),
          email: t('reports.suppliers_col_email'),
          purchases: t('reports.suppliers_col_purchases'),
          payables: t('reports.suppliers_col_payables'),
          lastPurchase: t('reports.suppliers_col_last_purchase'),
          status: t('reports.suppliers_col_status'),
        }}
        activityHeaders={{
          date: t('reports.suppliers_activity_date'),
          po: t('reports.suppliers_activity_po'),
          supplier: t('reports.suppliers_col_supplier'),
          items: t('reports.suppliers_activity_items'),
          amount: t('reports.suppliers_activity_amount'),
          payment: t('reports.suppliers_activity_payment'),
        }}
        totalLabel={t('reports.suppliers_total_label')}
      />
    </>
  );
}
