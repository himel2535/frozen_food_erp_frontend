'use client';

import { useEffect } from 'react';
import type { Socket } from 'socket.io-client';
import { acquireSocket, getSharedSocket, releaseSocket } from '@/lib/socket/socket-client';

export function useSocket(enabled: boolean, bind?: (socket: Socket) => () => void) {
  useEffect(() => {
    if (!enabled) return undefined;
    acquireSocket();
    return () => {
      releaseSocket();
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !bind) return undefined;
    const socket = getSharedSocket();
    if (!socket) return undefined;

    // Refetch notification history via REST on connect/reconnect — socket events
    // can be missed while disconnected (handled by the bind callback).
    return bind(socket);
  }, [enabled, bind]);
}
