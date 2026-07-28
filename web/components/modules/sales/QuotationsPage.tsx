'use client';

import { SalesDocumentModule } from '@/components/modules/sales/SalesDocumentModule';
import { QUOTATIONS_CONFIG } from '@/lib/modules/sales-configs';

export function QuotationsPage() {
  return <SalesDocumentModule config={QUOTATIONS_CONFIG} />;
}
