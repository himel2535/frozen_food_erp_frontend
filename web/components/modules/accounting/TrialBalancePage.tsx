'use client';

import { toast } from '@/lib/ui/feedback';

import { useMemo, useState } from 'react';
import { FileDown, FileSpreadsheet, Plus, Printer } from 'lucide-react';
import { Footer } from '@/components/layout/Footer';
import { AppFormFields, AppFormModal } from '@/components/shared/AppForm';
import { MODULE_LIST_SHELL } from '@/lib/ui/module-layout';
import { useAppStore } from '@/lib/state/app-store';
import type { PortField } from '@/lib/modules/port-types';
import {
  createTrialBalanceLine,
  filterTrialBalanceAccounts,
  getTrialBalanceMetrics,
  listTrialBalanceAccounts,
} from '@/lib/services/trial-balance-service';
import { TrialBalanceFilterCard } from './trial-balance/TrialBalanceFilterCard';
import { TrialBalanceMetricsCards } from './trial-balance/TrialBalanceMetrics';
import { TrialBalanceTable } from './trial-balance/TrialBalanceTable';
import { TrialBalanceInfoBanner } from './trial-balance/TrialBalanceInfoBanner';
import { ADD_LINE_FIELDS } from './trial-balance/trial-balance-options';
import {
  DEFAULT_TRIAL_BALANCE_FILTERS,
  type TrialBalanceFilterState,
} from './trial-balance/trial-balance-types';

const ADD_FORM_FIELDS: PortField[] = ADD_LINE_FIELDS.map((f) => ({ ...f }));

function formatGeneratedAt(date: Date) {
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function TrialBalancePage() {
  const appState = useAppStore((s) => s.appState);
  const saveAppState = useAppStore((s) => s.saveAppState);

  const [draftFilters, setDraftFilters] = useState<TrialBalanceFilterState>(DEFAULT_TRIAL_BALANCE_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<TrialBalanceFilterState>(DEFAULT_TRIAL_BALANCE_FILTERS);
  const [generatedAt, setGeneratedAt] = useState(() => formatGeneratedAt(new Date()));

  const [showAddModal, setShowAddModal] = useState(false);
  const [showAdvancedAdd, setShowAdvancedAdd] = useState(false);
  const [addForm, setAddForm] = useState({
    accountCode: '',
    accountName: '',
    parentAccount: 'Assets',
    debit: '',
    credit: '',
    notes: '',
  });

  const allAccounts = useMemo(() => listTrialBalanceAccounts(appState), [appState]);

  const filteredRows = useMemo(
    () => filterTrialBalanceAccounts(allAccounts, {
      showZeroBalance: appliedFilters.showZeroBalance,
      showInactiveAccounts: appliedFilters.showInactiveAccounts,
    }),
    [allAccounts, appliedFilters],
  );

  const metrics = useMemo(() => getTrialBalanceMetrics(filteredRows), [filteredRows]);

  const applyFilters = () => {
    setAppliedFilters({ ...draftFilters });
    setGeneratedAt(formatGeneratedAt(new Date()));
  };

  const resetFilters = () => {
    setDraftFilters(DEFAULT_TRIAL_BALANCE_FILTERS);
    setAppliedFilters(DEFAULT_TRIAL_BALANCE_FILTERS);
    setGeneratedAt(formatGeneratedAt(new Date()));
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.accountCode.trim() || !addForm.accountName.trim()) return;
    const result = createTrialBalanceLine(appState, {
      accountCode: addForm.accountCode,
      accountName: addForm.accountName,
      parentAccount: addForm.parentAccount,
      debit: Number(addForm.debit || 0),
      credit: Number(addForm.credit || 0),
      notes: addForm.notes,
    });
    if (!result.ok) {
      toast.error('Operation failed', { module: 'Trial Balance', description: String(result.error ?? 'Failed to add line') });
      return;
    }
    saveAppState();
    setShowAddModal(false);
    setAddForm({
      accountCode: '',
      accountName: '',
      parentAccount: 'Assets',
      debit: '',
      credit: '',
      notes: '',
    });
    setGeneratedAt(formatGeneratedAt(new Date()));
  };

  return (
    <>
      <div className={MODULE_LIST_SHELL}>
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Trial Balance</h2>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              View debit and credit balances for all ledger accounts as on a selected date.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 self-start xl:self-auto">
            <button
              type="button"
              onClick={() => toast.info('Feature coming soon', { module: 'Trial Balance', description: "Export PDF coming soon." })}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <FileDown className="w-4 h-4" />
              Export PDF
            </button>
            <button
              type="button"
              onClick={() => toast.info('Feature coming soon', { module: 'Trial Balance', description: "Export Excel coming soon." })}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export Excel
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Line
            </button>
          </div>
        </div>

        <TrialBalanceFilterCard
          draft={draftFilters}
          onDraftChange={setDraftFilters}
          onApply={applyFilters}
          onReset={resetFilters}
        />

        <TrialBalanceMetricsCards metrics={metrics} />

        <TrialBalanceTable rows={filteredRows} metrics={metrics} />

        <TrialBalanceInfoBanner generatedAt={generatedAt} />

        <Footer />
      </div>

      <AppFormModal
        open={showAddModal}
        title="Add Trial Balance Line"
        subtitle="Add a ledger account line to the trial balance report."
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddSubmit}
        submitLabel="Add Line"
      >
        <AppFormFields
          fields={ADD_FORM_FIELDS}
          values={addForm}
          onChange={(key, value) => setAddForm((prev) => ({ ...prev, [key]: value }))}
          showAdvanced={showAdvancedAdd}
          onToggleAdvanced={() => setShowAdvancedAdd((v) => !v)}
        />
      </AppFormModal>
    </>
  );
}
