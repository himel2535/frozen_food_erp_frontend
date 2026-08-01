'use client';

import type { ReactNode } from 'react';

export function InvoiceFormSectionCard({
  title,
  icon,
  headerAction,
  children,
  className = '',
}: {
  title: string;
  icon?: ReactNode;
  headerAction?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`premium-card premium-shadow p-4 md:p-5 space-y-3 overflow-hidden min-h-0 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {icon ? <span className="text-blue-600 shrink-0">{icon}</span> : null}
          <h4 className="text-sm font-extrabold text-slate-900 tracking-tight">{title}</h4>
        </div>
        {headerAction}
      </div>
      {children}
    </section>
  );
}
