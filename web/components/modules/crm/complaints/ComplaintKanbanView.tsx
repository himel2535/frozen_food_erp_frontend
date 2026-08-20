'use client';

import { MoreHorizontal } from 'lucide-react';
import { IconButton } from '@/components/shared/IconButton';
import type { ComplaintRecord } from '@/lib/services/complaints-service';
import {
  categoryBadgeClass,
  categoryLabel,
  formatComplaintDateTime,
  formatDueRelative,
  priorityBadgeClass,
} from '@/components/modules/crm/complaints/complaint-display-utils';

const KANBAN_COLUMNS = [
  { key: 'open', label: 'Open', header: 'bg-blue-50 text-blue-700 border-blue-100' },
  { key: 'in-progress', label: 'In Progress', header: 'bg-amber-50 text-amber-700 border-amber-100' },
  { key: 'resolved', label: 'Resolved', header: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
] as const;

export function ComplaintKanbanView({
  rows,
  onStatusChange,
  onOpen,
}: {
  rows: ComplaintRecord[];
  onStatusChange: (id: string, status: string) => void;
  onOpen: (row: ComplaintRecord) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 min-h-[420px]">
      {KANBAN_COLUMNS.map((col) => {
        const cards = rows.filter((r) => r.status === col.key);
        return (
          <div key={col.key} className="flex flex-col min-h-0 rounded-xl border border-slate-100 bg-slate-50/50 overflow-hidden">
            <div className={`px-3 py-2 border-b text-xs font-extrabold flex items-center justify-between ${col.header}`}>
              <span>{col.label}</span>
              <span className="tabular-nums">{cards.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {cards.map((row) => {
                const opened = formatComplaintDateTime(row.openedAt);
                const due = formatDueRelative(row.slaDueAt, row.status);
                return (
                  <div
                    key={row.id}
                    className="rounded-xl border border-white bg-white p-3 shadow-sm space-y-2 cursor-pointer hover:border-blue-200 transition-colors"
                    onClick={() => onOpen(row)}
                    onKeyDown={(e) => { if (e.key === 'Enter') onOpen(row); }}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-bold text-blue-600">{row.ticketNo}</span>
                      <select
                        value={row.status}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => onStatusChange(row.id, e.target.value)}
                        className="text-[10px] font-bold border border-slate-200 rounded-lg px-1.5 py-0.5 cursor-pointer bg-white"
                      >
                        {KANBAN_COLUMNS.map((c) => (
                          <option key={c.key} value={c.key}>{c.label}</option>
                        ))}
                      </select>
                    </div>
                    <p className="text-xs font-bold text-slate-800 leading-snug">{row.subject}</p>
                    <p className="text-[10px] text-slate-500">{row.customerName}</p>
                    <div className="flex flex-wrap gap-1.5">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${categoryBadgeClass(row.category)}`}>
                        {categoryLabel(row.category)}
                      </span>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize ${priorityBadgeClass(row.priority)}`}>
                        {row.priority}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                      <span>{typeof opened === 'object' ? opened.date : opened}</span>
                      <span className={due.tone === 'danger' ? 'text-rose-600 font-bold' : due.tone === 'success' ? 'text-emerald-600 font-bold' : 'text-amber-600 font-semibold'}>
                        {due.text}
                      </span>
                    </div>
                  </div>
                );
              })}
              {cards.length === 0 ? (
                <p className="text-[11px] text-slate-400 text-center py-6">No complaints</p>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ComplaintRowActions({
  onResolve,
  onProgress,
  onDelete,
}: {
  onResolve: () => void;
  onProgress: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="relative group">
      <IconButton type="button" variant="ghost" size="sm" aria-label="Actions" title="Actions">
        <MoreHorizontal className="w-4 h-4" />
      </IconButton>
      <div className="hidden group-hover:block absolute right-0 top-full z-20 mt-1 w-40 rounded-xl border border-slate-200 bg-white shadow-lg p-1">
        <button type="button" onClick={onProgress} className="w-full text-left px-3 py-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 rounded-lg cursor-pointer">
          Mark In Progress
        </button>
        <button type="button" onClick={onResolve} className="w-full text-left px-3 py-2 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50 rounded-lg cursor-pointer">
          Mark Resolved
        </button>
        <button type="button" onClick={onDelete} className="w-full text-left px-3 py-2 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer">
          Delete
        </button>
      </div>
    </div>
  );
}
