'use client';

const TYPE_STYLES: Record<string, string> = {
  CREATE: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  UPDATE: 'bg-blue-50 text-blue-700 border-blue-100',
  DELETE: 'bg-rose-50 text-rose-700 border-rose-100',
  LOGIN: 'bg-violet-50 text-violet-700 border-violet-100',
  LOGOUT: 'bg-slate-100 text-slate-600 border-slate-200',
  APPROVE: 'bg-teal-50 text-teal-700 border-teal-100',
  CONVERT: 'bg-amber-50 text-amber-700 border-amber-100',
  MERGE: 'bg-orange-50 text-orange-700 border-orange-100',
};

export function AuditEventBadge({ type }: { type: string }) {
  const key = type.toUpperCase();
  const style = TYPE_STYLES[key] ?? 'bg-slate-50 text-slate-700 border-slate-100';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-bold tracking-wide ${style}`}>
      {key}
    </span>
  );
}
