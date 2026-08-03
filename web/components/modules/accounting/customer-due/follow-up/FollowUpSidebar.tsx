'use client';

import { ArrowRight, Wallet } from 'lucide-react';
import type { CustomerReceivable } from '@/lib/services/customer-receivables-service';
import { FollowUpNextActionWidget } from './FollowUpNextActionWidget';
import { FollowUpPromiseWidget } from './FollowUpPromiseWidget';
import { FollowUpQuickActions } from './FollowUpQuickActions';
import { FollowUpSummaryWidget } from './FollowUpSummaryWidget';
import { FU_BTN_PRIMARY } from './follow-up-styles';

export function FollowUpSidebar({
  customer,
  onReceivePayment,
  onMarkReceived,
}: {
  customer: CustomerReceivable;
  onReceivePayment: () => void;
  onMarkReceived: () => void;
}) {
  return (
    <aside className="space-y-4">
      <FollowUpSummaryWidget customer={customer} />
      <FollowUpNextActionWidget customer={customer} />
      <FollowUpPromiseWidget customer={customer} onMarkReceived={onMarkReceived} />
      <FollowUpQuickActions />
      <button type="button" className={`${FU_BTN_PRIMARY} w-full justify-center py-3 text-sm`} onClick={onReceivePayment}>
        <Wallet className="w-4 h-4" />
        Receive Payment
        <ArrowRight className="w-4 h-4" />
      </button>
    </aside>
  );
}
