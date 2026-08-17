'use client';

import { useRef, useState, type FormEvent } from 'react';
import { useSubmitGuard } from '@/hooks/use-submit-guard';
import { FormHeader } from '@/components/layout/FormHeader';
import { Footer } from '@/components/layout/Footer';
import { FormSectionCard } from '@/components/modules/crm/customer-form/FormSectionCard';
import {
  CF_BTN_GHOST,
  CF_BTN_PRIMARY,
  CF_FOOTER_CLS,
  CF_INPUT_CLS,
  CF_LABEL_CLS,
  CF_SELECT_CLS,
  CF_TEXTAREA_CLS,
} from '@/components/modules/crm/customer-form/customer-form-styles';
import { ImageUploadField, type PendingImageUpload } from '@/components/shared/ImageUploadField';
import { MODULE_LIST_SHELL } from '@/lib/ui/module-layout';

export type SupplierFormValues = {
  name: string;
  contact: string;
  phone: string;
  category: string;
  paymentTerms: string;
  status: string;
  email: string;
  lead: string;
  address: string;
  notes: string;
  rating: string;
  imageUrl: string;
  imagePublicId: string;
};

export const EMPTY_SUPPLIER_FORM: SupplierFormValues = {
  name: '',
  contact: '',
  phone: '',
  category: 'Raw Materials',
  paymentTerms: 'Net 30',
  status: 'active',
  email: '',
  lead: '',
  address: '',
  notes: '',
  rating: '',
  imageUrl: '',
  imagePublicId: '',
};

const CATEGORY_OPTIONS = ['Raw Materials', 'Chemicals', 'Packaging', 'Components', 'Metals', 'Electronics', 'Hardware', 'General'];
const TERMS_OPTIONS = ['Net 30', 'Net 15', 'Cash', 'Net 45'];
const STATUS_OPTIONS = ['active', 'inactive', 'credit-hold'];

const CF_INPUT_PLAIN = CF_INPUT_CLS.replace('pl-10', 'pl-4');
const CF_SELECT_PLAIN = CF_SELECT_CLS.replace('pl-10', 'pl-4');
const CF_TEXTAREA_PLAIN = CF_TEXTAREA_CLS.replace('pl-10', 'pl-4');
const SF_FIELD_GRID_CLS = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-3 gap-y-3';

export function SupplierForm({
  mode,
  initialValues,
  onCancel,
  onSave,
}: {
  mode: 'create' | 'edit';
  initialValues: SupplierFormValues;
  onCancel: () => void;
  onSave: (
    values: SupplierFormValues,
    pendingImageUpload?: Promise<PendingImageUpload | null> | null,
  ) => void | Promise<void>;
}) {
  const [values, setValues] = useState<SupplierFormValues>(initialValues);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const pendingImageUploadRef = useRef<Promise<PendingImageUpload | null> | null>(null);
  const { isSubmitting, guardSubmit } = useSubmitGuard();

  const update = (patch: Partial<SupplierFormValues>) => setValues((prev) => ({ ...prev, ...patch }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    await guardSubmit(async () => {
      await Promise.resolve(onSave(values, pendingImageUploadRef.current));
    });
  };

  return (
    <div className={MODULE_LIST_SHELL}>
      <form
        className="w-full flex flex-col min-h-full pb-4"
        onSubmit={handleSubmit}
      >
        <div className="pt-3 md:pt-4 mb-3">
          <FormHeader
            compact
            title={mode === 'create' ? 'Add Supplier' : 'Edit Supplier'}
            subtitle={
              mode === 'create'
                ? 'Create a new vendor profile for purchases and payments.'
                : 'Update supplier details and payment terms.'
            }
            onBack={onCancel}
            backLabel="Back to Suppliers"
          />
        </div>

        <div className="flex flex-col gap-3 flex-1">
          <FormSectionCard
            number={1}
            title="Supplier Details"
            subtitle="Basic vendor information and payment terms."
          >
            <div className={SF_FIELD_GRID_CLS}>
              <div className="sm:col-span-2 lg:col-span-3 xl:col-span-4">
                <ImageUploadField
                  label="Supplier Logo"
                  value={values.imageUrl}
                  onChange={(url, publicId) => update({ imageUrl: url, imagePublicId: publicId ?? '' })}
                  onPendingUpload={(promise) => {
                    pendingImageUploadRef.current = promise;
                  }}
                />
              </div>
              <label className="block sm:col-span-2 lg:col-span-2 xl:col-span-2">
                <span className={CF_LABEL_CLS}>Supplier Name *</span>
                <input
                  type="text"
                  required
                  value={values.name}
                  onChange={(e) => update({ name: e.target.value })}
                  className={CF_INPUT_PLAIN}
                />
              </label>
              <label className="block">
                <span className={CF_LABEL_CLS}>Contact Person *</span>
                <input
                  type="text"
                  required
                  value={values.contact}
                  onChange={(e) => update({ contact: e.target.value })}
                  className={CF_INPUT_PLAIN}
                />
              </label>
              <label className="block">
                <span className={CF_LABEL_CLS}>Phone *</span>
                <input
                  type="text"
                  required
                  value={values.phone}
                  onChange={(e) => update({ phone: e.target.value })}
                  className={CF_INPUT_PLAIN}
                />
              </label>
              <label className="block">
                <span className={CF_LABEL_CLS}>Category</span>
                <select
                  value={values.category}
                  onChange={(e) => update({ category: e.target.value })}
                  className={CF_SELECT_PLAIN}
                >
                  {CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className={CF_LABEL_CLS}>Payment Terms</span>
                <select
                  value={values.paymentTerms}
                  onChange={(e) => update({ paymentTerms: e.target.value })}
                  className={CF_SELECT_PLAIN}
                >
                  {TERMS_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className={CF_LABEL_CLS}>Status</span>
                <select
                  value={values.status}
                  onChange={(e) => update({ status: e.target.value })}
                  className={CF_SELECT_PLAIN}
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </FormSectionCard>

          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
          >
            {showAdvanced ? 'Hide Advanced Details' : 'Show Advanced Details'}
          </button>

          {showAdvanced ? (
            <FormSectionCard
              number={2}
              title="Advanced Details"
              subtitle="Optional contact, delivery, and internal notes."
            >
              <div className={SF_FIELD_GRID_CLS}>
                <label className="block">
                  <span className={CF_LABEL_CLS}>Email</span>
                  <input
                    type="email"
                    value={values.email}
                    onChange={(e) => update({ email: e.target.value })}
                    className={CF_INPUT_PLAIN}
                  />
                </label>
                <label className="block">
                  <span className={CF_LABEL_CLS}>Lead Time</span>
                  <input
                    type="text"
                    value={values.lead}
                    onChange={(e) => update({ lead: e.target.value })}
                    placeholder="e.g. 5–7 days"
                    className={CF_INPUT_PLAIN}
                  />
                </label>
                <label className="block">
                  <span className={CF_LABEL_CLS}>Rating (1–5)</span>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={values.rating}
                    onChange={(e) => update({ rating: e.target.value })}
                    className={CF_INPUT_PLAIN}
                  />
                </label>
                <label className="block sm:col-span-2 lg:col-span-3 xl:col-span-4">
                  <span className={CF_LABEL_CLS}>Address</span>
                  <textarea
                    value={values.address}
                    onChange={(e) => update({ address: e.target.value })}
                    rows={2}
                    className={CF_TEXTAREA_PLAIN}
                  />
                </label>
                <label className="block sm:col-span-2 lg:col-span-3 xl:col-span-4">
                  <span className={CF_LABEL_CLS}>Notes</span>
                  <textarea
                    value={values.notes}
                    onChange={(e) => update({ notes: e.target.value })}
                    rows={3}
                    className={CF_TEXTAREA_PLAIN}
                  />
                </label>
              </div>
            </FormSectionCard>
          ) : null}
        </div>

        <div className={`${CF_FOOTER_CLS} !mt-3`}>
          <p className="text-xs font-semibold text-slate-500">
            {mode === 'create' ? 'New supplier profile' : 'Editing supplier profile'}
          </p>
          <div className="flex items-center gap-3">
            <button type="button" onClick={onCancel} className={CF_BTN_GHOST}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`${CF_BTN_PRIMARY} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isSubmitting ? 'Saving…' : mode === 'create' ? 'Save Supplier' : 'Update Supplier'}
            </button>
          </div>
        </div>
      </form>

      <Footer />
    </div>
  );
}

export function supplierToFormValues(supplier: {
  name: string;
  contactName: string;
  phone: string;
  category: string;
  paymentTerms: string;
  recordStatus: string;
  email?: string;
  leadTime?: string;
  address?: string;
  notes?: string;
  rating?: number;
  imageUrl?: string;
  imagePublicId?: string;
}): SupplierFormValues {
  return {
    name: supplier.name,
    contact: supplier.contactName,
    phone: supplier.phone,
    category: supplier.category,
    paymentTerms: supplier.paymentTerms,
    status: supplier.recordStatus,
    email: supplier.email ?? '',
    lead: supplier.leadTime ?? '',
    address: supplier.address ?? '',
    notes: supplier.notes ?? '',
    rating: supplier.rating != null ? String(supplier.rating) : '',
    imageUrl: supplier.imageUrl ?? '',
    imagePublicId: supplier.imagePublicId ?? '',
  };
}
