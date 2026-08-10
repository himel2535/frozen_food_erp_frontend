import { COMPLAINT_CATEGORIES } from '@/lib/services/complaints-service';

const CATEGORY_BADGE: Record<string, string> = {
  'product-quality': 'bg-blue-50 text-blue-700 border-blue-200/60',
  'missing-item': 'bg-violet-50 text-violet-700 border-violet-200/60',
  delivery: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
  'incorrect-info': 'bg-amber-50 text-amber-700 border-amber-200/60',
  refund: 'bg-pink-50 text-pink-700 border-pink-200/60',
  packaging: 'bg-teal-50 text-teal-700 border-teal-200/60',
};

const PRIORITY_BADGE: Record<string, string> = {
  high: 'bg-rose-50 text-rose-700 border-rose-200/60',
  medium: 'bg-orange-50 text-orange-700 border-orange-200/60',
  low: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
};

export function categoryLabel(value: string) {
  return COMPLAINT_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export function categoryBadgeClass(value: string) {
  return CATEGORY_BADGE[value] ?? 'bg-slate-50 text-slate-600 border-slate-200/60';
}

export function priorityBadgeClass(value: string) {
  return PRIORITY_BADGE[String(value).toLowerCase()] ?? 'bg-slate-50 text-slate-600 border-slate-200/60';
}

export function formatComplaintDateTime(iso: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const date = d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  return { date, time };
}

export function formatDueRelative(iso: string, status: string) {
  if (!iso || status === 'resolved') return { text: '—', tone: 'muted' as const };
  const due = new Date(iso);
  const now = new Date();
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / 86400000);

  if (diffDays < 0) return { text: `${Math.abs(diffDays)} days overdue`, tone: 'danger' as const };
  if (diffDays === 0) return { text: 'Today', tone: 'success' as const };
  if (diffDays === 1) return { text: '1 day left', tone: 'warning' as const };
  return { text: `${diffDays} days left`, tone: 'warning' as const };
}

export function formatDueDate(iso: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
