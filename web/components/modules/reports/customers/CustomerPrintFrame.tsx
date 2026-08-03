'use client';

import { createPortal } from 'react-dom';
import { RP_PRINT_BODY, RP_PRINT_SECTION, RP_PRINT_TABLE, RP_PRINT_TD, RP_PRINT_TH, RP_ROOT } from '@/components/modules/reports/shared/report-print-styles';
import { formatCurrency } from '@/lib/services/domain-service';
import type { KpiCardItem } from '@/components/shared/KpiCards';
import type { CustomerPrintSectionId } from '@/components/modules/reports/customers/customer-report-styles';
import type {
  CustomerBreakdownSlice,
  CustomerRecentActivityRow,
  CustomerReportRow,
} from '@/components/modules/reports/customers/customer-report-utils';
import { formatDisplayDate, getCustomerInitials } from '@/components/modules/reports/customers/customer-report-utils';

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

type CustomerPrintFrameProps = {
  printTarget: CustomerPrintSectionId | null;
  reportTitle: string;
  reportingPeriod: string;
  generatedLabel: string;
  filterSummary: string;
  confidentialLabel: string;
  preparedByLabel: string;
  preparedByName: string;
  thankYouLabel: string;
  company: CompanyProfile;
  sectionTitles: Record<CustomerPrintSectionId, string>;
  kpis: KpiCardItem[];
  rows: CustomerReportRow[];
  salesSlices: CustomerBreakdownSlice[];
  outstandingSlices: CustomerBreakdownSlice[];
  statusSlices: CustomerBreakdownSlice[];
  recentActivity: CustomerRecentActivityRow[];
  tableHeaders: Record<string, string>;
  activityHeaders: Record<string, string>;
  totalLabel: string;
  customersLabel: string;
};

function shouldShowSection(target: CustomerPrintSectionId | null, section: CustomerPrintSectionId) {
  if (!target) return false;
  return target === 'full' || target === section;
}

export function CustomerPrintFrame(props: CustomerPrintFrameProps) {
  if (typeof document === 'undefined' || !props.printTarget) return null;

  const {
    printTarget,
    reportTitle,
    reportingPeriod,
    generatedLabel,
    filterSummary,
    confidentialLabel,
    preparedByLabel,
    preparedByName,
    thankYouLabel,
    company,
    sectionTitles,
    kpis,
    rows,
    salesSlices,
    outstandingSlices,
    statusSlices,
    recentActivity,
    tableHeaders,
    activityHeaders,
    totalLabel,
    customersLabel,
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

  const totalSales = rows.reduce((s, r) => s + r.sales, 0);
  const totalDue = rows.reduce((s, r) => s + r.due, 0);

  return createPortal(
    <div className={`${RP_ROOT} customer-print-root inventory-print-root`} data-print-target={printTarget}>
      <div className={`${RP_PRINT_BODY} customer-print-body inventory-print-body`}>
        <header className="inventory-print-letterhead customer-print-letterhead">
          <div className="inventory-print-letterhead-left">
            <p className="inventory-print-brand">{company.name ?? 'Toys Factory ERP'}</p>
            <p className="inventory-print-legal">{company.legalName}</p>
            {address ? <p className="inventory-print-meta">{address}</p> : null}
            <p className="inventory-print-meta">
              {[company.phone, company.email, company.website].filter(Boolean).join(' · ')}
            </p>
          </div>
          <div className="inventory-print-letterhead-center">
            <h1 className="inventory-print-doc-title">{reportTitle.toUpperCase()}</h1>
            <p className="inventory-print-meta">{generatedLabel}: {generatedAt}</p>
            <p className="inventory-print-period-badge">{reportingPeriod}</p>
          </div>
          <div className="inventory-print-letterhead-right">
            <p className="inventory-print-meta">Printed On: {generatedAt}</p>
            <div className="inventory-print-qr" aria-hidden>
              <span>QR</span>
            </div>
          </div>
        </header>

        <p className="inventory-print-filter-line">{filterSummary}</p>

        {shouldShowSection(printTarget, 'metrics') ? (
          <section className={`${RP_PRINT_SECTION} inventory-print-section customer-print-section`}>
            <h2>{sectionTitles.metrics}</h2>
            <table className={RP_PRINT_TABLE}>
              <thead>
                <tr>
                  {kpis.map((item) => (
                    <th key={item.key} className={`${RP_PRINT_TH} inventory-print-th`}>
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

        {shouldShowSection(printTarget, 'summary') || printTarget === 'full' ? (
          <section className={`${RP_PRINT_SECTION} inventory-print-section customer-print-section`}>
            <h2>{sectionTitles.summary}</h2>
            <table className={RP_PRINT_TABLE}>
              <thead>
                <tr>
                  <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.sl}</th>
                  <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.customer}</th>
                  <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.company}</th>
                  <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.contact}</th>
                  <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.sales}</th>
                  <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.outstanding}</th>
                  <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.lastSale}</th>
                  <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.status}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={row.id}>
                    <td className={RP_PRINT_TD}>{idx + 1}</td>
                    <td className={RP_PRINT_TD}>
                      {getCustomerInitials(row.name)} · {row.name}
                    </td>
                    <td className={RP_PRINT_TD}>{row.company}</td>
                    <td className={RP_PRINT_TD}>
                      {row.phone}
                      {row.email ? ` · ${row.email}` : ''}
                    </td>
                    <td className={RP_PRINT_TD}>{formatCurrency(row.sales)}</td>
                    <td className={RP_PRINT_TD}>{formatCurrency(row.due)}</td>
                    <td className={RP_PRINT_TD}>{formatDisplayDate(row.lastSaleDate)}</td>
                    <td className={RP_PRINT_TD}>{row.status === 'overdue' ? 'Overdue' : 'Active'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : null}

        {shouldShowSection(printTarget, 'salesChart') ||
        shouldShowSection(printTarget, 'outstandingChart') ||
        shouldShowSection(printTarget, 'statusChart') ||
        printTarget === 'full' ? (
          <section className={`${RP_PRINT_SECTION} inventory-print-section inventory-print-split customer-print-charts`}>
            {(shouldShowSection(printTarget, 'salesChart') || printTarget === 'full') && salesSlices.length ? (
              <div>
                <h2>{sectionTitles.salesChart}</h2>
                <table className={RP_PRINT_TABLE}>
                  <thead>
                    <tr>
                      <th className={`${RP_PRINT_TH} inventory-print-th`}>Customer</th>
                      <th className={`${RP_PRINT_TH} inventory-print-th`}>Amount</th>
                      <th className={`${RP_PRINT_TH} inventory-print-th`}>%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesSlices.map((slice) => (
                      <tr key={slice.key}>
                        <td className={RP_PRINT_TD}>{slice.label}</td>
                        <td className={RP_PRINT_TD}>{formatCurrency(slice.amount)}</td>
                        <td className={RP_PRINT_TD}>{slice.pct.toFixed(1)}%</td>
                      </tr>
                    ))}
                    <tr>
                      <td className={`${RP_PRINT_TD} font-bold`}>{totalLabel}</td>
                      <td className={`${RP_PRINT_TD} font-bold`} colSpan={2}>
                        {formatCurrency(totalSales)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : null}

            {(shouldShowSection(printTarget, 'outstandingChart') || printTarget === 'full') ? (
              <div>
                <h2>{sectionTitles.outstandingChart}</h2>
                <table className={RP_PRINT_TABLE}>
                  <thead>
                    <tr>
                      <th className={`${RP_PRINT_TH} inventory-print-th`}>Customer</th>
                      <th className={`${RP_PRINT_TH} inventory-print-th`}>Amount</th>
                      <th className={`${RP_PRINT_TH} inventory-print-th`}>%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {outstandingSlices.length ? (
                      outstandingSlices.map((slice) => (
                        <tr key={slice.key}>
                          <td className={RP_PRINT_TD}>{slice.label}</td>
                          <td className={RP_PRINT_TD}>{formatCurrency(slice.amount)}</td>
                          <td className={RP_PRINT_TD}>{slice.pct.toFixed(1)}%</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className={RP_PRINT_TD} colSpan={3}>—</td>
                      </tr>
                    )}
                    <tr>
                      <td className={`${RP_PRINT_TD} font-bold`}>{totalLabel}</td>
                      <td className={`${RP_PRINT_TD} font-bold`} colSpan={2}>
                        {formatCurrency(totalDue)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : null}

            {(shouldShowSection(printTarget, 'statusChart') || printTarget === 'full') && statusSlices.length ? (
              <div>
                <h2>{sectionTitles.statusChart}</h2>
                <table className={RP_PRINT_TABLE}>
                  <thead>
                    <tr>
                      <th className={`${RP_PRINT_TH} inventory-print-th`}>Status</th>
                      <th className={`${RP_PRINT_TH} inventory-print-th`}>Count</th>
                      <th className={`${RP_PRINT_TH} inventory-print-th`}>%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statusSlices.map((slice) => (
                      <tr key={slice.key}>
                        <td className={RP_PRINT_TD}>{slice.label}</td>
                        <td className={RP_PRINT_TD}>{slice.amount}</td>
                        <td className={RP_PRINT_TD}>{slice.pct.toFixed(2)}%</td>
                      </tr>
                    ))}
                    <tr>
                      <td className={`${RP_PRINT_TD} font-bold`}>{totalLabel}</td>
                      <td className={`${RP_PRINT_TD} font-bold`} colSpan={2}>
                        {rows.length} {customersLabel}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : null}
          </section>
        ) : null}

        {shouldShowSection(printTarget, 'activity') || printTarget === 'full' ? (
          <section className={`${RP_PRINT_SECTION} inventory-print-section inventory-print-bottom customer-print-bottom`}>
            <div>
              <h2>{sectionTitles.activity}</h2>
              {recentActivity.length ? (
                <table className={RP_PRINT_TABLE}>
                  <thead>
                    <tr>
                      <th className={`${RP_PRINT_TH} inventory-print-th`}>{activityHeaders.date}</th>
                      <th className={`${RP_PRINT_TH} inventory-print-th`}>{activityHeaders.invoice}</th>
                      <th className={`${RP_PRINT_TH} inventory-print-th`}>{activityHeaders.customer}</th>
                      <th className={`${RP_PRINT_TH} inventory-print-th`}>{activityHeaders.amount}</th>
                      <th className={`${RP_PRINT_TH} inventory-print-th`}>{activityHeaders.payment}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentActivity.map((row) => (
                      <tr key={row.id}>
                        <td className={RP_PRINT_TD}>{formatDisplayDate(row.date)}</td>
                        <td className={RP_PRINT_TD}>{row.ref}</td>
                        <td className={RP_PRINT_TD}>{row.customer}</td>
                        <td className={RP_PRINT_TD}>{formatCurrency(row.total)}</td>
                        <td className={RP_PRINT_TD}>{row.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="inventory-print-meta">—</p>
              )}
            </div>
            {printTarget === 'full' ? (
              <div className="inventory-print-summary-list customer-print-summary-list">
                <h2>{sectionTitles.metrics}</h2>
                <ul>
                  {kpis.map((item) => (
                    <li key={item.key}>
                      <strong>{item.label}:</strong> {item.value}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        ) : null}

        <footer className="inventory-print-footer customer-print-footer">
          <span>{preparedByLabel}: {preparedByName}</span>
          <span>{thankYouLabel}</span>
          <span>{confidentialLabel}</span>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
