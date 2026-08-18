import type { AppState } from '@/lib/state/types';
import {
  ALL_ALERT_CATEGORIES,
  DEFAULT_ALERT_SETTINGS,
  mapLoginRoleToAlertRole,
  VIEWER_ALERT_CATEGORIES,
} from '@/lib/services/alert-settings-defaults';
import type {
  AlertCategory,
  AlertPriority,
  AlertSettings,
  AlertSummary,
  BusinessAlert,
} from '@/lib/services/business-alert-types';

export type {
  AlertCategory,
  AlertPriority,
  AlertSettings,
  AlertSummary,
  BusinessAlert,
} from '@/lib/services/business-alert-types';
export {
  DEFAULT_ALERT_SETTINGS,
  ALL_ALERT_CATEGORIES,
  mapLoginRoleToAlertRole,
} from '@/lib/services/alert-settings-defaults';

function priorityRank(p: AlertPriority): number {
  if (p === 'critical') return 3;
  if (p === 'warning') return 2;
  return 1;
}

function highestPriority(alerts: BusinessAlert[]): AlertPriority {
  if (!alerts.length) return 'info';
  return alerts.reduce<AlertPriority>(
    (best, a) => (priorityRank(a.priority) > priorityRank(best) ? a.priority : best),
    'info',
  );
}

export function getAlertSettings(state: AppState): AlertSettings {
  const raw = state.alertSettings as AlertSettings | undefined;
  if (!raw) return { ...DEFAULT_ALERT_SETTINGS, roleVisibility: { ...DEFAULT_ALERT_SETTINGS.roleVisibility } };
  return {
    ...DEFAULT_ALERT_SETTINGS,
    ...raw,
    roleVisibility: { ...DEFAULT_ALERT_SETTINGS.roleVisibility, ...(raw.roleVisibility ?? {}) },
  };
}

export function summarizeAlerts(alerts: BusinessAlert[]): AlertSummary[] {
  return ALL_ALERT_CATEGORIES.map((category) => {
    const items = alerts.filter((a) => a.category === category);
    return {
      category,
      count: items.length,
      priority: highestPriority(items),
    };
  }).filter((s) => s.count > 0);
}

export function filterAlertsByRole(
  alerts: BusinessAlert[],
  loginRole: string,
  settings?: AlertSettings,
): BusinessAlert[] {
  const cfg = settings ?? DEFAULT_ALERT_SETTINGS;
  const mapped = mapLoginRoleToAlertRole(loginRole);
  const allowed =
    mapped === 'viewer'
      ? VIEWER_ALERT_CATEGORIES
      : cfg.roleVisibility[mapped] ?? ALL_ALERT_CATEGORIES;

  return alerts.filter((a) => allowed.includes(a.category));
}

export function getVisibleCategories(loginRole: string, settings?: AlertSettings): AlertCategory[] {
  const cfg = settings ?? DEFAULT_ALERT_SETTINGS;
  const mapped = mapLoginRoleToAlertRole(loginRole);
  if (mapped === 'viewer') return VIEWER_ALERT_CATEGORIES;
  return cfg.roleVisibility[mapped] ?? ALL_ALERT_CATEGORIES;
}

export const ALERT_CATEGORY_ORDER: AlertCategory[] = ALL_ALERT_CATEGORIES;

export function priorityDotClass(priority: AlertPriority): string {
  if (priority === 'critical') return 'bg-rose-500';
  if (priority === 'warning') return 'bg-amber-500';
  return 'bg-blue-500';
}

export function priorityBadgeClass(priority: AlertPriority): string {
  if (priority === 'critical') return 'bg-rose-50 text-rose-700 border-rose-200';
  if (priority === 'warning') return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-blue-50 text-blue-700 border-blue-200';
}
