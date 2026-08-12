import { apiRequest } from '@/lib/services/api-client';
import { serverApiRequest } from '@/lib/server/api-fetch';

export type ReportType =
  | 'sales'
  | 'purchases'
  | 'inventory'
  | 'customers'
  | 'suppliers'
  | 'financial'
  | 'hr';

export type ReportListPayload = {
  rows: Record<string, unknown>[];
};

export type HrReportPayload = {
  departments: Record<string, unknown>[];
  joiners: Record<string, unknown>[];
  leavers: Record<string, unknown>[];
  birthdays: Record<string, unknown>[];
};

export type ReportPayload = ReportListPayload | HrReportPayload;

export async function fetchReportData(type: ReportType): Promise<ReportPayload | null> {
  try {
    const { data } = await apiRequest<ReportPayload>(`/reports/${type}`);
    return data ?? null;
  } catch {
    return null;
  }
}

export async function fetchServerReportData(
  type: ReportType,
  revalidateSeconds = 30,
): Promise<ReportPayload | null> {
  const result = await serverApiRequest<ReportPayload>(`/reports/${type}`, revalidateSeconds);
  return result?.data ?? null;
}

export function isHrReportPayload(payload: ReportPayload): payload is HrReportPayload {
  return 'departments' in payload && 'joiners' in payload;
}

export function reportListRows(payload: ReportPayload | null): Record<string, unknown>[] {
  if (!payload) return [];
  if (isHrReportPayload(payload)) return payload.departments;
  return payload.rows ?? [];
}
