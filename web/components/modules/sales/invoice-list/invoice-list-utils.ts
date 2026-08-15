import type { AppState } from '@/lib/state/types';
import { getCustomerProfile } from '@/lib/services/crm-service';
import { resolveInvoiceSignature } from '@/lib/services/settings-service';
import type { InvoicePayload } from '@/components/modules/sales/invoice-form/inv-form-types';
import { computeInvoiceTotalsFromItems, createEmptyLineItem, recalcLineItem } from '@/components/modules/sales/invoice-form/inv-form-types';

export function resolveInvoiceIssueDate(row: Record<string, unknown>): string {
  const raw = String(row.issueDate ?? row.date ?? '').trim();
  if (!raw) return '';
  return raw.split('T')[0];
}

export function matchesInvoiceDate(row: Record<string, unknown>, isoDate: string): boolean {
  if (!isoDate) return true;
  return resolveInvoiceIssueDate(row) === isoDate;
}

export function displayInvoiceAsCash(row: Record<string, unknown>): Record<string, unknown> {
  const rawStatus = String(row.status ?? 'paid').toLowerCase();
  const status = rawStatus === 'cancelled'
    ? 'cancelled'
    : rawStatus === 'draft' || rawStatus === 'sent'
      ? rawStatus
      : 'paid';
  const total = Number(row.amount ?? row.total ?? 0);
  const cancelled = status === 'cancelled';
  return {
    ...row,
    status,
    paid: cancelled ? 0 : total,
    due: 0,
  };
}

function formatAddress(address: Record<string, unknown> | undefined) {
  if (!address) return '';
  const line1 = String(address.line1 ?? '');
  const city = String(address.city ?? '');
  const region = String(address.region ?? '');
  const postal = String(address.postalCode ?? '');
  const country = String(address.country ?? '');
  return [line1, city, region, postal, country].filter(Boolean).join(', ');
}

export function enrichPrintPayload(appState: AppState, payload: InvoicePayload): InvoicePayload {
  const profile = payload.customerId ? getCustomerProfile(appState, payload.customerId) : null;
  const contacts = (profile?.contacts ?? []) as Array<Record<string, unknown>>;
  const addresses = (profile?.addresses ?? []) as Array<Record<string, unknown>>;
  const primary = contacts.find((c) => c.primary) ?? contacts[0];
  const shipping = addresses.find((a) => a.type === 'shipping') ?? addresses[0];

  const paidAmount = payload.status.toLowerCase() === 'cancelled' ? 0 : Number(payload.totals.total);

  return {
    ...payload,
    paidAmount,
    balanceDue: 0,
    approvalStatus: payload.approvalStatus ?? 'pending',
    shippingAddress: payload.shippingAddress || formatAddress(shipping) || payload.billingAddress,
    customerEmail: payload.customerEmail || String(primary?.email ?? ''),
    customerPhone: payload.customerPhone || String(primary?.phone ?? ''),
    signature: resolveInvoiceSignature(appState, payload.includeSignature, payload.signatureId),
  };
}

export function buildPrintPayloadFromRow(
  appState: AppState,
  row: Record<string, unknown>,
): { id: string; data: InvoicePayload } {
  const cashRow = displayInvoiceAsCash(row);
  const items = (Array.isArray(cashRow.items) ? cashRow.items : []) as Record<string, unknown>[];
  const lineItems = items.length
    ? items.map((item, index) =>
        recalcLineItem({
          id: String(item.id ?? `line-${index + 1}`),
          productId: String(item.productId ?? ''),
          description: String(item.description ?? item.name ?? ''),
          qty: Number(item.qty ?? item.quantity ?? 1),
          rate: Number(item.rate ?? item.price ?? 0),
          discountPct: Number(item.discountPct ?? 0),
          taxLabel: String(item.taxLabel ?? 'No Tax'),
          amount: Number(item.amount ?? item.total ?? 0),
        }),
      )
    : [];

  const totals = computeInvoiceTotalsFromItems(lineItems, {
    docDiscountOverride: row.discountAmount != null ? Number(row.discountAmount) : null,
    docTaxOverride: row.taxAmount != null ? Number(row.taxAmount) : null,
  });

  const base: InvoicePayload = {
    customerId: String(row.customerId ?? ''),
    customerName: String(row.customerName ?? row.customer ?? ''),
    billingAddress: String(row.billingAddress ?? ''),
    issueDate: String(row.issueDate ?? row.date ?? ''),
    dueDate: String(cashRow.issueDate ?? cashRow.date ?? ''),
    status: String(cashRow.status ?? 'paid'),
    notes: String(cashRow.notes ?? ''),
    terms: String(cashRow.terms ?? cashRow.paymentTerms ?? ''),
    docDiscountOverride: null,
    docTaxOverride: null,
    includeSignature: Boolean(cashRow.includeSignature),
    signatureId: cashRow.signatureId ? String(cashRow.signatureId) : null,
    items: lineItems.length ? lineItems : [createEmptyLineItem()],
    invoiceNo: String(cashRow.id),
    totals,
    paidAmount: String(cashRow.status ?? '').toLowerCase() === 'cancelled' ? 0 : totals.total,
    balanceDue: 0,
    approvalStatus: String(row.approvalStatus ?? 'pending'),
  };

  return {
    id: String(row.id),
    data: enrichPrintPayload(appState, base),
  };
}

export function exportInvoicesCsv(
  rows: Record<string, unknown>[],
  resolveCustomer: (row: Record<string, unknown>) => string,
) {
  const headers = ['Invoice', 'Customer', 'Issue Date', 'Total', 'Paid', 'Status'];
  const lines = rows.map((row) => [
    String(row.id ?? ''),
    resolveCustomer(row),
    String(row.issueDate ?? row.date ?? ''),
    String(row.total ?? row.amount ?? 0),
    String(row.total ?? row.amount ?? 0),
    String(row.status ?? ''),
  ]);
  return [headers, ...lines]
    .map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
}
