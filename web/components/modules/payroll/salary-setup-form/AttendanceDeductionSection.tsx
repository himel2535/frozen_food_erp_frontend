'use client';

import {
  ABSENT_DEDUCTION_OPTIONS,
  HALF_DAY_DEDUCTION_OPTIONS,
  LATE_DEDUCTION_OPTIONS,
} from '@/components/modules/payroll/salary-setup-form/salary-setup-form-options';
import {
  SS_INFO_BOX_CLS,
  SS_INPUT_CLS,
  SS_LABEL_CLS,
  SS_SECTION_TITLE_CLS,
  SS_SELECT_CLS,
} from '@/components/modules/payroll/salary-setup-form/salary-setup-form-styles';
import type { SalarySetupFormValues } from '@/components/modules/payroll/salary-setup-form/salary-setup-form-types';
import { computePerDaySalary, formatMoney, getBasicSalaryAmount } from '@/lib/services/payroll-service';

export function AttendanceDeductionSection({
  form,
  onChange,
}: {
  form: SalarySetupFormValues;
  onChange: (patch: Partial<SalarySetupFormValues>) => void;
}) {
  const basic = getBasicSalaryAmount(form.components);
  const workingDays = Number(form.workingDays || 0);
  const perDay = computePerDaySalary(basic, workingDays);

  return (
    <div className="space-y-4">
      <h4 className={SS_SECTION_TITLE_CLS}>Attendance & Deduction Rules</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={SS_LABEL_CLS}>Working Days in Month</label>
          <input
            className={SS_INPUT_CLS}
            type="number"
            value={form.workingDays}
            onChange={(e) => onChange({ workingDays: e.target.value })}
          />
        </div>
        <div>
          <label className={SS_LABEL_CLS}>Per Day Salary (Auto)</label>
          <input className={`${SS_INPUT_CLS} bg-slate-50`} readOnly value={formatMoney(perDay)} />
          <div className={`${SS_INFO_BOX_CLS} mt-2`}>
            Per Day Salary is calculated based on Basic Salary only.
          </div>
        </div>
        <div>
          <label className={SS_LABEL_CLS}>Absent Deduction</label>
          <select
            className={SS_SELECT_CLS}
            value={form.absentDeduction}
            onChange={(e) => onChange({ absentDeduction: e.target.value })}
          >
            {ABSENT_DEDUCTION_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={SS_LABEL_CLS}>Half Day Deduction</label>
          <select
            className={SS_SELECT_CLS}
            value={form.halfDayDeduction}
            onChange={(e) => onChange({ halfDayDeduction: e.target.value })}
          >
            {HALF_DAY_DEDUCTION_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={SS_LABEL_CLS}>Late Deduction</label>
          <select
            className={SS_SELECT_CLS}
            value={form.lateDeduction}
            onChange={(e) => onChange({ lateDeduction: e.target.value })}
          >
            {LATE_DEDUCTION_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={SS_LABEL_CLS}>Late Deduction Amount (Per Time)</label>
          <input
            className={SS_INPUT_CLS}
            type="number"
            value={form.lateDeductionAmount}
            onChange={(e) => onChange({ lateDeductionAmount: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}
