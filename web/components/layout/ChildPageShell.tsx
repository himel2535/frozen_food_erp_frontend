'use client';

import type { ReactNode } from 'react';
import { FormHeader } from '@/components/layout/FormHeader';
import { MODULE_LIST_SHELL } from '@/lib/ui/module-layout';

type ChildPageShellProps = {
  title: string;
  subtitle?: string;
  onBack: () => void;
  backLabel?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function ChildPageShell({
  title,
  subtitle,
  onBack,
  backLabel,
  actions,
  children,
}: ChildPageShellProps) {
  return (
    <div className={MODULE_LIST_SHELL}>
      <div className="pt-3 md:pt-4 mb-3 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-2">
        <FormHeader compact title={title} subtitle={subtitle} onBack={onBack} backLabel={backLabel} />
        {actions ? <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div> : null}
      </div>
      <div className="space-y-4 flex flex-col pb-4">{children}</div>
    </div>
  );
}
