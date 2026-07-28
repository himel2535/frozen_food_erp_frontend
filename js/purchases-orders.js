import { appReadyPromise, appState, saveAppState, initIcons } from '/js/shared.js';

function escapeHtml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function formatCurrency(value) {
  return `$${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

let currentEditingId = null;

// Return purchases array from appState
function getList() {
  if (!appState.purchases) {
    appState.purchases = [
      {
        id: "PO-2026-00041",
        supplier: "Apex Yarns Ltd",
        productId: 1,
        date: "2026-06-14",
        qty: 250,
        unitCost: 12.50,
        total: 3125.00,
        status: "Received",
        deliveryDate: "2026-06-20",
        terms: "Net 30",
        notes: "Deliver to Central Hub."
      },
      {
        id: "PO-2026-00042",
        supplier: "Global Dye Chemicals",
        productId: 2,
        date: "2026-06-15",
        qty: 15,
        unitCost: 55.00,
        total: 825.00,
        status: "Sent",
        deliveryDate: "2026-06-18",
        terms: "Net 15",
        notes: "Expedited shipping requested."
      },
      {
        id: "PO-2026-00043",
        supplier: "Universal Silks Co",
        productId: 3,
        date: "2026-06-16",
        qty: 90,
        unitCost: 14.00,
        total: 1260.00,
        status: "Draft",
        deliveryDate: "",
        terms: "Due on Receipt",
        notes: "Awaiting confirm."
      }
    ];
    saveAppState();
  }
  return appState.purchases;
}

// Navigation Views
window.showMainView = function() {
  document.getElementById('purchases-orders-main-view').classList.remove('hidden');
  document.getElementById('purchases-orders-form-view').classList.add('hidden');
  currentEditingId = null;
};

window.showFormView = function() {
  document.getElementById('purchases-orders-main-view').classList.add('hidden');
  document.getElementById('purchases-orders-form-view').classList.remove('hidden');
};

// Form Opening Actions
window.openOrderModal = function() {
  currentEditingId = null;
  const form = document.getElementById('purchases-orders-form');
  if (form) form.reset();
  
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('input-date').value = today;
  
  document.getElementById('order-form-title').innerText = "Create Purchase Order";
  
  // Unlock inputs
  document.getElementById('input-supp').disabled = false;
  document.getElementById('input-prod').disabled = false;
  document.getElementById('input-qty').disabled = false;
  document.getElementById('input-unit-cost').disabled = false;
  document.getElementById('input-status').disabled = false;

  window.calculateTotalAmount();

  // Hide advanced section
  const advancedSection = document.getElementById('order-advanced-section');
  if (advancedSection) advancedSection.classList.add('hidden');
  const advancedIcon = document.getElementById('order-advanced-icon');
  if (advancedIcon) advancedIcon.style.transform = 'rotate(0deg)';

  window.showFormView();
};

window.toggleAdvancedFields = function() {
  const section = document.getElementById('order-advanced-section');
  const icon = document.getElementById('order-advanced-icon');
  if (section.classList.contains('hidden')) {
    section.classList.remove('hidden');
    icon.style.transform = 'rotate(180deg)';
  } else {
    section.classList.add('hidden');
    icon.style.transform = 'rotate(0deg)';
  }
};

window.calculateTotalAmount = function() {
  const qty = Number(document.getElementById('input-qty').value || 0);
  const cost = Number(document.getElementById('input-unit-cost').value || 0);
  const total = qty * cost;
  document.getElementById('input-total').value = formatCurrency(total);
};

// Populate suppliers and products dynamic dropdowns
function populateDropdowns() {
  const suppSelect = document.getElementById('input-supp');
  const filterSupp = document.getElementById('filter-supplier');
  const prodSelect = document.getElementById('input-prod');

  // Load suppliers
  const suppliers = appState.purchasesSuppliers || [];
  if (suppSelect) {
    suppSelect.innerHTML = '<option value="">Select Supplier *</option>';
    suppliers.forEach(s => {
      suppSelect.innerHTML += `<option value="${escapeHtml(s.name)}">${escapeHtml(s.name)}</option>`;
    });
  }
  if (filterSupp) {
    filterSupp.innerHTML = '<option value="all">All Suppliers</option>';
    suppliers.forEach(s => {
      filterSupp.innerHTML += `<option value="${escapeHtml(s.name)}">${escapeHtml(s.name)}</option>`;
    });
  }

  // Load products
  const products = appState.inventory || [];
  if (prodSelect) {
    prodSelect.innerHTML = '<option value="">Select Product SKU *</option>';
    products.forEach(p => {
      prodSelect.innerHTML += `<option value="${p.id}">${escapeHtml(p.name)} (${escapeHtml(p.sku)})</option>`;
    });

    prodSelect.onchange = () => {
      const selectedId = Number(prodSelect.value);
      const product = products.find(p => p.id === selectedId);
      if (product) {
        document.getElementById('input-unit-cost').value = product.cost || 0;
        window.calculateTotalAmount();
      }
    };
  }
}

// Transition: Send PO (Draft -> Sent)
window.sendOrder = function(id) {
  const list = getList();
  const record = list.find(item => item.id === id);
  if (!record || record.status !== 'Draft') return;

  if (confirm(`Are you sure you want to mark PO ${id} as Sent?`)) {
    record.status = 'Sent';
    saveAppState();
    renderAll();
  }
};

// Transition: Receive PO (Sent -> Received)
window.receiveOrder = function(id) {
  const list = getList();
  const record = list.find(item => item.id === id);
  if (!record || record.status !== 'Sent') return;

  if (confirm(`Mark PO ${id} as Received? This will immediately increase active warehouse inventory stock and record accounting ledgers.`)) {
    record.status = 'Received';

    // 1. Stock intake update
    const product = appState.inventory.find(i => i.id === Number(record.productId || 1));
    if (product) {
      if (!product.warehouseStock) {
        product.warehouseStock = {};
      }
      const defaultWh = product.defaultWarehouse || "WH-001";
      if (!product.warehouseStock[defaultWh]) {
        product.warehouseStock[defaultWh] = 0;
      }
      product.warehouseStock[defaultWh] += Number(record.qty);
      product.stock = Object.values(product.warehouseStock).reduce((sum, curr) => sum + curr, 0);
    }

    // 2. Accounting general ledger entry
    const netBalance = appState.accounting[appState.accounting.length - 1]?.balance || 0;
    appState.accounting.push({
      ref: `TXN-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString().split('T')[0],
      account: "Cost of Goods Sold",
      desc: `Purchase inventory batch ${record.id} - Received`,
      debit: Number(record.total),
      credit: 0.00,
      balance: netBalance - Number(record.total)
    });

    saveAppState();
    renderAll();
  }
};

// Transition: Cancel PO
window.cancelOrder = function(id) {
  const list = getList();
  const record = list.find(item => item.id === id);
  if (!record || (record.status !== 'Draft' && record.status !== 'Sent')) return;

  if (confirm(`Are you sure you want to Cancel purchase order ${id}?`)) {
    record.status = 'Cancelled';
    saveAppState();
    renderAll();
  }
};

// Form Submission handling
window.handleSubmit = function(event) {
  event.preventDefault();
  const list = getList();

  const supplier = document.getElementById('input-supp').value;
  const productId = Number(document.getElementById('input-prod').value);
  const date = document.getElementById('input-date').value;
  const status = document.getElementById('input-status').value;
  const qty = Number(document.getElementById('input-qty').value);
  const unitCost = Number(document.getElementById('input-unit-cost').value);
  const total = qty * unitCost;

  // Advanced details
  const deliveryDate = document.getElementById('input-delivery-date').value;
  const terms = document.getElementById('input-terms').value;
  const notes = document.getElementById('input-notes').value;

  if (currentEditingId) {
    const record = list.find(item => item.id === currentEditingId);
    if (record) {
      if (record.status === 'Draft' || record.status === 'Sent') {
        record.supplier = supplier;
        record.productId = productId;
        record.qty = qty;
        record.unitCost = unitCost;
        record.total = total;
        record.status = status;
      }
      record.date = date;
      record.deliveryDate = deliveryDate;
      record.terms = terms;
      record.notes = notes;
    }
  } else {
    const nextIdNum = list.length > 0 ? Math.max(...list.map(item => Number(item.id.replace('PO-2026-', '')))) + 1 : 1;
    const newId = `PO-2026-${String(10000 + nextIdNum).slice(1)}`;
    const newRecord = {
      id: newId,
      supplier,
      productId,
      date,
      qty,
      unitCost,
      total,
      status,
      deliveryDate,
      terms,
      notes
    };
    list.push(newRecord);
  }

  saveAppState();
  window.showMainView();
  renderAll();
};

// Edit PO
window.editRecord = function(id) {
  const list = getList();
  const record = list.find(item => item.id === id);
  if (!record) return;

  currentEditingId = id;
  document.getElementById('order-form-title').innerText = `Edit Purchase Order: ${id}`;

  document.getElementById('input-supp').value = record.supplier;
  document.getElementById('input-prod').value = record.productId || '';
  document.getElementById('input-date').value = record.date;
  document.getElementById('input-qty').value = record.qty;
  document.getElementById('input-unit-cost').value = record.unitCost || '';
  document.getElementById('input-status').value = record.status;
  
  // Advanced Details
  document.getElementById('input-delivery-date').value = record.deliveryDate || '';
  document.getElementById('input-terms').value = record.terms || '';
  document.getElementById('input-notes').value = record.notes || '';

  // If approved or locked, disable critical parameters
  const isLocked = record.status === 'Received' || record.status === 'Cancelled';
  document.getElementById('input-supp').disabled = isLocked;
  document.getElementById('input-prod').disabled = isLocked;
  document.getElementById('input-qty').disabled = isLocked;
  document.getElementById('input-unit-cost').disabled = isLocked;
  document.getElementById('input-status').disabled = isLocked;

  window.calculateTotalAmount();
  window.showFormView();
};

// Delete PO
window.deleteRecord = function(id) {
  const list = getList();
  const index = list.findIndex(item => item.id === id);
  if (index === -1) return;

  const record = list[index];
  if (record.status === 'Received') {
    alert("Received purchase orders are physically restocked and logged in ledger; they cannot be deleted.");
    return;
  }

  if (confirm(`Are you sure you want to delete purchase order ${id}?`)) {
    list.splice(index, 1);
    saveAppState();
    renderAll();
  }
};

// Render Metrics Header Cards
function renderMetrics() {
  const list = getList();
  const container = document.getElementById('purchases-orders-metrics');
  if (!container) return;

  const totalSpend = list.reduce((sum, item) => sum + Number(item.total || 0), 0);
  const pendingCount = list.filter(item => item.status === 'Sent').length;
  const receivedCount = list.filter(item => item.status === 'Received').length;
  const draftCount = list.filter(item => item.status === 'Draft').length;

  container.innerHTML = `
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Procured Spend</span>
      <span class="text-xl font-extrabold text-slate-950 block mt-2">${formatCurrency(totalSpend)}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-blue-200 bg-blue-50/20 premium-shadow">
      <span class="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">Pending POs</span>
      <span class="text-xl font-extrabold text-blue-700 block mt-2">${pendingCount} sent</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Received POs</span>
      <span class="text-xl font-extrabold text-emerald-600 block mt-2">${receivedCount} closed</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Draft POs</span>
      <span class="text-xl font-extrabold text-amber-600 block mt-2">${draftCount} drafts</span>
    </div>
  `;
}

// Render data table rows
window.renderTable = function() {
  const tbody = document.getElementById('purchases-orders-body');
  if (!tbody) return;

  tbody.innerHTML = '';
  const search = (document.getElementById('purchases-orders-search-input')?.value || '').toLowerCase();
  const supplierFilter = document.getElementById('filter-supplier')?.value || 'all';
  const statusFilter = document.getElementById('filter-status')?.value || 'all';
  const dateStart = document.getElementById('filter-date-start')?.value || '';
  const dateEnd = document.getElementById('filter-date-end')?.value || '';

  const list = getList();

  const filtered = list.filter(item => {
    if (supplierFilter !== 'all' && item.supplier !== supplierFilter) return false;
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (dateStart && item.date < dateStart) return false;
    if (dateEnd && item.date > dateEnd) return false;

    if (search) {
      const product = appState.inventory?.find(p => p.id === item.productId);
      const productName = product ? product.name.toLowerCase() : '';
      const productSku = product ? product.sku.toLowerCase() : '';

      const queryMatches = 
        item.id.toLowerCase().includes(search) ||
        item.supplier.toLowerCase().includes(search) ||
        productName.includes(search) ||
        productSku.includes(search);

      if (!queryMatches) return false;
    }

    return true;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" class="p-8 text-center text-slate-400 font-semibold">No purchase orders found.</td></tr>`;
    return;
  }

  filtered.forEach(item => {
    const product = appState.inventory?.find(p => p.id === item.productId);
    const productName = product ? product.name : 'Unknown Product';
    const productSku = product ? product.sku : 'N/A';

    let badgeClass = "bg-slate-50 text-slate-700 border-slate-200";
    if (item.status === 'Received') badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (item.status === 'Sent') badgeClass = "bg-blue-50 text-blue-700 border-blue-200";
    if (item.status === 'Draft') badgeClass = "bg-amber-50 text-amber-700 border-amber-200";
    if (item.status === 'Cancelled') badgeClass = "bg-rose-50 text-rose-700 border-rose-200";

    const orderTotal = item.total || (item.qty * item.unitCost);

    tbody.innerHTML += `
      <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100">
        <td class="p-4 pl-6 font-bold text-slate-900">${escapeHtml(item.id)}</td>
        <td class="p-4 font-semibold text-slate-900">${escapeHtml(item.supplier)}</td>
        <td class="p-4">
          <div class="font-semibold text-slate-900">${escapeHtml(productName)}</div>
          <div class="text-[10px] text-slate-400 font-medium">${escapeHtml(productSku)}</div>
        </td>
        <td class="p-4 text-center font-semibold text-slate-700">${item.qty} units</td>
        <td class="p-4 text-right font-medium text-slate-650">${formatCurrency(item.unitCost || 0)}</td>
        <td class="p-4 text-right font-bold text-slate-900">${formatCurrency(orderTotal)}</td>
        <td class="p-4 text-slate-500 font-medium">${escapeHtml(item.date)}</td>
        <td class="p-4 text-center">
          <span class="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${badgeClass}">
            ${item.status}
          </span>
        </td>
        <td class="p-4">
          <div class="flex items-center justify-center gap-2">
            ${item.status === 'Draft' ? `
              <button onclick="window.sendOrder('${item.id}')" title="Send PO" class="p-1.5 hover:bg-blue-50 text-blue-600 hover:text-blue-700 rounded-lg border border-slate-100 hover:border-blue-200 transition-colors cursor-pointer">
                <i data-lucide="check" class="w-3.5 h-3.5"></i>
              </button>
            ` : ''}
            ${item.status === 'Sent' ? `
              <button onclick="window.receiveOrder('${item.id}')" title="Mark Received" class="p-1.5 hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700 rounded-lg border border-slate-100 hover:border-emerald-200 transition-colors cursor-pointer">
                <i data-lucide="check" class="w-3.5 h-3.5"></i>
              </button>
            ` : ''}
            <button onclick="window.editRecord('${item.id}')" title="View/Edit" class="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-slate-800 rounded-lg border border-slate-100 transition-colors cursor-pointer">
              <i data-lucide="eye" class="w-3.5 h-3.5"></i>
            </button>
            ${(item.status === 'Draft' || item.status === 'Sent') ? `
              <button onclick="window.cancelOrder('${item.id}')" title="Cancel PO" class="p-1.5 hover:bg-rose-50 text-rose-600 hover:text-rose-700 rounded-lg border border-slate-100 hover:border-rose-200 transition-colors cursor-pointer">
                <i data-lucide="x" class="w-3.5 h-3.5"></i>
              </button>
            ` : ''}
            ${item.status !== 'Received' ? `
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

window.addEventListener('hookerp:language-changed', () => {
  populateDropdowns();
  renderAll();
});
