import { appReadyPromise, appState, saveAppState, initIcons } from '/js/shared.js';

const DEFAULT_BOMS = [
  { 
    id: "BOM-001", 
    name: "Action Figure Assembly v1", 
    targetProductId: 4, 
    outputQuantity: 1, 
    status: "Active", 
    cost: 1.05,
    materials: [
      { productId: 1, quantity: 0.1, costPerUnit: 2.50, totalCost: 0.25 }, // Plastic Pellets
      { productId: 3, quantity: 2, costPerUnit: 0.40, totalCost: 0.80 } // Action Figure Arms
    ]
  }
];

function getBoms() {
  if (!appState.boms) {
    appState.boms = [...DEFAULT_BOMS];
    saveAppState();
  }
  return appState.boms;
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

function formatNumber(value) {
  return Number(value || 0).toLocaleString('en-US');
}

function getNextBomId() {
  const maxNumericId = getBoms().reduce((maxValue, item) => {
    const numericId = Number.parseInt(String(item.id || '').replace(/[^\d]/g, ''), 10);
    return Number.isFinite(numericId) ? Math.max(maxValue, numericId) : maxValue;
  }, 0);
  return `BOM-${String(maxNumericId + 1).padStart(3, '0')}`;
}

window.showMainView = function() {
  document.getElementById('bom-main-view').classList.remove('hidden');
  document.getElementById('bom-form-view').classList.add('hidden');
};

window.showFormView = function() {
  document.getElementById('bom-main-view').classList.add('hidden');
  document.getElementById('bom-form-view').classList.remove('hidden');
};

window.openBomModal = function(bomId = '') {
  const form = document.getElementById('bom-form');
  if (!form) return;

  form.reset();
  document.getElementById('bom-edit-id').value = '';
  document.getElementById('bom-form-title').textContent = 'Create Bill of Materials';
  
  populateTargetProducts();
  document.getElementById('bom-materials-body').innerHTML = '';
  updateTotalCost();

  if (bomId) {
    const bom = getBoms().find(b => b.id === bomId);
    if (bom) {
      document.getElementById('bom-edit-id').value = bom.id;
      document.getElementById('bom-form-title').textContent = 'Edit Bill of Materials';
      document.getElementById('bom-input-name').value = bom.name;
      document.getElementById('bom-input-target-product').value = bom.targetProductId;
      document.getElementById('bom-input-output-qty').value = bom.outputQuantity || 1;
      document.getElementById('bom-input-status').value = bom.status || 'Active';
      
      bom.materials.forEach(mat => window.addMaterialRow(mat.productId, mat.quantity));
    }
  } else {
    window.addMaterialRow();
  }

  window.showFormView();
  initIcons();
};

function populateTargetProducts() {
  const select = document.getElementById('bom-input-target-product');
  if (!select) return;

  const validTypes = ["Finished Goods", "Semi-Finished Goods"];
  const products = getInventory().filter(p => validTypes.includes(p.productType));
  
  select.innerHTML = '<option value="">Select a Product</option>' + products.map(p => 
    `<option value="${p.id}">${escapeHtml(p.name)} (${escapeHtml(p.sku)})</option>`
  ).join('');
}

function getMaterialOptions(selectedId = '') {
  const products = getInventory(); // Can use any product as raw material ideally, or filter specifically
  return '<option value="">Select Material...</option>' + products.map(p => 
    `<option value="${p.id}" ${p.id == selectedId ? 'selected' : ''}>${escapeHtml(p.name)} (${escapeHtml(p.sku)})</option>`
  ).join('');
}

window.addMaterialRow = function(productId = '', quantity = 1) {
  const tbody = document.getElementById('bom-materials-body');
  if (!tbody) return;

  const tr = document.createElement('tr');
  tr.className = 'material-row border-b border-slate-50 last:border-0';
  tr.innerHTML = `
    <td class="py-2 pr-4">
      <select class="material-product-select w-full px-3 py-2 text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-blue-500" onchange="window.recalculateBomCost()">
        ${getMaterialOptions(productId)}
      </select>
    </td>
    <td class="py-2 px-4">
      <input type="number" min="0.001" step="any" value="${quantity}" class="material-qty-input w-full px-3 py-2 text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-blue-500 text-center" oninput="window.recalculateBomCost()">
    </td>
    <td class="py-2 px-4 text-right font-semibold text-slate-600 material-unit-cost">$0.00</td>
    <td class="py-2 pl-4 text-right font-bold text-slate-900 material-total-cost">$0.00</td>
    <td class="py-2 text-center">
      <button type="button" onclick="this.closest('tr').remove(); window.recalculateBomCost();" class="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer">
        <i data-lucide="trash-2" class="w-4 h-4"></i>
      </button>
    </td>
  `;
  tbody.appendChild(tr);
  window.recalculateBomCost();
  initIcons();
};

window.recalculateBomCost = function() {
  const rows = document.querySelectorAll('.material-row');
  let totalCost = 0;

  rows.forEach(row => {
    const productSelect = row.querySelector('.material-product-select');
    const qtyInput = row.querySelector('.material-qty-input');
    const unitCostEl = row.querySelector('.material-unit-cost');
    const totalCostEl = row.querySelector('.material-total-cost');

    const productId = productSelect.value;
    const qty = Number(qtyInput.value) || 0;

    if (productId) {
      const product = getProductById(productId);
      const unitCost = product ? Number(product.cost || 0) : 0;
      const rowCost = unitCost * qty;
      
      unitCostEl.textContent = formatCurrency(unitCost);
      totalCostEl.textContent = formatCurrency(rowCost);
      totalCost += rowCost;
    } else {
      unitCostEl.textContent = '$0.00';
      totalCostEl.textContent = '$0.00';
    }
  });

  updateTotalCost(totalCost);
};

function updateTotalCost(cost = 0) {
  const el = document.getElementById('bom-total-cost');
  if (el) el.textContent = formatCurrency(cost);
}

window.handleSubmit = function(event) {
  event.preventDefault();

  const boms = getBoms();
  const editId = document.getElementById('bom-edit-id').value;
  const targetProductId = Number(document.getElementById('bom-input-target-product').value);
  
  if (!targetProductId) {
    alert("Please select a target product.");
    return;
  }

  const materials = [];
  let totalComputedCost = 0;
  let hasValidMaterials = false;

  document.querySelectorAll('.material-row').forEach(row => {
    const productId = Number(row.querySelector('.material-product-select').value);
    const qty = Number(row.querySelector('.material-qty-input').value) || 0;

    if (productId && qty > 0) {
      hasValidMaterials = true;
      const product = getProductById(productId);
      const unitCost = product ? Number(product.cost || 0) : 0;
      const rowCost = unitCost * qty;
      totalComputedCost += rowCost;

      materials.push({
        productId,
        quantity: qty,
        costPerUnit: unitCost,
        totalCost: rowCost
      });
    }
  });

  if (!hasValidMaterials) {
    alert("Please add at least one valid material with quantity > 0.");
    return;
  }
  
  const payload = {
    id: editId || getNextBomId(),
    name: document.getElementById('bom-input-name').value.trim(),
    targetProductId,
    outputQuantity: Number(document.getElementById('bom-input-output-qty').value) || 1,
    status: document.getElementById('bom-input-status').value,
    cost: totalComputedCost,
    materials
  };

  const existingIndex = boms.findIndex(b => b.id === payload.id);
  if (existingIndex >= 0) {
    boms[existingIndex] = payload;
  } else {
    boms.push(payload);
  }

  saveAppState();
  window.showMainView();
  renderAll();
};

window.renderTable = function() {
  const tbody = document.getElementById('bom-table-body');
  if (!tbody) return;

  const searchValue = String(document.getElementById('bom-search-input')?.value || '').toLowerCase();
  const filterStatus = document.getElementById('bom-filter-status')?.value || 'all';
  
  const boms = getBoms().filter(bom => {
    const targetProduct = getProductById(bom.targetProductId);
    const targetName = targetProduct ? targetProduct.name : '';
    
    const searchMatch = !searchValue || [bom.id, bom.name, targetName].join(' ').toLowerCase().includes(searchValue);
    const statusMatch = filterStatus === 'all' || bom.status === filterStatus;
    return searchMatch && statusMatch;
  });

  tbody.innerHTML = '';

  if (boms.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-8 text-center text-slate-400 font-semibold">No BOMs found.</td></tr>';
    return;
  }

  boms.forEach(bom => {
    const targetProduct = getProductById(bom.targetProductId);
    const targetName = targetProduct ? targetProduct.name : 'Unknown Product';
    
    let statusClass = 'bg-slate-200 text-slate-600';
    if (bom.status === 'Active') statusClass = 'bg-emerald-50 text-emerald-600';
    if (bom.status === 'Archived') statusClass = 'bg-amber-50 text-amber-600';

    tbody.innerHTML += `
      <tr class="hover:bg-slate-50/70 transition-colors">
        <td class="px-6 py-4 font-bold text-slate-900">${escapeHtml(bom.id)}</td>
        <td class="px-6 py-4 font-bold text-slate-900">${escapeHtml(bom.name)}</td>
        <td class="px-6 py-4">
          <div class="font-bold text-slate-700">${escapeHtml(targetName)}</div>
          <div class="text-[10px] text-slate-400 font-semibold">Output: ${bom.outputQuantity} unit(s)</div>
        </td>
        <td class="px-6 py-4 text-center font-semibold text-slate-900">${bom.materials.length}</td>
        <td class="px-6 py-4 text-right font-bold text-slate-900">${formatCurrency(bom.cost)}</td>
        <td class="px-6 py-4">
          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${statusClass}">
            ${escapeHtml(bom.status)}
          </span>
        </td>
        <td class="px-6 py-4 text-center">
          <button onclick="window.openBomModal('${bom.id}')" class="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-bold text-slate-600 transition-colors cursor-pointer">Edit</button>
        </td>
      </tr>
    `;
  });
};

function renderMetrics() {
  const container = document.getElementById('bom-metrics');
  if (!container) return;

  const boms = getBoms();
  const total = boms.length;
  const active = boms.filter(b => b.status === 'Active').length;

  container.innerHTML = `
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total BOMs</span>
      <span class="text-xl font-extrabold text-slate-950 block mt-2">${total}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-emerald-200 premium-shadow bg-emerald-50/20">
      <span class="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Active BOMs</span>
      <span class="text-xl font-extrabold text-emerald-700 block mt-2">${active}</span>
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
