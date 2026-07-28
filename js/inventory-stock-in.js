import { appReadyPromise, appState, saveAppState, initIcons } from '/js/shared.js';

function escapeHtml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function formatCurrency(value) {
  return `$${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Global active ID for editing
let currentEditingId = null;

// Initialize mock data if not existing
function getList() {
  if (!appState.inventoryStockIn) {
    appState.inventoryStockIn = [
      {
        id: "SI-001",
        productId: 1,
        warehouseId: "WH-001",
        qty: 300,
        unitCost: 8.50,
        date: "2026-06-20",
        sourceType: "Purchase",
        refDocId: "PO-1001",
        supplier: "Global Yarn Dist",
        status: "Approved",
        batchNumber: "B-YRN-09A",
        expiryDate: "",
        approvedBy: "Sarah Connor",
        notes: "Standard purchase order receipt."
      },
      {
        id: "SI-002",
        productId: 2,
        warehouseId: "WH-002",
        qty: 10,
        unitCost: 55.00,
        date: "2026-06-21",
        sourceType: "Production",
        refDocId: "PRD-502",
        supplier: "",
        status: "Pending",
        batchNumber: "B-DYE-22",
        expiryDate: "2027-06-21",
        approvedBy: "",
        notes: "Awaiting final quality checks."
      },
      {
        id: "SI-003",
        productId: 3,
        warehouseId: "WH-001",
        qty: 50,
        unitCost: 14.00,
        date: "2026-06-22",
        sourceType: "Return",
        refDocId: "RET-201",
        supplier: "",
        status: "Approved",
        batchNumber: "B-FAB-101",
        expiryDate: "",
        approvedBy: "Sarah Connor",
        notes: "Restocked from sales return."
      }
    ];
    saveAppState();
  }
  return appState.inventoryStockIn;
}

// Navigation Views
window.showMainView = function() {
  document.getElementById('inventory-stock-in-main-view').classList.remove('hidden');
  document.getElementById('inventory-stock-in-form-view').classList.add('hidden');
  currentEditingId = null;
};

window.showFormView = function() {
  document.getElementById('inventory-stock-in-main-view').classList.add('hidden');
  document.getElementById('inventory-stock-in-form-view').classList.remove('hidden');
};

// Form Opening Actions
window.openStockinModal = function() {
  currentEditingId = null;
  const form = document.getElementById('inventory-stock-in-form');
  if (form) form.reset();
  
  // Set default date to today
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('input-date').value = today;
  
  // Title update
  document.getElementById('stock-in-form-title').innerText = "Create Stock In";
  document.getElementById('input-prod').disabled = false;
  document.getElementById('input-wh').disabled = false;
  document.getElementById('input-qty').disabled = false;
  document.getElementById('input-unit-cost').disabled = false;
  document.getElementById('input-source-type').disabled = false;

  window.handleSourceTypeChange();
  window.calculateTotalValue();
  
  // Hide advanced fields by default
  const advancedSection = document.getElementById('inventory-stock-in-advanced-section');
  if (advancedSection) advancedSection.classList.add('hidden');
  const advancedIcon = document.getElementById('inventory-stock-in-advanced-icon');
  if (advancedIcon) advancedIcon.style.transform = 'rotate(0deg)';

  window.showFormView();
};

// Toggle Advanced Form Fields
window.toggleAdvancedFields = function() {
  const section = document.getElementById('inventory-stock-in-advanced-section');
  const icon = document.getElementById('inventory-stock-in-advanced-icon');
  if (section.classList.contains('hidden')) {
    section.classList.remove('hidden');
    icon.style.transform = 'rotate(180deg)';
  } else {
    section.classList.add('hidden');
    icon.style.transform = 'rotate(0deg)';
  }
};

// Conditionally show/hide supplier fields
window.handleSourceTypeChange = function() {
  const sourceType = document.getElementById('input-source-type').value;
  const container = document.getElementById('supplier-container');
  if (sourceType === 'Purchase') {
    container.classList.remove('hidden');
  } else {
    container.classList.add('hidden');
    document.getElementById('input-supplier').value = '';
  }
};

// Calculate cost calculations
window.calculateTotalValue = function() {
  const qty = Number(document.getElementById('input-qty').value || 0);
  const cost = Number(document.getElementById('input-unit-cost').value || 0);
  const total = qty * cost;
  document.getElementById('input-total-val').value = formatCurrency(total);
};

// Dynamic dropdown selectors loading
function populateDropdowns() {
  const prodSelect = document.getElementById('input-prod');
  const whSelect = document.getElementById('input-wh');
  const filterWh = document.getElementById('filter-warehouse');

  if (prodSelect && appState.inventory) {
    prodSelect.innerHTML = '<option value="">Select Product *</option>';
    appState.inventory.forEach(p => {
      prodSelect.innerHTML += `<option value="${p.id}">${escapeHtml(p.name)} (${escapeHtml(p.sku)})</option>`;
    });

    // Auto update unit cost on product change
    prodSelect.onchange = () => {
      const selectedId = Number(prodSelect.value);
      const product = appState.inventory.find(p => p.id === selectedId);
      if (product) {
        document.getElementById('input-unit-cost').value = product.cost || 0;
        window.calculateTotalValue();
      }
    };
  }

  if (whSelect && appState.inventoryWarehouses) {
    whSelect.innerHTML = '<option value="">Select Warehouse *</option>';
    appState.inventoryWarehouses.forEach(w => {
      whSelect.innerHTML += `<option value="${w.id}">${escapeHtml(w.name)}</option>`;
    });
  }

  if (filterWh && appState.inventoryWarehouses) {
    filterWh.innerHTML = '<option value="all">All Warehouses</option>';
    appState.inventoryWarehouses.forEach(w => {
      filterWh.innerHTML += `<option value="${w.id}">${escapeHtml(w.name)}</option>`;
    });
  }
}

// Approval action
window.approveRecord = function(id) {
  const list = getList();
  const record = list.find(item => item.id === id);
  if (!record || record.status === 'Approved') return;

  if (confirm(`Are you sure you want to approve Stock-In run ${id}? This will physically update warehouse inventory levels.`)) {
    // 1. Mark status approved
    record.status = 'Approved';
    
    // 2. Perform physical stock update
    const product = appState.inventory.find(p => p.id === Number(record.productId));
    if (product) {
      if (!product.warehouseStock) {
        product.warehouseStock = {};
      }
      if (!product.warehouseStock[record.warehouseId]) {
        product.warehouseStock[record.warehouseId] = 0;
      }
      // Add quantity to warehouse stock
      product.warehouseStock[record.warehouseId] += Number(record.qty);
      // Recalculate global product stock
      product.stock = Object.values(product.warehouseStock).reduce((sum, current) => sum + current, 0);
    }
    
    saveAppState();
    renderAll();
  }
};

// Form submission handler
window.handleSubmit = function(event) {
  event.preventDefault();
  const list = getList();

  const productId = Number(document.getElementById('input-prod').value);
  const warehouseId = document.getElementById('input-wh').value;
  const qty = Number(document.getElementById('input-qty').value);
  const date = document.getElementById('input-date').value;
  const sourceType = document.getElementById('input-source-type').value;
  const refDocId = document.getElementById('input-ref').value;
  const unitCost = Number(document.getElementById('input-unit-cost').value);
  const supplier = document.getElementById('input-supplier').value;
  const batchNumber = document.getElementById('input-batch').value;
  const expiryDate = document.getElementById('input-expiry').value;
  const approvedBy = document.getElementById('input-approved-by').value;
  const notes = document.getElementById('input-notes').value;

  if (currentEditingId) {
    // Edit flow
    const record = list.find(item => item.id === currentEditingId);
    if (record) {
      // Modify remaining editable properties (only allowed if Pending)
      if (record.status === 'Pending') {
        record.productId = productId;
        record.warehouseId = warehouseId;
        record.qty = qty;
        record.unitCost = unitCost;
        record.sourceType = sourceType;
      }
      record.date = date;
      record.refDocId = refDocId;
      record.supplier = supplier;
      record.batchNumber = batchNumber;
      record.expiryDate = expiryDate;
      record.approvedBy = approvedBy;
      record.notes = notes;
    }
  } else {
    // Create new flow
    const nextIdNum = list.length > 0 ? Math.max(...list.map(item => Number(item.id.replace('SI-', '')))) + 1 : 1;
    const newId = `SI-${String(1000 + nextIdNum).slice(1)}`;
    const newRecord = {
      id: newId,
      productId,
      warehouseId,
      qty,
      unitCost,
      date,
      sourceType,
      refDocId,
      supplier,
      status: "Pending", // Always starts as Pending
      batchNumber,
      expiryDate,
      approvedBy,
      notes
    };
    list.push(newRecord);
  }

  saveAppState();
  window.showMainView();
  renderAll();
};

// Edit Record Action
window.editRecord = function(id) {
  const list = getList();
  const record = list.find(item => item.id === id);
  if (!record) return;

  currentEditingId = id;
  
  // Title update
  document.getElementById('stock-in-form-title').innerText = `Edit Stock In Details: ${id}`;
  
  // Fill values
  document.getElementById('input-prod').value = record.productId;
  document.getElementById('input-wh').value = record.warehouseId;
  document.getElementById('input-qty').value = record.qty;
  document.getElementById('input-date').value = record.date;
  document.getElementById('input-source-type').value = record.sourceType;
  document.getElementById('input-ref').value = record.refDocId;
  document.getElementById('input-unit-cost').value = record.unitCost;
  document.getElementById('input-supplier').value = record.supplier;
  document.getElementById('input-batch').value = record.batchNumber;
  document.getElementById('input-expiry').value = record.expiryDate;
  document.getElementById('input-approved-by').value = record.approvedBy;
  document.getElementById('input-notes').value = record.notes;

  // If approved, lock structural parameters
  const isApproved = record.status === 'Approved';
  document.getElementById('input-prod').disabled = isApproved;
  document.getElementById('input-wh').disabled = isApproved;
  document.getElementById('input-qty').disabled = isApproved;
  document.getElementById('input-unit-cost').disabled = isApproved;
  document.getElementById('input-source-type').disabled = isApproved;

  window.handleSourceTypeChange();
  window.calculateTotalValue();
  window.showFormView();
};

// Delete Pending Record
window.deleteRecord = function(id) {
  const list = getList();
  const index = list.findIndex(item => item.id === id);
  if (index === -1) return;

  const record = list[index];
  if (record.status === 'Approved') {
    alert("Approved Stock-In records represent physical stock entries and cannot be deleted.");
    return;
  }

  if (confirm(`Are you sure you want to delete pending Stock-In ${id}?`)) {
    list.splice(index, 1);
    saveAppState();
    renderAll();
  }
};

// Render Metrics Header Cards
function renderMetrics() {
  const list = getList();
  const metricsContainer = document.getElementById('inventory-stock-in-metrics');
  if (!metricsContainer) return;

  const totalRuns = list.length;
  const totalQty = list.reduce((sum, item) => sum + Number(item.qty || 0), 0);
  const totalVal = list.reduce((sum, item) => sum + (Number(item.qty || 0) * Number(item.unitCost || 0)), 0);
  const pendingRuns = list.filter(item => item.status === 'Pending').length;

  metricsContainer.innerHTML = `
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Stock-In Runs</span>
      <span class="text-xl font-extrabold text-slate-950 block mt-2">${totalRuns} runs</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Incoming Qty</span>
      <span class="text-xl font-extrabold text-slate-950 block mt-2">${totalQty.toLocaleString()} units</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Stock-In Value</span>
      <span class="text-xl font-extrabold text-emerald-600 block mt-2">${formatCurrency(totalVal)}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-orange-200 bg-orange-50/20 premium-shadow">
      <span class="text-[10px] font-bold text-orange-600 uppercase tracking-wider block">Pending Verification</span>
      <span class="text-xl font-extrabold text-orange-700 block mt-2">${pendingRuns} pending</span>
    </div>
  `;
}

// Render data table rows
window.renderTable = function() {
  const tbody = document.getElementById('inventory-stock-in-body');
  if (!tbody) return;

  tbody.innerHTML = '';
  const search = (document.getElementById('inventory-stock-in-search-input')?.value || '').toLowerCase();
  const whFilter = document.getElementById('filter-warehouse')?.value || 'all';
  const sourceFilter = document.getElementById('filter-source-type')?.value || 'all';
  const statusFilter = document.getElementById('filter-status')?.value || 'all';
  const dateStart = document.getElementById('filter-date-start')?.value || '';
  const dateEnd = document.getElementById('filter-date-end')?.value || '';

  const list = getList();
  
  const filtered = list.filter(item => {
    // Warehouse Filter
    if (whFilter !== 'all' && item.warehouseId !== whFilter) return false;
    // Source Type Filter
    if (sourceFilter !== 'all' && item.sourceType !== sourceFilter) return false;
    // Status Filter
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    
    // Date Filters
    if (dateStart && item.date < dateStart) return false;
    if (dateEnd && item.date > dateEnd) return false;

    // Search query
    if (search) {
      const product = appState.inventory?.find(p => p.id === item.productId);
      const productName = product ? product.name.toLowerCase() : '';
      const productSku = product ? product.sku.toLowerCase() : '';
      const warehouse = appState.inventoryWarehouses?.find(w => w.id === item.warehouseId);
      const warehouseName = warehouse ? warehouse.name.toLowerCase() : '';

      const queryMatches = 
        item.id.toLowerCase().includes(search) ||
        productName.includes(search) ||
        productSku.includes(search) ||
        warehouseName.includes(search) ||
        (item.refDocId || '').toLowerCase().includes(search) ||
        (item.batchNumber || '').toLowerCase().includes(search) ||
        (item.supplier || '').toLowerCase().includes(search);

      if (!queryMatches) return false;
    }

    return true;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="11" class="p-8 text-center text-slate-400 font-semibold">No stock-in records found.</td></tr>`;
    return;
  }

  filtered.forEach(item => {
    const product = appState.inventory?.find(p => p.id === item.productId);
    const productName = product ? product.name : 'Unknown Product';
    const productSku = product ? product.sku : 'N/A';
    
    const warehouse = appState.inventoryWarehouses?.find(w => w.id === item.warehouseId);
    const warehouseName = warehouse ? warehouse.name : 'Unknown Warehouse';

    const totalVal = (item.qty || 0) * (item.unitCost || 0);

    const isPending = item.status === 'Pending';
    const badgeClass = isPending 
      ? 'bg-orange-50 text-orange-700 border-orange-200' 
      : 'bg-emerald-50 text-emerald-700 border-emerald-200';

    tbody.innerHTML += `
      <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100">
        <td class="p-4 pl-6 font-bold text-slate-900">${escapeHtml(item.id)}</td>
        <td class="p-4">
          <div class="font-semibold text-slate-900">${escapeHtml(productName)}</div>
          <div class="text-[10px] text-slate-400 font-medium">${escapeHtml(productSku)}</div>
        </td>
        <td class="p-4">${escapeHtml(warehouseName)}</td>
        <td class="p-4 text-center font-semibold">${item.qty}</td>
        <td class="p-4 text-right font-medium">${formatCurrency(item.unitCost)}</td>
        <td class="p-4 text-right font-bold text-slate-900">${formatCurrency(totalVal)}</td>
        <td class="p-4 text-slate-500 font-medium">${escapeHtml(item.date)}</td>
        <td class="p-4 font-semibold text-slate-600">${escapeHtml(item.sourceType)}</td>
        <td class="p-4">
          <div class="text-slate-900 font-semibold">${escapeHtml(item.refDocId || 'N/A')}</div>
          ${item.supplier ? `<div class="text-[10px] text-slate-400 font-semibold">${escapeHtml(item.supplier)}</div>` : ''}
        </td>
        <td class="p-4 text-center">
          <span class="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${badgeClass}">
            ${item.status}
          </span>
        </td>
        <td class="p-4">
          <div class="flex items-center justify-center gap-2">
            ${isPending ? `
              <button onclick="window.approveRecord('${item.id}')" title="Approve & Restock" class="p-1.5 hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700 rounded-lg border border-slate-100 hover:border-emerald-200 transition-colors cursor-pointer">
                <i data-lucide="check" class="w-3.5 h-3.5"></i>
              </button>
            ` : ''}
            <button onclick="window.editRecord('${item.id}')" title="Edit/View Record" class="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-slate-800 rounded-lg border border-slate-100 transition-colors cursor-pointer">
              <i data-lucide="eye" class="w-3.5 h-3.5"></i>
            </button>
            ${isPending ? `
              <button onclick="window.deleteRecord('${item.id}')" title="Delete" class="p-1.5 hover:bg-rose-50 text-rose-600 hover:text-rose-700 rounded-lg border border-slate-100 hover:border-rose-200 transition-colors cursor-pointer">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  });
};

function renderAll() {
  renderMetrics();
  window.renderTable();
  initIcons();
}

document.addEventListener('DOMContentLoaded', async () => {
  await appReadyPromise;
  populateDropdowns();
  renderAll();
});
