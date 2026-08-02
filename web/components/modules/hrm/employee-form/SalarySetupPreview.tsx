'use client';

import { ArrowRight, Banknote, CalendarDays, Clock, Gift, MinusCircle } from 'lucide-react';
import { formatMoney } from '@/lib/services/payroll-service';

export function SalarySetupPreview({
  structure,
}: {
  structure: Record<string, unknown> | null;
}) {
  if (!structure) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-4 text-xs font-medium text-slate-500 min-h-[180px] flex items-center justify-center text-center">
        Select a salary setup to preview details.
      </div>
    );
  }

  const name = String(structure.name ?? 'Salary Setup');
  const base = Number(structure.base ?? 0);
  const workingDays = Number(structure.workingDays ?? 26);
  const otEnabled = Boolean(structure.overtimeEnabled);
  const otRate = Number(structure.otRate ?? 0);
  const bonusEnabled = Boolean(structure.bonusEnabled);
  const absentDeduction = String(structure.absentDeduction ?? 'Per Day Salary');

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 space-y-2.5 min-h-[180px]">
      <div className="flex items-center justify-between gap-2">
        <h5 className="text-sm font-extrabold text-blue-700 truncate">{name}</h5>
        <button
          type="button"
          className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer shrink-0"
          onClick={() => window.alert('Full salary setup details coming soon.')}
        >
          View full details <ArrowRight className="w-3 h-3" />
        </button>
      </div>
      <ul className="space-y-2 text-[11px]">
        <li className="flex items-start gap-2 text-slate-700">
          <Banknote className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
          <span>
            <span className="font-bold">Basic Salary</span>
            <span className="block text-slate-500">{formatMoney(base)} / month</span>
          </span>
        </li>
        <li className="flex items-start gap-2 text-slate-700">
          <CalendarDays className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
          <span>
            <span className="font-bold">Working Days</span>
            <span className="block text-slate-500">{workingDays} days</span>
          </span>
        </li>
        <li className="flex items-start gap-2 text-slate-700">
          <Clock className="w-3.5 h-3.5 text-violet-600 shrink-0 mt-0.5" />
          <span>
            <span className="font-bold">Overtime</span>
            <span className="block text-slate-500">
              {otEnabled ? `${formatMoney(otRate)} / hour · Eligible` : 'Not eligible'}
            </span>
          </span>
        </li>
        <li className="flex items-start gap-2 text-slate-700">
          <Gift className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
          <span>
            <span className="font-bold">Production Bonus</span>
            <span className="block text-slate-500">{bonusEnabled ? 'Eligible' : 'Not eligible'}</span>
          </span>
        </li>
        <li className="flex items-start gap-2 text-slate-700">
          <MinusCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
          <span>
            <span className="font-bold">Absent Deduction</span>
            <span className="block text-slate-500">{absentDeduction}</span>
          </span>
        </li>
      </ul>
    </div>
  );
}
