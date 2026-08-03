'use client';

import {
  BookOpen,
  Clock,
  CreditCard,
  FileText,
  FolderOpen,
  LayoutGrid,
  Package,
  RotateCcw,
  ShoppingCart,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { SD_TAB_ACTIVE, SD_TAB_BAR, SD_TAB_INACTIVE } from './supplier-detail-styles';

export type SupplierDetailTabId =
  | 'overview'
  | 'ledger'
  | 'purchases'
  | 'bills'
  | 'payments'
  | 'returns'
  | 'items'
  | 'documents'
  | 'activity';

const TABS: { id: SupplierDetailTabId; label: string; icon: LucideIcon }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'ledger', label: 'Ledger', icon: BookOpen },
  { id: 'purchases', label: 'Purchases', icon: ShoppingCart },
  { id: 'bills', label: 'Bills', icon: FileText },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'returns', label: 'Returns', icon: RotateCcw },
  { id: 'items', label: 'Items', icon: Package },
  { id: 'documents', label: 'Documents', icon: FolderOpen },
  { id: 'activity', label: 'Activity', icon: Clock },
];

export function SupplierDetailTabs({
  active,
  onChange,
}: {
  active: SupplierDetailTabId;
  onChange: (tab: SupplierDetailTabId) => void;
}) {
  return (
    <div className={SD_TAB_BAR}>
      <div className="flex gap-1 min-w-max border-b border-slate-200/80">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-2.5 text-xs whitespace-nowrap cursor-pointer transition-colors rounded-t-lg -mb-px ${
                isActive ? SD_TAB_ACTIVE : SD_TAB_INACTIVE
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
