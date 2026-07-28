const MAP: Record<string, string> = {
  new: 'bg-blue-50 text-blue-700',
  active: 'bg-emerald-50 text-emerald-700',
  open: 'bg-blue-50 text-blue-700',
  won: 'bg-emerald-50 text-emerald-700',
  lost: 'bg-rose-50 text-rose-700',
  paid: 'bg-emerald-50 text-emerald-700',
  pending: 'bg-amber-50 text-amber-700',
};

export function StatusBadge({ status }: { status: string }) {
  const key = String(status || '').toLowerCase();
  return (
    <span className={`px-2 py-1 rounded-full text-[10px] font-bold capitalize ${MAP[key] ?? 'bg-slate-100 text-slate-600'}`}>
      {String(status || '-').replace(/-/g, ' ')}
    </span>
  );
}
