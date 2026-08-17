'use client';

import { toast } from '@/lib/ui/feedback';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SalesOrderForm, type SoSaveAction } from '@/components/modules/sales/sales-order-form/SalesOrderForm';
import type { SoFormPayload } from '@/components/modules/sales/sales-order-form/so-form-types';
import {
  EMPTY_SO_FORM,
  payloadToRecord,
  recordToSoFormValues,
} from '@/components/modules/sales/sales-order-form/so-form-types';
import { useAppStore } from '@/lib/state/app-store';
import { isModuleApiMode } from '@/lib/config/data-source';
import { useApiResourceStore } from '@/hooks/use-api-resource-store';
import { useCustomersOptions, useSalesPersonOptions } from '@/hooks/use-form-options';
import {
  createSalesOrder,
  listSalesOrders,
  previewSalesOrderId,
  updateSalesOrder,
} from '@/lib/services/sales-service';
import {
  mapApiSalesOrderRow,
  mapSalesOrderRecordToApi,
  resolveApiRowId,
} from '@/lib/services/entity-api-mappers';
import { fetchResourceById } from '@/lib/services/api-resource-service';
import { attachBackgroundImageLater } from '@/lib/services/background-image-attach';
import { patchOrderAttachment } from '@/lib/services/sales-orders-api-service';
import type { PendingImageUpload } from '@/components/shared/ImageUploadField';
import { API_RESOURCE_PATHS } from '@/lib/config/data-source';

export function SalesOrderFormPage({ mode, orderId }: { mode: 'create' | 'edit'; orderId?: string }) {
  const router = useRouter();
  const appState = useAppStore((s) => s.appState);
  const saveAppState = useAppStore((s) => s.saveAppState);
  const apiMode = isModuleApiMode('salesOrders');
  const apiStore = useApiResourceStore('salesOrders', mapApiSalesOrderRow);
  const customers = useCustomersOptions();
  const salesPersons = useSalesPersonOptions();
  const [apiOrder, setApiOrder] = useState<Record<string, unknown> | null>(null);
  const [apiLoading, setApiLoading] = useState(apiMode && mode === 'edit' && Boolean(orderId));
  const submittedRef = useRef(false);

  useEffect(() => {
    if (!apiMode || mode !== 'edit' || !orderId) return;
    setApiLoading(true);
    void fetchResourceById(API_RESOURCE_PATHS.salesOrders, orderId).then((doc) => {
      setApiOrder(doc ? mapApiSalesOrderRow(doc) : null);
      setApiLoading(false);
    });
  }, [apiMode, mode, orderId]);

  const existing = useMemo(() => {
    if (apiMode) return apiOrder;
    if (!orderId) return null;
    return listSalesOrders(appState).find((r) => String(r.id) === orderId) ?? null;
  }, [apiMode, apiOrder, appState, orderId]);

  const initialValues = useMemo(() => {
    if (existing) return recordToSoFormValues(existing);
    return { ...EMPTY_SO_FORM, items: EMPTY_SO_FORM.items };
  }, [existing]);

  const orderPreviewId = orderId ?? (apiMode ? `SO-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}` : previewSalesOrderId(appState));

  if (apiLoading) {
    return <div className="p-8 text-center text-sm text-slate-500">Loading sales order…</div>;
  }

  if (mode === 'edit' && orderId && !existing) {
    return (
      <div className="p-8 text-center text-sm text-slate-500">
        Sales order not found.{' '}
        <button type="button" onClick={() => router.push('/sales/orders')} className="text-blue-600 font-bold cursor-pointer">
          Back to list
        </button>
      </div>
    );
  }

  const handleSave = async (
    payload: SoFormPayload,
    action: SoSaveAction,
    pendingImageUpload?: Promise<PendingImageUpload | null> | null,
  ): Promise<boolean> => {
    if (submittedRef.current) return true;
    submittedRef.current = true;
    try {
      const record = payloadToRecord({
        ...payload,
        id: orderId ?? payload.id ?? payload.orderPreviewId,
        status: action === 'create' && payload.status === 'draft' ? 'confirmed' : payload.status,
      });

      if (apiMode) {
        const body = mapSalesOrderRecordToApi(record, mode === 'edit' ? orderId ?? undefined : undefined);
        const mongoId = existing ? resolveApiRowId(existing) : '';
        const result = mode === 'edit' && mongoId
          ? await apiStore.update(mongoId, body)
          : await apiStore.create(body);
        if (!result.ok) {
          submittedRef.current = false;
          toast.error('Operation failed', { module: 'Sales', description: 'error' in result ? String(result.error) : 'Save failed' });
          return false;
        }
        if (mode !== 'edit' && pendingImageUpload && result.ok && 'id' in result) {
          attachBackgroundImageLater({
            recordId: String(result.id),
            savedImageUrl: payload.attachmentUrl,
            pending: pendingImageUpload,
            patchImage: patchOrderAttachment,
            moduleName: 'Sales Order',
          });
        }
        router.push('/sales/orders');
        return true;
      }

      const result = mode === 'edit' && orderId
        ? updateSalesOrder(appState, orderId, record)
        : createSalesOrder(appState, record);
      if (!result.ok) {
        submittedRef.current = false;
        toast.error('Operation failed', { module: 'Sales', description: 'error' in result ? String(result.error) : 'Save failed' });
        return false;
      }
      saveAppState();
      router.push('/sales/orders');
      return true;
    } catch (err) {
      submittedRef.current = false;
      toast.error('Operation failed', {
        module: 'Sales',
        description: err instanceof Error ? err.message : 'Save failed',
      });
      return false;
    }
  };

  return (
    <SalesOrderForm
      mode={mode}
      initialValues={initialValues}
      orderPreviewId={orderPreviewId}
      appState={appState}
      customers={customers}
      salesPersons={salesPersons}
      onCancel={() => router.push('/sales/orders')}
      onSave={handleSave}
    />
  );
}
