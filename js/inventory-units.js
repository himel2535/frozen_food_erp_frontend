import { appReadyPromise, appState, saveAppState, initIcons, getInventoryUnits } from '/js/shared.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getUnits() {
  return getInventoryUnits();
}

function getProducts() {
  return Array.isArray(appState.inventory) ? appState.inventory : [];
}

function getUnitById(unitId) {
  return getUnits().find((unit) => unit.id === unitId) || null;
}

function countProductsUsingUnit(unit) {
  const codes = [unit.code, unit.symbol, unit.name].map((v) => String(v || '').toLowerCase()).filter(Boolean);
  return getProducts().filter((product) => codes.includes(String(product?.uom || '').toLowerCase())).length;
}

function getNextUnitId() {
  const maxNumericId = getUnits().reduce((maxValue, unit) => {
    const numericId = Number.parseInt(String(unit.id || '').replace(/[^\d]/g, ''), 10);
    return Number.isFinite(numericId) ? Math.max(maxValue, numericId) : maxValue;
  }, 0);
  return `UOM-${String(maxNumericId + 1).padStart(3, '0')}`;
}

function resetUnitForm() {
  document.getElementById('inventory-units-form')?.reset();
  document.getElementById('inventory-unit-edit-id').value = '';
  document.getElementById('inventory-unit-form-title').textContent = window.t ? window.t('common.create_record') : 'Create Unit';
  document.querySelector('#inventory-units-form button[type="submit"]').textContent = window.t ? window.t('common.save_record') : 'Save Unit';
}

function populateUnitForm(unitId) {
  const unit = getUnitById(unitId);
  if (!unit) return;

  document.getElementById('inventory-unit-edit-id').value = unit.id;
  document.getElementById('inventory-unit-form-title').textContent = window.t ? window.t('common.edit_record') : 'Edit Unit';
  document.querySelector('#inventory-units-form button[type="submit"]').textContent = window.t ? window.t('common.update_record') : 'Update Unit';
  document.getElementById('inventory-unit-name').value = unit.name;
  document.getElementById('inventory-unit-code').value = unit.code;
  document.getElementById('inventory-unit-symbol').value = unit.symbol || '';
  document.getElementById('inventory-unit-status').value = unit.status;
  document.getElementById('inventory-unit-description').value = unit.description || '';
}

function renderMetrics() {
  const metricsContainer = document.getElementById('inventory-units-metrics');
  if (!metricsContainer) return;

  const units = getUnits();
  const activeUnits = units.filter((unit) => unit.status === 'Active').length;
  const usedUnits = units.filter((unit) => countProductsUsingUnit(unit) > 0).length;

  metricsContainer.innerHTML = `
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Units</span>
      <span class="text-xl font-extrabold text-slate-950 block mt-2">${units.length}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-emerald-200 bg-emerald-50/20 premium-shadow">
      <span class="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Active Units</span>
      <span class="text-xl font-extrabold text-emerald-700 block mt-2">${activeUnits}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-blue-200 bg-blue-50/20 premium-shadow">
      <span class="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">In Use by Products</span>
      <span class="text-xl font-extrabold text-blue-700 block mt-2">${usedUnits}</span>
    </div>
  `;
}

window.renderInventoryUnitsTable = function() {
  const tbody = document.getElementById('inventory-units-body');
  if (!tbody) return;

  const searchValue = String(document.getElementById('inventory-units-search-input')?.value || '').trim().toLowerCase();
  const units = getUnits().filter((unit) => {
    if (!searchValue) return true;
    const haystack = [unit.id, unit.code, unit.name, unit.symbol, unit.description, unit.status].join(' ').toLowerCase();
    return haystack.includes(searchValue);
  });

  tbody.innerHTML = '';

  if (units.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="px-6 py-8 text-center text-slate-400 font-semibold">${escapeHtml(window.t ? window.t('common.no_results') : 'No units matched your search.')}</td></tr>`;
    return;
  }

  units.forEach((unit) => {
    const statusClass = unit.status === 'Active'
      ? 'bg-emerald-50 text-emerald-600'
      : 'bg-slate-200 text-slate-600';
    const productCount = countProductsUsingUnit(unit);

    tbody.innerHTML += `
      <tr class="hover:bg-slate-50/70 transition-colors">
        <td class="px-6 py-4 font-bold text-slate-900">${escapeHtml(unit.id)}</td>
        <td class="px-6 py-4 font-semibold text-slate-500">${escapeHtml(unit.code)}</td>
        <td class="px-6 py-4 font-bold text-slate-900">${escapeHtml(unit.name)}</td>
        <td class="px-6 py-4">${escapeHtml(unit.symbol || '—')}</td>
        <td class="px-6 py-4 text-slate-500 min-w-[200px]">${escapeHtml(unit.description || '—')}</td>
        <td class="px-6 py-4 text-center font-bold text-slate-900">${productCount}</td>
        <td class="px-6 py-4">
          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${statusClass}">
            ${escapeHtml(unit.status)}
          </span>
        </td>
        <td class="px-6 py-4 text-center">
          <div class="inline-flex items-center gap-2">
            <button onclick="window.openInventoryUnitForm('${unit.id}')" class="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-bold text-slate-600 transition-colors cursor-pointer">Edit</button>
            <button onclick="window.deleteInventoryUnit('${unit.id}')" class="px-3 py-1.5 rounded-lg border border-rose-200 bg-white hover:bg-rose-50 text-[11px] font-bold text-rose-600 transition-colors cursor-pointer">Delete</button>
          </div>
        </td>
      </tr>
    `;
  });
};

window.showInventoryUnitsMainView = function() {
  document.getElementById('inventory-units-main-view').classList.remove('hidden');
  document.getElementById('inventory-units-form-view').classList.add('hidden');
};

window.showInventoryUnitsFormView = function() {
  document.getElementById('inventory-units-main-view').classList.add('hidden');
  document.getElementById('inventory-units-form-view').classList.remove('hidden');
};

window.openInventoryUnitForm = function(unitId = '') {
  resetUnitForm();
  if (unitId) populateUnitForm(unitId);
  window.showInventoryUnitsFormView();
  initIcons();
};

window.handleInventoryUnitSubmit = function(event) {
  event.preventDefault();

  const units = getUnits();
  const editId = document.getElementById('inventory-unit-edit-id').value;
  const code = String(document.getElementById('inventory-unit-code').value || '').trim().toLowerCase();
  const name = String(document.getElementById('inventory-unit-name').value || '').trim();

  if (!code || !name) {
    alert('Unit name and code are required.');
    return;
  }

  const duplicate = units.find((unit) => unit.code === code && unit.id !== editId);
  if (duplicate) {
    alert('A unit with this code already exists.');
    return;
  }

  const payload = {
    id: editId || getNextUnitId(),
    code,
    name,
    symbol: String(document.getElementById('inventory-unit-symbol').value || code).trim(),
    status: document.getElementById('inventory-unit-status').value,
    description: String(document.getElementById('inventory-unit-description').value || '').trim()
  };

  const existingIndex = units.findIndex((unit) => unit.id === payload.id);
  if (existingIndex >= 0) {
    units[existingIndex] = payload;
  } else {
    units.push(payload);
  }

  appState.inventoryUnits = units;
  saveAppState();
  window.showInventoryUnitsMainView();
  renderAll();
};

window.deleteInventoryUnit = function(unitId) {
  const unit = getUnitById(unitId);
  if (!unit) return;

  if (countProductsUsingUnit(unit) > 0) {
    alert('This unit is used by one or more products. Reassign those products first.');
    return;
  }

  if (!confirm(`Delete unit ${unit.name} (${unit.code})?`)) return;

  appState.inventoryUnits = getUnits().filter((item) => item.id !== unitId);
  saveAppState();
  renderAll();
};

function renderAll() {
  renderMetrics();
  window.renderInventoryUnitsTable();
  initIcons();
}

document.addEventListener('DOMContentLoaded', async () => {
  await appReadyPromise;
  renderAll();
});

window.addEventListener('hookerp:language-changed', () => {
  renderAll();
});
