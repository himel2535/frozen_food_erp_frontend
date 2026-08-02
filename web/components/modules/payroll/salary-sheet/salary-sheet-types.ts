export type {
  SalarySheetEntry,
  SalarySheetStatus,
  ComputedSheetRow,
} from '@/lib/services/salary-sheet-service';

export type SheetFilterState = {
  period: string;
  department: string;
  designation: string;
  search: string;
};

export type SheetRowView = {
  entry: Record<string, unknown>;
  employee: Record<string, unknown>;
  structure: Record<string, unknown>;
  computed: import('@/lib/services/salary-sheet-service').ComputedSheetRow;
};

export function defaultPeriod() {
  return '2026-08';
}

export function buildReviewUrl(employeeId: string, filters: SheetFilterState) {
  const params = new URLSearchParams({
    period: filters.period,
    dept: filters.department,
    designation: filters.designation,
    q: filters.search,
  });
  return `/payroll/salary-sheet/${employeeId}/review?${params.toString()}`;
}
