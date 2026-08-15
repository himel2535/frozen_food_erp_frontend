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

type RGB = [number, number, number];

const PAGE_W = 297;
const PAGE_H = 210;
const MARGIN = 14;
const CONTENT_W = PAGE_W - MARGIN * 2;

const C = {
  purple: [107, 92, 231] as RGB,
  purpleLine: [124, 111, 235] as RGB,
  blueTitle: [30, 58, 138] as RGB,
  blue: [37, 99, 235] as RGB,
  green: [5, 150, 105] as RGB,
  orange: [234, 88, 12] as RGB,
  violet: [124, 58, 237] as RGB,
  red: [220, 38, 38] as RGB,
  slate400: [148, 163, 184] as RGB,
  slate500: [100, 116, 139] as RGB,
  slate600: [71, 85, 105] as RGB,
  slate700: [51, 65, 85] as RGB,
  slate900: [15, 23, 42] as RGB,
  cardBlueBg: [239, 246, 255] as RGB,
  cardGreenBg: [236, 253, 245] as RGB,
  cardOrangeBg: [255, 247, 237] as RGB,
  cardPurpleBg: [245, 243, 255] as RGB,
  noteBg: [248, 250, 252] as RGB,
  noteBorder: [226, 232, 240] as RGB,
  tableHead: [91, 79, 207] as RGB,
  tableBorder: [226, 232, 240] as RGB,
  rowAlt: [248, 250, 252] as RGB,
  white: [255, 255, 255] as RGB,
  statusOkBg: [209, 250, 229] as RGB,
  statusOkText: [4, 120, 87] as RGB,
  statusShortBg: [254, 226, 226] as RGB,
  statusShortText: [220, 38, 38] as RGB,
  statusMissingBg: [255, 237, 213] as RGB,
  statusMissingText: [194, 65, 12] as RGB,
};

type SummaryCardSpec = {
  label: string;
  value: string;
  bg: RGB;
  color: RGB;
  accent: RGB;
};

function setFill(doc: import('jspdf').jsPDF, rgb: RGB) {
  doc.setFillColor(rgb[0], rgb[1], rgb[2]);
}

function setDraw(doc: import('jspdf').jsPDF, rgb: RGB) {
  doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
}

function setText(doc: import('jspdf').jsPDF, rgb: RGB) {
  doc.setTextColor(rgb[0], rgb[1], rgb[2]);
}

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
    if (offer && includePrices) return `(${formatAmount(offer.price)})`;
    return insight.recommendedSupplier;
  }
  if (insight.supplierOffers.length) {
    const o = insight.supplierOffers[0];
    return includePrices ? `(${formatAmount(o.price)})` : o.supplierName;
  }
  return 'No supplier data';
}

function statusColors(label: string): { bg: RGB; text: RGB } {
  if (label === 'OK') return { bg: C.statusOkBg, text: C.statusOkText };
  if (label === 'Short') return { bg: C.statusShortBg, text: C.statusShortText };
  return { bg: C.statusMissingBg, text: C.statusMissingText };
}

function getSummaryCards(summary: ProductionPlanSummary, options: ProductionPlanPdfOptions): SummaryCardSpec[] {
  const cards: SummaryCardSpec[] = [];
  if (options.showTotalCost) {
    cards.push({
      label: 'Total Material Cost (tk)',
      value: formatAmount(summary.totalLineCost),
      bg: C.cardBlueBg,
      color: C.blue,
      accent: C.blue,
    });
  }
  cards.push({
    label: 'In Stock OK',
    value: String(summary.materialsFullyInStock),
    bg: C.cardGreenBg,
    color: C.green,
    accent: C.green,
  });
  cards.push({
    label: 'Short Items',
    value: String(summary.materialsShort),
    bg: C.cardOrangeBg,
    color: C.orange,
    accent: C.orange,
  });
  if (options.showTotalCost && options.showShortfall) {
    cards.push({
      label: 'Est. Purchase (Shortfall) (tk)',
      value: formatAmount(summary.estimatedPurchaseForShortfall),
      bg: C.cardPurpleBg,
      color: C.violet,
      accent: C.violet,
    });
  }
  return cards;
}

async function loadLogoDataUrl(): Promise<string | null> {
  try {
    const res = await fetch('/images/logo-toys.png');
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function drawLogoFallback(doc: import('jspdf').jsPDF, x: number, y: number, size: number) {
  const unit = size / 12;
  setFill(doc, [59, 130, 246]);
  doc.roundedRect(x, y + unit * 2, unit * 5, unit * 5, unit * 0.8, unit * 0.8, 'F');
  setFill(doc, [251, 191, 36]);
  doc.roundedRect(x + unit * 3, y, unit * 5, unit * 5, unit * 0.8, unit * 0.8, 'F');
  setFill(doc, [239, 68, 68]);
  doc.roundedRect(x + unit * 6, y + unit * 3, unit * 5, unit * 5, unit * 0.8, unit * 0.8, 'F');
}

function drawToyIllustration(doc: import('jspdf').jsPDF, x: number, y: number) {
  setFill(doc, [239, 68, 68]);
  doc.circle(x + 6, y + 18, 3.2, 'F');
  setFill(doc, [251, 191, 36]);
  doc.circle(x + 6, y + 12, 2.8, 'F');
  setFill(doc, [34, 197, 94]);
  doc.circle(x + 6, y + 7, 2.4, 'F');

  setFill(doc, [59, 130, 246]);
  doc.roundedRect(x + 16, y + 14, 11, 5.5, 1.2, 1.2, 'F');
  setFill(doc, [30, 64, 175]);
  doc.circle(x + 18.5, y + 20.5, 1.4, 'F');
  doc.circle(x + 24.5, y + 20.5, 1.4, 'F');

  setFill(doc, [180, 83, 9]);
  doc.circle(x + 34, y + 16, 4.5, 'F');
  setFill(doc, [146, 64, 14]);
  doc.circle(x + 31.5, y + 13.5, 1.3, 'F');
  doc.circle(x + 36.5, y + 13.5, 1.3, 'F');

  setFill(doc, [236, 72, 153]);
  doc.triangle(x + 48, y + 8, x + 44, y + 20, x + 52, y + 20, 'F');
  setFill(doc, [251, 191, 36]);
  doc.circle(x + 48, y + 20.5, 1.5, 'F');
}

function drawSummaryCard(
  doc: import('jspdf').jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  card: SummaryCardSpec,
) {
  setFill(doc, card.bg);
  setDraw(doc, card.bg);
  doc.roundedRect(x, y, w, h, 2.5, 2.5, 'FD');

  setFill(doc, card.accent);
  doc.circle(x + 5.5, y + 6.5, 2.8, 'F');
  setFill(doc, C.white);
  doc.circle(x + 5.5, y + 6.5, 1.2, 'F');

  setText(doc, C.slate500);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.2);
  doc.text(card.label, x + 11, y + 6.8);

  setText(doc, card.color);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.text(card.value, x + 11, y + 14.5);
}

function drawPageHeader(
  doc: import('jspdf').jsPDF,
  recipe: Recipe,
  batchQty: number,
  dateStr: string,
  logoDataUrl: string | null,
) {
  const logoSize = 12;
  if (logoDataUrl) {
    doc.addImage(logoDataUrl, 'PNG', MARGIN, 10, logoSize, logoSize);
  } else {
    drawLogoFallback(doc, MARGIN, 10, logoSize);
  }

  setText(doc, C.purple);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('TOYS FACTORY ERP', MARGIN + logoSize + 3, 14.5);

  setText(doc, C.slate500);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Smart Production. Smarter Business.', MARGIN + logoSize + 3, 19);

  setFill(doc, C.noteBg);
  setDraw(doc, C.noteBorder);
  doc.roundedRect(PAGE_W - MARGIN - 42, 9.5, 42, 11, 2, 2, 'FD');
  setText(doc, C.slate500);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.text('Report Date', PAGE_W - MARGIN - 39, 13.5);
  setText(doc, C.slate900);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text(dateStr, PAGE_W - MARGIN - 39, 17.5);

  setDraw(doc, C.purpleLine);
  doc.setLineWidth(0.6);
  doc.line(MARGIN, 24.5, PAGE_W - MARGIN, 24.5);

  setText(doc, C.blueTitle);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('PRODUCTION PLAN', MARGIN, 33);

  const metaY1 = 40;
  const metaY2 = 49;
  const col1 = MARGIN;
  const col2 = MARGIN + 62;
  const col3 = MARGIN + 148;

  const drawMeta = (x: number, y: number, label: string, value: string, maxWidth = 58) => {
    setText(doc, C.slate500);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.2);
    doc.text(label.toUpperCase(), x, y);
    setText(doc, C.slate900);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    const valueLines = doc.splitTextToSize(value, maxWidth);
    doc.text(valueLines, x, y + 4.5);
  };

  drawMeta(col1, metaY1, 'Product', recipe.product, 52);
  drawMeta(col2, metaY1, 'Model / Recipe', `${recipe.model} / ${recipe.recipeNumber}`, 78);
  drawMeta(col3, metaY1, 'BOM', recipe.version, 24);
  drawMeta(col1, metaY2, 'Batch Quantity', `${batchQty.toLocaleString()} products`, 52);
  drawMeta(col2, metaY2, 'Generated', dateStr, 78);

  drawToyIllustration(doc, PAGE_W - MARGIN - 52, 28);

  setText(doc, C.slate700);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('SUMMARY', MARGIN, 58.5);
}

function drawSummarySection(
  doc: import('jspdf').jsPDF,
  y: number,
  summary: ProductionPlanSummary,
  options: ProductionPlanPdfOptions,
): number {
  const cards = getSummaryCards(summary, options);
  const gap = 3;
  const cardH = 18;
  const cardW = (CONTENT_W - gap * (cards.length - 1)) / cards.length;

  cards.forEach((card, index) => {
    const x = MARGIN + index * (cardW + gap);
    drawSummaryCard(doc, x, y, cardW, cardH, card);
  });

  return y + cardH + 4;
}

function drawNoteBox(doc: import('jspdf').jsPDF, y: number): number {
  const h = 14;
  setFill(doc, C.noteBg);
  setDraw(doc, C.noteBorder);
  doc.roundedRect(MARGIN, y, CONTENT_W, h, 2.5, 2.5, 'FD');

  setFill(doc, C.purple);
  doc.circle(MARGIN + 5, y + 7, 2.2, 'F');

  setText(doc, C.slate700);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('Note:', MARGIN + 9.5, y + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  const note =
    'This production plan is generated automatically by Toys Factory ERP. Please review the shortfall items and take necessary procurement actions.';
  const wrapped = doc.splitTextToSize(note, CONTENT_W - 14);
  doc.text(wrapped, MARGIN + 9.5, y + 9.5);

  return y + h + 3;
}

function drawPageFooter(doc: import('jspdf').jsPDF, logoDataUrl: string | null) {
  const footerY = PAGE_H - 14;

  setDraw(doc, C.noteBorder);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, footerY - 3, PAGE_W - MARGIN, footerY - 3);

  const logoSize = 8;
  if (logoDataUrl) {
    doc.addImage(logoDataUrl, 'PNG', MARGIN, footerY - 1.5, logoSize, logoSize);
  } else {
    drawLogoFallback(doc, MARGIN, footerY - 1.5, logoSize);
  }

  setText(doc, C.purple);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('TOYS FACTORY ERP', MARGIN + logoSize + 2.5, footerY + 2.5);

  setText(doc, C.slate500);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.2);
  doc.text('Smart Production. Smarter Business.', MARGIN + logoSize + 2.5, footerY + 6);

  setText(doc, C.slate600);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('www.toysfactoryerp.com', PAGE_W / 2, footerY + 4, { align: 'center' });

  setText(doc, C.slate500);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text('Prepared By', PAGE_W - MARGIN - 34, footerY + 1.5);
  setDraw(doc, C.slate400);
  doc.setLineWidth(0.35);
  doc.line(PAGE_W - MARGIN - 34, footerY + 6.5, PAGE_W - MARGIN, footerY + 6.5);
  setText(doc, C.slate500);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.text('Authorized Signature', PAGE_W - MARGIN - 34, footerY + 9.5);
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
  const logoDataUrl = await loadLogoDataUrl();

  drawPageHeader(doc, recipe, batchQty, dateStr, logoDataUrl);
  const tableStartY = drawSummarySection(doc, 61, summary, options);

  const head: string[] = ['Material', 'Required'];
  if (options.showUnitCost) head.push('Unit Cost (tk)');
  if (options.showTotalCost) head.push('Total Cost (tk)');
  head.push('In Stock');
  if (options.showShortfall) head.push('Shortfall');
  head.push('Status', 'Supplier');

  const includeSupplierPrices = options.showUnitCost || options.showTotalCost;

  let totalCostCol = -1;
  let shortfallCol = -1;
  {
    let idx = 2;
    if (options.showUnitCost) idx += 1;
    if (options.showTotalCost) {
      totalCostCol = idx;
      idx += 1;
    }
    idx += 1; // in stock
    if (options.showShortfall) {
      shortfallCol = idx;
    }
  }
  const statusCol = head.length - 2;

  const body = lines.map((line) => {
    const row: string[] = [line.name, `${line.requiredQty.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${line.unit}`];
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

  autoTable(doc, {
    startY: tableStartY,
    head: [head],
    body,
    theme: 'grid',
    styles: {
      fontSize: 7.2,
      cellPadding: { top: 3, right: 2.5, bottom: 3, left: 2.5 },
      textColor: C.slate900,
      lineColor: C.tableBorder,
      lineWidth: 0.2,
      valign: 'middle',
    },
    headStyles: {
      fillColor: C.tableHead,
      textColor: C.white,
      fontStyle: 'bold',
      fontSize: 7,
      halign: 'center',
    },
    alternateRowStyles: { fillColor: C.rowAlt },
    columnStyles: {
      0: { cellWidth: 42, fontStyle: 'bold' },
      1: { halign: 'center' },
      [head.length - 1]: { halign: 'center' },
    },
    margin: { left: MARGIN, right: MARGIN, bottom: 22 },
    didParseCell: (data) => {
      if (data.section !== 'body') return;
      if (data.column.index === totalCostCol) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.textColor = C.blue;
        data.cell.styles.halign = 'center';
      }
      if (data.column.index === shortfallCol) {
        data.cell.styles.halign = 'center';
        const text = String(data.cell.raw ?? '');
        if (text !== '—') {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.textColor = C.red;
        }
      }
      if (data.column.index === statusCol) {
        const label = String(data.cell.raw ?? '');
        const colors = statusColors(label);
        data.cell.styles.fillColor = colors.bg;
        data.cell.styles.textColor = colors.text;
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.halign = 'center';
      }
    },
    didDrawPage: () => {
      drawPageFooter(doc, logoDataUrl);
    },
  });

  const docWithTable = doc as import('jspdf').jsPDF & { lastAutoTable?: { finalY: number } };
  const pageCount = doc.getNumberOfPages();
  doc.setPage(pageCount);
  const finalY = docWithTable.lastAutoTable?.finalY ?? tableStartY + 20;
  if (finalY < PAGE_H - 32) {
    drawNoteBox(doc, finalY + 4);
  }

  const safeName = recipe.recipeNumber.replace(/[^\w-]/g, '_');
  doc.save(`production-plan-${safeName}-${batchQty}.pdf`);
}
