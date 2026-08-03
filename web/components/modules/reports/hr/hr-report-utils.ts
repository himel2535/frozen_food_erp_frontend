import type { KpiCardItem } from '@/components/shared/KpiCards';

export type HrDepartmentRow = {
  id: string;
  department: string;
  total: number;
  male: number;
  female: number;
  joined: number;
  left: number;
  netChange: number;
};

export type HrJoinerRow = {
  id: string;
  employeeId: string;
  name: string;
  department: string;
  designation: string;
  joinDate: string;
};

export type HrLeaverRow = {
  id: string;
  employeeId: string;
  name: string;
  department: string;
  designation: string;
  leftDate: string;
};

export type HrBirthdayRow = {
  id: string;
  employeeId: string;
  name: string;
  department: string;
  birthDate: string;
};

export type HrReportFilters = {
  search: string;
  dateStart: string;
  dateEnd: string;
  department: string;
};

export type HrBreakdownSlice = {
  key: string;
  label: string;
  amount: number;
  pct: number;
};

export type HrJoinersLeaversPoint = {
  label: string;
  joined: number;
  left: number;
};

export type HrKeyMetricsSnapshot = {
  averageAge: number;
  averageTenure: number;
  attendanceRate: number;
  leaveUtilization: number;
};

const JOINERS_LEAVERS_TREND: HrJoinersLeaversPoint[] = [
  { label: 'Jan 2026', joined: 0, left: 0 },
  { label: 'Feb 2026', joined: 1, left: 0 },
  { label: 'Mar 2026', joined: 0, left: 0 },
  { label: 'Apr 2026', joined: 1, left: 0 },
  { label: 'May 2026', joined: 0, left: 0 },
  { label: 'Jun 2026', joined: 1, left: 0 },
];

const KEY_METRICS_DEMO: HrKeyMetricsSnapshot = {
  averageAge: 32.4,
  averageTenure: 2.6,
  attendanceRate: 96.2,
  leaveUtilization: 12.5,
};

function normalizeDepartment(row: Record<string, unknown>): HrDepartmentRow {
  return {
    id: String(row.id ?? row.department ?? ''),
    department: String(row.department ?? ''),
    total: Number(row.total ?? 0),
    male: Number(row.male ?? 0),
    female: Number(row.female ?? 0),
    joined: Number(row.joined ?? 0),
    left: Number(row.left ?? 0),
    netChange: Number(row.netChange ?? 0),
  };
}

function normalizeJoiner(row: Record<string, unknown>): HrJoinerRow {
  return {
    id: String(row.id ?? row.employeeId ?? ''),
    employeeId: String(row.employeeId ?? ''),
    name: String(row.name ?? ''),
    department: String(row.department ?? ''),
    designation: String(row.designation ?? ''),
    joinDate: String(row.joinDate ?? ''),
  };
}

function normalizeLeaver(row: Record<string, unknown>): HrLeaverRow {
  return {
    id: String(row.id ?? row.employeeId ?? ''),
    employeeId: String(row.employeeId ?? ''),
    name: String(row.name ?? ''),
    department: String(row.department ?? ''),
    designation: String(row.designation ?? ''),
    leftDate: String(row.leftDate ?? ''),
  };
}

function normalizeBirthday(row: Record<string, unknown>): HrBirthdayRow {
  return {
    id: String(row.id ?? row.employeeId ?? ''),
    employeeId: String(row.employeeId ?? ''),
    name: String(row.name ?? ''),
    department: String(row.department ?? ''),
    birthDate: String(row.birthDate ?? ''),
  };
}

export function listHrDepartmentRows(rows: Record<string, unknown>[]): HrDepartmentRow[] {
  return rows.map(normalizeDepartment);
}

export function listHrJoinerRows(rows: Record<string, unknown>[]): HrJoinerRow[] {
  return rows.map(normalizeJoiner);
}

export function listHrLeaverRows(rows: Record<string, unknown>[]): HrLeaverRow[] {
  return rows.map(normalizeLeaver);
}

export function listHrBirthdayRows(rows: Record<string, unknown>[]): HrBirthdayRow[] {
  return rows.map(normalizeBirthday);
}

export function filterHrDepartments(rows: HrDepartmentRow[], filters: HrReportFilters): HrDepartmentRow[] {
  let data = [...rows];

  if (filters.search) {
    const q = filters.search.toLowerCase();
    data = data.filter((row) => row.department.toLowerCase().includes(q));
  }

  if (filters.department !== 'All') {
    data = data.filter((row) => row.department === filters.department);
  }

  return data;
}

export function filterHrJoiners(rows: HrJoinerRow[], filters: HrReportFilters): HrJoinerRow[] {
  let data = [...rows];

  if (filters.search) {
    const q = filters.search.toLowerCase();
    data = data.filter(
      (row) =>
        row.name.toLowerCase().includes(q) ||
        row.employeeId.toLowerCase().includes(q) ||
        row.department.toLowerCase().includes(q),
    );
  }

  if (filters.department !== 'All') {
    data = data.filter((row) => row.department === filters.department);
  }

  return data;
}

export function filterHrLeavers(rows: HrLeaverRow[], filters: HrReportFilters): HrLeaverRow[] {
  let data = [...rows];

  if (filters.search) {
    const q = filters.search.toLowerCase();
    data = data.filter(
      (row) =>
        row.name.toLowerCase().includes(q) ||
        row.employeeId.toLowerCase().includes(q) ||
        row.department.toLowerCase().includes(q),
    );
  }

  if (filters.department !== 'All') {
    data = data.filter((row) => row.department === filters.department);
  }

  return data;
}

export function filterHrBirthdays(rows: HrBirthdayRow[], filters: HrReportFilters): HrBirthdayRow[] {
  let data = [...rows];

  if (filters.search) {
    const q = filters.search.toLowerCase();
    data = data.filter(
      (row) =>
        row.name.toLowerCase().includes(q) ||
        row.employeeId.toLowerCase().includes(q) ||
        row.department.toLowerCase().includes(q),
    );
  }

  if (filters.department !== 'All') {
    data = data.filter((row) => row.department === filters.department);
  }

  return data;
}

export function sumDepartmentTotals(rows: HrDepartmentRow[]) {
  return rows.reduce(
    (acc, row) => ({
      total: acc.total + row.total,
      male: acc.male + row.male,
      female: acc.female + row.female,
      joined: acc.joined + row.joined,
      left: acc.left + row.left,
      netChange: acc.netChange + row.netChange,
    }),
    { total: 0, male: 0, female: 0, joined: 0, left: 0, netChange: 0 },
  );
}

export function buildHrKpis(rows: HrDepartmentRow[], trendSuffix: string): KpiCardItem[] {
  const totals = sumDepartmentTotals(rows);

  return [
    {
      key: 'headcount',
      label: 'Total Headcount',
      value: String(totals.total),
      sub: `▲ 25.00% ${trendSuffix}`,
      iconify: 'fluent-color:people-24',
    },
    {
      key: 'metrics',
      label: 'Metrics Tracked',
      value: '4',
      sub: `— 0% ${trendSuffix}`,
      iconify: 'fluent-color:data-trending-24',
    },
  ];
}

export function buildDepartmentBreakdown(rows: HrDepartmentRow[]): HrBreakdownSlice[] {
  const total = rows.reduce((s, r) => s + r.total, 0);
  return rows
    .map((row) => ({
      key: row.department,
      label: row.department,
      amount: row.total,
      pct: total > 0 ? (row.total / total) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

export function buildGenderBreakdown(rows: HrDepartmentRow[]): HrBreakdownSlice[] {
  const totals = sumDepartmentTotals(rows);
  const total = totals.male + totals.female;

  return [
    { key: 'Male', label: 'Male', amount: totals.male, pct: total > 0 ? (totals.male / total) * 100 : 0 },
    { key: 'Female', label: 'Female', amount: totals.female, pct: total > 0 ? (totals.female / total) * 100 : 0 },
  ].filter((s) => s.amount > 0);
}

export function getKeyMetrics(): HrKeyMetricsSnapshot {
  return KEY_METRICS_DEMO;
}

export function getJoinersLeaversTrend(): HrJoinersLeaversPoint[] {
  return JOINERS_LEAVERS_TREND;
}

export function uniqueDepartments(rows: HrDepartmentRow[]): string[] {
  return [...new Set(rows.map((r) => r.department))].sort();
}

export function formatFilterSummary(filters: HrReportFilters): string {
  const parts: string[] = [];
  if (filters.dateStart || filters.dateEnd) {
    parts.push(`${filters.dateStart || '…'} – ${filters.dateEnd || '…'}`);
  }
  if (filters.department !== 'All') parts.push(filters.department);
  return parts.length ? parts.join(' · ') : 'All records';
}

export function formatReportingPeriod(filters: HrReportFilters): string {
  if (filters.dateStart && filters.dateEnd) {
    const fmt = (d: string) => {
      const date = new Date(`${d}T00:00:00`);
      return date.toLocaleDateString('en-GB');
    };
    return `${fmt(filters.dateStart)} - ${fmt(filters.dateEnd)}`;
  }
  return '01/06/2026 - 30/06/2026';
}

export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '—';
  const date = new Date(`${dateStr}T00:00:00`);
  return date.toLocaleDateString('en-GB');
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
