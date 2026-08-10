'use client';

import { toast } from '@/lib/ui/feedback';

import { useRef, useState, type FormEvent } from 'react';
import { FormHeader } from '@/components/layout/FormHeader';
import { EmployeeRegisterForm } from '@/components/modules/hrm/employee-form/EmployeeRegisterForm';
import {
  PO_BTN_GHOST,
  PO_BTN_PRIMARY,
} from '@/components/modules/purchases/purchase-order-form/po-form-styles';
import { validateEmployeeForm } from '@/components/modules/hrm/employee-form/employee-form-validation';
import { MODULE_LIST_SHELL } from '@/lib/ui/module-layout';
import type { AppState } from '@/lib/state/types';

export function EmployeeForm({
  mode,
  initialValues,
  appState,
  onCancel,
  onSave,
}: {
  mode: 'create' | 'edit';
  initialValues: Record<string, string>;
  appState: AppState;
  onCancel: () => void;
  onSave: (values: Record<string, string>) => void;
}) {
  const [form, setForm] = useState<Record<string, string>>(initialValues);
  const formRef = useRef<HTMLFormElement>(null);

  const setField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const nextErrors = validateEmployeeForm(form);
    if (Object.keys(nextErrors).length > 0) {
      toast.error('Please fill required fields', {
        module: 'HRM',
        description: Object.values(nextErrors)[0] ?? 'Check the form and try again.',
      });
      return;
    }
    onSave(form);
  };

  const title = mode === 'edit' ? 'Edit Employee' : 'Create Employee';
  const subtitle = mode === 'edit'
    ? 'Update employee profile and assignment details.'
    : 'Add a new employee and assign salary setup.';
  const submitLabel = mode === 'edit' ? 'Save Employee' : 'Create Employee';

  return (
    <div className={MODULE_LIST_SHELL}>
      <form ref={formRef} onSubmit={handleSubmit} noValidate className="w-full flex flex-col min-h-full pb-4">
        <div className="pt-3 md:pt-4 mb-2 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-2">
          <FormHeader
            compact
            title={title}
            subtitle={subtitle}
            onBack={onCancel}
            backLabel="Back to Employees"
          />
          <div className="flex flex-wrap items-center gap-2 self-start">
            <button type="button" onClick={onCancel} className={PO_BTN_GHOST}>Cancel</button>
            <button type="submit" className={PO_BTN_PRIMARY}>{submitLabel}</button>
          </div>
        </div>

        <EmployeeRegisterForm form={form} setField={setField} appState={appState} />
      </form>
    </div>
  );
}
