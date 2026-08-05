'use client';

import { useMemo } from 'react';
import type { Lang } from '@/lib/state/types';
import { useAppStore } from '@/lib/state/app-store';
import {
  formatCompactMoney,
  formatDate,
  formatDateSlash,
  formatDateTime,
  formatMonthShort,
  formatMonthYear,
  formatMoney,
  formatNumber,
} from '@/lib/i18n/locale-format';

export function useLocaleFormat() {
  const lang = useAppStore((s) => (s.appState.lang ?? 'en') as Lang);

  return useMemo(
    () => ({
      lang,
      formatNumber: (value: number, options?: Intl.NumberFormatOptions) =>
        formatNumber(value, lang, options),
      formatCount: (value: number) =>
        formatNumber(value, lang, { maximumFractionDigits: 0 }),
      formatPercent: (value: number, decimals = 1) =>
        `${formatNumber(value, lang, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })}%`,
      formatMoney: (value: number, options?: { decimals?: number }) =>
        formatMoney(value, lang, options),
      formatCompactMoney: (value: number) => formatCompactMoney(value, lang),
      formatDate: (value: Date | string, options?: Intl.DateTimeFormatOptions) =>
        formatDate(value, lang, options),
      formatDateSlash: (value: Date | string) => formatDateSlash(value, lang),
      formatDateTime: (value: Date | string) => formatDateTime(value, lang),
      formatMonthShort: (monthIndex: number) => formatMonthShort(monthIndex, lang),
      formatMonthYear: (value: Date | string) => formatMonthYear(value, lang),
    }),
    [lang],
  );
}
