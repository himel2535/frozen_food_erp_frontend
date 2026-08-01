'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus } from 'lucide-react';
import { Footer } from '@/components/layout/Footer';
import { FilterTabs } from '@/components/shared/FilterTabs';
import { KpiCards } from '@/components/shared/KpiCards';
import { AppTable, type AppTableColumn } from '@/components/shared/AppTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { TableIconAction } from '@/components/shared/TableIconAction';
import { MODULE_LIST_SHELL } from '@/lib/ui/module-layout';
import { useAppStore } from '@/lib/state/app-store';
import { getCustomerList, approveInvoice } from '@/lib/services/crm-service';
import { INVOICES_CONFIG, listInvoices } from '@/lib/modules/sales-configs';
import {
  createInvoice,
  deleteInvoice,
  formatMoney,
  getCustomerBillingDefaults,
  markInvoiceSent,
  previewInvoiceNumber,
  resolveInvoiceCustomerLabel,
  updateInvoice,
} from '@/lib/services/sales-service';
import {
  InvoiceForm,
  EMPTY_INVOICE_FORM,
  type InvoicePayload,
  type InvoiceSaveAction,
} from '@/components/modules/sales/invoice-form/InvoiceForm';
import type { InvoiceFormValues, InvoiceLineItem } from '@/components/modules/sales/invoice-form/inv-form-types';
import { createEmptyLineItem, recalcLineItem } from '@/components/modules/sales/invoice-form/inv-form-types';
import { InvoicePrint } from '@/components/modules/sales/invoice-form/InvoicePrint';

const STATUS_TABS = [
  { id: 'all', label: 'All' },
  { id: 'draft', label: 'Draft' },
  { id: 'pending', label: 'Pending' },
  { id: 'paid', label: 'Paid' },
  { id: 'overdue', label: 'Overdue' },
];

function recordToFormValues(record: Record<string, unknown>): InvoiceFormValues {
  const rawItems = (Array.isArray(record.items) ? record.items : []) as Record<string, unknown>[];
  const items: InvoiceLineItem[] = rawItems.length
    ? rawItems.map((item, index) =>
        recalcLineItem({
          id: String(item.id ?? `line-${index + 1}`),
          productId: String(item.productId ?? ''),
          description: String(item.description ?? item.name ?? ''),
          qty: Number(item.qty ?? item.quantity ?? 1),
          rate: Number(item.rate ?? item.price ?? 0),
          discountPct: Number(item.discountPct ?? 0),
          taxLabel: String(item.taxLabel ?? 'No Tax'),
          amount: Number(item.amount ?? item.total ?? 0),
        }),
      )
    : [createEmptyLineItem()];

  return {
    customerId: String(record.customerId ?? ''),
    customerName: String(record.customerName ?? record.customer ?? ''),
    billingAddress: String(record.billingAddress ?? ''),
    issueDate: String(record.issueDate ?? record.date ?? new Date().toISOString().slice(0, 10)),
    dueDate: String(record.dueDate ?? ''),
    status: String(record.status ?? 'draft'),
    notes: String(record.notes ?? ''),
    terms: String(record.terms ?? record.paymentTerms ?? ''),
    docDiscountOverride: record.discountAmount != null ? Number(record.discountAmount) : null,
    docTaxOverride: record.taxAmount != null ? Number(record.taxAmount) : null,
    items,
  };
}

function payloadToRecord(payload: InvoicePayload, id?: string) {
  return {
    id,
    customerId: payload.customerId,
    customerName: payload.customerName,
    customer: payload.customerName,
    billingAddress: payload.billingAddress,
    issueDate: payload.issueDate,
    date: payload.issueDate,
    dueDate: payload.dueDate,
    status: payload.status,
    notes: payload.notes,
    terms: payload.terms,
    paymentTerms: payload.terms,
    items: payload.items,
    docDiscountOverride: payload.docDiscountOverride,
    docTaxOverride: payload.docTaxOverride,
    subtotal: payload.totals.subtotal,
    discountAmount: payload.totals.discountAmount,
    taxAmount: payload.totals.taxAmount,
    total: payload.totals.total,
  };
}

export function InvoicesPage() {
  const appState = useAppStore((s) => s.appState);
  const saveAppState = useAppStore((s) => s.saveAppState);
  const [view, setView] = useState<'main' | 'form'>('main');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [formValues, setFormValues] = useState<InvoiceFormValues>(EMPTY_INVOICE_FORM);
  const [printPayload, setPrintPayload] = useState<{ id: string; data: InvoicePayload } | null>(null);

  const customers = useMemo(
    () => getCustomerList(appState).map((c) => ({
      id: String(c.id),
      name: String(c.name ?? ''),
      company: String(c.company ?? ''),
    })),
    [appState],
  );

  const rows = useMemo(() => {
    let data = listInvoices(appState);
    if (search) {
      const q = search.toLowerCase();
      data = data.filter((row) =>
        `${row.id} ${resolveInvoiceCustomerLabel(appState, row)}`.toLowerCase().includes(q),
      );
    }
    if (statusFilter !== 'all') {
      data = data.filter((row) => String(row.status).toLowerCase() === statusFilter);
    }
    return data;
  }, [appState, search, statusFilter]);

  const kpis = useMemo(() => INVOICES_CONFIG.kpi?.(rows) ?? [], [rows]);

  const invoicePreviewNo = useMemo(
    () => (editingId ? editingId : previewInvoiceNumber(appState, formValues.issueDate)),
    [appState, editingId, formValues.issueDate],
  );

  const columns = useMemo<AppTableColumn<Record<string, unknown>>[]>(() => [
    { key: 'id', label: 'Invoice #', render: (row) => <span className="font-bold text-slate-900">{String(row.id)}</span> },
    { key: 'customer', label: 'Customer', render: (row) => resolveInvoiceCustomerLabel(appState, row) },
    { key: 'date', label: 'Date', render: (row) => String(row.issueDate ?? row.date ?? '—') },
    {
      key: 'amount',
      label: 'Amount',
      render: (row) => formatMoney(Number(row.amount ?? row.total ?? 0)),
    },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={String(row.status)} /> },
  ], [appState]);

  const resetForm = () => {
    setFormValues({ ...EMPTY_INVOICE_FORM, items: [createEmptyLineItem()] });
    setEditingId(null);
    setFormKey((k) => k + 1);
  };

  const openCreate = () => {
    resetForm();
    setView('form');
  };

  const openEdit = (row: Record<string, unknown>) => {
    setEditingId(String(row.id));
    setFormValues(recordToFormValues(row));
    setFormKey((k) => k + 1);
    setView('form');
  };

  const handleCustomerChange = (customerId: string, issueDate: string) => {
    if (!customerId) return;
    const customer = customers.find((c) => c.id === customerId);
    const customerName = customer
      ? `${customer.name}${customer.company ? ` (${customer.company})` : ''}`
      : '';
    const defaults = getCustomerBillingDefaults(appState, customerId, issueDate);
    setFormValues((prev) => ({
      ...prev,
      customerId,
      customerName,
      billingAddress: defaults.billingAddress,
      dueDate: defaults.dueDate,
      terms: prev.terms || defaults.paymentTerms,
    }));
  };

  const persistInvoice = (payload: InvoicePayload, action: InvoiceSaveAction) => {
    const record = payloadToRecord(payload, editingId ?? undefined);
    if (action === 'sent') {
      record.status = 'sent';
    } else if (!editingId) {
      record.status = 'draft';
    }

    const result = editingId
      ? updateInvoice(appState, editingId, record)
      : createInvoice(appState, { ...record, id: payload.invoiceNo });

    if (!result.ok) {
      window.alert('error' in result ? result.error : 'Save failed');
      return null;
    }

    const savedId = editingId ?? ('id' in result ? result.id : payload.invoiceNo);

    if (action === 'sent' && savedId) {
      approveInvoice(appState, savedId);
      const sentResult = markInvoiceSent(appState, savedId);
      if (!sentResult.ok) {
        window.alert('error' in sentResult ? sentResult.error : 'Could not mark invoice as sent.');
      }
    }

    saveAppState();
    return savedId;
  };

  const handleSave = (payload: InvoicePayload, action: InvoiceSaveAction) => {
    const savedId = persistInvoice(payload, action);
    if (!savedId) return;
    setView('main');
    resetForm();
  };

  const handlePreview = (payload: InvoicePayload) => {
    setPrintPayload({ id: invoicePreviewNo, data: payload });
  };

  useEffect(() => {
    if (!printPayload) return;
    document.body.classList.add('print-invoice-active');
    let cancelled = false;
    const runPrint = async () => {
      try {
        await document.fonts.ready;
      } catch {
        /* fonts API unavailable */
      }
      await new Promise((resolve) => window.setTimeout(resolve, 300));
      if (!cancelled) window.print();
    };
    void runPrint();
    const onAfterPrint = () => {
      document.body.classList.remove('print-invoice-active');
      setPrintPayload(null);
    };
    window.addEventListener('afterprint', onAfterPrint);
    return () => {
      cancelled = true;
      window.removeEventListener('afterprint', onAfterPrint);
      document.body.classList.remove('print-invoice-active');
    };
  }, [printPayload]);

  const handleDelete = (id: string) => {
    if (!window.confirm('Delete this invoice?')) return;
    deleteInvoice(appState, id);
    saveAppState();
  };

  const printPortal =
    printPayload && typeof document !== 'undefined'
      ? createPortal(
          <div className="invoice-print-root hidden print:block bg-white">
            <InvoicePrint invoiceNo={printPayload.id} data={printPayload.data} />
          </div>,
          document.body,
        )
      : null;

  if (view === 'form') {
    return (
      <>
        <InvoiceForm
          key={formKey}
          mode={editingId ? 'edit' : 'create'}
          initialValues={formValues}
          invoicePreviewNo={invoicePreviewNo}
          appState={appState}
          customers={customers}
          onCustomerChange={handleCustomerChange}
          onCancel={() => { setView('main'); resetForm(); }}
          onSave={handleSave}
          onPreview={handlePreview}
        />
        {printPortal}
      </>
    );
  }

  return (
    <>
      <div className={MODULE_LIST_SHELL}>
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Invoices</h2>
            <p className="text-xs text-slate-500 mt-1 font-medium">Manage invoices, approvals, and payment collection.</p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2 cursor-pointer self-start"
          >
            <Plus className="w-4 h-4" /> New Invoice
          </button>
        </div>

        <KpiCards items={kpis} />

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 premium-shadow space-y-4">
          <FilterTabs tabs={STATUS_TABS} active={statusFilter} onChange={setStatusFilter} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice, customer..."
            className="w-full max-w-md px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 font-medium"
          />
        </div>

        <AppTable
          columns={columns}
          rows={rows}
          emptyMessage="No invoices found."
          renderActions={(row) => (
            <>
              <TableIconAction variant="edit" onClick={() => openEdit(row)} />
              <TableIconAction
                variant="view"
                onClick={() => {
                  const data = recordToFormValues(row);
                  setPrintPayload({
                    id: String(row.id),
                    data: {
                      ...data,
                      invoiceNo: String(row.id),
                      totals: {
                        subtotal: Number(row.subtotal ?? 0),
                        lineDiscount: Number(row.discountAmount ?? row.discount ?? 0),
                        discountAmount: Number(row.discountAmount ?? row.discount ?? 0),
                        taxAmount: Number(row.taxAmount ?? row.tax ?? 0),
                        total: Number(row.total ?? row.amount ?? 0),
                      },
                    },
                  });
                }}
              />
              <TableIconAction variant="delete" onClick={() => handleDelete(String(row.id))} />
            </>
          )}
        />

        <Footer />
      </div>

      {printPortal}
    </>
  );
}
