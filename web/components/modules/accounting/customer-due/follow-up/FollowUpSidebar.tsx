'use client';

import { ArrowRight, Wallet } from 'lucide-react';
import type { CustomerReceivable } from '@/lib/services/customer-receivables-service';
import { FollowUpNextActionWidget } from './FollowUpNextActionWidget';
import { FollowUpPromiseWidget } from './FollowUpPromiseWidget';
import { FollowUpQuickActions } from './FollowUpQuickActions';
import { FollowUpSummaryWidget } from './FollowUpSummaryWidget';
import { Button } from '@/components/shared/Button';

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
      <Button
        type="button"
        variant="primary"
        size="md"
        className="!w-full !justify-center"
        leftIcon={<Wallet className="w-4 h-4" />}
        rightIcon={<ArrowRight className="w-4 h-4" />}
        onClick={onReceivePayment}
      >
        Receive Payment
      </Button>
    </aside>
  );
}
