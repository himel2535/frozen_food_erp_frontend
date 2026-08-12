'use client';

import { toast } from '@/lib/ui/feedback';

import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { Footer } from '@/components/layout/Footer';
import { useRegisterModuleActions } from '@/components/layout/ModuleActionsContext';
import { AppFormFields, AppFormModal } from '@/components/shared/AppForm';
import { useAppStore } from '@/lib/state/app-store';
import { usePaginatedApiResource } from '@/hooks/use-paginated-api-resource';
import { useProfitLossSummary } from '@/hooks/use-accounting-summary';
import { mapGenericApiRow, mapGenericPayloadToApi } from '@/lib/services/generic-api-mapper';
import { ApiModeBanner } from '@/components/shared/ApiModeBanner';
import { isModuleApiMode } from '@/lib/config/data-source';
import type { PortField } from '@/lib/modules/port-types';
import {
  buildProfitLossDisplayRows,
  createProfitLossLine,
  getProfitLossMetrics,
  listProfitLossLines,
  updateProfitLossLine,
  type ProfitLossLine,
  type ProfitLossSection,
} from '@/lib/services/profit-loss-service';
import { ProfitLossMetrics } from './profit-loss/ProfitLossMetrics';
import { ProfitLossPeriodBar } from './profit-loss/ProfitLossPeriodBar';
import { ProfitLossTable } from './profit-loss/ProfitLossTable';
import { ProfitLossFooterBar } from './profit-loss/ProfitLossFooterBar';
import {
  ADD_LINE_FIELDS,
  SECTION_LABEL_TO_VALUE,
  SECTION_VALUE_TO_LABEL,
} from './profit-loss/profit-loss-options';
import {
  DEFAULT_PL_PERIOD,
  EMPTY_PL_FORM,
  type ProfitLossFormState,
} from './profit-loss/profit-loss-types';

const FORM_FIELDS: PortField[] = ADD_LINE_FIELDS.map((f) => ({ ...f }));

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

function lineToForm(line: ProfitLossLine): ProfitLossFormState {
  return {
    lineItem: line.lineItem,
    category: line.category,
    section: SECTION_VALUE_TO_LABEL[line.section],
    amount: String(line.amount),
    notes: line.notes ?? '',
  };
}

function formToPayload(form: ProfitLossFormState) {
  return {
    lineItem: form.lineItem,
    category: form.category,
    section: (SECTION_LABEL_TO_VALUE[form.section] ?? 'operating') as ProfitLossSection,
    amount: Number(form.amount || 0),
    notes: form.notes,
  };
}

export function ProfitLossPage() {
  const appState = useAppStore((s) => s.appState);
  const saveAppState = useAppStore((s) => s.saveAppState);
  const apiMode = isModuleApiMode('profitLoss');
  const apiStore = usePaginatedApiResource('profitLoss', mapGenericApiRow, { pageSize: 500 });
  const summaryApi = useProfitLossSummary(apiMode);

  const [period, setPeriod] = useState(DEFAULT_PL_PERIOD);
  const [generatedAt, setGeneratedAt] = useState(() => formatGeneratedAt(new Date()));

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [form, setForm] = useState<ProfitLossFormState>(EMPTY_PL_FORM);

  const lines = useMemo(() => {
    if (apiMode && apiStore.initialized) {
      return listProfitLossLines({ profitLoss: apiStore.rows } as import('@/lib/state/types').AppState);
    }
    return listProfitLossLines(appState);
  }, [apiMode, apiStore.initialized, apiStore.rows, appState]);
  const metrics = useMemo(() => {
    if (apiMode && summaryApi.summary) return summaryApi.summary;
    return getProfitLossMetrics(lines);
  }, [apiMode, summaryApi.summary, lines]);
  const displayRows = useMemo(() => buildProfitLossDisplayRows(lines), [lines]);

  const formFields = useMemo<PortField[]>(() => FORM_FIELDS.map((field) => {
    if (field.key === 'section') {
      return { ...field, options: Object.keys(SECTION_LABEL_TO_VALUE) };
    }
    return field;
  }), []);

  const openAdd = (preset?: Partial<ProfitLossFormState>) => {
    setEditingId(null);
    setForm({ ...EMPTY_PL_FORM, ...preset });
    setShowModal(true);
  };

  const openEdit = (sourceId: string) => {
    const line = lines.find((l) => l.id === sourceId);
    if (!line) return;
    setEditingId(sourceId);
    setForm(lineToForm(line));
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.lineItem.trim()) return;
    const payload = formToPayload(form);
    if (apiMode) {
      const result = editingId
        ? await apiStore.update(editingId, mapGenericPayloadToApi(payload))
        : await apiStore.create(mapGenericPayloadToApi(payload));
      if (!result.ok) {
        toast.error('Operation failed', { module: 'Profit & Loss', description: 'error' in result ? String(result.error) : 'Failed to save line' });
        return;
      }
      toast.success('Saved', { module: 'Profit & Loss', description: editingId ? 'Line updated.' : 'Line added.' });
      setShowModal(false);
      setEditingId(null);
      setForm(EMPTY_PL_FORM);
      setGeneratedAt(formatGeneratedAt(new Date()));
      void summaryApi.reload();
      return;
    }
    const result = editingId
      ? updateProfitLossLine(appState, editingId, payload)
      : createProfitLossLine(appState, payload);
    if (!result.ok) {
      toast.error('Operation failed', { module: 'Profit & Loss', description: 'error' in result ? String(result.error) : 'Failed to save line' });
      return;
    }
    saveAppState();
    setShowModal(false);
    setEditingId(null);
    setForm(EMPTY_PL_FORM);
    setGeneratedAt(formatGeneratedAt(new Date()));
  };

  useRegisterModuleActions(
    <button
      type="button"
      onClick={() => openAdd()}
      className="inline-flex items-center gap-2 self-start xl:self-auto bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
    >
      <Plus className="w-4 h-4" />
      Add Line
    </button>,
    [openAdd],
  );

  return (
    <>
        {apiStore.error ? <ApiModeBanner module="profitLoss" error={apiStore.error} /> : null}
        <ProfitLossMetrics metrics={metrics} />

        <ProfitLossPeriodBar
          period={period}
          onPeriodChange={setPeriod}
          onExport={() => toast.info('Feature coming soon', { module: 'Profit & Loss', description: "Export coming soon." })}
        />

        <div className="space-y-3 min-w-0">
          <ProfitLossTable rows={displayRows} onEdit={openEdit} />
          <ProfitLossFooterBar generatedAt={generatedAt} />
        </div>

        <Footer />

      <AppFormModal
        open={showModal}
        title={editingId ? 'Edit P&L Line' : 'Add P&L Line'}
        subtitle="Add or update a profit and loss statement line."
        onClose={() => { setShowModal(false); setEditingId(null); }}
        onSubmit={handleSubmit}
        submitLabel={editingId ? 'Save Changes' : 'Add Line'}
      >
        <AppFormFields
          fields={formFields}
          values={form as unknown as Record<string, string>}
          onChange={(key, value) => setForm((prev) => ({ ...prev, [key]: value }))}
          showAdvanced={showAdvanced}
          onToggleAdvanced={() => setShowAdvanced((v) => !v)}
        />
      </AppFormModal>
    </>
  );
}
