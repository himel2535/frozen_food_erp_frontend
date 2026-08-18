'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  fetchBalanceSheetSummary,
  fetchProfitLossSummary,
  fetchSalarySheetSummary,
  fetchTrialBalanceSummary,
  peekBalanceSheetSummary,
  peekProfitLossSummary,
  peekSalarySheetSummary,
  peekTrialBalanceSummary,
  type SalarySheetSummary,
} from '@/lib/services/accounting-api-service';
import type { BalanceSheetMetrics } from '@/lib/services/balance-sheet-service';
import type { ProfitLossMetrics } from '@/lib/services/profit-loss-service';
import type { TrialBalanceMetrics } from '@/lib/services/trial-balance-service';

type SummaryHookResult<T> = {
  summary: T | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

function useSummaryFetch<T>(
  fetcher: () => Promise<T | null>,
  peek: () => T | null,
  deps: unknown[] = [],
): SummaryHookResult<T> {
  const [summary, setSummary] = useState<T | null>(() => peek());
  const [loading, setLoading] = useState(() => !peek());
  const [initialized, setInitialized] = useState(() => Boolean(peek()));
  const [error, setError] = useState<string | null>(null);
  const genRef = useRef(0);

  const reload = useCallback(async () => {
    const gen = ++genRef.current;
    setLoading(true);
    setError(null);
    try {
      const data = await fetcher();
      if (gen !== genRef.current) return;
      setSummary(data);
    } catch (err) {
      if (gen !== genRef.current) return;
      setError(err instanceof Error ? err.message : 'Failed to load summary');
    } finally {
      if (gen === genRef.current) {
        setLoading(false);
        setInitialized(true);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    const cached = peek();
    if (cached) {
      setSummary(cached);
      setInitialized(true);
      setLoading(false);
      return;
    }
    void reload();
  }, [reload, peek]);

  return { summary, loading, initialized, error, reload };
}

export function useBalanceSheetSummary(enabled: boolean) {
  const base = useSummaryFetch(fetchBalanceSheetSummary, peekBalanceSheetSummary, []);
  if (!enabled) {
    return { summary: null, loading: false, initialized: true, error: null, reload: async () => {} };
  }
  return base;
}

export function useProfitLossSummary(enabled: boolean) {
  const base = useSummaryFetch(fetchProfitLossSummary, peekProfitLossSummary, []);
  if (!enabled) {
    return { summary: null, loading: false, initialized: true, error: null, reload: async () => {} };
  }
  return base;
}

export function useTrialBalanceSummary(enabled: boolean) {
  const base = useSummaryFetch(fetchTrialBalanceSummary, peekTrialBalanceSummary, []);
  if (!enabled) {
    return { summary: null, loading: false, initialized: true, error: null, reload: async () => {} };
  }
  return base;
}

export function useSalarySheetSummary(enabled: boolean, period?: string) {
  const base = useSummaryFetch<SalarySheetSummary>(
    () => fetchSalarySheetSummary(period),
    () => peekSalarySheetSummary(period),
    [period],
  );
  if (!enabled) {
    return { summary: null, loading: false, initialized: true, error: null, reload: async () => {} };
  }
  return base;
}

export type { BalanceSheetMetrics, ProfitLossMetrics, TrialBalanceMetrics, SalarySheetSummary };
