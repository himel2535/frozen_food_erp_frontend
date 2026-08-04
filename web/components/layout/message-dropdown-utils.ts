import type { NavMessage, NavMessageChannel } from '@/lib/services/messages-service';

export type MessageTab = 'all' | 'unread' | 'whatsapp';

export type MessageVisual = {
  icon: string;
  iconBg: string;
};

const CHANNEL_VISUAL: Record<NavMessageChannel, MessageVisual> = {
  whatsapp: { icon: 'fluent-color:chat-24', iconBg: 'bg-emerald-100' },
  email: { icon: 'fluent-color:mail-24', iconBg: 'bg-blue-100' },
  call: { icon: 'fluent-color:phone-24', iconBg: 'bg-sky-100' },
  internal: { icon: 'fluent-color:comment-multiple-24', iconBg: 'bg-amber-100' },
};

const RELATIVE_TIME_LABELS = [
  '2 hours ago',
  '5 hours ago',
  'yesterday',
  'yesterday',
  '2 days ago',
  '3 days ago',
  '4 days ago',
  '1 week ago',
];

export function getMessageVisual(message: NavMessage): MessageVisual {
  return CHANNEL_VISUAL[message.channel] ?? CHANNEL_VISUAL.internal;
}

export function getMessageHeadline(message: NavMessage): { bold: string; rest: string } {
  if (message.entityLabel) {
    return {
      bold: message.senderName,
      rest: ` — ${message.entityLabel}`,
    };
  }
  return { bold: message.senderName, rest: '' };
}

export function getMessageSubtext(message: NavMessage): string {
  const subject = message.subject.trim();
  const preview = message.preview.trim();
  if (subject && preview && subject !== preview) {
    return `${subject}: ${preview}`;
  }
  return preview || subject || 'No preview available';
}

export function getMessageRelativeTime(index: number): string {
  return RELATIVE_TIME_LABELS[index] ?? 'recently';
}

export function isDefaultUnreadMessage(message: NavMessage): boolean {
  return Boolean(message.defaultUnread);
}

export function filterMessagesByTab(
  messages: NavMessage[],
  tab: MessageTab,
  readIds: Set<string>,
): NavMessage[] {
  const list = messages.slice(0, 8);
  if (tab === 'unread') {
    return list.filter((m) => isDefaultUnreadMessage(m) && !readIds.has(m.id));
  }
  if (tab === 'whatsapp') {
    return list.filter((m) => m.channel === 'whatsapp');
  }
  return list;
}

export function countUnreadMessages(messages: NavMessage[], readIds: Set<string>): number {
  return messages.filter((m) => isDefaultUnreadMessage(m) && !readIds.has(m.id)).length;
}
