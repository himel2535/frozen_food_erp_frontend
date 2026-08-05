'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { Check, Lock } from 'lucide-react';
import { formatMoney } from '@/lib/services/salary-sheet-service';
import {
  RP_APPROVE_BTN_CLS,
  RP_CARD_CLS,
  RP_EMPTY_HISTORY_CLS,
  RP_INPUT_CLS,
  RP_LINE_ROW_CLS,
  RP_PILL_TOGGLE_ACTIVE_CLS,
  RP_PILL_TOGGLE_IDLE_CLS,
  RP_SECTION_TITLE_CLS,
  RP_STAT_LABEL_CLS,
  RP_STAT_TILE_CLS,
  RP_STAT_VALUE_CLS,
} from '@/components/modules/payroll/salary-sheet/review/review-pay-styles';
import { DateInput } from '@/components/shared/DateInput';

function StatTile({
  label,
  value,
  icon,
  alert,
}: {
  label: string;
  value: string;
  icon: string;
  alert?: boolean;
}) {
  return (
    <div className={`${RP_STAT_TILE_CLS}${alert ? ' border-rose-100 bg-rose-50/50' : ''}`}>
      <Icon icon={icon} width={28} height={28} className="absolute top-2.5 right-2.5 opacity-90" />
      <span className={RP_STAT_LABEL_CLS}>{label}</span>
      <p className={`${RP_STAT_VALUE_CLS}${alert ? ' text-rose-600' : ''}`}>{value}</p>
    </div>
  );
}

export function SalaryPaymentFormCard({
  netPayable,
  dueAmount,
  locked,
  onApprove,
}: {
  netPayable: number;
  dueAmount: number;
  locked: boolean;
  onApprove: (payment: { amount: number; method: string; date: string; note: string }) => void;
}) {
  const [paymentType, setPaymentType] = useState<'full' | 'partial'>('full');
  const [amountMode, setAmountMode] = useState<'full' | 'custom'>('full');
  const [payAmount, setPayAmount] = useState(String(dueAmount || netPayable));
  const [method, setMethod] = useState('Cash');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');

  const effectiveDue = dueAmount || netPayable;

  const handleAmountMode = (mode: 'full' | 'custom') => {
    setAmountMode(mode);
    if (mode === 'full') {
      setPaymentType('full');
      setPayAmount(String(effectiveDue));
    } else {
      setPaymentType('partial');
    }
  };

  const amountNum = paymentType === 'full' && amountMode === 'full'
    ? effectiveDue
    : Math.min(Math.max(0, Number(payAmount) || 0), effectiveDue);

  return (
    <section className={RP_CARD_CLS}>
      <h3 className={RP_SECTION_TITLE_CLS}>Payment Information</h3>
      <div className="space-y-4">
        <div>
          <p className="text-xs font-bold text-slate-500 mb-2">Payment Type</p>
          <div className="flex gap-4 text-sm">
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                checked={paymentType === 'full'}
                onChange={() => { setPaymentType('full'); setAmountMode('full'); setPayAmount(String(effectiveDue)); }}
                disabled={locked}
                className="cursor-pointer"
              />
              Full Payment
            </label>
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                checked={paymentType === 'partial'}
                onChange={() => { setPaymentType('partial'); setAmountMode('custom'); }}
                disabled={locked}
                className="cursor-pointer"
              />
              Partial Payment
            </label>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-500">Pay Amount</label>
          <div className="flex gap-2 mt-1.5">
            <input
              className={`${RP_INPUT_CLS} flex-1${locked ? ' bg-slate-50' : ''}`}
              value={paymentType === 'full' && amountMode === 'full' ? String(effectiveDue) : payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              readOnly={locked || (paymentType === 'full' && amountMode === 'full')}
            />
            <button
              type="button"
              className={amountMode === 'full' ? RP_PILL_TOGGLE_ACTIVE_CLS : RP_PILL_TOGGLE_IDLE_CLS}
              onClick={() => handleAmountMode('full')}
              disabled={locked}
            >
              Full Amount
            </button>
            <button
              type="button"
              className={amountMode === 'custom' ? RP_PILL_TOGGLE_ACTIVE_CLS : RP_PILL_TOGGLE_IDLE_CLS}
              onClick={() => handleAmountMode('custom')}
              disabled={locked}
            >
              Custom
            </button>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-500">Payment Method</label>
          <div className="relative mt-1.5">
            <Icon
              icon="flat-color-icons:paid"
              width={18}
              height={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            />
            <select
              className={`${RP_INPUT_CLS} w-full pl-9 cursor-pointer`}
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              disabled={locked}
            >
              <option>Cash</option>
              <option>Bank Transfer</option>
              <option>Mobile Banking</option>
              <option>Cheque</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-500">Payment Date</label>
          <DateInput
            className={`${RP_INPUT_CLS} w-full mt-1.5`}
            value={date}
            onChange={setDate}
            disabled={locked}
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-500">Reference / Note</label>
          <textarea
            className={`${RP_INPUT_CLS} w-full mt-1.5 min-h-[80px] resize-y`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={locked}
            placeholder="Optional payment reference or note..."
          />
        </div>

        {!locked ? (
          <button
            type="button"
            className={RP_APPROVE_BTN_CLS}
            onClick={() => onApprove({ amount: amountNum, method, date, note })}
          >
            <Check className="w-4 h-4" />
            Approve &amp; Pay {formatMoney(amountNum)}
          </button>
        ) : (
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs font-medium text-slate-600 flex items-center gap-2">
            <Lock className="w-4 h-4 shrink-0" /> Salary locked after approval.
          </div>
        )}
      </div>
    </section>
  );
}

export function SalaryPaymentSummaryCard({
  netPayable,
  payAmount,
  dueAmount,
  locked,
  payments,
}: {
  netPayable: number;
  payAmount: number;
  dueAmount: number;
  locked: boolean;
  payments: Array<Record<string, unknown>>;
}) {
  return (
    <section className={RP_CARD_CLS}>
      <h3 className={RP_SECTION_TITLE_CLS}>Payment Summary (After Payment)</h3>
      <div className="space-y-2">
        <div className={RP_LINE_ROW_CLS}>
          <span className="text-slate-600">Payable Amount</span>
          <span className="font-bold text-slate-900">{formatMoney(netPayable)}</span>
        </div>
        <div className={`${RP_LINE_ROW_CLS} rounded-lg bg-blue-50/80 border border-blue-100 px-3 py-2`}>
          <span className="font-semibold text-blue-800">Pay Amount</span>
          <span className="font-extrabold text-blue-900">{formatMoney(payAmount)}</span>
        </div>
        <div className={`${RP_LINE_ROW_CLS} rounded-lg px-3 py-2 border ${dueAmount > 0 ? 'bg-rose-50/80 border-rose-100' : 'bg-emerald-50/80 border-emerald-100'}`}>
          <span className={`font-semibold ${dueAmount > 0 ? 'text-rose-800' : 'text-emerald-800'}`}>Due Amount</span>
          <span className={`font-extrabold ${dueAmount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{formatMoney(dueAmount)}</span>
        </div>
      </div>

      {!locked ? (
        <p className="text-xs font-medium text-emerald-700 mt-4 rounded-xl bg-emerald-50 border border-emerald-100 p-3 flex items-start gap-2">
          <Check className="w-4 h-4 shrink-0 mt-0.5" />
          This salary will be marked as Paid after approval.
        </p>
      ) : (
        <p className="text-xs font-medium text-emerald-700 mt-4 rounded-xl bg-emerald-50 border border-emerald-100 p-3 flex items-start gap-2">
          <Check className="w-4 h-4 shrink-0 mt-0.5" />
          Payment recorded successfully.
        </p>
      )}

      <div className="mt-5 pt-4 border-t border-slate-100">
        <h4 className="text-xs font-extrabold text-slate-700 mb-3">Payment History</h4>
        {payments.length ? (
          <ul className="space-y-2 text-xs">
            {payments.map((p) => (
              <li key={String(p.id)} className="flex justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 border border-slate-100">
                <span className="text-slate-600">{String(p.date)} · {String(p.method)}</span>
                <span className="font-bold text-slate-900">{formatMoney(Number(p.amount ?? 0))}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className={RP_EMPTY_HISTORY_CLS}>
            <Icon icon="flat-color-icons:empty-trash" width={48} height={48} className="opacity-70 mb-2" />
            <p className="text-xs font-semibold text-slate-500">No payment has been made yet.</p>
          </div>
        )}
      </div>
    </section>
  );
}

export function EmployeeReviewSummary({
  entry,
  computed,
}: {
  entry: Record<string, unknown>;
  computed: import('@/lib/services/salary-sheet-service').ComputedSheetRow;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      <section className={RP_CARD_CLS}>
        <h3 className={RP_SECTION_TITLE_CLS}>Employee Summary (This Month)</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <StatTile label="Present Days" value={String(entry.presentDays ?? 0)} icon="flat-color-icons:ok" />
          <StatTile label="Absent Days" value={String(entry.absentDays ?? 0)} icon="flat-color-icons:cancel" />
          <StatTile label="Leave Days" value={String(entry.leaveDays ?? 0)} icon="flat-color-icons:leave" />
          <StatTile label="Late Days" value={String(entry.lateDays ?? 0)} icon="flat-color-icons:clock" />
          <StatTile label="Overtime Hours" value={String(entry.otHours ?? 0)} icon="flat-color-icons:rules" />
          <StatTile label="Advance Taken" value={formatMoney(Number(entry.advanceBalance ?? 0))} icon="flat-color-icons:paid" />
        </div>
      </section>

      <section className={RP_CARD_CLS}>
        <h3 className={RP_SECTION_TITLE_CLS}>Others</h3>
        <div className="grid grid-cols-2 gap-2">
          <StatTile label="Last Month Due" value={formatMoney(0)} icon="flat-color-icons:document" />
          <StatTile label="Total Previous Due" value={formatMoney(0)} icon="flat-color-icons:debt" />
          <StatTile label="Total Paid (This Month)" value={formatMoney(Number(entry.paidAmount ?? 0))} icon="flat-color-icons:currency-exchange" />
          <StatTile label="Remaining Due" value={formatMoney(computed.dueAmount)} icon="flat-color-icons:alarm-clock" alert={computed.dueAmount > 0} />
        </div>
      </section>
    </div>
  );
}
