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

/** Aligned with backend REPORT_CACHE_MS (60s). */
export const ACCOUNTING_SUMMARY_TTL_MS = 60_000;

type SummaryCacheEntry<T> = { data: T; at: number };

const summaryCache = new Map<string, SummaryCacheEntry<unknown>>();
const summaryInflight = new Map<string, Promise<unknown>>();

function peekCachedSummary<T>(key: string): T | null {
  const hit = summaryCache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > ACCOUNTING_SUMMARY_TTL_MS) {
    summaryCache.delete(key);
    return null;
  }
  return hit.data as T;
}

async function fetchCachedSummary<T>(key: string, fetcher: () => Promise<T | null>): Promise<T | null> {
  const cached = peekCachedSummary<T>(key);
  if (cached) return cached;

  const pending = summaryInflight.get(key);
  if (pending) return pending as Promise<T | null>;

  const req = (async () => {
    try {
      const data = await fetcher();
      if (data) summaryCache.set(key, { data, at: Date.now() });
      return data;
    } catch {
      return null;
    } finally {
      summaryInflight.delete(key);
    }
  })();

  summaryInflight.set(key, req);
  return req as Promise<T | null>;
}

export function peekBalanceSheetSummary(): BalanceSheetMetrics | null {
  return peekCachedSummary<BalanceSheetMetrics>('balance-sheet/summary');
}

export function peekProfitLossSummary(): (ProfitLossMetrics & { lineCount?: number }) | null {
  return peekCachedSummary('profit-loss/summary');
}

export function peekTrialBalanceSummary(): (TrialBalanceMetrics & { lineCount?: number }) | null {
  return peekCachedSummary('trial-balance/summary');
}

export function peekSalarySheetSummary(period?: string): SalarySheetSummary | null {
  const key = period ? `salary-sheet/summary?period=${period}` : 'salary-sheet/summary';
  return peekCachedSummary<SalarySheetSummary>(key);
}

export function invalidateAccountingSummaryCache() {
  summaryCache.clear();
  summaryInflight.clear();
}

export async function fetchBalanceSheetSummary(): Promise<BalanceSheetMetrics | null> {
  return fetchCachedSummary('balance-sheet/summary', async () => {
    const { data } = await apiRequest<BalanceSheetMetrics>('/balance-sheet/summary');
    return data ?? null;
  });
}

export async function fetchProfitLossSummary(): Promise<(ProfitLossMetrics & { lineCount?: number }) | null> {
  return fetchCachedSummary('profit-loss/summary', async () => {
    const { data } = await apiRequest<ProfitLossMetrics & { lineCount?: number }>('/profit-loss/summary');
    return data ?? null;
  });
}

export async function fetchTrialBalanceSummary(): Promise<(TrialBalanceMetrics & { lineCount?: number }) | null> {
  return fetchCachedSummary('trial-balance/summary', async () => {
    const { data } = await apiRequest<TrialBalanceMetrics & { lineCount?: number }>('/trial-balance/summary');
    return data ?? null;
  });
}

export async function fetchSalarySheetSummary(period?: string): Promise<SalarySheetSummary | null> {
  const key = period ? `salary-sheet/summary?period=${period}` : 'salary-sheet/summary';
  return fetchCachedSummary(key, async () => {
    const qs = period ? `?period=${encodeURIComponent(period)}` : '';
    const { data } = await apiRequest<SalarySheetSummary>(`/salary-sheet/summary${qs}`);
    return data ?? null;
  });
}
