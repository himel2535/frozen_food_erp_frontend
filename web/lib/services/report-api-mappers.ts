/** Map MongoDB API documents into report row shapes (replacing appState.report* snapshots). */

export function invoicesToSalesReportRows(docs: Record<string, unknown>[]): Record<string, unknown>[] {
  return docs.map((doc) => ({
    id: doc.id ?? doc.legacyId,
    date: String(doc.date ?? doc.invoiceDate ?? doc.createdAt ?? '').slice(0, 10),
    ref: doc.legacyId ?? doc.invoiceNo ?? doc.id,
    customer: doc.customerName ?? doc.customer ?? '',
    status: doc.status ?? 'Unpaid',
    paymentMethod: doc.paymentMethod ?? doc.paymentTerms ?? 'Cash',
    total: Number(doc.total ?? doc.grandTotal ?? doc.amount ?? 0),
  }));
}

export function salesOrdersToReportRows(docs: Record<string, unknown>[]): Record<string, unknown>[] {
  return docs.map((doc) => ({
    id: doc.id ?? doc.legacyId,
    date: String(doc.date ?? doc.orderDate ?? doc.createdAt ?? '').slice(0, 10),
    ref: doc.legacyId ?? doc.id,
    customer: doc.customerName ?? doc.customer ?? '',
    status: doc.status ?? 'draft',
    paymentMethod: doc.paymentMethod ?? 'Cash',
    total: Number(doc.total ?? doc.grandTotal ?? 0),
  }));
}

export function purchaseOrdersToReportRows(docs: Record<string, unknown>[]): Record<string, unknown>[] {
  return docs.map((doc) => {
    const total = Number(doc.total ?? (Number(doc.qty ?? 0) * Number(doc.unitCost ?? 0)));
    const received = doc.status === 'Received' ? total : Number(doc.received ?? 0);
    return {
      id: doc.id ?? doc.legacyId,
      date: String(doc.date ?? doc.createdAt ?? '').slice(0, 10),
      ref: doc.legacyId ?? doc.id,
      supplier: doc.supplier ?? doc.supplierName ?? '',
      status: doc.status ?? 'Draft',
      paymentStatus: doc.paymentStatus ?? 'unpaid',
      total,
      received,
      pending: Math.max(0, total - received),
    };
  });
}

export function productsToInventoryReportRows(
  docs: Record<string, unknown>[],
  warehouses: Record<string, unknown>[] = [],
): Record<string, unknown>[] {
  const whMap = new Map(warehouses.map((w) => [String(w.id), String(w.name ?? w.id)]));
  return docs.map((doc) => {
    const qty = Number(doc.stock ?? doc.quantity ?? 0);
    const cost = Number(doc.cost ?? doc.price ?? 0);
    const reorder = Number(doc.reorderLevel ?? doc.minStock ?? 0);
    const ws = (doc.warehouseStock ?? {}) as Record<string, number>;
    const whId = Object.keys(ws).find((k) => Number(ws[k]) > 0) ?? String(doc.defaultWarehouse ?? '');
    return {
      id: doc.id ?? doc.legacyId,
      sku: doc.sku ?? doc.legacyId ?? '',
      name: doc.name ?? '',
      category: doc.category ?? 'Uncategorized',
      warehouse: whMap.get(whId) ?? whId ?? '—',
      qty,
      cost,
      reorderLevel: reorder,
      image: doc.imageUrl ?? '',
      value: qty * cost,
      status: qty <= reorder ? 'Low Stock' : 'In Stock',
    };
  });
}

export function customersToReportRows(docs: Record<string, unknown>[]): Record<string, unknown>[] {
  return docs.map((doc) => ({
    id: doc.id ?? doc.legacyId,
    name: doc.name ?? '',
    company: doc.company ?? '',
    email: doc.email ?? '',
    phone: doc.phone ?? '',
    status: doc.status ?? 'active',
    totalOrders: Number(doc.totalOrders ?? 0),
    totalSpent: Number(doc.totalSpent ?? 0),
    due: Number(doc.due ?? 0),
  }));
}

export function suppliersToReportRows(docs: Record<string, unknown>[]): Record<string, unknown>[] {
  return docs.map((doc) => ({
    id: doc.id ?? doc.legacyId,
    name: doc.name ?? '',
    contact: doc.contactName ?? doc.contact ?? '',
    phone: doc.phone ?? '',
    status: doc.status ?? 'active',
    totalOrders: Number(doc.totalOrders ?? 0),
    totalSpend: Number(doc.totalSpend ?? 0),
    due: Number(doc.due ?? doc.balance ?? 0),
  }));
}

export function journalsToFinancialReportRows(docs: Record<string, unknown>[]): Record<string, unknown>[] {
  return docs.map((doc) => ({
    id: doc.id ?? doc.legacyId,
    date: String(doc.date ?? doc.createdAt ?? '').slice(0, 10),
    ref: doc.legacyId ?? doc.id,
    account: doc.account ?? '',
    desc: doc.desc ?? doc.description ?? '',
    debit: Number(doc.debit ?? 0),
    credit: Number(doc.credit ?? 0),
    category: doc.category ?? 'General',
  }));
}

export function employeesToHrReportRows(docs: Record<string, unknown>[]): Record<string, unknown>[] {
  return docs.map((doc) => ({
    id: doc.id ?? doc.legacyId,
    name: doc.name ?? '',
    department: doc.department ?? '',
    designation: doc.designation ?? '',
    status: doc.status ?? 'active',
    joiningDate: String(doc.joiningDate ?? doc.dateOfJoining ?? '').slice(0, 10),
    email: doc.email ?? '',
  }));
}

export function departmentsToHrDeptRows(docs: Record<string, unknown>[]): Record<string, unknown>[] {
  return docs.map((doc) => ({
    id: doc.id ?? doc.legacyId,
    department: doc.name ?? doc.department ?? '',
    head: doc.head ?? '',
    employees: Number(doc.employees ?? doc.employeeCount ?? 0),
    status: doc.status ?? 'active',
  }));
}

export function mergeSalesReportSource(
  invoices: Record<string, unknown>[],
  salesOrders: Record<string, unknown>[],
): Record<string, unknown>[] {
  const invoiceRows = invoicesToSalesReportRows(invoices);
  if (invoiceRows.length > 0) return invoiceRows;
  return salesOrdersToReportRows(salesOrders);
}
