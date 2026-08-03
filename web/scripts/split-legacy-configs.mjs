/**
 * Split legacy-parity-configs.ts into domain chunks.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = path.join(__dirname, '..', 'lib', 'modules', 'legacy-parity-configs.ts');
const outDir = path.join(__dirname, '..', 'lib', 'modules', 'legacy-parity');
const lines = fs.readFileSync(src, 'utf8').split(/\r?\n/);

function write(name, imports, body, extraExports = '') {
  const content = `'use client';\n\n${imports}\n${body}\n${extraExports}`.trim() + '\n';
  fs.writeFileSync(path.join(outDir, `${name}.ts`), content, 'utf8');
  console.log(`Wrote legacy-parity/${name}.ts`);
}

fs.mkdirSync(outDir, { recursive: true });

write(
  'purchases',
  `import {
  listSuppliers, createSupplier, updateSupplier, deleteSupplier,
  listPurchases, createPurchaseOrder, updatePurchaseOrder, deletePurchaseOrder,
  getPurchaseOrderMetrics, sendPurchaseOrder, receivePurchaseOrder, cancelPurchaseOrder,
  listGoodsReceived, listVendorBills, listPurchasePayments, listPurchaseReturns, listRecipes,
  createGoodsReceived,
} from '@/lib/services/purchases-service';
import { createInState, updateInState, deleteFromState } from '@/lib/services/domain-service';
import { adapter, money, React, toast, confirmAction, type DedicatedModuleConfig } from './shared';`,
  [
    lines.slice(56, 133).join('\n'),
    '',
    'export const CONFIGS: Record<string, DedicatedModuleConfig> = {',
    lines.slice(135, 335).join('\n'),
    '} as Record<string, DedicatedModuleConfig>;',
  ].join('\n'),
  'export { sendPurchaseOrder, receivePurchaseOrder, cancelPurchaseOrder };',
);

write(
  'manufacturing',
  `import {
  listProductionOrders, createProductionOrder, updateProductionOrder, deleteProductionOrder,
  startProductionOrder, completeProductionOrder,
  crudFactory,
} from '@/lib/services/manufacturing-service';
import { adapter, money, React, toast, confirmAction, type DedicatedModuleConfig } from './shared';`,
  [
    'export const CONFIGS: Record<string, DedicatedModuleConfig> = {',
    lines.slice(336, 512).join('\n'),
    '} as Record<string, DedicatedModuleConfig>;',
  ].join('\n'),
  'export { startProductionOrder, completeProductionOrder };',
);

write(
  'accounting',
  `import {
  listJournals, createJournalEntry, updateJournalEntry, deleteJournalEntry,
  listLedger, getJournalMetrics, getLedgerMetrics, crudAccounting,
} from '@/lib/services/accounting-service';
import { listSuppliers, updateSupplier } from '@/lib/services/purchases-service';
import { listFromState, updateInState } from '@/lib/services/domain-service';
import { adapter, money, type DedicatedModuleConfig } from './shared';`,
  [
    'export const CONFIGS: Record<string, DedicatedModuleConfig> = {',
    lines.slice(513, 621).join('\n'),
    '};',
    '',
    ...lines.slice(623, 753).map((line) =>
      line.replace(/^LEGACY_PARITY_CONFIGS\[('[^']+')\] = /, 'CONFIGS[$1] = '),
    ),
  ].join('\n'),
);

write(
  'hrm',
  `import {
  listEmployees, createEmployee, updateEmployee, deleteEmployee, getEmployeeMetrics,
  getEmployeeInitialForm, mapEmployeeRowToForm,
  listDepartments, listDesignations, listAttendance, listLeaveRequests,
  listSalaryStructures, listPayrollRuns, listPayrollSlips, crudHrm,
} from '@/lib/services/hrm-service';
import { getSalaryStructureMetrics, formatMoney as payrollMoney } from '@/lib/services/payroll-service';
import { createInState, updateInState, deleteFromState } from '@/lib/services/domain-service';
import { adapter, money, type DedicatedModuleConfig } from './shared';`,
  [
    'export const CONFIGS: Record<string, DedicatedModuleConfig> = {',
    lines.slice(756, 989).join('\n'),
    '} as Record<string, DedicatedModuleConfig>;',
  ].join('\n'),
);

write(
  'misc',
  `import { PORT_CONFIGS } from '@/lib/modules/port-configs';
import { summarizeProjects } from '@/lib/services/projects-service';
import { createInState, updateInState, deleteFromState } from '@/lib/services/domain-service';
import { crudFactory } from '@/lib/services/manufacturing-service';
import { crmActivityAdapter } from '@/lib/modules/port-adapters';
import { adapter, money, type DedicatedModuleConfig } from './shared';`,
  [
    'export const CONFIGS: Record<string, DedicatedModuleConfig> = {',
    lines.slice(993, 1253).join('\n'),
    '} as Record<string, DedicatedModuleConfig>;',
  ].join('\n'),
);

console.log('Done splitting legacy configs.');
