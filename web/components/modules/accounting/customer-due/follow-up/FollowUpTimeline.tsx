'use client';

import { toast } from '@/lib/ui/feedback';

import { useMemo, useState } from 'react';
import { CheckCircle2, MessageCircle, Phone } from 'lucide-react';
import type { CollectionActivity, CollectionActivityType } from '@/lib/state/customer-collection-seed';
import { FU_BTN_OUTLINE, FU_CARD_CLS, ICON_CIRCLE_BY_TYPE, STATUS_TONE_BADGE } from './follow-up-styles';

function isRichActivity(activity: CollectionActivity) {
  return Boolean(
    activity.statusLabel || activity.sideAction || activity.sideMeta || activity.sideHint,
  );
}

function ActivityTypeIcon({ type }: { type: CollectionActivityType }) {
  if (type === 'promise') return <CheckCircle2 className="w-4 h-4" />;
  if (type === 'call') return <Phone className="w-4 h-4" />;
  if (type === 'whatsapp') return <MessageCircle className="w-4 h-4" />;
  return <span className="h-2 w-2 rounded-full bg-current" />;
}

function dotToneClass(type: CollectionActivityType) {
  if (type === 'call') return 'bg-blue-500';
  if (type === 'whatsapp') return 'bg-emerald-500';
  if (type === 'promise') return 'bg-purple-500';
  return 'bg-amber-400';
}

function formatTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatGroupLabel(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const dateLabel = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase();
  if (d.toDateString() === today.toDateString()) return `TODAY — ${dateLabel}`;
  if (d.toDateString() === yesterday.toDateString()) return `YESTERDAY — ${dateLabel}`;
  return dateLabel;
}

function groupActivities(activities: CollectionActivity[]) {
  const groups: { label: string; items: CollectionActivity[] }[] = [];
  activities.forEach((activity) => {
    const label = formatGroupLabel(activity.at);
    const existing = groups.find((g) => g.label === label);
    if (existing) existing.items.push(activity);
    else groups.push({ label, items: [activity] });
  });
  return groups;
}

function CompactActivityRow({
  activity,
  isLast,
}: {
  activity: CollectionActivity;
  isLast: boolean;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center shrink-0 w-14 pt-0.5">
        <span className="text-[11px] font-semibold text-slate-500">{formatTime(activity.at)}</span>
        <div className="flex flex-col items-center flex-1 mt-2">
          <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${dotToneClass(activity.type)}`} />
          {!isLast && <span className="w-px flex-1 bg-slate-200 min-h-[32px] mt-1" />}
        </div>
      </div>

      <div className="flex flex-1 items-start gap-2 min-w-0 pb-4">
        <div className="min-w-0">
          <h4 className="text-sm font-extrabold text-slate-900">{activity.title ?? 'Activity'}</h4>
          <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{activity.text}</p>
          <p className="text-[10px] text-slate-400 mt-1">By {activity.by}</p>
        </div>
      </div>
    </div>
  );
}

function RichActivityCard({ activity }: { activity: CollectionActivity }) {
  const tone = activity.statusTone ?? 'sky';
  const iconCls = ICON_CIRCLE_BY_TYPE[activity.type] ?? ICON_CIRCLE_BY_TYPE.note;

  return (
    <div className={`${FU_CARD_CLS} p-4`}>
      <div className="flex gap-3">
        <div className="flex flex-col items-center shrink-0 w-16">
          <span className="text-[11px] font-semibold text-slate-500">{formatTime(activity.at)}</span>
          <span className={`mt-2 inline-flex h-10 w-10 items-center justify-center rounded-full ${iconCls}`}>
            <ActivityTypeIcon type={activity.type} />
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-sm font-extrabold text-slate-900">{activity.title ?? 'Activity'}</h4>
            {activity.statusLabel && (
              <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${STATUS_TONE_BADGE[tone]}`}>
                {activity.statusLabel}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">{activity.text}</p>
          <p className="text-[10px] text-slate-400 mt-1">By {activity.by}</p>
        </div>

        <div className="flex flex-col items-end gap-1.5 shrink-0 max-w-[200px] text-right">
          {activity.sideHint && (
            <span className="text-[11px] font-bold text-amber-600">{activity.sideHint}</span>
          )}
          {activity.sideMeta && (
            <span className="text-[10px] text-slate-500">{activity.sideMeta}</span>
          )}
          {activity.sideAction && (
            <button
              type="button"
              className={FU_BTN_OUTLINE}
              onClick={() => toast.info('Feature coming soon', { module: 'Customer Due', description: `${activity.sideAction?.label} coming soon.` })}
            >
              {activity.sideAction.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function FollowUpTimeline({ activities }: { activities: CollectionActivity[] }) {
  const [visibleCount, setVisibleCount] = useState(5);
  const visibleActivities = activities.slice(0, visibleCount);
  const groups = useMemo(() => groupActivities(visibleActivities), [visibleActivities]);
  const hasMore = activities.length > visibleCount;

  if (activities.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
        <p className="text-sm font-bold text-slate-700">No activity yet</p>
        <p className="text-xs text-slate-500 mt-1">Log a follow-up to start the timeline.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <div key={group.label} className="space-y-3">
          <h3 className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{group.label}</h3>
          <div className="space-y-1">
            {group.items.map((activity, index) => {
              const isLastInGroup = index === group.items.length - 1;
              if (isRichActivity(activity)) {
                return <RichActivityCard key={activity.id} activity={activity} />;
              }
              return (
                <CompactActivityRow
                  key={activity.id}
                  activity={activity}
                  isLast={isLastInGroup}
                />
              );
            })}
          </div>
        </div>
      ))}

      {hasMore && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            className={FU_BTN_OUTLINE}
            onClick={() => setVisibleCount((c) => c + 5)}
          >
            Load More Activities
          </button>
        </div>
      )}
    </div>
  );
}
