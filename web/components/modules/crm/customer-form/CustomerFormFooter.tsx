'use client';

import { useRef } from 'react';
import { Save } from 'lucide-react';
import { Button } from '@/components/shared/Button';
import {
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
      <Button type="button" onClick={onCancel} variant="ghost">
        Cancel
      </Button>
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <Button
          type="button"
          onClick={onSaveAndAdd}
          loading={isSubmitting}
          variant="outline"
        >
          Save & Add Another
        </Button>
        <Button
          type="submit"
          loading={isSubmitting}
          variant="primary"
          leftIcon={<Save className="w-4 h-4" />}
        >
          {submitLabel}
        </Button>
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
