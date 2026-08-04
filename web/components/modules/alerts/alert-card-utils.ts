import type { BusinessAlert } from '@/lib/services/business-alert-types';

const MAX_OVERDUE_DAYS = 3650;

export function priorityLabel(priority: BusinessAlert['priority']): string {
  if (priority === 'critical') return 'CRITICAL';
  if (priority === 'warning') return 'WARNING';
  return 'INFO';
}

export function deriveOverdueDays(alert: BusinessAlert): number | undefined {
  if (alert.overdueDays != null && alert.overdueDays > 0) {
    return Math.min(alert.overdueDays, MAX_OVERDUE_DAYS);
  }
  for (const line of alert.lines) {
    if (line.label.toLowerCase().includes('due since')) {
      const days = line.value.match(/^(\d+)\s*Days?$/i);
      if (days) return Math.min(Number(days[1]), MAX_OVERDUE_DAYS);
    }
  }
  return undefined;
}

export function resolveAlertActions(alert: BusinessAlert) {
  const contactLike = alert.actions.find(
    (a) => a.label === 'Contact' || a.label === 'Call' || a.variant === 'primary',
  );
  const updateLike = alert.actions.find(
    (a) =>
      a !== contactLike &&
      (a.label === 'Update Status' || a.label === 'Add Follow-up' || a.variant === 'outline'),
  );
  const primaryAction = contactLike ?? alert.actions.find((a) => a.variant === 'primary') ?? alert.actions[0];
  const secondaryAction =
    updateLike ?? alert.actions.find((a) => a !== primaryAction && a.variant === 'outline') ?? alert.actions.find((a) => a !== primaryAction);

  const primaryLabel =
    primaryAction?.label === 'Call' ? 'Contact' : primaryAction?.label ?? 'Contact';
  const secondaryLabel = secondaryAction?.label ?? 'Update Status';

  return { primaryAction, secondaryAction, primaryLabel, secondaryLabel };
}

export function previewMetricLines(alert: BusinessAlert) {
  const skip = new Set(['type']);
  return alert.lines.filter((l) => !skip.has(l.label.toLowerCase())).slice(0, 2);
}
