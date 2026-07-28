/**
 * Injects data-i18n attributes into module HTML page titles / common UI labels.
 * Run: node scripts/inject-i18n.mjs
 */
import fs from 'fs';
import path from 'path';

const root = path.resolve('C:/Projects/toyerp');

const PAGE_MAP = {
  'inventory-products.html': { title: 'inventory.products_title', subtitle: 'inventory.products_subtitle' },
  'inventory-stock-in.html': { title: 'sidebar.stock-in' },
  'inventory-stock-out.html': { title: 'sidebar.stock-out' },
  'inventory-transfers.html': { title: 'sidebar.transfers' },
  'inventory-adjustments.html': { title: 'sidebar.adjustments' },
  'inventory-warehouses.html': { title: 'sidebar.warehouses' },
  'inventory-categories.html': { title: 'sidebar.categories' },
  'inventory-units.html': { title: 'sidebar.units' },
  'crm-customers.html': { title: 'crm.customers_title' },
  'crm-leads.html': { title: 'crm.leads_title' },
  'crm-deals.html': { title: 'crm.deals_title' },
  'crm-complaints.html': { title: 'crm.complaints_title' },
  'sales-quotations.html': { title: 'sales.quotations_title' },
  'sales-orders.html': { title: 'sales.orders_title' },
  'sales-deliveries.html': { title: 'sales.deliveries_title' },
  'sales-dispatch.html': { title: 'sales.dispatch_title' },
  'sales-invoices.html': { title: 'sales.invoices_title' },
  'sales-payments.html': { title: 'sales.payments_title' },
  'sales-returns.html': { title: 'sales.returns_title' },
  'sales-pos.html': { title: 'sales.pos_title' },
  'purchases-suppliers.html': { title: 'purchases.suppliers_title' },
  'purchases-orders.html': { title: 'purchases.orders_title' },
  'purchases-goods-received.html': { title: 'purchases.grn_title' },
  'purchases-bills.html': { title: 'purchases.bills_title' },
  'purchases-payments.html': { title: 'purchases.payments_title' },
  'purchases-returns.html': { title: 'purchases.returns_title' },
  'manufacturing-orders.html': { title: 'manufacturing.orders_title' },
  'manufacturing-bom.html': { title: 'manufacturing.bom_title' },
  'manufacturing-machine-maintenance.html': { title: 'manufacturing.machines_title' },
  'manufacturing-mold-management.html': { title: 'manufacturing.molds_title' },
  'manufacturing-wastage.html': { title: 'manufacturing.wastage_title' },
  'manufacturing-packing.html': { title: 'manufacturing.packing_title' },
  'accounting-dues.html': { title: 'accounting.dues_title' },
  'accounting-receivables.html': { title: 'accounting.receivables_title' },
  'accounting-payables.html': { title: 'accounting.payables_title' },
  'accounting-journals.html': { title: 'accounting.journals_title' },
  'accounting-ledger.html': { title: 'accounting.ledger_title' },
  'accounting-trial.html': { title: 'accounting.trial_title' },
  'accounting-pl.html': { title: 'accounting.pl_title' },
  'accounting-balance.html': { title: 'accounting.balance_title' },
  'hrm-employees.html': { title: 'hrm.employees_title' },
  'hrm-departments.html': { title: 'hrm.departments_title' },
  'hrm-designations.html': { title: 'hrm.designations_title' },
  'hrm-attendance.html': { title: 'hrm.attendance_title' },
  'hrm-leave.html': { title: 'hrm.leave_title' },
  'payroll-structures.html': { title: 'payroll.structures_title' },
  'payroll-runs.html': { title: 'payroll.runs_title' },
  'payroll-slips.html': { title: 'payroll.slips_title' },
  'reports-sales.html': { title: 'reports.sales_title' },
  'reports-purchases.html': { title: 'reports.purchases_title' },
  'reports-inventory.html': { title: 'reports.inventory_title' },
  'reports-customers.html': { title: 'reports.customers_title' },
  'reports-suppliers.html': { title: 'reports.suppliers_title' },
  'reports-financial.html': { title: 'reports.financial_title' },
  'reports-hr.html': { title: 'reports.hr_title' },
  'settings-users.html': { title: 'settings.users_title' },
  'settings-roles.html': { title: 'settings.roles_title' },
  'settings-permissions.html': { title: 'settings.permissions_title' },
  'settings-documents.html': { title: 'settings.documents_title' },
  'settings-company.html': { title: 'settings.company_title' },
  'settings-audit-logs.html': { title: 'settings.audit_title' },
  'projects.html': { title: 'projects.title' },
  'asset-management.html': { title: 'assets.title' },
  'workflow-approvals.html': { title: 'approvals.title' },
  'notifications.html': { title: 'notifications.title' }
};

function injectTitle(html, meta) {
  if (!meta.title || html.includes(`data-i18n="${meta.title}"`)) return html;

  // First main page h2 that is not already wrapped
  const patterns = [
    /(<h2\b[^>]*>)(?![^<]*data-i18n)([^<\n]+)(<\/h2>)/,
  ];
  for (const re of patterns) {
    if (re.test(html)) {
      html = html.replace(re, `$1<span data-i18n="${meta.title}">$2</span>$3`);
      break;
    }
  }

  if (meta.subtitle && !html.includes(`data-i18n="${meta.subtitle}"`)) {
    const subRe = /(<p class="text-xs text-slate-500 mt-1[^"]*"[^>]*>)(?![^<]*data-i18n)([^<\n]+)(<\/p>)/;
    if (subRe.test(html)) {
      html = html.replace(subRe, `$1<span data-i18n="${meta.subtitle}">$2</span>$3`);
    }
  }
  return html;
}

function injectCommon(html) {
  if (!html.includes('data-i18n="common.show_advanced"')) {
    html = html.replace(/>Show Advanced Details</g, '><span data-i18n="common.show_advanced">Show Advanced Details</span><');
  }
  // Table headers / th cells common words (only exact content)
  const thMap = {
    Actions: 'common.actions',
    Status: 'common.status',
    Name: 'common.name',
    Date: 'common.date',
    Total: 'common.total',
    Amount: 'common.amount',
    Quantity: 'common.quantity',
    Type: 'common.type',
    Phone: 'common.phone',
    Email: 'common.email',
    SKU: 'common.sku',
    Stock: 'common.stock',
    Warehouse: 'common.warehouse',
    Unit: 'common.unit',
    Category: 'common.category',
    Product: 'common.product',
  };
  for (const [label, key] of Object.entries(thMap)) {
    if (html.includes(`data-i18n="${key}"`)) continue;
    const re = new RegExp(`(<th\\b[^>]*>)\\s*${label}\\s*(</th>)`, 'g');
    html = html.replace(re, `$1<span data-i18n="${key}">${label}</span>$2`);
  }
  return html;
}

let updated = 0;
for (const [file, meta] of Object.entries(PAGE_MAP)) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) {
    console.log('skip missing', file);
    continue;
  }
  let html = fs.readFileSync(full, 'utf8');
  const before = html;
  html = injectTitle(html, meta);
  html = injectCommon(html);
  if (html !== before) {
    fs.writeFileSync(full, html, 'utf8');
    updated++;
    console.log('updated', file);
  } else {
    console.log('unchanged', file);
  }
}
console.log('Done. Updated', updated, 'files.');
