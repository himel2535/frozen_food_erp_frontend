import type { AlertCategory, BusinessAlert } from '@/lib/services/business-alert-types';
import { deriveOverdueDays } from '@/components/modules/alerts/alert-card-utils';

export type NotificationTab = 'all' | 'unread' | 'mentions';

export type NotificationVisual = {
  icon: string;
  iconBg: string;
};

const CATEGORY_VISUAL: Record<AlertCategory, NotificationVisual> = {
  customer_due: { icon: 'fluent-color:alert-24', iconBg: 'bg-blue-100' },
  lead_followup: { icon: 'fluent-color:person-24', iconBg: 'bg-violet-100' },
  low_stock: { icon: 'fluent-color:toolbox-24', iconBg: 'bg-rose-100' },
  pending_purchase: { icon: 'fluent-color:warning-24', iconBg: 'bg-amber-100' },
  production: { icon: 'fluent-color:clock-24', iconBg: 'bg-slate-100' },
  payment_collection: { icon: 'fluent-color:checkmark-circle-24', iconBg: 'bg-emerald-100' },
  supplier_due: { icon: 'fluent-color:building-store-24', iconBg: 'bg-indigo-100' },
};

const RELATIVE_TIME_LABELS = [
  '2 hours ago',
  '5 hours ago',
  'yesterday',
  'yesterday',
  '2 days ago',
  '3 days ago',
  '4 days ago',
  '1 week ago',
];

function lineValue(alert: BusinessAlert, ...labels: string[]): string | undefined {
  const lower = labels.map((l) => l.toLowerCase());
  return alert.lines.find((l) => lower.includes(l.label.toLowerCase()))?.value;
}

export function getNotificationVisual(alert: BusinessAlert): NotificationVisual {
  return CATEGORY_VISUAL[alert.category] ?? { icon: 'fluent-color:alert-24', iconBg: 'bg-slate-100' };
}

export function getNotificationHeadline(alert: BusinessAlert): { bold: string; rest: string } {
  const overdue = deriveOverdueDays(alert);

  switch (alert.category) {
    case 'customer_due':
      return {
        bold: alert.title,
        rest: overdue ? ` payment is ${overdue} days overdue` : ' payment follow-up is pending',
      };
    case 'lead_followup':
      return {
        bold: `Lead ${alert.title}`,
        rest: overdue ? ' follow-up is overdue' : ' follow-up is due soon',
      };
    case 'pending_purchase':
      return {
        bold: `Purchase order #${alert.title}`,
        rest: ' pending approval',
      };
    case 'low_stock':
      return {
        bold: 'Low stock alert',
        rest: ` — ${alert.title}`,
      };
    case 'payment_collection':
      return {
        bold: 'Payment due today',
        rest: ` — ${alert.title}`,
      };
    case 'production':
      return {
        bold: `Production order #${alert.title.replace(/^Production Order #/i, '')}`,
        rest: ' needs attention',
      };
    case 'supplier_due':
      return {
        bold: alert.title,
        rest: overdue ? ` supplier payment is ${overdue} days overdue` : ' supplier payment is due',
      };
    default:
      return { bold: alert.title, rest: '' };
  }
}

export function getNotificationSubtext(alert: BusinessAlert): string {
  switch (alert.category) {
    case 'customer_due': {
      const amount = lineValue(alert, 'Due Amount');
      return amount ? `Amount due: ${amount}` : 'Customer payment follow-up required';
    }
    case 'lead_followup': {
      const status = lineValue(alert, 'Status', 'Lead Status');
      return status ? `Status: ${status}` : 'Lead follow-up pending';
    }
    case 'pending_purchase': {
      const supplier = lineValue(alert, 'Supplier');
      return supplier ? `Vendor: ${supplier}` : 'Purchase approval pending';
    }
    case 'low_stock': {
      const stock = lineValue(alert, 'Current Stock', 'Need Purchase');
      return stock ? `Only ${stock.replace(' pcs', '')} remaining` : 'Stock below minimum level';
    }
    case 'payment_collection': {
      const total = lineValue(alert, 'Total Due');
      return total ? `Total due: ${total}` : 'Collections due today';
    }
    case 'production': {
      const product = lineValue(alert, 'Product');
      const status = lineValue(alert, 'Status');
      return product ? `${product}${status ? ` — ${status}` : ''}` : 'Production alert';
    }
    case 'supplier_due': {
      const amount = lineValue(alert, 'Amount');
      return amount ? `Amount: ${amount}` : 'Supplier payment pending';
    }
    default:
      return alert.subtitle ?? '';
  }
}

export function getNotificationRelativeTime(index: number): string {
  return RELATIVE_TIME_LABELS[index] ?? 'recently';
}

export function isDefaultUnread(alert: BusinessAlert): boolean {
  return alert.priority === 'critical' || alert.priority === 'warning';
}

export function isMentionAlert(alert: BusinessAlert): boolean {
  return alert.category === 'lead_followup' || alert.category === 'customer_due';
}

export function filterAlertsByTab(
  alerts: BusinessAlert[],
  tab: NotificationTab,
  readIds: Set<string>,
): BusinessAlert[] {
  const list = alerts.slice(0, 8);
  if (tab === 'unread') {
    return list.filter((a) => isDefaultUnread(a) && !readIds.has(a.id));
  }
  if (tab === 'mentions') {
    return list.filter((a) => isMentionAlert(a));
  }
  return list;
}

export function countUnread(alerts: BusinessAlert[], readIds: Set<string>): number {
  return alerts.filter((a) => isDefaultUnread(a) && !readIds.has(a.id)).length;
}
