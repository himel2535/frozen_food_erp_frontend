'use client';

import { toast } from '@/lib/ui/feedback';

import { useMemo } from 'react';
import { Bookmark, CalendarClock, Phone, MessageCircle, UserPlus } from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { IconButton } from '@/components/shared/IconButton';
import { AppTable, type AppTableColumn } from '@/components/shared/AppTable';
import {
  formatDueMoney,
  type CustomerReceivable,
} from '@/lib/services/customer-receivables-service';
import {
  getCompanyInitials,
  formatActionTimeShort,
  openPhoneCall,
  openWhatsApp,
} from '@/lib/utils/communication-utils';
import {
  COLLECTION_STATUS_BADGE,
  DUE_AVATAR_CLS,
  ROW_BG_BY_COLLECTION,
  nextActionTimeCls,
} from './customer-due-styles';

function NextActionIcon({ type }: { type?: 'call' | 'whatsapp' | 'follow_up' }) {
  if (type === 'call') return <Phone className="w-3.5 h-3.5 text-rose-500 shrink-0" />;
  if (type === 'whatsapp') return <MessageCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />;
  if (type === 'follow_up') return <UserPlus className="w-3.5 h-3.5 text-amber-600 shrink-0" />;
  return <CalendarClock className="w-3.5 h-3.5 text-slate-500 shrink-0" />;
}

function handleNextAction(row: CustomerReceivable, e: React.MouseEvent) {
  e.stopPropagation();
  if (!row.nextAction) return;
  if (row.nextAction.type === 'call' || row.nextAction.type === 'follow_up') {
    if (!openPhoneCall(row.phone)) toast.error('No phone number', { module: 'Customer Due', description: 'Phone number not available.' });
    return;
  }
  if (row.nextAction.type === 'whatsapp') {
    if (!openWhatsApp(row.phone)) toast.error('No phone number', { module: 'Customer Due', description: 'Phone number not available.' });
  }
}

function RowActionIcons({ row }: { row: CustomerReceivable }) {
  return (
    <div className="flex items-center justify-center gap-1">
      <IconButton
        type="button"
        title="Call"
        aria-label="Call customer"
        variant="ghost"
        size="sm"
        className="!h-8 !w-8"
        onClick={(e) => {
          e.stopPropagation();
          if (!openPhoneCall(row.phone)) {
            toast.error('No phone number', { module: 'Customer Due', description: 'Phone number not available.' });
          }
        }}
      >
        <Phone className="w-4 h-4 text-slate-600 hover:text-slate-900" />
      </IconButton>
      <IconButton
        type="button"
        title="WhatsApp"
        aria-label="WhatsApp customer"
        variant="ghost"
        size="sm"
        className="!h-8 !w-8"
        onClick={(e) => {
          e.stopPropagation();
          if (!openWhatsApp(row.phone)) {
            toast.error('No phone number', { module: 'Customer Due', description: 'Phone number not available.' });
          }
        }}
      >
        <MessageCircle className="w-4 h-4 text-slate-600 hover:text-slate-900" />
      </IconButton>
    </div>
  );
}

export function CustomerDueTable({
  rows,
  page,
  pageSize,
  selectedCustomerId,
  onPageChange,
  onRowClick,
  onPageSizeChange,
}: {
  rows: CustomerReceivable[];
  page: number;
  pageSize: number;
  selectedCustomerId: string | null;
  onPageChange: (v: number) => void;
  onRowClick: (entry: CustomerReceivable) => void;
  onPageSizeChange?: (size: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedRows = rows.slice((safePage - 1) * pageSize, safePage * pageSize);
  const rangeStart = rows.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const rangeEnd = Math.min(safePage * pageSize, rows.length);

  const columns = useMemo<AppTableColumn<CustomerReceivable>[]>(() => [
    {
      key: 'customer',
      label: 'Customer',
      render: (row) => {
        const urgent = row.isCriticalOverdue || row.isMissed;
        return (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative shrink-0">
              <span className={DUE_AVATAR_CLS}>{getCompanyInitials(row.company)}</span>
              {urgent && (
                <Bookmark className="absolute -top-1 -right-1 w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              )}
            </div>
            <div className="min-w-0">
              <div className="font-bold text-slate-900 truncate">{row.company}</div>
              <div className="text-[11px] text-slate-400 truncate">{row.phone}</div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'outstanding',
      label: 'Outstanding',
      align: 'right',
      render: (row) => (
        <div className="text-right">
          <span className={`font-bold block ${row.status === 'overdue' ? 'text-rose-600' : 'text-slate-800'}`}>
            {formatDueMoney(row.totalDue)}
          </span>
          <span className="text-[10px] text-slate-400">Total Due</span>
        </div>
      ),
    },
    {
      key: 'aging',
      label: 'Aging',
      render: (row) => (
        row.status === 'overdue' ? (
          <span className="text-xs font-bold text-rose-600">{row.agingLabel}</span>
        ) : (
          <span className="text-xs font-semibold text-slate-600">{row.agingLabel}</span>
        )
      ),
    },
    {
      key: 'collectionStatus',
      label: 'Collection Status',
      render: (row) => (
        <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold whitespace-nowrap ${COLLECTION_STATUS_BADGE[row.collectionStatus] ?? COLLECTION_STATUS_BADGE.none}`}>
          {row.collectionStatusLabel}
        </span>
      ),
    },
    {
      key: 'nextAction',
      label: 'Next Action',
      render: (row) => (
        row.nextAction ? (
          <button
            type="button"
            className="flex items-start gap-1.5 min-w-0 text-left cursor-pointer hover:opacity-80"
            onClick={(e) => handleNextAction(row, e)}
          >
            <NextActionIcon type={row.nextAction.type} />
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-800 truncate">{row.nextAction.label}</div>
              <div className={`text-[10px] ${nextActionTimeCls(row.nextAction.type, row.isMissed)}`}>
                {formatActionTimeShort(row.nextAction.scheduledAt)}
              </div>
            </div>
          </button>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        )
      ),
    },
    {
      key: 'assignedTo',
      label: 'Assigned To',
      render: (row) => (
        row.assignedTo ? (
          <div className="flex items-center gap-2 min-w-0">
            <span className={`${DUE_AVATAR_CLS} h-7 w-7 text-[10px]`}>{row.assignedTo.initials}</span>
            <span className="text-xs font-semibold text-slate-700 truncate">{row.assignedTo.shortName}</span>
          </div>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        )
      ),
    },
  ], []);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <AppTable
        columns={columns}
        rows={pagedRows}
        rowKey={(row) => row.id}
        emptyMessage="No customer receivables found."
        onRowClick={onRowClick}
        rowClassName={(row) => {
          const base = ROW_BG_BY_COLLECTION[row.collectionStatus] ?? '';
          const selected = selectedCustomerId === row.customerId ? 'bg-rose-50/80 ring-1 ring-rose-100' : '';
          return `${base} ${selected} cursor-pointer hover:bg-slate-50/80`.trim();
        }}
        renderActions={(row) => <RowActionIcons row={row} />}
      />
      <div className="px-3 py-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-slate-500">
        <p>
          Showing {rangeStart} to {rangeEnd} of {rows.length} customer{rows.length === 1 ? '' : 's'}
        </p>
        <div className="flex items-center gap-2 justify-end">
          {onPageSizeChange && (
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="rounded border border-slate-200 px-2 py-1 text-xs cursor-pointer"
            >
              {[5, 8, 10, 20].map((n) => (
                <option key={n} value={n}>{n} / page</option>
              ))}
            </select>
          )}
          <Button
            type="button"
            disabled={safePage <= 1}
            variant="outline"
            size="sm"
            className="!px-2 !py-1"
            onClick={() => onPageChange(safePage - 1)}
          >
            Previous
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 5).map((n) => (
            <Button
              key={n}
              type="button"
              variant={n === safePage ? 'primary' : 'outline'}
              size="sm"
              className="!px-2.5 !py-1"
              onClick={() => onPageChange(n)}
            >
              {n}
            </Button>
          ))}
          <Button
            type="button"
            disabled={safePage >= totalPages}
            variant="outline"
            size="sm"
            className="!px-2 !py-1"
            onClick={() => onPageChange(safePage + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
