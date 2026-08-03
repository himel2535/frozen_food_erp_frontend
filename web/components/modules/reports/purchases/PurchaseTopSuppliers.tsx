'use client';

import Link from 'next/link';
import { Icon } from '@iconify/react';
import { useAppStore } from '@/lib/state/app-store';
import { formatCurrency } from '@/lib/services/domain-service';
import { PR_CARD } from '@/components/modules/reports/purchases/purchase-report-styles';
import { ReportSectionHeader } from '@/components/modules/reports/shared/ReportSectionHeader';
import type { PurchaseTopSupplier } from '@/components/modules/reports/purchases/purchase-report-utils';

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-violet-100 text-violet-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
];

export function PurchaseTopSuppliers({
  suppliers,
  onPrint,
}: {
  suppliers: PurchaseTopSupplier[];
  onPrint?: () => void;
}) {
  const t = useAppStore((s) => s.t);

  return (
    <div className={`${PR_CARD} flex flex-col`}>
      <ReportSectionHeader
        icon={<Icon icon="fluent-color:building-store-24" width={24} height={24} className="shrink-0" />}
        title={t('reports.purchases_top_suppliers')}
        onPrint={onPrint}
        printLabel={t('reports.print_section')}
        action={
          <Link
            href="/purchases/orders"
            className="text-[11px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer shrink-0"
          >
            {t('reports.purchases_view_all')}
          </Link>
        }
      />

      <div className="space-y-2 flex-1">
        {suppliers.length ? (
          suppliers.map((supplier, idx) => (
            <div
              key={supplier.name}
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50/80 transition-colors"
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-extrabold shrink-0 ${
                  AVATAR_COLORS[idx % AVATAR_COLORS.length]
                }`}
              >
                {supplier.initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-800 truncate">{supplier.name}</p>
                <p className="text-[11px] font-medium text-slate-500">
                  {t('reports.purchases_po_count', { n: supplier.orderCount })}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-extrabold text-slate-900 tabular-nums">{formatCurrency(supplier.totalSpent)}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-[11px] font-medium text-slate-400 text-center py-4">{t('reports.purchases_no_suppliers')}</p>
        )}
      </div>
    </div>
  );
}
