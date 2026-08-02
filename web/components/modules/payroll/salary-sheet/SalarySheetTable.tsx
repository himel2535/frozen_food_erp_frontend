'use client';

import { toast } from '@/lib/ui/feedback';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { employeeAvatarClass, employeeInitials } from '@/lib/services/hrm-service';
import { formatMoney } from '@/lib/services/salary-sheet-service';
import {
  SS_ACTION_BTN_CLS,
  SS_ACTION_BTN_PAID_CLS,
  SS_CELL_EDIT_DAY_CLS,
  SS_CELL_EDIT_MONEY_CLS,
  SS_CELL_EDIT_PCT_CLS,
  SS_CELL_READONLY_CLS,
  SS_CELL_READONLY_MUTED_CLS,
  SS_EXTRA_PAY_BADGE,
  SS_STATUS_BADGE,
  SS_TABLE_CARD_CLS,
  SS_TABLE_CELL_CLS,
  SS_TABLE_COL_WIDTHS,
  SS_TABLE_FOOTER_CLS,
  SS_TABLE_GROUP_ADVANCE,
  SS_TABLE_GROUP_ATTENDANCE,
  SS_TABLE_GROUP_BONUS,
  SS_TABLE_GROUP_DEDUCTION,
  SS_TABLE_GROUP_OT,
  SS_TABLE_HEAD_CLS,
  SS_TABLE_HEAD_GROUP_CLS,
  SS_TABLE_HEAD_SUB_CLS,
  SS_TABLE_LAYOUT_CLS,
  SS_TABLE_MIN_WIDTH,
  SS_TABLE_SCROLL_CLS,
  SS_TABLE_STICKY_EMPLOYEE_CLS,
  SS_TABLE_TOOLBAR_CLS,
} from '@/components/modules/payroll/salary-sheet/salary-sheet-styles';
import type { SheetFilterState, SheetRowView } from '@/components/modules/payroll/salary-sheet/salary-sheet-types';
import { buildReviewUrl } from '@/components/modules/payroll/salary-sheet/salary-sheet-types';

const DAY_FIELDS = ['presentDays', 'absentDays', 'leaveDays', 'lateDays', 'otHours'] as const;
const MONEY_FIELDS = ['advanceBalance', 'advanceDeduct', 'otherDeduction'] as const;
const PCT_FIELDS = ['bonusPercent'] as const;

type DayField = typeof DAY_FIELDS[number];
type MoneyField = typeof MONEY_FIELDS[number];
type PctField = typeof PCT_FIELDS[number];
type NumField = DayField | MoneyField | PctField;

function stickyRowBg(index: number, locked: boolean) {
  if (locked) return 'bg-emerald-50/30';
  return index % 2 === 1 ? 'bg-slate-50/50' : 'bg-white';
}

function inputLockedCls(locked: boolean) {
  return locked ? ' bg-slate-100 cursor-not-allowed opacity-70' : '';
}

export function SalarySheetTable({
  rows,
  filters,
  onUpdate,
}: {
  rows: SheetRowView[];
  filters: SheetFilterState;
  onUpdate: (entryId: string, patch: Record<string, unknown>) => void;
}) {
  const router = useRouter();

  const totals = useMemo(() => rows.reduce((acc, row) => ({
    present: acc.present + Number(row.entry.presentDays ?? 0),
    absent: acc.absent + Number(row.entry.absentDays ?? 0),
    leave: acc.leave + Number(row.entry.leaveDays ?? 0),
    late: acc.late + Number(row.entry.lateDays ?? 0),
    advanceBalance: acc.advanceBalance + Number(row.entry.advanceBalance ?? 0),
    advanceDeduct: acc.advanceDeduct + Number(row.entry.advanceDeduct ?? 0),
    otHours: acc.otHours + Number(row.entry.otHours ?? 0),
    otAmount: acc.otAmount + row.computed.otAmount,
    bonusAmount: acc.bonusAmount + row.computed.bonusAmount,
    otherDeduction: acc.otherDeduction + Number(row.entry.otherDeduction ?? 0),
    totalDeductions: acc.totalDeductions + row.computed.totalDeductions,
    netPayable: acc.netPayable + row.computed.netPayable,
  }), {
    present: 0, absent: 0, leave: 0, late: 0,
    advanceBalance: 0, advanceDeduct: 0,
    otHours: 0, otAmount: 0, bonusAmount: 0,
    otherDeduction: 0, totalDeductions: 0, netPayable: 0,
  }), [rows]);

  const cellInput = (
    entryId: string,
    field: NumField,
    value: number,
    locked: boolean,
    cls: string,
  ) => (
    <input
      type="number"
      className={`${cls}${inputLockedCls(locked)}`}
      value={value}
      readOnly={locked}
      onChange={(e) => {
        if (locked) return;
        onUpdate(entryId, { [field]: Math.max(0, Number(e.target.value) || 0) });
      }}
    />
  );

  return (
    <div className={SS_TABLE_CARD_CLS}>
      <div className={SS_TABLE_TOOLBAR_CLS}>
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Employee Salary Details</h3>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
            Scroll horizontally to view all salary columns
          </p>
        </div>
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 text-xs font-bold text-slate-600">
          {rows.length} {rows.length === 1 ? 'employee' : 'employees'}
        </span>
      </div>

      <div className={SS_TABLE_SCROLL_CLS}>
        <table
          className={SS_TABLE_LAYOUT_CLS}
          style={{ minWidth: `${SS_TABLE_MIN_WIDTH}px` }}
        >
          <colgroup>
            {SS_TABLE_COL_WIDTHS.map((width, i) => (
              <col key={i} style={{ width: `${width}px` }} />
            ))}
          </colgroup>
          <thead>
            <tr className={`${SS_TABLE_HEAD_CLS} border-b border-slate-200`}>
              <th rowSpan={2} className={`${SS_TABLE_CELL_CLS} text-left ${SS_TABLE_STICKY_EMPLOYEE_CLS} bg-slate-50`}>Employee</th>
              <th rowSpan={2} className={`${SS_TABLE_CELL_CLS} text-left`}>Basic</th>
              <th colSpan={4} className={`${SS_TABLE_HEAD_GROUP_CLS} text-center ${SS_TABLE_GROUP_ATTENDANCE}`}>Attendance (Days)</th>
              <th colSpan={2} className={`${SS_TABLE_HEAD_GROUP_CLS} text-center ${SS_TABLE_GROUP_ADVANCE}`}>Advance (৳)</th>
              <th rowSpan={2} className={`${SS_TABLE_CELL_CLS} text-center border-l border-slate-200`}>Extra Pay</th>
              <th colSpan={3} className={`${SS_TABLE_HEAD_GROUP_CLS} text-center ${SS_TABLE_GROUP_OT}`}>Overtime</th>
              <th colSpan={2} className={`${SS_TABLE_HEAD_GROUP_CLS} text-center ${SS_TABLE_GROUP_BONUS}`}>Bonus</th>
              <th colSpan={2} className={`${SS_TABLE_HEAD_GROUP_CLS} text-center ${SS_TABLE_GROUP_DEDUCTION}`}>Deductions</th>
              <th rowSpan={2} className={`${SS_TABLE_CELL_CLS} text-left border-l border-slate-200`}>Net Salary</th>
              <th rowSpan={2} className={`${SS_TABLE_CELL_CLS} text-center`}>Status</th>
              <th rowSpan={2} className={`${SS_TABLE_CELL_CLS} text-center`}>Action</th>
            </tr>
            <tr className={`${SS_TABLE_HEAD_CLS} border-b border-slate-200`}>
              <th className={`${SS_TABLE_HEAD_SUB_CLS} text-left ${SS_TABLE_GROUP_ATTENDANCE}`}>Present</th>
              <th className={`${SS_TABLE_HEAD_SUB_CLS} text-left ${SS_TABLE_GROUP_ATTENDANCE}`}>Absent</th>
              <th className={`${SS_TABLE_HEAD_SUB_CLS} text-left ${SS_TABLE_GROUP_ATTENDANCE}`}>Leave</th>
              <th className={`${SS_TABLE_HEAD_SUB_CLS} text-left ${SS_TABLE_GROUP_ATTENDANCE}`}>Late</th>
              <th className={`${SS_TABLE_HEAD_SUB_CLS} text-left ${SS_TABLE_GROUP_ADVANCE}`}>Balance</th>
              <th className={`${SS_TABLE_HEAD_SUB_CLS} text-left ${SS_TABLE_GROUP_ADVANCE}`}>Deduct</th>
              <th className={`${SS_TABLE_HEAD_SUB_CLS} text-left ${SS_TABLE_GROUP_OT}`}>Hours</th>
              <th className={`${SS_TABLE_HEAD_SUB_CLS} text-left ${SS_TABLE_GROUP_OT}`}>Rate/Hr</th>
              <th className={`${SS_TABLE_HEAD_SUB_CLS} text-left ${SS_TABLE_GROUP_OT}`}>Amount</th>
              <th className={`${SS_TABLE_HEAD_SUB_CLS} text-left ${SS_TABLE_GROUP_BONUS}`}>%</th>
              <th className={`${SS_TABLE_HEAD_SUB_CLS} text-left ${SS_TABLE_GROUP_BONUS}`}>Amount</th>
              <th className={`${SS_TABLE_HEAD_SUB_CLS} text-left ${SS_TABLE_GROUP_DEDUCTION}`}>Other</th>
              <th className={`${SS_TABLE_HEAD_SUB_CLS} text-left ${SS_TABLE_GROUP_DEDUCTION}`}>Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const entryId = String(row.entry.id);
              const status = String(row.entry.status ?? 'pending');
              const locked = status === 'paid';
              const name = String(row.employee.name ?? 'Employee');
              const extraType = row.computed.extraPayType;
              const rowBg = stickyRowBg(index, locked);

              return (
                <tr
                  key={entryId}
                  className={`border-t border-slate-100 hover:bg-blue-50/20 transition-colors ${rowBg}`}
                >
                  <td className={`${SS_TABLE_CELL_CLS} ${SS_TABLE_STICKY_EMPLOYEE_CLS} ${rowBg}`}>
                    <span className="inline-flex items-center gap-2 min-w-0">
                      <span className="w-5 shrink-0 text-[11px] font-bold text-slate-400 tabular-nums">{index + 1}</span>
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${employeeAvatarClass(name)}`}>
                        {employeeInitials(name)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-bold text-slate-800 truncate">{name}</span>
                        <span className="block text-[10px] text-slate-500 font-medium truncate">{String(row.employee.employeeCode ?? row.employee.id)}</span>
                      </span>
                    </span>
                  </td>
                  <td className={`${SS_TABLE_CELL_CLS} ${SS_CELL_READONLY_CLS}`}>{formatMoney(row.computed.basic)}</td>
                  <td className={`${SS_TABLE_CELL_CLS} text-left ${SS_TABLE_GROUP_ATTENDANCE}`}>{cellInput(entryId, 'presentDays', Number(row.entry.presentDays ?? 0), locked, SS_CELL_EDIT_DAY_CLS)}</td>
                  <td className={`${SS_TABLE_CELL_CLS} text-left ${SS_TABLE_GROUP_ATTENDANCE}`}>{cellInput(entryId, 'absentDays', Number(row.entry.absentDays ?? 0), locked, SS_CELL_EDIT_DAY_CLS)}</td>
                  <td className={`${SS_TABLE_CELL_CLS} text-left ${SS_TABLE_GROUP_ATTENDANCE}`}>{cellInput(entryId, 'leaveDays', Number(row.entry.leaveDays ?? 0), locked, SS_CELL_EDIT_DAY_CLS)}</td>
                  <td className={`${SS_TABLE_CELL_CLS} text-left ${SS_TABLE_GROUP_ATTENDANCE}`}>{cellInput(entryId, 'lateDays', Number(row.entry.lateDays ?? 0), locked, SS_CELL_EDIT_DAY_CLS)}</td>
                  <td className={`${SS_TABLE_CELL_CLS} text-left ${SS_TABLE_GROUP_ADVANCE}`}>{cellInput(entryId, 'advanceBalance', Number(row.entry.advanceBalance ?? 0), locked, SS_CELL_EDIT_MONEY_CLS)}</td>
                  <td className={`${SS_TABLE_CELL_CLS} text-left ${SS_TABLE_GROUP_ADVANCE}`}>{cellInput(entryId, 'advanceDeduct', Number(row.entry.advanceDeduct ?? 0), locked, SS_CELL_EDIT_MONEY_CLS)}</td>
                  <td className={`${SS_TABLE_CELL_CLS} text-center border-l border-slate-100`}>
                    <span className={`inline-flex px-1.5 py-0.5 rounded-md border text-[10px] font-bold ${SS_EXTRA_PAY_BADGE[extraType] ?? SS_EXTRA_PAY_BADGE.None}`}>
                      {extraType}
                    </span>
                  </td>
                  <td className={`${SS_TABLE_CELL_CLS} text-left ${SS_TABLE_GROUP_OT}`}>{cellInput(entryId, 'otHours', Number(row.entry.otHours ?? 0), locked, SS_CELL_EDIT_DAY_CLS)}</td>
                  <td className={`${SS_TABLE_CELL_CLS} text-left ${SS_TABLE_GROUP_OT} ${SS_CELL_READONLY_MUTED_CLS}`}>{formatMoney(row.computed.otRate)}</td>
                  <td className={`${SS_TABLE_CELL_CLS} text-left ${SS_TABLE_GROUP_OT} ${SS_CELL_READONLY_CLS}`}>{formatMoney(row.computed.otAmount)}</td>
                  <td className={`${SS_TABLE_CELL_CLS} text-left ${SS_TABLE_GROUP_BONUS}`}>{cellInput(entryId, 'bonusPercent', Number(row.entry.bonusPercent ?? 0), locked, SS_CELL_EDIT_PCT_CLS)}</td>
                  <td className={`${SS_TABLE_CELL_CLS} text-left ${SS_TABLE_GROUP_BONUS} ${SS_CELL_READONLY_CLS}`}>{formatMoney(row.computed.bonusAmount)}</td>
                  <td className={`${SS_TABLE_CELL_CLS} text-left ${SS_TABLE_GROUP_DEDUCTION}`}>{cellInput(entryId, 'otherDeduction', Number(row.entry.otherDeduction ?? 0), locked, SS_CELL_EDIT_MONEY_CLS)}</td>
                  <td className={`${SS_TABLE_CELL_CLS} text-left ${SS_TABLE_GROUP_DEDUCTION} text-xs font-bold text-rose-600 tabular-nums`}>{formatMoney(row.computed.totalDeductions)}</td>
                  <td className={`${SS_TABLE_CELL_CLS} border-l border-slate-100 text-xs font-extrabold text-emerald-700 tabular-nums text-left`}>
                    {formatMoney(row.computed.netPayable)}
                  </td>
                  <td className={`${SS_TABLE_CELL_CLS} text-center`}>
                    <span className={`inline-flex px-1.5 py-0.5 rounded-lg border text-[10px] font-bold capitalize ${SS_STATUS_BADGE[status] ?? SS_STATUS_BADGE.pending}`}>
                      {status}
                    </span>
                  </td>
                  <td className={`${SS_TABLE_CELL_CLS} text-center`}>
                    {status === 'paid' ? (
                      <button
                        type="button"
                        className={SS_ACTION_BTN_PAID_CLS}
                        onClick={() => toast.info('Feature coming soon', { module: 'Salary Sheet', description: "Payslip preview coming soon." })}
                      >
                        View Payslip
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={SS_ACTION_BTN_CLS}
                        onClick={() => router.push(buildReviewUrl(String(row.employee.id), filters))}
                      >
                        Review &amp; Pay
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          {rows.length > 0 ? (
            <tfoot>
              <tr className={SS_TABLE_FOOTER_CLS}>
                <td className={`${SS_TABLE_CELL_CLS} ${SS_TABLE_STICKY_EMPLOYEE_CLS} bg-slate-50/80`}>Totals</td>
                <td className={SS_TABLE_CELL_CLS} />
                <td className={`${SS_TABLE_CELL_CLS} text-left tabular-nums ${SS_TABLE_GROUP_ATTENDANCE}`}>{totals.present}</td>
                <td className={`${SS_TABLE_CELL_CLS} text-left tabular-nums ${SS_TABLE_GROUP_ATTENDANCE}`}>{totals.absent}</td>
                <td className={`${SS_TABLE_CELL_CLS} text-left tabular-nums ${SS_TABLE_GROUP_ATTENDANCE}`}>{totals.leave}</td>
                <td className={`${SS_TABLE_CELL_CLS} text-left tabular-nums ${SS_TABLE_GROUP_ATTENDANCE}`}>{totals.late}</td>
                <td className={`${SS_TABLE_CELL_CLS} text-left tabular-nums text-xs ${SS_TABLE_GROUP_ADVANCE}`}>{formatMoney(totals.advanceBalance)}</td>
                <td className={`${SS_TABLE_CELL_CLS} text-left tabular-nums text-xs ${SS_TABLE_GROUP_ADVANCE}`}>{formatMoney(totals.advanceDeduct)}</td>
                <td className={SS_TABLE_CELL_CLS} />
                <td className={`${SS_TABLE_CELL_CLS} text-left tabular-nums ${SS_TABLE_GROUP_OT}`}>{totals.otHours}</td>
                <td className={`${SS_TABLE_CELL_CLS} ${SS_TABLE_GROUP_OT}`} />
                <td className={`${SS_TABLE_CELL_CLS} text-left tabular-nums text-xs ${SS_TABLE_GROUP_OT}`}>{formatMoney(totals.otAmount)}</td>
                <td className={`${SS_TABLE_CELL_CLS} ${SS_TABLE_GROUP_BONUS}`} />
                <td className={`${SS_TABLE_CELL_CLS} text-left tabular-nums text-xs ${SS_TABLE_GROUP_BONUS}`}>{formatMoney(totals.bonusAmount)}</td>
                <td className={`${SS_TABLE_CELL_CLS} text-left tabular-nums text-xs ${SS_TABLE_GROUP_DEDUCTION}`}>{formatMoney(totals.otherDeduction)}</td>
                <td className={`${SS_TABLE_CELL_CLS} text-left tabular-nums text-xs text-rose-600 ${SS_TABLE_GROUP_DEDUCTION}`}>{formatMoney(totals.totalDeductions)}</td>
                <td className={`${SS_TABLE_CELL_CLS} text-left tabular-nums text-xs text-emerald-700`}>{formatMoney(totals.netPayable)}</td>
                <td className={SS_TABLE_CELL_CLS} />
                <td className={SS_TABLE_CELL_CLS} />
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>

      {rows.length === 0 ? (
        <div className="p-10 text-center text-sm text-slate-500 font-medium">No employees found for this period.</div>
      ) : null}
    </div>
  );
}
