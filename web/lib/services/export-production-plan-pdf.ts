import { formatAmount } from '@/lib/services/domain-service';
import { formatAppDate } from '@/lib/i18n/locale-format';
import {
  type ProductionPlanLine,
  type ProductionPlanSummary,
  type Recipe,
} from '@/lib/services/recipes-service';

export type ProductionPlanPdfOptions = {
  showUnitCost: boolean;
  showTotalCost: boolean;
  showShortfall: boolean;
};

export const DEFAULT_PRODUCTION_PLAN_PDF_OPTIONS: ProductionPlanPdfOptions = {
  showUnitCost: true,
  showTotalCost: true,
  showShortfall: true,
};

function planStatusLabel(line: ProductionPlanLine): string {
  if (!line.insight.inInventory) return 'Not in inventory';
  if (line.shortfallQty > 0) return 'Short';
  return 'OK';
}

function supplierLabel(line: ProductionPlanLine, includePrices: boolean): string {
  const { insight, shortfallQty } = line;
  if (shortfallQty <= 0 && insight.inInventory && !insight.insufficientForBom) return '—';
  if (insight.recommendedSupplier) {
    const offer = insight.supplierOffers.find((o) => o.supplierName === insight.recommendedSupplier);
    if (offer && includePrices) return `${insight.recommendedSupplier} (${formatAmount(offer.price)})`;
    return insight.recommendedSupplier;
  }
  if (insight.supplierOffers.length) {
    const o = insight.supplierOffers[0];
    return includePrices ? `${o.supplierName} (${formatAmount(o.price)})` : o.supplierName;
  }
  return 'No supplier data';
}

function buildSummaryLines(summary: ProductionPlanSummary, options: ProductionPlanPdfOptions): string[] {
  const lines: string[] = [];
  if (options.showTotalCost) {
    lines.push(`Total material cost (tk): ${formatAmount(summary.totalLineCost)}`);
  }
  const stockLine = `In stock OK: ${summary.materialsFullyInStock}  |  Short items: ${summary.materialsShort}`;
  if (options.showTotalCost && options.showShortfall) {
    lines.push(
      `${stockLine}  |  Est. purchase (shortfall) (tk): ${formatAmount(summary.estimatedPurchaseForShortfall)}`,
    );
  } else {
    lines.push(stockLine);
  }
  return lines;
}

export async function downloadProductionPlanPdf(
  recipe: Recipe,
  batchQty: number,
  plan: { lines: ProductionPlanLine[]; summary: ProductionPlanSummary },
  options: ProductionPlanPdfOptions = DEFAULT_PRODUCTION_PLAN_PDF_OPTIONS,
): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const { lines, summary } = plan;
  const dateStr = formatAppDate(new Date(), {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Toys Factory ERP — Production Plan', 14, 16);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Product: ${recipe.product}`, 14, 24);
  doc.text(`Model: ${recipe.model}  |  Recipe: ${recipe.recipeNumber}  |  BOM: ${recipe.version}`, 14, 30);
  doc.text(`Batch quantity: ${batchQty.toLocaleString()} products  |  Generated: ${dateStr}`, 14, 36);

  doc.setFont('helvetica', 'bold');
  doc.text('Summary', 14, 44);
  doc.setFont('helvetica', 'normal');
  const summaryLines = buildSummaryLines(summary, options);
  summaryLines.forEach((line, index) => {
    doc.text(line, 14, 50 + index * 6);
  });

  const head: string[] = ['Material', 'Required'];
  if (options.showUnitCost) head.push('Unit Cost (tk)');
  if (options.showTotalCost) head.push('Total Cost (tk)');
  head.push('In Stock');
  if (options.showShortfall) head.push('Shortfall');
  head.push('Status', 'Supplier');

  const includeSupplierPrices = options.showUnitCost || options.showTotalCost;

  const body = lines.map((line) => {
    const row: string[] = [
      `${line.name}\n${line.category}`,
      `${line.requiredQty.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${line.unit}`,
    ];
    if (options.showUnitCost) row.push(formatAmount(line.unitCost));
    if (options.showTotalCost) row.push(formatAmount(line.lineCost));
    row.push(`${line.inStockQty.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${line.unit}`);
    if (options.showShortfall) {
      row.push(
        line.shortfallQty > 0
          ? `${line.shortfallQty.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${line.unit}`
          : '—',
      );
    }
    row.push(planStatusLabel(line), supplierLabel(line, includeSupplierPrices));
    return row;
  });

  const tableStartY = 50 + summaryLines.length * 6 + 6;

  autoTable(doc, {
    startY: tableStartY,
    head: [head],
    body,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
  });

  const safeName = recipe.recipeNumber.replace(/[^\w-]/g, '_');
  doc.save(`production-plan-${safeName}-${batchQty}.pdf`);
}
