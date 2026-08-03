'use client';

import { Icon } from '@iconify/react';
import { ST_METRIC_LABEL, ST_METRIC_VALUE } from '@/components/modules/settings/settings-styles';
import type { ProfileMetrics } from '@/lib/services/settings-service';

type ProfileSettingsMetricsProps = {
  metrics: ProfileMetrics;
  labels: {
    role: string;
    branch: string;
    employeeId: string;
    lastActive: string;
    online: string;
  };
};

export function ProfileSettingsMetrics({ metrics, labels }: ProfileSettingsMetricsProps) {
  const items = [
    { key: 'role', label: labels.role, value: metrics.role, icon: 'fluent-color:shield-24', sub: undefined as string | undefined },
    { key: 'branch', label: labels.branch, value: metrics.branch, icon: 'fluent-color:building-24', sub: undefined },
    { key: 'employeeId', label: labels.employeeId, value: metrics.employeeId, icon: 'fluent-color:person-24', sub: undefined },
    {
      key: 'lastActive',
      label: labels.lastActive,
      value: metrics.lastActive,
      icon: 'fluent-color:clock-24',
      sub: metrics.isOnline ? labels.online : undefined,
    },
  ];

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2">
      {items.map((item) => (
        <div key={item.key} className="premium-card premium-shadow p-4 flex items-center justify-between gap-3 min-h-[84px]">
          <div className="min-w-0 flex-1">
            <span className={ST_METRIC_LABEL}>{item.label}</span>
            <div className={`${ST_METRIC_VALUE} mt-0.5 truncate`}>{item.value}</div>
            {item.sub ? (
              <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {item.sub}
              </span>
            ) : null}
          </div>
          <Icon icon={item.icon} width={40} height={40} className="shrink-0" />
        </div>
      ))}
    </section>
  );
}
