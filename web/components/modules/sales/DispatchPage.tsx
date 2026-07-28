'use client';

import { SalesDocumentModule } from '@/components/modules/sales/SalesDocumentModule';
import { DISPATCH_CONFIG } from '@/lib/modules/sales-configs';

export function DispatchPage() {
  return <SalesDocumentModule config={DISPATCH_CONFIG} />;
}
