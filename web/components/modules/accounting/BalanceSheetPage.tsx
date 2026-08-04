'use client';

import { toast, confirmAction } from '@/lib/ui/feedback';

import { useMemo, useState } from 'react';
import { ChevronDown, Download, Plus } from 'lucide-react';
import { Footer } from '@/components/layout/Footer';
import { useRegisterModuleActions } from '@/components/layout/ModuleActionsContext';
import { AppFormFields, AppFormModal } from '@/components/shared/AppForm';
import { useAppStore } from '@/lib/state/app-store';
import type { PortField } from '@/lib/modules/port-types';
import {
  buildBalanceSheetDisplayRows,
  createBalanceSheetLine,
  deleteBalanceSheetLine,
  filterBalanceSheetLines,
  getBalanceSheetMetrics,
  listBalanceSheetLines,
  sectionToType,
  updateBalanceSheetLine,
  type BalanceSheetLine,
  type BalanceSheetSection,
  type BalanceSheetStatus,
  type BalanceSheetType,
} from '@/lib/services/balance-sheet-service';
import { BalanceSheetMetrics } from './balance-sheet/BalanceSheetMetrics';
import { BalanceSheetEquationBar } from './balance-sheet/BalanceSheetEquationBar';
import { BalanceSheetFilterBar } from './balance-sheet/BalanceSheetFilterBar';
import { BalanceSheetTable } from './balance-sheet/BalanceSheetTable';
import { BalanceSheetStatusBanner } from './balance-sheet/BalanceSheetStatusBanner';
import {
  ADD_BS_LINE_FIELDS,
  BS_SECTION_LABEL_TO_VALUE,
  BS_SECTION_VALUE_TO_LABEL,
} from './balance-sheet/balance-sheet-types';
import {
  DEFAULT_BS_FILTERS,
  EMPTY_BS_FORM,
  type BalanceSheetFilterState,
  type BalanceSheetFormState,
} from './balance-sheet/balance-sheet-types';

const FORM_FIELDS: PortField[] = [
  ...ADD_BS_LINE_FIELDS.map((f) => ({ ...f })),
  { key: 'status', label: 'Status', type: 'select', options: ['active', 'pending'], advanced: true },
];

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

function lineToForm(line: BalanceSheetLine): BalanceSheetFormState {
  return {
    lineItem: line.lineItem,
    section: BS_SECTION_VALUE_TO_LABEL[line.section],
    type: line.type,
    amount: String(line.amount),
    openingDate: line.openingDate ?? '2026-05-31',
    reference: line.reference ?? '',
    notes: line.notes ?? '',
    status: line.status,
  };
}

function formToPayload(form: BalanceSheetFormState) {
  const section = (BS_SECTION_LABEL_TO_VALUE[form.section] ?? 'current_assets') as BalanceSheetSection;
  return {
    lineItem: form.lineItem,
    section,
    type: (form.type as BalanceSheetType) || sectionToType(section),
    amount: Number(form.amount || 0),
    openingDate: form.openingDate,
    reference: form.reference,
    notes: form.notes,
    status: form.status as BalanceSheetStatus,
  };
}

export function BalanceSheetPage() {
  const appState = useAppStore((s) => s.appState);
  const saveAppState = useAppStore((s) => s.saveAppState);

  const [asOnDate, setAsOnDate] = useState('2026-05-31');
  const [generatedAt, setGeneratedAt] = useState(() => formatGeneratedAt(new Date()));
  const [filters, setFilters] = useState<BalanceSheetFilterState>(DEFAULT_BS_FILTERS);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [form, setForm] = useState<BalanceSheetFormState>(EMPTY_BS_FORM);

  const allLines = useMemo(() => listBalanceSheetLines(appState), [appState]);
  const filteredLines = useMemo(
    () => filterBalanceSheetLines(allLines, filters),
    [allLines, filters],
  );
  const metrics = useMemo(() => getBalanceSheetMetrics(filteredLines), [filteredLines]);
  const displayRows = useMemo(() => buildBalanceSheetDisplayRows(filteredLines), [filteredLines]);

  const formFields = useMemo<PortField[]>(() => FORM_FIELDS.map((field) => {
    if (field.key === 'section') {
      return { ...field, options: Object.keys(BS_SECTION_LABEL_TO_VALUE) };
    }
    return field;
  }), []);

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...EMPTY_BS_FORM, openingDate: asOnDate });
    setShowModal(true);
  };

  const openEdit = (sourceId: string) => {
    const line = allLines.find((l) => l.id === sourceId);
    if (!line) return;
    setEditingId(sourceId);
    setForm(lineToForm(line));
    setShowModal(true);
  };

  const handleDelete = async (sourceId: string) => {
    const line = allLines.find((l) => l.id === sourceId);
    if (!line) return;
    const __ok = await confirmAction({ title: 'Confirm action', message: `Delete "${line.lineItem}"?`, confirmLabel: 'Confirm', tone: 'danger', module: 'Balance Sheet' }); if (!__ok) return;
    const result = deleteBalanceSheetLine(appState, sourceId);
    if (!result.ok) {
      toast.error('Operation failed', { module: 'Balance Sheet', description: String(result.error ?? 'Failed to delete line') });
      return;
    }
    saveAppState();
    setGeneratedAt(formatGeneratedAt(new Date()));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.lineItem.trim()) return;
    const payload = formToPayload(form);
    const result = editingId
      ? updateBalanceSheetLine(appState, editingId, payload)
      : createBalanceSheetLine(appState, payload);
    if (!result.ok) {
      toast.error('Operation failed', { module: 'Balance Sheet', description: 'error' in result ? String(result.error) : 'Failed to save line' });
      return;
    }
    saveAppState();
    setShowModal(false);
    setEditingId(null);
    setForm(EMPTY_BS_FORM);
    setGeneratedAt(formatGeneratedAt(new Date()));
  };

  const handleSectionChange = (key: string, value: string) => {
    if (key === 'section') {
      const section = BS_SECTION_LABEL_TO_VALUE[value] ?? 'current_assets';
      setForm((prev) => ({
        ...prev,
        section: value,
        type: sectionToType(section),
      }));
      return;
    }
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  useRegisterModuleActions(
    <>
      <input
        type="date"
        value={asOnDate}
        onChange={(e) => setAsOnDate(e.target.value)}
        className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-700 cursor-pointer"
      />
      <button
        type="button"
        onClick={() => toast.info('Feature coming soon', { module: 'Balance Sheet', description: "Export coming soon." })}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
      >
        <Download className="w-4 h-4" />
        Export
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>
      <button
        type="button"
        onClick={openAdd}
        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        Add Line
      </button>
    </>,
    [asOnDate, openAdd],
  );

  return (
    <>
        <BalanceSheetMetrics metrics={metrics} />
        <BalanceSheetEquationBar metrics={metrics} />
        <BalanceSheetFilterBar filters={filters} onChange={setFilters} />

        <div className="space-y-3 min-w-0">
          <BalanceSheetTable
            rows={displayRows}
            metrics={metrics}
            onEdit={openEdit}
            onDelete={handleDelete}
          />
          <BalanceSheetStatusBanner metrics={metrics} generatedAt={generatedAt} />
        </div>

        <Footer />

      <AppFormModal
        open={showModal}
        title={editingId ? 'Edit Balance Sheet Line' : 'Create Balance Sheet Line'}
        subtitle="Add assets, liabilities, or equity items with proper classification."
        onClose={() => { setShowModal(false); setEditingId(null); }}
        onSubmit={handleSubmit}
        submitLabel={editingId ? 'Save Changes' : 'Save Line'}
      >
        <AppFormFields
          fields={formFields}
          values={form as unknown as Record<string, string>}
          onChange={handleSectionChange}
          showAdvanced={showAdvanced}
          onToggleAdvanced={() => setShowAdvanced((v) => !v)}
        />
        <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 px-3.5 py-3 text-xs text-sky-900">
          Tip: Correct section selection helps keep the balance sheet accurate and balanced.
        </div>
      </AppFormModal>
    </>
  );
}
