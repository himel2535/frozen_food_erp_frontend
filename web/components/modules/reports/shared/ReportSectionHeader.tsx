'use client';

import { Printer } from 'lucide-react';
import { RP_BTN, RP_HEADER } from '@/components/modules/reports/shared/report-print-styles';

export function ReportSectionHeader({
  icon,
  title,
  onPrint,
  printLabel,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  onPrint?: () => void;
  printLabel?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className={RP_HEADER}>
      <div className="flex items-center gap-2 min-w-0">
        {icon}
        <h3 className="text-sm font-bold text-slate-900 tracking-tight truncate">{title}</h3>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {action}
        {onPrint ? (
          <button type="button" onClick={onPrint} className={RP_BTN}>
            <Printer className="w-3.5 h-3.5" />
            {printLabel ?? 'Print'}
          </button>
        ) : null}
      </div>
    </div>
  );
}
