export function dealInitials(name: string) {
  return String(name ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function priorityBadgeClass(priority: string) {
  const key = String(priority).toLowerCase();
  if (key === 'high') return 'bg-rose-50 text-rose-700 border-rose-200/70';
  if (key === 'low') return 'bg-emerald-50 text-emerald-700 border-emerald-200/70';
  return 'bg-amber-50 text-amber-700 border-amber-200/70';
}

export function formatDealDate(iso: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export const PERFORMER_TROPHY = ['🥇', '🥈', '🥉'];

export const FOLLOWUP_TONE: Record<string, string> = {
  violet: 'bg-violet-50 text-violet-600 border-violet-100',
  amber: 'bg-amber-50 text-amber-600 border-amber-100',
  blue: 'bg-blue-50 text-blue-600 border-blue-100',
};
