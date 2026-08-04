'use client';

import { Dancing_Script } from 'next/font/google';
import { QRCodeSVG } from 'qrcode.react';
import {
  Banknote,
  Calendar,
  FileText,
  Globe,
  Mail,
  MapPin,
  Phone,
  Truck,
  User,
} from 'lucide-react';
import { amountToWordsTaka } from '@/components/modules/sales/invoice-form/inv-amount-words';
import type { InvoicePayload } from '@/components/modules/sales/invoice-form/inv-form-types';
import { INVOICE_STATUS_OPTIONS } from '@/components/modules/sales/invoice-form/inv-form-options';
import { INV_COMPANY_INFO } from '@/components/modules/sales/invoice-form/inv-company-info';
import {
  INV_PRINT_BOTTOM_GRID,
  INV_PRINT_FOOTER_STRIP,
  INV_PRINT_FROM_BOX,
  INV_PRINT_GRID_2,
  INV_PRINT_ICON_CIRCLE,
  INV_PRINT_META_BOX,
  INV_PRINT_META_LABEL,
  INV_PRINT_META_VALUE,
  INV_PRINT_META_VALUE_HIGHLIGHT,
  INV_PRINT_PAGE,
  INV_PRINT_SECTION,
  INV_PRINT_SECTION_TITLE,
  INV_PRINT_SIGNATURE_BOX,
  INV_PRINT_SIGNATURE_LINE,
  INV_PRINT_STATUS_DRAFT,
  INV_PRINT_STATUS_PARTIAL,
  INV_PRINT_STATUS_PAID,
  INV_PRINT_STATUS_UNPAID,
  INV_PRINT_SUMMARY_CARD,
  INV_PRINT_TABLE,
  INV_PRINT_TABLE_HEAD_SOLID,
  INV_PRINT_TABLE_WRAP,
  INV_PRINT_THANK_YOU_BOX,
  INV_PRINT_TOP_ROW,
  INV_PRINT_TOTALS_BAR,
} from '@/components/modules/sales/invoice-form/inv-print-styles';
import { useLocaleFormat } from '@/hooks/useLocaleFormat';

const signatureFont = Dancing_Script({ subsets: ['latin'], weight: ['600', '700'] });

function formatDisplayDate(dateStr: string) {
  if (!dateStr) return '—';
  const parsed = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return dateStr;
  return parsed.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function PrintSectionIcon({ children }: { children: React.ReactNode }) {
  return <span className={INV_PRINT_ICON_CIRCLE}>{children}</span>;
}

function lifecycleLabel(status: string) {
  const match = INVOICE_STATUS_OPTIONS.find((s) => s.value === status);
  return (match?.label ?? status).toUpperCase();
}

function paymentStatusLabel(paid: number, total: number) {
  if (total <= 0) return { label: 'UNPAID', cls: INV_PRINT_STATUS_UNPAID };
  if (paid >= total) return { label: 'PAID', cls: INV_PRINT_STATUS_PAID };
  if (paid > 0) return { label: 'PARTIAL', cls: INV_PRINT_STATUS_PARTIAL };
  return { label: 'UNPAID', cls: INV_PRINT_STATUS_UNPAID };
}

function statusBadgeClass(status: string) {
  const s = status.toLowerCase();
  if (s === 'paid') return INV_PRINT_STATUS_PAID;
  if (s === 'partially-paid' || s === 'partial') return INV_PRINT_STATUS_PARTIAL;
  if (s === 'draft') return INV_PRINT_STATUS_DRAFT;
  if (s === 'overdue') return INV_PRINT_STATUS_UNPAID;
  return INV_PRINT_STATUS_PARTIAL;
}

export function InvoicePrint({
  invoiceNo,
  data,
}: {
  invoiceNo: string;
  data: InvoicePayload;
}) {
  const { formatMoney } = useLocaleFormat();
  const money = (n: number) => formatMoney(n, { decimals: 2 });
  const activeItems = data.items.filter((item) => item.description.trim() || item.productId);
  const total = data.totals.total;
  const paid = Number(data.paidAmount ?? 0);
  const balance = Number(data.balanceDue ?? Math.max(0, total - paid));
  const paymentStatus = paymentStatusLabel(paid, total);
  const issueDate = formatDisplayDate(data.issueDate);
  const dueDate = formatDisplayDate(data.dueDate);
  const shipTo = data.shippingAddress || data.billingAddress || '—';

  return (
    <div className={`${INV_PRINT_PAGE} invoice-print-root`}>
      <div className="flex items-start justify-between gap-4 mb-4 pb-3 border-b border-slate-200">
        <div className="flex items-start gap-2.5">
          <img
            src={INV_COMPANY_INFO.logoUrl}
            alt=""
            className="w-12 h-12 rounded-lg border border-slate-200 object-cover shrink-0"
          />
          <div>
            <h1 className="text-base font-extrabold text-blue-800 leading-tight">{INV_COMPANY_INFO.name}</h1>
            <p className="text-[10px] font-bold text-slate-500 mt-0.5">{INV_COMPANY_INFO.tagline}</p>
          </div>
        </div>
        <h2 className="text-2xl font-extrabold tracking-wide text-slate-900 self-center">INVOICE</h2>
        <div className={INV_PRINT_THANK_YOU_BOX}>
          <FileText className="w-4 h-4 shrink-0 text-blue-600" />
          Thank you for your business!
        </div>
      </div>

      <div className={INV_PRINT_TOP_ROW}>
        <div className={INV_PRINT_FROM_BOX}>
          <h3 className="text-[10px] font-extrabold uppercase text-blue-700 mb-2">From</h3>
          <div className="space-y-1 text-[10px] text-slate-700">
            <p className="font-extrabold text-slate-900">{INV_COMPANY_INFO.name}</p>
            <p className="flex items-start gap-1.5"><MapPin className="w-3 h-3 mt-0.5 shrink-0 text-blue-600" />{INV_COMPANY_INFO.address}</p>
            <p className="flex items-center gap-1.5"><Mail className="w-3 h-3 shrink-0 text-blue-600" />{INV_COMPANY_INFO.email}</p>
            <p className="flex items-center gap-1.5"><Phone className="w-3 h-3 shrink-0 text-blue-600" />{INV_COMPANY_INFO.phone}</p>
            <p className="flex items-center gap-1.5"><Globe className="w-3 h-3 shrink-0 text-blue-600" />{INV_COMPANY_INFO.website}</p>
          </div>
        </div>

        <div className={INV_PRINT_META_BOX}>
          <table className="w-full text-[10px]">
            <tbody>
              <tr>
                <td className={INV_PRINT_META_LABEL}>Invoice No.</td>
                <td className={INV_PRINT_META_VALUE_HIGHLIGHT}>{invoiceNo}</td>
              </tr>
              <tr>
                <td className={INV_PRINT_META_LABEL}>Invoice Date</td>
                <td className={INV_PRINT_META_VALUE}>{issueDate}</td>
              </tr>
              <tr>
                <td className={INV_PRINT_META_LABEL}>Due Date</td>
                <td className={INV_PRINT_META_VALUE}>{dueDate}</td>
              </tr>
              <tr>
                <td className={INV_PRINT_META_LABEL}>Status</td>
                <td><span className={statusBadgeClass(data.status)}>{lifecycleLabel(data.status)}</span></td>
              </tr>
              <tr>
                <td className={INV_PRINT_META_LABEL}>Payment Status</td>
                <td><span className={paymentStatus.cls}>{paymentStatus.label}</span></td>
              </tr>
              <tr>
                <td className={INV_PRINT_META_LABEL}>Balance Due</td>
                <td className="font-extrabold text-rose-600">{money(balance)}</td>
              </tr>
              {data.approvalStatus ? (
                <tr>
                  <td className={INV_PRINT_META_LABEL}>Approval</td>
                  <td className="font-semibold capitalize">{data.approvalStatus}</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className={INV_PRINT_SUMMARY_CARD}>
          <div className="flex justify-between text-[10px] mb-1">
            <span className="text-slate-500 font-medium">Total Amount</span>
            <span className="font-extrabold text-blue-700 text-sm">{money(total)}</span>
          </div>
          <div className="flex justify-between text-[10px] mb-1">
            <span className="text-slate-500 font-medium">Paid Amount</span>
            <span className="font-extrabold text-emerald-600">{money(paid)}</span>
          </div>
          <div className="flex justify-between text-[10px] pt-2 border-t border-slate-200">
            <span className="font-bold text-slate-700">Balance Due</span>
            <span className="font-extrabold text-rose-600">{money(balance)}</span>
          </div>
        </div>
      </div>

      <div className={INV_PRINT_GRID_2}>
        <div className={INV_PRINT_SECTION}>
          <h3 className={INV_PRINT_SECTION_TITLE}>
            <PrintSectionIcon><User className="w-3.5 h-3.5 text-blue-600" /></PrintSectionIcon>
            Bill To
          </h3>
          <div className="space-y-1 text-[10px]">
            <p className="font-extrabold text-slate-900">{data.customerName || '—'}</p>
            <p className="leading-snug whitespace-pre-wrap">{data.billingAddress || '—'}</p>
            {data.customerPhone ? <p className="flex items-center gap-1"><Phone className="w-3 h-3 text-blue-600" />{data.customerPhone}</p> : null}
            {data.customerEmail ? <p className="flex items-center gap-1"><Mail className="w-3 h-3 text-blue-600" />{data.customerEmail}</p> : null}
          </div>
        </div>
        <div className={INV_PRINT_SECTION}>
          <h3 className={INV_PRINT_SECTION_TITLE}>
            <PrintSectionIcon><Truck className="w-3.5 h-3.5 text-blue-600" /></PrintSectionIcon>
            Ship To
          </h3>
          <div className="space-y-1 text-[10px]">
            <p className="font-extrabold text-slate-900">{data.customerName || '—'}</p>
            <p className="leading-snug whitespace-pre-wrap">{shipTo}</p>
          </div>
        </div>
      </div>

      <div className="mb-3">
        <div className={INV_PRINT_TABLE_WRAP}>
          <table className={INV_PRINT_TABLE}>
            <thead>
              <tr className={INV_PRINT_TABLE_HEAD_SOLID}>
                <th className="px-2 py-2 text-left w-8">#</th>
                <th className="px-2 py-2 text-left">Item / Description</th>
                <th className="px-2 py-2 text-right">Qty</th>
                <th className="px-2 py-2 text-right">Unit Price (৳)</th>
                <th className="px-2 py-2 text-right">Discount</th>
                <th className="px-2 py-2 text-right">Tax</th>
                <th className="px-2 py-2 text-right">Amount (৳)</th>
              </tr>
            </thead>
            <tbody>
              {activeItems.map((item, index) => (
                <tr key={item.id} className={`border-t border-slate-100 ${index % 2 === 1 ? 'bg-slate-50/50' : ''}`}>
                  <td className="px-2 py-2 font-bold text-slate-500">{index + 1}</td>
                  <td className="px-2 py-2">
                    <p className="font-bold text-slate-900 leading-tight">{item.description}</p>
                    {item.productId ? <p className="text-[9px] text-slate-500 mt-0.5">SKU: {item.productId}</p> : null}
                  </td>
                  <td className="px-2 py-2 text-right">{item.qty}</td>
                  <td className="px-2 py-2 text-right">{money(item.rate)}</td>
                  <td className="px-2 py-2 text-right">{item.discountPct}%</td>
                  <td className="px-2 py-2 text-right">{item.taxLabel}</td>
                  <td className="px-2 py-2 text-right font-bold">{money(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] font-semibold text-slate-600 mt-2 italic">
          Amount in Words: {amountToWordsTaka(total)}
        </p>
      </div>

      <div className={INV_PRINT_BOTTOM_GRID}>
        <div className="space-y-3">
          {data.notes ? (
            <div className={INV_PRINT_SECTION}>
              <h3 className={INV_PRINT_SECTION_TITLE}>
                <PrintSectionIcon><FileText className="w-3.5 h-3.5 text-blue-600" /></PrintSectionIcon>
                Notes
              </h3>
              <p className="text-[10px] leading-snug whitespace-pre-wrap">{data.notes}</p>
            </div>
          ) : null}
          {data.terms ? (
            <div className={INV_PRINT_SECTION}>
              <h3 className={INV_PRINT_SECTION_TITLE}>
                <PrintSectionIcon><FileText className="w-3.5 h-3.5 text-blue-600" /></PrintSectionIcon>
                Terms &amp; Conditions
              </h3>
              <p className="text-[10px] leading-snug">{data.terms}</p>
            </div>
          ) : null}
          <div className={INV_PRINT_SECTION}>
            <h3 className={INV_PRINT_SECTION_TITLE}>
              <PrintSectionIcon><Banknote className="w-3.5 h-3.5 text-blue-600" /></PrintSectionIcon>
              Bank Information
            </h3>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
              <p><span className="font-bold text-slate-500">Bank Name:</span> {INV_COMPANY_INFO.bank.name}</p>
              <p><span className="font-bold text-slate-500">Account Name:</span> {INV_COMPANY_INFO.bank.accountName}</p>
              <p><span className="font-bold text-slate-500">Account No.:</span> {INV_COMPANY_INFO.bank.accountNo}</p>
              <p><span className="font-bold text-slate-500">Routing No.:</span> {INV_COMPANY_INFO.bank.routingNo}</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className={INV_PRINT_SECTION}>
            <div className="space-y-1.5 text-[10px]">
              <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span className="font-bold">{money(data.totals.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Discount</span><span className="font-bold">{money(data.totals.discountAmount)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Tax</span><span className="font-bold">{money(data.totals.taxAmount)}</span></div>
            </div>
            <div className={`${INV_PRINT_TOTALS_BAR} mt-2`}>
              <span>TOTAL AMOUNT</span>
              <span>{money(total)}</span>
            </div>
            <div className="flex justify-between text-[10px] mt-2">
              <span className="text-emerald-700 font-bold">Paid Amount</span>
              <span className="font-extrabold text-emerald-600">- {money(paid)}</span>
            </div>
            <div className="flex justify-between text-[11px] mt-1 pt-1 border-t border-slate-200">
              <span className="font-extrabold text-rose-700">BALANCE DUE</span>
              <span className="font-extrabold text-rose-600">{money(balance)}</span>
            </div>
          </div>

          <div className={INV_PRINT_SIGNATURE_BOX}>
            <p className="text-[10px] font-extrabold text-slate-700 mb-2">
              {data.signature?.label || 'Authorized Signature'}
            </p>
            {data.signature?.imageDataUrl ? (
              <div className="min-h-[56px] flex items-end justify-start pb-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={data.signature.imageDataUrl}
                  alt=""
                  className="max-h-14 max-w-[180px] object-contain object-left"
                />
              </div>
            ) : (
              <div className={`${INV_PRINT_SIGNATURE_LINE} ${signatureFont.className}`}>
                {INV_COMPANY_INFO.authorizedBy}
              </div>
            )}
            <p className="text-[10px] font-semibold">
              {data.signature?.signerName ?? INV_COMPANY_INFO.authorizedBy}
            </p>
            {data.signature?.designation ? (
              <p className="text-[10px] text-slate-500">{data.signature.designation}</p>
            ) : null}
            <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
              <Calendar className="w-3 h-3" /> {issueDate}
            </p>
          </div>
        </div>
      </div>

      <div className={INV_PRINT_FOOTER_STRIP}>
        <div>
          <p className="font-extrabold text-slate-800 mb-0.5">Get in Touch</p>
          <p>{INV_COMPANY_INFO.phone} · {INV_COMPANY_INFO.email}</p>
        </div>
        <div className="text-center">
          <p className="font-extrabold text-slate-800 mb-1">Scan to Pay</p>
          <div className="inline-block p-1 border border-slate-200 rounded-lg bg-white">
            <QRCodeSVG value={invoiceNo} size={56} level="M" includeMargin={false} />
          </div>
        </div>
        <div className="text-right">
          <p className="font-extrabold text-slate-800">Created by</p>
          <p className="text-blue-700 font-bold">{INV_COMPANY_INFO.name}</p>
          <p>{INV_COMPANY_INFO.website}</p>
        </div>
      </div>
    </div>
  );
}
