'use client';

import { useMemo } from 'react';
import { Icon } from '@iconify/react';
import { useAppStore } from '@/lib/state/app-store';
import { formatCurrency } from '@/lib/services/domain-service';
import { IR_CARD } from '@/components/modules/reports/inventory/inventory-report-styles';
import { ReportSectionHeader } from '@/components/modules/reports/shared/ReportSectionHeader';
import { ReportMetricBar } from '@/components/modules/reports/shared/ReportMetricBar';
import { buildMotionKey } from '@/components/modules/reports/shared/useReportChartIntro';
import type { InventoryStockMovement } from '@/components/modules/reports/inventory/inventory-report-utils';

export function InventoryStockMovement({
  movement,
  onPrint,
}: {
  movement: InventoryStockMovement;
  onPrint?: () => void;
}) {
  const t = useAppStore((s) => s.t);

  const tiles = [
    { key: 'in', label: t('reports.inventory_stock_in'), value: movement.stockIn, icon: 'flat-color-icons:up', from: '#10b981', to: '#059669' },
    { key: 'out', label: t('reports.inventory_stock_out'), value: movement.stockOut, icon: 'flat-color-icons:down', from: '#ef4444', to: '#dc2626' },
    { key: 'adj', label: t('reports.inventory_adjustments'), value: movement.adjustments, icon: 'fluent-color:settings-24', from: '#f59e0b', to: '#d97706' },
    { key: 'net', label: t('reports.inventory_net_change'), value: movement.netChange, icon: 'fluent-color:data-trending-24', from: '#3b82f6', to: '#2563eb' },
  ];

  const maxValue = useMemo(
    () => Math.max(...tiles.map((tile) => Math.abs(tile.value)), 1),
    [tiles],
  );
  const motionKey = buildMotionKey(tiles.map((tile) => `${tile.key}:${tile.value}`));

  return (
    <div className={`${IR_CARD} flex flex-col`}>
      <ReportSectionHeader
        icon={<Icon icon="fluent-color:arrow-swap-24" width={24} height={24} className="shrink-0" />}
        title={t('reports.inventory_stock_movement')}
        onPrint={onPrint}
        printLabel={t('reports.print_section')}
      />
      <div className="grid grid-cols-2 gap-2 flex-1">
        {tiles.map((tile, idx) => (
          <div key={tile.key} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Icon icon={tile.icon} width={22} height={22} className="shrink-0" />
              <span className="text-[11px] font-bold text-slate-500">{tile.label}</span>
            </div>
            <span className="text-sm font-extrabold tabular-nums" style={{ color: tile.from }}>
              {formatCurrency(tile.value)}
            </span>
            <ReportMetricBar
              value={tile.value}
              max={maxValue}
              from={tile.from}
              to={tile.to}
              delayMs={idx * 70}
              animateKey={motionKey}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
