export type AlertCategory =
  | 'customer_due'
  | 'lead_followup'
  | 'low_stock'
  | 'pending_purchase'
  | 'production'
  | 'payment_collection'
  | 'supplier_due';

export type AlertPriority = 'critical' | 'warning' | 'info';

export type AlertRole =
  | 'ceo_admin'
  | 'cfo'
  | 'sales_manager'
  | 'store_manager'
  | 'production_manager';

export type AlertSettings = {
  customerDueReminderDays: number;
  leadFollowUpReminderDays: number;
  lowStockUseReorderLevel: boolean;
  supplierDueReminderDays: number;
  productionDelayDays: number;
  notificationSound: boolean;
  roleVisibility: Record<AlertRole, AlertCategory[]>;
};

export type BusinessAlertAction = {
  label: string;
  href: string;
  variant?: 'primary' | 'outline';
};

export type BusinessAlert = {
  id: string;
  category: AlertCategory;
  priority: AlertPriority;
  title: string;
  subtitle?: string;
  lines: { label: string; value: string }[];
  href: string;
  actions: BusinessAlertAction[];
  sortKey: number;
  overdueDays?: number;
};

export type AlertSummary = {
  category: AlertCategory;
  count: number;
  priority: AlertPriority;
};
