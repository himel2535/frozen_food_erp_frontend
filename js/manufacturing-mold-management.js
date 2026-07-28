import { appReadyPromise, appState, saveAppState, initIcons } from '/js/shared.js';

// Fallback data if molds not present in appState
const DEFAULT_MOLDS = [
  { id: "MOLD-001", name: "Action Figure Body", category: "Action Figures", cavities: 4, life: 500000, shots: 125000, status: "Active", machine: "INJ-M-01", maintenanceInterval: 50000, location: "Rack A-1" },
  { id: "MOLD-002", name: "RC Car Wheel", category: "RC Cars", cavities: 8, life: 1000000, shots: 950000, status: "In Maintenance", machine: "INJ-M-02", maintenanceInterval: 100000, location: "Maintenance Shop" },
  { id: "MOLD-003", name: "Doll Head", category: "Dolls", cavities: 2, life: 300000, shots: 310000, status: "Retired", machine: "", maintenanceInterval: 50000, location: "Archive Rack" }
];

function getMolds() {
  if (!appState.molds) {
    appState.molds = [...DEFAULT_MOLDS];
    saveAppState();
  }
  return appState.molds;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString('en-US');
}

function getNextMoldId() {
  const maxNumericId = getMolds().reduce((maxValue, item) => {
    const numericId = Number.parseInt(String(item.id || '').replace(/[^\d]/g, ''), 10);
    return Number.isFinite(numericId) ? Math.max(maxValue, numericId) : maxValue;
  }, 0);
  return `MOLD-${String(maxNumericId + 1).padStart(3, '0')}`;
}

window.showMainView = function() {
  document.getElementById('mold-main-view').classList.remove('hidden');
  document.getElementById('mold-form-view').classList.add('hidden');
};

window.showFormView = function() {
  document.getElementById('mold-main-view').classList.add('hidden');
  document.getElementById('mold-form-view').classList.remove('hidden');
};

window.toggleAdvancedFields = function() {
  const section = document.getElementById('mold-advanced-section');
  const icon = document.getElementById('mold-advanced-icon');
  if (!section) return;

  const isHidden = section.classList.contains('hidden');
  section.classList.toggle('hidden', !isHidden);

  if (icon) {
    icon.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
  }
};

window.openMoldModal = function(moldId = '') {
  const form = document.getElementById('mold-form');
  if (!form) return;

  form.reset();
  document.getElementById('mold-edit-id').value = '';
  document.getElementById('mold-form-title').textContent = 'Create New Mold';

  if (moldId) {
    const mold = getMolds().find(m => m.id === moldId);
    if (mold) {
      document.getElementById('mold-edit-id').value = mold.id;
      document.getElementById('mold-form-title').textContent = 'Edit Mold';
      document.getElementById('mold-input-name').value = mold.name;
      document.getElementById('mold-input-category').value = mold.category || '';
      document.getElementById('mold-input-cavities').value = mold.cavities || 1;
      document.getElementById('mold-input-life').value = mold.life || 1000;
      document.getElementById('mold-input-status').value = mold.status || 'Active';
      document.getElementById('mold-input-machine').value = mold.machine || '';
      document.getElementById('mold-input-maintenance-interval').value = mold.maintenanceInterval || '';
      document.getElementById('mold-input-location').value = mold.location || '';
    }
  }

  window.showFormView();
  initIcons();
};

window.handleSubmit = function(event) {
  event.preventDefault();

  const molds = getMolds();
  const editId = document.getElementById('mold-edit-id').value;
  
  const payload = {
    id: editId || getNextMoldId(),
    name: document.getElementById('mold-input-name').value.trim(),
    category: document.getElementById('mold-input-category').value.trim(),
    cavities: Number(document.getElementById('mold-input-cavities').value),
    life: Number(document.getElementById('mold-input-life').value),
    status: document.getElementById('mold-input-status').value,
    machine: document.getElementById('mold-input-machine').value.trim(),
    maintenanceInterval: Number(document.getElementById('mold-input-maintenance-interval').value) || 0,
    location: document.getElementById('mold-input-location').value.trim(),
  };

  if (!editId) {
    payload.shots = 0; // Initialize shots to 0 for new molds
  } else {
    // Preserve existing shots
    const existing = molds.find(m => m.id === editId);
    payload.shots = existing ? existing.shots : 0;
  }

  const existingIndex = molds.findIndex(m => m.id === payload.id);
  if (existingIndex >= 0) {
    molds[existingIndex] = payload;
  } else {
    molds.push(payload);
  }

  saveAppState();
  window.showMainView();
  renderAll();
};

window.renderTable = function() {
  const tbody = document.getElementById('mold-table-body');
  if (!tbody) return;

  const searchValue = String(document.getElementById('mold-search-input')?.value || '').toLowerCase();
  const filterStatus = document.getElementById('mold-filter-status')?.value || 'all';
  
  const molds = getMolds().filter(mold => {
    const searchMatch = !searchValue || [mold.id, mold.name, mold.machine].join(' ').toLowerCase().includes(searchValue);
    const statusMatch = filterStatus === 'all' || mold.status === filterStatus;
    return searchMatch && statusMatch;
  });

  tbody.innerHTML = '';

  if (molds.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" class="px-6 py-8 text-center text-slate-400 font-semibold">No molds found.</td></tr>';
    return;
  }

  molds.forEach(mold => {
    const percentUsed = Math.min(100, (mold.shots / mold.life) * 100);
    
    let statusClass = 'bg-slate-200 text-slate-600';
    if (mold.status === 'Active') statusClass = 'bg-emerald-50 text-emerald-600';
    if (mold.status === 'In Maintenance') statusClass = 'bg-amber-50 text-amber-600';
    if (mold.status === 'Retired') statusClass = 'bg-rose-50 text-rose-600';

    let healthColor = 'bg-blue-500';
    if (percentUsed >= 90) healthColor = 'bg-rose-500';
    else if (percentUsed >= 75) healthColor = 'bg-amber-500';

    tbody.innerHTML += `
      <tr class="hover:bg-slate-50/70 transition-colors">
        <td class="px-6 py-4 font-bold text-slate-900">${escapeHtml(mold.id)}</td>
        <td class="px-6 py-4">
          <div class="font-bold text-slate-900">${escapeHtml(mold.name)}</div>
          <div class="text-[10px] text-slate-400 font-semibold">${escapeHtml(mold.category || 'No Category')}</div>
        </td>
        <td class="px-6 py-4 text-center font-semibold text-slate-900">${formatNumber(mold.cavities)}</td>
        <td class="px-6 py-4 text-center font-semibold text-slate-900">${formatNumber(mold.life)}</td>
        <td class="px-6 py-4 text-center font-semibold text-slate-900">${formatNumber(mold.shots)}</td>
        <td class="px-6 py-4 min-w-[150px]">
          <div class="flex items-center justify-between gap-3 text-[11px] font-bold text-slate-600 mb-1">
            <span>${percentUsed.toFixed(1)}%</span>
          </div>
          <div class="h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div class="h-full rounded-full ${healthColor}" style="width: ${percentUsed}%;"></div>
          </div>
        </td>
        <td class="px-6 py-4 font-semibold text-slate-600">${escapeHtml(mold.machine || 'Unassigned')}</td>
        <td class="px-6 py-4">
          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${statusClass}">
            ${escapeHtml(mold.status)}
          </span>
        </td>
        <td class="px-6 py-4 text-center">
          <button onclick="window.openMoldModal('${mold.id}')" class="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-bold text-slate-600 transition-colors cursor-pointer">Edit</button>
        </td>
      </tr>
    `;
  });
};

function renderMetrics() {
  const container = document.getElementById('mold-metrics');
  if (!container) return;

  const molds = getMolds();
  const total = molds.length;
  const active = molds.filter(m => m.status === 'Active').length;
  const maintenance = molds.filter(m => m.status === 'In Maintenance').length;
  const retired = molds.filter(m => m.status === 'Retired').length;

  container.innerHTML = `
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Molds</span>
      <span class="text-xl font-extrabold text-slate-950 block mt-2">${total}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-emerald-200 premium-shadow bg-emerald-50/20">
      <span class="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Active Output</span>
      <span class="text-xl font-extrabold text-emerald-700 block mt-2">${active}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-amber-200 premium-shadow bg-amber-50/20">
      <span class="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">In Maintenance</span>
      <span class="text-xl font-extrabold text-amber-700 block mt-2">${maintenance}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200 premium-shadow bg-slate-50/50">
      <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Retired</span>
      <span class="text-xl font-extrabold text-slate-700 block mt-2">${retired}</span>
    </div>
  `;
}

function renderAll() {
  renderMetrics();
  window.renderTable();
  initIcons();
}

document.addEventListener('DOMContentLoaded', async () => {
  await appReadyPromise;
  renderAll();
});
