'use client';

import { toast } from '@/lib/ui/feedback';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { SalesOrderForm, type SoSaveAction } from '@/components/modules/sales/sales-order-form/SalesOrderForm';
import type { SoFormPayload } from '@/components/modules/sales/sales-order-form/so-form-types';
import {
  EMPTY_SO_FORM,
  payloadToRecord,
  recordToSoFormValues,
} from '@/components/modules/sales/sales-order-form/so-form-types';
import { useAppStore } from '@/lib/state/app-store';
import { getCustomerList } from '@/lib/services/crm-service';
import {
  createSalesOrder,
  getSalesPersonOptions,
  listSalesOrders,
  previewSalesOrderId,
  updateSalesOrder,
} from '@/lib/services/sales-service';

export function SalesOrderFormPage({ mode, orderId }: { mode: 'create' | 'edit'; orderId?: string }) {
  const router = useRouter();
  const appState = useAppStore((s) => s.appState);
  const saveAppState = useAppStore((s) => s.saveAppState);

  const customers = useMemo(
    () => getCustomerList(appState).map((c) => ({
      id: String(c.id),
      name: String(c.name ?? ''),
      company: String(c.company ?? ''),
    })),
    [appState],
  );
  const salesPersons = useMemo(() => getSalesPersonOptions(appState), [appState]);

  const existing = useMemo(() => {
    if (!orderId) return null;
    return listSalesOrders(appState).find((r) => String(r.id) === orderId) ?? null;
  }, [appState, orderId]);

  const initialValues = useMemo(() => {
    if (existing) return recordToSoFormValues(existing);
    return { ...EMPTY_SO_FORM, items: EMPTY_SO_FORM.items };
  }, [existing]);

  const orderPreviewId = orderId ?? previewSalesOrderId(appState);

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

  const handleSave = (payload: SoFormPayload, action: SoSaveAction) => {
    const record = payloadToRecord({
      ...payload,
      id: orderId ?? payload.id ?? payload.orderPreviewId,
      status: action === 'create' && payload.status === 'draft' ? 'confirmed' : payload.status,
    });
    const result = mode === 'edit' && orderId
      ? updateSalesOrder(appState, orderId, record)
      : createSalesOrder(appState, record);
    if (!result.ok) {
      toast.error('Operation failed', { module: 'Sales', description: 'error' in result ? String(result.error) : 'Save failed' });
      return;
    }
    saveAppState();
    router.push('/sales/orders');
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
