'use client';

import { ReportModule, type ReportModuleConfig } from '@/components/modules/shared/ReportModule';
import { formatCurrency } from '@/lib/services/domain-service';
import type { AppState } from '@/lib/state/types';

function money(v: unknown) {
  return formatCurrency(Number(v ?? 0));
}

function listReport(state: AppState, key: string) {
  const rows = state[key];
  return Array.isArray(rows) ? (rows as Record<string, unknown>[]) : [];
}

export const REPORT_CONFIGS: Record<string, ReportModuleConfig> = {
  'reports-sales': {
    title: 'Sales Reports',
    subtitle: 'Sales revenue analytics and invoice summary.',
    searchKeys: ['ref', 'customer'],
    dateRangeKeys: { start: 'date', end: 'date' },
    statusFilterKey: 'status',
    statusOptions: [
      { value: 'All', label: 'All Status' },
      { value: 'Paid', label: 'Paid' },
      { value: 'Unpaid', label: 'Unpaid' },
      { value: 'Partial', label: 'Partial' },
    ],
    columns: [
      { key: 'date', label: 'Date' },
      { key: 'ref', label: 'Reference' },
      { key: 'customer', label: 'Customer' },
      { key: 'status', label: 'Status' },
      { key: 'total', label: 'Total', align: 'right', render: (r) => money(r.total) },
    ],
    list: (s) => listReport(s, 'reportSales'),
    kpi: (rows) => {
      const total = rows.reduce((s, r) => s + Number(r.total ?? 0), 0);
      const avg = rows.length ? total / rows.length : 0;
      return [
        { key: 'revenue', label: 'Total Revenue', value: money(total) },
        { key: 'orders', label: 'Total Orders', value: String(rows.length) },
        { key: 'avg', label: 'Avg Order Value', value: money(avg) },
      ];
    },
  },
  'reports-purchases': {
    title: 'Purchase Reports',
    subtitle: 'Procurement spend and PO analytics.',
    searchKeys: ['ref', 'supplier'],
    dateRangeKeys: { start: 'date', end: 'date' },
    statusFilterKey: 'status',
    statusOptions: [
      { value: 'All', label: 'All' },
      { value: 'Received', label: 'Received' },
      { value: 'Sent', label: 'Sent' },
      { value: 'Draft', label: 'Draft' },
    ],
    columns: [
      { key: 'date', label: 'Date' },
      { key: 'ref', label: 'PO Ref' },
      { key: 'supplier', label: 'Supplier' },
      { key: 'status', label: 'Status' },
      { key: 'total', label: 'Total', align: 'right', render: (r) => money(r.total) },
    ],
    list: (s) => listReport(s, 'reportPurchases'),
    kpi: (rows) => {
      const total = rows.reduce((s, r) => s + Number(r.total ?? 0), 0);
      return [
        { key: 'spend', label: 'Total Spend', value: money(total) },
        { key: 'orders', label: 'PO Count', value: String(rows.length) },
      ];
    },
  },
  'reports-inventory': {
    title: 'Inventory Reports',
    subtitle: 'Stock valuation and low-stock alerts.',
    searchKeys: ['sku', 'name'],
    filters: [
      { key: 'category', label: 'Category', type: 'select', options: [{ value: 'Raw Materials', label: 'Raw Materials' }, { value: 'Finished Goods', label: 'Finished Goods' }] },
      { key: 'warehouse', label: 'Warehouse', type: 'select', options: [{ value: 'Main Warehouse', label: 'Main Warehouse' }, { value: 'Factory Floor', label: 'Factory Floor' }] },
    ],
    columns: [
      { key: 'sku', label: 'SKU' },
      { key: 'name', label: 'Product' },
      { key: 'category', label: 'Category' },
      { key: 'warehouse', label: 'Warehouse' },
      { key: 'qty', label: 'Qty' },
      { key: 'cost', label: 'Unit Cost', render: (r) => money(r.cost) },
      { key: 'value', label: 'Total Value', align: 'right', render: (r) => money(Number(r.qty ?? 0) * Number(r.cost ?? 0)) },
    ],
    list: (s) => listReport(s, 'reportInventory'),
    kpi: (rows) => {
      let valuation = 0;
      let lowStock = 0;
      rows.forEach((r) => {
        valuation += Number(r.qty ?? 0) * Number(r.cost ?? 0);
        if (Number(r.qty ?? 0) < 50) lowStock++;
      });
      return [
        { key: 'val', label: 'Total Inventory Valuation', value: money(valuation) },
        { key: 'skus', label: 'Total SKUs', value: String(rows.length) },
        { key: 'low', label: 'Low Stock Items', value: String(lowStock) },
      ];
    },
  },
  'reports-customers': {
    title: 'Customer Reports',
    subtitle: 'Customer sales and receivables summary.',
    searchKeys: ['name', 'company'],
    columns: [
      { key: 'name', label: 'Customer' },
      { key: 'company', label: 'Company' },
      { key: 'sales', label: 'Total Sales', render: (r) => money(r.sales) },
      { key: 'due', label: 'Outstanding', render: (r) => money(r.due) },
      { key: 'status', label: 'Status' },
    ],
    list: (s) => listReport(s, 'reportCustomers'),
    kpi: (rows) => [
      { key: 'sales', label: 'Total Sales', value: money(rows.reduce((s, r) => s + Number(r.sales ?? 0), 0)) },
      { key: 'due', label: 'Total Due', value: money(rows.reduce((s, r) => s + Number(r.due ?? 0), 0)) },
      { key: 'count', label: 'Customers', value: String(rows.length) },
    ],
  },
  'reports-suppliers': {
    title: 'Supplier Reports',
    subtitle: 'Supplier spend and payables summary.',
    searchKeys: ['name'],
    columns: [
      { key: 'name', label: 'Supplier' },
      { key: 'purchases', label: 'Total Purchases', render: (r) => money(r.purchases) },
      { key: 'due', label: 'Outstanding', render: (r) => money(r.due) },
      { key: 'status', label: 'Status' },
    ],
    list: (s) => listReport(s, 'reportSuppliers'),
    kpi: (rows) => [
      { key: 'spend', label: 'Total Purchases', value: money(rows.reduce((s, r) => s + Number(r.purchases ?? 0), 0)) },
      { key: 'due', label: 'Total Payables', value: money(rows.reduce((s, r) => s + Number(r.due ?? 0), 0)) },
    ],
  },
  'reports-financial': {
    title: 'Financial Reports',
    subtitle: 'P&L and cash flow summary.',
    searchKeys: ['line', 'category'],
    columns: [
      { key: 'line', label: 'Line Item' },
      { key: 'category', label: 'Category' },
      { key: 'amount', label: 'Amount', align: 'right', render: (r) => money(r.amount) },
      { key: 'period', label: 'Period' },
    ],
    list: (s) => listReport(s, 'reportFinancial'),
    kpi: (rows) => {
      const revenue = rows.filter((r) => r.category === 'Revenue').reduce((s, r) => s + Number(r.amount ?? 0), 0);
      const expense = rows.filter((r) => r.category !== 'Revenue').reduce((s, r) => s + Number(r.amount ?? 0), 0);
      return [
        { key: 'rev', label: 'Revenue', value: money(revenue) },
        { key: 'exp', label: 'Expenses', value: money(expense) },
        { key: 'net', label: 'Net', value: money(revenue - expense) },
      ];
    },
  },
  'reports-hr': {
    title: 'HR Reports',
    subtitle: 'Workforce analytics and headcount.',
    searchKeys: ['department', 'metric'],
    columns: [
      { key: 'department', label: 'Department' },
      { key: 'metric', label: 'Metric' },
      { key: 'value', label: 'Value' },
      { key: 'period', label: 'Period' },
    ],
    list: (s) => listReport(s, 'reportHR'),
    kpi: (rows) => [
      { key: 'headcount', label: 'Total Headcount', value: String(rows.filter((r) => r.metric === 'Headcount').reduce((s, r) => s + Number(r.value ?? 0), 0)) },
      { key: 'metrics', label: 'Metrics Tracked', value: String(rows.length) },
    ],
  },
};

export function ReportsSalesPage() { return <ReportModule config={REPORT_CONFIGS['reports-sales']} />; }
export function ReportsPurchasesPage() { return <ReportModule config={REPORT_CONFIGS['reports-purchases']} />; }
export function ReportsInventoryPage() { return <ReportModule config={REPORT_CONFIGS['reports-inventory']} />; }
export function ReportsCustomersPage() { return <ReportModule config={REPORT_CONFIGS['reports-customers']} />; }
export function ReportsSuppliersPage() { return <ReportModule config={REPORT_CONFIGS['reports-suppliers']} />; }
export function ReportsFinancialPage() { return <ReportModule config={REPORT_CONFIGS['reports-financial']} />; }
export function ReportsHrPage() { return <ReportModule config={REPORT_CONFIGS['reports-hr']} />; }
