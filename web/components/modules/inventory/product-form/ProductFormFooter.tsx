'use client';

import { useRef } from 'react';
import { Save } from 'lucide-react';
import {
  CF_BTN_GHOST,
  CF_BTN_OUTLINE,
  CF_BTN_PRIMARY,
  CF_FOOTER_CLS,
} from '@/components/modules/crm/customer-form/customer-form-styles';

export type ProductSaveAction = 'save' | 'save-and-add';

export function ProductFormFooter({
  onCancel,
  onSaveAndAdd,
  submitLabel = 'Save Product',
}: {
  onCancel: () => void;
  onSaveAndAdd: () => void;
  submitLabel?: string;
}) {
  return (
    <div className={CF_FOOTER_CLS}>
      <button type="button" onClick={onCancel} className={CF_BTN_GHOST}>
        Cancel
      </button>
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <button type="button" onClick={onSaveAndAdd} className={CF_BTN_OUTLINE}>
          Save &amp; Add Another
        </button>
        <button type="submit" className={CF_BTN_PRIMARY}>
          <Save className="w-4 h-4" />
          {submitLabel}
        </button>
      </div>
    </div>
  );
}

export function useProductSaveAction() {
  const saveActionRef = useRef<ProductSaveAction>('save');
  const setSaveAction = (action: ProductSaveAction) => {
    saveActionRef.current = action;
  };
  const readSaveAction = () => {
    const action = saveActionRef.current;
    saveActionRef.current = 'save';
    return action;
  };
  return { saveActionRef, setSaveAction, readSaveAction };
}
