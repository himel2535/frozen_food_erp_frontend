'use client';

import { Plus, Search, Download } from 'lucide-react';
import { useAppStore } from '@/lib/state/app-store';
import { PageHeader } from '@/components/shared/PageHeader';

interface ListToolbarProps {
  title: string;
  subtitle: string;
  search: string;
  onSearchChange: (v: string) => void;
  searchPlaceholder?: string;
  onAdd?: () => void;
  addLabel?: string;
  onExport?: () => void;
  filters?: React.ReactNode;
  icon?: string;
}

export function ListToolbar({
  title,
  subtitle,
  search,
  onSearchChange,
  searchPlaceholder,
  onAdd,
  addLabel,
  onExport,
  filters,
  icon,
}: ListToolbarProps) {
  const t = useAppStore((s) => s.t);
  const resolvedSearchPlaceholder = searchPlaceholder ?? `${t('common.search')}...`;
  const resolvedAddLabel = addLabel ?? t('common.add');

  const actionButtons = (
    <>
      {onExport && (
        <button
          type="button"
          onClick={onExport}
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer"
        >
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

  return (
    <>
      <PageHeader
        title={title}
        subtitle={subtitle}
        icon={icon}
        actions={onExport || onAdd ? actionButtons : undefined}
      />
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 premium-shadow space-y-4">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
          <div className="relative min-w-[240px] flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={resolvedSearchPlaceholder}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 font-medium"
            />
          </div>
          {filters}
        </div>
      </div>
    </>
  );
}
