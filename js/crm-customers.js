import { appReadyPromise, appState, saveAppState, initIcons } from '/js/shared.js';
import {
  ensureCrmState,
  getCustomerList,
  getCustomerProfile,
  getCustomerContacts,
  getOwnerOptions,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  createActivityEntry,
  exportCustomersCsv,
  getCustomerTemplateCsv
} from '/js/crm-service.js';

const PAGE_SIZE = 10;
let currentDrawerCustomerId = null;

const listState = {
  searchQuery: '',
  sortKey: 'name-asc',
  status: 'all',
  tier: 'all',
  ownerId: 'all',
  territory: '',
  quickFilter: 'all',
  currentPage: 1
};

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-violet-100 text-violet-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-indigo-100 text-indigo-700'
];

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

function actionIcon(file, alt, className = 'w-5 h-5') {
  return `<img src="/images/icons/actions/${file}" alt="${escapeHtml(alt)}" class="${className} object-contain pointer-events-none" />`;
}

function metricIcon(file, alt, className = 'w-5 h-5') {
  return `<img src="/images/icons/metrics/${file}" alt="${escapeHtml(alt)}" class="${className} object-contain pointer-events-none shrink-0" />`;
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

function statusBadgeClass(status) {
  if (status === 'active') return 'bg-emerald-50 text-emerald-600';
  if (status === 'overdue') return 'bg-rose-50 text-rose-600';
  if (status === 'credit-hold') return 'bg-amber-50 text-amber-700';
  if (status === 'inactive') return 'bg-slate-100 text-slate-500';
  return 'bg-slate-100 text-slate-500';
}

function tierBadgeClass(tier) {
  const t = String(tier || 'Standard').toLowerCase();
  if (t.includes('enterprise') || t.includes('vip')) return 'bg-violet-50 text-violet-700 border-violet-100';
  if (t.includes('wholesale')) return 'bg-indigo-50 text-indigo-700 border-indigo-100';
  return 'bg-slate-50 text-slate-600 border-slate-200';
}

function tierBadgeHtml(tier) {
  const label = tier || 'Standard';
  return `<span class="inline-flex px-1.5 py-0.5 rounded-full text-[8px] font-bold border ${tierBadgeClass(label)}">${escapeHtml(label)}</span>`;
}

function invoiceStatusClass(status) {
  const s = String(status || '').toLowerCase();
  if (s === 'paid') return 'bg-emerald-50 text-emerald-600';
  if (s === 'overdue') return 'bg-rose-50 text-rose-600';
  if (s === 'partial') return 'bg-amber-50 text-amber-700';
  return 'bg-slate-100 text-slate-500';
}

function saveAndRender() {
  saveAppState();
  renderCustomersTable();
  updateMetrics();
}

function enrichCustomer(customer) {
  const contacts = getCustomerContacts(appState, customer.id);
  const primary = contacts.find((c) => c.primary) || contacts[0] || null;
  return {
    ...customer,
    contactName: primary?.name || customer.contactName || ''
  };
}

function hasActiveFilters() {
  return listState.searchQuery
    || listState.status !== 'all'
    || listState.tier !== 'all'
    || listState.ownerId !== 'all'
    || listState.territory
    || listState.quickFilter !== 'all';
}

function getFilteredCustomers() {
  let customers = getCustomerList(appState).map(enrichCustomer);
  const q = listState.searchQuery;

  customers = customers.filter((c) => {
    const matchesSearch = !q
      || (c.name || '').toLowerCase().includes(q)
      || (c.company || '').toLowerCase().includes(q)
      || (c.phone || '').toLowerCase().includes(q)
      || (c.email || '').toLowerCase().includes(q)
      || (c.contactName || '').toLowerCase().includes(q);

    const matchesStatus = listState.status === 'all' || c.status === listState.status;
    const matchesTier = listState.tier === 'all' || c.pricingTier === listState.tier;
    const matchesOwner = listState.ownerId === 'all' || c.ownerId === listState.ownerId;
    const territoryQ = listState.territory;
    const matchesTerritory = !territoryQ || (c.territory || '').toLowerCase().includes(territoryQ);

    let matchesQuick = true;
    if (listState.quickFilter === 'active') matchesQuick = c.status === 'active';
    else if (listState.quickFilter === 'overdue') matchesQuick = c.status === 'overdue' || c.status === 'credit-hold';
    else if (listState.quickFilter === 'has-due') matchesQuick = Number(c.totalDue || 0) > 0;
    else if (listState.quickFilter === 'enterprise') {
      const tier = String(c.pricingTier || '').toLowerCase();
      matchesQuick = tier.includes('enterprise') || tier.includes('vip');
    }

    return matchesSearch && matchesStatus && matchesTier && matchesOwner && matchesTerritory && matchesQuick;
  });

  customers.sort((a, b) => {
    if (listState.sortKey === 'name-desc') return String(b.name || '').localeCompare(String(a.name || ''));
    if (listState.sortKey === 'balance-desc') return Number(b.totalDue || 0) - Number(a.totalDue || 0);
    if (listState.sortKey === 'spending-desc') return Number(b.totalSales || 0) - Number(a.totalSales || 0);
    return String(a.name || '').localeCompare(String(b.name || ''));
  });

  return customers;
}

function updateQuickFilterChips() {
  document.querySelectorAll('.crm-quick-chip').forEach((btn) => {
    const active = btn.getAttribute('data-quick') === listState.quickFilter;
    btn.className = active
      ? 'crm-quick-chip px-3 py-1.5 rounded-full text-xs font-bold border border-blue-500 bg-blue-50 text-blue-700 cursor-pointer premium-shadow'
      : 'crm-quick-chip px-3 py-1.5 rounded-full text-xs font-bold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 cursor-pointer';
  });
}

function renderActiveFilterChips() {
  const container = document.getElementById('crm-active-filters');
  if (!container) return;

  const chips = [];
  if (listState.quickFilter !== 'all') {
    chips.push({ key: 'quick', label: `Quick: ${listState.quickFilter}` });
  }
  if (listState.searchQuery) {
    chips.push({ key: 'search', label: `Search: ${listState.searchQuery}` });
  }
  if (listState.status !== 'all') {
    chips.push({ key: 'status', label: `Status: ${listState.status}` });
  }
  if (listState.tier !== 'all') {
    chips.push({ key: 'tier', label: `Tier: ${listState.tier}` });
  }
  if (listState.ownerId !== 'all') {
    const owner = getOwnerOptions(appState).find((o) => o.id === listState.ownerId);
    chips.push({ key: 'owner', label: `Owner: ${owner?.name || listState.ownerId}` });
  }
  if (listState.territory) {
    chips.push({ key: 'territory', label: `Territory: ${listState.territory}` });
  }

  if (!chips.length) {
    container.classList.add('hidden');
    container.innerHTML = '';
    return;
  }

  container.classList.remove('hidden');
  container.innerHTML = `
    <span class="text-[10px] font-bold text-slate-400 uppercase">Active filters:</span>
    ${chips.map((chip) => `
      <button type="button" onclick="window.removeCustomerFilterChip('${chip.key}')" class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100 cursor-pointer hover:bg-blue-100">
        ${escapeHtml(chip.label)} <span class="text-blue-400">×</span>
      </button>
    `).join('')}
    <button type="button" onclick="window.clearCustomerFilters()" class="text-[10px] font-bold text-slate-500 hover:text-slate-800 cursor-pointer underline">Reset all</button>
  `;
}

function updateMetrics() {
  const customers = getCustomerList(appState);
  const customersEl = document.getElementById('crm-metric-customers');
  if (customersEl) customersEl.textContent = customers.length;

  const reps = new Set(customers.map((c) => c.ownerId).filter(Boolean)).size;
  const repsEl = document.getElementById('crm-metric-reps');
  if (repsEl) repsEl.textContent = reps;

  const totalSpend = customers.reduce((sum, c) => sum + (c.totalSales || 0), 0);
  const avgSpend = customers.length ? totalSpend / customers.length : 0;
  const avgEl = document.getElementById('crm-metric-avg-spend');
  if (avgEl) avgEl.textContent = formatCurrency(avgSpend);

  const riskBalance = customers.reduce(
    (sum, c) => sum + (c.status === 'overdue' || c.status === 'credit-hold' ? (c.totalDue || 0) : 0),
    0
  );
  const riskEl = document.getElementById('crm-metric-risk');
  if (riskEl) riskEl.textContent = formatCurrency(riskBalance);

  const riskCount = customers.filter((c) => c.status === 'overdue' || c.status === 'credit-hold').length;
  const riskSub = document.getElementById('crm-metric-risk-sub');
  if (riskSub) riskSub.textContent = `${riskCount} customers on alert`;
  const custSub = document.getElementById('crm-metric-customers-sub');
  if (custSub) custSub.textContent = `${customers.filter((c) => c.status === 'active').length} active accounts`;
}

function populateOwnerSelect(selectId, includeAll = false) {
  const select = document.getElementById(selectId);
  if (!select) return;
  const owners = getOwnerOptions(appState);
  select.innerHTML = includeAll ? '<option value="all">All owners</option>' : '';
  owners.forEach((owner) => {
    select.innerHTML += `<option value="${owner.id}">${escapeHtml(owner.name)}</option>`;
  });
}

function updateTableInfo(total, start, end) {
  const info = document.getElementById('crm-table-info');
  if (info) {
    info.textContent = total === 0 ? 'Showing 0 to 0 of 0 records' : `Showing ${start} to ${end} of ${total} records`;
  }
  const pageEl = document.getElementById('crm-page-number');
  if (pageEl) pageEl.textContent = `Page ${listState.currentPage}`;
  const prevBtn = document.getElementById('crm-page-prev');
  const nextBtn = document.getElementById('crm-page-next');
  if (prevBtn) prevBtn.disabled = listState.currentPage <= 1;
  if (nextBtn) {
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    nextBtn.disabled = listState.currentPage >= totalPages;
  }
}

function creditBarHtml(customer) {
  const limit = Number(customer.creditLimit || 0);
  const used = Number(customer.totalDue || 0);
  if (!limit) return '';
  const pct = Math.min(100, Math.round((used / limit) * 100));
  const barColor = pct >= 90 ? 'bg-rose-500' : pct >= 60 ? 'bg-amber-500' : 'bg-emerald-500';
  return `
    <div class="mt-1.5 w-24 ml-auto">
      <div class="h-1 rounded-full bg-slate-100 overflow-hidden">
        <div class="${barColor} h-full rounded-full" style="width:${pct}%"></div>
      </div>
      <div class="text-[8px] text-slate-400 font-semibold mt-0.5">Credit ${pct}%</div>
    </div>
  `;
}

function renderCustomersTable() {
  const tbody = document.getElementById('crm-customers-body');
  if (!tbody) return;

  updateQuickFilterChips();
  renderActiveFilterChips();

  const allCustomers = getCustomerList(appState);
  const customers = getFilteredCustomers();
  const total = customers.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE) || 1);
  if (listState.currentPage > totalPages) listState.currentPage = totalPages;

  const startIdx = total === 0 ? 0 : (listState.currentPage - 1) * PAGE_SIZE;
  const endIdx = Math.min(startIdx + PAGE_SIZE, total);
  const pageRows = customers.slice(startIdx, endIdx);

  tbody.innerHTML = '';

  if (total === 0) {
    const filtered = hasActiveFilters();
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="p-12 text-center">
          <div class="flex flex-col items-center justify-center">
            <div class="w-16 h-16 rounded-2xl ${filtered ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'} flex items-center justify-center mb-4">
              <i data-lucide="${filtered ? 'search' : 'users'}" class="w-8 h-8"></i>
            </div>
            <h3 class="text-sm font-bold text-slate-900">${filtered ? 'No Results Match Your Filters' : 'No Customers Yet'}</h3>
            <p class="text-xs text-slate-500 font-medium mt-1 mb-4">${filtered ? 'Try adjusting your search or filter criteria.' : 'Add your first customer to start tracking sales and dues.'}</p>
            ${filtered
              ? '<button onclick="window.clearCustomerFilters()" class="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-4 py-2 rounded-xl cursor-pointer">Clear Filters</button>'
              : '<button onclick="window.openCustomerModal()" class="bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors cursor-pointer">Add Customer</button>'}
          </div>
        </td>
      </tr>
    `;
    updateTableInfo(0, 0, 0);
    initIcons();
    return;
  }

  pageRows.forEach((customer) => {
    const hasDue = Number(customer.totalDue || 0) > 0;
    const isRisk = customer.status === 'overdue' || customer.status === 'credit-hold';
    const rowAccent = isRisk ? 'border-l-2 border-rose-400' : '';
    tbody.innerHTML += `
      <tr class="hover:bg-slate-50 transition-colors ${rowAccent}">
        <td class="p-4 text-center"><input type="checkbox" class="crm-row-select cursor-pointer" data-id="${escapeHtml(customer.id)}" onclick="window.updateBulkSelection()"></td>
        <td class="p-4">
          <div class="flex items-center gap-3">
            ${avatarHtml(customer.name)}
            <div class="min-w-0">
              <div class="font-bold text-slate-900 cursor-pointer hover:text-blue-600 truncate" onclick="window.openCRMDrawer('${escapeHtml(customer.id)}')">${escapeHtml(customer.name)}</div>
              <div class="text-[10px] text-slate-400 font-semibold truncate">${escapeHtml(customer.company)}</div>
              <div class="mt-1">${tierBadgeHtml(customer.pricingTier)}</div>
            </div>
          </div>
        </td>
        <td class="p-4">${escapeHtml(customer.contactName || '—')}</td>
        <td class="p-4">${escapeHtml(customer.phone || '—')}<br><span class="text-[10px] text-slate-400 font-semibold">${escapeHtml(customer.email || '—')}</span></td>
        <td class="p-4">
          <div class="flex items-center gap-2">
            ${customer.ownerName ? avatarHtml(customer.ownerName, 'w-6 h-6', 'text-[8px]') : ''}
            <span>${escapeHtml(customer.ownerName || '—')}</span>
          </div>
        </td>
        <td class="p-4 text-right">
          <div class="font-bold text-slate-900 text-[10px]">Sales: ${formatCurrency(customer.totalSales)}</div>
          <div class="text-[11px] font-extrabold ${hasDue ? 'text-rose-600' : 'text-slate-400'} flex items-center justify-end gap-1">
            ${hasDue ? '<span class="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>' : ''}
            Due: ${formatCurrency(customer.totalDue)}
          </div>
          ${creditBarHtml(customer)}
        </td>
        <td class="p-4"><span class="px-2 py-0.5 rounded-full text-[9px] font-bold ${statusBadgeClass(customer.status)}">${escapeHtml(customer.status)}</span></td>
        <td class="p-4 text-center">
          <div class="inline-flex items-center justify-center gap-1 rounded-xl border border-sky-100 bg-sky-50 p-1">
            <button type="button" onclick="window.openCRMDrawer('${escapeHtml(customer.id)}')" title="View" class="p-1 rounded-lg hover:bg-white/80 transition-all cursor-pointer">
              ${actionIcon('view.png', 'View', 'w-5 h-5')}
            </button>
            <button type="button" onclick="window.openCustomerModal('${escapeHtml(customer.id)}')" title="Edit" class="p-1 rounded-lg hover:bg-white/80 transition-all cursor-pointer">
              ${actionIcon('edit.png', 'Edit', 'w-5 h-5')}
            </button>
          </div>
        </td>
      </tr>
    `;
  });

  updateTableInfo(total, startIdx + 1, endIdx);
  window.updateBulkSelection();
  initIcons();
}

function renderDrawerHero(profile) {
  const hero = document.getElementById('crm-drawer-hero');
  if (!hero || !profile) return;

  const c = profile.customer;
  const sales = profile.financialSummary?.totalSales ?? 0;
  const due = profile.financialSummary?.totalDue ?? 0;
  const limit = profile.financialSummary?.creditLimit ?? c.creditLimit ?? 0;
  const lastPurchase = profile.financialSummary?.lastPurchaseDate;

  hero.innerHTML = `
    <div class="flex flex-col md:flex-row md:items-center gap-4">
      ${avatarHtml(c.name, 'w-14 h-14', 'text-sm')}
      <div class="flex-1 min-w-0">
        <div class="flex flex-wrap items-center gap-2">
          <h4 class="text-base font-extrabold text-slate-900">${escapeHtml(c.name)}</h4>
          <span class="px-2 py-0.5 rounded-full text-[9px] font-bold ${statusBadgeClass(c.status)}">${escapeHtml(c.status)}</span>
          ${tierBadgeHtml(c.pricingTier)}
        </div>
        <p class="text-xs text-slate-500 font-semibold mt-1">${escapeHtml(c.company)} · ${escapeHtml(c.ownerName || 'No Rep')}</p>
      </div>
    </div>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
      <div class="bg-white/80 p-3 rounded-xl border border-emerald-100 flex items-start gap-2">
        ${metricIcon('spending.png', 'Total Sales', 'w-6 h-6')}
        <div><div class="text-[9px] font-bold text-slate-400 uppercase">Total Sales</div><div class="text-sm font-extrabold text-emerald-600">${formatCurrency(sales)}</div></div>
      </div>
      <div class="bg-white/80 p-3 rounded-xl border border-rose-100 flex items-start gap-2">
        ${metricIcon('risk.png', 'Outstanding', 'w-6 h-6')}
        <div><div class="text-[9px] font-bold text-slate-400 uppercase">Outstanding</div><div class="text-sm font-extrabold text-rose-600">${formatCurrency(due)}</div></div>
      </div>
      <div class="bg-white/80 p-3 rounded-xl border border-blue-100 flex items-start gap-2">
        ${metricIcon('reps.png', 'Credit Limit', 'w-6 h-6')}
        <div><div class="text-[9px] font-bold text-slate-400 uppercase">Credit Limit</div><div class="text-sm font-extrabold text-blue-600">${formatCurrency(limit)}</div></div>
      </div>
      <div class="bg-white/80 p-3 rounded-xl border border-slate-200 flex items-start gap-2">
        ${metricIcon('scheduled.png', 'Last Purchase', 'w-6 h-6')}
        <div><div class="text-[9px] font-bold text-slate-400 uppercase">Last Purchase</div><div class="text-sm font-extrabold text-slate-700">${formatDate(lastPurchase)}</div></div>
      </div>
    </div>
  `;
}

function renderProfileTabContent(tabName, profile) {
  const content = document.getElementById('crm-profile-content');
  if (!content || !profile) return;

  if (tabName === 'overview') {
    const sales = profile.financialSummary?.totalSales ?? 0;
    const due = profile.financialSummary?.totalDue ?? 0;
    content.innerHTML = `
      <div class="space-y-4 text-xs font-semibold text-slate-700">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
            <div class="flex items-center gap-2 mb-2">${metricIcon('customers.png', 'Info', 'w-5 h-5')}<div class="text-[10px] font-bold text-slate-400 uppercase">Customer Information</div></div>
            <div class="mt-2">Name: <span class="text-slate-900">${escapeHtml(profile.customer.name)}</span></div>
            <div>Company: <span class="text-slate-900">${escapeHtml(profile.customer.company)}</span></div>
            <div>Territory: <span class="text-slate-900">${escapeHtml(profile.customer.territory || '—')}</span></div>
            <div>Email: <span class="text-slate-900">${escapeHtml(profile.contacts[0]?.email || '—')}</span></div>
            <div>Phone: <span class="text-slate-900">${escapeHtml(profile.contacts[0]?.phone || '—')}</span></div>
          </div>
          <div class="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
            <div class="flex items-center gap-2 mb-2">${metricIcon('spending.png', 'Finance', 'w-5 h-5')}<div class="text-[10px] font-bold text-slate-400 uppercase">Financial Metrics</div></div>
            <div class="mt-2">Total Spend: <span class="text-emerald-600 font-bold">${formatCurrency(sales)}</span></div>
            <div>Outstanding: <span class="text-rose-600 font-bold">${formatCurrency(due)}</span></div>
            <div>Payment Terms: <span class="text-slate-900">${escapeHtml(profile.customer.paymentTerms || 'Net 30')}</span></div>
            <div>Category: <span class="text-slate-900">${escapeHtml(profile.customer.category || '—')}</span></div>
          </div>
        </div>
      </div>
    `;
    return;
  }

  if (tabName === 'contacts') {
    const contacts = profile.contacts.length
      ? profile.contacts.map((contact) => `
          <div class="bg-white p-4 rounded-xl border border-slate-200">
            <div class="font-bold text-slate-900">${escapeHtml(contact.name)}${contact.primary ? ' <span class="text-[9px] text-blue-600">Primary</span>' : ''}</div>
            <div class="text-[10px] text-slate-400 mt-1">${escapeHtml(contact.designation || 'Contact')}</div>
            <div class="mt-2">${escapeHtml(contact.phone || '—')}</div>
            <div class="text-slate-500">${escapeHtml(contact.email || '—')}</div>
          </div>
        `).join('')
      : '<div class="text-slate-400">No contacts on file.</div>';

    const addresses = profile.addresses.length
      ? profile.addresses.map((addr) => `
          <div class="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div class="text-[10px] font-bold text-slate-400 uppercase">${escapeHtml(addr.type || 'Address')}</div>
            <div class="mt-1 text-slate-900">${escapeHtml(addr.line1 || '—')}</div>
            <div class="text-slate-500">${escapeHtml([addr.city, addr.region, addr.country].filter(Boolean).join(', ') || '—')}</div>
          </div>
        `).join('')
      : '<div class="text-slate-400">No addresses on file.</div>';

    content.innerHTML = `
      <div class="space-y-6 text-xs font-semibold text-slate-700">
        <div><div class="text-[10px] font-bold text-slate-400 uppercase mb-3">Contacts</div><div class="grid grid-cols-1 md:grid-cols-2 gap-3">${contacts}</div></div>
        <div><div class="text-[10px] font-bold text-slate-400 uppercase mb-3">Addresses</div><div class="grid grid-cols-1 md:grid-cols-2 gap-3">${addresses}</div></div>
      </div>
    `;
    return;
  }

  if (tabName === 'sales') {
    const invoices = profile.invoices || [];
    if (!invoices.length) {
      content.innerHTML = '<div class="text-slate-400 text-xs font-semibold p-4 bg-slate-50 rounded-xl border border-slate-200">No sales invoices recorded for this customer yet.</div>';
      return;
    }
    content.innerHTML = `
      <div class="overflow-x-auto rounded-xl border border-slate-100">
        <table class="w-full text-left text-xs">
          <thead><tr class="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
            <th class="p-3">Date</th><th class="p-3">Invoice</th><th class="p-3 text-right">Amount</th><th class="p-3">Status</th>
          </tr></thead>
          <tbody class="divide-y divide-slate-100">
            ${invoices.map((inv) => `
              <tr class="hover:bg-slate-50">
                <td class="p-3">${formatDate(inv.date || inv.issueDate)}</td>
                <td class="p-3 font-bold text-slate-900">${escapeHtml(inv.ref || inv.id || '—')}</td>
                <td class="p-3 text-right font-bold">${formatCurrency(inv.total || inv.amount)}</td>
                <td class="p-3"><span class="px-2 py-0.5 rounded-full text-[9px] font-bold ${invoiceStatusClass(inv.status)}">${escapeHtml(inv.status || '—')}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
    return;
  }

  if (tabName === 'activity') {
    const todayStr = new Date().toISOString().slice(0, 10);
    const activities = (profile.activities || []).slice(0, 20);
    const tasks = (profile.tasks || []).filter((t) => t.status !== 'done');

    const activityHtml = activities.length
      ? activities.map((act) => `
          <div class="flex gap-3 pb-4 border-l-2 border-blue-200 pl-4 ml-2">
            <div class="flex-1">
              <div class="font-bold text-slate-900">${escapeHtml(act.summary || act.activityType || 'Activity')}</div>
              <div class="text-[10px] text-slate-400 mt-0.5">${formatDate(act.completedAt || act.createdAt)} · ${escapeHtml(act.activityType || 'note')}</div>
              ${act.note ? `<div class="text-slate-600 mt-1">${escapeHtml(act.note)}</div>` : ''}
            </div>
          </div>
        `).join('')
      : '<div class="text-slate-400 mb-4">No activity logged yet.</div>';

    const tasksHtml = tasks.length
      ? tasks.map((task) => {
          let colorClass = 'text-slate-500';
          if (task.dueDate && task.dueDate < todayStr) colorClass = 'text-rose-600 font-extrabold';
          else if (task.dueDate === todayStr) colorClass = 'text-amber-600 font-extrabold';
          return `
            <div class="bg-amber-50/50 p-3 rounded-xl border border-amber-100 flex items-center justify-between gap-2">
              <div>
                <div class="font-bold text-slate-900">${escapeHtml(task.title || task.summary || 'Follow-up')}</div>
                <div class="text-[10px] ${colorClass}">Due: ${escapeHtml(task.dueDate || '—')}</div>
              </div>
              <span class="px-2 py-0.5 rounded-full text-[9px] font-bold bg-white border border-amber-200 text-amber-700">${escapeHtml(task.status || 'open')}</span>
            </div>
          `;
        }).join('')
      : '<div class="text-slate-400">No open follow-ups.</div>';

    content.innerHTML = `
      <div class="space-y-6 text-xs font-semibold text-slate-700">
        <div><div class="text-[10px] font-bold text-slate-400 uppercase mb-3">Open Follow-ups</div><div class="space-y-2">${tasksHtml}</div></div>
        <div><div class="text-[10px] font-bold text-slate-400 uppercase mb-3">Activity Timeline</div>${activityHtml}</div>
      </div>
    `;
  }
}

window.showCustomersMainView = function () {
  document.getElementById('crm-customers-main-view').classList.remove('hidden');
  document.getElementById('crm-customers-form-view').classList.add('hidden');
};

window.showCustomersFormView = function () {
  document.getElementById('crm-customers-main-view').classList.add('hidden');
  document.getElementById('crm-customers-form-view').classList.remove('hidden');
};

window.openCustomerModal = function (customerId = '') {
  document.getElementById('crm-customer-form').reset();
  document.getElementById('crm-customer-id').value = '';
  document.getElementById('crm-customer-modal-title').textContent = 'Create Customer';
  populateOwnerSelect('crm-input-owner');

  if (customerId) {
    const profile = getCustomerProfile(appState, customerId);
    if (profile) {
      document.getElementById('crm-customer-id').value = customerId;
      document.getElementById('crm-customer-modal-title').textContent = 'Edit Customer';
      document.getElementById('crm-input-name').value = profile.customer.name;
      document.getElementById('crm-input-company').value = profile.customer.company;
      document.getElementById('crm-input-email').value = profile.contacts[0]?.email || '';
      document.getElementById('crm-input-phone').value = profile.contacts[0]?.phone || '';
      document.getElementById('crm-input-status').value = profile.customer.status;
      document.getElementById('crm-input-owner').value = profile.customer.ownerId || '';
    }
  }

  window.showCustomersFormView();
};

window.handleCustomerSubmit = function (event) {
  event.preventDefault();
  const customerId = document.getElementById('crm-customer-id').value;
  const payload = {
    name: document.getElementById('crm-input-name').value.trim(),
    company: document.getElementById('crm-input-company').value.trim(),
    email: document.getElementById('crm-input-email').value.trim(),
    phone: document.getElementById('crm-input-phone').value.trim(),
    status: document.getElementById('crm-input-status').value,
    ownerId: document.getElementById('crm-input-owner').value,
    ownerName: document.getElementById('crm-input-owner').options[document.getElementById('crm-input-owner').selectedIndex]?.text || ''
  };

  const result = customerId ? updateCustomer(appState, customerId, payload) : createCustomer(appState, payload);
  if (!result.ok) {
    alert(result.error || 'Unable to save customer.');
    return;
  }

  window.showCustomersMainView();
  saveAndRender();
};

window.openCRMDrawer = function (customerId) {
  const profile = getCustomerProfile(appState, customerId);
  if (!profile) return;

  currentDrawerCustomerId = customerId;
  document.getElementById('crm-drawer-subtitle').textContent = `${profile.customer.company} · ${profile.customer.ownerName || 'No Rep'}`;
  renderDrawerHero(profile);
  window.switchProfileTab('overview');

  document.getElementById('crm-details-drawer-overlay').classList.remove('hidden');
  setTimeout(() => {
    const modal = document.getElementById('crm-details-drawer');
    modal.classList.remove('scale-95', 'opacity-0');
    modal.classList.add('scale-100', 'opacity-100');
  }, 10);
  initIcons();
};

window.closeCRMDrawer = function () {
  const modal = document.getElementById('crm-details-drawer');
  modal.classList.remove('scale-100', 'opacity-100');
  modal.classList.add('scale-95', 'opacity-0');
  setTimeout(() => {
    document.getElementById('crm-details-drawer-overlay').classList.add('hidden');
    currentDrawerCustomerId = null;
  }, 300);
};

window.switchProfileTab = function (tabName) {
  const content = document.getElementById('crm-profile-content');
  if (!content || !currentDrawerCustomerId) return;

  document.querySelectorAll('.crm-profile-tab').forEach((t) => {
    if (t.getAttribute('data-tab') === tabName) {
      t.className = 'crm-profile-tab px-3 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white cursor-pointer';
    } else {
      t.className = 'crm-profile-tab px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-900 cursor-pointer';
    }
  });

  const profile = getCustomerProfile(appState, currentDrawerCustomerId);
  if (!profile) return;
  renderProfileTabContent(tabName, profile);
};

window.setCustomerQuickFilter = function (key) {
  listState.quickFilter = key || 'all';
  if (key === 'active') listState.status = 'active';
  else if (key === 'overdue') listState.status = 'overdue';
  else if (key === 'all') listState.status = 'all';
  listState.currentPage = 1;
  const statusEl = document.getElementById('crm-filter-status');
  if (statusEl && (key === 'active' || key === 'overdue' || key === 'all')) {
    statusEl.value = listState.status;
  }
  renderCustomersTable();
  window.scrollToCustomerTable();
};

window.scrollToCustomerTable = function () {
  document.getElementById('crm-customers-table-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

window.removeCustomerFilterChip = function (key) {
  if (key === 'quick') listState.quickFilter = 'all';
  if (key === 'search') {
    listState.searchQuery = '';
    const searchEl = document.getElementById('crm-search-input');
    if (searchEl) searchEl.value = '';
  }
  if (key === 'status') {
    listState.status = 'all';
    const el = document.getElementById('crm-filter-status');
    if (el) el.value = 'all';
  }
  if (key === 'tier') {
    listState.tier = 'all';
    const el = document.getElementById('crm-filter-tier');
    if (el) el.value = 'all';
  }
  if (key === 'owner') {
    listState.ownerId = 'all';
    const el = document.getElementById('crm-filter-owner');
    if (el) el.value = 'all';
  }
  if (key === 'territory') {
    listState.territory = '';
    const el = document.getElementById('crm-filter-territory');
    if (el) el.value = '';
  }
  listState.currentPage = 1;
  renderCustomersTable();
};

window.handleCustomerSearch = function (value) {
  listState.searchQuery = String(value || '').toLowerCase().trim();
  listState.currentPage = 1;
  renderCustomersTable();
};

window.handleCustomerSort = function (value) {
  listState.sortKey = value || 'name-asc';
  listState.currentPage = 1;
  renderCustomersTable();
};

window.applyCustomerFilter = function () {
  const statusEl = document.getElementById('crm-filter-status');
  const tierEl = document.getElementById('crm-filter-tier');
  const ownerEl = document.getElementById('crm-filter-owner');
  const territoryEl = document.getElementById('crm-filter-territory');
  listState.status = statusEl?.value || 'all';
  listState.tier = tierEl?.value || 'all';
  listState.ownerId = ownerEl?.value || 'all';
  listState.territory = String(territoryEl?.value || '').toLowerCase().trim();
  if (listState.status !== 'active' && listState.status !== 'overdue') {
    if (listState.quickFilter === 'active' || listState.quickFilter === 'overdue') {
      listState.quickFilter = 'all';
    }
  }
  listState.currentPage = 1;
  renderCustomersTable();
};

window.clearCustomerFilters = function () {
  listState.searchQuery = '';
  listState.status = 'all';
  listState.tier = 'all';
  listState.ownerId = 'all';
  listState.territory = '';
  listState.quickFilter = 'all';
  listState.currentPage = 1;
  const searchEl = document.getElementById('crm-search-input');
  const statusEl = document.getElementById('crm-filter-status');
  const tierEl = document.getElementById('crm-filter-tier');
  const ownerEl = document.getElementById('crm-filter-owner');
  const territoryEl = document.getElementById('crm-filter-territory');
  if (searchEl) searchEl.value = '';
  if (statusEl) statusEl.value = 'all';
  if (tierEl) tierEl.value = 'all';
  if (ownerEl) ownerEl.value = 'all';
  if (territoryEl) territoryEl.value = '';
  renderCustomersTable();
};

window.toggleAdvancedFilters = function () {
  document.getElementById('crm-advanced-filters')?.classList.toggle('hidden');
};

window.changeCustomerPage = function (delta) {
  const total = getFilteredCustomers().length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE) || 1);
  listState.currentPage = Math.min(totalPages, Math.max(1, listState.currentPage + Number(delta || 0)));
  renderCustomersTable();
};

window.toggleBulkSelectAll = function (checked) {
  document.querySelectorAll('.crm-row-select').forEach((el) => { el.checked = !!checked; });
  window.updateBulkSelection();
};

window.updateBulkSelection = function () {
  const selected = [...document.querySelectorAll('.crm-row-select:checked')];
  const toolbar = document.getElementById('crm-bulk-toolbar');
  const countEl = document.getElementById('crm-bulk-count');
  if (countEl) countEl.textContent = selected.length;
  if (toolbar) {
    if (selected.length > 0) toolbar.classList.remove('hidden');
    else toolbar.classList.add('hidden');
  }
  const selectAll = document.getElementById('crm-bulk-select-all');
  const all = [...document.querySelectorAll('.crm-row-select')];
  if (selectAll && all.length) selectAll.checked = all.every((el) => el.checked);
};

function getSelectedCustomerIds() {
  return [...document.querySelectorAll('.crm-row-select:checked')].map((el) => el.getAttribute('data-id')).filter(Boolean);
}

function downloadTextFile(filename, content, mime = 'text/csv;charset=utf-8') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

window.bulkExportCustomers = function () {
  const ids = getSelectedCustomerIds();
  if (!ids.length) return;
  downloadTextFile(`customers-export-${new Date().toISOString().slice(0, 10)}.csv`, exportCustomersCsv(appState, ids));
};

window.bulkDeleteCustomers = function () {
  const ids = getSelectedCustomerIds();
  if (!ids.length) return;
  if (!confirm(`Delete ${ids.length} selected customer(s)? This cannot be undone.`)) return;
  ids.forEach((id) => deleteCustomer(appState, id));
  saveAndRender();
};

window.downloadCustomerTemplate = function () {
  downloadTextFile('customer-import-template.csv', getCustomerTemplateCsv());
};

window.bulkAssignCustomers = function () {
  const ids = getSelectedCustomerIds();
  if (!ids.length) return;
  populateOwnerSelect('crm-bulk-assign-owner');
  document.getElementById('crm-bulk-assign-modal')?.classList.remove('hidden');
};

window.closeBulkAssignModal = function () {
  document.getElementById('crm-bulk-assign-modal')?.classList.add('hidden');
};

window.confirmBulkAssign = function () {
  const ids = getSelectedCustomerIds();
  const select = document.getElementById('crm-bulk-assign-owner');
  if (!ids.length || !select?.value) return;
  const ownerName = select.options[select.selectedIndex]?.text || '';
  ids.forEach((id) => updateCustomer(appState, id, { ownerId: select.value, ownerName }));
  window.closeBulkAssignModal();
  saveAndRender();
};

window.openImportModal = function () {
  const result = document.getElementById('crm-import-result');
  const file = document.getElementById('crm-import-file');
  if (result) { result.classList.add('hidden'); result.textContent = ''; }
  if (file) file.value = '';
  document.getElementById('crm-import-modal')?.classList.remove('hidden');
};

window.closeImportModal = function () {
  document.getElementById('crm-import-modal')?.classList.add('hidden');
};

function parseCsvLine(line) {
  const cells = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i += 1; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      cells.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  cells.push(current.trim());
  return cells;
}

window.processCustomerImport = function () {
  const fileInput = document.getElementById('crm-import-file');
  const resultEl = document.getElementById('crm-import-result');
  const file = fileInput?.files?.[0];
  if (!file) {
    alert('Please choose a CSV file first.');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const text = String(e.target?.result || '');
    const lines = text.split(/\r?\n/).filter((line) => line.trim());
    if (lines.length < 2) {
      if (resultEl) {
        resultEl.className = 'text-xs font-semibold mb-4 text-rose-600';
        resultEl.textContent = 'CSV file is empty or invalid.';
        resultEl.classList.remove('hidden');
      }
      return;
    }

    const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
    let imported = 0;
    let skipped = 0;

    for (let i = 1; i < lines.length; i += 1) {
      const cells = parseCsvLine(lines[i]);
      const row = {};
      headers.forEach((header, idx) => { row[header] = cells[idx] || ''; });
      if (!row.name && !row.company) { skipped += 1; continue; }

      const payload = {
        name: row.name || row.company,
        company: row.company || row.name,
        email: row.email || '',
        phone: row.phone || '',
        status: row.status || 'active',
        ownerName: row.ownername || row.owner || '',
        contactName: row.contactname || row.name || '',
        pricingTier: row.pricingtier || 'Standard',
        paymentTerms: row.paymentterms || 'Net 30',
        territory: row.territory || '',
        branch: row.branch || ''
      };

      const owners = getOwnerOptions(appState);
      const owner = owners.find((o) => o.name.toLowerCase() === String(payload.ownerName).toLowerCase());
      if (owner) payload.ownerId = owner.id;

      const result = createCustomer(appState, payload);
      if (result.ok) imported += 1;
      else skipped += 1;
    }

    saveAppState();
    renderCustomersTable();
    updateMetrics();

    if (resultEl) {
      resultEl.className = 'text-xs font-semibold mb-4 text-emerald-600';
      resultEl.textContent = `Imported ${imported} customer(s). Skipped ${skipped}.`;
      resultEl.classList.remove('hidden');
    }
  };
  reader.readAsText(file);
};

window.exportCustomerProfilePdf = function () {
  if (currentDrawerCustomerId) {
    window.print();
    return;
  }
  alert('Open a customer profile first to print.');
};

window.openTimelineModal = function () {
  if (!currentDrawerCustomerId) return;
  document.getElementById('crm-activity-summary').value = '';
  document.getElementById('crm-activity-note').value = '';
  document.getElementById('crm-activity-type').value = 'note';
  document.getElementById('crm-activity-modal')?.classList.remove('hidden');
};

window.closeActivityModal = function () {
  document.getElementById('crm-activity-modal')?.classList.add('hidden');
};

window.saveCustomerActivity = function () {
  if (!currentDrawerCustomerId) return;
  const summary = document.getElementById('crm-activity-summary').value.trim();
  const note = document.getElementById('crm-activity-note').value.trim();
  const activityType = document.getElementById('crm-activity-type').value;
  if (!summary) {
    alert('Please enter an activity summary.');
    return;
  }

  createActivityEntry(appState, {
    entityType: 'customer',
    entityId: currentDrawerCustomerId,
    activityType,
    summary,
    note
  });

  saveAppState();
  window.closeActivityModal();
  window.switchProfileTab('activity');
};

document.addEventListener('DOMContentLoaded', async () => {
  await appReadyPromise;
  ensureCrmState(appState);
  populateOwnerSelect('crm-input-owner');
  populateOwnerSelect('crm-filter-owner', true);
  const sortEl = document.getElementById('crm-sort-select');
  if (sortEl) listState.sortKey = sortEl.value || 'name-asc';
  renderCustomersTable();
  updateMetrics();
  initIcons();
});

window.addEventListener('hookerp:language-changed', () => {
  populateOwnerSelect('crm-input-owner');
  populateOwnerSelect('crm-filter-owner', true);
  if (currentDrawerCustomerId) {
    const profile = getCustomerProfile(appState, currentDrawerCustomerId);
    if (profile) renderDrawerHero(profile);
  }
  renderCustomersTable();
  updateMetrics();
  initIcons();
});
