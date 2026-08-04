'use client';

import { createPortal } from 'react-dom';
import { Icon } from '@iconify/react';
import { RP_PRINT_BODY, RP_PRINT_SECTION, RP_PRINT_TABLE, RP_PRINT_TD, RP_PRINT_TH, RP_ROOT } from '@/components/modules/reports/shared/report-print-styles';
import { formatCurrency } from '@/lib/services/domain-service';
import { resolveKpiIconsForRow } from '@/lib/ui/kpi-icons';
import type { KpiCardItem } from '@/components/shared/KpiCards';
import type { SupplierPrintSectionId } from '@/components/modules/reports/suppliers/supplier-report-styles';
import type {
  SupplierBreakdownSlice,
  SupplierRecentActivityRow,
  SupplierReportRow,
} from '@/components/modules/reports/suppliers/supplier-report-utils';
import { formatDisplayDate, getSupplierInitials } from '@/components/modules/reports/suppliers/supplier-report-utils';

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

type SupplierPrintFrameProps = {
  printTarget: SupplierPrintSectionId | null;
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
  sectionTitles: Record<SupplierPrintSectionId, string>;
  kpis: KpiCardItem[];
  rows: SupplierReportRow[];
  purchasesSlices: SupplierBreakdownSlice[];
  payablesSlices: SupplierBreakdownSlice[];
  payablesStatusSlices: SupplierBreakdownSlice[];
  recentActivity: SupplierRecentActivityRow[];
  tableHeaders: Record<string, string>;
  activityHeaders: Record<string, string>;
  totalLabel: string;
  suppliersLabel: string;
};

function shouldShowSection(target: SupplierPrintSectionId | null, section: SupplierPrintSectionId) {
  if (!target) return false;
  return target === 'full' || target === section;
}

function ChartBlock({
  title,
  slices,
  totalAmount,
  formatAmount,
  entityLabel,
}: {
  title: string;
  slices: SupplierBreakdownSlice[];
  totalAmount: number;
  formatAmount: (n: number) => string;
  entityLabel: string;
}) {
  return (
    <div className="supplier-print-chart-block">
      <h2>{title}</h2>
      <p className="supplier-print-chart-total">{formatAmount(totalAmount)}</p>
      <table className={RP_PRINT_TABLE}>
        <thead>
          <tr>
            <th className={`${RP_PRINT_TH} inventory-print-th`}>{entityLabel}</th>
            <th className={`${RP_PRINT_TH} inventory-print-th`}>Amount</th>
            <th className={`${RP_PRINT_TH} inventory-print-th`}>%</th>
          </tr>
        </thead>
        <tbody>
          {slices.length ? (
            slices.map((slice) => (
              <tr key={slice.key}>
                <td className={RP_PRINT_TD}>{slice.label}</td>
                <td className={RP_PRINT_TD}>{formatAmount(slice.amount)}</td>
                <td className={RP_PRINT_TD}>{slice.pct.toFixed(1)}%</td>
              </tr>
            ))
          ) : (
            <tr>
              <td className={RP_PRINT_TD} colSpan={3}>—</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function SupplierPrintFrame(props: SupplierPrintFrameProps) {
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
    purchasesSlices,
    payablesSlices,
    payablesStatusSlices,
    recentActivity,
    tableHeaders,
    activityHeaders,
    totalLabel,
    suppliersLabel,
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

  const totalPurchases = rows.reduce((s, r) => s + r.purchases, 0);
  const totalPayables = rows.reduce((s, r) => s + r.due, 0);

  return createPortal(
    <div className={`${RP_ROOT} supplier-print-root inventory-print-root`} data-print-target={printTarget}>
      <div className={`${RP_PRINT_BODY} supplier-print-body inventory-print-body`}>
        <header className="inventory-print-letterhead supplier-print-letterhead">
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
          <section className={`${RP_PRINT_SECTION} supplier-print-section`}>
            <h2>{sectionTitles.metrics}</h2>
            {printTarget === 'full' ? (
              <div className="supplier-print-kpi-row">
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
            )}
          </section>
        ) : null}

        {shouldShowSection(printTarget, 'summary') || printTarget === 'full' ? (
          <section className={`${RP_PRINT_SECTION} supplier-print-section`}>
            <h2>{sectionTitles.summary}</h2>
            <table className={RP_PRINT_TABLE}>
              <thead>
                <tr>
                  <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.sl}</th>
                  <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.supplier}</th>
                  <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.contactPerson}</th>
                  <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.phone}</th>
                  <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.email}</th>
                  <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.purchases}</th>
                  <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.payables}</th>
                  <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.lastPurchase}</th>
                  <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.status}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={row.id}>
                    <td className={RP_PRINT_TD}>{idx + 1}</td>
                    <td className={RP_PRINT_TD}>
                      {getSupplierInitials(row.name)} · {row.name}
                    </td>
                    <td className={RP_PRINT_TD}>{row.contactPerson}</td>
                    <td className={RP_PRINT_TD}>{row.phone}</td>
                    <td className={RP_PRINT_TD}>{row.email}</td>
                    <td className={RP_PRINT_TD}>{formatCurrency(row.purchases)}</td>
                    <td className={`${RP_PRINT_TD} ${row.due > 0 ? 'text-rose-600 font-bold' : ''}`}>
                      {formatCurrency(row.due)}
                    </td>
                    <td className={RP_PRINT_TD}>{formatDisplayDate(row.lastPurchaseDate)}</td>
                    <td className={RP_PRINT_TD}>{row.status === 'inactive' ? 'Inactive' : 'Active'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length ? (
              <p className="inventory-print-meta mt-2">
                Showing 1 to {rows.length} of {rows.length} entries
              </p>
            ) : null}
          </section>
        ) : null}

        {shouldShowSection(printTarget, 'purchasesChart') ||
        shouldShowSection(printTarget, 'payablesChart') ||
        shouldShowSection(printTarget, 'payablesStatusChart') ||
        printTarget === 'full' ? (
          <section className={`${RP_PRINT_SECTION} supplier-print-charts`}>
            {(shouldShowSection(printTarget, 'purchasesChart') || printTarget === 'full') ? (
              <ChartBlock
                title={sectionTitles.purchasesChart}
                slices={purchasesSlices}
                totalAmount={totalPurchases}
                formatAmount={formatCurrency}
                entityLabel="Supplier"
              />
            ) : null}
            {(shouldShowSection(printTarget, 'payablesChart') || printTarget === 'full') ? (
              <ChartBlock
                title={sectionTitles.payablesChart}
                slices={payablesSlices}
                totalAmount={totalPayables}
                formatAmount={formatCurrency}
                entityLabel="Supplier"
              />
            ) : null}
            {(shouldShowSection(printTarget, 'payablesStatusChart') || printTarget === 'full') ? (
              <ChartBlock
                title={sectionTitles.payablesStatusChart}
                slices={payablesStatusSlices}
                totalAmount={rows.length}
                formatAmount={(n) => `${n} ${suppliersLabel}`}
                entityLabel="Status"
              />
            ) : null}
          </section>
        ) : null}

        {shouldShowSection(printTarget, 'activity') || printTarget === 'full' ? (
          <section className={`${RP_PRINT_SECTION} supplier-print-bottom`}>
            <div>
              <h2>{sectionTitles.activity}</h2>
              {recentActivity.length ? (
                <table className={RP_PRINT_TABLE}>
                  <thead>
                    <tr>
                      <th className={`${RP_PRINT_TH} inventory-print-th`}>{activityHeaders.date}</th>
                      <th className={`${RP_PRINT_TH} inventory-print-th`}>{activityHeaders.po}</th>
                      <th className={`${RP_PRINT_TH} inventory-print-th`}>{activityHeaders.supplier}</th>
                      <th className={`${RP_PRINT_TH} inventory-print-th`}>{activityHeaders.items}</th>
                      <th className={`${RP_PRINT_TH} inventory-print-th`}>{activityHeaders.amount}</th>
                      <th className={`${RP_PRINT_TH} inventory-print-th`}>{activityHeaders.payment}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentActivity.map((row) => (
                      <tr key={row.id}>
                        <td className={RP_PRINT_TD}>{formatDisplayDate(row.date)}</td>
                        <td className={RP_PRINT_TD}>{row.ref}</td>
                        <td className={RP_PRINT_TD}>{row.supplier}</td>
                        <td className={RP_PRINT_TD}>{row.items}</td>
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
              <div className="supplier-print-summary-list">
                <h2>{sectionTitles.metrics}</h2>
                <ul>
                  {kpis.map((item, index) => {
                    const iconId = kpiIconIds[index];
                    return (
                      <li key={item.key}>
                        {iconId ? <Icon icon={iconId} width={18} height={18} /> : null}
                        <span><strong>{item.label}:</strong> {item.value}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}
          </section>
        ) : null}

        <footer className="supplier-print-footer">
          <span>{preparedByLabel}: {preparedByName}</span>
          <span>{thankYouLabel}</span>
          <span>{pageLabel}</span>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
