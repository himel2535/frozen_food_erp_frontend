/** Static English labels for SSR/first paint — keep in sync with DASHBOARD_KPI_CARDS order. */
export const DASHBOARD_KPI_LCP_LABELS = [
  'Total Revenue',
  'Customer Due',
  'Low Stock Alert',
  'Pending Sales',
  'Open Leads',
  'Pending Production',
] as const;

export function isDashboardPath(pathname: string) {
  const path = pathname.split('?')[0].split('#')[0].replace(/\/$/, '') || '/dashboard';
  return path === '/dashboard';
}

export const DASHBOARD_KPI_CARDS: {
  key: string;
  labelKey: string;
  icon: string;
  alert?: boolean;
  href?: string;
}[] = [
  { key: 'month-revenue', labelKey: 'dashboard.total_revenue', icon: 'flat-color-icons:currency-exchange' },
  { key: 'customer-due', labelKey: 'dashboard.customer_due', icon: 'fluent-color:person-24' },
  { key: 'low-stock', labelKey: 'dashboard.low_stock', icon: 'fluent-color:alert-badge-24', alert: true, href: '/inventory/low-stock-alerts' },
  { key: 'pending-sales', labelKey: 'dashboard.pending_sales', icon: 'flat-color-icons:shipped' },
  { key: 'open-leads', labelKey: 'dashboard.open_leads', icon: 'fluent-color:people-interwoven-24' },
  { key: 'pending-production', labelKey: 'dashboard.pending_production', icon: 'fluent-color:clock-24' },
];
