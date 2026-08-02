'use client';

import { Calendar, Package, Users } from 'lucide-react';
import {
  PRIORITY_BADGE_CLS,
  type ProjectFormValues,
} from '@/components/modules/projects/project-form/project-form-types';
import { computeProjectTotals, formatProjectMoney } from '@/lib/services/projects-service';

export function ProjectSummaryCard({ form }: { form: ProjectFormValues }) {
  const totals = computeProjectTotals(form.items);
  const customerLabel = form.customerName.trim() || '—';
  const deliveryLabel = form.expectedDeliveryDate
    ? new Date(`${form.expectedDeliveryDate}T00:00:00`).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '—';

  return (
    <section className="premium-card premium-shadow p-3.5 space-y-3">
      <h4 className="text-sm font-extrabold text-slate-900">Project Summary</h4>
      <dl className="space-y-2.5 text-xs">
        <div className="flex items-start gap-2">
          <Users className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Customer</dt>
            <dd className="font-semibold text-slate-800">{customerLabel}</dd>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Package className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Products</dt>
            <dd className="font-semibold text-slate-800">
              {totals.productCount} item{totals.productCount === 1 ? '' : 's'} · {totals.totalQty.toLocaleString()} pcs
            </dd>
          </div>
        </div>
        <div className="rounded-xl bg-blue-50/80 border border-blue-100 px-3 py-2">
          <dt className="text-[10px] font-bold uppercase tracking-wide text-blue-600">Total Order Value</dt>
          <dd className="text-lg font-extrabold text-blue-700 mt-0.5">{formatProjectMoney(totals.totalValue)}</dd>
        </div>
        <div className="flex items-start gap-2">
          <Calendar className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Expected Delivery</dt>
            <dd className="font-semibold text-slate-800">{deliveryLabel}</dd>
          </div>
        </div>
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">Priority</dt>
          <dd>
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-[11px] font-bold ${
                PRIORITY_BADGE_CLS[form.priority] ?? 'bg-slate-50 text-slate-600 border-slate-100'
              }`}
            >
              {form.priority || '—'}
            </span>
          </dd>
        </div>
      </dl>
    </section>
  );
}
