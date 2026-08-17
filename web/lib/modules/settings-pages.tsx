'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { CompanySettingsPage } from '@/components/modules/settings/company/CompanySettingsPage';
import { SignatureSettingsPage } from '@/components/modules/settings/signatures/SignatureSettingsPage';
import { ProfileSettingsPage } from '@/components/modules/settings/profile/ProfileSettingsPage';
import { AlertSettingsPage } from '@/components/modules/settings/alerts/AlertSettingsPage';
import { DedicatedModule } from '@/components/modules/shared/DedicatedModule';
import { useLegacyParityConfig } from '@/hooks/use-legacy-parity-config';
import { PORT_CONFIGS } from '@/lib/modules/port-configs';
import type { DedicatedModuleConfig } from '@/components/modules/shared/DedicatedModule';
import { AuditEventBadge } from '@/components/modules/settings/audit/AuditEventBadge';
import { getAuditLogKpis } from '@/lib/services/audit-log-service';
import { employeeAvatarClass, employeeInitials } from '@/lib/services/hrm-service';
import {
  formatProjectDeadline,
  formatProjectMoney,
  isProjectOverdue,
  normalizeProjectPriority,
  projectBudget,
  projectHealthClass,
  projectSetupLabel,
  projectStatus,
} from '@/lib/services/projects-service';
import {
  PRIORITY_BADGE_CLS,
  PRIORITY_DOT_CLS,
} from '@/components/modules/projects/project-form/project-form-types';

export function SettingsUsersPage() { return <DedicatedModule configId="settings-users" />; }
export function SettingsRolesPage() { return <DedicatedModule configId="settings-roles" />; }
export function SettingsPermissionsPage() { return <DedicatedModule configId="settings-permissions" />; }
export function SettingsDocumentsPage() { return <DedicatedModule configId="settings-documents" />; }
export function SettingsCompanyPage() { return <CompanySettingsPage />; }
export function SettingsAuditLogsPage() {
  const config = useMemo(
    () => ({
      ...(PORT_CONFIGS['settings-audit-logs'] as DedicatedModuleConfig),
      hideAdd: true,
      hideInlineForm: true,
      hideDefaultRowActions: () => true,
      listPageSize: 25,
      searchKeys: ['user', 'type', 'module', 'desc'],
      kpiGridClassName: 'grid grid-cols-1 sm:grid-cols-3 gap-2',
      kpi: getAuditLogKpis,
      rowSort: (a: Record<string, unknown>, b: Record<string, unknown>) =>
        String(b.timestamp ?? b.ts ?? '').localeCompare(String(a.timestamp ?? a.ts ?? '')),
      statusTabs: [
        { id: 'all', label: 'common.all' },
        { id: 'auth', label: 'Auth' },
        { id: 'crm', label: 'CRM' },
        { id: 'sales', label: 'Sales' },
        { id: 'settings', label: 'Settings' },
        { id: 'operations', label: 'Operations' },
      ],
      columnRender: {
        type: (row: Record<string, unknown>) => <AuditEventBadge type={String(row.type ?? '—')} />,
        module: (row: Record<string, unknown>) => (
          <span className="text-xs font-semibold text-slate-700">{String(row.module ?? '—')}</span>
        ),
        desc: (row: Record<string, unknown>) => (
          <span className="text-xs font-medium text-slate-700 leading-snug">{String(row.desc ?? '—')}</span>
        ),
      },
    }),
    [],
  );

  return <DedicatedModule config={config} configId="settings-audit-logs" />;
}
export function SettingsProfilePage() { return <ProfileSettingsPage />; }
export function SettingsSignaturesPage() { return <SignatureSettingsPage />; }
export function SettingsAlertSettingsPage() { return <AlertSettingsPage />; }
export function ProjectsPage() {
  const router = useRouter();
  const base = useLegacyParityConfig('projects');
  const config = useMemo(() => {
    if (!base) return null;
    return {
    ...base,
    kpiGridClassName: 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2',
    hideInlineForm: true,
    onAdd: () => router.push('/legacy/projects/new'),
    onRowClick: (row: Record<string, unknown>) => {
      const id = String(row._mongoId ?? row.id ?? row.projectId ?? '');
      if (!id) return;
      const step = Math.min(4, Math.max(2, Number(row.setupStep ?? 2)));
      router.push(`/legacy/projects/${encodeURIComponent(id)}/setup?step=${step}`);
    },
    onEditRow: (row: Record<string, unknown>) => {
      const id = String(row._mongoId ?? row.id ?? row.projectId ?? '');
      if (!id) return;
      const step = Math.min(4, Math.max(2, Number(row.setupStep ?? 2)));
      router.push(`/legacy/projects/${encodeURIComponent(id)}/setup?step=${step}`);
    },
    rowSort: (a: Record<string, unknown>, b: Record<string, unknown>) => {
      const statusOrder = (row: Record<string, unknown>) => {
        const status = projectStatus(row);
        if (status === 'active') return 0;
        if (status === 'draft') return 1;
        return 2;
      };
      const orderDiff = statusOrder(a) - statusOrder(b);
      if (orderDiff !== 0) return orderDiff;
      return String(a.deadline ?? a.expectedDeliveryDate ?? '').localeCompare(
        String(b.deadline ?? b.expectedDeliveryDate ?? ''),
      );
    },
    columnRender: {
      name: (row: Record<string, unknown>) => {
        const name = String(row.name ?? '—');
        const projectId = String(row.projectId ?? row.id ?? '');
        const customer = String(row.customerName ?? '');
        const setupStep = Number(row.setupStep ?? 0);
        return (
          <span className="inline-flex flex-col min-w-0 max-w-[220px]">
            <span className="font-semibold text-slate-800 truncate">{name}</span>
            {projectId ? (
              <span className="text-[10px] text-slate-400 font-medium truncate">{projectId}</span>
            ) : null}
            {customer ? (
              <span className="text-[10px] text-blue-600 font-semibold truncate">{customer}</span>
            ) : null}
            {setupStep > 1 ? (
              <span className="text-[10px] text-violet-600 font-bold mt-0.5">
                Step {setupStep}: {projectSetupLabel(setupStep)}
              </span>
            ) : null}
          </span>
        );
      },
      lead: (row: Record<string, unknown>) => {
        const name = String(row.lead ?? row.salesPersonName ?? '—');
        return (
          <span className="inline-flex items-center gap-2 min-w-0">
            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${employeeAvatarClass(name)}`}>
              {employeeInitials(name)}
            </span>
            <span className="font-semibold text-slate-800 truncate">{name}</span>
          </span>
        );
      },
      progress: (row: Record<string, unknown>) => {
        const pct = Math.min(100, Math.max(0, Number(row.progress ?? 0)));
        return (
          <span className="inline-flex flex-col gap-1 min-w-[88px]">
            <span className="text-xs font-extrabold text-slate-800">{pct}%</span>
            <span className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <span
                className="block h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600"
                style={{ width: `${pct}%` }}
              />
            </span>
          </span>
        );
      },
      health: (row: Record<string, unknown>) => {
        const health = String(row.health ?? 'On Track');
        return (
          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-[11px] font-bold ${projectHealthClass(health)}`}>
            {health}
          </span>
        );
      },
      priority: (row: Record<string, unknown>) => {
        const priority = normalizeProjectPriority(row.priority);
        if (!priority) return <span className="text-slate-400">—</span>;
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold ${PRIORITY_BADGE_CLS[priority] ?? 'bg-slate-50 text-slate-600 border-slate-100'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOT_CLS[priority] ?? 'bg-slate-400'}`} />
            {priority}
          </span>
        );
      },
      deadline: (row: Record<string, unknown>) => {
        const raw = row.deadline ?? row.expectedDeliveryDate;
        const overdue = isProjectOverdue(raw);
        return (
          <span className="inline-flex flex-col min-w-0">
            <span className={`text-xs font-semibold ${overdue ? 'text-rose-600' : 'text-slate-800'}`}>
              {formatProjectDeadline(raw)}
            </span>
            {overdue ? (
              <span className="text-[10px] font-bold text-rose-500">Overdue</span>
            ) : null}
          </span>
        );
      },
      budget: (row: Record<string, unknown>) => (
        <span className="text-xs font-extrabold text-blue-700 whitespace-nowrap">
          {formatProjectMoney(projectBudget(row))}
        </span>
      ),
    },
  };
  }, [base, router]);
  if (!config) return <DedicatedModule configId="projects" />;
  return <DedicatedModule config={config} configId="projects" />;
}
export function AssetManagementPage() { return <DedicatedModule configId="asset-management" />; }
export { WorkflowApprovalsPage } from '@/components/modules/approvals/WorkflowApprovalsPage';
export function CrmActivitiesPage() { return <DedicatedModule configId="crm-activities" />; }
export function SalesWholesalePage() { return <DedicatedModule configId="sales-wholesale" />; }
