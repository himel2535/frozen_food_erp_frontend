'use client';

import { useMemo, useRef, useState, type FormEvent } from 'react';
import { FormHeader } from '@/components/layout/FormHeader';
import { FormSectionCard } from '@/components/modules/crm/customer-form/FormSectionCard';
import { AssignedEmployeesCard } from '@/components/modules/payroll/salary-setup-form/AssignedEmployeesCard';
import { AttendanceDeductionSection } from '@/components/modules/payroll/salary-setup-form/AttendanceDeductionSection';
import { OvertimeRulesCard } from '@/components/modules/payroll/salary-setup-form/OvertimeRulesCard';
import { ProductionBonusCard } from '@/components/modules/payroll/salary-setup-form/ProductionBonusCard';
import { SalaryComponentsTable } from '@/components/modules/payroll/salary-setup-form/SalaryComponentsTable';
import {
  EMPLOYEE_TYPE_OPTIONS,
  PAY_FREQUENCY_OPTIONS,
  STATUS_OPTIONS,
} from '@/components/modules/payroll/salary-setup-form/salary-setup-form-options';
import {
  SS_BTN_GHOST,
  SS_BTN_PRIMARY,
  SS_CARD_CLS,
  SS_INPUT_CLS,
  SS_LABEL_CLS,
  SS_SELECT_CLS,
  SS_TEXTAREA_CLS,
} from '@/components/modules/payroll/salary-setup-form/salary-setup-form-styles';
import type {
  SalarySetupFormPayload,
  SalarySetupFormValues,
} from '@/components/modules/payroll/salary-setup-form/salary-setup-form-types';
import {
  validateSalarySetupForm,
  type SalarySetupFieldError,
} from '@/components/modules/payroll/salary-setup-form/salary-setup-form-validation';
import { DateInput } from '@/components/shared/DateInput';
import { MODULE_LIST_SHELL } from '@/lib/ui/module-layout';
import type { AppState } from '@/lib/state/types';
import { getAssignedEmployees } from '@/lib/services/payroll-service';

export function SalarySetupForm({
  mode,
  initialValues,
  previewId,
  appState,
  onCancel,
  onSave,
}: {
  mode: 'create' | 'edit';
  initialValues: SalarySetupFormValues;
  previewId: string;
  appState: AppState;
  onCancel: () => void;
  onSave: (payload: SalarySetupFormPayload) => void;
}) {
  const [form, setForm] = useState<SalarySetupFormValues>(initialValues);
  const [errors, setErrors] = useState<SalarySetupFieldError>({});
  const formRef = useRef<HTMLFormElement>(null);

  const assignedEmployees = useMemo(
    () => getAssignedEmployees(appState, form.assignedEmployeeIds),
    [appState, form.assignedEmployeeIds],
  );

  const updateForm = (patch: Partial<SalarySetupFormValues>) => {
    setForm((prev) => ({ ...prev, ...patch }));
    const clearedKeys = Object.keys(patch) as Array<keyof SalarySetupFormValues>;
    if (!clearedKeys.length) return;
    setErrors((prev) => {
      if (!Object.keys(prev).length) return prev;
      const next = { ...prev };
      clearedKeys.forEach((key) => delete next[key]);
      if (patch.components) delete next.components;
      return next;
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const nextErrors = validateSalarySetupForm(form);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    onSave({ ...form, previewId });
  };

  const pageTitle = mode === 'edit' ? 'Edit Salary Structure' : 'Create Salary Structure';

  return (
    <div className={MODULE_LIST_SHELL}>
      <form ref={formRef} onSubmit={handleSubmit} noValidate className="w-full flex flex-col min-h-full pb-4">
        <div className="pt-1 md:pt-2 mb-2 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-2">
          <FormHeader
            compact
            title="1. Salary Setup"
            subtitle={pageTitle}
            onBack={onCancel}
            backLabel="Back to Salary Structures"
          />
          <div className="flex flex-wrap items-center gap-2 self-start">
            <button type="button" onClick={onCancel} className={SS_BTN_GHOST}>Cancel</button>
            <button type="submit" className={SS_BTN_PRIMARY}>Save Structure</button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 flex-1">
          <div className="xl:col-span-2 flex flex-col gap-3 min-w-0">
            <FormSectionCard number={1} title="Basic Information" subtitle="Structure identity and pay schedule">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className={SS_LABEL_CLS}>Structure Name <span className="text-rose-500">*</span></label>
                  <input
                    className={`${SS_INPUT_CLS}${errors.name ? ' border-rose-400' : ''}`}
                    value={form.name}
                    onChange={(e) => updateForm({ name: e.target.value })}
                  />
                </div>
                <div>
                  <label className={SS_LABEL_CLS}>Structure Code <span className="text-rose-500">*</span></label>
                  <input
                    className={`${SS_INPUT_CLS}${errors.code ? ' border-rose-400' : ''}`}
                    value={form.code}
                    onChange={(e) => updateForm({ code: e.target.value })}
                  />
                </div>
                <div>
                  <label className={SS_LABEL_CLS}>Employee Type <span className="text-rose-500">*</span></label>
                  <select
                    className={`${SS_SELECT_CLS}${errors.employeeType ? ' border-rose-400' : ''}`}
                    value={form.employeeType}
                    onChange={(e) => updateForm({ employeeType: e.target.value })}
                  >
                    {EMPLOYEE_TYPE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={SS_LABEL_CLS}>Status <span className="text-rose-500">*</span></label>
                  <select
                    className={SS_SELECT_CLS}
                    value={form.status}
                    onChange={(e) => updateForm({ status: e.target.value })}
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={SS_LABEL_CLS}>Effective From <span className="text-rose-500">*</span></label>
                  <DateInput
                    className={`${SS_INPUT_CLS}${errors.effectiveFrom ? ' border-rose-400' : ''}`}
                    value={form.effectiveFrom}
                    onChange={(effectiveFrom) => updateForm({ effectiveFrom })}
                  />
                </div>
                <div>
                  <label className={SS_LABEL_CLS}>Pay Frequency <span className="text-rose-500">*</span></label>
                  <select
                    className={SS_SELECT_CLS}
                    value={form.payFrequency}
                    onChange={(e) => updateForm({ payFrequency: e.target.value })}
                  >
                    {PAY_FREQUENCY_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className={SS_LABEL_CLS}>Description</label>
                  <textarea
                    className={SS_TEXTAREA_CLS}
                    rows={2}
                    value={form.description}
                    onChange={(e) => updateForm({ description: e.target.value })}
                    placeholder="Optional notes about this salary structure"
                  />
                </div>
              </div>
            </FormSectionCard>

            <section className={SS_CARD_CLS}>
              <SalaryComponentsTable
                components={form.components}
                onChange={(components) => updateForm({ components })}
              />
              {errors.components ? (
                <p className="text-xs font-semibold text-rose-600">{errors.components}</p>
              ) : null}
            </section>

            <section className={SS_CARD_CLS}>
              <AttendanceDeductionSection form={form} onChange={updateForm} />
            </section>
          </div>

          <div className="xl:col-span-1 flex flex-col gap-3 min-w-0">
            <OvertimeRulesCard form={form} onChange={updateForm} />
            <ProductionBonusCard form={form} onChange={updateForm} />
            <AssignedEmployeesCard employees={assignedEmployees} totalCount={form.assignedEmployeeIds.length} />
          </div>
        </div>
      </form>
    </div>
  );
}
