import type { AppState } from '@/lib/state/types';
import {
  createInState,
  deleteFromState,
  formatCurrency,
  listFromState,
  updateInState,
} from '@/lib/services/domain-service';

export type BalanceSheetSection =
  | 'current_assets'
  | 'non_current_assets'
  | 'current_liabilities'
  | 'long_term_liabilities'
  | 'equity';

export type BalanceSheetType = 'Asset' | 'Liability' | 'Equity';
export type BalanceSheetStatus = 'active' | 'pending';

export interface BalanceSheetLine {
  id: string;
  lineItem: string;
  section: BalanceSheetSection;
  type: BalanceSheetType;
  amount: number;
  sortOrder: number;
  openingDate?: string;
  reference?: string;
  notes?: string;
  status: BalanceSheetStatus;
}

export interface BalanceSheetMetrics {
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  difference: number;
  isBalanced: boolean;
  assetsPercent: number;
  liabilitiesPercent: number;
  equityPercent: number;
}

export type BalanceSheetDisplayRowType = 'group_header' | 'line_item';

export interface BalanceSheetDisplayRow {
  id: string;
  rowType: BalanceSheetDisplayRowType;
  lineItem: string;
  sectionLabel?: string;
  type?: BalanceSheetType;
  amount?: number;
  sourceId?: string;
  groupKey?: BalanceSheetSection;
  groupTotal?: number;
  collapsible?: boolean;
}

export interface BalanceSheetFilters {
  search?: string;
  section?: string;
  type?: string;
  showZeroBalance?: boolean;
}

export interface BalanceSheetLinePayload {
  lineItem: string;
  section: BalanceSheetSection;
  type: BalanceSheetType;
  amount?: number;
  openingDate?: string;
  reference?: string;
  notes?: string;
  status?: BalanceSheetStatus;
  sortOrder?: number;
}

export const BALANCE_SHEET_SECTION_LABELS: Record<BalanceSheetSection, string> = {
  current_assets: 'Current Assets',
  non_current_assets: 'Non-Current Assets',
  current_liabilities: 'Current Liabilities',
  long_term_liabilities: 'Long-term Liabilities',
  equity: "Owner's Equity",
};

const GROUP_ORDER: BalanceSheetSection[] = [
  'current_assets',
  'non_current_assets',
  'current_liabilities',
  'long_term_liabilities',
  'equity',
];

function normalizeRow(row: Record<string, unknown>): BalanceSheetLine {
  const section = String(row.section ?? 'current_assets') as BalanceSheetSection;
  const typeFromSection: BalanceSheetType =
    section === 'equity' ? 'Equity' : section.includes('liabilit') ? 'Liability' : 'Asset';
  return {
    id: String(row.id ?? ''),
    lineItem: String(row.lineItem ?? row.line ?? ''),
    section,
    type: (row.type as BalanceSheetType) ?? typeFromSection,
    amount: Number(row.amount ?? 0),
    sortOrder: Number(row.sortOrder ?? 0),
    openingDate: row.openingDate ? String(row.openingDate) : undefined,
    reference: row.reference ? String(row.reference) : undefined,
    notes: row.notes ? String(row.notes) : undefined,
    status: (row.status === 'pending' ? 'pending' : 'active') as BalanceSheetStatus,
  };
}

function sumBySections(lines: BalanceSheetLine[], sections: BalanceSheetSection[]) {
  return lines.filter((l) => sections.includes(l.section)).reduce((s, l) => s + l.amount, 0);
}

export function listBalanceSheetLines(state: AppState): BalanceSheetLine[] {
  return listFromState(state, 'balanceSheet')
    .map(normalizeRow)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.lineItem.localeCompare(b.lineItem));
}

export function getBalanceSheetMetrics(lines: BalanceSheetLine[]): BalanceSheetMetrics {
  const totalAssets = sumBySections(lines, ['current_assets', 'non_current_assets']);
  const totalLiabilities = sumBySections(lines, ['current_liabilities', 'long_term_liabilities']);
  const totalEquity = sumBySections(lines, ['equity']);
  const difference = Math.abs(totalAssets - (totalLiabilities + totalEquity));
  const grandTotal = totalAssets || totalLiabilities + totalEquity || 1;

  return {
    totalAssets,
    totalLiabilities,
    totalEquity,
    difference,
    isBalanced: difference < 0.01,
    assetsPercent: (totalAssets / grandTotal) * 100,
    liabilitiesPercent: (totalLiabilities / grandTotal) * 100,
    equityPercent: (totalEquity / grandTotal) * 100,
  };
}

export function filterBalanceSheetLines(
  lines: BalanceSheetLine[],
  filters: BalanceSheetFilters,
): BalanceSheetLine[] {
  const search = (filters.search ?? '').trim().toLowerCase();
  return lines.filter((line) => {
    if (!filters.showZeroBalance && line.amount === 0) return false;
    if (filters.section && filters.section !== 'all' && line.section !== filters.section) return false;
    if (filters.type && filters.type !== 'all' && line.type !== filters.type) return false;
    if (!search) return true;
    const haystack = `${line.lineItem} ${line.reference ?? ''} ${BALANCE_SHEET_SECTION_LABELS[line.section]}`.toLowerCase();
    return haystack.includes(search);
  });
}

export function buildBalanceSheetDisplayRows(lines: BalanceSheetLine[]): BalanceSheetDisplayRow[] {
  const rows: BalanceSheetDisplayRow[] = [];

  GROUP_ORDER.forEach((groupKey) => {
    const groupLines = lines.filter((l) => l.section === groupKey);
    if (groupLines.length === 0) return;
    const groupTotal = groupLines.reduce((s, l) => s + l.amount, 0);
    rows.push({
      id: `group-${groupKey}`,
      rowType: 'group_header',
      lineItem: BALANCE_SHEET_SECTION_LABELS[groupKey],
      groupKey,
      groupTotal,
      collapsible: true,
    });
    groupLines.forEach((line) => {
      rows.push({
        id: line.id,
        rowType: 'line_item',
        lineItem: line.lineItem,
        sectionLabel: BALANCE_SHEET_SECTION_LABELS[line.section],
        type: line.type,
        amount: line.amount,
        sourceId: line.id,
        groupKey,
      });
    });
  });

  return rows;
}

export function createBalanceSheetLine(state: AppState, payload: BalanceSheetLinePayload) {
  if (!payload.lineItem?.trim()) {
    return { ok: false as const, error: 'Line item name is required.' };
  }
  const existing = listBalanceSheetLines(state);
  const maxSort = existing.reduce((m, l) => Math.max(m, l.sortOrder), 0);
  return createInState(state, 'balanceSheet', {
    lineItem: payload.lineItem.trim(),
    section: payload.section,
    type: payload.type,
    amount: Number(payload.amount ?? 0),
    sortOrder: payload.sortOrder ?? maxSort + 1,
    openingDate: payload.openingDate || new Date().toISOString().slice(0, 10),
    reference: payload.reference?.trim() || '',
    notes: payload.notes?.trim() || '',
    status: payload.status ?? 'active',
  }, 'BS');
}

export function updateBalanceSheetLine(state: AppState, id: string, payload: BalanceSheetLinePayload) {
  if (!payload.lineItem?.trim()) {
    return { ok: false as const, error: 'Line item name is required.' };
  }
  return updateInState(state, 'balanceSheet', id, {
    lineItem: payload.lineItem.trim(),
    section: payload.section,
    type: payload.type,
    amount: Number(payload.amount ?? 0),
    openingDate: payload.openingDate,
    reference: payload.reference?.trim() || '',
    notes: payload.notes?.trim() || '',
    status: payload.status ?? 'active',
  });
}

export function deleteBalanceSheetLine(state: AppState, id: string) {
  return deleteFromState(state, 'balanceSheet', id);
}

export function formatBsMoney(value: number) {
  return formatCurrency(value);
}

export function formatBsAmount(value: number) {
  return Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatBsPercent(value: number) {
  return `${value.toFixed(2)}%`;
}

export function sectionToType(section: BalanceSheetSection): BalanceSheetType {
  if (section === 'equity') return 'Equity';
  if (section.includes('liabilit')) return 'Liability';
  return 'Asset';
}
