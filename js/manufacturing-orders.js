import { appReadyPromise, appState, saveAppState, initIcons } from '/js/shared.js';

const DEFAULT_ORDERS = [
  {
    id: "PO-001",
    bomId: "BOM-001",
    machineId: "MACH-001",
    moldId: "MOLD-001",
    plannedQuantity: 500,
    startDate: new Date().toISOString().split('T')[0],
    endDate: "",
    status: "Planned",
    stockDeducted: false
  }
];

function getOrders() {
  if (!appState.productionOrders) {
    appState.productionOrders = [...DEFAULT_ORDERS];
    saveAppState();
  }
  return appState.productionOrders;
}

function getBoms() {
  return Array.isArray(appState.boms) ? appState.boms : [];
}

function getMachines() {
  return Array.isArray(appState.machines) ? appState.machines : [];
}

function getMolds() {
  return Array.isArray(appState.molds) ? appState.molds : [];
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

function getNextOrderId() {
  const maxNumericId = getOrders().reduce((maxValue, item) => {
    const numericId = Number.parseInt(String(item.id || '').replace(/[^\d]/g, ''), 10);
    return Number.isFinite(numericId) ? Math.max(maxValue, numericId) : maxValue;
  }, 0);
  return `PO-${String(maxNumericId + 1).padStart(3, '0')}`;
}

window.showMainView = function() {
  document.getElementById('po-main-view').classList.remove('hidden');
  document.getElementById('po-form-view').classList.add('hidden');
};

window.showFormView = function() {
  document.getElementById('po-main-view').classList.add('hidden');
  document.getElementById('po-form-view').classList.remove('hidden');
};

window.openPoModal = function(orderId = '') {
  const form = document.getElementById('po-form');
  if (!form) return;

  form.reset();
  document.getElementById('po-edit-id').value = '';
  document.getElementById('po-form-title').textContent = 'Create Production Order';
  document.getElementById('po-input-start').value = new Date().toISOString().split('T')[0];
  
  populateDropdowns();

  if (orderId) {
    const order = getOrders().find(o => o.id === orderId);
    if (order) {
      document.getElementById('po-edit-id').value = order.id;
      document.getElementById('po-form-title').textContent = 'Edit Production Order';
      document.getElementById('po-input-bom').value = order.bomId;
      document.getElementById('po-input-qty').value = order.plannedQuantity;
      document.getElementById('po-input-machine').value = order.machineId || '';
      document.getElementById('po-input-mold').value = order.moldId || '';
      document.getElementById('po-input-start').value = order.startDate;
      document.getElementById('po-input-end').value = order.endDate || '';
      document.getElementById('po-input-status').value = order.status;
      
      // If stock already deducted, prevent editing qty or changing bom
      if (order.stockDeducted) {
        document.getElementById('po-input-bom').disabled = true;
        document.getElementById('po-input-qty').disabled = true;
      } else {
        document.getElementById('po-input-bom').disabled = false;
        document.getElementById('po-input-qty').disabled = false;
      }
    }
  } else {
    document.getElementById('po-input-bom').disabled = false;
    document.getElementById('po-input-qty').disabled = false;
  }

  window.updateFormHelpers();
  window.showFormView();
  initIcons();
};

function populateDropdowns() {
  const bomSelect = document.getElementById('po-input-bom');
  const boms = getBoms().filter(b => b.status === 'Active');
  bomSelect.innerHTML = '<option value="">Select BOM...</option>' + boms.map(b => {
    const targetProduct = getProductById(b.targetProductId);
    const targetName = targetProduct ? targetProduct.name : 'Unknown Product';
    return `<option value="${b.id}">${escapeHtml(b.id)} - ${escapeHtml(b.name)} (${escapeHtml(targetName)})</option>`;
  }).join('');

  const machineSelect = document.getElementById('po-input-machine');
  machineSelect.innerHTML = '<option value="">None</option>' + getMachines().map(m => 
    `<option value="${m.id}">${escapeHtml(m.id)} - ${escapeHtml(m.model)}</option>`
  ).join('');

  const moldSelect = document.getElementById('po-input-mold');
  moldSelect.innerHTML = '<option value="">None</option>' + getMolds().map(m => 
    `<option value="${m.id}">${escapeHtml(m.id)} - ${escapeHtml(m.name)}</option>`
  ).join('');
}

window.updateFormHelpers = function() {
  const bomId = document.getElementById('po-input-bom').value;
  const qty = Number(document.getElementById('po-input-qty').value) || 1;
  const previewDiv = document.getElementById('po-materials-preview');
  const previewList = document.getElementById('po-materials-list');

  if (!bomId) {
    previewDiv.classList.add('hidden');
    return;
  }

  const bom = getBoms().find(b => b.id === bomId);
  if (!bom) return;

  const multiplier = qty / (bom.outputQuantity || 1);
  let html = '';

  bom.materials.forEach(mat => {
    const product = getProductById(mat.productId);
    const requiredQty = (mat.quantity * multiplier).toFixed(2);
    const name = product ? product.name : `Product ID ${mat.productId}`;
    const uom = product ? product.uom : 'units';
    html += `<div>• ${escapeHtml(name)}: ${requiredQty} ${uom}</div>`;
  });

  previewList.innerHTML = html;
  previewDiv.classList.remove('hidden');
};

document.getElementById('po-input-qty')?.addEventListener('input', window.updateFormHelpers);

window.handleSubmit = function(event) {
  event.preventDefault();

  const orders = getOrders();
  const editId = document.getElementById('po-edit-id').value;
  const bomId = document.getElementById('po-input-bom').value;
  
  if (!bomId) {
    alert("Please select a BOM.");
    return;
  }

  const newStatus = document.getElementById('po-input-status').value;
  let order = editId ? orders.find(o => o.id === editId) : null;
  const wasCompleted = order ? order.status === 'Completed' : false;
  
  const payload = {
    id: editId || getNextOrderId(),
    bomId: document.getElementById('po-input-bom').value,
    machineId: document.getElementById('po-input-machine').value,
    moldId: document.getElementById('po-input-mold').value,
    plannedQuantity: Number(document.getElementById('po-input-qty').value) || 1,
    startDate: document.getElementById('po-input-start').value,
    endDate: document.getElementById('po-input-end').value,
    status: newStatus,
    stockDeducted: order ? order.stockDeducted : false
  };

  // Stock deduction / addition logic
  if (newStatus === 'Completed' && !payload.stockDeducted) {
    if (confirm("Completing this order will deduct raw materials and add finished goods to inventory. Proceed?")) {
      processInventoryChange(payload);
      payload.stockDeducted = true;
    } else {
      return; // Cancel save
    }
  }

  const existingIndex = orders.findIndex(o => o.id === payload.id);
  if (existingIndex >= 0) {
    orders[existingIndex] = payload;
  } else {
    orders.push(payload);
  }

  saveAppState();
  window.showMainView();
  renderAll();
};

function processInventoryChange(order) {
  const bom = getBoms().find(b => b.id === order.bomId);
  if (!bom) return;

  const multiplier = order.plannedQuantity / (bom.outputQuantity || 1);
  const inventory = getInventory();

  // Deduct materials
  bom.materials.forEach(mat => {
    const requiredQty = mat.quantity * multiplier;
    const invItem = inventory.find(i => i.id === mat.productId);
    if (invItem) {
      invItem.stock = Math.max(0, invItem.stock - requiredQty);
      // Roughly deduct from default warehouse if warehouse tracking is strict, 
      // but here we just deduct main stock for simplicity
    }
  });

  // Add Finished Good
  const fgItem = inventory.find(i => i.id === bom.targetProductId);
  if (fgItem) {
    fgItem.stock = (fgItem.stock || 0) + order.plannedQuantity;
  }

  // Update Mold Shots if applicable
  if (order.moldId) {
    const molds = Array.isArray(appState.molds) ? appState.molds : [];
    const mold = molds.find(m => m.id === order.moldId);
    if (mold) {
      mold.currentShots = (mold.currentShots || 0) + order.plannedQuantity; // simplified calculation
    }
  }

  saveAppState();
}

window.renderTable = function() {
  const tbody = document.getElementById('po-table-body');
  if (!tbody) return;

  const searchValue = String(document.getElementById('po-search-input')?.value || '').toLowerCase();
  const filterStatus = document.getElementById('po-filter-status')?.value || 'all';
  
  const orders = getOrders().filter(o => {
    const bom = getBoms().find(b => b.id === o.bomId);
    const targetProduct = bom ? getProductById(bom.targetProductId) : null;
    const searchString = [o.id, o.bomId, bom?.name, targetProduct?.name].join(' ').toLowerCase();
    
    const searchMatch = !searchValue || searchString.includes(searchValue);
    const statusMatch = filterStatus === 'all' || o.status === filterStatus;
    return searchMatch && statusMatch;
  });

  tbody.innerHTML = '';

  if (orders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-8 text-center text-slate-400 font-semibold">No Production Orders found.</td></tr>';
    return;
  }

  orders.forEach(order => {
    const bom = getBoms().find(b => b.id === order.bomId);
    const targetProduct = bom ? getProductById(bom.targetProductId) : null;
    
    let statusClass = 'bg-slate-200 text-slate-600';
    if (order.status === 'Planned') statusClass = 'bg-blue-50 text-blue-600';
    if (order.status === 'In Progress') statusClass = 'bg-amber-50 text-amber-600';
    if (order.status === 'Completed') statusClass = 'bg-emerald-50 text-emerald-600';
    if (order.status === 'Cancelled') statusClass = 'bg-rose-50 text-rose-600';

    tbody.innerHTML += `
      <tr class="hover:bg-slate-50/70 transition-colors">
        <td class="px-6 py-4 font-bold text-slate-900">${escapeHtml(order.id)}</td>
        <td class="px-6 py-4">
          <div class="font-bold text-slate-700">${escapeHtml(targetProduct?.name || 'Unknown')}</div>
          <div class="text-[10px] text-slate-400 font-semibold">BOM: ${escapeHtml(order.bomId)}</div>
        </td>
        <td class="px-6 py-4 text-center font-bold text-slate-900">${order.plannedQuantity}</td>
        <td class="px-6 py-4">
          <div class="text-[11px] font-semibold text-slate-600">MCH: ${escapeHtml(order.machineId || 'None')}</div>
          <div class="text-[11px] font-semibold text-slate-600">MLD: ${escapeHtml(order.moldId || 'None')}</div>
        </td>
        <td class="px-6 py-4">
          <div class="text-[11px] font-semibold text-slate-600">Start: ${order.startDate}</div>
          <div class="text-[11px] font-semibold text-slate-400">End: ${order.endDate || '-'}</div>
        </td>
        <td class="px-6 py-4">
          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${statusClass}">
            ${escapeHtml(order.status)}
          </span>
        </td>
        <td class="px-6 py-4 text-center">
          <button onclick="window.openPoModal('${order.id}')" class="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-bold text-slate-600 transition-colors cursor-pointer">Edit</button>
        </td>
      </tr>
    `;
  });
};

function renderMetrics() {
  const container = document.getElementById('po-metrics');
  if (!container) return;

  const orders = getOrders();
  const total = orders.length;
  const inProgress = orders.filter(o => o.status === 'In Progress').length;
  const completed = orders.filter(o => o.status === 'Completed').length;

  container.innerHTML = `
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Orders</span>
      <span class="text-xl font-extrabold text-slate-950 block mt-2">${total}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-amber-200 premium-shadow bg-amber-50/20">
      <span class="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">In Progress</span>
      <span class="text-xl font-extrabold text-amber-700 block mt-2">${inProgress}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-emerald-200 premium-shadow bg-emerald-50/20">
      <span class="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Completed</span>
      <span class="text-xl font-extrabold text-emerald-700 block mt-2">${completed}</span>
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

window.addEventListener('hookerp:language-changed', () => {
  renderAll();
});
