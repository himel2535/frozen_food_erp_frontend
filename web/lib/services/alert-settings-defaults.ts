import type { AlertCategory, AlertRole, AlertSettings } from '@/lib/services/business-alert-types';

export const ALL_ALERT_CATEGORIES: AlertCategory[] = [
  'customer_due',
  'lead_followup',
  'low_stock',
  'pending_purchase',
  'production',
  'payment_collection',
  'supplier_due',
];

export const DEFAULT_ALERT_SETTINGS: AlertSettings = {
  customerDueReminderDays: 7,
  leadFollowUpReminderDays: 1,
  lowStockUseReorderLevel: true,
  supplierDueReminderDays: 3,
  productionDelayDays: 2,
  notificationSound: false,
  roleVisibility: {
    ceo_admin: [...ALL_ALERT_CATEGORIES],
    cfo: ['customer_due', 'supplier_due', 'payment_collection'],
    sales_manager: ['lead_followup', 'customer_due'],
    store_manager: ['low_stock', 'pending_purchase'],
    production_manager: ['production'],
  },
};

export function mapLoginRoleToAlertRole(role: string): AlertRole | 'viewer' {
  if (role === 'admin') return 'ceo_admin';
  if (role === 'manager') return 'cfo';
  if (role === 'salesperson') return 'sales_manager';
  return 'viewer';
}

export const VIEWER_ALERT_CATEGORIES: AlertCategory[] = ['customer_due', 'low_stock'];
