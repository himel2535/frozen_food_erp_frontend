'use client';

import type { FollowUpPageTab } from '../customer-due-types';
import { FU_TAB_ACTIVE, FU_TAB_INACTIVE } from './follow-up-styles';

export function FollowUpTabBar({
  activeTab,
  onTabChange,
  counts,
}: {
  activeTab: FollowUpPageTab;
  onTabChange: (tab: FollowUpPageTab) => void;
  counts: { invoices: number; payments: number; notes: number; documents: number };
}) {
  const tabs: { id: FollowUpPageTab; label: string }[] = [
    { id: 'timeline', label: 'Timeline' },
    { id: 'followups', label: 'Follow-ups' },
    { id: 'invoices', label: `Invoices (${counts.invoices})` },
    { id: 'payments', label: `Payments (${counts.payments})` },
    { id: 'notes', label: `Notes (${counts.notes})` },
    { id: 'documents', label: `Documents (${counts.documents})` },
  ];

  return (
    <div className="flex border-b border-slate-200 overflow-x-auto gap-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`px-3 pb-2.5 pt-1 text-xs whitespace-nowrap cursor-pointer ${activeTab === tab.id ? FU_TAB_ACTIVE : FU_TAB_INACTIVE}`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
