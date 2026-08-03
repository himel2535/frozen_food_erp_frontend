'use client';

import { toast } from '@/lib/ui/feedback';

import { CloudUpload, FilePlus, Send, StickyNote } from 'lucide-react';
import { FU_CARD_CLS, FU_WIDGET_TITLE_CLS } from './follow-up-styles';

const ACTIONS = [
  { label: 'Send Reminder', icon: Send },
  { label: 'Add Note', icon: StickyNote },
  { label: 'Upload Document', icon: CloudUpload },
  { label: 'Create Invoice', icon: FilePlus },
];

export function FollowUpQuickActions() {
  return (
    <div className={`${FU_CARD_CLS} p-4 space-y-3`}>
      <p className={FU_WIDGET_TITLE_CLS}>Quick Actions</p>
      <div className="grid grid-cols-4 gap-2">
        {ACTIONS.map(({ label, icon: Icon }) => (
          <button
            key={label}
            type="button"
            className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50/80 p-3 hover:bg-slate-100 cursor-pointer"
            onClick={() => toast.info('Feature coming soon', { module: 'Customer Due', description: `${label} coming soon.` })}
          >
            <Icon className="w-4 h-4 text-blue-600" />
            <span className="text-[9px] font-bold text-slate-600 text-center leading-tight">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
