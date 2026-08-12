'use client';

import { useCallback, useEffect, useState } from 'react';
import type { CustomerFormPayload } from '@/components/modules/crm/CustomerForm';
import { isCustomersApiMode } from '@/lib/config/data-source';
import {
  createCustomerViaApi,
  deleteCustomerViaApi,
  mapApiCustomerToListRow,
  updateCustomerViaApi,
  type ApiCustomerDoc,
} from '@/lib/services/customers-api-service';
import {
  fetchResourceList,
  isCachedResourceList,
  readCachedResourceList,
} from '@/lib/services/api-resource-service';

const CUSTOMERS_PATH = '/customers';

function mapCachedCustomers(): Record<string, unknown>[] {
  const docs = readCachedResourceList(CUSTOMERS_PATH);
  return docs ? docs.map((doc) => mapApiCustomerToListRow(doc as ApiCustomerDoc)) : [];
}

export function useCustomersApiStore() {
  const enabled = isCustomersApiMode();
  const [rows, setRows] = useState<Record<string, unknown>[]>(() => (enabled ? mapCachedCustomers() : []));
  const [loading, setLoading] = useState(() => enabled && !isCachedResourceList(CUSTOMERS_PATH));
  const [initialized, setInitialized] = useState(() => !enabled || isCachedResourceList(CUSTOMERS_PATH));
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async (opts?: { silent?: boolean }) => {
    if (!enabled) return;
    if (!opts?.silent) setLoading(true);
    setError(null);
    try {
      const docs = await fetchResourceList(CUSTOMERS_PATH);
      setRows(docs.map((doc) => mapApiCustomerToListRow(doc as ApiCustomerDoc)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load customers');
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const hasCache = isCachedResourceList(CUSTOMERS_PATH);
    void reload(hasCache ? { silent: true } : undefined);
  }, [enabled, reload]);

  const create = useCallback(async (payload: CustomerFormPayload) => {
    const result = await createCustomerViaApi(payload);
    if (result.ok) await reload({ silent: true });
    return result;
  }, [reload]);

  const update = useCallback(async (id: string, payload: CustomerFormPayload) => {
    const result = await updateCustomerViaApi(id, payload);
    if (result.ok) await reload({ silent: true });
    return result;
  }, [reload]);

  const remove = useCallback(async (id: string) => {
    const result = await deleteCustomerViaApi(id);
    if (result.ok) await reload({ silent: true });
    return result;
  }, [reload]);

  return {
    enabled,
    rows,
    loading,
    initialized,
    error,
    reload,
    create,
    update,
    remove,
  };
}
