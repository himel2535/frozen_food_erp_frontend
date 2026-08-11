import type { AppState } from '@/lib/state/types';
import { logStateMutation } from '@/lib/services/audit-log-service';

type Row = Record<string, unknown>;

function rowSummary(payload: Row, id: string) {
  return String(payload.name ?? payload.title ?? payload.label ?? payload.item ?? id);
}

function nextId(prefix: string, existing: Row[]): string {
  const nums = existing
    .map((r) => String(r.id ?? ''))
    .filter((id) => id.startsWith(prefix))
    .map((id) => parseInt(id.replace(/\D/g, ''), 10))
    .filter((n) => !Number.isNaN(n));
  const max = nums.length ? Math.max(...nums) : 0;
  return `${prefix}-${String(max + 1).padStart(3, '0')}`;
}

export function listFromState(state: AppState, stateKey: keyof AppState | string): Row[] {
  const slice = state[stateKey as keyof AppState];
  return Array.isArray(slice) ? (slice as Row[]) : [];
}

export function createInState(
  state: AppState,
  stateKey: keyof AppState | string,
  payload: Row,
  idPrefix = 'REC',
  options?: { prepend?: boolean },
): { ok: true; id: string } | { ok: false; error: string } {
  const rows = listFromState(state, stateKey);
  const id = String(payload.id ?? nextId(idPrefix, rows));
  const record = { ...payload, id, createdAt: payload.createdAt ?? new Date().toISOString() };
  (state as Record<string, unknown>)[stateKey as string] = options?.prepend
    ? [record, ...rows]
    : [...rows, record];
  logStateMutation(state, String(stateKey), 'CREATE', id, rowSummary(record, id));
  return { ok: true, id };
}

export function updateInState(
  state: AppState,
  stateKey: keyof AppState | string,
  id: string,
  payload: Row
): { ok: boolean; error?: string } {
  const rows = listFromState(state, stateKey);
  const idx = rows.findIndex((r) => String(r.id) === id);
  if (idx < 0) return { ok: false, error: 'Record not found' };
  const updated = { ...rows[idx], ...payload, id, updatedAt: new Date().toISOString() };
  const next = [...rows];
  next[idx] = updated;
  (state as Record<string, unknown>)[stateKey as string] = next;
  logStateMutation(state, String(stateKey), 'UPDATE', id, rowSummary(updated, id));
  return { ok: true };
}

export function deleteFromState(
  state: AppState,
  stateKey: keyof AppState | string,
  id: string
): { ok: boolean; error?: string } {
  const rows = listFromState(state, stateKey);
  const removed = rows.find((r) => String(r.id) === id);
  const next = rows.filter((r) => String(r.id) !== id);
  if (next.length === rows.length) return { ok: false, error: 'Record not found' };
  (state as Record<string, unknown>)[stateKey as string] = next;
  logStateMutation(state, String(stateKey), 'DELETE', id, removed ? rowSummary(removed, id) : id);
  return { ok: true };
}

export function listFromCrmCollection(
  state: AppState,
  collectionKey: string,
  filter?: (row: Row) => boolean
): Row[] {
  const crmData = state.crmData as Record<string, Record<string, Row>> | undefined;
  if (!crmData?.[collectionKey]) return [];
  const rows = Object.values(crmData[collectionKey]);
  return filter ? rows.filter(filter) : rows;
}

export function formatCurrency(value: number) {
  return `৳ ${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
