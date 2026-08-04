import type { Lang } from '@/lib/state/types';

export function localeTag(lang: Lang): 'en-US' | 'bn-BD' {
  return lang === 'bn' ? 'bn-BD' : 'en-US';
}

export function formatNumber(
  value: number,
  lang: Lang,
  options?: Intl.NumberFormatOptions,
): string {
  const n = Number(value || 0);
  return n.toLocaleString(localeTag(lang), options);
}

export function formatMoney(
  value: number,
  lang: Lang,
  options?: { decimals?: number },
): string {
  const decimals = options?.decimals ?? 0;
  const formatted = formatNumber(value, lang, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `৳ ${formatted}`;
}

export function formatCompactMoney(value: number, lang: Lang): string {
  const n = Number(value || 0);
  if (lang === 'bn') {
    if (n >= 1_000_000) {
      return `৳${formatNumber(n / 1_000_000, lang, { maximumFractionDigits: 1 })}M`;
    }
    if (n >= 1_000) {
      return `৳${formatNumber(n / 1_000, lang, { maximumFractionDigits: 0 })}K`;
    }
    return formatMoney(n, lang);
  }
  if (n >= 1_000_000) {
    return `$${(n / 1_000_000).toLocaleString('en-US', { maximumFractionDigits: 1 })}M`;
  }
  if (n >= 1_000) {
    return `$${(n / 1_000).toLocaleString('en-US', { maximumFractionDigits: 0 })}K`;
  }
  return `$${n.toLocaleString('en-US')}`;
}

export function formatDate(
  value: Date | string,
  lang: Lang,
  options?: Intl.DateTimeFormatOptions,
): string {
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  const defaults: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  };
  return date.toLocaleDateString(localeTag(lang), { ...defaults, ...options });
}

export function formatMonthShort(monthIndex: number, lang: Lang): string {
  const date = new Date(2025, monthIndex, 1);
  return date.toLocaleDateString(localeTag(lang), { month: 'short' });
}
