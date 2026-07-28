import type { AppState } from '@/lib/state/types';
import type { PortAdapter } from '@/lib/modules/port-types';
import {
  listFromState,
  createInState,
  updateInState,
  deleteFromState,
} from '@/lib/services/domain-service';
import {
  getCustomerList,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getDealList,
  createActivityEntry,
  createSupportTicket,
  ensureCrmState,
  getOwnerOptions,
  DEAL_STAGE_LABELS,
} from '@/lib/services/crm-service';

type Row = Record<string, unknown>;
type OwnerOption = { id: string; name: string };

function mapValues(map: Record<string, Row> | undefined): Row[] {
  return Object.values(map || {});
}

export function stateKeyAdapter(
  stateKey: keyof AppState | string,
  idPrefix = 'REC',
  filterFn?: (row: Row) => boolean
): PortAdapter {
  return {
    list: (state) => {
      let rows = listFromState(state, stateKey);
      if (filterFn) rows = rows.filter(filterFn);
      return rows;
    },
    create: (state, payload) => {
      const result = createInState(state, stateKey, payload, idPrefix);
      return result.ok ? { ok: true } : { ok: false, error: result.error };
    },
    update: (state, id, payload) => updateInState(state, stateKey, id, payload),
    delete: (state, id) => deleteFromState(state, stateKey, id),
  };
}

export function crmCustomerAdapter(): PortAdapter {
  return {
    list: (state) => getCustomerList(state) as Row[],
    create: (state, payload) => {
      const owners = getOwnerOptions(state);
      const owner = owners.find((o: OwnerOption) => o.id === payload.ownerId) || owners[0];
      const result = createCustomer(state, {
        ...payload,
        ownerId: owner?.id ?? payload.ownerId,
        ownerName: owner?.name ?? payload.ownerName,
      });
      if (!result.ok) {
        return { ok: false, error: result.duplicates ? 'Duplicate customer found' : 'Create failed' };
      }
      return { ok: true };
    },
    update: (state, id, payload) => {
      const owners = getOwnerOptions(state);
      const owner = owners.find((o: OwnerOption) => o.id === payload.ownerId);
      const result = updateCustomer(state, id, {
        ...payload,
        ownerId: owner?.id ?? payload.ownerId,
        ownerName: owner?.name ?? payload.ownerName,
      });
      if (!result.ok) return { ok: false, error: result.error ?? 'Update failed' };
      return { ok: true };
    },
    delete: (state, id) => deleteCustomer(state, id),
    getInitialForm: (state) => {
      const owners = getOwnerOptions(state);
      return {
        status: 'active',
        ownerId: owners[0]?.id ?? '',
        paymentTerms: 'Net 30',
        creditLimit: '0',
        companyType: 'Distributor',
        category: 'Standard',
      };
    },
    mapRowToForm: (row) => ({
      name: row.name,
      company: row.company,
      phone: row.phone,
      email: row.email,
      status: row.status,
      companyType: row.companyType,
      category: row.category,
      creditLimit: row.creditLimit,
      paymentTerms: row.paymentTerms,
      ownerId: row.ownerId,
      billingAddress: row.billingAddress ?? '',
      billingCity: row.billingCity ?? '',
      shippingAddress: row.shippingAddress ?? '',
      shippingCity: row.shippingCity ?? '',
      notes: row.notes ?? '',
    }),
  };
}

/** List-only adapter — DealsPage owns full CRUD + Kanban. */
export function crmDealAdapter(): PortAdapter {
  return {
    list: (state) =>
      getDealList(state).map((deal) => ({
        id: deal.id,
        name: deal.title,
        company: deal.company,
        stage: DEAL_STAGE_LABELS[deal.stage as keyof typeof DEAL_STAGE_LABELS] || deal.stage,
        value: deal.expectedValue,
      })),
  };
}

export function crmActivityAdapter(): PortAdapter {
  return {
    list: (state) => {
      ensureCrmState(state);
      const crmData = state.crmData as { activitiesById?: Record<string, Row> };
      return mapValues(crmData?.activitiesById).map((a) => ({
        id: a.id,
        type: a.activityType,
        summary: a.summary,
        date: String(a.completedAt || a.createdAt || '').slice(0, 10),
        entityType: a.entityType,
        entityId: a.entityId,
        notes: a.note,
      }));
    },
    create: (state, payload) =>
      createActivityEntry(state, {
        entityType: String(payload.entityType || 'customer'),
        entityId: String(payload.entityId || ''),
        activityType: String(payload.type || 'note'),
        summary: String(payload.summary || payload.name || ''),
        note: String(payload.notes || ''),
      }),
  };
}

export function crmComplaintAdapter(): PortAdapter {
  return {
    list: (state) => {
      ensureCrmState(state);
      const crmData = state.crmData as {
        supportTicketsById?: Record<string, Row>;
        customersById?: Record<string, Row>;
      };
      const customers = crmData?.customersById || {};
      return mapValues(crmData?.supportTicketsById).map((t) => ({
        id: t.id,
        customer: customers[String(t.customerId)]?.company || t.customerId,
        customerId: t.customerId,
        subject: t.subject,
        status: t.status,
        priority: t.priority,
        type: t.type,
        description: t.description,
      }));
    },
    create: (state, payload) =>
      createSupportTicket(state, {
        customerId: String(payload.customerId || ''),
        type: String(payload.type || 'service'),
        priority: String(payload.priority || 'medium'),
        status: String(payload.status || 'open'),
        subject: String(payload.subject || payload.name || ''),
        description: String(payload.description || payload.notes || ''),
      }),
  };
}
