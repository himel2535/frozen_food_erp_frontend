import { appReadyPromise, appState, saveAppState, initIcons, getInventoryWarehouses } from '/js/shared.js';

function escapeHtml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function formatCurrency(value) {
  return `$${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString('en-US');
}

function getWarehouses() {
  return getInventoryWarehouses();
}

function getWarehouseDerivedStats(warehouseId) {
  return appState.inventory.reduce((summary, product) => {
    const allocatedQty = Number(product.warehouseStock?.[warehouseId] || 0);
    if (allocatedQty <= 0) return summary;

    summary.currentStock += allocatedQty;
    summary.stockValueStored += allocatedQty * Number(product.cost || 0);
    summary.activeProductsCount += 1;

    return summary;
  }, {
    currentStock: 0,
    stockValueStored: 0,
    activeProductsCount: 0
  });
}

function getWarehouseViewModel(warehouse) {
  const derived = getWarehouseDerivedStats(warehouse.id);
  const capacity = Number(warehouse.capacity || 0);
  const utilizationPercent = capacity > 0 ? (derived.currentStock / capacity) * 100 : 0;

  return {
    ...warehouse,
    ...derived,
    utilizationPercent
  };
}

function getWarehouseMetrics() {
  const warehouses = getWarehouses().map(getWarehouseViewModel);
  const totalCapacity = warehouses.reduce((sum, warehouse) => sum + Number(warehouse.capacity || 0), 0);
  const totalCurrentStock = warehouses.reduce((sum, warehouse) => sum + warehouse.currentStock, 0);
  const activeWarehouses = warehouses.filter((warehouse) => warehouse.status === 'Active').length;
  const inactiveWarehouses = warehouses.length - activeWarehouses;
  const utilizationPercent = totalCapacity > 0 ? (totalCurrentStock / totalCapacity) * 100 : 0;

  return {
    warehouses,
    totalCapacity,
    totalCurrentStock,
    activeWarehouses,
    inactiveWarehouses,
    utilizationPercent
  };
}

function resetAdvancedSection() {
  const section = document.getElementById('inventory-warehouses-advanced-section');
  const icon = document.getElementById('inventory-warehouses-advanced-icon');
  if (section) section.classList.add('hidden');
  if (icon) icon.style.transform = 'rotate(0deg)';
}

function getNextWarehouseId() {
  const maxNumericId = getWarehouses().reduce((maxValue, warehouse) => {
    const numericId = Number.parseInt(String(warehouse.id || '').replace(/[^\d]/g, ''), 10);
    return Number.isFinite(numericId) ? Math.max(maxValue, numericId) : maxValue;
  }, 0);

  return `WH-${String(maxNumericId + 1).padStart(3, '0')}`;
}

window.showMainView = function() {
  document.getElementById('inventory-warehouses-main-view').classList.remove('hidden');
  document.getElementById('inventory-warehouses-form-view').classList.add('hidden');
};

window.showFormView = function() {
  document.getElementById('inventory-warehouses-main-view').classList.add('hidden');
  document.getElementById('inventory-warehouses-form-view').classList.remove('hidden');
};

window.toggleAdvancedFields = function() {
  const section = document.getElementById('inventory-warehouses-advanced-section');
  const icon = document.getElementById('inventory-warehouses-advanced-icon');
  if (!section) return;

  const isHidden = section.classList.contains('hidden');
  section.classList.toggle('hidden', !isHidden);

  if (icon) {
    icon.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
  }
};

window.openWarehouseModal = function(warehouseId = '') {
  const form = document.getElementById('inventory-warehouses-form');
  if (!form) return;

  form.reset();
  document.getElementById('warehouse-edit-id').value = '';
  document.getElementById('warehouse-form-title').textContent = 'Create Warehouse';
  resetAdvancedSection();

  if (warehouseId) {
    const warehouse = getWarehouses().find((item) => item.id === warehouseId);
    if (warehouse) {
      document.getElementById('warehouse-edit-id').value = warehouse.id;
      document.getElementById('warehouse-form-title').textContent = 'Edit Warehouse';
      document.getElementById('warehouse-input-name').value = warehouse.name;
      document.getElementById('warehouse-input-location').value = warehouse.location;
      document.getElementById('warehouse-input-capacity').value = Number(warehouse.capacity || 0);
      document.getElementById('warehouse-input-type').value = warehouse.type;
      document.getElementById('warehouse-input-status').value = warehouse.status;
      document.getElementById('warehouse-input-manager').value = warehouse.manager || '';
      document.getElementById('warehouse-input-contact').value = warehouse.contact || '';
      document.getElementById('warehouse-input-product-types').value = warehouse.allowedProductTypes || '';
      document.getElementById('warehouse-input-storage-rules').value = warehouse.storageRules || '';
    }
  }

  window.showFormView();
  initIcons();
};

window.handleSubmit = function(event) {
  event.preventDefault();

  const warehouses = getWarehouses();
  const editId = document.getElementById('warehouse-edit-id').value;
  const payload = {
    id: editId || getNextWarehouseId(),
    name: document.getElementById('warehouse-input-name').value.trim(),
    location: document.getElementById('warehouse-input-location').value.trim(),
    capacity: Number.parseInt(document.getElementById('warehouse-input-capacity').value, 10) || 0,
    type: document.getElementById('warehouse-input-type').value,
    manager: document.getElementById('warehouse-input-manager').value.trim(),
    contact: document.getElementById('warehouse-input-contact').value.trim(),
    status: document.getElementById('warehouse-input-status').value,
    allowedProductTypes: document.getElementById('warehouse-input-product-types').value.trim(),
    storageRules: document.getElementById('warehouse-input-storage-rules').value.trim()
  };

  const existingIndex = warehouses.findIndex((warehouse) => warehouse.id === payload.id);
  if (existingIndex >= 0) {
    warehouses[existingIndex] = payload;
  } else {
    warehouses.push(payload);
  }

  saveAppState();
  window.showMainView();
  renderAll();
};

window.toggleWarehouseStatus = function(warehouseId) {
  const warehouse = getWarehouses().find((item) => item.id === warehouseId);
  if (!warehouse) return;

  warehouse.status = warehouse.status === 'Active' ? 'Inactive' : 'Active';
  saveAppState();
  renderAll();
};

window.renderTable = function() {
  const tbody = document.getElementById('inventory-warehouses-body');
  if (!tbody) return;

  const searchValue = String(document.getElementById('inventory-warehouses-search-input')?.value || '').trim().toLowerCase();
  const warehouses = getWarehouses()
    .map(getWarehouseViewModel)
    .filter((warehouse) => {
      if (!searchValue) return true;

      const haystack = [
        warehouse.id,
        warehouse.name,
        warehouse.location,
        warehouse.manager,
        warehouse.type,
        warehouse.status
      ].join(' ').toLowerCase();

      return haystack.includes(searchValue);
    });

  tbody.innerHTML = '';

  if (warehouses.length === 0) {
    tbody.innerHTML = '<tr><td colspan="11" class="px-6 py-8 text-center text-slate-400 font-semibold">No warehouses matched your search.</td></tr>';
    return;
  }

  warehouses.forEach((warehouse) => {
    const statusClass = warehouse.status === 'Active'
      ? 'bg-emerald-50 text-emerald-600'
      : 'bg-slate-200 text-slate-600';
    const utilizationColor = warehouse.utilizationPercent >= 85
      ? 'bg-rose-500'
      : warehouse.utilizationPercent >= 60
        ? 'bg-amber-500'
        : 'bg-blue-500';
    const utilizationWidth = Math.min(100, Math.max(0, warehouse.utilizationPercent));

    tbody.innerHTML += `
      <tr class="hover:bg-slate-50/70 transition-colors">
        <td class="px-6 py-4 font-bold text-slate-900">${escapeHtml(warehouse.id)}</td>
        <td class="px-6 py-4">
          <div class="font-bold text-slate-900">${escapeHtml(warehouse.name)}</div>
          <div class="text-[10px] text-slate-400 font-semibold">${escapeHtml(warehouse.manager || 'No manager assigned')}</div>
        </td>
        <td class="px-6 py-4">${escapeHtml(warehouse.location)}</td>
        <td class="px-6 py-4">${escapeHtml(warehouse.type)}</td>
        <td class="px-6 py-4 text-right font-semibold text-slate-900">${formatNumber(warehouse.capacity)} units</td>
        <td class="px-6 py-4 text-right font-semibold text-slate-900">${formatNumber(warehouse.currentStock)} units</td>
        <td class="px-6 py-4 min-w-[170px]">
          <div class="flex items-center justify-between gap-3 text-[11px] font-bold text-slate-600 mb-1">
            <span>${warehouse.utilizationPercent.toFixed(1)}%</span>
            <span>${formatNumber(warehouse.currentStock)} / ${formatNumber(warehouse.capacity)}</span>
          </div>
          <div class="h-2 rounded-full bg-slate-100 overflow-hidden">
            <div class="h-full rounded-full ${utilizationColor}" style="width: ${utilizationWidth}%;"></div>
          </div>
        </td>
        <td class="px-6 py-4 text-right font-semibold text-emerald-700">${formatCurrency(warehouse.stockValueStored)}</td>
        <td class="px-6 py-4 text-center font-bold text-slate-900">${warehouse.activeProductsCount}</td>
        <td class="px-6 py-4">
          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${statusClass}">
            ${escapeHtml(warehouse.status)}
          </span>
        </td>
        <td class="px-6 py-4 text-center">
          <div class="inline-flex items-center gap-2">
            <button onclick="window.openWarehouseModal('${warehouse.id}')" class="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-bold text-slate-600 transition-colors cursor-pointer">Edit</button>
            <button onclick="window.toggleWarehouseStatus('${warehouse.id}')" class="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-bold text-slate-600 transition-colors cursor-pointer">
              ${warehouse.status === 'Active' ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        </td>
      </tr>
    `;
  });
};

function renderMetrics() {
  const metricsContainer = document.getElementById('inventory-warehouses-metrics');
  if (!metricsContainer) return;

  const {
    warehouses,
    totalCapacity,
    totalCurrentStock,
    activeWarehouses,
    inactiveWarehouses,
    utilizationPercent
  } = getWarehouseMetrics();

  metricsContainer.innerHTML = `
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Warehouses</span>
      <span class="text-xl font-extrabold text-slate-950 block mt-2">${warehouses.length}</span>
      <span class="text-[11px] text-slate-500 font-semibold mt-2 block">${activeWarehouses} active · ${inactiveWarehouses} inactive</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Stock Capacity</span>
      <span class="text-xl font-extrabold text-slate-950 block mt-2">${formatNumber(totalCapacity)}</span>
      <span class="text-[11px] text-slate-500 font-semibold mt-2 block">units across all facilities</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-blue-200 premium-shadow bg-blue-50/20">
      <div class="flex items-center justify-between gap-3">
        <span class="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">Current Stock Utilization</span>
        <span class="text-[11px] font-bold text-blue-700">${utilizationPercent.toFixed(1)}%</span>
      </div>
      <span class="text-xl font-extrabold text-slate-950 block mt-2">${formatNumber(totalCurrentStock)} / ${formatNumber(totalCapacity)}</span>
      <div class="h-2 rounded-full bg-blue-100 overflow-hidden mt-3">
        <div class="h-full rounded-full bg-blue-600" style="width: ${Math.min(100, Math.max(0, utilizationPercent))}%;"></div>
      </div>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-emerald-200 premium-shadow bg-emerald-50/20">
      <span class="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Active Warehouses</span>
      <span class="text-xl font-extrabold text-emerald-700 block mt-2">${activeWarehouses}</span>
      <span class="text-[11px] text-emerald-700 font-semibold mt-2 block">ready for receiving and dispatch</span>
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
