'use client';

import { useRef } from 'react';
import { Save } from 'lucide-react';
import { SubmitBusyLabel } from '@/hooks/use-submit-guard';
import {
  CF_BTN_GHOST,
  CF_BTN_OUTLINE,
  CF_BTN_PRIMARY,
  CF_FOOTER_CLS,
} from '@/components/modules/crm/customer-form/customer-form-styles';

export type CustomerSaveAction = 'save' | 'save-and-add';

export function CustomerFormFooter({
  onCancel,
  onSaveAndAdd,
  submitLabel = 'Save Customer',
  isSubmitting = false,
}: {
  onCancel: () => void;
  onSaveAndAdd: () => void;
  submitLabel?: string;
  isSubmitting?: boolean;
}) {
  return (
    <div className={CF_FOOTER_CLS}>
      <button type="button" onClick={onCancel} className={CF_BTN_GHOST}>
        Cancel
      </button>
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <button
          type="button"
          onClick={onSaveAndAdd}
          disabled={isSubmitting}
          aria-busy={isSubmitting}
          className={`${CF_BTN_OUTLINE} disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <SubmitBusyLabel busy={isSubmitting} idle="Save & Add Another" />
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
          className={`${CF_BTN_PRIMARY} disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <Save className="w-4 h-4" />
          <SubmitBusyLabel busy={isSubmitting} idle={submitLabel} />
        </button>
      </div>
    </div>
  );
}

export function useCustomerSaveAction() {
  const saveActionRef = useRef<CustomerSaveAction>('save');
  const setSaveAction = (action: CustomerSaveAction) => {
    saveActionRef.current = action;
  };
  const readSaveAction = () => {
    const action = saveActionRef.current;
    saveActionRef.current = 'save';
    return action;
  };
  return { saveActionRef, setSaveAction, readSaveAction };
}
