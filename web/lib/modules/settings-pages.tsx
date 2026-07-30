'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { DedicatedModule } from '@/components/modules/shared/DedicatedModule';
import { getLegacyParityConfig } from '@/lib/modules/legacy-parity-configs';
import { PORT_CONFIGS } from '@/lib/modules/port-configs';
import type { DedicatedModuleConfig } from '@/components/modules/shared/DedicatedModule';
import { approvePurchaseRmOrder, rejectPurchaseRmOrder } from '@/lib/services/purchase-rm-service';

function cfg(id: string): DedicatedModuleConfig {
  return getLegacyParityConfig(id);
}

function workflowApprovalsConfig(): DedicatedModuleConfig {
  const base = cfg('workflow-approvals');
  return {
    ...base,
    rowActions: (row, { appState, save }) => {
      if (String(row.status) !== 'pending' || String(row.refType) !== 'purchase_rm_order') return null;
      const refId = String(row.refId);
      return (
        <>
          <button
            type="button"
            title="Approve"
            onClick={() => {
              const result = approvePurchaseRmOrder(appState, refId);
              if (!result.ok) {
                window.alert(result.error ?? 'Approve failed');
                return;
              }
              save();
            }}
            className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 cursor-pointer text-[10px] font-bold"
          >
            Approve
          </button>
          <button
            type="button"
            title="Reject"
            onClick={() => {
              if (!window.confirm('Reject this RM order?')) return;
              const result = rejectPurchaseRmOrder(appState, refId);
              if (!result.ok) {
                window.alert(result.error ?? 'Reject failed');
                return;
              }
              save();
            }}
            className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 cursor-pointer text-[10px] font-bold"
          >
            Reject
          </button>
        </>
      );
    },
  };
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
export function WorkflowApprovalsPage() {
  const router = useRouter();
  const config = useMemo(() => ({
    ...workflowApprovalsConfig(),
    rowSort: (a: Record<string, unknown>, b: Record<string, unknown>) =>
      String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')),
    onRowClick: (row: Record<string, unknown>) => {
      if (String(row.refType) !== 'purchase_rm_order') return;
      router.push(`/purchases/purchase-rm?focus=${encodeURIComponent(String(row.refId))}&from=approval`);
    },
  }), [router]);
  return <DedicatedModule config={config} />;
}
export function CrmActivitiesPage() { return <DedicatedModule config={cfg('crm-activities')} />; }
export function SalesWholesalePage() { return <DedicatedModule config={cfg('sales-wholesale')} />; }
