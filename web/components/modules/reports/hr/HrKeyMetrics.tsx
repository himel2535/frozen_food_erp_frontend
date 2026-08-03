'use client';

import { Icon } from '@iconify/react';
import { useAppStore } from '@/lib/state/app-store';
import { ReportSectionHeader } from '@/components/modules/reports/shared/ReportSectionHeader';
import { HR_CARD } from '@/components/modules/reports/hr/hr-report-styles';
import type { HrKeyMetricsSnapshot } from '@/components/modules/reports/hr/hr-report-utils';

export function HrKeyMetrics({
  metrics,
  onPrint,
}: {
  metrics: HrKeyMetricsSnapshot;
  onPrint?: () => void;
}) {
  const t = useAppStore((s) => s.t);

  const items = [
    {
      key: 'avgAge',
      label: t('reports.hr_metric_avg_age'),
      value: `${metrics.averageAge.toFixed(1)} ${t('reports.hr_years')}`,
      icon: 'fluent-color:person-24',
      color: 'from-blue-500 to-blue-600',
    },
    {
      key: 'avgTenure',
      label: t('reports.hr_metric_avg_tenure'),
      value: `${metrics.averageTenure.toFixed(1)} ${t('reports.hr_years')}`,
      icon: 'fluent-color:calendar-clock-24',
      color: 'from-violet-500 to-violet-600',
    },
    {
      key: 'attendance',
      label: t('reports.hr_metric_attendance'),
      value: `${metrics.attendanceRate.toFixed(2)}%`,
      icon: 'fluent-color:checkmark-circle-24',
      color: 'from-emerald-500 to-emerald-600',
    },
    {
      key: 'leave',
      label: t('reports.hr_metric_leave'),
      value: `${metrics.leaveUtilization.toFixed(2)}%`,
      icon: 'fluent-color:calendar-ltr-24',
      color: 'from-amber-500 to-amber-600',
    },
  ];

  return (
    <section className="space-y-2">
      <ReportSectionHeader
        icon={<Icon icon="fluent-color:clipboard-data-bar-24" width={22} height={22} className="shrink-0" />}
        title={t('reports.hr_key_metrics')}
        onPrint={onPrint}
        printLabel={t('reports.print_section')}
      />
      <div className={`${HR_CARD} grid grid-cols-2 gap-2`}>
        {items.map((item) => (
          <div
            key={item.key}
            className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 flex flex-col gap-1.5"
          >
            <div className="flex items-center gap-2">
              <Icon icon={item.icon} width={20} height={20} className="shrink-0" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{item.label}</span>
            </div>
            <span className={`text-lg font-extrabold bg-gradient-to-r ${item.color} bg-clip-text text-transparent tabular-nums`}>
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
