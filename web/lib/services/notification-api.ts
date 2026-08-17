import { apiRequest } from '@/lib/services/api-client';

export type InboxNotification = {
  id: string;
  type: string;
  message: string;
  refId?: string;
  createdAt: string;
  read: boolean;
  userId?: string;
};

export function notificationHref(item: Pick<InboxNotification, 'type' | 'refId'>): string {
  if (
    (item.type === 'task_assigned' || item.type === 'task_overdue' || item.type === 'task_deadline_tomorrow')
    && item.refId
  ) {
    return `/projects/tasks/${item.refId}`;
  }
  if (item.type === 'sales_order' && item.refId) {
    return `/sales/orders/${item.refId}/edit`;
  }
  return '/sales/orders';
}

export async function fetchNotifications(): Promise<InboxNotification[]> {
  const { data } = await apiRequest<InboxNotification[]>('/notifications');
  return Array.isArray(data) ? data : [];
}

export function formatNotificationTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return 'recently';
  const diff = Date.now() - then;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}
