import { appReadyPromise, appState, saveAppState, initIcons } from '/js/shared.js';

const DEFAULT_DISPATCHES = [
  {
    id: 'DSP-001',
    date: '2026-07-20',
    salesOrderId: 'SO-2026-0001',
    vehicleId: 'AST-003',
    vehicleName: 'Delivery Van (Ford Transit)',
    driverName: 'Rahim Uddin',
    driverPhone: '01711-111111',
    eta: '2026-07-20T14:30',
    status: 'on_route',
    location: 'Dhaka',
    stockDeducted: true
  },
  {
    id: 'DSP-002',
    date: '2026-07-20',
    salesOrderId: 'SO-2026-0002',
    vehicleId: 'AST-003',
    vehicleName: 'Delivery Van (Ford Transit)',
    driverName: 'Karim Hossain',
    driverPhone: '01722-222222',
    eta: '2026-07-20T16:00',
    status: 'on_route',
    location: 'Dhaka',
    stockDeducted: true
  },
  {
    id: 'DSP-003',
    date: '2026-07-19',
    salesOrderId: 'SO-2026-0001',
    vehicleId: 'AST-003',
    vehicleName: 'Delivery Van (Ford Transit)',
    driverName: 'Rahim Uddin',
    driverPhone: '01711-111111',
    eta: '2026-07-19T11:00',
    status: 'delivered',
    location: 'Mirpur',
    stockDeducted: true
  },
  {
    id: 'DSP-004',
    date: '2026-07-21',
    salesOrderId: 'SO-2026-0002',
    vehicleId: '',
    vehicleName: '',
    driverName: '',
    driverPhone: '',
    eta: '2026-07-21T10:00',
    status: 'scheduled',
    location: 'Chittagong',
    stockDeducted: false
  },
  {
    id: 'DSP-005',
    date: '2026-07-18',
    salesOrderId: 'SO-2026-0001',
    vehicleId: 'AST-003',
    vehicleName: 'Delivery Van (Ford Transit)',
    driverName: 'Salma Begum',
    driverPhone: '01733-333333',
    eta: '2026-07-18T15:30',
    status: 'delivered',
    location: 'Mirpur',
    stockDeducted: true
  },
  {
    id: 'DSP-006',
    date: '2026-07-21',
    salesOrderId: 'SO-2026-0002',
    vehicleId: 'AST-003',
    vehicleName: 'Delivery Van (Ford Transit)',
    driverName: 'Karim Hossain',
    driverPhone: '01722-222222',
    eta: '2026-07-21T13:00',
    status: 'scheduled',
    location: 'Chittagong',
    stockDeducted: false
  }
];

let routeHintDismissed = false;
const selectedIds = new Set();

function normalizeDispatchStatus(status) {
  const map = {
    Scheduled: 'scheduled',
    scheduled: 'scheduled',
    Dispatched: 'on_route',
    on_route: 'on_route',
    'On route': 'on_route',
    Delivered: 'delivered',
    delivered: 'delivered',
    Cancelled: 'scheduled',
    cancelled: 'scheduled'
  };
  return map[status] || 'scheduled';
}

function statusLabel(status) {
  const labels = { scheduled: 'Scheduled', on_route: 'On route', delivered: 'Delivered' };
  return labels[status] || status;
}

function statusBadgeClass(status) {
  if (status === 'scheduled') return 'dispatch-badge dispatch-badge-scheduled';
  if (status === 'on_route') return 'dispatch-badge dispatch-badge-on_route';
  if (status === 'delivered') return 'dispatch-badge dispatch-badge-delivered';
  return 'dispatch-badge dispatch-badge-slate';
}

function getDispatchSettings() {
  if (!appState.dispatchSettings) {
    appState.dispatchSettings = { autoSms: false };
    saveAppState();
  }
  return appState.dispatchSettings;
}

function getDispatches() {
  if (!Array.isArray(appState.dispatches) || (appState.dispatches.length === 0 && !appState._dispatchMigratedV2)) {
    appState.dispatches = DEFAULT_DISPATCHES.map((d) => ({ ...d }));
    appState._dispatchMigratedV2 = true;
    saveAppState();
  }

  appState.dispatches.forEach((d) => {
    d.status = normalizeDispatchStatus(d.status);
  });

  return appState.dispatches;
}

function getSalesOrders() {
  return Array.isArray(appState.salesOrders) ? appState.salesOrders : [];
}

function getVehicles() {
  const assets = Array.isArray(appState.assets) ? appState.assets : [];
  let vehicles = assets.filter((a) => a.category === 'Vehicle' || a.category === 'Vehicles');
  if (vehicles.length === 0) {
    vehicles = [
      { id: 'AST-003', name: 'Delivery Van (Ford Transit)', category: 'Vehicles' },
      { id: 'AST-004', name: 'Pickup Truck (Toyota Hilux)', category: 'Vehicles' }
    ];
  }
  return vehicles;
}

function getInventory() {
  return Array.isArray(appState.inventory) ? appState.inventory : [];
}

function escapeHtml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function actionIcon(file, alt, className = 'w-4 h-4') {
  return `<img src="/images/icons/actions/${file}" alt="${escapeHtml(alt)}" class="${className} object-contain pointer-events-none" />`;
}

function metricIcon(file, alt) {
  return `<img src="/images/icons/metrics/${file}" alt="${escapeHtml(alt)}" class="w-9 h-9 object-contain pointer-events-none shrink-0" />`;
}

function getNextDispatchId() {
  const maxNumericId = getDispatches().reduce((maxValue, item) => {
    const numericId = Number.parseInt(String(item.id || '').replace(/[^\d]/g, ''), 10);
    return Number.isFinite(numericId) ? Math.max(maxValue, numericId) : maxValue;
  }, 0);
  return `DSP-${String(maxNumericId + 1).padStart(3, '0')}`;
}

function driverInitials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatEta(eta) {
  if (!eta) return '—';
  const d = new Date(eta);
  if (Number.isNaN(d.getTime())) return eta;
  return d.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function vehicleDisplayName(dispatch) {
  if (dispatch.vehicleName) return dispatch.vehicleName;
  if (!dispatch.vehicleId) return 'N/A';
  const v = getVehicles().find((x) => x.id === dispatch.vehicleId);
  return v ? v.name : dispatch.vehicleId;
}

function simulateSmsNotification(dispatch, newStatus) {
  const settings = getDispatchSettings();
  if (!settings.autoSms) return;
  console.info(
    `[Dispatch SMS] ${dispatch.id} → ${statusLabel(newStatus)} | Driver: ${dispatch.driverName || 'N/A'} | Phone: ${dispatch.driverPhone || 'N/A'}`
  );
}

window.showMainView = function() {
  document.getElementById('dispatch-main-view').classList.remove('hidden');
  document.getElementById('dispatch-form-view').classList.add('hidden');
  renderAll();
};

window.showFormView = function() {
  document.getElementById('dispatch-main-view').classList.add('hidden');
  document.getElementById('dispatch-form-view').classList.remove('hidden');
};

window.openDispatchModal = function(dispatchId = '') {
  const form = document.getElementById('dispatch-form');
  if (!form) return;

  form.reset();
  document.getElementById('dispatch-edit-id').value = '';
  const titleEl = document.getElementById('dispatch-form-title');
  if (titleEl) titleEl.textContent = 'Create dispatch log';
  document.getElementById('dispatch-input-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('dispatch-input-eta').value = '';
  document.getElementById('dispatch-input-location').value = '';

  populateDropdowns();
  updateSmsNote();

  if (dispatchId) {
    const dispatch = getDispatches().find((d) => d.id === dispatchId);
    if (dispatch) {
      document.getElementById('dispatch-edit-id').value = dispatch.id;
      if (titleEl) titleEl.textContent = 'Edit dispatch log';
      document.getElementById('dispatch-input-so').value = dispatch.salesOrderId;
      document.getElementById('dispatch-input-date').value = dispatch.date;
      document.getElementById('dispatch-input-vehicle').value = dispatch.vehicleId || '';
      document.getElementById('dispatch-input-driver').value = dispatch.driverName || '';
      document.getElementById('dispatch-input-phone').value = dispatch.driverPhone || '';
      document.getElementById('dispatch-input-status').value = normalizeDispatchStatus(dispatch.status);
      document.getElementById('dispatch-input-eta').value = dispatch.eta || '';
      document.getElementById('dispatch-input-location').value = dispatch.location || '';
      document.getElementById('dispatch-input-so').disabled = !!dispatch.stockDeducted;
    }
  } else {
    document.getElementById('dispatch-input-so').disabled = false;
  }

  window.updateDispatchHelpers();
  window.showFormView();
  initIcons();
};

function populateDropdowns() {
  const soSelect = document.getElementById('dispatch-input-so');
  const salesOrders = getSalesOrders();

  soSelect.innerHTML = '<option value="">Select sales order...</option>' + salesOrders.map((so) =>
    `<option value="${so.id}">${escapeHtml(so.id)} (Customer: ${escapeHtml(so.customerName || 'Unknown')})</option>`
  ).join('');

  if (salesOrders.length === 0) {
    soSelect.innerHTML += `
      <option value="SO-2026-0001">SO-2026-0001 (Customer: Bell Labs)</option>
      <option value="SO-2026-0002">SO-2026-0002 (Customer: General Electric)</option>
    `;
  }

  const vehicleSelect = document.getElementById('dispatch-input-vehicle');
  const vehicles = getVehicles();
  vehicleSelect.innerHTML = '<option value="">Select vehicle...</option>' + vehicles.map((v) =>
    `<option value="${v.id}">${escapeHtml(v.id)} — ${escapeHtml(v.name)}</option>`
  ).join('');
}

function populateFilterDropdowns() {
  const filterVehicle = document.getElementById('dispatch-filter-vehicle');
  const bulkVehicle = document.getElementById('dispatch-bulk-vehicle');
  const vehicles = getVehicles();

  if (filterVehicle && filterVehicle.options.length <= 1) {
    vehicles.forEach((v) => {
      filterVehicle.innerHTML += `<option value="${v.id}">${escapeHtml(v.name)}</option>`;
    });
  }

  if (bulkVehicle) {
    bulkVehicle.innerHTML = '<option value="">Select vehicle</option>' + vehicles.map((v) =>
      `<option value="${v.id}">${escapeHtml(v.name)}</option>`
    ).join('');
  }
}

function updateSmsNote() {
  const note = document.getElementById('dispatch-sms-note');
  const settings = getDispatchSettings();
  if (note) note.classList.toggle('hidden', !settings.autoSms);
}

window.toggleAutoSms = function() {
  const settings = getDispatchSettings();
  const checked = document.getElementById('dispatch-sms-toggle')?.checked || false;
  settings.autoSms = checked;
  saveAppState();
  updateSmsNote();
};

window.updateDispatchHelpers = function() {
  const soId = document.getElementById('dispatch-input-so').value;
  const previewDiv = document.getElementById('dispatch-order-preview');
  const previewList = document.getElementById('dispatch-order-items');

  if (!soId) {
    previewDiv.classList.add('hidden');
    return;
  }

  const so = getSalesOrders().find((s) => s.id === soId);
  if (!so || !so.items || so.items.length === 0) {
    previewList.innerHTML = '<div class="text-slate-500 italic">No items found in this order.</div>';
    previewDiv.classList.remove('hidden');
    return;
  }

  previewList.innerHTML = so.items.map((item) =>
    `<div>• ${escapeHtml(item.name || item.productName)}: ${item.quantity} units</div>`
  ).join('');
  previewDiv.classList.remove('hidden');
};

window.handleSubmit = function(event) {
  event.preventDefault();

  const dispatches = getDispatches();
  const editId = document.getElementById('dispatch-edit-id').value;
  const soId = document.getElementById('dispatch-input-so').value;
  const newStatus = normalizeDispatchStatus(document.getElementById('dispatch-input-status').value);
  const vehicleId = document.getElementById('dispatch-input-vehicle').value;
  const vehicle = getVehicles().find((v) => v.id === vehicleId);

  if (!soId) {
    alert('Please select a sales order.');
    return;
  }

  let dispatch = editId ? dispatches.find((d) => d.id === editId) : null;
  const prevStatus = dispatch ? normalizeDispatchStatus(dispatch.status) : null;

  const payload = {
    id: editId || getNextDispatchId(),
    salesOrderId: soId,
    date: document.getElementById('dispatch-input-date').value,
    vehicleId,
    vehicleName: vehicle ? vehicle.name : '',
    driverName: document.getElementById('dispatch-input-driver').value.trim(),
    driverPhone: document.getElementById('dispatch-input-phone').value.trim(),
    eta: document.getElementById('dispatch-input-eta').value || '',
    location: document.getElementById('dispatch-input-location').value.trim() || '',
    status: newStatus,
    stockDeducted: dispatch ? dispatch.stockDeducted : false
  };

  if ((newStatus === 'on_route' || newStatus === 'delivered') && !payload.stockDeducted) {
    if (confirm('Dispatching this order will permanently deduct the items from inventory. Proceed?')) {
      processInventoryDeduction(payload.salesOrderId);
      payload.stockDeducted = true;
    } else {
      return;
    }
  }

  const existingIndex = dispatches.findIndex((d) => d.id === payload.id);
  if (existingIndex >= 0) {
    dispatches[existingIndex] = payload;
  } else {
    dispatches.push(payload);
  }

  if (prevStatus !== newStatus) {
    simulateSmsNotification(payload, newStatus);
  }

  saveAppState();
  window.showMainView();
};

function processInventoryDeduction(soId) {
  const so = getSalesOrders().find((s) => s.id === soId);
  if (!so || !so.items) return;

  const inventory = getInventory();
  so.items.forEach((item) => {
    const invItem = inventory.find((i) => String(i.id) === String(item.productId) || i.name === item.name || i.name === item.productName);
    if (invItem) {
      invItem.stock = Math.max(0, (invItem.stock || 0) - Number(item.quantity || 0));
    }
  });
  saveAppState();
}

function getFilteredDispatches() {
  const searchValue = String(document.getElementById('dispatch-search-input')?.value || '').toLowerCase();
  const filterStatus = document.getElementById('dispatch-filter-status')?.value || 'all';
  const filterVehicle = document.getElementById('dispatch-filter-vehicle')?.value || 'all';
  const dateStart = document.getElementById('dispatch-filter-date-start')?.value || '';
  const dateEnd = document.getElementById('dispatch-filter-date-end')?.value || '';

  return getDispatches().filter((d) => {
    const searchString = [d.id, d.salesOrderId, d.driverName, d.location].join(' ').toLowerCase();
    const searchMatch = !searchValue || searchString.includes(searchValue);
    const statusMatch = filterStatus === 'all' || normalizeDispatchStatus(d.status) === filterStatus;
    const vehicleMatch = filterVehicle === 'all' || d.vehicleId === filterVehicle;
    let dateMatch = true;
    if (dateStart) dateMatch = dateMatch && d.date >= dateStart;
    if (dateEnd) dateMatch = dateMatch && d.date <= dateEnd;
    return searchMatch && statusMatch && vehicleMatch && dateMatch;
  });
}

function renderEmptyState(colspan) {
  return `
    <tr>
      <td colspan="${colspan}" class="px-6 py-12 text-center">
        <div class="flex flex-col items-center gap-3">
          <div class="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
            <i data-lucide="truck" class="w-6 h-6 text-slate-400"></i>
          </div>
          <p class="text-sm font-semibold text-slate-700">No dispatches created yet</p>
          <p class="text-xs text-slate-400 font-medium">Create a dispatch log to assign vehicles and track deliveries.</p>
          <button type="button" onclick="window.openDispatchModal()" class="mt-1 inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold text-xs hover:bg-blue-700 cursor-pointer">
            <i data-lucide="plus" class="w-3.5 h-3.5"></i> New dispatch log
          </button>
        </div>
      </td>
    </tr>
  `;
}

function renderEmptyMobile() {
  return `
    <div class="dispatch-card p-8 flex flex-col items-center gap-3 text-center">
      <div class="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
        <i data-lucide="truck" class="w-6 h-6 text-slate-400"></i>
      </div>
      <p class="text-sm font-semibold text-slate-700">No dispatches created yet</p>
      <p class="text-xs text-slate-400 font-medium">Create a dispatch log to assign vehicles and track deliveries.</p>
      <button type="button" onclick="window.openDispatchModal()" class="mt-1 inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold text-xs hover:bg-blue-700 cursor-pointer">
        <i data-lucide="plus" class="w-3.5 h-3.5"></i> New dispatch log
      </button>
    </div>
  `;
}

function driverCellHtml(d) {
  const name = d.driverName || 'Unassigned';
  const initials = driverInitials(d.driverName);
  return `
    <div class="flex items-center gap-2">
      <div class="w-7 h-7 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center justify-center shrink-0">${escapeHtml(initials)}</div>
      <div class="min-w-0">
        <div class="font-semibold text-slate-700 truncate">${escapeHtml(name)}</div>
        <div class="text-[10px] text-slate-400 truncate">${escapeHtml(d.driverPhone || '')}</div>
      </div>
    </div>
  `;
}

window.renderTable = function() {
  const tbody = document.getElementById('dispatch-table-body');
  const mobileList = document.getElementById('dispatch-mobile-list');
  if (!tbody) return;

  const dispatches = getFilteredDispatches();
  tbody.innerHTML = '';

  if (dispatches.length === 0) {
    tbody.innerHTML = renderEmptyState(9);
    if (mobileList) mobileList.innerHTML = renderEmptyMobile();
    updateBulkBar();
    initIcons();
    return;
  }

  dispatches.forEach((d) => {
    const status = normalizeDispatchStatus(d.status);
    const checked = selectedIds.has(d.id) ? 'checked' : '';

    tbody.innerHTML += `
      <tr class="hover:bg-slate-50 transition-colors">
        <td class="px-4 py-3">
          <input type="checkbox" class="dispatch-row-check rounded border-slate-300 cursor-pointer" data-id="${escapeHtml(d.id)}" ${checked} onchange="window.toggleRowSelect('${escapeHtml(d.id)}', this.checked)">
        </td>
        <td class="px-4 py-3 font-semibold text-slate-900">${escapeHtml(d.id)}</td>
        <td class="px-4 py-3 text-[11px] text-slate-600">${escapeHtml(d.date)}</td>
        <td class="px-4 py-3">
          <span class="text-xs font-semibold text-blue-600">${escapeHtml(d.salesOrderId)}</span>
        </td>
        <td class="px-4 py-3 font-medium text-slate-700">${escapeHtml(vehicleDisplayName(d))}</td>
        <td class="px-4 py-3">${driverCellHtml(d)}</td>
        <td class="px-4 py-3 text-[11px] text-slate-600">${escapeHtml(formatEta(d.eta))}</td>
        <td class="px-4 py-3">
          <span class="${statusBadgeClass(status)}">${escapeHtml(statusLabel(status))}</span>
        </td>
        <td class="px-4 py-3 text-center">
          <div class="inline-flex items-center justify-center gap-1 rounded-xl border border-sky-100 bg-sky-50 p-1">
            <button type="button" onclick="window.viewLiveLocation('${escapeHtml(d.id)}')" title="View" class="p-1 rounded-lg hover:bg-white/80 transition-all cursor-pointer">
              ${actionIcon('view.png', 'View', 'w-5 h-5')}
            </button>
            <button type="button" onclick="window.openDispatchModal('${escapeHtml(d.id)}')" title="Edit" class="p-1 rounded-lg hover:bg-white/80 transition-all cursor-pointer">
              ${actionIcon('edit.png', 'Edit', 'w-5 h-5')}
            </button>
          </div>
        </td>
      </tr>
    `;
  });

  renderMobileCards(dispatches);
  updateBulkBar();
  initIcons();
};

function renderMobileCards(dispatches) {
  const mobileList = document.getElementById('dispatch-mobile-list');
  if (!mobileList) return;

  if (dispatches.length === 0) {
    mobileList.innerHTML = renderEmptyMobile();
    return;
  }

  mobileList.innerHTML = dispatches.map((d) => {
    const status = normalizeDispatchStatus(d.status);
    const checked = selectedIds.has(d.id) ? 'checked' : '';
    return `
      <div class="dispatch-card p-4 flex flex-col gap-3 hover:bg-slate-50/50 transition-colors">
        <div class="flex items-start justify-between gap-2">
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" class="dispatch-row-check rounded border-slate-300 cursor-pointer" data-id="${escapeHtml(d.id)}" ${checked} onchange="window.toggleRowSelect('${escapeHtml(d.id)}', this.checked)">
            <span class="font-semibold text-slate-900 text-xs">${escapeHtml(d.id)}</span>
          </label>
          <span class="${statusBadgeClass(status)}">${escapeHtml(statusLabel(status))}</span>
        </div>
        <div class="grid grid-cols-2 gap-2 text-[11px]">
          <div><span class="text-slate-400">Date</span><p class="font-medium text-slate-700">${escapeHtml(d.date)}</p></div>
          <div><span class="text-slate-400">Sales order</span><p class="font-semibold text-blue-600">${escapeHtml(d.salesOrderId)}</p></div>
          <div><span class="text-slate-400">Vehicle</span><p class="font-medium text-slate-700">${escapeHtml(vehicleDisplayName(d))}</p></div>
          <div><span class="text-slate-400">ETA</span><p class="font-medium text-slate-700">${escapeHtml(formatEta(d.eta))}</p></div>
        </div>
        <div>${driverCellHtml(d)}</div>
        <div class="flex items-center gap-2 pt-1 border-t border-slate-100">
          <button type="button" onclick="window.viewLiveLocation('${escapeHtml(d.id)}')" class="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-[11px] font-semibold text-slate-600 cursor-pointer">
            ${actionIcon('view.png', 'View', 'w-4 h-4')} View
          </button>
          <button type="button" onclick="window.openDispatchModal('${escapeHtml(d.id)}')" class="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-[11px] font-semibold text-slate-600 cursor-pointer">
            ${actionIcon('edit.png', 'Edit', 'w-4 h-4')} Edit
          </button>
        </div>
      </div>
    `;
  }).join('');
}

window.toggleRowSelect = function(id, checked) {
  if (checked) selectedIds.add(id);
  else selectedIds.delete(id);
  updateBulkBar();
};

window.toggleSelectAll = function(checked) {
  const dispatches = getFilteredDispatches();
  if (checked) {
    dispatches.forEach((d) => selectedIds.add(d.id));
  } else {
    dispatches.forEach((d) => selectedIds.delete(d.id));
  }
  window.renderTable();
};

window.clearBulkSelection = function() {
  selectedIds.clear();
  const selectAll = document.getElementById('dispatch-select-all');
  if (selectAll) selectAll.checked = false;
  window.renderTable();
};

function updateBulkBar() {
  const bar = document.getElementById('dispatch-bulk-bar');
  const countEl = document.getElementById('dispatch-bulk-count');
  if (!bar) return;
  const count = selectedIds.size;
  bar.classList.toggle('hidden', count === 0);
  if (countEl) countEl.textContent = String(count);
}

window.bulkAssignDispatches = function() {
  if (selectedIds.size === 0) return;

  const driver = document.getElementById('dispatch-bulk-driver')?.value.trim() || '';
  const vehicleId = document.getElementById('dispatch-bulk-vehicle')?.value || '';
  const vehicle = getVehicles().find((v) => v.id === vehicleId);

  if (!driver && !vehicleId) {
    alert('Enter a driver name or select a vehicle.');
    return;
  }

  const dispatches = getDispatches();
  dispatches.forEach((d) => {
    if (!selectedIds.has(d.id)) return;
    if (driver) d.driverName = driver;
    if (vehicleId) {
      d.vehicleId = vehicleId;
      d.vehicleName = vehicle ? vehicle.name : '';
    }
  });

  saveAppState();
  selectedIds.clear();
  document.getElementById('dispatch-bulk-driver').value = '';
  window.renderTable();
};

window.viewLiveLocation = function(dispatchId) {
  const d = getDispatches().find((x) => x.id === dispatchId);
  if (!d) return;
  const area = d.location || 'Unknown area';
  const status = statusLabel(normalizeDispatchStatus(d.status));

  document.getElementById('loc-modal-id').textContent = d.id;
  document.getElementById('loc-modal-area').textContent = area;
  document.getElementById('loc-modal-status').textContent = status;
  
  const statusEl = document.getElementById('loc-modal-status');
  if (d.status === 'delivered') statusEl.className = 'font-bold text-emerald-600';
  else if (d.status === 'on_route') statusEl.className = 'font-bold text-amber-500';
  else statusEl.className = 'font-bold text-slate-900';

  document.getElementById('loc-modal-driver').textContent = d.driverName || 'Unassigned';
  document.getElementById('loc-modal-vehicle').textContent = vehicleDisplayName(d);

  const modal = document.getElementById('dispatch-location-modal');
  modal.classList.remove('hidden');
  
  // Re-initialize lucide icons for the modal in case it's newly shown
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }

  setTimeout(() => {
    modal.classList.remove('opacity-0');
    modal.classList.add('opacity-100');
    const inner = modal.querySelector('.transform');
    if (inner) {
      inner.classList.remove('scale-95');
      inner.classList.add('scale-100');
    }
  }, 10);
};

window.closeLiveLocation = function() {
  const modal = document.getElementById('dispatch-location-modal');
  modal.classList.remove('opacity-100');
  modal.classList.add('opacity-0');
  const inner = modal.querySelector('.transform');
  if (inner) {
    inner.classList.remove('scale-100');
    inner.classList.add('scale-95');
  }
  setTimeout(() => {
    modal.classList.add('hidden');
  }, 300);
};

window.dismissRouteHint = function() {
  routeHintDismissed = true;
  const el = document.getElementById('dispatch-route-hint');
  if (el) el.classList.add('hidden');
};

function renderRouteHint() {
  const el = document.getElementById('dispatch-route-hint');
  const textEl = document.getElementById('dispatch-route-hint-text');
  if (!el || !textEl) return;

  if (routeHintDismissed) {
    el.classList.add('hidden');
    return;
  }

  const onRoute = getDispatches().filter((d) => normalizeDispatchStatus(d.status) === 'on_route' && d.location);
  const byArea = {};
  onRoute.forEach((d) => {
    const key = String(d.location).trim();
    if (!byArea[key]) byArea[key] = 0;
    byArea[key] += 1;
  });

  const match = Object.entries(byArea).find(([, count]) => count >= 2);
  if (!match) {
    el.classList.add('hidden');
    return;
  }

  const [area, count] = match;
  textEl.textContent = `${count} deliveries in ${area} — consider combining routes`;
  el.classList.remove('hidden');
}

function renderMetrics() {
  const container = document.getElementById('dispatch-metrics');
  if (!container) return;

  const dispatches = getDispatches();
  const scheduled = dispatches.filter((d) => normalizeDispatchStatus(d.status) === 'scheduled').length;
  const onRoute = dispatches.filter((d) => normalizeDispatchStatus(d.status) === 'on_route').length;
  const delivered = dispatches.filter((d) => normalizeDispatchStatus(d.status) === 'delivered').length;

  container.innerHTML = `
    <div class="dispatch-card dispatch-card-tint-slate p-4 flex items-start gap-3">
      ${metricIcon('total.png', 'Total dispatches')}
      <div>
        <span class="text-[11px] font-semibold text-slate-500 block">Total dispatches</span>
        <span class="text-xl font-bold text-slate-900 block mt-1">${dispatches.length}</span>
      </div>
    </div>
    <div class="dispatch-card dispatch-card-tint-blue p-4 flex items-start gap-3">
      ${metricIcon('scheduled.png', 'Scheduled')}
      <div>
        <span class="text-[11px] font-semibold text-blue-600 block">Scheduled</span>
        <span class="text-xl font-bold text-blue-700 block mt-1">${scheduled}</span>
      </div>
    </div>
    <div class="dispatch-card dispatch-card-tint-amber p-4 flex items-start gap-3">
      ${metricIcon('on-route.png', 'On route')}
      <div>
        <span class="text-[11px] font-semibold text-amber-600 block">On route</span>
        <span class="text-xl font-bold text-amber-700 block mt-1">${onRoute}</span>
      </div>
    </div>
    <div class="dispatch-card dispatch-card-tint-emerald p-4 flex items-start gap-3">
      ${metricIcon('delivered.png', 'Delivered')}
      <div>
        <span class="text-[11px] font-semibold text-emerald-600 block">Delivered</span>
        <span class="text-xl font-bold text-emerald-700 block mt-1">${delivered}</span>
      </div>
    </div>
  `;
}

function renderAll() {
  const smsToggle = document.getElementById('dispatch-sms-toggle');
  if (smsToggle) smsToggle.checked = !!getDispatchSettings().autoSms;
  populateFilterDropdowns();
  renderMetrics();
  renderRouteHint();
  window.renderTable();
  updateSmsNote();
  initIcons();
}

document.addEventListener('DOMContentLoaded', async () => {
  await appReadyPromise;
  renderAll();
});
