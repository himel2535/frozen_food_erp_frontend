'use client';

import type { ReactNode } from 'react';
import { DC_SECTION_BADGE_CLS } from '@/components/modules/sales/delivery-challan-form/dc-form-styles';

export function DcFormSectionCard({
  number,
  title,
  subtitle,
  children,
  className = '',
}: {
  number: number;
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`premium-card premium-shadow p-4 md:p-5 space-y-3 overflow-hidden min-h-0 ${className}`}>
      <div className="flex items-start gap-3">
        <span className={DC_SECTION_BADGE_CLS}>{number}</span>
        <div className="min-w-0">
          <h4 className="text-sm font-extrabold text-slate-900 tracking-tight">{title}</h4>
          {subtitle ? (
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">{subtitle}</p>
          ) : null}
        </div>
      </div>
      {children}
    </section>
  );
}
