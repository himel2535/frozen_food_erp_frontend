'use client';

import { toast, confirmAction } from '@/lib/ui/feedback';

import { useMemo, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Download, Plus } from 'lucide-react';
import { Footer } from '@/components/layout/Footer';
import { useChromeSuppressed, useRegisterModuleActions } from '@/components/layout/ModuleActionsContext';
import { FilterTabs } from '@/components/shared/FilterTabs';
import { ModuleFilterBar } from '@/components/shared/ModuleFilterBar';
import { AppTable, type AppTableColumn } from '@/components/shared/AppTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { TableIconAction } from '@/components/shared/TableIconAction';
import { useAppStore } from '@/lib/state/app-store';
import { getCustomerList, approveInvoice, getSalesDashboardSummary } from '@/lib/services/crm-service';
import { listInvoices } from '@/lib/services/sales-service';
import {
  createInvoice,
  deleteInvoice,
  getCustomerBillingDefaults,
  markInvoiceSent,
  previewInvoiceNumber,
  resolveInvoiceCustomerLabel,
  updateInvoice,
} from '@/lib/services/sales-service';
import { useLocaleFormat } from '@/hooks/useLocaleFormat';
import {
  InvoiceForm,
  EMPTY_INVOICE_FORM,
  type InvoicePayload,
  type InvoiceSaveAction,
} from '@/components/modules/sales/invoice-form/InvoiceForm';
import type { InvoiceFormValues, InvoiceLineItem } from '@/components/modules/sales/invoice-form/inv-form-types';
import { createEmptyLineItem, recalcLineItem } from '@/components/modules/sales/invoice-form/inv-form-types';
import { InvoicePrintPreview } from '@/components/modules/sales/invoice-form/InvoicePrintPreview';
import { InvoiceDashboardMetrics } from '@/components/modules/sales/invoice-list/InvoiceDashboardMetrics';
import { InvoiceAgingSnapshot } from '@/components/modules/sales/invoice-list/InvoiceAgingSnapshot';
import {
  buildPrintPayloadFromRow,
  enrichPrintPayload,
  exportInvoicesCsv,
} from '@/components/modules/sales/invoice-list/invoice-list-utils';
import { getDefaultSignature, getCompanySignatures } from '@/lib/services/settings-service';
import { isModuleApiMode } from '@/lib/config/data-source';
import { useApiResourceStore } from '@/hooks/use-api-resource-store';
import { useCustomersApiStore } from '@/hooks/use-customers-module';
import { ApiModeBanner } from '@/components/shared/ApiModeBanner';
import { mapApiInvoiceRow, mapInvoiceRecordToApi, resolveApiRowId } from '@/lib/services/entity-api-mappers';

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
    includeSignature: Boolean(record.includeSignature),
    signatureId: record.signatureId ? String(record.signatureId) : null,
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
    includeSignature: payload.includeSignature,
    signatureId: payload.signatureId,
    subtotal: payload.totals.subtotal,
    discountAmount: payload.totals.discountAmount,
    taxAmount: payload.totals.taxAmount,
    total: payload.totals.total,
  };
}

export function InvoicesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const appState = useAppStore((s) => s.appState);
  const saveAppState = useAppStore((s) => s.saveAppState);
  const apiMode = isModuleApiMode('invoices');
  const customersApiMode = isModuleApiMode('customers');
  const apiStore = useApiResourceStore('invoices', mapApiInvoiceRow);
  const customersApiStore = useCustomersApiStore();
  const t = useAppStore((s) => s.t);
  const { formatMoney } = useLocaleFormat();
  const [view, setView] = useState<'main' | 'form'>('main');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingMongoId, setEditingMongoId] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [formValues, setFormValues] = useState<InvoiceFormValues>(EMPTY_INVOICE_FORM);
  const [printPayload, setPrintPayload] = useState<{ id: string; data: InvoicePayload } | null>(null);

  const customers = useMemo(
    () => {
      if (customersApiMode) {
        return customersApiStore.rows.map((c) => ({
          id: String(c.id),
          name: String(c.name ?? ''),
          company: String(c.company ?? ''),
        }));
      }
      return getCustomerList(appState).map((c) => ({
        id: String(c.id),
        name: String(c.name ?? ''),
        company: String(c.company ?? ''),
      }));
    },
    [customersApiMode, customersApiStore.rows, appState],
  );

  const allInvoiceRows = useMemo(() => {
    if (apiMode) return apiStore.rows;
    return listInvoices(appState);
  }, [apiMode, apiStore.rows, appState]);

  const rows = useMemo(() => {
    let data = allInvoiceRows;
    if (search) {
      const q = search.toLowerCase();
      data = data.filter((row) =>
        `${row.id} ${apiMode ? row.customerName : resolveInvoiceCustomerLabel(appState, row)}`.toLowerCase().includes(q),
      );
    }
    if (statusFilter !== 'all') {
      data = data.filter((row) => String(row.status).toLowerCase() === statusFilter);
    }
    return data;
  }, [allInvoiceRows, appState, search, statusFilter, apiMode]);

  const dashboardSummary = useMemo(() => {
    if (apiMode) {
      const invoices = allInvoiceRows;
      const totalDue = invoices.reduce((s, r) => s + Number(r.due ?? 0), 0);
      const overdueReceivables = invoices
        .filter((r) => String(r.status).toLowerCase() === 'overdue')
        .reduce((s, r) => s + Number(r.due ?? 0), 0);
      const totalAmount = invoices.reduce((s, r) => s + Number(r.amount ?? r.total ?? 0), 0);
      const collected = invoices.reduce((s, r) => s + Number(r.paid ?? 0), 0);
      return {
        monthlySales: totalAmount,
        collectedThisMonth: collected,
        openReceivables: totalDue,
        overdueReceivables,
        averageInvoiceValue: invoices.length ? totalAmount / invoices.length : 0,
        collectionRate: totalAmount > 0 ? (collected / totalAmount) * 100 : 0,
        aging: { current: totalDue, days1_30: 0, days31_60: 0, days61_90: 0, over90: overdueReceivables },
      };
    }
    return getSalesDashboardSummary(appState);
  }, [apiMode, allInvoiceRows, appState]);

  const invoicePreviewNo = useMemo(
    () => (editingId ? editingId : apiMode ? `INV-${Date.now()}` : previewInvoiceNumber(appState, formValues.issueDate)),
    [appState, editingId, formValues.issueDate, apiMode],
  );

  const columns = useMemo<AppTableColumn<Record<string, unknown>>[]>(() => [
    { key: 'id', label: 'Invoice #', render: (row) => <span className="font-bold text-slate-900">{String(row.id)}</span> },
    {
      key: 'customer',
      label: 'Customer',
      render: (row) => (apiMode ? String(row.customerName ?? row.customer ?? '—') : resolveInvoiceCustomerLabel(appState, row)),
    },
    { key: 'date', label: 'Date', render: (row) => String(row.issueDate ?? row.date ?? '—') },
    {
      key: 'amount',
      label: 'Amount',
      render: (row) => formatMoney(Number(row.amount ?? row.total ?? 0)),
    },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={String(row.status)} /> },
  ], [appState, formatMoney]);

  const resetForm = () => {
    setFormValues({ ...EMPTY_INVOICE_FORM, items: [createEmptyLineItem()] });
    setEditingId(null);
    setEditingMongoId(null);
    setFormKey((k) => k + 1);
  };

  const openCreate = () => {
    resetForm();
    setView('form');
  };

  useEffect(() => {
    if (searchParams.get('create') !== '1') return;

    setEditingId(null);

    if (searchParams.get('signature') === '1') {
      const defaultSig = getDefaultSignature(appState);
      const fallbackSig = getCompanySignatures(appState)[0] ?? null;
      const signatureId = defaultSig?.id ?? fallbackSig?.id ?? null;
      setFormValues({
        ...EMPTY_INVOICE_FORM,
        items: [createEmptyLineItem()],
        includeSignature: Boolean(signatureId),
        signatureId,
      });
    } else {
      setFormValues({ ...EMPTY_INVOICE_FORM, items: [createEmptyLineItem()] });
    }

    setFormKey((k) => k + 1);
    setView('form');

    toast.info(t('settings.signatures_invoice_opened_toast'), {
      module: 'Invoices',
      description: t('settings.signatures_invoice_opened_desc'),
    });

    router.replace('/sales/invoices');
  }, [searchParams, appState, router, t]);

  const openEdit = (row: Record<string, unknown>) => {
    setEditingId(String(row.id));
    setEditingMongoId(apiMode ? resolveApiRowId(row) : null);
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
    if (apiMode || customersApiMode) {
      setFormValues((prev) => ({
        ...prev,
        customerId,
        customerName,
        dueDate: prev.dueDate || issueDate,
      }));
      return;
    }
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

  const persistInvoice = async (payload: InvoicePayload, action: InvoiceSaveAction) => {
    const record = payloadToRecord(payload, editingId ?? undefined);
    if (action === 'sent') {
      record.status = 'sent';
    } else if (!editingId) {
      record.status = 'draft';
    }

    if (apiMode) {
      if (!editingId) record.id = payload.invoiceNo;
      const body = mapInvoiceRecordToApi(record, editingId ?? undefined);
      const result = editingId
        ? await apiStore.update(editingMongoId ?? editingId, body)
        : await apiStore.create(body);
      if (!result.ok) {
        toast.error('Operation failed', { module: 'Invoices', description: 'error' in result ? String(result.error) : 'Save failed' });
        return null;
      }
      return editingId ?? ('id' in result ? result.id : payload.invoiceNo);
    }

    const result = editingId
      ? updateInvoice(appState, editingId, record)
      : createInvoice(appState, { ...record, id: payload.invoiceNo });

    if (!result.ok) {
      toast.error('Operation failed', { module: 'Invoices', description: 'error' in result ? String(result.error) : 'Save failed' });
      return null;
    }

    const savedId = editingId ?? ('id' in result ? result.id : payload.invoiceNo);

    if (action === 'sent' && savedId) {
      approveInvoice(appState, savedId);
      const sentResult = markInvoiceSent(appState, savedId);
      if (!sentResult.ok) {
        toast.error('Operation failed', { module: 'Invoices', description: 'error' in sentResult ? String(sentResult.error) : 'Could not mark invoice as sent.' });
      }
    }

    saveAppState();
    return savedId;
  };

  const handleSave = async (payload: InvoicePayload, action: InvoiceSaveAction) => {
    const savedId = await persistInvoice(payload, action);
    if (!savedId) return;
    setView('main');
    resetForm();
  };

  const handlePreview = (payload: InvoicePayload) => {
    setPrintPayload({
      id: invoicePreviewNo,
      data: enrichPrintPayload(appState, { ...payload, invoiceNo: invoicePreviewNo }),
    });
  };

  const handleExport = () => {
    const csv = exportInvoicesCsv(rows, (row) => (
      apiMode ? String(row.customerName ?? row.customer ?? '') : resolveInvoiceCustomerLabel(appState, row)
    ));
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'invoices.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (row: Record<string, unknown>) => {
    const id = String(row.id);
    const __ok = await confirmAction({ title: "Delete this invoice", message: "Delete this invoice?", confirmLabel: 'Delete', tone: 'danger', module: 'Invoices' }); if (!__ok) return;
    if (apiMode) {
      await apiStore.remove(resolveApiRowId(row));
      return;
    }
    deleteInvoice(appState, id);
    saveAppState();
  };

  const printPreview = printPayload ? (
    <InvoicePrintPreview
      invoiceNo={printPayload.id}
      data={printPayload.data}
      onClose={() => setPrintPayload(null)}
    />
  ) : null;

  useChromeSuppressed(view !== 'main');

  useRegisterModuleActions(
    view === 'main' ? (
      <>
        <button
          type="button"
          onClick={handleExport}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
        <button
          type="button"
          onClick={openCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Create Invoice
        </button>
      </>
    ) : null,
    [view, handleExport, openCreate],
  );

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
        {printPreview}
      </>
    );
  }

  return (
    <>
        {apiMode ? <ApiModeBanner module="invoices" error={apiStore.error} /> : null}

        <InvoiceDashboardMetrics summary={dashboardSummary} />
        <InvoiceAgingSnapshot aging={dashboardSummary.aging} />

        <ModuleFilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search invoice, customer..."
          filters={<FilterTabs tabs={STATUS_TABS} active={statusFilter} onChange={setStatusFilter} />}
        />

        <AppTable
          columns={columns}
          rows={rows}
          emptyMessage={apiStore.loading ? 'Loading invoices…' : 'No invoices found.'}
          renderActions={(row) => (
            <>
              <TableIconAction variant="edit" onClick={() => openEdit(row)} />
              <TableIconAction
                variant="view"
                onClick={() => setPrintPayload(buildPrintPayloadFromRow(appState, row))}
              />
              <TableIconAction variant="delete" onClick={() => handleDelete(row)} />
            </>
          )}
        />

        <Footer />

      {printPreview}
    </>
  );
}
