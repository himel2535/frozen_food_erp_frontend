/**
 * Static verification of route hydration dependencies.
 * Run: node scripts/verify-route-hydration.mjs
 */

const cases = [
  { path: '/dashboard', expected: [], note: 'Dashboard uses separate critical/deferred boot' },
  { path: '/settings/users', expected: [], note: 'Admin API only' },
  { path: '/settings/roles', expected: [], note: 'Admin API only' },
  { path: '/settings/permissions', expected: ['permissions'], note: 'DedicatedModule' },
  { path: '/crm/customers', expected: ['customers'], note: 'List page' },
  { path: '/inventory/products', expected: ['products', 'categories', 'units', 'warehouses'], note: 'Product form lookups' },
  { path: '/sales/orders', expected: ['salesOrders'], note: 'List page' },
  { path: '/sales/orders/new', expected: ['salesOrders', 'customers', 'employees', 'products'], note: 'Form lookups' },
  { path: '/sales/invoices', expected: ['invoices', 'customers'], note: 'Customer dropdown' },
  { path: '/purchases/orders', expected: ['purchaseOrders', 'suppliers'], note: 'Supplier filter' },
  { path: '/hrm/employees', expected: ['employees'], note: 'List page' },
  { path: '/crm/leads', expected: ['leads', 'employees'], note: 'Owner filter' },
  { path: '/projects', expected: ['pmProjects', 'employees'], note: 'Manager filter' },
  { path: '/accounting/receivables', expected: ['customers', 'invoices', 'payments'], note: 'Receivables page' },
  { path: '/accounting/dues', expected: ['dues', 'cashbox'], note: 'Extended modules' },
];

// Inline mirror of route-hydration-config logic for CI-less verification
const ROUTE_PREFETCH = {
  '/dashboard': [],
  '/crm/customers': 'customers',
  '/crm/leads': 'leads',
  '/sales/orders': 'salesOrders',
  '/sales/invoices': 'invoices',
  '/purchases/orders': 'purchaseOrders',
  '/inventory/products': 'products',
  '/hrm/employees': 'employees',
  '/projects': 'pmProjects',
  '/accounting/receivables': ['customers', 'invoices', 'payments'],
  '/accounting/dues': 'dues',
  '/settings/users': 'users',
  '/settings/roles': 'roles',
  '/settings/permissions': 'permissions',
};

const ADMIN = new Set(['/settings/users', '/settings/roles']);
const LOOKUPS = {
  '/inventory/products': ['categories', 'units', 'warehouses'],
  '/sales/invoices': ['customers'],
  '/purchases/orders': ['suppliers'],
  '/crm/leads': ['employees'],
  '/projects': ['employees'],
  '/accounting/receivables': ['customers', 'payments'],
  '/accounting/dues': ['cashbox'],
};
const FORM = { '/sales/orders': ['customers', 'employees', 'products'] };

function resolve(path) {
  if (path === '/dashboard') return [];
  if (ADMIN.has(path)) return [];
  const key = Object.keys(ROUTE_PREFETCH).find((k) => path === k || path.startsWith(`${k}/`));
  if (!key) return [];
  const primary = ROUTE_PREFETCH[key];
  const mods = Array.isArray(primary) ? [...primary] : primary ? [primary] : [];
  mods.push(...(LOOKUPS[key] ?? []));
  if (path.endsWith('/new') || path.includes('/edit')) mods.push(...(FORM[key] ?? []));
  return [...new Set(mods)];
}

let failed = 0;
for (const c of cases) {
  const got = resolve(c.path).sort();
  const want = [...c.expected].sort();
  const ok = got.length === want.length && got.every((v, i) => v === want[i]);
  if (!ok) {
    console.error(`FAIL ${c.path}: expected [${want}] got [${got}] — ${c.note}`);
    failed++;
  } else {
    console.log(`OK   ${c.path} → [${got.join(', ')}]`);
  }
}

if (failed) {
  console.error(`\n${failed} case(s) failed`);
  process.exit(1);
}
console.log(`\nAll ${cases.length} route hydration cases passed.`);
