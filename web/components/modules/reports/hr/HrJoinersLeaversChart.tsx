'use client';

import { useEffect, useMemo, useRef } from 'react';
import { Icon } from '@iconify/react';
import { useAppStore } from '@/lib/state/app-store';
import { ReportSectionHeader } from '@/components/modules/reports/shared/ReportSectionHeader';
import { animateBarRect } from '@/components/modules/reports/shared/chart-motion';
import { buildMotionKey } from '@/components/modules/reports/shared/useReportChartIntro';
import { HR_CARD } from '@/components/modules/reports/hr/hr-report-styles';
import type { HrJoinersLeaversPoint } from '@/components/modules/reports/hr/hr-report-utils';

export function HrJoinersLeaversChart({
  data,
  onPrint,
}: {
  data: HrJoinersLeaversPoint[];
  onPrint?: () => void;
}) {
  const t = useAppStore((s) => s.t);
  const boxRef = useRef<HTMLDivElement>(null);
  const joinedGroupRef = useRef<SVGGElement>(null);
  const leftGroupRef = useRef<SVGGElement>(null);
  const animatedKeyRef = useRef('');
  const motionKey = useMemo(
    () => buildMotionKey(data.flatMap((point) => [point.label, point.joined, point.left])),
    [data],
  );

  useEffect(() => {
    function draw(animate: boolean) {
      const box = boxRef.current;
      const joinedGroup = joinedGroupRef.current;
      const leftGroup = leftGroupRef.current;
      if (!box || !joinedGroup || !leftGroup) return;

      const w = box.clientWidth;
      const h = box.clientHeight - 24;
      const max = Math.max(1, ...data.flatMap((point) => [point.joined, point.left]));
      const groupWidth = w / data.length;
      const barWidth = Math.min(14, groupWidth * 0.28);
      const gap = 4;

      joinedGroup.innerHTML = '';
      leftGroup.innerHTML = '';

      data.forEach((point, idx) => {
        const cx = idx * groupWidth + groupWidth / 2;

        const joinedHeight = point.joined > 0
          ? Math.max(6, (point.joined / max) * (h - 16))
          : 0;
        const leftHeight = point.left > 0
          ? Math.max(6, (point.left / max) * (h - 16))
          : 0;

        if (joinedHeight > 0) {
          const joinedRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          joinedRect.setAttribute('x', String(cx - barWidth - gap / 2));
          joinedRect.setAttribute('y', String(h - joinedHeight));
          joinedRect.setAttribute('width', String(barWidth));
          joinedRect.setAttribute('height', String(joinedHeight));
          joinedRect.setAttribute('rx', '3');
          joinedRect.setAttribute('fill', 'url(#hr-joined-gradient)');
          joinedGroup.appendChild(joinedRect);
          if (animate) animateBarRect(joinedRect, joinedHeight, h, 700, idx * 55);
        }

        if (leftHeight > 0) {
          const leftRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          leftRect.setAttribute('x', String(cx + gap / 2));
          leftRect.setAttribute('y', String(h - leftHeight));
          leftRect.setAttribute('width', String(barWidth));
          leftRect.setAttribute('height', String(leftHeight));
          leftRect.setAttribute('rx', '3');
          leftRect.setAttribute('fill', 'url(#hr-left-gradient)');
          leftGroup.appendChild(leftRect);
          if (animate) animateBarRect(leftRect, leftHeight, h, 700, idx * 55 + 30);
        }
      });
    }

    if (animatedKeyRef.current !== motionKey) {
      animatedKeyRef.current = motionKey;
      draw(true);
    } else {
      draw(false);
    }

    const onResize = () => draw(false);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [data, motionKey]);

  return (
    <section className="space-y-2">
      <ReportSectionHeader
        icon={<Icon icon="fluent-color:data-bar-vertical-24" width={22} height={22} className="shrink-0" />}
        title={t('reports.hr_joiners_leavers_chart')}
        onPrint={onPrint}
        printLabel={t('reports.print_section')}
      />
      <div className={`${HR_CARD} flex flex-col`}>
        <div className="flex flex-wrap items-center gap-3 mb-3 text-[10px] font-semibold text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-emerald-500" />
            {t('reports.hr_legend_joined')}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-rose-500" />
            {t('reports.hr_legend_left')}
          </span>
        </div>

        <div ref={boxRef} className="h-56 w-full relative">
          <svg className="w-full h-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="hr-joined-gradient" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#059669" />
                <stop offset="100%" stopColor="#34d399" />
              </linearGradient>
              <linearGradient id="hr-left-gradient" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#dc2626" />
                <stop offset="100%" stopColor="#fb7185" />
              </linearGradient>
            </defs>
            <g ref={joinedGroupRef} />
            <g ref={leftGroupRef} />
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
