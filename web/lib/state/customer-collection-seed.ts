export type CollectionStatus =
  | 'promise_missed'
  | 'payment_promise'
  | 'follow_up_scheduled'
  | 'reminder_sent'
  | 'none';

export type CollectionNextAction = {
  type: 'call' | 'whatsapp' | 'follow_up';
  label: string;
  scheduledAt: string;
  reason?: string;
};

export type CollectionAssignedStaff = {
  id: string;
  name: string;
  shortName: string;
  initials: string;
};

export type CollectionPaymentPromise = {
  amount: number;
  dueDate: string;
  status: 'waiting' | 'missed' | 'received';
};

export type CollectionActivityType = 'call' | 'whatsapp' | 'promise' | 'note';

export type CollectionActivityStatusTone = 'rose' | 'emerald' | 'purple' | 'amber' | 'sky';

export type CollectionActivity = {
  id: string;
  type: CollectionActivityType;
  title?: string;
  text: string;
  at: string;
  by: string;
  statusLabel?: string;
  statusTone?: CollectionActivityStatusTone;
  sideMeta?: string;
  sideAction?: { label: string; variant: 'outline' | 'primary' };
  sideHint?: string;
};

export type CollectionOverlay = {
  collectionStatus: CollectionStatus;
  collectionStatusLabel: string;
  location?: string;
  nextAction?: CollectionNextAction;
  assignedTo?: CollectionAssignedStaff;
  paymentPromise?: CollectionPaymentPromise;
  recentActivity: CollectionActivity[];
  followUpTimeline?: CollectionActivity[];
  tabCounts?: { notes?: number; documents?: number };
  financialOverrides?: {
    lastPaymentAmount?: number;
    lastPaymentDate?: string;
    creditLimit?: number;
    availableCredit?: number;
    overdueAmount?: number;
    customerSince?: string;
  };
  isMyTask?: boolean;
  isToday?: boolean;
  isPromised?: boolean;
  isMissed?: boolean;
  isCriticalOverdue?: boolean;
};

/** Pinned mockup KPI values when demo collection data is active. */
export const COLLECTION_DEMO_KPI = {
  totalReceivable: 290500,
  customerCount: 9,
  overdueAmount: 185000,
  expectedToday: 85000,
  promiseCount: 6,
  collectedToday: 42500,
  collectedTodayCount: 5,
  collectedTodayPct: 50,
  attentionCustomers: 7,
  missedFollowUps: 3,
  brokenPromises: 2,
  criticalOverdue: 2,
  followUps: 12,
  paymentPromises: 5,
  missedFollowUpsBar: 3,
  brokenPromisesBar: 2,
} as const;

const STAFF = {
  rahim: { id: 'EMP-006', name: 'Rahim Hossain', shortName: 'Rahim', initials: 'RH' },
  karim: { id: 'EMP-007', name: 'Karim Uddin', shortName: 'Karim', initials: 'KU' },
} as const;

function daysAgoIso(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function todayAt(hour: number, minute = 0) {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function daysAgoAt(days: number, hour: number, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function tomorrowAt(hour: number, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

/** Legacy crmCustomers rows — 9 customers totalling ৳2,90,500 receivable. */
export const COLLECTION_DEMO_CUSTOMERS = [
  { id: 101, name: 'Ahmed Rahman', company: 'ABC Manufacturing Ltd', phone: '+880 1712-345678', email: 'ahmed@abcmanufacturing.bd', status: 'overdue', sales: 245000, due: 85000 },
  { id: 102, name: 'Sadia Khan', company: 'Bright Retail Store', phone: '+880 1812-456789', email: 'sadia@brightretail.bd', status: 'overdue', sales: 98000, due: 45000 },
  { id: 103, name: 'Karim Hassan', company: 'City Wholesale Mart', phone: '+880 1912-567890', email: 'karim@citywholesale.bd', status: 'overdue', sales: 76000, due: 32000 },
  { id: 104, name: 'Nusrat Jahan', company: 'Delta Traders', phone: '+880 1612-678901', email: 'nusrat@deltatraders.bd', status: 'active', sales: 54000, due: 28000 },
  { id: 105, name: 'Imran Ali', company: 'Eastern Supplies Co', phone: '+880 1512-789012', email: 'imran@easternsupplies.bd', status: 'overdue', sales: 112000, due: 52000 },
  { id: 106, name: 'Tasnim Ahmed', company: 'Fashion Hub BD', phone: '+880 1712-890123', email: 'tasnim@fashionhub.bd', status: 'active', sales: 42000, due: 18500 },
  { id: 107, name: 'Rafiq Islam', company: 'Global Toys Outlet', phone: '+880 1812-901234', email: 'rafiq@globaltoys.bd', status: 'active', sales: 38000, due: 12000 },
  { id: 108, name: 'Mina Roy', company: 'Happy Kids Store', phone: '+880 1912-012345', email: 'mina@happykids.bd', status: 'active', sales: 22000, due: 8500 },
  { id: 109, name: 'Shahid Chowdhury', company: 'Island Retail Chain', phone: '+880 1612-123456', email: 'shahid@islandretail.bd', status: 'active', sales: 31000, due: 8500 },
];

export const COLLECTION_DEMO_INVOICES = [
  { id: 'INV-COL-001', customerId: 101, date: '2026-04-01', dueDate: daysAgoIso(64), amount: 85000, paid: 0, due: 85000, status: 'overdue' },
  { id: 'INV-COL-002', customerId: 102, date: '2026-05-10', dueDate: daysAgoIso(45), amount: 45000, paid: 0, due: 45000, status: 'overdue' },
  { id: 'INV-COL-003', customerId: 103, date: '2026-05-20', dueDate: daysAgoIso(38), amount: 32000, paid: 0, due: 32000, status: 'overdue' },
  { id: 'INV-COL-004', customerId: 104, date: '2026-07-10', dueDate: daysAgoIso(5), amount: 28000, paid: 0, due: 28000, status: 'pending' },
  { id: 'INV-COL-005', customerId: 105, date: '2026-06-01', dueDate: daysAgoIso(22), amount: 52000, paid: 0, due: 52000, status: 'overdue' },
  { id: 'INV-COL-006', customerId: 106, date: '2026-07-15', dueDate: daysAgoIso(2), amount: 18500, paid: 0, due: 18500, status: 'pending' },
  { id: 'INV-COL-007', customerId: 107, date: '2026-07-18', dueDate: todayIso(), amount: 12000, paid: 0, due: 12000, status: 'pending' },
  { id: 'INV-COL-008', customerId: 108, date: '2026-07-20', dueDate: daysAgoIso(1), amount: 8500, paid: 0, due: 8500, status: 'pending' },
  { id: 'INV-COL-009', customerId: 109, date: '2026-07-22', dueDate: todayIso(), amount: 8500, paid: 0, due: 8500, status: 'pending' },
  { id: 'INV-COL-010', customerId: 101, date: '2026-08-01', dueDate: '2026-08-15', amount: 45000, paid: 45000, due: 0, status: 'paid' },
  { id: 'INV-COL-011', customerId: 102, date: '2026-08-03', dueDate: '2026-08-18', amount: 28000, paid: 10000, due: 18000, status: 'pending' },
  { id: 'INV-COL-012', customerId: 103, date: '2026-08-05', dueDate: '2026-08-20', amount: 18500, paid: 0, due: 18500, status: 'pending' },
  { id: 'INV-COL-013', customerId: 104, date: '2026-08-07', dueDate: '2026-08-22', amount: 32000, paid: 32000, due: 0, status: 'paid' },
  { id: 'INV-COL-014', customerId: 105, date: '2026-08-09', dueDate: '2026-08-24', amount: 12500, paid: 0, due: 12500, status: 'pending' },
];

export const COLLECTION_DEMO_PAYMENTS_TODAY = [
  { id: 'PAY-COL-T1', customerId: 106, amount: 10000, date: todayIso(), method: 'Cash' },
  { id: 'PAY-COL-T2', customerId: 107, amount: 8500, date: todayIso(), method: 'Bank' },
  { id: 'PAY-COL-T3', customerId: 108, amount: 5000, date: todayIso(), method: 'Mobile Banking' },
  { id: 'PAY-COL-T4', customerId: 104, amount: 12000, date: todayIso(), method: 'Cash' },
  { id: 'PAY-COL-T5', customerId: 102, amount: 7000, date: todayIso(), method: 'Bank' },
];

export const COLLECTION_OVERLAY_BY_COMPANY: Record<string, CollectionOverlay> = {
  'ABC Manufacturing Ltd': {
    collectionStatus: 'promise_missed',
    collectionStatusLabel: 'Promise Missed',
    location: 'Dhaka, Bangladesh',
    nextAction: {
      type: 'call',
      label: 'Call Customer',
      scheduledAt: todayAt(14, 0),
      reason: 'Follow up on missed payment promise of ৳50,000.',
    },
    assignedTo: STAFF.rahim,
    paymentPromise: { amount: 50000, dueDate: todayIso(), status: 'waiting' },
    tabCounts: { notes: 2, documents: 2 },
    financialOverrides: {
      lastPaymentAmount: 20000,
      lastPaymentDate: daysAgoIso(9),
      creditLimit: 100000,
      availableCredit: 15000,
      overdueAmount: 65000,
      customerSince: '2026-02-12',
    },
    followUpTimeline: [
      {
        id: 'act-101-t1',
        type: 'call',
        title: 'Call Attempted',
        text: 'Tried calling the customer. No one responded.',
        at: todayAt(10, 30),
        by: 'Rahim Ahmed',
        statusLabel: 'No Answer',
        statusTone: 'rose',
        sideMeta: 'Next Follow-up: Today, 2:00 PM',
        sideAction: { label: 'Snooze / Reschedule', variant: 'outline' },
      },
      {
        id: 'act-101-t2',
        type: 'whatsapp',
        title: 'WhatsApp Reminder Sent',
        text: 'Payment reminder sent along with invoice INV-2026-0144.',
        at: todayAt(9, 15),
        by: 'Rahim Ahmed',
        statusLabel: 'Delivered',
        statusTone: 'emerald',
        sideAction: { label: 'View Message', variant: 'outline' },
      },
      {
        id: 'act-101-t3',
        type: 'promise',
        title: 'Payment Promise',
        text: 'Promise Amount: ৳50,000 · Promise Date: 3 Aug 2026',
        at: daysAgoAt(1, 16, 25),
        by: 'Rahim Ahmed',
        statusLabel: 'Promise Made',
        statusTone: 'purple',
        sideHint: 'Waiting for Payment',
        sideAction: { label: 'Mark Received', variant: 'outline' },
      },
      {
        id: 'act-101-t4',
        type: 'whatsapp',
        title: 'WhatsApp Message',
        text: 'Payment follow-up message sent.',
        at: daysAgoAt(1, 11, 40),
        by: 'Rahim Ahmed',
        statusLabel: 'Delivered',
        statusTone: 'emerald',
        sideAction: { label: 'View Message', variant: 'outline' },
      },
      {
        id: 'act-101-t5',
        type: 'call',
        title: 'Call Connected',
        text: 'Spoke with accounts manager. Asked for additional time.',
        at: daysAgoAt(5, 15, 42),
        by: 'Karim Uddin',
        statusLabel: 'Spoke with Manager',
        statusTone: 'emerald',
        sideMeta: 'Follow-up Scheduled: 30 Jul 2026',
      },
    ],
    recentActivity: [
      { id: 'act-101-1', type: 'call', title: 'Call Attempted', text: 'Tried calling the customer. No one responded.', at: todayAt(10, 30), by: 'Rahim Ahmed' },
      { id: 'act-101-2', type: 'whatsapp', title: 'WhatsApp Reminder Sent', text: 'Payment reminder sent along with invoice INV-2026-0144.', at: todayAt(9, 15), by: 'Rahim Ahmed' },
      { id: 'act-101-3', type: 'promise', title: 'Payment Promise', text: 'Promise Amount: ৳50,000', at: daysAgoAt(1, 16, 25), by: 'Rahim Ahmed' },
      { id: 'act-101-4', type: 'note', text: 'Payment promise missed — no payment received', at: daysAgoAt(1, 9), by: 'Rahim Hossain' },
    ],
    isMyTask: true,
    isToday: true,
    isPromised: true,
    isMissed: true,
    isCriticalOverdue: true,
  },
  'Bright Retail Store': {
    collectionStatus: 'payment_promise',
    collectionStatusLabel: 'Payment Promise',
    location: 'Dhaka, Bangladesh',
    nextAction: {
      type: 'call',
      label: 'Follow Up',
      scheduledAt: todayAt(14, 0),
      reason: 'Customer promised ৳15,000 payment today by 4 PM.',
    },
    assignedTo: STAFF.karim,
    paymentPromise: { amount: 15000, dueDate: todayIso(), status: 'waiting' },
    recentActivity: [
      { id: 'act-102-1', type: 'promise', text: 'Payment promise recorded for today', at: daysAgoAt(0, 8), by: 'Karim Uddin' },
      { id: 'act-102-2', type: 'note', text: 'Partial payment ৳7,000 received', at: todayAt(9, 15), by: 'Karim Uddin' },
      { id: 'act-102-3', type: 'call', text: 'Follow-up call — promised full payment this week', at: daysAgoAt(4, 16), by: 'Karim Uddin' },
    ],
    isMyTask: true,
    isToday: true,
    isPromised: true,
  },
  'City Wholesale Mart': {
    collectionStatus: 'follow_up_scheduled',
    collectionStatusLabel: 'Follow-up Scheduled',
    location: 'Chittagong, Bangladesh',
    nextAction: {
      type: 'follow_up',
      label: 'Follow Up',
      scheduledAt: todayAt(14, 0),
      reason: 'Scheduled warehouse visit to collect cheque.',
    },
    assignedTo: STAFF.rahim,
    recentActivity: [
      { id: 'act-103-1', type: 'note', text: 'Follow-up visit scheduled for today 2 PM', at: daysAgoAt(1, 10), by: 'Rahim Hossain' },
      { id: 'act-103-2', type: 'call', text: 'Reminder call — customer requested extension', at: daysAgoAt(6, 11), by: 'Rahim Hossain' },
    ],
    isMyTask: true,
    isToday: true,
  },
  'Delta Traders': {
    collectionStatus: 'reminder_sent',
    collectionStatusLabel: 'Reminder Sent',
    location: 'Narayanganj, Bangladesh',
    nextAction: {
      type: 'call',
      label: 'Call Now',
      scheduledAt: todayAt(16, 0),
      reason: 'Invoice due in 5 days — confirm payment date.',
    },
    assignedTo: STAFF.karim,
    recentActivity: [
      { id: 'act-104-1', type: 'whatsapp', text: 'Payment reminder SMS sent', at: daysAgoAt(2, 9), by: 'Karim Uddin' },
      { id: 'act-104-2', type: 'note', text: 'Partial payment ৳12,000 received today', at: todayAt(10, 30), by: 'Karim Uddin' },
    ],
    isToday: true,
  },
  'Eastern Supplies Co': {
    collectionStatus: 'payment_promise',
    collectionStatusLabel: 'Payment Promise',
    location: 'Dhaka, Bangladesh',
    nextAction: {
      type: 'call',
      label: 'Call Now',
      scheduledAt: todayAt(10, 30),
      reason: 'Large overdue balance — escalate to owner.',
    },
    assignedTo: STAFF.rahim,
    paymentPromise: { amount: 20000, dueDate: todayIso(), status: 'waiting' },
    recentActivity: [
      { id: 'act-105-1', type: 'promise', text: 'Owner promised ৳20,000 today', at: daysAgoAt(1, 15), by: 'Rahim Hossain' },
      { id: 'act-105-2', type: 'note', text: 'Overdue notice email sent', at: daysAgoAt(7, 9), by: 'System' },
    ],
    isMyTask: true,
    isToday: true,
    isPromised: true,
    isCriticalOverdue: true,
  },
  'Fashion Hub BD': {
    collectionStatus: 'none',
    collectionStatusLabel: 'Active',
    location: 'Dhaka, Bangladesh',
    nextAction: {
      type: 'whatsapp',
      label: 'WhatsApp Tomorrow',
      scheduledAt: tomorrowAt(11, 0),
    },
    assignedTo: STAFF.karim,
    recentActivity: [
      { id: 'act-106-1', type: 'note', text: 'Partial payment ৳10,000 received today', at: todayAt(11, 0), by: 'Karim Uddin' },
    ],
    isToday: true,
  },
  'Global Toys Outlet': {
    collectionStatus: 'follow_up_scheduled',
    collectionStatusLabel: 'Follow-up Scheduled',
    location: 'Sylhet, Bangladesh',
    nextAction: {
      type: 'follow_up',
      label: 'Follow Up',
      scheduledAt: todayAt(13, 0),
    },
    assignedTo: STAFF.karim,
    paymentPromise: { amount: 12000, dueDate: todayIso(), status: 'waiting' },
    recentActivity: [
      { id: 'act-107-1', type: 'note', text: 'Payment due today — follow-up scheduled', at: daysAgoAt(0, 8), by: 'Karim Uddin' },
    ],
    isToday: true,
    isPromised: true,
  },
  'Happy Kids Store': {
    collectionStatus: 'reminder_sent',
    collectionStatusLabel: 'Reminder Sent',
    location: 'Rajshahi, Bangladesh',
    assignedTo: STAFF.rahim,
    recentActivity: [
      { id: 'act-108-1', type: 'whatsapp', text: 'WhatsApp payment reminder sent', at: daysAgoAt(1, 14), by: 'Rahim Hossain' },
    ],
  },
  'Island Retail Chain': {
    collectionStatus: 'payment_promise',
    collectionStatusLabel: 'Payment Promise',
    location: 'Khulna, Bangladesh',
    nextAction: {
      type: 'call',
      label: 'Call Now',
      scheduledAt: todayAt(12, 0),
    },
    assignedTo: STAFF.karim,
    paymentPromise: { amount: 8500, dueDate: todayIso(), status: 'waiting' },
    recentActivity: [
      { id: 'act-109-1', type: 'promise', text: 'Promised full payment today', at: daysAgoAt(0, 9), by: 'Karim Uddin' },
    ],
    isToday: true,
    isPromised: true,
  },
};

export function getCollectionOverlay(company: string): CollectionOverlay | null {
  return COLLECTION_OVERLAY_BY_COMPANY[company] ?? null;
}

export function isCollectionDemoCompany(company: string) {
  return company in COLLECTION_OVERLAY_BY_COMPANY;
}

export function hasCollectionDemoData(state: { crmCustomers?: Array<{ company?: string }> }) {
  const legacy = state.crmCustomers ?? [];
  return legacy.some((c) => Boolean(c?.company && isCollectionDemoCompany(String(c.company))));
}
