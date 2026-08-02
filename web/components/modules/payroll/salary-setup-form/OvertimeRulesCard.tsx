'use client';

import { OT_RATE_TYPE_OPTIONS } from '@/components/modules/payroll/salary-setup-form/salary-setup-form-options';
import { FormToggle } from '@/components/modules/payroll/salary-setup-form/FormToggle';
import {
  SS_CARD_CLS,
  SS_INPUT_CLS,
  SS_LABEL_CLS,
  SS_SECTION_TITLE_CLS,
  SS_SELECT_CLS,
} from '@/components/modules/payroll/salary-setup-form/salary-setup-form-styles';
import type { SalarySetupFormValues } from '@/components/modules/payroll/salary-setup-form/salary-setup-form-types';

export function OvertimeRulesCard({
  form,
  onChange,
}: {
  form: SalarySetupFormValues;
  onChange: (patch: Partial<SalarySetupFormValues>) => void;
}) {
  return (
    <div className={SS_CARD_CLS}>
      <div className="flex items-center justify-between gap-3">
        <h4 className={SS_SECTION_TITLE_CLS}>Overtime Rules</h4>
        <FormToggle
          enabled={form.overtimeEnabled}
          onChange={(overtimeEnabled) => onChange({ overtimeEnabled })}
        />
      </div>
      {form.overtimeEnabled ? (
        <div className="space-y-3">
          <div>
            <label className={SS_LABEL_CLS}>OT Rate Type</label>
            <select
              className={SS_SELECT_CLS}
              value={form.otRateType}
              onChange={(e) => onChange({ otRateType: e.target.value })}
            >
              {OT_RATE_TYPE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={SS_LABEL_CLS}>OT Rate (Per Hour)</label>
            <input
              className={SS_INPUT_CLS}
              type="number"
              value={form.otRate}
              onChange={(e) => onChange({ otRate: e.target.value })}
            />
          </div>
          <div>
            <label className={SS_LABEL_CLS}>Holiday OT Rate (Per Hour)</label>
            <input
              className={SS_INPUT_CLS}
              type="number"
              value={form.holidayOtRate}
              onChange={(e) => onChange({ holidayOtRate: e.target.value })}
            />
          </div>
          <div>
            <label className={SS_LABEL_CLS}>Weekly Off OT Rate (Per Hour)</label>
            <input
              className={SS_INPUT_CLS}
              type="number"
              value={form.weeklyOffOtRate}
              onChange={(e) => onChange({ weeklyOffOtRate: e.target.value })}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
