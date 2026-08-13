import type { AppState } from '@/lib/state/types';
import {
  createInState,
  formatCurrency,
  listFromState,
  updateInState,
} from '@/lib/services/domain-service';
import { mapGenericPayloadToApi } from '@/lib/services/generic-api-mapper';
import { listEmployees } from '@/lib/services/hrm-service';
import { resolveKpiIcon } from '@/lib/ui/kpi-icons';
import type { ProjectFormValues, ProjectLineItem, ProjectSaveAction } from '@/components/modules/projects/project-form/project-form-types';
import { formatDate } from '@/lib/i18n/locale-format';

type Row = Record<string, unknown>;

export function listProjects(state: AppState) {
  return listFromState(state, 'projects');
}

export function previewProjectId(state: AppState) {
  const year = new Date().getFullYear();
  const prefix = `PRJ-${year}-`;
  const rows = listProjects(state);
  let max = 0;
  rows.forEach((row) => {
    const raw = String(row.id ?? row.projectId ?? '');
    const match = raw.match(new RegExp(`^PRJ-${year}-(\\d+)$`, 'i'));
    if (match) max = Math.max(max, Number(match[1]));
  });
  return `${prefix}${String(max + 1).padStart(4, '0')}`;
}

export function listProjectCustomerOptions(state: AppState) {
  return listFromState(state, 'crmCustomers').map((c) => ({
    id: String(c.id),
    name: String(c.name ?? 'Customer'),
    company: String(c.company ?? ''),
  }));
}

export function listProjectProductOptions(state: AppState) {
  return listFromState(state, 'inventory').map((p) => ({
    id: String(p.id),
    name: String(p.name ?? 'Product'),
    sku: String(p.sku ?? ''),
    price: Number(p.price ?? p.wholesalePrice ?? 0),
    unit: String(p.uom ?? 'pcs'),
  }));
}

export function listSalesPersonOptions(state: AppState) {
  return listEmployees(state)
    .filter((e) => String(e.status ?? 'active').toLowerCase() === 'active')
    .map((e) => ({
      id: String(e.id),
      name: String(e.name ?? 'Employee'),
    }));
}

export function getProjectInitialForm(state: AppState, projectId?: string): ProjectFormValues {
  const today = new Date().toISOString().split('T')[0];
  return {
    projectId: projectId ?? previewProjectId(state),
    orderDate: today,
    customerId: '',
    customerName: '',
    customerPoNo: '',
    salesPersonId: '',
    salesPersonName: '',
    priority: 'Medium',
    expectedDeliveryDate: '',
    projectType: '',
    items: [createEmptyProjectLineItem()],
    productSpecification: '',
    materialQuality: '',
    packagingPrinting: '',
    branding: '',
    sampleRequired: 'No',
    specialInstructions: '',
    attachments: [],
    status: 'draft',
    setupStep: 1,
    tasks: [],
    assignedStaffIds: [],
  };
}

export function createEmptyProjectLineItem(): ProjectLineItem {
  return {
    id: `line-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    productId: '',
    productName: '',
    variant: '',
    qty: 0,
    unitPrice: 0,
    lineTotal: 0,
    recipeId: '',
  };
}

export function recalcProjectLineItem(item: ProjectLineItem): ProjectLineItem {
  const qty = Number(item.qty ?? 0);
  const unitPrice = Number(item.unitPrice ?? 0);
  return {
    ...item,
    qty,
    unitPrice,
    lineTotal: Math.round(qty * unitPrice * 100) / 100,
  };
}

export function computeProjectTotals(items: ProjectLineItem[]) {
  const valid = items.map(recalcProjectLineItem);
  const totalQty = valid.reduce((sum, item) => sum + Number(item.qty ?? 0), 0);
  const totalValue = valid.reduce((sum, item) => sum + Number(item.lineTotal ?? 0), 0);
  const productCount = valid.filter((item) => item.productName.trim() && Number(item.qty) > 0).length;
  return { totalQty, totalValue, productCount, items: valid };
}

function priorityToHealth(priority: string) {
  const p = priority.toLowerCase();
  if (p === 'high') return 'At Risk';
  if (p === 'low') return 'On Track';
  return 'On Track';
}

function deriveProjectName(form: ProjectFormValues) {
  const customer = form.customerName.trim();
  const type = form.projectType.trim();
  const firstProduct = form.items.find((i) => i.productName.trim())?.productName.trim();
  if (customer && type) return `${customer} — ${type}`;
  if (customer && firstProduct) return `${customer} — ${firstProduct}`;
  if (customer) return customer;
  if (firstProduct) return firstProduct;
  return form.projectId;
}

export function projectFormToRecord(form: ProjectFormValues, action: ProjectSaveAction) {
  const totals = computeProjectTotals(form.items);
  const setupStep = action === 'create' ? 2 : 1;

  return {
    id: form.projectId,
    projectId: form.projectId,
    orderDate: form.orderDate,
    customerId: form.customerId,
    customerName: form.customerName,
    customerPoNo: form.customerPoNo,
    salesPersonId: form.salesPersonId,
    salesPersonName: form.salesPersonName,
    priority: form.priority,
    expectedDeliveryDate: form.expectedDeliveryDate,
    projectType: form.projectType,
    items: totals.items,
    productSpecification: form.productSpecification,
    materialQuality: form.materialQuality,
    packagingPrinting: form.packagingPrinting,
    branding: form.branding,
    sampleRequired: form.sampleRequired,
    specialInstructions: form.specialInstructions,
    attachments: form.attachments,
    tasks: form.tasks,
    assignedStaffIds: form.assignedStaffIds,
    status: 'draft',
    setupStep,
    setupStage: action === 'create' ? 'bom' : 'project_details',
    name: deriveProjectName(form),
    lead: form.salesPersonName,
    deadline: form.expectedDeliveryDate,
    progress: action === 'create' ? 5 : 0,
    health: priorityToHealth(form.priority),
    budget: totals.totalValue,
    totalQty: totals.totalQty,
    totalValue: totals.totalValue,
  };
}

export function getProjectById(state: AppState, id: string) {
  const trimmed = id.trim();
  return listProjects(state).find(
    (row) =>
      String(row.id) === trimmed
      || String(row._mongoId ?? '') === trimmed
      || String(row.legacyId ?? '') === trimmed
      || String(row.projectId ?? '') === trimmed,
  ) ?? null;
}

export function mapProjectFormToApi(form: ProjectFormValues, action: ProjectSaveAction) {
  return mapGenericPayloadToApi(projectFormToRecord(form, action) as Record<string, unknown>);
}

export function createProject(state: AppState, form: ProjectFormValues, action: ProjectSaveAction) {
  const record = projectFormToRecord(form, action);
  return createInState(state, 'projects', record, 'PRJ');
}

export function advanceProjectSetup(
  state: AppState,
  id: string,
  nextStep: number,
  patch: Record<string, unknown> = {},
) {
  const stages = ['project_details', 'bom', 'production_plan', 'review'] as const;
  const setupStage = stages[Math.min(Math.max(nextStep, 1), 4) - 1];
  const progressMap: Record<number, number> = { 1: 0, 2: 25, 3: 60, 4: 100 };
  return updateInState(state, 'projects', id, {
    setupStep: nextStep,
    setupStage,
    progress: progressMap[nextStep] ?? Number(patch.progress ?? 0),
    ...patch,
  });
}

export function updateProject(state: AppState, id: string, form: ProjectFormValues, action: ProjectSaveAction) {
  const record = projectFormToRecord(form, action);
  return updateInState(state, 'projects', id, record);
}

export function validateProjectForm(form: ProjectFormValues, action: ProjectSaveAction) {
  const errors: Record<string, string> = {};
  if (action === 'draft') return errors;

  if (!form.orderDate) errors.orderDate = 'Order date is required';
  if (!form.customerId) errors.customerId = 'Customer is required';
  if (!form.salesPersonId) errors.salesPersonId = 'Sales person is required';
  if (!form.priority) errors.priority = 'Priority is required';
  if (!form.expectedDeliveryDate) errors.expectedDeliveryDate = 'Expected delivery date is required';
  if (!form.projectType) errors.projectType = 'Project type is required';

  const hasValidItem = form.items.some(
    (item) => item.productName.trim() && Number(item.qty) > 0,
  );
  if (!hasValidItem) errors.items = 'Add at least one product with quantity';

  return errors;
}

export { formatCurrency as formatProjectMoney };

export function projectStatus(row: Row) {
  const raw = String(row.status ?? '').toLowerCase();
  if (raw === 'draft') return 'draft';
  if (raw === 'active') return 'active';
  return 'active';
}

export function isProjectAtRisk(row: Row) {
  const health = String(row.health ?? '');
  if (health.includes('Risk') || health === 'amber' || health === 'red') return true;
  return String(row.priority ?? '').toLowerCase() === 'high';
}

export function projectBudget(row: Row) {
  return Number(row.budget ?? row.totalValue ?? 0);
}

export function summarizeProjects(rows: Row[]) {
  const total = rows.length;
  const active = rows.filter((r) => projectStatus(r) === 'active').length;
  const draft = rows.filter((r) => projectStatus(r) === 'draft').length;
  const atRisk = rows.filter(isProjectAtRisk).length;
  const pipelineValue = rows.reduce((sum, row) => sum + projectBudget(row), 0);

  return [
    { key: 'total', label: 'Total Projects', value: String(total), sub: 'All orders & projects', iconify: resolveKpiIcon('total', 'Total Projects') },
    { key: 'active', label: 'Active', value: String(active), sub: 'In production pipeline', iconify: resolveKpiIcon('active', 'Active') },
    { key: 'draft', label: 'Draft Orders', value: String(draft), sub: 'Awaiting completion', iconify: resolveKpiIcon('draft', 'Draft Orders') },
    {
      key: 'risk',
      label: 'At Risk',
      value: String(atRisk),
      alert: atRisk > 0,
      sub: atRisk > 0 ? 'Needs attention' : 'All on track',
      iconify: resolveKpiIcon('risk', 'At Risk'),
    },
    {
      key: 'pipeline',
      label: 'Pipeline Value',
      value: formatCurrency(pipelineValue),
      sub: 'Total order value',
      iconify: resolveKpiIcon('pipeline', 'Pipeline Value'),
    },
  ];
}

export function formatProjectDeadline(value: unknown) {
  const raw = String(value ?? '').split('T')[0];
  if (!raw) return '—';
  const d = new Date(`${raw}T00:00:00`);
  if (Number.isNaN(d.getTime())) return raw;
  return formatDate(d, 'en');
}

export function isProjectOverdue(value: unknown) {
  const raw = String(value ?? '').split('T')[0];
  if (!raw) return false;
  const d = new Date(`${raw}T00:00:00`);
  if (Number.isNaN(d.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d < today;
}

export function projectHealthClass(health: unknown) {
  const h = String(health ?? '').toLowerCase();
  if (h.includes('risk') || h === 'amber' || h === 'red') {
    return 'bg-rose-50 text-rose-700 border-rose-100';
  }
  if (h.includes('delay') || h === 'delayed') {
    return 'bg-amber-50 text-amber-700 border-amber-100';
  }
  return 'bg-emerald-50 text-emerald-700 border-emerald-100';
}

export function projectSetupLabel(setupStep: unknown) {
  const step = Number(setupStep ?? 1);
  const labels: Record<number, string> = {
    1: 'Project Details',
    2: 'BOM / Recipe',
    3: 'Production Plan',
    4: 'Review & Start',
  };
  return labels[step] ?? `Step ${step}`;
}

export type DashboardProjectRow = {
  id: string;
  name: string;
  lead: string;
  progress: number;
  health: string;
  deadline: string;
  setupLabel: string;
  status: string;
};

export function getDashboardProjectRows(state: AppState, limit = 6): DashboardProjectRow[] {
  return listProjects(state)
    .map((row, index) => {
      const status = projectStatus(row);
      const progress = Math.min(100, Math.max(0, Number(row.progress ?? 0)));
      const name = String(row.name ?? row.projectId ?? 'Project');
      return {
        id: String(row.id ?? row.projectId ?? `project-${index}-${name}`),
        name,
        lead: String(row.lead ?? row.salesPersonName ?? '—'),
        progress,
        health: String(row.health ?? 'On Track'),
        deadline: formatProjectDeadline(row.deadline ?? row.expectedDeliveryDate),
        setupLabel: projectSetupLabel(row.setupStep),
        status,
      };
    })
    .filter((row) => row.status === 'active' || row.progress > 0)
    .sort((a, b) => b.progress - a.progress)
    .slice(0, limit);
}

export function projectProgressBarClass(health: string, progress: number) {
  const h = health.toLowerCase();
  if (h.includes('risk') || progress < 35) return 'from-amber-400 to-orange-500';
  if (progress >= 100) return 'from-emerald-400 to-emerald-600';
  return 'from-blue-500 to-blue-600';
}
