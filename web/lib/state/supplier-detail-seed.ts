export type SupplierDetailBillSeed = {
  billNo: string;
  billDate: string;
  amount: number;
  paid: number;
  due: number;
  dueDate: string;
  statusLabel: string;
  statusTone: 'rose' | 'amber' | 'sky' | 'emerald';
};

export type SupplierDetailActivitySeed = {
  id: string;
  type: 'payment' | 'grn' | 'bill' | 'po' | 'return' | 'note';
  title: string;
  text: string;
  at: string;
  meta?: string;
};

export type SupplierDetailOverlay = {
  supplierId: string;
  categoryLabel: string;
  location: string;
  contactName: string;
  phone: string;
  email: string;
  address: string;
  supplierSince: string;
  creditLimit: number;
  openingBalance: number;
  nextDueAmount: number;
  nextDueDate: string;
  usedCreditPct: number;
  metrics: {
    totalPurchase: number;
    purchaseCount: number;
    itemCount: number;
    totalPaid: number;
    paymentCount: number;
    currentPayable: number;
    billCount: number;
    overdueAmount: number;
    overdueBillCount: number;
  };
  performance: {
    rating: number;
    onTimeDelivery: number;
    qualityAcceptance: number;
    returnRate: number;
    avgLeadTime: string;
    totalOrders: number;
    completedOrders: number;
    activeItems: number;
  };
  bills: SupplierDetailBillSeed[];
  activities: SupplierDetailActivitySeed[];
  lastPaymentDate: string;
  lastPurchaseDate: string;
};

export const SUPPLIER_DETAIL_OVERLAY_BY_ID: Record<string, SupplierDetailOverlay> = {
  'SUP-002': {
    supplierId: 'SUP-002',
    categoryLabel: 'Chemical Supplier',
    location: 'Dhaka, Bangladesh',
    contactName: 'Rahim Ahmed',
    phone: '01712-345678',
    email: 'rahim@globaldye.com',
    address: 'Plot 45, Keraniganj Industrial Area, Dhaka',
    supplierSince: '2025-01-12',
    creditLimit: 200000,
    openingBalance: 0,
    nextDueAmount: 50000,
    nextDueDate: '2026-08-12',
    usedCreditPct: 63.5,
    metrics: {
      totalPurchase: 845000,
      purchaseCount: 32,
      itemCount: 58,
      totalPaid: 718000,
      paymentCount: 18,
      currentPayable: 127000,
      billCount: 3,
      overdueAmount: 27000,
      overdueBillCount: 1,
    },
    performance: {
      rating: 4.6,
      onTimeDelivery: 92,
      qualityAcceptance: 97,
      returnRate: 2.1,
      avgLeadTime: '4 Days',
      totalOrders: 32,
      completedOrders: 29,
      activeItems: 18,
    },
    bills: [
      {
        billNo: 'BIL-1082',
        billDate: '2026-07-18',
        amount: 80000,
        paid: 53000,
        due: 27000,
        dueDate: '2026-07-25',
        statusLabel: 'Overdue',
        statusTone: 'rose',
      },
      {
        billNo: 'BIL-1075',
        billDate: '2026-07-10',
        amount: 45000,
        paid: 15000,
        due: 30000,
        dueDate: '2026-08-05',
        statusLabel: 'Due Soon',
        statusTone: 'amber',
      },
      {
        billNo: 'BIL-1068',
        billDate: '2026-06-28',
        amount: 67000,
        paid: 37000,
        due: 30000,
        dueDate: '2026-08-15',
        statusLabel: 'Upcoming',
        statusTone: 'sky',
      },
    ],
    activities: [
      {
        id: 'act-sup-002-1',
        type: 'payment',
        title: 'Payment recorded',
        text: '৳30,000.00 payment recorded',
        at: '2026-07-25T10:45:00.000Z',
        meta: 'PAY-0291',
      },
      {
        id: 'act-sup-002-2',
        type: 'grn',
        title: 'Goods received',
        text: 'Goods received against PO-1082',
        at: '2026-07-28T16:20:00.000Z',
      },
      {
        id: 'act-sup-002-3',
        type: 'bill',
        title: 'Bill created',
        text: 'Bill BIL-1082 created for ৳80,000.00',
        at: '2026-07-28T16:15:00.000Z',
      },
      {
        id: 'act-sup-002-4',
        type: 'po',
        title: 'Purchase order created',
        text: 'PO-1082 created',
        at: '2026-07-25T14:10:00.000Z',
      },
      {
        id: 'act-sup-002-5',
        type: 'return',
        title: 'Return recorded',
        text: '20kg material returned',
        at: '2026-07-18T11:30:00.000Z',
        meta: 'PR-019',
      },
    ],
    lastPaymentDate: '2026-07-25',
    lastPurchaseDate: '2026-07-28',
  },
};

export function getSupplierDetailOverlay(supplierId: string): SupplierDetailOverlay | undefined {
  return SUPPLIER_DETAIL_OVERLAY_BY_ID[supplierId];
}

export type SupplierDemoInput = {
  id: string;
  name: string;
  category: string;
  contactName: string;
  totalPurchase: number;
  lastPurchaseDate: string;
  createdAt: string;
  payable?: number;
};

export type SupplierDemoMetrics = SupplierDetailOverlay['metrics'];

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 14) || 'supplier';
}

export function supplierIdHash(supplierId: string) {
  let hash = 0;
  for (let i = 0; i < supplierId.length; i += 1) {
    hash = supplierId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

function addDays(iso: string, days: number) {
  const base = new Date(`${iso.includes('T') ? iso.slice(0, 10) : iso}T00:00:00`);
  base.setDate(base.getDate() + days);
  return base.toISOString().slice(0, 10);
}

export function buildSupplierContactFallbacks(input: SupplierDemoInput) {
  const companySlug = slugify(input.name.split(/\s+/)[0] ?? 'supplier');
  const contactSlug = slugify(input.contactName.split(/\s+/)[0] ?? 'contact');
  return {
    email: `${contactSlug}@${companySlug}.com`,
    address: `${input.category} supplier, Tejgaon Industrial Area, Dhaka`,
    location: 'Dhaka, Bangladesh',
  };
}

export function buildSupplierDemoMetrics(
  input: SupplierDemoInput,
  totalPaid: number,
  paymentCount: number,
): SupplierDemoMetrics {
  const hash = supplierIdHash(input.id);
  const purchaseCount = Math.max(8 + (hash % 17), paymentCount || 1);
  const itemCount = Math.max(Math.round(purchaseCount * 1.6), 4);
  const totalPurchase = input.totalPurchase > 0 ? input.totalPurchase : purchaseCount * 12500;
  const currentPayable = input.payable ?? Math.round(totalPurchase * 0.08);
  const billCount = currentPayable > 0 ? Math.min(3, 1 + (hash % 3)) : Math.max(paymentCount, 2);
  const overdueBillCount = currentPayable > 0 && hash % 3 === 0 ? 1 : 0;
  const overdueAmount = overdueBillCount ? Math.round(currentPayable * 0.35) : 0;

  return {
    totalPurchase,
    purchaseCount,
    itemCount,
    totalPaid: totalPaid > 0 ? totalPaid : Math.round(totalPurchase * 0.72),
    paymentCount: paymentCount > 0 ? paymentCount : Math.max(3, Math.floor(purchaseCount / 4)),
    currentPayable,
    billCount,
    overdueAmount,
    overdueBillCount,
  };
}

type PaymentRow = { billId?: string; date?: string; amount?: number; id?: string };

export function buildSupplierDemoBills(
  input: SupplierDemoInput,
  payments: PaymentRow[] = [],
): SupplierDetailBillSeed[] {
  const hash = supplierIdHash(input.id);
  const anchor = input.lastPurchaseDate || input.createdAt || '2026-07-01';
  const bills: SupplierDetailBillSeed[] = [];

  if (payments.length > 0) {
    const pay = payments[0];
    const amount = Number(pay.amount ?? 14300);
    bills.push({
      billNo: String(pay.billId ?? `BIL-${input.id.slice(-3)}01`),
      billDate: String(pay.date ?? anchor),
      amount,
      paid: amount,
      due: 0,
      dueDate: String(pay.date ?? anchor),
      statusLabel: 'Paid',
      statusTone: 'emerald',
    });
  }

  const templates: SupplierDetailBillSeed[] = [
    {
      billNo: `BIL-${1000 + (hash % 90)}`,
      billDate: addDays(anchor, -18),
      amount: 42000 + (hash % 5) * 5000,
      paid: 12000,
      due: 30000 + (hash % 4) * 2000,
      dueDate: addDays(anchor, 12),
      statusLabel: 'Due Soon',
      statusTone: 'amber',
    },
    {
      billNo: `BIL-${990 + (hash % 90)}`,
      billDate: addDays(anchor, -28),
      amount: 28000 + (hash % 3) * 4000,
      paid: 28000 + (hash % 3) * 4000,
      due: 0,
      dueDate: addDays(anchor, -5),
      statusLabel: 'Paid',
      statusTone: 'emerald',
    },
    {
      billNo: `BIL-${980 + (hash % 90)}`,
      billDate: addDays(anchor, -42),
      amount: 55000 + (hash % 6) * 3000,
      paid: 28000,
      due: 27000 + (hash % 6) * 3000,
      dueDate: addDays(anchor, -8),
      statusLabel: 'Overdue',
      statusTone: 'rose',
    },
  ];

  for (const row of templates) {
    if (bills.length >= 3) break;
    if (!bills.some((b) => b.billNo === row.billNo)) bills.push(row);
  }

  if ((input.payable ?? 0) <= 0) {
    return bills.filter((b) => b.statusLabel === 'Paid').slice(0, 3);
  }

  return bills.slice(0, 3);
}

export function buildSupplierDemoActivities(
  input: SupplierDemoInput,
  payments: PaymentRow[] = [],
): SupplierDetailActivitySeed[] {
  const hash = supplierIdHash(input.id);
  const anchor = input.lastPurchaseDate || input.createdAt || '2026-07-01';
  const activities: SupplierDetailActivitySeed[] = [];

  if (payments.length > 0) {
    const pay = payments[0];
    activities.push({
      id: `demo-pay-${input.id}`,
      type: 'payment',
      title: 'Payment recorded',
      text: `Payment of ৳${Number(pay.amount ?? 0).toLocaleString('en-BD')} recorded`,
      at: `${String(pay.date ?? anchor)}T10:30:00.000Z`,
      meta: String(pay.id ?? 'PAY'),
    });
  }

  activities.push(
    {
      id: `demo-grn-${input.id}`,
      type: 'grn',
      title: 'Goods received',
      text: `Goods received against PO-${1040 + (hash % 50)}`,
      at: `${addDays(anchor, -2)}T16:20:00.000Z`,
    },
    {
      id: `demo-bill-${input.id}`,
      type: 'bill',
      title: 'Bill created',
      text: `Bill BIL-${1000 + (hash % 90)} created`,
      at: `${addDays(anchor, -3)}T11:15:00.000Z`,
    },
    {
      id: `demo-po-${input.id}`,
      type: 'po',
      title: 'Purchase order created',
      text: `PO-${1040 + (hash % 50)} created for ${input.name}`,
      at: `${addDays(anchor, -5)}T14:10:00.000Z`,
    },
    {
      id: `demo-note-${input.id}`,
      type: 'note',
      title: 'Supplier onboarded',
      text: `${input.name} added to supplier list`,
      at: `${input.createdAt}T09:00:00.000Z`,
    },
  );

  return activities.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 5);
}
