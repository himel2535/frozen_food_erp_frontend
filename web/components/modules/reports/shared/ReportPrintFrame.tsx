'use client';

import { createPortal } from 'react-dom';
import { formatAppDate } from '@/lib/i18n/locale-format';
import type { ReportPrintSectionId } from '@/components/modules/reports/shared/report-print-styles';
import { RP_PRINT_BODY, RP_PRINT_SECTION, RP_PRINT_TABLE, RP_PRINT_TD, RP_PRINT_TH, RP_ROOT } from '@/components/modules/reports/shared/report-print-styles';
import { formatCurrency } from '@/lib/services/domain-service';
import type { KpiCardItem } from '@/components/shared/KpiCards';
import type {
  PurchaseChartPoint,
  PurchaseReportRow,
  PurchaseStatusSummary,
  PurchaseTopSupplier,
} from '@/components/modules/reports/purchases/purchase-report-utils';
import { formatReportDate } from '@/components/modules/reports/purchases/purchase-report-utils';

type ReportPrintFrameProps = {
  printTarget: ReportPrintSectionId | null;
  reportTitle: string;
  generatedLabel: string;
  filterSummary: string;
  confidentialLabel: string;
  sectionTitles: Record<ReportPrintSectionId, string>;
  kpis: KpiCardItem[];
  chartData: PurchaseChartPoint[];
  statusSummary: PurchaseStatusSummary;
  topSuppliers: PurchaseTopSupplier[];
  rows: PurchaseReportRow[];
  chartLegend: { thisMonth: string; lastMonth: string };
  statusLabels: { received: string; pending: string; cancelled: string; total: string };
  tableHeaders: {
    date: string;
    ref: string;
    supplier: string;
    total: string;
    received: string;
    pending: string;
    status: string;
    paymentStatus: string;
  };
  supplierPoLabel: (n: number) => string;
};

function shouldShowSection(target: ReportPrintSectionId | null, section: ReportPrintSectionId) {
  if (!target) return false;
  return target === 'full' || target === section;
}

export function ReportPrintFrame(props: ReportPrintFrameProps) {
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
    topSuppliers,
    rows,
    chartLegend,
    statusLabels,
    tableHeaders,
    supplierPoLabel,
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

        {shouldShowSection(printTarget, 'chart') ? (
          <section className={RP_PRINT_SECTION}>
            <h2>{sectionTitles.chart}</h2>
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
                  <th className={RP_PRINT_TH}>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className={RP_PRINT_TD}>{statusLabels.received}</td>
                  <td className={RP_PRINT_TD}>{formatCurrency(statusSummary.received)}</td>
                </tr>
                <tr>
                  <td className={RP_PRINT_TD}>{statusLabels.pending}</td>
                  <td className={RP_PRINT_TD}>{formatCurrency(statusSummary.pending)}</td>
                </tr>
                <tr>
                  <td className={RP_PRINT_TD}>{statusLabels.cancelled}</td>
                  <td className={RP_PRINT_TD}>{formatCurrency(statusSummary.cancelled)}</td>
                </tr>
                <tr>
                  <td className={`${RP_PRINT_TD} font-bold`}>{statusLabels.total}</td>
                  <td className={`${RP_PRINT_TD} font-bold`}>{formatCurrency(statusSummary.totalAmount)}</td>
                </tr>
              </tbody>
            </table>
          </section>
        ) : null}

        {shouldShowSection(printTarget, 'suppliers') ? (
          <section className={RP_PRINT_SECTION}>
            <h2>{sectionTitles.suppliers}</h2>
            <table className={RP_PRINT_TABLE}>
              <thead>
                <tr>
                  <th className={RP_PRINT_TH}>Supplier</th>
                  <th className={RP_PRINT_TH}>Spend</th>
                  <th className={RP_PRINT_TH}>POs</th>
                </tr>
              </thead>
              <tbody>
                {topSuppliers.map((supplier) => (
                  <tr key={supplier.name}>
                    <td className={RP_PRINT_TD}>{supplier.name}</td>
                    <td className={RP_PRINT_TD}>{formatCurrency(supplier.totalSpent)}</td>
                    <td className={RP_PRINT_TD}>{supplierPoLabel(supplier.orderCount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : null}

        {shouldShowSection(printTarget, 'orders') || printTarget === 'full' ? (
          <section className={RP_PRINT_SECTION}>
            <h2>{sectionTitles.orders}</h2>
            <table className={RP_PRINT_TABLE}>
              <thead>
                <tr>
                  <th className={RP_PRINT_TH}>{tableHeaders.date}</th>
                  <th className={RP_PRINT_TH}>{tableHeaders.ref}</th>
                  <th className={RP_PRINT_TH}>{tableHeaders.supplier}</th>
                  <th className={RP_PRINT_TH}>{tableHeaders.total}</th>
                  <th className={RP_PRINT_TH}>{tableHeaders.received}</th>
                  <th className={RP_PRINT_TH}>{tableHeaders.pending}</th>
                  <th className={RP_PRINT_TH}>{tableHeaders.status}</th>
                  <th className={RP_PRINT_TH}>{tableHeaders.paymentStatus}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className={RP_PRINT_TD}>{formatReportDate(row.date)}</td>
                    <td className={RP_PRINT_TD}>{row.ref}</td>
                    <td className={RP_PRINT_TD}>{row.supplier}</td>
                    <td className={RP_PRINT_TD}>{formatCurrency(row.total)}</td>
                    <td className={RP_PRINT_TD}>{formatCurrency(row.received)}</td>
                    <td className={RP_PRINT_TD}>{formatCurrency(row.pending)}</td>
                    <td className={RP_PRINT_TD}>{row.status}</td>
                    <td className={RP_PRINT_TD}>{row.paymentStatus}</td>
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
