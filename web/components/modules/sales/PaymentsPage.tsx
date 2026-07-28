'use client';

import { SalesDocumentModule } from '@/components/modules/sales/SalesDocumentModule';
import { PAYMENTS_CONFIG } from '@/lib/modules/sales-configs';

export function PaymentsPage() {
  return <SalesDocumentModule config={PAYMENTS_CONFIG} />;
}
