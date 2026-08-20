'use client';

import { useMemo, useRef, useState, type FormEvent } from 'react';
import { Save } from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { FormHeader } from '@/components/layout/FormHeader';
import { ImageUploadField, type PendingImageUpload } from '@/components/shared/ImageUploadField';
import { SubmitBusyLabel, useSubmitGuard } from '@/hooks/use-submit-guard';
import { MODULE_LIST_SHELL } from '@/lib/ui/module-layout';
import {
  FORM_BTN_PRIMARY,
  FORM_BTN_SECONDARY,
  FORM_CARD_CLS,
  FORM_GRID_CLS,
  FORM_INPUT_CLS,
  FORM_LABEL_CLS,
  FORM_SELECT_CLS,
  FORM_TEXTAREA_CLS,
} from '@/lib/ui/form-styles';
import { COMPLAINT_CATEGORIES, COMPLAINT_PRIORITIES } from '@/lib/services/complaints-service';

export type ComplaintFormValues = {
  customerId: string;
  customerName: string;
  customerPhone: string;
  subject: string;
  category: string;
  priority: string;
  sku: string;
  description: string;
  evidenceImageUrl: string;
  evidenceImagePublicId: string;
  slaDueAt: string;
};

export const EMPTY_COMPLAINT_FORM: ComplaintFormValues = {
  customerId: '',
  customerName: '',
  customerPhone: '',
  subject: '',
  category: 'product-quality',
  priority: 'medium',
  sku: '',
  description: '',
  evidenceImageUrl: '',
  evidenceImagePublicId: '',
  slaDueAt: '',
};

export function ComplaintForm({
  customers,
  initialValues,
  mode,
  onCancel,
  onSubmit,
}: {
  customers: { id: string; name: string; phone?: string }[];
  initialValues: ComplaintFormValues;
  mode: 'create' | 'edit';
  onCancel: () => void;
  onSubmit: (
    values: ComplaintFormValues,
    pendingImageUpload?: Promise<PendingImageUpload | null> | null,
  ) => boolean | Promise<boolean>;
}) {
  const [values, setValues] = useState(initialValues);
  const pendingImageUploadRef = useRef<Promise<PendingImageUpload | null> | null>(null);
  const { isSubmitting, guardSubmit, savingRef, holdAfterSuccess } = useSubmitGuard();

  const customerOptions = useMemo(
    () => [{ id: 'walk-in', name: 'Walk-in Customer' }, ...customers],
    [customers],
  );

  const handleCustomerChange = (customerId: string) => {
    const customer = customerOptions.find((c) => c.id === customerId);
    setValues((prev) => ({
      ...prev,
      customerId,
      customerName: customer?.name ?? prev.customerName,
      customerPhone: customer?.phone ?? prev.customerPhone,
    }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (savingRef.current) return;
    void guardSubmit(async () => {
      const ok = await Promise.resolve(onSubmit(values, pendingImageUploadRef.current));
      if (ok) holdAfterSuccess();
    });
  };

  return (
    <div className={MODULE_LIST_SHELL}>
      <form onSubmit={handleSubmit} noValidate className="w-full flex flex-col min-h-full pb-4">
        <div className="pt-3 md:pt-4 mb-3">
          <FormHeader
            compact
            title={mode === 'edit' ? 'Edit Complaint' : 'New Complaint'}
            subtitle="Log customer complaint details for tracking and resolution."
            onBack={onCancel}
          />
        </div>

        <div className={FORM_CARD_CLS}>
          <div className={FORM_GRID_CLS}>
            <div>
              <label className={FORM_LABEL_CLS} htmlFor="complaint-customer">Customer</label>
              <select
                id="complaint-customer"
                value={values.customerId || 'walk-in'}
                onChange={(e) => handleCustomerChange(e.target.value)}
                className={FORM_SELECT_CLS}
              >
                {customerOptions.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={FORM_LABEL_CLS} htmlFor="complaint-phone">Phone</label>
              <input
                id="complaint-phone"
                value={values.customerPhone}
                onChange={(e) => setValues({ ...values, customerPhone: e.target.value })}
                className={FORM_INPUT_CLS}
                placeholder="01XXXXXXXXX"
              />
            </div>
            <div className="md:col-span-2">
              <label className={FORM_LABEL_CLS} htmlFor="complaint-subject">Subject</label>
              <input
                id="complaint-subject"
                required
                value={values.subject}
                onChange={(e) => setValues({ ...values, subject: e.target.value })}
                className={FORM_INPUT_CLS}
                placeholder="Brief complaint subject"
              />
            </div>
            <div>
              <label className={FORM_LABEL_CLS} htmlFor="complaint-category">Category</label>
              <select
                id="complaint-category"
                value={values.category}
                onChange={(e) => setValues({ ...values, category: e.target.value })}
                className={FORM_SELECT_CLS}
              >
                {COMPLAINT_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={FORM_LABEL_CLS} htmlFor="complaint-priority">Priority</label>
              <select
                id="complaint-priority"
                value={values.priority}
                onChange={(e) => setValues({ ...values, priority: e.target.value })}
                className={FORM_SELECT_CLS}
              >
                {COMPLAINT_PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={FORM_LABEL_CLS} htmlFor="complaint-sku">Product SKU</label>
              <input
                id="complaint-sku"
                value={values.sku}
                onChange={(e) => setValues({ ...values, sku: e.target.value })}
                className={FORM_INPUT_CLS}
                placeholder="Optional SKU"
              />
            </div>
            <div>
              <label className={FORM_LABEL_CLS} htmlFor="complaint-due">Due Date</label>
              <input
                id="complaint-due"
                type="date"
                value={values.slaDueAt}
                onChange={(e) => setValues({ ...values, slaDueAt: e.target.value })}
                className={FORM_INPUT_CLS}
              />
            </div>
            <div className="md:col-span-2">
              <label className={FORM_LABEL_CLS} htmlFor="complaint-description">Description</label>
              <textarea
                id="complaint-description"
                value={values.description}
                onChange={(e) => setValues({ ...values, description: e.target.value })}
                className={FORM_TEXTAREA_CLS}
                placeholder="Describe the complaint in detail..."
              />
            </div>
            <div className="md:col-span-2">
              <ImageUploadField
                label="Evidence Image (Optional)"
                value={values.evidenceImageUrl}
                onChange={(url, publicId) => setValues({
                  ...values,
                  evidenceImageUrl: url,
                  evidenceImagePublicId: publicId ?? '',
                })}
                onPendingUpload={(promise) => {
                  pendingImageUploadRef.current = promise;
                }}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" onClick={onCancel} variant="outline">Cancel</Button>
            <Button
              type="submit"
              loading={isSubmitting}
              variant="primary"
              leftIcon={<Save className="w-4 h-4" />}
            >
              {mode === 'edit' ? 'Update Complaint' : 'Save Complaint'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
