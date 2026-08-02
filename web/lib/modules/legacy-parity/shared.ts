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

export { React, toast, confirmAction };
export type { DedicatedModuleConfig, Row };
