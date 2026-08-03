'use client';

import { useState } from 'react';
import { FormHeader } from '@/components/layout/FormHeader';
import { Footer } from '@/components/layout/Footer';
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
};

const CATEGORY_OPTIONS = ['Raw Materials', 'Chemicals', 'Packaging', 'Components', 'Metals', 'Electronics', 'Hardware', 'General'];
const TERMS_OPTIONS = ['Net 30', 'Net 15', 'Cash', 'Net 45'];
const STATUS_OPTIONS = ['active', 'inactive', 'credit-hold'];

const INPUT_CLS = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400';
const LABEL_CLS = 'text-xs font-bold text-slate-700';

export function SupplierForm({
  mode,
  initialValues,
  onCancel,
  onSave,
}: {
  mode: 'create' | 'edit';
  initialValues: SupplierFormValues;
  onCancel: () => void;
  onSave: (values: SupplierFormValues) => void;
}) {
  const [values, setValues] = useState<SupplierFormValues>(initialValues);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const update = (patch: Partial<SupplierFormValues>) => setValues((prev) => ({ ...prev, ...patch }));

  return (
    <div className={MODULE_LIST_SHELL}>
      <FormHeader
        title={mode === 'create' ? 'Add Supplier' : 'Edit Supplier'}
        subtitle={mode === 'create' ? 'Create a new vendor profile for purchases and payments.' : 'Update supplier details and payment terms.'}
        onBack={onCancel}
        backLabel="Back to Suppliers"
      />

      <form
        className="bg-white rounded-2xl border border-slate-200 p-6 premium-shadow space-y-5 max-w-3xl"
        onSubmit={(e) => {
          e.preventDefault();
          onSave(values);
        }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block space-y-1 sm:col-span-2">
            <span className={LABEL_CLS}>Supplier Name *</span>
            <input type="text" required value={values.name} onChange={(e) => update({ name: e.target.value })} className={INPUT_CLS} />
          </label>
          <label className="block space-y-1">
            <span className={LABEL_CLS}>Contact Person *</span>
            <input type="text" required value={values.contact} onChange={(e) => update({ contact: e.target.value })} className={INPUT_CLS} />
          </label>
          <label className="block space-y-1">
            <span className={LABEL_CLS}>Phone *</span>
            <input type="text" required value={values.phone} onChange={(e) => update({ phone: e.target.value })} className={INPUT_CLS} />
          </label>
          <label className="block space-y-1">
            <span className={LABEL_CLS}>Category</span>
            <select value={values.category} onChange={(e) => update({ category: e.target.value })} className={`${INPUT_CLS} cursor-pointer`}>
              {CATEGORY_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </label>
          <label className="block space-y-1">
            <span className={LABEL_CLS}>Payment Terms</span>
            <select value={values.paymentTerms} onChange={(e) => update({ paymentTerms: e.target.value })} className={`${INPUT_CLS} cursor-pointer`}>
              {TERMS_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </label>
          <label className="block space-y-1">
            <span className={LABEL_CLS}>Status</span>
            <select value={values.status} onChange={(e) => update({ status: e.target.value })} className={`${INPUT_CLS} cursor-pointer`}>
              {STATUS_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </label>
        </div>

        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
        >
          {showAdvanced ? 'Hide Advanced Details' : 'Show Advanced Details'}
        </button>

        {showAdvanced && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <label className="block space-y-1">
              <span className={LABEL_CLS}>Email</span>
              <input type="email" value={values.email} onChange={(e) => update({ email: e.target.value })} className={INPUT_CLS} />
            </label>
            <label className="block space-y-1">
              <span className={LABEL_CLS}>Lead Time</span>
              <input type="text" value={values.lead} onChange={(e) => update({ lead: e.target.value })} placeholder="e.g. 5–7 days" className={INPUT_CLS} />
            </label>
            <label className="block space-y-1">
              <span className={LABEL_CLS}>Rating (1–5)</span>
              <input type="number" min="1" max="5" value={values.rating} onChange={(e) => update({ rating: e.target.value })} className={INPUT_CLS} />
            </label>
            <label className="block space-y-1 sm:col-span-2">
              <span className={LABEL_CLS}>Address</span>
              <textarea value={values.address} onChange={(e) => update({ address: e.target.value })} rows={2} className={INPUT_CLS} />
            </label>
            <label className="block space-y-1 sm:col-span-2">
              <span className={LABEL_CLS}>Notes</span>
              <textarea value={values.notes} onChange={(e) => update({ notes: e.target.value })} rows={3} className={INPUT_CLS} />
            </label>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
          <button type="button" onClick={onCancel} className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer">
            Cancel
          </button>
          <button type="submit" className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer">
            {mode === 'create' ? 'Save Supplier' : 'Update Supplier'}
          </button>
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
  };
}
