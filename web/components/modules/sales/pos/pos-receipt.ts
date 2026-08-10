import type { PosCartItem } from './pos-types';

export type PosReceiptData = {
  receiptId: string;
  date: string;
  customer: string;
  items: PosCartItem[];
  subtotal: number;
  discount: number;
  tax: number;
  taxRate: number;
  total: number;
  note?: string;
};

function receiptHtml(data: PosReceiptData, formatMoney: (n: number) => string): string {
  const rows = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding:4px 0;font-size:12px">${item.name}<br><span style="color:#64748b;font-size:10px">${item.sku}</span></td>
        <td style="text-align:center;font-size:12px">${item.qty}</td>
        <td style="text-align:right;font-size:12px">${formatMoney(item.price * item.qty)}</td>
      </tr>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Receipt ${data.receiptId}</title>
<style>
  body{font-family:system-ui,sans-serif;padding:24px;max-width:360px;margin:0 auto;color:#0f172a}
  h1{font-size:18px;margin:0 0 4px}
  .meta{font-size:11px;color:#64748b;margin-bottom:16px}
  table{width:100%;border-collapse:collapse}
  .totals{margin-top:12px;border-top:1px dashed #cbd5e1;padding-top:8px;font-size:12px}
  .totals div{display:flex;justify-content:space-between;margin:4px 0}
  .grand{font-size:16px;font-weight:800;margin-top:8px}
  .note{margin-top:12px;font-size:11px;color:#475569}
</style></head><body>
  <h1>Toys Factory ERP</h1>
  <div class="meta">Receipt: ${data.receiptId}<br>Date: ${data.date}<br>Customer: ${data.customer}</div>
  <table>
    <thead><tr><th style="text-align:left;font-size:10px;color:#64748b">Item</th><th style="font-size:10px;color:#64748b">Qty</th><th style="text-align:right;font-size:10px;color:#64748b">Amount</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="totals">
    <div><span>Subtotal</span><span>${formatMoney(data.subtotal)}</span></div>
    <div><span>Discount</span><span>${formatMoney(data.discount)}</span></div>
    <div><span>Tax (VAT ${data.taxRate}%)</span><span>${formatMoney(data.tax)}</span></div>
    <div class="grand"><span>Total</span><span>${formatMoney(data.total)}</span></div>
  </div>
  ${data.note ? `<div class="note">Note: ${data.note}</div>` : ''}
  <script>window.onload=function(){window.print();}</script>
</body></html>`;
}

export function printPosReceipt(data: PosReceiptData, formatMoney: (n: number) => string) {
  if (typeof window === 'undefined') return false;
  const html = receiptHtml(data, formatMoney);
  const win = window.open('', '_blank', 'width=420,height=640');
  if (!win) return false;
  win.document.write(html);
  win.document.close();
  return true;
}
