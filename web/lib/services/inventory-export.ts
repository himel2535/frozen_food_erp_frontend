import type { AppState } from '@/lib/state/types';
import type { MaterialRequirementReport, ProductionCapacityReport, ProductionWhatIfAnalysis } from '@/lib/services/recipes-service';
import {
  getFinishedGoodsAvailable,
  getFinishedGoodsMetrics,
  getFinishedGoodsStockStatus,
  getFinishedGoodsStockValue,
  getSemiFinishedLocationLabel,
  getSemiFinishedMetrics,
  getSemiFinishedStockStatus,
  getSemiFinishedTotalValue,
  getWarehouseName,
  listFinishedGoods,
  listSemiFinishedProducts,
} from '@/lib/services/inventory-service';

type Row = Record<string, unknown>;

export type InventorySummaryRow = {
  label: string;
  products: number;
  quantity: number;
  value: number;
  lowStock: number;
  outOfStock: number;
};

export type InventoryStockSummary = {
  variant: 'finished-goods' | 'semi-finished';
  totals: {
    products: number;
    quantity: number;
    value: number;
    lowStock: number;
    outOfStock: number;
    inStock: number;
    reserved?: number;
    available?: number;
  };
  byCategory: InventorySummaryRow[];
  byWarehouse: InventorySummaryRow[];
  byStatus: InventorySummaryRow[];
};

function escapeCsv(value: unknown) {
  const raw = String(value ?? '');
  if (raw.includes(',') || raw.includes('"') || raw.includes('\n')) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

function triggerDownload(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'product';
}

function aggregateRows(
  items: Row[],
  getLabel: (row: Row) => string,
  getQty: (row: Row) => number,
  getValue: (row: Row) => number,
  getStatus: (row: Row) => string,
) {
  const map = new Map<string, InventorySummaryRow>();
  items.forEach((row) => {
    const label = getLabel(row);
    const existing = map.get(label) ?? { label, products: 0, quantity: 0, value: 0, lowStock: 0, outOfStock: 0 };
    existing.products += 1;
    existing.quantity += getQty(row);
    existing.value += getValue(row);
    const status = getStatus(row);
    if (status === 'Low Stock') existing.lowStock += 1;
    if (status === 'Out of Stock') existing.outOfStock += 1;
    map.set(label, existing);
  });
  return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
}

export function buildFinishedGoodsStockSummary(state: AppState): InventoryStockSummary {
  const items = listFinishedGoods(state);
  const metrics = getFinishedGoodsMetrics(state);
  const totalReserved = items.reduce((sum, row) => sum + Number(row.reserved ?? 0), 0);
  const totalAvailable = items.reduce((sum, row) => sum + getFinishedGoodsAvailable(row), 0);

  return {
    variant: 'finished-goods',
    totals: {
      products: metrics.count,
      quantity: metrics.totalQuantity,
      value: metrics.totalValue,
      lowStock: metrics.lowStock,
      outOfStock: metrics.outOfStock,
      inStock: metrics.inStock,
      reserved: totalReserved,
      available: totalAvailable,
    },
    byCategory: aggregateRows(
      items,
      (row) => String(row.category ?? 'Uncategorized').trim() || 'Uncategorized',
      (row) => Number(row.quantity ?? 0),
      (row) => getFinishedGoodsStockValue(row),
      (row) => getFinishedGoodsStockStatus(row),
    ),
    byWarehouse: aggregateRows(
      items,
      (row) => getWarehouseName(state, String(row.warehouseId ?? 'WH-001')),
      (row) => Number(row.quantity ?? 0),
      (row) => getFinishedGoodsStockValue(row),
      (row) => getFinishedGoodsStockStatus(row),
    ),
    byStatus: aggregateRows(
      items,
      (row) => getFinishedGoodsStockStatus(row),
      (row) => Number(row.quantity ?? 0),
      (row) => getFinishedGoodsStockValue(row),
      (row) => getFinishedGoodsStockStatus(row),
    ),
  };
}

export function buildSemiFinishedStockSummary(state: AppState): InventoryStockSummary {
  const items = listSemiFinishedProducts(state);
  const metrics = getSemiFinishedMetrics(state);
  const inStock = items.filter((row) => getSemiFinishedStockStatus(row) === 'In Stock').length;

  return {
    variant: 'semi-finished',
    totals: {
      products: metrics.count,
      quantity: metrics.totalQuantity,
      value: metrics.totalValue,
      lowStock: metrics.lowStock,
      outOfStock: metrics.outOfStock,
      inStock,
    },
    byCategory: aggregateRows(
      items,
      (row) => String(row.category ?? 'Uncategorized').trim() || 'Uncategorized',
      (row) => Number(row.quantity ?? 0),
      (row) => getSemiFinishedTotalValue(row),
      (row) => getSemiFinishedStockStatus(row),
    ),
    byWarehouse: aggregateRows(
      items,
      (row) => getWarehouseName(state, String(row.warehouseId ?? 'WH-001')),
      (row) => Number(row.quantity ?? 0),
      (row) => getSemiFinishedTotalValue(row),
      (row) => getSemiFinishedStockStatus(row),
    ),
    byStatus: aggregateRows(
      items,
      (row) => getSemiFinishedStockStatus(row),
      (row) => Number(row.quantity ?? 0),
      (row) => getSemiFinishedTotalValue(row),
      (row) => getSemiFinishedStockStatus(row),
    ),
  };
}

export function downloadInventoryProductCsv(
  row: Row,
  variant: 'finished-goods' | 'semi-finished',
  state: AppState,
) {
  const name = String(row.name ?? 'product');
  const warehouse = getWarehouseName(state, String(row.warehouseId ?? 'WH-001'));
  const location = variant === 'semi-finished'
    ? getSemiFinishedLocationLabel(state, row)
    : warehouse;

  const baseFields: [string, unknown][] = [
    ['Product Name', name],
    ['ID', row.id],
    ['Category', row.category ?? ''],
    ['Unit', row.unit ?? 'pcs'],
    ['Stock Quantity', row.quantity ?? 0],
    ['Average Cost', row.avgCost ?? row.price ?? 0],
    ['Min Stock Level', row.minStock ?? row.threshold ?? 0],
    ['Warehouse', warehouse],
    ['Location', location],
    ['Status', variant === 'finished-goods' ? getFinishedGoodsStockStatus(row) : getSemiFinishedStockStatus(row)],
    ['Last Updated', row.lastUpdated ?? ''],
    ['Notes', row.notes ?? ''],
  ];

  const fields: [string, unknown][] = variant === 'finished-goods'
    ? [
        ...baseFields.slice(0, 2),
        ['SKU', row.sku ?? ''],
        ['Barcode', row.barcode ?? ''],
        ...baseFields.slice(2, 4),
        ['Stock Quantity', row.quantity ?? 0],
        ['Reserved Quantity', row.reserved ?? 0],
        ['Available Quantity', getFinishedGoodsAvailable(row)],
        ...baseFields.slice(4),
        ['Stock Value', getFinishedGoodsStockValue(row)],
      ]
    : [
        ...baseFields,
        ['Stock Value', getSemiFinishedTotalValue(row)],
      ];

  const csv = ['Field,Value', ...fields.map(([label, value]) => `${escapeCsv(label)},${escapeCsv(value)}`)].join('\n');
  triggerDownload(csv, `${slugify(name)}-spec.csv`);
}

export function downloadInventoryStockSummaryCsv(summary: InventoryStockSummary) {
  const lines: string[] = [];
  const prefix = summary.variant === 'finished-goods' ? 'finished-goods' : 'semi-finished';

  lines.push('Section,Label,Products,Quantity,Value,Low Stock,Out of Stock');
  summary.byCategory.forEach((row) => {
    lines.push(['Category', row.label, row.products, row.quantity, row.value.toFixed(2), row.lowStock, row.outOfStock].map(escapeCsv).join(','));
  });
  summary.byWarehouse.forEach((row) => {
    lines.push(['Warehouse', row.label, row.products, row.quantity, row.value.toFixed(2), row.lowStock, row.outOfStock].map(escapeCsv).join(','));
  });
  summary.byStatus.forEach((row) => {
    lines.push(['Status', row.label, row.products, row.quantity, row.value.toFixed(2), row.lowStock, row.outOfStock].map(escapeCsv).join(','));
  });

  triggerDownload(lines.join('\n'), `${prefix}-stock-summary.csv`);
}

export function downloadProductionCapacityCsv(report: ProductionCapacityReport, productName: string) {
  const lines: string[] = [
    'Metric,Value',
    `Product,${escapeCsv(productName)}`,
    `Recipe,${escapeCsv(report.recipe.recipeNumber)}`,
    `Current Stock,${report.currentStockQty}`,
    `Max Additional Units,${report.maxProducibleUnits}`,
    `Total Possible Units,${report.totalPossibleUnits}`,
    `Bottleneck Material,${escapeCsv(report.limitingMaterialName)}`,
    '',
    'Material,Category,Unit,Available,Per Unit,Used at Max,Surplus,Limiting',
  ];

  report.lines.forEach((line) => {
    lines.push([
      line.name,
      line.category,
      line.unit,
      line.availableQty,
      line.effectiveQtyPerProduct,
      line.usedAtMax,
      line.surplusAfterMax,
      line.isLimiting ? 'Yes' : 'No',
    ].map(escapeCsv).join(','));
  });

  triggerDownload(lines.join('\n'), `${slugify(productName)}-production-capacity.csv`);
}

export function downloadMaterialRequirementCsv(report: MaterialRequirementReport, productName: string) {
  const lines: string[] = [
    'Metric,Value',
    `Product,${escapeCsv(productName)}`,
    `Recipe,${escapeCsv(report.recipe.recipeNumber)}`,
    `Current Stock,${report.currentStockQty}`,
    `Max Total Possible,${report.maxTotalUnits}`,
    `Max Additional Units,${report.maxAdditionalUnits}`,
    `Limiting Material,${escapeCsv(report.limitingMaterialName)}`,
    '',
    'Material,Category,Unit,Required Per Unit,Used in Current Stock,Raw Stock,In Semi-Finished,In Finished Goods,Total Overall,Max Additional Units,Status',
  ];

  report.lines.forEach((line) => {
    const status = line.totalOverallQty <= 0
      ? 'Out of Stock'
      : line.totalOverallQty < line.requiredForCurrentStock + line.effectiveQtyPerProduct
        ? 'Low Stock'
        : 'In Stock';
    lines.push([
      line.name,
      line.category,
      line.unit,
      line.effectiveQtyPerProduct,
      line.requiredForCurrentStock,
      line.rawQty,
      line.inSemiFinishedQty,
      line.inFinishedGoodsQty,
      line.totalOverallQty,
      line.maxAdditionalUnitsFromMaterial,
      status,
    ].map(escapeCsv).join(','));
  });

  triggerDownload(lines.join('\n'), `${slugify(productName)}-material-requirements.csv`);
}

export function downloadProductionWhatIfCsv(analysis: ProductionWhatIfAnalysis, productName: string) {
  const { capacity } = analysis;
  const lines: string[] = [
    'Metric,Value',
    `Product,${escapeCsv(productName)}`,
    `Recipe,${escapeCsv(capacity.recipe.recipeNumber)}`,
    `Current Stock,${capacity.currentStockQty}`,
    `Target Quantity,${analysis.targetQty}`,
    `Can Produce Now,${capacity.maxProducibleUnits}`,
    `Achievable Quantity,${analysis.achievableQty}`,
    `Shortfall Units,${analysis.shortfallUnits}`,
    `After Production Stock,${analysis.afterProductionStock}`,
    `Total Potential Stock,${analysis.totalPotentialStock}`,
    `Limiting Material,${escapeCsv(capacity.limitingMaterialName)}`,
    '',
    'Material,Category,Unit,Required Per Unit,Total Required,Available,Shortage,Surplus,Remaining After Max,Status',
  ];

  analysis.lines.forEach((line) => {
    lines.push([
      line.name,
      line.category,
      line.unit,
      line.effectiveQtyPerProduct,
      line.totalRequiredForTarget,
      line.availableQty,
      line.shortageForTarget,
      line.surplusForTarget,
      line.remainingAfterMaxProduction,
      line.hasShortage ? 'Shortage' : 'Surplus',
    ].map(escapeCsv).join(','));
  });

  triggerDownload(lines.join('\n'), `${slugify(productName)}-what-if-production.csv`);
}
