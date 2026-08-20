'use client';

import { useMemo, useRef, useState, type FormEvent } from 'react';
import { SubmitBusyLabel, useSubmitGuard } from '@/hooks/use-submit-guard';
import Link from 'next/link';
import {
  Calendar,
  Eye,
  FileText,
  MapPin,
  Package,
  PenLine,
  Plus,
  Printer,
  Save,
  User,
} from 'lucide-react';
import { FormHeader } from '@/components/layout/FormHeader';
import { promptAction } from '@/lib/ui/feedback';
import { MODULE_LIST_SHELL } from '@/lib/ui/module-layout';
import { IconInput, IconSelect, IconTextarea } from '@/components/modules/crm/customer-form/IconField';
import { InvoiceCustomerSearch } from '@/components/modules/sales/invoice-form/InvoiceCustomerSearch';
import { InvoiceFormSectionCard } from '@/components/modules/sales/invoice-form/InvoiceFormSectionCard';
import { InvoiceItemsTable } from '@/components/modules/sales/invoice-form/InvoiceItemsTable';
import { InvoiceSummary } from '@/components/modules/sales/invoice-form/InvoiceSummary';
import {
  INVOICE_STATUS_OPTIONS,
  INVOICE_TERMS_OPTIONS,
} from '@/components/modules/sales/invoice-form/inv-form-options';
import { Button } from '@/components/shared/Button';
import {
  INV_ADD_ITEM_BTN_CLS,
  INV_FOOTER_CLS,
  INV_INPUT_CLS,
  INV_LABEL_CLS,
  INV_PREVIEW_BTN_CLS,
} from '@/components/modules/sales/invoice-form/inv-form-styles';
import {
  validateInvoiceForm,
  type InvoiceFieldError,
} from '@/components/modules/sales/invoice-form/inv-form-validation';
import {
  computeInvoiceTotalsFromItems,
  createEmptyLineItem,
  EMPTY_INVOICE_FORM,
  recalcLineItem,
  type InvoiceFormValues,
  type InvoicePayload,
} from '@/components/modules/sales/invoice-form/inv-form-types';
import type { AppState } from '@/lib/state/types';
import { listInventoryProductOptions } from '@/lib/services/sales-service';
import { getDefaultSignatureForUser, getSignaturesForCurrentUser } from '@/lib/services/settings-service';
import { useAppStore } from '@/lib/state/app-store';

export type InvoiceSaveAction = 'draft' | 'sent';

export function InvoiceForm({
  mode,
  initialValues,
  invoicePreviewNo,
  appState,
  customers,
  onCustomerChange,
  onCancel,
  onSave,
  onPreview,
}: {
  mode: 'create' | 'edit';
  initialValues: InvoiceFormValues;
  invoicePreviewNo: string;
  appState: AppState;
  customers: Array<{ id: string; name: string; company?: string }>;
  onCustomerChange: (customerId: string, issueDate: string) => void;
  onCancel: () => void;
  onSave: (payload: InvoicePayload, action: InvoiceSaveAction) => boolean | Promise<boolean>;
  onPreview: (payload: InvoicePayload) => void;
}) {
  const [form, setForm] = useState<InvoiceFormValues>(initialValues);
  const [errors, setErrors] = useState<InvoiceFieldError>({});
  const [saveMenuOpen, setSaveMenuOpen] = useState(false);
  const saveActionRef = useRef<InvoiceSaveAction>('draft');
  const formRef = useRef<HTMLFormElement>(null);
  const { isSubmitting, guardSubmit, savingRef, holdAfterSuccess } = useSubmitGuard();
  const t = useAppStore((s) => s.t);

  const signatures = useMemo(() => getSignaturesForCurrentUser(appState), [appState]);
  const defaultSignature = useMemo(() => getDefaultSignatureForUser(appState), [appState]);

  const productOptions = useMemo(() => listInventoryProductOptions(appState), [appState]);

  const totals = useMemo(
    () => computeInvoiceTotalsFromItems(form.items.map(recalcLineItem), {
      docDiscountOverride: form.docDiscountOverride,
      docTaxOverride: form.docTaxOverride,
    }),
    [form.items, form.docDiscountOverride, form.docTaxOverride],
  );

  const updateForm = (patch: Partial<InvoiceFormValues>) => {
    setForm((prev) => ({ ...prev, ...patch }));
    const clearedKeys = Object.keys(patch) as Array<keyof InvoiceFormValues>;
    if (!clearedKeys.length) return;
    setErrors((prev) => {
      if (!Object.keys(prev).length) return prev;
      const next = { ...prev };
      clearedKeys.forEach((key) => delete next[key]);
      if (patch.items) delete next.items;
      return next;
    });
  };

  const toPayload = (): InvoicePayload => ({
    ...form,
    dueDate: form.issueDate,
    paidAmount: form.status === 'cancelled' ? 0 : totals.total,
    invoiceNo: invoicePreviewNo,
    totals,
    items: form.items.map(recalcLineItem),
    balanceDue: 0,
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (savingRef.current) return;
    void guardSubmit(async () => {
      const nextErrors = validateInvoiceForm(form);
      const errorKeys = Object.keys(nextErrors);
      if (errorKeys.length > 0) {
        setErrors(nextErrors);
        const firstKey = errorKeys[0];
        document.getElementById(`inv-field-${firstKey}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      setErrors({});
      const action = saveActionRef.current;
      saveActionRef.current = 'draft';
      setSaveMenuOpen(false);
      const ok = await Promise.resolve(onSave(toPayload(), action));
      if (ok) holdAfterSuccess();
    });
  };

  const statusMeta = INVOICE_STATUS_OPTIONS.find((s) => s.value === form.status) ?? INVOICE_STATUS_OPTIONS[0];

  const handleEditDiscount = async () => {
    const current = form.docDiscountOverride ?? totals.lineDiscount;
    const raw = await promptAction('Document discount amount (৳):', String(current), {
      inputType: 'number',
      module: 'Invoice',
    });
    if (raw === null) return;
    const value = Math.max(0, Number(raw) || 0);
    updateForm({ docDiscountOverride: value });
  };

  const handleEditTax = async () => {
    const current = form.docTaxOverride ?? totals.taxAmount;
    const raw = await promptAction('Document tax amount (৳):', String(current), {
      inputType: 'number',
      module: 'Invoice',
    });
    if (raw === null) return;
    const value = Math.max(0, Number(raw) || 0);
    updateForm({ docTaxOverride: value });
  };

  const addInvoiceItem = () => {
    updateForm({
      items: [...form.items, createEmptyLineItem()],
      docDiscountOverride: null,
      docTaxOverride: null,
    });
  };

  return (
    <div className={MODULE_LIST_SHELL}>
      <form ref={formRef} onSubmit={handleSubmit} noValidate className="w-full flex flex-col min-h-full pb-4">
        <div className="pt-3 md:pt-4 mb-3 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
          <FormHeader
            compact
            title={mode === 'edit' ? 'Edit Invoice' : 'Create New Invoice'}
            subtitle="Create and manage customer invoices with ease."
            onBack={onCancel}
          />
          <button
            type="button"
            onClick={() => onPreview(toPayload())}
            className={INV_PREVIEW_BTN_CLS}
          >
            <Eye className="w-4 h-4" /> Preview Invoice
          </button>
        </div>

        <div className="flex flex-col gap-2 flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 items-start">
            <InvoiceFormSectionCard
              compact
              title="Customer Details"
              icon={<User className="w-4 h-4" />}
              className="lg:col-span-2"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-stretch">
                <div id="inv-field-customerId" className="flex flex-col">
                  <InvoiceCustomerSearch
                    customers={customers}
                    customerId={form.customerId}
                    customerName={form.customerName}
                    error={errors.customerId}
                    onSelect={(customerId, label) => {
                      updateForm({ customerId, customerName: label });
                      if (customerId) onCustomerChange(customerId, form.issueDate);
                    }}
                  />
                  <Link
                    href="/crm/customers"
                    className="inline-flex items-center gap-1 mt-1.5 text-[11px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                  >
                    + Add New Customer
                  </Link>
                </div>
                <IconTextarea
                  label="Billing Address"
                  icon={MapPin}
                  fieldId="inv-billing"
                  className="h-full"
                  rows={4}
                  value={form.billingAddress}
                  onChange={(e) => updateForm({ billingAddress: e.target.value })}
                  placeholder="Billing address will appear here"
                />
              </div>
            </InvoiceFormSectionCard>

            <InvoiceFormSectionCard compact title="Invoice Details" icon={<Calendar className="w-4 h-4" />}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-3">
                <IconInput
                  label="Invoice Date"
                  icon={Calendar}
                  required
                  type="date"
                  fieldId="inv-field-issueDate"
                  error={errors.issueDate}
                  value={form.issueDate}
                  onChange={(e) => updateForm({ issueDate: e.target.value, dueDate: e.target.value })}
                />
                <div>
                  <label className={INV_LABEL_CLS}>Invoice No.</label>
                  <input
                    type="text"
                    readOnly
                    value={invoicePreviewNo}
                    className={`${INV_INPUT_CLS} bg-slate-50 font-bold text-slate-700`}
                  />
                </div>
                <div>
                  <label className={INV_LABEL_CLS}>Status</label>
                  <div className="relative">
                    <span className={`absolute left-3 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full ${statusMeta.dotClass}`} />
                    <select
                      value={form.status}
                      onChange={(e) => updateForm({ status: e.target.value })}
                      className={`${INV_INPUT_CLS} pl-8 font-semibold cursor-pointer appearance-none`}
                    >
                      {INVOICE_STATUS_OPTIONS.map((status) => (
                        <option key={status.value} value={status.value}>{status.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </InvoiceFormSectionCard>
          </div>

          <InvoiceFormSectionCard
            compact
            title="Invoice Items"
            icon={<Package className="w-4 h-4" />}
            headerAction={(
              <button type="button" onClick={addInvoiceItem} className={INV_ADD_ITEM_BTN_CLS}>
                <Plus className="w-4 h-4" /> Add Item
              </button>
            )}
          >
            <div id="inv-field-items">
              <InvoiceItemsTable
                items={form.items}
                productOptions={productOptions}
                onChange={(items) => updateForm({ items, docDiscountOverride: null, docTaxOverride: null })}
                onAddItem={addInvoiceItem}
                error={errors.items}
              />
            </div>
          </InvoiceFormSectionCard>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 items-stretch">
            <InvoiceFormSectionCard
              compact
              title="Additional Details"
              icon={<FileText className="w-4 h-4" />}
              className="lg:col-span-2"
            >
              <div className="space-y-3">
                <IconTextarea
                  label="Notes"
                  icon={FileText}
                  rows={4}
                  value={form.notes}
                  onChange={(e) => updateForm({ notes: e.target.value })}
                  placeholder="Add any notes or special instructions..."
                />
                <IconSelect
                  label="Terms & Conditions"
                  icon={FileText}
                  value={form.terms}
                  onChange={(e) => updateForm({ terms: e.target.value })}
                >
                  {INVOICE_TERMS_OPTIONS.map((term) => (
                    <option key={term.value || 'none'} value={term.value}>{term.label}</option>
                  ))}
                </IconSelect>
              </div>
            </InvoiceFormSectionCard>

            <InvoiceSummary
              totals={totals}
              onEditDiscount={handleEditDiscount}
              onEditTax={handleEditTax}
            />
          </div>

          <InvoiceFormSectionCard
            compact
            title="Authorized Signature"
            icon={<PenLine className="w-4 h-4" />}
          >
            <div className="space-y-4">
              <label className="flex items-center justify-between gap-3 py-1 cursor-pointer">
                <span className="text-sm font-semibold text-slate-800">
                  {t('settings.signatures_include_on_invoice')}
                </span>
                <input
                  type="checkbox"
                  checked={form.includeSignature}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    updateForm({
                      includeSignature: checked,
                      signatureId: checked
                        ? (form.signatureId || defaultSignature?.id || signatures[0]?.id || null)
                        : form.signatureId,
                    });
                  }}
                  className="w-5 h-5 rounded border-slate-300 text-blue-600 cursor-pointer"
                />
              </label>

              {signatures.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-4">
                  <p className="text-xs font-medium text-slate-500">
                    {t('settings.signatures_no_personal_signatures')}
                  </p>
                  <Link
                    href="/settings/signatures"
                    className="inline-flex mt-2 text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                  >
                    {t('settings.signatures_manage_link')} →
                  </Link>
                </div>
              ) : (
                <div className={`space-y-3 ${form.includeSignature ? '' : 'opacity-60 pointer-events-none'}`}>
                  <label className={`${INV_LABEL_CLS} block`}>{t('settings.signatures_select_signature')}</label>
                  <p className="text-[11px] font-medium text-slate-500 mb-2">
                    {t('settings.signatures_personal_only_hint')}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                    {signatures.map((signature) => {
                      const selected = form.signatureId === signature.id;
                      return (
                        <button
                          key={signature.id}
                          type="button"
                          onClick={() => updateForm({ signatureId: signature.id, includeSignature: true })}
                          className={`rounded-xl border p-3 text-left cursor-pointer transition-colors ${
                            selected
                              ? 'border-blue-300 bg-blue-50/70 ring-2 ring-blue-200'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div
                            className="h-14 flex items-center justify-center rounded-lg mb-2"
                            style={{
                              backgroundImage:
                                'linear-gradient(45deg, #f8fafc 25%, transparent 25%), linear-gradient(-45deg, #f8fafc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f8fafc 75%), linear-gradient(-45deg, transparent 75%, #f8fafc 75%)',
                              backgroundSize: '12px 12px',
                            }}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={signature.imageDataUrl} alt="" className="max-h-10 object-contain" />
                          </div>
                          <p className="text-xs font-bold text-slate-800 truncate">{signature.signerName}</p>
                          <p className="text-[10px] font-medium text-slate-500 truncate">
                            {signature.designation || signature.label}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </InvoiceFormSectionCard>
        </div>

        <div className={INV_FOOTER_CLS}>
          <Button
            type="button"
            onClick={onCancel}
            variant="ghost"
            className="sm:mr-auto"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => onPreview(toPayload())}
            variant="outline"
            leftIcon={<Printer className="w-4 h-4" />}
          >
            Print Invoice
          </Button>
          <div className="relative inline-flex">
            <Button
              type="submit"
              disabled={isSubmitting}
              onClick={() => { saveActionRef.current = 'draft'; }}
              variant="primary"
              className="rounded-r-none pr-4"
              leftIcon={<Save className="w-4 h-4" />}
              loading={isSubmitting}
            >
              <SubmitBusyLabel busy={isSubmitting} idle="Save Invoice" />
            </Button>
            <Button
              type="button"
              disabled={isSubmitting}
              aria-label="More save options"
              onClick={() => setSaveMenuOpen((open) => !open)}
              variant="primary"
              className="rounded-l-none border-l border-green-700/40 px-2.5"
            >
              ▾
            </Button>
            {saveMenuOpen ? (
              <div className="absolute bottom-full right-0 mb-1 min-w-[180px] rounded-xl border border-slate-200 bg-white shadow-lg py-1 z-20">
                <button
                  type="submit"
                  onClick={() => { saveActionRef.current = 'draft'; }}
                  className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Save as Draft
                </button>
                <button
                  type="submit"
                  onClick={() => { saveActionRef.current = 'sent'; }}
                  className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Save &amp; Mark Sent
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </form>
    </div>
  );
}

export { EMPTY_INVOICE_FORM };
export type { InvoiceFormValues, InvoicePayload };
