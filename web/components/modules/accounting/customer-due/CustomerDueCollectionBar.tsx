'use client';

import { ArrowRight, Phone, Calendar, AlertCircle, Briefcase } from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { getTodayCollectionStats } from '@/lib/services/customer-receivables-service';

type TodayCollectionStats = ReturnType<typeof getTodayCollectionStats>;

export function CustomerDueCollectionBar({
  stats,
  onStartCollection,
}: {
  stats: TodayCollectionStats;
  onStartCollection: () => void;
}) {
  const pills = [
    { label: `${stats.followUps} Follow-ups`, icon: Phone, tone: 'sky' },
    { label: `${stats.paymentPromises} Payment Promises`, icon: Calendar, tone: 'violet' },
    { label: `${stats.missedFollowUps} Missed Follow-ups`, icon: AlertCircle, tone: 'rose' },
    { label: `${stats.brokenPromises} Broken Promises`, icon: Briefcase, tone: 'amber' },
  ];

  const pillCls: Record<string, string> = {
    sky: 'bg-white/80 text-sky-700 border-sky-200',
    violet: 'bg-white/80 text-violet-700 border-violet-200',
    rose: 'bg-white/80 text-rose-700 border-rose-200',
    amber: 'bg-white/80 text-amber-700 border-amber-200',
  };

  return (
    <div className="premium-card premium-shadow px-4 py-3 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 bg-sky-50/60 border border-sky-100">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 min-w-0">
        <p className="text-[11px] font-extrabold uppercase tracking-wider text-sky-800 shrink-0">Today&apos;s Collection</p>
        <div className="flex flex-wrap items-center gap-2">
          {pills.map((pill) => (
            <span
              key={pill.label}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold ${pillCls[pill.tone]}`}
            >
              <pill.icon className="w-3.5 h-3.5 shrink-0" />
              {pill.label}
            </span>
          ))}
        </div>
      </div>
      <Button
        type="button"
        onClick={onStartCollection}
        variant="primary"
        rightIcon={<ArrowRight className="w-4 h-4" />}
      >
        Start Today&apos;s Collection
      </Button>
    </div>
  );
}
