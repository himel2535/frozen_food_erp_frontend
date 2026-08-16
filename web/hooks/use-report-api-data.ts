'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  fetchReportData,
  isHrReportPayload,
  type HrReportPayload,
  type ReportListPayload,
  type ReportType,
} from '@/lib/services/report-api-service';
import { useReportInitialData } from '@/components/providers/ReportInitialDataProvider';
import { onApiMutation } from '@/lib/services/api-sync-events';

type ReportHookResult<T> = {
  rows: T;
  loading: boolean;
  initialized: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

function useReportPayload(type: ReportType) {
  const serverSeed = useReportInitialData(type);
  const hasSeed = Boolean(serverSeed);
  const [payload, setPayload] = useState(serverSeed ?? null);
  const [loading, setLoading] = useState(!hasSeed);
  const [initialized, setInitialized] = useState(hasSeed);
  const [error, setError] = useState<string | null>(null);
  const genRef = useRef(0);

  const reload = useCallback(async () => {
    const gen = ++genRef.current;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchReportData(type);
      if (gen !== genRef.current) return;
      setPayload(data);
    } catch (err) {
      if (gen !== genRef.current) return;
      setError(err instanceof Error ? err.message : 'Failed to load report');
    } finally {
      if (gen === genRef.current) {
        setLoading(false);
        setInitialized(true);
      }
    }
  }, [type]);

  useEffect(() => {
    if (hasSeed) return;
    void reload();
  }, [hasSeed, reload]);

  return { payload, loading, initialized, error, reload };
}

export function useSalesReportApiRows(): ReportHookResult<Record<string, unknown>[]> {
  const { payload, loading, initialized, error, reload } = useReportPayload('sales');
  const rows = !payload || isHrReportPayload(payload) ? [] : (payload as ReportListPayload).rows;
  return { rows, loading, initialized, error, reload };
}

export function useProductSalesReportApiRows(): ReportHookResult<Record<string, unknown>[]> {
  const { payload, loading, initialized, error, reload } = useReportPayload('product-sales');
  const rows = !payload || isHrReportPayload(payload) ? [] : (payload as ReportListPayload).rows;

  useEffect(() => {
    return onApiMutation((modules) => {
      if (modules?.includes('invoices') || modules?.includes('salesOrders')) {
        void reload();
      }
    });
  }, [reload]);

  return { rows, loading, initialized, error, reload };
}

export function usePurchaseReportApiRows(): ReportHookResult<Record<string, unknown>[]> {
  const { payload, loading, initialized, error, reload } = useReportPayload('purchases');
  const rows = !payload || isHrReportPayload(payload) ? [] : (payload as ReportListPayload).rows;
  return { rows, loading, initialized, error, reload };
}

export function useInventoryReportApiRows(): ReportHookResult<Record<string, unknown>[]> {
  const { payload, loading, initialized, error, reload } = useReportPayload('inventory');
  const rows = !payload || isHrReportPayload(payload) ? [] : (payload as ReportListPayload).rows;
  return { rows, loading, initialized, error, reload };
}

export function useCustomerReportApiRows(): ReportHookResult<Record<string, unknown>[]> {
  const { payload, loading, initialized, error, reload } = useReportPayload('customers');
  const rows = !payload || isHrReportPayload(payload) ? [] : (payload as ReportListPayload).rows;
  return { rows, loading, initialized, error, reload };
}

export function useSupplierReportApiRows(): ReportHookResult<Record<string, unknown>[]> {
  const { payload, loading, initialized, error, reload } = useReportPayload('suppliers');
  const rows = !payload || isHrReportPayload(payload) ? [] : (payload as ReportListPayload).rows;
  return { rows, loading, initialized, error, reload };
}

export function useFinancialReportApiRows(): ReportHookResult<Record<string, unknown>[]> {
  const { payload, loading, initialized, error, reload } = useReportPayload('financial');
  const rows = !payload || isHrReportPayload(payload) ? [] : (payload as ReportListPayload).rows;
  return { rows, loading, initialized, error, reload };
}

export function useHrReportApiRows(): ReportHookResult<{
  departments: Record<string, unknown>[];
  joiners: Record<string, unknown>[];
  leavers: Record<string, unknown>[];
  birthdays: Record<string, unknown>[];
}> {
  const { payload, loading, initialized, error, reload } = useReportPayload('hr');
  const empty = { departments: [], joiners: [], leavers: [], birthdays: [] };
  const rows = payload && isHrReportPayload(payload)
    ? (payload as HrReportPayload)
    : empty;
  return { rows, loading, initialized, error, reload };
}
