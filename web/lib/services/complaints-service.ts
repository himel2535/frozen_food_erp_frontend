import { ensureCrmState } from '@/lib/services/crm-service';
import { deleteFromState, listFromState, updateInState } from '@/lib/services/domain-service';
import { logSystemAudit } from '@/lib/services/audit-log-service';
import type { AppState } from '@/lib/state/types';

export const COMPLAINT_CATEGORIES = [
  { value: 'product-quality', label: 'Product Quality' },
  { value: 'missing-item', label: 'Missing Item' },
  { value: 'delivery', label: 'Delivery' },
  { value: 'incorrect-info', label: 'Incorrect Info' },
  { value: 'refund', label: 'Refund' },
  { value: 'packaging', label: 'Packaging' },
] as const;

export const COMPLAINT_PRIORITIES = ['high', 'medium', 'low'] as const;
export const COMPLAINT_STATUSES = ['open', 'in-progress', 'resolved'] as const;

export type ComplaintRecord = {
  id: string;
  ticketNo: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  sku?: string;
  openedAt: string;
  slaDueAt: string;
  resolutionNotes?: string;
  evidenceImageUrl?: string;
  evidenceImagePublicId?: string;
};

export type ComplaintMetrics = {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  overdue: number;
  thisMonth: number;
};

export type ComplaintCategorySlice = {
  key: string;
  label: string;
  count: number;
  pct: number;
  color: string;
};

const SEED_FLAG = '__complaintsDemoSeeded';

const CUSTOMER_NAMES = [
  'Rahim Toys Mart',
  'Star Kids Store',
  'Happy Land Retail',
  'Toy World BD',
  'Kids Paradise',
  'Play Zone',
  'Mini Mart Toys',
  'Fun Factory Outlet',
  'Dream Toys Hub',
  'Little Stars Shop',
  'Rainbow Retail',
  'Wonder Kids',
];

const SUBJECTS = [
  { subject: 'Defective remote control car', sku: 'RC-002', category: 'product-quality' },
  { subject: 'Missing puzzle pieces in box', sku: 'PZ-015', category: 'missing-item' },
  { subject: 'Late delivery of bulk order', sku: '', category: 'delivery' },
  { subject: 'Wrong product shipped', sku: 'FG-008', category: 'incorrect-info' },
  { subject: 'Refund not processed yet', sku: '', category: 'refund' },
  { subject: 'Damaged packaging on arrival', sku: 'PKG-003', category: 'packaging' },
  { subject: 'Paint chipping on action figure', sku: 'AF-004', category: 'product-quality' },
  { subject: 'Invoice amount mismatch', sku: '', category: 'incorrect-info' },
  { subject: 'Shipment arrived incomplete', sku: 'BL-012', category: 'missing-item' },
  { subject: 'Courier delay beyond SLA', sku: '', category: 'delivery' },
];

function nowIso() {
  return new Date().toISOString();
}

function ticketToComplaint(ticket: Record<string, unknown>, customers: Record<string, Record<string, unknown>>): ComplaintRecord {
  const customerId = ticket.customerId ? String(ticket.customerId) : '';
  const customer = customerId ? customers[customerId] : null;
  const customerName = String(ticket.customerName ?? customer?.company ?? ticket.customer ?? 'Walk-in Customer');
  const customerPhone = String(ticket.customerPhone ?? customer?.phone ?? '');
  const id = String(ticket.id ?? '');
  const ticketNo = String(ticket.ticketNo ?? id.replace('TKT', 'CMP').replace('CMP', 'CMP'));

  return {
    id,
    ticketNo: ticketNo.startsWith('CMP') ? ticketNo : `CMP-${id.replace(/^TKT-/, '2026-')}`,
    customerId: customerId || undefined,
    customerName,
    customerPhone,
    subject: String(ticket.subject ?? ''),
    description: String(ticket.description ?? ''),
    category: String(ticket.category ?? ticket.type ?? 'product-quality'),
    priority: String(ticket.priority ?? 'medium').toLowerCase(),
    status: String(ticket.status ?? 'open').toLowerCase(),
    sku: ticket.sku ? String(ticket.sku) : undefined,
    openedAt: String(ticket.openedAt ?? ticket.createdAt ?? nowIso()),
    slaDueAt: String(ticket.slaDueAt ?? ticket.dueDate ?? ''),
    resolutionNotes: ticket.resolutionNotes ? String(ticket.resolutionNotes) : undefined,
    evidenceImageUrl: ticket.evidenceImageUrl ? String(ticket.evidenceImageUrl) : undefined,
    evidenceImagePublicId: ticket.evidenceImagePublicId ? String(ticket.evidenceImagePublicId) : undefined,
  };
}

function normalizeComplaintList(state: AppState): ComplaintRecord[] {
  ensureCrmState(state);
  const crmData = state.crmData as {
    supportTicketsById?: Record<string, Record<string, unknown>>;
    customersById?: Record<string, Record<string, unknown>>;
  };
  const customers = crmData.customersById ?? {};
  const fromCrm = Object.values(crmData.supportTicketsById ?? {});
  const flat = listFromState(state, 'crmComplaints') as Record<string, unknown>[];
  const merged = [...fromCrm, ...flat];
  const byId = new Map<string, ComplaintRecord>();
  merged.forEach((ticket) => {
    const row = ticketToComplaint(ticket, customers);
    if (row.id) byId.set(row.id, row);
  });
  return [...byId.values()].sort((a, b) => b.openedAt.localeCompare(a.openedAt));
}

export function ensureComplaintSeedData(state: AppState) {
  ensureCrmState(state);
  const crmData = state.crmData as Record<string, unknown> & { supportTicketsById: Record<string, Record<string, unknown>> };
  if (crmData[SEED_FLAG]) return;

  const statuses: string[] = ['open', 'in-progress', 'resolved', 'open', 'in-progress', 'resolved', 'open', 'in-progress'];
  const priorities: string[] = ['high', 'medium', 'high', 'medium', 'high', 'low', 'medium', 'low'];
  const baseDate = new Date('2026-08-01T09:00:00.000Z');

  for (let i = 0; i < 128; i += 1) {
    const seq = 128 - i;
    const id = `CMP-2026-${String(seq).padStart(3, '0')}`;
    if (crmData.supportTicketsById[id]) continue;

    const subjectSeed = SUBJECTS[i % SUBJECTS.length];
    const customerName = CUSTOMER_NAMES[i % CUSTOMER_NAMES.length];
    const opened = new Date(baseDate);
    opened.setDate(opened.getDate() - (i % 20));
    opened.setHours(9 + (i % 8), (i * 7) % 60, 0, 0);

    const due = new Date(opened);
    due.setDate(due.getDate() + 3 - (i % 3));

    const status = statuses[i % statuses.length];
    const priority = priorities[i % priorities.length];

    crmData.supportTicketsById[id] = {
      id,
      ticketNo: id,
      customerName,
      customerPhone: `01${String(711 + (i % 89)).padStart(3, '0')}-${String(100000 + i * 1111).slice(0, 6)}`,
      subject: subjectSeed.subject,
      description: `Customer reported: ${subjectSeed.subject.toLowerCase()}.`,
      category: subjectSeed.category,
      type: subjectSeed.category,
      priority,
      status,
      sku: subjectSeed.sku || undefined,
      openedAt: opened.toISOString(),
      slaDueAt: due.toISOString(),
      resolutionNotes: status === 'resolved' ? 'Issue resolved and customer notified.' : '',
    };
  }

  crmData[SEED_FLAG] = true;
}

export function getComplaintList(state: AppState): ComplaintRecord[] {
  ensureComplaintSeedData(state);
  return normalizeComplaintList(state);
}

export function getComplaintMetrics(state: AppState): ComplaintMetrics {
  const rows = getComplaintList(state);
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const open = rows.filter((r) => r.status === 'open').length;
  const inProgress = rows.filter((r) => r.status === 'in-progress').length;
  const resolved = rows.filter((r) => r.status === 'resolved').length;
  const overdue = rows.filter((r) => {
    if (r.status === 'resolved' || !r.slaDueAt) return false;
    return new Date(r.slaDueAt) < now;
  }).length;
  const thisMonth = rows.filter((r) => new Date(r.openedAt) >= monthStart).length;

  return { total: rows.length, open, inProgress, resolved, overdue, thisMonth };
}

export function getComplaintStatusSummary(state: AppState) {
  const metrics = getComplaintMetrics(state);
  return {
    open: metrics.open,
    inProgress: metrics.inProgress,
    resolved: metrics.resolved,
    overdue: metrics.overdue,
    total: metrics.total,
  };
}

export function getComplaintCategoryBreakdown(state: AppState): ComplaintCategorySlice[] {
  const rows = getComplaintList(state);
  const total = rows.length || 1;
  const colors: Record<string, string> = {
    'product-quality': '#3b82f6',
    'missing-item': '#8b5cf6',
    delivery: '#10b981',
    'incorrect-info': '#f59e0b',
    refund: '#ec4899',
    packaging: '#14b8a6',
  };

  const counts = new Map<string, number>();
  rows.forEach((row) => {
    counts.set(row.category, (counts.get(row.category) ?? 0) + 1);
  });

  return COMPLAINT_CATEGORIES.map((cat) => ({
    key: cat.value,
    label: cat.label,
    count: counts.get(cat.value) ?? 0,
    pct: Math.round(((counts.get(cat.value) ?? 0) / total) * 1000) / 10,
    color: colors[cat.value] ?? '#64748b',
  }))
    .filter((slice) => slice.count > 0)
    .sort((a, b) => b.count - a.count);
}

export function createComplaint(
  state: AppState,
  payload: {
    customerId?: string;
    customerName: string;
    customerPhone?: string;
    subject: string;
    description?: string;
    category: string;
    priority: string;
    status?: string;
    sku?: string;
    slaDueAt?: string;
    evidenceImageUrl?: string;
    evidenceImagePublicId?: string;
  },
) {
  ensureCrmState(state);
  const crmData = state.crmData as { supportTicketsById: Record<string, Record<string, unknown>> };
  const existingIds = Object.keys(crmData.supportTicketsById);
  const seq = existingIds.filter((id) => id.startsWith('CMP-2026-')).length + 129;
  const id = `CMP-2026-${String(seq).padStart(3, '0')}`;
  const due = payload.slaDueAt ?? new Date(Date.now() + 3 * 86400000).toISOString();

  crmData.supportTicketsById[id] = {
    id,
    ticketNo: id,
    customerId: payload.customerId,
    customerName: payload.customerName,
    customerPhone: payload.customerPhone ?? '',
    subject: payload.subject,
    description: payload.description ?? '',
    category: payload.category,
    type: payload.category,
    priority: payload.priority,
    status: payload.status ?? 'open',
    sku: payload.sku,
    openedAt: nowIso(),
    slaDueAt: due,
    resolutionNotes: '',
    evidenceImageUrl: payload.evidenceImageUrl ?? '',
    evidenceImagePublicId: payload.evidenceImagePublicId ?? '',
  };

  logSystemAudit(state, {
    action: 'create',
    module: 'CRM',
    entityType: 'complaint',
    entityId: id,
    description: `Created complaint ${id}`,
  });

  return { ok: true, id };
}

export function updateComplaintStatus(state: AppState, id: string, status: string) {
  ensureCrmState(state);
  const crmData = state.crmData as { supportTicketsById: Record<string, Record<string, unknown>> };
  if (crmData.supportTicketsById[id]) {
    crmData.supportTicketsById[id] = { ...crmData.supportTicketsById[id], status };
  }
  updateInState(state, 'crmComplaints', id, { status });
}

export function updateComplaint(
  state: AppState,
  id: string,
  patch: Partial<ComplaintRecord>,
) {
  ensureCrmState(state);
  const crmData = state.crmData as { supportTicketsById: Record<string, Record<string, unknown>> };
  if (crmData.supportTicketsById[id]) {
    crmData.supportTicketsById[id] = { ...crmData.supportTicketsById[id], ...patch };
  }
  updateInState(state, 'crmComplaints', id, patch as Record<string, unknown>);
}

export function deleteComplaint(state: AppState, id: string) {
  ensureCrmState(state);
  const crmData = state.crmData as { supportTicketsById: Record<string, Record<string, unknown>> };
  delete crmData.supportTicketsById[id];
  deleteFromState(state, 'crmComplaints', id);
}
