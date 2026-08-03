'use client';

import { Wallet, Calendar, Banknote, AlertCircle } from 'lucide-react';
import {
  formatDueMoney,
  type CustomerReceivableMetrics,
} from '@/lib/services/customer-receivables-service';
import { KPI_ICON_WRAPPER } from './customer-due-styles';

export function CustomerDueMetrics({
  metrics,
  onViewPromises,
}: {
  metrics: CustomerReceivableMetrics;
  onViewPromises?: () => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2">
      <div className="premium-card premium-shadow p-4">
        <div className="flex items-start gap-3">
          <span className={`${KPI_ICON_WRAPPER} bg-blue-100 text-blue-600`}>
            <Wallet className="w-5 h-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Total Receivable</p>
            <p className="mt-0.5 text-2xl font-extrabold text-slate-900">{formatDueMoney(metrics.totalReceivable)}</p>
            <p className="mt-1 text-xs text-slate-500">From {metrics.customerCount} customer{metrics.customerCount === 1 ? '' : 's'}</p>
            <p className="mt-1 text-xs font-semibold text-rose-600">{formatDueMoney(metrics.overdueAmount)} overdue</p>
          </div>
        </div>
      </div>

      <div className="premium-card premium-shadow p-4">
        <div className="flex items-start gap-3">
          <span className={`${KPI_ICON_WRAPPER} bg-amber-100 text-amber-600`}>
            <Calendar className="w-5 h-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Expected Today</p>
            <p className="mt-0.5 text-2xl font-extrabold text-slate-900">{formatDueMoney(metrics.expectedToday)}</p>
            <p className="mt-1 text-xs text-slate-500">From {metrics.promiseCount} payment promise{metrics.promiseCount === 1 ? '' : 's'}</p>
            {onViewPromises && (
              <button
                type="button"
                onClick={onViewPromises}
                className="mt-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
              >
                View promises →
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="premium-card premium-shadow p-4">
        <div className="flex items-start gap-3">
          <span className={`${KPI_ICON_WRAPPER} bg-emerald-100 text-emerald-600`}>
            <Banknote className="w-5 h-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Collected Today</p>
            <p className="mt-0.5 text-2xl font-extrabold text-emerald-600">{formatDueMoney(metrics.collectedToday)}</p>
            <p className="mt-1 text-xs text-slate-500">From {metrics.collectedTodayCount} payment{metrics.collectedTodayCount === 1 ? '' : 's'}</p>
            <div className="mt-2">
              <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 mb-1">
                <span>{metrics.collectedTodayPct}% of expected</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${Math.min(100, metrics.collectedTodayPct)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="premium-card premium-shadow p-4">
        <div className="flex items-start gap-3">
          <span className={`${KPI_ICON_WRAPPER} bg-rose-100 text-rose-600`}>
            <AlertCircle className="w-5 h-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Attention Needed</p>
            <p className="mt-0.5 text-2xl font-extrabold text-slate-900">{metrics.attentionCustomers} Customers</p>
            <ul className="mt-2 space-y-1">
              <li className="text-xs font-medium text-rose-600">{metrics.missedFollowUps} missed follow-ups</li>
              <li className="text-xs font-medium text-amber-600">{metrics.brokenPromises} broken promises</li>
              <li className="text-xs font-medium text-amber-600">{metrics.criticalOverdue} critical overdue</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
