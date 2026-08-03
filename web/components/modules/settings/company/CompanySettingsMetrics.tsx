'use client';

import { Icon } from '@iconify/react';
import { ST_METRIC_LABEL, ST_METRIC_VALUE } from '@/components/modules/settings/settings-styles';
import type { CompanyMetrics } from '@/lib/services/settings-service';

type CompanySettingsMetricsProps = {
  metrics: CompanyMetrics;
  labels: {
    employees: string;
    warehouses: string;
    currency: string;
    fiscalYear: string;
  };
};

export function CompanySettingsMetrics({ metrics, labels }: CompanySettingsMetricsProps) {
  const items = [
    {
      key: 'employees',
      label: labels.employees,
      value: String(metrics.employeeCount),
      sub: 'Active directory',
      icon: 'fluent-color:people-team-24',
    },
    {
      key: 'warehouses',
      label: labels.warehouses,
      value: String(metrics.warehouseCount),
      sub: 'Active locations',
      icon: 'fluent-color:warehouse-24',
    },
    {
      key: 'currency',
      label: labels.currency,
      value: metrics.currency,
      sub: 'Default currency',
      icon: 'flat-color-icons:currency-exchange',
    },
    {
      key: 'fiscalYear',
      label: labels.fiscalYear,
      value: metrics.fiscalYear.replace('Starts ', ''),
      sub: metrics.fiscalYear.startsWith('Starts') ? 'Fiscal calendar' : undefined,
      icon: 'fluent-color:calendar-24',
    },
  ];

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
      {items.map((item) => (
        <div key={item.key} className="premium-card premium-shadow p-4 flex items-center justify-between gap-3 min-h-[84px]">
          <div className="min-w-0 flex-1">
            <span className={ST_METRIC_LABEL}>{item.label}</span>
            <div className={`${ST_METRIC_VALUE} mt-0.5 truncate`}>{item.value}</div>
            {item.sub ? <span className="text-xs font-bold text-slate-500 block mt-0.5">{item.sub}</span> : null}
          </div>
          <Icon icon={item.icon} width={40} height={40} className="shrink-0" />
        </div>
      ))}
    </section>
  );
}
