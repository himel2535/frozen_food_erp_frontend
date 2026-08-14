'use client';

import { toast, confirmAction } from '@/lib/ui/feedback';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { DedicatedModule, type DedicatedModuleConfig } from '@/components/modules/shared/DedicatedModule';
import { useLegacyParityConfig } from '@/hooks/use-legacy-parity-config';
import { useAppStore } from '@/lib/state/app-store';
import { isModuleApiMode } from '@/lib/config/data-source';
import { useApiResourceStore } from '@/hooks/use-api-resource-store';
import { mapGenericApiRow } from '@/lib/services/generic-api-mapper';
import {
  approvalDetailHref,
  approveLinkedRequest,
  approveLinkedRequestApi,
  dedupeApprovalRows,
  rejectLinkedRequest,
  rejectLinkedRequestApi,
  reconcilePendingApprovalsFromApi,
} from '@/lib/services/approvals-service';

function workflowApprovalsConfig(base: DedicatedModuleConfig): DedicatedModuleConfig {
  return {
    ...base,
    hideAdd: true,
    hideDefaultRowActions: () => true,
    columnRender: {
      module: (row) => (
        <span className="text-xs font-semibold text-slate-700">{String(row.module ?? '—')}</span>
      ),
      item: (row) => (
        <span className="text-xs font-medium text-slate-800 leading-snug">{String(row.item ?? '—')}</span>
      ),
      requester: (row) => (
        <span className="text-xs text-slate-600">{String(row.requester ?? '—')}</span>
      ),
    },
  };
}

export function WorkflowApprovalsPage() {
  const router = useRouter();
  const appState = useAppStore((s) => s.appState);
  const apiDataReady = useAppStore((s) => s.apiDataReady);
  const apiMode = isModuleApiMode('workflowApprovals');
  const approvalStore = useApiResourceStore('workflowApprovals', mapGenericApiRow, { pageOnly: true, lookupLimit: 100 });
  const purchaseRmStore = useApiResourceStore('purchaseRm', mapGenericApiRow, { pageOnly: true, lookupLimit: 100 });
  const purchaseOrdersStore = useApiResourceStore('purchaseOrders', mapGenericApiRow, { pageOnly: true, lookupLimit: 100 });
  const leaveStore = useApiResourceStore('leaveRequests', mapGenericApiRow, { pageOnly: true, lookupLimit: 100 });
  const base = useLegacyParityConfig('workflow-approvals');

  useEffect(() => {
    if (!apiMode || !apiDataReady) return;
    let cancelled = false;
    void reconcilePendingApprovalsFromApi(
      purchaseRmStore.rows,
      leaveStore.rows,
      purchaseOrdersStore.rows,
    ).then(() => {
      if (!cancelled) void approvalStore.reload();
    });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- sync whenever store rows update
  }, [apiMode, apiDataReady, purchaseRmStore.rows, leaveStore.rows, purchaseOrdersStore.rows]);

  const config = useMemo(() => {
    if (!base) return null;
    return {
      ...workflowApprovalsConfig(base),
      transformRows: (rows: Record<string, unknown>[]) => dedupeApprovalRows(rows),
      rowSort: (a: Record<string, unknown>, b: Record<string, unknown>) =>
        String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')),
      onRowClick: (row: Record<string, unknown>) => {
        const href = approvalDetailHref(row);
        if (href) router.push(href);
      },
      rowActions: (row: Record<string, unknown>, ctx: { appState: typeof appState; save: () => void }) => {
        if (String(row.status) !== 'pending') return null;
        const refType = String(row.refType ?? '');

        const handleApprove = async () => {
          if (apiMode) {
            const result = await approveLinkedRequestApi(row, {
              appState: ctx.appState,
              purchaseRmRows: purchaseRmStore.rows,
              purchaseOrderRows: purchaseOrdersStore.rows,
              updatePurchaseRm: (id, body) => purchaseRmStore.update(id, body),
              updatePurchaseOrder: (id, body) => purchaseOrdersStore.update(id, body),
              updateApproval: (id, body) => approvalStore.update(id, body),
            });
            if (!result.ok) {
              toast.error('Operation failed', { module: 'Approvals', description: String(result.error ?? 'Approve failed') });
              return;
            }
            toast.success('Approved', { module: 'Approvals', description: 'Request approved successfully.' });
            ctx.save();
            await Promise.all([
              approvalStore.reload(),
              purchaseRmStore.reload(),
              purchaseOrdersStore.reload(),
            ]);
            return;
          }
          const result = approveLinkedRequest(ctx.appState, row);
          if (!result.ok) {
            toast.error('Operation failed', { module: 'Approvals', description: String(result.error ?? 'Approve failed') });
            return;
          }
          toast.success('Approved', { module: 'Approvals', description: 'Request approved successfully.' });
          ctx.save();
        };

        const handleReject = async () => {
          const ok = await confirmAction({
            title: 'Reject request',
            message: 'Reject this approval request?',
            confirmLabel: 'Reject',
            tone: 'danger',
            module: 'Approvals',
          });
          if (!ok) return;
          if (apiMode) {
            const result = await rejectLinkedRequestApi(row, {
              appState: ctx.appState,
              purchaseRmRows: purchaseRmStore.rows,
              purchaseOrderRows: purchaseOrdersStore.rows,
              updatePurchaseRm: (id, body) => purchaseRmStore.update(id, body),
              updatePurchaseOrder: (id, body) => purchaseOrdersStore.update(id, body),
              updateApproval: (id, body) => approvalStore.update(id, body),
            });
            if (!result.ok) {
              toast.error('Operation failed', { module: 'Approvals', description: String(result.error ?? 'Reject failed') });
              return;
            }
            toast.success('Rejected', { module: 'Approvals', description: 'Request rejected.' });
            ctx.save();
            await Promise.all([
              approvalStore.reload(),
              purchaseRmStore.reload(),
              purchaseOrdersStore.reload(),
            ]);
            return;
          }
          const result = rejectLinkedRequest(ctx.appState, row);
          if (!result.ok) {
            toast.error('Operation failed', { module: 'Approvals', description: String(result.error ?? 'Reject failed') });
            return;
          }
          toast.success('Rejected', { module: 'Approvals', description: 'Request rejected.' });
          ctx.save();
        };

        if (refType === 'purchase_rm_order') {
          return (
            <>
              <button
                type="button"
                title="Approve"
                onClick={() => { void handleApprove(); }}
                className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 cursor-pointer text-[10px] font-bold"
              >
                Approve
              </button>
              <button
                type="button"
                title="Reject"
                onClick={() => { void handleReject(); }}
                className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 cursor-pointer text-[10px] font-bold"
              >
                Reject
              </button>
            </>
          );
        }

        return (
          <>
            <button
              type="button"
              title="Approve"
              onClick={() => { void handleApprove(); }}
              className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 cursor-pointer text-[10px] font-bold"
            >
              Approve
            </button>
            <button
              type="button"
              title="Reject"
              onClick={() => { void handleReject(); }}
              className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 cursor-pointer text-[10px] font-bold"
            >
              Reject
            </button>
          </>
        );
      },
    };
  }, [base, router, apiMode, approvalStore, purchaseRmStore, appState]);

  if (!config) return <DedicatedModule configId="workflow-approvals" />;
  return <DedicatedModule config={config} configId="workflow-approvals" />;
}
