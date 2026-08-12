'use client';

import { toast, confirmAction } from '@/lib/ui/feedback';

import { useMemo, useState } from 'react';
import { Footer } from '@/components/layout/Footer';
import { useChromeSuppressed } from '@/components/layout/ModuleActionsContext';
import { useAppStore } from '@/lib/state/app-store';
import { usePaginatedApiResource } from '@/hooks/use-paginated-api-resource';
import { ListPagination } from '@/components/shared/ListPagination';
import { mapGenericApiRow, mapGenericPayloadToApi } from '@/lib/services/generic-api-mapper';
import { ApiModeBanner } from '@/components/shared/ApiModeBanner';
import { isModuleApiMode } from '@/lib/config/data-source';
import {
  createCashboxEntry,
  deleteCashboxEntry,
  exportCashboxCsv,
  filterCashboxEntries,
  getCashboxMetrics,
  getCashboxPartyOptions,
  getFilteredTotals,
  listCashboxEntries,
  updateCashboxEntry,
  type CashboxEntry,
  type CashboxFormValues,
} from '@/lib/services/cashbox-service';
import { CashboxMetrics } from './cashbox/CashboxMetrics';
import { CashboxActionBar } from './cashbox/CashboxActionBar';
import { CashboxTransactionsTable } from './cashbox/CashboxTransactionsTable';
import { CashboxFooterBar } from './cashbox/CashboxFooterBar';
import { CashboxForm } from './cashbox/CashboxForm';
import type { CashboxTab } from './cashbox/cashbox-types';

const PAGE_SIZE = 6;

export function CashboxPage() {
  const appState = useAppStore((s) => s.appState);
  const saveAppState = useAppStore((s) => s.saveAppState);
  const apiMode = isModuleApiMode('cashbox');
  const apiStore = usePaginatedApiResource('cashbox', mapGenericApiRow, { pageSize: PAGE_SIZE });

  const [view, setView] = useState<'main' | 'form'>('main');
  const [formType, setFormType] = useState<CashboxTab>('cash_in');
  const [editingEntry, setEditingEntry] = useState<CashboxEntry | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [localPage, setLocalPage] = useState(1);

  const allEntries = useMemo(() => {
    if (apiMode && apiStore.initialized) {
      return listCashboxEntries({ cashboxEntries: apiStore.rows } as import('@/lib/state/types').AppState);
    }
    return listCashboxEntries(appState);
  }, [apiMode, apiStore.initialized, apiStore.rows, appState]);
  const metrics = useMemo(() => getCashboxMetrics(
    apiMode && apiStore.initialized
      ? { cashboxEntries: apiStore.rows } as import('@/lib/state/types').AppState
      : appState,
  ), [apiMode, apiStore.initialized, apiStore.rows, appState]);
  const partyOptions = useMemo(() => getCashboxPartyOptions(appState), [appState]);

  const filteredRows = useMemo(
    () => filterCashboxEntries(allEntries, { dateFrom, dateTo, type: typeFilter, category: categoryFilter }),
    [allEntries, dateFrom, dateTo, typeFilter, categoryFilter],
  );

  const totals = useMemo(() => getFilteredTotals(filteredRows), [filteredRows]);
  const inCount = useMemo(() => filteredRows.filter((e) => e.cashIn > 0).length, [filteredRows]);
  const outCount = useMemo(() => filteredRows.filter((e) => e.cashOut > 0).length, [filteredRows]);

  const listPage = apiMode ? apiStore.page : localPage;
  const onPageChange = (p: number) => {
    if (apiMode) apiStore.setPage(p);
    else setLocalPage(p);
  };
  const tablePage = apiMode ? 1 : listPage;
  const tablePageSize = apiMode ? Math.max(filteredRows.length, 1) : PAGE_SIZE;

  const openCreateForm = (type: CashboxTab) => {
    setFormType(type);
    setEditingEntry(null);
    setView('form');
  };

  const openEditForm = (entry: CashboxEntry) => {
    setEditingEntry(entry);
    setFormType(entry.type === 'cash_out' ? 'cash_out' : 'cash_in');
    setView('form');
  };

  const closeForm = () => {
    setView('main');
    setEditingEntry(null);
  };

  const handleSave = async (type: CashboxTab, values: CashboxFormValues) => {
    const payload = {
      amount: Number(values.amount),
      datetime: new Date(values.datetime).toISOString(),
      category: values.category,
      party: values.party,
      paymentMethod: values.paymentMethod,
      reference: values.reference,
      note: values.note,
      description: values.description || values.note,
      type,
    };

    if (apiMode) {
      const amount = Number(values.amount);
      const body = mapGenericPayloadToApi({
        ...payload,
        cashIn: type === 'cash_in' ? amount : 0,
        cashOut: type === 'cash_out' ? amount : 0,
      });
      const result = editingEntry
        ? await apiStore.update(editingEntry.id, body)
        : await apiStore.create(body);
      if (!result.ok) {
        toast.error('Operation failed', { module: 'Cashbox', description: 'error' in result ? String(result.error) : 'Failed to save entry' });
        return;
      }
      toast.success('Saved', { module: 'Cashbox', description: editingEntry ? 'Entry updated.' : 'Entry added.' });
      closeForm();
      setTypeFilter('all');
      setCategoryFilter('all');
      onPageChange(1);
      return;
    }

    if (editingEntry) {
      updateCashboxEntry(appState, editingEntry.id, { ...payload, type });
    } else {
      createCashboxEntry(appState, type, payload);
    }
    saveAppState();
    closeForm();
    onPageChange(1);
  };

  const handleDelete = async (entry: CashboxEntry) => {
    const __ok = await confirmAction({ title: 'Confirm action', message: `Delete "${entry.description}"?`, confirmLabel: 'Confirm', tone: 'danger', module: 'Cashbox' }); if (!__ok) return;
    if (apiMode) {
      const result = await apiStore.remove(entry.id);
      if (!result.ok) {
        toast.error('Operation failed', { module: 'Cashbox', description: 'error' in result ? String(result.error) : 'Failed to delete entry' });
        return;
      }
      if (editingEntry?.id === entry.id) closeForm();
      toast.success('Deleted', { module: 'Cashbox', description: 'Entry removed.' });
      return;
    }
    deleteCashboxEntry(appState, entry.id);
    saveAppState();
    if (editingEntry?.id === entry.id) closeForm();
  };

  const handleTransfer = () => {
    toast.info('Feature coming soon', { module: 'Cashbox', description: "Transfer between cashboxes is coming soon." });
  };

  useChromeSuppressed(view === 'form');

  return (
    <>
      {apiStore.error ? <ApiModeBanner module="cashbox" error={apiStore.error} /> : null}
      <div className="space-y-3 min-w-0">
          <CashboxMetrics
            currentBalance={metrics.currentBalance}
            asOf={metrics.asOf}
            totalIn={totals.totalIn}
            totalOut={totals.totalOut}
            netTotal={totals.netTotal}
            inCount={inCount}
            outCount={outCount}
          />
          <CashboxActionBar
            onCashIn={() => openCreateForm('cash_in')}
            onCashOut={() => openCreateForm('cash_out')}
            onTransfer={handleTransfer}
          />
          <CashboxTransactionsTable
            rows={filteredRows}
            dateFrom={dateFrom}
            dateTo={dateTo}
            typeFilter={typeFilter}
            categoryFilter={categoryFilter}
            page={tablePage}
            pageSize={tablePageSize}
            onDateFromChange={(v) => { setDateFrom(v); onPageChange(1); }}
            onDateToChange={(v) => { setDateTo(v); onPageChange(1); }}
            onTypeFilterChange={(v) => { setTypeFilter(v); onPageChange(1); }}
            onCategoryFilterChange={(v) => { setCategoryFilter(v); onPageChange(1); }}
            onPageChange={onPageChange}
            onExport={() => exportCashboxCsv(filteredRows)}
            onEdit={openEditForm}
            onDelete={handleDelete}
          />
          {apiMode ? (
            <ListPagination
              page={apiStore.page}
              pageSize={apiStore.pageSize}
              total={apiStore.meta.total}
              onPageChange={apiStore.setPage}
            />
          ) : null}
          <CashboxFooterBar
            totalIn={totals.totalIn}
            totalOut={totals.totalOut}
            netTotal={totals.netTotal}
          />
        </div>
      <Footer />

      <CashboxForm
        open={view === 'form'}
        formType={formType}
        editingEntry={editingEntry}
        partyOptions={partyOptions}
        onClose={closeForm}
        onSave={handleSave}
      />
    </>
  );
}
