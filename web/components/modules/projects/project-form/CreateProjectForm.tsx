'use client';

import { useMemo, useRef, useState, type FormEvent } from 'react';
import { ArrowRight, Plus, Save } from 'lucide-react';
import { FormHeader } from '@/components/layout/FormHeader';
import { MODULE_LIST_SHELL } from '@/lib/ui/module-layout';
import { ProjectFormStepper } from '@/components/modules/projects/project-form/ProjectFormStepper';
import { ProjectSectionCard } from '@/components/modules/projects/project-form/ProjectSectionCard';
import { ProjectOrderInfoSection } from '@/components/modules/projects/project-form/ProjectOrderInfoSection';
import { ProjectItemsTable } from '@/components/modules/projects/project-form/ProjectItemsTable';
import { ProjectRequirementsSection } from '@/components/modules/projects/project-form/ProjectRequirementsSection';
import { ProjectSummaryCard } from '@/components/modules/projects/project-form/ProjectSummaryCard';
import { ProjectHelpTip, ProjectSetupProgress } from '@/components/modules/projects/project-form/ProjectSetupProgress';
import {
  PJ_ADD_ITEM_BTN_CLS,
  PJ_BTN_GHOST,
  PJ_BTN_OUTLINE,
  PJ_BTN_PRIMARY,
  PJ_FOOTER_CLS,
} from '@/components/modules/projects/project-form/project-form-styles';
import type { ProjectFormValues, ProjectSaveAction } from '@/components/modules/projects/project-form/project-form-types';
import type { AppState } from '@/lib/state/types';
import {
  computeProjectTotals,
  createEmptyProjectLineItem,
  formatProjectMoney,
  listProjectCustomerOptions,
  listProjectProductOptions,
  listSalesPersonOptions,
  validateProjectForm,
} from '@/lib/services/projects-service';

export function CreateProjectForm({
  initialValues,
  appState,
  onCancel,
  onSave,
}: {
  initialValues: ProjectFormValues;
  appState: AppState;
  onCancel: () => void;
  onSave: (form: ProjectFormValues, action: ProjectSaveAction) => void;
}) {
  const [form, setForm] = useState<ProjectFormValues>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const saveActionRef = useRef<ProjectSaveAction>('draft');
  const formRef = useRef<HTMLFormElement>(null);

  const customers = useMemo(() => listProjectCustomerOptions(appState), [appState]);
  const productOptions = useMemo(() => listProjectProductOptions(appState), [appState]);
  const salesPersons = useMemo(() => listSalesPersonOptions(appState), [appState]);
  const totals = useMemo(() => computeProjectTotals(form.items), [form.items]);

  const updateForm = (patch: Partial<ProjectFormValues>) => {
    setForm((prev) => ({ ...prev, ...patch }));
    const clearedKeys = Object.keys(patch);
    if (!clearedKeys.length) return;
    setErrors((prev) => {
      if (!Object.keys(prev).length) return prev;
      const next = { ...prev };
      clearedKeys.forEach((key) => delete next[key]);
      if (patch.items) delete next.items;
      return next;
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const action = saveActionRef.current;
    const nextErrors = validateProjectForm(form, action);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    saveActionRef.current = 'draft';
    onSave(form, action);
  };

  return (
    <div className={MODULE_LIST_SHELL}>
      <form ref={formRef} onSubmit={handleSubmit} noValidate className="w-full flex flex-col min-h-full pb-4">
        <div className="pt-3 md:pt-4 mb-2">
          <FormHeader
            compact
            title="Create New Project / Order"
            subtitle="Enter order details, products, and requirements to start a new production project."
            onBack={onCancel}
          />
        </div>

        <ProjectFormStepper activeStep={1} />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-2 flex-1">
          <div className="flex flex-col gap-2 min-w-0">
            <ProjectSectionCard
              letter="A"
              title="Order Information"
              subtitle="Customer, sales person, and delivery schedule"
            >
              <ProjectOrderInfoSection
                form={form}
                errors={errors}
                customers={customers}
                salesPersons={salesPersons}
                onChange={updateForm}
              />
            </ProjectSectionCard>

            <ProjectSectionCard
              letter="B"
              title="Product / Order Items"
              subtitle="Add products, quantities, and pricing"
              action={
                <button
                  type="button"
                  onClick={() => updateForm({ items: [...form.items, createEmptyProjectLineItem()] })}
                  className={PJ_ADD_ITEM_BTN_CLS}
                >
                  <Plus className="w-3.5 h-3.5" /> Add Product
                </button>
              }
            >
              <ProjectItemsTable
                items={form.items}
                productOptions={productOptions}
                onChange={(items) => updateForm({ items })}
                error={errors.items}
              />
            </ProjectSectionCard>

            <ProjectSectionCard
              letter="C"
              title="Requirements"
              subtitle="Specifications, packaging, branding, and special instructions"
            >
              <ProjectRequirementsSection form={form} onChange={updateForm} />
            </ProjectSectionCard>
          </div>

          <aside className="flex flex-col gap-2 lg:sticky lg:top-4 lg:self-start">
            <ProjectSummaryCard form={form} />
            <ProjectSetupProgress activeStep={1} />
            <ProjectHelpTip />
          </aside>
        </div>

        <div className={PJ_FOOTER_CLS}>
          <p className="text-[11px] font-semibold text-slate-500">
            {totals.totalQty.toLocaleString()} pcs · {formatProjectMoney(totals.totalValue)} total order value
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={onCancel} className={PJ_BTN_GHOST}>
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                saveActionRef.current = 'draft';
                formRef.current?.requestSubmit();
              }}
              className={PJ_BTN_OUTLINE}
            >
              <Save className="w-4 h-4" />
              Save Draft
            </button>
            <button
              type="button"
              onClick={() => {
                saveActionRef.current = 'create';
                formRef.current?.requestSubmit();
              }}
              className={PJ_BTN_PRIMARY}
            >
              Create Project &amp; Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
