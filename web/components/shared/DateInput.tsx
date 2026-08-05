'use client';

import { Calendar } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { displayDateToIso, isoToDisplayDate, isValidIsoDate } from '@/lib/i18n/date-utils';
import { FORM_INPUT_CLS } from '@/lib/ui/form-styles';

export type DateInputProps = {
  /** ISO yyyy-mm-dd */
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  'aria-label'?: string;
};

export function DateInput({
  value,
  onChange,
  required,
  className,
  id,
  placeholder = 'DD/MM/YYYY',
  disabled,
  'aria-label': ariaLabel,
}: DateInputProps) {
  const pickerRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState(() => isoToDisplayDate(value));

  useEffect(() => {
    setText(isoToDisplayDate(value));
  }, [value]);

  const commitText = (raw: string) => {
    const iso = displayDateToIso(raw);
    if (iso === '') {
      onChange('');
      setText('');
      return;
    }
    if (iso) {
      onChange(iso);
      setText(isoToDisplayDate(iso));
      return;
    }
    setText(isoToDisplayDate(value));
  };

  const openPicker = () => {
    if (disabled) return;
    try {
      pickerRef.current?.showPicker?.();
    } catch {
      pickerRef.current?.focus();
    }
  };

  return (
    <div className="relative">
      <input
        type="text"
        id={id}
        inputMode="numeric"
        value={text}
        placeholder={placeholder}
        required={required && !value}
        disabled={disabled}
        aria-label={ariaLabel}
        onChange={(e) => setText(e.target.value)}
        onBlur={(e) => commitText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commitText(text);
        }}
        className={`${className ?? FORM_INPUT_CLS} pr-10`}
      />
      <input
        ref={pickerRef}
        type="date"
        tabIndex={-1}
        aria-hidden
        value={isValidIsoDate(value) ? value.split('T')[0] : ''}
        onChange={(e) => {
          onChange(e.target.value);
          setText(isoToDisplayDate(e.target.value));
        }}
        className="absolute opacity-0 w-0 h-0 pointer-events-none"
      />
      <button
        type="button"
        onClick={openPicker}
        disabled={disabled}
        aria-label="Open calendar"
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
        tabIndex={-1}
      >
        <Calendar className="w-4 h-4" />
      </button>
    </div>
  );
}
