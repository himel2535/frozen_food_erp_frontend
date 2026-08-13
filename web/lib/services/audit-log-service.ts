import type { AppState, SystemAuditLogRecord } from '@/lib/state/types';
import type { KpiCardItem } from '@/components/shared/KpiCards';
import { isMongoDbBackend } from '@/lib/config/data-source';
import { createResource } from '@/lib/services/api-resource-service';
import { apiRequest } from '@/lib/services/api-client';

type AuditPayload = {
  action: string;
  module: string;
  description: string;
  entityType?: string;
  entityId?: string;
  actorId?: string;
  actorName?: string;
};

const MAX_LOGS = 500;

const STATE_KEY_MODULE_LABELS: Record<string, string> = {
  projects: 'Projects',
  employees: 'HRM',
  attendance: 'HRM',
  inventory: 'Inventory',
  inventoryCategories: 'Inventory',
  inventoryUnits: 'Inventory',
  inventoryWarehouses: 'Inventory',
  invoices: 'Sales',
  salesOrders: 'Sales',
  purchases: 'Purchases',
  purchasesSuppliers: 'Purchases',
  purchaseRmOrders: 'Purchases',
  purchasePayments: 'Purchases',
  payroll: 'Payroll',
  salaryStructures: 'Payroll',
  salarySheetEntries: 'Payroll',
  manufacturing: 'Factory',
  productionOrders: 'Factory',
  accounting: 'Accounts',
  cashboxEntries: 'Accounts',
  dueEntries: 'Accounts',
  trialBalance: 'Accounts',
  profitLoss: 'Accounts',
  balanceSheet: 'Accounts',
  approvals: 'Approvals',
  assets: 'Assets',
  notifications: 'Notifications',
};

function nowIso() {
  return new Date().toISOString();
}

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

function formatAuditTimestamp(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

function getActor(state: AppState) {
  const user = state.currentUser;
  return {
    id: String(user?.id ?? user?.employeeId ?? 'system'),
    name: String(user?.name ?? 'System'),
  };
}

function nextAuditId(state: AppState) {
  const logs = state.systemAuditLogsById ?? {};
  const nums = Object.keys(logs)
    .filter((id) => id.startsWith('AUD-'))
    .map((id) => parseInt(id.replace(/\D/g, ''), 10))
    .filter((n) => !Number.isNaN(n));
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `AUD-${String(next).padStart(4, '0')}`;
}

function moduleFilterKey(module: string) {
  const m = module.toLowerCase();
  if (m === 'auth') return 'auth';
  if (m === 'crm') return 'crm';
  if (m === 'sales') return 'sales';
  if (m === 'settings' || m === 'administration') return 'settings';
  if (m === 'hrm' || m === 'payroll') return 'hrm';
  if (m === 'purchases' || m === 'inventory' || m === 'factory' || m === 'accounts') return 'operations';
  return 'other';
}

function summarizeValue(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'object') {
    const row = value as Record<string, unknown>;
    return String(row.name ?? row.title ?? row.label ?? row.id ?? row.status ?? '').trim();
  }
  return '';
}

export function buildEntityAuditDescription(
  action: string,
  entityType: string,
  entityId: string,
  beforeSummary: unknown,
  afterSummary: unknown,
): string {
  const verb = action.replace(/-/g, ' ');
  const label = entityType.replace(/-/g, ' ');
  const after = summarizeValue(afterSummary);
  const before = summarizeValue(beforeSummary);

  if (action.toLowerCase() === 'login') return 'Successful login';
  if (action.toLowerCase() === 'logout') return 'Signed out';
  if (after) return `${verb} ${label}: ${after}`;
  if (before) return `${verb} ${label} ${entityId}: ${before}`;
  if (entityId) return `${verb} ${label} ${entityId}`;
  return `${verb} ${label}`;
}

export function ensureAuditState(state: AppState) {
  if (!state.systemAuditLogsById) {
    state.systemAuditLogsById = {};
  }

  const legacy = (state.crmData as Record<string, Record<string, Record<string, unknown>>> | undefined)
    ?.auditLogsById;
  if (!legacy) return;

  for (const log of Object.values(legacy)) {
    if (!log?.id || state.systemAuditLogsById[String(log.id)]) continue;
    state.systemAuditLogsById[String(log.id)] = {
      id: String(log.id),
      timestamp: String(log.timestamp ?? nowIso()),
      actorId: String(log.actorId ?? 'system'),
      actorName: String(log.actorName ?? 'System'),
      action: String(log.action ?? 'UPDATE').toUpperCase(),
      module: String(log.module ?? 'CRM'),
      entityType: log.entityType ? String(log.entityType) : undefined,
      entityId: log.entityId ? String(log.entityId) : undefined,
      description: buildEntityAuditDescription(
        String(log.action ?? 'update'),
        String(log.entityType ?? 'record'),
        String(log.entityId ?? ''),
        log.beforeSummary,
        log.afterSummary,
      ),
    };
  }
}

export function logSystemAudit(state: AppState, payload: AuditPayload): SystemAuditLogRecord {
  ensureAuditState(state);
  const actor = getActor(state);
  const entry: SystemAuditLogRecord = {
    id: nextAuditId(state),
    timestamp: nowIso(),
    actorId: payload.actorId ?? actor.id,
    actorName: payload.actorName ?? actor.name,
    action: payload.action.toUpperCase(),
    module: payload.module,
    entityType: payload.entityType,
    entityId: payload.entityId,
    description: payload.description.trim(),
  };

  state.systemAuditLogsById![entry.id] = entry;

  const ids = Object.keys(state.systemAuditLogsById!);
  if (ids.length > MAX_LOGS) {
    const sorted = ids
      .map((id) => state.systemAuditLogsById![id])
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    const removeCount = ids.length - MAX_LOGS;
    for (let i = 0; i < removeCount; i += 1) {
      delete state.systemAuditLogsById![sorted[i].id];
    }
  }

  if (isMongoDbBackend()) {
    createResource('/audit-logs', entry).catch(() => {});
  }

  return entry;
}

export function logStateMutation(
  state: AppState,
  stateKey: string,
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  id: string,
  summary?: string,
) {
  const module = STATE_KEY_MODULE_LABELS[stateKey] ?? 'System';
  const label = summary?.trim() || id;
  const verb = action === 'CREATE' ? 'Created' : action === 'UPDATE' ? 'Updated' : 'Deleted';
  logSystemAudit(state, {
    action,
    module,
    entityType: stateKey,
    entityId: id,
    description: `${verb} ${label} in ${module}`,
  });
}

export function listSystemAuditLogRecords(state: AppState): SystemAuditLogRecord[] {
  ensureAuditState(state);
  return Object.values(state.systemAuditLogsById ?? {}).sort((a, b) =>
    b.timestamp.localeCompare(a.timestamp),
  );
}

export function listSystemAuditLogsForTable(state: AppState) {
  return listSystemAuditLogRecords(state).map((log) => ({
    id: log.id,
    ts: formatAuditTimestamp(log.timestamp),
    user: log.actorName,
    type: log.action,
    module: log.module,
    desc: log.description,
    status: moduleFilterKey(log.module),
    timestamp: log.timestamp,
  }));
}

export function listEntityAuditLogs(
  state: AppState,
  entityType: string,
  entityId: string,
): SystemAuditLogRecord[] {
  return listSystemAuditLogRecords(state).filter(
    (log) => log.entityType === entityType && log.entityId === entityId,
  );
}

export function getAuditLogKpis(rows: Record<string, unknown>[]): KpiCardItem[] {
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${pad2(today.getMonth() + 1)}-${pad2(today.getDate())}`;
  const todayCount = rows.filter((row) => String(row.ts ?? '').startsWith(todayKey)).length;
  const users = new Set(rows.map((row) => String(row.user ?? '')).filter(Boolean));

  return [
    { key: 'total', label: 'Total Events', value: String(rows.length) },
    { key: 'today', label: "Today's Activity", value: String(todayCount) },
    { key: 'users', label: 'Active Users', value: String(users.size) },
  ];
}

export function auditLogsAdapter() {
  return {
    list: (state: AppState) => listSystemAuditLogsForTable(state),
  };
}
