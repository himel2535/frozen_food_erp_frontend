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
import { useSubmitGuard } from '@/hooks/use-submit-guard';
import { FormHeader } from '@/components/layout/FormHeader';
import { useChromeSuppressed } from '@/components/layout/ModuleActionsContext';
import { MODULE_FORM_SHELL } from '@/lib/ui/module-layout';
import { IconInput, IconSelect, IconTextarea } from '@/components/modules/crm/customer-form/IconField';
import { DateInput } from '@/components/shared/DateInput';
import { InvoiceCustomerSearch } from '@/components/modules/sales/invoice-form/InvoiceCustomerSearch';
import { PoItemsTable } from '@/components/modules/purchases/purchase-order-form/PoItemsTable';
import { PoOrderSummary } from '@/components/modules/purchases/purchase-order-form/PoOrderSummary';
import { PoPaymentInfo } from '@/components/modules/purchases/purchase-order-form/PoPaymentInfo';
import { SoCustomerDetailsCard } from '@/components/modules/sales/sales-order-form/SoCustomerDetailsCard';
import { SO_STATUS_OPTIONS } from '@/components/modules/sales/sales-order-form/so-form-options';
import {
  SO_BTN_GHOST,
  SO_BTN_OUTLINE,
  SO_BTN_PRIMARY,
  SO_CARD_CLS,
  SO_CARD_COMPACT_CLS,
  SO_INPUT_CLS,
  SO_LABEL_CLS,
  SO_SECTION_TITLE_CLS,
  SO_ADD_ITEM_BTN_CLS,
} from '@/components/modules/sales/sales-order-form/so-form-styles';
import {
  computeSoTotalsFromForm,
  createEmptySoLineItem,
  type SoFormPayload,
  type SoFormValues,
} from '@/components/modules/sales/sales-order-form/so-form-types';
import {
  validateSoForm,
  type SoFieldError,
} from '@/components/modules/sales/sales-order-form/so-form-validation';
import { buildCustomerSidebarProfile } from '@/components/modules/sales/sales-order-form/so-customer-profile';
import type { AppState } from '@/lib/state/types';
import { getCustomerBillingDefaults, listInventoryProductOptions } from '@/lib/services/sales-service';

export type SoSaveAction = 'draft' | 'create';

export function SalesOrderForm({
  mode,
  initialValues,
  orderPreviewId,
  appState,
  customers,
  salesPersons,
  onCancel,
  onSave,
}: {
  mode: 'create' | 'edit';
  initialValues: SoFormValues;
  orderPreviewId: string;
  appState: AppState;
  customers: Array<{ id: string; name: string; company?: string }>;
  salesPersons: Array<{ id: string; name: string }>;
  onCancel: () => void;
  onSave: (
    payload: SoFormPayload,
    action: SoSaveAction,
    pendingImageUpload?: Promise<PendingImageUpload | null> | null,
  ) => void | Promise<void>;
}) {
  const [form, setForm] = useState<SoFormValues>(initialValues);
  const [errors, setErrors] = useState<SoFieldError>({});
  const { isSubmitting, guardSubmit } = useSubmitGuard();
  const saveActionRef = useRef<SoSaveAction>('draft');
  const formRef = useRef<HTMLFormElement>(null);
  const pendingImageUploadRef = useRef<Promise<PendingImageUpload | null> | null>(null);

  useChromeSuppressed(true);

  const productOptions = useMemo(
    () => listInventoryProductOptions(appState).map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      price: p.price,
      unit: 'pcs',
      imageUrl: p.imageUrl,
    })),
    [appState],
  );

  const customerProfile = useMemo(
    () => (form.customerId ? buildCustomerSidebarProfile(appState, form.customerId) : null),
    [appState, form.customerId],
  );

  const totals = useMemo(() => computeSoTotalsFromForm(form), [form]);
  const paidNum = Number(form.paidAmount || 0);
  const balanceDue = Math.max(0, totals.total - paidNum);

  const updateForm = (patch: Partial<SoFormValues>) => {
    setForm((prev) => ({ ...prev, ...patch }));
    const clearedKeys = Object.keys(patch) as Array<keyof SoFormValues>;
    if (!clearedKeys.length) return;
    setErrors((prev) => {
      if (!Object.keys(prev).length) return prev;
      const next = { ...prev };
      clearedKeys.forEach((key) => delete next[key]);
      if (patch.items) delete next.items;
      return next;
    });
  };

  const toPayload = (): SoFormPayload => ({
    ...form,
    orderPreviewId,
    totals,
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    const nextErrors = validateSoForm(form);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    const action = saveActionRef.current;
    saveActionRef.current = 'draft';
    await guardSubmit(async () => {
      await Promise.resolve(onSave(toPayload(), action, pendingImageUploadRef.current));
    });
  };

  const handleEditDiscount = async () => {
    const current = form.docDiscountOverride ?? totals.lineDiscount;
    const raw = await promptAction('Document discount amount (৳):', String(current), {
      inputType: 'number',
      module: 'Sales Order',
    });
    if (raw === null) return;
    updateForm({ docDiscountOverride: Math.max(0, Number(raw) || 0) });
  };

  const handleEditTax = async () => {
    const current = form.docTaxOverride ?? totals.taxAmount;
    const raw = await promptAction('Document tax amount (৳):', String(current), {
      inputType: 'number',
      module: 'Sales Order',
    });
    if (raw === null) return;
    updateForm({ docTaxOverride: Math.max(0, Number(raw) || 0) });
  };

  const statusMeta = SO_STATUS_OPTIONS.find((s) => s.value === form.status) ?? SO_STATUS_OPTIONS[0];

  return (
    <div className={MODULE_FORM_SHELL}>
      <form ref={formRef} onSubmit={handleSubmit} noValidate className="w-full flex flex-col min-h-full pb-4">
        <div className="pt-3 md:pt-4 mb-3 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
          <FormHeader
            compact
            title={mode === 'edit' ? 'Edit Sales Order' : 'Create Sales Order'}
            subtitle="Enter order details for your customer."
            onBack={onCancel}
            backLabel="Back to Sales Orders"
          />
          <div className="flex flex-wrap items-center gap-2 self-start">
            <button type="button" onClick={onCancel} className={SO_BTN_GHOST}>Cancel</button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                if (isSubmitting) return;
                saveActionRef.current = 'draft';
                formRef.current?.requestSubmit();
              }}
              className={`${SO_BTN_OUTLINE} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isSubmitting ? 'Saving…' : 'Save Draft'}
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                if (isSubmitting) return;
                saveActionRef.current = 'create';
                updateForm({ status: form.status === 'draft' ? 'confirmed' : form.status });
                formRef.current?.requestSubmit();
              }}
              className={`${SO_BTN_PRIMARY} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isSubmitting ? 'Saving…' : 'Create Order'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-3 flex-1">
          <div className="flex flex-col gap-3 min-w-0">
            <section className={SO_CARD_CLS}>
              <h3 className={SO_SECTION_TITLE_CLS}>Order Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <InvoiceCustomerSearch
                    customers={customers}
                    customerId={form.customerId}
                    customerName={form.customerName}
                    error={errors.customerId}
                    onSelect={(customerId, label) => {
                      const profile = customerId ? buildCustomerSidebarProfile(appState, customerId) : null;
                      const billing = customerId ? getCustomerBillingDefaults(appState, customerId, form.date) : null;
                      const patch: Partial<SoFormValues> = { customerId, customerName: label };
                      if (customerId && !form.deliveryAddress) {
                        patch.deliveryAddress = billing?.billingAddress || profile?.address || '';
                      }
                      if (billing?.paymentTerms && form.terms === 'Net 30 - Payment due within 30 days') {
                        patch.terms = billing.paymentTerms;
                      }
                      updateForm(patch);
                    }}
                  />
                  <Link
                    href="/crm/customers"
                    className="inline-flex items-center gap-1 mt-1.5 text-[11px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                  >
                    + New
                  </Link>
                </div>
                <div id="so-field-date">
                  <label className={SO_LABEL_CLS}>Order Date <span className="text-rose-500 normal-case">*</span></label>
                  <DateInput
                    value={form.date}
                    onChange={(date) => updateForm({ date })}
                    className={`${SO_INPUT_CLS}${errors.date ? ' border-rose-400' : ''}`}
                  />
                </div>
                <IconInput
                  label="Reference (Optional)"
                  icon={FileText}
                  value={form.reference}
                  onChange={(e) => updateForm({ reference: e.target.value })}
                  placeholder="Order reference"
                />
                <div>
                  <label className={SO_LABEL_CLS}>Status</label>
                  <div className="relative">
                    <span className={`absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${statusMeta.dotClass}`} />
                    <select
                      value={form.status}
                      onChange={(e) => updateForm({ status: e.target.value })}
                      className={`${SO_INPUT_CLS} pl-7 cursor-pointer appearance-none`}
                    >
                      {SO_STATUS_OPTIONS.map((s) => (
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
                  label="Sales Person"
                  icon={User}
                  value={form.salesPersonId}
                  onChange={(e) => {
                    const id = e.target.value;
                    const name = salesPersons.find((p) => p.id === id)?.name ?? '';
                    updateForm({ salesPersonId: id, salesPersonName: name });
                  }}
                >
                  <option value="">Select sales person</option>
                  {salesPersons.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </IconSelect>
              </div>
            </section>

            <section className={SO_CARD_CLS}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h3 className={SO_SECTION_TITLE_CLS}>Order Items</h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateForm({ items: [...form.items, createEmptySoLineItem()] })}
                    className={SO_ADD_ITEM_BTN_CLS}
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Item
                  </button>
                  <button
                    type="button"
                    onClick={() => toast.info('Feature coming soon', { module: 'Sales', description: "Import Items" })}
                    className={SO_BTN_OUTLINE}
                  >
                    <FileSpreadsheet className="w-4 h-4" /> Import Items
                  </button>
                </div>
              </div>
              <PoItemsTable
                items={form.items}
                productOptions={productOptions}
                onChange={(items) => updateForm({ items, docDiscountOverride: null, docTaxOverride: null })}
                error={errors.items}
              />
            </section>

            <section className={SO_CARD_COMPACT_CLS}>
              <h3 className={SO_SECTION_TITLE_CLS}>Additional Details</h3>
              <div className="grid grid-cols-1 gap-2">
                <IconTextarea
                  label="Delivery Address"
                  icon={MapPin}
                  rows={1}
                  value={form.deliveryAddress}
                  onChange={(e) => updateForm({ deliveryAddress: e.target.value })}
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

          <aside className="flex flex-col gap-3 xl:sticky xl:top-4 xl:self-start">
            <PoOrderSummary totals={totals} onEditDiscount={handleEditDiscount} onEditTax={handleEditTax} />
            <PoPaymentInfo
              paymentStatus={form.paymentStatus}
              paidAmount={form.paidAmount}
              balanceDue={balanceDue}
              onPaymentStatusChange={(paymentStatus) => updateForm({ paymentStatus })}
              onPaidAmountChange={(paidAmount) => updateForm({ paidAmount })}
            />
            <SoCustomerDetailsCard customerId={form.customerId} profile={customerProfile} />
          </aside>
        </div>
      </form>
    </div>
  );
}
