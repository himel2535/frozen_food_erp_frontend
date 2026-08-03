'use client';

import { formatDueMoney, type SupplierDetailProfile } from '@/lib/services/suppliers-service';
import { formatDetailDate, SD_CREDIT_BAR } from './supplier-detail-styles';

export function SupplierCreditBar({ profile }: { profile: SupplierDetailProfile }) {
  return (
    <div className={SD_CREDIT_BAR}>
      <span className="font-semibold text-slate-700">
        Next Due: <strong className="text-slate-900">{formatDueMoney(profile.nextDueAmount)}</strong> on {formatDetailDate(profile.nextDueDate)}
      </span>
      <span className="font-semibold text-slate-700">
        Credit Limit: <strong className="text-slate-900">{formatDueMoney(profile.creditLimit)}</strong>
      </span>
      <span className="font-semibold text-slate-700">
        Used Credit: <strong className="text-slate-900">{formatDueMoney(profile.usedCredit)}</strong> ({profile.usedCreditPct}%)
      </span>
      <span className="font-semibold text-slate-700">
        Payment Terms: <strong className="text-slate-900">{profile.supplier.paymentTerms}</strong>
      </span>
    </div>
  );
}
