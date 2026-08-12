import { apiRequest } from '@/lib/services/api-client';
import type { BalanceSheetMetrics } from '@/lib/services/balance-sheet-service';
import type { ProfitLossMetrics } from '@/lib/services/profit-loss-service';
import type { TrialBalanceMetrics } from '@/lib/services/trial-balance-service';

export type SalarySheetSummary = {
  employeeCount: number;
  entryCount: number;
  presentDays: number;
  absentDays: number;
  otHours: number;
  netPayable: number;
  period: string | null;
};

export async function fetchBalanceSheetSummary(): Promise<BalanceSheetMetrics | null> {
  try {
    const { data } = await apiRequest<BalanceSheetMetrics>('/balance-sheet/summary');
    return data ?? null;
  } catch {
    return null;
  }
}

export async function fetchProfitLossSummary(): Promise<(ProfitLossMetrics & { lineCount?: number }) | null> {
  try {
    const { data } = await apiRequest<ProfitLossMetrics & { lineCount?: number }>('/profit-loss/summary');
    return data ?? null;
  } catch {
    return null;
  }
}

export async function fetchTrialBalanceSummary(): Promise<(TrialBalanceMetrics & { lineCount?: number }) | null> {
  try {
    const { data } = await apiRequest<TrialBalanceMetrics & { lineCount?: number }>('/trial-balance/summary');
    return data ?? null;
  } catch {
    return null;
  }
}

export async function fetchSalarySheetSummary(period?: string): Promise<SalarySheetSummary | null> {
  try {
    const qs = period ? `?period=${encodeURIComponent(period)}` : '';
    const { data } = await apiRequest<SalarySheetSummary>(`/salary-sheet/summary${qs}`);
    return data ?? null;
  } catch {
    return null;
  }
}
