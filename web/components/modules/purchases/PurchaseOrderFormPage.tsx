'use client';

import { toast } from '@/lib/ui/feedback';

import { useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useChromeSuppressed } from '@/components/layout/ModuleActionsContext';
import { PurchaseOrderForm, type PoSaveAction } from '@/components/modules/purchases/purchase-order-form/PurchaseOrderForm';
import type { PoFormPayload } from '@/components/modules/purchases/purchase-order-form/po-form-types';
import {
  EMPTY_PO_FORM,
  payloadToRecord,
  recordToPoFormValues,
} from '@/components/modules/purchases/purchase-order-form/po-form-types';
import { usePurchaseOrderFormApi } from '@/hooks/use-purchase-order-api';
import { isModuleApiMode, API_RESOURCE_PATHS } from '@/lib/config/data-source';
import { attachBackgroundImageLater } from '@/lib/services/background-image-attach';
import { patchResourceAttachment } from '@/lib/services/resource-image-patch';
import type { PendingImageUpload } from '@/components/shared/ImageUploadField';
import { useAppStore } from '@/lib/state/app-store';
import {
  buildPurchaseOrderApproval,
  syncPurchaseOrderApproval,
  upsertApprovalInState,
} from '@/lib/services/approvals-service';
import {
  createPurchaseOrder,
  getPurchaserOptions,
  listPurchases,
  listSuppliers,
  previewPurchaseOrderId,
  updatePurchaseOrder,
} from '@/lib/services/purchases-service';

export function PurchaseOrderFormPage({ mode, orderId }: { mode: 'create' | 'edit'; orderId?: string }) {
  const router = useRouter();
  const apiMode = isModuleApiMode('purchaseOrders');
  const poApi = usePurchaseOrderFormApi();
  const appState = useAppStore((s) => s.appState);
  const saveAppState = useAppStore((s) => s.saveAppState);
  const submittedRef = useRef(false);

  useChromeSuppressed(true);

  const suppliers = useMemo(
    () => (apiMode ? poApi.suppliers : listSuppliers(appState).map((s) => ({ id: String(s.id), name: String(s.name) }))),
    [apiMode, poApi.suppliers, appState],
  );
  const purchasers = useMemo(
    () => (apiMode ? poApi.purchasers : getPurchaserOptions(appState)),
    [apiMode, poApi.purchasers, appState],
  );

  const existing = useMemo(() => {
    if (!orderId) return null;
    if (apiMode) return poApi.findOrder(orderId);
    return listPurchases(appState).find((r) => String(r.id) === orderId) ?? null;
  }, [apiMode, poApi, appState, orderId]);

  const initialValues = useMemo(() => {
    if (existing) return recordToPoFormValues(existing);
    return { ...EMPTY_PO_FORM, items: EMPTY_PO_FORM.items };
  }, [existing]);

  const poPreviewId = orderId ?? previewPurchaseOrderId(appState);

  if (mode === 'edit' && orderId && !existing && (apiMode ? poApi.initialized : true)) {
    return (
      <div className="p-8 text-center text-sm text-slate-500">
        Purchase order not found.{' '}
        <button type="button" onClick={() => router.push('/purchases/orders')} className="text-blue-600 font-bold cursor-pointer">
          Back to list
        </button>
      </div>
    );
  }

  const handleSave = async (
    payload: PoFormPayload,
    action: PoSaveAction,
    pendingImageUpload?: Promise<PendingImageUpload | null> | null,
  ): Promise<boolean> => {
    if (submittedRef.current) return true;
    submittedRef.current = true;
    try {
      const userVisiblePoId = orderId ?? payload.id ?? payload.poPreviewId;
      const record = {
        ...payloadToRecord({
          ...payload,
          id: userVisiblePoId,
          status: action === 'create' && payload.status === 'Draft' ? 'Sent' : payload.status,
        }),
        legacyId: userVisiblePoId,
      };
      if (apiMode) {
        const result = await poApi.saveOrder(orderId, record);
        if (!result.ok) {
          submittedRef.current = false;
          toast.error('Operation failed', { module: 'Purchases', description: 'error' in result ? String(result.error) : 'Save failed' });
          return false;
        }
        const recordId = orderId || ('id' in result ? String(result.id) : '');
        if (recordId && pendingImageUpload) {
          attachBackgroundImageLater({
            recordId,
            savedImageUrl: String(record.attachmentUrl ?? ''),
            pending: pendingImageUpload,
            patchImage: (id, url, pid) => patchResourceAttachment(API_RESOURCE_PATHS.purchaseOrders, id, url, pid),
            moduleName: 'Purchase Orders',
          });
        }
        await syncPurchaseOrderApproval(record);
        router.push('/purchases/orders');
        return true;
      }
      const result = mode === 'edit' && orderId
        ? updatePurchaseOrder(appState, orderId, record)
        : createPurchaseOrder(appState, record);
      if (!result.ok) {
        submittedRef.current = false;
        toast.error('Operation failed', { module: 'Purchases', description: 'error' in result ? String(result.error) : 'Save failed' });
        return false;
      }
      upsertApprovalInState(appState, buildPurchaseOrderApproval(record));
      saveAppState();
      router.push('/purchases/orders');
      return true;
    } catch (err) {
      submittedRef.current = false;
      toast.error('Operation failed', {
        module: 'Purchases',
        description: err instanceof Error ? err.message : 'Save failed',
      });
      return false;
    }
  };

  return (
    <PurchaseOrderForm
      mode={mode}
      initialValues={initialValues}
      poPreviewId={poPreviewId}
      appState={appState}
      suppliers={suppliers}
      purchasers={purchasers}
      onCancel={() => router.push('/purchases/orders')}
      onSave={handleSave}
    />
  );
}
