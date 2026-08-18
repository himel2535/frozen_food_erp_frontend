/**
 * Static verification of route hydration dependencies and query alignment.
 * Run: node scripts/verify-route-hydration.mjs
 */

const moduleCases = [
  { path: '/dashboard', expected: [], note: 'Dashboard uses separate critical/deferred boot' },
  { path: '/settings/users', expected: [], note: 'Admin API only' },
  { path: '/settings/roles', expected: [], note: 'Admin API only' },
  { path: '/settings/permissions', expected: ['permissions'], note: 'DedicatedModule' },
  { path: '/crm/customers', expected: ['customers'], note: 'List page' },
  { path: '/inventory/products', expected: ['products', 'categories', 'units', 'warehouses'], note: 'Product form lookups' },
  { path: '/inventory/raw-materials', expected: ['rawMaterials'], note: 'List only; lookups on form open' },
  { path: '/inventory/semi-finished-products', expected: ['semiFinishedProducts'], note: 'List only; lookups on form open' },
  { path: '/inventory/finished-goods', expected: ['finishedGoods'], note: 'List page; lookups on form open' },
  { path: '/sales/orders', expected: ['salesOrders'], note: 'List page' },
  { path: '/sales/orders/new', expected: ['salesOrders', 'customers', 'employees', 'products'], note: 'Form lookups' },
  { path: '/sales/invoices', expected: ['invoices'], note: 'Customer lookup deferred to form' },
  { path: '/purchases/orders', expected: ['purchaseOrders'], note: 'Supplier lookup deferred to form' },
  { path: '/hrm/employees', expected: ['employees'], note: 'List page' },
  { path: '/crm/leads', expected: ['leads', 'employees'], note: 'Owner filter' },
  { path: '/projects', expected: ['pmProjects', 'employees'], note: 'Manager filter' },
  { path: '/accounting/receivables', expected: ['invoices'], note: 'Primary only; payments via page hook' },
  { path: '/accounting/payables', expected: ['vendorBills'], note: 'Primary only' },
  { path: '/accounting/balance', expected: ['balanceSheet'], note: 'Report page' },
  { path: '/accounting/trial', expected: ['trialBalance'], note: 'Report page' },
  { path: '/accounting/pl', expected: ['profitLoss'], note: 'Report page' },
  { path: '/accounting/dues', expected: ['dues'], note: 'Extended modules' },
  { path: '/payroll/salary-sheet', expected: ['salarySheet'], note: 'Report page' },
];

const queryCases = [
  { path: '/accounting/balance', module: 'balanceSheet', limit: 500 },
  { path: '/accounting/trial', module: 'trialBalance', limit: 500 },
  { path: '/accounting/pl', module: 'profitLoss', limit: 500 },
  { path: '/payroll/salary-sheet', module: 'salarySheet', limit: 500 },
  { path: '/inventory/finished-goods', module: 'finishedGoods', limit: 10 },
  { path: '/inventory/products', module: 'products', limit: 10 },
  { path: '/sales/pos', module: 'products', limit: 50 },
  { path: '/sales/pos', module: 'pos', limit: 20 },
  { path: '/accounting/receivables', module: 'invoices', limit: 8 },
  { path: '/accounting/cashbox', module: 'cashbox', limit: 6 },
  { path: '/crm/leads', module: 'leads', limit: 10 },
  { path: '/purchases/suppliers', module: 'suppliers', limit: 8 },
];

// Inline mirror of route-hydration-config logic for CI-less verification
const ROUTE_PREFETCH = {
  '/dashboard': [],
  '/crm/customers': 'customers',
  '/crm/leads': 'leads',
  '/crm/deals': 'deals',
  '/crm/complaints': 'complaints',
  '/sales/orders': 'salesOrders',
  '/sales/invoices': 'invoices',
  '/sales/pos': ['products', 'pos'],
  '/purchases/suppliers': 'suppliers',
  '/purchases/orders': 'purchaseOrders',
  '/inventory/products': 'products',
  '/inventory/raw-materials': 'rawMaterials',
  '/inventory/semi-finished-products': 'semiFinishedProducts',
  '/inventory/finished-goods': 'finishedGoods',
  '/hrm/employees': 'employees',
  '/projects': 'pmProjects',
  '/accounting/receivables': 'invoices',
  '/accounting/payables': 'vendorBills',
  '/accounting/balance': 'balanceSheet',
  '/accounting/trial': 'trialBalance',
  '/accounting/pl': 'profitLoss',
  '/accounting/dues': 'dues',
  '/accounting/cashbox': 'cashbox',
  '/payroll/salary-sheet': 'salarySheet',
  '/settings/users': 'users',
  '/settings/roles': 'roles',
  '/settings/permissions': 'permissions',
};

const ROUTE_MODULE_QUERIES = {
  '/accounting/balance': { balanceSheet: { page: 1, limit: 500 } },
  '/accounting/trial': { trialBalance: { page: 1, limit: 500 } },
  '/accounting/pl': { profitLoss: { page: 1, limit: 500 } },
  '/payroll/salary-sheet': { salarySheet: { page: 1, limit: 500 } },
  '/inventory/finished-goods': { finishedGoods: { page: 1, limit: 10 } },
  '/inventory/products': { products: { page: 1, limit: 10 } },
  '/sales/pos': { products: { page: 1, limit: 50 }, pos: { page: 1, limit: 20 } },
  '/accounting/receivables': { invoices: { page: 1, limit: 8 } },
  '/accounting/cashbox': { cashbox: { page: 1, limit: 6 } },
  '/crm/leads': { leads: { page: 1, limit: 10 } },
  '/purchases/suppliers': { suppliers: { page: 1, limit: 8 } },
};

const ADMIN = new Set(['/settings/users', '/settings/roles']);
const LOOKUPS = {
  '/inventory/products': ['categories', 'units', 'warehouses'],
  '/crm/leads': ['employees'],
  '/projects': ['employees'],
};
const FORM = {
  '/sales/orders': ['customers', 'employees', 'products'],
  '/inventory/raw-materials': ['products', 'categories', 'units', 'warehouses'],
  '/inventory/semi-finished-products': ['products', 'categories', 'units', 'warehouses'],
  '/inventory/finished-goods': ['products', 'categories', 'units', 'warehouses'],
};

const ROUTE_KEYS = Object.keys(ROUTE_PREFETCH).sort((a, b) => b.length - a.length);

function resolveRouteKey(path) {
  if (path in ROUTE_PREFETCH) return path;
  for (const key of ROUTE_KEYS) {
    if (key === '/dashboard') continue;
    if (path === key || path.startsWith(`${key}/`)) return key;
  }
  return null;
}

function resolveModules(path) {
  if (path === '/dashboard') return [];
  if (ADMIN.has(path)) return [];
  const key = resolveRouteKey(path);
  if (!key) return [];
  const primary = ROUTE_PREFETCH[key];
  const mods = Array.isArray(primary) ? [...primary] : primary ? [primary] : [];
  mods.push(...(LOOKUPS[key] ?? []));
  if (path.endsWith('/new') || path.includes('/edit')) mods.push(...(FORM[key] ?? []));
  return [...new Set(mods)];
}

function resolveQuery(pathname, module) {
  const routeKey = resolveRouteKey(pathname);
  const configured = routeKey ? ROUTE_MODULE_QUERIES[routeKey]?.[module] : undefined;
  if (configured) return configured;
  return { page: 1, limit: 25 };
}

let failed = 0;

console.log('--- Module hydration cases ---');
for (const c of moduleCases) {
  const got = resolveModules(c.path).sort();
  const want = [...c.expected].sort();
  const ok = got.length === want.length && got.every((v, i) => v === want[i]);
  if (!ok) {
    console.error(`FAIL ${c.path}: expected [${want}] got [${got}] — ${c.note}`);
    failed++;
  } else {
    console.log(`OK   ${c.path} → [${got.join(', ')}]`);
  }
}

console.log('\n--- Query alignment cases ---');
for (const c of queryCases) {
  const got = resolveQuery(c.path, c.module);
  const ok = got.limit === c.limit;
  if (!ok) {
    console.error(`FAIL ${c.path} ${c.module}: expected limit=${c.limit} got limit=${got.limit}`);
    failed++;
  } else {
    console.log(`OK   ${c.path} ${c.module} → limit=${got.limit}`);
  }
}

if (failed) {
  console.error(`\n${failed} case(s) failed`);
  process.exit(1);
}
console.log(`\nAll ${moduleCases.length + queryCases.length} route hydration cases passed.`);
