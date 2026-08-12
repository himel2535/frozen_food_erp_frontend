/**
 * Wraps list module page.tsx files with server prefetch + generates matching loading.tsx.
 * Run: node web/scripts/apply-module-prefetch.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.join(__dirname, '..', 'app', '(tenant)');

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (entry.name === 'page.tsx') acc.push(full);
  }
  return acc;
}

function routeFromFile(filePath) {
  const rel = path.relative(APP_ROOT, filePath).replace(/\\/g, '/');
  const route = `/${rel.replace(/\/page\.tsx$/, '')}`;
  return route === '' ? '/dashboard' : route;
}

function shouldSkip(route) {
  if (route.includes('[')) return true;
  if (route.endsWith('/new')) return true;
  if (route === '/inventory') return true;
  if (route === '/design-system' || route === '/super-admin') return true;
  if (route === '/messages' || route === '/alerts') return true;
  if (route.startsWith('/recipes/')) return true;
  if (route.startsWith('/purchases/recipes/')) return true;
  if (route === '/dashboard') return true;
  if (route === '/crm/leads') return true;
  return false;
}

function extractComponentSource(content) {
  const importMatch = content.match(/^import .+ from .+;\n/m);
  if (!importMatch) return null;

  const imports = [];
  let rest = content;
  while (rest.startsWith('import ')) {
    const lineEnd = rest.indexOf('\n');
    imports.push(rest.slice(0, lineEnd));
    rest = rest.slice(lineEnd + 1);
  }

  const defaultExport = rest.match(
    /export default (?:async )?function \w+\([^)]*\)\s*\{[\s\S]*?return (\([\s\S]*?\)|<[\s\S]*?>);[\s\S]*?\}/,
  );
  if (!defaultExport) return null;

  return { imports, jsx: defaultExport[1].trim() };
}

function buildPrefetchedPage(imports, jsx, modulesExpr) {
  const importLines = imports.filter((line) => !line.includes('prefetch-module-page'));
  const hasPrefetchImport = imports.some((line) => line.includes('prefetch-module-page'));

  const lines = [
    ...importLines,
    ...(hasPrefetchImport ? [] : ["import { prefetchModulePage } from '@/lib/server/prefetch-module-page';"]),
    '',
    'export default async function Page() {',
    `  return prefetchModulePage(${modulesExpr}, ${jsx});`,
    '}',
    '',
  ];
  return lines.join('\n');
}

function buildLoadingFile(route) {
  return `import { StaticRouteLoading } from '@/components/skeletons/StaticRouteLoading';

export default function Loading() {
  return <StaticRouteLoading route="${route}" />;
}
`;
}

const ROUTE_MODULES = {
  '/crm/customers': "'customers'",
  '/crm/deals': "'deals'",
  '/crm/complaints': "'complaints'",
  '/crm/activities': "'crmActivities'",
  '/sales/orders': "'salesOrders'",
  '/sales/invoices': "'invoices'",
  '/sales/deliveries': "'deliveries'",
  '/sales/dispatch': "'dispatch'",
  '/sales/payments': "'payments'",
  '/sales/returns': "'returns'",
  '/sales/quotations': "'quotations'",
  '/sales/pos': "['products', 'pos']",
  '/sales/wholesale': "'wholesaleOrders'",
  '/purchases/suppliers': "'suppliers'",
  '/purchases/orders': "'purchaseOrders'",
  '/purchases/goods-received': "'goodsReceived'",
  '/purchases/bills': "'vendorBills'",
  '/purchases/payments': "'purchasePayments'",
  '/purchases/returns': "'purchaseReturns'",
  '/purchases/purchase-rm': "'purchaseRm'",
  '/purchases/recipes': "'recipes'",
  '/inventory/products': "'products'",
  '/inventory/categories': "'categories'",
  '/inventory/units': "'units'",
  '/inventory/warehouses': "'warehouses'",
  '/inventory/raw-materials': "'rawMaterials'",
  '/inventory/semi-finished-products': "'semiFinishedProducts'",
  '/inventory/finished-goods': "'finishedGoods'",
  '/inventory/stock-in': "'stockIn'",
  '/inventory/stock-out': "'stockOut'",
  '/inventory/transfers': "'stockTransfers'",
  '/inventory/adjustments': "'stockAdjustments'",
  '/hrm/employees': "'employees'",
  '/hrm/departments': "'departments'",
  '/hrm/designations': "'designations'",
  '/hrm/attendance': "'attendance'",
  '/hrm/leave': "'leaveRequests'",
  '/payroll/structures': "'salaryStructures'",
  '/payroll/runs': "'payrollRuns'",
  '/payroll/slips': "'payrollSlips'",
  '/payroll/salary-sheet': "'salarySheet'",
  '/manufacturing/wastage': "'wastage'",
  '/manufacturing/packing': "'packing'",
  '/manufacturing/mold-management': "'molds'",
  '/manufacturing/machine-maintenance': "'machineMaintenance'",
  '/projects': "'projects'",
  '/asset-management': "'assets'",
  '/workflow-approvals': "'workflowApprovals'",
  '/accounting/journals': "'journals'",
  '/accounting/ledger': "'ledger'",
  '/accounting/dues': "'dues'",
  '/accounting/cashbox': "'cashbox'",
  '/accounting/trial': "'trialBalance'",
  '/accounting/pl': "'profitLoss'",
  '/accounting/balance': "'balanceSheet'",
  '/accounting/receivables': "['customers', 'invoices', 'payments']",
  '/accounting/payables': "['vendorBills', 'purchasePayments', 'cashbox']",
  '/settings/users': "'users'",
  '/settings/roles': "'roles'",
  '/settings/permissions': "'permissions'",
  '/settings/documents': "'documents'",
  '/settings/company': "'companySettings'",
  '/settings/audit-logs': "'auditLogs'",
  '/reports/sales': "['salesOrders', 'invoices', 'customers']",
  '/reports/customers': "['customers', 'salesOrders']",
  '/reports/inventory': "['products', 'rawMaterials', 'finishedGoods']",
  '/reports/purchases': "['purchaseOrders', 'suppliers']",
  '/reports/suppliers': "'suppliers'",
  '/reports/financial': "['invoices', 'purchaseOrders']",
  '/reports/hr': "['employees', 'attendance']",
};

let pagesUpdated = 0;
let loadingCreated = 0;
let skipped = 0;

for (const pageFile of walk(APP_ROOT)) {
  const route = routeFromFile(pageFile);
  const loadingFile = path.join(path.dirname(pageFile), 'loading.tsx');
  const modulesExpr = ROUTE_MODULES[route];

  if (!shouldSkip(route)) {
    fs.writeFileSync(loadingFile, buildLoadingFile(route), 'utf8');
    loadingCreated += 1;
  }

  if (!modulesExpr || shouldSkip(route)) {
    skipped += 1;
    continue;
  }

  const content = fs.readFileSync(pageFile, 'utf8');
  if (content.includes('prefetchModulePage')) {
    continue;
  }

  const parsed = extractComponentSource(content);
  if (!parsed) {
    skipped += 1;
    continue;
  }

  fs.writeFileSync(pageFile, buildPrefetchedPage(parsed.imports, parsed.jsx, modulesExpr), 'utf8');
  pagesUpdated += 1;
}

console.log(`Pages wrapped with prefetch: ${pagesUpdated}`);
console.log(`loading.tsx files written: ${loadingCreated}`);
console.log(`Skipped: ${skipped}`);
