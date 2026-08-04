'use client';

import { createPortal } from 'react-dom';
import { Icon } from '@iconify/react';
import { RP_PRINT_BODY, RP_PRINT_SECTION, RP_PRINT_TABLE, RP_PRINT_TD, RP_PRINT_TH, RP_ROOT } from '@/components/modules/reports/shared/report-print-styles';
import { resolveKpiIconsForRow } from '@/lib/ui/kpi-icons';
import type { KpiCardItem } from '@/components/shared/KpiCards';
import type { HrPrintSectionId } from '@/components/modules/reports/hr/hr-report-styles';
import type {
  HrBirthdayRow,
  HrBreakdownSlice,
  HrDepartmentRow,
  HrJoinerRow,
  HrJoinersLeaversPoint,
  HrKeyMetricsSnapshot,
  HrLeaverRow,
} from '@/components/modules/reports/hr/hr-report-utils';
import { sumDepartmentTotals } from '@/components/modules/reports/hr/hr-report-utils';

type CompanyProfile = {
  name?: string;
  legalName?: string;
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
};

type HrPrintFrameProps = {
  printTarget: HrPrintSectionId | null;
  reportTitle: string;
  reportSubtitle: string;
  reportingPeriod: string;
  reportingPeriodLabel: string;
  generatedLabel: string;
  filterSummary: string;
  preparedByLabel: string;
  preparedByName: string;
  thankYouLabel: string;
  pageLabel: string;
  company: CompanyProfile;
  sectionTitles: Record<HrPrintSectionId, string>;
  kpis: KpiCardItem[];
  departments: HrDepartmentRow[];
  keyMetrics: HrKeyMetricsSnapshot;
  deptSlices: HrBreakdownSlice[];
  genderSlices: HrBreakdownSlice[];
  totalHeadcount: number;
  trendData: HrJoinersLeaversPoint[];
  joiners: HrJoinerRow[];
  leavers: HrLeaverRow[];
  birthdays: HrBirthdayRow[];
  tableHeaders: Record<string, string>;
  keyMetricLabels: Record<string, string>;
  yearsLabel: string;
  noLeaversLabel: string;
  noJoinersLabel: string;
  noBirthdaysLabel: string;
  totalLabel: string;
};

function shouldShowSection(target: HrPrintSectionId | null, section: HrPrintSectionId) {
  if (!target) return false;
  return target === 'full' || target === section;
}

export function HrPrintFrame(props: HrPrintFrameProps) {
  if (typeof document === 'undefined' || !props.printTarget) return null;

  const {
    printTarget,
    reportTitle,
    reportSubtitle,
    reportingPeriod,
    reportingPeriodLabel,
    generatedLabel,
    filterSummary,
    preparedByLabel,
    preparedByName,
    thankYouLabel,
    pageLabel,
    company,
    sectionTitles,
    kpis,
    departments,
    keyMetrics,
    deptSlices,
    genderSlices,
    totalHeadcount,
    trendData,
    joiners,
    leavers,
    birthdays,
    tableHeaders,
    keyMetricLabels,
    yearsLabel,
    noLeaversLabel,
    noJoinersLabel,
    noBirthdaysLabel,
    totalLabel,
  } = props;

  const kpiIconIds = resolveKpiIconsForRow(kpis);

  const generatedAt = new Date().toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const address = [company.street, company.city, company.state, company.postalCode, company.country]
    .filter(Boolean)
    .join(', ');

  const deptTotals = sumDepartmentTotals(departments);

  return createPortal(
    <div className={`${RP_ROOT} hr-print-root inventory-print-root`} data-print-target={printTarget}>
      <div className={`${RP_PRINT_BODY} hr-print-body inventory-print-body`}>
        <header className="inventory-print-letterhead">
          <div className="inventory-print-letterhead-left">
            <p className="inventory-print-brand">{company.name ?? 'ToysFactory ERP'}</p>
            <p className="inventory-print-legal">{company.legalName}</p>
            {address ? <p className="inventory-print-meta">{address}</p> : null}
            <p className="inventory-print-meta">
              {[company.phone, company.email, company.website].filter(Boolean).join(' · ')}
            </p>
          </div>
          <div className="inventory-print-letterhead-center">
            <h1 className="inventory-print-doc-title">{reportTitle.toUpperCase()}</h1>
            <p className="inventory-print-meta">{reportSubtitle}</p>
            <p className="supplier-print-period-label">{reportingPeriodLabel}</p>
            <p className="inventory-print-period-badge">{reportingPeriod}</p>
          </div>
          <div className="inventory-print-letterhead-right">
            <p className="inventory-print-meta">{generatedLabel}: {generatedAt}</p>
            <div className="inventory-print-qr" aria-hidden>
              <span>QR</span>
            </div>
          </div>
        </header>

        <p className="inventory-print-filter-line">{filterSummary}</p>

        {shouldShowSection(printTarget, 'metrics') ? (
          <section className={`${RP_PRINT_SECTION} hr-print-section`}>
            <h2>{sectionTitles.metrics}</h2>
            {printTarget === 'full' ? (
              <div className="supplier-print-kpi-row hr-print-kpi-row">
                {kpis.map((item, index) => {
                  const iconId = kpiIconIds[index];
                  return (
                    <div key={item.key} className="supplier-print-kpi-card">
                      {iconId ? <Icon icon={iconId} width={24} height={24} /> : null}
                      <span className="supplier-print-kpi-label">{item.label}</span>
                      <span className="supplier-print-kpi-value">{item.value}</span>
                      {item.sub ? <span className="supplier-print-kpi-sub">{item.sub}</span> : null}
                    </div>
                  );
                })}
              </div>
            ) : (
              <table className={RP_PRINT_TABLE}>
                <thead>
                  <tr>
                    {kpis.map((item) => (
                      <th key={item.key} className={`${RP_PRINT_TH} inventory-print-th`}>{item.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {kpis.map((item) => (
                      <td key={item.key} className={RP_PRINT_TD}>
                        <div className="font-extrabold">{item.value}</div>
                        {item.sub ? <div className="text-[10px] text-slate-500 mt-1">{item.sub}</div> : null}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            )}
          </section>
        ) : null}

        {printTarget === 'full' ? (
          <div className="hr-print-middle-row">
            {shouldShowSection(printTarget, 'departments') ? (
              <section className={`${RP_PRINT_SECTION} hr-print-section`}>
                <h2>{sectionTitles.departments}</h2>
                <table className={RP_PRINT_TABLE}>
                  <thead>
                    <tr>
                      <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.department}</th>
                      <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.total}</th>
                      <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.male}</th>
                      <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.female}</th>
                      <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.joined}</th>
                      <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.left}</th>
                      <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.netChange}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {departments.map((row) => (
                      <tr key={row.id}>
                        <td className={RP_PRINT_TD}>{row.department}</td>
                        <td className={RP_PRINT_TD}>{row.total}</td>
                        <td className={RP_PRINT_TD}>{row.male}</td>
                        <td className={RP_PRINT_TD}>{row.female}</td>
                        <td className={RP_PRINT_TD}>{row.joined}</td>
                        <td className={RP_PRINT_TD}>{row.left}</td>
                        <td className={RP_PRINT_TD}>{row.netChange > 0 ? `+${row.netChange}` : row.netChange}</td>
                      </tr>
                    ))}
                    <tr className="font-extrabold">
                      <td className={RP_PRINT_TD}>{totalLabel}</td>
                      <td className={RP_PRINT_TD}>{deptTotals.total}</td>
                      <td className={RP_PRINT_TD}>{deptTotals.male}</td>
                      <td className={RP_PRINT_TD}>{deptTotals.female}</td>
                      <td className={RP_PRINT_TD}>{deptTotals.joined}</td>
                      <td className={RP_PRINT_TD}>{deptTotals.left}</td>
                      <td className={RP_PRINT_TD}>{deptTotals.netChange > 0 ? `+${deptTotals.netChange}` : deptTotals.netChange}</td>
                    </tr>
                  </tbody>
                </table>
              </section>
            ) : null}

            {shouldShowSection(printTarget, 'keyMetrics') ? (
              <section className={`${RP_PRINT_SECTION} hr-print-section`}>
                <h2>{sectionTitles.keyMetrics}</h2>
                <table className={RP_PRINT_TABLE}>
                  <tbody>
                    <tr>
                      <td className={RP_PRINT_TD}>{keyMetricLabels.avgAge}</td>
                      <td className={RP_PRINT_TD}>{keyMetrics.averageAge.toFixed(1)} {yearsLabel}</td>
                    </tr>
                    <tr>
                      <td className={RP_PRINT_TD}>{keyMetricLabels.avgTenure}</td>
                      <td className={RP_PRINT_TD}>{keyMetrics.averageTenure.toFixed(1)} {yearsLabel}</td>
                    </tr>
                    <tr>
                      <td className={RP_PRINT_TD}>{keyMetricLabels.attendance}</td>
                      <td className={RP_PRINT_TD}>{keyMetrics.attendanceRate.toFixed(2)}%</td>
                    </tr>
                    <tr>
                      <td className={RP_PRINT_TD}>{keyMetricLabels.leave}</td>
                      <td className={RP_PRINT_TD}>{keyMetrics.leaveUtilization.toFixed(2)}%</td>
                    </tr>
                  </tbody>
                </table>
              </section>
            ) : null}
          </div>
        ) : null}

        {printTarget !== 'full' && shouldShowSection(printTarget, 'departments') ? (
          <section className={`${RP_PRINT_SECTION} hr-print-section`}>
            <h2>{sectionTitles.departments}</h2>
            <table className={RP_PRINT_TABLE}>
              <thead>
                <tr>
                  <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.department}</th>
                  <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.total}</th>
                  <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.male}</th>
                  <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.female}</th>
                  <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.joined}</th>
                  <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.left}</th>
                  <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.netChange}</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((row) => (
                  <tr key={row.id}>
                    <td className={RP_PRINT_TD}>{row.department}</td>
                    <td className={RP_PRINT_TD}>{row.total}</td>
                    <td className={RP_PRINT_TD}>{row.male}</td>
                    <td className={RP_PRINT_TD}>{row.female}</td>
                    <td className={RP_PRINT_TD}>{row.joined}</td>
                    <td className={RP_PRINT_TD}>{row.left}</td>
                    <td className={RP_PRINT_TD}>{row.netChange > 0 ? `+${row.netChange}` : row.netChange}</td>
                  </tr>
                ))}
                <tr className="font-extrabold">
                  <td className={RP_PRINT_TD}>{totalLabel}</td>
                  <td className={RP_PRINT_TD}>{deptTotals.total}</td>
                  <td className={RP_PRINT_TD}>{deptTotals.male}</td>
                  <td className={RP_PRINT_TD}>{deptTotals.female}</td>
                  <td className={RP_PRINT_TD}>{deptTotals.joined}</td>
                  <td className={RP_PRINT_TD}>{deptTotals.left}</td>
                  <td className={RP_PRINT_TD}>{deptTotals.netChange > 0 ? `+${deptTotals.netChange}` : deptTotals.netChange}</td>
                </tr>
              </tbody>
            </table>
          </section>
        ) : null}

        {printTarget !== 'full' && shouldShowSection(printTarget, 'keyMetrics') ? (
          <section className={`${RP_PRINT_SECTION} hr-print-section`}>
            <h2>{sectionTitles.keyMetrics}</h2>
            <table className={RP_PRINT_TABLE}>
              <tbody>
                <tr>
                  <td className={RP_PRINT_TD}>{keyMetricLabels.avgAge}</td>
                  <td className={RP_PRINT_TD}>{keyMetrics.averageAge.toFixed(1)} {yearsLabel}</td>
                </tr>
                <tr>
                  <td className={RP_PRINT_TD}>{keyMetricLabels.avgTenure}</td>
                  <td className={RP_PRINT_TD}>{keyMetrics.averageTenure.toFixed(1)} {yearsLabel}</td>
                </tr>
                <tr>
                  <td className={RP_PRINT_TD}>{keyMetricLabels.attendance}</td>
                  <td className={RP_PRINT_TD}>{keyMetrics.attendanceRate.toFixed(2)}%</td>
                </tr>
                <tr>
                  <td className={RP_PRINT_TD}>{keyMetricLabels.leave}</td>
                  <td className={RP_PRINT_TD}>{keyMetrics.leaveUtilization.toFixed(2)}%</td>
                </tr>
              </tbody>
            </table>
          </section>
        ) : null}

        {printTarget === 'full' ? (
          <div className="hr-print-charts-row">
            {shouldShowSection(printTarget, 'deptChart') ? (
              <section className={`${RP_PRINT_SECTION} hr-print-section hr-print-chart-block`}>
                <h2>{sectionTitles.deptChart}</h2>
                <p className="hr-print-chart-total">{totalLabel}: {totalHeadcount}</p>
                <table className={RP_PRINT_TABLE}>
                  <thead>
                    <tr>
                      <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.department}</th>
                      <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.total}</th>
                      <th className={`${RP_PRINT_TH} inventory-print-th`}>%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deptSlices.map((slice) => (
                      <tr key={slice.key}>
                        <td className={RP_PRINT_TD}>{slice.label}</td>
                        <td className={RP_PRINT_TD}>{slice.amount}</td>
                        <td className={RP_PRINT_TD}>{slice.pct.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            ) : null}

            {shouldShowSection(printTarget, 'genderChart') ? (
              <section className={`${RP_PRINT_SECTION} hr-print-section hr-print-chart-block`}>
                <h2>{sectionTitles.genderChart}</h2>
                <p className="hr-print-chart-total">{totalLabel}: {totalHeadcount}</p>
                <table className={RP_PRINT_TABLE}>
                  <thead>
                    <tr>
                      <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.gender}</th>
                      <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.total}</th>
                      <th className={`${RP_PRINT_TH} inventory-print-th`}>%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {genderSlices.map((slice) => (
                      <tr key={slice.key}>
                        <td className={RP_PRINT_TD}>{slice.label}</td>
                        <td className={RP_PRINT_TD}>{slice.amount}</td>
                        <td className={RP_PRINT_TD}>{slice.pct.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            ) : null}

            {shouldShowSection(printTarget, 'joinersTrend') ? (
              <section className={`${RP_PRINT_SECTION} hr-print-section hr-print-chart-block`}>
                <h2>{sectionTitles.joinersTrend}</h2>
                <table className={RP_PRINT_TABLE}>
                  <thead>
                    <tr>
                      <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.month}</th>
                      <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.joined}</th>
                      <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.left}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trendData.map((point) => (
                      <tr key={point.label}>
                        <td className={RP_PRINT_TD}>{point.label}</td>
                        <td className={RP_PRINT_TD}>{point.joined}</td>
                        <td className={RP_PRINT_TD}>{point.left}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            ) : null}
          </div>
        ) : null}

        {printTarget !== 'full' && shouldShowSection(printTarget, 'deptChart') ? (
          <section className={`${RP_PRINT_SECTION} hr-print-section hr-print-chart-block`}>
            <h2>{sectionTitles.deptChart}</h2>
            <p className="hr-print-chart-total">{totalLabel}: {totalHeadcount}</p>
            <table className={RP_PRINT_TABLE}>
              <thead>
                <tr>
                  <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.department}</th>
                  <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.total}</th>
                  <th className={`${RP_PRINT_TH} inventory-print-th`}>%</th>
                </tr>
              </thead>
              <tbody>
                {deptSlices.map((slice) => (
                  <tr key={slice.key}>
                    <td className={RP_PRINT_TD}>{slice.label}</td>
                    <td className={RP_PRINT_TD}>{slice.amount}</td>
                    <td className={RP_PRINT_TD}>{slice.pct.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : null}

        {printTarget !== 'full' && shouldShowSection(printTarget, 'genderChart') ? (
          <section className={`${RP_PRINT_SECTION} hr-print-section hr-print-chart-block`}>
            <h2>{sectionTitles.genderChart}</h2>
            <p className="hr-print-chart-total">{totalLabel}: {totalHeadcount}</p>
            <table className={RP_PRINT_TABLE}>
              <thead>
                <tr>
                  <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.gender}</th>
                  <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.total}</th>
                  <th className={`${RP_PRINT_TH} inventory-print-th`}>%</th>
                </tr>
              </thead>
              <tbody>
                {genderSlices.map((slice) => (
                  <tr key={slice.key}>
                    <td className={RP_PRINT_TD}>{slice.label}</td>
                    <td className={RP_PRINT_TD}>{slice.amount}</td>
                    <td className={RP_PRINT_TD}>{slice.pct.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : null}

        {printTarget !== 'full' && shouldShowSection(printTarget, 'joinersTrend') ? (
          <section className={`${RP_PRINT_SECTION} hr-print-section hr-print-chart-block`}>
            <h2>{sectionTitles.joinersTrend}</h2>
            <table className={RP_PRINT_TABLE}>
              <thead>
                <tr>
                  <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.month}</th>
                  <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.joined}</th>
                  <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.left}</th>
                </tr>
              </thead>
              <tbody>
                {trendData.map((point) => (
                  <tr key={point.label}>
                    <td className={RP_PRINT_TD}>{point.label}</td>
                    <td className={RP_PRINT_TD}>{point.joined}</td>
                    <td className={RP_PRINT_TD}>{point.left}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : null}

        {printTarget === 'full' ? (
          <div className="hr-print-bottom-row">
            {shouldShowSection(printTarget, 'joiners') ? (
              <section className={`${RP_PRINT_SECTION} hr-print-section`}>
                <h2>{sectionTitles.joiners}</h2>
                {joiners.length ? (
                  <table className={RP_PRINT_TABLE}>
                    <thead>
                      <tr>
                        <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.employeeId}</th>
                        <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.name}</th>
                        <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.department}</th>
                        <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.joinDate}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {joiners.map((row) => (
                        <tr key={row.id}>
                          <td className={RP_PRINT_TD}>{row.employeeId}</td>
                          <td className={RP_PRINT_TD}>{row.name}</td>
                          <td className={RP_PRINT_TD}>{row.department}</td>
                          <td className={RP_PRINT_TD}>{row.joinDate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-[10px] text-slate-500">{noJoinersLabel}</p>
                )}
              </section>
            ) : null}

            {shouldShowSection(printTarget, 'leavers') ? (
              <section className={`${RP_PRINT_SECTION} hr-print-section`}>
                <h2>{sectionTitles.leavers}</h2>
                {leavers.length ? (
                  <table className={RP_PRINT_TABLE}>
                    <thead>
                      <tr>
                        <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.employeeId}</th>
                        <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.name}</th>
                        <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.department}</th>
                        <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.leftDate}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leavers.map((row) => (
                        <tr key={row.id}>
                          <td className={RP_PRINT_TD}>{row.employeeId}</td>
                          <td className={RP_PRINT_TD}>{row.name}</td>
                          <td className={RP_PRINT_TD}>{row.department}</td>
                          <td className={RP_PRINT_TD}>{row.leftDate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-[10px] text-slate-500">{noLeaversLabel}</p>
                )}
              </section>
            ) : null}

            {shouldShowSection(printTarget, 'birthdays') ? (
              <section className={`${RP_PRINT_SECTION} hr-print-section`}>
                <h2>{sectionTitles.birthdays}</h2>
                {birthdays.length ? (
                  <table className={RP_PRINT_TABLE}>
                    <thead>
                      <tr>
                        <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.employeeId}</th>
                        <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.name}</th>
                        <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.department}</th>
                        <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.birthDate}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {birthdays.map((row) => (
                        <tr key={row.id}>
                          <td className={RP_PRINT_TD}>{row.employeeId}</td>
                          <td className={RP_PRINT_TD}>{row.name}</td>
                          <td className={RP_PRINT_TD}>{row.department}</td>
                          <td className={RP_PRINT_TD}>{row.birthDate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-[10px] text-slate-500">{noBirthdaysLabel}</p>
                )}
              </section>
            ) : null}
          </div>
        ) : null}

        {printTarget !== 'full' && shouldShowSection(printTarget, 'joiners') ? (
          <section className={`${RP_PRINT_SECTION} hr-print-section`}>
            <h2>{sectionTitles.joiners}</h2>
            {joiners.length ? (
              <table className={RP_PRINT_TABLE}>
                <thead>
                  <tr>
                    <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.employeeId}</th>
                    <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.name}</th>
                    <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.department}</th>
                    <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.joinDate}</th>
                  </tr>
                </thead>
                <tbody>
                  {joiners.map((row) => (
                    <tr key={row.id}>
                      <td className={RP_PRINT_TD}>{row.employeeId}</td>
                      <td className={RP_PRINT_TD}>{row.name}</td>
                      <td className={RP_PRINT_TD}>{row.department}</td>
                      <td className={RP_PRINT_TD}>{row.joinDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-[10px] text-slate-500">{noJoinersLabel}</p>
            )}
          </section>
        ) : null}

        {printTarget !== 'full' && shouldShowSection(printTarget, 'leavers') ? (
          <section className={`${RP_PRINT_SECTION} hr-print-section`}>
            <h2>{sectionTitles.leavers}</h2>
            {leavers.length ? (
              <table className={RP_PRINT_TABLE}>
                <thead>
                  <tr>
                    <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.employeeId}</th>
                    <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.name}</th>
                    <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.department}</th>
                    <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.leftDate}</th>
                  </tr>
                </thead>
                <tbody>
                  {leavers.map((row) => (
                    <tr key={row.id}>
                      <td className={RP_PRINT_TD}>{row.employeeId}</td>
                      <td className={RP_PRINT_TD}>{row.name}</td>
                      <td className={RP_PRINT_TD}>{row.department}</td>
                      <td className={RP_PRINT_TD}>{row.leftDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-[10px] text-slate-500">{noLeaversLabel}</p>
            )}
          </section>
        ) : null}

        {printTarget !== 'full' && shouldShowSection(printTarget, 'birthdays') ? (
          <section className={`${RP_PRINT_SECTION} hr-print-section`}>
            <h2>{sectionTitles.birthdays}</h2>
            {birthdays.length ? (
              <table className={RP_PRINT_TABLE}>
                <thead>
                  <tr>
                    <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.employeeId}</th>
                    <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.name}</th>
                    <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.department}</th>
                    <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.birthDate}</th>
                  </tr>
                </thead>
                <tbody>
                  {birthdays.map((row) => (
                    <tr key={row.id}>
                      <td className={RP_PRINT_TD}>{row.employeeId}</td>
                      <td className={RP_PRINT_TD}>{row.name}</td>
                      <td className={RP_PRINT_TD}>{row.department}</td>
                      <td className={RP_PRINT_TD}>{row.birthDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-[10px] text-slate-500">{noBirthdaysLabel}</p>
            )}
          </section>
        ) : null}

        {printTarget === 'full' ? (
          <footer className="hr-print-footer">
            <span>{preparedByLabel}: {preparedByName}</span>
            <span>{thankYouLabel}</span>
            <span>{pageLabel}</span>
          </footer>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
