'use client';

import { formatDetailDate } from '@/components/modules/crm/customer-detail/customer-detail-utils';
import {
  CD_BODY,
  CD_CAPTION,
  CD_CARD,
} from '@/components/modules/crm/customer-detail/customer-detail-styles';

type ActivityTabProps = {
  activities: Array<Record<string, unknown>>;
  auditLogs: Array<Record<string, unknown>>;
};

export function ActivityTab({ activities, auditLogs }: ActivityTabProps) {
  const items = [
    ...activities.map((a) => ({
      id: String(a.id),
      title: String(a.summary ?? a.type ?? 'Activity'),
      meta: `${String(a.type ?? 'activity')} · ${formatDetailDate(a.completedAt ?? a.createdAt)}`,
    })),
    ...auditLogs.map((log) => ({
      id: String(log.id),
      title: String(log.action ?? log.summary ?? 'Audit entry'),
      meta: `${String(log.actorName ?? log.user ?? 'System')} · ${formatDetailDate(log.timestamp)}`,
    })),
  ].sort((a, b) => b.meta.localeCompare(a.meta));

  return (
    <div className={CD_CARD}>
      {items.length ? (
        <ul className="space-y-4">
          {items.map((item) => (
            <li key={item.id} className="flex gap-3 border-b border-slate-50 pb-4 last:border-0">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
              <div>
                <p className={CD_BODY}>{item.title}</p>
                <p className={`${CD_CAPTION} mt-0.5`}>{item.meta}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className={CD_CAPTION}>No activity logged yet.</p>
      )}
    </div>
  );
}
