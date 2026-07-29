const PASTEL_BADGE =
  'inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize border';

const MAP: Record<string, string> = {
  new: 'bg-sky-50 text-sky-700 border-sky-200/60',
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
  open: 'bg-blue-50 text-blue-700 border-blue-200/60',
  won: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
  received: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
  present: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
  'in-stock': 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
  'on-track': 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
  green: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
  qualified: 'bg-teal-50 text-teal-700 border-teal-200/60',
  contacted: 'bg-violet-50 text-violet-700 border-violet-200/60',
  pending: 'bg-amber-50 text-amber-700 border-amber-200/60',
  'low-stock': 'bg-orange-50 text-orange-700 border-orange-200/60',
  'at-risk': 'bg-orange-50 text-orange-700 border-orange-200/60',
  amber: 'bg-amber-50 text-amber-700 border-amber-200/60',
  scheduled: 'bg-indigo-50 text-indigo-700 border-indigo-200/60',
  'in-progress': 'bg-indigo-50 text-indigo-700 border-indigo-200/60',
  planned: 'bg-indigo-50 text-indigo-700 border-indigo-200/60',
  draft: 'bg-slate-50 text-slate-600 border-slate-200/60',
  inactive: 'bg-slate-100 text-slate-600 border-slate-200/60',
  closed: 'bg-slate-100 text-slate-600 border-slate-200/60',
  lost: 'bg-rose-50 text-rose-700 border-rose-200/60',
  cancelled: 'bg-rose-50 text-rose-700 border-rose-200/60',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200/60',
  'out-of-stock': 'bg-rose-50 text-rose-700 border-rose-200/60',
  discontinued: 'bg-rose-50 text-rose-700 border-rose-200/60',
  delayed: 'bg-rose-50 text-rose-700 border-rose-200/60',
  red: 'bg-rose-50 text-rose-700 border-rose-200/60',
  overdue: 'bg-red-50 text-red-700 border-red-200/60',
  absent: 'bg-red-50 text-red-700 border-red-200/60',
  maintenance: 'bg-yellow-50 text-yellow-700 border-yellow-200/60',
  unread: 'bg-blue-50 text-blue-700 border-blue-200/60',
  read: 'bg-slate-50 text-slate-600 border-slate-200/60',
};

function normalizeStatus(status: string) {
  return String(status || '')
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, '-');
}

export function StatusBadge({ status }: { status: string }) {
  const key = normalizeStatus(status);
  const label = String(status || '-').replace(/-/g, ' ');
  return (
    <span className={`${PASTEL_BADGE} ${MAP[key] ?? 'bg-slate-50 text-slate-600 border-slate-200/60'}`}>
      {label}
    </span>
  );
}
