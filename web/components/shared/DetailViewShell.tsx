'use client';

import { FormHeader } from '@/components/layout/FormHeader';

interface DetailViewShellProps {
  title: string;
  subtitle?: string;
  onBack: () => void;
  backLabel?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export function DetailViewShell({ title, subtitle, onBack, backLabel, children, actions }: DetailViewShellProps) {
  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 bg-slate-50">
      <div className="max-w-5xl mx-auto w-full space-y-6">
        <div className="flex items-start justify-between gap-4">
          <FormHeader title={title} subtitle={subtitle} onBack={onBack} backLabel={backLabel} />
          {actions}
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6 premium-shadow space-y-6">{children}</div>
      </div>
    </div>
  );
}
