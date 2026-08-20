'use client';

import { toast, promptAction } from '@/lib/ui/feedback';

import Link from 'next/link';
import { useMemo, useRef, useState, type FormEvent } from 'react';
import {
  Calendar,
  FileSpreadsheet,
  FileText,
  MapPin,
  Package,
  Plus,
  User,
} from 'lucide-react';
import { ImageUploadField, type PendingImageUpload } from '@/components/shared/ImageUploadField';
import { SubmitBusyLabel, useSubmitGuard } from '@/hooks/use-submit-guard';
import { Button } from '@/components/shared/Button';
import { FormHeader } from '@/components/layout/FormHeader';
import { MODULE_LIST_SHELL } from '@/lib/ui/module-layout';
import { IconInput, IconSelect, IconTextarea } from '@/components/modules/crm/customer-form/IconField';
import { DateInput } from '@/components/shared/DateInput';
import { PoSupplierSearch } from '@/components/modules/purchases/purchase-order-form/PoSupplierSearch';
import { PoItemsTable } from '@/components/modules/purchases/purchase-order-form/PoItemsTable';
import { PoOrderSummary } from '@/components/modules/purchases/purchase-order-form/PoOrderSummary';
import { PoPaymentInfo } from '@/components/modules/purchases/purchase-order-form/PoPaymentInfo';
import { PoSupplierDetailsCard } from '@/components/modules/purchases/purchase-order-form/PoSupplierDetailsCard';
import { PO_STATUS_OPTIONS } from '@/components/modules/purchases/purchase-order-form/po-form-options';
import {
  PO_CARD_COMPACT_CLS,
  PO_INPUT_CLS,
  PO_LABEL_CLS,
  PO_SECTION_TITLE_CLS,
} from '@/components/modules/purchases/purchase-order-form/po-form-styles';
import {
  computePoTotalsFromForm,
  createEmptyPoLineItem,
  type PoFormPayload,
  type PoFormValues,
} from '@/components/modules/purchases/purchase-order-form/po-form-types';
import {
  validatePoForm,
  type PoFieldError,
} from '@/components/modules/purchases/purchase-order-form/po-form-validation';
import type { AppState } from '@/lib/state/types';
import { listPoProductOptions } from '@/lib/services/purchases-service';
import { getSupplierProfile } from '@/lib/services/purchase-rm-service';

export type PoSaveAction = 'draft' | 'create';

export function PurchaseOrderForm({
  mode,
  initialValues,
  poPreviewId,
  appState,
  suppliers,
  purchasers,
  onCancel,
  onSave,
}: {
  mode: 'create' | 'edit';
  initialValues: PoFormValues;
  poPreviewId: string;
  appState: AppState;
  suppliers: Array<{ id: string; name: string }>;
  purchasers: Array<{ id: string; name: string }>;
  onCancel: () => void;
  onSave: (
    payload: PoFormPayload,
    action: PoSaveAction,
    pendingImageUpload?: Promise<PendingImageUpload | null> | null,
  ) => boolean | Promise<boolean>;
}) {
  const [form, setForm] = useState<PoFormValues>(initialValues);
  const [errors, setErrors] = useState<PoFieldError>({});
  const saveActionRef = useRef<PoSaveAction>('draft');
  const formRef = useRef<HTMLFormElement>(null);
  const pendingImageUploadRef = useRef<Promise<PendingImageUpload | null> | null>(null);
  const { isSubmitting, guardSubmit, savingRef, holdAfterSuccess } = useSubmitGuard();

  const productOptions = useMemo(() => listPoProductOptions(appState), [appState]);
  const supplierProfile = useMemo(
    () => (form.supplierId ? getSupplierProfile(appState, form.supplierId) : null),
    [appState, form.supplierId],
  );

  const totals = useMemo(() => computePoTotalsFromForm(form), [form]);
  const paidNum = Number(form.paidAmount || 0);
  const balanceDue = Math.max(0, totals.total - paidNum);

  const updateForm = (patch: Partial<PoFormValues>) => {
    setForm((prev) => ({ ...prev, ...patch }));
    const clearedKeys = Object.keys(patch) as Array<keyof PoFormValues>;
    if (!clearedKeys.length) return;
    setErrors((prev) => {
      if (!Object.keys(prev).length) return prev;
      const next = { ...prev };
      clearedKeys.forEach((key) => delete next[key]);
      if (patch.items) delete next.items;
      return next;
    });
  };

  const toPayload = (): PoFormPayload => ({
    ...form,
    poPreviewId,
    totals,
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (savingRef.current) return;
    void guardSubmit(async () => {
      const nextErrors = validatePoForm(form);
      if (Object.keys(nextErrors).length > 0) {
        setErrors(nextErrors);
        return;
      }
      setErrors({});
      const action = saveActionRef.current;
      saveActionRef.current = 'draft';
      const ok = await Promise.resolve(onSave(toPayload(), action, pendingImageUploadRef.current));
      if (ok) holdAfterSuccess();
    });
  };

  const handleEditDiscount = async () => {
    const current = form.docDiscountOverride ?? totals.lineDiscount;
    const raw = await promptAction('Document discount amount (৳):', String(current), {
      inputType: 'number',
      module: 'Purchase Order',
    });
    if (raw === null) return;
    updateForm({ docDiscountOverride: Math.max(0, Number(raw) || 0) });
  };

  const handleEditTax = async () => {
    const current = form.docTaxOverride ?? totals.taxAmount;
    const raw = await promptAction('Document tax amount (৳):', String(current), {
      inputType: 'number',
      module: 'Purchase Order',
    });
    if (raw === null) return;
    updateForm({ docTaxOverride: Math.max(0, Number(raw) || 0) });
  };

  const statusMeta = PO_STATUS_OPTIONS.find((s) => s.value === form.status) ?? PO_STATUS_OPTIONS[0];

  return (
    <div className={MODULE_LIST_SHELL}>
      <form ref={formRef} onSubmit={handleSubmit} noValidate className="w-full flex flex-col min-h-full pb-4">
        <div className="pt-3 md:pt-4 mb-2 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-2">
          <FormHeader
            compact
            title={mode === 'edit' ? 'Edit Purchase Order' : 'Create Purchase Order'}
            subtitle="Enter order details for your supplier."
            onBack={onCancel}
          />
          <div className="flex flex-wrap items-center gap-2 self-start">
            <Button type="button" onClick={onCancel} variant="ghost">Cancel</Button>
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                saveActionRef.current = 'draft';
                formRef.current?.requestSubmit();
              }}
              variant="outline"
              loading={isSubmitting && saveActionRef.current === 'draft'}
            >
              <SubmitBusyLabel busy={isSubmitting && saveActionRef.current === 'draft'} idle="Save Draft" />
            </Button>
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                saveActionRef.current = 'create';
                updateForm({ status: form.status === 'Draft' ? 'Sent' : form.status });
                formRef.current?.requestSubmit();
              }}
              variant="primary"
              loading={isSubmitting && saveActionRef.current === 'create'}
            >
              <SubmitBusyLabel busy={isSubmitting && saveActionRef.current === 'create'} idle="Create PO" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-2 flex-1">
          <div className="flex flex-col gap-2 min-w-0">
            <section className={PO_CARD_COMPACT_CLS}>
              <h3 className={PO_SECTION_TITLE_CLS}>Order Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="sm:col-span-1">
                  <PoSupplierSearch
                    suppliers={suppliers}
                    supplierId={form.supplierId}
                    supplierName={form.supplierName}
                    error={errors.supplierId}
                    onSelect={(supplierId, label) => {
                      const profile = supplierId ? getSupplierProfile(appState, supplierId) : null;
                      const patch: Partial<PoFormValues> = { supplierId, supplierName: label };
                      if (supplierId && profile?.address && !form.shippingAddress) {
                        patch.shippingAddress = profile.address;
                      }
                      updateForm(patch);
                    }}
                  />
                  <Link
                    href="/purchases/suppliers"
                    className="inline-flex items-center gap-1 mt-1.5 text-[11px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                  >
                    + New
                  </Link>
                </div>
                <div id="po-field-date">
                  <label className={PO_LABEL_CLS}>Order Date <span className="text-rose-500 normal-case">*</span></label>
                  <DateInput
                    value={form.date}
                    onChange={(date) => updateForm({ date })}
                    className={`${PO_INPUT_CLS}${errors.date ? ' border-rose-400' : ''}`}
                  />
                </div>
                <IconInput
                  label="Reference (Optional)"
                  icon={FileText}
                  value={form.reference}
                  onChange={(e) => updateForm({ reference: e.target.value })}
                  placeholder="PO reference"
                />
                <div>
                  <label className={PO_LABEL_CLS}>Status</label>
                  <div className="relative">
                    <span className={`absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${statusMeta.dotClass}`} />
                    <select
                      value={form.status}
                      onChange={(e) => updateForm({ status: e.target.value })}
                      className={`${PO_INPUT_CLS} pl-7 cursor-pointer appearance-none`}
                    >
                      {PO_STATUS_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <IconInput
                  label="Expected Delivery Date"
                  icon={Calendar}
                  type="date"
                  value={form.expectedDelivery}
                  onChange={(e) => updateForm({ expectedDelivery: e.target.value })}
                />
                <IconSelect
                  label="Purchaser"
                  icon={User}
                  value={form.purchaserId}
                  onChange={(e) => {
                    const id = e.target.value;
                    const name = purchasers.find((p) => p.id === id)?.name ?? '';
                    updateForm({ purchaserId: id, purchaserName: name });
                  }}
                >
                  <option value="">Select purchaser</option>
                  {purchasers.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </IconSelect>
              </div>
            </section>

            <section className={PO_CARD_COMPACT_CLS}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
                <h3 className={PO_SECTION_TITLE_CLS}>Order Items</h3>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    onClick={() => updateForm({ items: [...form.items, createEmptyPoLineItem()] })}
                    variant="primary"
                    size="sm"
                    leftIcon={<Plus className="w-3.5 h-3.5" />}
                  >
                    Add Item
                  </Button>
                  <Button
                    type="button"
                    onClick={() => toast.info('Feature coming soon', { module: 'Purchases', description: "Import Items" })}
                    variant="outline"
                    size="sm"
                    leftIcon={<FileSpreadsheet className="w-4 h-4" />}
                  >
                    Import Items
                  </Button>
                </div>
              </div>
              <PoItemsTable
                items={form.items}
                productOptions={productOptions}
                onChange={(items) => updateForm({ items, docDiscountOverride: null, docTaxOverride: null })}
                error={errors.items}
              />
            </section>

            <section className={PO_CARD_COMPACT_CLS}>
              <h3 className={PO_SECTION_TITLE_CLS}>Additional Details</h3>
              <div className="grid grid-cols-1 gap-2">
                <IconTextarea
                  label="Shipping / Delivery Address"
                  icon={MapPin}
                  rows={1}
                  value={form.shippingAddress}
                  onChange={(e) => updateForm({ shippingAddress: e.target.value })}
                  placeholder="Delivery address"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <IconTextarea
                    label="Notes"
                    icon={FileText}
                    rows={1}
                    value={form.notes}
                    onChange={(e) => updateForm({ notes: e.target.value })}
                    placeholder="Special instructions..."
                  />
                  <IconTextarea
                    label="Terms & Conditions"
                    icon={Package}
                    rows={1}
                    value={form.terms}
                    onChange={(e) => updateForm({ terms: e.target.value })}
                  />
                </div>
                <ImageUploadField
                  label="Attachment Image (Optional)"
                  value={form.attachmentUrl}
                  onChange={(url, publicId) => updateForm({
                    attachmentUrl: url,
                    attachmentPublicId: publicId ?? '',
                    attachmentName: url ? (url.split('/').pop()?.split('?')[0] || 'image') : '',
                  })}
                  onPendingUpload={(promise) => {
                    pendingImageUploadRef.current = promise;
                  }}
                />
              </div>
            </section>
          </div>

          <aside className="flex flex-col gap-2 lg:sticky lg:top-4 lg:self-start">
            <PoOrderSummary totals={totals} onEditDiscount={handleEditDiscount} onEditTax={handleEditTax} />
            <PoPaymentInfo
              paymentStatus={form.paymentStatus}
              paidAmount={form.paidAmount}
              balanceDue={balanceDue}
              onPaymentStatusChange={(paymentStatus) => updateForm({ paymentStatus })}
              onPaidAmountChange={(paidAmount) => updateForm({ paidAmount })}
            />
            <PoSupplierDetailsCard supplierId={form.supplierId} profile={supplierProfile} />
          </aside>
        </div>
      </form>
    </div>
  );
}
