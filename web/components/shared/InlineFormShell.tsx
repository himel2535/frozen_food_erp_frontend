'use client';

import type { FormEvent, ReactNode } from 'react';
import { FormHeader } from '@/components/layout/FormHeader';

interface InlineFormShellProps {
  title: string;
  subtitle?: string;
  titleId?: string;
  onBack: () => void;
  onSubmit: (e: FormEvent) => void;
  children: ReactNode;
  footer?: ReactNode;
}

export function InlineFormShell({
  title,
  subtitle,
  titleId,
  onBack,
  onSubmit,
  children,
  footer,
}: InlineFormShellProps) {
  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 bg-slate-50">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        <FormHeader title={title} subtitle={subtitle} titleId={titleId} onBack={onBack} />
        <form onSubmit={onSubmit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
          {children}
          {footer}
        </form>
      </div>
    </div>
  );
}
