import type { CustomerFormPayload, CustomerFormValues } from '@/components/modules/crm/CustomerForm';
import { normalizePaymentTerms } from '@/components/modules/crm/CustomerForm';
import { apiRequest } from '@/lib/services/api-client';
import { sanitizeApiCreateBody } from '@/lib/services/api-resource-service';

export type ApiCustomerDoc = {
  _id?: string;
  id?: string;
  name: string;
  company?: string;
  phone?: string;
  email?: string;
  status?: string;
  companyType?: string;
  category?: string;
  pricingTier?: string;
  creditLimit?: number;
  paymentTerms?: string;
  ownerId?: string;
  ownerName?: string;
  billingAddress?: string;
  billingCity?: string;
  shippingAddress?: string;
  shippingCity?: string;
  imageUrl?: string;
  notes?: string;
  totalSales?: number;
  totalDue?: number;
  createdAt?: string;
  updatedAt?: string;
  meta?: Record<string, unknown>;
};

function apiId(doc: ApiCustomerDoc): string {
  return String(doc.id ?? doc._id ?? '');
}

function meta(doc: ApiCustomerDoc): Record<string, unknown> {
  return (doc.meta ?? {}) as Record<string, unknown>;
}

export function mapApiCustomerToListRow(doc: ApiCustomerDoc): Record<string, unknown> {
  const m = meta(doc);
  return {
    id: apiId(doc),
    name: doc.name,
    company: doc.company ?? '',
    phone: doc.phone ?? '',
    email: doc.email ?? '',
    status: doc.status ?? 'active',
    companyType: doc.companyType ?? '',
    category: doc.category ?? doc.pricingTier ?? 'Standard',
    pricingTier: doc.pricingTier ?? 'Standard',
    creditLimit: doc.creditLimit ?? 0,
    paymentTerms: doc.paymentTerms ?? '',
    ownerId: doc.ownerId ?? '',
    ownerName: doc.ownerName ?? '',
    salesRepName: doc.ownerName ?? '',
    imageUrl: doc.imageUrl ?? '',
    notes: doc.notes ?? '',
    totalSales: doc.totalSales ?? 0,
    totalDue: doc.totalDue ?? 0,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    taxVatNumber: m.taxVatNumber ?? '',
    tinNumber: m.tinNumber ?? '',
    tradeLicenseNumber: m.tradeLicenseNumber ?? '',
    businessRegistrationNo: m.businessRegistrationNo ?? '',
    openingBalance: m.openingBalance ?? 0,
    billingArea: m.billingArea ?? '',
    billingRegion: m.billingRegion ?? '',
    shippingArea: m.shippingArea ?? '',
    shippingRegion: m.shippingRegion ?? '',
  };
}

export function mapPayloadToApiBody(payload: CustomerFormPayload) {
  return {
    name: payload.name || payload.contactName,
    company: payload.company,
    phone: payload.phone,
    email: payload.email,
    status: payload.status || 'active',
    companyType: payload.companyType,
    category: payload.pricingTier || 'Standard',
    pricingTier: payload.pricingTier || 'Standard',
    creditLimit: Number(payload.creditLimit || 0),
    paymentTerms: payload.paymentTerms,
    ownerId: payload.ownerId,
    ownerName: payload.ownerName,
    billingAddress: payload.billingAddress,
    billingCity: payload.billingCity,
    shippingAddress: payload.shippingAddress,
    shippingCity: payload.shippingCity,
    imageUrl: payload.imageUrl,
    notes: payload.notes,
    meta: {
      contactName: payload.contactName,
      alternativePhone: payload.alternativePhone,
      taxVatNumber: payload.taxVatNumber,
      tinNumber: payload.tinNumber,
      tradeLicenseNumber: payload.tradeLicenseNumber,
      businessRegistrationNo: payload.businessRegistrationNo,
      openingBalance: payload.openingBalance,
      billingArea: payload.billingArea,
      billingRegion: payload.billingRegion,
      shippingArea: payload.shippingArea,
      shippingRegion: payload.shippingRegion,
    },
  };
}

export function mapApiCustomerToFormValues(
  doc: ApiCustomerDoc,
  ownerIdFallback: string,
): CustomerFormValues {
  const m = meta(doc);
  const billingAddress = String(doc.billingAddress ?? '');
  const shippingAddress = String(doc.shippingAddress ?? m.shippingAddress ?? billingAddress);
  const billingArea = String(m.billingArea ?? '');
  const shippingArea = String(m.shippingArea ?? '');
  const billingCity = String(doc.billingCity ?? '');
  const shippingCity = String(doc.shippingCity ?? '');
  const billingDistrict = String(m.billingRegion ?? '');
  const shippingDistrict = String(m.shippingRegion ?? '');

  return {
    companyName: String(doc.company ?? ''),
    customerType: String(doc.companyType ?? ''),
    contactPerson: String(m.contactName ?? doc.name ?? ''),
    altPhone: String(m.alternativePhone ?? ''),
    mobile: String(doc.phone ?? ''),
    status: String(doc.status ?? 'active'),
    email: String(doc.email ?? ''),
    imageUrl: String(doc.imageUrl ?? ''),
    billingAddress,
    billingArea,
    billingCity,
    billingDistrict,
    shippingAddress,
    shippingArea,
    shippingCity,
    shippingDistrict,
    sameAsBilling:
      billingAddress === shippingAddress
      && billingArea === shippingArea
      && billingCity === shippingCity
      && billingDistrict === shippingDistrict,
    binVat: String(m.taxVatNumber ?? ''),
    tin: String(m.tinNumber ?? ''),
    tradeLicense: String(m.tradeLicenseNumber ?? ''),
    businessReg: String(m.businessRegistrationNo ?? ''),
    openingBalance: String(m.openingBalance ?? '0'),
    creditLimit: String(doc.creditLimit ?? '0'),
    paymentTerms: normalizePaymentTerms(String(doc.paymentTerms ?? '')),
    priceLevel: String(doc.pricingTier ?? 'Standard'),
    ownerId: String(doc.ownerId ?? ownerIdFallback),
    notes: String(doc.notes ?? ''),
  };
}

export async function fetchCustomersFromApi(): Promise<Record<string, unknown>[]> {
  const { data } = await apiRequest<ApiCustomerDoc[]>('/customers?limit=100');
  return (data ?? []).map(mapApiCustomerToListRow);
}

export async function fetchCustomerFromApi(id: string): Promise<ApiCustomerDoc | null> {
  try {
    const { data } = await apiRequest<ApiCustomerDoc>(`/customers/${id}`);
    return data ?? null;
  } catch {
    return null;
  }
}

export async function createCustomerViaApi(payload: CustomerFormPayload): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    const { data } = await apiRequest<ApiCustomerDoc>('/customers', {
      method: 'POST',
      body: JSON.stringify(sanitizeApiCreateBody(mapPayloadToApiBody(payload))),
    });
    const id = apiId(data);
    if (!id) return { ok: false, error: 'Missing customer id from API' };
    return { ok: true, id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Create failed' };
  }
}

export async function updateCustomerViaApi(
  id: string,
  payload: CustomerFormPayload,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await apiRequest<ApiCustomerDoc>(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(mapPayloadToApiBody(payload)),
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Update failed' };
  }
}

export async function deleteCustomerViaApi(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await apiRequest<null>(`/customers/${id}`, { method: 'DELETE' });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Delete failed' };
  }
}

export function exportCustomersCsvFromRows(rows: Array<Record<string, unknown>>): string {
  const headers = ['id', 'name', 'company', 'phone', 'email', 'status', 'totalSales', 'totalDue'];
  const lines = rows.map((row) => headers.map((h) => JSON.stringify(row[h] ?? '')).join(','));
  return [headers.join(','), ...lines].join('\n');
}
