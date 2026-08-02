'use client';

import { useMemo } from 'react';
import {
  Calendar,
  FileText,
  Mail,
  MessageCircle,
  MoreHorizontal,
  Phone,
  UserRound,
} from 'lucide-react';
import { StatusBadge } from '@/components/shared/StatusBadge';
import {
  formatLeadCurrency,
  formatLeadDateTime,
  leadAvatarClass,
  leadInitials,
  leadStageLabel,
  priorityLabel,
  priorityTagClass,
} from './lead-display-utils';

type LeadRow = Record<string, unknown>;
type Activity = Record<string, unknown>;
type DetailTab = 'activity' | 'details' | 'notes' | 'files';

const PANEL_SHELL = 'rounded-xl border border-slate-200 bg-white min-h-[580px] h-full flex flex-col overflow-hidden';

const DETAIL_TABS: { id: DetailTab; label: string }[] = [
  { id: 'activity', label: 'Activity' },
  { id: 'details', label: 'Details' },
  { id: 'notes', label: 'Notes' },
  { id: 'files', label: 'Files' },
];

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 text-xs py-1.5 border-b border-slate-50 last:border-0">
      <span className="text-slate-500 font-semibold shrink-0">{label}</span>
      <span className="text-slate-800 font-bold text-right">{value || '—'}</span>
    </div>
  );
}

export function LeadDetailPanel({
  lead,
  activities,
  detailTab,
  onDetailTabChange,
  onEdit,
  onConvert,
  onMarkLost,
}: {
  lead: LeadRow | null;
  activities: Activity[];
  detailTab: DetailTab;
  onDetailTabChange: (tab: DetailTab) => void;
  onEdit: () => void;
  onConvert: () => void;
  onMarkLost: () => void;
}) {
  const timeline = useMemo(() => activities.slice(0, 8), [activities]);

  if (!lead) {
    return (
      <aside className={PANEL_SHELL}>
        <div className="flex flex-col items-center justify-center text-center py-8 flex-1 px-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3">
            <UserRound className="w-7 h-7" />
          </span>
          <h3 className="font-extrabold text-slate-900">Select a lead</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-[240px]">
            Click a row in the table to view contact details, next actions, and activity history.
          </p>
        </div>
        <div className="flex border-t border-slate-200 opacity-50 pointer-events-none">
          {DETAIL_TABS.map((tab) => (
            <span key={tab.id} className="flex-1 text-center py-2 text-[11px] text-slate-400">{tab.label}</span>
          ))}
        </div>
      </aside>
    );
  }

  const name = String(lead.name ?? '');
  const company = String(lead.company ?? '');
  const status = String(lead.status ?? 'new');
  const priority = String(lead.priority ?? 'warm');
  const nextActionType = String(lead.nextActionType ?? 'Call');
  const nextActionAt = lead.nextActionAt as string | null;

  return (
    <aside className={PANEL_SHELL}>
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-start gap-3">
          <span className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-extrabold shrink-0 ${leadAvatarClass(name)}`}>
            {leadInitials(name)}
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="font-extrabold text-slate-900 truncate">{name}</h3>
            <p className="text-xs text-slate-500 truncate">{company}</p>
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <StatusBadge status={leadStageLabel(status)} />
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${priorityTagClass(priority)}`}>
                {priorityLabel(priority) === 'Hot' ? 'Hot Lead' : `${priorityLabel(priority)} Lead`}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mt-3">
          {[
            { icon: Phone, label: 'Call' },
            { icon: MessageCircle, label: 'WhatsApp' },
            { icon: Mail, label: 'Email' },
            { icon: FileText, label: 'Quotation' },
            { icon: MoreHorizontal, label: 'More' },
          ].map(({ icon: Icon, label }) => (
            <button
              key={label}
              type="button"
              title={label}
              onClick={() => window.alert(`${label} — coming soon.`)}
              className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 border border-slate-200 rounded-lg px-2 py-1.5 hover:bg-slate-50 cursor-pointer"
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-3 space-y-1 border-b border-slate-100">
        <InfoRow label="Estimated Value" value={formatLeadCurrency(Number(lead.expectedValue || 0))} />
        <InfoRow label="Assigned To" value={String(lead.assignedRepName || 'Unassigned')} />
        <InfoRow label="Source" value={String(lead.source || '—')} />
        <InfoRow label="Phone" value={String(lead.phone || '—')} />
        <InfoRow label="Email" value={String(lead.email || '—')} />
        <InfoRow label="Location" value={String(lead.location || '—')} />
        <InfoRow label="Created" value={String(lead.createdAt || '—').slice(0, 10)} />
      </div>

      {nextActionAt && status !== 'won' && status !== 'lost' ? (
        <div className="mx-4 mt-3 rounded-xl border border-blue-200 bg-blue-50/80 p-3">
          <div className="flex items-start gap-2">
            <Calendar className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-extrabold text-blue-900">{nextActionType} customer</p>
              <p className="text-[11px] text-blue-700 mt-0.5">{formatLeadDateTime(nextActionAt)}</p>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={() => window.alert('Mark complete — coming soon.')}
              className="text-[10px] font-bold text-blue-700 border border-blue-200 bg-white rounded-lg px-2.5 py-1.5 cursor-pointer hover:bg-blue-50"
            >
              Mark Complete
            </button>
            <button
              type="button"
              onClick={() => window.alert('Reschedule — coming soon.')}
              className="text-[10px] font-bold text-slate-600 border border-slate-200 bg-white rounded-lg px-2.5 py-1.5 cursor-pointer hover:bg-slate-50"
            >
              Reschedule
            </button>
          </div>
        </div>
      ) : null}

      <div className="flex border-b border-slate-200 mt-3 overflow-x-auto">
        {DETAIL_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onDetailTabChange(tab.id)}
            className={`flex-1 pb-2 pt-1 text-[11px] font-bold whitespace-nowrap px-2 cursor-pointer border-b-2 ${
              detailTab === tab.id
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {detailTab === 'activity' ? (
          <ul className="space-y-3">
            {timeline.length === 0 ? (
              <li className="text-xs text-slate-400">No activities yet.</li>
            ) : timeline.map((item) => (
              <li key={String(item.id)} className="flex gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-slate-800">{String(item.summary ?? item.activityType)}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {String(item.actorName || 'System')} · {formatLeadDateTime(String(item.completedAt || item.createdAt || ''))}
                  </p>
                </div>
              </li>
            ))}
            {timeline.length > 0 ? (
              <button
                type="button"
                onClick={() => window.alert('All activities — coming soon.')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer mt-2"
              >
                View All Activities
              </button>
            ) : null}
          </ul>
        ) : null}

        {detailTab === 'details' ? (
          <div className="space-y-2 text-xs">
            <InfoRow label="Product Interest" value={String(lead.interestedProduct || '—')} />
            <InfoRow label="Requirement" value={String(lead.customerRequirement || '—')} />
            <InfoRow label="Campaign" value={String(lead.campaign || '—')} />
            <InfoRow label="Probability" value={`${Number(lead.probability || 0)}%`} />
            <InfoRow label="Conversion" value={String(lead.conversionStatus || 'open')} />
          </div>
        ) : null}

        {detailTab === 'notes' ? (
          <p className="text-xs text-slate-600 whitespace-pre-wrap">{String(lead.notes || 'No notes yet.')}</p>
        ) : null}

        {detailTab === 'files' ? (
          <p className="text-xs text-slate-400 text-center py-6">No files attached yet.</p>
        ) : null}
      </div>

      <div className="p-4 border-t border-slate-100 flex flex-wrap gap-2 mt-auto">
        <button type="button" onClick={onEdit} className="flex-1 min-w-[100px] text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 cursor-pointer">
          Edit Lead
        </button>
        <button type="button" onClick={onConvert} className="flex-1 min-w-[100px] text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-2.5 cursor-pointer">
          Convert
        </button>
        <button type="button" onClick={onMarkLost} className="text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl py-2.5 px-3 cursor-pointer">
          Mark Lost
        </button>
      </div>
    </aside>
  );
}
