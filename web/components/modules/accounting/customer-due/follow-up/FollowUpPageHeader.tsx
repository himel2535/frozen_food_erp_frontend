'use client';

import Link from 'next/link';
import { ArrowLeft, Plus } from 'lucide-react';
import {
  FU_BREADCRUMB_CLS,
  FU_BTN_OUTLINE,
  FU_BTN_PRIMARY,
  FU_PAGE_SUBTITLE_CLS,
  FU_PAGE_TITLE_CLS,
} from './follow-up-styles';

export function FollowUpPageHeader({
  onAddFollowUp,
  listHref = '/accounting/receivables',
  isAddForm = false,
}: {
  onAddFollowUp: () => void;
  listHref?: string;
  isAddForm?: boolean;
}) {
  return (
    <div className="space-y-3">
      <nav className={FU_BREADCRUMB_CLS}>
        <Link href={listHref} className="hover:text-blue-600 cursor-pointer">Customer Due (Cash)</Link>
        <span>/</span>
        <Link href={listHref} className="hover:text-blue-600 cursor-pointer">Follow-up / Activity</Link>
        {isAddForm && (
          <>
            <span>/</span>
            <span className="text-slate-700">Add Follow-up</span>
          </>
        )}
      </nav>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className={FU_PAGE_TITLE_CLS}>{isAddForm ? 'Add Follow-up' : 'Follow-up / Activity'}</h1>
          <p className={FU_PAGE_SUBTITLE_CLS}>
            {isAddForm
              ? 'Record communication and follow-up with customer.'
              : 'Track all communication and follow-ups with customer.'}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link href={listHref} className={FU_BTN_OUTLINE}>
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to List
          </Link>
          <button type="button" className={FU_BTN_PRIMARY} onClick={onAddFollowUp}>
            <Plus className="w-3.5 h-3.5" />
            Add Follow-up
          </button>
        </div>
      </div>
    </div>
  );
}
