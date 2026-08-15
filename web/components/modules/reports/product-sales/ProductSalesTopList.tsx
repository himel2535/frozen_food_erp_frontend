'use client';

import { Icon } from '@iconify/react';
import { useAppStore } from '@/lib/state/app-store';
import { formatCurrency } from '@/lib/services/domain-service';
import { ReportSectionHeader } from '@/components/modules/reports/shared/ReportSectionHeader';
import { PSR_CARD } from '@/components/modules/reports/product-sales/product-sales-report-styles';
import type { ProductSalesRow } from '@/components/modules/reports/product-sales/product-sales-report-utils';

const RANK_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-violet-100 text-violet-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
];

export function ProductSalesTopList({
  rows,
  onPrint,
  title,
  onSelect,
}: {
  rows: ProductSalesRow[];
  onPrint?: () => void;
  title?: string;
  onSelect?: (row: ProductSalesRow) => void;
}) {
  const t = useAppStore((s) => s.t);
  const top = rows.slice(0, 5);

  return (
    <div className={`${PSR_CARD} flex flex-col`}>
      <ReportSectionHeader
        icon={<Icon icon="fluent-color:ribbon-24" width={24} height={24} className="shrink-0" />}
        title={title ?? t('reports.product_sales_top')}
        onPrint={onPrint}
        printLabel={t('reports.print_section')}
      />
      <div className="space-y-2 flex-1">
        {top.length ? (
          top.map((row, idx) => (
            <div
              key={row.key}
              role={onSelect ? 'button' : undefined}
              tabIndex={onSelect ? 0 : undefined}
              onClick={onSelect ? () => onSelect(row) : undefined}
              onKeyDown={onSelect ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect(row);
                }
              } : undefined}
              className={`flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50/80 transition-colors ${
                onSelect ? 'cursor-pointer' : ''
              }`}
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-extrabold shrink-0 ${
                  RANK_COLORS[idx % RANK_COLORS.length]
                }`}
              >
                {idx + 1}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-800 truncate">{row.productName}</p>
                <p className="text-[11px] font-medium text-slate-500">
                  {t('reports.product_sales_qty_count', { n: row.qty })}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-extrabold text-slate-900 tabular-nums">{formatCurrency(row.revenue)}</p>
                <p className="text-[10px] font-bold text-blue-600 tabular-nums">{row.sharePct.toFixed(1)}%</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-[11px] font-medium text-slate-400 text-center py-4">
            {t('reports.product_sales_no_products')}
          </p>
        )}
      </div>
    </div>
  );
}
