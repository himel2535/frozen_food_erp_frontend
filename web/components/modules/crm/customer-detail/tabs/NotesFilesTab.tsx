'use client';

import { FileText, Paperclip } from 'lucide-react';
import { RecentNotesPanel } from '@/components/modules/crm/customer-detail/RecentNotesPanel';
import {
  CD_BODY,
  CD_CAPTION,
  CD_CARD,
  CD_SECTION_HEADER,
  CD_TITLE,
} from '@/components/modules/crm/customer-detail/customer-detail-styles';
import { formatDetailDate, formatFileSize } from '@/components/modules/crm/customer-detail/customer-detail-utils';

type NotesFilesTabProps = {
  customerId: string;
  customer: Record<string, unknown>;
  communications: Array<Record<string, unknown>>;
  attachments: Array<Record<string, unknown>>;
};

export function NotesFilesTab({ customerId, customer, communications, attachments }: NotesFilesTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div className={CD_CARD}>
        <RecentNotesPanel
          customerId={customerId}
          communications={communications}
          customerNotes={String(customer.notes ?? '')}
          limit={20}
        />
      </div>

      <div className={CD_CARD}>
        <div className={CD_SECTION_HEADER}>
          <Paperclip className="w-4 h-4 text-blue-500" />
          <h3 className={CD_TITLE}>Files</h3>
        </div>
        {attachments.length ? (
          <ul className="space-y-3">
            {attachments.map((file) => (
              <li key={String(file.id)} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                <FileText className="w-5 h-5 text-rose-500 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className={`${CD_BODY} truncate`}>{String(file.name ?? file.filename ?? file.id)}</p>
                  <p className={CD_CAPTION}>
                    {formatFileSize(file.size)} · {formatDetailDate(file.uploadedAt)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className={CD_CAPTION}>No files attached.</p>
        )}
      </div>
    </div>
  );
}
