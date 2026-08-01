'use client';

import { MapPin, User } from 'lucide-react';
import type { InvoicePayload } from '@/components/modules/sales/invoice-form/inv-form-types';
import { INVOICE_STATUS_OPTIONS } from '@/components/modules/sales/invoice-form/inv-form-options';
import { formatMoney } from '@/lib/services/sales-service';

function formatDisplayDate(dateStr: string) {
  if (!dateStr) return '—';
  const parsed = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return dateStr;
  return parsed.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function InvoicePrint({
  invoiceNo,
  data,
}: {
  invoiceNo: string;
  data: InvoicePayload;
}) {
  const activeItems = data.items.filter((item) => item.description.trim() || item.productId);
  const statusLabel = INVOICE_STATUS_OPTIONS.find((s) => s.value === data.status)?.label ?? data.status;

  return (
    <div className="max-w-[820px] mx-auto p-8 bg-white text-slate-800 font-sans">
      <div className="flex items-start justify-between gap-6 border-b border-slate-200 pb-6 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">INVOICE</h1>
          <p className="text-sm font-semibold text-slate-500 mt-1">Toys Factory ERP</p>
        </div>
        <div className="text-right text-sm">
          <p className="font-extrabold text-lg text-blue-700">{invoiceNo}</p>
          <p className="mt-1"><span className="text-slate-500">Date:</span> {formatDisplayDate(data.issueDate)}</p>
          <p><span className="text-slate-500">Due:</span> {formatDisplayDate(data.dueDate)}</p>
          <p className="mt-1 inline-flex px-2 py-0.5 rounded-full bg-slate-100 text-xs font-bold">{statusLabel}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-blue-600 mb-2">
            <User className="w-4 h-4" /> Bill To
          </div>
          <p className="font-extrabold text-slate-900">{data.customerName || '—'}</p>
          <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{data.billingAddress || '—'}</p>
        </div>
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-blue-600 mb-2">
            <MapPin className="w-4 h-4" /> Payment Terms
          </div>
          <p className="text-sm font-semibold text-slate-700">{data.terms || 'Net 30'}</p>
        </div>
      </div>

      <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden mb-6">
        <thead>
          <tr className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500">
            <th className="px-3 py-2 text-left">#</th>
            <th className="px-3 py-2 text-left">Description</th>
            <th className="px-3 py-2 text-right">Qty</th>
            <th className="px-3 py-2 text-right">Rate</th>
            <th className="px-3 py-2 text-right">Disc %</th>
            <th className="px-3 py-2 text-right">Tax</th>
            <th className="px-3 py-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {activeItems.map((item, index) => (
            <tr key={item.id} className="border-t border-slate-100">
              <td className="px-3 py-2">{index + 1}</td>
              <td className="px-3 py-2 font-medium">{item.description}</td>
              <td className="px-3 py-2 text-right">{item.qty}</td>
              <td className="px-3 py-2 text-right">{formatMoney(item.rate)}</td>
              <td className="px-3 py-2 text-right">{item.discountPct}%</td>
              <td className="px-3 py-2 text-right">{item.taxLabel}</td>
              <td className="px-3 py-2 text-right font-bold">{formatMoney(item.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end mb-8">
        <div className="w-64 space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span className="font-bold">{formatMoney(data.totals.subtotal)}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Discount</span><span className="font-bold">{formatMoney(data.totals.discountAmount)}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Tax</span><span className="font-bold">{formatMoney(data.totals.taxAmount)}</span></div>
          <div className="flex justify-between pt-2 border-t border-slate-200 text-base">
            <span className="font-extrabold text-blue-700">Total</span>
            <span className="font-extrabold text-blue-700">{formatMoney(data.totals.total)}</span>
          </div>
        </div>
      </div>

      {data.notes ? (
        <div className="border-t border-slate-200 pt-4">
          <p className="text-xs font-bold uppercase text-slate-500 mb-1">Notes</p>
          <p className="text-sm text-slate-700 whitespace-pre-wrap">{data.notes}</p>
        </div>
      ) : null}
    </div>
  );
}
