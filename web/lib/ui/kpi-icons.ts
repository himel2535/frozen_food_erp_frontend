/**
 * KPI icons — Flaticon-style via Iconify `flat-color-icons:*` (verified names only).
 * Row-level: no duplicate icons on the same KPI row.
 * Session-level: prefers icons not yet used on other pages when possible.
 */

export type KpiIconInput = {
  key: string;
  label: string;
  icon?: unknown;
  iconify?: string;
};

/** Verified flat-color-icons that load correctly from Iconify CDN. */
export const KPI_ICON_POOL: readonly string[] = [
  'flat-color-icons:serial-tasks',
  'flat-color-icons:todo-list',
  'flat-color-icons:factory',
  'flat-color-icons:shipped',
  'flat-color-icons:currency-exchange',
  'flat-color-icons:paid',
  'flat-color-icons:manager',
  'flat-color-icons:rules',
  'flat-color-icons:tree-structure',
  'flat-color-icons:filing-cabinet',
  'flat-color-icons:combo-chart',
  'flat-color-icons:line-chart',
  'flat-color-icons:pie-chart',
  'flat-color-icons:statistics',
  'flat-color-icons:opened-folder',
  'flat-color-icons:folder',
  'flat-color-icons:document',
  'flat-color-icons:calendar',
  'flat-color-icons:clock',
  'flat-color-icons:alarm-clock',
  'flat-color-icons:shop',
  'flat-color-icons:home',
  'flat-color-icons:library',
  'flat-color-icons:download',
  'flat-color-icons:upload',
  'flat-color-icons:edit-image',
  'flat-color-icons:approval',
  'flat-color-icons:ok',
  'flat-color-icons:cancel',
  'flat-color-icons:high-priority',
  'flat-color-icons:medium-priority',
  'flat-color-icons:low-priority',
  'flat-color-icons:positive-dynamic',
  'flat-color-icons:negative-dynamic',
  'flat-color-icons:money-transfer',
  'flat-color-icons:invite',
  'flat-color-icons:voice-presentation',
  'flat-color-icons:planner',
  'flat-color-icons:briefcase',
  'flat-color-icons:graduation-cap',
  'flat-color-icons:services',
  'flat-color-icons:deployment',
  'flat-color-icons:engineering',
  'flat-color-icons:package',
  'flat-color-icons:donate',
  'flat-color-icons:bookmark',
  'flat-color-icons:flash-on',
  'flat-color-icons:idea',
  'flat-color-icons:search',
  'flat-color-icons:globe',
  'flat-color-icons:contacts',
  'flat-color-icons:phone',
  'flat-color-icons:leave',
  'flat-color-icons:ratings',
  'flat-color-icons:reading',
  'flat-color-icons:stack-of-photos',
  'flat-color-icons:heat-map',
  'flat-color-icons:flow-chart',
  'flat-color-icons:org-unit',
  'flat-color-icons:process',
  'flat-color-icons:inspection',
  'flat-color-icons:puzzle',
  'flat-color-icons:sim-card',
  'flat-color-icons:smartphone-tablet',
  'flat-color-icons:multiple-devices',
  'flat-color-icons:print',
  'flat-color-icons:globe',
  'flat-color-icons:landscape',
  'flat-color-icons:in-transit',
  'flat-color-icons:automotive',
  'flat-color-icons:empty-trash',
  'flat-color-icons:biomass',
  'flat-color-icons:biomass',
  'flat-color-icons:money-transfer',
  'flat-color-icons:document',
  'flat-color-icons:checkmark',
  'flat-color-icons:calculator',
  'flat-color-icons:data-sheet',
  'flat-color-icons:voice-presentation',
  'flat-color-icons:timeline',
  'flat-color-icons:parallel-tasks',
  'flat-color-icons:biohazard',
  'flat-color-icons:feedback',
  'flat-color-icons:survey',
  'flat-color-icons:online-support',
  'flat-color-icons:support',
  'flat-color-icons:gallery',
  'flat-color-icons:camcorder',
  'flat-color-icons:music',
  'flat-color-icons:sports-mode',
  'flat-color-icons:electricity',
  'flat-color-icons:automotive',
  'flat-color-icons:safe',
  'flat-color-icons:donate',
  'flat-color-icons:video-call',
  'flat-color-icons:webcam',
  'flat-color-icons:customer-support',
  'flat-color-icons:business',
  'flat-color-icons:business-contact',
  'flat-color-icons:conference-call',
  'flat-color-icons:diploma-1',
  'flat-color-icons:faq',
  'flat-color-icons:file',
  'flat-color-icons:grid',
  'flat-color-icons:import',
  'flat-color-icons:key',
  'flat-color-icons:link',
  'flat-color-icons:menu',
  'flat-color-icons:multiple-inputs',
  'flat-color-icons:neutral-trading',
  'flat-color-icons:news',
  'flat-color-icons:overtime',
  'flat-color-icons:panorama',
  'flat-color-icons:lock',
  'flat-color-icons:template',
  'flat-color-icons:picture',
  'flat-color-icons:plus',
  'flat-color-icons:previous',
  'flat-color-icons:print',
  'flat-color-icons:privacy',
  'flat-color-icons:questions',
  'flat-color-icons:rating',
  'flat-color-icons:redo',
  'flat-color-icons:refresh',
  'flat-color-icons:remove-image',
  'flat-color-icons:rotate-to-landscape',
  'flat-color-icons:rotate-to-portrait',
  'flat-color-icons:sales-performance',
  'flat-color-icons:scatter-plot',
  'flat-color-icons:self-service-kiosk',
  'flat-color-icons:settings',
  'flat-color-icons:share',
  'flat-color-icons:signature',
  'flat-color-icons:sms',
  'flat-color-icons:audio-file',
  'flat-color-icons:switch-camera',
  'flat-color-icons:touchscreen-smartphone',
  'flat-color-icons:full-trash',
  'flat-color-icons:undo',
  'flat-color-icons:vip',
  'flat-color-icons:workflow',
  'flat-color-icons:list',
  'flat-color-icons:broken-link',
  'flat-color-icons:bullish',
  'flat-color-icons:collect',
  'flat-color-icons:database',
  'flat-color-icons:disclaimer',
  'flat-color-icons:empty-battery',
  'flat-color-icons:external',
  'flat-color-icons:full-battery',
  'flat-color-icons:document',
  'flat-color-icons:good-decision',
  'flat-color-icons:high-battery',
  'flat-color-icons:kindle',
  'flat-color-icons:low-battery',
  'flat-color-icons:middle-battery',
  'flat-color-icons:wi-fi-logo',
  'flat-color-icons:assistant',
  'flat-color-icons:audio-file',
  'flat-color-icons:online-support',
];

const VERIFIED_SET = new Set<string>(KPI_ICON_POOL);
const DEFAULT_ICON = 'flat-color-icons:statistics';

const KEY_ICON_MAP: Record<string, string> = {
  total: 'flat-color-icons:serial-tasks',
  count: 'flat-color-icons:todo-list',
  records: 'flat-color-icons:library',
  entries: 'flat-color-icons:document',
  batches: 'flat-color-icons:package',
  runs: 'flat-color-icons:factory',
  active: 'flat-color-icons:ok',
  inactive: 'flat-color-icons:cancel',
  completed: 'flat-color-icons:approval',
  ok: 'flat-color-icons:high-priority',
  closed: 'flat-color-icons:checkmark',
  fulfilled: 'flat-color-icons:collect',
  delivered: 'flat-color-icons:shipped',
  paid: 'flat-color-icons:paid',
  pending: 'flat-color-icons:clock',
  open: 'flat-color-icons:opened-folder',
  waiting: 'flat-color-icons:alarm-clock',
  draft: 'flat-color-icons:edit-image',
  planned: 'flat-color-icons:planner',
  progress: 'flat-color-icons:process',
  processing: 'flat-color-icons:deployment',
  scheduled: 'flat-color-icons:calendar',
  inprogress: 'flat-color-icons:flow-chart',
  partial: 'flat-color-icons:medium-priority',
  approved: 'flat-color-icons:approval',
  rejected: 'flat-color-icons:cancel',
  absent: 'flat-color-icons:leave',
  present: 'flat-color-icons:contacts',
  late: 'flat-color-icons:overtime',
  low: 'flat-color-icons:low-priority',
  alert: 'flat-color-icons:high-priority',
  short: 'flat-color-icons:negative-dynamic',
  oos: 'flat-color-icons:empty-trash',
  overdue: 'flat-color-icons:alarm-clock',
  value: 'flat-color-icons:currency-exchange',
  cost: 'flat-color-icons:money-transfer',
  money: 'flat-color-icons:money-transfer',
  due: 'flat-color-icons:negative-dynamic',
  revenue: 'flat-color-icons:line-chart',
  expense: 'flat-color-icons:document',
  net: 'flat-color-icons:positive-dynamic',
  margin: 'flat-color-icons:pie-chart',
  profit: 'flat-color-icons:bullish',
  loss: 'flat-color-icons:negative-dynamic',
  qty: 'flat-color-icons:tree-structure',
  stock: 'flat-color-icons:filing-cabinet',
  capacity: 'flat-color-icons:home',
  util: 'flat-color-icons:combo-chart',
  utilization: 'flat-color-icons:heat-map',
  rate: 'flat-color-icons:ratings',
  conversion: 'flat-color-icons:statistics',
  payment: 'flat-color-icons:paid',
  payments: 'flat-color-icons:money-transfer',
  customer: 'flat-color-icons:contacts',
  customers: 'flat-color-icons:invite',
  supplier: 'flat-color-icons:shop',
  suppliers: 'flat-color-icons:business-contact',
  employee: 'flat-color-icons:manager',
  employees: 'flat-color-icons:business',
  department: 'flat-color-icons:org-unit',
  departments: 'flat-color-icons:briefcase',
  designation: 'flat-color-icons:graduation-cap',
  designations: 'flat-color-icons:diploma-1',
  invoice: 'flat-color-icons:document',
  invoices: 'flat-color-icons:document',
  order: 'flat-color-icons:shipped',
  orders: 'flat-color-icons:package',
  quote: 'flat-color-icons:voice-presentation',
  quotes: 'flat-color-icons:voice-presentation',
  lead: 'flat-color-icons:bookmark',
  leads: 'flat-color-icons:search',
  deal: 'flat-color-icons:sales-performance',
  deals: 'flat-color-icons:combo-chart',
  won: 'flat-color-icons:vip',
  forecast: 'flat-color-icons:scatter-plot',
  warehouse: 'flat-color-icons:filing-cabinet',
  warehouses: 'flat-color-icons:home',
  category: 'flat-color-icons:folder',
  categories: 'flat-color-icons:stack-of-photos',
  unit: 'flat-color-icons:rules',
  units: 'flat-color-icons:rules',
  unused: 'flat-color-icons:puzzle',
  transfer: 'flat-color-icons:download',
  transfers: 'flat-color-icons:upload',
  adjustment: 'flat-color-icons:edit-image',
  adjustments: 'flat-color-icons:inspection',
  production: 'flat-color-icons:engineering',
  purchase: 'flat-color-icons:shop',
  purchases: 'flat-color-icons:document',
  sales: 'flat-color-icons:line-chart',
  avg: 'flat-color-icons:calculator',
  avgbase: 'flat-color-icons:data-sheet',
  bom: 'flat-color-icons:flow-chart',
  assigned: 'flat-color-icons:manager',
  payroll: 'flat-color-icons:money-transfer',
  structures: 'flat-color-icons:rules',
  structure: 'flat-color-icons:services',
  calls: 'flat-color-icons:phone',
  meetings: 'flat-color-icons:conference-call',
  followups: 'flat-color-icons:alarm-clock',
  headcount: 'flat-color-icons:business',
  joined: 'flat-color-icons:invite',
  left: 'flat-color-icons:leave',
  netchange: 'flat-color-icons:refresh',
  configured: 'flat-color-icons:checkmark',
  empty: 'flat-color-icons:empty-trash',
  fields: 'flat-color-icons:data-sheet',
  maintenance: 'flat-color-icons:engineering',
  unread: 'flat-color-icons:flash-on',
  read: 'flat-color-icons:reading',
  warnings: 'flat-color-icons:high-priority',
  admin: 'flat-color-icons:safe',
  write: 'flat-color-icons:edit-image',
  recv: 'flat-color-icons:positive-dynamic',
  pay: 'flat-color-icons:negative-dynamic',
  debit: 'flat-color-icons:download',
  credit: 'flat-color-icons:upload',
  balance: 'flat-color-icons:database',
  diff: 'flat-color-icons:neutral-trading',
  accounts: 'flat-color-icons:file',
  equity: 'flat-color-icons:bullish',
  liab: 'flat-color-icons:negative-dynamic',
  assets: 'flat-color-icons:safe',
  spend: 'flat-color-icons:donate',
  packed: 'flat-color-icons:package',
  reviewed: 'flat-color-icons:rating',
  recorded: 'flat-color-icons:list',
  done: 'flat-color-icons:approval',
  withhead: 'flat-color-icons:manager',
  withcomponents: 'flat-color-icons:puzzle',
  roles: 'flat-color-icons:signature',
  quotation: 'flat-color-icons:voice-presentation',
  pipeline: 'flat-color-icons:timeline',
  receivable: 'flat-color-icons:positive-dynamic',
  payable: 'flat-color-icons:negative-dynamic',
  collected: 'flat-color-icons:collect',
  disbursed: 'flat-color-icons:paid',
  slips: 'flat-color-icons:document',
  permissions: 'flat-color-icons:key',
  documents: 'flat-color-icons:folder',
  settings: 'flat-color-icons:settings',
  preferences: 'flat-color-icons:bookmark',
  requests: 'flat-color-icons:questions',
  notifications: 'flat-color-icons:flash-on',
  activities: 'flat-color-icons:timeline',
  wholesale: 'flat-color-icons:shop',
  users: 'flat-color-icons:contacts',
  risk: 'flat-color-icons:high-priority',
  mold: 'flat-color-icons:engineering',
  molds: 'flat-color-icons:automotive',
  wastage: 'flat-color-icons:empty-trash',
  packing: 'flat-color-icons:package',
  journal: 'flat-color-icons:file',
  ledger: 'flat-color-icons:database',
  attendance: 'flat-color-icons:calendar',
  leave: 'flat-color-icons:leave',
  project: 'flat-color-icons:planner',
  projects: 'flat-color-icons:workflow',
  approval: 'flat-color-icons:approval',
  approvals: 'flat-color-icons:checkmark',
  sku: 'flat-color-icons:document',
  quantity: 'flat-color-icons:tree-structure',
};

const LABEL_PATTERNS: { pattern: RegExp; icon: string }[] = [
  { pattern: /overdue|attention|alert|low stock|out of stock|broken|missed|at risk/i, icon: 'flat-color-icons:high-priority' },
  { pattern: /profit margin|margin|percent|rate|conversion/i, icon: 'flat-color-icons:pie-chart' },
  { pattern: /net due|net change|net today|net profit|net p/i, icon: 'flat-color-icons:positive-dynamic' },
  { pattern: /rejected|cancelled|inactive|absent|empty/i, icon: 'flat-color-icons:cancel' },
  { pattern: /approved|completed|fulfilled|delivered|paid|present|active|in stock|disbursed/i, icon: 'flat-color-icons:approval' },
  { pattern: /pending|waiting|open|draft|planned|scheduled/i, icon: 'flat-color-icons:clock' },
  { pattern: /partial|processing|in progress|in transit/i, icon: 'flat-color-icons:process' },
  { pattern: /revenue|sales|collected|spend|payable|receivable|due|money|amount|value|cost|avg|balance|debit|credit|equity|asset|liabilit|payroll|pipeline value/i, icon: 'flat-color-icons:currency-exchange' },
  { pattern: /stock|qty|quantity|capacity|util|warehouse|inventory|sku/i, icon: 'flat-color-icons:filing-cabinet' },
  { pattern: /customer|client|buyer|party|user/i, icon: 'flat-color-icons:contacts' },
  { pattern: /supplier|vendor/i, icon: 'flat-color-icons:shop' },
  { pattern: /employee|staff|headcount|payslip|attendance|leave|department|designation|assigned user/i, icon: 'flat-color-icons:manager' },
  { pattern: /invoice|bill|challan|receipt|journal|ledger/i, icon: 'flat-color-icons:document' },
  { pattern: /order|dispatch|shipment|shipping|challan|delivery/i, icon: 'flat-color-icons:shipped' },
  { pattern: /quote|quotation/i, icon: 'flat-color-icons:voice-presentation' },
  { pattern: /lead|prospect|follow.?up|call|meeting/i, icon: 'flat-color-icons:phone' },
  { pattern: /deal|pipeline|forecast|won/i, icon: 'flat-color-icons:sales-performance' },
  { pattern: /production|manufacturing|factory|mold|packing|wastage|bom|recipe/i, icon: 'flat-color-icons:factory' },
  { pattern: /project|milestone|deadline/i, icon: 'flat-color-icons:planner' },
  { pattern: /permission|role|setting|document|preference|template/i, icon: 'flat-color-icons:services' },
  { pattern: /notification|unread|warning/i, icon: 'flat-color-icons:flash-on' },
  { pattern: /report|metric|headcount|joiner|leaver/i, icon: 'flat-color-icons:statistics' },
  { pattern: /total|count|records|entries/i, icon: 'flat-color-icons:serial-tasks' },
];

const globalUsedKpiIcons = new Set<string>();
let poolCursor = 0;

function normalizeKey(key: string): string {
  return key.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function sanitizeKpiIcon(icon: string | undefined): string {
  if (icon && VERIFIED_SET.has(icon)) return icon;
  if (icon?.startsWith('fluent-color:')) return icon;
  return DEFAULT_ICON;
}

export function resolveKpiIcon(key: string, label: string): string {
  const normalizedKey = normalizeKey(key);
  if (KEY_ICON_MAP[normalizedKey]) return sanitizeKpiIcon(KEY_ICON_MAP[normalizedKey]);

  for (const [mapKey, icon] of Object.entries(KEY_ICON_MAP)) {
    if (normalizedKey.includes(mapKey) || mapKey.includes(normalizedKey)) {
      return sanitizeKpiIcon(icon);
    }
  }

  for (const { pattern, icon } of LABEL_PATTERNS) {
    if (pattern.test(label)) return sanitizeKpiIcon(icon);
  }

  const pooled = KPI_ICON_POOL[poolCursor++ % KPI_ICON_POOL.length] ?? DEFAULT_ICON;
  return sanitizeKpiIcon(pooled);
}

function pickUniqueIcon(
  preferred: string,
  usedInRow: Set<string>,
  preferUnusedGlobally: boolean,
): string {
  const safePreferred = sanitizeKpiIcon(preferred);
  const candidates = [safePreferred, ...KPI_ICON_POOL.filter((icon) => icon !== safePreferred)];

  if (preferUnusedGlobally) {
    for (const icon of candidates) {
      if (!usedInRow.has(icon) && !globalUsedKpiIcons.has(icon)) return icon;
    }
  }

  for (const icon of candidates) {
    if (!usedInRow.has(icon)) return icon;
  }

  for (let i = 0; i < KPI_ICON_POOL.length; i += 1) {
    const icon = KPI_ICON_POOL[(poolCursor + i) % KPI_ICON_POOL.length];
    if (!usedInRow.has(icon)) {
      poolCursor = (poolCursor + i + 1) % KPI_ICON_POOL.length;
      return icon;
    }
  }

  return safePreferred;
}

/** Reset session-wide icon usage (e.g. full page reload helper). */
export function resetGlobalKpiIconUsage() {
  globalUsedKpiIcons.clear();
  poolCursor = 0;
}

/**
 * Resolve distinct icons for a KPI row.
 * Returns null only when item supplies a custom React `icon` node.
 */
export function resolveKpiIconsForRow(items: KpiIconInput[]): string[] {
  const usedInRow = new Set<string>();

  return items.map((item) => {
    if (item.icon) return DEFAULT_ICON;

    if (item.iconify) {
      let icon = sanitizeKpiIcon(item.iconify);
      if (usedInRow.has(icon)) {
        icon = pickUniqueIcon(icon, usedInRow, false);
      }
      usedInRow.add(icon);
      globalUsedKpiIcons.add(icon);
      return icon;
    }

    const preferred = resolveKpiIcon(item.key, item.label);
    const icon = pickUniqueIcon(preferred, usedInRow, false);
    usedInRow.add(icon);
    globalUsedKpiIcons.add(icon);
    return icon;
  });
}

/** Unique KPI icons to preload on boot — avoids icon pop-in on page navigation. */
export function getKpiPreloadIcons(): string[] {
  const icons = new Set<string>([DEFAULT_ICON]);
  for (const icon of Object.values(KEY_ICON_MAP)) icons.add(icon);
  for (const icon of KPI_ICON_POOL) icons.add(icon);
  return [...icons];
}

/** Standard Flaticon-style icons for inventory product KPI rows. */
export const INVENTORY_STANDARD_KPI_ICONS = {
  count: 'flat-color-icons:todo-list',
  stock: 'flat-color-icons:filing-cabinet',
  low: 'flat-color-icons:low-priority',
  oos: 'flat-color-icons:empty-trash',
  value: 'flat-color-icons:currency-exchange',
  skus: 'flat-color-icons:serial-tasks',
} as const;

/** Inventory module KPI icons to preload — keeps navigation smooth without loading the full pool. */
export const INVENTORY_KPI_PRELOAD_ICONS = [
  ...Object.values(INVENTORY_STANDARD_KPI_ICONS),
  'flat-color-icons:factory',
  'flat-color-icons:shipped',
  'flat-color-icons:clock',
  'flat-color-icons:approval',
  'flat-color-icons:download',
  'flat-color-icons:upload',
  'flat-color-icons:edit-image',
  'flat-color-icons:inspection',
  'flat-color-icons:home',
  'flat-color-icons:combo-chart',
  'flat-color-icons:folder',
  'flat-color-icons:rules',
  'flat-color-icons:package',
  'flat-color-icons:high-priority',
  'flat-color-icons:statistics',
] as const;

export function getInventoryKpiPreloadIcons(): string[] {
  return [...new Set(INVENTORY_KPI_PRELOAD_ICONS)];
}
