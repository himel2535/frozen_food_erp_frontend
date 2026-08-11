import type { PosCartItem } from './pos-types';

export type PosReceiptCompany = {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  taxId?: string;
};

export type PosReceiptData = {
  receiptId: string;
  date: string;
  displayDate?: string;
  customer: string;
  items: PosCartItem[];
  subtotal: number;
  discount: number;
  tax: number;
  taxRate: number;
  total: number;
  note?: string;
  company?: PosReceiptCompany;
  invoiceId?: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDisplayDate(date: string, displayDate?: string): string {
  if (displayDate) return displayDate;
  const parsed = Date.parse(date);
  if (!Number.isNaN(parsed)) {
    return new Date(parsed).toLocaleString();
  }
  return date;
}

function receiptHtml(data: PosReceiptData, formatMoney: (n: number) => string): string {
  const company = data.company;
  const companyName = escapeHtml(company?.name || 'Toys Factory ERP');
  const address = company?.address ? escapeHtml(company.address) : '';
  const phone = company?.phone ? escapeHtml(company.phone) : '';
  const email = company?.email ? escapeHtml(company.email) : '';
  const taxId = company?.taxId ? escapeHtml(company.taxId) : '';
  const displayDate = escapeHtml(formatDisplayDate(data.date, data.displayDate));
  const customer = escapeHtml(data.customer);
  const receiptId = escapeHtml(data.receiptId);
  const note = data.note ? escapeHtml(data.note) : '';
  const invoiceId = data.invoiceId ? escapeHtml(data.invoiceId) : '';

  const rows = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding:4px 0;font-size:12px">${escapeHtml(item.name)}<br><span style="color:#64748b;font-size:10px">${escapeHtml(item.sku)}</span></td>
        <td style="text-align:center;font-size:12px">${item.qty}</td>
        <td style="text-align:right;font-size:12px">${formatMoney(item.price * item.qty)}</td>
      </tr>`,
    )
    .join('');

  const companyMeta = [
    address,
    phone ? `Tel: ${phone}` : '',
    email,
    taxId ? `TIN: ${taxId}` : '',
  ]
    .filter(Boolean)
    .join('<br>');

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Receipt ${receiptId}</title>
<style>
  body{font-family:system-ui,sans-serif;padding:24px;max-width:360px;margin:0 auto;color:#0f172a}
  h1{font-size:18px;margin:0 0 4px}
  .company{font-size:10px;color:#64748b;margin-bottom:12px;line-height:1.4}
  .meta{font-size:11px;color:#64748b;margin-bottom:16px;line-height:1.5}
  table{width:100%;border-collapse:collapse}
  .totals{margin-top:12px;border-top:1px dashed #cbd5e1;padding-top:8px;font-size:12px}
  .totals div{display:flex;justify-content:space-between;margin:4px 0}
  .grand{font-size:16px;font-weight:800;margin-top:8px}
  .note{margin-top:12px;font-size:11px;color:#475569}
  .thanks{margin-top:16px;text-align:center;font-size:11px;color:#64748b}
</style></head><body>
  <h1>${companyName}</h1>
  ${companyMeta ? `<div class="company">${companyMeta}</div>` : ''}
  <div class="meta">
    Receipt: ${receiptId}<br>
    ${invoiceId ? `Invoice: ${invoiceId}<br>` : ''}
    Date: ${displayDate}<br>
    Customer: ${customer}
  </div>
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
  ${note ? `<div class="note">Note: ${note}</div>` : ''}
  <div class="thanks">Thank you for your purchase!</div>
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

export function receiptFromPosRecord(
  record: Record<string, unknown>,
  fallbacks?: { customer?: string; taxRate?: number; company?: PosReceiptCompany },
): PosReceiptData {
  const date = String(record.date ?? record.at ?? new Date().toISOString());
  const displayDate = String(record.displayDate ?? (record.at ? new Date(String(record.at)).toLocaleString() : date));
  return {
    receiptId: String(record.receiptNo ?? record.receipt ?? record.id ?? 'RCPT'),
    date,
    displayDate,
    customer: String(record.customerName ?? record.customer ?? fallbacks?.customer ?? 'Walk-in Customer'),
    items: (Array.isArray(record.items) ? record.items : []).map((item) => {
      const row = item as Record<string, unknown>;
      const qty = Number(row.qty ?? row.quantity ?? 1);
      const price = Number(row.price ?? row.rate ?? 0);
      return {
        id: String(row.id ?? row.sku ?? row.description ?? ''),
        name: String(row.name ?? row.description ?? 'Item'),
        sku: String(row.sku ?? ''),
        price,
        qty,
        imageEmoji: '🛍️',
        imageGradient: 'from-slate-100 via-zinc-50 to-stone-100',
      };
    }) as PosCartItem[],
    subtotal: Number(record.subtotal ?? record.amount ?? 0),
    discount: Number(record.discount ?? 0),
    tax: Number(record.tax ?? 0),
    taxRate: Number(record.taxRate ?? fallbacks?.taxRate ?? 0),
    total: Number(record.total ?? record.amount ?? 0),
    note: String(record.notes ?? record.note ?? ''),
    company: fallbacks?.company,
    invoiceId: record.invoiceId ? String(record.invoiceId) : undefined,
  };
}
