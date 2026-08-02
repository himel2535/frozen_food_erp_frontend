'use client';

import { useEffect, useState } from 'react';
import type { DedicatedModuleConfig } from '@/components/modules/shared/DedicatedModule';
import { loadLegacyParityConfig } from '@/lib/modules/legacy-parity-configs';
import { PORT_CONFIGS } from '@/lib/modules/port-configs';

export function useLegacyParityConfig(id: string | null | undefined) {
  const [config, setConfig] = useState<DedicatedModuleConfig | null>(() => {
    if (!id) return null;
    return (PORT_CONFIGS[id] as DedicatedModuleConfig | undefined) ?? null;
  });

  useEffect(() => {
    if (!id) {
      setConfig(null);
      return;
    }
    let cancelled = false;
    void loadLegacyParityConfig(id).then((loaded) => {
      if (!cancelled) setConfig(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return config;
}
