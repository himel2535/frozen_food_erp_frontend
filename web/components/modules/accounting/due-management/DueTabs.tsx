'use client';

import { DUE_MAIN_TABS } from './due-options';
import { DUE_TAB_ACTIVE, DUE_TAB_INACTIVE } from './due-styles';
import type { DueTab } from './due-types';

export function DueTabs({ active, onChange }: { active: DueTab; onChange: (tab: DueTab) => void }) {
  return (
    <div className="flex border-b border-slate-200 px-3 pt-2">
      {DUE_MAIN_TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`px-4 pb-2.5 text-sm ${active === tab.id ? DUE_TAB_ACTIVE : DUE_TAB_INACTIVE}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
