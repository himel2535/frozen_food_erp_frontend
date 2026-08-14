import type { AppState } from '@/lib/state/types';
import { countLowStockItems } from '@/lib/services/business-alert-service';
import {
  getFinishedGoodsMetrics,
  getRawMaterialMetrics,
  getSemiFinishedMetrics,
} from '@/lib/services/inventory-service';
import { getLeadList } from '@/lib/services/crm-service';

export function getDashboardMetrics(appState: AppState) {
  const production = Array.isArray(appState.productionOrders) ? appState.productionOrders : [];
  const purchases = Array.isArray(appState.purchases) ? appState.purchases : [];
  const sales = Array.isArray(appState.salesOrders) ? appState.salesOrders : [];
  const customers = Array.isArray(appState.crmCustomers) ? appState.crmCustomers : [];
  const suppliers = Array.isArray(appState.purchasesSuppliers) ? appState.purchasesSuppliers : [];

  const lowStock = countLowStockItems(appState);

  const pendingProd = production.filter((p) => ['Planned', 'In Progress'].includes(String(p.status)));
  const pendingPurchase = purchases.filter((p) => ['Draft', 'Sent'].includes(String(p.status)));
  const pendingSales = sales.filter((s) => ['confirmed', 'processing', 'draft'].includes(String(s.status || '').toLowerCase()));
  const completedProd = production.filter((p) => p.status === 'Completed');
  const prodQty = completedProd.reduce((s, p) => s + Number(p.actualQuantity || p.plannedQuantity || 0), 0);
  const pendingProdQty = pendingProd.reduce((s, p) => s + Number(p.plannedQuantity || 0), 0);
  const customersWithDue = customers.filter((c) => Number(c.due ?? c.totalDue ?? 0) > 0);
  const suppliersWithDue = suppliers.filter((s) => Number(s.due ?? s.totalDue ?? s.balance ?? 0) > 0);
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthSales = sales.filter((s) => String(s.date ?? s.createdAt ?? '').startsWith(currentMonth));
  const monthRevenue = monthSales.reduce((s, o) => s + Number(o.total || 0), 0);
  const openLeads = getLeadList(appState).filter((lead) => {
    const status = String((lead as Record<string, unknown>).status ?? '').toLowerCase();
    return status !== 'won' && status !== 'lost' && status !== 'closed';
  });
  const rmStockValue = getRawMaterialMetrics(appState).totalValue;
  const sfStockValue = getSemiFinishedMetrics(appState).totalValue;
  const fgStockValue = getFinishedGoodsMetrics(appState).totalValue;

  return {
    pendingProduction: pendingProd.length,
    pendingProductionQty: pendingProdQty,
    pendingPurchase: pendingPurchase.length,
    pendingSales: pendingSales.length,
    lowStock,
    rmStockValue,
    sfStockValue,
    fgStockValue,
    totalInventoryValue: rmStockValue + sfStockValue + fgStockValue,
    customerDue: customers.reduce((s, c) => s + Number(c.due ?? c.totalDue ?? 0), 0),
    customerDueCount: customersWithDue.length,
    supplierDue: suppliers.reduce((s, item) => s + Number(item.due ?? item.totalDue ?? item.balance ?? 0), 0),
    supplierDueCount: suppliersWithDue.length,
    productionSummary: { completed: completedProd.length, qty: prodQty },
    purchaseSummary: { count: purchases.length, total: purchases.reduce((s, o) => s + Number(o.total || 0), 0) },
    salesSummary: { count: sales.length, total: sales.reduce((s, o) => s + Number(o.total || 0), 0) },
    monthRevenue,
    monthSalesCount: monthSales.length,
    openLeadsCount: openLeads.length,
    openLeadsValue: openLeads.reduce((s: number, l) => s + Number((l as Record<string, unknown>).expectedValue || 0), 0),
  };
}
