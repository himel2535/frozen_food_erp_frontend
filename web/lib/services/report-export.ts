import type { CustomerReportRow } from '@/components/modules/reports/customers/customer-report-utils';
import type { FinancialReportRow } from '@/components/modules/reports/financial/financial-report-utils';
import type {
  HrBirthdayRow,
  HrDepartmentRow,
  HrJoinerRow,
  HrLeaverRow,
} from '@/components/modules/reports/hr/hr-report-utils';
import type { InventoryReportRow } from '@/components/modules/reports/inventory/inventory-report-utils';
import type { PurchaseReportRow } from '@/components/modules/reports/purchases/purchase-report-utils';
import type { SalesReportRow } from '@/components/modules/reports/sales/sales-report-utils';
import type { ProductSaleLine, ProductSalesRow } from '@/components/modules/reports/product-sales/product-sales-report-utils';
import type { SupplierReportRow } from '@/components/modules/reports/suppliers/supplier-report-utils';

export type ReportExportKpi = {
  label: string;
  value: string;
  sub?: string;
};

export type ReportExportSection = {
  title: string;
  headers: string[];
  rows: Array<Array<string | number>>;
};

export type ReportExportBundle = {
  slug: string;
  title: string;
  filterSummary: string;
  kpis?: ReportExportKpi[];
  sections: ReportExportSection[];
};

function escapeCsv(value: unknown): string {
  const raw = String(value ?? '');
  if (raw.includes(',') || raw.includes('"') || raw.includes('\n')) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

function csvLine(cells: unknown[]): string {
  return cells.map(escapeCsv).join(',');
}

function triggerDownload(csv: string, filename: string) {
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function downloadReportCsv(bundle: ReportExportBundle): number {
  const lines: string[] = [];
  const generatedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');

  lines.push(csvLine([bundle.title]));
  lines.push(csvLine(['Generated', generatedAt]));
  lines.push(csvLine(['Filters', bundle.filterSummary || 'All records']));
  lines.push('');

  if (bundle.kpis?.length) {
    lines.push(csvLine(['Key Metrics']));
    lines.push(csvLine(['Metric', 'Value', 'Note']));
    bundle.kpis.forEach((kpi) => {
      lines.push(csvLine([kpi.label, kpi.value, kpi.sub ?? '']));
    });
    lines.push('');
  }

  let rowCount = 0;
  bundle.sections.forEach((section, index) => {
    if (index > 0) lines.push('');
    lines.push(csvLine([section.title]));
    lines.push(csvLine(section.headers));
    section.rows.forEach((row) => {
      lines.push(csvLine(row));
      rowCount += 1;
    });
  });

  const stamp = new Date().toISOString().slice(0, 10);
  triggerDownload(lines.join('\n'), `${bundle.slug}-${stamp}.csv`);
  return rowCount;
}

function kpiItems(items: ReportExportKpi[]): ReportExportKpi[] {
  return items.map((item) => ({
    label: item.label,
    value: item.value,
    sub: item.sub,
  }));
}

export function exportSalesReportCsv(args: {
  title: string;
  filterSummary: string;
  kpis: ReportExportKpi[];
  rows: SalesReportRow[];
}): number {
  if (!args.rows.length) return 0;
  return downloadReportCsv({
    slug: 'sales-report',
    title: args.title,
    filterSummary: args.filterSummary,
    kpis: kpiItems(args.kpis),
    sections: [{
      title: 'Sales Transactions',
      headers: ['Date', 'Reference', 'Customer', 'Status', 'Payment Method', 'Total (BDT)'],
      rows: args.rows.map((row) => [
        row.date,
        row.ref,
        row.customer,
        row.status,
        row.paymentMethod,
        row.total.toFixed(2),
      ]),
    }],
  });
}

export function exportProductSalesReportCsv(args: {
  title: string;
  filterSummary: string;
  kpis: ReportExportKpi[];
  rows: ProductSalesRow[];
}): number {
  if (!args.rows.length) return 0;
  return downloadReportCsv({
    slug: 'product-sales-report',
    title: args.title,
    filterSummary: args.filterSummary,
    kpis: kpiItems(args.kpis),
    sections: [{
      title: 'Product Sales',
      headers: ['Product', 'SKU', 'Qty Sold', 'Avg Price (BDT)', 'Revenue (BDT)', 'Invoices', 'Share %'],
      rows: args.rows.map((row) => [
        row.productName,
        row.sku,
        row.qty,
        row.avgPrice.toFixed(2),
        row.revenue.toFixed(2),
        row.invoiceCount,
        row.sharePct.toFixed(1),
      ]),
    }],
  });
}

export function exportProductSalesLinesCsv(args: {
  title: string;
  filterSummary: string;
  kpis: ReportExportKpi[];
  rows: ProductSaleLine[];
}): number {
  if (!args.rows.length) return 0;
  return downloadReportCsv({
    slug: 'product-sales-item-report',
    title: args.title,
    filterSummary: args.filterSummary,
    kpis: kpiItems(args.kpis),
    sections: [{
      title: 'Invoice Lines',
      headers: ['Date', 'Invoice', 'Customer', 'Qty', 'Unit Price (BDT)', 'Revenue (BDT)'],
      rows: args.rows.map((row) => [
        row.date,
        row.invoiceRef,
        row.customer,
        row.qty,
        row.unitPrice.toFixed(2),
        row.revenue.toFixed(2),
      ]),
    }],
  });
}

export function exportPurchaseReportCsv(args: {
  title: string;
  filterSummary: string;
  kpis: ReportExportKpi[];
  rows: PurchaseReportRow[];
}): number {
  if (!args.rows.length) return 0;
  return downloadReportCsv({
    slug: 'purchase-report',
    title: args.title,
    filterSummary: args.filterSummary,
    kpis: kpiItems(args.kpis),
    sections: [{
      title: 'Purchase Orders',
      headers: ['Date', 'Reference', 'Supplier', 'Status', 'Payment Status', 'Total (BDT)', 'Received (BDT)', 'Pending (BDT)'],
      rows: args.rows.map((row) => [
        row.date,
        row.ref,
        row.supplier,
        row.status,
        row.paymentStatus,
        row.total.toFixed(2),
        row.received.toFixed(2),
        row.pending.toFixed(2),
      ]),
    }],
  });
}

export function exportInventoryReportCsv(args: {
  title: string;
  filterSummary: string;
  kpis: ReportExportKpi[];
  rows: InventoryReportRow[];
}): number {
  if (!args.rows.length) return 0;
  return downloadReportCsv({
    slug: 'inventory-report',
    title: args.title,
    filterSummary: args.filterSummary,
    kpis: kpiItems(args.kpis),
    sections: [{
      title: 'Inventory Details',
      headers: ['SKU', 'Product', 'Category', 'Warehouse', 'Quantity', 'Unit Cost (BDT)', 'Stock Value (BDT)', 'Status'],
      rows: args.rows.map((row) => [
        row.sku,
        row.name,
        row.category,
        row.warehouse,
        row.qty,
        row.cost.toFixed(2),
        row.value.toFixed(2),
        row.status,
      ]),
    }],
  });
}

export function exportCustomerReportCsv(args: {
  title: string;
  filterSummary: string;
  kpis: ReportExportKpi[];
  rows: CustomerReportRow[];
}): number {
  if (!args.rows.length) return 0;
  return downloadReportCsv({
    slug: 'customer-report',
    title: args.title,
    filterSummary: args.filterSummary,
    kpis: kpiItems(args.kpis),
    sections: [{
      title: 'Customer Summary',
      headers: ['Customer', 'Company', 'Phone', 'Email', 'Total Sales (BDT)', 'Outstanding (BDT)', 'Status', 'Last Sale Date'],
      rows: args.rows.map((row) => [
        row.name,
        row.company,
        row.phone,
        row.email,
        row.sales.toFixed(2),
        row.due.toFixed(2),
        row.status,
        row.lastSaleDate,
      ]),
    }],
  });
}

export function exportSupplierReportCsv(args: {
  title: string;
  filterSummary: string;
  kpis: ReportExportKpi[];
  rows: SupplierReportRow[];
}): number {
  if (!args.rows.length) return 0;
  return downloadReportCsv({
    slug: 'supplier-report',
    title: args.title,
    filterSummary: args.filterSummary,
    kpis: kpiItems(args.kpis),
    sections: [{
      title: 'Supplier Summary',
      headers: ['Supplier', 'Contact Person', 'Phone', 'Email', 'Total Purchases (BDT)', 'Payables (BDT)', 'Status', 'Last Purchase Date'],
      rows: args.rows.map((row) => [
        row.name,
        row.contactPerson,
        row.phone,
        row.email,
        row.purchases.toFixed(2),
        row.due.toFixed(2),
        row.status,
        row.lastPurchaseDate,
      ]),
    }],
  });
}

export function exportFinancialReportCsv(args: {
  title: string;
  filterSummary: string;
  kpis: ReportExportKpi[];
  rows: FinancialReportRow[];
}): number {
  if (!args.rows.length) return 0;
  return downloadReportCsv({
    slug: 'financial-report',
    title: args.title,
    filterSummary: args.filterSummary,
    kpis: kpiItems(args.kpis),
    sections: [{
      title: 'Financial Summary',
      headers: ['Line Item', 'Category', 'Amount (BDT)', 'Period'],
      rows: args.rows.map((row) => [
        row.line,
        row.category,
        row.amount.toFixed(2),
        row.period,
      ]),
    }],
  });
}

export function exportHrReportCsv(args: {
  title: string;
  filterSummary: string;
  kpis: ReportExportKpi[];
  departments: HrDepartmentRow[];
  joiners: HrJoinerRow[];
  leavers: HrLeaverRow[];
  birthdays: HrBirthdayRow[];
}): number {
  const sections: ReportExportSection[] = [];

  if (args.departments.length) {
    sections.push({
      title: 'Department Summary',
      headers: ['Department', 'Total', 'Male', 'Female', 'Joined', 'Left', 'Net Change'],
      rows: args.departments.map((row) => [
        row.department,
        row.total,
        row.male,
        row.female,
        row.joined,
        row.left,
        row.netChange,
      ]),
    });
  }

  if (args.joiners.length) {
    sections.push({
      title: 'Recent Joiners',
      headers: ['Employee ID', 'Name', 'Department', 'Designation', 'Join Date'],
      rows: args.joiners.map((row) => [
        row.employeeId,
        row.name,
        row.department,
        row.designation,
        row.joinDate,
      ]),
    });
  }

  if (args.leavers.length) {
    sections.push({
      title: 'Recent Leavers',
      headers: ['Employee ID', 'Name', 'Department', 'Designation', 'Left Date'],
      rows: args.leavers.map((row) => [
        row.employeeId,
        row.name,
        row.department,
        row.designation,
        row.leftDate,
      ]),
    });
  }

  if (args.birthdays.length) {
    sections.push({
      title: 'Upcoming Birthdays',
      headers: ['Employee ID', 'Name', 'Department', 'Birth Date'],
      rows: args.birthdays.map((row) => [
        row.employeeId,
        row.name,
        row.department,
        row.birthDate,
      ]),
    });
  }

  if (!sections.length) return 0;

  return downloadReportCsv({
    slug: 'hr-report',
    title: args.title,
    filterSummary: args.filterSummary,
    kpis: kpiItems(args.kpis),
    sections,
  });
}
