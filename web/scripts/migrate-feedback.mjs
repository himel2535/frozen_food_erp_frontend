/**
 * One-time migration helper: replace window.alert/confirm with toast/confirmAction.
 * Run: node scripts/migrate-feedback.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.join(__dirname, '..');

function moduleFromPath(filePath) {
  const rel = filePath.replace(/\\/g, '/');
  const rules = [
    [/crm\/leads/i, 'Leads'],
    [/crm\/customers/i, 'Customers'],
    [/crm\/deals/i, 'Deals'],
    [/crm\//i, 'CRM'],
    [/inventory\/finished-goods/i, 'Finished Goods'],
    [/inventory\/semi-finished/i, 'Semi-Finished Products'],
    [/inventory\/raw-materials/i, 'Raw Materials'],
    [/inventory\/products/i, 'Products'],
    [/inventory\/stock-in/i, 'Stock In'],
    [/inventory\/stock-out/i, 'Stock Out'],
    [/inventory\/transfers/i, 'Stock Transfers'],
    [/inventory\/adjustments/i, 'Stock Correction'],
    [/inventory\/warehouses/i, 'Warehouses'],
    [/inventory\/categories/i, 'Categories'],
    [/inventory\/units/i, 'Units'],
    [/inventory\//i, 'Inventory'],
    [/sales\/pos/i, 'POS'],
    [/sales\/invoices/i, 'Invoices'],
    [/sales\/deliveries/i, 'Delivery Challan'],
    [/sales\/orders/i, 'Sales Orders'],
    [/sales\//i, 'Sales'],
    [/purchases\/purchase-rm/i, 'Purchase RM'],
    [/purchases\/recipes/i, 'Recipes'],
    [/purchases\/orders/i, 'Purchase Orders'],
    [/purchases\//i, 'Purchases'],
    [/accounting\/customer-due/i, 'Customer Due'],
    [/accounting\/supplier-due/i, 'Supplier Due'],
    [/accounting\/trial/i, 'Trial Balance'],
    [/accounting\/balance/i, 'Balance Sheet'],
    [/accounting\/profit/i, 'Profit & Loss'],
    [/accounting\/cashbox/i, 'Cashbox'],
    [/accounting\/due-management/i, 'Due Management'],
    [/accounting\//i, 'Accounting'],
    [/payroll\/payments-due/i, 'Payments Due'],
    [/payroll\/salary-sheet/i, 'Salary Sheet'],
    [/payroll\/salary-setup/i, 'Salary Setup'],
    [/payroll\//i, 'Payroll'],
    [/hrm\//i, 'HRM'],
    [/projects\//i, 'Projects'],
    [/settings-pages/i, 'Workflow Approvals'],
    [/legacy-parity/i, 'Purchases'],
    [/DedicatedModule/i, 'Module'],
    [/InventoryMasterModule/i, 'Inventory'],
  ];
  for (const [re, name] of rules) {
    if (re.test(rel)) return name;
  }
  return 'ERP';
}

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.next') {
      walk(full, acc);
    } else if (/\.(tsx|ts)$/.test(entry.name)) {
      acc.push(full);
    }
  }
  return acc;
}

function ensureImport(content) {
  const needsToast = content.includes('toast.');
  const needsConfirm = content.includes('confirmAction(');
  if (!needsToast && !needsConfirm) return content;

  const importLine = "import { toast, confirmAction } from '@/lib/ui/feedback';";
  const partialLine = needsConfirm && !needsToast
    ? "import { confirmAction } from '@/lib/ui/feedback';"
    : !needsConfirm && needsToast
      ? "import { toast } from '@/lib/ui/feedback';"
      : importLine;

  if (content.includes("@/lib/ui/feedback")) {
    return content;
  }

  if (content.includes("'use client'")) {
    return content.replace("'use client';", `'use client';\n\n${partialLine}`);
  }
  if (content.includes('"use client"')) {
    return content.replace('"use client";', `"use client";\n\n${partialLine}`);
  }
  return `${partialLine}\n\n${content}`;
}

function migrateContent(content, moduleName) {
  let next = content;

  // window.confirm patterns -> confirmAction (sync if () return)
  next = next.replace(
    /if\s*\(\s*!window\.confirm\(\s*`([^`]+)`\s*\)\s*\)\s*return;/g,
    'const __ok = await confirmAction({ title: \'Confirm action\', message: `$1`, confirmLabel: \'Confirm\', tone: \'danger\', module: \'' + moduleName + '\' }); if (!__ok) return;',
  );
  next = next.replace(
    /if\s*\(\s*!window\.confirm\(\s*'([^']+)'\s*\)\s*\)\s*return;/g,
    (_, msg) => {
      const isDelete = /delete/i.test(msg);
      return `const __ok = await confirmAction({ title: ${JSON.stringify(msg.replace(/\?$/, ''))}, message: ${JSON.stringify(msg)}, confirmLabel: ${isDelete ? "'Delete'" : "'Confirm'"}, tone: ${isDelete ? "'danger'" : "'primary'"}, module: '${moduleName}' }); if (!__ok) return;`;
    },
  );
  next = next.replace(
    /if\s*\(\s*window\.confirm\(\s*'([^']+)'\s*\)\s*\)\s*\{/g,
    (_, msg) => {
      const isDelete = /delete/i.test(msg);
      return `confirmAction({ title: ${JSON.stringify(msg.replace(/\?$/, ''))}, message: ${JSON.stringify(msg)}, confirmLabel: ${isDelete ? "'Delete'" : "'Confirm'"}, tone: ${isDelete ? "'danger'" : "'primary'"}, module: '${moduleName}' }).then((__ok) => { if (!__ok) return; {`;
    },
  );
  next = next.replace(
    /if\s*\(\s*window\.confirm\(\s*`([^`]+)`\s*\)\s*\)\s*\{/g,
    (_, msg) => `confirmAction({ title: 'Confirm', message: \`${msg}\`, confirmLabel: 'Confirm', tone: 'danger', module: '${moduleName}' }).then((__ok) => { if (!__ok) return; {`,
  );

  // Inline confirm in onClick arrow
  next = next.replace(
    /onClick=\{\(\)\s*=>\s*\{\s*if\s*\(\s*window\.confirm\('([^']+)'\)\s*\)\s*(.+?)\s*\}\s*\}/gs,
    (_, msg, body) => `{ confirmAction({ title: ${JSON.stringify(msg.replace(/\?$/, ''))}, message: ${JSON.stringify(msg)}, confirmLabel: 'Confirm', tone: 'danger', module: '${moduleName}' }).then((__ok) => { if (__ok) ${body.trim()} }); }`,
  );

  // window.alert -> toast
  next = next.replace(
    /window\.alert\(\s*'([^']*coming soon[^']*)'\s*\)/gi,
    (_, msg) => `toast.info('Feature coming soon', { module: '${moduleName}', description: ${JSON.stringify(msg.replace(/\s*[—-]\s*coming soon\.?$/i, '').trim() || 'This feature will be available in a future update.')} })`,
  );
  next = next.replace(
    /window\.alert\(\s*`([^`]*coming soon[^`]*)`\s*\)/gi,
    (_, msg) => `toast.info('Feature coming soon', { module: '${moduleName}', description: ${JSON.stringify(msg)} })`,
  );
  next = next.replace(
    /window\.alert\(\s*`\$\{([^}]+)\}\s*— coming soon\.`\s*\)/g,
    (_, label) => `toast.info('Feature coming soon', { module: '${moduleName}', description: \`\${${label}} will be available in a future update.\` })`,
  );
  next = next.replace(
    /window\.alert\(\s*`\$\{([^}]+)\}\s*integration coming soon\.`\s*\)/g,
    (_, label) => `toast.info('Integration coming soon', { module: '${moduleName}', description: \`\${${label}} integration will be available in a future update.\` })`,
  );
  next = next.replace(
    /window\.alert\(\s*`\$\{([^}]+)\}\s*coming soon\.`\s*\)/g,
    (_, label) => `toast.info('Feature coming soon', { module: '${moduleName}', description: \`\${${label}} will be available in a future update.\` })`,
  );

  next = next.replace(
    /window\.alert\(\s*'error' in result \? result\.error : '([^']+)'\s*\)/g,
    (_, fallback) => `toast.error('Operation failed', { module: '${moduleName}', description: 'error' in result ? String(result.error) : '${fallback}' })`,
  );
  next = next.replace(
    /window\.alert\(\s*result\.error \?\? '([^']+)'\s*\)/g,
    (_, fallback) => `toast.error('Operation failed', { module: '${moduleName}', description: String(result.error ?? '${fallback}') })`,
  );
  next = next.replace(
    /window\.alert\(\s*'error' in (\w+) \? \1\.error : '([^']+)'\s*\)/g,
    (_, varName, fallback) => `toast.error('Operation failed', { module: '${moduleName}', description: 'error' in ${varName} ? String(${varName}.error) : '${fallback}' })`,
  );
  next = next.replace(
    /window\.alert\(\s*(\w+)\.error \?\? '([^']+)'\s*\)/g,
    (_, varName, fallback) => `toast.error('Operation failed', { module: '${moduleName}', description: String(${varName}.error ?? '${fallback}') })`,
  );
  next = next.replace(
    /window\.alert\(\s*'([^']+)'\s*\)/g,
    (_, msg) => {
      if (/failed|error|could not|invalid|must|please|empty|select|add at least|upload|allowed|smaller/i.test(msg)) {
        return `toast.error('Action required', { module: '${moduleName}', description: ${JSON.stringify(msg)} })`;
      }
      if (/created|converted|success|saved|sent|received|approved|completed/i.test(msg)) {
        return `toast.success('Done', { module: '${moduleName}', description: ${JSON.stringify(msg)} })`;
      }
      return `toast.info('Notice', { module: '${moduleName}', description: ${JSON.stringify(msg)} })`;
    },
  );
  next = next.replace(
    /window\.alert\(\s*`([^`]+)`\s*\)/g,
    (_, msg) => `toast.info('Notice', { module: '${moduleName}', description: \`${msg}\` })`,
  );
  next = next.replace(
    /if\s*\(\s*successMsg\s*\)\s*window\.alert\(successMsg\)/g,
    `if (successMsg) toast.success('Success', { module: '${moduleName}', description: successMsg })`,
  );
  next = next.replace(
    /else window\.alert\(/g,
    'else toast.error(',
  );

  // Fix else toast.error that still has wrong signature - need manual fix later

  return next;
}

function makeAsyncHandlers(content) {
  let next = content;
  // Add async to handlers that use await confirmAction
  if (next.includes('await confirmAction') && !next.includes('async ')) {
    next = next.replace(
      /(\bon(?:Click|Submit|Delete|Save|Remove|Cancel\w*|Approve\w*|Receive\w*|Send\w*|Export\w*)\s*=\s*\(\s*(?:e(?:\s*:\s*[^)]+)?)?\s*\)\s*=>\s*\{[^}]*await confirmAction)/g,
      (m) => m.replace(/=\s*\(\s*/, '= async ('),
    );
    next = next.replace(
      /(const\s+\w+\s*=\s*\(\s*(?:e(?:\s*:\s*[^)]+)?)?\s*\)\s*=>\s*\{[^}]*await confirmAction)/g,
      (m) => m.replace(/=\s*\(\s*/, '= async ('),
    );
    next = next.replace(
      /(function\s+\w+\s*\([^)]*\)\s*\{[^}]*await confirmAction)/g,
      (m) => m.replace(/function\s+(\w+)/, 'async function $1'),
    );
  }
  return next;
}

const files = walk(webRoot).filter((f) => {
  const c = fs.readFileSync(f, 'utf8');
  return c.includes('window.alert') || c.includes('window.confirm');
});

let changed = 0;
for (const file of files) {
  const original = fs.readFileSync(file, 'utf8');
  const moduleName = moduleFromPath(file);
  let updated = migrateContent(original, moduleName);
  updated = makeAsyncHandlers(updated);
  updated = ensureImport(updated);
  if (updated !== original) {
    fs.writeFileSync(file, updated);
    changed += 1;
    console.log('Updated:', path.relative(webRoot, file));
  }
}

console.log(`Done. ${changed} files updated.`);
