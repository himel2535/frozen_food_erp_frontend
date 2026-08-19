import { io, type Socket } from 'socket.io-client';

type SocketGlobals = {
  __toysFactoryErpSocket?: Socket | null;
  __toysFactoryErpSocketRefCount?: number;
  __toysFactoryErpSocketReleaseTimer?: ReturnType<typeof setTimeout> | null;
  __toysFactoryErpSocketLogsAttached?: boolean;
};

const g = globalThis as typeof globalThis & SocketGlobals;

function cancelPendingRelease() {
  if (!g.__toysFactoryErpSocketReleaseTimer) return;
  clearTimeout(g.__toysFactoryErpSocketReleaseTimer);
  g.__toysFactoryErpSocketReleaseTimer = null;
}

export function getSocketUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SOCKET_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, '');
  const api = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api/v1').replace(/\/$/, '');
  return api.replace(/\/api\/v1$/, '') || 'http://localhost:5000';
}



function attachLifecycleLogs(socket: Socket) {
  if (g.__toysFactoryErpSocketLogsAttached) return;
  g.__toysFactoryErpSocketLogsAttached = true;
  socket.on('connect', () => {
    console.log('[socket] connected', g.__toysFactoryErpSocket?.id);
  });
  socket.on('disconnect', (reason) => {
    console.log('[socket] disconnected', reason);
  });
  socket.io.on('reconnect', (attempt) => {
    console.log('[socket] reconnect', attempt);
  });
  socket.io.on('reconnect_attempt', () => {
    // Reconnect will automatically send the HttpOnly cookie
  });
}

export function acquireSocket(): Socket {
  cancelPendingRelease();

  let instance = g.__toysFactoryErpSocket ?? null;
  if (!instance) {
    instance = io(getSocketUrl(), {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });
    g.__toysFactoryErpSocket = instance;
    g.__toysFactoryErpSocketLogsAttached = false;
    attachLifecycleLogs(instance);
  } else {
    attachLifecycleLogs(instance);
    if (!instance.connected) instance.connect();
  }

  g.__toysFactoryErpSocketRefCount = (g.__toysFactoryErpSocketRefCount ?? 0) + 1;
  return instance;
}

export function releaseSocket() {
  const refCount = Math.max(0, (g.__toysFactoryErpSocketRefCount ?? 0) - 1);
  g.__toysFactoryErpSocketRefCount = refCount;
  const instance = g.__toysFactoryErpSocket ?? null;
  if (refCount > 0 || !instance) return;

  // Delay close so React Strict Mode's immediate unmount/remount does not abort
  // a handshake that is still opening.
  cancelPendingRelease();
  g.__toysFactoryErpSocketReleaseTimer = setTimeout(() => {
    g.__toysFactoryErpSocketReleaseTimer = null;
    if ((g.__toysFactoryErpSocketRefCount ?? 0) > 0) return;
    const current = g.__toysFactoryErpSocket;
    if (!current) return;
    current.disconnect();
    g.__toysFactoryErpSocket = null;
    g.__toysFactoryErpSocketLogsAttached = false;
  }, 250);
}

export function getSharedSocket(): Socket | null {
  return g.__toysFactoryErpSocket ?? null;
}
