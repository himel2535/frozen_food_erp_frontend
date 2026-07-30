// @ts-nocheck
const DEFAULT_CURRENT_USER = {
  id: 'USR-001',
  name: 'John Doe',
  role: 'admin',
  branch: 'Head Office',
  territory: 'Global',
  employeeId: 'EMP-001'
};

const CRM_PERMISSION_MATRIX = {
  admin: {
    view: true,
    create: true,
    edit: true,
    delete: true,
    export: true,
    merge: true,
    assign: true,
    convert: true,
    bulk: true,
    financial: true,
    support: true
  },
  manager: {
    view: true,
    create: true,
    edit: true,
    delete: false,
    export: true,
    merge: false,
    assign: true,
    convert: true,
    bulk: true,
    financial: true,
    support: true
  },
  salesperson: {
    view: true,
    create: true,
    edit: true,
    delete: false,
    export: false,
    merge: false,
    assign: false,
    convert: true,
    bulk: false,
    financial: true,
    support: true
  },
  viewer: {
    view: true,
    create: false,
    edit: false,
    delete: false,
    export: false,
    merge: false,
    assign: false,
    convert: false,
    bulk: false,
    financial: false,
    support: false
  }
};

export const DEAL_STAGES = [
  'new-opportunity',
  'discovery',
  'proposal-sent',
  'negotiation',
  'verbal-agreement',
  'won',
  'lost'
];

export const DEAL_STAGE_LABELS = {
  'new-opportunity': 'New Opportunity',
  discovery: 'Discovery',
  'proposal-sent': 'Proposal Sent',
  negotiation: 'Negotiation',
  'verbal-agreement': 'Verbal Agreement',
  won: 'Won',
  lost: 'Lost'
};

export const DEAL_STATUSES = ['open', 'won', 'lost', 'on-hold', 'cancelled'];

export const DEAL_STATUS_LABELS = {
  open: 'Open',
  won: 'Won',
  lost: 'Lost',
  'on-hold': 'On Hold',
  cancelled: 'Cancelled'
};

export const DEAL_LOST_REASONS = [
  'Price Issue',
  'Budget Issue',
  'Competitor Selected',
  'No Response',
  'Other'
];

export const DEAL_FOLLOW_UP_TYPES = ['Call', 'Meeting', 'Visit', 'Reminder'];

function pad(num, length = 4) {
  return String(num).padStart(length, '0');
}

function makeId(prefix, nextNumber) {
  return `${prefix}-${pad(nextNumber)}`;
}

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function normalizePhone(value) {
  return String(value || '').replace(/[^\d+]/g, '');
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function nowIso() {
  return new Date().toISOString();
}

function normalizeDealStage(value) {
  const source = String(value || '').trim().toLowerCase();
  const stageMap = {
    new: 'new-opportunity',
    'new opportunity': 'new-opportunity',
    'new-opportunity': 'new-opportunity',
    qualified: 'discovery',
    discovery: 'discovery',
    proposal: 'proposal-sent',
    'proposal sent': 'proposal-sent',
    'proposal-sent': 'proposal-sent',
    negotiation: 'negotiation',
    'verbal agreement': 'verbal-agreement',
    'verbal-agreement': 'verbal-agreement',
    won: 'won',
    lost: 'lost'
  };
  return stageMap[source] || 'new-opportunity';
}

function inferDealStatus(stage, status) {
  const normalizedStatus = String(status || '').trim().toLowerCase();
  if (DEAL_STATUSES.includes(normalizedStatus)) return normalizedStatus;
  if (stage === 'won') return 'won';
  if (stage === 'lost') return 'lost';
  return 'open';
}

function getDealStageIndex(stage) {
  return DEAL_STAGES.indexOf(normalizeDealStage(stage));
}

function isOpenDealStatus(status) {
  return String(status || 'open') === 'open';
}

function getLatestTimestamp(values) {
  return values
    .filter(Boolean)
    .sort((a, b) => String(b).localeCompare(String(a)))[0] || null;
}

function getDaysDiff(date) {
  if (!date) return 0;
  const base = new Date(date);
  const now = new Date(todayIso());
  return Math.max(0, Math.floor((now - base) / 86400000));
}

function arrayToMap(list, keyName = 'id') {
  return (list || []).reduce((acc, item) => {
    acc[item[keyName]] = item;
    return acc;
  }, {});
}

function mapValues(map) {
  return Object.values(map || {});
}

function pickPrimary(items) {
  return items.find((item) => item.primary) || items[0] || null;
}

function parseTags(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildDefaultCrmUi() {
  return {
    activeView: 'customers',
    activeProfileTab: 'overview',
    activeCustomerId: null,
    selectedCustomerIds: [],
    customerPage: 1,
    customerPageSize: 25,
    customerSort: 'name-asc',
    customerSearch: '',
    customerStatus: 'all',
    customerFilters: {
      owner: 'all',
      territory: 'all',
      branch: 'all',
      companyType: 'all',
      category: 'all',
      inactivePeriod: 'all',
      lastPurchase: 'all',
      salesVolume: 'all',
      dueState: 'all'
    },
    leadSearch: '',
    leadView: 'table',
    dealSearch: '',
    dealView: 'table',
    selectedDealId: null,
    dealFiltersOpen: false
  };
}

function buildDefaultCrmData() {
  return {
    customersById: {},
    customerContactsById: {},
    customerAddressesById: {},
    customerAssignmentsById: {},
    customerTagsById: {},
    leadsById: {},
    dealsById: {},
    dealActivitiesById: {},
    dealFollowUpsById: {},
    dealNotesById: {},
    dealAttachmentsById: {},
    dealStageHistoryById: {},
    activitiesById: {},
    tasksById: {},
    communicationsById: {},
    attachmentsById: {},
    supportTicketsById: {},
    paymentsById: {},
    auditLogsById: {},
    customerMergesById: {},
    quotationsById: {},
    salesOrdersById: {},
    refundsById: {}
  };
}

function nextSequenceFromIds(ids, prefix) {
  const matches = ids
    .filter((id) => String(id).startsWith(`${prefix}-`))
    .map((id) => parseInt(String(id).split('-').pop(), 10))
    .filter((id) => !Number.isNaN(id));
  return (matches.length ? Math.max(...matches) : 0) + 1;
}

function getNextId(state, prefix, ids) {
  const sourceIds = ids || [
    ...Object.keys(state.crmData.customersById),
    ...Object.keys(state.crmData.customerContactsById),
    ...Object.keys(state.crmData.customerAddressesById),
    ...Object.keys(state.crmData.customerAssignmentsById),
    ...Object.keys(state.crmData.customerTagsById),
    ...Object.keys(state.crmData.leadsById),
    ...Object.keys(state.crmData.dealsById),
    ...Object.keys(state.crmData.dealActivitiesById),
    ...Object.keys(state.crmData.dealFollowUpsById),
    ...Object.keys(state.crmData.dealNotesById),
    ...Object.keys(state.crmData.dealAttachmentsById),
    ...Object.keys(state.crmData.dealStageHistoryById),
    ...Object.keys(state.crmData.activitiesById),
    ...Object.keys(state.crmData.tasksById),
    ...Object.keys(state.crmData.communicationsById),
    ...Object.keys(state.crmData.attachmentsById),
    ...Object.keys(state.crmData.supportTicketsById),
    ...Object.keys(state.crmData.paymentsById),
    ...Object.keys(state.crmData.auditLogsById),
    ...Object.keys(state.crmData.customerMergesById),
    ...Object.keys(state.crmData.quotationsById),
    ...Object.keys(state.crmData.salesOrdersById),
    ...Object.keys(state.crmData.refundsById)
  ];
  return makeId(prefix, nextSequenceFromIds(sourceIds, prefix));
}

function logAudit(state, action, entityType, entityId, beforeSummary, afterSummary, module = 'CRM') {
  const auditId = getNextId(state, 'AUD');
  state.crmData.auditLogsById[auditId] = {
    id: auditId,
    module,
    entityType,
    entityId,
    action,
    actorId: getUserContext(state).id,
    actorName: getUserContext(state).name,
    timestamp: nowIso(),
    beforeSummary: beforeSummary || null,
    afterSummary: afterSummary || null
  };
}

function logActivity(state, payload) {
  const activityId = getNextId(state, 'ACT');
  state.crmData.activitiesById[activityId] = {
    id: activityId,
    entityType: payload.entityType,
    entityId: payload.entityId,
    activityType: payload.activityType,
    summary: payload.summary,
    note: payload.note || '',
    actorId: payload.actorId || getUserContext(state).id,
    actorName: payload.actorName || getUserContext(state).name,
    scheduledAt: payload.scheduledAt || null,
    completedAt: payload.completedAt || nowIso(),
    createdAt: nowIso()
  };
  return state.crmData.activitiesById[activityId];
}

function syncDealLastActivityAt(state, dealId) {
  const deal = state.crmData.dealsById[dealId];
  if (!deal) return;

  deal.lastActivityAt = getLatestTimestamp([
    deal.updatedAt,
    deal.wonAt,
    deal.lostAt,
    ...mapValues(state.crmData.dealActivitiesById)
      .filter((entry) => entry.dealId === dealId)
      .map((entry) => entry.completedAt || entry.createdAt),
    ...mapValues(state.crmData.dealFollowUpsById)
      .filter((entry) => entry.dealId === dealId)
      .map((entry) => entry.completedAt || entry.createdAt),
    ...mapValues(state.crmData.dealNotesById)
      .filter((entry) => entry.dealId === dealId)
      .map((entry) => entry.createdAt),
    ...mapValues(state.crmData.dealStageHistoryById)
      .filter((entry) => entry.dealId === dealId)
      .map((entry) => entry.changedAt)
  ]) || deal.createdAt;
}

function createDealStageHistoryEntry(state, payload) {
  const historyId = getNextId(state, 'DST');
  state.crmData.dealStageHistoryById[historyId] = {
    id: historyId,
    dealId: payload.dealId,
    fromStage: payload.fromStage || null,
    toStage: payload.toStage,
    changedAt: payload.changedAt || nowIso(),
    changedBy: payload.changedBy || getUserContext(state).name
  };
  syncDealLastActivityAt(state, payload.dealId);
  return state.crmData.dealStageHistoryById[historyId];
}

function deriveDealRelations(state, payload = {}) {
  const lead = payload.linkedLeadId ? state.crmData.leadsById[payload.linkedLeadId] : null;
  const customer = payload.linkedCustomerId ? state.crmData.customersById[payload.linkedCustomerId] : null;
  const primaryContact = customer?.primaryContactId ? state.crmData.customerContactsById[customer.primaryContactId] : null;

  return {
    lead,
    customer,
    company: payload.company || lead?.company || customer?.company || '',
    contactPerson: payload.contactPerson || lead?.name || primaryContact?.name || customer?.name || '',
    phone: payload.phone || lead?.phone || primaryContact?.phone || '',
    leadSource: payload.leadSource || lead?.source || ''
  };
}

function normalizeDealRecord(state, deal) {
  const stage = normalizeDealStage(deal.stage);
  const status = inferDealStatus(stage, deal.status);
  const relations = deriveDealRelations(state, deal);

  Object.assign(deal, {
    title: deal.title || 'Untitled Deal',
    company: deal.company || relations.company,
    contactPerson: deal.contactPerson || relations.contactPerson,
    phone: deal.phone || relations.phone,
    stage,
    status,
    expectedValue: Number(deal.expectedValue || 0),
    probability: Number(deal.probability ?? 50),
    expectedCloseDate: deal.expectedCloseDate || deal.closeDate || todayIso(),
    closeDate: deal.expectedCloseDate || deal.closeDate || todayIso(),
    lastActivityAt: deal.lastActivityAt || deal.updatedAt || deal.createdAt || nowIso(),
    leadSource: deal.leadSource || relations.leadSource,
    competitor: deal.competitor || '',
    internalRemarks: deal.internalRemarks || '',
    conversionDate: deal.conversionDate || null,
    wonAt: deal.wonAt || null,
    lostAt: deal.lostAt || null,
    lostReason: deal.lostReason || deal.lossReason || '',
    notes: deal.notes || '',
    followUpDate: deal.followUpDate || null,
    followUpType: deal.followUpType || '',
    followUpAssignedUserId: deal.followUpAssignedUserId || '',
    followUpAssignedUserName: deal.followUpAssignedUserName || '',
    followUpNotes: deal.followUpNotes || '',
    linkedCustomerId: deal.linkedCustomerId || null,
    linkedLeadId: deal.linkedLeadId || null,
    assignedRepId: deal.assignedRepId || '',
    assignedRepName: deal.assignedRepName || '',
    productsSummary: deal.productsSummary || '',
    createdAt: deal.createdAt || nowIso(),
    updatedAt: deal.updatedAt || deal.createdAt || nowIso()
  });

  syncDealLastActivityAt(state, deal.id);
  return deal;
}

function buildLegacyMigration(state) {
  const crmData = buildDefaultCrmData();
  const salesRep = (state.employees || []).find((employee) => employee.department === 'Sales') || (state.employees || [])[0];
  const legacyIdMap = {};
  const legacyCustomers = Array.isArray(state.crmCustomers) ? state.crmCustomers : [];

  legacyCustomers.forEach((customer, index) => {
    const customerId = makeId('CUST', index + 1);
    const contactId = makeId('CONT', index + 1);
    const billingId = makeId('ADDR', index * 2 + 1);
    const shippingId = makeId('ADDR', index * 2 + 2);
    const tagId = makeId('TAG', index + 1);
    const assignmentId = makeId('ASN', index + 1);

    legacyIdMap[customer.id] = customerId;

    crmData.customersById[customerId] = {
      id: customerId,
      legacyId: customer.id,
      name: customer.name,
      company: customer.company,
      status: customer.status,
      companyType: index % 2 === 0 ? 'Distributor' : 'Manufacturer',
      taxVatNumber: `VAT-${1000 + index}`,
      tradeLicenseNumber: `LIC-${4200 + index}`,
      category: index % 2 === 0 ? 'Strategic' : 'Wholesale',
      tagIds: [tagId],
      creditLimit: customer.sales > 50000 ? 50000 : 20000,
      paymentTerms: customer.status === 'overdue' ? 'Net 15' : 'Net 30',
      defaultCurrency: 'USD',
      pricingTier: customer.sales > 50000 ? 'Enterprise' : 'Standard',
      ownerId: salesRep?.id || DEFAULT_CURRENT_USER.employeeId,
      ownerName: salesRep?.name || DEFAULT_CURRENT_USER.name,
      salesRepId: salesRep?.id || DEFAULT_CURRENT_USER.employeeId,
      salesRepName: salesRep?.name || DEFAULT_CURRENT_USER.name,
      branch: index % 2 === 0 ? 'Head Office' : 'North Branch',
      territory: index % 2 === 0 ? 'National' : 'Dhaka Metro',
      primaryContactId: contactId,
      billingAddressId: billingId,
      shippingAddressId: shippingId,
      createdBy: 'System Import',
      createdAt: `2026-0${(index % 5) + 1}-12T09:00:00.000Z`,
      updatedBy: 'System Import',
      updatedAt: `2026-0${(index % 5) + 1}-16T12:00:00.000Z`,
      inactiveSince: customer.status === 'inactive' ? '2026-05-15' : null,
      portalEnabled: index === 0,
      notes: `Legacy CRM record migrated for ${customer.company}.`
    };

    crmData.customerContactsById[contactId] = {
      id: contactId,
      customerId,
      name: customer.name,
      designation: index % 2 === 0 ? 'Procurement Head' : 'Accounts Manager',
      phone: customer.phone,
      email: customer.email,
      whatsappEnabled: true,
      primary: true
    };

    crmData.customerAddressesById[billingId] = {
      id: billingId,
      customerId,
      type: 'billing',
      line1: `${12 + index} Commerce Avenue`,
      city: index % 2 === 0 ? 'New York' : 'Dhaka',
      region: index % 2 === 0 ? 'NY' : 'Dhaka',
      postalCode: `10${index}01`,
      country: index % 2 === 0 ? 'USA' : 'Bangladesh',
      primary: true
    };

    crmData.customerAddressesById[shippingId] = {
      id: shippingId,
      customerId,
      type: 'shipping',
      line1: `${18 + index} Industrial Park`,
      city: index % 2 === 0 ? 'Newark' : 'Gazipur',
      region: index % 2 === 0 ? 'NJ' : 'Dhaka',
      postalCode: `11${index}07`,
      country: index % 2 === 0 ? 'USA' : 'Bangladesh',
      primary: true
    };

    crmData.customerAssignmentsById[assignmentId] = {
      id: assignmentId,
      customerId,
      ownerId: salesRep?.id || DEFAULT_CURRENT_USER.employeeId,
      ownerName: salesRep?.name || DEFAULT_CURRENT_USER.name,
      branch: index % 2 === 0 ? 'Head Office' : 'North Branch',
      territory: index % 2 === 0 ? 'National' : 'Dhaka Metro',
      assignedAt: `2026-01-${12 + index}T09:00:00.000Z`
    };

    crmData.customerTagsById[tagId] = {
      id: tagId,
      customerId,
      label: index % 2 === 0 ? 'Key Account' : 'Growth',
      color: index % 2 === 0 ? 'blue' : 'emerald'
    };

    const activity = {
      entityType: 'customer',
      entityId: customerId,
      activityType: customer.status === 'overdue' ? 'follow-up' : 'note',
      summary: customer.status === 'overdue' ? 'Outstanding balance follow-up' : 'Customer portfolio review',
      note: `Migrated activity for ${customer.company}.`,
      actorName: 'System Import',
      completedAt: `2026-06-1${index}T09:30:00.000Z`
    };
    logActivity({ ...state, crmData }, activity);
  });

  const salesReps = (state.employees || []).filter((employee) => employee.department === 'Sales');
  const repA = salesReps[0] || salesRep;
  const repB = salesReps[1] || salesRep;
  const leadSeed = [
    {
      id: 'LEAD-0001',
      name: 'Farhana Akter',
      company: 'Orbital Textiles',
      phone: '+8801711002200',
      email: 'farhana@orbitaltextiles.com',
      source: 'Trade Show',
      status: 'qualified',
      priority: 'hot',
      assignedRepId: repA?.id || DEFAULT_CURRENT_USER.employeeId,
      assignedRepName: repA?.name || DEFAULT_CURRENT_USER.name,
      expectedValue: 18000,
      probability: 55,
      nextFollowUpAt: addDaysToIso(todayIso(), 4),
      notes: 'Interested in monthly yarn supply. Sent sample catalog last week.',
      conversionStatus: 'open',
      linkedDealId: 'DEAL-0001',
      createdAt: '2026-06-14T10:00:00.000Z'
    },
    {
      id: 'LEAD-0002',
      name: 'David Bose',
      company: 'Blue Fern Retail',
      phone: '+8801919003311',
      email: 'david@bluefern.io',
      source: 'Website',
      status: 'new',
      priority: 'warm',
      assignedRepId: repA?.id || DEFAULT_CURRENT_USER.employeeId,
      assignedRepName: repA?.name || DEFAULT_CURRENT_USER.name,
      expectedValue: 9400,
      probability: 30,
      nextFollowUpAt: todayIso(),
      notes: 'Wants bundled supply and portal access.',
      conversionStatus: 'open',
      linkedDealId: null,
      createdAt: '2026-06-18T10:00:00.000Z'
    },
    {
      id: 'LEAD-0003',
      name: 'Rashida Khan',
      company: 'Happy Kids Mart',
      phone: '+8801811223344',
      email: 'rashida@happykidsmart.com',
      source: 'Referral',
      status: 'contacted',
      priority: 'hot',
      assignedRepId: repB?.id || repA?.id || DEFAULT_CURRENT_USER.employeeId,
      assignedRepName: repB?.name || repA?.name || DEFAULT_CURRENT_USER.name,
      expectedValue: 12500,
      probability: 45,
      nextFollowUpAt: addDaysToIso(todayIso(), -2),
      notes: 'Referred by Orbital Textiles. Needs plush toy line pricing.',
      conversionStatus: 'open',
      linkedDealId: null,
      createdAt: '2026-06-20T09:00:00.000Z'
    },
    {
      id: 'LEAD-0004',
      name: 'Tanvir Hossain',
      company: 'PlayZone Dhaka',
      phone: '+8801711556677',
      email: 'tanvir@playzone.bd',
      source: 'Facebook',
      status: 'new',
      priority: 'cold',
      assignedRepId: repA?.id || DEFAULT_CURRENT_USER.employeeId,
      assignedRepName: repA?.name || DEFAULT_CURRENT_USER.name,
      expectedValue: 6200,
      probability: 20,
      nextFollowUpAt: addDaysToIso(todayIso(), 7),
      notes: 'Inbound message about educational toy sets.',
      conversionStatus: 'open',
      linkedDealId: null,
      createdAt: '2026-06-22T11:30:00.000Z'
    },
    {
      id: 'LEAD-0005',
      name: 'Nusrat Jahan',
      company: 'Rainbow Stationery',
      phone: '+8801911889900',
      email: 'nusrat@rainbowstationery.com',
      source: 'Walk-in',
      status: 'contacted',
      priority: 'warm',
      assignedRepId: repB?.id || repA?.id || DEFAULT_CURRENT_USER.employeeId,
      assignedRepName: repB?.name || repA?.name || DEFAULT_CURRENT_USER.name,
      expectedValue: 8800,
      probability: 35,
      nextFollowUpAt: addDaysToIso(todayIso(), 3),
      notes: 'Visited factory showroom. Asked for MOQ on puzzle sets.',
      conversionStatus: 'open',
      linkedDealId: null,
      createdAt: '2026-06-23T14:00:00.000Z'
    },
    {
      id: 'LEAD-0006',
      name: 'Imran Chowdhury',
      company: 'Metro Gift House',
      phone: '+8801611445566',
      email: 'imran@metrogift.com',
      source: 'Trade Show',
      status: 'qualified',
      priority: 'hot',
      assignedRepId: repA?.id || DEFAULT_CURRENT_USER.employeeId,
      assignedRepName: repA?.name || DEFAULT_CURRENT_USER.name,
      expectedValue: 22000,
      probability: 60,
      nextFollowUpAt: addDaysToIso(todayIso(), -5),
      notes: 'Ready for commercial proposal. Follow-up overdue.',
      conversionStatus: 'open',
      linkedDealId: null,
      createdAt: '2026-06-10T08:00:00.000Z'
    },
    {
      id: 'LEAD-0007',
      name: 'Sadia Rahman',
      company: 'Little Learners School',
      phone: '+8801711998877',
      email: 'sadia@littlelearners.edu',
      source: 'Website',
      status: 'lost',
      priority: 'cold',
      assignedRepId: repB?.id || repA?.id || DEFAULT_CURRENT_USER.employeeId,
      assignedRepName: repB?.name || repA?.name || DEFAULT_CURRENT_USER.name,
      expectedValue: 4500,
      probability: 10,
      nextFollowUpAt: addDaysToIso(todayIso(), -10),
      notes: 'Budget constraints. May revisit next quarter.',
      conversionStatus: 'open',
      linkedDealId: null,
      createdAt: '2026-05-28T10:00:00.000Z'
    },
    {
      id: 'LEAD-0008',
      name: 'Karim Uddin',
      company: 'Star Bazaar Chain',
      phone: '+8801811776655',
      email: 'karim@starbazaar.com',
      source: 'Referral',
      status: 'qualified',
      priority: 'warm',
      assignedRepId: repA?.id || DEFAULT_CURRENT_USER.employeeId,
      assignedRepName: repA?.name || DEFAULT_CURRENT_USER.name,
      expectedValue: 31000,
      probability: 70,
      nextFollowUpAt: addDaysToIso(todayIso(), 1),
      notes: 'Converted after pricing review. Deal handoff pending.',
      conversionStatus: 'converted',
      linkedDealId: null,
      createdAt: '2026-06-01T09:00:00.000Z'
    }
  ];

  leadSeed.forEach((lead) => {
    crmData.leadsById[lead.id] = lead;
  });

  crmData.dealsById['DEAL-0001'] = {
    id: 'DEAL-0001',
    title: 'Orbital Textiles Annual Supply',
    company: 'Orbital Textiles',
    contactPerson: 'Farhana Akter',
    phone: '+8801711002200',
    stage: 'proposal-sent',
    status: 'open',
    expectedValue: 18000,
    probability: 55,
    expectedCloseDate: '2026-07-08',
    closeDate: '2026-07-08',
    lastActivityAt: '2026-06-21T09:30:00.000Z',
    leadSource: 'Trade Show',
    competitor: 'Northwind Fiber',
    internalRemarks: 'Proposal shared, waiting for commercial review.',
    conversionDate: '2026-06-14T11:00:00.000Z',
    wonAt: null,
    lostAt: null,
    lostReason: '',
    assignedRepId: salesRep?.id || DEFAULT_CURRENT_USER.employeeId,
    assignedRepName: salesRep?.name || DEFAULT_CURRENT_USER.name,
    linkedCustomerId: null,
    linkedLeadId: 'LEAD-0001',
    productsSummary: 'Premium Cotton Yarn, Polyester Thread',
    createdAt: '2026-06-14T11:00:00.000Z'
  };

  crmData.dealNotesById['DNOTE-0001'] = {
    id: 'DNOTE-0001',
    dealId: 'DEAL-0001',
    note: 'Client asked for yearly supply terms with phased delivery.',
    createdBy: salesRep?.name || DEFAULT_CURRENT_USER.name,
    createdAt: '2026-06-20T10:15:00.000Z'
  };

  crmData.dealActivitiesById['DACT-0001'] = {
    id: 'DACT-0001',
    dealId: 'DEAL-0001',
    activityType: 'Proposal Submission',
    summary: 'Proposal sent to client',
    notes: 'Shared commercial proposal and draft delivery schedule.',
    scheduledAt: '2026-06-21',
    completedAt: '2026-06-21T09:30:00.000Z',
    actorId: DEFAULT_CURRENT_USER.id,
    actorName: DEFAULT_CURRENT_USER.name,
    createdAt: '2026-06-21T09:30:00.000Z'
  };

  crmData.dealFollowUpsById['DFUP-0001'] = {
    id: 'DFUP-0001',
    dealId: 'DEAL-0001',
    followUpDate: todayIso(),
    followUpType: 'Call',
    assignedUserId: salesRep?.id || DEFAULT_CURRENT_USER.employeeId,
    assignedUserName: salesRep?.name || DEFAULT_CURRENT_USER.name,
    notes: 'Review proposal response and pricing concerns.',
    status: 'open',
    createdAt: '2026-06-22T08:45:00.000Z',
    completedAt: null
  };

  crmData.dealStageHistoryById['DST-0001'] = {
    id: 'DST-0001',
    dealId: 'DEAL-0001',
    fromStage: 'discovery',
    toStage: 'proposal-sent',
    changedAt: '2026-06-21T09:30:00.000Z',
    changedBy: salesRep?.name || DEFAULT_CURRENT_USER.name
  };

  crmData.tasksById['TASK-0001'] = {
    id: 'TASK-0001',
    entityType: 'lead',
    entityId: 'LEAD-0001',
    title: 'Schedule pricing review call',
    ownerId: salesRep?.id || DEFAULT_CURRENT_USER.employeeId,
    ownerName: salesRep?.name || DEFAULT_CURRENT_USER.name,
    dueDate: todayIso(),
    reminderAt: nowIso(),
    status: 'open',
    priority: 'high',
    createdAt: '2026-06-18T08:00:00.000Z'
  };

  crmData.communicationsById['COM-0001'] = {
    id: 'COM-0001',
    entityType: 'customer',
    entityId: 'CUST-0002',
    channel: 'email',
    direction: 'outbound',
    subject: 'Overdue invoice reminder',
    summary: 'Sent reminder for pending invoice and payment plan.',
    actorId: DEFAULT_CURRENT_USER.id,
    actorName: DEFAULT_CURRENT_USER.name,
    timestamp: '2026-06-19T08:15:00.000Z'
  };

  crmData.supportTicketsById['TKT-0001'] = {
    id: 'TKT-0001',
    customerId: 'CUST-0003',
    type: 'service',
    priority: 'medium',
    status: 'open',
    subject: 'Need revised lead time on bulk order',
    description: 'Customer requested shipment plan change.',
    openedAt: '2026-06-19T09:00:00.000Z',
    slaDueAt: '2026-06-22T17:00:00.000Z',
    resolutionNotes: ''
  };

  crmData.attachmentsById['ATT-0001'] = {
    id: 'ATT-0001',
    customerId: 'CUST-0001',
    documentType: 'trade-license',
    filename: 'bell-labs-license.pdf',
    storageRef: 'mock://docs/bell-labs-license.pdf',
    uploadedBy: 'System Import',
    uploadedAt: '2026-06-10T14:00:00.000Z'
  };

  crmData.quotationsById['QUO-0001'] = {
    id: 'QUO-0001',
    customerId: 'CUST-0001',
    date: '2026-06-05',
    amount: 6200,
    status: 'accepted'
  };
  crmData.quotationsById['QUO-0002'] = {
    id: 'QUO-0002',
    customerId: 'CUST-0002',
    date: '2026-06-17',
    amount: 3400,
    status: 'sent'
  };

  crmData.salesOrdersById['SO-0001'] = {
    id: 'SO-0001',
    customerId: 'CUST-0001',
    date: '2026-06-06',
    amount: 5900,
    status: 'fulfilled'
  };
  crmData.salesOrdersById['SO-0002'] = {
    id: 'SO-0002',
    customerId: 'CUST-0004',
    date: '2026-06-18',
    amount: 2100,
    status: 'processing'
  };
  crmData.salesOrdersById['SO-0003'] = {
    id: 'SO-0003',
    customerId: 'CUST-0002',
    customer: 'Marie Curie',
    date: '2026-06-17',
    total: 1200,
    amount: 1200,
    status: 'confirmed',
    items: [
      { productId: 'TB-S-PNK', name: 'Teddy Bear Small (Pink)', sku: 'TB-S-PNK', qty: 100, unit: 'Pcs', imageUrl: '/images/logo-toys.png' },
    ],
  };
  crmData.salesOrdersById['SO-2026-07-0158'] = {
    id: 'SO-2026-07-0158',
    customerId: 'CUST-0005',
    customer: 'Sobuz Hossain (Shoppy)',
    date: '2026-07-28',
    total: 45000,
    amount: 45000,
    status: 'confirmed',
    deliveryAddress: 'House # 45, Road # 12, Block # C, Bashundhara R/A, Dhaka-1229, Bangladesh',
    contactPerson: 'Sobuz Hossain',
    contactPhone: '01911110476',
    items: [
      { productId: 'TB-L-BRN', name: 'Teddy Bear Large (Brown)', sku: 'TB-L-BRN', qty: 500, unit: 'Pcs', imageUrl: '/images/logo-toys.png' },
      { productId: 'TB-M-WHT', name: 'Teddy Bear Medium (White)', sku: 'TB-M-WHT', qty: 600, unit: 'Pcs', imageUrl: '/images/logo-toys.png' },
      { productId: 'TB-S-PNK', name: 'Teddy Bear Small (Pink)', sku: 'TB-S-PNK', qty: 300, unit: 'Pcs', imageUrl: '/images/logo-toys.png' },
    ],
  };

  crmData.refundsById['REF-0001'] = {
    id: 'REF-0001',
    customerId: 'CUST-0004',
    date: '2026-06-13',
    amount: 120,
    reason: 'Pricing correction'
  };

  return { crmData, legacyIdMap };
}

function migrateInvoicesToCrmIds(state, legacyIdMap) {
  (state.invoices || []).forEach((invoice) => {
    if (typeof invoice.customerId === 'number' && legacyIdMap[invoice.customerId]) {
      invoice.customerId = legacyIdMap[invoice.customerId];
    }
  });
}

function seedPaymentsFromInvoices(state) {
  if (mapValues(state.crmData.paymentsById).length > 0) return;
  (state.invoices || []).forEach((invoice, index) => {
    if ((invoice.paid || 0) <= 0) return;
    const paymentId = makeId('PAY', index + 1);
    state.crmData.paymentsById[paymentId] = {
      id: paymentId,
      customerId: invoice.customerId,
      invoiceId: invoice.id,
      date: invoice.date,
      amount: invoice.paid,
      method: 'Bank Transfer',
      status: 'received'
    };
  });
}

function addDaysToIso(date, days) {
  const base = new Date(`${date}T00:00:00`);
  base.setDate(base.getDate() + Number(days || 0));
  return base.toISOString().slice(0, 10);
}

function getTermDays(terms) {
  const match = String(terms || '').match(/(\d+)/);
  return match ? Number(match[1]) : 30;
}

function isInvoiceCollectible(status) {
  return ['sent', 'partially-paid', 'paid', 'overdue'].includes(status);
}

function isInvoiceOpenStatus(status) {
  return ['sent', 'partially-paid', 'overdue'].includes(status);
}

function ensurePaymentAllocations(state) {
  if (!state.paymentAllocationsById) state.paymentAllocationsById = {};
  const allocations = state.paymentAllocationsById;

  mapValues(state.crmData.paymentsById).forEach((payment) => {
    if (!payment.invoiceId) return;
    const existing = mapValues(allocations).find((allocation) => allocation.paymentId === payment.id && allocation.invoiceId === payment.invoiceId);
    if (existing) return;
    const allocationId = getNextId(state, 'PAL', [...Object.keys(allocations), ...Object.keys(state.crmData.paymentsById)]);
    allocations[allocationId] = {
      id: allocationId,
      paymentId: payment.id,
      invoiceId: payment.invoiceId,
      customerId: payment.customerId,
      amount: Number(payment.amount || 0),
      allocatedAt: payment.date || todayIso()
    };
  });
}

function getPaymentAllocationsForInvoiceInternal(state, invoiceId) {
  ensurePaymentAllocations(state);
  return mapValues(state.paymentAllocationsById).filter((allocation) => allocation.invoiceId === invoiceId);
}

function getInvoicePaymentsInternal(state, invoiceId) {
  const allocations = getPaymentAllocationsForInvoiceInternal(state, invoiceId);
  return allocations
    .map((allocation) => {
      const payment = state.crmData.paymentsById[allocation.paymentId];
      if (!payment) return null;
      return {
        ...payment,
        allocatedAmount: Number(allocation.amount || 0)
      };
    })
    .filter(Boolean)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

function deriveInvoiceLifecycle(invoice, paidAmount) {
  if (invoice.cancelledAt || invoice.status === 'cancelled') return 'cancelled';
  if (invoice.postedAt) {
    if (invoice.dueAmount <= 0 && invoice.total > 0) return 'paid';
    if (paidAmount > 0 && paidAmount < invoice.total) {
      return invoice.dueDate && invoice.dueDate < todayIso() ? 'overdue' : 'partially-paid';
    }
    if (invoice.dueAmount > 0 && invoice.dueDate && invoice.dueDate < todayIso()) return 'overdue';
    return 'sent';
  }
  return 'draft';
}

function normalizeInvoiceRecord(state, invoice, index = 0) {
  const issueDate = invoice.issueDate || invoice.date || todayIso();
  const terms = invoice.terms || invoice.paymentTerms || 'Net 30';
  const dueDate = invoice.dueDate || addDaysToIso(issueDate, getTermDays(terms));
  const subtotal = Number(
    invoice.subtotal ??
    (Array.isArray(invoice.items) && invoice.items.length
      ? invoice.items.reduce((sum, item) => sum + Number(item.total ?? ((item.quantity || 0) * (item.price || 0))), 0)
      : (Number(invoice.amount || invoice.total || 0) - Number(invoice.tax || invoice.taxAmount || 0) + Number(invoice.discount || invoice.discountAmount || 0)))
  ) || 0;
  const discountAmount = Number(invoice.discountAmount ?? invoice.discount ?? 0) || 0;
  const taxAmount = Number(invoice.taxAmount ?? invoice.tax ?? 0) || 0;
  const total = Number(invoice.total ?? invoice.amount ?? Math.max(0, subtotal - discountAmount + taxAmount)) || 0;
  const invoicePayments = getInvoicePaymentsInternal(state, invoice.id);
  const paidAmount = invoicePayments.reduce((sum, payment) => sum + Number(payment.allocatedAmount || payment.amount || 0), 0);
  const dueAmount = invoice.cancelledAt || invoice.status === 'cancelled' ? 0 : Math.max(0, total - paidAmount);
  const customer = state.crmData.customersById?.[invoice.customerId];

  Object.assign(invoice, {
    issueDate,
    date: issueDate,
    dueDate,
    subtotal,
    discountAmount,
    discount: discountAmount,
    taxAmount,
    tax: taxAmount,
    total,
    amount: total,
    paidAmount,
    paid: paidAmount,
    dueAmount,
    due: dueAmount,
    currency: invoice.currency || customer?.defaultCurrency || 'USD',
    terms,
    approvalStatus: invoice.approvalStatus || ((invoice.postedAt || ['sent', 'paid', 'overdue', 'partially-paid'].includes(invoice.status)) ? 'approved' : 'pending'),
    sentAt: invoice.sentAt || (invoice.postedAt ? issueDate : null),
    cancelledAt: invoice.cancelledAt || null,
    customerSnapshot: invoice.customerSnapshot || (customer ? {
      id: customer.id,
      company: customer.company,
      contactName: customer.name,
      creditLimit: customer.creditLimit || 0,
      paymentTerms: customer.paymentTerms || terms
    } : null),
    sourceType: invoice.sourceType || null,
    sourceId: invoice.sourceId || null,
    postedAt: invoice.postedAt || ((invoice.status && invoice.status !== 'draft' && invoice.status !== 'cancelled') ? issueDate : null),
    isPosted: Boolean(invoice.postedAt || (invoice.status && invoice.status !== 'draft' && invoice.status !== 'cancelled')),
    recurringTemplateId: invoice.recurringTemplateId || null,
    ledgerRef: invoice.ledgerRef || null
  });

  if (!invoice.id) {
    invoice.id = `INV-MIG-${String(index + 1).padStart(4, '0')}`;
  }

  invoice.status = deriveInvoiceLifecycle(invoice, paidAmount);
  return invoice;
}

function normalizeInvoices(state) {
  if (!Array.isArray(state.invoices)) state.invoices = [];
  state.invoices = state.invoices.map((invoice, index) => normalizeInvoiceRecord(state, invoice, index));
}

function buildLegacyCustomerList(state) {
  const customers = mapValues(state.crmData.customersById);
  return customers.map((customer) => {
    const primary = pickPrimary(
      mapValues(state.crmData.customerContactsById).filter((contact) => contact.customerId === customer.id)
    );
    const invoices = (state.invoices || []).filter((invoice) => invoice.customerId === customer.id);
    const totalSales = invoices.filter((invoice) => invoice.status !== 'cancelled').reduce((sum, invoice) => sum + (invoice.amount || 0), 0);
    const totalDue = invoices.reduce((sum, invoice) => sum + (invoice.dueAmount || invoice.due || 0), 0);
    return {
      id: customer.id,
      name: customer.name,
      company: customer.company,
      phone: primary?.phone || '',
      email: primary?.email || '',
      status: customer.status,
      sales: totalSales,
      due: totalDue
    };
  });
}

export function ensureCrmState(state) {
  if (!state.currentUser) state.currentUser = clone(DEFAULT_CURRENT_USER);
  if (!state.crmUi) state.crmUi = buildDefaultCrmUi();
  if (!state.salesUi) {
    state.salesUi = {
      customerFilter: 'all',
      statusFilter: 'all',
      riskFilter: 'all',
      dateStart: '',
      dateEnd: '',
      search: '',
      selectedInvoiceId: null
    };
  }
  if (!state.invoiceApprovalsById) state.invoiceApprovalsById = {};
  if (!state.recurringInvoicesById) state.recurringInvoicesById = {};
  if (!state.paymentAllocationsById) state.paymentAllocationsById = {};
  if (!state.crmData) {
    const migration = buildLegacyMigration(state);
    state.crmData = migration.crmData;
    migrateInvoicesToCrmIds(state, migration.legacyIdMap);
  }

  state.crmData = { ...buildDefaultCrmData(), ...state.crmData };
  state.crmUi = { ...buildDefaultCrmUi(), ...state.crmUi };

  mapValues(state.crmData.dealsById).forEach((deal) => normalizeDealRecord(state, deal));
  mapValues(state.crmData.dealFollowUpsById).forEach((followUp) => {
    followUp.status = followUp.status || 'open';
    followUp.createdAt = followUp.createdAt || nowIso();
  });
  mapValues(state.crmData.dealNotesById).forEach((note) => {
    note.createdAt = note.createdAt || nowIso();
  });
  mapValues(state.crmData.dealActivitiesById).forEach((activity) => {
    activity.createdAt = activity.createdAt || nowIso();
  });
  mapValues(state.crmData.dealStageHistoryById).forEach((entry) => {
    entry.changedAt = entry.changedAt || nowIso();
  });
  mapValues(state.crmData.dealsById).forEach((deal) => syncDealLastActivityAt(state, deal.id));

  seedPaymentsFromInvoices(state);
  ensurePaymentAllocations(state);
  normalizeInvoices(state);
  state.crmCustomers = buildLegacyCustomerList(state);

  return state;
}

export function getUserContext(state) {
  return state.currentUser || DEFAULT_CURRENT_USER;
}

export function getCrmPermissions(state) {
  const role = getUserContext(state).role || 'viewer';
  return CRM_PERMISSION_MATRIX[role] || CRM_PERMISSION_MATRIX.viewer;
}

export function canAccessCustomer(state, customer) {
  const user = getUserContext(state);
  if (!customer) return false;
  if (user.role === 'admin') return true;
  if (user.role === 'manager') {
    return !user.branch || customer.branch === user.branch || customer.territory === user.territory;
  }
  if (user.role === 'salesperson') {
    return customer.ownerId === user.employeeId || customer.salesRepId === user.employeeId;
  }
  return customer.branch === user.branch;
}

export function getAllCustomers(state) {
  ensureCrmState(state);
  return mapValues(state.crmData.customersById);
}

export function getVisibleCustomers(state) {
  return getAllCustomers(state).filter((customer) => canAccessCustomer(state, customer));
}

export function getCustomerContacts(state, customerId) {
  ensureCrmState(state);
  return mapValues(state.crmData.customerContactsById).filter((contact) => contact.customerId === customerId);
}

export function getCustomerAddresses(state, customerId) {
  ensureCrmState(state);
  return mapValues(state.crmData.customerAddressesById).filter((address) => address.customerId === customerId);
}

export function getCustomerTags(state, customerId) {
  ensureCrmState(state);
  return mapValues(state.crmData.customerTagsById).filter((tag) => tag.customerId === customerId);
}

export function getCustomerAssignments(state, customerId) {
  ensureCrmState(state);
  return mapValues(state.crmData.customerAssignmentsById).find((assignment) => assignment.customerId === customerId) || null;
}

export function getCustomerFinancialSummary(state, customerId) {
  ensureCrmState(state);
  const invoices = (state.invoices || []).filter((invoice) => invoice.customerId === customerId);
  const payments = mapValues(state.crmData.paymentsById).filter((payment) => payment.customerId === customerId);
  const refunds = mapValues(state.crmData.refundsById).filter((refund) => refund.customerId === customerId);
  const quotations = mapValues(state.crmData.quotationsById).filter((quotation) => quotation.customerId === customerId);
  const salesOrders = mapValues(state.crmData.salesOrdersById).filter((order) => order.customerId === customerId);

  const totalSales = invoices
    .filter((invoice) => invoice.status !== 'cancelled')
    .reduce((sum, invoice) => sum + Number(invoice.total || invoice.amount || 0), 0);
  const totalPaid = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
  const totalDue = invoices.reduce((sum, invoice) => sum + Number(invoice.dueAmount || invoice.due || 0), 0);
  const totalRefunds = refunds.reduce((sum, refund) => sum + (refund.amount || 0), 0);
  const openReceivables = invoices
    .filter((invoice) => isInvoiceOpenStatus(invoice.status))
    .reduce((sum, invoice) => sum + Number(invoice.dueAmount || 0), 0);
  const overdueReceivables = invoices
    .filter((invoice) => invoice.status === 'overdue')
    .reduce((sum, invoice) => sum + Number(invoice.dueAmount || 0), 0);

  const aging = {
    current: 0,
    bucket0to30: 0,
    bucket31to60: 0,
    bucket61to90: 0,
    bucket90plus: 0
  };

  invoices.forEach((invoice) => {
    if (!(invoice.dueAmount > 0) || invoice.status === 'cancelled') return;
    if (invoice.dueDate >= todayIso()) {
      aging.current += invoice.dueAmount;
      return;
    }
    const ageDays = getDaysDiff(invoice.dueDate);
    if (ageDays <= 30) aging.bucket0to30 += invoice.dueAmount;
    else if (ageDays <= 60) aging.bucket31to60 += invoice.dueAmount;
    else if (ageDays <= 90) aging.bucket61to90 += invoice.dueAmount;
    else aging.bucket90plus += invoice.dueAmount;
  });

  const lastInvoice = [...invoices].sort((a, b) => String(b.issueDate || b.date).localeCompare(String(a.issueDate || a.date)))[0];
  const lastPayment = [...payments].sort((a, b) => String(b.date).localeCompare(String(a.date)))[0];
  const customer = state.crmData.customersById[customerId];
  const creditLimit = customer?.creditLimit || 0;
  const overLimitFlag = creditLimit > 0 ? totalDue > creditLimit : false;

  return {
    totalSales,
    totalPaid,
    totalDue,
    totalRefunds,
    quotationCount: quotations.length,
    salesOrderCount: salesOrders.length,
    invoiceCount: invoices.length,
    paymentCount: payments.length,
    lastPurchaseDate: lastInvoice?.date || null,
    lastPaymentDate: lastPayment?.date || null,
    creditLimit,
    creditUsed: totalDue,
    openReceivables,
    overdueReceivables,
    agingSummary: {
      totalDue,
      current: aging.current,
      bucket0to30: aging.bucket0to30,
      bucket31to60: aging.bucket31to60,
      bucket61to90: aging.bucket61to90,
      bucket90plus: aging.bucket90plus,
      overLimitFlag
    }
  };
}

export function getLastActivityDate(state, customerId) {
  ensureCrmState(state);
  const activities = mapValues(state.crmData.activitiesById)
    .filter((item) => item.entityType === 'customer' && item.entityId === customerId)
    .map((item) => item.completedAt || item.createdAt);
  const communications = mapValues(state.crmData.communicationsById)
    .filter((item) => item.entityType === 'customer' && item.entityId === customerId)
    .map((item) => item.timestamp);
  const tickets = mapValues(state.crmData.supportTicketsById)
    .filter((item) => item.customerId === customerId)
    .map((item) => item.openedAt);
  const allDates = [...activities, ...communications, ...tickets].filter(Boolean).sort().reverse();
  return allDates[0] || null;
}

export function getOpenTaskSummary(state, entityType, entityId) {
  ensureCrmState(state);
  const tasks = mapValues(state.crmData.tasksById).filter((task) => task.entityType === entityType && task.entityId === entityId);
  const openTasks = tasks.filter((task) => task.status !== 'done');
  const nextTask = [...openTasks].sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)))[0];
  return {
    count: openTasks.length,
    nextFollowUpAt: nextTask?.dueDate || null
  };
}

export function getCustomerList(state) {
  return getVisibleCustomers(state).map((customer) => {
    const contacts = getCustomerContacts(state, customer.id);
    const primary = pickPrimary(contacts);
    const summary = getCustomerFinancialSummary(state, customer.id);
    const tasks = getOpenTaskSummary(state, 'customer', customer.id);
    return {
      ...customer,
      phone: primary?.phone || '',
      email: primary?.email || '',
      tags: getCustomerTags(state, customer.id).map((tag) => tag.label),
      totalSales: summary.totalSales,
      totalDue: summary.totalDue,
      lastPurchaseDate: summary.lastPurchaseDate,
      lastActivityDate: getLastActivityDate(state, customer.id),
      agingSummary: summary.agingSummary,
      nextFollowUpAt: tasks.nextFollowUpAt,
      openTaskCount: tasks.count
    };
  });
}

export function getCustomerProfile(state, customerId) {
  ensureCrmState(state);
  const customer = state.crmData.customersById[customerId];
  if (!customer) return null;

  const activities = mapValues(state.crmData.activitiesById)
    .filter((activity) => activity.entityType === 'customer' && activity.entityId === customerId)
    .sort((a, b) => String(b.completedAt || b.createdAt).localeCompare(String(a.completedAt || a.createdAt)));
  const communications = mapValues(state.crmData.communicationsById)
    .filter((item) => item.entityType === 'customer' && item.entityId === customerId)
    .sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)));
  const supportTickets = mapValues(state.crmData.supportTicketsById)
    .filter((ticket) => ticket.customerId === customerId)
    .sort((a, b) => String(b.openedAt).localeCompare(String(a.openedAt)));
  const attachments = mapValues(state.crmData.attachmentsById)
    .filter((item) => item.customerId === customerId)
    .sort((a, b) => String(b.uploadedAt).localeCompare(String(a.uploadedAt)));
  const tasks = mapValues(state.crmData.tasksById)
    .filter((task) => task.entityType === 'customer' && task.entityId === customerId)
    .sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)));
  const auditLogs = mapValues(state.crmData.auditLogsById)
    .filter((log) => log.entityType === 'customer' && log.entityId === customerId)
    .sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)));
  const invoices = (state.invoices || []).filter((invoice) => invoice.customerId === customerId).sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const payments = mapValues(state.crmData.paymentsById).filter((payment) => payment.customerId === customerId).sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const quotations = mapValues(state.crmData.quotationsById).filter((item) => item.customerId === customerId).sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const salesOrders = mapValues(state.crmData.salesOrdersById).filter((item) => item.customerId === customerId).sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const refunds = mapValues(state.crmData.refundsById).filter((item) => item.customerId === customerId).sort((a, b) => String(b.date).localeCompare(String(a.date)));

  return {
    customer,
    contacts: getCustomerContacts(state, customerId),
    addresses: getCustomerAddresses(state, customerId),
    tags: getCustomerTags(state, customerId),
    assignment: getCustomerAssignments(state, customerId),
    financialSummary: getCustomerFinancialSummary(state, customerId),
    activities,
    communications,
    tasks,
    supportTickets,
    attachments,
    auditLogs,
    quotations,
    salesOrders,
    invoices,
    payments,
    refunds
  };
}

export function getLeadList(state) {
  ensureCrmState(state);
  const user = getUserContext(state);
  return mapValues(state.crmData.leadsById)
    .filter((lead) => user.role === 'admin' || user.role === 'manager' || lead.assignedRepId === user.employeeId)
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

export function getDealList(state) {
  ensureCrmState(state);
  const user = getUserContext(state);
  return mapValues(state.crmData.dealsById)
    .map((deal) => normalizeDealRecord(state, deal))
    .filter((deal) => user.role === 'admin' || user.role === 'manager' || deal.assignedRepId === user.employeeId)
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

export function getDealById(state, dealId) {
  ensureCrmState(state);
  const deal = state.crmData.dealsById[dealId];
  return deal ? normalizeDealRecord(state, deal) : null;
}

export function getOwnerOptions(state) {
  const employees = (state.employees || []).filter((employee) => employee.status === 'active');
  const sales = employees.filter((employee) => employee.department === 'Sales');
  const source = sales.length ? sales : employees;
  return source.map((employee) => ({
    id: employee.id,
    name: employee.name,
    branch: employee.department === 'Sales' ? 'Head Office' : 'Operations',
    territory: employee.department === 'Sales' ? 'National' : 'Internal'
  }));
}

export function detectDuplicates(state, payload, excludeCustomerId = null) {
  ensureCrmState(state);
  const companyKey = slugify(payload.company);
  const emailKey = String(payload.email || '').trim().toLowerCase();
  const phoneKey = normalizePhone(payload.phone);

  return getAllCustomers(state).filter((customer) => {
    if (customer.id === excludeCustomerId) return false;
    const contacts = getCustomerContacts(state, customer.id);
    const primary = pickPrimary(contacts);
    return (
      (companyKey && slugify(customer.company) === companyKey) ||
      (emailKey && String(primary?.email || '').toLowerCase() === emailKey) ||
      (phoneKey && normalizePhone(primary?.phone) === phoneKey)
    );
  });
}

export function createCustomer(state, payload) {
  ensureCrmState(state);
  const duplicates = detectDuplicates(state, payload);
  if (duplicates.length) {
    return { ok: false, duplicates };
  }

  const customerId = getNextId(state, 'CUST');
  const contactId = getNextId(state, 'CONT');
  const billingId = getNextId(state, 'ADDR');
  const shippingId = getNextId(state, 'ADDR', [...Object.keys(state.crmData.customerAddressesById), billingId]);
  const assignmentId = getNextId(state, 'ASN');
  const actor = getUserContext(state);

  const tags = parseTags(payload.tags);
  const tagIds = tags.map((label) => {
    const tagId = getNextId(state, 'TAG');
    state.crmData.customerTagsById[tagId] = { id: tagId, customerId, label, color: 'blue' };
    return tagId;
  });

  state.crmData.customersById[customerId] = {
    id: customerId,
    name: payload.name,
    company: payload.company,
    status: payload.status || 'active',
    companyType: payload.companyType || 'Distributor',
    taxVatNumber: payload.taxVatNumber || '',
    tinNumber: payload.tinNumber || '',
    tradeLicenseNumber: payload.tradeLicenseNumber || '',
    businessRegistrationNo: payload.businessRegistrationNo || '',
    openingBalance: Number(payload.openingBalance || 0),
    category: payload.category || 'Standard',
    tagIds,
    creditLimit: Number(payload.creditLimit || 0),
    paymentTerms: payload.paymentTerms || 'Net 30',
    defaultCurrency: payload.defaultCurrency || 'USD',
    pricingTier: payload.pricingTier || 'Standard',
    ownerId: payload.ownerId,
    ownerName: payload.ownerName,
    salesRepId: payload.ownerId,
    salesRepName: payload.ownerName,
    branch: payload.branch || 'Head Office',
    territory: payload.territory || 'National',
    primaryContactId: contactId,
    billingAddressId: billingId,
    shippingAddressId: shippingId,
    createdBy: actor.name,
    createdAt: nowIso(),
    updatedBy: actor.name,
    updatedAt: nowIso(),
    inactiveSince: payload.status === 'inactive' ? todayIso() : null,
    portalEnabled: Boolean(payload.portalEnabled),
    notes: payload.notes || ''
  };

  state.crmData.customerContactsById[contactId] = {
    id: contactId,
    customerId,
    name: payload.contactName || payload.name,
    designation: payload.contactDesignation || 'Primary Contact',
    phone: payload.phone || '',
    alternativePhone: payload.alternativePhone || '',
    email: payload.email || '',
    whatsappEnabled: Boolean(payload.whatsappEnabled),
    primary: true
  };

  state.crmData.customerAddressesById[billingId] = {
    id: billingId,
    customerId,
    type: 'billing',
    line1: payload.billingAddress || '',
    area: payload.billingArea || '',
    city: payload.billingCity || '',
    region: payload.billingRegion || '',
    postalCode: payload.billingPostalCode || '',
    country: payload.billingCountry || '',
    primary: true
  };
  state.crmData.customerAddressesById[shippingId] = {
    id: shippingId,
    customerId,
    type: 'shipping',
    line1: payload.shippingAddress || payload.billingAddress || '',
    area: payload.shippingArea || payload.billingArea || '',
    city: payload.shippingCity || payload.billingCity || '',
    region: payload.shippingRegion || payload.billingRegion || '',
    postalCode: payload.shippingPostalCode || payload.billingPostalCode || '',
    country: payload.shippingCountry || payload.billingCountry || '',
    primary: true
  };

  state.crmData.customerAssignmentsById[assignmentId] = {
    id: assignmentId,
    customerId,
    ownerId: payload.ownerId,
    ownerName: payload.ownerName,
    branch: payload.branch || 'Head Office',
    territory: payload.territory || 'National',
    assignedAt: nowIso()
  };

  logAudit(state, 'create', 'customer', customerId, null, {
    name: payload.name,
    company: payload.company,
    owner: payload.ownerName
  });
  logActivity(state, {
    entityType: 'customer',
    entityId: customerId,
    activityType: 'create',
    summary: 'Customer record created',
    note: `${payload.company} was added to CRM.`
  });

  state.crmCustomers = buildLegacyCustomerList(state);
  return { ok: true, customerId };
}

export function updateCustomer(state, customerId, payload) {
  ensureCrmState(state);
  const customer = state.crmData.customersById[customerId];
  if (!customer) return { ok: false, error: 'Customer not found' };

  const duplicates = detectDuplicates(state, payload, customerId);
  if (duplicates.length) {
    return { ok: false, duplicates };
  }

  const before = clone(customer);
  Object.assign(customer, {
    name: payload.name,
    company: payload.company,
    status: payload.status,
    companyType: payload.companyType,
    taxVatNumber: payload.taxVatNumber,
    tinNumber: payload.tinNumber,
    tradeLicenseNumber: payload.tradeLicenseNumber,
    businessRegistrationNo: payload.businessRegistrationNo,
    openingBalance: Number(payload.openingBalance || 0),
    category: payload.category,
    creditLimit: Number(payload.creditLimit || 0),
    paymentTerms: payload.paymentTerms,
    defaultCurrency: payload.defaultCurrency,
    pricingTier: payload.pricingTier,
    ownerId: payload.ownerId,
    ownerName: payload.ownerName,
    salesRepId: payload.ownerId,
    salesRepName: payload.ownerName,
    branch: payload.branch,
    territory: payload.territory,
    inactiveSince: payload.status === 'inactive' ? (customer.inactiveSince || todayIso()) : null,
    notes: payload.notes || '',
    updatedBy: getUserContext(state).name,
    updatedAt: nowIso()
  });

  const primaryContact = state.crmData.customerContactsById[customer.primaryContactId];
  if (primaryContact) {
    Object.assign(primaryContact, {
      name: payload.contactName,
      designation: payload.contactDesignation,
      phone: payload.phone,
      alternativePhone: payload.alternativePhone,
      email: payload.email,
      whatsappEnabled: Boolean(payload.whatsappEnabled)
    });
  }

  const billing = state.crmData.customerAddressesById[customer.billingAddressId];
  const shipping = state.crmData.customerAddressesById[customer.shippingAddressId];
  if (billing) {
    Object.assign(billing, {
      line1: payload.billingAddress,
      area: payload.billingArea,
      city: payload.billingCity,
      region: payload.billingRegion,
      postalCode: payload.billingPostalCode,
      country: payload.billingCountry
    });
  }
  if (shipping) {
    Object.assign(shipping, {
      line1: payload.shippingAddress,
      area: payload.shippingArea,
      city: payload.shippingCity,
      region: payload.shippingRegion,
      postalCode: payload.shippingPostalCode,
      country: payload.shippingCountry
    });
  }

  const existingTags = getCustomerTags(state, customerId);
  existingTags.forEach((tag) => {
    delete state.crmData.customerTagsById[tag.id];
  });
  parseTags(payload.tags).forEach((label) => {
    const tagId = getNextId(state, 'TAG');
    state.crmData.customerTagsById[tagId] = { id: tagId, customerId, label, color: 'blue' };
  });

  const assignment = getCustomerAssignments(state, customerId);
  if (assignment) {
    Object.assign(assignment, {
      ownerId: payload.ownerId,
      ownerName: payload.ownerName,
      branch: payload.branch,
      territory: payload.territory
    });
  }

  logAudit(state, 'update', 'customer', customerId, before, customer);
  logActivity(state, {
    entityType: 'customer',
    entityId: customerId,
    activityType: 'update',
    summary: 'Customer profile updated',
    note: `${customer.company} profile updated.`
  });

  state.crmCustomers = buildLegacyCustomerList(state);
  return { ok: true };
}

export function deleteCustomer(state, customerId) {
  ensureCrmState(state);
  const customer = state.crmData.customersById[customerId];
  if (!customer) return { ok: false, error: 'Customer not found' };
  const before = clone(customer);

  delete state.crmData.customersById[customerId];
  getCustomerContacts(state, customerId).forEach((item) => delete state.crmData.customerContactsById[item.id]);
  getCustomerAddresses(state, customerId).forEach((item) => delete state.crmData.customerAddressesById[item.id]);
  getCustomerTags(state, customerId).forEach((item) => delete state.crmData.customerTagsById[item.id]);
  const assignment = getCustomerAssignments(state, customerId);
  if (assignment) delete state.crmData.customerAssignmentsById[assignment.id];

  logAudit(state, 'delete', 'customer', customerId, before, null);
  state.crmCustomers = buildLegacyCustomerList(state);
  return { ok: true };
}

export function mergeCustomers(state, primaryCustomerId, duplicateCustomerId) {
  ensureCrmState(state);
  const primary = state.crmData.customersById[primaryCustomerId];
  const duplicate = state.crmData.customersById[duplicateCustomerId];
  if (!primary || !duplicate) return { ok: false, error: 'Customer missing' };

  (state.invoices || []).forEach((invoice) => {
    if (invoice.customerId === duplicateCustomerId) invoice.customerId = primaryCustomerId;
  });

  [
    state.crmData.customerContactsById,
    state.crmData.customerAddressesById,
    state.crmData.customerTagsById,
    state.crmData.paymentsById,
    state.crmData.supportTicketsById,
    state.crmData.attachmentsById,
    state.crmData.quotationsById,
    state.crmData.salesOrdersById,
    state.crmData.refundsById
  ].forEach((collection) => {
    mapValues(collection).forEach((record) => {
      if (record.customerId === duplicateCustomerId) record.customerId = primaryCustomerId;
    });
  });

  mapValues(state.crmData.activitiesById).forEach((record) => {
    if (record.entityType === 'customer' && record.entityId === duplicateCustomerId) record.entityId = primaryCustomerId;
  });
  mapValues(state.crmData.communicationsById).forEach((record) => {
    if (record.entityType === 'customer' && record.entityId === duplicateCustomerId) record.entityId = primaryCustomerId;
  });
  mapValues(state.crmData.tasksById).forEach((record) => {
    if (record.entityType === 'customer' && record.entityId === duplicateCustomerId) record.entityId = primaryCustomerId;
  });

  const mergeId = getNextId(state, 'MRG');
  state.crmData.customerMergesById[mergeId] = {
    id: mergeId,
    primaryCustomerId,
    duplicateCustomerId,
    mergedAt: nowIso(),
    mergedBy: getUserContext(state).name
  };

  logAudit(state, 'merge', 'customer', primaryCustomerId, { duplicateCustomerId }, { primaryCustomerId });
  delete state.crmData.customersById[duplicateCustomerId];
  state.crmCustomers = buildLegacyCustomerList(state);
  return { ok: true };
}

export function createLead(state, payload) {
  ensureCrmState(state);
  const leadId = getNextId(state, 'LEAD');
  state.crmData.leadsById[leadId] = {
    id: leadId,
    name: payload.name,
    company: payload.company,
    phone: payload.phone,
    alternativePhone: payload.alternativePhone || '',
    email: payload.email,
    interestedProduct: payload.interestedProduct || '',
    customerRequirement: payload.customerRequirement || '',
    source: payload.source,
    campaign: payload.campaign || '',
    adCreative: payload.adCreative || '',
    status: payload.status,
    priority: payload.priority,
    assignedRepId: payload.assignedRepId,
    assignedRepName: payload.assignedRepName,
    expectedValue: Number(payload.expectedValue || 0),
    probability: Number(payload.probability || 0),
    nextFollowUpAt: payload.nextFollowUpAt || null,
    notes: payload.notes || '',
    conversionStatus: 'open',
    linkedDealId: null,
    createdAt: nowIso()
  };
  logAudit(state, 'create', 'lead', leadId, null, state.crmData.leadsById[leadId]);
  logActivity(state, {
    entityType: 'lead',
    entityId: leadId,
    activityType: 'create',
    summary: 'Lead added',
    note: `${payload.company} lead captured from ${payload.source}.`
  });
  return { ok: true, leadId };
}

export function updateLead(state, leadId, payload) {
  ensureCrmState(state);
  const lead = state.crmData.leadsById[leadId];
  if (!lead) return { ok: false, error: 'Lead not found' };

  const before = clone(lead);
  Object.assign(lead, {
    name: payload.name !== undefined ? payload.name : lead.name,
    company: payload.company !== undefined ? payload.company : lead.company,
    phone: payload.phone !== undefined ? payload.phone : lead.phone,
    alternativePhone: payload.alternativePhone !== undefined ? payload.alternativePhone : lead.alternativePhone,
    email: payload.email !== undefined ? payload.email : lead.email,
    interestedProduct: payload.interestedProduct !== undefined ? payload.interestedProduct : lead.interestedProduct,
    customerRequirement: payload.customerRequirement !== undefined ? payload.customerRequirement : lead.customerRequirement,
    source: payload.source !== undefined ? payload.source : lead.source,
    campaign: payload.campaign !== undefined ? payload.campaign : lead.campaign,
    adCreative: payload.adCreative !== undefined ? payload.adCreative : lead.adCreative,
    status: payload.status !== undefined ? payload.status : lead.status,
    priority: payload.priority !== undefined ? payload.priority : lead.priority,
    assignedRepId: payload.assignedRepId !== undefined ? payload.assignedRepId : lead.assignedRepId,
    assignedRepName: payload.assignedRepName !== undefined ? payload.assignedRepName : lead.assignedRepName,
    expectedValue: payload.expectedValue !== undefined ? Number(payload.expectedValue || 0) : lead.expectedValue,
    probability: payload.probability !== undefined ? Number(payload.probability || 0) : lead.probability,
    nextFollowUpAt: payload.nextFollowUpAt !== undefined ? payload.nextFollowUpAt : lead.nextFollowUpAt,
    notes: payload.notes !== undefined ? payload.notes : lead.notes,
    conversionStatus: payload.conversionStatus !== undefined ? payload.conversionStatus : lead.conversionStatus
  });

  logAudit(state, 'update', 'lead', leadId, before, lead);
  return { ok: true };
}

export function getLeadActivities(state, leadId) {
  ensureCrmState(state);
  return mapValues(state.crmData.activitiesById)
    .filter((activity) => activity.entityType === 'lead' && activity.entityId === leadId)
    .sort((a, b) => String(b.completedAt || b.createdAt).localeCompare(String(a.completedAt || a.createdAt)));
}

export function convertLeadToCustomer(state, leadId, options = {}) {
  ensureCrmState(state);
  const lead = state.crmData.leadsById[leadId];
  if (!lead) return { ok: false, error: 'Lead not found' };

  const result = createCustomer(state, {
    name: lead.name,
    company: lead.company,
    phone: lead.phone,
    email: lead.email,
    status: 'active',
    companyType: 'Prospect Converted',
    taxVatNumber: '',
    tradeLicenseNumber: '',
    category: options.category || 'New Acquisition',
    tags: options.tags || 'Converted Lead',
    creditLimit: options.creditLimit || 10000,
    paymentTerms: options.paymentTerms || 'Net 30',
    defaultCurrency: 'USD',
    pricingTier: options.pricingTier || 'Standard',
    ownerId: lead.assignedRepId,
    ownerName: lead.assignedRepName,
    branch: options.branch || 'Head Office',
    territory: options.territory || 'National',
    contactName: lead.name,
    contactDesignation: 'Primary Contact',
    billingAddress: options.billingAddress || '',
    shippingAddress: options.shippingAddress || '',
    billingCity: '',
    shippingCity: '',
    billingRegion: '',
    shippingRegion: '',
    billingPostalCode: '',
    shippingPostalCode: '',
    billingCountry: '',
    shippingCountry: '',
    whatsappEnabled: true,
    notes: lead.notes
  });

  if (!result.ok) return result;

  lead.conversionStatus = 'converted';
  lead.convertedCustomerId = result.customerId;
  lead.convertedAt = nowIso();

  if (options.createDeal !== false) {
    const deal = createDeal(state, {
      title: `${lead.company} onboarding opportunity`,
      stage: 'discovery',
      expectedValue: lead.expectedValue,
      probability: lead.probability,
      expectedCloseDate: lead.nextFollowUpAt || todayIso(),
      assignedRepId: lead.assignedRepId,
      assignedRepName: lead.assignedRepName,
      linkedCustomerId: result.customerId,
      linkedLeadId: lead.id,
      company: lead.company,
      contactPerson: lead.name,
      phone: lead.phone,
      leadSource: lead.source,
      productsSummary: options.productsSummary || 'Initial account setup'
    });
    if (deal.ok) {
      lead.linkedDealId = deal.dealId;
    }
  }

  logAudit(state, 'convert', 'lead', leadId, { conversionStatus: 'open' }, { conversionStatus: 'converted', customerId: result.customerId });
  logActivity(state, {
    entityType: 'lead',
    entityId: leadId,
    activityType: 'convert',
    summary: 'Lead converted to customer',
    note: `${lead.company} converted into customer ${result.customerId}.`
  });

  return { ok: true, customerId: result.customerId };
}

export function createDeal(state, payload) {
  ensureCrmState(state);
  const actor = getUserContext(state);
  const dealId = getNextId(state, 'DEAL');
  const relations = deriveDealRelations(state, payload);
  const stage = normalizeDealStage(payload.stage || 'new-opportunity');
  state.crmData.dealsById[dealId] = {
    id: dealId,
    title: payload.title,
    company: relations.company,
    contactPerson: relations.contactPerson,
    phone: relations.phone,
    stage,
    status: inferDealStatus(stage, payload.status),
    expectedValue: Number(payload.expectedValue || 0),
    probability: Number(payload.probability ?? 50),
    expectedCloseDate: payload.expectedCloseDate || payload.closeDate || todayIso(),
    closeDate: payload.expectedCloseDate || payload.closeDate || todayIso(),
    lastActivityAt: nowIso(),
    leadSource: relations.leadSource,
    competitor: payload.competitor || '',
    internalRemarks: payload.internalRemarks || '',
    conversionDate: payload.conversionDate || null,
    wonAt: payload.wonAt || null,
    lostAt: payload.lostAt || null,
    lostReason: payload.lostReason || '',
    assignedRepId: payload.assignedRepId,
    assignedRepName: payload.assignedRepName,
    linkedCustomerId: payload.linkedCustomerId || null,
    linkedLeadId: payload.linkedLeadId || null,
    notes: payload.notes || '',
    followUpDate: payload.followUpDate || null,
    followUpType: payload.followUpType || '',
    followUpAssignedUserId: payload.followUpAssignedUserId || '',
    followUpAssignedUserName: payload.followUpAssignedUserName || '',
    followUpNotes: payload.followUpNotes || '',
    productsSummary: payload.productsSummary || '',
    createdAt: nowIso(),
    updatedAt: nowIso()
  };
  normalizeDealRecord(state, state.crmData.dealsById[dealId]);

  if (payload.linkedLeadId && state.crmData.leadsById[payload.linkedLeadId]) {
    state.crmData.leadsById[payload.linkedLeadId].linkedDealId = dealId;
    state.crmData.leadsById[payload.linkedLeadId].conversionStatus = 'converted';
  }

  createDealStageHistoryEntry(state, {
    dealId,
    fromStage: null,
    toStage: stage,
    changedBy: actor.name
  });

  if (payload.notes) {
    createDealNote(state, {
      dealId,
      note: payload.notes
    });
  }

  if (payload.followUpDate) {
    createDealFollowUp(state, {
      dealId,
      followUpDate: payload.followUpDate,
      followUpType: payload.followUpType || 'Reminder',
      assignedUserId: payload.followUpAssignedUserId || payload.assignedRepId,
      assignedUserName: payload.followUpAssignedUserName || payload.assignedRepName,
      notes: payload.followUpNotes || ''
    });
  }

  createDealActivity(state, {
    dealId,
    activityType: 'Deal Created',
    summary: 'Deal created',
    notes: `${payload.title} was added to the pipeline.`,
    completedAt: nowIso()
  });

  logAudit(state, 'create', 'deal', dealId, null, state.crmData.dealsById[dealId]);
  return { ok: true, dealId };
}

export function updateDeal(state, dealId, payload) {
  ensureCrmState(state);
  const deal = state.crmData.dealsById[dealId];
  if (!deal) return { ok: false, error: 'Deal not found' };
  const before = clone(deal);
  const relations = deriveDealRelations(state, {
    linkedLeadId: payload.linkedLeadId !== undefined ? payload.linkedLeadId : deal.linkedLeadId,
    linkedCustomerId: payload.linkedCustomerId !== undefined ? payload.linkedCustomerId : deal.linkedCustomerId,
    company: payload.company !== undefined ? payload.company : deal.company,
    contactPerson: payload.contactPerson !== undefined ? payload.contactPerson : deal.contactPerson,
    phone: payload.phone !== undefined ? payload.phone : deal.phone,
    leadSource: payload.leadSource !== undefined ? payload.leadSource : deal.leadSource
  });

  Object.assign(deal, {
    title: payload.title !== undefined ? payload.title : deal.title,
    company: relations.company,
    contactPerson: relations.contactPerson,
    phone: relations.phone,
    status: payload.status !== undefined ? payload.status : deal.status,
    expectedValue: payload.expectedValue !== undefined ? Number(payload.expectedValue || 0) : deal.expectedValue,
    probability: payload.probability !== undefined ? Number(payload.probability || 0) : deal.probability,
    expectedCloseDate: payload.expectedCloseDate !== undefined ? payload.expectedCloseDate : deal.expectedCloseDate,
    closeDate: payload.expectedCloseDate !== undefined ? payload.expectedCloseDate : deal.expectedCloseDate,
    leadSource: payload.leadSource !== undefined ? payload.leadSource : relations.leadSource,
    competitor: payload.competitor !== undefined ? payload.competitor : deal.competitor,
    internalRemarks: payload.internalRemarks !== undefined ? payload.internalRemarks : deal.internalRemarks,
    assignedRepId: payload.assignedRepId !== undefined ? payload.assignedRepId : deal.assignedRepId,
    assignedRepName: payload.assignedRepName !== undefined ? payload.assignedRepName : deal.assignedRepName,
    linkedCustomerId: payload.linkedCustomerId !== undefined ? payload.linkedCustomerId : deal.linkedCustomerId,
    linkedLeadId: payload.linkedLeadId !== undefined ? payload.linkedLeadId : deal.linkedLeadId,
    productsSummary: payload.productsSummary !== undefined ? payload.productsSummary : deal.productsSummary,
    followUpDate: payload.followUpDate !== undefined ? payload.followUpDate : deal.followUpDate,
    followUpType: payload.followUpType !== undefined ? payload.followUpType : deal.followUpType,
    followUpAssignedUserId: payload.followUpAssignedUserId !== undefined ? payload.followUpAssignedUserId : deal.followUpAssignedUserId,
    followUpAssignedUserName: payload.followUpAssignedUserName !== undefined ? payload.followUpAssignedUserName : deal.followUpAssignedUserName,
    followUpNotes: payload.followUpNotes !== undefined ? payload.followUpNotes : deal.followUpNotes,
    updatedAt: nowIso()
  });

  normalizeDealRecord(state, deal);

  if (payload.notes) {
    createDealNote(state, {
      dealId,
      note: payload.notes
    });
  }

  if (payload.followUpDate) {
    createDealFollowUp(state, {
      dealId,
      followUpDate: payload.followUpDate,
      followUpType: payload.followUpType || 'Reminder',
      assignedUserId: payload.followUpAssignedUserId || payload.assignedRepId || deal.assignedRepId,
      assignedUserName: payload.followUpAssignedUserName || payload.assignedRepName || deal.assignedRepName,
      notes: payload.followUpNotes || ''
    });
  }

  syncDealLastActivityAt(state, dealId);
  logAudit(state, 'update', 'deal', dealId, before, deal);
  return { ok: true, dealId };
}

export function advanceDealStage(state, dealId) {
  ensureCrmState(state);
  const deal = state.crmData.dealsById[dealId];
  if (!deal) return { ok: false, error: 'Deal not found' };

  const currentStage = normalizeDealStage(deal.stage);
  const currentIndex = getDealStageIndex(currentStage);
  const nextStage = DEAL_STAGES[Math.min(currentIndex + 1, DEAL_STAGES.length - 1)];

  if (!nextStage || nextStage === currentStage) {
    return { ok: false, error: 'No further stage available' };
  }

  return updateDealStage(state, dealId, nextStage);
}

export function updateDealStage(state, dealId, stage) {
  ensureCrmState(state);
  const deal = state.crmData.dealsById[dealId];
  if (!deal) return { ok: false, error: 'Deal not found' };
  const nextStage = normalizeDealStage(stage);
  const before = clone(deal);

  deal.stage = nextStage;
  deal.status = inferDealStatus(nextStage, deal.status);
  deal.updatedAt = nowIso();

  createDealStageHistoryEntry(state, {
    dealId,
    fromStage: before.stage,
    toStage: nextStage
  });

  createDealActivity(state, {
    dealId,
    activityType: 'Stage Change',
    summary: `Stage moved to ${DEAL_STAGE_LABELS[nextStage]}`,
    notes: `${deal.title} stage updated from ${DEAL_STAGE_LABELS[normalizeDealStage(before.stage)]} to ${DEAL_STAGE_LABELS[nextStage]}.`,
    completedAt: nowIso()
  });

  logAudit(state, 'stage-update', 'deal', dealId, before, deal);
  return { ok: true, dealId, stage: nextStage };
}

export function markDealWon(state, dealId, options = {}) {
  ensureCrmState(state);
  const deal = state.crmData.dealsById[dealId];
  if (!deal) return { ok: false, error: 'Deal not found' };

  const before = clone(deal);
  let customerId = deal.linkedCustomerId || options.linkedCustomerId || null;

  if (!customerId && deal.linkedLeadId) {
    const conversionResult = convertLeadToCustomer(state, deal.linkedLeadId, { createDeal: false });
    if (!conversionResult.ok) return conversionResult;
    customerId = conversionResult.customerId;
  }

  if (!customerId && deal.company) {
    const customerResult = createCustomer(state, {
      name: deal.contactPerson || deal.company,
      company: deal.company,
      phone: deal.phone || '',
      email: '',
      status: 'active',
      companyType: 'Prospect Converted',
      category: 'New Acquisition',
      tags: 'Won Deal',
      creditLimit: 10000,
      paymentTerms: 'Net 30',
      defaultCurrency: 'USD',
      pricingTier: 'Standard',
      ownerId: deal.assignedRepId,
      ownerName: deal.assignedRepName,
      branch: 'Head Office',
      territory: 'National',
      contactName: deal.contactPerson || deal.company,
      contactDesignation: 'Primary Contact',
      notes: deal.internalRemarks || ''
    });
    if (!customerResult.ok) return customerResult;
    customerId = customerResult.customerId;
  }

  deal.stage = 'won';
  deal.status = 'won';
  deal.linkedCustomerId = customerId;
  deal.conversionDate = deal.conversionDate || nowIso();
  deal.wonAt = nowIso();
  deal.updatedAt = nowIso();

  createDealStageHistoryEntry(state, {
    dealId,
    fromStage: before.stage,
    toStage: 'won'
  });
  createDealActivity(state, {
    dealId,
    activityType: 'Won',
    summary: 'Deal marked as won',
    notes: customerId ? `Customer linked: ${customerId}.` : 'Deal marked as won.',
    completedAt: nowIso()
  });

  syncDealLastActivityAt(state, dealId);
  logAudit(state, 'mark-won', 'deal', dealId, before, deal);
  return { ok: true, dealId, customerId };
}

export function markDealLost(state, dealId, payload = {}) {
  ensureCrmState(state);
  const deal = state.crmData.dealsById[dealId];
  if (!deal) return { ok: false, error: 'Deal not found' };

  const before = clone(deal);
  deal.stage = 'lost';
  deal.status = 'lost';
  deal.lostAt = nowIso();
  deal.lostReason = payload.lostReason || payload.reason || 'Other';
  deal.competitor = payload.competitor || deal.competitor || '';
  deal.internalRemarks = payload.notes ? `${deal.internalRemarks ? `${deal.internalRemarks}\n` : ''}${payload.notes}` : deal.internalRemarks;
  deal.updatedAt = nowIso();

  createDealStageHistoryEntry(state, {
    dealId,
    fromStage: before.stage,
    toStage: 'lost'
  });
  createDealActivity(state, {
    dealId,
    activityType: 'Lost',
    summary: 'Deal marked as lost',
    notes: `${deal.lostReason}${deal.competitor ? ` · Competitor: ${deal.competitor}` : ''}`,
    completedAt: nowIso()
  });
  if (payload.notes) {
    createDealNote(state, {
      dealId,
      note: payload.notes
    });
  }

  syncDealLastActivityAt(state, dealId);
  logAudit(state, 'mark-lost', 'deal', dealId, before, deal);
  return { ok: true, dealId };
}

export function createDealActivity(state, payload) {
  ensureCrmState(state);
  const deal = state.crmData.dealsById[payload.dealId];
  if (!deal) return { ok: false, error: 'Deal not found' };

  const activityId = getNextId(state, 'DACT');
  const globalActivity = logActivity(state, {
    entityType: 'deal',
    entityId: payload.dealId,
    activityType: payload.activityType || 'Note',
    summary: payload.summary,
    note: payload.notes || '',
    scheduledAt: payload.scheduledAt || null,
    completedAt: payload.completedAt || nowIso()
  });

  state.crmData.dealActivitiesById[activityId] = {
    id: activityId,
    dealId: payload.dealId,
    activityType: payload.activityType || 'Note',
    summary: payload.summary,
    notes: payload.notes || '',
    scheduledAt: payload.scheduledAt || null,
    completedAt: globalActivity.completedAt || payload.completedAt || null,
    actorId: globalActivity.actorId,
    actorName: globalActivity.actorName,
    createdAt: globalActivity.createdAt || nowIso(),
    globalActivityId: globalActivity.id
  };
  syncDealLastActivityAt(state, payload.dealId);
  logAudit(state, 'create', 'deal-activity', activityId, null, state.crmData.dealActivitiesById[activityId]);
  return { ok: true, activityId };
}

export function createDealFollowUp(state, payload) {
  ensureCrmState(state);
  const deal = state.crmData.dealsById[payload.dealId];
  if (!deal) return { ok: false, error: 'Deal not found' };

  const followUpId = getNextId(state, 'DFUP');
  state.crmData.dealFollowUpsById[followUpId] = {
    id: followUpId,
    dealId: payload.dealId,
    followUpDate: payload.followUpDate,
    followUpType: payload.followUpType || 'Reminder',
    assignedUserId: payload.assignedUserId || deal.assignedRepId,
    assignedUserName: payload.assignedUserName || deal.assignedRepName,
    notes: payload.notes || '',
    status: payload.status || 'open',
    createdAt: nowIso(),
    completedAt: payload.completedAt || null
  };

  createTask(state, {
    entityType: 'deal',
    entityId: payload.dealId,
    title: `${payload.followUpType || 'Follow-Up'}: ${deal.title}`,
    ownerId: payload.assignedUserId || deal.assignedRepId,
    ownerName: payload.assignedUserName || deal.assignedRepName,
    dueDate: payload.followUpDate,
    status: payload.status || 'open',
    priority: 'medium'
  });

  syncDealLastActivityAt(state, payload.dealId);
  logAudit(state, 'create', 'deal-follow-up', followUpId, null, state.crmData.dealFollowUpsById[followUpId]);
  return { ok: true, followUpId };
}

export function createDealNote(state, payload) {
  ensureCrmState(state);
  const deal = state.crmData.dealsById[payload.dealId];
  if (!deal) return { ok: false, error: 'Deal not found' };

  const noteId = getNextId(state, 'DNOTE');
  state.crmData.dealNotesById[noteId] = {
    id: noteId,
    dealId: payload.dealId,
    note: payload.note,
    createdBy: getUserContext(state).name,
    createdAt: nowIso()
  };
  syncDealLastActivityAt(state, payload.dealId);
  logAudit(state, 'create', 'deal-note', noteId, null, state.crmData.dealNotesById[noteId]);
  return { ok: true, noteId };
}

export function getDealTimeline(state, dealId) {
  ensureCrmState(state);
  return [
    ...mapValues(state.crmData.dealActivitiesById)
      .filter((entry) => entry.dealId === dealId)
      .map((entry) => ({
        id: entry.id,
        type: 'activity',
        title: entry.summary,
        body: entry.notes,
        meta: entry.activityType,
        timestamp: entry.completedAt || entry.createdAt
      })),
    ...mapValues(state.crmData.dealNotesById)
      .filter((entry) => entry.dealId === dealId)
      .map((entry) => ({
        id: entry.id,
        type: 'note',
        title: 'Internal note added',
        body: entry.note,
        meta: entry.createdBy,
        timestamp: entry.createdAt
      })),
    ...mapValues(state.crmData.dealFollowUpsById)
      .filter((entry) => entry.dealId === dealId)
      .map((entry) => ({
        id: entry.id,
        type: 'follow-up',
        title: `${entry.followUpType} follow-up`,
        body: entry.notes,
        meta: `${entry.assignedUserName || 'Unassigned'} · ${entry.status}`,
        timestamp: entry.completedAt || entry.followUpDate || entry.createdAt
      })),
    ...mapValues(state.crmData.dealStageHistoryById)
      .filter((entry) => entry.dealId === dealId)
      .map((entry) => ({
        id: entry.id,
        type: 'stage',
        title: `Stage: ${DEAL_STAGE_LABELS[entry.toStage] || entry.toStage}`,
        body: entry.fromStage ? `Moved from ${DEAL_STAGE_LABELS[entry.fromStage] || entry.fromStage}` : 'Initial stage set',
        meta: entry.changedBy,
        timestamp: entry.changedAt
      }))
  ].sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)));
}

export function getDealMetrics(state, sourceDeals = null) {
  ensureCrmState(state);
  const deals = Array.isArray(sourceDeals) ? sourceDeals : getDealList(state);
  const currentMonth = todayIso().slice(0, 7);
  const activeDeals = deals.filter((deal) => isOpenDealStatus(deal.status));
  const pipelineValue = activeDeals.reduce((sum, deal) => sum + Number(deal.expectedValue || 0), 0);
  const averageDealSize = deals.length ? deals.reduce((sum, deal) => sum + Number(deal.expectedValue || 0), 0) / deals.length : 0;
  const dealsClosingThisMonth = activeDeals.filter((deal) => String(deal.expectedCloseDate || '').startsWith(currentMonth)).length;
  const wonDeals = deals.filter((deal) => deal.status === 'won').length;
  const lostDeals = deals.filter((deal) => deal.status === 'lost').length;
  const forecastValue = activeDeals.reduce((sum, deal) => sum + ((Number(deal.expectedValue || 0) * Number(deal.probability || 0)) / 100), 0);

  return {
    totalDeals: activeDeals.length,
    pipelineValue,
    averageDealSize,
    dealsClosingThisMonth,
    wonDeals,
    lostDeals,
    forecastValue
  };
}

export function getDealForecastSummary(state, sourceDeals = null) {
  const metrics = getDealMetrics(state, sourceDeals);
  return {
    forecastValue: metrics.forecastValue,
    openPipelineValue: metrics.pipelineValue,
    weightedCoverage: metrics.pipelineValue > 0 ? (metrics.forecastValue / metrics.pipelineValue) * 100 : 0
  };
}

export function createTask(state, payload) {
  ensureCrmState(state);
  const taskId = getNextId(state, 'TASK');
  state.crmData.tasksById[taskId] = {
    id: taskId,
    entityType: payload.entityType,
    entityId: payload.entityId,
    title: payload.title,
    ownerId: payload.ownerId,
    ownerName: payload.ownerName,
    dueDate: payload.dueDate,
    reminderAt: payload.reminderAt || null,
    status: payload.status || 'open',
    priority: payload.priority || 'medium',
    createdAt: nowIso()
  };
  logAudit(state, 'create', 'task', taskId, null, state.crmData.tasksById[taskId]);
  return { ok: true, taskId };
}

export function createActivityEntry(state, payload) {
  ensureCrmState(state);
  const activity = logActivity(state, {
    entityType: payload.entityType,
    entityId: payload.entityId,
    activityType: payload.activityType || 'note',
    summary: payload.summary,
    note: payload.note || '',
    scheduledAt: payload.scheduledAt || null
  });
  logAudit(state, 'create', 'activity', activity.id, null, activity);
  return { ok: true, activityId: activity.id };
}

export function createCommunication(state, payload) {
  ensureCrmState(state);
  const communicationId = getNextId(state, 'COM');
  state.crmData.communicationsById[communicationId] = {
    id: communicationId,
    entityType: payload.entityType,
    entityId: payload.entityId,
    channel: payload.channel,
    direction: payload.direction || 'outbound',
    subject: payload.subject,
    summary: payload.summary,
    actorId: getUserContext(state).id,
    actorName: getUserContext(state).name,
    timestamp: nowIso()
  };
  logAudit(state, 'create', 'communication', communicationId, null, state.crmData.communicationsById[communicationId]);
  return { ok: true, communicationId };
}

export function createSupportTicket(state, payload) {
  ensureCrmState(state);
  const ticketId = getNextId(state, 'TKT');
  state.crmData.supportTicketsById[ticketId] = {
    id: ticketId,
    customerId: payload.customerId,
    type: payload.type,
    priority: payload.priority,
    status: payload.status || 'open',
    subject: payload.subject,
    description: payload.description || '',
    openedAt: nowIso(),
    slaDueAt: payload.slaDueAt || null,
    resolutionNotes: ''
  };
  logAudit(state, 'create', 'ticket', ticketId, null, state.crmData.supportTicketsById[ticketId]);
  return { ok: true, ticketId };
}

export function createAttachment(state, payload) {
  ensureCrmState(state);
  const attachmentId = getNextId(state, 'ATT');
  state.crmData.attachmentsById[attachmentId] = {
    id: attachmentId,
    customerId: payload.customerId,
    documentType: payload.documentType,
    filename: payload.filename,
    storageRef: payload.storageRef || `mock://uploads/${payload.filename}`,
    uploadedBy: getUserContext(state).name,
    uploadedAt: nowIso()
  };
  logAudit(state, 'create', 'attachment', attachmentId, null, state.crmData.attachmentsById[attachmentId]);
  return { ok: true, attachmentId };
}

export function createPaymentRecord(state, payload) {
  ensureCrmState(state);
  const paymentId = getNextId(state, 'PAY');
  state.crmData.paymentsById[paymentId] = {
    id: paymentId,
    customerId: payload.customerId,
    invoiceId: payload.invoiceId || null,
    date: payload.date || todayIso(),
    amount: Number(payload.amount || 0),
    method: payload.method || 'Cash',
    reference: payload.reference || '',
    transactionId: payload.transactionId || '',
    notes: payload.notes || '',
    status: payload.status || 'received'
  };
  if (payload.invoiceId) {
    const allocationId = getNextId(state, 'PAL', [...Object.keys(state.paymentAllocationsById), paymentId]);
    state.paymentAllocationsById[allocationId] = {
      id: allocationId,
      paymentId,
      invoiceId: payload.invoiceId,
      customerId: payload.customerId,
      amount: Number(payload.amount || 0),
      allocatedAt: payload.date || todayIso()
    };
  }
  logAudit(state, 'create', 'payment', paymentId, null, state.crmData.paymentsById[paymentId], 'Sales');
  return { ok: true, paymentId };
}

export function createRefundRecord(state, payload) {
  ensureCrmState(state);
  const refundId = getNextId(state, 'REF');
  state.crmData.refundsById[refundId] = {
    id: refundId,
    customerId: payload.customerId,
    date: payload.date || todayIso(),
    amount: Number(payload.amount || 0),
    reason: payload.reason || ''
  };
  logAudit(state, 'create', 'refund', refundId, null, state.crmData.refundsById[refundId], 'Sales');
  return { ok: true, refundId };
}

export function getInvoicePayments(state, invoiceId) {
  return getInvoicePaymentsInternal(state, invoiceId);
}

export function getInvoiceById(state, invoiceId) {
  ensureCrmState(state);
  return (state.invoices || []).find((invoice) => invoice.id === invoiceId) || null;
}

export function getInvoiceAgingSummary(state) {
  ensureCrmState(state);
  return (state.invoices || []).reduce((summary, invoice) => {
    if (!(invoice.dueAmount > 0) || invoice.status === 'cancelled') return summary;
    if (invoice.dueDate >= todayIso()) {
      summary.current += invoice.dueAmount;
    } else {
      const ageDays = getDaysDiff(invoice.dueDate);
      if (ageDays <= 30) summary.bucket0to30 += invoice.dueAmount;
      else if (ageDays <= 60) summary.bucket31to60 += invoice.dueAmount;
      else if (ageDays <= 90) summary.bucket61to90 += invoice.dueAmount;
      else summary.bucket90plus += invoice.dueAmount;
    }
    return summary;
  }, {
    current: 0,
    bucket0to30: 0,
    bucket31to60: 0,
    bucket61to90: 0,
    bucket90plus: 0
  });
}

export function getSalesDashboardSummary(state) {
  ensureCrmState(state);
  const invoices = (state.invoices || []).filter((invoice) => invoice.status !== 'cancelled');
  const payments = mapValues(state.crmData.paymentsById);
  const currentMonth = todayIso().slice(0, 7);
  const monthlySales = invoices
    .filter((invoice) => String(invoice.issueDate || invoice.date).startsWith(currentMonth))
    .reduce((sum, invoice) => sum + Number(invoice.total || 0), 0);
  const collectedThisMonth = payments
    .filter((payment) => String(payment.date).startsWith(currentMonth))
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const openReceivables = invoices
    .filter((invoice) => isInvoiceOpenStatus(invoice.status))
    .reduce((sum, invoice) => sum + Number(invoice.dueAmount || 0), 0);
  const overdueReceivables = invoices
    .filter((invoice) => invoice.status === 'overdue')
    .reduce((sum, invoice) => sum + Number(invoice.dueAmount || 0), 0);
  const averageInvoiceValue = invoices.length
    ? invoices.reduce((sum, invoice) => sum + Number(invoice.total || 0), 0) / invoices.length
    : 0;
  const collectibleTotal = invoices
    .filter((invoice) => isInvoiceCollectible(invoice.status))
    .reduce((sum, invoice) => sum + Number(invoice.total || 0), 0);
  const collectionRate = collectibleTotal > 0 ? (collectedThisMonth / collectibleTotal) * 100 : 0;

  return {
    monthlySales,
    collectedThisMonth,
    openReceivables,
    overdueReceivables,
    averageInvoiceValue,
    collectionRate,
    aging: getInvoiceAgingSummary(state)
  };
}

export function getCustomerLedger(state, customerId) {
  ensureCrmState(state);
  const invoices = (state.invoices || [])
    .filter((invoice) => invoice.customerId === customerId)
    .sort((a, b) => String(b.issueDate || b.date).localeCompare(String(a.issueDate || a.date)));
  const rows = [
    ...invoices.map((invoice) => ({
      id: `invoice-${invoice.id}`,
      type: 'invoice',
      date: invoice.issueDate || invoice.date,
      reference: invoice.id,
      status: invoice.status,
      debit: invoice.status === 'cancelled' ? 0 : Number(invoice.total || 0),
      credit: 0,
      balanceImpact: Number(invoice.dueAmount || 0)
    })),
    ...mapValues(state.crmData.paymentsById)
      .filter((payment) => payment.customerId === customerId)
      .map((payment) => ({
        id: `payment-${payment.id}`,
        type: 'payment',
        date: payment.date,
        reference: payment.invoiceId ? `${payment.id} / ${payment.invoiceId}` : payment.id,
        status: payment.status,
        debit: 0,
        credit: Number(payment.amount || 0),
        balanceImpact: Number(payment.amount || 0) * -1
      }))
  ].sort((a, b) => String(b.date).localeCompare(String(a.date)));
  let runningBalance = 0;
  const ordered = [...rows].reverse().map((row) => {
    runningBalance += row.debit - row.credit;
    return { ...row, runningBalance };
  }).reverse();
  return ordered;
}

export function syncInvoiceBalances(state) {
  ensureCrmState(state);
  normalizeInvoices(state);
  return state.invoices;
}

export function approveInvoice(state, invoiceId, options = {}) {
  ensureCrmState(state);
  const invoice = getInvoiceById(state, invoiceId);
  if (!invoice) return { ok: false, error: 'Invoice not found' };
  invoice.approvalStatus = 'approved';
  state.invoiceApprovalsById[invoiceId] = {
    invoiceId,
    status: 'approved',
    approvedAt: nowIso(),
    approvedBy: options.approvedBy || getUserContext(state).name,
    note: options.note || ''
  };
  logAudit(state, 'approve', 'invoice', invoiceId, null, state.invoiceApprovalsById[invoiceId], 'Sales');
  return { ok: true, invoice };
}

export function transitionInvoiceLifecycle(state, invoiceId, nextStatus, options = {}) {
  ensureCrmState(state);
  const invoice = getInvoiceById(state, invoiceId);
  if (!invoice) return { ok: false, error: 'Invoice not found' };

  if (nextStatus === 'sent') {
    if (invoice.approvalStatus !== 'approved') {
      return { ok: false, error: 'Invoice must be approved before sending.' };
    }
    invoice.sentAt = options.sentAt || nowIso();
    invoice.postedAt = invoice.postedAt || (options.postedAt || nowIso());
    invoice.isPosted = true;
  } else if (nextStatus === 'cancelled') {
    if ((invoice.paidAmount || 0) > 0) {
      return { ok: false, error: 'Paid or partially paid invoices cannot be cancelled.' };
    }
    invoice.cancelledAt = options.cancelledAt || nowIso();
    invoice.isPosted = false;
  } else if (nextStatus === 'draft') {
    invoice.postedAt = null;
    invoice.sentAt = null;
    invoice.isPosted = false;
  }

  invoice.status = nextStatus;
  normalizeInvoiceRecord(state, invoice);
  logAudit(state, 'lifecycle', 'invoice', invoiceId, null, { status: invoice.status }, 'Sales');
  return { ok: true, invoice };
}

export function createRecurringInvoiceTemplate(state, payload) {
  ensureCrmState(state);
  const recurringId = getNextId(state, 'REC', Object.keys(state.recurringInvoicesById));
  state.recurringInvoicesById[recurringId] = {
    id: recurringId,
    customerId: payload.customerId,
    invoiceId: payload.invoiceId || null,
    frequency: payload.frequency || 'monthly',
    nextRunDate: payload.nextRunDate || addDaysToIso(todayIso(), 30),
    status: payload.status || 'active',
    template: clone(payload.template || {}),
    createdAt: nowIso(),
    createdBy: getUserContext(state).name
  };
  logAudit(state, 'create', 'recurring-invoice', recurringId, null, state.recurringInvoicesById[recurringId], 'Sales');
  return { ok: true, recurringId };
}

export function generateRecurringInvoice(state, recurringId) {
  ensureCrmState(state);
  const recurring = state.recurringInvoicesById[recurringId];
  if (!recurring) return { ok: false, error: 'Recurring template not found' };
  const template = clone(recurring.template || {});
  const nextSequence = (state.invoices || []).length + 1;
  const issueDate = recurring.nextRunDate || todayIso();
  const invoiceId = `INV-2026-${String(10000 + nextSequence).slice(1)}`;
  const terms = template.terms || 'Net 30';
  const invoice = normalizeInvoiceRecord(state, {
    id: invoiceId,
    customerId: recurring.customerId,
    issueDate,
    dueDate: template.dueDate || addDaysToIso(issueDate, getTermDays(terms)),
    items: clone(template.items || []),
    subtotal: Number(template.subtotal || 0),
    discountAmount: Number(template.discountAmount || 0),
    taxAmount: Number(template.taxAmount || 0),
    total: Number(template.total || 0),
    amount: Number(template.total || 0),
    currency: template.currency || 'USD',
    terms,
    approvalStatus: 'approved',
    postedAt: issueDate,
    isPosted: true,
    sentAt: issueDate,
    customerSnapshot: template.customerSnapshot || null,
    sourceType: 'recurring',
    sourceId: recurringId,
    recurringTemplateId: recurringId,
    status: 'sent'
  });
  state.invoices.push(invoice);
  recurring.lastRunDate = issueDate;
  recurring.nextRunDate = recurring.frequency === 'weekly' ? addDaysToIso(issueDate, 7) : recurring.frequency === 'quarterly' ? addDaysToIso(issueDate, 90) : addDaysToIso(issueDate, 30);
  syncInvoiceBalances(state);
  return { ok: true, invoice };
}

export function upsertCustomerSalesSummary(state, customerId) {
  ensureCrmState(state);
  state.crmCustomers = buildLegacyCustomerList(state);
  const customer = state.crmData.customersById[customerId];
  if (!customer) return;
  const summary = getCustomerFinancialSummary(state, customerId);
  customer.status = summary.totalDue > 0 ? (summary.agingSummary.overLimitFlag ? 'credit-hold' : 'overdue') : (customer.inactiveSince ? 'inactive' : 'active');
  customer.updatedAt = nowIso();
  customer.updatedBy = getUserContext(state).name;
}

export function exportCustomersCsv(state, customerIds = null) {
  const customers = getCustomerList(state).filter((customer) => !customerIds || customerIds.includes(customer.id));
  const header = [
    'Customer ID',
    'Name',
    'Company',
    'Status',
    'Owner',
    'Branch',
    'Territory',
    'Category',
    'Credit Limit',
    'Total Sales',
    'Outstanding Due',
    'Last Purchase',
    'Last Activity'
  ];
  const rows = customers.map((customer) => [
    customer.id,
    customer.name,
    customer.company,
    customer.status,
    customer.ownerName,
    customer.branch,
    customer.territory,
    customer.category,
    customer.creditLimit,
    customer.totalSales,
    customer.totalDue,
    customer.lastPurchaseDate || '',
    customer.lastActivityDate || ''
  ]);
  return [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
}

export function getCustomerTemplateCsv() {
  return [
    'name,company,contactName,contactDesignation,email,phone,status,companyType,category,tags,creditLimit,paymentTerms,ownerName,branch,territory,billingAddress,shippingAddress,taxVatNumber,tradeLicenseNumber',
    'Amina Rahman,North Star Distribution,Amina Rahman,Director,amina@northstar.com,+8801700000000,active,Distributor,Wholesale,"Priority, Dhaka",30000,Net 30,Marcus Wright,Head Office,Dhaka Metro,12 Gulshan Ave,12 Gulshan Ave,VAT-9912,LIC-2201'
  ].join('\n');
}

