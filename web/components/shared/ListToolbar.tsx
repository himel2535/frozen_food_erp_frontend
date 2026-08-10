'use client';

import { Plus, Download } from 'lucide-react';
import { ModuleFilterBar } from '@/components/shared/ModuleFilterBar';
import { useAppStore } from '@/lib/state/app-store';
import { MODULE_SECONDARY_BTN } from '@/lib/ui/module-chrome-styles';

interface ModuleToolbarActionsProps {
  onAdd?: () => void;
  addLabel?: string;
  onExport?: () => void;
}

export function ModuleToolbarActions({ onAdd, addLabel, onExport }: ModuleToolbarActionsProps) {
  const t = useAppStore((s) => s.t);
  const resolvedAddLabel = addLabel ?? t('common.add');

  if (!onAdd && !onExport) return null;

  return (
    <>
      {onExport && (
        <button type="button" onClick={onExport} className={MODULE_SECONDARY_BTN}>
          <Download className="w-4 h-4" /> {t('common.export_label')}
        </button>
      )}
      {onAdd && (
        <button
          type="button"
          onClick={onAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> {resolvedAddLabel}
        </button>
      )}
    </>
  );
}

interface ListToolbarProps {
  search: string;
  onSearchChange: (v: string) => void;
  searchPlaceholder?: string;
  filters?: React.ReactNode;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
}

export function ListToolbar({
  search,
  onSearchChange,
  searchPlaceholder,
  filters,
  actions,
  footer,
}: ListToolbarProps) {
  return (
    <ModuleFilterBar
      search={search}
      onSearchChange={onSearchChange}
      searchPlaceholder={searchPlaceholder}
      filters={filters}
      actions={actions}
      footer={footer}
    />
  );
}

export { ModuleFilterBar } from '@/components/shared/ModuleFilterBar';
