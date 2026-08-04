'use client';

import { useEffect, useMemo, useRef } from 'react';
import { Icon } from '@iconify/react';
import { useAppStore } from '@/lib/state/app-store';
import { useLocaleFormat } from '@/hooks/useLocaleFormat';

const TREND_VALUES = [24000, 39000, 32000, 64300, 50000, 78000, 68000];
const HIGHLIGHT_IDX = 3;
const TREND_AXIS_DATES = [
  '2025-05-12',
  '2025-05-19',
  '2025-05-26',
  '2025-06-02',
  '2025-06-09',
];
const TREND_TOOLTIP_DATE = '2025-05-28';
const TREND_TOOLTIP_VALUE = TREND_VALUES[HIGHLIGHT_IDX];

export function SalesTrendChart() {
  const t = useAppStore((s) => s.t);
  const { formatDate, formatMoney } = useLocaleFormat();
  const boxRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const areaRef = useRef<SVGPathElement>(null);
  const markerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const axisLabels = useMemo(
    () =>
      TREND_AXIS_DATES.map((iso) =>
        formatDate(iso, { month: 'short', day: 'numeric', year: undefined }),
      ),
    [formatDate],
  );

  const tooltipDate = useMemo(
    () => formatDate(TREND_TOOLTIP_DATE, { day: 'numeric', month: 'long', year: 'numeric' }),
    [formatDate],
  );
  const tooltipAmount = useMemo(() => formatMoney(TREND_TOOLTIP_VALUE), [formatMoney]);

  useEffect(() => {
    function draw() {
      const box = boxRef.current;
      const path = pathRef.current;
      const area = areaRef.current;
      const marker = markerRef.current;
      const tooltip = tooltipRef.current;
      if (!box || !path || !area) return;

      const w = box.clientWidth;
      const h = box.clientHeight - 20;
      const max = 100000;

      const points = TREND_VALUES.map((val, idx) => {
        const x = (idx / (TREND_VALUES.length - 1)) * w;
        const y = h - (val / max) * (h - 20);
        return { x, y, val };
      });

      const lineD = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
      path.setAttribute('d', lineD);
      area.setAttribute('d', `${lineD} L ${w} ${h} L 0 ${h} Z`);

      const targetPt = points[HIGHLIGHT_IDX];
      if (targetPt && marker && tooltip) {
        marker.classList.remove('hidden');
        marker.style.left = `${targetPt.x - 7}px`;
        marker.style.top = `${targetPt.y - 7}px`;
        tooltip.style.left = `${targetPt.x}px`;
        tooltip.style.top = `${targetPt.y}px`;
      }
    }

    draw();
    window.addEventListener('resize', draw);
    return () => window.removeEventListener('resize', draw);
  }, []);

  return (
    <div className="premium-card p-4 premium-shadow lg:col-span-2 flex flex-col relative">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon icon="fluent-color:data-trending-24" width={26} height={26} className="shrink-0" />
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">{t('dashboard.sales_trend')}</h3>
        </div>
        <select className="bg-slate-50 border border-slate-200 text-[10px] font-semibold text-slate-600 rounded-lg px-2.5 py-1 cursor-pointer">
          <option>{t('dashboard.this_month')}</option>
          <option>{t('dashboard.last_quarter')}</option>
        </select>
      </div>
      <div ref={boxRef} className="h-56 w-full relative pt-6" id="trend-chart-box">
        <svg className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="line-area-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path ref={areaRef} d="" fill="url(#line-area-grad)" />
          <path ref={pathRef} d="" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
        <div
          ref={markerRef}
          className="absolute w-3.5 h-3.5 rounded-full border-2 border-white bg-blue-600 shadow-md hidden"
        />
        <div ref={tooltipRef} className="chart-tooltip" style={{ transform: 'translate(-50%, -120%)' }}>
          <div className="text-[9px] text-slate-400 font-medium leading-none">{tooltipDate}</div>
          <div className="text-[11px] text-white font-extrabold mt-1">{tooltipAmount}</div>
        </div>
        <div className="absolute bottom-0 left-0 w-full flex justify-between text-[10px] font-bold text-slate-400/80 pt-2 border-t border-slate-100">
          {axisLabels.map((label, idx) => (
            <span key={TREND_AXIS_DATES[idx]}>{label}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
