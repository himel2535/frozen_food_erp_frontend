const KEY_ICON_MAP: Record<string, string> = {
  total: 'flat-color-icons:serial-tasks',
  count: 'flat-color-icons:serial-tasks',
  runs: 'flat-color-icons:factory',
  active: 'fluent-color:checkmark-circle-24',
  completed: 'fluent-color:checkmark-circle-24',
  ok: 'fluent-color:checkmark-circle-24',
  pending: 'fluent-color:clock-24',
  open: 'fluent-color:clock-24',
  draft: 'fluent-color:document-add-24',
  low: 'fluent-color:alert-badge-24',
  alert: 'fluent-color:alert-badge-24',
  short: 'fluent-color:alert-badge-24',
  value: 'flat-color-icons:currency-exchange',
  cost: 'flat-color-icons:currency-exchange',
  money: 'flat-color-icons:currency-exchange',
  due: 'flat-color-icons:currency-exchange',
  revenue: 'flat-color-icons:data-trending',
  qty: 'flat-color-icons:tree-structure',
  stock: 'flat-color-icons:tree-structure',
  capacity: 'flat-color-icons:filing-cabinet',
  util: 'flat-color-icons:combo-chart',
  utilization: 'flat-color-icons:combo-chart',
  rate: 'flat-color-icons:combo-chart',
  conversion: 'flat-color-icons:combo-chart',
  paid: 'flat-color-icons:paid',
  payment: 'flat-color-icons:paid',
  payments: 'flat-color-icons:paid',
  customer: 'fluent-color:person-24',
  customers: 'fluent-color:person-24',
  supplier: 'fluent-color:building-store-24',
  suppliers: 'fluent-color:building-store-24',
  employee: 'fluent-color:person-24',
  employees: 'fluent-color:person-24',
  department: 'fluent-color:organization-24',
  departments: 'fluent-color:organization-24',
  invoice: 'fluent-color:document-24',
  invoices: 'fluent-color:document-24',
  order: 'flat-color-icons:shipped',
  orders: 'flat-color-icons:shipped',
  quote: 'fluent-color:clipboard-task-24',
  quotes: 'fluent-color:clipboard-task-24',
  lead: 'flat-color-icons:opened-folder',
  leads: 'flat-color-icons:opened-folder',
  deal: 'flat-color-icons:combo-chart',
  deals: 'flat-color-icons:combo-chart',
  warehouse: 'flat-color-icons:filing-cabinet',
  warehouses: 'flat-color-icons:filing-cabinet',
  category: 'flat-color-icons:folder',
  categories: 'flat-color-icons:folder',
  unit: 'flat-color-icons:rules',
  units: 'flat-color-icons:rules',
  transfer: 'flat-color-icons:download',
  transfers: 'flat-color-icons:download',
  adjustment: 'flat-color-icons:edit-image',
  adjustments: 'flat-color-icons:edit-image',
  production: 'flat-color-icons:factory',
  purchase: 'fluent-color:document-add-24',
  purchases: 'fluent-color:document-add-24',
  sales: 'flat-color-icons:shipped',
  avg: 'flat-color-icons:currency-exchange',
  avgbase: 'flat-color-icons:currency-exchange',
  bom: 'flat-color-icons:serial-tasks',
  assigned: 'flat-color-icons:manager',
  payroll: 'flat-color-icons:paid',
  structures: 'flat-color-icons:rules',
  structure: 'flat-color-icons:rules',
};

const LABEL_PATTERNS: { pattern: RegExp; icon: string }[] = [
  { pattern: /low stock|short|alert|attention/i, icon: 'fluent-color:alert-badge-24' },
  { pattern: /active|completed|ok|in stock/i, icon: 'fluent-color:checkmark-circle-24' },
  { pattern: /pending|open|draft|planned/i, icon: 'fluent-color:clock-24' },
  { pattern: /cost|value|due|revenue|money|total.*৳|avg/i, icon: 'flat-color-icons:currency-exchange' },
  { pattern: /stock|qty|capacity|util/i, icon: 'flat-color-icons:tree-structure' },
  { pattern: /rate|conversion|percent/i, icon: 'flat-color-icons:combo-chart' },
  { pattern: /customer|client/i, icon: 'fluent-color:person-24' },
  { pattern: /supplier|vendor/i, icon: 'fluent-color:building-store-24' },
  { pattern: /employee|staff|hr/i, icon: 'fluent-color:person-24' },
  { pattern: /payment|paid|payroll|salary/i, icon: 'flat-color-icons:paid' },
  { pattern: /structure/i, icon: 'flat-color-icons:rules' },
  { pattern: /invoice|bill/i, icon: 'fluent-color:document-24' },
  { pattern: /order|sale/i, icon: 'flat-color-icons:shipped' },
  { pattern: /lead|prospect/i, icon: 'flat-color-icons:opened-folder' },
  { pattern: /deal|pipeline/i, icon: 'flat-color-icons:combo-chart' },
  { pattern: /warehouse|facility/i, icon: 'flat-color-icons:filing-cabinet' },
  { pattern: /total|count/i, icon: 'flat-color-icons:serial-tasks' },
];

export function resolveKpiIcon(key: string, label: string): string {
  const normalizedKey = key.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  if (KEY_ICON_MAP[normalizedKey]) return KEY_ICON_MAP[normalizedKey];

  for (const [mapKey, icon] of Object.entries(KEY_ICON_MAP)) {
    if (normalizedKey.includes(mapKey) || mapKey.includes(normalizedKey)) return icon;
  }

  for (const { pattern, icon } of LABEL_PATTERNS) {
    if (pattern.test(label)) return icon;
  }

  return 'flat-color-icons:statistics';
}
