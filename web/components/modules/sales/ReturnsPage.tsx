'use client';

import { SalesDocumentModule } from '@/components/modules/sales/SalesDocumentModule';
import { RETURNS_CONFIG } from '@/lib/modules/sales-configs';

export function ReturnsPage() {
  return <SalesDocumentModule config={RETURNS_CONFIG} />;
}
