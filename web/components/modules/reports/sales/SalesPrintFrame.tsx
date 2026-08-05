'use client';

import { createPortal } from 'react-dom';
import { formatAppDate } from '@/lib/i18n/locale-format';
import type { SalesPrintSectionId } from '@/components/modules/reports/sales/sales-report-styles';
import { RP_PRINT_BODY, RP_PRINT_SECTION, RP_PRINT_TABLE, RP_PRINT_TD, RP_PRINT_TH, RP_ROOT } from '@/components/modules/reports/shared/report-print-styles';
import { formatCurrency } from '@/lib/services/domain-service';
import type { KpiCardItem } from '@/components/shared/KpiCards';
import type {
  SalesChartPoint,
  SalesReportRow,
  SalesStatusSummary,
  SalesTopCustomer,
} from '@/components/modules/reports/sales/sales-report-utils';
import { formatReportDate } from '@/components/modules/reports/sales/sales-report-utils';

type SalesPrintFrameProps = {
  printTarget: SalesPrintSectionId | null;
  reportTitle: string;
  generatedLabel: string;
  filterSummary: string;
  confidentialLabel: string;
  sectionTitles: Record<SalesPrintSectionId, string>;
  kpis: KpiCardItem[];
  chartData: SalesChartPoint[];
  statusSummary: SalesStatusSummary;
  topCustomers: SalesTopCustomer[];
  rows: SalesReportRow[];
  chartLegend: { thisMonth: string; lastMonth: string };
  statusLabels: { paid: string; unpaid: string; partial: string; cancelled: string; total: string };
  tableHeaders: {
    date: string;
    ref: string;
    customer: string;
    status: string;
    payment: string;
    total: string;
  };
  customerOrdersLabel: (n: number) => string;
};

function shouldShowSection(target: SalesPrintSectionId | null, section: SalesPrintSectionId) {
  if (!target) return false;
  return target === 'full' || target === section;
}

export function SalesPrintFrame(props: SalesPrintFrameProps) {
  if (typeof document === 'undefined' || !props.printTarget) return null;

  const {
    printTarget,
    reportTitle,
    generatedLabel,
    filterSummary,
    confidentialLabel,
    sectionTitles,
    kpis,
    chartData,
    statusSummary,
    topCustomers,
    rows,
    chartLegend,
    statusLabels,
    tableHeaders,
    customerOrdersLabel,
  } = props;

  const generatedAt = formatAppDate(new Date(), { day: '2-digit', month: 'short', year: 'numeric' });

  return createPortal(
    <div className={RP_ROOT} data-print-target={printTarget}>
      <div className={RP_PRINT_BODY}>
        <header className="report-print-header">
          <div>
            <p className="report-print-brand">Toys Factory ERP</p>
            <h1 className="report-print-title">{reportTitle}</h1>
            <p className="report-print-meta">
              {generatedLabel}: {generatedAt}
            </p>
            <p className="report-print-meta">{filterSummary}</p>
          </div>
        </header>

        {shouldShowSection(printTarget, 'metrics') ? (
          <section className={RP_PRINT_SECTION}>
            <h2>{sectionTitles.metrics}</h2>
            <table className={RP_PRINT_TABLE}>
              <thead>
                <tr>
                  {kpis.map((item) => (
                    <th key={item.key} className={RP_PRINT_TH}>
                      {item.label}
                    </th>
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
          </section>
        ) : null}

        {shouldShowSection(printTarget, 'revenue') ? (
          <section className={RP_PRINT_SECTION}>
            <h2>{sectionTitles.revenue}</h2>
            <p className="report-print-meta mb-2">
              {chartLegend.thisMonth} / {chartLegend.lastMonth}
            </p>
            <table className={RP_PRINT_TABLE}>
              <thead>
                <tr>
                  <th className={RP_PRINT_TH}>Period</th>
                  <th className={RP_PRINT_TH}>{chartLegend.thisMonth}</th>
                  <th className={RP_PRINT_TH}>{chartLegend.lastMonth}</th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((point) => (
                  <tr key={point.label}>
                    <td className={RP_PRINT_TD}>{point.label}</td>
                    <td className={RP_PRINT_TD}>{formatCurrency(point.thisMonth)}</td>
                    <td className={RP_PRINT_TD}>{formatCurrency(point.lastMonth)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : null}

        {shouldShowSection(printTarget, 'status') ? (
          <section className={RP_PRINT_SECTION}>
            <h2>{sectionTitles.status}</h2>
            <table className={RP_PRINT_TABLE}>
              <thead>
                <tr>
                  <th className={RP_PRINT_TH}>Status</th>
                  <th className={RP_PRINT_TH}>Count</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className={RP_PRINT_TD}>{statusLabels.paid}</td>
                  <td className={RP_PRINT_TD}>{statusSummary.paid}</td>
                </tr>
                <tr>
                  <td className={RP_PRINT_TD}>{statusLabels.unpaid}</td>
                  <td className={RP_PRINT_TD}>{statusSummary.unpaid}</td>
                </tr>
                <tr>
                  <td className={RP_PRINT_TD}>{statusLabels.partial}</td>
                  <td className={RP_PRINT_TD}>{statusSummary.partial}</td>
                </tr>
                <tr>
                  <td className={RP_PRINT_TD}>{statusLabels.cancelled}</td>
                  <td className={RP_PRINT_TD}>{statusSummary.cancelled}</td>
                </tr>
                <tr>
                  <td className={`${RP_PRINT_TD} font-bold`}>{statusLabels.total}</td>
                  <td className={`${RP_PRINT_TD} font-bold`}>{statusSummary.total}</td>
                </tr>
              </tbody>
            </table>
          </section>
        ) : null}

        {shouldShowSection(printTarget, 'customers') ? (
          <section className={RP_PRINT_SECTION}>
            <h2>{sectionTitles.customers}</h2>
            <table className={RP_PRINT_TABLE}>
              <thead>
                <tr>
                  <th className={RP_PRINT_TH}>Customer</th>
                  <th className={RP_PRINT_TH}>Spend</th>
                  <th className={RP_PRINT_TH}>Orders</th>
                </tr>
              </thead>
              <tbody>
                {topCustomers.map((customer) => (
                  <tr key={customer.name}>
                    <td className={RP_PRINT_TD}>{customer.name}</td>
                    <td className={RP_PRINT_TD}>{formatCurrency(customer.totalSpent)}</td>
                    <td className={RP_PRINT_TD}>{customerOrdersLabel(customer.orderCount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : null}

        {shouldShowSection(printTarget, 'transactions') || printTarget === 'full' ? (
          <section className={RP_PRINT_SECTION}>
            <h2>{sectionTitles.transactions}</h2>
            <table className={RP_PRINT_TABLE}>
              <thead>
                <tr>
                  <th className={RP_PRINT_TH}>{tableHeaders.date}</th>
                  <th className={RP_PRINT_TH}>{tableHeaders.ref}</th>
                  <th className={RP_PRINT_TH}>{tableHeaders.customer}</th>
                  <th className={RP_PRINT_TH}>{tableHeaders.status}</th>
                  <th className={RP_PRINT_TH}>{tableHeaders.payment}</th>
                  <th className={RP_PRINT_TH}>{tableHeaders.total}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className={RP_PRINT_TD}>{formatReportDate(row.date)}</td>
                    <td className={RP_PRINT_TD}>{row.ref}</td>
                    <td className={RP_PRINT_TD}>{row.customer}</td>
                    <td className={RP_PRINT_TD}>{row.status}</td>
                    <td className={RP_PRINT_TD}>{row.paymentMethod}</td>
                    <td className={RP_PRINT_TD}>{formatCurrency(row.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : null}

        <footer className="report-print-footer">{confidentialLabel}</footer>
      </div>
    </div>,
    document.body,
  );
}
