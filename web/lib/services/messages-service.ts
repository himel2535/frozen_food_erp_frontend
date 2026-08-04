import type { AppState } from '@/lib/state/types';
import {
  COLLECTION_DEMO_CUSTOMERS,
  getCollectionOverlay,
  type CollectionActivity,
} from '@/lib/state/customer-collection-seed';
import { buildCustomerFollowUpHref } from '@/lib/services/customer-receivables-service';
import { ensureCrmState } from '@/lib/services/crm-service';

export type NavMessageChannel = 'whatsapp' | 'email' | 'call' | 'internal';

export type NavMessage = {
  id: string;
  channel: NavMessageChannel;
  senderName: string;
  subject: string;
  preview: string;
  timestamp: string;
  sortKey: number;
  href: string;
  entityLabel?: string;
  defaultUnread?: boolean;
};

const MESSAGE_ACTIVITY_PATTERN = /whatsapp|email|call|phone|message/i;

function mapValues<T extends Record<string, unknown>>(map: Record<string, T> | undefined): T[] {
  return Object.values(map ?? {});
}

function parseSortKey(timestamp: string): number {
  const ms = Date.parse(timestamp);
  return Number.isNaN(ms) ? 0 : ms;
}

function inferChannel(activityType: string): NavMessageChannel | null {
  const type = activityType.toLowerCase();
  if (/whatsapp|message/.test(type)) return 'whatsapp';
  if (/email/.test(type)) return 'email';
  if (/call|phone/.test(type)) return 'call';
  return null;
}

function resolveEntityLabel(
  state: AppState,
  entityType: string | undefined,
  entityId: string | undefined,
): string | undefined {
  ensureCrmState(state);
  const crmData = state.crmData as {
    leadsById?: Record<string, { company?: string; name?: string }>;
    customersById?: Record<string, { company?: string; name?: string }>;
  };
  if (!entityType || !entityId) return undefined;
  if (entityType === 'lead') {
    const lead = crmData.leadsById?.[entityId];
    return lead?.company || lead?.name;
  }
  if (entityType === 'customer') {
    const customer = crmData.customersById?.[entityId];
    return customer?.company || customer?.name;
  }
  return undefined;
}

function resolveCrmActivityHref(
  state: AppState,
  entityType: string | undefined,
  entityId: string | undefined,
  entityLabel: string | undefined,
): string {
  if (entityType === 'customer' && entityId) {
    return buildCustomerFollowUpHref(state, entityId, entityLabel ?? '');
  }
  if (entityType === 'lead') return '/crm/leads';
  return '/crm/activities';
}

function buildCrmMessages(state: AppState): NavMessage[] {
  ensureCrmState(state);
  const crmData = state.crmData as {
    activitiesById?: Record<
      string,
      {
        id: string;
        entityType?: string;
        entityId?: string;
        activityType?: string;
        summary?: string;
        note?: string;
        actorName?: string;
        completedAt?: string;
        createdAt?: string;
      }
    >;
  };

  const messages: NavMessage[] = [];

  mapValues(crmData.activitiesById).forEach((activity) => {
    const activityType = String(activity.activityType ?? '');
    if (!MESSAGE_ACTIVITY_PATTERN.test(activityType)) return;

    const channel = inferChannel(activityType);
    if (!channel) return;

    const entityLabel = resolveEntityLabel(state, activity.entityType, activity.entityId);
    const timestamp = String(activity.completedAt ?? activity.createdAt ?? new Date().toISOString());
    const senderName = String(activity.actorName ?? 'Sales Team');
    const subject = String(activity.summary ?? activityType);
    const preview = String(activity.note ?? activity.summary ?? '');

    messages.push({
      id: `crm-${activity.id}`,
      channel,
      senderName,
      subject,
      preview,
      timestamp,
      sortKey: parseSortKey(timestamp),
      href: resolveCrmActivityHref(state, activity.entityType, activity.entityId, entityLabel),
      entityLabel,
      defaultUnread: channel === 'whatsapp',
    });
  });

  return messages;
}

function collectWhatsAppActivities(activities: CollectionActivity[] | undefined): CollectionActivity[] {
  return (activities ?? []).filter((a) => a.type === 'whatsapp');
}

function buildCollectionMessages(state: AppState): NavMessage[] {
  const messages: NavMessage[] = [];
  const seen = new Set<string>();

  COLLECTION_DEMO_CUSTOMERS.forEach((customer) => {
    const company = String(customer.company ?? '');
    const overlay = getCollectionOverlay(company);
    if (!overlay) return;

    const whatsappActivities = [
      ...collectWhatsAppActivities(overlay.recentActivity),
      ...collectWhatsAppActivities(overlay.followUpTimeline),
    ];

    whatsappActivities.forEach((activity) => {
      if (seen.has(activity.id)) return;
      seen.add(activity.id);

      const timestamp = activity.at;
      messages.push({
        id: `col-${activity.id}`,
        channel: 'whatsapp',
        senderName: activity.by || 'Collections Team',
        subject: activity.title ?? 'WhatsApp Reminder Sent',
        preview: activity.text,
        timestamp,
        sortKey: parseSortKey(timestamp),
        href: buildCustomerFollowUpHref(state, String(customer.id), company),
        entityLabel: company,
        defaultUnread: true,
      });
    });
  });

  return messages;
}

function buildInternalTeamMessages(): NavMessage[] {
  const now = Date.now();
  const hoursAgo = (h: number) => new Date(now - h * 60 * 60 * 1000).toISOString();

  return [
    {
      id: 'team-001',
      channel: 'internal',
      senderName: 'Production Manager',
      subject: 'Shift handover note',
      preview: 'Batch #4420 delayed — resin mix needs QC sign-off before noon run.',
      timestamp: hoursAgo(1),
      sortKey: parseSortKey(hoursAgo(1)),
      href: '/messages',
      entityLabel: 'Factory Floor',
      defaultUnread: true,
    },
    {
      id: 'team-002',
      channel: 'internal',
      senderName: 'Sales Coordinator',
      subject: 'Urgent: pricing approval',
      preview: 'Rainbow Stationery asked for revised MOQ pricing on puzzle sets.',
      timestamp: hoursAgo(3),
      sortKey: parseSortKey(hoursAgo(3)),
      href: '/messages',
      entityLabel: 'Sales Desk',
      defaultUnread: true,
    },
    {
      id: 'team-003',
      channel: 'internal',
      senderName: 'Store Manager',
      subject: 'Dispatch update',
      preview: 'Carton shortage on plush line — partial shipment going out at 4 PM.',
      timestamp: hoursAgo(6),
      sortKey: parseSortKey(hoursAgo(6)),
      href: '/messages',
      entityLabel: 'Warehouse',
      defaultUnread: false,
    },
    {
      id: 'team-004',
      channel: 'internal',
      senderName: 'Accounts Team',
      subject: 'Collection briefing',
      preview: 'Three customers promised payment today — follow-up list shared.',
      timestamp: hoursAgo(20),
      sortKey: parseSortKey(hoursAgo(20)),
      href: '/messages',
      entityLabel: 'Finance',
      defaultUnread: false,
    },
  ];
}

export function buildNavMessages(state: AppState): NavMessage[] {
  const combined = [
    ...buildCrmMessages(state),
    ...buildCollectionMessages(state),
    ...buildInternalTeamMessages(),
  ];

  const byId = new Map<string, NavMessage>();
  combined.forEach((message) => {
    if (!byId.has(message.id)) byId.set(message.id, message);
  });

  return [...byId.values()].sort((a, b) => b.sortKey - a.sortKey);
}

export function countUnreadMessages(messages: NavMessage[], readIds: Set<string>): number {
  return messages.filter((m) => m.defaultUnread && !readIds.has(m.id)).length;
}

export function filterMessagesByChannel(
  messages: NavMessage[],
  channel: NavMessageChannel | 'all',
): NavMessage[] {
  if (channel === 'all') return messages;
  return messages.filter((m) => m.channel === channel);
}
