'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Icon } from '@iconify/react';
import { getPageIcon, getPageIconBoxClass } from '@/lib/ui/page-icons';

export interface PageHeaderProps {
  title: ReactNode;
  subtitle?: string;
  icon?: string;
  iconBoxClass?: string;
  actions?: ReactNode;
  /** compact = text-lg (Suppliers-style); default = text-xl (ListToolbar-style) */
  size?: 'default' | 'compact';
  className?: string;
  layout?: 'split' | 'title-only';
}

export function PageHeader({
  title,
  subtitle,
  icon,
  iconBoxClass,
  actions,
  size = 'default',
  className = '',
  layout = 'split',
}: PageHeaderProps) {
  const pathname = usePathname();
  const resolvedIcon = icon ?? getPageIcon(pathname);
  const resolvedBoxClass = iconBoxClass ?? getPageIconBoxClass(pathname);

  const titleClass =
    size === 'compact'
      ? 'text-lg font-bold text-slate-900'
      : 'text-xl font-extrabold text-slate-900 tracking-tight';
  const subtitleClass =
    size === 'compact'
      ? 'text-xs text-slate-500 mt-0.5'
      : 'text-xs text-slate-500 mt-1 font-medium';

  const titleBlock = (
    <div className="flex items-start gap-3 min-w-0">
      {resolvedIcon ? (
        <span
          className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl shrink-0 ${resolvedBoxClass}`}
        >
          <Icon icon={resolvedIcon} width={28} height={28} />
        </span>
      ) : null}
      <div className="min-w-0">
        <h2 className={titleClass}>{title}</h2>
        {subtitle ? <p className={subtitleClass}>{subtitle}</p> : null}
      </div>
    </div>
  );

  if (layout === 'title-only') {
    return <div className={className}>{titleBlock}</div>;
  }

  return (
    <div
      className={`flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 ${className}`.trim()}
    >
      {titleBlock}
      {actions ? (
        <div className="flex flex-wrap items-center gap-2 self-start xl:self-center shrink-0">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
