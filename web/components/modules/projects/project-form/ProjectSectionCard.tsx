'use client';

import type { ReactNode } from 'react';
import { PJ_CARD_CLS, PJ_SECTION_BADGE_CLS } from '@/components/modules/projects/project-form/project-form-styles';

export function ProjectSectionCard({
  letter,
  title,
  subtitle,
  children,
  action,
}: {
  letter: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className={PJ_CARD_CLS}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <span className={PJ_SECTION_BADGE_CLS}>{letter}</span>
          <div className="min-w-0">
            <h4 className="text-sm font-extrabold text-slate-900 tracking-tight">{title}</h4>
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">{subtitle}</p>
          </div>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}
