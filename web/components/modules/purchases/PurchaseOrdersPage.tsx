'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Footer } from '@/components/layout/Footer';
import { FilterTabs } from '@/components/shared/FilterTabs';
import { KpiCards } from '@/components/shared/KpiCards';
import { AppTable, type AppTableColumn } from '@/components/shared/AppTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { TableIconAction } from '@/components/shared/TableIconAction';
import { MODULE_LIST_SHELL } from '@/lib/ui/module-layout';
import { CF_BTN_PRIMARY } from '@/components/modules/crm/customer-form/customer-form-styles';
import { useAppStore } from '@/lib/state/app-store';
import {
  cancelPurchaseOrder,
  deletePurchaseOrder,
  formatMoney,
  getPurchaseOrderMetrics,
  listPurchases,
  receivePurchaseOrder,
  sendPurchaseOrder,
} from '@/lib/services/purchases-service';
import type { PoLineItem } from '@/lib/services/purchases-service';

const STATUS_TABS = [
  { id: 'all', label: 'All' },
  { id: 'draft', label: 'Draft' },
  { id: 'sent', label: 'Sent' },
  { id: 'received', label: 'Received' },
];

function summarizeItems(row: Record<string, unknown>): string {
  const items = Array.isArray(row.items) ? (row.items as PoLineItem[]) : [];
  if (items.length) {
    const active = items.filter((i) => i.description?.trim() || i.productId);
    if (!active.length) return '—';
    if (active.length === 1) return active[0].description || '1 item';
    const first = active[0].description || 'Item';
    return `${first} +${active.length - 1} more`;
  }
  const product = String(row.product ?? '').trim();
  return product || '—';
}

export function PurchaseOrdersPage() {
  const router = useRouter();
  const appState = useAppStore((s) => s.appState);
  const saveAppState = useAppStore((s) => s.saveAppState);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const allRows = useMemo(() => listPurchases(appState), [appState]);

  const rows = useMemo(() => {
    let data = allRows;
    if (search) {
      const q = search.toLowerCase();
      data = data.filter((row) =>
        `${row.id} ${row.supplier} ${row.product} ${summarizeItems(row)}`.toLowerCase().includes(q),
      );
    }
    if (statusFilter !== 'all') {
      data = data.filter((row) => String(row.status).toLowerCase() === statusFilter);
    }
    return data;
  }, [allRows, search, statusFilter]);

  const kpis = useMemo(() => {
    const m = getPurchaseOrderMetrics(allRows);
    return [
      { key: 'spend', label: 'Total Procured Spend', value: formatMoney(m.totalSpend) },
      { key: 'pending', label: 'Pending POs', value: String(m.pending) },
      { key: 'received', label: 'Received POs', value: String(m.received) },
      { key: 'draft', label: 'Draft POs', value: String(m.draft) },
    ];
  }, [allRows]);

  const save = () => saveAppState();

  const columns = useMemo<AppTableColumn<Record<string, unknown>>[]>(() => [
    {
      key: 'id',
      label: 'PO ID',
      render: (row) => <span className="font-bold text-slate-900">{String(row.id)}</span>,
    },
    {
      key: 'supplier',
      label: 'Supplier',
      render: (row) => String(row.supplier ?? row.supplierName ?? '—'),
    },
    {
      key: 'items',
      label: 'Items',
      render: (row) => <span className="text-slate-600">{summarizeItems(row)}</span>,
    },
    {
      key: 'total',
      label: 'Total',
      render: (row) => <span className="font-bold">{formatMoney(Number(row.total ?? 0))}</span>,
    },
    {
      key: 'date',
      label: 'Date',
      render: (row) => String(row.date ?? '—'),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={String(row.status)} />,
    },
  ], []);

  const renderRowActions = (row: Record<string, unknown>) => {
    const id = String(row.id);
    const status = String(row.status);
    const btnCls = 'font-bold cursor-pointer text-[10px]';
    const actions: React.ReactNode[] = [];

    if (status === 'Draft') {
      actions.push(
        <button
          key="send"
          type="button"
          className={`text-blue-600 ${btnCls}`}
          onClick={() => {
            const r = sendPurchaseOrder(appState, id);
            if (r.ok) save();
            else window.alert('error' in r ? r.error : 'Send failed');
          }}
        >
          Send
        </button>,
      );
    }
    if (status === 'Sent') {
      actions.push(
        <button
          key="recv"
          type="button"
          className={`text-emerald-600 ${btnCls}`}
          onClick={() => {
            const r = receivePurchaseOrder(appState, id);
            if (r.ok) save();
            else window.alert('error' in r ? r.error : 'Receive failed');
          }}
        >
          Receive
        </button>,
      );
    }
    if (status === 'Draft' || status === 'Sent') {
      actions.push(
        <button
          key="cancel"
          type="button"
          className={`text-slate-500 ${btnCls}`}
          onClick={() => {
            if (!window.confirm('Cancel PO?')) return;
            const r = cancelPurchaseOrder(appState, id);
            if (r.ok) save();
          }}
        >
          Cancel
        </button>,
      );
    }

    return (
      <div className="flex flex-wrap items-center gap-2">
        <TableIconAction variant="edit" onClick={() => router.push(`/purchases/orders/${id}/edit`)} />
        {actions.length > 0 && <span className="text-slate-300">|</span>}
        {actions}
      </div>
    );
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Delete this purchase order?')) return;
    deletePurchaseOrder(appState, id);
    saveAppState();
  };

  return (
    <div className={MODULE_LIST_SHELL}>
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Purchase Orders</h2>
          <p className="text-xs text-slate-500 mt-1 font-medium max-w-2xl">
            Create and track purchase orders with supplier workflows.
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push('/purchases/orders/new')}
          className={CF_BTN_PRIMARY}
        >
          <Plus className="w-4 h-4" /> Create PO
        </button>
      </div>

      <KpiCards items={kpis} gridClassName="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2" />

      <div className="mt-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <FilterTabs tabs={STATUS_TABS} active={statusFilter} onChange={setStatusFilter} />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search PO ID, supplier, items..."
          className="w-full lg:w-72 px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
        />
      </div>

      <div className="mt-4 premium-card overflow-hidden">
        <AppTable
          columns={columns}
          rows={rows}
          rowKey={(row) => String(row.id)}
          renderActions={(row) => (
            <div className="flex items-center gap-2">
              {renderRowActions(row)}
              <TableIconAction variant="delete" onClick={() => handleDelete(String(row.id))} />
            </div>
          )}
        />
      </div>

      <Footer />
    </div>
  );
}
