'use client';

import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import {
  CF_ADDRESS_ICON_BADGE_CLS,
  CF_ADDRESS_PANEL_HEADER_CLS,
  CF_SUB_PANEL_CLS,
} from '@/components/modules/crm/customer-form/customer-form-styles';

export function CustomerFormSubPanel({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <div className={CF_SUB_PANEL_CLS}>
      <div className={`${CF_ADDRESS_PANEL_HEADER_CLS} mb-3`}>
        <span className={CF_ADDRESS_ICON_BADGE_CLS}>
          <Icon className="w-4 h-4" />
        </span>
        <span className="text-xs font-extrabold text-slate-900 tracking-tight">{title}</span>
      </div>
      {children}
    </div>
  );
}
