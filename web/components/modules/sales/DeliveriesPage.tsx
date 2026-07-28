'use client';

import { SalesDocumentModule } from '@/components/modules/sales/SalesDocumentModule';
import { DELIVERIES_CONFIG } from '@/lib/modules/sales-configs';

export function DeliveriesPage() {
  return <SalesDocumentModule config={DELIVERIES_CONFIG} />;
}
