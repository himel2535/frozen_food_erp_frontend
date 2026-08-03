import { formatCurrency } from '@/lib/services/domain-service';
import type { KpiCardItem } from '@/components/shared/KpiCards';

export type FinancialReportRow = {
  id: string;
  line: string;
  category: string;
  amount: number;
  period: string;
};

export type FinancialReportFilters = {
  search: string;
  dateStart: string;
  dateEnd: string;
  period: string;
};

export type FinancialBreakdownSlice = {
  key: string;
  label: string;
  amount: number;
  pct: number;
};

export type FinancialTrendPoint = {
  label: string;
  revenue: number;
  expenses: number;
  netProfit: number;
};

export type FinancialCashFlow = {
  inflow: number;
  outflow: number;
  net: number;
  closing: number;
};

export type FinancialCategorySummaryRow = {
  category: string;
  revenue: number;
  expenses: number;
  net: number;
};

const TREND_DEMO: FinancialTrendPoint[] = [
  { label: 'Jan 2026', revenue: 85000, expenses: 52000, netProfit: 33000 },
  { label: 'Feb 2026', revenue: 92000, expenses: 54000, netProfit: 38000 },
  { label: 'Mar 2026', revenue: 98000, expenses: 56000, netProfit: 42000 },
  { label: 'Apr 2026', revenue: 105000, expenses: 59000, netProfit: 46000 },
  { label: 'May 2026', revenue: 115000, expenses: 62000, netProfit: 53000 },
  { label: 'Jun 2026', revenue: 125000, expenses: 67000, netProfit: 58000 },
];

function normalizeRow(row: Record<string, unknown>): FinancialReportRow {
  return {
    id: String(row.id ?? row.line ?? ''),
    line: String(row.line ?? ''),
    category: String(row.category ?? ''),
    amount: Number(row.amount ?? 0),
    period: String(row.period ?? ''),
  };
}

export function listFinancialReportRows(rows: Record<string, unknown>[]): FinancialReportRow[] {
  return rows.map(normalizeRow);
}

export function filterFinancialRows(rows: FinancialReportRow[], filters: FinancialReportFilters): FinancialReportRow[] {
  let data = [...rows];

  if (filters.search) {
    const q = filters.search.toLowerCase();
    data = data.filter(
      (row) => row.line.toLowerCase().includes(q) || row.category.toLowerCase().includes(q),
    );
  }

  return data;
}

export function calcTotalRevenue(rows: FinancialReportRow[]): number {
  return rows.filter((r) => r.category === 'Revenue').reduce((s, r) => s + r.amount, 0);
}

export function calcTotalExpenses(rows: FinancialReportRow[]): number {
  return rows
    .filter((r) => r.category === 'COGS' || (r.category === 'Expense' && r.line !== 'Other Expenses'))
    .reduce((s, r) => s + r.amount, 0);
}

export function calcNetProfit(rows: FinancialReportRow[]): number {
  return calcTotalRevenue(rows) - calcTotalExpenses(rows);
}

export function buildFinancialKpis(rows: FinancialReportRow[], trendSuffix: string): KpiCardItem[] {
  const revenue = calcTotalRevenue(rows);
  const expenses = calcTotalExpenses(rows);
  const net = calcNetProfit(rows);

  return [
    {
      key: 'revenue',
      label: 'Total Revenue',
      value: formatCurrency(revenue),
      sub: `▲ 18.75% ${trendSuffix}`,
      iconify: 'flat-color-icons:currency-exchange',
    },
    {
      key: 'expenses',
      label: 'Total Expenses',
      value: formatCurrency(expenses),
      sub: `▲ 10.25% ${trendSuffix}`,
      alert: expenses > 0,
      iconify: 'flat-color-icons:document',
    },
    {
      key: 'net',
      label: 'Net Profit (Loss)',
      value: formatCurrency(net),
      sub: `▲ 31.82% ${trendSuffix}`,
      iconify: 'flat-color-icons:line-chart',
    },
  ];
}

export function buildExpenseBreakdown(rows: FinancialReportRow[]): FinancialBreakdownSlice[] {
  const expenseRows = rows.filter(
    (r) => r.category === 'COGS' || (r.category === 'Expense' && r.line !== 'Other Expenses'),
  );
  const total = expenseRows.reduce((s, r) => s + r.amount, 0);

  return expenseRows
    .map((row) => ({
      key: row.line,
      label: row.line,
      amount: row.amount,
      pct: total > 0 ? (row.amount / total) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

export function getCashFlowSnapshot(): FinancialCashFlow {
  return {
    inflow: 130000,
    outflow: 72000,
    net: 58000,
    closing: 58000,
  };
}

export function buildCategorySummary(rows: FinancialReportRow[]): FinancialCategorySummaryRow[] {
  const categories = ['Revenue', 'COGS', 'Operating Expenses', 'Other'];

  return categories.map((cat) => {
    if (cat === 'Revenue') {
      const revenue = rows.filter((r) => r.category === 'Revenue').reduce((s, r) => s + r.amount, 0);
      return { category: cat, revenue, expenses: 0, net: revenue };
    }
    if (cat === 'COGS') {
      const expenses = rows.filter((r) => r.category === 'COGS').reduce((s, r) => s + r.amount, 0);
      return { category: cat, revenue: 0, expenses, net: -expenses };
    }
    if (cat === 'Operating Expenses') {
      const expenses = rows.filter((r) => r.line === 'Operating Expenses').reduce((s, r) => s + r.amount, 0);
      return { category: cat, revenue: 0, expenses, net: -expenses };
    }
    const income = rows.filter((r) => r.category === 'Income').reduce((s, r) => s + r.amount, 0);
    const expenses = rows.filter((r) => r.line === 'Other Expenses').reduce((s, r) => s + r.amount, 0);
    return { category: cat, revenue: income, expenses, net: income - expenses };
  });
}

export function getTrendData(): FinancialTrendPoint[] {
  return TREND_DEMO;
}

export function formatFilterSummary(filters: FinancialReportFilters): string {
  const parts: string[] = [];
  if (filters.dateStart || filters.dateEnd) {
    parts.push(`${filters.dateStart || '…'} – ${filters.dateEnd || '…'}`);
  }
  if (filters.period !== 'This Month') parts.push(filters.period);
  return parts.length ? parts.join(' · ') : 'All records';
}

export function formatReportingPeriod(filters: FinancialReportFilters): string {
  if (filters.dateStart && filters.dateEnd) {
    const fmt = (d: string) => {
      const date = new Date(`${d}T00:00:00`);
      return date.toLocaleDateString('en-GB');
    };
    return `${fmt(filters.dateStart)} - ${fmt(filters.dateEnd)}`;
  }
  return '01/06/2026 - 12/06/2026';
}

export function categoryBadgeLabel(category: string): string {
  return category;
}

export function getSliceColors(
  map: Record<string, { from: string; to: string }>,
  key: string,
  index: number,
) {
  const fallback = [
    { from: '#3b82f6', to: '#2563eb' },
    { from: '#10b981', to: '#059669' },
    { from: '#f97316', to: '#ea580c' },
    { from: '#8b5cf6', to: '#7c3aed' },
  ];
  return map[key] ?? fallback[index % fallback.length];
}
