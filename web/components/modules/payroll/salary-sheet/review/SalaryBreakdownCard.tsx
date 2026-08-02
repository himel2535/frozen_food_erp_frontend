'use client';

import { Icon } from '@iconify/react';
import { KpiCards } from '@/components/shared/KpiCards';
import { amountInWords, formatMoney } from '@/lib/services/salary-sheet-service';
import {
  RP_CARD_CLS,
  RP_DEDUCTIONS_BOX_CLS,
  RP_EARNINGS_BOX_CLS,
  RP_LINE_ROW_CLS,
  RP_LINE_TOTAL_CLS,
  RP_NET_HERO_CLS,
  RP_SECTION_TITLE_CLS,
} from '@/components/modules/payroll/salary-sheet/review/review-pay-styles';

export function EmployeeReviewFacts({
  employee,
  structure,
}: {
  employee: Record<string, unknown>;
  structure: Record<string, unknown>;
}) {
  const joining = String(employee.joiningDate ?? '—').split('T')[0];
  const joiningLabel = joining !== '—'
    ? new Date(joining).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

  return (
    <KpiCards
      gridClassName="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3"
      items={[
        { key: 'joining', label: 'Joining Date', value: joiningLabel, iconify: 'flat-color-icons:calendar' },
        { key: 'frequency', label: 'Pay Frequency', value: String(structure.payFrequency ?? 'Monthly'), iconify: 'flat-color-icons:clock' },
        { key: 'workingDays', label: 'Working Days (This Month)', value: String(structure.workingDays ?? '—'), iconify: 'flat-color-icons:leave' },
        { key: 'designation', label: 'Designation', value: String(employee.designation ?? '—'), iconify: 'flat-color-icons:manager' },
        { key: 'bank', label: 'Bank / Mobile', value: String(employee.phone ?? '—'), iconify: 'flat-color-icons:phone' },
        {
          key: 'structure',
          label: 'Salary Structure',
          value: String(structure.name ?? '—'),
          sub: String(structure.code ?? ''),
          iconify: 'flat-color-icons:rules',
        },
      ]}
    />
  );
}

export function SalaryBreakdownCard({
  computed,
  otHours,
}: {
  computed: import('@/lib/services/salary-sheet-service').ComputedSheetRow;
  otHours: number;
}) {
  return (
    <section className={`${RP_CARD_CLS} space-y-4`}>
      <h3 className={RP_SECTION_TITLE_CLS}>Salary Breakdown</h3>

      <div className={RP_LINE_ROW_CLS}>
        <span className="font-semibold text-slate-600">Basic Salary</span>
        <span className="font-extrabold text-slate-900">{formatMoney(computed.basic)}</span>
      </div>

      <div className={RP_EARNINGS_BOX_CLS}>
        <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-800">Earnings</p>
        <div className={`${RP_LINE_ROW_CLS} text-emerald-900/80`}>
          <span>Overtime ({otHours} Hrs × {formatMoney(computed.otRate)})</span>
          <span className="font-semibold">{formatMoney(computed.otAmount)}</span>
        </div>
        <div className={`${RP_LINE_ROW_CLS} text-emerald-900/80`}>
          <span>Production Bonus</span>
          <span className="font-semibold">{formatMoney(computed.bonusAmount)}</span>
        </div>
        <div className={`${RP_LINE_ROW_CLS} text-emerald-900/80`}>
          <span>Other Allowance</span>
          <span className="font-semibold">{formatMoney(computed.otherAllowance)}</span>
        </div>
        <div className={`${RP_LINE_TOTAL_CLS} text-emerald-800`}>
          <span>Total Earnings</span>
          <span>{formatMoney(computed.totalEarnings)}</span>
        </div>
      </div>

      <div className={RP_DEDUCTIONS_BOX_CLS}>
        <p className="text-[10px] font-bold uppercase tracking-wide text-rose-800">Deductions</p>
        <div className={`${RP_LINE_ROW_CLS} text-rose-900/80`}>
          <span>Absent Deduction</span>
          <span className="font-semibold">{formatMoney(computed.absentDeduction)}</span>
        </div>
        <div className={`${RP_LINE_ROW_CLS} text-rose-900/80`}>
          <span>Late Deduction</span>
          <span className="font-semibold">{formatMoney(computed.lateDeduction)}</span>
        </div>
        <div className={`${RP_LINE_ROW_CLS} text-rose-900/80`}>
          <span>Advance Salary</span>
          <span className="font-semibold">{formatMoney(computed.advanceDeduct)}</span>
        </div>
        <div className={`${RP_LINE_ROW_CLS} text-rose-900/80`}>
          <span>Other Deduction</span>
          <span className="font-semibold">{formatMoney(computed.otherDeduction)}</span>
        </div>
        <div className={`${RP_LINE_TOTAL_CLS} text-rose-700`}>
          <span>Total Deductions</span>
          <span>{formatMoney(computed.totalDeductions)}</span>
        </div>
      </div>

      <div className={RP_NET_HERO_CLS}>
        <Icon icon="flat-color-icons:paid" width={44} height={44} className="shrink-0 drop-shadow-sm" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold opacity-90">Net Payable Amount</p>
          <p className="text-2xl font-extrabold tracking-tight mt-0.5">{formatMoney(computed.netPayable)}</p>
          <p className="text-[11px] mt-1 opacity-90 truncate">{amountInWords(computed.netPayable)}</p>
        </div>
      </div>
    </section>
  );
}
