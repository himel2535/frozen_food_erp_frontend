'use client';

import { useCallback, useEffect, type ReactNode } from 'react';
import type { Socket } from 'socket.io-client';
import { useSocket } from '@/hooks/useSocket';
import { useAppStore } from '@/lib/state/app-store';
import { useNotificationInboxStore } from '@/lib/state/notification-inbox-store';
import {
  fetchNotifications,
  type InboxNotification,
} from '@/lib/services/notification-api';

const NOTIFICATION_NEW_EVENT = 'notification:new';

type SocketNotificationPayload = {
  id?: string;
  type?: string;
  message?: string;
  refId?: string;
  createdAt?: string;
};

function toInboxItem(payload: SocketNotificationPayload): InboxNotification | null {
  if (!payload.id || !payload.message) return null;
  return {
    id: payload.id,
    type: payload.type ?? 'info',
    message: payload.message,
    refId: payload.refId,
    createdAt: payload.createdAt ?? new Date().toISOString(),
    read: false,
  };
}

export function SocketProvider({ children }: { children: ReactNode }) {
  const authUser = useAppStore((s) => s.authUser);
  const replaceAll = useNotificationInboxStore((s) => s.replaceAll);
  const prepend = useNotificationInboxStore((s) => s.prepend);
  const clear = useNotificationInboxStore((s) => s.clear);

  useEffect(() => {
    if (!authUser) clear();
  }, [authUser, clear]);

  const bindSocket = useCallback(
    (socket: Socket) => {
      // Refetch REST history on connect/reconnect — socket events can be missed while disconnected.
      const refetchHistory = () => {
        void fetchNotifications()
          .then(replaceAll)
          .catch((err: unknown) => {
            console.error('[socket] notification history fetch failed', err);
          });
      };

      const onNew = (payload: SocketNotificationPayload) => {
        const item = toInboxItem(payload);
        if (item) prepend(item);
      };

      socket.on('connect', refetchHistory);
      socket.on(NOTIFICATION_NEW_EVENT, onNew);
      if (socket.connected) refetchHistory();

      return () => {
        socket.off('connect', refetchHistory);
        socket.off(NOTIFICATION_NEW_EVENT, onNew);
      };
    },
    [replaceAll, prepend],
  );

  useSocket(Boolean(authUser), bindSocket);

  return <>{children}</>;
}
