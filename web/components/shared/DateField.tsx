'use client';

import { DateInput } from '@/components/shared/DateInput';
import { FORM_INPUT_CLS, FORM_LABEL_CLS } from '@/lib/ui/form-styles';

interface DateFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  id?: string;
}

export function DateField({ label, value, onChange, required, id }: DateFieldProps) {
  return (
    <div>
      <label htmlFor={id} className={FORM_LABEL_CLS}>
        {label}
        {required ? <span className="text-rose-500"> *</span> : null}
      </label>
      <DateInput
        id={id}
        value={value}
        onChange={onChange}
        required={required}
        className={FORM_INPUT_CLS}
      />
    </div>
  );
}

export { DateInput } from '@/components/shared/DateInput';
export { DateDisplay } from '@/components/shared/DateDisplay';
