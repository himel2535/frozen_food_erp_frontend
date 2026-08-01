'use client';

import { BarChart3, Building2, Clock, FileText, Paperclip, Tag } from 'lucide-react';
import { AppTable, type AppTableColumn } from '@/components/shared/AppTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { RecentNotesPanel } from '@/components/modules/crm/customer-detail/RecentNotesPanel';
import {
  CD_BODY,
  CD_CAPTION,
  CD_CARD_COMPACT,
  CD_LABEL,
  CD_SECTION_HEADER_COMPACT,
  CD_TITLE,
} from '@/components/modules/crm/customer-detail/customer-detail-styles';
import {
  formatAddressBlock,
  formatDetailDate,
  formatFileSize,
  monthsSince,
} from '@/components/modules/crm/customer-detail/customer-detail-utils';
import { formatMoney } from '@/lib/services/sales-service';

type OverviewTabProps = {
  customerId: string;
  customer: Record<string, unknown>;
  contacts: Array<Record<string, unknown>>;
  addresses: Array<Record<string, unknown>>;
  tags: Array<Record<string, unknown>>;
  attachments: Array<Record<string, unknown>>;
  communications: Array<Record<string, unknown>>;
  metrics: {
    totalDue: number;
    overdueAmount: number;
    creditLimit: number;
    creditUsedPercent: number;
    creditRemaining: number;
    lastPaymentDate: unknown;
    lastPurchaseDate: unknown;
    customerSince: unknown;
  };
  transactions: Array<Record<string, unknown>>;
  onViewAllNotes?: () => void;
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[130px_1fr] gap-2 py-1.5 border-b border-slate-50 last:border-0">
      <span className={CD_LABEL}>{label}</span>
      <span className={CD_BODY}>{value}</span>
    </div>
  );
}

export function OverviewTab({
  customerId,
  customer,
  contacts,
  addresses,
  tags,
  attachments,
  communications,
  metrics,
  transactions,
  onViewAllNotes,
}: OverviewTabProps) {
  const primary = contacts.find((c) => c.primary) ?? contacts[0];
  const billing = addresses.find((a) => a.type === 'billing') ?? addresses[0];
  const shipping = addresses.find((a) => a.type === 'shipping') ?? addresses[1];
  const sameAsBilling =
    billing &&
    shipping &&
    formatAddressBlock(billing) === formatAddressBlock(shipping);

  const txColumns: AppTableColumn<Record<string, unknown>>[] = [
    { key: 'type', label: 'Type', render: (row) => <span className="font-bold">{String(row.type)}</span> },
    { key: 'docNo', label: 'Doc No.' },
    { key: 'date', label: 'Date', render: (row) => formatDetailDate(row.date) },
    { key: 'amount', label: 'Amount', render: (row) => formatMoney(Number(row.amount ?? 0)) },
    { key: 'paid', label: 'Paid', render: (row) => formatMoney(Number(row.paid ?? 0)) },
    {
      key: 'due',
      label: 'Due',
      render: (row) => (
        <span className={Number(row.due) > 0 ? 'text-rose-600 font-bold' : ''}>
          {formatMoney(Number(row.due ?? 0))}
        </span>
      ),
    },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={String(row.status)} /> },
  ];

  const months = monthsSince(metrics.customerSince);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-stretch">
        <div className={CD_CARD_COMPACT}>
          <div className={CD_SECTION_HEADER_COMPACT}>
            <Building2 className="w-4 h-4 text-blue-500" />
            <h3 className={CD_TITLE}>Company & Contact Information</h3>
          </div>
          <InfoRow label="Company Name" value={String(customer.company ?? '—')} />
          <InfoRow label="Customer Type" value={String(customer.companyType ?? '—')} />
          <InfoRow label="Phone" value={String(primary?.phone ?? '—')} />
          <InfoRow label="Email" value={String(primary?.email ?? '—')} />
          <InfoRow label="Tax Number / VAT" value={String(customer.taxVatNumber ?? '—')} />
          <InfoRow label="Billing Address" value={formatAddressBlock(billing)} />
          <InfoRow
            label="Shipping Address"
            value={sameAsBilling ? 'Same as Billing Address' : formatAddressBlock(shipping)}
          />
          <InfoRow label="Currency" value={String(customer.defaultCurrency ?? 'BDT')} />
          <InfoRow label="Payment Terms" value={String(customer.paymentTerms ?? '—')} />
        </div>

        <div className="flex flex-col gap-3 h-full">
          <div className={CD_CARD_COMPACT}>
            <RecentNotesPanel
              customerId={customerId}
              communications={communications}
              customerNotes={String(customer.notes ?? '')}
              limit={3}
              showViewAll
              onViewAllNotes={onViewAllNotes}
            />
          </div>

          <div className={`${CD_CARD_COMPACT} flex-1 flex flex-col`}>
            <div className={CD_SECTION_HEADER_COMPACT}>
              <Tag className="w-4 h-4 text-blue-500" />
              <h3 className={CD_TITLE}>Tags</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.length ? tags.map((tag) => (
                <span key={String(tag.id)} className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">
                  {String(tag.label)}
                </span>
              )) : (
                <span className={CD_CAPTION}>No tags</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 h-full">
          <div className={CD_CARD_COMPACT}>
            <div className={CD_SECTION_HEADER_COMPACT}>
              <BarChart3 className="w-4 h-4 text-blue-500" />
              <h3 className={CD_TITLE}>Customer Summary</h3>
            </div>
            <div className="space-y-2">
              <div className={`flex justify-between ${CD_LABEL}`}>
                <span>Credit Limit Used</span>
                <span>{metrics.creditUsedPercent.toFixed(1)}%</span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all"
                  style={{ width: `${metrics.creditUsedPercent}%` }}
                />
              </div>
              <InfoRow label="Current Balance" value={formatMoney(metrics.totalDue)} />
              <InfoRow label="Overdue Amount" value={formatMoney(metrics.overdueAmount)} />
              <InfoRow label="Last Payment" value={formatDetailDate(metrics.lastPaymentDate)} />
              <InfoRow label="Last Order" value={formatDetailDate(metrics.lastPurchaseDate)} />
            </div>
          </div>

          <div className={`${CD_CARD_COMPACT} flex-1 flex flex-col`}>
            <div className={CD_SECTION_HEADER_COMPACT}>
              <Paperclip className="w-4 h-4 text-blue-500" />
              <h3 className={CD_TITLE}>Attachments</h3>
            </div>
            {attachments.length ? (
              <ul className="space-y-2">
                {attachments.slice(0, 4).map((file) => (
                  <li key={String(file.id)} className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-rose-500 shrink-0" />
                    <div className="min-w-0">
                      <p className={`${CD_BODY} truncate`}>{String(file.name ?? file.filename ?? file.id)}</p>
                      <p className={CD_CAPTION}>
                        {formatFileSize(file.size)} · {formatDetailDate(file.uploadedAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={CD_CAPTION}>No files uploaded.</p>
            )}
          </div>
        </div>
      </div>

      <div className={`${CD_CARD_COMPACT} space-y-3`}>
        <h3 className={CD_TITLE}>Recent Transactions</h3>
        <AppTable
          columns={txColumns}
          rows={transactions.slice(0, 5)}
          emptyMessage="No transactions yet."
        />
        {months ? (
          <div className="flex items-start gap-2 rounded-xl bg-blue-50 border border-blue-100 px-4 py-2.5 text-sm text-blue-800">
            <Clock className="w-5 h-5 shrink-0 mt-0.5" />
            <p>
              This customer has been with us for {months} month{months === 1 ? '' : 's'} and has a good payment history.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
