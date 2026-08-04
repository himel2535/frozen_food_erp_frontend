export type TranslateFn = (key: string, vars?: Record<string, string | number>) => string;

const I18N_PREFIXES = ['common.', 'sales.', 'crm.', 'status.'] as const;

/** If label looks like an i18n key, translate it; otherwise return as-is. */
export function resolveLabel(t: TranslateFn, label: string): string {
  if (I18N_PREFIXES.some((p) => label.startsWith(p))) {
    const translated = t(label);
    if (translated !== label) return translated;
  }
  return label;
}

export function translateStatus(t: TranslateFn, status: string): string {
  const key = String(status || '')
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, '-');
  if (!key) return '—';
  const translated = t(`status.${key}`);
  if (translated !== `status.${key}`) return translated;
  return String(status || '-').replace(/-/g, ' ');
}

export const DEDICATED_MODULE_I18N: Record<
  string,
  { title: string; subtitle: string; addLabel?: string; searchPlaceholder?: string }
> = {
  'crm-activities': {
    title: 'crm.activities_title',
    subtitle: 'crm.activities_subtitle',
    addLabel: 'crm.activities_add',
    searchPlaceholder: 'crm.activities_search',
  },
  'sales-wholesale': {
    title: 'sales.wholesale_title',
    subtitle: 'sales.wholesale_subtitle',
    addLabel: 'sales.wholesale_add',
    searchPlaceholder: 'sales.wholesale_search',
  },
};
