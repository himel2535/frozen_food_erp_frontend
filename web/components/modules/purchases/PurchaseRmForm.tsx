'use client';

import { useMemo, useRef, useState, type FormEvent } from 'react';
import {
  Building2,
  Calendar,
  FileText,
  Save,
  ShoppingCart,
  Warehouse,
} from 'lucide-react';
import { FormHeader } from '@/components/layout/FormHeader';
import { MODULE_LIST_SHELL } from '@/lib/ui/module-layout';
import { FormSectionCard } from '@/components/modules/crm/customer-form/FormSectionCard';
import { IconInput, IconSelect, IconTextarea } from '@/components/modules/crm/customer-form/IconField';
import {
  CF_BTN_GHOST,
  CF_BTN_OUTLINE,
  CF_BTN_PRIMARY,
  CF_FOOTER_CLS,
} from '@/components/modules/crm/customer-form/customer-form-styles';
import { PurchaseRmProductsTable } from '@/components/modules/purchases/purchase-rm-form/PurchaseRmProductsTable';
import { PurchaseRmOrderSummary } from '@/components/modules/purchases/purchase-rm-form/PurchaseRmOrderSummary';
import { SupplierInfoCard } from '@/components/modules/purchases/purchase-rm-form/SupplierInfoCard';
import {
  EMPTY_PURCHASE_RM_FORM,
  summarizePurchaseRmItems,
  type PurchaseRmFormValues,
  type PurchaseRmPayload,
} from '@/components/modules/purchases/purchase-rm-form/prm-form-types';
import { PRM_ORDER_BADGE_CLS } from '@/components/modules/purchases/purchase-rm-form/prm-form-styles';
import type { AppState } from '@/lib/state/types';
import { getSupplierProfile, listRmProductOptions } from '@/lib/services/purchase-rm-service';

export type PurchaseRmSaveAction = 'draft' | 'complete';

export { EMPTY_PURCHASE_RM_FORM, type PurchaseRmFormValues, type PurchaseRmPayload };

const RM_FIELD_GRID_CLS = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-3 gap-y-3';

export function PurchaseRmForm({
  mode,
  initialValues,
  poPreviewId,
  appState,
  suppliers,
  warehouses,
  onCancel,
  onSave,
}: {
  mode: 'create' | 'edit';
  initialValues: PurchaseRmFormValues;
  poPreviewId: string;
  appState: AppState;
  suppliers: Array<{ id: string; name: string }>;
  warehouses: Array<{ id: string; name: string }>;
  onCancel: () => void;
  onSave: (payload: PurchaseRmPayload, action: PurchaseRmSaveAction) => void;
}) {
  const [form, setForm] = useState<PurchaseRmFormValues>(initialValues);
  const saveActionRef = useRef<PurchaseRmSaveAction>('draft');
  const formRef = useRef<HTMLFormElement>(null);

  const productOptions = useMemo(() => listRmProductOptions(appState), [appState]);
  const supplierProfile = useMemo(
    () => (form.supplierId ? getSupplierProfile(appState, form.supplierId) : null),
    [appState, form.supplierId],
  );
  const totals = useMemo(
    () => summarizePurchaseRmItems(form.items, { vatPct: form.vatPct, aitPct: form.aitPct, otherCharges: form.otherCharges }),
    [form.items, form.vatPct, form.aitPct, form.otherCharges],
  );

  const updateForm = (patch: Partial<PurchaseRmFormValues>) => setForm((prev) => ({ ...prev, ...patch }));

  const toPayload = (status: string): PurchaseRmPayload => ({
    ...form,
    status,
    supplierName: suppliers.find((s) => s.id === form.supplierId)?.name ?? form.supplierName,
    warehouseName: warehouses.find((w) => w.id === form.warehouseId)?.name ?? form.warehouseName,
    totals,
    createdBy: 'Sarah Connor',
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.supplierId) {
      window.alert('Please select a supplier.');
      return;
    }
    if (!form.warehouseId) {
      window.alert('Please select a warehouse.');
      return;
    }
    if (!form.items.some((i) => i.productName.trim() && i.qty > 0)) {
      window.alert('Add at least one product with quantity.');
      return;
    }
    const action = saveActionRef.current;
    saveActionRef.current = 'draft';
    const status = action === 'complete' ? 'pending_approval' : 'draft';
    onSave(toPayload(status), action);
  };

  return (
    <div className={MODULE_LIST_SHELL}>
      <form ref={formRef} onSubmit={handleSubmit} noValidate className="w-full flex flex-col min-h-full pb-4">
        <div className="pt-3 md:pt-4 mb-3">
          <FormHeader
            compact
            title={mode === 'edit' ? 'Edit RM Order' : 'Create RM Order'}
            subtitle="Select supplier and add raw materials to create an RM order."
            onBack={onCancel}
          />
        </div>

        <div className="flex flex-col gap-4 flex-1">
          <FormSectionCard number={1} title="Order Details" subtitle="Basic order information and delivery schedule">
            <div className="mb-3">
              <span className={PRM_ORDER_BADGE_CLS}>RM Order #: {poPreviewId}</span>
            </div>
            <div className={RM_FIELD_GRID_CLS}>
              <IconInput
                label="Purchase Date"
                icon={Calendar}
                type="date"
                value={form.date}
                onChange={(e) => updateForm({ date: e.target.value })}
              />
              <IconInput
                label="Expected Delivery"
                icon={Calendar}
                type="date"
                value={form.expectedDelivery}
                onChange={(e) => updateForm({ expectedDelivery: e.target.value })}
              />
              <IconSelect
                label="Supplier"
                icon={Building2}
                value={form.supplierId}
                onChange={(e) => updateForm({
                  supplierId: e.target.value,
                  supplierName: suppliers.find((s) => s.id === e.target.value)?.name ?? '',
                })}
              >
                <option value="">Select supplier...</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </IconSelect>
              <IconSelect
                label="Warehouse"
                icon={Warehouse}
                value={form.warehouseId}
                onChange={(e) => updateForm({
                  warehouseId: e.target.value,
                  warehouseName: warehouses.find((w) => w.id === e.target.value)?.name ?? '',
                })}
              >
                <option value="">Select warehouse...</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </IconSelect>
            </div>
          </FormSectionCard>

          <FormSectionCard number={2} title="Supplier Information" subtitle="Profile, credit, and delivery performance">
            <SupplierInfoCard profile={supplierProfile} />
          </FormSectionCard>

          <FormSectionCard number={3} title="Products" subtitle="Add raw materials and configure quantities">
            <PurchaseRmProductsTable
              items={form.items}
              productOptions={productOptions}
              onChange={(items) => updateForm({ items })}
            />
          </FormSectionCard>

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4 items-start">
            <FormSectionCard number={4} title="Notes" subtitle="Special instructions for this RM order">
              <IconTextarea
                label="Order Notes"
                icon={FileText}
                rows={5}
                value={form.notes}
                onChange={(e) => updateForm({ notes: e.target.value })}
                placeholder="Write any notes or special instructions..."
              />
            </FormSectionCard>
            <PurchaseRmOrderSummary totals={totals} />
          </div>
        </div>

        <div className={CF_FOOTER_CLS}>
          <button type="button" onClick={onCancel} className={CF_BTN_GHOST}>
            Cancel
          </button>
          <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
            <button
              type="button"
              onClick={() => { saveActionRef.current = 'draft'; formRef.current?.requestSubmit(); }}
              className={CF_BTN_OUTLINE}
            >
              <Save className="w-4 h-4" />
              Save Draft
            </button>
            <button
              type="button"
              onClick={() => { saveActionRef.current = 'complete'; formRef.current?.requestSubmit(); }}
              className={CF_BTN_PRIMARY}
            >
              <ShoppingCart className="w-4 h-4" />
              Complete RM Order
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
