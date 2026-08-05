import { formatAppDate } from '@/lib/i18n/locale-format';
import {
  formatMoney,
  type ProductionPlanLine,
  type ProductionPlanSummary,
  type Recipe,
} from '@/lib/services/recipes-service';

function planStatusLabel(line: ProductionPlanLine): string {
  if (!line.insight.inInventory) return 'Not in inventory';
  if (line.shortfallQty > 0) return 'Short';
  return 'OK';
}

function supplierLabel(line: ProductionPlanLine): string {
  const { insight, shortfallQty } = line;
  if (shortfallQty <= 0 && insight.inInventory && !insight.insufficientForBom) return '—';
  if (insight.recommendedSupplier) {
    const offer = insight.supplierOffers.find((o) => o.supplierName === insight.recommendedSupplier);
    if (offer) return `${insight.recommendedSupplier} (${formatMoney(offer.price)})`;
    return insight.recommendedSupplier;
  }
  if (insight.supplierOffers.length) {
    const o = insight.supplierOffers[0];
    return `${o.supplierName} (${formatMoney(o.price)})`;
  }
  return 'No supplier data';
}

export async function downloadProductionPlanPdf(
  recipe: Recipe,
  batchQty: number,
  plan: { lines: ProductionPlanLine[]; summary: ProductionPlanSummary },
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
  doc.text(`Total material cost: ${formatMoney(summary.totalLineCost)}`, 14, 50);
  doc.text(
    `In stock OK: ${summary.materialsFullyInStock}  |  Short items: ${summary.materialsShort}  |  Est. purchase (shortfall): ${formatMoney(summary.estimatedPurchaseForShortfall)}`,
    14,
    56,
  );

  autoTable(doc, {
    startY: 62,
    head: [['Material', 'Required', 'Unit Cost', 'Line Cost', 'In Stock', 'Shortfall', 'Status', 'Supplier']],
    body: lines.map((line) => [
      `${line.name}\n${line.category}`,
      `${line.requiredQty.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${line.unit}`,
      formatMoney(line.unitCost),
      formatMoney(line.lineCost),
      `${line.inStockQty.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${line.unit}`,
      line.shortfallQty > 0
        ? `${line.shortfallQty.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${line.unit}`
        : '—',
      planStatusLabel(line),
      supplierLabel(line),
    ]),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
  });

  const safeName = recipe.recipeNumber.replace(/[^\w-]/g, '_');
  doc.save(`production-plan-${safeName}-${batchQty}.pdf`);
}
