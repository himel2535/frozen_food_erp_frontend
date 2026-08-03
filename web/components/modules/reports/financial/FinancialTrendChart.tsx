'use client';

import { useEffect, useRef } from 'react';
import { Icon } from '@iconify/react';
import { useAppStore } from '@/lib/state/app-store';
import { ReportSectionHeader } from '@/components/modules/reports/shared/ReportSectionHeader';
import { FR_CARD } from '@/components/modules/reports/financial/financial-report-styles';
import type { FinancialTrendPoint } from '@/components/modules/reports/financial/financial-report-utils';

export function FinancialTrendChart({
  data,
  onPrint,
}: {
  data: FinancialTrendPoint[];
  onPrint?: () => void;
}) {
  const t = useAppStore((s) => s.t);
  const boxRef = useRef<HTMLDivElement>(null);
  const revenuePathRef = useRef<SVGPathElement>(null);
  const expensesPathRef = useRef<SVGPathElement>(null);
  const netPathRef = useRef<SVGPathElement>(null);
  const revenueAreaRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    function draw() {
      const box = boxRef.current;
      const revenuePath = revenuePathRef.current;
      const expensesPath = expensesPathRef.current;
      const netPath = netPathRef.current;
      const revenueArea = revenueAreaRef.current;
      if (!box || !revenuePath || !expensesPath || !netPath || !revenueArea) return;

      const w = box.clientWidth;
      const h = box.clientHeight - 24;
      const max = Math.max(
        1,
        ...data.flatMap((point) => [point.revenue, point.expenses, point.netProfit]),
      );

      function pointsFor(key: 'revenue' | 'expenses' | 'netProfit') {
        return data.map((point, idx) => {
          const x = (idx / Math.max(data.length - 1, 1)) * w;
          const y = h - (point[key] / max) * (h - 16);
          return { x, y };
        });
      }

      function pathFrom(points: { x: number; y: number }[]) {
        return points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
      }

      const revenuePts = pointsFor('revenue');
      const expensesPts = pointsFor('expenses');
      const netPts = pointsFor('netProfit');
      const revenueLine = pathFrom(revenuePts);

      revenuePath.setAttribute('d', revenueLine);
      expensesPath.setAttribute('d', pathFrom(expensesPts));
      netPath.setAttribute('d', pathFrom(netPts));
      revenueArea.setAttribute('d', `${revenueLine} L ${w} ${h} L 0 ${h} Z`);
    }

    draw();
    window.addEventListener('resize', draw);
    return () => window.removeEventListener('resize', draw);
  }, [data]);

  return (
    <section className="space-y-2">
      <ReportSectionHeader
        icon={<Icon icon="fluent-color:data-trending-24" width={22} height={22} className="shrink-0" />}
        title={t('reports.financial_trend_chart')}
        onPrint={onPrint}
        printLabel={t('reports.print_section')}
      />
      <div className={`${FR_CARD} flex flex-col`}>
        <div className="flex flex-wrap items-center gap-3 mb-3 text-[10px] font-semibold text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-emerald-500 rounded-full" />
            {t('reports.financial_legend_revenue')}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-rose-500 rounded-full" />
            {t('reports.financial_legend_expenses')}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-blue-600 rounded-full" />
            {t('reports.financial_legend_net')}
          </span>
        </div>

        <div ref={boxRef} className="h-56 w-full relative">
          <svg className="w-full h-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="financial-revenue-area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path ref={revenueAreaRef} d="" fill="url(#financial-revenue-area)" />
            <path ref={expensesPathRef} d="" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
            <path ref={netPathRef} d="" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />
            <path ref={revenuePathRef} d="" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          <div className="absolute bottom-0 left-0 w-full flex justify-between text-[10px] font-bold text-slate-400/80 pt-2 border-t border-slate-100">
            {data.map((point) => (
              <span key={point.label}>{point.label.replace(' 2026', '')}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
