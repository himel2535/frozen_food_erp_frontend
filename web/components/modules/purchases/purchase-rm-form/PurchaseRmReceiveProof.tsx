'use client';

import { FileCheck, ExternalLink, X } from 'lucide-react';
import type { PurchaseRmReceiveProof } from '@/lib/services/purchase-rm-service';
import { formatPoMoney } from '@/lib/services/purchase-rm-service';

const PROOF_TYPE_LABELS: Record<string, string> = {
  receipt: 'Receipt (Roshid)',
  bank: 'Bank Transaction',
  other: 'Other',
};

export function PurchaseRmReceiveProofCard({
  proof,
  onDismiss,
}: {
  proof: PurchaseRmReceiveProof;
  onDismiss?: () => void;
}) {
  return (
    <section className="premium-card premium-shadow p-4 md:p-5 space-y-4 border border-blue-200/60 bg-blue-50/30">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <span className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
            <FileCheck className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <h4 className="text-sm font-extrabold text-slate-900 tracking-tight">Purchase Proof / GRN</h4>
            <p className="text-[11px] font-semibold text-blue-700 mt-0.5">
              {proof.id} · {proof.date}
            </p>
          </div>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-100 cursor-pointer shrink-0"
            aria-label="Dismiss proof"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
        <div className="rounded-lg border border-slate-200/80 bg-white/80 px-3 py-2">
          <p className="text-[10px] font-bold uppercase text-slate-500">RM Order</p>
          <p className="font-bold text-slate-900 mt-0.5">{proof.poId}</p>
        </div>
        <div className="rounded-lg border border-slate-200/80 bg-white/80 px-3 py-2">
          <p className="text-[10px] font-bold uppercase text-slate-500">Supplier</p>
          <p className="font-semibold text-slate-800 mt-0.5">{proof.supplierName || '—'}</p>
        </div>
        <div className="rounded-lg border border-slate-200/80 bg-white/80 px-3 py-2">
          <p className="text-[10px] font-bold uppercase text-slate-500">Warehouse</p>
          <p className="font-semibold text-slate-800 mt-0.5">{proof.warehouseName || '—'}</p>
        </div>
        <div className="rounded-lg border border-slate-200/80 bg-white/80 px-3 py-2">
          <p className="text-[10px] font-bold uppercase text-slate-500">Received By</p>
          <p className="font-semibold text-slate-800 mt-0.5">{proof.receivedBy || '—'}</p>
        </div>
      </div>

      {proof.attachments && proof.attachments.length > 0 && (
        <div className="rounded-xl border border-slate-200/80 bg-white/90 p-3 space-y-2">
          <p className="text-[10px] font-bold uppercase text-slate-500">Uploaded Proof</p>
          {proof.attachments.map((file, index) => (
            <div key={`${file.name}-${index}`} className="flex items-center justify-between gap-2 text-xs">
              <div>
                <p className="font-semibold text-slate-800">{file.name}</p>
                <p className="text-[10px] text-slate-500">{PROOF_TYPE_LABELS[file.type] ?? file.type}</p>
              </div>
              <a
                href={file.dataUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold hover:bg-blue-100 cursor-pointer"
              >
                View proof <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ))}
          {proof.proofNote && (
            <p className="text-[11px] text-slate-600 pt-1 border-t border-slate-100">{proof.proofNote}</p>
          )}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200/80 bg-white">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-[10px] font-bold uppercase text-slate-500 border-b border-slate-100">
              <th className="py-2.5 px-3 text-left">Product</th>
              <th className="py-2.5 px-3 text-right">Qty Received</th>
              <th className="py-2.5 px-3 text-left">Unit</th>
              <th className="py-2.5 px-3 text-right">Unit Cost</th>
              <th className="py-2.5 px-3 text-right">Line Total</th>
            </tr>
          </thead>
          <tbody>
            {proof.items.map((item, index) => (
              <tr key={`${item.sku}-${index}`} className="border-t border-slate-100">
                <td className="py-2 px-3 font-semibold text-slate-800">{item.productName}</td>
                <td className="py-2 px-3 text-right font-bold">{item.qty.toLocaleString()}</td>
                <td className="py-2 px-3 text-slate-600">{item.unit}</td>
                <td className="py-2 px-3 text-right">{formatPoMoney(item.unitPrice)}</td>
                <td className="py-2 px-3 text-right font-bold">{formatPoMoney(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <div className="w-full max-w-xs rounded-xl border border-slate-200/80 bg-white/90 p-3 text-xs space-y-1">
          <p className="flex justify-between"><span>Sub Total</span><strong>{formatPoMoney(proof.subTotal)}</strong></p>
          <p className="flex justify-between"><span>VAT</span><strong>{formatPoMoney(proof.vat)}</strong></p>
          {proof.ait > 0 && (
            <p className="flex justify-between"><span>AIT</span><strong>{formatPoMoney(proof.ait)}</strong></p>
          )}
          <p className="flex justify-between font-extrabold text-blue-700 pt-2 border-t border-slate-200">
            <span>Grand Total</span>
            <span>{formatPoMoney(proof.grandTotal)}</span>
          </p>
        </div>
      </div>
    </section>
  );
}

export function historyEntryToProof(entry: Record<string, unknown>): PurchaseRmReceiveProof | null {
  if (!entry.id || !Array.isArray(entry.items)) return null;
  return {
    id: String(entry.id),
    date: String(entry.date ?? ''),
    poId: String(entry.poId ?? ''),
    supplierName: String(entry.supplierName ?? ''),
    warehouseName: String(entry.warehouseName ?? ''),
    receivedBy: String(entry.receivedBy ?? ''),
    qty: Number(entry.qty ?? 0),
    note: String(entry.note ?? ''),
    proofType: entry.proofType ? String(entry.proofType) : undefined,
    proofNote: entry.proofNote ? String(entry.proofNote) : undefined,
    attachments: Array.isArray(entry.attachments)
      ? (entry.attachments as PurchaseRmReceiveProof['attachments'])
      : undefined,
    items: (entry.items as PurchaseRmReceiveProof['items']),
    subTotal: Number(entry.subTotal ?? 0),
    vat: Number(entry.vat ?? 0),
    ait: Number(entry.ait ?? 0),
    grandTotal: Number(entry.grandTotal ?? 0),
  };
}
