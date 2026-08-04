'use client';

import { useMemo } from 'react';
import { SalesDocumentModule } from '@/components/modules/sales/SalesDocumentModule';
import { getQuotationsConfig } from '@/lib/modules/sales-configs';
import { useAppStore } from '@/lib/state/app-store';
import { useLocaleFormat } from '@/hooks/useLocaleFormat';

export function QuotationsPage() {
  const t = useAppStore((s) => s.t);
  const { formatMoney, formatCount } = useLocaleFormat();
  const config = useMemo(
    () => getQuotationsConfig(t, formatMoney, formatCount),
    [t, formatMoney, formatCount],
  );
  return <SalesDocumentModule config={config} />;
}
