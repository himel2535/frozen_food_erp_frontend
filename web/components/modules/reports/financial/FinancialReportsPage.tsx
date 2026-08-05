'use client';

import { useMemo, useState } from 'react';
import { Download, Filter, Printer, Search } from 'lucide-react';
import { Footer } from '@/components/layout/Footer';
import { useRegisterModuleActions } from '@/components/layout/ModuleActionsContext';
import { useAppStore } from '@/lib/state/app-store';
import { toast } from '@/lib/ui/feedback';
import { DateInput } from '@/components/shared/DateInput';
import { FinancialReportMetrics } from '@/components/modules/reports/financial/FinancialReportMetrics';
import { FinancialSummaryTable } from '@/components/modules/reports/financial/FinancialSummaryTable';
import { FinancialTrendChart } from '@/components/modules/reports/financial/FinancialTrendChart';
import { FinancialExpenseDonut } from '@/components/modules/reports/financial/FinancialExpenseDonut';
import { FinancialCashFlowOverview } from '@/components/modules/reports/financial/FinancialCashFlowOverview';
import { FinancialCategorySummary } from '@/components/modules/reports/financial/FinancialCategorySummary';
import { FinancialPrintFrame } from '@/components/modules/reports/financial/FinancialPrintFrame';
import { ReportSectionHeader } from '@/components/modules/reports/shared/ReportSectionHeader';
import { useReportPrint } from '@/components/modules/reports/shared/useReportPrint';
import {
  FR_BOTTOM_ROW,
  FR_FILTER_INPUT,
  FR_MIDDLE_ROW,
  type FinancialPrintSectionId,
} from '@/components/modules/reports/financial/financial-report-styles';
import {
  buildCategorySummary,
  buildExpenseBreakdown,
  buildFinancialKpis,
  calcTotalExpenses,
  filterFinancialRows,
  formatFilterSummary,
  formatReportingPeriod,
  getCashFlowSnapshot,
  getTrendData,
  listFinancialReportRows,
} from '@/components/modules/reports/financial/financial-report-utils';

export function FinancialReportsPage() {
  const appState = useAppStore((s) => s.appState);
  const t = useAppStore((s) => s.t);
  const { printSection, printTarget } = useReportPrint<FinancialPrintSectionId>();

  const [search, setSearch] = useState('');
  const [dateStart, setDateStart] = useState('2026-06-01');
  const [dateEnd, setDateEnd] = useState('2026-06-12');
  const [periodFilter, setPeriodFilter] = useState('This Month');

  const allRows = useMemo(
    () => listFinancialReportRows(Array.isArray(appState.reportFinancial) ? appState.reportFinancial : []),
    [appState.reportFinancial],
  );

  const filters = useMemo(
    () => ({ search, dateStart, dateEnd, period: periodFilter }),
    [search, dateStart, dateEnd, periodFilter],
  );

  const filteredRows = useMemo(() => filterFinancialRows(allRows, filters), [allRows, filters]);

  const kpis = useMemo(() => {
    const items = buildFinancialKpis(filteredRows, t('reports.financial_trend_suffix'));
    const labelKeys: Record<string, string> = {
      revenue: 'reports.financial_kpi_revenue',
      expenses: 'reports.financial_kpi_expenses',
      net: 'reports.financial_kpi_net',
    };
    return items.map((item) => ({ ...item, label: t(labelKeys[item.key] ?? item.label) }));
  }, [filteredRows, t]);

  const expenseSlices = useMemo(() => buildExpenseBreakdown(filteredRows), [filteredRows]);
  const totalExpenses = useMemo(() => calcTotalExpenses(filteredRows), [filteredRows]);
  const categorySummary = useMemo(() => buildCategorySummary(filteredRows), [filteredRows]);
  const trendData = useMemo(() => getTrendData(), []);
  const cashFlow = useMemo(() => getCashFlowSnapshot(), []);

  const filterSummary = useMemo(() => formatFilterSummary(filters), [filters]);
  const reportingPeriod = useMemo(() => formatReportingPeriod(filters), [filters]);

  const handleExport = () => {
    toast.info(t('reports.financial_export_soon'), { module: 'Reports' });
  };

  const handleResetFilters = () => {
    setSearch('');
    setDateStart('2026-06-01');
    setDateEnd('2026-06-12');
    setPeriodFilter('This Month');
  };

  const sectionTitles: Record<FinancialPrintSectionId, string> = {
    metrics: t('reports.financial_print_metrics'),
    summary: t('reports.financial_summary'),
    trend: t('reports.financial_trend_chart'),
    expenseChart: t('reports.financial_expense_chart'),
    cashFlow: t('reports.financial_cash_flow'),
    categorySummary: t('reports.financial_category_summary'),
    full: t('reports.financial_title'),
  };

  useRegisterModuleActions(
    <>
      <button type="button" onClick={() => printSection('full')} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer">
        <Printer className="w-4 h-4" />
        {t('reports.financial_print_report')}
      </button>
      <button type="button" onClick={handleExport} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2 cursor-pointer">
        <Download className="w-4 h-4" />
        {t('reports.financial_export')}
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
                placeholder={t('reports.financial_search_placeholder')}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 font-medium"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <DateInput value={dateStart} onChange={setDateStart} className={FR_FILTER_INPUT} aria-label={t('reports.financial_date_from')} />
              <DateInput value={dateEnd} onChange={setDateEnd} className={FR_FILTER_INPUT} aria-label={t('reports.financial_date_to')} />
              <select value={periodFilter} onChange={(e) => setPeriodFilter(e.target.value)} className={FR_FILTER_INPUT}>
                <option value="This Month">{t('reports.financial_period_this_month')}</option>
                <option value="Last Month">{t('reports.financial_period_last_month')}</option>
                <option value="This Quarter">{t('reports.financial_period_this_quarter')}</option>
              </select>
              <button type="button" onClick={handleResetFilters} className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer">
                <Filter className="w-4 h-4" />
                {t('reports.financial_filter')}
              </button>
            </div>
          </div>
        </div>

        <section>
          <ReportSectionHeader
            title={t('reports.financial_print_metrics')}
            onPrint={() => printSection('metrics')}
            printLabel={t('reports.print_section')}
          />
          <FinancialReportMetrics items={kpis} />
        </section>

        <div className={FR_MIDDLE_ROW}>
          <FinancialSummaryTable rows={filteredRows} onPrint={() => printSection('summary')} />
          <FinancialTrendChart data={trendData} onPrint={() => printSection('trend')} />
        </div>

        <div className={FR_BOTTOM_ROW}>
          <FinancialExpenseDonut
            title={t('reports.financial_expense_chart')}
            slices={expenseSlices}
            totalAmount={totalExpenses}
            onPrint={() => printSection('expenseChart')}
            printLabel={t('reports.print_section')}
            totalLabel={t('reports.financial_total_label')}
          />
          <FinancialCashFlowOverview cashFlow={cashFlow} onPrint={() => printSection('cashFlow')} />
          <FinancialCategorySummary rows={categorySummary} onPrint={() => printSection('categorySummary')} />
        </div>

        <Footer />

      <FinancialPrintFrame
        printTarget={printTarget}
        reportTitle={t('reports.financial_title')}
        reportSubtitle={t('reports.financial_subtitle')}
        reportingPeriod={reportingPeriod}
        reportingPeriodLabel={t('reports.financial_reporting_period')}
        generatedLabel={t('reports.print_generated')}
        filterSummary={filterSummary}
        preparedByLabel={t('reports.financial_prepared_by')}
        preparedByName={String(appState.currentUser?.name ?? '—')}
        thankYouLabel={t('reports.financial_thank_you')}
        pageLabel={t('reports.financial_page_label')}
        company={appState.companyProfile ?? {}}
        sectionTitles={sectionTitles}
        kpis={kpis}
        rows={filteredRows}
        trendData={trendData}
        expenseSlices={expenseSlices}
        totalExpenses={totalExpenses}
        cashFlow={cashFlow}
        categorySummary={categorySummary}
        netProfitLabel={t('reports.financial_net_profit')}
        totalLabel={t('reports.financial_total_label')}
        tableHeaders={{
          line: t('reports.financial_col_line'),
          category: t('reports.financial_col_category'),
          amount: t('reports.financial_col_amount'),
          period: t('reports.financial_col_period'),
          revenue: t('reports.financial_col_revenue'),
          expenses: t('reports.financial_col_expenses'),
          net: t('reports.financial_col_net'),
        }}
        trendHeaders={{
          month: t('reports.financial_trend_month'),
          revenue: t('reports.financial_legend_revenue'),
          expenses: t('reports.financial_legend_expenses'),
          net: t('reports.financial_legend_net'),
        }}
        cashFlowLabels={{
          inflow: t('reports.financial_cash_inflow'),
          outflow: t('reports.financial_cash_outflow'),
          net: t('reports.financial_cash_net'),
          closing: t('reports.financial_cash_closing'),
        }}
      />
    </>
  );
}
