'use client';

import { createPortal } from 'react-dom';
import { formatAppDate } from '@/lib/i18n/locale-format';
import type { ProductSalesPrintSectionId } from '@/components/modules/reports/product-sales/product-sales-report-styles';
import { RP_PRINT_BODY, RP_PRINT_SECTION, RP_PRINT_TABLE, RP_PRINT_TD, RP_PRINT_TH, RP_ROOT } from '@/components/modules/reports/shared/report-print-styles';
import { formatCurrency } from '@/lib/services/domain-service';
import type { KpiCardItem } from '@/components/shared/KpiCards';
import {
  formatProductSaleDate,
  type ProductSaleLine,
  type ProductSalesRow,
  type ProductSalesSlice,
} from '@/components/modules/reports/product-sales/product-sales-report-utils';

type ProductSalesPrintFrameProps = {
  printTarget: ProductSalesPrintSectionId | null;
  reportTitle: string;
  generatedLabel: string;
  filterSummary: string;
  confidentialLabel: string;
  sectionTitles: Record<ProductSalesPrintSectionId, string>;
  kpis: KpiCardItem[];
  slices: ProductSalesSlice[];
  topRows: ProductSalesRow[];
  rows: ProductSalesRow[];
  lineRows?: ProductSaleLine[];
  tableHeaders: {
    product: string;
    sku: string;
    qty: string;
    avg: string;
    revenue: string;
    invoices: string;
    share: string;
    date?: string;
    invoice?: string;
    customer?: string;
    unit?: string;
  };
};

function shouldShowSection(target: ProductSalesPrintSectionId | null, section: ProductSalesPrintSectionId) {
  if (!target) return false;
  return target === 'full' || target === section;
}

export function ProductSalesPrintFrame(props: ProductSalesPrintFrameProps) {
  if (typeof document === 'undefined' || !props.printTarget) return null;

  const {
    printTarget,
    reportTitle,
    generatedLabel,
    filterSummary,
    confidentialLabel,
    sectionTitles,
    kpis,
    slices,
    topRows,
    rows,
    lineRows,
    tableHeaders,
  } = props;
  const isProductReport = Array.isArray(lineRows);

  const generatedAt = formatAppDate(new Date(), { day: '2-digit', month: 'short', year: 'numeric' });

  return createPortal(
    <div className={RP_ROOT} data-print-target={printTarget}>
      <div className={RP_PRINT_BODY}>
        <header className="report-print-header">
          <div>
            <p className="report-print-brand">Food Fun Agro Foods</p>
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
                    <th key={item.key} className={RP_PRINT_TH}>{item.label}</th>
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

        {shouldShowSection(printTarget, 'share') ? (
          <section className={RP_PRINT_SECTION}>
            <h2>{sectionTitles.share}</h2>
            <table className={RP_PRINT_TABLE}>
              <thead>
                <tr>
                  <th className={RP_PRINT_TH}>{tableHeaders.product}</th>
                  <th className={RP_PRINT_TH}>{tableHeaders.share}</th>
                  <th className={RP_PRINT_TH}>{tableHeaders.revenue}</th>
                </tr>
              </thead>
              <tbody>
                {slices.map((slice) => (
                  <tr key={slice.key}>
                    <td className={RP_PRINT_TD}>{slice.label}</td>
                    <td className={RP_PRINT_TD}>{slice.pct.toFixed(1)}%</td>
                    <td className={RP_PRINT_TD}>{formatCurrency(slice.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : null}

        {shouldShowSection(printTarget, 'top') ? (
          <section className={RP_PRINT_SECTION}>
            <h2>{sectionTitles.top}</h2>
            <table className={RP_PRINT_TABLE}>
              <thead>
                <tr>
                  <th className={RP_PRINT_TH}>{tableHeaders.product}</th>
                  <th className={RP_PRINT_TH}>{tableHeaders.qty}</th>
                  <th className={RP_PRINT_TH}>{tableHeaders.revenue}</th>
                </tr>
              </thead>
              <tbody>
                {topRows.map((row) => (
                  <tr key={row.key}>
                    <td className={RP_PRINT_TD}>{row.productName}</td>
                    <td className={RP_PRINT_TD}>{row.qty}</td>
                    <td className={RP_PRINT_TD}>{formatCurrency(row.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : null}

        {shouldShowSection(printTarget, 'products') && !isProductReport ? (
          <section className={RP_PRINT_SECTION}>
            <h2>{sectionTitles.products}</h2>
            <table className={RP_PRINT_TABLE}>
              <thead>
                <tr>
                  <th className={RP_PRINT_TH}>{tableHeaders.product}</th>
                  <th className={RP_PRINT_TH}>{tableHeaders.sku}</th>
                  <th className={RP_PRINT_TH}>{tableHeaders.qty}</th>
                  <th className={RP_PRINT_TH}>{tableHeaders.avg}</th>
                  <th className={RP_PRINT_TH}>{tableHeaders.revenue}</th>
                  <th className={RP_PRINT_TH}>{tableHeaders.invoices}</th>
                  <th className={RP_PRINT_TH}>{tableHeaders.share}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.key}>
                    <td className={RP_PRINT_TD}>{row.productName}</td>
                    <td className={RP_PRINT_TD}>{row.sku || '—'}</td>
                    <td className={RP_PRINT_TD}>{row.qty}</td>
                    <td className={RP_PRINT_TD}>{formatCurrency(row.avgPrice)}</td>
                    <td className={RP_PRINT_TD}>{formatCurrency(row.revenue)}</td>
                    <td className={RP_PRINT_TD}>{row.invoiceCount}</td>
                    <td className={RP_PRINT_TD}>{row.sharePct.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : null}

        {shouldShowSection(printTarget, 'lines') && isProductReport ? (
          <section className={RP_PRINT_SECTION}>
            <h2>{sectionTitles.lines}</h2>
            <table className={RP_PRINT_TABLE}>
              <thead>
                <tr>
                  <th className={RP_PRINT_TH}>{tableHeaders.date ?? 'Date'}</th>
                  <th className={RP_PRINT_TH}>{tableHeaders.invoice ?? 'Invoice'}</th>
                  <th className={RP_PRINT_TH}>{tableHeaders.customer ?? 'Customer'}</th>
                  <th className={RP_PRINT_TH}>{tableHeaders.qty}</th>
                  <th className={RP_PRINT_TH}>{tableHeaders.unit ?? 'Unit Price'}</th>
                  <th className={RP_PRINT_TH}>{tableHeaders.revenue}</th>
                </tr>
              </thead>
              <tbody>
                {lineRows.map((row) => (
                  <tr key={row.id}>
                    <td className={RP_PRINT_TD}>{formatProductSaleDate(row.date)}</td>
                    <td className={RP_PRINT_TD}>{row.invoiceRef || '—'}</td>
                    <td className={RP_PRINT_TD}>{row.customer || '—'}</td>
                    <td className={RP_PRINT_TD}>{row.qty}</td>
                    <td className={RP_PRINT_TD}>{formatCurrency(row.unitPrice)}</td>
                    <td className={RP_PRINT_TD}>{formatCurrency(row.revenue)}</td>
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
