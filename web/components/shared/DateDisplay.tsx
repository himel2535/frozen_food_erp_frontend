'use client';

import type { ReactNode } from 'react';
import { useLocaleFormat } from '@/hooks/useLocaleFormat';
import { isValidIsoDate } from '@/lib/i18n/date-utils';
import { isoToDisplayDate } from '@/lib/i18n/date-utils';

export type DateDisplayVariant = 'short' | 'slash' | 'long' | 'monthYear' | 'datetime';

export type DateDisplayProps = {
  value: Date | string | null | undefined;
  variant?: DateDisplayVariant;
  className?: string;
  empty?: ReactNode;
};

function hasDateValue(value: Date | string | null | undefined): value is Date | string {
  if (value == null) return false;
  if (value instanceof Date) return !Number.isNaN(value.getTime());
  const raw = String(value).trim();
  if (!raw) return false;
  if (isValidIsoDate(raw)) return true;
  return !Number.isNaN(new Date(raw).getTime());
}

export function DateDisplay({
  value,
  variant = 'short',
  className,
  empty = '—',
}: DateDisplayProps) {
  const { formatDate, formatDateSlash, formatMonthYear, formatDateTime } = useLocaleFormat();

  if (!hasDateValue(value)) {
    return <span className={className}>{empty}</span>;
  }

  const raw = value instanceof Date ? value : String(value).split('T')[0];
  if (isValidIsoDate(raw) && variant === 'slash') {
    return <span className={className}>{isoToDisplayDate(raw)}</span>;
  }

  const formatted =
    variant === 'slash'
      ? formatDateSlash(value)
      : variant === 'long'
        ? formatDate(value, { day: '2-digit', month: 'short', year: 'numeric' })
        : variant === 'monthYear'
          ? formatMonthYear(value)
          : variant === 'datetime'
            ? formatDateTime(value)
            : formatDate(value);

  return <span className={className}>{formatted}</span>;
}

/** Non-React helper for table cells / exports — always dd/mm order via locale-format. */
export { formatDate, formatDateSlash, formatDateTime, formatMonthYear } from '@/lib/i18n/locale-format';
