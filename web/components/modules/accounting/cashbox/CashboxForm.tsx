'use client';

import { useEffect, useMemo, useState } from 'react';
import { Paperclip } from 'lucide-react';
import {
  AppFormFields,
  AppFormModal,
  FORM_GRID_CLS,
  FORM_INPUT_CLS,
  FORM_LABEL_CLS,
} from '@/components/shared/AppForm';
import {
  defaultFormValues,
  entryToFormValues,
  type CashboxEntry,
  type CashboxFormValues,
} from '@/lib/services/cashbox-service';
import { buildCashboxFormFields } from './cashbox-options';
import type { CashboxTab } from './cashbox-types';

type FormRecord = Record<string, string>;

function toFormRecord(values: CashboxFormValues): FormRecord {
  return {
    amount: values.amount,
    category: values.category,
    party: values.party,
    note: values.note,
    paymentMethod: values.paymentMethod,
    reference: values.reference,
    datetime: values.datetime,
    description: values.description,
  };
}

function fromFormRecord(record: FormRecord): CashboxFormValues {
  return {
    amount: record.amount ?? '',
    category: record.category ?? '',
    party: record.party ?? '',
    note: record.note ?? '',
    paymentMethod: record.paymentMethod ?? 'Cash',
    reference: record.reference ?? '',
    datetime: record.datetime ?? '',
    description: record.description ?? record.note ?? '',
  };
}

export function CashboxForm({
  open,
  formType,
  editingEntry,
  partyOptions,
  onClose,
  onSave,
}: {
  open: boolean;
  formType: CashboxTab;
  editingEntry: CashboxEntry | null;
  partyOptions: string[];
  onClose: () => void;
  onSave: (formType: CashboxTab, values: CashboxFormValues) => void | Promise<void>;
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [form, setForm] = useState<FormRecord>(() => toFormRecord(defaultFormValues(formType)));

  useEffect(() => {
    if (!open) return;
    if (editingEntry) {
      setForm(toFormRecord(entryToFormValues(editingEntry)));
    } else {
      setForm(toFormRecord(defaultFormValues(formType)));
    }
    setShowAdvanced(false);
  }, [open, editingEntry, formType]);

  const fields = useMemo(
    () => buildCashboxFormFields(formType, partyOptions),
    [formType, partyOptions],
  );

  const isCashIn = formType === 'cash_in';
  const typeLabel = isCashIn ? 'Cash In' : 'Cash Out';
  const title = editingEntry ? `Edit ${typeLabel}` : `Create ${typeLabel}`;
  const subtitle = isCashIn
    ? 'Record money received into the cashbox.'
    : 'Record money paid out from the cashbox.';

  const setField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || !form.datetime || !form.category || !form.party || !form.note) return;
    await Promise.resolve(onSave(formType, fromFormRecord(form)));
  };

  return (
    <AppFormModal
      open={open}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      onSubmit={handleSubmit}
      submitLabel={editingEntry ? 'Update Entry' : 'Save Entry'}
      size="md"
    >
      <div className={FORM_GRID_CLS}>
        <div>
          <label className={FORM_LABEL_CLS}>
            Amount
            <span className="text-rose-500 normal-case"> *</span>
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            required
            placeholder="0.00"
            value={form.amount}
            onChange={(e) => setField('amount', e.target.value)}
            className={FORM_INPUT_CLS}
          />
        </div>
        <div>
          <label className={FORM_LABEL_CLS}>
            Date &amp; Time
            <span className="text-rose-500 normal-case"> *</span>
          </label>
          <input
            type="datetime-local"
            required
            value={form.datetime}
            onChange={(e) => setField('datetime', e.target.value)}
            className={`${FORM_INPUT_CLS} cursor-pointer`}
          />
        </div>
      </div>
      <AppFormFields
        fields={fields}
        values={form}
        onChange={setField}
        showAdvanced={showAdvanced}
        onToggleAdvanced={() => setShowAdvanced((prev) => !prev)}
      />
      {showAdvanced && (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-center text-xs text-slate-500">
          <Paperclip className="mx-auto mb-1 h-4 w-4 text-slate-400" />
          Attachments — coming soon
        </div>
      )}
    </AppFormModal>
  );
}
