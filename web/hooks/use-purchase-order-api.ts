'use client';

import { useMemo } from 'react';
import { useApiResourceStore } from '@/hooks/use-api-resource-store';
import { useApiAggregate } from '@/hooks/use-api-aggregate';
import { mapGenericApiRow, mapGenericPayloadToApi } from '@/lib/services/generic-api-mapper';
import { mapApiSupplierRow } from '@/lib/services/entity-api-mappers';
import { mapApiEmployeeRow } from '@/lib/services/entity-api-mappers';
import { isModuleApiMode } from '@/lib/config/data-source';

export function usePurchaseOrderFormApi() {
  const enabled = isModuleApiMode('purchaseOrders');
  const poStore = useApiResourceStore('purchaseOrders', mapGenericApiRow);
  const lookups = useApiAggregate(['suppliers', 'employees']);

  const suppliers = useMemo(
    () => (lookups.data.suppliers ?? []).map((d) => mapApiSupplierRow(d)).map((s) => ({
      id: String(s.id),
      name: String(s.name ?? s.id),
    })),
    [lookups.data.suppliers],
  );

  const purchasers = useMemo(
    () => (lookups.data.employees ?? []).map((d) => mapApiEmployeeRow(d)).map((e) => ({
      id: String(e.id),
      name: String(e.name ?? e.id),
    })),
    [lookups.data.employees],
  );

  const findOrder = (orderId: string) =>
    poStore.rows.find((r) => String(r.id) === orderId) ?? null;

  const saveOrder = async (orderId: string | undefined, body: Record<string, unknown>) => {
    const payload = mapGenericPayloadToApi(body);
    if (orderId) return poStore.update(orderId, payload);
    return poStore.create(payload);
  };

  return {
    enabled,
    loading: poStore.loading || lookups.loading,
    initialized: poStore.initialized && lookups.initialized,
    error: poStore.error ?? lookups.error,
    suppliers,
    purchasers,
    findOrder,
    saveOrder,
    reload: poStore.reload,
  };
}
