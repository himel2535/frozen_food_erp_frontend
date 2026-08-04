'use client';

import React from 'react';
import { toast, confirmAction } from '@/lib/ui/feedback';
import type { DedicatedModuleConfig } from '@/components/modules/shared/DedicatedModule';
import type { PortAdapter } from '@/lib/modules/port-types';
import { formatCurrency } from '@/lib/services/domain-service';
import type { AppState } from '@/lib/state/types';

type Row = Record<string, unknown>;

export function adapter(ops: {
  list: (s: AppState) => Row[];
  create?: (s: AppState, p: Row) => { ok: boolean; error?: string; id?: string };
  update?: (s: AppState, id: string, p: Row) => { ok: boolean; error?: string };
  delete?: (s: AppState, id: string) => { ok: boolean; error?: string };
  getInitialForm?: (s: AppState) => Row;
  mapRowToForm?: (row: Row) => Row;
}): PortAdapter {
  return ops as PortAdapter;
}

export function money(v: unknown) {
  return formatCurrency(Number(v ?? 0));
}

export function countStatus(rows: Row[], status: string): number {
  return rows.filter((r) => String(r.status ?? '').toLowerCase() === status.toLowerCase()).length;
}

export function countStatusIn(rows: Row[], statuses: string[]): number {
  const set = new Set(statuses.map((s) => s.toLowerCase()));
  return rows.filter((r) => set.has(String(r.status ?? '').toLowerCase())).length;
}

export function sumField(rows: Row[], field: string): number {
  return rows.reduce((s, r) => s + Number(r[field] ?? 0), 0);
}

import { resolveKpiIcon } from '@/lib/ui/kpi-icons';

export function kpiCount(key: string, label: string, value: number | string) {
  return { key, label, value: String(value), iconify: resolveKpiIcon(key, label) };
}

export function kpiMoneySum(key: string, label: string, rows: Row[], field: string) {
  return { key, label, value: money(sumField(rows, field)), iconify: resolveKpiIcon(key, label) };
}

export function kpiValue(key: string, label: string, value: string, extra?: { sub?: string; alert?: boolean }) {
  return { key, label, value, iconify: resolveKpiIcon(key, label), ...extra };
}

export { React, toast, confirmAction };
export type { DedicatedModuleConfig, Row };
