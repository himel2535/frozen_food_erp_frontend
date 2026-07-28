import { appReadyPromise, appState, saveAppState, initIcons } from '/js/shared.js';
import {
  ensureCrmState,
  getLeadList,
  getOwnerOptions,
  createLead,
  updateLead,
  createActivityEntry,
  getLeadActivities
} from '/js/crm-service.js';

const KANBAN_COLUMNS = [
  { key: 'new', label: 'New' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'qualified', label: 'Qualified' },
  { key: 'converted', label: 'Converted' }
];

const SOURCE_STYLES = {
  'trade show': { label: 'Trade show', class: 'bg-violet-50 text-violet-700 border-violet-100', dot: 'bg-violet-500' },
  website: { label: 'Website', class: 'bg-blue-50 text-blue-700 border-blue-100', dot: 'bg-blue-500' },
  'website form': { label: 'Website', class: 'bg-blue-50 text-blue-700 border-blue-100', dot: 'bg-blue-500' },
  referral: { label: 'Referral', class: 'bg-emerald-50 text-emerald-700 border-emerald-100', dot: 'bg-emerald-500' },
  facebook: { label: 'Facebook', class: 'bg-indigo-50 text-indigo-700 border-indigo-100', dot: 'bg-indigo-500' },
  'walk-in': { label: 'Walk-in', class: 'bg-amber-50 text-amber-700 border-amber-100', dot: 'bg-amber-500' },
  'walk in': { label: 'Walk-in', class: 'bg-amber-50 text-amber-700 border-amber-100', dot: 'bg-amber-500' }
};

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-violet-100 text-violet-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-indigo-100 text-indigo-700'
];

let currentActiveLeadId = null;
let activeLeadTab = 'notes';
let draggedLeadId = null;
let openActionMenuId = null;

function escapeHtml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function formatCurrency(value) {
  return `৳${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getUiState() {
  ensureCrmState(appState);
  if (!appState.crmUi.leadView) appState.crmUi.leadView = 'table';
  return appState.crmUi;
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

function normalizePriority(priority) {
  const map = { high: 'hot', medium: 'warm', low: 'cold', hot: 'hot', warm: 'warm', cold: 'cold' };
  return map[String(priority || 'warm').toLowerCase()] || 'warm';
}

function priorityBadgeHtml(priority) {
  const p = normalizePriority(priority);
  const styles = {
    hot: { label: 'Hot', dot: 'bg-rose-500', class: 'bg-rose-50 text-rose-700 border-rose-100' },
    warm: { label: 'Warm', dot: 'bg-amber-500', class: 'bg-amber-50 text-amber-700 border-amber-100' },
    cold: { label: 'Cold', dot: 'bg-blue-500', class: 'bg-blue-50 text-blue-700 border-blue-100' }
  };
  const s = styles[p] || styles.warm;
  return `<span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold border ${s.class}"><span class="w-1.5 h-1.5 rounded-full ${s.dot}"></span>${s.label}</span>`;
}

function statusBadgeClass(status) {
  const s = String(status || '').toLowerCase();
  if (s === 'new') return 'bg-blue-50 text-blue-700';
  if (s === 'contacted') return 'bg-amber-50 text-amber-700';
  if (s === 'qualified') return 'bg-emerald-50 text-emerald-700';
  if (s === 'lost') return 'bg-rose-50 text-rose-700';
  return 'bg-slate-100 text-slate-600';
}

function statusLabel(status) {
  const s = String(status || '');
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function sourceBadgeHtml(source) {
  const key = String(source || '').toLowerCase();
  const style = SOURCE_STYLES[key] || { label: source || 'Other', class: 'bg-slate-50 text-slate-600 border-slate-200', dot: 'bg-slate-400' };
  return `<span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold border ${style.class}"><span class="w-1.5 h-1.5 rounded-full ${style.dot}"></span>${escapeHtml(style.label)}</span>`;
}

function normalizeSourceFilter(source) {
  const s = String(source || '').toLowerCase();
  if (s.includes('website')) return 'website';
  if (s.includes('trade')) return 'trade show';
  if (s.includes('referral')) return 'referral';
  if (s.includes('facebook')) return 'facebook';
  if (s.includes('walk')) return 'walk-in';
  return s;
}

function isOpenLead(lead) {
  return lead.conversionStatus !== 'converted' && lead.status !== 'lost';
}

function getLeadTooltip(lead) {
  const activities = getLeadActivities(appState, lead.id);
  const latest = activities[0];
  if (latest?.summary) return latest.summary;
  if (latest?.note) return latest.note;
  return lead.notes || 'No notes yet';
}

function hasActiveFilters() {
  const search = document.getElementById('crm-leads-search')?.value?.trim();
  const status = document.getElementById('crm-leads-filter-status')?.value;
  const source = document.getElementById('crm-leads-filter-source')?.value;
  const owner = document.getElementById('crm-leads-filter-owner')?.value;
  return !!(search || (status && status !== 'all') || (source && source !== 'all') || (owner && owner !== 'all'));
}

function getFilteredLeads() {
  const searchInput = document.getElementById('crm-leads-search');
  const statusFilter = document.getElementById('crm-leads-filter-status');
  const sourceFilter = document.getElementById('crm-leads-filter-source');
  const ownerFilter = document.getElementById('crm-leads-filter-owner');

  const searchQuery = searchInput ? searchInput.value.toLowerCase().trim() : '';
  const statusVal = statusFilter ? statusFilter.value : 'all';
  const sourceVal = sourceFilter ? sourceFilter.value : 'all';
  const ownerVal = ownerFilter ? ownerFilter.value : 'all';
  const ui = getUiState();
  const isKanban = ui.leadView === 'kanban';

  return getLeadList(appState).filter((lead) => {
    if (isKanban && lead.status === 'lost') return false;

    const matchesSearch = !searchQuery
      || (lead.name || '').toLowerCase().includes(searchQuery)
      || (lead.company || '').toLowerCase().includes(searchQuery)
      || (lead.source || '').toLowerCase().includes(searchQuery);

    let matchesStatus = statusVal === 'all' || lead.status === statusVal;
    if (isKanban && statusVal === 'all' && lead.conversionStatus === 'converted') {
      matchesStatus = true;
    }

    const matchesSource = sourceVal === 'all'
      || normalizeSourceFilter(lead.source) === normalizeSourceFilter(sourceVal)
      || lead.source === sourceVal;

    const matchesOwner = ownerVal === 'all' || lead.assignedRepId === ownerVal;

    return matchesSearch && matchesStatus && matchesSource && matchesOwner;
  });
}

function updateLeadMetrics(filteredLeads) {
  const allLeads = getLeadList(appState);
  const openLeads = allLeads.filter(isOpenLead);
  const convertedCount = allLeads.filter((l) => l.conversionStatus === 'converted').length;
  const totalForRate = convertedCount + openLeads.length;
  const conversionRate = totalForRate ? Math.round((convertedCount / totalForRate) * 100) : 0;

  const leadsEl = document.getElementById('crm-metric-leads');
  if (leadsEl) leadsEl.textContent = openLeads.length;

  const convEl = document.getElementById('crm-metric-conversion');
  if (convEl) convEl.textContent = `${conversionRate}%`;

  const valueEl = document.getElementById('crm-metric-lead-value');
  if (valueEl) {
    const targetValue = filteredLeads.filter(isOpenLead).reduce((sum, l) => sum + Number(l.expectedValue || 0), 0);
    valueEl.textContent = formatCurrency(targetValue);
  }
}

function saveAndRender() {
  saveAppState();
  window.renderLeads();
}

function populateFilters() {
  const ownerFilter = document.getElementById('crm-leads-filter-owner');
  if (ownerFilter) {
    const owners = getOwnerOptions(appState);
    ownerFilter.innerHTML = '<option value="all">All reps</option>';
    owners.forEach((owner) => {
      ownerFilter.innerHTML += `<option value="${owner.id}">${escapeHtml(owner.name)}</option>`;
    });
  }
}

function populateOwnerSelect(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;
  const owners = getOwnerOptions(appState);
  select.innerHTML = '';
  owners.forEach((owner) => {
    select.innerHTML += `<option value="${owner.id}">${escapeHtml(owner.name)}</option>`;
  });
}

function followUpMarkup(lead) {
  const todayStr = new Date().toISOString().slice(0, 10);
  if (!lead.nextFollowUpAt) return '—';
  const isOverdue = lead.nextFollowUpAt < todayStr;
  if (isOverdue) {
    return `<div class="flex flex-col gap-1"><span class="text-slate-600">${escapeHtml(lead.nextFollowUpAt)}</span><span class="inline-flex self-start px-1.5 py-0.5 rounded-full text-[8px] font-bold bg-rose-50 text-rose-600 border border-rose-100">Overdue</span></div>`;
  }
  if (lead.nextFollowUpAt === todayStr) {
    return `<span class="text-amber-600 font-extrabold">${escapeHtml(lead.nextFollowUpAt)}</span>`;
  }
  return `<span class="text-slate-600">${escapeHtml(lead.nextFollowUpAt)}</span>`;
}

function actionMenuHtml(leadId) {
  return `
    <div class="relative inline-block">
      <button type="button" onclick="window.toggleLeadActionMenu('${escapeHtml(leadId)}')" class="px-2 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-[11px] font-bold cursor-pointer">⋮</button>
      <div id="lead-action-menu-${escapeHtml(leadId)}" class="hidden absolute right-0 top-full mt-1 z-20 min-w-[140px] bg-white border border-slate-200 rounded-xl py-1 text-left">
        <button type="button" onclick="window.logLeadCall('${escapeHtml(leadId)}')" class="block w-full text-left px-3 py-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer">Log call</button>
        <button type="button" onclick="window.addLeadNote('${escapeHtml(leadId)}')" class="block w-full text-left px-3 py-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer">Add note</button>
        <button type="button" onclick="window.markLeadLost('${escapeHtml(leadId)}')" class="block w-full text-left px-3 py-2 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 cursor-pointer">Mark lost</button>
      </div>
    </div>
  `;
}

function renderLeadsTable(filteredLeads) {
  const tbody = document.getElementById('crm-leads-body');
  if (!tbody) return;

  tbody.innerHTML = '';
  const allLeads = getLeadList(appState);

  if (filteredLeads.length === 0) {
    const filtered = hasActiveFilters();
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="p-12 text-center">
          <div class="flex flex-col items-center justify-center">
            <div class="w-16 h-16 rounded-xl ${filtered ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'} flex items-center justify-center mb-4">
              <i data-lucide="${filtered ? 'search' : 'users'}" class="w-8 h-8"></i>
            </div>
            <h3 class="text-sm font-bold text-slate-900">${filtered ? 'No results match your filters' : 'No leads yet'}</h3>
            <p class="text-xs text-slate-500 font-medium mt-1 mb-4">${filtered ? 'Try adjusting your search or filter criteria.' : 'Add your first lead to start tracking prospects.'}</p>
            ${filtered
              ? '<button onclick="window.clearLeadFilters()" class="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-4 py-2 rounded-xl cursor-pointer">Clear filters</button>'
              : '<button onclick="window.openLeadModal()" class="bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-blue-700 cursor-pointer">Add lead</button>'}
          </div>
        </td>
      </tr>
    `;
    return;
  }

  filteredLeads.forEach((lead) => {
    const tooltip = escapeHtml(getLeadTooltip(lead));
    tbody.innerHTML += `
      <tr class="hover:bg-slate-50 transition-colors group" title="${tooltip}">
        <td class="p-4 text-center"><input type="checkbox" class="crm-lead-row-select cursor-pointer" data-id="${escapeHtml(lead.id)}" onclick="window.updateLeadBulkSelection()"></td>
        <td class="p-4">
          <div class="flex items-center gap-3">
            ${avatarHtml(lead.name)}
            <div class="min-w-0">
              <div class="font-bold text-slate-900 truncate">${escapeHtml(lead.name)}</div>
              <div class="text-[10px] text-slate-400 font-semibold truncate">${escapeHtml(lead.company)}</div>
            </div>
          </div>
        </td>
        <td class="p-4 text-slate-500">${escapeHtml(lead.phone || '—')}<br><span class="text-[10px] text-slate-400">${escapeHtml(lead.email || '—')}</span></td>
        <td class="p-4">${sourceBadgeHtml(lead.source)}</td>
        <td class="p-4">
          <div class="flex items-center gap-2">
            ${lead.assignedRepName ? avatarHtml(lead.assignedRepName, 'w-6 h-6', 'text-[8px]') : ''}
            <span>${escapeHtml(lead.assignedRepName || '—')}</span>
          </div>
        </td>
        <td class="p-4">${priorityBadgeHtml(lead.priority)}</td>
        <td class="p-4">${followUpMarkup(lead)}</td>
        <td class="p-4"><span class="px-2 py-0.5 rounded-full text-[9px] font-bold ${statusBadgeClass(lead.status)}">${escapeHtml(statusLabel(lead.status))}</span></td>
        <td class="p-4">
          <div class="flex items-center justify-center gap-1.5 flex-wrap">
            <button type="button" onclick="window.openLeadDrawer('${escapeHtml(lead.id)}')" class="px-2 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-bold cursor-pointer">View</button>
            ${lead.conversionStatus !== 'converted' ? `<button type="button" onclick="window.convertLead('${escapeHtml(lead.id)}')" class="px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold cursor-pointer">Convert to deal</button>` : ''}
            ${actionMenuHtml(lead.id)}
          </div>
        </td>
      </tr>
    `;
  });
}

function getKanbanColumnLeads(leads, columnKey) {
  if (columnKey === 'converted') {
    return leads.filter((l) => l.conversionStatus === 'converted');
  }
  return leads.filter((l) => l.conversionStatus !== 'converted' && l.status === columnKey);
}

function renderLeadsKanban(filteredLeads) {
  const container = document.getElementById('crm-leads-kanban-view');
  if (!container) return;

  container.innerHTML = KANBAN_COLUMNS.map((col) => {
    const columnLeads = getKanbanColumnLeads(filteredLeads, col.key);
    return `
      <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col gap-3 min-h-[320px]"
           data-kanban-column="${col.key}"
           ondragover="window.handleLeadDragOver(event)"
           ondrop="window.handleLeadDrop(event, '${col.key}')">
        <div class="flex items-center justify-between gap-2">
          <h4 class="text-xs font-bold text-slate-500">${escapeHtml(col.label)}</h4>
          <span class="text-[11px] font-extrabold text-slate-400">${columnLeads.length}</span>
        </div>
        <div class="flex-1 flex flex-col gap-2">
          ${columnLeads.map((lead) => `
            <div draggable="true"
                 ondragstart="window.handleLeadDragStart(event, '${escapeHtml(lead.id)}')"
                 class="bg-white p-3 rounded-xl border border-slate-200 space-y-2 cursor-grab active:cursor-grabbing"
                 title="${escapeHtml(getLeadTooltip(lead))}">
              <div class="flex items-start gap-2">
                ${avatarHtml(lead.name, 'w-7 h-7', 'text-[8px]')}
                <div class="min-w-0 flex-1">
                  <div class="font-bold text-slate-900 text-xs truncate">${escapeHtml(lead.name)}</div>
                  <div class="text-[10px] text-slate-400 font-semibold truncate">${escapeHtml(lead.company)}</div>
                </div>
              </div>
              <div class="flex items-center justify-between gap-2 text-[10px]">
                <span>${followUpMarkup(lead)}</span>
                ${lead.assignedRepName ? avatarHtml(lead.assignedRepName, 'w-5 h-5', 'text-[7px]') : ''}
              </div>
              <div class="flex items-center gap-1.5 flex-wrap">
                ${sourceBadgeHtml(lead.source)}
                ${priorityBadgeHtml(lead.priority)}
              </div>
            </div>
          `).join('') || '<div class="text-[11px] text-slate-400 font-semibold py-4 text-center">Drop leads here</div>'}
        </div>
      </div>
    `;
  }).join('');
}

function updateViewToggle() {
  const ui = getUiState();
  const tableBtn = document.getElementById('crm-lead-view-table');
  const kanbanBtn = document.getElementById('crm-lead-view-kanban');
  const tableView = document.getElementById('crm-leads-table-view');
  const kanbanView = document.getElementById('crm-leads-kanban-view');

  if (ui.leadView === 'kanban') {
    if (tableBtn) tableBtn.className = 'crm-lead-view-btn px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-900 cursor-pointer';
    if (kanbanBtn) kanbanBtn.className = 'crm-lead-view-btn px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white cursor-pointer';
    tableView?.classList.add('hidden');
    kanbanView?.classList.remove('hidden');
  } else {
    if (tableBtn) tableBtn.className = 'crm-lead-view-btn px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white cursor-pointer';
    if (kanbanBtn) kanbanBtn.className = 'crm-lead-view-btn px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-900 cursor-pointer';
    tableView?.classList.remove('hidden');
    kanbanView?.classList.add('hidden');
  }
}

window.renderLeads = function () {
  const filteredLeads = getFilteredLeads();
  updateLeadMetrics(filteredLeads);
  updateViewToggle();

  const ui = getUiState();
  if (ui.leadView === 'kanban') {
    renderLeadsKanban(filteredLeads);
  } else {
    renderLeadsTable(filteredLeads);
    window.updateLeadBulkSelection();
  }
  initIcons();
};

window.renderLeadsTable = window.renderLeads;

window.switchLeadView = function (view) {
  getUiState().leadView = view === 'kanban' ? 'kanban' : 'table';
  saveAppState();
  window.renderLeads();
};

window.clearLeadFilters = function () {
  const search = document.getElementById('crm-leads-search');
  const status = document.getElementById('crm-leads-filter-status');
  const source = document.getElementById('crm-leads-filter-source');
  const owner = document.getElementById('crm-leads-filter-owner');
  if (search) search.value = '';
  if (status) status.value = 'all';
  if (source) source.value = 'all';
  if (owner) owner.value = 'all';
  window.renderLeads();
};

window.handleLeadDragStart = function (event, leadId) {
  draggedLeadId = leadId;
  event.dataTransfer.effectAllowed = 'move';
};

window.handleLeadDragOver = function (event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
};

window.handleLeadDrop = function (event, columnKey) {
  event.preventDefault();
  if (!draggedLeadId) return;

  const payload = {};
  if (columnKey === 'converted') {
    payload.conversionStatus = 'converted';
    payload.status = 'qualified';
  } else {
    payload.status = columnKey;
    payload.conversionStatus = 'open';
  }

  updateLead(appState, draggedLeadId, payload);
  draggedLeadId = null;
  saveAndRender();
};

window.toggleLeadSelectAll = function (checked) {
  document.querySelectorAll('.crm-lead-row-select').forEach((el) => {
    el.checked = !!checked;
  });
  window.updateLeadBulkSelection();
};

window.updateLeadBulkSelection = function () {
  const selected = [...document.querySelectorAll('.crm-lead-row-select:checked')];
  const toolbar = document.getElementById('crm-leads-bulk-toolbar');
  const countEl = document.getElementById('crm-leads-bulk-count');
  if (countEl) countEl.textContent = selected.length;
  if (toolbar) {
    if (selected.length > 0) toolbar.classList.remove('hidden');
    else toolbar.classList.add('hidden');
  }
  const selectAll = document.getElementById('crm-leads-select-all');
  const all = [...document.querySelectorAll('.crm-lead-row-select')];
  if (selectAll && all.length) selectAll.checked = all.every((el) => el.checked);
};

function getSelectedLeadIds() {
  return [...document.querySelectorAll('.crm-lead-row-select:checked')].map((el) => el.getAttribute('data-id')).filter(Boolean);
}

window.bulkAssignLeads = function () {
  const ids = getSelectedLeadIds();
  if (!ids.length) return;
  populateOwnerSelect('crm-leads-bulk-assign-owner');
  document.getElementById('crm-leads-bulk-assign-modal')?.classList.remove('hidden');
};

window.closeLeadsBulkAssignModal = function () {
  document.getElementById('crm-leads-bulk-assign-modal')?.classList.add('hidden');
};

window.confirmLeadsBulkAssign = function () {
  const ids = getSelectedLeadIds();
  const select = document.getElementById('crm-leads-bulk-assign-owner');
  if (!ids.length || !select?.value) return;
  const ownerName = select.options[select.selectedIndex]?.text || '';
  ids.forEach((id) => updateLead(appState, id, { assignedRepId: select.value, assignedRepName: ownerName }));
  window.closeLeadsBulkAssignModal();
  saveAndRender();
};

window.bulkExportLeads = function () {
  const ids = getSelectedLeadIds();
  if (!ids.length) return;
  const leads = getLeadList(appState).filter((l) => ids.includes(l.id));
  const header = ['ID', 'Name', 'Company', 'Phone', 'Email', 'Source', 'Status', 'Priority', 'Rep', 'Expected Value', 'Follow-up'];
  const rows = leads.map((l) => [
    l.id, l.name, l.company, l.phone, l.email, l.source, l.status,
    normalizePriority(l.priority), l.assignedRepName, l.expectedValue, l.nextFollowUpAt || ''
  ]);
  const csv = [header, ...rows].map((row) => row.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `leads-export-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

window.bulkMarkLeadsLost = function () {
  const ids = getSelectedLeadIds();
  if (!ids.length) return;
  if (!confirm(`Mark ${ids.length} lead(s) as lost?`)) return;
  ids.forEach((id) => updateLead(appState, id, { status: 'lost' }));
  saveAndRender();
};

window.toggleLeadActionMenu = function (leadId) {
  if (openActionMenuId && openActionMenuId !== leadId) {
    document.getElementById(`lead-action-menu-${openActionMenuId}`)?.classList.add('hidden');
  }
  const menu = document.getElementById(`lead-action-menu-${leadId}`);
  if (menu) {
    menu.classList.toggle('hidden');
    openActionMenuId = menu.classList.contains('hidden') ? null : leadId;
  }
};

window.logLeadCall = function (leadId) {
  openActionMenuId = null;
  document.querySelectorAll('[id^="lead-action-menu-"]').forEach((el) => el.classList.add('hidden'));
  createActivityEntry(appState, {
    entityType: 'lead',
    entityId: leadId,
    activityType: 'call',
    summary: 'Outbound call logged',
    note: 'Quick call logged from leads table.'
  });
  saveAndRender();
};

window.addLeadNote = function (leadId) {
  openActionMenuId = null;
  document.querySelectorAll('[id^="lead-action-menu-"]').forEach((el) => el.classList.add('hidden'));
  window.openLeadDrawer(leadId);
  window.switchLeadDrawerTab('notes');
};

window.markLeadLost = function (leadId) {
  openActionMenuId = null;
  document.querySelectorAll('[id^="lead-action-menu-"]').forEach((el) => el.classList.add('hidden'));
  updateLead(appState, leadId, { status: 'lost' });
  saveAndRender();
};

window.showLeadsMainView = function () {
  document.getElementById('crm-leads-main-view').classList.remove('hidden');
  document.getElementById('crm-leads-form-view').classList.add('hidden');
};

window.showLeadsFormView = function () {
  document.getElementById('crm-leads-main-view').classList.add('hidden');
  document.getElementById('crm-leads-form-view').classList.remove('hidden');
};

window.openLeadModal = function () {
  document.getElementById('crm-lead-form').reset();
  populateOwnerSelect('crm-lead-owner');
  window.showLeadsFormView();
};

window.handleLeadSubmit = function (event) {
  event.preventDefault();
  const ownerSelect = document.getElementById('crm-lead-owner');
  const payload = {
    name: document.getElementById('crm-lead-name').value.trim(),
    company: document.getElementById('crm-lead-company').value.trim(),
    email: document.getElementById('crm-lead-email').value.trim(),
    phone: document.getElementById('crm-lead-phone').value.trim(),
    source: document.getElementById('crm-lead-source').value,
    status: document.getElementById('crm-lead-status').value,
    priority: document.getElementById('crm-lead-priority').value,
    assignedRepId: ownerSelect.value,
    assignedRepName: ownerSelect.options[ownerSelect.selectedIndex]?.text || '',
    expectedValue: document.getElementById('crm-lead-value').value || 0,
    probability: document.getElementById('crm-lead-probability').value || 50,
    nextFollowUpAt: document.getElementById('crm-lead-followup').value || '',
    notes: document.getElementById('crm-lead-notes').value.trim()
  };

  const result = createLead(appState, payload);
  if (!result.ok) {
    alert('Unable to create lead.');
    return;
  }

  window.showLeadsMainView();
  saveAndRender();
};

window.convertLead = function (leadId) {
  window.location.href = `/crm-deals.html?convertLeadId=${leadId}`;
};

window.openLeadDrawer = function (leadId) {
  currentActiveLeadId = leadId;
  const lead = appState.crmData.leadsById[leadId];
  if (!lead) return;

  document.getElementById('drawer-lead-name').textContent = lead.name || 'Lead details';
  document.getElementById('drawer-lead-company').textContent = lead.company || '';
  document.getElementById('drawer-lead-status').value = lead.status || 'new';
  document.getElementById('drawer-lead-value').value = lead.expectedValue || 0;
  document.getElementById('drawer-lead-followup').value = lead.nextFollowUpAt || '';
  document.getElementById('drawer-lead-phone').textContent = lead.phone || '—';
  document.getElementById('drawer-lead-email').textContent = lead.email || '—';

  const drawerOwnerSelect = document.getElementById('drawer-lead-owner');
  if (drawerOwnerSelect) {
    const owners = getOwnerOptions(appState);
    drawerOwnerSelect.innerHTML = '<option value="">Unassigned</option>';
    owners.forEach((owner) => {
      const selected = owner.id === lead.assignedRepId ? 'selected' : '';
      drawerOwnerSelect.innerHTML += `<option value="${owner.id}" ${selected}>${escapeHtml(owner.name)}</option>`;
    });
  }

  document.getElementById('drawer-lead-notes-input').value = lead.notes || '';
  document.getElementById('drawer-activity-form').reset();
  document.getElementById('act-date').value = new Date().toISOString().slice(0, 10);
  renderDrawerActivities(leadId);
  window.switchLeadDrawerTab('notes');

  const overlay = document.getElementById('crm-lead-drawer-overlay');
  const drawer = document.getElementById('crm-lead-drawer');
  overlay.classList.remove('hidden');
  void overlay.offsetWidth;
  overlay.classList.add('opacity-100');
  overlay.classList.remove('opacity-0');
  drawer.classList.remove('drawer-hidden');
  drawer.classList.add('drawer-visible');
  initIcons();
};

window.closeLeadDrawer = function () {
  const overlay = document.getElementById('crm-lead-drawer-overlay');
  const drawer = document.getElementById('crm-lead-drawer');
  overlay.classList.remove('opacity-100');
  overlay.classList.add('opacity-0');
  drawer.classList.remove('drawer-visible');
  drawer.classList.add('drawer-hidden');
  setTimeout(() => {
    overlay.classList.add('hidden');
    currentActiveLeadId = null;
  }, 350);
};

window.switchLeadDrawerTab = function (tab) {
  activeLeadTab = tab;
  const tabNotesBtn = document.getElementById('tab-notes-btn');
  const tabActivitiesBtn = document.getElementById('tab-activities-btn');
  const tabNotesPanel = document.getElementById('drawer-tab-notes');
  const tabActivitiesPanel = document.getElementById('drawer-tab-activities');

  if (tab === 'notes') {
    tabNotesBtn.className = 'pb-3 text-xs font-bold text-blue-600 border-b-2 border-blue-600 cursor-pointer';
    tabActivitiesBtn.className = 'pb-3 text-xs font-bold text-slate-400 border-b-2 border-transparent hover:text-slate-600 cursor-pointer';
    tabNotesPanel.classList.remove('hidden');
    tabActivitiesPanel.classList.add('hidden');
  } else {
    tabActivitiesBtn.className = 'pb-3 text-xs font-bold text-blue-600 border-b-2 border-blue-600 cursor-pointer';
    tabNotesBtn.className = 'pb-3 text-xs font-bold text-slate-400 border-b-2 border-transparent hover:text-slate-600 cursor-pointer';
    tabNotesPanel.classList.add('hidden');
    tabActivitiesPanel.classList.remove('hidden');
  }
};

window.saveLeadNotes = function () {
  if (!currentActiveLeadId) return;
  const notesText = document.getElementById('drawer-lead-notes-input').value;
  const res = updateLead(appState, currentActiveLeadId, { notes: notesText });
  if (res.ok) saveAndRender();
};

window.updateLeadStatusFromDrawer = function () {
  if (!currentActiveLeadId) return;
  updateLead(appState, currentActiveLeadId, { status: document.getElementById('drawer-lead-status').value });
  saveAndRender();
};

window.updateLeadValueFromDrawer = function () {
  if (!currentActiveLeadId) return;
  updateLead(appState, currentActiveLeadId, { expectedValue: Number(document.getElementById('drawer-lead-value').value || 0) });
  saveAndRender();
};

window.updateLeadOwnerFromDrawer = function () {
  if (!currentActiveLeadId) return;
  const select = document.getElementById('drawer-lead-owner');
  updateLead(appState, currentActiveLeadId, {
    assignedRepId: select.value,
    assignedRepName: select.options[select.selectedIndex]?.text || ''
  });
  saveAndRender();
};

window.updateLeadFollowUpFromDrawer = function () {
  if (!currentActiveLeadId) return;
  updateLead(appState, currentActiveLeadId, { nextFollowUpAt: document.getElementById('drawer-lead-followup').value || '' });
  saveAndRender();
};

window.handleLeadActivitySubmit = function (event) {
  event.preventDefault();
  if (!currentActiveLeadId) return;

  createActivityEntry(appState, {
    entityType: 'lead',
    entityId: currentActiveLeadId,
    activityType: document.getElementById('act-type').value,
    summary: document.getElementById('act-summary').value.trim(),
    note: document.getElementById('act-note').value.trim(),
    scheduledAt: document.getElementById('act-date').value || null
  });

  document.getElementById('drawer-activity-form').reset();
  document.getElementById('act-date').value = new Date().toISOString().slice(0, 10);
  renderDrawerActivities(currentActiveLeadId);
  saveAndRender();
};

window.convertLeadFromDrawer = function () {
  if (!currentActiveLeadId) return;
  window.convertLead(currentActiveLeadId);
};

function renderDrawerActivities(leadId) {
  const container = document.getElementById('drawer-activities-list');
  if (!container) return;

  const list = getLeadActivities(appState, leadId);
  if (!list.length) {
    container.innerHTML = '<p class="text-slate-400 text-xs py-4 text-center">No activities logged yet.</p>';
    return;
  }

  container.innerHTML = list.map((act) => {
    const typeBadge = act.activityType === 'call'
      ? 'bg-blue-50 text-blue-600'
      : act.activityType === 'email'
        ? 'bg-purple-50 text-purple-600'
        : act.activityType === 'meeting'
          ? 'bg-emerald-50 text-emerald-600'
          : 'bg-slate-100 text-slate-600';
    const dateFormatted = act.completedAt || act.createdAt
      ? new Date(act.completedAt || act.createdAt).toLocaleString()
      : '';
    return `
      <div class="py-2.5 first:pt-0">
        <div class="flex items-center justify-between mb-1">
          <div class="flex items-center gap-1.5">
            <span class="px-1.5 py-0.5 rounded text-[9px] font-bold ${typeBadge}">${escapeHtml(act.activityType)}</span>
            <span class="font-bold text-slate-800">${escapeHtml(act.summary)}</span>
          </div>
          <span class="text-[10px] text-slate-400 font-medium">${escapeHtml(dateFormatted)}</span>
        </div>
        ${act.note ? `<p class="text-slate-500 font-medium leading-relaxed">${escapeHtml(act.note)}</p>` : ''}
      </div>
    `;
  }).join('');
}

document.addEventListener('click', (e) => {
  if (!e.target.closest('[id^="lead-action-menu-"]') && !e.target.closest('button[onclick*="toggleLeadActionMenu"]')) {
    document.querySelectorAll('[id^="lead-action-menu-"]').forEach((el) => el.classList.add('hidden'));
    openActionMenuId = null;
  }
});

document.addEventListener('DOMContentLoaded', async () => {
  await appReadyPromise;
  ensureCrmState(appState);
  populateFilters();
  window.renderLeads();
  initIcons();
});

window.addEventListener('hookerp:language-changed', () => {
  populateFilters();
  window.renderLeads();
  initIcons();
});
