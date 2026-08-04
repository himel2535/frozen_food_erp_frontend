'use client';

import { confirmAction } from '@/lib/ui/feedback';

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
  deleteSalesOrder,
  formatMoney,
  listSalesOrders,
} from '@/lib/services/sales-service';
import type { PoLineItem } from '@/lib/services/purchases-service';

const STATUS_TABS = [
  { id: 'all', label: 'All' },
  { id: 'draft', label: 'Draft' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'processing', label: 'Processing' },
  { id: 'fulfilled', label: 'Fulfilled' },
];

function summarizeItems(row: Record<string, unknown>): string {
  const items = Array.isArray(row.items) ? (row.items as PoLineItem[]) : [];
  if (items.length) {
    const active = items.filter((i) => String(i.description ?? (i as Record<string, unknown>).name ?? '').trim() || i.productId);
    if (!active.length) return '—';
    if (active.length === 1) {
      const desc = active[0].description || String((active[0] as Record<string, unknown>).name ?? '1 item');
      return desc;
    }
    const first = active[0].description || String((active[0] as Record<string, unknown>).name ?? 'Item');
    return `${first} +${active.length - 1} more`;
  }
  return '—';
}

function orderKpis(rows: Record<string, unknown>[]) {
  const total = rows.reduce((s, r) => s + Number(r.total ?? 0), 0);
  const open = rows.filter((r) => !['fulfilled', 'cancelled'].includes(String(r.status).toLowerCase())).length;
  const fulfilled = rows.filter((r) => String(r.status).toLowerCase() === 'fulfilled').length;
  return [
    { key: 'count', label: 'Total Orders', value: String(rows.length) },
    { key: 'open', label: 'Open Orders', value: String(open) },
    { key: 'value', label: 'Total Value', value: formatMoney(total) },
    { key: 'fulfilled', label: 'Fulfilled', value: String(fulfilled) },
  ];
}

export function SalesOrdersPage() {
  const router = useRouter();
  const appState = useAppStore((s) => s.appState);
  const saveAppState = useAppStore((s) => s.saveAppState);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const allRows = useMemo(() => listSalesOrders(appState), [appState]);

  const rows = useMemo(() => {
    let data = allRows;
    if (search) {
      const q = search.toLowerCase();
      data = data.filter((row) =>
        `${row.id} ${row.customer} ${summarizeItems(row)}`.toLowerCase().includes(q),
      );
    }
    if (statusFilter !== 'all') {
      data = data.filter((row) => String(row.status).toLowerCase() === statusFilter);
    }
    return data;
  }, [allRows, search, statusFilter]);

  const kpis = useMemo(() => orderKpis(allRows), [allRows]);

  const columns = useMemo<AppTableColumn<Record<string, unknown>>[]>(() => [
    {
      key: 'id',
      label: 'Order #',
      render: (row) => <span className="font-bold text-slate-900">{String(row.id)}</span>,
    },
    {
      key: 'customer',
      label: 'Customer',
      render: (row) => String(row.customer ?? row.customerName ?? '—'),
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

  const handleDelete = async (id: string) => {
    const __ok = await confirmAction({ title: "Delete this sales order", message: "Delete this sales order?", confirmLabel: 'Delete', tone: 'danger', module: 'Sales' }); if (!__ok) return;
    deleteSalesOrder(appState, id);
    saveAppState();
  };

  return (
    <div className={MODULE_LIST_SHELL}>
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Sales Orders</h2>
          <p className="text-xs text-slate-500 mt-1 font-medium max-w-2xl">
            Manage confirmed orders, fulfillment, and invoicing.
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push('/sales/orders/new')}
          className={CF_BTN_PRIMARY}
        >
          <Plus className="w-4 h-4" /> Create Order
        </button>
      </div>

      <div className="mt-4">
        <KpiCards items={kpis} />
      </div>

      <div className="mt-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <FilterTabs tabs={STATUS_TABS} active={statusFilter} onChange={setStatusFilter} />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search order #, customer, items..."
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
              <TableIconAction variant="edit" onClick={() => router.push(`/sales/orders/${String(row.id)}/edit`)} />
              <TableIconAction variant="delete" onClick={() => handleDelete(String(row.id))} />
            </div>
          )}
        />
      </div>

      <Footer />
    </div>
  );
}
