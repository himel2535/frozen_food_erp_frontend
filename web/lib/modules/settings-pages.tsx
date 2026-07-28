'use client';

import { DedicatedModule } from '@/components/modules/shared/DedicatedModule';
import { getLegacyParityConfig } from '@/lib/modules/legacy-parity-configs';
import { PORT_CONFIGS } from '@/lib/modules/port-configs';
import type { DedicatedModuleConfig } from '@/components/modules/shared/DedicatedModule';

function cfg(id: string): DedicatedModuleConfig {
  return getLegacyParityConfig(id);
}

export function SettingsUsersPage() { return <DedicatedModule config={cfg('settings-users')} />; }
export function SettingsRolesPage() { return <DedicatedModule config={cfg('settings-roles')} />; }
export function SettingsPermissionsPage() { return <DedicatedModule config={cfg('settings-permissions')} />; }
export function SettingsDocumentsPage() { return <DedicatedModule config={cfg('settings-documents')} />; }
export function SettingsCompanyPage() { return <DedicatedModule config={cfg('settings-company')} />; }
export function SettingsAuditLogsPage() { return <DedicatedModule config={PORT_CONFIGS['settings-audit-logs'] as DedicatedModuleConfig} />; }
export function SettingsProfilePage() { return <DedicatedModule config={cfg('settings-profile')} />; }
export function ProjectsPage() { return <DedicatedModule config={cfg('projects')} />; }
export function AssetManagementPage() { return <DedicatedModule config={cfg('asset-management')} />; }
export function WorkflowApprovalsPage() { return <DedicatedModule config={cfg('workflow-approvals')} />; }
export function CrmActivitiesPage() { return <DedicatedModule config={cfg('crm-activities')} />; }
export function SalesWholesalePage() { return <DedicatedModule config={cfg('sales-wholesale')} />; }
