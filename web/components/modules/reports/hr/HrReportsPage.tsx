'use client';

import { useMemo, useState } from 'react';
import { Download, Filter, Printer } from 'lucide-react';
import { Footer } from '@/components/layout/Footer';
import { useRegisterModuleActions } from '@/components/layout/ModuleActionsContext';
import { useAppStore } from '@/lib/state/app-store';
import { toast } from '@/lib/ui/feedback';
import { DateInput } from '@/components/shared/DateInput';
import { HrReportMetrics } from '@/components/modules/reports/hr/HrReportMetrics';
import { HrDepartmentTable } from '@/components/modules/reports/hr/HrDepartmentTable';
import { HrKeyMetrics } from '@/components/modules/reports/hr/HrKeyMetrics';
import { HrDepartmentDonut } from '@/components/modules/reports/hr/HrDepartmentDonut';
import { HrGenderDonut } from '@/components/modules/reports/hr/HrGenderDonut';
import { HrJoinersLeaversChart } from '@/components/modules/reports/hr/HrJoinersLeaversChart';
import { HrRecentJoiners } from '@/components/modules/reports/hr/HrRecentJoiners';
import { HrRecentLeavers } from '@/components/modules/reports/hr/HrRecentLeavers';
import { HrUpcomingBirthdays } from '@/components/modules/reports/hr/HrUpcomingBirthdays';
import { HrPrintFrame } from '@/components/modules/reports/hr/HrPrintFrame';
import { useReportPrint } from '@/components/modules/reports/shared/useReportPrint';
import { ModuleFilterBar } from '@/components/shared/ModuleFilterBar';
import { MODULE_FILTER_ACTION_BTN, MODULE_PRINT_BTN } from '@/lib/ui/module-chrome-styles';
import {
  HR_BOTTOM_ROW,
  HR_CHARTS_ROW,
  HR_FILTER_INPUT,
  type HrPrintSectionId,
} from '@/components/modules/reports/hr/hr-report-styles';
import {
  buildDepartmentBreakdown,
  buildGenderBreakdown,
  buildHrKpis,
  filterHrBirthdays,
  filterHrDepartments,
  filterHrJoiners,
  filterHrLeavers,
  formatFilterSummary,
  formatReportingPeriod,
  getJoinersLeaversTrend,
  getKeyMetrics,
  listHrBirthdayRows,
  listHrDepartmentRows,
  listHrJoinerRows,
  listHrLeaverRows,
  sumDepartmentTotals,
  uniqueDepartments,
} from '@/components/modules/reports/hr/hr-report-utils';
import { exportHrReportCsv } from '@/lib/services/report-export';

export function HrReportsPage() {
  const appState = useAppStore((s) => s.appState);
  const t = useAppStore((s) => s.t);
  const { printSection, printTarget } = useReportPrint<HrPrintSectionId>();

  const [search, setSearch] = useState('');
  const [dateStart, setDateStart] = useState('2026-06-01');
  const [dateEnd, setDateEnd] = useState('2026-06-30');
  const [departmentFilter, setDepartmentFilter] = useState('All');

  const allDepartments = useMemo(
    () => listHrDepartmentRows(Array.isArray(appState.reportHRDepartments) ? appState.reportHRDepartments : []),
    [appState.reportHRDepartments],
  );

  const allJoiners = useMemo(
    () => listHrJoinerRows(Array.isArray(appState.reportHRJoiners) ? appState.reportHRJoiners : []),
    [appState.reportHRJoiners],
  );

  const allLeavers = useMemo(
    () => listHrLeaverRows(Array.isArray(appState.reportHRLeavers) ? appState.reportHRLeavers : []),
    [appState.reportHRLeavers],
  );

  const allBirthdays = useMemo(
    () => listHrBirthdayRows(Array.isArray(appState.reportHRBirthdays) ? appState.reportHRBirthdays : []),
    [appState.reportHRBirthdays],
  );

  const filters = useMemo(
    () => ({ search, dateStart, dateEnd, department: departmentFilter }),
    [search, dateStart, dateEnd, departmentFilter],
  );

  const filteredDepartments = useMemo(() => filterHrDepartments(allDepartments, filters), [allDepartments, filters]);
  const filteredJoiners = useMemo(() => filterHrJoiners(allJoiners, filters), [allJoiners, filters]);
  const filteredLeavers = useMemo(() => filterHrLeavers(allLeavers, filters), [allLeavers, filters]);
  const filteredBirthdays = useMemo(() => filterHrBirthdays(allBirthdays, filters), [allBirthdays, filters]);

  const departmentOptions = useMemo(() => uniqueDepartments(allDepartments), [allDepartments]);

  const kpis = useMemo(() => {
    const items = buildHrKpis(filteredDepartments, t('reports.hr_trend_suffix'));
    const labelKeys: Record<string, string> = {
      headcount: 'reports.hr_kpi_headcount',
      metrics: 'reports.hr_kpi_metrics',
    };
    return items.map((item) => ({ ...item, label: t(labelKeys[item.key] ?? item.label) }));
  }, [filteredDepartments, t]);

  const deptSlices = useMemo(() => buildDepartmentBreakdown(filteredDepartments), [filteredDepartments]);
  const genderSlices = useMemo(() => buildGenderBreakdown(filteredDepartments), [filteredDepartments]);
  const totalHeadcount = useMemo(() => sumDepartmentTotals(filteredDepartments).total, [filteredDepartments]);
  const keyMetrics = useMemo(() => getKeyMetrics(), []);
  const trendData = useMemo(() => getJoinersLeaversTrend(), []);

  const filterSummary = useMemo(() => formatFilterSummary(filters), [filters]);
  const reportingPeriod = useMemo(() => formatReportingPeriod(filters), [filters]);

  const handleExport = () => {
    const count = exportHrReportCsv({
      title: t('reports.hr_title'),
      filterSummary,
      kpis,
      departments: filteredDepartments,
      joiners: filteredJoiners,
      leavers: filteredLeavers,
      birthdays: filteredBirthdays,
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
    setDateEnd('2026-06-30');
    setDepartmentFilter('All');
  };

  const sectionTitles: Record<HrPrintSectionId, string> = {
    metrics: t('reports.hr_print_metrics'),
    departments: t('reports.hr_departments'),
    keyMetrics: t('reports.hr_key_metrics'),
    deptChart: t('reports.hr_dept_chart'),
    genderChart: t('reports.hr_gender_chart'),
    joinersTrend: t('reports.hr_joiners_leavers_chart'),
    joiners: t('reports.hr_recent_joiners'),
    leavers: t('reports.hr_recent_leavers'),
    birthdays: t('reports.hr_upcoming_birthdays'),
    full: t('reports.hr_title'),
  };

  useRegisterModuleActions(
    <>
      <button
        type="button"
        onClick={() => printSection('full')}
        className={MODULE_PRINT_BTN}
      >
        <Printer className="w-4 h-4" />
        {t('reports.hr_print_report')}
      </button>
      <button
        type="button"
        onClick={handleExport}
        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
      >
        <Download className="w-4 h-4" />
        {t('reports.hr_export')}
      </button>
    </>,
    [printSection, handleExport, t],
  );

  return (
    <>
        <HrReportMetrics items={kpis} />

        <ModuleFilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder={t('reports.hr_search_placeholder')}
          filters={
            <>
              <DateInput value={dateStart} onChange={setDateStart} className={HR_FILTER_INPUT} aria-label={t('reports.hr_date_from')} />
              <DateInput value={dateEnd} onChange={setDateEnd} className={HR_FILTER_INPUT} aria-label={t('reports.hr_date_to')} />
              <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} className={HR_FILTER_INPUT}>
                <option value="All">{t('reports.hr_dept_all')}</option>
                {departmentOptions.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              <button type="button" onClick={handleResetFilters} className={MODULE_FILTER_ACTION_BTN}>
                <Filter className="w-4 h-4" />
                {t('reports.hr_filter')}
              </button>
            </>
          }
        />

        <HrKeyMetrics metrics={keyMetrics} onPrint={() => printSection('keyMetrics')} />

        <div className={HR_CHARTS_ROW}>
          <HrDepartmentDonut
            slices={deptSlices}
            totalHeadcount={totalHeadcount}
            onPrint={() => printSection('deptChart')}
          />
          <HrGenderDonut
            slices={genderSlices}
            totalHeadcount={totalHeadcount}
            onPrint={() => printSection('genderChart')}
          />
          <HrJoinersLeaversChart data={trendData} onPrint={() => printSection('joinersTrend')} />
        </div>

        <HrDepartmentTable rows={filteredDepartments} onPrint={() => printSection('departments')} />

        <div className={HR_BOTTOM_ROW}>
          <HrRecentJoiners rows={filteredJoiners} onPrint={() => printSection('joiners')} />
          <HrRecentLeavers rows={filteredLeavers} onPrint={() => printSection('leavers')} />
          <HrUpcomingBirthdays rows={filteredBirthdays} onPrint={() => printSection('birthdays')} />
        </div>

        <Footer />

      <HrPrintFrame
        printTarget={printTarget}
        reportTitle={t('reports.hr_title')}
        reportSubtitle={t('reports.hr_subtitle')}
        reportingPeriod={reportingPeriod}
        reportingPeriodLabel={t('reports.hr_reporting_period')}
        generatedLabel={t('reports.print_generated')}
        filterSummary={filterSummary}
        preparedByLabel={t('reports.hr_prepared_by')}
        preparedByName={String(appState.currentUser?.name ?? '—')}
        thankYouLabel={t('reports.hr_thank_you')}
        pageLabel={t('reports.hr_page_label')}
        company={appState.companyProfile ?? {}}
        sectionTitles={sectionTitles}
        kpis={kpis}
        departments={filteredDepartments}
        keyMetrics={keyMetrics}
        deptSlices={deptSlices}
        genderSlices={genderSlices}
        totalHeadcount={totalHeadcount}
        trendData={trendData}
        joiners={filteredJoiners}
        leavers={filteredLeavers}
        birthdays={filteredBirthdays}
        totalLabel={t('reports.hr_total')}
        yearsLabel={t('reports.hr_years')}
        noLeaversLabel={t('reports.hr_no_leavers')}
        noJoinersLabel={t('reports.hr_no_joiners')}
        noBirthdaysLabel={t('reports.hr_no_birthdays')}
        tableHeaders={{
          department: t('reports.hr_col_department'),
          total: t('reports.hr_col_total'),
          male: t('reports.hr_col_male'),
          female: t('reports.hr_col_female'),
          joined: t('reports.hr_col_joined'),
          left: t('reports.hr_col_left'),
          netChange: t('reports.hr_col_net_change'),
          gender: t('reports.hr_col_gender'),
          month: t('reports.hr_col_month'),
          employeeId: t('reports.hr_col_employee_id'),
          name: t('reports.hr_col_name'),
          designation: t('reports.hr_col_designation'),
          joinDate: t('reports.hr_col_join_date'),
          leftDate: t('reports.hr_col_left_date'),
          birthDate: t('reports.hr_col_birth_date'),
        }}
        keyMetricLabels={{
          avgAge: t('reports.hr_metric_avg_age'),
          avgTenure: t('reports.hr_metric_avg_tenure'),
          attendance: t('reports.hr_metric_attendance'),
          leave: t('reports.hr_metric_leave'),
        }}
      />
    </>
  );
}
