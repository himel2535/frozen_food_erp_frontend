'use client';

import { toast, confirmAction } from '@/lib/ui/feedback';
import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ImagePlus } from 'lucide-react';
import { AppTable, type AppTableColumn } from '@/components/shared/AppTable';
import { InventoryItemThumb } from '@/components/shared/InventoryItemThumb';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { TableIconAction } from '@/components/shared/TableIconAction';
import {
  syncPurchaseOrderApproval,
} from '@/lib/services/approvals-service';
import {
  cancelPurchaseOrder,
  deletePurchaseOrder,
  formatMoney,
  receivePurchaseOrder,
  sendPurchaseOrder,
} from '@/lib/services/purchases-service';
import type { AppState } from '@/lib/state/types';
import {
  poDeliveryBadge,
  poFirstItemLabel,
  poPaidPercent,
  poWorkflowProgress,
} from './purchase-orders-utils';
import { PO_CARD_CLS } from './purchase-orders-styles';

export function PurchaseOrdersTable({
  rows,
  loading = false,
  selectedPoId,
  appState,
  onSelect,
  onSave,
}: {
  rows: Record<string, unknown>[];
  loading?: boolean;
  selectedPoId: string | null;
  appState: AppState;
  onSelect: (id: string) => void;
  onSave: () => void;
}) {
  const router = useRouter();

  const runAction = (fn: () => { ok: boolean; error?: string }, successMsg?: string) => {
    const result = fn();
    if (!result.ok) {
      toast.error('Operation failed', {
        module: 'Purchases',
        description: String(result.error ?? 'Action failed'),
      });
      return false;
    }
    onSave();
    if (successMsg) toast.success('Success', { module: 'Purchases', description: successMsg });
    return true;
  };

  const columns = useMemo<AppTableColumn<Record<string, unknown>>[]>(() => [
    {
      key: 'attachment',
      label: '',
      className: 'w-12',
      render: (row) => (
        <InventoryItemThumb
          imageUrl={String(row.attachmentUrl ?? (row.meta as Record<string, unknown> | undefined)?.attachmentUrl ?? '')}
          alt=""
          fallback={(
            <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-slate-100 text-slate-400">
              <ImagePlus className="w-4 h-4" />
            </span>
          )}
        />
      ),
    },
    {
      key: 'id',
      label: 'PO ID',
      align: 'left',
      className: 'min-w-[160px]',
      render: (row) => (
        <div className="flex flex-col gap-0.5 text-left">
          <div className="font-bold text-slate-900 break-all leading-tight">{String(row.id)}</div>
          <div className="text-slate-500 text-[11px]">{String(row.date ?? '—')}</div>
        </div>
      ),
    },
    {
      key: 'supplier',
      label: 'Supplier',
      render: (row) => (
        <>
          <div className="font-semibold text-slate-800">{String(row.supplier ?? row.supplierName ?? '—')}</div>
          <div className="text-slate-500 text-[11px]">
            {String(row.reference ?? '').trim()
              ? `Ref: ${String(row.reference)}`
              : String(row.purchaserName ?? '—')}
          </div>
        </>
      ),
    },
    {
      key: 'items',
      label: 'Items',
      render: (row) => {
        const { primary, moreCount } = poFirstItemLabel(row);
        return (
          <>
            <div className="font-medium text-slate-700">{primary}</div>
            {moreCount > 0 && (
              <div className="text-blue-600 text-[11px] font-semibold">+{moreCount} more</div>
            )}
          </>
        );
      },
    },
    {
      key: 'expectedDelivery',
      label: 'Expected Delivery',
      render: (row) => {
        const expected = String(row.expectedDelivery ?? row.deliveryDate ?? '').trim();
        return (
          <>
            <div>{expected || '—'}</div>
            {poDeliveryBadge(expected)}
          </>
        );
      },
    },
    {
      key: 'progress',
      label: 'Progress',
      render: (row) => {
        const pct = poWorkflowProgress(String(row.status));
        return (
          <div className="min-w-[100px]">
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full" style={{ width: `${pct}%` }} />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">{pct}%</p>
          </div>
        );
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={String(row.status)} />,
    },
    {
      key: 'total',
      label: 'Total',
      align: 'right',
      render: (row) => {
        const total = Number(row.total ?? 0);
        const paidPct = poPaidPercent(total, Number(row.paidAmount ?? 0));
        return (
          <>
            <div className="font-bold text-slate-900">{formatMoney(total)}</div>
            <div className="text-slate-500 text-[11px]">Paid {paidPct}%</div>
          </>
        );
      },
    },
  ], []);

  return (
    <div className={`${PO_CARD_CLS} overflow-hidden`}>
      <AppTable
        columns={columns}
        rows={rows}
        loading={loading}
        rowKey={(row) => String(row.id)}
        emptyMessage="No purchase orders found."
        onRowClick={(row) => onSelect(String(row.id))}
        rowClassName={(row) =>
          String(row.id) === selectedPoId ? 'bg-blue-50/70' : ''
        }
        renderActions={(row) => {
          const id = String(row.id);
          const status = String(row.status);

          return (
            <>
              {status === 'Draft' && (
                <TableIconAction variant="edit" onClick={() => router.push(`/purchases/orders/${id}/edit`)} />
              )}
              {status === 'Draft' && (
                <button
                  type="button"
                  title="Send"
                  onClick={async () => {
                    const ok = runAction(() => sendPurchaseOrder(appState, id), 'Purchase order sent.');
                    if (ok) {
                      await syncPurchaseOrderApproval({ ...row, status: 'Sent' });
                    }
                  }}
                  className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 cursor-pointer text-[10px] font-bold"
                >
                  Send
                </button>
              )}
              {status === 'Sent' && (
                <button
                  type="button"
                  title="Receive"
                  onClick={() => runAction(() => receivePurchaseOrder(appState, id), 'Goods received.')}
                  className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 cursor-pointer text-[10px] font-bold"
                >
                  Receive
                </button>
              )}
              {(status === 'Draft' || status === 'Sent') && (
                <button
                  type="button"
                  title="Cancel"
                  onClick={async () => {
                    const ok = await confirmAction({
                      title: 'Cancel PO',
                      message: 'Cancel this purchase order?',
                      confirmLabel: 'Cancel PO',
                      tone: 'danger',
                      module: 'Purchases',
                    });
                    if (ok) runAction(() => cancelPurchaseOrder(appState, id));
                  }}
                  className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 cursor-pointer text-[10px] font-bold"
                >
                  Cancel
                </button>
              )}
              {(status === 'Draft' || status === 'Cancelled') && (
                <TableIconAction
                  variant="delete"
                  onClick={() => {
                    confirmAction({
                      title: 'Delete purchase order',
                      message: 'Delete this purchase order?',
                      confirmLabel: 'Delete',
                      tone: 'danger',
                      module: 'Purchases',
                    }).then((ok) => {
                      if (ok) runAction(() => deletePurchaseOrder(appState, id));
                    });
                  }}
                />
              )}
            </>
          );
        }}
      />
    </div>
  );
}
