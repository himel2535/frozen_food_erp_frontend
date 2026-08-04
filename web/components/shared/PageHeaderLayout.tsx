'use client';

import type { ReactNode } from 'react';

export interface PageHeaderLayoutProps {
  icon?: ReactNode;
  title: ReactNode;
  subtitle?: string;
  size?: 'default' | 'compact';
  className?: string;
}

export function PageHeaderLayout({
  icon,
  title,
  subtitle,
  size = 'compact',
  className = '',
}: PageHeaderLayoutProps) {
  const titleClass =
    size === 'compact'
      ? 'text-lg font-bold text-slate-900 leading-tight'
      : 'text-xl font-extrabold text-slate-900 tracking-tight leading-tight';
  const subtitleClass =
    size === 'compact'
      ? 'text-xs text-slate-500 mt-0.5 leading-snug min-h-[16px]'
      : 'text-xs text-slate-500 mt-1 font-medium leading-snug min-h-[16px]';

  return (
    <div className={`flex items-start gap-3 min-w-0 ${className}`.trim()}>
      <span className="inline-flex w-8 h-8 shrink-0 items-center justify-center">
        {icon ?? null}
      </span>
      <div className="min-h-[44px] min-w-0 flex-1">
        <h2 className={titleClass}>{title}</h2>
        <p className={subtitleClass}>{subtitle ?? '\u00A0'}</p>
      </div>
    </div>
  );
}
