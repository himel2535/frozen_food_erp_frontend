import type { AppState } from '@/lib/state/types';
import {
  createInState,
  formatCurrency,
  listFromState,
  updateInState,
} from '@/lib/services/domain-service';

export type ProfitLossSection = 'income' | 'cogs' | 'operating' | 'other' | 'tax';

export interface ProfitLossLine {
  id: string;
  lineItem: string;
  category: string;
  section: ProfitLossSection;
  amount: number;
  sortOrder: number;
  notes?: string;
}

export interface ProfitLossMetrics {
  totalRevenue: number;
  totalExpense: number;
  netProfit: number;
  profitMargin: number;
}

export type ProfitLossDisplayRowType =
  | 'section_header'
  | 'line_item'
  | 'subtotal'
  | 'computed';

export interface ProfitLossDisplayRow {
  id: string;
  rowType: ProfitLossDisplayRowType;
  section?: ProfitLossSection;
  lineItem: string;
  category?: string;
  amount?: number;
  percentOfRevenue?: number;
  sourceId?: string;
  tone?: 'green' | 'red' | 'blue' | 'purple' | 'neutral';
  highlight?: boolean;
}

export interface ProfitLossLinePayload {
  lineItem: string;
  category: string;
  section: ProfitLossSection;
  amount?: number;
  notes?: string;
  sortOrder?: number;
}

function normalizeRow(row: Record<string, unknown>): ProfitLossLine {
  return {
    id: String(row.id ?? ''),
    lineItem: String(row.lineItem ?? row.line ?? ''),
    category: String(row.category ?? ''),
    section: String(row.section ?? 'income') as ProfitLossSection,
    amount: Number(row.amount ?? 0),
    sortOrder: Number(row.sortOrder ?? 0),
    notes: row.notes ? String(row.notes) : undefined,
  };
}

function sumSection(lines: ProfitLossLine[], section: ProfitLossSection) {
  return lines.filter((l) => l.section === section).reduce((s, l) => s + l.amount, 0);
}


export function listProfitLossLines(state: AppState): ProfitLossLine[] {
  return listFromState(state, 'profitLoss')
    .map(normalizeRow)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.lineItem.localeCompare(b.lineItem));
}

export function getProfitLossMetrics(lines: ProfitLossLine[]): ProfitLossMetrics {
  const totalRevenue = sumSection(lines, 'income');
  const otherExpense = lines
    .filter((l) => l.section === 'other' && l.category !== 'Other Income')
    .reduce((s, l) => s + l.amount, 0);
  const totalExpense =
    sumSection(lines, 'cogs') +
    sumSection(lines, 'operating') +
    otherExpense +
    sumSection(lines, 'tax');
  const netProfit = totalRevenue - totalExpense;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  return {
    totalRevenue,
    totalExpense,
    netProfit,
    profitMargin,
  };
}

export function percentOfRevenue(amount: number, totalRevenue: number) {
  if (!totalRevenue) return 0;
  return (amount / totalRevenue) * 100;
}

function makeDisplayRow(
  partial: Omit<ProfitLossDisplayRow, 'id'> & { id?: string },
): ProfitLossDisplayRow {
  return { id: partial.id ?? `row-${partial.lineItem}-${partial.rowType}`, ...partial };
}

export function buildProfitLossDisplayRows(lines: ProfitLossLine[]): ProfitLossDisplayRow[] {
  const metrics = getProfitLossMetrics(lines);
  const totalRevenue = metrics.totalRevenue;
  const rows: ProfitLossDisplayRow[] = [];

  const pushSection = (
    section: ProfitLossSection,
    title: string,
    tone: ProfitLossDisplayRow['tone'],
    sectionLines: ProfitLossLine[],
    subtotalLabel: string,
    subtotalTone?: ProfitLossDisplayRow['tone'],
    subtotalOverride?: number,
  ) => {
    rows.push(makeDisplayRow({
      id: `header-${section}`,
      rowType: 'section_header',
      section,
      lineItem: title,
      tone,
    }));
    sectionLines.forEach((line) => {
      rows.push(makeDisplayRow({
        id: line.id,
        rowType: 'line_item',
        section,
        lineItem: line.lineItem,
        category: line.category,
        amount: line.amount,
        percentOfRevenue: percentOfRevenue(line.amount, totalRevenue),
        sourceId: line.id,
      }));
    });
    const subtotal = subtotalOverride ?? sectionLines.reduce((s, l) => s + l.amount, 0);
    rows.push(makeDisplayRow({
      id: `subtotal-${section}`,
      rowType: 'subtotal',
      section,
      lineItem: subtotalLabel,
      amount: subtotal,
      percentOfRevenue: percentOfRevenue(subtotal, totalRevenue),
      tone: subtotalTone ?? tone,
    }));
  };

  const incomeLines = lines.filter((l) => l.section === 'income');
  const cogsLines = lines.filter((l) => l.section === 'cogs');
  const operatingLines = lines.filter((l) => l.section === 'operating');
  const otherLines = lines.filter((l) => l.section === 'other');
  const taxLines = lines.filter((l) => l.section === 'tax');

  pushSection('income', 'INCOME', 'green', incomeLines, 'Total Income', 'green');

  const totalIncome = sumSection(lines, 'income');
  pushSection('cogs', 'COST OF GOODS SOLD (COGS)', 'red', cogsLines, 'Total COGS', 'red');
  const totalCogs = sumSection(lines, 'cogs');
  const grossProfit = totalIncome - totalCogs;
  rows.push(makeDisplayRow({
    id: 'computed-gross-profit',
    rowType: 'computed',
    lineItem: 'Gross Profit',
    amount: grossProfit,
    percentOfRevenue: percentOfRevenue(grossProfit, totalRevenue),
    tone: 'green',
  }));

  pushSection('operating', 'OPERATING EXPENSES', 'blue', operatingLines, 'Total Operating Expenses', 'blue');
  const totalOperating = sumSection(lines, 'operating');
  const operatingProfit = grossProfit - totalOperating;
  rows.push(makeDisplayRow({
    id: 'computed-operating-profit',
    rowType: 'computed',
    lineItem: 'Operating Profit',
    amount: operatingProfit,
    percentOfRevenue: percentOfRevenue(operatingProfit, totalRevenue),
    tone: 'green',
  }));

  const otherIncome = otherLines.filter((l) => l.category === 'Other Income').reduce((s, l) => s + l.amount, 0);
  const otherExpenseOnly = otherLines.filter((l) => l.category !== 'Other Income').reduce((s, l) => s + l.amount, 0);
  const netOther = otherIncome - otherExpenseOnly;

  pushSection('other', 'OTHER INCOME & EXPENSES', 'purple', otherLines, 'Total Other Income & Expenses', 'purple', netOther);

  const netBeforeTax = operatingProfit + netOther;
  rows.push(makeDisplayRow({
    id: 'computed-net-before-tax',
    rowType: 'computed',
    lineItem: 'Net Profit Before Tax',
    amount: netBeforeTax,
    percentOfRevenue: percentOfRevenue(netBeforeTax, totalRevenue),
    tone: 'green',
  }));

  taxLines.forEach((line) => {
    rows.push(makeDisplayRow({
      id: line.id,
      rowType: 'line_item',
      section: 'tax',
      lineItem: line.lineItem,
      category: line.category,
      amount: line.amount,
      percentOfRevenue: percentOfRevenue(line.amount, totalRevenue),
      sourceId: line.id,
    }));
  });

  const netAfterTax = metrics.netProfit;
  rows.push(makeDisplayRow({
    id: 'computed-net-after-tax',
    rowType: 'computed',
    lineItem: 'Net Profit After Tax',
    amount: netAfterTax,
    percentOfRevenue: percentOfRevenue(netAfterTax, totalRevenue),
    tone: 'green',
    highlight: true,
  }));

  return rows;
}

export function createProfitLossLine(state: AppState, payload: ProfitLossLinePayload) {
  if (!payload.lineItem?.trim()) {
    return { ok: false as const, error: 'Line item is required.' };
  }
  const existing = listProfitLossLines(state);
  const maxSort = existing.reduce((m, l) => Math.max(m, l.sortOrder), 0);
  return createInState(state, 'profitLoss', {
    lineItem: payload.lineItem.trim(),
    category: payload.category || 'Expense',
    section: payload.section || 'operating',
    amount: Number(payload.amount ?? 0),
    sortOrder: payload.sortOrder ?? maxSort + 1,
    notes: payload.notes?.trim() || '',
  }, 'PL');
}

export function updateProfitLossLine(state: AppState, id: string, payload: ProfitLossLinePayload) {
  if (!payload.lineItem?.trim()) {
    return { ok: false as const, error: 'Line item is required.' };
  }
  return updateInState(state, 'profitLoss', id, {
    lineItem: payload.lineItem.trim(),
    category: payload.category || 'Expense',
    section: payload.section || 'operating',
    amount: Number(payload.amount ?? 0),
    notes: payload.notes?.trim() || '',
  });
}

export function formatPlMoney(value: number) {
  return formatCurrency(value);
}

export function formatPlAmount(value: number) {
  return Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatPlPercent(value: number) {
  return `${value.toFixed(2)}%`;
}

export function formatPeriodLabel(dateFrom: string, dateTo: string) {
  const fmt = (d: string) => {
    if (!d) return '—';
    const date = new Date(`${d}T00:00:00`);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };
  return `${fmt(dateFrom)} - ${fmt(dateTo)}`;
}
