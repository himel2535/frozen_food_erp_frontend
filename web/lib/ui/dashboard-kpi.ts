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
