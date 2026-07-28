import { appReadyPromise, appState, saveAppState, initIcons } from '/js/shared.js';

const DEFAULT_ASSETS = [
  { id: "AST-001", name: "MacBook Pro M3", category: "IT Equipment", assignedUser: "Sarah Connor", location: "Head Office - IT Dept", status: "In Use", purchaseDate: "2024-01-15", value: 2500.00, serial: "C02DWX30MD6M" },
  { id: "AST-002", name: "Ergonomic Office Chair", category: "Furniture", assignedUser: "John Connor", location: "Head Office - Dev", status: "In Use", purchaseDate: "2023-11-20", value: 350.00, serial: "" },
  { id: "AST-003", name: "Delivery Van (Ford Transit)", category: "Vehicles", assignedUser: "Logistics Team", location: "Factory Parking", status: "Available", purchaseDate: "2022-05-10", value: 45000.00, serial: "VIN-9876543210" }
];

function getAssets() {
  if (!appState.assets) {
    appState.assets = [...DEFAULT_ASSETS];
    saveAppState();
  }
  return appState.assets;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function formatCurrency(value) {
  return `$${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getNextAssetId() {
  const maxNumericId = getAssets().reduce((maxValue, item) => {
    const numericId = Number.parseInt(String(item.id || '').replace(/[^\d]/g, ''), 10);
    return Number.isFinite(numericId) ? Math.max(maxValue, numericId) : maxValue;
  }, 0);
  return `AST-${String(maxNumericId + 1).padStart(3, '0')}`;
}

window.showMainView = function() {
  document.getElementById('asset-main-view').classList.remove('hidden');
  document.getElementById('asset-form-view').classList.add('hidden');
};

window.showFormView = function() {
  document.getElementById('asset-main-view').classList.add('hidden');
  document.getElementById('asset-form-view').classList.remove('hidden');
};

window.toggleAdvancedFields = function() {
  const section = document.getElementById('asset-advanced-section');
  const icon = document.getElementById('asset-advanced-icon');
  if (!section) return;

  const isHidden = section.classList.contains('hidden');
  section.classList.toggle('hidden', !isHidden);

  if (icon) {
    icon.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
  }
};

window.openAssetModal = function(assetId = '') {
  const form = document.getElementById('asset-form');
  if (!form) return;

  form.reset();
  document.getElementById('asset-edit-id').value = '';
  document.getElementById('asset-form-title').textContent = 'Register New Asset';

  if (assetId) {
    const asset = getAssets().find(a => a.id === assetId);
    if (asset) {
      document.getElementById('asset-edit-id').value = asset.id;
      document.getElementById('asset-form-title').textContent = 'Edit Asset';
      document.getElementById('asset-input-name').value = asset.name;
      document.getElementById('asset-input-category').value = asset.category || '';
      document.getElementById('asset-input-user').value = asset.assignedUser || '';
      document.getElementById('asset-input-location').value = asset.location || '';
      document.getElementById('asset-input-status').value = asset.status || 'Available';
      document.getElementById('asset-input-purchase-date').value = asset.purchaseDate || '';
      document.getElementById('asset-input-value').value = asset.value || '';
      document.getElementById('asset-input-serial').value = asset.serial || '';
    }
  }

  window.showFormView();
  initIcons();
};

window.handleSubmit = function(event) {
  event.preventDefault();

  const assets = getAssets();
  const editId = document.getElementById('asset-edit-id').value;
  
  const payload = {
    id: editId || getNextAssetId(),
    name: document.getElementById('asset-input-name').value.trim(),
    category: document.getElementById('asset-input-category').value,
    assignedUser: document.getElementById('asset-input-user').value.trim(),
    location: document.getElementById('asset-input-location').value.trim(),
    status: document.getElementById('asset-input-status').value,
    purchaseDate: document.getElementById('asset-input-purchase-date').value,
    value: Number(document.getElementById('asset-input-value').value) || 0,
    serial: document.getElementById('asset-input-serial').value.trim()
  };

  const existingIndex = assets.findIndex(a => a.id === payload.id);
  if (existingIndex >= 0) {
    assets[existingIndex] = payload;
  } else {
    assets.push(payload);
  }

  saveAppState();
  window.showMainView();
  renderAll();
};

window.renderTable = function() {
  const tbody = document.getElementById('asset-table-body');
  if (!tbody) return;

  const searchValue = String(document.getElementById('asset-search-input')?.value || '').toLowerCase();
  const filterStatus = document.getElementById('asset-filter-status')?.value || 'all';
  
  const assets = getAssets().filter(asset => {
    const searchMatch = !searchValue || [asset.id, asset.name, asset.assignedUser, asset.location].join(' ').toLowerCase().includes(searchValue);
    const statusMatch = filterStatus === 'all' || asset.status === filterStatus;
    return searchMatch && statusMatch;
  });

  tbody.innerHTML = '';

  if (assets.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-8 text-center text-slate-400 font-semibold">No assets found.</td></tr>';
    return;
  }

  assets.forEach(asset => {
    let statusClass = 'bg-slate-200 text-slate-600';
    if (asset.status === 'In Use') statusClass = 'bg-blue-50 text-blue-600';
    if (asset.status === 'Available') statusClass = 'bg-emerald-50 text-emerald-600';
    if (asset.status === 'Under Repair') statusClass = 'bg-amber-50 text-amber-600';
    if (asset.status === 'Retired') statusClass = 'bg-rose-50 text-rose-600';

    tbody.innerHTML += `
      <tr class="hover:bg-slate-50/70 transition-colors">
        <td class="px-6 py-4 font-bold text-slate-900">${escapeHtml(asset.id)}</td>
        <td class="px-6 py-4">
          <div class="font-bold text-slate-900">${escapeHtml(asset.name)}</div>
          <div class="text-[10px] text-slate-400 font-semibold">${escapeHtml(asset.category)}</div>
        </td>
        <td class="px-6 py-4 text-center font-semibold text-slate-900">${escapeHtml(asset.assignedUser || 'Unassigned')}</td>
        <td class="px-6 py-4 text-center font-semibold text-slate-900">${escapeHtml(asset.location)}</td>
        <td class="px-6 py-4 text-right font-semibold text-slate-900">${formatCurrency(asset.value)}</td>
        <td class="px-6 py-4">
          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${statusClass}">
            ${escapeHtml(asset.status)}
          </span>
        </td>
        <td class="px-6 py-4 text-center">
          <button onclick="window.openAssetModal('${asset.id}')" class="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-bold text-slate-600 transition-colors cursor-pointer">Edit</button>
        </td>
      </tr>
    `;
  });
};

function renderMetrics() {
  const container = document.getElementById('asset-metrics');
  if (!container) return;

  const assets = getAssets();
  const total = assets.length;
  const inUse = assets.filter(a => a.status === 'In Use').length;
  const available = assets.filter(a => a.status === 'Available').length;
  const value = assets.reduce((sum, a) => sum + (a.value || 0), 0);

  container.innerHTML = `
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Assets</span>
      <span class="text-xl font-extrabold text-slate-950 block mt-2">${total}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-blue-200 premium-shadow bg-blue-50/20">
      <span class="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">Currently In Use</span>
      <span class="text-xl font-extrabold text-blue-700 block mt-2">${inUse}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-emerald-200 premium-shadow bg-emerald-50/20">
      <span class="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Available</span>
      <span class="text-xl font-extrabold text-emerald-700 block mt-2">${available}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-indigo-200 premium-shadow bg-indigo-50/20">
      <span class="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">Total Asset Value</span>
      <span class="text-xl font-extrabold text-indigo-700 block mt-2">${formatCurrency(value)}</span>
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
