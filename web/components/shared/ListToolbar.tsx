'use client';

import { Plus, Download } from 'lucide-react';
import { ModuleFilterBar } from '@/components/shared/ModuleFilterBar';
import { useAppStore } from '@/lib/state/app-store';
import { Button } from '@/components/shared/Button';

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
        <Button
          type="button"
          onClick={onExport}
          variant="outline"
          leftIcon={<Download className="w-4 h-4" />}
        >
          {t('common.export_label')}
        </Button>
      )}
      {onAdd && (
        <Button
          type="button"
          onClick={onAdd}
          variant="primary"
          leftIcon={<Plus className="w-4 h-4" />}
        >
          {resolvedAddLabel}
        </Button>
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
