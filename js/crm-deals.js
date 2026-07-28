import { appReadyPromise, appState, saveAppState, initIcons } from '/js/shared.js';
import {
  DEAL_FOLLOW_UP_TYPES,
  DEAL_LOST_REASONS,
  DEAL_STAGE_LABELS,
  DEAL_STAGES,
  DEAL_STATUS_LABELS,
  DEAL_STATUSES,
  ensureCrmState,
  getCrmPermissions,
  getCustomerList,
  getDealById,
  getDealForecastSummary,
  getDealList,
  getDealMetrics,
  getDealTimeline,
  getLeadList,
  getOwnerOptions,
  createDeal,
  createDealActivity,
  createDealFollowUp,
  createDealNote,
  updateDeal,
  advanceDealStage,
  markDealWon,
  markDealLost
} from '/js/crm-service.js';

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-violet-100 text-violet-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-indigo-100 text-indigo-700'
];

const STAGE_STYLES = {
  'new-opportunity': { class: 'bg-blue-50 text-blue-700 border-blue-100', accent: 'bg-blue-500', column: 'border-blue-200 bg-blue-50/30' },
  discovery: { class: 'bg-violet-50 text-violet-700 border-violet-100', accent: 'bg-violet-500', column: 'border-violet-200 bg-violet-50/30' },
  'proposal-sent': { class: 'bg-purple-50 text-purple-700 border-purple-100', accent: 'bg-purple-500', column: 'border-purple-200 bg-purple-50/30' },
  negotiation: { class: 'bg-amber-50 text-amber-700 border-amber-100', accent: 'bg-amber-500', column: 'border-amber-200 bg-amber-50/30' },
  'verbal-agreement': { class: 'bg-teal-50 text-teal-700 border-teal-100', accent: 'bg-teal-500', column: 'border-teal-200 bg-teal-50/30' },
  won: { class: 'bg-emerald-50 text-emerald-700 border-emerald-100', accent: 'bg-emerald-500', column: 'border-emerald-200 bg-emerald-50/30' },
  lost: { class: 'bg-rose-50 text-rose-700 border-rose-100', accent: 'bg-rose-500', column: 'border-rose-200 bg-rose-50/30' }
};

function formatCurrency(value) {
  return `৳${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function escapeHtml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function getUiState() {
  ensureCrmState(appState);
  if (!appState.crmUi.dealQuickFilter) appState.crmUi.dealQuickFilter = 'all';
  return appState.crmUi;
}

function getPermissions() {
  const permissions = getCrmPermissions(appState);
  return {
    deal_view: permissions.view,
    deal_create: permissions.create,
    deal_edit: permissions.edit,
    deal_delete: permissions.delete,
    deal_assign: permissions.assign,
    deal_convert: permissions.convert,
    deal_export: permissions.export
  };
}

function nameInitials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function avatarColor(name) {
  const code = String(name || '').split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

function avatarHtml(name, sizeClass = 'w-9 h-9', textClass = 'text-[10px]') {
  return `<div class="${sizeClass} rounded-full ${avatarColor(name)} ${textClass} font-bold flex items-center justify-center shrink-0">${escapeHtml(nameInitials(name))}</div>`;
}

function getStatusBadgeClass(status) {
  if (status === 'won') return 'bg-emerald-50 text-emerald-700 border border-emerald-100';
  if (status === 'lost' || status === 'cancelled') return 'bg-rose-50 text-rose-700 border border-rose-100';
  if (status === 'on-hold') return 'bg-amber-50 text-amber-700 border border-amber-100';
  return 'bg-blue-50 text-blue-700 border border-blue-100';
}

function stageBadgeHtml(stage) {
  const style = STAGE_STYLES[stage] || { class: 'bg-slate-50 text-slate-600 border-slate-200' };
  const label = DEAL_STAGE_LABELS[stage] || stage;
  return `<span class="inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold border ${style.class}">${escapeHtml(label)}</span>`;
}

function statusBadgeHtml(status) {
  return `<span class="inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${getStatusBadgeClass(status)}">${escapeHtml(DEAL_STATUS_LABELS[status] || status)}</span>`;
}

function probabilityBarHtml(percent) {
  const p = Math.min(100, Math.max(0, Number(percent || 0)));
  const barColor = p >= 70 ? 'bg-emerald-500' : p >= 40 ? 'bg-amber-500' : 'bg-slate-400';
  return `
    <div class="flex flex-col gap-1 min-w-[72px]">
      <span class="text-[10px] font-bold text-slate-600">${p}%</span>
      <div class="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
        <div class="h-full ${barColor} rounded-full" style="width:${p}%"></div>
      </div>
    </div>
  `;
}

function isClosingThisMonth(dateStr) {
  if (!dateStr) return false;
  const currentMonth = new Date().toISOString().slice(0, 7);
  return String(dateStr).startsWith(currentMonth);
}

function closeDateMarkup(dateStr) {
  if (!dateStr) return '—';
  if (isClosingThisMonth(dateStr)) {
    return `<span class="text-amber-600 font-extrabold">${escapeHtml(formatDate(dateStr))}</span>`;
  }
  return `<span class="text-slate-600">${escapeHtml(formatDate(dateStr))}</span>`;
}

function timelineEntryStyle(type, title = '') {
  const t = String(title).toLowerCase();
  if (type === 'stage') return { border: 'border-l-indigo-500', dot: 'bg-indigo-500', bg: 'bg-indigo-50/40' };
  if (type === 'note') return { border: 'border-l-slate-400', dot: 'bg-slate-400', bg: 'bg-slate-50' };
  if (type === 'follow-up') return { border: 'border-l-amber-500', dot: 'bg-amber-500', bg: 'bg-amber-50/40' };
  if (t.includes('won')) return { border: 'border-l-emerald-500', dot: 'bg-emerald-500', bg: 'bg-emerald-50/40' };
  if (t.includes('lost')) return { border: 'border-l-rose-500', dot: 'bg-rose-500', bg: 'bg-rose-50/40' };
  return { border: 'border-l-blue-500', dot: 'bg-blue-500', bg: 'bg-blue-50/40' };
}

function saveAndRender() {
  saveAppState();
  renderDeals();
}

function getFilterValues() {
  return {
    search: document.getElementById('crm-deals-search')?.value.toLowerCase().trim() || '',
    stage: document.getElementById('crm-deals-filter-stage')?.value || 'all',
    status: document.getElementById('crm-deals-filter-status')?.value || 'all',
    owner: document.getElementById('crm-deals-filter-owner')?.value || 'all',
    dateFrom: document.getElementById('crm-deals-filter-date-from')?.value || '',
    dateTo: document.getElementById('crm-deals-filter-date-to')?.value || '',
    valueMin: Number(document.getElementById('crm-deals-filter-value-min')?.value || 0),
    valueMax: document.getElementById('crm-deals-filter-value-max')?.value ? Number(document.getElementById('crm-deals-filter-value-max').value) : null,
    company: document.getElementById('crm-deals-filter-company')?.value.toLowerCase().trim() || '',
    probabilityMin: document.getElementById('crm-deals-filter-probability')?.value ? Number(document.getElementById('crm-deals-filter-probability').value) : null,
    leadSource: document.getElementById('crm-deals-filter-source')?.value.toLowerCase().trim() || ''
  };
}

function hasActiveDealFilters() {
  const filters = getFilterValues();
  const quick = getUiState().dealQuickFilter;
  return !!(filters.search || filters.stage !== 'all' || filters.status !== 'all' || filters.owner !== 'all'
    || filters.dateFrom || filters.dateTo || filters.valueMin > 0 || filters.valueMax !== null
    || filters.company || filters.probabilityMin !== null || filters.leadSource
    || (quick && quick !== 'all'));
}

function getFilteredDeals() {
  const filters = getFilterValues();
  const quick = getUiState().dealQuickFilter;
  const currentMonth = new Date().toISOString().slice(0, 7);

  return getDealList(appState).filter((deal) => {
    const matchesSearch = !filters.search || [
      deal.title,
      deal.company,
      deal.contactPerson,
      deal.phone
    ].some((value) => String(value || '').toLowerCase().includes(filters.search));

    const matchesStage = filters.stage === 'all' || deal.stage === filters.stage;
    const matchesStatus = filters.status === 'all' || deal.status === filters.status;
    const matchesOwner = filters.owner === 'all' || deal.assignedRepId === filters.owner;
    const matchesDateFrom = !filters.dateFrom || String(deal.expectedCloseDate || '') >= filters.dateFrom;
    const matchesDateTo = !filters.dateTo || String(deal.expectedCloseDate || '') <= filters.dateTo;
    const value = Number(deal.expectedValue || 0);
    const matchesValueMin = value >= filters.valueMin;
    const matchesValueMax = filters.valueMax === null || value <= filters.valueMax;
    const matchesCompany = !filters.company || String(deal.company || '').toLowerCase().includes(filters.company);
    const matchesProbability = filters.probabilityMin === null || Number(deal.probability || 0) >= filters.probabilityMin;
    const matchesSource = !filters.leadSource || String(deal.leadSource || '').toLowerCase().includes(filters.leadSource);

    let matchesQuick = true;
    if (quick === 'open') matchesQuick = deal.status === 'open';
    else if (quick === 'won') matchesQuick = deal.status === 'won';
    else if (quick === 'lost') matchesQuick = deal.status === 'lost';
    else if (quick === 'closing-month') {
      matchesQuick = deal.status === 'open' && String(deal.expectedCloseDate || '').startsWith(currentMonth);
    }

    return matchesSearch && matchesStage && matchesStatus && matchesOwner && matchesDateFrom && matchesDateTo
      && matchesValueMin && matchesValueMax && matchesCompany && matchesProbability && matchesSource && matchesQuick;
  });
}

function getLeadName(leadId) {
  const lead = leadId ? appState.crmData.leadsById[leadId] : null;
  return lead ? lead.name : '—';
}

function updateQuickFilterChips() {
  const quick = getUiState().dealQuickFilter || 'all';
  document.querySelectorAll('.crm-deal-quick-chip').forEach((chip) => {
    const active = chip.getAttribute('data-quick') === quick;
    chip.className = active
      ? 'crm-deal-quick-chip px-2.5 py-1 rounded-full text-[10px] font-bold border border-blue-500 bg-blue-50 text-blue-700 cursor-pointer'
      : 'crm-deal-quick-chip px-2.5 py-1 rounded-full text-[10px] font-bold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 cursor-pointer';
  });
}

function updateDealViewToggle() {
  const ui = getUiState();
  const tableBtn = document.getElementById('crm-deal-view-table');
  const kanbanBtn = document.getElementById('crm-deal-view-kanban');
  if (ui.dealView === 'kanban') {
    if (tableBtn) tableBtn.className = 'crm-deal-view-btn px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-900 cursor-pointer';
    if (kanbanBtn) kanbanBtn.className = 'crm-deal-view-btn px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white cursor-pointer';
  } else {
    if (tableBtn) tableBtn.className = 'crm-deal-view-btn px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white cursor-pointer';
    if (kanbanBtn) kanbanBtn.className = 'crm-deal-view-btn px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-900 cursor-pointer';
  }
}

function renderMetrics(filteredDeals) {
  const metrics = getDealMetrics(appState, filteredDeals);
  const forecast = getDealForecastSummary(appState, filteredDeals);
  document.getElementById('crm-metric-deals-count').textContent = metrics.totalDeals;
  document.getElementById('crm-metric-pipeline').textContent = formatCurrency(metrics.pipelineValue);
  document.getElementById('crm-metric-deal-avg').textContent = formatCurrency(metrics.averageDealSize);
  document.getElementById('crm-metric-closing-month').textContent = metrics.dealsClosingThisMonth;
  document.getElementById('crm-metric-won-count').textContent = metrics.wonDeals;
  document.getElementById('crm-metric-lost-count').textContent = metrics.lostDeals;
  document.getElementById('crm-metric-forecast').textContent = formatCurrency(metrics.forecastValue);
  document.getElementById('crm-metric-forecast-sub').textContent = `${forecast.weightedCoverage.toFixed(1)}% weighted coverage across visible open deals`;
}

function actionButtonsHtml(deal, permissions) {
  const parts = [
    `<div class="inline-flex rounded-xl border border-sky-100 bg-sky-50 p-1 gap-1">
      <button type="button" onclick="window.selectDeal('${escapeHtml(deal.id)}')" title="View timeline" class="p-1.5 rounded-lg hover:bg-white cursor-pointer">
        <img src="/images/icons/actions/view.png" alt="View" class="w-4 h-4 object-contain pointer-events-none" />
      </button>
      ${permissions.deal_edit ? `<button type="button" onclick="window.openDealModal('${escapeHtml(deal.id)}')" title="Edit" class="p-1.5 rounded-lg hover:bg-white cursor-pointer">
        <img src="/images/icons/actions/edit.png" alt="Edit" class="w-4 h-4 object-contain pointer-events-none" />
      </button>` : ''}
    </div>`
  ];
  if (permissions.deal_edit && deal.status === 'open') {
    parts.push(`<button type="button" onclick="window.advanceDeal('${escapeHtml(deal.id)}')" class="px-2 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[10px] font-bold text-slate-600 cursor-pointer">Advance</button>`);
  }
  if (permissions.deal_convert && deal.status === 'open') {
    parts.push(`<button type="button" onclick="window.markDealWonAction('${escapeHtml(deal.id)}')" class="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold cursor-pointer">Won</button>`);
  }
  if (permissions.deal_edit && deal.status === 'open') {
    parts.push(`<button type="button" onclick="window.startDealLostFlow('${escapeHtml(deal.id)}')" class="px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold cursor-pointer">Lost</button>`);
  }
  return `<div class="flex flex-wrap items-center justify-center gap-1.5">${parts.join('')}</div>`;
}

function renderTable(deals) {
  const tbody = document.getElementById('crm-deals-body');
  if (!tbody) return;

  const permissions = getPermissions();
  const selectedId = getUiState().selectedDealId;

  if (deals.length === 0) {
    const filtered = hasActiveDealFilters();
    tbody.innerHTML = `
      <tr>
        <td colspan="10" class="p-12 text-center">
          <div class="flex flex-col items-center justify-center">
            <div class="w-16 h-16 rounded-xl ${filtered ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'} flex items-center justify-center mb-4">
              <i data-lucide="${filtered ? 'search' : 'briefcase'}" class="w-8 h-8"></i>
            </div>
            <h3 class="text-sm font-bold text-slate-900">${filtered ? 'No results match your filters' : 'No deals yet'}</h3>
            <p class="text-xs text-slate-500 font-medium mt-1 mb-4">${filtered ? 'Try adjusting your search or filter criteria.' : 'Add your first deal to start tracking the pipeline.'}</p>
            ${filtered
              ? '<button onclick="window.clearDealFilters()" class="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-4 py-2 rounded-xl cursor-pointer">Clear filters</button>'
              : '<button onclick="window.openDealModal()" class="bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-blue-700 cursor-pointer">Add deal</button>'}
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = deals.map((deal) => {
    const isSelected = deal.id === selectedId;
    const rowClass = isSelected ? 'bg-blue-50/60 border-l-2 border-l-blue-500' : 'hover:bg-slate-50';
    const displayName = deal.title || deal.company || 'Deal';
    return `
      <tr class="${rowClass} transition-colors">
        <td class="p-4">
          <button type="button" onclick="window.selectDeal('${escapeHtml(deal.id)}')" class="flex items-center gap-3 text-left cursor-pointer">
            ${avatarHtml(displayName)}
            <div class="min-w-0">
              <div class="font-bold text-slate-900 truncate">${escapeHtml(deal.title)}</div>
              <div class="text-[10px] text-slate-400 font-semibold truncate">${escapeHtml(deal.company || '—')}</div>
            </div>
          </button>
        </td>
        <td class="p-4 text-blue-600 font-semibold">${escapeHtml(getLeadName(deal.linkedLeadId))}</td>
        <td class="p-4">
          <div class="flex items-center gap-2">
            ${deal.assignedRepName ? avatarHtml(deal.assignedRepName, 'w-6 h-6', 'text-[8px]') : ''}
            <span>${escapeHtml(deal.assignedRepName || '—')}</span>
          </div>
        </td>
        <td class="p-4 text-right font-bold text-emerald-600">${formatCurrency(deal.expectedValue)}</td>
        <td class="p-4">${probabilityBarHtml(deal.probability)}</td>
        <td class="p-4">${stageBadgeHtml(deal.stage)}</td>
        <td class="p-4">${closeDateMarkup(deal.expectedCloseDate)}</td>
        <td class="p-4 text-slate-500">${escapeHtml(formatDate(deal.lastActivityAt))}</td>
        <td class="p-4">${statusBadgeHtml(deal.status)}</td>
        <td class="p-4">${actionButtonsHtml(deal, permissions)}</td>
      </tr>
    `;
  }).join('');
}

function renderKanban(deals) {
  const container = document.getElementById('crm-deals-kanban');
  if (!container) return;

  const selectedId = getUiState().selectedDealId;

  container.innerHTML = DEAL_STAGES.map((stage) => {
    const stageDeals = deals.filter((deal) => deal.stage === stage);
    const style = STAGE_STYLES[stage] || { accent: 'bg-slate-400', column: 'border-slate-200 bg-slate-50' };
    return `
      <div class="rounded-xl border ${style.column} flex flex-col gap-0 min-h-[300px] overflow-hidden">
        <div class="px-4 pt-3 pb-2 border-b border-slate-200/60">
          <div class="h-1 rounded-full ${style.accent} mb-2"></div>
          <div class="flex items-center justify-between gap-2">
            <h4 class="text-xs font-bold text-slate-700">${escapeHtml(DEAL_STAGE_LABELS[stage] || stage)}</h4>
            <span class="text-[11px] font-extrabold text-slate-400">${stageDeals.length}</span>
          </div>
        </div>
        <div class="p-3 flex-1 flex flex-col gap-2">
          ${stageDeals.map((deal) => {
            const isSelected = deal.id === selectedId;
            const ring = isSelected ? 'ring-2 ring-blue-400 border-blue-300' : 'border-slate-200 hover:border-blue-200';
            const displayName = deal.title || deal.company || 'Deal';
            return `
              <button type="button" onclick="window.selectDeal('${escapeHtml(deal.id)}')" class="bg-white p-3 rounded-xl border ${ring} space-y-2 text-left cursor-pointer transition-colors">
                <div class="flex items-start gap-2">
                  ${avatarHtml(displayName, 'w-7 h-7', 'text-[8px]')}
                  <div class="min-w-0 flex-1">
                    <div class="font-bold text-slate-900 text-xs truncate">${escapeHtml(deal.title)}</div>
                    <div class="text-[10px] text-slate-400 font-semibold truncate">${escapeHtml(deal.company || '—')}</div>
                  </div>
                </div>
                <div class="flex items-center justify-between gap-2">
                  <span class="text-[10px] font-bold text-emerald-600">${formatCurrency(deal.expectedValue)}</span>
                  ${deal.assignedRepName ? avatarHtml(deal.assignedRepName, 'w-5 h-5', 'text-[7px]') : ''}
                </div>
                ${probabilityBarHtml(deal.probability)}
                <div class="flex items-center gap-1.5">${statusBadgeHtml(deal.status)}</div>
              </button>
            `;
          }).join('') || '<div class="text-[11px] text-slate-400 font-semibold py-6 text-center border border-dashed border-slate-200 rounded-xl">Drop deals here</div>'}
        </div>
      </div>
    `;
  }).join('');
}

function renderSelectedDeal() {
  const ui = getUiState();
  const deal = ui.selectedDealId ? getDealById(appState, ui.selectedDealId) : null;
  const permissions = getPermissions();

  const summary = document.getElementById('crm-deal-summary');
  const summaryEmpty = document.getElementById('crm-deal-summary-empty');
  const sidePanel = document.getElementById('crm-deal-side-panel');
  const sideEmpty = document.getElementById('crm-deal-side-empty');

  if (!deal) {
    summary.classList.add('hidden');
    summaryEmpty.classList.remove('hidden');
    sidePanel.classList.add('hidden');
    sideEmpty.classList.remove('hidden');
    document.getElementById('crm-deal-timeline').innerHTML = '';
    return;
  }

  summary.classList.remove('hidden');
  summaryEmpty.classList.add('hidden');
  sidePanel.classList.remove('hidden');
  sideEmpty.classList.add('hidden');

  const displayName = deal.title || deal.company || 'Deal';
  const avatarEl = document.getElementById('crm-selected-deal-avatar');
  if (avatarEl) avatarEl.innerHTML = avatarHtml(displayName, 'w-14 h-14', 'text-sm');

  document.getElementById('crm-selected-deal-title').textContent = deal.title || '—';
  document.getElementById('crm-selected-deal-company').textContent = deal.company || '—';
  document.getElementById('crm-selected-deal-contact').textContent = deal.contactPerson || '—';
  document.getElementById('crm-selected-deal-phone').textContent = deal.phone || '—';
  document.getElementById('crm-selected-deal-source').textContent = deal.leadSource || '—';
  document.getElementById('crm-selected-deal-value').textContent = formatCurrency(deal.expectedValue);
  document.getElementById('crm-selected-deal-probability').textContent = `${Number(deal.probability || 0)}%`;
  document.getElementById('crm-selected-deal-forecast').textContent = formatCurrency((Number(deal.expectedValue || 0) * Number(deal.probability || 0)) / 100);
  document.getElementById('crm-selected-deal-close-date').textContent = formatDate(deal.expectedCloseDate);
  document.getElementById('crm-selected-deal-owner').textContent = deal.assignedRepName || '—';
  document.getElementById('crm-selected-followup-date').textContent = deal.followUpDate ? formatDate(deal.followUpDate) : '—';
  document.getElementById('crm-selected-followup-type').textContent = deal.followUpType || '—';
  document.getElementById('crm-selected-followup-owner').textContent = deal.followUpAssignedUserName || '—';
  document.getElementById('crm-selected-last-activity').textContent = formatDate(deal.lastActivityAt);

  const stageBadge = document.getElementById('crm-selected-deal-stage-badge');
  const stageStyle = STAGE_STYLES[deal.stage] || { class: 'bg-slate-50 text-slate-600 border-slate-200' };
  stageBadge.textContent = DEAL_STAGE_LABELS[deal.stage] || deal.stage;
  stageBadge.className = `px-2 py-0.5 rounded-full text-[9px] font-bold border ${stageStyle.class}`;

  const statusBadge = document.getElementById('crm-selected-deal-status-badge');
  statusBadge.textContent = DEAL_STATUS_LABELS[deal.status] || deal.status;
  statusBadge.className = `px-2 py-0.5 rounded-full text-[9px] font-bold ${getStatusBadgeClass(deal.status)}`;

  const followUpCard = document.getElementById('crm-selected-followup-card');
  if (followUpCard && deal.followUpDate) {
    const todayStr = new Date().toISOString().slice(0, 10);
    const isOverdue = deal.followUpDate < todayStr;
    const isToday = deal.followUpDate === todayStr;
    followUpCard.className = isOverdue
      ? 'bg-rose-50 p-4 rounded-xl border border-rose-100 space-y-1'
      : isToday
        ? 'bg-amber-50 p-4 rounded-xl border border-amber-100 space-y-1'
        : 'bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1';
  } else if (followUpCard) {
    followUpCard.className = 'bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1';
  }

  const editBtn = document.getElementById('crm-selected-deal-edit-btn');
  const advanceBtn = document.getElementById('crm-selected-deal-advance-btn');
  const wonBtn = document.getElementById('crm-selected-deal-won-btn');
  const lostBtn = document.getElementById('crm-selected-deal-lost-btn');

  const canEdit = !!permissions.deal_edit;
  const canAdvance = canEdit && deal.status === 'open';
  const canMarkWon = !!permissions.deal_convert && deal.status === 'open';
  const canMarkLost = canEdit && deal.status === 'open';

  const mutedBtn = 'border border-slate-200 bg-slate-100 text-slate-400 text-xs font-semibold px-3 py-2 rounded-xl cursor-not-allowed';
  const advanceActive = 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl cursor-pointer';
  const wonActive = 'bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-2 rounded-xl cursor-pointer';
  const lostActive = 'bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-3 py-2 rounded-xl cursor-pointer';
  const editActive = 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl cursor-pointer';

  editBtn.disabled = !canEdit;
  editBtn.className = canEdit ? editActive : mutedBtn;
  advanceBtn.disabled = !canAdvance;
  advanceBtn.className = canAdvance ? advanceActive : mutedBtn;
  wonBtn.disabled = !canMarkWon;
  wonBtn.className = canMarkWon ? wonActive : mutedBtn;
  lostBtn.disabled = !canMarkLost;
  lostBtn.className = canMarkLost ? lostActive : mutedBtn;

  document.getElementById('crm-selected-deal-stage-help').textContent = deal.status === 'open'
    ? 'Use these actions to move the selected deal through the pipeline.'
    : `This deal is already ${DEAL_STATUS_LABELS[deal.status] || deal.status}.`;

  [
    'crm-deal-note-input',
    'crm-deal-activity-type',
    'crm-deal-activity-date',
    'crm-deal-activity-summary',
    'crm-deal-activity-notes',
    'crm-deal-followup-date',
    'crm-deal-followup-type',
    'crm-deal-followup-owner',
    'crm-deal-followup-notes'
  ].forEach((id) => {
    const field = document.getElementById(id);
    if (field) field.disabled = !permissions.deal_edit;
  });
  document.querySelector('#crm-deal-note-form button[type="submit"]').disabled = !permissions.deal_edit;
  document.querySelector('#crm-deal-activity-form button[type="submit"]').disabled = !permissions.deal_edit;
  document.querySelector('#crm-deal-followup-form button[type="submit"]').disabled = !permissions.deal_edit;

  document.getElementById('crm-deal-followup-owner').value = deal.followUpAssignedUserId || deal.assignedRepId || '';
  document.getElementById('crm-deal-followup-type').value = deal.followUpType || DEAL_FOLLOW_UP_TYPES[0];

  const timeline = getDealTimeline(appState, deal.id);
  document.getElementById('crm-deal-timeline').innerHTML = timeline.length ? timeline.map((entry) => {
    const style = timelineEntryStyle(entry.type, entry.title);
    return `
      <div class="border border-slate-100 border-l-4 ${style.border} rounded-xl p-3 ${style.bg} space-y-1">
        <div class="flex items-start gap-2">
          <span class="w-2 h-2 rounded-full ${style.dot} mt-1 shrink-0"></span>
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between gap-3">
              <div class="text-xs font-extrabold text-slate-900">${escapeHtml(entry.title)}</div>
              <div class="text-[10px] text-slate-400 font-semibold whitespace-nowrap">${formatDate(entry.timestamp)}</div>
            </div>
            ${entry.meta ? `<div class="text-[11px] text-slate-500 font-semibold mt-0.5">${escapeHtml(entry.meta)}</div>` : ''}
            <div class="text-xs text-slate-700 font-medium mt-1">${escapeHtml(entry.body || '—')}</div>
          </div>
        </div>
      </div>
    `;
  }).join('') : '<div class="text-xs text-slate-400 font-semibold py-6 text-center border border-dashed border-slate-200 rounded-xl">No timeline records yet for this deal.</div>';
}

function renderDeals() {
  const ui = getUiState();
  const deals = getFilteredDeals();
  renderMetrics(deals);
  updateQuickFilterChips();
  updateDealViewToggle();

  if (ui.dealView === 'kanban') {
    document.getElementById('crm-deals-kanban').classList.remove('hidden');
    document.getElementById('crm-deals-table-container').classList.add('hidden');
    renderKanban(deals);
  } else {
    document.getElementById('crm-deals-kanban').classList.add('hidden');
    document.getElementById('crm-deals-table-container').classList.remove('hidden');
    renderTable(deals);
  }

  if (!ui.selectedDealId && deals[0]) {
    ui.selectedDealId = deals[0].id;
  } else if (ui.selectedDealId && !deals.some((deal) => deal.id === ui.selectedDealId)) {
    ui.selectedDealId = deals[0]?.id || null;
  }

  renderSelectedDeal();
  initIcons();
}

function populateFilterSelects() {
  const stageSelect = document.getElementById('crm-deals-filter-stage');
  if (stageSelect) {
    stageSelect.innerHTML = '<option value="all">All stages</option>';
    DEAL_STAGES.forEach((stage) => {
      stageSelect.innerHTML += `<option value="${stage}">${escapeHtml(DEAL_STAGE_LABELS[stage])}</option>`;
    });
  }

  const statusSelect = document.getElementById('crm-deals-filter-status');
  if (statusSelect) {
    statusSelect.innerHTML = '<option value="all">All statuses</option>';
    DEAL_STATUSES.forEach((status) => {
      statusSelect.innerHTML += `<option value="${status}">${escapeHtml(DEAL_STATUS_LABELS[status])}</option>`;
    });
  }

  const ownerFilter = document.getElementById('crm-deals-filter-owner');
  if (ownerFilter) {
    ownerFilter.innerHTML = '<option value="all">All reps</option>';
    getOwnerOptions(appState).forEach((owner) => {
      ownerFilter.innerHTML += `<option value="${owner.id}">${escapeHtml(owner.name)}</option>`;
    });
  }
}

function populateFormSelects() {
  const ownerSelect = document.getElementById('crm-deal-owner');
  const followUpOwnerSelect = document.getElementById('crm-deal-followup-owner-input');
  const sideFollowUpOwner = document.getElementById('crm-deal-followup-owner');
  const owners = getOwnerOptions(appState);

  [ownerSelect, followUpOwnerSelect, sideFollowUpOwner].forEach((select) => {
    if (!select) return;
    select.innerHTML = '';
  });

  owners.forEach((owner) => {
    const option = `<option value="${owner.id}">${escapeHtml(owner.name)}</option>`;
    if (ownerSelect) ownerSelect.innerHTML += option;
    if (followUpOwnerSelect) followUpOwnerSelect.innerHTML += option;
    if (sideFollowUpOwner) sideFollowUpOwner.innerHTML += option;
  });

  const leadSelect = document.getElementById('crm-deal-lead');
  if (leadSelect) {
    const leads = getLeadList(appState);
    leadSelect.innerHTML = '<option value="">Select Lead (Optional)</option>';
    leads.forEach((lead) => {
      leadSelect.innerHTML += `<option value="${lead.id}">${escapeHtml(lead.name)} · ${escapeHtml(lead.company)}</option>`;
    });
  }

  const customerSelect = document.getElementById('crm-deal-customer');
  if (customerSelect) {
    customerSelect.innerHTML = '<option value="">Select Customer (Optional)</option>';
    getCustomerList(appState).forEach((customer) => {
      customerSelect.innerHTML += `<option value="${customer.id}">${escapeHtml(customer.name)} · ${escapeHtml(customer.company)}</option>`;
    });
  }

  const stageSelect = document.getElementById('crm-deal-stage');
  if (stageSelect) {
    stageSelect.innerHTML = '';
    DEAL_STAGES.forEach((stage) => {
      stageSelect.innerHTML += `<option value="${stage}">${escapeHtml(DEAL_STAGE_LABELS[stage])}</option>`;
    });
  }

  const statusSelect = document.getElementById('crm-deal-status');
  if (statusSelect) {
    statusSelect.innerHTML = '';
    DEAL_STATUSES.forEach((status) => {
      statusSelect.innerHTML += `<option value="${status}">${escapeHtml(DEAL_STATUS_LABELS[status])}</option>`;
    });
  }

  const followUpTypeSelect = document.getElementById('crm-deal-followup-type-input');
  const sideFollowUpType = document.getElementById('crm-deal-followup-type');
  [followUpTypeSelect, sideFollowUpType].forEach((select) => {
    if (!select) return;
    select.innerHTML = '';
    DEAL_FOLLOW_UP_TYPES.forEach((type) => {
      select.innerHTML += `<option value="${type}">${escapeHtml(type)}</option>`;
    });
  });

  const lostReasonSelect = document.getElementById('crm-deal-loss-reason');
  if (lostReasonSelect) {
    lostReasonSelect.innerHTML = '';
    DEAL_LOST_REASONS.forEach((reason) => {
      lostReasonSelect.innerHTML += `<option value="${reason}">${escapeHtml(reason)}</option>`;
    });
  }
}

function resetForm() {
  document.getElementById('crm-deal-form').reset();
  document.getElementById('crm-deal-id').value = '';
  document.getElementById('crm-deal-form-title').textContent = 'Create Deal';
  document.getElementById('crm-deal-status').value = 'open';
  document.getElementById('crm-deal-stage').value = 'new-opportunity';
  document.getElementById('crm-deal-probability').value = '50';
  document.getElementById('crm-deal-close-date').value = new Date().toISOString().slice(0, 10);
  document.getElementById('crm-deal-followup-date-input').value = '';
  document.getElementById('crm-deal-followup-type-input').value = DEAL_FOLLOW_UP_TYPES[0];
  document.getElementById('crm-deal-advanced-section').classList.add('hidden');
  const icon = document.getElementById('crm-deal-advanced-icon');
  if (icon) icon.style.transform = 'rotate(0deg)';
}

window.switchDealView = function switchDealView(view) {
  getUiState().dealView = view === 'kanban' ? 'kanban' : 'table';
  saveAppState();
  renderDeals();
};

window.setDealQuickFilter = function setDealQuickFilter(key) {
  const ui = getUiState();
  ui.dealQuickFilter = key;
  if (key === 'open') {
    document.getElementById('crm-deals-filter-status').value = 'open';
  } else if (key === 'won') {
    document.getElementById('crm-deals-filter-status').value = 'won';
  } else if (key === 'lost') {
    document.getElementById('crm-deals-filter-status').value = 'lost';
  } else if (key === 'all') {
    document.getElementById('crm-deals-filter-status').value = 'all';
  }
  renderDeals();
};

window.showDealsMainView = function showDealsMainView() {
  document.getElementById('crm-deals-main-view').classList.remove('hidden');
  document.getElementById('crm-deals-form-view').classList.add('hidden');
};

window.showDealsFormView = function showDealsFormView() {
  document.getElementById('crm-deals-main-view').classList.add('hidden');
  document.getElementById('crm-deals-form-view').classList.remove('hidden');
};

window.openDealModal = function openDealModal(dealId = '') {
  populateFormSelects();
  resetForm();

  if (dealId) {
    const deal = getDealById(appState, dealId);
    if (deal) {
      document.getElementById('crm-deal-id').value = deal.id;
      document.getElementById('crm-deal-form-title').textContent = 'Edit Deal';
      document.getElementById('crm-deal-title').value = deal.title || '';
      document.getElementById('crm-deal-company').value = deal.company || '';
      document.getElementById('crm-deal-contact-person').value = deal.contactPerson || '';
      document.getElementById('crm-deal-phone').value = deal.phone || '';
      document.getElementById('crm-deal-owner').value = deal.assignedRepId || '';
      document.getElementById('crm-deal-lead').value = deal.linkedLeadId || '';
      document.getElementById('crm-deal-stage').value = deal.stage || 'new-opportunity';
      document.getElementById('crm-deal-status').value = deal.status || 'open';
      document.getElementById('crm-deal-value').value = deal.expectedValue || 0;
      document.getElementById('crm-deal-probability').value = deal.probability || 50;
      document.getElementById('crm-deal-close-date').value = deal.expectedCloseDate || '';
      document.getElementById('crm-deal-customer').value = deal.linkedCustomerId || '';
      document.getElementById('crm-deal-products').value = deal.productsSummary || '';
      document.getElementById('crm-deal-followup-date-input').value = deal.followUpDate || '';
      document.getElementById('crm-deal-followup-type-input').value = deal.followUpType || DEAL_FOLLOW_UP_TYPES[0];
      document.getElementById('crm-deal-followup-owner-input').value = deal.followUpAssignedUserId || deal.assignedRepId || '';
      document.getElementById('crm-deal-followup-notes-input').value = deal.followUpNotes || '';
      document.getElementById('crm-deal-lead-source').value = deal.leadSource || '';
      document.getElementById('crm-deal-competitor').value = deal.competitor || '';
      document.getElementById('crm-deal-remarks').value = deal.internalRemarks || '';
    }
  }

  window.showDealsFormView();
  initIcons();
};

window.handleDealSubmit = function handleDealSubmit(event) {
  event.preventDefault();

  const dealId = document.getElementById('crm-deal-id').value;
  const ownerSelect = document.getElementById('crm-deal-owner');
  const followUpOwnerSelect = document.getElementById('crm-deal-followup-owner-input');

  const payload = {
    title: document.getElementById('crm-deal-title').value.trim(),
    company: document.getElementById('crm-deal-company').value.trim(),
    contactPerson: document.getElementById('crm-deal-contact-person').value.trim(),
    phone: document.getElementById('crm-deal-phone').value.trim(),
    assignedRepId: ownerSelect.value,
    assignedRepName: ownerSelect.options[ownerSelect.selectedIndex]?.text || '',
    linkedLeadId: document.getElementById('crm-deal-lead').value || null,
    stage: document.getElementById('crm-deal-stage').value,
    status: document.getElementById('crm-deal-status').value,
    expectedValue: document.getElementById('crm-deal-value').value,
    probability: document.getElementById('crm-deal-probability').value || 50,
    expectedCloseDate: document.getElementById('crm-deal-close-date').value,
    linkedCustomerId: document.getElementById('crm-deal-customer').value || null,
    productsSummary: document.getElementById('crm-deal-products').value.trim(),
    followUpDate: document.getElementById('crm-deal-followup-date-input').value || '',
    followUpType: document.getElementById('crm-deal-followup-type-input').value,
    followUpAssignedUserId: followUpOwnerSelect.value,
    followUpAssignedUserName: followUpOwnerSelect.options[followUpOwnerSelect.selectedIndex]?.text || '',
    followUpNotes: document.getElementById('crm-deal-followup-notes-input').value.trim(),
    leadSource: document.getElementById('crm-deal-lead-source').value.trim(),
    competitor: document.getElementById('crm-deal-competitor').value.trim(),
    internalRemarks: document.getElementById('crm-deal-remarks').value.trim(),
    notes: document.getElementById('crm-deal-initial-note').value.trim()
  };

  const result = dealId ? updateDeal(appState, dealId, payload) : createDeal(appState, payload);
  if (!result.ok) {
    alert(result.error || 'Unable to save deal.');
    return;
  }

  getUiState().selectedDealId = dealId || result.dealId;
  window.showDealsMainView();
  saveAndRender();
};

window.handleDealFilterChange = function handleDealFilterChange() {
  getUiState().dealQuickFilter = 'all';
  renderDeals();
};

window.toggleDealFilters = function toggleDealFilters() {
  const ui = getUiState();
  ui.dealFiltersOpen = !ui.dealFiltersOpen;
  document.getElementById('crm-deals-advanced-filters').classList.toggle('hidden', !ui.dealFiltersOpen);
};

window.clearDealFilters = function clearDealFilters() {
  [
    'crm-deals-search',
    'crm-deals-filter-date-from',
    'crm-deals-filter-date-to',
    'crm-deals-filter-value-min',
    'crm-deals-filter-value-max',
    'crm-deals-filter-company',
    'crm-deals-filter-probability',
    'crm-deals-filter-source'
  ].forEach((id) => {
    const element = document.getElementById(id);
    if (element) element.value = '';
  });
  document.getElementById('crm-deals-filter-stage').value = 'all';
  document.getElementById('crm-deals-filter-status').value = 'all';
  document.getElementById('crm-deals-filter-owner').value = 'all';
  getUiState().dealQuickFilter = 'all';
  renderDeals();
};

window.selectDeal = function selectDeal(dealId) {
  getUiState().selectedDealId = dealId;
  renderDeals();
};

window.editSelectedDeal = function editSelectedDeal() {
  const dealId = getUiState().selectedDealId;
  if (dealId) window.openDealModal(dealId);
};

window.advanceDeal = function advanceDeal(dealId) {
  const result = advanceDealStage(appState, dealId);
  if (!result.ok) {
    alert(result.error || 'Unable to advance stage.');
    return;
  }
  getUiState().selectedDealId = dealId;
  saveAndRender();
};

window.advanceSelectedDealStage = function advanceSelectedDealStage() {
  const dealId = getUiState().selectedDealId;
  if (dealId) window.advanceDeal(dealId);
};

window.markDealWonAction = function markDealWonAction(dealId) {
  const result = markDealWon(appState, dealId);
  if (!result.ok) {
    alert(result.error || 'Unable to mark deal as won.');
    return;
  }
  getUiState().selectedDealId = dealId;
  saveAndRender();
};

window.markSelectedDealWon = function markSelectedDealWon() {
  const dealId = getUiState().selectedDealId;
  if (dealId) window.markDealWonAction(dealId);
};

window.toggleLostForm = function toggleLostForm(show) {
  document.getElementById('crm-deal-loss-form').classList.toggle('hidden', !show);
  if (!show) {
    document.getElementById('crm-deal-loss-competitor').value = '';
    document.getElementById('crm-deal-loss-notes').value = '';
  }
};

window.startDealLostFlow = function startDealLostFlow(dealId) {
  getUiState().selectedDealId = dealId;
  renderSelectedDeal();
  window.toggleLostForm(true);
};

window.submitSelectedDealLost = function submitSelectedDealLost() {
  const dealId = getUiState().selectedDealId;
  if (!dealId) return;

  const result = markDealLost(appState, dealId, {
    lostReason: document.getElementById('crm-deal-loss-reason').value,
    competitor: document.getElementById('crm-deal-loss-competitor').value.trim(),
    notes: document.getElementById('crm-deal-loss-notes').value.trim()
  });
  if (!result.ok) {
    alert(result.error || 'Unable to mark deal as lost.');
    return;
  }

  window.toggleLostForm(false);
  saveAndRender();
};

window.handleDealNoteSubmit = function handleDealNoteSubmit(event) {
  event.preventDefault();
  if (!getPermissions().deal_edit) return;
  const dealId = getUiState().selectedDealId;
  const note = document.getElementById('crm-deal-note-input').value.trim();
  if (!dealId || !note) return;

  const result = createDealNote(appState, { dealId, note });
  if (!result.ok) {
    alert(result.error || 'Unable to save note.');
    return;
  }

  document.getElementById('crm-deal-note-input').value = '';
  saveAndRender();
};

window.handleDealActivitySubmit = function handleDealActivitySubmit(event) {
  event.preventDefault();
  if (!getPermissions().deal_edit) return;
  const dealId = getUiState().selectedDealId;
  if (!dealId) return;

  const result = createDealActivity(appState, {
    dealId,
    activityType: document.getElementById('crm-deal-activity-type').value.trim() || 'Activity',
    summary: document.getElementById('crm-deal-activity-summary').value.trim(),
    notes: document.getElementById('crm-deal-activity-notes').value.trim(),
    scheduledAt: document.getElementById('crm-deal-activity-date').value || null,
    completedAt: document.getElementById('crm-deal-activity-date').value ? `${document.getElementById('crm-deal-activity-date').value}T09:00:00.000Z` : null
  });
  if (!result.ok) {
    alert(result.error || 'Unable to log activity.');
    return;
  }

  document.getElementById('crm-deal-activity-form').reset();
  saveAndRender();
};

window.handleDealFollowUpSubmit = function handleDealFollowUpSubmit(event) {
  event.preventDefault();
  if (!getPermissions().deal_edit) return;
  const dealId = getUiState().selectedDealId;
  if (!dealId) return;

  const ownerSelect = document.getElementById('crm-deal-followup-owner');
  const result = createDealFollowUp(appState, {
    dealId,
    followUpDate: document.getElementById('crm-deal-followup-date').value,
    followUpType: document.getElementById('crm-deal-followup-type').value,
    assignedUserId: ownerSelect.value,
    assignedUserName: ownerSelect.options[ownerSelect.selectedIndex]?.text || '',
    notes: document.getElementById('crm-deal-followup-notes').value.trim()
  });
  if (!result.ok) {
    alert(result.error || 'Unable to save follow-up.');
    return;
  }

  document.getElementById('crm-deal-followup-form').reset();
  document.getElementById('crm-deal-followup-type').value = DEAL_FOLLOW_UP_TYPES[0];
  saveAndRender();
};

function openFromLeadConversion(leadId) {
  const lead = getLeadList(appState).find((item) => item.id === leadId) || appState.crmData.leadsById[leadId];
  if (!lead) return;

  window.openDealModal();
  document.getElementById('crm-deal-title').value = `${lead.company} Opportunity`;
  document.getElementById('crm-deal-company').value = lead.company || '';
  document.getElementById('crm-deal-contact-person').value = lead.name || '';
  document.getElementById('crm-deal-phone').value = lead.phone || '';
  document.getElementById('crm-deal-owner').value = lead.assignedRepId || '';
  document.getElementById('crm-deal-lead').value = lead.id;
  document.getElementById('crm-deal-stage').value = 'discovery';
  document.getElementById('crm-deal-status').value = 'open';
  document.getElementById('crm-deal-value').value = lead.expectedValue || 0;
  document.getElementById('crm-deal-probability').value = lead.probability || 50;
  document.getElementById('crm-deal-close-date').value = lead.nextFollowUpAt || new Date().toISOString().slice(0, 10);
  document.getElementById('crm-deal-lead-source').value = lead.source || '';
  document.getElementById('crm-deal-followup-date-input').value = lead.nextFollowUpAt || '';
  document.getElementById('crm-deal-followup-owner-input').value = lead.assignedRepId || '';
  document.getElementById('crm-deal-followup-notes-input').value = lead.notes || '';
  document.getElementById('crm-deal-initial-note').value = lead.notes || '';
}

document.addEventListener('DOMContentLoaded', async () => {
  await appReadyPromise;
  ensureCrmState(appState);

  populateFilterSelects();
  populateFormSelects();

  const permissions = getPermissions();
  const addButton = document.getElementById('crm-deals-add-btn');
  if (addButton && !permissions.deal_create) {
    addButton.disabled = true;
    addButton.classList.add('opacity-50');
  }

  const urlParams = new URLSearchParams(window.location.search);
  const convertLeadId = urlParams.get('convertLeadId');

  renderDeals();

  if (convertLeadId && permissions.deal_create) {
    openFromLeadConversion(convertLeadId);
  }

  initIcons();
});
