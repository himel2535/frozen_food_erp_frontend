'use client';

import type { ReactNode } from 'react';
import { Search } from 'lucide-react';
import { useAppStore } from '@/lib/state/app-store';
import { MODULE_FILTER_BAR, MODULE_FILTER_SEARCH } from '@/lib/ui/module-chrome-styles';

export interface ModuleFilterBarProps {
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  /** @deprecated Put tabs and controls in `filters` so search + filters stay on one line. */
  leading?: ReactNode;
  filters?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function ModuleFilterBar({
  search,
  onSearchChange,
  searchPlaceholder,
  leading,
  filters,
  actions,
  footer,
  children,
  className = '',
}: ModuleFilterBarProps) {
  const t = useAppStore((s) => s.t);
  const hasSearch = search !== undefined && onSearchChange !== undefined;
  const resolvedPlaceholder = searchPlaceholder ?? `${t('common.search')}...`;
  const hasFilters = Boolean(leading || filters || actions);

  return (
    <div className={`${MODULE_FILTER_BAR} ${className}`.trim()}>
      {children ?? (
        (hasSearch || hasFilters) && (
          <div className="flex flex-nowrap items-center gap-2 min-w-0">
            {hasSearch ? (
              <div className="relative flex-1 min-w-[160px] max-w-md shrink">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder={resolvedPlaceholder}
                  className={MODULE_FILTER_SEARCH}
                />
              </div>
            ) : null}
            {hasFilters ? (
              <div className="flex flex-nowrap items-center gap-2 shrink-0 ml-auto overflow-x-auto max-w-full [scrollbar-width:thin]">
                {leading}
                {filters}
                {actions}
              </div>
            ) : null}
          </div>
        )
      )}
      {footer}
    </div>
  );
}
