import { appReadyPromise, appState, saveAppState, initIcons } from '/js/shared.js';

const DEFAULT_WASTAGE = [];

function getWastageLogs() {
  if (!appState.wastageLogs) {
    appState.wastageLogs = [...DEFAULT_WASTAGE];
    saveAppState();
  }
  return appState.wastageLogs;
}

function getOrders() {
  return Array.isArray(appState.productionOrders) ? appState.productionOrders : [];
}

function getBoms() {
  return Array.isArray(appState.boms) ? appState.boms : [];
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

function formatCurrency(value) {
  return `$${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getNextLogId() {
  const maxNumericId = getWastageLogs().reduce((maxValue, item) => {
    const numericId = Number.parseInt(String(item.id || '').replace(/[^\d]/g, ''), 10);
    return Number.isFinite(numericId) ? Math.max(maxValue, numericId) : maxValue;
  }, 0);
  return `WST-${String(maxNumericId + 1).padStart(3, '0')}`;
}

window.showMainView = function() {
  document.getElementById('wastage-main-view').classList.remove('hidden');
  document.getElementById('wastage-form-view').classList.add('hidden');
};

window.showFormView = function() {
  document.getElementById('wastage-main-view').classList.add('hidden');
  document.getElementById('wastage-form-view').classList.remove('hidden');
};

window.openWastageModal = function(logId = '') {
  const form = document.getElementById('wastage-form');
  if (!form) return;

  form.reset();
  document.getElementById('wastage-edit-id').value = '';
  document.getElementById('wastage-form-title').textContent = 'Log Quality Defect';
  document.getElementById('wastage-input-date').value = new Date().toISOString().split('T')[0];
  
  populateOrders();

  if (logId) {
    const log = getWastageLogs().find(l => l.id === logId);
    if (log) {
      document.getElementById('wastage-edit-id').value = log.id;
      document.getElementById('wastage-form-title').textContent = 'Edit Quality Defect';
      document.getElementById('wastage-input-po').value = log.productionOrderId;
      document.getElementById('wastage-input-date').value = log.date;
      document.getElementById('wastage-input-qty').value = log.rejectedQuantity;
      document.getElementById('wastage-input-reason').value = log.reason;
      document.getElementById('wastage-input-notes').value = log.notes || '';
    }
  }

  window.updateWastageHelpers();
  window.showFormView();
  initIcons();
};

function populateOrders() {
  const select = document.getElementById('wastage-input-po');
  const orders = getOrders(); // Allow logging on all orders, or filter to In Progress/Completed
  
  select.innerHTML = '<option value="">Select Production Order...</option>' + orders.map(o => {
    return `<option value="${o.id}">${escapeHtml(o.id)} (Status: ${escapeHtml(o.status)})</option>`;
  }).join('');
}

window.updateWastageHelpers = function() {
  const poId = document.getElementById('wastage-input-po').value;
  const qty = Number(document.getElementById('wastage-input-qty').value) || 0;
  const previewDiv = document.getElementById('wastage-cost-preview');
  const productEl = document.getElementById('wastage-product-name');
  const costEl = document.getElementById('wastage-total-cost');

  if (!poId) {
    previewDiv.classList.add('hidden');
    return;
  }

  const order = getOrders().find(o => o.id === poId);
  if (!order) return;

  const bom = getBoms().find(b => b.id === order.bomId);
  if (!bom) return;

  const product = getProductById(bom.targetProductId);
  if (!product) return;

  const unitCost = Number(bom.cost) || Number(product.cost) || 0;
  const totalWastedCost = unitCost * qty;

  productEl.textContent = `${escapeHtml(product.name)} (${escapeHtml(product.sku)})`;
  costEl.textContent = formatCurrency(totalWastedCost);
  previewDiv.classList.remove('hidden');
};

window.handleSubmit = function(event) {
  event.preventDefault();

  const logs = getWastageLogs();
  const editId = document.getElementById('wastage-edit-id').value;
  const poId = document.getElementById('wastage-input-po').value;
  const qty = Number(document.getElementById('wastage-input-qty').value) || 0;
  
  if (!poId) {
    alert("Please select a Production Order.");
    return;
  }

  const order = getOrders().find(o => o.id === poId);
  const bom = order ? getBoms().find(b => b.id === order.bomId) : null;
  const product = bom ? getProductById(bom.targetProductId) : null;
  const unitCost = bom ? Number(bom.cost) : (product ? Number(product.cost) : 0);
  const totalWastedCost = unitCost * qty;
  
  const payload = {
    id: editId || getNextLogId(),
    productionOrderId: poId,
    productId: product ? product.id : null,
    date: document.getElementById('wastage-input-date').value,
    rejectedQuantity: qty,
    reason: document.getElementById('wastage-input-reason').value,
    notes: document.getElementById('wastage-input-notes').value.trim(),
    wastedCost: totalWastedCost
  };

  const existingIndex = logs.findIndex(l => l.id === payload.id);
  if (existingIndex >= 0) {
    logs[existingIndex] = payload;
  } else {
    logs.push(payload);
  }

  saveAppState();
  window.showMainView();
  renderAll();
};

window.renderTable = function() {
  const tbody = document.getElementById('wastage-table-body');
  if (!tbody) return;

  const searchValue = String(document.getElementById('wastage-search-input')?.value || '').toLowerCase();
  const filterReason = document.getElementById('wastage-filter-reason')?.value || 'all';
  
  const logs = getWastageLogs().filter(log => {
    const product = getProductById(log.productId);
    const searchString = [log.id, log.productionOrderId, product?.name].join(' ').toLowerCase();
    
    const searchMatch = !searchValue || searchString.includes(searchValue);
    const reasonMatch = filterReason === 'all' || log.reason === filterReason;
    return searchMatch && reasonMatch;
  });

  tbody.innerHTML = '';

  if (logs.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="px-6 py-8 text-center text-slate-400 font-semibold">No wastage logs found.</td></tr>';
    return;
  }

  logs.forEach(log => {
    const product = getProductById(log.productId);
    
    tbody.innerHTML += `
      <tr class="hover:bg-slate-50/70 transition-colors">
        <td class="px-6 py-4 font-bold text-slate-900">${escapeHtml(log.id)}</td>
        <td class="px-6 py-4 text-[11px] font-semibold text-slate-600">${log.date}</td>
        <td class="px-6 py-4">
          <span class="text-xs font-bold text-blue-600 cursor-pointer hover:underline">${escapeHtml(log.productionOrderId)}</span>
        </td>
        <td class="px-6 py-4">
          <div class="font-bold text-slate-700">${escapeHtml(product?.name || 'Unknown')}</div>
        </td>
        <td class="px-6 py-4 text-center font-bold text-rose-600">${log.rejectedQuantity}</td>
        <td class="px-6 py-4">
          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
            ${escapeHtml(log.reason)}
          </span>
        </td>
        <td class="px-6 py-4 text-right font-extrabold text-rose-700">${formatCurrency(log.wastedCost)}</td>
        <td class="px-6 py-4 text-center">
          <button onclick="window.openWastageModal('${log.id}')" class="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-bold text-slate-600 transition-colors cursor-pointer">Edit</button>
        </td>
      </tr>
    `;
  });
};

function renderMetrics() {
  const container = document.getElementById('wastage-metrics');
  if (!container) return;

  const logs = getWastageLogs();
  const totalDefects = logs.reduce((sum, log) => sum + log.rejectedQuantity, 0);
  const totalCost = logs.reduce((sum, log) => sum + log.wastedCost, 0);

  container.innerHTML = `
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Logs</span>
      <span class="text-xl font-extrabold text-slate-950 block mt-2">${logs.length}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-rose-200 premium-shadow bg-rose-50/20">
      <span class="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">Total Defective Units</span>
      <span class="text-xl font-extrabold text-rose-700 block mt-2">${formatNumber(totalDefects)}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-rose-200 premium-shadow bg-rose-50/20 md:col-span-2">
      <span class="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">Total Financial Loss</span>
      <span class="text-xl font-extrabold text-rose-700 block mt-2">${formatCurrency(totalCost)}</span>
    </div>
  `;
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString('en-US');
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
