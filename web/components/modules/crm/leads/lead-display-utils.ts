import { LEAD_STAGE_LABELS } from '@/lib/services/crm-service';
import { formatAppDate } from '@/lib/i18n/locale-format';

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-violet-100 text-violet-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-sky-100 text-sky-700',
  'bg-indigo-100 text-indigo-700',
];

export function leadInitials(name: string) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function leadAvatarClass(name: string) {
  const code = String(name).split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

/** @deprecated Use useLocaleFormat().formatMoney instead */
export function formatLeadCurrency(value: number) {
  return `৳${Number(value || 0).toLocaleString('en-IN')}`;
}

export function leadStageLabel(status: string) {
  return LEAD_STAGE_LABELS[status] || status;
}

export function priorityTagClass(priority: string) {
  const p = String(priority || '').toLowerCase();
  if (p === 'hot') return 'bg-rose-100 text-rose-700 border-rose-200';
  if (p === 'cold') return 'bg-slate-100 text-slate-600 border-slate-200';
  return 'bg-amber-100 text-amber-700 border-amber-200';
}

export function priorityLabel(priority: string) {
  const p = String(priority || 'warm').toLowerCase();
  if (p === 'hot') return 'Hot';
  if (p === 'cold') return 'Cold';
  return 'Warm';
}

export function formatLeadDateTime(iso: string | null | undefined) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso).slice(0, 10);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  if (isToday) return `Today, ${time}`;
  return `${formatAppDate(d, { day: 'numeric', month: 'short' })}, ${time}`;
}

export function formatRelativeActivity(iso: string | null | undefined) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const today = new Date();
  const diffDays = Math.floor((today.getTime() - d.getTime()) / 86400000);
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  if (diffDays === 0) return `Today, ${time}`;
  if (diffDays === 1) return `Yesterday, ${time}`;
  return `${formatAppDate(d, { day: 'numeric', month: 'short' })}, ${time}`;
}

export const PIPELINE_STAGE_COLORS: Record<string, string> = {
  new: 'bg-blue-500',
  contacted: 'bg-emerald-500',
  qualified: 'bg-teal-500',
  proposal: 'bg-amber-500',
  negotiation: 'bg-violet-500',
  won: 'bg-green-700',
  lost: 'bg-rose-500',
};

export const NEXT_ACTION_ICONS: Record<string, string> = {
  Call: '📞',
  WhatsApp: '💬',
  Email: '✉️',
  Meeting: '📅',
  'Follow-up': '🔔',
};
