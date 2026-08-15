import type { NextConfig } from 'next';
import path from 'path';
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const htmlRedirects = [
  ['index.html', '/login'],
  ['dashboard.html', '/dashboard'],
  ['crm-customers.html', '/crm/customers'],
  ['crm-leads.html', '/crm/leads'],
  ['crm-deals.html', '/crm/deals'],
  ['crm-complaints.html', '/crm/complaints'],
  ['crm-activities.html', '/crm/activities'],
  ['sales-quotations.html', '/sales/quotations'],
  ['sales-orders.html', '/sales/orders'],
  ['sales-deliveries.html', '/sales/deliveries'],
  ['sales-dispatch.html', '/sales/dispatch'],
  ['sales-invoices.html', '/sales/invoices'],
  ['sales-payments.html', '/sales/payments'],
  ['sales-returns.html', '/sales/returns'],
  ['sales-pos.html', '/sales/pos'],
  ['sales-wholesale.html', '/sales/wholesale'],
  ['inventory-products.html', '/inventory/products'],
  ['inventory.html', '/inventory/products'],
  ['inventory-raw-materials.html', '/inventory/raw-materials'],
  ['inventory-semi-finished-products.html', '/inventory/semi-finished-products'],
  ['inventory-finished-goods.html', '/inventory/finished-goods'],
  ['inventory-stock-in.html', '/inventory/stock-in'],
  ['inventory-stock-out.html', '/inventory/stock-out'],
  ['inventory-transfers.html', '/inventory/transfers'],
  ['inventory-adjustments.html', '/inventory/adjustments'],
  ['inventory-warehouses.html', '/inventory/warehouses'],
  ['inventory-categories.html', '/inventory/categories'],
  ['inventory-units.html', '/inventory/units'],
  ['purchases-suppliers.html', '/purchases/suppliers'],
  ['purchases-orders.html', '/purchases/orders'],
  ['purchases-goods-received.html', '/purchases/goods-received'],
  ['purchases-bills.html', '/purchases/bills'],
  ['purchases-payments.html', '/purchases/payments'],
  ['purchases-returns.html', '/purchases/returns'],
  ['purchases-recipes.html', '/purchases/recipes/finished-goods'],
  ['manufacturing-orders.html', '/manufacturing/machine-maintenance'],
  ['manufacturing-bom.html', '/manufacturing/machine-maintenance'],
  ['manufacturing-machine-maintenance.html', '/manufacturing/machine-maintenance'],
  ['manufacturing-mold-management.html', '/manufacturing/mold-management'],
  ['manufacturing-wastage.html', '/manufacturing/wastage'],
  ['manufacturing-packing.html', '/manufacturing/packing'],
  ['accounting-cashbox.html', '/accounting/cashbox'],
  ['accounting-dues.html', '/accounting/dues'],
  ['accounting-receivables.html', '/accounting/receivables'],
  ['accounting-payables.html', '/accounting/payables'],
  ['accounting-journals.html', '/accounting/journals'],
  ['accounting-ledger.html', '/accounting/ledger'],
  ['accounting-trial.html', '/accounting/trial'],
  ['accounting-pl.html', '/accounting/pl'],
  ['accounting-balance.html', '/accounting/balance'],
  ['hrm-employees.html', '/hrm/employees'],
  ['hrm-departments.html', '/hrm/departments'],
  ['hrm-designations.html', '/hrm/designations'],
  ['hrm-attendance.html', '/hrm/attendance'],
  ['hrm-leave.html', '/hrm/leave'],
  ['payroll-structures.html', '/payroll/structures'],
  ['payroll-salary-sheet.html', '/payroll/salary-sheet'],
  ['payroll-payments-due.html', '/payroll/payments-due'],
  ['payroll-runs.html', '/payroll/runs'],
  ['payroll-slips.html', '/payroll/slips'],
  ['reports-sales.html', '/reports/sales'],
  ['reports-product-sales.html', '/reports/product-sales'],
  ['reports-purchases.html', '/reports/purchases'],
  ['reports-inventory.html', '/reports/inventory'],
  ['reports-customers.html', '/reports/customers'],
  ['reports-suppliers.html', '/reports/suppliers'],
  ['reports-financial.html', '/reports/financial'],
  ['reports-hr.html', '/reports/hr'],
  ['settings-users.html', '/settings/users'],
  ['settings-roles.html', '/settings/roles'],
  ['settings-permissions.html', '/settings/permissions'],
  ['settings-documents.html', '/settings/documents'],
  ['settings-company.html', '/settings/company'],
  ['settings-audit-logs.html', '/settings/audit-logs'],
  ['settings-profile.html', '/settings/profile'],
  ['settings-signatures.html', '/settings/signatures'],
  ['projects.html', '/projects'],
  ['projects-new.html', '/projects/new'],
  ['asset-management.html', '/asset-management'],
  ['workflow-approvals.html', '/workflow-approvals'],
  ['notifications.html', '/alerts'],
  ['super-admin.html', '/super-admin'],
  ['design-system.html', '/design-system'],
] as const;

const nextConfig: NextConfig = {
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname),
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  serverExternalPackages: ['firebase-admin'],
  experimental: {
    staleTimes: {
      dynamic: 30,
      static: 300,
    },
    optimizePackageImports: [
      'lucide-react',
      '@iconify/react',
      'firebase',
      'qrcode.react',
    ],
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      ...htmlRedirects.flatMap(([html, destination]) => [
        { source: `/${html}`, destination, permanent: false },
      ]),
      { source: '/inventory', destination: '/inventory/products', permanent: false },
      { source: '/manufacturing/orders', destination: '/manufacturing/machine-maintenance', permanent: false },
      { source: '/manufacturing/bom', destination: '/manufacturing/machine-maintenance', permanent: false },
      { source: '/recipes/finished-goods', destination: '/purchases/recipes/finished-goods', permanent: true },
      { source: '/recipes/semi-finished', destination: '/purchases/recipes/semi-finished', permanent: true },
    ];
  },
  async rewrites() {
    const backendUrl = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api/v1').replace(/\/$/, '');
    return [
      {
        source: '/api/v1/:path*',
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
