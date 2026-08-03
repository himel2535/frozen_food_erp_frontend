'use client';

import { FU_FORM_SECTION_CLS, FU_SECTION_NUM_CLS } from './follow-up-styles';

export function FollowUpFormSection({
  number,
  title,
  subtitle,
  children,
}: {
  number: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`${FU_FORM_SECTION_CLS} overflow-hidden p-0`}>
      <div className="flex items-start gap-3 bg-blue-50/80 border-b border-blue-100 px-5 py-3">
        <span className={FU_SECTION_NUM_CLS}>{number}</span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-extrabold text-slate-900">{title}</h3>
          {subtitle && <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="space-y-4 p-5">{children}</div>
    </section>
  );
}
