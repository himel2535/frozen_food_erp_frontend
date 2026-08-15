import { create } from 'zustand';
import type { InboxNotification } from '@/lib/services/notification-api';

type NotificationInboxState = {
  items: InboxNotification[];
  replaceAll: (items: InboxNotification[]) => void;
  prepend: (item: InboxNotification) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clear: () => void;
};

export const useNotificationInboxStore = create<NotificationInboxState>((set) => ({
  items: [],
  replaceAll: (items) => set({ items }),
  prepend: (item) =>
    set((state) => {
      if (state.items.some((existing) => existing.id === item.id)) return state;
      return { items: [item, ...state.items] };
    }),
  markRead: (id) =>
    set((state) => ({
      items: state.items.map((item) => (item.id === id ? { ...item, read: true } : item)),
    })),
  markAllRead: () =>
    set((state) => ({
      items: state.items.map((item) => (item.read ? item : { ...item, read: true })),
    })),
  clear: () => set({ items: [] }),
}));
