'use client';

import { useCallback, useEffect, useState } from 'react';
import type { CustomerFormPayload } from '@/components/modules/crm/CustomerForm';
import { isCustomersApiMode } from '@/lib/config/data-source';
import {
  createCustomerViaApi,
  deleteCustomerViaApi,
  fetchCustomersFromApi,
  updateCustomerViaApi,
} from '@/lib/services/customers-api-service';

export function useCustomersApiStore() {
  const enabled = isCustomersApiMode();
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCustomersFromApi();
      setRows(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (enabled) void reload();
  }, [enabled, reload]);

  const create = useCallback(async (payload: CustomerFormPayload) => {
    const result = await createCustomerViaApi(payload);
    if (result.ok) await reload();
    return result;
  }, [reload]);

  const update = useCallback(async (id: string, payload: CustomerFormPayload) => {
    const result = await updateCustomerViaApi(id, payload);
    if (result.ok) await reload();
    return result;
  }, [reload]);

  const remove = useCallback(async (id: string) => {
    const result = await deleteCustomerViaApi(id);
    if (result.ok) await reload();
    return result;
  }, [reload]);

  return {
    enabled,
    rows,
    loading,
    error,
    reload,
    create,
    update,
    remove,
  };
}
