'use client';

import { useMemo, useState } from 'react';
import { Footer } from '@/components/layout/Footer';
import { MODULE_LIST_SHELL } from '@/lib/ui/module-layout';
import { useAppStore } from '@/lib/state/app-store';
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

  const [view, setView] = useState<'main' | 'form'>('main');
  const [formType, setFormType] = useState<CashboxTab>('cash_in');
  const [editingEntry, setEditingEntry] = useState<CashboxEntry | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [page, setPage] = useState(1);

  const allEntries = useMemo(() => listCashboxEntries(appState), [appState]);
  const metrics = useMemo(() => getCashboxMetrics(appState), [appState]);
  const partyOptions = useMemo(() => getCashboxPartyOptions(appState), [appState]);

  const filteredRows = useMemo(
    () => filterCashboxEntries(allEntries, { dateFrom, dateTo, type: typeFilter, category: categoryFilter }),
    [allEntries, dateFrom, dateTo, typeFilter, categoryFilter],
  );

  const totals = useMemo(() => getFilteredTotals(filteredRows), [filteredRows]);

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

  const handleSave = (type: CashboxTab, values: CashboxFormValues) => {
    const payload = {
      amount: Number(values.amount),
      datetime: new Date(values.datetime).toISOString(),
      category: values.category,
      party: values.party,
      paymentMethod: values.paymentMethod,
      reference: values.reference,
      note: values.note,
      description: values.description || values.note,
    };

    if (editingEntry) {
      updateCashboxEntry(appState, editingEntry.id, { ...payload, type });
    } else {
      createCashboxEntry(appState, type, payload);
    }
    saveAppState();
    closeForm();
    setPage(1);
  };

  const handleDelete = (entry: CashboxEntry) => {
    if (!window.confirm(`Delete "${entry.description}"?`)) return;
    deleteCashboxEntry(appState, entry.id);
    saveAppState();
    if (editingEntry?.id === entry.id) closeForm();
  };

  const handleTransfer = () => {
    window.alert('Transfer between cashboxes is coming soon.');
  };

  return (
    <>
      <div className={MODULE_LIST_SHELL}>
        <div className="space-y-3 min-w-0">
          <CashboxMetrics metrics={metrics} />
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
            page={page}
            pageSize={PAGE_SIZE}
            onDateFromChange={(v) => { setDateFrom(v); setPage(1); }}
            onDateToChange={(v) => { setDateTo(v); setPage(1); }}
            onTypeFilterChange={(v) => { setTypeFilter(v); setPage(1); }}
            onCategoryFilterChange={(v) => { setCategoryFilter(v); setPage(1); }}
            onPageChange={setPage}
            onExport={() => exportCashboxCsv(filteredRows)}
            onEdit={openEditForm}
            onDelete={handleDelete}
          />
          <CashboxFooterBar
            totalIn={totals.totalIn}
            totalOut={totals.totalOut}
            netTotal={totals.netTotal}
          />
        </div>
        <Footer />
      </div>

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
