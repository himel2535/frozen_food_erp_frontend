import type { AppState } from '@/lib/state/types';
import { formatAppDate } from '@/lib/i18n/locale-format';
import { getCollectionOverlay } from '@/lib/state/customer-collection-seed';
import { buildCustomerFollowUpHref } from '@/lib/services/customer-receivables-service';
import { listRecipes } from '@/lib/services/recipes-service';
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

export type { AlertCategory, AlertPriority, AlertSettings, AlertSummary, BusinessAlert } from '@/lib/services/business-alert-types';
export { DEFAULT_ALERT_SETTINGS, ALL_ALERT_CATEGORIES, mapLoginRoleToAlertRole } from '@/lib/services/alert-settings-defaults';

function formatMoney(value: number): string {
  return `৳${Number(value || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

const MAX_OVERDUE_DAYS = 3650;

function isValidIsoDate(dateStr: string): boolean {
  const slice = dateStr.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(slice)) return false;
  const d = new Date(`${slice}T12:00:00`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === slice;
}

function safeDaysBetween(from: string, to: string): number | null {
  const fromSlice = from.slice(0, 10);
  const toSlice = to.slice(0, 10);
  if (!isValidIsoDate(fromSlice) || !isValidIsoDate(toSlice)) return null;
  const a = new Date(`${fromSlice}T12:00:00`);
  const b = new Date(`${toSlice}T12:00:00`);
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function capOverdueDays(days: number): number {
  return Math.min(Math.max(0, Math.floor(days)), MAX_OVERDUE_DAYS);
}

function daysBetween(from: string, to: string): number {
  return safeDaysBetween(from, to) ?? 0;
}

function daysAgoLabel(dateStr: string | undefined, today = todayIso()): string {
  if (!dateStr) return '—';
  const days = daysBetween(dateStr.slice(0, 10), today);
  if (days <= 0) return 'Today';
  return `${days} Days`;
}

function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '—';
  const d = new Date(`${dateStr.slice(0, 10)}T12:00:00`);
  return formatAppDate(d, { day: '2-digit', month: 'short', year: 'numeric' });
}

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

function buildCustomerDueAlerts(state: AppState, settings: AlertSettings): BusinessAlert[] {
  const entries = (Array.isArray(state.dueEntries) ? state.dueEntries : []).filter(
    (e) => String(e.type) === 'customer' && Number(e.due ?? 0) > 0,
  );
  const today = todayIso();

  return entries.map((entry) => {
    const partyId = String(entry.partyId ?? '');
    const partyName = String(entry.partyName ?? 'Customer');
    const due = Number(entry.due ?? 0);
    const status = String(entry.status ?? '');
    const overdueDaysRaw = Number(entry.overdueDays ?? 0);
    const overdueDays = overdueDaysRaw > 0 ? capOverdueDays(overdueDaysRaw) : 0;
    const overlay = getCollectionOverlay(partyName);
    const lastActivity = overlay?.followUpTimeline?.[overlay.followUpTimeline.length - 1];
    const lastFollowUpAt = lastActivity?.at?.slice(0, 10);
    const lastFollowUpDays =
      lastFollowUpAt && isValidIsoDate(lastFollowUpAt) ? daysBetween(lastFollowUpAt, today) : overdueDays;

    let priority: AlertPriority = 'info';
    if (status === 'overdue' || overdueDays >= settings.customerDueReminderDays) priority = 'critical';
    else if (status === 'partial' || status === 'due_today') priority = 'warning';

    const followUpHref = buildCustomerFollowUpHref(state, partyId, partyName);

    return {
      id: `customer-due-${entry.id}`,
      category: 'customer_due' as const,
      priority,
      title: partyName,
      subtitle: 'Customer Due Follow-up',
      lines: [
        { label: 'Type', value: 'Customer Due Follow-up' },
        { label: 'Due Amount', value: formatMoney(due) },
        { label: 'Due Since', value: overdueDays > 0 ? `${overdueDays} Days` : formatDisplayDate(String(entry.dueDate ?? '')) },
        { label: 'Last Follow-up', value: lastFollowUpDays > 0 ? `${lastFollowUpDays} Days Ago` : 'Today' },
      ],
      href: followUpHref,
      actions: [
        { label: 'Contact', href: followUpHref, variant: 'primary' },
        { label: 'Update Status', href: followUpHref, variant: 'outline' },
      ],
      sortKey: overdueDays * 10000 + due,
      overdueDays: overdueDays > 0 ? overdueDays : undefined,
    };
  });
}

function buildLeadFollowupAlerts(state: AppState, settings: AlertSettings): BusinessAlert[] {
  const crmData = state.crmData as { leadsById?: Record<string, Record<string, unknown>> } | undefined;
  const leads = Object.values(crmData?.leadsById ?? {});
  const today = todayIso();

  return leads
    .filter((lead) => {
      const status = String(lead.status ?? '').toLowerCase();
      const followUpRaw = String(lead.nextFollowUpAt ?? '').slice(0, 10);
      return status !== 'won' && status !== 'lost' && followUpRaw && isValidIsoDate(followUpRaw);
    })
    .map((lead) => {
      const followUpDate = String(lead.nextFollowUpAt ?? '').slice(0, 10);
      const daysUntil = safeDaysBetween(today, followUpDate) ?? 0;
      const lastContact = String(lead.updatedAt ?? lead.createdAt ?? '').slice(0, 10);
      const lastContactDays =
        lastContact && isValidIsoDate(lastContact) ? daysBetween(lastContact, today) : 0;

      let priority: AlertPriority = 'info';
      if (daysUntil < 0) priority = 'critical';
      else if (daysUntil === 0) priority = 'warning';
      else if (daysUntil <= settings.leadFollowUpReminderDays) priority = 'info';

      const statusLabel = String(lead.status ?? 'new').replace(/^\w/, (c) => c.toUpperCase());
      const overdueDays = daysUntil < 0 ? capOverdueDays(Math.abs(daysUntil)) : undefined;
      const nextFollowValue =
        daysUntil === 0 ? 'Today' : daysUntil > 0 ? formatDisplayDate(followUpDate) : formatDisplayDate(followUpDate);

      return {
        id: `lead-${lead.id}`,
        category: 'lead_followup' as const,
        priority,
        title: String(lead.company ?? lead.name ?? 'Lead'),
        subtitle: 'Lead Follow-up',
        lines: [
          { label: 'Type', value: 'Lead Follow-up' },
          { label: 'Status', value: statusLabel },
          { label: 'Next Follow', value: nextFollowValue },
          { label: 'Last Contact', value: lastContactDays > 0 ? `${lastContactDays} Days Ago` : 'Today' },
        ],
        href: '/crm/leads',
        actions: [
          { label: 'Contact', href: '/crm/leads', variant: 'primary' },
          { label: 'Update Status', href: '/crm/leads', variant: 'outline' },
        ],
        sortKey: -daysUntil * 1000 + Number(lead.expectedValue ?? 0),
        overdueDays,
      };
    });
}

type StockRow = { id: string; name: string; qty: number; min: number; type: string; sku?: string };

function collectLowStockRows(state: AppState, useReorder: boolean): StockRow[] {
  const rows: StockRow[] = [];
  const push = (item: Record<string, unknown>, type: string, qtyKey: string, minKey: string) => {
    const qty = Number(item[qtyKey] ?? item.stock ?? item.quantity ?? 0);
    const min = Number(item[minKey] ?? item.reorderLevel ?? item.threshold ?? item.minStock ?? 0);
    if (min <= 0 || qty >= min) return;
    rows.push({
      id: String(item.id ?? item.sku ?? item.name),
      name: String(item.name ?? item.productName ?? 'Item'),
      qty,
      min,
      type,
      sku: String(item.sku ?? ''),
    });
  };

  (Array.isArray(state.inventory) ? state.inventory : []).forEach((item) =>
    push(item as Record<string, unknown>, String(item.productType ?? 'Inventory'), 'stock', useReorder ? 'reorderLevel' : 'minStock'),
  );
  (Array.isArray(state.rawMaterials) ? state.rawMaterials : []).forEach((item) =>
    push(item as Record<string, unknown>, 'Raw Material', 'quantity', 'threshold'),
  );
  (Array.isArray(state.semiFinishedProducts) ? state.semiFinishedProducts : []).forEach((item) =>
    push(item as Record<string, unknown>, 'Semi Finished', 'quantity', 'minStock'),
  );
  (Array.isArray(state.finishedGoods) ? state.finishedGoods : []).forEach((item) =>
    push(item as Record<string, unknown>, 'Finished Goods', 'quantity', 'minStock'),
  );

  return rows;
}

export function countLowStockItems(state: AppState, settings?: AlertSettings): number {
  const s = settings ?? getAlertSettings(state);
  return collectLowStockRows(state, s.lowStockUseReorderLevel).length;
}

function buildLowStockAlerts(state: AppState, settings: AlertSettings): BusinessAlert[] {
  const rows = collectLowStockRows(state, settings.lowStockUseReorderLevel);

  return rows.map((row) => {
    const need = Math.max(0, row.min - row.qty);
    const priority: AlertPriority = row.qty <= 0 ? 'critical' : 'warning';
    const href = row.type.includes('Raw') ? '/inventory/raw-materials' : row.type.includes('Semi') ? '/inventory/semi-finished-products' : row.type.includes('Finished') ? '/inventory/finished-goods' : '/inventory/products';

    return {
      id: `low-stock-${row.id}`,
      category: 'low_stock' as const,
      priority,
      title: row.name,
      subtitle: 'Low Stock Alert',
      lines: [
        { label: 'Type', value: row.type },
        { label: 'Status', value: row.qty <= 0 ? 'Out of Stock' : 'Low Stock' },
        { label: 'Current Stock', value: `${row.qty} pcs` },
        { label: 'Need Purchase', value: `${need} pcs` },
      ],
      href,
      actions: [
        { label: 'Create Purchase Order', href: '/purchases/purchase-rm', variant: 'primary' },
        { label: 'View Details', href, variant: 'outline' },
      ],
      sortKey: (row.min - row.qty) * 100 + (row.qty <= 0 ? 100000 : 0),
    };
  });
}

function buildPendingPurchaseAlerts(state: AppState): BusinessAlert[] {
  const pendingStatuses = new Set(['draft', 'sent', 'pending_approval', 'pending']);
  const purchases = (Array.isArray(state.purchases) ? state.purchases : []).filter((p) =>
    pendingStatuses.has(String(p.status ?? '').toLowerCase()),
  );
  const today = todayIso();
  const tomorrow = new Date(`${today}T12:00:00`);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowIso = tomorrow.toISOString().slice(0, 10);

  return purchases.map((po) => {
    const expected = String(po.expectedDelivery ?? po.date ?? '').slice(0, 10);
    const daysToDelivery = expected ? daysBetween(today, expected) : 99;
    const priority: AlertPriority = daysToDelivery <= 1 ? 'warning' : 'info';
    const supplier = String(po.supplierName ?? po.supplier ?? 'Supplier');

    return {
      id: `purchase-${po.id}`,
      category: 'pending_purchase' as const,
      priority,
      title: String(po.id ?? po.reference ?? 'Purchase Order'),
      subtitle: 'Pending Purchase',
      lines: [
        { label: 'Type', value: 'Pending Purchase' },
        { label: 'Status', value: String(po.status ?? 'Pending') },
        { label: 'Supplier', value: supplier },
        { label: 'Expected Delivery', value: expected === tomorrowIso ? 'Tomorrow' : formatDisplayDate(expected) },
      ],
      href: '/purchases/orders',
      actions: [
        { label: 'View Purchase', href: '/purchases/orders', variant: 'primary' },
      ],
      sortKey: -daysToDelivery * 1000 + Number(po.total ?? 0),
    };
  });
}

function findMaterialStock(state: AppState, materialId: string, name: string): number {
  const rm = (Array.isArray(state.rawMaterials) ? state.rawMaterials : []).find(
    (r) => String(r.id) === materialId || String(r.sku) === materialId || String(r.name) === name,
  );
  if (rm) return Number(rm.quantity ?? 0);
  const inv = (Array.isArray(state.inventory) ? state.inventory : []).find(
    (i) => String(i.sku) === materialId || String(i.name) === name,
  );
  if (inv) return Number(inv.stock ?? 0);
  return 0;
}

function buildProductionAlerts(state: AppState): BusinessAlert[] {
  const orders = (Array.isArray(state.productionOrders) ? state.productionOrders : []).filter((o) =>
    ['Planned', 'In Progress', 'planned', 'in progress'].includes(String(o.status ?? '')),
  );
  const recipes = listRecipes(state);
  const alerts: BusinessAlert[] = [];

  orders.forEach((order) => {
    const product = String(order.product ?? '');
    const recipe = recipes.find(
      (r) => r.product === product || r.productSku === product || r.model === product,
    );
    const plannedQty = Number(order.plannedQuantity ?? order.qty ?? 0);
    const missing: string[] = [];

    if (recipe && recipe.materials.length) {
      recipe.materials.forEach((mat) => {
        const perUnit = Number(mat.effectiveQty ?? mat.qtyPerProduct ?? 0);
        const needed = perUnit * plannedQty;
        const stock = findMaterialStock(state, String(mat.materialId ?? ''), String(mat.name ?? ''));
        if (needed > stock) {
          missing.push(`${mat.name} - ${Math.ceil(needed - stock)} ${mat.unit ?? 'units'}`);
        }
      });
    }

    if (!missing.length && String(order.status).toLowerCase() !== 'in progress') return;

    alerts.push({
      id: `production-${order.id}`,
      category: 'production',
      priority: missing.length ? 'critical' : 'warning',
      title: `Production Order #${String(order.id ?? '').replace('PROD-', '')}`,
      subtitle: 'Production Alert',
      lines: [
        { label: 'Type', value: 'Production Alert' },
        { label: 'Status', value: missing.length ? 'Material Shortage' : String(order.status ?? 'In Progress') },
        { label: 'Product', value: product },
        { label: 'Missing', value: missing.length ? missing.slice(0, 2).join(', ') : '—' },
      ],
      href: '/manufacturing/wastage',
      actions: [
        { label: 'View BOM', href: '/purchases/recipes/finished-goods', variant: 'primary' },
        { label: 'View Production', href: '/manufacturing/wastage', variant: 'outline' },
      ],
      sortKey: missing.length * 10000 + plannedQty,
    });
  });

  return alerts;
}

function buildPaymentCollectionAlert(state: AppState): BusinessAlert[] {
  const dueToday = (Array.isArray(state.dueEntries) ? state.dueEntries : []).filter(
    (e) => String(e.type) === 'customer' && String(e.status) === 'due_today' && Number(e.due ?? 0) > 0,
  );
  if (!dueToday.length) return [];

  const totalDue = dueToday.reduce((s, e) => s + Number(e.due ?? 0), 0);
  const customerCount = new Set(dueToday.map((e) => e.partyId)).size;

  return [
    {
      id: 'payment-collection-summary',
      category: 'payment_collection',
      priority: 'warning',
      title: `${customerCount} Customers Payment Due Today`,
      subtitle: 'Payment Reminder',
      lines: [
        { label: 'Type', value: 'Payment Reminder' },
        { label: 'Status', value: 'Due Today' },
        { label: 'Customers', value: String(customerCount) },
        { label: 'Total Due', value: formatMoney(totalDue) },
      ],
      href: '/accounting/receivables',
      actions: [
        { label: 'Send Reminder', href: '/accounting/receivables', variant: 'primary' },
        { label: 'View Receivables', href: '/accounting/receivables', variant: 'outline' },
      ],
      sortKey: totalDue,
    },
  ];
}

function buildSupplierDueAlerts(state: AppState, settings: AlertSettings): BusinessAlert[] {
  const entries = (Array.isArray(state.dueEntries) ? state.dueEntries : []).filter(
    (e) => String(e.type) === 'supplier' && Number(e.due ?? 0) > 0,
  );

  return entries.map((entry) => {
    const due = Number(entry.due ?? 0);
    const status = String(entry.status ?? '');
    const overdueDaysRaw = Number(entry.overdueDays ?? 0);
    const overdueDays = overdueDaysRaw > 0 ? capOverdueDays(overdueDaysRaw) : 0;

    let priority: AlertPriority = 'info';
    if (status === 'overdue' || overdueDays >= settings.supplierDueReminderDays) priority = 'critical';
    else if (status === 'due_today') priority = 'warning';

    return {
      id: `supplier-due-${entry.id}`,
      category: 'supplier_due' as const,
      priority,
      title: String(entry.partyName ?? 'Supplier'),
      subtitle: 'Supplier Payment Due',
      lines: [
        { label: 'Type', value: 'Supplier Payment Due' },
        { label: 'Status', value: status === 'overdue' ? 'Overdue' : status === 'due_today' ? 'Due Today' : 'Pending' },
        { label: 'Amount', value: formatMoney(due) },
        { label: 'Due Date', value: formatDisplayDate(String(entry.dueDate ?? '')) },
      ],
      href: '/accounting/payables',
      actions: [
        { label: 'Pay Now', href: '/accounting/payables', variant: 'primary' },
        { label: 'View Details', href: '/accounting/payables', variant: 'outline' },
      ],
      sortKey: overdueDays * 10000 + due,
      overdueDays: overdueDays > 0 ? overdueDays : undefined,
    };
  });
}

export function buildBusinessAlerts(state: AppState, settings?: AlertSettings): BusinessAlert[] {
  const cfg = settings ?? getAlertSettings(state);
  const alerts = [
    ...buildCustomerDueAlerts(state, cfg),
    ...buildLeadFollowupAlerts(state, cfg),
    ...buildLowStockAlerts(state, cfg),
    ...buildPendingPurchaseAlerts(state),
    ...buildProductionAlerts(state),
    ...buildPaymentCollectionAlert(state),
    ...buildSupplierDueAlerts(state, cfg),
  ];

  return alerts.sort((a, b) => {
    const pd = priorityRank(b.priority) - priorityRank(a.priority);
    if (pd !== 0) return pd;
    return b.sortKey - a.sortKey;
  });
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
