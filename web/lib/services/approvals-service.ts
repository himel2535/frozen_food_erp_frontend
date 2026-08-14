import type { AppState } from '@/lib/state/types';
import {
  createInState,
  updateInState,
  listFromState,
  sortRowsNewestFirst,
} from '@/lib/services/domain-service';
import {
  approvePurchaseRmOrder,
  rejectPurchaseRmOrder,
  listPurchaseRmOrders,
} from '@/lib/services/purchase-rm-service';
import {
  createResource,
  fetchResourceById,
  fetchResourcePage,
  updateResource,
} from '@/lib/services/api-resource-service';
import { mapGenericApiRow, mapGenericPayloadToApi } from '@/lib/services/generic-api-mapper';
import { EXTENDED_API_PATHS } from '@/lib/config/extended-api-modules';
import { resolveApiRowId } from '@/lib/services/entity-api-mappers';

type Row = Record<string, unknown>;

export interface ApprovalRequestPayload {
  item: string;
  requester: string;
  module: string;
  refType: string;
  refId: string;
  status?: string;
  notes?: string;
}

const APPROVALS_PATH = EXTENDED_API_PATHS.workflowApprovals;
const PURCHASE_RM_PATH = EXTENDED_API_PATHS.purchaseRm;

function normalizeApprovalRefKey(row: Row) {
  const refId = String(row.refId ?? '').trim();
  if (refId) return refId;
  const item = String(row.item ?? '');
  const match = item.match(/^(.+?)\s*[—–-]\s/u);
  return match ? match[1].trim() : item.trim();
}

function extractApprovalRefCandidates(approval: Row) {
  const refs = new Set<string>();
  const refId = String(approval.refId ?? '').trim();
  if (refId) refs.add(refId);
  const normalized = normalizeApprovalRefKey(approval);
  if (normalized) refs.add(normalized);
  const item = String(approval.item ?? '');
  const match = item.match(/^(.+?)\s*[—–-]\s/u);
  if (match) refs.add(match[1].trim());
  return [...refs].filter(Boolean);
}

function approvalRefsMatch(row: Row, refType: string, refId: string) {
  if (String(row.refType ?? '') !== refType) return false;
  const candidates = new Set<string>([refId, ...extractApprovalRefCandidates(row)]);
  const rowRef = String(row.refId ?? '').trim();
  if (rowRef && candidates.has(rowRef)) return true;
  const item = String(row.item ?? '');
  for (const candidate of candidates) {
    if (candidate && item.startsWith(`${candidate} —`)) return true;
    if (candidate && item.startsWith(`${candidate}—`)) return true;
  }
  return false;
}

async function findApprovalRowInApi(refType: string, refId: string, approval?: Row) {
  const { rows } = await fetchResourcePage(APPROVALS_PATH, { page: 1, limit: 200 });
  if (approval) {
    const direct = rows.find((row) => resolveApiRowId(row) === resolveApiRowId(approval));
    if (direct) return direct;
  }
  return rows.find((row) => approvalRefsMatch(row, refType, refId)) ?? null;
}

export function dedupeApprovalRows(rows: Row[]) {
  const pendingByRef = new Map<string, Row>();
  const finalized: Row[] = [];

  for (const row of rows) {
    const status = String(row.status ?? '').toLowerCase();
    if (status === 'pending') {
      const key = `${String(row.refType ?? '')}:${normalizeApprovalRefKey(row)}`;
      const existing = pendingByRef.get(key);
      if (!existing) {
        pendingByRef.set(key, row);
        continue;
      }
      const existingAt = String(existing.createdAt ?? '');
      const nextAt = String(row.createdAt ?? '');
      if (nextAt.localeCompare(existingAt) > 0) {
        pendingByRef.set(key, row);
      }
      continue;
    }
    finalized.push(row);
  }

  return sortRowsNewestFirst([...finalized, ...pendingByRef.values()]);
}

function markApprovalRowStatus(
  state: AppState,
  approval: Row,
  status: 'approved' | 'rejected',
) {
  const approvalKey = String(approval.id ?? approval.legacyId ?? '');
  if (approvalKey) {
    const linked = listApprovals(state).find(
      (row) => String(row.id) === approvalKey || String(row.legacyId ?? '') === approvalKey,
    );
    if (linked) {
      return updateInState(state, 'approvals', String(linked.id), { status });
    }
  }
  return markApprovalStatus(state, String(approval.refType ?? ''), String(approval.refId ?? ''), status);
}

async function syncSiblingApprovals(
  approval: Row,
  status: 'approved' | 'rejected',
  excludeMongoId: string,
) {
  const refType = String(approval.refType ?? '');
  const refId = String(approval.refId ?? '');
  if (!refType || !refId) return;

  const { rows } = await fetchResourcePage(APPROVALS_PATH, { page: 1, limit: 200 });
  for (const row of rows) {
    if (String(row.status ?? '').toLowerCase() !== 'pending') continue;
    if (!approvalRefsMatch(row, refType, refId)) continue;
    const mongoId = resolveApiRowId(row);
    if (mongoId === excludeMongoId) continue;
    await updateResource(
      APPROVALS_PATH,
      mongoId,
      mapGenericPayloadToApi({ ...row, status }),
    );
  }
}

export function listApprovals(state: AppState) {
  return sortRowsNewestFirst(listFromState(state, 'approvals'));
}

export function findApprovalByRef(state: AppState, refType: string, refId: string) {
  return listApprovals(state).find(
    (row) => String(row.refType) === refType && String(row.refId) === refId,
  ) ?? null;
}

export function upsertApprovalInState(state: AppState, payload: ApprovalRequestPayload) {
  const existing = findApprovalByRef(state, payload.refType, payload.refId);
  const body = { ...payload, status: payload.status ?? 'pending' };
  if (existing) {
    return updateInState(state, 'approvals', String(existing.id), body);
  }
  return createInState(state, 'approvals', body, 'APR');
}

export function markApprovalStatus(
  state: AppState,
  refType: string,
  refId: string,
  status: 'approved' | 'rejected',
) {
  const linked = findApprovalByRef(state, refType, refId);
  if (linked) {
    return updateInState(state, 'approvals', String(linked.id), { status });
  }
  return { ok: true as const };
}

export function buildPurchaseRmApproval(order: Row): ApprovalRequestPayload {
  const refId = String(order.legacyId ?? order.id ?? order._mongoId ?? '');
  return {
    item: `${refId} — ${String(order.supplierName ?? 'Supplier')}`,
    requester: String(order.createdBy ?? 'System'),
    module: 'Purchase RM',
    refType: 'purchase_rm_order',
    refId,
    status: 'pending',
    notes: String(order.notes ?? ''),
  };
}

export function buildPurchaseOrderApproval(order: Row): ApprovalRequestPayload {
  const refId = String(order.id ?? order.legacyId ?? order._mongoId ?? '');
  return {
    item: `${refId} — ${String(order.supplier ?? order.supplierName ?? 'Supplier')}`,
    requester: String(order.createdBy ?? order.purchaser ?? 'System'),
    module: 'Purchase Order',
    refType: 'purchase_order',
    refId,
    status: 'pending',
    notes: String(order.notes ?? order.remarks ?? ''),
  };
}

export function buildLeaveRequestApproval(leave: Row): ApprovalRequestPayload {
  const refId = String(leave.id ?? leave.legacyId ?? '');
  const name = String(leave.employee ?? leave.employeeName ?? leave.employeeId ?? 'Employee');
  return {
    item: `Leave — ${name} (${String(leave.startDate ?? leave.fromDate ?? '')} to ${String(leave.endDate ?? leave.toDate ?? '')})`,
    requester: name,
    module: 'Leave Request',
    refType: 'leave_request',
    refId,
    status: 'pending',
    notes: String(leave.notes ?? leave.reason ?? ''),
  };
}

export function buildGenericApproval(payload: ApprovalRequestPayload) {
  return { ...payload, status: payload.status ?? 'pending' };
}

export async function syncApprovalToApi(payload: ApprovalRequestPayload) {
  try {
    const existing = await findApprovalRowInApi(payload.refType, payload.refId);
    const body = mapGenericPayloadToApi(buildGenericApproval(payload));
    if (existing) {
      const existingStatus = String(existing.status ?? '').toLowerCase();
      if (existingStatus === 'approved' || existingStatus === 'rejected') {
        return { ok: true as const };
      }
      const result = await updateResource(APPROVALS_PATH, resolveApiRowId(existing), body);
      return result.ok ? { ok: true as const } : { ok: false as const, error: result.error };
    }
    const result = await createResource(APPROVALS_PATH, body);
    return result.ok ? { ok: true as const } : { ok: false as const, error: result.error };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : 'Failed to sync approval request',
    };
  }
}

export async function syncPurchaseRmApproval(order: Row) {
  const status = String(order.status ?? '').toLowerCase();
  if (status !== 'pending_approval' && status !== 'pending') return { ok: true as const };
  return syncApprovalToApi(buildPurchaseRmApproval(order));
}

export async function syncPurchaseOrderApproval(order: Row) {
  const status = String(order.status ?? '').toLowerCase();
  if (status !== 'pending' && status !== 'pending_approval' && status !== 'sent') {
    return { ok: true as const };
  }
  return syncApprovalToApi(buildPurchaseOrderApproval(order));
}

export async function syncLeaveRequestApproval(leave: Row) {
  if (String(leave.status) !== 'pending') return { ok: true as const };
  return syncApprovalToApi(buildLeaveRequestApproval(leave));
}

export async function reconcilePendingApprovalsFromApi(
  purchaseRmRows: Row[],
  leaveRows: Row[] = [],
  purchaseOrdersRows: Row[] = [],
) {
  for (const order of purchaseRmRows) {
    const status = String(order.status ?? '').toLowerCase();
    if (status === 'pending_approval' || status === 'pending') {
      await syncPurchaseRmApproval(order);
    }
  }
  for (const leave of leaveRows) {
    if (String(leave.status ?? '').toLowerCase() === 'pending') {
      await syncLeaveRequestApproval(leave);
    }
  }
  for (const po of purchaseOrdersRows) {
    const status = String(po.status ?? '').toLowerCase();
    if (status === 'pending' || status === 'pending_approval' || status === 'sent') {
      await syncPurchaseOrderApproval(po);
    }
  }
}

function resolvePurchaseRmRefId(state: AppState, refId: string, approval?: Row) {
  const rows = listPurchaseRmOrders(state);
  const candidates = new Set<string>([refId, ...extractApprovalRefCandidates(approval ?? { refId })]);
  return rows.find((row) => {
    const ids = [row.id, row.legacyId, row._mongoId].map((value) => String(value ?? '')).filter(Boolean);
    return ids.some((id) => candidates.has(id));
  }) ?? null;
}

async function loadPurchaseRmRowsForApproval(
  localRows: Row[],
  approval: Row,
  refId: string,
) {
  if (localRows.length > 0) {
    const pseudo = { purchaseRmOrders: localRows } as AppState;
    const match = resolvePurchaseRmRefId(pseudo, refId, approval);
    if (match) return { rows: localRows, order: match };
  }

  try {
    const fetched = (await fetchResourcePage(PURCHASE_RM_PATH, { page: 1, limit: 200 })).rows.map((doc) => mapGenericApiRow(doc));
    const pseudo = { purchaseRmOrders: fetched } as AppState;
    let order = resolvePurchaseRmRefId(pseudo, refId, approval);
    if (order) return { rows: fetched, order };

    for (const candidate of extractApprovalRefCandidates(approval)) {
      const doc = await fetchResourceById(PURCHASE_RM_PATH, candidate);
      if (!doc) continue;
      order = mapGenericApiRow(doc);
      return { rows: [...fetched, order], order };
    }
    return { rows: fetched, order: null };
  } catch {
    return { rows: localRows, order: null };
  }
}

async function loadPurchaseOrderRowsForApproval(
  localRows: Row[],
  refId: string,
) {
  if (localRows.length > 0) {
    const match = localRows.find((row) => {
      const ids = [row.id, row.legacyId, row._mongoId].map((v) => String(v ?? '')).filter(Boolean);
      return ids.includes(refId);
    });
    if (match) return { rows: localRows, order: match };
  }

  try {
    const fetched = (await fetchResourcePage(EXTENDED_API_PATHS.purchaseOrders, { page: 1, limit: 200 })).rows.map((doc) => mapGenericApiRow(doc));
    const order = fetched.find((row) => {
      const ids = [row.id, row.legacyId, row._mongoId].map((v) => String(v ?? '')).filter(Boolean);
      return ids.includes(refId);
    }) ?? null;
    return { rows: fetched, order };
  } catch {
    return { rows: localRows, order: null };
  }
}

export function approveLinkedRequest(state: AppState, approval: Row) {
  const refType = String(approval.refType ?? '');
  const refId = String(approval.refId ?? '');
  if (refType === 'purchase_rm_order') {
    const order = resolvePurchaseRmRefId(state, refId, approval);
    if (order && String(order.status) === 'pending_approval') {
      const result = approvePurchaseRmOrder(state, String(order.id));
      if (!result.ok) return result;
    }
    markApprovalRowStatus(state, approval, 'approved');
    return { ok: true as const };
  }
  if (refType === 'purchase_order') {
    const po = listFromState(state, 'purchaseOrders').find(
      (r) => String(r.id) === refId || String(r.legacyId ?? '') === refId,
    );
    if (po) {
      updateInState(state, 'purchaseOrders', String(po.id), { status: 'Approved' });
    }
    markApprovalRowStatus(state, approval, 'approved');
    return { ok: true as const };
  }
  markApprovalRowStatus(state, approval, 'approved');
  return { ok: true as const };
}

export function rejectLinkedRequest(state: AppState, approval: Row) {
  const refType = String(approval.refType ?? '');
  const refId = String(approval.refId ?? '');
  if (refType === 'purchase_rm_order') {
    const order = resolvePurchaseRmRefId(state, refId, approval);
    if (order && String(order.status) === 'pending_approval') {
      const result = rejectPurchaseRmOrder(state, String(order.id));
      if (!result.ok) return result;
    }
    markApprovalRowStatus(state, approval, 'rejected');
    return { ok: true as const };
  }
  if (refType === 'purchase_order') {
    const po = listFromState(state, 'purchaseOrders').find(
      (r) => String(r.id) === refId || String(r.legacyId ?? '') === refId,
    );
    if (po) {
      updateInState(state, 'purchaseOrders', String(po.id), { status: 'Draft' });
    }
    markApprovalRowStatus(state, approval, 'rejected');
    return { ok: true as const };
  }
  markApprovalRowStatus(state, approval, 'rejected');
  return { ok: true as const };
}

export async function approveLinkedRequestApi(
  approval: Row,
  ctx: {
    appState: AppState;
    purchaseRmRows: Row[];
    purchaseOrderRows?: Row[];
    updatePurchaseRm: (id: string, body: Row) => Promise<{ ok: boolean; error?: string }>;
    updatePurchaseOrder?: (id: string, body: Row) => Promise<{ ok: boolean; error?: string }>;
    updateApproval: (id: string, body: Row) => Promise<{ ok: boolean; error?: string }>;
  },
) {
  const refType = String(approval.refType ?? '');
  const refId = String(approval.refId ?? '');
  const approvalMongoId = resolveApiRowId(approval);

  if (refType === 'purchase_rm_order') {
    const loaded = await loadPurchaseRmRowsForApproval(ctx.purchaseRmRows, approval, refId);
    const pseudo = {
      ...ctx.appState,
      purchaseRmOrders: loaded.rows.map((row) => ({ ...row })),
      approvals: [{ ...approval }],
    } as AppState;

    const order = loaded.order ?? resolvePurchaseRmRefId(pseudo, refId, approval);
    if (order && String(order.status) === 'pending_approval') {
      const local = approvePurchaseRmOrder(pseudo, String(order.id));
      if (!local.ok) return local;
      const updated = resolvePurchaseRmRefId(pseudo, refId, approval) ?? { ...order, status: 'sent' };
      const sync = await ctx.updatePurchaseRm(
        resolveApiRowId(updated),
        mapGenericPayloadToApi(updated as Row),
      );
      if (!sync.ok) return sync;
    }
  } else if (refType === 'purchase_order' && ctx.updatePurchaseOrder) {
    const loaded = await loadPurchaseOrderRowsForApproval(ctx.purchaseOrderRows ?? [], refId);
    if (loaded.order) {
      const sync = await ctx.updatePurchaseOrder(
        resolveApiRowId(loaded.order),
        mapGenericPayloadToApi({ ...loaded.order, status: 'Approved' }),
      );
      if (!sync.ok) return sync;
    }
  }

  const syncApproval = await ctx.updateApproval(
    approvalMongoId,
    mapGenericPayloadToApi({
      ...approval,
      status: 'approved',
      decidedAt: new Date().toISOString(),
    }),
  );
  if (!syncApproval.ok) return syncApproval;

  await syncSiblingApprovals(approval, 'approved', approvalMongoId);
  return { ok: true as const };
}

export async function rejectLinkedRequestApi(
  approval: Row,
  ctx: {
    appState: AppState;
    purchaseRmRows: Row[];
    purchaseOrderRows?: Row[];
    updatePurchaseRm: (id: string, body: Row) => Promise<{ ok: boolean; error?: string }>;
    updatePurchaseOrder?: (id: string, body: Row) => Promise<{ ok: boolean; error?: string }>;
    updateApproval: (id: string, body: Row) => Promise<{ ok: boolean; error?: string }>;
  },
) {
  const refType = String(approval.refType ?? '');
  const refId = String(approval.refId ?? '');
  const approvalMongoId = resolveApiRowId(approval);

  if (refType === 'purchase_rm_order') {
    const loaded = await loadPurchaseRmRowsForApproval(ctx.purchaseRmRows, approval, refId);
    const pseudo = {
      ...ctx.appState,
      purchaseRmOrders: loaded.rows.map((row) => ({ ...row })),
      approvals: [{ ...approval }],
    } as AppState;

    const order = loaded.order ?? resolvePurchaseRmRefId(pseudo, refId, approval);
    if (order && String(order.status) === 'pending_approval') {
      const local = rejectPurchaseRmOrder(pseudo, String(order.id));
      if (!local.ok) return local;
      const updated = resolvePurchaseRmRefId(pseudo, refId, approval) ?? { ...order, status: 'draft' };
      const sync = await ctx.updatePurchaseRm(
        resolveApiRowId(updated),
        mapGenericPayloadToApi(updated as Row),
      );
      if (!sync.ok) return sync;
    }
  } else if (refType === 'purchase_order' && ctx.updatePurchaseOrder) {
    const loaded = await loadPurchaseOrderRowsForApproval(ctx.purchaseOrderRows ?? [], refId);
    if (loaded.order) {
      const sync = await ctx.updatePurchaseOrder(
        resolveApiRowId(loaded.order),
        mapGenericPayloadToApi({ ...loaded.order, status: 'Draft' }),
      );
      if (!sync.ok) return sync;
    }
  }

  const syncApproval = await ctx.updateApproval(
    approvalMongoId,
    mapGenericPayloadToApi({
      ...approval,
      status: 'rejected',
      decidedAt: new Date().toISOString(),
    }),
  );
  if (!syncApproval.ok) return syncApproval;

  await syncSiblingApprovals(approval, 'rejected', approvalMongoId);
  return { ok: true as const };
}

export function approvalDetailHref(approval: Row): string | null {
  const refType = String(approval.refType ?? '');
  const refId = String(approval.refId ?? '');
  if (refType === 'purchase_rm_order') {
    return `/purchases/purchase-rm?focus=${encodeURIComponent(refId)}&from=approval`;
  }
  if (refType === 'purchase_order') {
    return `/purchases/orders?focus=${encodeURIComponent(refId)}&from=approval`;
  }
  if (refType === 'leave_request') {
    return '/hrm/leave';
  }
  return null;
}
