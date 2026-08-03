import type { PoLineItem } from '@/lib/services/purchases-service';

export type PoActivityEntry = {
  label: string;
  at: string;
  by?: string;
};

export function poWorkflowProgress(status: string): number {
  switch (String(status)) {
    case 'Draft':
      return 15;
    case 'Sent':
      return 55;
    case 'Received':
      return 100;
    case 'Cancelled':
      return 0;
    default:
      return 0;
  }
}

export function poDeliveryBadge(expectedDelivery: string) {
  if (!expectedDelivery) return null;
  const late = new Date(`${expectedDelivery}T00:00:00`) < new Date();
  return (
    <span className={`text-[10px] font-bold ${late ? 'text-rose-600' : 'text-emerald-600'}`}>
      {late ? 'Late' : 'On Time'}
    </span>
  );
}

export function poPaidPercent(total: number, paidAmount: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((paidAmount / total) * 100));
}

export function poFirstItemLabel(row: Record<string, unknown>): { primary: string; moreCount: number } {
  const items = Array.isArray(row.items) ? (row.items as PoLineItem[]) : [];
  const active = items.filter((i) => i.description?.trim() || i.productId);
  if (active.length) {
    const primary = active[0].description || 'Item';
    return { primary, moreCount: Math.max(0, active.length - 1) };
  }
  const product = String(row.product ?? '').trim();
  return { primary: product || '—', moreCount: 0 };
}

export function buildPoActivityTimeline(row: Record<string, unknown>): PoActivityEntry[] {
  const status = String(row.status ?? 'Draft');
  const date = String(row.date ?? '');
  const expectedDelivery = String(row.expectedDelivery ?? '');
  const purchaser = String(row.purchaserName ?? 'Procurement Team');
  const entries: PoActivityEntry[] = [];

  entries.push({
    label: 'Purchase order created',
    at: date,
    by: purchaser,
  });

  if (['Sent', 'Received', 'Cancelled'].includes(status)) {
    entries.push({
      label: status === 'Cancelled' ? 'Order sent to supplier' : 'Sent to supplier',
      at: date,
      by: purchaser,
    });
  }

  if (status === 'Received') {
    entries.push({
      label: 'Goods received',
      at: expectedDelivery || date,
      by: 'Warehouse',
    });
    entries.push({
      label: 'Order completed',
      at: expectedDelivery || date,
    });
  }

  if (status === 'Cancelled') {
    entries.push({
      label: 'Order cancelled',
      at: date,
      by: purchaser,
    });
  }

  if (status === 'Sent' && expectedDelivery) {
    entries.push({
      label: `Expected delivery ${expectedDelivery}`,
      at: expectedDelivery,
    });
  }

  return entries.slice(-4);
}
