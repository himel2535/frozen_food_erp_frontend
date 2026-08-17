'use client';

import { useMemo } from 'react';
import {
  Briefcase,
  Building2,
  Calendar,
  CreditCard,
  Fingerprint,
  Lock,
  Mail,
  MapPin,
  Phone,
  User,
  Wallet,
} from 'lucide-react';
import { FormSectionCard } from '@/components/modules/crm/customer-form/FormSectionCard';
import { IconInput, IconSelect, IconTextarea } from '@/components/modules/crm/customer-form/IconField';
import { EmployeeSummaryCard } from '@/components/modules/hrm/employee-form/EmployeeSummaryCard';
import { SalarySetupPreview } from '@/components/modules/hrm/employee-form/SalarySetupPreview';
import {
  ADDRESS_MAX_LENGTH,
  EMPLOYEE_STATUS_OPTIONS,
  EMPLOYEE_TYPE_OPTIONS,
  PAYMENT_METHOD_INFO,
  PAYMENT_METHOD_OPTIONS,
} from '@/components/modules/hrm/employee-form/employee-form-types';
import { ImageUploadField, type PendingImageUpload } from '@/components/shared/ImageUploadField';
import type { AppState } from '@/lib/state/types';
import { useHrmDepartmentOptions, useHrmDesignationOptions } from '@/hooks/use-form-options';
import { formatMoney, getSalaryStructureById, listSalaryStructures } from '@/lib/services/payroll-service';

function formatStructureOptionLabel(structure: Record<string, unknown>) {
  const name = String(structure.name ?? 'Setup');
  const base = Number(structure.base ?? 0);
  const otEnabled = Boolean(structure.overtimeEnabled);
  const otRate = Number(structure.otRate ?? 0);
  const otPart = otEnabled ? ` • OT ${formatMoney(otRate)}/hr` : '';
  return `${name} — Basic ${formatMoney(base)}${otPart}`;
}

export function EmployeeRegisterForm({
  form,
  setField,
  appState,
  onPendingUpload,
}: {
  form: Record<string, string>;
  setField: (key: string, value: string) => void;
  appState: AppState;
  onPendingUpload?: (promise: Promise<PendingImageUpload | null> | null) => void;
}) {
  const departments = useHrmDepartmentOptions(appState);
  const designations = useHrmDesignationOptions(appState, form.department);

  const salaryStructures = useMemo(
    () => listSalaryStructures(appState).filter((s) => String(s.status ?? '').toLowerCase() === 'active'),
    [appState],
  );

  const selectedStructure = useMemo(
    () => (form.salaryStructureId ? getSalaryStructureById(appState, form.salaryStructureId) : null),
    [appState, form.salaryStructureId],
  );

  const paymentInfo = PAYMENT_METHOD_INFO[form.paymentMethod] ?? PAYMENT_METHOD_INFO.Cash;
  const addressLength = form.address?.length ?? 0;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-3">
      <div className="flex flex-col gap-3 min-w-0">
        <FormSectionCard number={1} title="Personal Information" subtitle="Basic employee details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <ImageUploadField
                label="Employee Photo"
                value={form.imageUrl ?? ''}
                onChange={(url, publicId) => {
                  setField('imageUrl', url);
                  setField('imagePublicId', publicId ?? '');
                }}
                onPendingUpload={onPendingUpload}
              />
            </div>
            <IconInput
              label="Full Name"
              icon={User}
              required
              value={form.name ?? ''}
              onChange={(e) => setField('name', e.target.value)}
              placeholder="Enter full name"
            />
            <IconInput
              label="Phone"
              icon={Phone}
              required
              type="tel"
              value={form.phone ?? ''}
              onChange={(e) => setField('phone', e.target.value)}
              placeholder="Enter phone number"
            />
            <IconInput
              label="Email (Optional)"
              icon={Mail}
              type="email"
              value={form.email ?? ''}
              onChange={(e) => setField('email', e.target.value)}
              placeholder="Enter email address"
            />
            <IconInput
              label="National ID (Optional)"
              icon={Fingerprint}
              value={form.nid ?? ''}
              onChange={(e) => setField('nid', e.target.value)}
              placeholder="Enter NID / ID number"
            />
          </div>
        </FormSectionCard>

        <FormSectionCard number={2} title="Job Information" subtitle="Department, role and employment">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <IconSelect
              label="Department"
              icon={Building2}
              required
              value={form.department ?? ''}
              onChange={(e) => {
                setField('department', e.target.value);
                setField('designation', '');
              }}
            >
              <option value="">Select department</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </IconSelect>
            <IconSelect
              label="Designation"
              icon={User}
              required
              value={form.designation ?? ''}
              onChange={(e) => setField('designation', e.target.value)}
            >
              <option value="">Select designation</option>
              {designations.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </IconSelect>
            <IconInput
              label="Joining Date"
              icon={Calendar}
              required
              type="date"
              value={form.joiningDate ?? ''}
              onChange={(e) => setField('joiningDate', e.target.value)}
            />
            <IconSelect
              label="Employment Type"
              icon={Briefcase}
              required
              value={form.employeeType ?? ''}
              onChange={(e) => setField('employeeType', e.target.value)}
            >
              <option value="">Select employment type</option>
              {EMPLOYEE_TYPE_OPTIONS.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </IconSelect>
            <IconSelect
              label="Status"
              icon={User}
              required
              value={form.status ?? 'active'}
              onChange={(e) => setField('status', e.target.value)}
            >
              {EMPLOYEE_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </IconSelect>
            <IconInput
              label="Employee Code (Auto)"
              icon={Lock}
              value={form.employeeCode ?? ''}
              readOnly
              disabled
              className="opacity-90"
            />
          </div>
        </FormSectionCard>

        <FormSectionCard number={3} title="Salary Setup" subtitle="Assign salary structure / worker type">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <IconSelect
              label="Salary Setup / Worker Type"
              icon={Wallet}
              required
              value={form.salaryStructureId ?? ''}
              onChange={(e) => setField('salaryStructureId', e.target.value)}
            >
              <option value="">Select salary setup</option>
              {salaryStructures.map((structure) => (
                <option key={String(structure.id)} value={String(structure.id)}>
                  {formatStructureOptionLabel(structure)}
                </option>
              ))}
            </IconSelect>
            <SalarySetupPreview structure={selectedStructure} />
          </div>
        </FormSectionCard>
      </div>

      <aside className="flex flex-col gap-3 min-w-0">
        <FormSectionCard number={4} title="Payment Information" subtitle="Salary payment method and contact">
          <div className="space-y-3">
            <IconSelect
              label="Payment Method"
              icon={CreditCard}
              required
              value={form.paymentMethod ?? 'Cash'}
              onChange={(e) => setField('paymentMethod', e.target.value)}
            >
              {PAYMENT_METHOD_OPTIONS.map((method) => (
                <option key={method} value={method}>{method}</option>
              ))}
            </IconSelect>
            <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-2.5 text-[11px] font-medium text-emerald-800 leading-relaxed">
              {paymentInfo}
            </div>
            <IconInput
              label="Emergency Contact (Optional)"
              icon={Phone}
              type="tel"
              value={form.emergencyPhone ?? ''}
              onChange={(e) => setField('emergencyPhone', e.target.value)}
              placeholder="Enter emergency contact number"
            />
            <div>
              <IconTextarea
                label="Address (Optional)"
                icon={MapPin}
                rows={3}
                maxLength={ADDRESS_MAX_LENGTH}
                value={form.address ?? ''}
                onChange={(e) => setField('address', e.target.value.slice(0, ADDRESS_MAX_LENGTH))}
                placeholder="Enter full address"
              />
              <p className="text-[10px] font-semibold text-slate-400 text-right mt-1">
                {addressLength}/{ADDRESS_MAX_LENGTH}
              </p>
            </div>
          </div>
        </FormSectionCard>

        <EmployeeSummaryCard
          values={form}
          salarySetupName={selectedStructure ? String(selectedStructure.name ?? '') : ''}
        />
      </aside>
    </div>
  );
}
