'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useSubmitGuard } from '@/hooks/use-submit-guard';
import {
  Building2,
  Calendar,
  CircleDot,
  CreditCard,
  FileText,
  Mail,
  NotebookPen,
  Phone,
  Shield,
  Tag,
  User,
  UserPlus,
  Users,
  Wallet,
} from 'lucide-react';
import { FormHeader } from '@/components/layout/FormHeader';
import { MODULE_LIST_SHELL } from '@/lib/ui/module-layout';
import { FormSectionCard } from '@/components/modules/crm/customer-form/FormSectionCard';
import { AddressPanel } from '@/components/modules/crm/customer-form/AddressPanel';
import { CustomerFormSubPanel } from '@/components/modules/crm/customer-form/CustomerFormSubPanel';
import { IconInput, IconSelect } from '@/components/modules/crm/customer-form/IconField';
import { QuickTipBanner } from '@/components/modules/crm/customer-form/QuickTipBanner';
import {
  CustomerFormFooter,
  useCustomerSaveAction,
  type CustomerSaveAction,
} from '@/components/modules/crm/customer-form/CustomerFormFooter';
import { CF_LABEL_CLS, CF_SELECT_CLS } from '@/components/modules/crm/customer-form/customer-form-styles';
import {
  validateCustomerForm,
  getBillingAddressErrors,
  getShippingAddressErrors,
  type CustomerFormFieldError,
} from '@/components/modules/crm/customer-form/customer-form-validation';
import { ImageUploadField, type PendingImageUpload } from '@/components/shared/ImageUploadField';

export type CustomerFormValues = {
  companyName: string;
  customerType: string;
  contactPerson: string;
  altPhone: string;
  mobile: string;
  status: string;
  email: string;
  imageUrl: string;
  imagePublicId: string;
  billingAddress: string;
  billingArea: string;
  billingCity: string;
  billingDistrict: string;
  shippingAddress: string;
  shippingArea: string;
  shippingCity: string;
  shippingDistrict: string;
  sameAsBilling: boolean;
  binVat: string;
  tin: string;
  tradeLicense: string;
  businessReg: string;
  openingBalance: string;
  creditLimit: string;
  paymentTerms: string;
  priceLevel: string;
  ownerId: string;
  notes: string;
};

export type CustomerFormPayload = {
  company: string;
  name: string;
  contactName: string;
  companyType: string;
  phone: string;
  alternativePhone: string;
  email: string;
  status: string;
  imageUrl: string;
  imagePublicId: string;
  taxVatNumber: string;
  tinNumber: string;
  tradeLicenseNumber: string;
  businessRegistrationNo: string;
  openingBalance: number;
  creditLimit: string;
  paymentTerms: string;
  pricingTier: string;
  ownerId: string;
  ownerName: string;
  billingAddress: string;
  billingArea: string;
  billingCity: string;
  billingRegion: string;
  shippingAddress: string;
  shippingArea: string;
  shippingCity: string;
  shippingRegion: string;
  notes: string;
};

export const EMPTY_CUSTOMER_FORM: CustomerFormValues = {
  companyName: '',
  customerType: '',
  contactPerson: '',
  altPhone: '',
  mobile: '',
  status: 'active',
  email: '',
  imageUrl: '',
  imagePublicId: '',
  billingAddress: '',
  billingArea: '',
  billingCity: '',
  billingDistrict: '',
  shippingAddress: '',
  shippingArea: '',
  shippingCity: '',
  shippingDistrict: '',
  sameAsBilling: true,
  binVat: '',
  tin: '',
  tradeLicense: '',
  businessReg: '',
  openingBalance: '0',
  creditLimit: '0',
  paymentTerms: '',
  priceLevel: 'Standard',
  ownerId: '',
  notes: '',
};

const CUSTOMER_TYPES = ['Retailer', 'Wholesaler', 'Distributor', 'Manufacturer', 'Corporate'];
const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'credit-hold', label: 'Credit Hold' },
];
export const PAYMENT_TERM_OPTIONS = [
  { value: 'Cash', label: 'Cash' },
  { value: 'Cash on Delivery', label: 'Cash on Delivery' },
  { value: 'Advance Payment', label: 'Advance Payment' },
  { value: 'Credit 7 Days', label: 'Credit 7 Days' },
  { value: 'Credit 15 Days', label: 'Credit 15 Days' },
  { value: 'Credit 30 Days', label: 'Credit 30 Days' },
  { value: 'Credit 45 Days', label: 'Credit 45 Days' },
  { value: 'Credit 60 Days', label: 'Credit 60 Days' },
  { value: 'Credit 90 Days', label: 'Credit 90 Days' },
] as const;

const PAYMENT_TERM_VALUES = new Set(PAYMENT_TERM_OPTIONS.map((t) => t.value));

export function normalizePaymentTerms(terms: string): string {
  const map: Record<string, string> = {
    'Net 7': 'Credit 7 Days',
    'Net 15': 'Credit 15 Days',
    'Net 30': 'Credit 30 Days',
    'Net 45': 'Credit 45 Days',
    'Net 60': 'Credit 60 Days',
  };
  return map[terms] ?? terms;
}
const PRICE_LEVELS = ['Standard', 'Wholesale', 'Enterprise'];

const CF_FIELD_GRID_CLS = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-3 gap-y-3';

function toPayload(form: CustomerFormValues, ownerName: string): CustomerFormPayload {
  return {
    company: form.companyName,
    name: form.contactPerson || form.companyName,
    contactName: form.contactPerson,
    companyType: form.customerType,
    phone: form.mobile,
    alternativePhone: form.altPhone,
    email: form.email,
    status: form.status,
    imageUrl: form.imageUrl,
    imagePublicId: form.imagePublicId,
    taxVatNumber: form.binVat,
    tinNumber: form.tin,
    tradeLicenseNumber: form.tradeLicense,
    businessRegistrationNo: form.businessReg,
    openingBalance: Number(form.openingBalance || 0),
    creditLimit: form.creditLimit,
    paymentTerms: form.paymentTerms,
    pricingTier: form.priceLevel,
    ownerId: form.ownerId,
    ownerName,
    billingAddress: form.billingAddress,
    billingArea: form.billingArea,
    billingCity: form.billingCity,
    billingRegion: form.billingDistrict,
    shippingAddress: form.sameAsBilling ? form.billingAddress : form.shippingAddress,
    shippingArea: form.sameAsBilling ? form.billingArea : form.shippingArea,
    shippingCity: form.sameAsBilling ? form.billingCity : form.shippingCity,
    shippingRegion: form.sameAsBilling ? form.billingDistrict : form.shippingDistrict,
    notes: form.notes,
  };
}

export function CustomerForm({
  mode,
  initialValues,
  owners,
  onCancel,
  onSave,
}: {
  mode: 'create' | 'edit';
  initialValues: CustomerFormValues;
  owners: Array<{ id: string; name: string }>;
  onCancel: () => void;
  onSave: (
    payload: CustomerFormPayload,
    action: CustomerSaveAction,
    pendingImageUpload?: Promise<PendingImageUpload | null> | null,
  ) => boolean | Promise<boolean>;
}) {
  const [form, setForm] = useState<CustomerFormValues>(initialValues);
  const [errors, setErrors] = useState<CustomerFormFieldError>({});
  const formRef = useRef<HTMLFormElement>(null);
  const pendingImageUploadRef = useRef<Promise<PendingImageUpload | null> | null>(null);
  const { setSaveAction, readSaveAction } = useCustomerSaveAction();
  const { isSubmitting, guardSubmit, savingRef, holdAfterSuccess } = useSubmitGuard();

  useEffect(() => {
    setForm(initialValues);
    setErrors({});
  }, [initialValues]);

  useEffect(() => {
    if (!form.ownerId && owners[0]?.id) {
      setForm((prev) => ({ ...prev, ownerId: owners[0].id }));
    }
  }, [owners, form.ownerId]);

  const ownerName = owners.find((o) => o.id === form.ownerId)?.name ?? owners[0]?.name ?? '';
  const legacyPaymentTerm =
    form.paymentTerms && !PAYMENT_TERM_VALUES.has(form.paymentTerms as typeof PAYMENT_TERM_OPTIONS[number]['value'])
      ? form.paymentTerms
      : null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (savingRef.current) return;
    void guardSubmit(async () => {
      const nextErrors = validateCustomerForm(form);
      const errorKeys = Object.keys(nextErrors) as Array<keyof CustomerFormFieldError>;
      if (errorKeys.length > 0) {
        setErrors(nextErrors);
        const firstKey = errorKeys[0];
        document.getElementById(`cf-field-${String(firstKey)}`)?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
        return;
      }
      setErrors({});
      const ok = await Promise.resolve(onSave(toPayload(form, ownerName), readSaveAction(), pendingImageUploadRef.current));
      if (ok) holdAfterSuccess();
    });
  };

  const syncShippingFromBilling = (next: CustomerFormValues) => {
    if (!next.sameAsBilling) return next;
    return {
      ...next,
      shippingAddress: next.billingAddress,
      shippingArea: next.billingArea,
      shippingCity: next.billingCity,
      shippingDistrict: next.billingDistrict,
    };
  };

  const updateForm = (patch: Partial<CustomerFormValues>) => {
    setForm((prev) => syncShippingFromBilling({ ...prev, ...patch }));
    const clearedKeys = Object.keys(patch) as Array<keyof CustomerFormValues>;
    if (clearedKeys.length === 0) return;
    setErrors((prev) => {
      if (!Object.keys(prev).length) return prev;
      const next = { ...prev };
      clearedKeys.forEach((key) => {
        delete next[key];
      });
      if (patch.sameAsBilling === true && next.shippingAddress) {
        delete next.shippingAddress;
      }
      return next;
    });
  };

  return (
    <div className={MODULE_LIST_SHELL}>
      <form ref={formRef} onSubmit={handleSubmit} noValidate className="w-full flex flex-col min-h-full pb-4">
        <div className="pt-3 md:pt-4 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 mb-3">
          <FormHeader
            compact
            title={mode === 'edit' ? 'Edit Customer' : 'Add Customer'}
            subtitle="Create a new customer and manage their business information."
            onBack={onCancel}
          />
          <QuickTipBanner />
        </div>

        <div className="flex flex-col gap-3 flex-1">
          <FormSectionCard number={1} title="Basic Information" subtitle="Primary details about the customer">
            <div className={CF_FIELD_GRID_CLS}>
              <IconInput
                label="Customer / Company Name"
                icon={Building2}
                required
                fieldId="cf-field-companyName"
                error={errors.companyName}
                value={form.companyName}
                onChange={(e) => updateForm({ companyName: e.target.value })}
                placeholder="Enter company name"
              />
              <IconSelect
                label="Customer Type"
                icon={Users}
                required
                fieldId="cf-field-customerType"
                error={errors.customerType}
                value={form.customerType}
                onChange={(e) => updateForm({ customerType: e.target.value })}
              >
                <option value="">Select customer type</option>
                {CUSTOMER_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </IconSelect>
              <IconInput
                label="Contact Person"
                icon={User}
                required
                fieldId="cf-field-contactPerson"
                error={errors.contactPerson}
                value={form.contactPerson}
                onChange={(e) => updateForm({ contactPerson: e.target.value })}
                placeholder="Primary contact name"
              />
              <IconInput
                label="Mobile Number"
                icon={Phone}
                required
                fieldId="cf-field-mobile"
                error={errors.mobile}
                type="tel"
                value={form.mobile}
                onChange={(e) => updateForm({ mobile: e.target.value })}
                placeholder="01XXXXXXXXX"
              />
              <IconInput
                label="Alternative Phone"
                icon={Phone}
                type="tel"
                value={form.altPhone}
                onChange={(e) => updateForm({ altPhone: e.target.value })}
                placeholder="01XXXXXXXXX"
              />
              <div>
                <label className={CF_LABEL_CLS}>Status</label>
                <div className="relative flex items-center">
                  <CircleDot className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500 pointer-events-none" />
                  <select
                    value={form.status}
                    onChange={(e) => updateForm({ status: e.target.value })}
                    className={`${CF_SELECT_CLS} pl-10`}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <IconInput
                label="Email"
                icon={Mail}
                type="email"
                className="xl:col-span-2"
                value={form.email}
                onChange={(e) => updateForm({ email: e.target.value })}
                placeholder="email@example.com"
              />
              <div className="sm:col-span-2 lg:col-span-3 xl:col-span-4">
                <ImageUploadField
                  label="Customer Photo"
                  value={form.imageUrl}
                  onChange={(url, publicId) => updateForm({ imageUrl: url, imagePublicId: publicId ?? '' })}
                  onPendingUpload={(promise) => {
                    pendingImageUploadRef.current = promise;
                  }}
                />
              </div>
            </div>
          </FormSectionCard>

          <FormSectionCard number={2} title="Address Information" subtitle="Billing and delivery address details." className="min-h-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-stretch">
              <AddressPanel
                variant="billing"
                fieldIdPrefix="billing"
                errors={getBillingAddressErrors(errors)}
                values={{
                  line1: form.billingAddress,
                  area: form.billingArea,
                  city: form.billingCity,
                  district: form.billingDistrict,
                }}
                onChange={(patch) => updateForm({
                  ...(patch.line1 !== undefined ? { billingAddress: patch.line1 } : {}),
                  ...(patch.area !== undefined ? { billingArea: patch.area } : {}),
                  ...(patch.city !== undefined ? { billingCity: patch.city } : {}),
                  ...(patch.district !== undefined ? { billingDistrict: patch.district } : {}),
                })}
              />
              <AddressPanel
                variant="delivery"
                fieldIdPrefix="shipping"
                errors={getShippingAddressErrors(errors)}
                values={{
                  line1: form.shippingAddress,
                  area: form.shippingArea,
                  city: form.shippingCity,
                  district: form.shippingDistrict,
                }}
                onChange={(patch) => updateForm({
                  ...(patch.line1 !== undefined ? { shippingAddress: patch.line1 } : {}),
                  ...(patch.area !== undefined ? { shippingArea: patch.area } : {}),
                  ...(patch.city !== undefined ? { shippingCity: patch.city } : {}),
                  ...(patch.district !== undefined ? { shippingDistrict: patch.district } : {}),
                })}
                disabled={form.sameAsBilling}
                sameAsBilling={form.sameAsBilling}
                onSameAsBillingChange={(checked) => updateForm({ sameAsBilling: checked })}
              />
            </div>
          </FormSectionCard>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">
            <FormSectionCard number={3} title="Business & Tax Information" subtitle="Business registration and tax details">
              <CustomerFormSubPanel title="Business & Tax" icon={Shield}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-3">
                  <IconInput
                    label="BIN / VAT Number"
                    icon={CreditCard}
                    value={form.binVat}
                    onChange={(e) => updateForm({ binVat: e.target.value })}
                    placeholder="Enter BIN or VAT number"
                  />
                  <IconInput
                    label="TIN Number"
                    icon={FileText}
                    value={form.tin}
                    onChange={(e) => updateForm({ tin: e.target.value })}
                    placeholder="Enter TIN number"
                  />
                  <IconInput
                    label="Trade License No."
                    icon={FileText}
                    value={form.tradeLicense}
                    onChange={(e) => updateForm({ tradeLicense: e.target.value })}
                    placeholder="Enter trade license number"
                  />
                  <IconInput
                    label="Business Registration No."
                    icon={Shield}
                    value={form.businessReg}
                    onChange={(e) => updateForm({ businessReg: e.target.value })}
                    placeholder="Enter registration number"
                  />
                </div>
              </CustomerFormSubPanel>
            </FormSectionCard>

            <FormSectionCard number={4} title="Commercial Information" subtitle="Credit, payment and sales details">
              <CustomerFormSubPanel title="Commercial" icon={Wallet}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-3">
                  <IconInput
                    label="Opening Balance (৳)"
                    icon={Wallet}
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.openingBalance}
                    onChange={(e) => updateForm({ openingBalance: e.target.value })}
                  />
                  <IconInput
                    label="Credit Limit (৳)"
                    icon={CreditCard}
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.creditLimit}
                    onChange={(e) => updateForm({ creditLimit: e.target.value })}
                  />
                  <IconSelect
                    label="Payment Terms"
                    icon={Calendar}
                    required
                    fieldId="cf-field-paymentTerms"
                    error={errors.paymentTerms}
                    value={form.paymentTerms}
                    onChange={(e) => updateForm({ paymentTerms: e.target.value })}
                  >
                    <option value="">Select payment terms</option>
                    {legacyPaymentTerm ? (
                      <option value={legacyPaymentTerm}>{legacyPaymentTerm}</option>
                    ) : null}
                    {PAYMENT_TERM_OPTIONS.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </IconSelect>
                  <IconSelect
                    label="Price Level"
                    icon={Tag}
                    value={form.priceLevel}
                    onChange={(e) => updateForm({ priceLevel: e.target.value })}
                  >
                    {PRICE_LEVELS.map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </IconSelect>
                  <IconSelect
                    label="Assigned Sales Person"
                    icon={UserPlus}
                    value={form.ownerId}
                    onChange={(e) => updateForm({ ownerId: e.target.value })}
                  >
                    {owners.map((o) => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </IconSelect>
                  <IconInput
                    label="Notes"
                    icon={NotebookPen}
                    value={form.notes}
                    onChange={(e) => updateForm({ notes: e.target.value })}
                    placeholder="Additional notes..."
                  />
                </div>
              </CustomerFormSubPanel>
            </FormSectionCard>
          </div>
        </div>

        <CustomerFormFooter
          onCancel={onCancel}
          onSaveAndAdd={() => {
            if (savingRef.current) return;
            setSaveAction('save-and-add');
            formRef.current?.requestSubmit();
          }}
          submitLabel={mode === 'edit' ? 'Update Customer' : 'Save Customer'}
          isSubmitting={isSubmitting}
        />
      </form>
    </div>
  );
}
