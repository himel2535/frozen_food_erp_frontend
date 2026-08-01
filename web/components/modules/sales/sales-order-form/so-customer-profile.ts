import type { AppState } from '@/lib/state/types';
import { getCustomerProfile } from '@/lib/services/crm-service';

export type SoCustomerSidebarProfile = {
  name: string;
  company: string;
  customerType: string;
  status: string;
  phone: string;
  email: string;
  contactPerson: string;
  address: string;
  paymentTerms: string;
  creditLimit: number;
  outstanding: number;
  openReceivables: number;
  salesOrderCount: number;
  lastOrderDate: string;
};

export function buildCustomerSidebarProfile(appState: AppState, customerId: string): SoCustomerSidebarProfile | null {
  const profile = getCustomerProfile(appState, customerId);
  if (!profile) return null;

  const customer = profile.customer as Record<string, unknown>;
  const financial = (profile.financialSummary ?? {}) as Record<string, unknown>;
  const contacts = (profile.contacts ?? []) as Array<Record<string, unknown>>;
  const primaryContact = contacts.find((c) => c.isPrimary) ?? contacts[0];
  const addresses = (profile.addresses ?? []) as Array<Record<string, unknown>>;
  const billing = addresses.find((a) => a.type === 'billing')
    ?? addresses.find((a) => a.type === 'shipping')
    ?? addresses[0];

  const line1 = String(billing?.line1 ?? '');
  const city = String(billing?.city ?? '');
  const region = String(billing?.region ?? '');
  const postal = String(billing?.postalCode ?? '');
  const country = String(billing?.country ?? '');
  const address = [line1, city, region, postal, country].filter(Boolean).join(', ');

  const salesOrders = (profile.salesOrders ?? []) as Array<Record<string, unknown>>;
  const lastOrder = salesOrders[0];

  return {
    name: String(customer.name ?? ''),
    company: String(customer.company ?? ''),
    customerType: String(customer.customerType ?? customer.segment ?? customer.type ?? '—'),
    status: String(customer.status ?? 'active'),
    phone: String(customer.phone ?? primaryContact?.phone ?? ''),
    email: String(customer.email ?? primaryContact?.email ?? ''),
    contactPerson: String(primaryContact?.name ?? customer.contactPerson ?? ''),
    address: address || String(customer.address ?? ''),
    paymentTerms: String(customer.paymentTerms ?? 'Net 30'),
    creditLimit: Number(financial.creditLimit ?? customer.creditLimit ?? 0),
    outstanding: Number(financial.creditUsed ?? financial.totalDue ?? 0),
    openReceivables: Number(financial.openReceivables ?? 0),
    salesOrderCount: Number(financial.salesOrderCount ?? salesOrders.length),
    lastOrderDate: String(lastOrder?.date ?? financial.lastPurchaseDate ?? ''),
  };
}
