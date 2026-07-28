import { appReadyPromise, appState, saveAppState, initIcons } from '/js/shared.js';

const DEFAULT_PACKING = [];

function getPackingSlips() {
  if (!appState.packingSlips) {
    appState.packingSlips = [...DEFAULT_PACKING];
    saveAppState();
  }
  return appState.packingSlips;
}

function getInventory() {
  return Array.isArray(appState.inventory) ? appState.inventory : [];
}

function getProductById(id) {
  return getInventory().find(p => p.id === Number(id));
}

function escapeHtml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString('en-US');
}

function getNextSlipId() {
  const maxNumericId = getPackingSlips().reduce((maxValue, item) => {
    const numericId = Number.parseInt(String(item.id || '').replace(/[^\d]/g, ''), 10);
    return Number.isFinite(numericId) ? Math.max(maxValue, numericId) : maxValue;
  }, 0);
  return `PKG-${String(maxNumericId + 1).padStart(3, '0')}`;
}

window.showMainView = function() {
  document.getElementById('packing-main-view').classList.remove('hidden');
  document.getElementById('packing-form-view').classList.add('hidden');
};

window.showFormView = function() {
  document.getElementById('packing-main-view').classList.add('hidden');
  document.getElementById('packing-form-view').classList.remove('hidden');
};

window.openPackingModal = function(slipId = '') {
  const form = document.getElementById('packing-form');
  if (!form) return;

  form.reset();
  document.getElementById('packing-edit-id').value = '';
  document.getElementById('packing-form-title').textContent = 'Create Packing Slip';
  document.getElementById('packing-input-date').value = new Date().toISOString().split('T')[0];
  
  populateProducts();

  if (slipId) {
    const slip = getPackingSlips().find(s => s.id === slipId);
    if (slip) {
      document.getElementById('packing-edit-id').value = slip.id;
      document.getElementById('packing-form-title').textContent = 'Edit Packing Slip';
      document.getElementById('packing-input-product').value = slip.productId;
      document.getElementById('packing-input-date').value = slip.date;
      document.getElementById('packing-input-qty').value = slip.quantity;
      document.getElementById('packing-input-units-per-carton').value = slip.unitsPerCarton;
      document.getElementById('packing-input-box').value = slip.boxSize || '';
      document.getElementById('packing-input-status').value = slip.status;
    }
  }

  window.updatePackingHelpers();
  window.showFormView();
  initIcons();
};

function populateProducts() {
  const select = document.getElementById('packing-input-product');
  const products = getInventory().filter(p => p.productType === 'Finished Goods' || p.productType === 'Semi-Finished Goods');
  
  select.innerHTML = '<option value="">Select Finished Good...</option>' + products.map(p => {
    return `<option value="${p.id}">${escapeHtml(p.name)} (${escapeHtml(p.sku)})</option>`;
  }).join('');
}

window.updatePackingHelpers = function() {
  const qty = Number(document.getElementById('packing-input-qty').value) || 0;
  const unitsPerCarton = Number(document.getElementById('packing-input-units-per-carton').value) || 1;
  const previewDiv = document.getElementById('packing-summary-preview');
  
  const cartons = Math.floor(qty / unitsPerCarton);
  const remainder = qty % unitsPerCarton;

  document.getElementById('packing-total-cartons').textContent = `${cartons} Carton(s)`;
  document.getElementById('packing-remainder').textContent = `${remainder} Unit(s)`;
  previewDiv.classList.remove('hidden');
};

window.handleSubmit = function(event) {
  event.preventDefault();

  const slips = getPackingSlips();
  const editId = document.getElementById('packing-edit-id').value;
  const productId = Number(document.getElementById('packing-input-product').value);
  const qty = Number(document.getElementById('packing-input-qty').value) || 0;
  const unitsPerCarton = Number(document.getElementById('packing-input-units-per-carton').value) || 1;
  
  if (!productId) {
    alert("Please select a product.");
    return;
  }
  
  const payload = {
    id: editId || getNextSlipId(),
    productId: productId,
    date: document.getElementById('packing-input-date').value,
    quantity: qty,
    unitsPerCarton: unitsPerCarton,
    cartons: Math.floor(qty / unitsPerCarton),
    boxSize: document.getElementById('packing-input-box').value.trim(),
    status: document.getElementById('packing-input-status').value
  };

  const existingIndex = slips.findIndex(s => s.id === payload.id);
  if (existingIndex >= 0) {
    slips[existingIndex] = payload;
  } else {
    slips.push(payload);
  }

  saveAppState();
  window.showMainView();
  renderAll();
};

window.renderTable = function() {
  const tbody = document.getElementById('packing-table-body');
  if (!tbody) return;

  const searchValue = String(document.getElementById('packing-search-input')?.value || '').toLowerCase();
  const filterStatus = document.getElementById('packing-filter-status')?.value || 'all';
  
  const slips = getPackingSlips().filter(slip => {
    const product = getProductById(slip.productId);
    const searchString = [slip.id, product?.name].join(' ').toLowerCase();
    
    const searchMatch = !searchValue || searchString.includes(searchValue);
    const statusMatch = filterStatus === 'all' || slip.status === filterStatus;
    return searchMatch && statusMatch;
  });

  tbody.innerHTML = '';

  if (slips.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-8 text-center text-slate-400 font-semibold">No packing slips found.</td></tr>';
    return;
  }

  slips.forEach(slip => {
    const product = getProductById(slip.productId);
    
    let statusClass = 'bg-slate-100 text-slate-600';
    if (slip.status === 'Packed') statusClass = 'bg-emerald-50 text-emerald-600 border border-emerald-200';
    if (slip.status === 'Staged') statusClass = 'bg-amber-50 text-amber-600 border border-amber-200';

    tbody.innerHTML += `
      <tr class="hover:bg-slate-50/70 transition-colors">
        <td class="px-6 py-4 font-bold text-slate-900">${escapeHtml(slip.id)}</td>
        <td class="px-6 py-4 text-[11px] font-semibold text-slate-600">${slip.date}</td>
        <td class="px-6 py-4">
          <div class="font-bold text-slate-700">${escapeHtml(product?.name || 'Unknown')}</div>
          <div class="text-[10px] text-slate-400 font-semibold">${escapeHtml(slip.boxSize || 'Standard Box')}</div>
        </td>
        <td class="px-6 py-4 text-center font-bold text-slate-900">${formatNumber(slip.quantity)}</td>
        <td class="px-6 py-4 text-center font-bold text-blue-600">${slip.cartons}</td>
        <td class="px-6 py-4">
          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${statusClass}">
            ${escapeHtml(slip.status)}
          </span>
        </td>
        <td class="px-6 py-4 text-center">
          <button onclick="window.openPackingModal('${slip.id}')" class="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-bold text-slate-600 transition-colors cursor-pointer">Edit</button>
        </td>
      </tr>
    `;
  });
};

function renderMetrics() {
  const container = document.getElementById('packing-metrics');
  if (!container) return;

  const slips = getPackingSlips();
  const totalSlips = slips.length;
  const totalCartons = slips.reduce((sum, s) => sum + s.cartons, 0);
  const totalUnits = slips.reduce((sum, s) => sum + s.quantity, 0);

  container.innerHTML = `
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Slips</span>
      <span class="text-xl font-extrabold text-slate-950 block mt-2">${totalSlips}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-blue-200 premium-shadow bg-blue-50/20">
      <span class="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">Total Cartons Packed</span>
      <span class="text-xl font-extrabold text-blue-700 block mt-2">${formatNumber(totalCartons)}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-emerald-200 premium-shadow bg-emerald-50/20 md:col-span-2">
      <span class="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Total Units Processed</span>
      <span class="text-xl font-extrabold text-emerald-700 block mt-2">${formatNumber(totalUnits)}</span>
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
