'use client';

import { useMemo, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Eye,
  FileText,
  MapPin,
  Package,
  Plus,
  Printer,
  Save,
  User,
} from 'lucide-react';
import { FormHeader } from '@/components/layout/FormHeader';
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
import {
  INV_ADD_ITEM_BTN_CLS,
  INV_BTN_GHOST,
  INV_BTN_OUTLINE,
  INV_BTN_PRIMARY,
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
  onSave: (payload: InvoicePayload, action: InvoiceSaveAction) => void;
  onPreview: (payload: InvoicePayload) => void;
}) {
  const [form, setForm] = useState<InvoiceFormValues>(initialValues);
  const [errors, setErrors] = useState<InvoiceFieldError>({});
  const [saveMenuOpen, setSaveMenuOpen] = useState(false);
  const saveActionRef = useRef<InvoiceSaveAction>('draft');
  const formRef = useRef<HTMLFormElement>(null);

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
    invoiceNo: invoicePreviewNo,
    totals,
    items: form.items.map(recalcLineItem),
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
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
    onSave(toPayload(), action);
  };

  const statusMeta = INVOICE_STATUS_OPTIONS.find((s) => s.value === form.status) ?? INVOICE_STATUS_OPTIONS[0];

  const handleEditDiscount = () => {
    const current = form.docDiscountOverride ?? totals.lineDiscount;
    const raw = window.prompt('Document discount amount (৳):', String(current));
    if (raw === null) return;
    const value = Math.max(0, Number(raw) || 0);
    updateForm({ docDiscountOverride: value });
  };

  const handleEditTax = () => {
    const current = form.docTaxOverride ?? totals.taxAmount;
    const raw = window.prompt('Document tax amount (৳):', String(current));
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
                  onChange={(e) => updateForm({ issueDate: e.target.value })}
                />
                <IconInput
                  label="Due Date"
                  icon={Calendar}
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => updateForm({ dueDate: e.target.value })}
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
        </div>

        <div className={INV_FOOTER_CLS}>
          <button type="button" onClick={onCancel} className={`${INV_BTN_GHOST} sm:mr-auto`}>
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onPreview(toPayload())}
            className={INV_BTN_OUTLINE}
          >
            <Printer className="w-4 h-4" /> Print Invoice
          </button>
          <div className="relative inline-flex">
            <button
              type="submit"
              onClick={() => { saveActionRef.current = 'draft'; }}
              className={`${INV_BTN_PRIMARY} rounded-r-none pr-4`}
            >
              <Save className="w-4 h-4" /> Save Invoice
            </button>
            <button
              type="button"
              aria-label="More save options"
              onClick={() => setSaveMenuOpen((open) => !open)}
              className={`${INV_BTN_PRIMARY} rounded-l-none border-l border-blue-500/40 px-2.5`}
            >
              ▾
            </button>
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
