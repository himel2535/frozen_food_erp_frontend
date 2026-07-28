'use client';

import { SalesDocumentModule } from '@/components/modules/sales/SalesDocumentModule';
import { ORDERS_CONFIG } from '@/lib/modules/sales-configs';

export function OrdersPage() {
  return <SalesDocumentModule config={ORDERS_CONFIG} />;
}
