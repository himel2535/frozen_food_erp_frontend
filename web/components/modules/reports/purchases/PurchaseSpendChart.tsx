'use client';

import { useEffect, useMemo, useRef } from 'react';
import { Icon } from '@iconify/react';
import { useAppStore } from '@/lib/state/app-store';
import { PR_CARD, PR_TITLE } from '@/components/modules/reports/purchases/purchase-report-styles';
import { ReportSectionHeader } from '@/components/modules/reports/shared/ReportSectionHeader';
import { animateAreaFill, animateLinePath } from '@/components/modules/reports/shared/chart-motion';
import { buildMotionKey } from '@/components/modules/reports/shared/useReportChartIntro';
import type { PurchaseChartPoint } from '@/components/modules/reports/purchases/purchase-report-utils';

export function PurchaseSpendChart({
  data,
  onPrint,
}: {
  data: PurchaseChartPoint[];
  onPrint?: () => void;
}) {
  const t = useAppStore((s) => s.t);
  const boxRef = useRef<HTMLDivElement>(null);
  const thisPathRef = useRef<SVGPathElement>(null);
  const lastPathRef = useRef<SVGPathElement>(null);
  const thisAreaRef = useRef<SVGPathElement>(null);
  const animatedKeyRef = useRef('');
  const motionKey = useMemo(
    () => buildMotionKey(data.flatMap((point) => [point.label, point.thisMonth, point.lastMonth])),
    [data],
  );

  useEffect(() => {
    function draw(animate: boolean) {
      const box = boxRef.current;
      const thisPath = thisPathRef.current;
      const lastPath = lastPathRef.current;
      const thisArea = thisAreaRef.current;
      if (!box || !thisPath || !lastPath || !thisArea) return;

      const w = box.clientWidth;
      const h = box.clientHeight - 24;
      const max = Math.max(1, ...data.flatMap((point) => [point.thisMonth, point.lastMonth]));

      function pointsFor(key: 'thisMonth' | 'lastMonth') {
        return data.map((point, idx) => {
          const x = (idx / Math.max(data.length - 1, 1)) * w;
          const y = h - (point[key] / max) * (h - 16);
          return { x, y };
        });
      }

      function pathFrom(points: { x: number; y: number }[]) {
        return points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
      }

      const thisLine = pathFrom(pointsFor('thisMonth'));
      const lastLine = pathFrom(pointsFor('lastMonth'));

      thisPath.setAttribute('d', thisLine);
      lastPath.setAttribute('d', lastLine);
      thisArea.setAttribute('d', `${thisLine} L ${w} ${h} L 0 ${h} Z`);

      if (animate && animatedKeyRef.current !== motionKey) {
        animatedKeyRef.current = motionKey;
        requestAnimationFrame(() => {
          animateLinePath(lastPath, 900, 80);
          animateLinePath(thisPath, 950, 160);
          animateAreaFill(thisArea, 750, 320);
        });
      }
    }

    draw(true);
    const onResize = () => draw(false);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [data, motionKey]);

  return (
    <div className={`${PR_CARD} lg:col-span-2 flex flex-col`}>
      <ReportSectionHeader
        icon={<Icon icon="fluent-color:data-trending-24" width={26} height={26} className="shrink-0" />}
        title={t('reports.purchases_spend_overview')}
        onPrint={onPrint}
        printLabel={t('reports.print_section')}
        action={
          <select className="bg-slate-50 border border-slate-200 text-[10px] font-semibold text-slate-600 rounded-lg px-2.5 py-1 cursor-pointer shrink-0">
            <option>{t('reports.purchases_period_daily')}</option>
            <option>{t('reports.purchases_period_weekly')}</option>
          </select>
        }
      />

      <div className="flex items-center gap-4 mb-3 text-[10px] font-semibold text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-blue-600 rounded-full" />
          {t('reports.purchases_this_month')}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-0.5 border-t-2 border-dashed border-slate-400" />
          {t('reports.purchases_last_month')}
        </span>
      </div>

      <div ref={boxRef} className="h-56 w-full relative">
        <svg className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="purchase-spend-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path ref={thisAreaRef} d="" fill="url(#purchase-spend-area)" />
          <path ref={lastPathRef} d="" fill="none" stroke="#94a3b8" strokeWidth="2" strokeDasharray="6 4" strokeLinecap="round" />
          <path ref={thisPathRef} d="" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
        <div className="absolute bottom-0 left-0 w-full flex justify-between text-[10px] font-bold text-slate-400/80 pt-2 border-t border-slate-100">
          {data.map((point) => (
            <span key={point.label}>{point.label}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
