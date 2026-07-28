'use client';

import { SalesDocumentModule } from '@/components/modules/sales/SalesDocumentModule';
import { INVOICES_CONFIG } from '@/lib/modules/sales-configs';

export function InvoicesPage() {
  return <SalesDocumentModule config={INVOICES_CONFIG} />;
}
