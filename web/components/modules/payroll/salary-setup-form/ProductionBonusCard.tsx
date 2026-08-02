'use client';

import {
  BONUS_ON_OPTIONS,
  BONUS_TYPE_OPTIONS,
} from '@/components/modules/payroll/salary-setup-form/salary-setup-form-options';
import { FormToggle } from '@/components/modules/payroll/salary-setup-form/FormToggle';
import {
  SS_CARD_CLS,
  SS_INPUT_CLS,
  SS_LABEL_CLS,
  SS_SECTION_TITLE_CLS,
  SS_SELECT_CLS,
} from '@/components/modules/payroll/salary-setup-form/salary-setup-form-styles';
import type { SalarySetupFormValues } from '@/components/modules/payroll/salary-setup-form/salary-setup-form-types';

export function ProductionBonusCard({
  form,
  onChange,
}: {
  form: SalarySetupFormValues;
  onChange: (patch: Partial<SalarySetupFormValues>) => void;
}) {
  return (
    <div className={SS_CARD_CLS}>
      <div className="flex items-center justify-between gap-3">
        <h4 className={SS_SECTION_TITLE_CLS}>Production Bonus Rules</h4>
        <FormToggle
          enabled={form.bonusEnabled}
          onChange={(bonusEnabled) => onChange({ bonusEnabled })}
        />
      </div>
      {form.bonusEnabled ? (
        <div className="space-y-3">
          <div>
            <label className={SS_LABEL_CLS}>Bonus Type</label>
            <select
              className={SS_SELECT_CLS}
              value={form.bonusType}
              onChange={(e) => onChange({ bonusType: e.target.value })}
            >
              {BONUS_TYPE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={SS_LABEL_CLS}>Bonus On</label>
            <select
              className={SS_SELECT_CLS}
              value={form.bonusOn}
              onChange={(e) => onChange({ bonusOn: e.target.value })}
            >
              {BONUS_ON_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={SS_LABEL_CLS}>Bonus Percentage (%)</label>
            <input
              className={SS_INPUT_CLS}
              type="number"
              value={form.bonusPercent}
              onChange={(e) => onChange({ bonusPercent: e.target.value })}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
