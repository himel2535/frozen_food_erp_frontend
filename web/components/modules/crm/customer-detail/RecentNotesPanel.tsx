'use client';

import { useMemo, useState } from 'react';
import { ArrowRight, MessageSquare, Plus } from 'lucide-react';
import {
  CD_BODY,
  CD_CAPTION,
  CD_TITLE,
} from '@/components/modules/crm/customer-detail/customer-detail-styles';
import { formatDetailDate } from '@/components/modules/crm/customer-detail/customer-detail-utils';
import { Button } from '@/components/shared/Button';
import { useAppStore } from '@/lib/state/app-store';
import { createCommunication } from '@/lib/services/crm-service';
import { FORM_TEXTAREA_CLS } from '@/lib/ui/form-styles';

type NoteItem = {
  id: string;
  note: string;
  author: string;
  date: unknown;
};

type RecentNotesPanelProps = {
  customerId: string;
  communications: Array<Record<string, unknown>>;
  customerNotes?: string;
  limit?: number;
  showViewAll?: boolean;
  onViewAllNotes?: () => void;
};

function buildNotesList(
  communications: Array<Record<string, unknown>>,
  customerNotes?: string,
  customerUpdatedAt?: unknown,
): NoteItem[] {
  const items: NoteItem[] = communications.map((c) => ({
    id: String(c.id),
    note: String(c.summary ?? c.subject ?? c.body ?? ''),
    author: String(c.actorName ?? c.createdBy ?? 'Team'),
    date: c.timestamp,
  }));

  if (customerNotes?.trim()) {
    items.push({
      id: 'customer-notes',
      note: customerNotes.trim(),
      author: 'System',
      date: customerUpdatedAt,
    });
  }

  return items.sort((a, b) => String(b.date ?? '').localeCompare(String(a.date ?? '')));
}

export function RecentNotesPanel({
  customerId,
  communications,
  customerNotes,
  limit = 5,
  showViewAll = false,
  onViewAllNotes,
}: RecentNotesPanelProps) {
  const appState = useAppStore((s) => s.appState);
  const saveAppState = useAppStore((s) => s.saveAppState);
  const [showForm, setShowForm] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [error, setError] = useState('');

  const allNotes = useMemo(
    () => buildNotesList(communications, customerNotes),
    [communications, customerNotes],
  );

  const notes = useMemo(() => allNotes.slice(0, limit), [allNotes, limit]);

  const handleSave = () => {
    const trimmed = noteText.trim();
    if (!trimmed) {
      setError('Please enter a note before saving.');
      return;
    }
    createCommunication(appState, {
      entityType: 'customer',
      entityId: customerId,
      channel: 'note',
      direction: 'internal',
      subject: 'Customer note',
      summary: trimmed,
    });
    saveAppState();
    setNoteText('');
    setError('');
    setShowForm(false);
  };

  const handleCancel = () => {
    setNoteText('');
    setError('');
    setShowForm(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-blue-500" />
          <h3 className={CD_TITLE}>Recent Notes</h3>
        </div>
        {!showForm ? (
          <Button
            type="button"
            onClick={() => setShowForm(true)}
            variant="ghost"
            className="text-blue-600 hover:text-blue-700 font-bold"
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Note
          </Button>
        ) : null}
      </div>

      {showForm ? (
        <div className="space-y-3 rounded-xl border border-blue-100 bg-blue-50/40 p-4">
          <textarea
            value={noteText}
            onChange={(e) => {
              setNoteText(e.target.value);
              if (error) setError('');
            }}
            rows={3}
            placeholder="Write a note about this customer..."
            className={FORM_TEXTAREA_CLS}
            autoFocus
          />
          {error ? <p className="text-xs font-semibold text-rose-600">{error}</p> : null}
          <div className="flex justify-end gap-2">
            <Button type="button" onClick={handleCancel} variant="outline">
              Cancel
            </Button>
            <Button type="button" onClick={handleSave} variant="primary">
              Save Note
            </Button>
          </div>
        </div>
      ) : null}

      {notes.length ? (
        <ul className="space-y-2">
          {notes.map((n) => (
            <li
              key={n.id}
              className="border-l-4 border-blue-400 bg-slate-50/70 rounded-r-xl pl-3 py-2"
            >
              <p className={`${CD_BODY} text-slate-700 font-medium`}>{n.note}</p>
              <p className={`${CD_CAPTION} mt-1`}>
                By {n.author} · {formatDetailDate(n.date)}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className={CD_CAPTION}>No notes yet.</p>
      )}

      {showViewAll && onViewAllNotes && allNotes.length > limit ? (
        <button
          type="button"
          onClick={onViewAllNotes}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
        >
          View All Notes
          <ArrowRight className="w-4 h-4" />
        </button>
      ) : null}
    </div>
  );
}
