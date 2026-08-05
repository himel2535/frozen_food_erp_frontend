import type { SectionId } from '@/lib/state/types';

export interface RolePreset {
  name: string;
  description: string;
  allowedSections: SectionId[];
}

export const ROLE_PRESETS: RolePreset[] = [
  {
    name: 'Sales Manager',
    description: 'Manages sales pipeline, CRM, orders, and customer relationships.',
    allowedSections: ['dashboard', 'sales-crm'],
  },
  {
    name: 'Store Manager',
    description: 'Oversees store operations, inventory, and point-of-sale activities.',
    allowedSections: ['dashboard', 'sales-crm', 'inventory'],
  },
  {
    name: 'Accountant',
    description: 'Handles financial records, invoices, payments, and accounting reports.',
    allowedSections: ['dashboard', 'accounts'],
  },
  {
    name: 'HR Manager',
    description: 'Manages employees, attendance, leave, and payroll processing.',
    allowedSections: ['dashboard', 'hrm', 'payroll'],
  },
  {
    name: 'Production Manager',
    description: 'Supervises factory production, recipes, and raw material usage.',
    allowedSections: ['dashboard', 'factory', 'inventory'],
  },
  {
    name: 'Purchase Officer',
    description: 'Handles supplier orders, purchase requests, and procurement.',
    allowedSections: ['dashboard', 'purchases', 'inventory'],
  },
  {
    name: 'Project Manager',
    description: 'Plans and tracks project tasks, budgets, and deliverables.',
    allowedSections: ['dashboard', 'projects'],
  },
  {
    name: 'Report Viewer',
    description: 'Read-only access to business reports and analytics dashboards.',
    allowedSections: ['dashboard', 'reports'],
  },
];

export function findRolePreset(name: string): RolePreset | undefined {
  const normalized = name.trim().toLowerCase();
  return ROLE_PRESETS.find((p) => p.name.toLowerCase() === normalized);
}
