'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { SubmitBusyLabel, useSubmitGuard } from '@/hooks/use-submit-guard';
import {
  Banknote,
  Building2,
  Calendar,
  CircleDot,
  Clock,
  FileText,
  Flag,
  Flame,
  Image,
  Mail,
  Megaphone,
  MessageSquare,
  MapPin,
  Package,
  Phone,
  Save,
  User,
} from 'lucide-react';
import { FormHeader } from '@/components/layout/FormHeader';
import { MODULE_LIST_SHELL } from '@/lib/ui/module-layout';
import { useAppStore } from '@/lib/state/app-store';
import { FormSectionCard } from '@/components/modules/crm/customer-form/FormSectionCard';
import { IconInput, IconSelect, IconTextarea } from '@/components/modules/crm/customer-form/IconField';
import { DateInput } from '@/components/shared/DateInput';
import {
  CF_BTN_GHOST,
  CF_BTN_PRIMARY,
  CF_FIELD_ERROR_CLS,
  CF_FOOTER_CLS,
  CF_ICON_CLS,
  CF_INPUT_CLS,
  CF_INPUT_ERROR_CLS,
  CF_INPUT_WRAP_CLS,
  CF_LABEL_CLS,
} from '@/components/modules/crm/customer-form/customer-form-styles';
import {
  getAdCreativesForCampaign,
  LEAD_AD_CREATIVES,
  LEAD_CAMPAIGNS,
  LEAD_PRIORITY_OPTIONS,
  LEAD_SOURCE_OPTIONS,
  LEAD_STATUS_OPTIONS,
  PRODUCT_SERVICE_OPTIONS,
} from '@/components/modules/crm/lead-form/lead-form-options';
import {
  validateLeadForm,
  type LeadFormFieldError,
  type LeadFormValues,
} from '@/components/modules/crm/lead-form/lead-form-validation';

export type { LeadFormValues };

export type LeadFormPayload = {
  name: string;
  phone: string;
  alternativePhone: string;
  company: string;
  email: string;
  interestedProduct: string;
  customerRequirement: string;
  source: string;
  campaign: string;
  adCreative: string;
  assignedRepId: string;
  assignedRepName: string;
  status: string;
  priority: string;
  expectedValue: number;
  probability: number;
  nextFollowUpAt: string | null;
  location?: string;
  notes: string;
};

export const EMPTY_LEAD_FORM: LeadFormValues = {
  name: '',
  phone: '',
  alternativePhone: '',
  company: '',
  email: '',
  interestedProduct: '',
  customerRequirement: '',
  source: '',
  campaign: '',
  adCreative: '',
  assignedRepId: '',
  status: 'new',
  priority: 'warm',
  followUpDate: '',
  followUpTime: '',
  expectedValue: '',
  location: '',
  notes: '',
};

const LF_FIELD_GRID_CLS = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-3 gap-y-3';

export function splitFollowUpAt(iso: string | null | undefined): { date: string; time: string } {
  if (!iso) return { date: '', time: '' };
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    return { date: iso, time: '' };
  }
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return { date: '', time: '' };
  }
  const date = parsed.toISOString().slice(0, 10);
  const hours = String(parsed.getHours()).padStart(2, '0');
  const minutes = String(parsed.getMinutes()).padStart(2, '0');
  return { date, time: `${hours}:${minutes}` };
}

export function combineFollowUpAt(date: string, time: string): string | null {
  if (!date) return null;
  const normalizedTime = time || '09:00';
  const parsed = new Date(`${date}T${normalizedTime}:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

function toPayload(form: LeadFormValues, ownerName: string): LeadFormPayload {
  return {
    name: form.name.trim(),
    phone: form.phone.trim(),
    alternativePhone: form.alternativePhone.trim(),
    company: form.company.trim(),
    email: form.email.trim(),
    interestedProduct: form.interestedProduct.trim(),
    customerRequirement: form.customerRequirement.trim(),
    source: form.source.trim(),
    campaign: form.campaign.trim(),
    adCreative: form.adCreative.trim(),
    assignedRepId: form.assignedRepId,
    assignedRepName: ownerName,
    status: form.status,
    priority: form.priority,
    expectedValue: Number(form.expectedValue || 0),
    probability: 0,
    nextFollowUpAt: combineFollowUpAt(form.followUpDate, form.followUpTime),
    location: form.location.trim(),
    notes: form.notes.trim(),
  };
}

export function LeadForm({
  mode,
  initialValues,
  owners,
  onCancel,
  onSave,
}: {
  mode: 'create' | 'edit';
  initialValues: LeadFormValues;
  owners: Array<{ id: string; name: string }>;
  onCancel: () => void;
  onSave: (payload: LeadFormPayload) => boolean | Promise<boolean>;
}) {
  const t = useAppStore((s) => s.t);
  const [form, setForm] = useState<LeadFormValues>(initialValues);
  const [errors, setErrors] = useState<LeadFormFieldError>({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const { isSubmitting, guardSubmit, savingRef, holdAfterSuccess } = useSubmitGuard();

  useEffect(() => {
    setForm(initialValues);
    setErrors({});
  }, [initialValues]);

  useEffect(() => {
    if (!form.assignedRepId && owners[0]?.id) {
      setForm((prev) => ({ ...prev, assignedRepId: owners[0].id }));
    }
  }, [owners, form.assignedRepId]);

  const ownerName = owners.find((o) => o.id === form.assignedRepId)?.name ?? owners[0]?.name ?? '';
  const adOptions = form.campaign
    ? getAdCreativesForCampaign(form.campaign)
    : LEAD_AD_CREATIVES;

  const updateForm = (patch: Partial<LeadFormValues>) => {
    setForm((prev) => {
      const next = { ...prev, ...patch };
      if (patch.campaign !== undefined && patch.campaign !== prev.campaign) {
        next.adCreative = '';
      }
      return next;
    });
    const clearedKeys = Object.keys(patch) as Array<keyof LeadFormValues>;
    if (clearedKeys.length === 0) return;
    setErrors((prev) => {
      if (!Object.keys(prev).length) return prev;
      const next = { ...prev };
      clearedKeys.forEach((key) => {
        delete next[key];
      });
      return next;
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (savingRef.current) return;
    void guardSubmit(async () => {
      const nextErrors = validateLeadForm(form);
      const errorKeys = Object.keys(nextErrors) as Array<keyof LeadFormFieldError>;
      if (errorKeys.length > 0) {
        setErrors(nextErrors);
        const firstKey = errorKeys[0];
        document.getElementById(`lf-field-${String(firstKey)}`)?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
        return;
      }
      setErrors({});
      const ok = await Promise.resolve(onSave(toPayload(form, ownerName)));
      if (ok) holdAfterSuccess();
    });
  };

  return (
    <div className={MODULE_LIST_SHELL}>
      <form ref={formRef} onSubmit={handleSubmit} noValidate className="w-full flex flex-col min-h-full pb-4">
        <div className="pt-3 md:pt-4 mb-3">
          <FormHeader
            compact
            title={mode === 'edit' ? t('crm.edit_lead') : t('crm.create_lead')}
            subtitle={t('crm.leads_subtitle')}
            onBack={onCancel}
          />
        </div>

        <div className="flex flex-col gap-4 flex-1">
          <FormSectionCard number={1} title={t('crm.form_lead_info')} subtitle={t('crm.form_lead_info_sub')}>
            <div className={LF_FIELD_GRID_CLS}>
              <IconInput
                label={t('crm.form_lead_name')}
                icon={User}
                required
                fieldId="lf-field-name"
                error={errors.name}
                value={form.name}
                onChange={(e) => updateForm({ name: e.target.value })}
                placeholder="Enter full name"
              />
              <IconInput
                label={t('crm.form_phone')}
                icon={Phone}
                required
                type="tel"
                fieldId="lf-field-phone"
                error={errors.phone}
                value={form.phone}
                onChange={(e) => updateForm({ phone: e.target.value })}
                placeholder="01XXXXXXXXX"
              />
              <IconInput
                label={t('crm.form_alt_phone')}
                icon={Phone}
                type="tel"
                value={form.alternativePhone}
                onChange={(e) => updateForm({ alternativePhone: e.target.value })}
                placeholder="01XXXXXXXXX"
              />
              <IconInput
                label="Company / Business Name"
                icon={Building2}
                value={form.company}
                onChange={(e) => updateForm({ company: e.target.value })}
                placeholder="Enter company name (optional)"
              />
              <IconInput
                label={t('common.email')}
                icon={Mail}
                type="email"
                value={form.email}
                onChange={(e) => updateForm({ email: e.target.value })}
                placeholder="Enter email address"
              />
              <IconSelect
                label={t('crm.form_interested_product')}
                icon={Package}
                required
                fieldId="lf-field-interestedProduct"
                error={errors.interestedProduct}
                value={form.interestedProduct}
                onChange={(e) => updateForm({ interestedProduct: e.target.value })}
              >
                <option value="">Select product or service</option>
                {PRODUCT_SERVICE_OPTIONS.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </IconSelect>
            </div>
            <IconTextarea
              label={t('crm.form_requirement')}
              icon={MessageSquare}
              className="mt-3"
              rows={3}
              value={form.customerRequirement}
              onChange={(e) => updateForm({ customerRequirement: e.target.value })}
              placeholder="What is the customer looking for?"
            />
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setShowAdvanced((v) => !v)}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
              >
                {showAdvanced ? 'Hide Advanced Details' : 'Show Advanced Details'}
              </button>
              {showAdvanced ? (
                <div className="mt-3">
                  <IconInput
                    label="Location"
                    icon={MapPin}
                    value={form.location}
                    onChange={(e) => updateForm({ location: e.target.value })}
                    placeholder="Area, City (optional)"
                  />
                </div>
              ) : null}
            </div>
          </FormSectionCard>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
            <FormSectionCard number={2} title="Source & Assignment" subtitle="Where did the lead come from and who will follow up">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-3">
                <IconSelect
                  label={t('crm.form_lead_source')}
                  icon={Megaphone}
                  required
                  fieldId="lf-field-source"
                  error={errors.source}
                  value={form.source}
                  onChange={(e) => updateForm({ source: e.target.value })}
                  className="sm:col-span-2"
                >
                  <option value="">Select lead source</option>
                  {LEAD_SOURCE_OPTIONS.map((source) => (
                    <option key={source} value={source}>{source}</option>
                  ))}
                </IconSelect>
                <IconSelect
                  label="Campaign"
                  icon={Flag}
                  value={form.campaign}
                  onChange={(e) => updateForm({ campaign: e.target.value })}
                  className="sm:col-span-2"
                >
                  <option value="">Select campaign (optional)</option>
                  {LEAD_CAMPAIGNS.map((campaign) => (
                    <option key={campaign.id} value={campaign.id}>{campaign.label}</option>
                  ))}
                </IconSelect>
                <IconSelect
                  label="Ad / Creative"
                  icon={Image}
                  value={form.adCreative}
                  onChange={(e) => updateForm({ adCreative: e.target.value })}
                  className="sm:col-span-2"
                >
                  <option value="">Select ad or creative (optional)</option>
                  {adOptions.map((ad) => (
                    <option key={ad.id} value={ad.id}>{ad.label}</option>
                  ))}
                </IconSelect>
                <IconSelect
                  label={t('crm.form_assigned_to')}
                  icon={User}
                  required
                  fieldId="lf-field-assignedRepId"
                  error={errors.assignedRepId}
                  value={form.assignedRepId}
                  onChange={(e) => updateForm({ assignedRepId: e.target.value })}
                  className="sm:col-span-2"
                >
                  <option value="">Select sales person</option>
                  {owners.map((owner) => (
                    <option key={owner.id} value={owner.id}>{owner.name}</option>
                  ))}
                </IconSelect>
              </div>
            </FormSectionCard>

            <FormSectionCard number={3} title="Follow-up Information" subtitle="Lead status, priority, follow-up and deal information">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-3">
                <IconSelect
                  label={t('crm.form_lead_status')}
                  icon={CircleDot}
                  required
                  fieldId="lf-field-status"
                  error={errors.status}
                  value={form.status}
                  onChange={(e) => updateForm({ status: e.target.value })}
                >
                  {LEAD_STATUS_OPTIONS.map((status) => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </IconSelect>
                <IconSelect
                  label="Priority"
                  icon={Flame}
                  value={form.priority}
                  onChange={(e) => updateForm({ priority: e.target.value })}
                >
                  {LEAD_PRIORITY_OPTIONS.map((priority) => (
                    <option key={priority.value} value={priority.value}>{priority.label}</option>
                  ))}
                </IconSelect>
                <div className="sm:col-span-2">
                  <label className={CF_LABEL_CLS}>
                    Next Follow-up
                    <span className="text-rose-500 normal-case"> *</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-3">
                    <div id="lf-field-followUpDate">
                      <div className={CF_INPUT_WRAP_CLS}>
                        <Calendar className={CF_ICON_CLS} />
                        <DateInput
                          aria-label="Follow-up date"
                          className={`${CF_INPUT_CLS}${errors.followUpDate ? ` ${CF_INPUT_ERROR_CLS}` : ''}`}
                          value={form.followUpDate}
                          onChange={(followUpDate) => updateForm({ followUpDate })}
                        />
                      </div>
                      {errors.followUpDate ? <p className={CF_FIELD_ERROR_CLS}>{errors.followUpDate}</p> : null}
                    </div>
                    <div id="lf-field-followUpTime">
                      <div className={CF_INPUT_WRAP_CLS}>
                        <Clock className={CF_ICON_CLS} />
                        <input
                          type="time"
                          aria-label="Follow-up time"
                          className={`${CF_INPUT_CLS}${errors.followUpTime ? ` ${CF_INPUT_ERROR_CLS}` : ''}`}
                          value={form.followUpTime}
                          onChange={(e) => updateForm({ followUpTime: e.target.value })}
                        />
                      </div>
                      {errors.followUpTime ? <p className={CF_FIELD_ERROR_CLS}>{errors.followUpTime}</p> : null}
                    </div>
                  </div>
                </div>
                <IconInput
                  label={t('crm.form_estimated_value')}
                  icon={Banknote}
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.expectedValue}
                  onChange={(e) => updateForm({ expectedValue: e.target.value })}
                  placeholder="Enter estimated deal value"
                  className="sm:col-span-2"
                />
                <IconTextarea
                  label={t('crm.form_notes')}
                  icon={FileText}
                  rows={3}
                  value={form.notes}
                  onChange={(e) => updateForm({ notes: e.target.value })}
                  placeholder="Add any notes about this lead..."
                  className="sm:col-span-2"
                />
              </div>
            </FormSectionCard>
          </div>
        </div>

        <div className={CF_FOOTER_CLS}>
          <button type="button" onClick={onCancel} className={CF_BTN_GHOST}>
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
            className={`${CF_BTN_PRIMARY} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Save className="w-4 h-4" />
            <SubmitBusyLabel busy={isSubmitting} idle="Save Lead" />
          </button>
        </div>
      </form>
    </div>
  );
}
