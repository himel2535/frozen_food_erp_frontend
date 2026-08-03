'use client';

import { createPortal } from 'react-dom';
import { Icon } from '@iconify/react';
import { RP_PRINT_BODY, RP_PRINT_SECTION, RP_PRINT_TABLE, RP_PRINT_TD, RP_PRINT_TH, RP_ROOT } from '@/components/modules/reports/shared/report-print-styles';
import { formatCurrency } from '@/lib/services/domain-service';
import { resolveKpiIcon } from '@/lib/ui/kpi-icons';
import type { KpiCardItem } from '@/components/shared/KpiCards';
import type { FinancialPrintSectionId } from '@/components/modules/reports/financial/financial-report-styles';
import type {
  FinancialBreakdownSlice,
  FinancialCashFlow,
  FinancialCategorySummaryRow,
  FinancialReportRow,
  FinancialTrendPoint,
} from '@/components/modules/reports/financial/financial-report-utils';
import { calcNetProfit } from '@/components/modules/reports/financial/financial-report-utils';

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

type FinancialPrintFrameProps = {
  printTarget: FinancialPrintSectionId | null;
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
  sectionTitles: Record<FinancialPrintSectionId, string>;
  kpis: KpiCardItem[];
  rows: FinancialReportRow[];
  trendData: FinancialTrendPoint[];
  expenseSlices: FinancialBreakdownSlice[];
  totalExpenses: number;
  cashFlow: FinancialCashFlow;
  categorySummary: FinancialCategorySummaryRow[];
  tableHeaders: Record<string, string>;
  trendHeaders: Record<string, string>;
  cashFlowLabels: Record<string, string>;
  totalLabel: string;
  netProfitLabel: string;
};

function shouldShowSection(target: FinancialPrintSectionId | null, section: FinancialPrintSectionId) {
  if (!target) return false;
  return target === 'full' || target === section;
}

export function FinancialPrintFrame(props: FinancialPrintFrameProps) {
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
    rows,
    trendData,
    expenseSlices,
    totalExpenses,
    cashFlow,
    categorySummary,
    tableHeaders,
    trendHeaders,
    cashFlowLabels,
    totalLabel,
    netProfitLabel,
  } = props;

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

  const netProfit = calcNetProfit(rows);

  const categoryTotals = categorySummary.reduce(
    (acc, row) => ({
      revenue: acc.revenue + row.revenue,
      expenses: acc.expenses + row.expenses,
      net: acc.net + row.net,
    }),
    { revenue: 0, expenses: 0, net: 0 },
  );

  return createPortal(
    <div className={`${RP_ROOT} financial-print-root inventory-print-root`} data-print-target={printTarget}>
      <div className={`${RP_PRINT_BODY} financial-print-body inventory-print-body`}>
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
          <section className={`${RP_PRINT_SECTION} financial-print-section`}>
            <h2>{sectionTitles.metrics}</h2>
            {printTarget === 'full' ? (
              <div className="supplier-print-kpi-row financial-print-kpi-row">
                {kpis.map((item) => {
                  const iconId = item.iconify ?? resolveKpiIcon(item.key, item.label);
                  return (
                    <div key={item.key} className="supplier-print-kpi-card">
                      <Icon icon={iconId} width={24} height={24} />
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

        {shouldShowSection(printTarget, 'summary') || printTarget === 'full' ? (
          <section className={`${RP_PRINT_SECTION} financial-print-section`}>
            <h2>{sectionTitles.summary}</h2>
            <table className={RP_PRINT_TABLE}>
              <thead>
                <tr>
                  <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.line}</th>
                  <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.category}</th>
                  <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.amount}</th>
                  <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.period}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className={RP_PRINT_TD}>{row.line}</td>
                    <td className={RP_PRINT_TD}>{row.category}</td>
                    <td className={RP_PRINT_TD}>{formatCurrency(row.amount)}</td>
                    <td className={RP_PRINT_TD}>{row.period}</td>
                  </tr>
                ))}
                <tr>
                  <td className={`${RP_PRINT_TD} font-bold`} colSpan={2}>{netProfitLabel}</td>
                  <td className={`${RP_PRINT_TD} font-bold text-emerald-700`} colSpan={2}>{formatCurrency(netProfit)}</td>
                </tr>
              </tbody>
            </table>
          </section>
        ) : null}

        {shouldShowSection(printTarget, 'trend') || printTarget === 'full' ? (
          <section className={`${RP_PRINT_SECTION} financial-print-section`}>
            <h2>{sectionTitles.trend}</h2>
            <table className={RP_PRINT_TABLE}>
              <thead>
                <tr>
                  <th className={`${RP_PRINT_TH} inventory-print-th`}>{trendHeaders.month}</th>
                  <th className={`${RP_PRINT_TH} inventory-print-th`}>{trendHeaders.revenue}</th>
                  <th className={`${RP_PRINT_TH} inventory-print-th`}>{trendHeaders.expenses}</th>
                  <th className={`${RP_PRINT_TH} inventory-print-th`}>{trendHeaders.net}</th>
                </tr>
              </thead>
              <tbody>
                {trendData.map((point) => (
                  <tr key={point.label}>
                    <td className={RP_PRINT_TD}>{point.label}</td>
                    <td className={RP_PRINT_TD}>{formatCurrency(point.revenue)}</td>
                    <td className={RP_PRINT_TD}>{formatCurrency(point.expenses)}</td>
                    <td className={RP_PRINT_TD}>{formatCurrency(point.netProfit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : null}

        {shouldShowSection(printTarget, 'expenseChart') ||
        shouldShowSection(printTarget, 'cashFlow') ||
        shouldShowSection(printTarget, 'categorySummary') ||
        printTarget === 'full' ? (
          <section className={`${RP_PRINT_SECTION} financial-print-bottom`}>
            {(shouldShowSection(printTarget, 'expenseChart') || printTarget === 'full') ? (
              <div className="financial-print-chart-block">
                <h2>{sectionTitles.expenseChart}</h2>
                <p className="financial-print-chart-total">{formatCurrency(totalExpenses)}</p>
                <table className={RP_PRINT_TABLE}>
                  <thead>
                    <tr>
                      <th className={`${RP_PRINT_TH} inventory-print-th`}>Item</th>
                      <th className={`${RP_PRINT_TH} inventory-print-th`}>Amount</th>
                      <th className={`${RP_PRINT_TH} inventory-print-th`}>%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenseSlices.map((slice) => (
                      <tr key={slice.key}>
                        <td className={RP_PRINT_TD}>{slice.label}</td>
                        <td className={RP_PRINT_TD}>{formatCurrency(slice.amount)}</td>
                        <td className={RP_PRINT_TD}>{slice.pct.toFixed(1)}%</td>
                      </tr>
                    ))}
                    <tr>
                      <td className={`${RP_PRINT_TD} font-bold`}>{totalLabel}</td>
                      <td className={`${RP_PRINT_TD} font-bold`} colSpan={2}>{formatCurrency(totalExpenses)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : null}

            {(shouldShowSection(printTarget, 'cashFlow') || printTarget === 'full') ? (
              <div className="financial-print-chart-block">
                <h2>{sectionTitles.cashFlow}</h2>
                <table className={RP_PRINT_TABLE}>
                  <tbody>
                    <tr><td className={RP_PRINT_TD}>{cashFlowLabels.inflow}</td><td className={RP_PRINT_TD}>{formatCurrency(cashFlow.inflow)}</td></tr>
                    <tr><td className={RP_PRINT_TD}>{cashFlowLabels.outflow}</td><td className={RP_PRINT_TD}>{formatCurrency(cashFlow.outflow)}</td></tr>
                    <tr><td className={RP_PRINT_TD}>{cashFlowLabels.net}</td><td className={RP_PRINT_TD}>{formatCurrency(cashFlow.net)}</td></tr>
                    <tr><td className={`${RP_PRINT_TD} font-bold`}>{cashFlowLabels.closing}</td><td className={`${RP_PRINT_TD} font-bold`}>{formatCurrency(cashFlow.closing)}</td></tr>
                  </tbody>
                </table>
              </div>
            ) : null}

            {(shouldShowSection(printTarget, 'categorySummary') || printTarget === 'full') ? (
              <div className="financial-print-chart-block">
                <h2>{sectionTitles.categorySummary}</h2>
                <table className={RP_PRINT_TABLE}>
                  <thead>
                    <tr>
                      <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.category}</th>
                      <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.revenue}</th>
                      <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.expenses}</th>
                      <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.net}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categorySummary.map((row) => (
                      <tr key={row.category}>
                        <td className={RP_PRINT_TD}>{row.category}</td>
                        <td className={RP_PRINT_TD}>{row.revenue > 0 ? formatCurrency(row.revenue) : '—'}</td>
                        <td className={RP_PRINT_TD}>{row.expenses > 0 ? formatCurrency(row.expenses) : '—'}</td>
                        <td className={RP_PRINT_TD}>{formatCurrency(row.net)}</td>
                      </tr>
                    ))}
                    <tr>
                      <td className={`${RP_PRINT_TD} font-bold`}>{totalLabel}</td>
                      <td className={`${RP_PRINT_TD} font-bold`}>{formatCurrency(categoryTotals.revenue)}</td>
                      <td className={`${RP_PRINT_TD} font-bold`}>{formatCurrency(categoryTotals.expenses)}</td>
                      <td className={`${RP_PRINT_TD} font-bold`}>{formatCurrency(categoryTotals.net)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : null}
          </section>
        ) : null}

        <footer className="supplier-print-footer financial-print-footer">
          <span>{preparedByLabel}: {preparedByName}</span>
          <span>{thankYouLabel}</span>
          <span>{pageLabel}</span>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
