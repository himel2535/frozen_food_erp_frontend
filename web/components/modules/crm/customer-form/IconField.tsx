'use client';

import type { LucideIcon } from 'lucide-react';
import {
  CF_FIELD_ERROR_CLS,
  CF_ICON_CLS,
  CF_ICON_TEXTAREA_CLS,
  CF_INPUT_CLS,
  CF_INPUT_ERROR_CLS,
  CF_INPUT_WRAP_CLS,
  CF_LABEL_CLS,
  CF_SELECT_CLS,
  CF_TEXTAREA_CLS,
} from '@/components/modules/crm/customer-form/customer-form-styles';

type BaseProps = {
  label: string;
  icon: LucideIcon;
  required?: boolean;
  className?: string;
  error?: string;
  fieldId?: string;
};

export function IconInput({
  label,
  icon: Icon,
  required,
  className = '',
  error,
  fieldId,
  ...props
}: BaseProps & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div id={fieldId} className={className}>
      <label className={CF_LABEL_CLS}>
        {label}
        {required ? <span className="text-rose-500 normal-case"> *</span> : null}
      </label>
      <div className={CF_INPUT_WRAP_CLS}>
        <Icon className={CF_ICON_CLS} />
        <input
          className={`${CF_INPUT_CLS}${error ? ` ${CF_INPUT_ERROR_CLS}` : ''}`}
          required={required}
          aria-invalid={error ? true : undefined}
          {...props}
        />
      </div>
      {error ? <p className={CF_FIELD_ERROR_CLS}>{error}</p> : null}
    </div>
  );
}

export function IconSelect({
  label,
  icon: Icon,
  required,
  className = '',
  error,
  fieldId,
  children,
  ...props
}: BaseProps & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div id={fieldId} className={className}>
      <label className={CF_LABEL_CLS}>
        {label}
        {required ? <span className="text-rose-500 normal-case"> *</span> : null}
      </label>
      <div className={CF_INPUT_WRAP_CLS}>
        <Icon className={CF_ICON_CLS} />
        <select
          className={`${CF_SELECT_CLS}${error ? ` ${CF_INPUT_ERROR_CLS}` : ''}`}
          required={required}
          aria-invalid={error ? true : undefined}
          {...props}
        >
          {children}
        </select>
      </div>
      {error ? <p className={CF_FIELD_ERROR_CLS}>{error}</p> : null}
    </div>
  );
}

export function IconTextarea({
  label,
  icon: Icon,
  required,
  className = '',
  error,
  fieldId,
  rows = 3,
  ...props
}: BaseProps & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div id={fieldId} className={className}>
      <label className={CF_LABEL_CLS}>
        {label}
        {required ? <span className="text-rose-500 normal-case"> *</span> : null}
      </label>
      <div className="relative">
        <Icon className={CF_ICON_TEXTAREA_CLS} />
        <textarea
          className={`${CF_TEXTAREA_CLS}${error ? ` ${CF_INPUT_ERROR_CLS}` : ''}`}
          rows={rows}
          required={required}
          aria-invalid={error ? true : undefined}
          {...props}
        />
      </div>
      {error ? <p className={CF_FIELD_ERROR_CLS}>{error}</p> : null}
    </div>
  );
}
