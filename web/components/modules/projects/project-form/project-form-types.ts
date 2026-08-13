export type ProjectSaveAction = 'draft' | 'create';

export type ProjectLineItem = {
  id: string;
  productId: string;
  productName: string;
  variant: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
  recipeId?: string;
};

export type ProjectTask = {
  id: string;
  text: string;
  deadline?: string;
  completed: boolean;
  assignedWorkerId?: string;
  assignedWorkerName?: string;
};

export type ProjectFormValues = {
  projectId: string;
  orderDate: string;
  customerId: string;
  customerName: string;
  customerPoNo: string;
  salesPersonId: string;
  salesPersonName: string;
  priority: string;
  expectedDeliveryDate: string;
  projectType: string;
  items: ProjectLineItem[];
  productSpecification: string;
  materialQuality: string;
  packagingPrinting: string;
  branding: string;
  sampleRequired: string;
  specialInstructions: string;
  attachments: string[];
  status: string;
  setupStep: number;
  tasks: ProjectTask[];
  assignedStaffIds: string[];
};

export const PROJECT_PRIORITY_OPTIONS = ['High', 'Medium', 'Low'] as const;

export const PROJECT_TYPE_OPTIONS = ['Standard', 'Custom', 'Export', 'Sample'] as const;

export const PROJECT_SAMPLE_OPTIONS = ['Yes', 'No'] as const;

export const PROJECT_SETUP_STEPS = [
  { step: 1, label: 'Project Details', key: 'project_details' },
  { step: 2, label: 'BOM / Recipe', key: 'bom' },
  { step: 3, label: 'Production Plan', key: 'production_plan' },
  { step: 4, label: 'Review & Start', key: 'review' },
] as const;

export const PRIORITY_BADGE_CLS: Record<string, string> = {
  High: 'bg-rose-50 text-rose-700 border-rose-100',
  Medium: 'bg-amber-50 text-amber-700 border-amber-100',
  Low: 'bg-emerald-50 text-emerald-700 border-emerald-100',
};

export const PRIORITY_DOT_CLS: Record<string, string> = {
  High: 'bg-rose-500',
  Medium: 'bg-amber-500',
  Low: 'bg-emerald-500',
};
