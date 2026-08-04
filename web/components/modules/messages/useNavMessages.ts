'use client';

import { useMemo } from 'react';
import { useAppStore } from '@/lib/state/app-store';
import { buildNavMessages, type NavMessage } from '@/lib/services/messages-service';

export function useNavMessages() {
  const appState = useAppStore((s) => s.appState);

  return useMemo(() => {
    const messages = buildNavMessages(appState);
    const previewMessages = messages.slice(0, 8);
    const whatsappCount = messages.filter((m) => m.channel === 'whatsapp').length;

    return {
      messages,
      previewMessages,
      totalCount: messages.length,
      whatsappCount,
    };
  }, [appState]);
}

export type { NavMessage };
