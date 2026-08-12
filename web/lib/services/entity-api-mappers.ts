import type { ProductFormPayload } from '@/components/modules/inventory/product-form/product-form-types';
import type { SupplierFormValues } from '@/components/modules/purchases/suppliers/SupplierForm';
import { API_RESOURCE_PATHS } from '@/lib/config/data-source';
import { apiDocId, createResource, updateResource } from '@/lib/services/api-resource-service';

function meta(doc: Record<string, unknown>): Record<string, unknown> {
  return (doc.meta ?? {}) as Record<string, unknown>;
}

export function mapApiProductRow(doc: Record<string, unknown>): Record<string, unknown> {
  const m = meta(doc);
  const ws = (doc.warehouseStock ?? {}) as Record<string, number>;
  const stock = doc.stock != null
    ? Number(doc.stock)
    : Object.values(ws).reduce((s, v) => s + Number(v || 0), 0);
  return {
    id: apiDocId(doc),
    name: doc.name,
    sku: doc.sku ?? '',
    category: doc.category ?? '',
    productType: doc.productType ?? 'Finished Goods',
    cost: doc.cost ?? 0,
    price: doc.price ?? 0,
    wholesalePrice: doc.wholesalePrice ?? 0,
    taxRate: doc.taxRate ?? 0,
    stock,
    minStock: doc.minStock ?? 0,
    reorderLevel: doc.reorderLevel ?? 0,
    uom: doc.uom ?? 'pcs',
    defaultWarehouse: doc.defaultWarehouse ?? '',
    warehouseStock: ws,
    reserved: m.reserved ?? 0,
    barcode: m.barcode ?? '',
    imageUrl: doc.imageUrl ?? '',
    description: doc.description ?? '',
    status: doc.status ?? 'active',
    discontinued: doc.discontinued ?? false,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export function mapProductPayloadToApi(body: ProductFormPayload): Record<string, unknown> {
  const stockTotal = Object.values(body.warehouseStock).reduce((s, v) => s + Number(v || 0), 0);
  const payload: Record<string, unknown> = {
    name: body.name,
    category: body.category,
    productType: body.productType || 'Finished Goods',
    cost: body.cost,
    price: body.price,
    wholesalePrice: body.wholesalePrice,
    taxRate: body.taxRate,
    stock: stockTotal,
    minStock: body.minStock,
    reorderLevel: body.reorderLevel,
    uom: body.uom,
    defaultWarehouse: body.defaultWarehouse,
    warehouseStock: body.warehouseStock,
    imageUrl: body.imageUrl,
    description: body.description,
    status: body.discontinued ? 'discontinued' : 'active',
    discontinued: body.discontinued,
    meta: {
      barcode: body.barcode,
      reserved: body.reserved,
    },
  };
  if (body.sku?.trim()) payload.sku = body.sku.trim();
  return payload;
}

export function mapApiSupplierRow(doc: Record<string, unknown>): Record<string, unknown> {
  const m = meta(doc);
  const status = String(doc.status ?? 'active') as 'active' | 'inactive';
  const payable = Number(doc.due ?? 0);
  const createdAt = String(doc.createdAt ?? '').slice(0, 10) || new Date().toISOString().slice(0, 10);
  return {
    id: apiDocId(doc),
    name: doc.name,
    code: doc.code ?? apiDocId(doc).slice(-6).toUpperCase(),
    contact: doc.contactName ?? m.contact ?? '',
    contactName: doc.contactName ?? m.contact ?? '',
    phone: doc.phone ?? '',
    email: doc.email ?? '',
    category: doc.category ?? 'General',
    paymentTerms: doc.paymentTerms ?? 'Net 30',
    terms: doc.paymentTerms ?? 'Net 30',
    termsSubLabel: doc.paymentTerms ?? 'Net 30',
    status,
    recordStatus: status,
    listStatus: payable > 0 ? 'payment_due' : 'clear',
    statusLabel: status === 'active' ? 'Active' : 'Inactive',
    address: doc.address ?? '',
    location: doc.city ?? '',
    city: doc.city ?? '',
    country: doc.country ?? '',
    due: payable,
    payable,
    payableSubLabel: payable > 0 ? 'Outstanding' : 'Clear',
    dueDate: '',
    balance: doc.balance ?? 0,
    creditLimit: doc.creditLimit ?? 0,
    totalPurchase: 0,
    lastPurchaseDate: '',
    imageUrl: doc.imageUrl ?? '',
    notes: doc.notes ?? '',
    lead: m.lead ?? '',
    leadTime: m.lead ?? '',
    rating: m.rating ?? undefined,
    createdAt,
    updatedAt: doc.updatedAt,
  };
}

export function mapSupplierFormToApi(values: SupplierFormValues): Record<string, unknown> {
  return {
    name: values.name.trim(),
    contactName: values.contact.trim(),
    phone: values.phone.trim(),
    email: values.email.trim() || undefined,
    category: values.category,
    paymentTerms: values.paymentTerms,
    status: values.status,
    address: values.address.trim() || undefined,
    imageUrl: values.imageUrl.trim(),
    notes: values.notes.trim() || undefined,
    meta: {
      contact: values.contact.trim(),
      lead: values.lead.trim() || undefined,
      rating: values.rating ? Number(values.rating) : undefined,
    },
  };
}

export function mapApiEmployeeRow(doc: Record<string, unknown>): Record<string, unknown> {
  const mongoId = apiDocId(doc);
  return {
    id: mongoId,
    legacyId: doc.legacyId ?? '',
    employeeCode: doc.employeeCode ?? doc.legacyId ?? '',
    name: doc.name,
    employeeType: doc.employeeType ?? 'Staff',
    department: doc.department ?? '',
    designation: doc.designation ?? '',
    phone: doc.phone ?? '',
    email: doc.email ?? '',
    joiningDate: doc.joiningDate ?? '',
    status: doc.status ?? 'active',
    salary: doc.salary ?? 0,
    salaryStructureId: String((doc.meta as Record<string, unknown> | undefined)?.salaryStructureId ?? doc.salaryStructureId ?? ''),
    meta: doc.meta ?? {},
    manager: doc.manager ?? '',
    address: doc.address ?? '',
    city: doc.city ?? '',
    imageUrl: doc.imageUrl ?? '',
    notes: doc.notes ?? '',
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    _mongoId: mongoId,
  };
}

const EMPLOYEE_API_TYPES = new Set(['Staff', 'Worker', 'Contract']);
const EMPLOYEE_API_STATUSES = new Set(['active', 'inactive', 'on-leave', 'terminated']);

function normalizeEmployeeApiType(value: string): string {
  const trimmed = value.trim();
  if (EMPLOYEE_API_TYPES.has(trimmed)) return trimmed;
  if (trimmed === 'Manager' || trimmed === 'Executive') return 'Staff';
  return 'Worker';
}

function normalizeEmployeeApiStatus(value: string): string {
  const trimmed = value.trim().toLowerCase();
  if (trimmed === 'on leave') return 'on-leave';
  if (EMPLOYEE_API_STATUSES.has(trimmed)) return trimmed;
  return 'active';
}

export function mapApiSalesOrderRow(doc: Record<string, unknown>): Record<string, unknown> {
  const m = meta(doc);
  const id = String(doc.legacyId ?? apiDocId(doc));
  return {
    id,
    customer: doc.customer ?? doc.customerName ?? '',
    customerId: doc.customerId ?? '',
    customerName: doc.customerName ?? doc.customer ?? '',
    date: doc.date ?? '',
    status: doc.status ?? 'draft',
    items: doc.items ?? [],
    subtotal: doc.subtotal ?? 0,
    discount: doc.discount ?? 0,
    discountAmount: doc.discount ?? 0,
    tax: doc.tax ?? 0,
    taxAmount: doc.tax ?? 0,
    total: doc.total ?? 0,
    notes: doc.notes ?? '',
    expectedDelivery: m.expectedDelivery ?? doc.expectedDelivery ?? '',
    deliveryDate: m.expectedDelivery ?? doc.expectedDelivery ?? '',
    reference: m.reference ?? doc.reference ?? '',
    salesPersonId: m.salesPersonId ?? doc.salesPersonId ?? '',
    salesPersonName: m.salesPersonName ?? doc.salesPersonName ?? '',
    deliveryAddress: m.deliveryAddress ?? doc.deliveryAddress ?? '',
    shippingAddress: m.deliveryAddress ?? doc.deliveryAddress ?? '',
    terms: m.terms ?? doc.terms ?? '',
    paymentStatus: m.paymentStatus ?? doc.paymentStatus ?? 'unpaid',
    paidAmount: m.paidAmount ?? doc.paidAmount ?? 0,
    balanceDue: m.balanceDue ?? doc.balanceDue ?? 0,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    _mongoId: apiDocId(doc),
  };
}

export function mapApiInvoiceRow(doc: Record<string, unknown>): Record<string, unknown> {
  const id = String(doc.legacyId ?? apiDocId(doc));
  const total = Number(doc.amount ?? doc.total ?? 0);
  const paid = Number(doc.paid ?? 0);
  const due = Number(doc.due ?? Math.max(0, total - paid));
  const customerId = String(doc.customerId ?? doc.customer ?? '');
  return {
    id,
    legacyId: doc.legacyId ?? id,
    customerId,
    customerName: doc.customerName ?? '',
    customer: doc.customerName ?? doc.customer ?? '',
    issueDate: doc.issueDate ?? doc.date ?? '',
    date: doc.date ?? doc.issueDate ?? '',
    dueDate: doc.dueDate ?? '',
    status: doc.status ?? 'pending',
    items: doc.items ?? [],
    amount: total,
    paid,
    due,
    discount: doc.discount ?? 0,
    tax: doc.tax ?? 0,
    notes: doc.notes ?? '',
    total,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    _mongoId: apiDocId(doc),
  };
}

const INVOICE_API_STATUSES = new Set(['draft', 'pending', 'paid', 'overdue', 'cancelled']);

function normalizeInvoiceApiStatus(record: Record<string, unknown>): string {
  const total = Number(record.total ?? record.amount ?? 0);
  const paid = Number(record.paid ?? 0);
  const due = Number(record.due ?? Math.max(total - paid, 0));
  const raw = String(record.status ?? 'pending').toLowerCase();
  const dueDate = String(record.dueDate ?? '');
  const today = new Date().toISOString().slice(0, 10);

  if (raw === 'cancelled') return 'cancelled';
  if (due <= 0 && total > 0) return 'paid';
  if (raw === 'draft') return 'draft';
  if (due > 0 && dueDate && dueDate < today) return 'overdue';
  if (INVOICE_API_STATUSES.has(raw)) return raw;
  return 'pending';
}

function mapInvoiceItemsToApi(items: unknown[]) {
  return items.map((item) => {
    const row = item as Record<string, unknown>;
    return {
      name: row.name ?? row.description ?? 'Line item',
      description: row.description ?? row.name ?? 'Line item',
      qty: Number(row.qty ?? row.quantity ?? 1),
      price: Number(row.price ?? row.rate ?? 0),
      total: Number(row.total ?? 0),
    };
  });
}

export function mapInvoiceRecordToApi(record: Record<string, unknown>, existingLegacyId?: string): Record<string, unknown> {
  const items = mapInvoiceItemsToApi(Array.isArray(record.items) ? record.items : []);
  const total = Number(record.total ?? record.amount ?? 0);
  const paid = Number(record.paid ?? 0);
  const due = Number(record.due ?? Math.max(total - paid, 0));
  const body: Record<string, unknown> = {
    customerId: record.customerId,
    customerName: record.customerName ?? record.customer,
    issueDate: record.issueDate ?? record.date,
    date: record.date ?? record.issueDate,
    dueDate: record.dueDate,
    status: normalizeInvoiceApiStatus({ ...record, total, paid, due }),
    items,
    amount: total,
    paid,
    due,
    discount: record.discountAmount ?? record.discount ?? 0,
    tax: record.taxAmount ?? record.tax ?? 0,
    notes: record.notes,
    meta: {
      billingAddress: record.billingAddress,
      terms: record.terms ?? record.paymentTerms,
      includeSignature: record.includeSignature,
      signatureId: record.signatureId,
    },
  };
  if (existingLegacyId?.trim()) body.legacyId = existingLegacyId.trim();
  return body;
}

const PAYMENT_API_STATUSES = new Set(['pending', 'completed', 'failed', 'refunded']);

export function mapPaymentRecordToApi(record: Record<string, unknown>): Record<string, unknown> {
  const raw = String(record.status ?? 'completed').toLowerCase();
  let status = 'completed';
  if (PAYMENT_API_STATUSES.has(raw)) status = raw;
  else if (raw === 'received' || raw === 'paid') status = 'completed';

  return {
    customerId: record.customerId,
    customerName: record.customerName ?? record.customer,
    customer: record.customerName ?? record.customer,
    date: record.date,
    amount: Number(record.amount ?? 0),
    method: record.method ?? 'Cash',
    status,
    invoiceId: record.invoiceId ?? null,
    notes: record.notes ?? record.reference ?? '',
    meta: {
      reference: record.reference,
      transactionId: record.transactionId,
    },
  };
}

export function mapVendorBillRecordToApi(record: Record<string, unknown>): Record<string, unknown> {
  const amount = Number(record.amount ?? record.total ?? 0);
  const paid = Number(record.paid ?? 0);
  const due = Number(record.due ?? Math.max(0, amount - paid));
  return {
    supplierId: record.supplierId,
    supplier: record.supplier ?? record.supplierName ?? record.partyName,
    supplierName: record.supplierName ?? record.supplier ?? record.partyName,
    amount,
    total: amount,
    paid,
    due,
    dueDate: record.dueDate,
    date: record.date ?? record.invoiceDate,
    invoiceDate: record.invoiceDate ?? record.date,
    invoiceId: record.invoiceId ?? record.id,
    status: due <= 0 ? 'paid' : String(record.status ?? 'posted'),
    notes: record.notes,
  };
}

export function mapSalesOrderRecordToApi(record: Record<string, unknown>, existingLegacyId?: string): Record<string, unknown> {
  const items = (Array.isArray(record.items) ? record.items : []).map((item: Record<string, unknown>) => ({
    description: item.description ?? item.name,
    name: item.name ?? item.description,
    sku: item.productId ?? item.sku,
    qty: Number(item.qty ?? item.quantity ?? 1),
    rate: Number(item.rate ?? item.price ?? 0),
    price: Number(item.rate ?? item.price ?? 0),
    total: Number(item.amount ?? item.total ?? 0),
  }));

  const body: Record<string, unknown> = {
    customerId: record.customerId,
    customer: record.customer ?? record.customerName,
    customerName: record.customerName ?? record.customer,
    date: record.date,
    status: record.status ?? 'draft',
    items,
    subtotal: Number(record.subtotal ?? 0),
    discount: Number(record.discountAmount ?? record.discount ?? 0),
    tax: Number(record.taxAmount ?? record.tax ?? 0),
    total: Number(record.total ?? 0),
    notes: record.notes,
    meta: {
      expectedDelivery: record.expectedDelivery ?? record.deliveryDate,
      reference: record.reference,
      sourceQuotationId: record.sourceQuotationId,
      salesPersonId: record.salesPersonId,
      salesPersonName: record.salesPersonName,
      deliveryAddress: record.deliveryAddress ?? record.shippingAddress,
      terms: record.terms,
      paymentStatus: record.paymentStatus,
      paidAmount: record.paidAmount,
      balanceDue: record.balanceDue,
    },
  };
  if (existingLegacyId?.trim()) body.legacyId = existingLegacyId.trim();
  return body;
}

export function findApiSalesOrderRow(
  docs: Record<string, unknown>[],
  orderId: string,
): Record<string, unknown> | null {
  const match = docs.find((doc) => {
    const legacy = String(doc.legacyId ?? '');
    const id = apiDocId(doc);
    return legacy === orderId || id === orderId || String(doc.id) === orderId;
  });
  return match ? mapApiSalesOrderRow(match) : null;
}

export function mapEmployeeFormToApi(values: Record<string, string>, options?: { forCreate?: boolean }): Record<string, unknown> {
  const email = values.email?.trim();
  const body: Record<string, unknown> = {
    name: values.name?.trim(),
    phone: values.phone?.trim() || undefined,
    department: values.department?.trim() || undefined,
    designation: values.designation?.trim() || undefined,
    joiningDate: values.joiningDate || undefined,
    employeeType: normalizeEmployeeApiType(values.employeeType || 'Worker'),
    status: normalizeEmployeeApiStatus(values.status || 'active'),
    salary: Number(values.salary ?? 0) || 0,
    address: values.address?.trim() || undefined,
    notes: values.notes?.trim() || undefined,
    imageUrl: values.imageUrl?.trim() || undefined,
    meta: {
      nid: values.nid?.trim() || undefined,
      emergencyPhone: values.emergencyPhone?.trim() || undefined,
      paymentMethod: values.paymentMethod || 'Cash',
      salaryStructureId: values.salaryStructureId || undefined,
    },
  };
  if (email) body.email = email;
  if (!options?.forCreate && values.employeeCode?.trim()) {
    body.employeeCode = values.employeeCode.trim();
  }
  return body;
}

export function mapApiEmployeeToForm(row: Record<string, unknown>): Record<string, string> {
  const m = meta(row);
  return {
    name: String(row.name ?? ''),
    phone: String(row.phone ?? ''),
    email: String(row.email ?? ''),
    nid: String(m.nid ?? ''),
    imageUrl: String(row.imageUrl ?? ''),
    department: String(row.department ?? ''),
    designation: String(row.designation ?? ''),
    joiningDate: String(row.joiningDate ?? '').split('T')[0],
    employeeType: String(row.employeeType ?? 'Worker'),
    status: String(row.status ?? 'active'),
    employeeCode: String(row.employeeCode ?? row.legacyId ?? ''),
    salaryStructureId: String(m.salaryStructureId ?? ''),
    paymentMethod: String(m.paymentMethod ?? 'Cash'),
    emergencyPhone: String(m.emergencyPhone ?? ''),
    address: String(row.address ?? ''),
    notes: String(row.notes ?? ''),
    salary: String(row.salary ?? '0'),
  };
}

export function resolveApiRowId(row: Record<string, unknown>): string {
  return String(row._mongoId ?? row.id ?? '');
}

function mapLegacyDocRow(doc: Record<string, unknown>, extra: Record<string, unknown> = {}): Record<string, unknown> {
  const id = String(doc.legacyId ?? apiDocId(doc));
  return {
    id,
    ...doc,
    ...extra,
    _mongoId: apiDocId(doc),
  };
}

export function mapApiLeadRow(doc: Record<string, unknown>): Record<string, unknown> {
  return mapLegacyDocRow(doc, {
    assignedRepName: doc.assignedRepName ?? '',
    conversionStatus: doc.conversionStatus ?? 'open',
  });
}

export function mapLeadToApi(record: Record<string, unknown>, existingLegacyId?: string): Record<string, unknown> {
  const body: Record<string, unknown> = {
    name: record.name,
    company: record.company,
    phone: record.phone,
    alternativePhone: record.alternativePhone,
    email: record.email,
    interestedProduct: record.interestedProduct,
    customerRequirement: record.customerRequirement,
    source: record.source,
    campaign: record.campaign,
    adCreative: record.adCreative,
    status: record.status ?? 'new',
    priority: record.priority ?? 'warm',
    assignedRepId: record.assignedRepId,
    assignedRepName: record.assignedRepName,
    expectedValue: Number(record.expectedValue ?? 0),
    probability: Number(record.probability ?? 0),
    nextFollowUpAt: record.nextFollowUpAt,
    nextActionType: record.nextActionType,
    location: record.location,
    notes: record.notes,
    conversionStatus: record.conversionStatus ?? 'open',
  };
  if (existingLegacyId?.trim()) body.legacyId = existingLegacyId.trim();
  return body;
}

export function mapApiDealRow(doc: Record<string, unknown>): Record<string, unknown> {
  const stage = String(doc.stage ?? 'new-opportunity');
  const statusRaw = String(doc.status ?? 'open').toLowerCase();
  const status = statusRaw === 'won' || stage === 'won'
    ? 'won'
    : statusRaw === 'lost' || stage === 'lost'
      ? 'lost'
      : 'open';
  return mapLegacyDocRow(doc, {
    closeDate: doc.closeDate ?? doc.expectedCloseDate ?? '',
    stage,
    status,
  });
}

export function mapDealToApi(record: Record<string, unknown>, existingLegacyId?: string): Record<string, unknown> {
  const body: Record<string, unknown> = {
    title: record.title,
    company: record.company,
    contactPerson: record.contactPerson,
    phone: record.phone,
    stage: record.stage ?? 'new-opportunity',
    status: record.status ?? 'open',
    expectedValue: Number(record.expectedValue ?? 0),
    probability: Number(record.probability ?? 50),
    expectedCloseDate: record.expectedCloseDate ?? record.closeDate,
    closeDate: record.closeDate ?? record.expectedCloseDate,
    leadSource: record.leadSource,
    competitor: record.competitor,
    internalRemarks: record.internalRemarks,
    assignedRepId: record.assignedRepId,
    assignedRepName: record.assignedRepName,
    linkedLeadId: record.linkedLeadId,
    linkedCustomerId: record.linkedCustomerId,
    lastActivityAt: record.lastActivityAt,
  };
  if (existingLegacyId?.trim()) body.legacyId = existingLegacyId.trim();
  return body;
}

export function mapApiSalesDocRow(doc: Record<string, unknown>): Record<string, unknown> {
  const m = meta(doc);
  const id = String(doc.legacyId ?? apiDocId(doc));
  return {
    id,
    customer: doc.customer ?? doc.customerName ?? '',
    customerId: doc.customerId ?? '',
    customerName: doc.customerName ?? doc.customer ?? '',
    date: doc.date ?? '',
    status: doc.status ?? 'draft',
    items: doc.items ?? [],
    subtotal: doc.subtotal ?? 0,
    discount: doc.discount ?? 0,
    tax: doc.tax ?? 0,
    total: doc.total ?? 0,
    amount: doc.amount ?? doc.total ?? 0,
    notes: doc.notes ?? '',
    orderId: doc.orderId ?? m.orderId ?? '',
    invoiceId: doc.invoiceId ?? m.invoiceId ?? '',
    route: doc.route ?? m.route ?? '',
    vehicle: doc.vehicle ?? m.vehicle ?? '',
    method: doc.method ?? m.method ?? '',
    deliveryAddress: doc.deliveryAddress ?? m.deliveryAddress ?? '',
    contactPerson: doc.contactPerson ?? m.contactPerson ?? '',
    warehouseId: doc.warehouseId ?? m.warehouseId ?? '',
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    _mongoId: apiDocId(doc),
  };
}

export function mapSalesDocToApi(record: Record<string, unknown>, existingLegacyId?: string): Record<string, unknown> {
  const items = (Array.isArray(record.items) ? record.items : []).map((item: Record<string, unknown>) => ({
    description: item.description ?? item.name,
    name: item.name ?? item.description,
    qty: Number(item.qty ?? item.quantity ?? 1),
    rate: Number(item.rate ?? item.price ?? 0),
    price: Number(item.rate ?? item.price ?? 0),
    total: Number(item.amount ?? item.total ?? 0),
  }));

  const body: Record<string, unknown> = {
    customer: record.customer ?? record.customerName,
    customerId: record.customerId,
    customerName: record.customerName ?? record.customer,
    date: record.date,
    status: record.status ?? 'draft',
    items,
    subtotal: Number(record.subtotal ?? record.total ?? 0),
    discount: Number(record.discount ?? record.discountAmount ?? 0),
    tax: Number(record.tax ?? record.taxAmount ?? 0),
    total: Number(record.total ?? 0),
    amount: Number(record.amount ?? record.total ?? 0),
    notes: record.notes,
    orderId: record.orderId,
    invoiceId: record.invoiceId,
    route: record.route,
    vehicle: record.vehicle,
    method: record.method,
    deliveryAddress: record.deliveryAddress,
    contactPerson: record.contactPerson,
    warehouseId: record.warehouseId,
    meta: {
      orderId: record.orderId,
      invoiceId: record.invoiceId,
      route: record.route,
      vehicle: record.vehicle,
      method: record.method,
      deliveryAddress: record.deliveryAddress,
      contactPerson: record.contactPerson,
      warehouseId: record.warehouseId,
    },
  };
  if (existingLegacyId?.trim()) body.legacyId = existingLegacyId.trim();
  return body;
}

export function mapApiComplaintRow(doc: Record<string, unknown>): Record<string, unknown> {
  const id = String(doc.legacyId ?? doc.ticketNo ?? apiDocId(doc));
  return {
    id,
    ticketNo: doc.ticketNo ?? id,
    customerId: doc.customerId ?? '',
    customerName: doc.customerName ?? '',
    customerPhone: doc.customerPhone ?? '',
    subject: doc.subject ?? '',
    description: doc.description ?? '',
    category: doc.category ?? '',
    priority: doc.priority ?? 'medium',
    status: doc.status ?? 'open',
    sku: doc.sku ?? '',
    slaDueAt: doc.slaDueAt ?? '',
    evidenceImageUrl: doc.evidenceImageUrl ?? '',
    resolutionNotes: doc.resolutionNotes ?? '',
    openedAt: doc.createdAt ?? doc.openedAt ?? '',
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    _mongoId: apiDocId(doc),
  };
}

export function mapComplaintToApi(record: Record<string, unknown>, existingLegacyId?: string): Record<string, unknown> {
  const body: Record<string, unknown> = {
    customerId: record.customerId,
    customerName: record.customerName,
    customerPhone: record.customerPhone,
    subject: record.subject,
    description: record.description,
    category: record.category,
    priority: record.priority ?? 'medium',
    status: record.status ?? 'open',
    sku: record.sku,
    slaDueAt: record.slaDueAt,
    evidenceImageUrl: record.evidenceImageUrl,
    resolutionNotes: record.resolutionNotes,
  };
  if (existingLegacyId?.trim()) {
    body.legacyId = existingLegacyId.trim();
    if (record.ticketNo) body.ticketNo = record.ticketNo;
  }
  return body;
}

export function mapApiPosRow(doc: Record<string, unknown>): Record<string, unknown> {
  const id = String(doc.legacyId ?? doc.receiptNo ?? apiDocId(doc));
  return {
    id,
    receiptNo: doc.receiptNo ?? id,
    customerId: doc.customerId ?? '',
    customerName: doc.customerName ?? '',
    date: doc.date ?? '',
    items: doc.items ?? [],
    subtotal: doc.subtotal ?? 0,
    tax: doc.tax ?? 0,
    discount: doc.discount ?? 0,
    total: doc.total ?? 0,
    paymentMethod: doc.paymentMethod ?? '',
    status: doc.status ?? 'completed',
    createdAt: doc.createdAt,
    _mongoId: apiDocId(doc),
  };
}

export function mapPosToApi(record: Record<string, unknown>, existingLegacyId?: string): Record<string, unknown> {
  const items = (Array.isArray(record.items) ? record.items : []).map((item: Record<string, unknown>) => {
    const qty = Number(item.qty ?? item.quantity ?? 1);
    const rate = Number(item.rate ?? item.price ?? 0);
    return {
      description: item.description ?? item.name,
      name: item.name ?? item.description,
      sku: item.sku ?? item.productId,
      qty,
      rate,
      price: rate,
      total: Number(item.total ?? rate * qty),
    };
  });
  const body: Record<string, unknown> = {
    customerId: record.customerId,
    customerName: record.customerName,
    date: record.date ?? new Date().toISOString().slice(0, 10),
    items,
    subtotal: Number(record.subtotal ?? 0),
    tax: Number(record.tax ?? 0),
    discount: Number(record.discount ?? 0),
    total: Number(record.total ?? 0),
    paymentMethod: record.paymentMethod ?? 'cash',
    status: record.status ?? 'completed',
    notes: record.note ?? record.notes,
  };
  if (record.receiptNo) body.receiptNo = record.receiptNo;
  if (existingLegacyId?.trim()) body.legacyId = existingLegacyId.trim();
  return body;
}

export function mapDeliveryToApi(record: Record<string, unknown>, existingLegacyId?: string): Record<string, unknown> {
  const base = mapSalesDocToApi(record, existingLegacyId);
  return {
    ...base,
    orderId: record.orderId,
    deliveryAddress: record.deliveryAddress,
    contactPerson: record.contactPerson,
    warehouseId: record.warehouseId,
    meta: {
      ...(base.meta as Record<string, unknown>),
      expectedDeliveryDate: record.expectedDeliveryDate,
      deliveryMethod: record.deliveryMethod,
      vehicleNo: record.vehicleNo,
      driverName: record.driverName,
      driverPhone: record.driverPhone,
      contactPhone: record.contactPhone,
    },
  };
}

export function findApiRowByLegacyId(
  docs: Record<string, unknown>[],
  legacyId: string,
  mapper: (doc: Record<string, unknown>) => Record<string, unknown>,
): Record<string, unknown> | null {
  const match = docs.find((doc) => {
    const legacy = String(doc.legacyId ?? doc.ticketNo ?? doc.receiptNo ?? '');
    const id = apiDocId(doc);
    return legacy === legacyId || id === legacyId;
  });
  return match ? mapper(match) : null;
}

export async function convertQuotationToOrderViaApi(
  quote: Record<string, unknown>,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const orderBody = mapSalesOrderRecordToApi({
    customerId: quote.customerId,
    customer: quote.customer ?? quote.customerName,
    customerName: quote.customerName ?? quote.customer,
    items: quote.items,
    total: quote.total,
    subtotal: quote.subtotal ?? quote.total,
    status: 'confirmed',
    date: new Date().toISOString().slice(0, 10),
    notes: quote.notes,
    sourceQuotationId: quote.id,
  });

  const orderResult = await createResource(API_RESOURCE_PATHS.salesOrders, orderBody);
  if (!orderResult.ok) return orderResult;

  const quoteBody = mapSalesDocToApi({ ...quote, status: 'accepted' }, String(quote.id ?? ''));
  await updateResource(API_RESOURCE_PATHS.quotations, resolveApiRowId(quote), quoteBody);

  return { ok: true, id: orderResult.id };
}
