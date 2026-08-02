'use client';

import { Briefcase } from 'lucide-react';
import { employeeStatusLabel, formatEmployeeDate } from '@/lib/services/hrm-service';

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5 border-b border-blue-100/80 last:border-0">
      <span className="text-[11px] font-semibold text-slate-500 shrink-0">{label}</span>
      <span className="text-[11px] font-bold text-slate-800 text-right truncate">{value || '—'}</span>
    </div>
  );
}

export function EmployeeSummaryCard({
  values,
  salarySetupName,
}: {
  values: Record<string, string>;
  salarySetupName: string;
}) {
  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-3.5 space-y-2.5">
      <div className="flex items-center gap-2">
        <span className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
          <Briefcase className="w-4 h-4" />
        </span>
        <h4 className="text-sm font-extrabold text-slate-900">Employee Summary</h4>
      </div>
      <div className="space-y-0.5">
        <SummaryRow label="Name" value={values.name?.trim() ?? ''} />
        <SummaryRow label="Department" value={values.department ?? ''} />
        <SummaryRow label="Designation" value={values.designation ?? ''} />
        <SummaryRow label="Joining Date" value={values.joiningDate ? formatEmployeeDate(values.joiningDate) : ''} />
        <SummaryRow label="Salary Setup" value={salarySetupName} />
        <SummaryRow label="Payment Method" value={values.paymentMethod ?? ''} />
        <SummaryRow label="Status" value={employeeStatusLabel(values.status)} />
      </div>
    </div>
  );
}
