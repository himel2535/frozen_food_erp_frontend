'use client';

import { useMemo, useState } from 'react';
import { Download, Filter, Printer } from 'lucide-react';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/shared/Button';
import { useRegisterModuleActions } from '@/components/layout/ModuleActionsContext';
import { useSupplierReportApiRows } from '@/hooks/use-report-api-data';
import { ApiModeBanner } from '@/components/shared/ApiModeBanner';
import { useAppStore } from '@/lib/state/app-store';
import { isMongoDbBackend } from '@/lib/config/data-source';
import { isKpiBootLoading, pickApiReportRows } from '@/lib/ui/kpi-loading';
import { toast } from '@/lib/ui/feedback';
import { DateInput } from '@/components/shared/DateInput';
import { formatCurrency } from '@/lib/services/domain-service';
import { SupplierReportMetrics } from '@/components/modules/reports/suppliers/SupplierReportMetrics';
import { SupplierSummaryTable } from '@/components/modules/reports/suppliers/SupplierSummaryTable';
import { SupplierBreakdownDonut } from '@/components/modules/reports/suppliers/SupplierBreakdownDonut';
import { SupplierRecentActivity } from '@/components/modules/reports/suppliers/SupplierRecentActivity';
import { SupplierReportSummary } from '@/components/modules/reports/suppliers/SupplierReportSummary';
import { SupplierPrintFrame } from '@/components/modules/reports/suppliers/SupplierPrintFrame';
import { useReportPrint } from '@/components/modules/reports/shared/useReportPrint';
import { ModuleFilterBar } from '@/components/shared/ModuleFilterBar';
import { MODULE_FILTER_ACTION_BTN, MODULE_PRINT_BTN } from '@/lib/ui/module-chrome-styles';
import {
  ReportDonutSkeleton,
  ReportPanelSkeleton,
  ReportTableSkeleton,
} from '@/components/modules/reports/shared/ReportSectionSkeleton';
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
import { exportSupplierReportCsv } from '@/lib/services/report-export';

export function SupplierReportsPage() {
  const appState = useAppStore((s) => s.appState);
  const apiMode = isMongoDbBackend();
  const apiReport = useSupplierReportApiRows();
  const kpiLoading = isKpiBootLoading(apiMode, apiReport.initialized);
  const t = useAppStore((s) => s.t);
  const { printSection, printTarget } = useReportPrint<SupplierPrintSectionId>();

  const [search, setSearch] = useState('');
  const [dateStart, setDateStart] = useState('2026-06-01');
  const [dateEnd, setDateEnd] = useState('2026-06-12');
  const [statusFilter, setStatusFilter] = useState('All');

  const allRows = useMemo(
    () => listSupplierReportRows(
      pickApiReportRows(
        apiMode,
        apiReport.initialized,
        apiReport.rows,
        Array.isArray(appState.reportSuppliers) ? appState.reportSuppliers : [],
      ),
    ),
    [apiMode, apiReport.initialized, apiReport.rows, appState.reportSuppliers],
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
    const count = exportSupplierReportCsv({
      title: t('reports.suppliers_title'),
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
      <Button
        type="button"
        onClick={() => printSection('full')}
        variant="outline"
        leftIcon={<Printer className="w-4 h-4" />}
      >
        {t('reports.suppliers_print_report')}
      </Button>
      <Button
        type="button"
        onClick={handleExport}
        variant="outline"
        leftIcon={<Download className="w-4 h-4" />}
      >
        {t('reports.suppliers_export')}
      </Button>
    </>,
    [printSection, handleExport, t],
  );

  return (
    <>
        {apiReport.error ? <ApiModeBanner module="suppliers" error={apiReport.error} /> : null}
        <SupplierReportMetrics items={kpis} loading={kpiLoading} />

        <ModuleFilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder={t('reports.suppliers_search_placeholder')}
          filters={
            <>
              <DateInput value={dateStart} onChange={setDateStart} className={SR_FILTER_INPUT} aria-label={t('reports.suppliers_date_from')} />
              <DateInput value={dateEnd} onChange={setDateEnd} className={SR_FILTER_INPUT} aria-label={t('reports.suppliers_date_to')} />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={SR_FILTER_INPUT}>
                <option value="All">{t('reports.suppliers_all_status')}</option>
                <option value="Active">{t('reports.suppliers_status_active')}</option>
                <option value="Inactive">{t('reports.suppliers_status_inactive')}</option>
              </select>
              <button type="button" onClick={handleResetFilters} className={MODULE_FILTER_ACTION_BTN}>
                <Filter className="w-4 h-4" />
                {t('reports.suppliers_filter')}
              </button>
            </>
          }
        />

        <div className={SR_ANALYTICS_ROW}>
          {kpiLoading ? (
            <>
              <ReportDonutSkeleton />
              <ReportDonutSkeleton />
              <ReportDonutSkeleton />
            </>
          ) : (
            <>
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
            </>
          )}
        </div>

        {kpiLoading ? (
          <>
            <ReportTableSkeleton columns={5} />
            <div className={SR_BOTTOM_ROW}>
              <ReportPanelSkeleton lines={5} />
              <ReportPanelSkeleton lines={4} />
            </div>
          </>
        ) : (
          <>
            <SupplierSummaryTable rows={filteredRows} onPrint={() => printSection('summary')} />
            <div className={SR_BOTTOM_ROW}>
              <SupplierRecentActivity rows={recentActivity} onPrint={() => printSection('activity')} />
              <SupplierReportSummary items={kpis} />
            </div>
          </>
        )}

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
