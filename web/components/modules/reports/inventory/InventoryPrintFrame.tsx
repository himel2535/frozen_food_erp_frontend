'use client';

import { createPortal } from 'react-dom';
import { RP_PRINT_BODY, RP_PRINT_SECTION, RP_PRINT_TABLE, RP_PRINT_TD, RP_PRINT_TH, RP_ROOT } from '@/components/modules/reports/shared/report-print-styles';
import { formatCurrency } from '@/lib/services/domain-service';
import type { KpiCardItem } from '@/components/shared/KpiCards';
import type { InventoryPrintSectionId } from '@/components/modules/reports/inventory/inventory-report-styles';
import type {
  InventoryBreakdownSlice,
  InventoryReportRow,
  InventoryStockMovement,
} from '@/components/modules/reports/inventory/inventory-report-utils';

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

type InventoryPrintFrameProps = {
  printTarget: InventoryPrintSectionId | null;
  reportTitle: string;
  reportingPeriod: string;
  generatedLabel: string;
  filterSummary: string;
  confidentialLabel: string;
  preparedByLabel: string;
  preparedByName: string;
  thankYouLabel: string;
  company: CompanyProfile;
  sectionTitles: Record<InventoryPrintSectionId, string>;
  kpis: KpiCardItem[];
  rows: InventoryReportRow[];
  categorySlices: InventoryBreakdownSlice[];
  warehouseSlices: InventoryBreakdownSlice[];
  movement: InventoryStockMovement;
  lowStockRows: InventoryReportRow[];
  tableHeaders: Record<string, string>;
  movementLabels: Record<string, string>;
  totalLabel: string;
};

function shouldShowSection(target: InventoryPrintSectionId | null, section: InventoryPrintSectionId) {
  if (!target) return false;
  return target === 'full' || target === section;
}

export function InventoryPrintFrame(props: InventoryPrintFrameProps) {
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
    categorySlices,
    warehouseSlices,
    movement,
    lowStockRows,
    tableHeaders,
    movementLabels,
    totalLabel,
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

  const totalValue = rows.reduce((s, r) => s + r.value, 0);

  return createPortal(
    <div className={`${RP_ROOT} inventory-print-root`} data-print-target={printTarget}>
      <div className={`${RP_PRINT_BODY} inventory-print-body`}>
        <header className="inventory-print-letterhead">
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
            <p className="inventory-print-period-badge">{reportingPeriod}</p>
          </div>
          <div className="inventory-print-letterhead-right">
            <p className="inventory-print-meta">
              {generatedLabel}: {generatedAt}
            </p>
            <div className="inventory-print-qr" aria-hidden>
              <span>QR</span>
            </div>
          </div>
        </header>

        <p className="inventory-print-filter-line">{filterSummary}</p>

        {shouldShowSection(printTarget, 'metrics') ? (
          <section className={`${RP_PRINT_SECTION} inventory-print-section`}>
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

        {shouldShowSection(printTarget, 'details') || printTarget === 'full' ? (
          <section className={`${RP_PRINT_SECTION} inventory-print-section`}>
            <h2>{sectionTitles.details}</h2>
            <table className={RP_PRINT_TABLE}>
              <thead>
                <tr>
                  <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.sl}</th>
                  <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.sku}</th>
                  <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.product}</th>
                  <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.category}</th>
                  <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.warehouse}</th>
                  <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.qty}</th>
                  <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.cost}</th>
                  <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.value}</th>
                  <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.reorder}</th>
                  <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.status}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={row.id}>
                    <td className={RP_PRINT_TD}>{idx + 1}</td>
                    <td className={RP_PRINT_TD}>{row.sku}</td>
                    <td className={RP_PRINT_TD}>{row.name}</td>
                    <td className={RP_PRINT_TD}>{row.category}</td>
                    <td className={RP_PRINT_TD}>{row.warehouse}</td>
                    <td className={RP_PRINT_TD}>{row.qty}</td>
                    <td className={RP_PRINT_TD}>{formatCurrency(row.cost)}</td>
                    <td className={RP_PRINT_TD}>{formatCurrency(row.value)}</td>
                    <td className={RP_PRINT_TD}>{row.reorderLevel}</td>
                    <td className={RP_PRINT_TD}>{row.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ) : null}

        {shouldShowSection(printTarget, 'category') || shouldShowSection(printTarget, 'warehouse') || shouldShowSection(printTarget, 'movement') || printTarget === 'full' ? (
          <section className={`${RP_PRINT_SECTION} inventory-print-section inventory-print-split`}>
            {(shouldShowSection(printTarget, 'category') || printTarget === 'full') && categorySlices.length ? (
              <div>
                <h2>{sectionTitles.category}</h2>
                <table className={RP_PRINT_TABLE}>
                  <thead>
                    <tr>
                      <th className={`${RP_PRINT_TH} inventory-print-th`}>Category</th>
                      <th className={`${RP_PRINT_TH} inventory-print-th`}>Amount</th>
                      <th className={`${RP_PRINT_TH} inventory-print-th`}>%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categorySlices.map((slice) => (
                      <tr key={slice.key}>
                        <td className={RP_PRINT_TD}>{slice.label}</td>
                        <td className={RP_PRINT_TD}>{formatCurrency(slice.amount)}</td>
                        <td className={RP_PRINT_TD}>{slice.pct.toFixed(1)}%</td>
                      </tr>
                    ))}
                    <tr>
                      <td className={`${RP_PRINT_TD} font-bold`}>{totalLabel}</td>
                      <td className={`${RP_PRINT_TD} font-bold`} colSpan={2}>
                        {formatCurrency(totalValue)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : null}

            {(shouldShowSection(printTarget, 'warehouse') || printTarget === 'full') && warehouseSlices.length ? (
              <div>
                <h2>{sectionTitles.warehouse}</h2>
                <table className={RP_PRINT_TABLE}>
                  <thead>
                    <tr>
                      <th className={`${RP_PRINT_TH} inventory-print-th`}>Warehouse</th>
                      <th className={`${RP_PRINT_TH} inventory-print-th`}>Amount</th>
                      <th className={`${RP_PRINT_TH} inventory-print-th`}>%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {warehouseSlices.map((slice) => (
                      <tr key={slice.key}>
                        <td className={RP_PRINT_TD}>{slice.label}</td>
                        <td className={RP_PRINT_TD}>{formatCurrency(slice.amount)}</td>
                        <td className={RP_PRINT_TD}>{slice.pct.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}

            {(shouldShowSection(printTarget, 'movement') || printTarget === 'full') ? (
              <div>
                <h2>{sectionTitles.movement}</h2>
                <table className={RP_PRINT_TABLE}>
                  <tbody>
                    <tr><td className={RP_PRINT_TD}>{movementLabels.in}</td><td className={RP_PRINT_TD}>{formatCurrency(movement.stockIn)}</td></tr>
                    <tr><td className={RP_PRINT_TD}>{movementLabels.out}</td><td className={RP_PRINT_TD}>{formatCurrency(movement.stockOut)}</td></tr>
                    <tr><td className={RP_PRINT_TD}>{movementLabels.adj}</td><td className={RP_PRINT_TD}>{formatCurrency(movement.adjustments)}</td></tr>
                    <tr><td className={`${RP_PRINT_TD} font-bold`}>{movementLabels.net}</td><td className={`${RP_PRINT_TD} font-bold`}>{formatCurrency(movement.netChange)}</td></tr>
                  </tbody>
                </table>
              </div>
            ) : null}
          </section>
        ) : null}

        {shouldShowSection(printTarget, 'alerts') || printTarget === 'full' ? (
          <section className={`${RP_PRINT_SECTION} inventory-print-section inventory-print-bottom`}>
            <div>
              <h2>{sectionTitles.alerts}</h2>
              {lowStockRows.length ? (
                <table className={RP_PRINT_TABLE}>
                  <thead>
                    <tr>
                      <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.sku}</th>
                      <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.product}</th>
                      <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.qty}</th>
                      <th className={`${RP_PRINT_TH} inventory-print-th`}>{tableHeaders.reorder}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockRows.map((row) => (
                      <tr key={row.id}>
                        <td className={RP_PRINT_TD}>{row.sku}</td>
                        <td className={RP_PRINT_TD}>{row.name}</td>
                        <td className={RP_PRINT_TD}>{row.qty}</td>
                        <td className={RP_PRINT_TD}>{row.reorderLevel}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="inventory-print-meta">—</p>
              )}
            </div>
            {printTarget === 'full' ? (
              <div className="inventory-print-summary-list">
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

        <footer className="inventory-print-footer">
          <span>{preparedByLabel}: {preparedByName}</span>
          <span>{thankYouLabel}</span>
          <span>{confidentialLabel}</span>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
