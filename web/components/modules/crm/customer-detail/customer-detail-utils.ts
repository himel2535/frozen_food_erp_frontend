import { formatAppDate } from '@/lib/i18n/locale-format';

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-violet-100 text-violet-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
];

export function customerInitials(name: string) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function customerAvatarClass(name: string) {
  const code = String(name).split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

export function formatDetailDate(value: unknown) {
  if (!value) return '—';
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return String(value);
  return formatAppDate(d, { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatAddressBlock(addr: Record<string, unknown> | undefined) {
  if (!addr) return '—';
  const parts = [
    addr.line1,
    addr.area,
    addr.city,
    addr.region,
    addr.country,
  ].map((v) => String(v ?? '').trim()).filter(Boolean);
  return parts.length ? parts.join(', ') : '—';
}

export function monthsSince(dateStr: unknown) {
  if (!dateStr) return null;
  const start = new Date(String(dateStr));
  if (Number.isNaN(start.getTime())) return null;
  const now = new Date();
  return Math.max(1, Math.round((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30)));
}

export function formatFileSize(bytes: unknown) {
  const n = Number(bytes ?? 0);
  if (!n) return '—';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export const CUSTOMER_DETAIL_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'invoices', label: 'Invoices' },
  { id: 'orders', label: 'Orders' },
  { id: 'payments', label: 'Payments' },
  { id: 'quotes', label: 'Quotes' },
  { id: 'deliveries', label: 'Deliveries' },
  { id: 'returns', label: 'Returns' },
  { id: 'activity', label: 'Activity Log' },
  { id: 'notes', label: 'Notes & Files' },
] as const;

export type CustomerDetailTabId = (typeof CUSTOMER_DETAIL_TABS)[number]['id'];
