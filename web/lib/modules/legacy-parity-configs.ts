import type { DedicatedModuleConfig } from '@/components/modules/shared/DedicatedModule';
import { PORT_CONFIGS } from '@/lib/modules/port-configs';

type LegacyDomain = 'purchases' | 'manufacturing' | 'accounting' | 'hrm' | 'misc';

const DOMAIN_BY_ID: Record<string, LegacyDomain> = {
  'purchases-suppliers': 'purchases',
  'purchases-orders': 'purchases',
  'purchases-goods-received': 'purchases',
  'purchases-bills': 'purchases',
  'purchases-payments': 'purchases',
  'purchases-returns': 'purchases',
  'purchases-recipes': 'purchases',
  'manufacturing-orders': 'manufacturing',
  'manufacturing-bom': 'manufacturing',
  'manufacturing-machine-maintenance': 'manufacturing',
  'manufacturing-mold-management': 'manufacturing',
  'manufacturing-wastage': 'manufacturing',
  'manufacturing-packing': 'manufacturing',
  'accounting-journals': 'accounting',
  'accounting-ledger': 'accounting',
  'accounting-dues': 'accounting',
  'accounting-receivables': 'accounting',
  'accounting-payables': 'accounting',
  'accounting-trial': 'accounting',
  'accounting-pl': 'accounting',
  'accounting-balance': 'accounting',
  'hrm-employees': 'hrm',
  'hrm-departments': 'hrm',
  'hrm-designations': 'hrm',
  'hrm-attendance': 'hrm',
  'hrm-leave': 'hrm',
  'payroll-structures': 'hrm',
  'payroll-runs': 'hrm',
  'payroll-slips': 'hrm',
  'crm-activities': 'misc',
  'sales-wholesale': 'misc',
  'settings-users': 'misc',
  'settings-roles': 'misc',
  'settings-permissions': 'misc',
  'settings-documents': 'misc',
  'settings-company': 'misc',
  'settings-profile': 'misc',
  'projects': 'misc',
  'asset-management': 'misc',
  'workflow-approvals': 'misc',
  'notifications': 'misc',
};

const cache = new Map<string, DedicatedModuleConfig>();

async function loadDomainConfigs(domain: LegacyDomain) {
  switch (domain) {
    case 'purchases':
      return import('./legacy-parity/purchases');
    case 'manufacturing':
      return import('./legacy-parity/manufacturing');
    case 'accounting':
      return import('./legacy-parity/accounting');
    case 'hrm':
      return import('./legacy-parity/hrm');
    case 'misc':
      return import('./legacy-parity/misc');
  }
}

export async function loadLegacyParityConfig(id: string): Promise<DedicatedModuleConfig> {
  const cached = cache.get(id);
  if (cached) return cached;

  const domain = DOMAIN_BY_ID[id];
  if (domain) {
    const mod = await loadDomainConfigs(domain);
    const config = mod.CONFIGS[id];
    if (config) {
      cache.set(id, config);
      return config;
    }
  }

  const fallback = PORT_CONFIGS[id] as DedicatedModuleConfig;
  cache.set(id, fallback);
  return fallback;
}

export function getLegacyParityConfig(id: string): DedicatedModuleConfig {
  const cached = cache.get(id);
  if (cached) return cached;
  return PORT_CONFIGS[id] as DedicatedModuleConfig;
}

export {
  sendPurchaseOrder,
  receivePurchaseOrder,
  cancelPurchaseOrder,
} from './legacy-parity/purchases';

export {
  startProductionOrder,
  completeProductionOrder,
} from './legacy-parity/manufacturing';
