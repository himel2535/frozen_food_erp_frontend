'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

const TOGGLE_BASE =
  'h-8 w-6 rounded-r-xl rounded-l-none bg-white/40 hover:bg-white/80 backdrop-blur-2xl text-slate-800 shadow-[0_4px_12px_rgba(0,0,0,0.06)] border border-l-0 border-white/80 flex items-center justify-center transition-all duration-200 cursor-pointer group focus:outline-none';

interface SidebarCollapseToggleProps {
  expanded: boolean;
  onClick: () => void;
  variant: 'edge' | 'inline';
  title?: string;
  'aria-label'?: string;
  'aria-expanded'?: boolean;
}

export function SidebarCollapseToggle({
  expanded,
  onClick,
  variant,
  title,
  'aria-label': ariaLabel,
  'aria-expanded': ariaExpanded,
}: SidebarCollapseToggleProps) {
  const resolvedTitle = title ?? (expanded ? 'Collapse sidebar' : 'Expand sidebar');

  if (variant === 'edge') {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`hidden md:flex absolute -right-6 top-4 z-50 ${TOGGLE_BASE} hover:w-7`}
        title={resolvedTitle}
        aria-label={ariaLabel ?? resolvedTitle}
        aria-expanded={ariaExpanded}
      >
        {expanded ? (
          <ChevronLeft className="w-4 h-4 text-slate-800 transition-transform duration-200 group-hover:scale-110" />
        ) : (
          <ChevronRight className="w-4 h-4 text-slate-800 transition-transform duration-200 group-hover:scale-110" />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`md:hidden shrink-0 ${TOGGLE_BASE} rounded-xl border border-white/80 hover:w-7`}
      title={resolvedTitle}
      aria-label={ariaLabel ?? resolvedTitle}
      aria-expanded={ariaExpanded}
    >
      {expanded ? (
        <ChevronLeft className="w-4 h-4 text-slate-800 transition-transform duration-200 group-hover:scale-110" />
      ) : (
        <ChevronRight className="w-4 h-4 text-slate-800 transition-transform duration-200 group-hover:scale-110" />
      )}
    </button>
  );
}
