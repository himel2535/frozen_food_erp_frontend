'use client';

import Link from 'next/link';
import {
  Calendar,
  Hash,
  Flag,
  Lock,
  Package,
  User,
  Users,
} from 'lucide-react';
import { IconInput, IconSelect } from '@/components/modules/crm/customer-form/IconField';
import {
  PJ_FIELD_GRID_CLS,
  PJ_INPUT_CLS,
  PJ_LABEL_CLS,
} from '@/components/modules/projects/project-form/project-form-styles';
import {
  PRIORITY_DOT_CLS,
  PROJECT_PRIORITY_OPTIONS,
  PROJECT_TYPE_OPTIONS,
  type ProjectFormValues,
} from '@/components/modules/projects/project-form/project-form-types';

export function ProjectOrderInfoSection({
  form,
  errors,
  customers,
  salesPersons,
  onChange,
}: {
  form: ProjectFormValues;
  errors: Record<string, string>;
  customers: Array<{ id: string; name: string; company: string }>;
  salesPersons: Array<{ id: string; name: string }>;
  onChange: (patch: Partial<ProjectFormValues>) => void;
}) {
  return (
    <div className={PJ_FIELD_GRID_CLS}>
      <div>
        <label className={PJ_LABEL_CLS}>Project / Order ID</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            readOnly
            value={form.projectId}
            className={`${PJ_INPUT_CLS} pl-10 bg-slate-50/80 cursor-not-allowed`}
          />
        </div>
      </div>

      <IconInput
        label="Order Date"
        icon={Calendar}
        type="date"
        required
        value={form.orderDate}
        error={errors.orderDate}
        onChange={(e) => onChange({ orderDate: e.target.value })}
      />

      <div>
        <IconSelect
          label="Customer"
          icon={Users}
          required
          value={form.customerId}
          error={errors.customerId}
          onChange={(e) => {
            const id = e.target.value;
            const customer = customers.find((c) => c.id === id);
            onChange({
              customerId: id,
              customerName: customer ? (customer.company || customer.name) : '',
            });
          }}
        >
          <option value="">Select customer</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.company ? `${c.name} (${c.company})` : c.name}
            </option>
          ))}
        </IconSelect>
        <Link
          href="/crm/customers"
          className="inline-flex items-center gap-1 mt-1.5 text-[11px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
        >
          + New Customer
        </Link>
      </div>

      <IconInput
        label="Customer PO No."
        icon={Hash}
        value={form.customerPoNo}
        onChange={(e) => onChange({ customerPoNo: e.target.value })}
        placeholder="Customer purchase order #"
      />

      <IconSelect
        label="Sales Person"
        icon={User}
        required
        value={form.salesPersonId}
        error={errors.salesPersonId}
        onChange={(e) => {
          const id = e.target.value;
          const person = salesPersons.find((p) => p.id === id);
          onChange({ salesPersonId: id, salesPersonName: person?.name ?? '' });
        }}
      >
        <option value="">Select sales person</option>
        {salesPersons.map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </IconSelect>

      <div>
        <label className={PJ_LABEL_CLS}>
          Priority <span className="text-rose-500 normal-case">*</span>
        </label>
        <div className="relative">
          <Flag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
          <span
            className={`absolute left-8 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${
              PRIORITY_DOT_CLS[form.priority] ?? 'bg-slate-400'
            }`}
          />
          <select
            value={form.priority}
            onChange={(e) => onChange({ priority: e.target.value })}
            className={`${PJ_INPUT_CLS} pl-12 cursor-pointer appearance-none${
              errors.priority ? ' border-rose-400' : ''
            }`}
          >
            {PROJECT_PRIORITY_OPTIONS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
        {errors.priority ? (
          <p className="mt-1 text-[10px] font-semibold text-rose-600">{errors.priority}</p>
        ) : null}
      </div>

      <IconInput
        label="Expected Delivery Date"
        icon={Calendar}
        type="date"
        required
        value={form.expectedDeliveryDate}
        error={errors.expectedDeliveryDate}
        onChange={(e) => onChange({ expectedDeliveryDate: e.target.value })}
      />

      <IconSelect
        label="Project Type"
        icon={Package}
        required
        value={form.projectType}
        error={errors.projectType}
        onChange={(e) => onChange({ projectType: e.target.value })}
      >
        <option value="">Select type</option>
        {PROJECT_TYPE_OPTIONS.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </IconSelect>

    </div>
  );
}
