'use client';

import { useMemo } from 'react';
import { SalesDocumentModule } from '@/components/modules/sales/SalesDocumentModule';
import { getDispatchConfig } from '@/lib/modules/sales-configs';
import { useAppStore } from '@/lib/state/app-store';
import { useLocaleFormat } from '@/hooks/useLocaleFormat';

export function DispatchPage() {
  const t = useAppStore((s) => s.t);
  const { formatMoney, formatCount } = useLocaleFormat();
  const config = useMemo(
    () => getDispatchConfig(t, formatMoney, formatCount),
    [t, formatMoney, formatCount],
  );
  return <SalesDocumentModule config={config} />;
}
