'use client';

import { useMemo } from 'react';
import type { Lang } from '@/lib/state/types';
import { useAppStore } from '@/lib/state/app-store';
import {
  formatCompactMoney,
  formatDate,
  formatMoney,
  formatMonthShort,
  formatNumber,
} from '@/lib/i18n/locale-format';

export function useLocaleFormat() {
  const lang = useAppStore((s) => (s.appState.lang ?? 'en') as Lang);

  return useMemo(
    () => ({
      lang,
      formatNumber: (value: number, options?: Intl.NumberFormatOptions) =>
        formatNumber(value, lang, options),
      formatMoney: (value: number, options?: { decimals?: number }) =>
        formatMoney(value, lang, options),
      formatCompactMoney: (value: number) => formatCompactMoney(value, lang),
      formatDate: (value: Date | string, options?: Intl.DateTimeFormatOptions) =>
        formatDate(value, lang, options),
      formatMonthShort: (monthIndex: number) => formatMonthShort(monthIndex, lang),
    }),
    [lang],
  );
}
