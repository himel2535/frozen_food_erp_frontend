'use client';

import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { BarChart3, Building2, Clock, FileText, Pencil, Star } from 'lucide-react';
import { AppTable, type AppTableColumn } from '@/components/shared/AppTable';
import { formatDueMoney, type SupplierDetailBill, type SupplierDetailProfile } from '@/lib/services/suppliers-service';
import {
  BILL_STATUS_BADGE,
  formatDetailDate,
  formatDetailDateTime,
  SD_CARD,
  SD_CARD_STRETCH,
  SD_CARD_TITLE,
  SD_LABEL,
  SD_OVERVIEW_COL,
  SD_OVERVIEW_GRID,
  SD_PAGE_LINK,
  SD_VALUE,
} from './supplier-detail-styles';

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-2 py-1.5 border-b border-slate-50 last:border-0">
      <span className={SD_LABEL}>{label}</span>
      <span className={SD_VALUE}>{value}</span>
    </div>
  );
}

function PerformanceBar({ label, value, tone = 'blue' }: { label: string; value: number; tone?: 'blue' | 'emerald' | 'amber' }) {
  const barCls = tone === 'emerald' ? 'bg-emerald-500' : tone === 'amber' ? 'bg-amber-500' : 'bg-blue-500';
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="font-semibold text-slate-600">{label}</span>
        <span className="font-bold text-slate-800">{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <div className={`h-full rounded-full ${barCls}`} style={{ width: `${Math.min(100, value)}%` }} />
      </div>
    </div>
  );
}

function ActivityIcon({ type }: { type: string }) {
  const map: Record<string, string> = {
    payment: 'flat-color-icons:paid',
    grn: 'fluent-color:box-24',
    bill: 'fluent-color:receipt-24',
    po: 'fluent-color:document-24',
    return: 'fluent-color:arrow-undo-24',
    note: 'fluent-color:note-24',
  };
  return <Icon icon={map[type] ?? 'fluent-color:info-24'} width={28} height={28} className="shrink-0" />;
}

export function SupplierOverviewTab({ profile }: { profile: SupplierDetailProfile }) {
  const router = useRouter();
  const { supplier, performance, bills, activities } = profile;

  const billColumns: AppTableColumn<SupplierDetailBill>[] = [
    { key: 'billNo', label: 'Bill No.', render: (row) => <span className="font-bold text-slate-800">{row.billNo}</span> },
    { key: 'billDate', label: 'Date', render: (row) => formatDetailDate(row.billDate) },
    { key: 'amount', label: 'Amount', render: (row) => formatDueMoney(row.amount) },
    { key: 'due', label: 'Due', render: (row) => <span className={row.due > 0 ? 'text-rose-600 font-bold' : ''}>{formatDueMoney(row.due)}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${BILL_STATUS_BADGE[row.statusTone] ?? BILL_STATUS_BADGE.sky}`}>
          {row.statusLabel}
        </span>
      ),
    },
  ];

  const stars = Math.round(performance.rating);
  const ratingStars = Array.from({ length: 5 }, (_, i) => (
    <Star key={i} className={`w-3.5 h-3.5 ${i < stars ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
  ));

  return (
    <div className={SD_OVERVIEW_GRID}>
      {/* Left column */}
      <div className={SD_OVERVIEW_COL}>
        <div className={SD_CARD}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-500" />
              <h3 className={SD_CARD_TITLE}>Supplier Information</h3>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
              onClick={() => router.push(`/purchases/suppliers?edit=${supplier.id}`)}
            >
              <Pencil className="w-3 h-3" />
              Edit
            </button>
          </div>
          <InfoRow label="Supplier Name" value={supplier.name} />
          <InfoRow label="Supplier Code" value={supplier.code} />
          <InfoRow label="Category" value={profile.categoryLabel} />
          <InfoRow label="Contact Person" value={supplier.contactName} />
          <InfoRow label="Phone" value={supplier.phone} />
          <InfoRow label="Email" value={supplier.email ?? '—'} />
          <InfoRow label="Address" value={supplier.address ?? profile.location} />
          <InfoRow label="Supplier Since" value={formatDetailDate(supplier.createdAt)} />
        </div>

        <div className={`${SD_CARD_STRETCH} flex-1`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-500" />
              <h3 className={SD_CARD_TITLE}>Payable Breakdown</h3>
            </div>
            <button type="button" className={SD_PAGE_LINK} onClick={() => router.push(`/accounting/payables?supplierId=${supplier.id}`)}>
              View All Bills
            </button>
          </div>
          <div className="flex-1 min-h-0">
            <AppTable columns={billColumns} rows={bills} emptyMessage="No outstanding bills" />
          </div>
        </div>
      </div>

      {/* Middle column */}
      <div className={SD_OVERVIEW_COL}>
        <div className={SD_CARD}>
          <div className="flex items-center gap-2 mb-3">
            <Icon icon="fluent-color:money-24" width={18} height={18} />
            <h3 className={SD_CARD_TITLE}>Commercial Information</h3>
          </div>
          <InfoRow label="Payment Terms" value={supplier.paymentTerms} />
          <InfoRow label="Credit Limit" value={formatDueMoney(profile.creditLimit)} />
          <InfoRow label="Opening Balance" value={formatDueMoney(profile.openingBalance)} />
          <InfoRow label="Used Credit" value={`${formatDueMoney(profile.usedCredit)} (${profile.usedCreditPct}%)`} />
          <InfoRow label="Last Payment" value={formatDetailDate(profile.lastPaymentDate)} />
          <InfoRow label="Last Purchase" value={formatDetailDate(supplier.lastPurchaseDate)} />
          <InfoRow label="Lead Time" value={supplier.leadTime ?? performance.avgLeadTime} />
        </div>

        <div className={`${SD_CARD_STRETCH} flex-1`}>
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-blue-500" />
            <h3 className={SD_CARD_TITLE}>Supplier Performance</h3>
          </div>
          <div className="flex flex-col flex-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex">{ratingStars}</div>
              <span className="text-sm font-extrabold text-slate-900">{performance.rating.toFixed(1)}</span>
              <span className="text-xs text-slate-500">/ 5.0</span>
            </div>
            <div className="space-y-3">
              <PerformanceBar label="On-Time Delivery" value={performance.onTimeDelivery} tone="emerald" />
              <PerformanceBar label="Quality Acceptance" value={performance.qualityAcceptance} tone="blue" />
              <PerformanceBar label="Return Rate" value={performance.returnRate} tone="amber" />
            </div>
            <div className="grid grid-cols-2 gap-3 mt-auto pt-4 border-t border-slate-100">
              <div>
                <span className={SD_LABEL}>Total Orders</span>
                <p className="text-sm font-extrabold text-slate-900 mt-0.5">{performance.totalOrders}</p>
              </div>
              <div>
                <span className={SD_LABEL}>Completed</span>
                <p className="text-sm font-extrabold text-slate-900 mt-0.5">{performance.completedOrders}</p>
              </div>
              <div>
                <span className={SD_LABEL}>Avg Lead Time</span>
                <p className="text-sm font-extrabold text-slate-900 mt-0.5">{performance.avgLeadTime}</p>
              </div>
              <div>
                <span className={SD_LABEL}>Active Items</span>
                <p className="text-sm font-extrabold text-slate-900 mt-0.5">{performance.activeItems}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right column */}
      <div className={SD_CARD_STRETCH}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-500" />
            <h3 className={SD_CARD_TITLE}>Recent Activity</h3>
          </div>
          <button type="button" className={SD_PAGE_LINK} onClick={() => {}}>
            View All
          </button>
        </div>
        <div className="flex-1 space-y-4">
          {activities.length === 0 ? (
            <p className="text-xs text-slate-500">No recent activity</p>
          ) : (
            activities.map((act, idx) => (
              <div key={act.id} className="flex gap-3 relative">
                {idx < activities.length - 1 && (
                  <span className="absolute left-[13px] top-8 bottom-0 w-px bg-slate-200" aria-hidden />
                )}
                <ActivityIcon type={act.type} />
                <div className="min-w-0 flex-1 pb-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="text-xs font-bold text-slate-800">{act.title}</span>
                    {act.meta && <span className="text-[10px] font-bold text-blue-600">{act.meta}</span>}
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">{act.text}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{formatDetailDateTime(act.at)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
