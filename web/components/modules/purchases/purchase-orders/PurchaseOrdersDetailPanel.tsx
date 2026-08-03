'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Package, FileText, MessageSquare, Activity } from 'lucide-react';
import { formatMoney, findBillsForPurchaseOrder } from '@/lib/services/purchases-service';
import type { PoLineItem } from '@/lib/services/purchases-service';
import type { AppState } from '@/lib/state/types';
import { buildPoActivityTimeline } from './purchase-orders-utils';
import { PO_CARD_CLS } from './purchase-orders-styles';

const BOTTOM_TABS = [
  { id: 'items', label: 'Items', icon: Package },
  { id: 'notes', label: 'Notes', icon: MessageSquare },
  { id: 'bills', label: 'Bills', icon: FileText },
  { id: 'activity', label: 'Activity', icon: Activity },
] as const;

export function PurchaseOrdersDetailPanel({
  po,
  appState,
  bottomTab,
  onTabChange,
}: {
  po: Record<string, unknown>;
  appState: AppState;
  bottomTab: string;
  onTabChange: (tab: string) => void;
}) {
  const items = (Array.isArray(po.items) ? po.items : []) as PoLineItem[];
  const totals = po.totals as Record<string, unknown> | undefined;
  const bills = useMemo(() => findBillsForPurchaseOrder(appState, po), [appState, po]);
  const timeline = buildPoActivityTimeline(po);

  const subtotal = Number(totals?.subtotal ?? po.subtotal ?? 0);
  const taxAmount = Number(totals?.taxAmount ?? po.taxAmount ?? 0);
  const discountAmount = Number(totals?.discountAmount ?? po.discountAmount ?? 0);
  const total = Number(totals?.total ?? po.total ?? 0);
  const paidAmount = Number(po.paidAmount ?? 0);
  const balanceDue = Number(po.balanceDue ?? Math.max(0, total - paidAmount));

  return (
    <div className={PO_CARD_CLS}>
      <div className="flex flex-wrap gap-1 p-2 border-b border-slate-100">
        {BOTTOM_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
              bottomTab === tab.id ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" /> {tab.label}
          </button>
        ))}
      </div>

      <div className="p-4">
        {bottomTab === 'items' && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-4">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[10px] font-bold uppercase text-slate-500">
                    <th className="py-2 text-left">Description</th>
                    <th className="py-2 text-right">Qty</th>
                    <th className="py-2 text-right">Rate</th>
                    <th className="py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-4 text-slate-400 text-center">
                        No line items.
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => (
                      <tr key={item.id} className="border-t border-slate-100">
                        <td className="py-2 font-semibold">{item.description || '—'}</td>
                        <td className="py-2 text-right">
                          {item.qty.toLocaleString()} {item.unit}
                        </td>
                        <td className="py-2 text-right">{formatMoney(item.rate)}</td>
                        <td className="py-2 text-right font-bold">{formatMoney(item.amount)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-xs space-y-1">
              <p className="flex justify-between">
                <span>Subtotal</span>
                <strong>{formatMoney(subtotal)}</strong>
              </p>
              {discountAmount > 0 && (
                <p className="flex justify-between">
                  <span>Discount</span>
                  <strong>-{formatMoney(discountAmount)}</strong>
                </p>
              )}
              <p className="flex justify-between">
                <span>Tax</span>
                <strong>{formatMoney(taxAmount)}</strong>
              </p>
              <p className="flex justify-between font-extrabold text-blue-700 pt-2 border-t border-slate-200">
                <span>Total</span>
                <span>{formatMoney(total)}</span>
              </p>
              <p className="flex justify-between text-emerald-700">
                <span>Paid</span>
                <strong>{formatMoney(paidAmount)}</strong>
              </p>
              <p className="flex justify-between text-rose-600">
                <span>Balance</span>
                <strong>{formatMoney(balanceDue)}</strong>
              </p>
            </div>
          </div>
        )}

        {bottomTab === 'notes' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-3">
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-500 mb-1">Notes</p>
                <p className="text-slate-700 leading-relaxed">{String(po.notes ?? '—')}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-500 mb-1">Payment Terms</p>
                <p className="text-slate-700">{String(po.terms ?? '—')}</p>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-500 mb-1">Shipping Address</p>
              <p className="text-slate-700 leading-relaxed">{String(po.shippingAddress ?? '—')}</p>
            </div>
          </div>
        )}

        {bottomTab === 'bills' && (
          <div className="space-y-3 text-xs">
            {bills.length === 0 ? (
              <p className="text-slate-500">
                {String(po.status) === 'Sent'
                  ? 'Bill will be created when this order is received.'
                  : 'No vendor bill linked yet.'}
              </p>
            ) : (
              bills.map((bill) => {
                const billId = String(bill.id ?? bill.invoiceId ?? '');
                const amount = Number(bill.amount ?? bill.total ?? 0);
                return (
                  <div
                    key={billId}
                    className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 grid grid-cols-1 sm:grid-cols-2 gap-2"
                  >
                    <p>
                      <span className="font-bold text-slate-500">Bill #:</span> {billId}
                    </p>
                    <p>
                      <span className="font-bold text-slate-500">Supplier:</span>{' '}
                      {String(bill.supplier ?? bill.partyName ?? po.supplier ?? '—')}
                    </p>
                    <p>
                      <span className="font-bold text-slate-500">Amount:</span> {formatMoney(amount)}
                    </p>
                    <p>
                      <span className="font-bold text-slate-500">Due Date:</span>{' '}
                      {String(bill.dueDate ?? '—')}
                    </p>
                    <p>
                      <span className="font-bold text-slate-500">Status:</span>{' '}
                      {String(bill.status ?? '—')}
                    </p>
                    <p>
                      <span className="font-bold text-slate-500">Reference:</span> {String(po.id)}
                    </p>
                  </div>
                );
              })
            )}
            <Link
              href="/purchases/bills"
              className="inline-flex text-blue-700 font-bold hover:underline cursor-pointer"
            >
              Open in Vendor Bills
            </Link>
          </div>
        )}

        {bottomTab === 'activity' && (
          <div className="space-y-3">
            {timeline.map((entry, i) => (
              <div key={i} className="flex gap-3 text-xs">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                <div>
                  <p className="font-semibold text-slate-800">{entry.label}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {entry.at.slice(0, 10)}
                    {entry.by ? ` · ${entry.by}` : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
