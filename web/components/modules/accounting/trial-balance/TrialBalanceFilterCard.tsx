'use client';

import { Filter, RotateCcw } from 'lucide-react';
import { Button } from '@/components/shared/Button';
import {
  TRIAL_BALANCE_BRANCHES,
  TRIAL_BALANCE_COMPANIES,
  TRIAL_BALANCE_COST_CENTERS,
  TRIAL_BALANCE_CURRENCIES,
  TRIAL_BALANCE_FISCAL_YEARS,
} from './trial-balance-options';
import type { TrialBalanceFilterState } from './trial-balance-types';
import { DateInput } from '@/components/shared/DateInput';

const SELECT_CLS =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 cursor-pointer';
const LABEL_CLS = 'block text-[11px] font-bold text-slate-500 mb-1';

export function TrialBalanceFilterCard({
  draft,
  onDraftChange,
  onApply,
  onReset,
}: {
  draft: TrialBalanceFilterState;
  onDraftChange: (next: TrialBalanceFilterState) => void;
  onApply: () => void;
  onReset: () => void;
}) {
  const set = <K extends keyof TrialBalanceFilterState>(key: K, value: TrialBalanceFilterState[K]) => {
    onDraftChange({ ...draft, [key]: value });
  };

  return (
    <div className="premium-card premium-shadow p-4 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        <div>
          <label className={LABEL_CLS} htmlFor="tb-as-on">As On Date</label>
          <DateInput
            id="tb-as-on"
            value={draft.asOnDate}
            onChange={(v) => set('asOnDate', v)}
            className={SELECT_CLS}
          />
        </div>
        <div>
          <label className={LABEL_CLS} htmlFor="tb-company">Company</label>
          <select id="tb-company" value={draft.company} onChange={(e) => set('company', e.target.value)} className={SELECT_CLS}>
            {TRIAL_BALANCE_COMPANIES.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
        <div>
          <label className={LABEL_CLS} htmlFor="tb-branch">Branch</label>
          <select id="tb-branch" value={draft.branch} onChange={(e) => set('branch', e.target.value)} className={SELECT_CLS}>
            {TRIAL_BALANCE_BRANCHES.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
        <div>
          <label className={LABEL_CLS} htmlFor="tb-fy">Fiscal Year</label>
          <select id="tb-fy" value={draft.fiscalYear} onChange={(e) => set('fiscalYear', e.target.value)} className={SELECT_CLS}>
            {TRIAL_BALANCE_FISCAL_YEARS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
        <div>
          <label className={LABEL_CLS} htmlFor="tb-cc">Cost Center</label>
          <select id="tb-cc" value={draft.costCenter} onChange={(e) => set('costCenter', e.target.value)} className={SELECT_CLS}>
            {TRIAL_BALANCE_COST_CENTERS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
        <div>
          <label className={LABEL_CLS} htmlFor="tb-currency">Currency</label>
          <select id="tb-currency" value={draft.currency} onChange={(e) => set('currency', e.target.value)} className={SELECT_CLS}>
            {TRIAL_BALANCE_CURRENCIES.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1 border-t border-slate-100">
        <div className="flex flex-wrap items-center gap-4">
          <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={draft.showZeroBalance}
              onChange={(e) => set('showZeroBalance', e.target.checked)}
              className="rounded border-slate-300 cursor-pointer"
            />
            Show Zero Balance
          </label>
          <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={draft.showInactiveAccounts}
              onChange={(e) => set('showInactiveAccounts', e.target.checked)}
              className="rounded border-slate-300 cursor-pointer"
            />
            Show Inactive Accounts
          </label>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            onClick={onReset}
            variant="outline"
            size="sm"
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Reset
          </Button>
          <Button
            type="button"
            onClick={onApply}
            variant="primary"
            size="sm"
            leftIcon={<Filter className="w-3.5 h-3.5" />}
          >
            Filter
          </Button>
        </div>
      </div>
    </div>
  );
}
