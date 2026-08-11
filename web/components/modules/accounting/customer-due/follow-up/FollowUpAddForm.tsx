'use client';

import { useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import type { CustomerReceivable } from '@/lib/services/customer-receivables-service';
import { getCustomerContacts } from '@/lib/services/crm-service';
import { listEmployees } from '@/lib/services/hrm-service';
import { useAppStore } from '@/lib/state/app-store';
import { FollowUpFormSection } from './FollowUpFormSection';
import { FollowUpFormStepper } from './FollowUpFormStepper';
import {
  CharCountTextarea,
  ContactMethodPills,
  CustomerReadOnlyCard,
  FileUploadZone,
  FormFieldLabel,
  FU_FORM_INPUT_CLS,
  OutcomeGrid,
  StaffSelect,
  ToggleSwitch,
} from './FollowUpFormFields';
import {
  buildFollowUpContactOptions,
  defaultFollowUpContactPerson,
} from './follow-up-contact-options';
import type { FollowUpFormValues, StaffOption } from './follow-up-form-types';
import { FU_BTN_OUTLINE, FU_BTN_PRIMARY, FU_CARD_CLS } from './follow-up-styles';
import { DateInput } from '@/components/shared/DateInput';

function defaultContactTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function buildDefaultForm(
  customer: CustomerReceivable,
  contacts: Array<{ name?: string; designation?: string; primary?: boolean }>,
  staff: StaffOption[],
): FollowUpFormValues {
  const today = new Date().toISOString().slice(0, 10);
  const defaultStaff = customer.assignedTo?.name ?? staff[0]?.name ?? '';
  const contactOptions = buildFollowUpContactOptions(contacts, customer.name);
  const contactPerson = defaultFollowUpContactPerson(contactOptions) || customer.name;
  return {
    contactPerson,
    contactMethod: 'call',
    contactDate: today,
    contactTime: defaultContactTime(),
    assignedTo: defaultStaff,
    outcome: 'no_answer',
    notes: '',
    scheduleNext: true,
    nextDate: today,
    nextTime: '14:00',
    nextAssignedTo: defaultStaff,
    reminder: '15',
    nextNote: '',
    promiseAmount: '',
    expectedPaymentDate: '',
    attachmentName: '',
    attachmentUrl: '',
  };
}

export function FollowUpAddForm({
  customer,
  onBack,
  onSave,
}: {
  customer: CustomerReceivable;
  onBack: () => void;
  onSave: (values: FollowUpFormValues) => void;
}) {
  const appState = useAppStore((s) => s.appState);

  const contacts = useMemo(
    () => getCustomerContacts(appState, customer.customerId) as Array<{ name?: string; designation?: string; primary?: boolean }>,
    [appState, customer.customerId],
  );

  const staffOptions = useMemo<StaffOption[]>(() => {
    const fromEmployees = listEmployees(appState)
      .filter((e) => e.department === 'Sales' || !e.department)
      .map((e) => {
        const name = String(e.name ?? '');
        const parts = name.split(/\s+/).filter(Boolean);
        return {
          id: String(e.id),
          name,
          initials: parts.slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('') || '?',
        };
      });
    if (customer.assignedTo && !fromEmployees.some((e) => e.name === customer.assignedTo?.name)) {
      fromEmployees.unshift({
        id: customer.assignedTo.id,
        name: customer.assignedTo.name,
        initials: customer.assignedTo.initials,
      });
    }
    return fromEmployees.length > 0 ? fromEmployees : [{ id: 'staff-default', name: 'Rahim Ahmed', initials: 'RA' }];
  }, [appState, customer.assignedTo]);

  const contactOptions = useMemo(
    () => buildFollowUpContactOptions(contacts, customer.name),
    [contacts, customer.name],
  );

  const [form, setForm] = useState<FollowUpFormValues>(() => buildDefaultForm(customer, contacts, staffOptions));
  const update = (patch: Partial<FollowUpFormValues>) => setForm((prev) => ({ ...prev, ...patch }));

  return (
    <div className="space-y-4 min-w-0">
      <div className={`${FU_CARD_CLS} p-4 space-y-3`}>
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">Add Follow-up</h2>
          <p className="text-xs text-slate-500 mt-0.5">Record communication and follow-up with customer.</p>
        </div>
        <FollowUpFormStepper activeStep={1} />
      </div>

      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          onSave(form);
        }}
      >
        <FollowUpFormSection number={1} title="Follow-up Details" subtitle="Who was contacted and how">
          <label className="block space-y-1">
            <FormFieldLabel required>Customer</FormFieldLabel>
            <CustomerReadOnlyCard customer={customer} />
          </label>

          <label className="block space-y-1">
            <FormFieldLabel>Contact Person</FormFieldLabel>
            <select
              value={form.contactPerson}
              onChange={(e) => update({ contactPerson: e.target.value })}
              className={`${FU_FORM_INPUT_CLS} cursor-pointer`}
            >
              {contactOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </label>

          <div className="space-y-1">
            <FormFieldLabel required>Contact Method</FormFieldLabel>
            <ContactMethodPills value={form.contactMethod} onChange={(v) => update({ contactMethod: v })} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block space-y-1">
              <FormFieldLabel required>Contact Date</FormFieldLabel>
              <DateInput
                value={form.contactDate}
                onChange={(contactDate) => update({ contactDate })}
                required
                className={FU_FORM_INPUT_CLS}
              />
            </label>
            <label className="block space-y-1">
              <FormFieldLabel required>Contact Time</FormFieldLabel>
              <input
                type="time"
                value={form.contactTime}
                onChange={(e) => update({ contactTime: e.target.value })}
                required
                className={FU_FORM_INPUT_CLS}
              />
            </label>
          </div>

          <StaffSelect
            label="Assigned To"
            value={form.assignedTo}
            onChange={(v) => update({ assignedTo: v })}
            options={staffOptions}
            required
          />
        </FollowUpFormSection>

        <FollowUpFormSection number={2} title="Customer Response / Outcome" subtitle="What was the result of this contact">
          <div className="space-y-1">
            <FormFieldLabel required>Outcome</FormFieldLabel>
            <OutcomeGrid value={form.outcome} onChange={(v) => update({ outcome: v })} />
          </div>

          <CharCountTextarea
            label="Notes (What happened during the conversation)"
            value={form.notes}
            onChange={(v) => update({ notes: v })}
            maxLength={500}
            placeholder="What happened during the conversation"
          />
        </FollowUpFormSection>

        <FollowUpFormSection number={3} title="Next Action" subtitle="Schedule the next follow-up if needed">
          <ToggleSwitch
            label="Need to schedule next follow-up?"
            checked={form.scheduleNext}
            onChange={(v) => update({ scheduleNext: v })}
          />

          {form.scheduleNext && (
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block space-y-1">
                  <FormFieldLabel required>Next Follow-up Date</FormFieldLabel>
                  <DateInput
                    value={form.nextDate}
                    onChange={(nextDate) => update({ nextDate })}
                    required={form.scheduleNext}
                    className={FU_FORM_INPUT_CLS}
                  />
                </label>
                <label className="block space-y-1">
                  <FormFieldLabel required>Next Follow-up Time</FormFieldLabel>
                  <input
                    type="time"
                    value={form.nextTime}
                    onChange={(e) => update({ nextTime: e.target.value })}
                    required={form.scheduleNext}
                    className={FU_FORM_INPUT_CLS}
                  />
                </label>
              </div>

              <StaffSelect
                label="Follow-up For"
                value={form.nextAssignedTo}
                onChange={(v) => update({ nextAssignedTo: v })}
                options={staffOptions}
              />

              <label className="block space-y-1">
                <FormFieldLabel>Reminder</FormFieldLabel>
                <select
                  value={form.reminder}
                  onChange={(e) => update({ reminder: e.target.value })}
                  className={`${FU_FORM_INPUT_CLS} cursor-pointer`}
                >
                  <option value="15">15 minutes before</option>
                  <option value="30">30 minutes before</option>
                  <option value="60">1 hour before</option>
                  <option value="1440">1 day before</option>
                </select>
              </label>

              <CharCountTextarea
                label="Note (Optional)"
                value={form.nextNote}
                onChange={(v) => update({ nextNote: v })}
                maxLength={200}
                placeholder="Instructions for the next follow-up"
                rows={2}
              />
            </div>
          )}
        </FollowUpFormSection>

        <FollowUpFormSection number={4} title="Additional Info" subtitle="Optional payment promise and attachments">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block space-y-1">
              <FormFieldLabel>Promise Amount</FormFieldLabel>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">৳</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.promiseAmount}
                  onChange={(e) => update({ promiseAmount: e.target.value })}
                  placeholder="0.00"
                  className={`${FU_FORM_INPUT_CLS} pl-8`}
                />
              </div>
            </label>
            <label className="block space-y-1">
              <FormFieldLabel>Expected Payment Date</FormFieldLabel>
              <DateInput
                value={form.expectedPaymentDate}
                onChange={(expectedPaymentDate) => update({ expectedPaymentDate })}
                className={FU_FORM_INPUT_CLS}
              />
            </label>
          </div>

          <FileUploadZone
            fileName={form.attachmentName}
            previewUrl={form.attachmentUrl || undefined}
            onFileSelect={({ name, url }) => update({ attachmentName: name, attachmentUrl: url })}
          />
        </FollowUpFormSection>

        <div className={`${FU_CARD_CLS} p-4 flex flex-wrap items-center justify-between gap-3`}>
          <button type="button" className={FU_BTN_OUTLINE} onClick={onBack}>
            Cancel
          </button>
          <button type="submit" className={`${FU_BTN_PRIMARY} py-2.5 px-5 text-sm`}>
            Save &amp; Continue
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}

export type { FollowUpFormValues };
