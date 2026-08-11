import type { AppState } from '@/lib/state/types';
import { ensureCrmState, getDealList, getOwnerOptions } from '@/lib/services/crm-service';

export const DEAL_KANBAN_STAGES = [
  'new-opportunity',
  'discovery',
  'proposal-sent',
  'negotiation',
  'won',
  'lost',
] as const;

export type DealKanbanStage = (typeof DEAL_KANBAN_STAGES)[number];

export type DealRecord = Record<string, unknown> & {
  id: string;
  title: string;
  company: string;
  stage: string;
  status: string;
  expectedValue: number;
  probability: number;
  expectedCloseDate: string;
  assignedRepName?: string;
  leadSource?: string;
  priority?: string;
};

export type DealPipelineMetrics = {
  totalDeals: number;
  thisMonth: number;
  openDeals: number;
  openValue: number;
  wonDeals: number;
  wonValue: number;
  lostDeals: number;
  lostValue: number;
  conversionRate: number;
  conversionDelta: number;
  pipelineValue: number;
};

export type DealStageSlice = {
  key: string;
  label: string;
  count: number;
  value: number;
  pct: number;
  color: string;
};

export type DealSourceSlice = {
  key: string;
  label: string;
  count: number;
  pct: number;
};

export type DealFollowUpItem = {
  id: string;
  dealTitle: string;
  company: string;
  date: string;
  time: string;
  tone: 'violet' | 'amber' | 'blue';
};

export type DealPerformerItem = {
  id: string;
  name: string;
  value: number;
  rank: number;
};

const SEED_FLAG = '__dealsPipelineDemoSeeded';

const STAGE_LABELS: Record<string, string> = {
  'new-opportunity': 'New Opportunity',
  discovery: 'Discovery',
  'proposal-sent': 'Proposal Sent',
  negotiation: 'Negotiation',
  won: 'Won',
  lost: 'Lost',
};

const STAGE_COLORS: Record<string, string> = {
  'new-opportunity': '#3b82f6',
  discovery: '#10b981',
  'proposal-sent': '#8b5cf6',
  negotiation: '#f59e0b',
  won: '#059669',
  lost: '#ef4444',
};

const DEAL_TITLES = [
  { title: 'Kids Corner onboarding', company: 'Kids Corner', value: 7800, priority: 'high' },
  { title: 'Summer promo toys', company: 'Star Kids Store', value: 4200, priority: 'medium' },
  { title: 'Wholesale puzzle supply', company: 'Happy Land Retail', value: 9600, priority: 'high' },
  { title: 'School contract renewal', company: 'Toy World BD', value: 5400, priority: 'medium' },
  { title: 'Premium plush line', company: 'Kids Paradise', value: 11200, priority: 'high' },
  { title: 'Remote car bulk order', company: 'Play Zone', value: 6800, priority: 'low' },
  { title: 'Action figure launch', company: 'Mini Mart Toys', value: 8900, priority: 'medium' },
  { title: 'Board games bundle', company: 'Fun Factory Outlet', value: 3100, priority: 'low' },
  { title: 'Festival stock prep', company: 'Dream Toys Hub', value: 14500, priority: 'high' },
  { title: 'Retail display units', company: 'Little Stars Shop', value: 2700, priority: 'low' },
];

const SOURCES = ['Website', 'Referral', 'Phone', 'Walk-in', 'Other'];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

/** Won/lost can live on stage or status — API drag often updates stage only. */
export function resolveDealOutcome(deal: Pick<DealRecord, 'stage' | 'status'>): 'won' | 'lost' | 'open' {
  const stage = String(deal.stage ?? '').trim().toLowerCase();
  const status = String(deal.status ?? '').trim().toLowerCase();
  if (status === 'won' || stage === 'won') return 'won';
  if (status === 'lost' || stage === 'lost') return 'lost';
  return 'open';
}

export function inferDealStatusForStage(stage: string): 'won' | 'lost' | 'open' {
  const normalized = String(stage ?? '').trim().toLowerCase();
  if (normalized === 'won') return 'won';
  if (normalized === 'lost') return 'lost';
  return 'open';
}

function inferPriority(probability: number, value: number) {
  if (probability >= 70 || value >= 10000) return 'high';
  if (probability >= 40) return 'medium';
  return 'low';
}

export function ensureDealPipelineSeedData(state: AppState) {
  ensureCrmState(state);
  const crmData = state.crmData as Record<string, unknown> & {
    dealsById: Record<string, Record<string, unknown>>;
    dealFollowUpsById: Record<string, Record<string, unknown>>;
  };
  if (crmData[SEED_FLAG]) return;

  const owners = getOwnerOptions(state);
  const stages: DealKanbanStage[] = ['new-opportunity', 'discovery', 'proposal-sent', 'negotiation', 'won', 'lost'];
  const stageCounts = [2, 3, 4, 3, 6, 4];
  let seq = 100;

  stages.forEach((stage, stageIdx) => {
    for (let i = 0; i < stageCounts[stageIdx]; i += 1) {
      seq += 1;
      const id = `DEAL-${String(seq).padStart(4, '0')}`;
      if (crmData.dealsById[id]) continue;

      const seed = DEAL_TITLES[(stageIdx + i) % DEAL_TITLES.length];
      const owner = owners[(stageIdx + i) % owners.length] ?? owners[0];
      const probability = stage === 'won' ? 100 : stage === 'lost' ? 0 : 35 + ((stageIdx + i) * 11) % 55;
      const close = new Date();
      close.setDate(close.getDate() + (stageIdx * 3) + i);
      const created = new Date();
      created.setDate(created.getDate() - (28 - seq % 20));

      crmData.dealsById[id] = {
        id,
        title: seed.title,
        company: seed.company,
        contactPerson: 'Contact Person',
        phone: '01711002200',
        stage,
        status: stage === 'won' ? 'won' : stage === 'lost' ? 'lost' : 'open',
        expectedValue: seed.value + (i * 120),
        probability,
        priority: seed.priority,
        expectedCloseDate: close.toISOString().slice(0, 10),
        closeDate: close.toISOString().slice(0, 10),
        leadSource: SOURCES[(stageIdx + i) % SOURCES.length],
        assignedRepId: owner?.id ?? '',
        assignedRepName: owner?.name ?? 'Sales Rep',
        productsSummary: 'Assorted toys',
        createdAt: created.toISOString(),
        updatedAt: new Date().toISOString(),
        lastActivityAt: new Date().toISOString(),
      };

      if (stage !== 'won' && stage !== 'lost' && i === 0) {
        const followId = `DFUP-${String(seq).padStart(4, '0')}`;
        crmData.dealFollowUpsById[followId] = {
          id: followId,
          dealId: id,
          followUpDate: close.toISOString().slice(0, 10),
          followUpType: 'Call',
          assignedUserName: owner?.name ?? 'Sales Rep',
          notes: `Follow up on ${seed.title}`,
          status: 'open',
          createdAt: new Date().toISOString(),
        };
      }
    }
  });

  crmData[SEED_FLAG] = true;
}

export function getEnrichedDealList(state: AppState): DealRecord[] {
  ensureDealPipelineSeedData(state);
  return getDealList(state).map((deal) => ({
    ...deal,
    priority: String(deal.priority ?? inferPriority(Number(deal.probability ?? 0), Number(deal.expectedValue ?? 0))),
  })) as DealRecord[];
}

export function getDealPipelineMetrics(state: AppState, deals = getEnrichedDealList(state)): DealPipelineMetrics {
  const month = todayIso().slice(0, 7);
  const all = deals;
  const open = all.filter((d) => resolveDealOutcome(d) === 'open');
  const won = all.filter((d) => resolveDealOutcome(d) === 'won');
  const lost = all.filter((d) => resolveDealOutcome(d) === 'lost');
  const thisMonth = all.filter((d) => String(d.createdAt ?? '').startsWith(month)).length;
  const closed = won.length + lost.length;
  const conversionRate = closed > 0 ? Math.round((won.length / closed) * 1000) / 10 : 0;

  return {
    totalDeals: all.length,
    thisMonth,
    openDeals: open.length,
    openValue: open.reduce((s, d) => s + Number(d.expectedValue ?? 0), 0),
    wonDeals: won.length,
    wonValue: won.reduce((s, d) => s + Number(d.expectedValue ?? 0), 0),
    lostDeals: lost.length,
    lostValue: lost.reduce((s, d) => s + Number(d.expectedValue ?? 0), 0),
    conversionRate,
    conversionDelta: 4.2,
    pipelineValue: open.reduce((s, d) => s + Number(d.expectedValue ?? 0), 0),
  };
}

export function getDealStageBreakdown(state: AppState, deals = getEnrichedDealList(state)): DealStageSlice[] {
  const total = deals.reduce((s, d) => s + Number(d.expectedValue ?? 0), 0) || 1;
  return DEAL_KANBAN_STAGES.map((stage) => {
    const rows = deals.filter((d) => d.stage === stage);
    const value = rows.reduce((s, d) => s + Number(d.expectedValue ?? 0), 0);
    return {
      key: stage,
      label: STAGE_LABELS[stage] ?? stage,
      count: rows.length,
      value,
      pct: Math.round((value / total) * 1000) / 10,
      color: STAGE_COLORS[stage] ?? '#64748b',
    };
  }).filter((s) => s.count > 0);
}

export function getDealsBySource(state: AppState, deals = getEnrichedDealList(state)): DealSourceSlice[] {
  const total = deals.length || 1;
  const counts = new Map<string, number>();
  deals.forEach((deal) => {
    const src = String(deal.leadSource ?? 'Other');
    counts.set(src, (counts.get(src) ?? 0) + 1);
  });
  return [...counts.entries()]
    .map(([key, count]) => ({
      key,
      label: key,
      count,
      pct: Math.round((count / total) * 1000) / 10,
    }))
    .sort((a, b) => b.count - a.count);
}

export function getUpcomingDealFollowUps(state: AppState, limit = 3): DealFollowUpItem[] {
  ensureCrmState(state);
  const crmData = state.crmData as {
    dealFollowUpsById?: Record<string, Record<string, unknown>>;
    dealsById?: Record<string, Record<string, unknown>>;
  };
  const deals = crmData.dealsById ?? {};
  const tones: DealFollowUpItem['tone'][] = ['violet', 'amber', 'blue'];

  return Object.values(crmData.dealFollowUpsById ?? {})
    .filter((f) => String(f.status ?? 'open') === 'open')
    .sort((a, b) => String(a.followUpDate).localeCompare(String(b.followUpDate)))
    .slice(0, limit)
    .map((f, idx) => {
      const deal = deals[String(f.dealId ?? '')];
      const date = new Date(String(f.followUpDate ?? todayIso()));
      return {
        id: String(f.id),
        dealTitle: String(deal?.title ?? 'Deal follow-up'),
        company: String(deal?.company ?? ''),
        date: date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
        tone: tones[idx % tones.length],
      };
    });
}

export function getTopDealPerformers(state: AppState, deals = getEnrichedDealList(state), limit = 3): DealPerformerItem[] {
  const totals = new Map<string, { name: string; value: number }>();
  deals
    .filter((d) => resolveDealOutcome(d) === 'won')
    .forEach((deal) => {
      const name = String(deal.assignedRepName ?? 'Unassigned');
      const prev = totals.get(name) ?? { name, value: 0 };
      prev.value += Number(deal.expectedValue ?? 0);
      totals.set(name, prev);
    });

  return [...totals.values()]
    .sort((a, b) => b.value - a.value)
    .slice(0, limit)
    .map((row, idx) => ({
      id: row.name,
      name: row.name,
      value: row.value,
      rank: idx + 1,
    }));
}

export function stageLabel(stage: string) {
  return STAGE_LABELS[stage] ?? stage;
}

export function stageHeaderClass(stage: string) {
  const map: Record<string, string> = {
    'new-opportunity': 'bg-blue-50 text-blue-700 border-blue-100',
    discovery: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    'proposal-sent': 'bg-violet-50 text-violet-700 border-violet-100',
    negotiation: 'bg-amber-50 text-amber-700 border-amber-100',
    won: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    lost: 'bg-rose-50 text-rose-700 border-rose-100',
  };
  return map[stage] ?? 'bg-slate-50 text-slate-700 border-slate-100';
}
