import { appReadyPromise, appState, saveAppState, initIcons } from '/js/shared.js';

function escapeHtml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function formatCurrency(value) {
  return `$${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

let currentEditingId = null;

// Get returns list from appState
function getList() {
  if (!appState.purchasesReturns) {
    appState.purchasesReturns = [
      {
        id: "PR-001",
        supplier: "Global Dye Chemicals",
        poRef: "PO-2026-00042",
        date: "2026-06-19",
        qty: 5,
        unitCost: 55.00,
        amount: 275.00,
        reason: "Quality Substandard",
        status: "Resolved",
        dispatchDate: "2026-06-20",
        carrier: "FedEx",
        tracking: "TRK-900822",
        notes: "Chemical quality report attached."
      },
      {
        id: "PR-002",
        supplier: "Apex Yarns Ltd",
        poRef: "PO-2026-00041",
        date: "2026-06-20",
        qty: 20,
        unitCost: 12.50,
        amount: 250.00,
        reason: "Wrong Specifications",
        status: "Draft",
        dispatchDate: "",
        carrier: "",
        tracking: "",
        notes: "Wrong batch color received."
      }
    ];
    saveAppState();
  }
  return appState.purchasesReturns;
}

// Navigation helpers
window.showMainView = function() {
  document.getElementById('purchases-returns-main-view').classList.remove('hidden');
  document.getElementById('purchases-returns-form-view').classList.add('hidden');
  currentEditingId = null;
};

window.showFormView = function() {
  document.getElementById('purchases-returns-main-view').classList.add('hidden');
  document.getElementById('purchases-returns-form-view').classList.remove('hidden');
};

// Form Opening Actions
window.openReturnModal = function() {
  currentEditingId = null;
  const form = document.getElementById('purchases-returns-form');
  if (form) form.reset();
  
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('input-date').value = today;

  document.getElementById('return-form-title').innerText = "Create Purchase Return";
  
  // Unlock forms
  document.getElementById('input-supp').disabled = false;
  document.getElementById('input-po-ref').disabled = false;
  document.getElementById('input-qty').disabled = false;
  document.getElementById('input-unit-refund').disabled = false;
  document.getElementById('input-reason').disabled = false;

  window.calculateRefund();

  // Hide advanced section
  const advancedSection = document.getElementById('return-advanced-section');
  if (advancedSection) advancedSection.classList.add('hidden');
  const advancedIcon = document.getElementById('return-advanced-icon');
  if (advancedIcon) advancedIcon.style.transform = 'rotate(0deg)';

  window.showFormView();
};

window.toggleAdvancedFields = function() {
  const section = document.getElementById('return-advanced-section');
  const icon = document.getElementById('return-advanced-icon');
  if (section.classList.contains('hidden')) {
    section.classList.remove('hidden');
    icon.style.transform = 'rotate(180deg)';
  } else {
    section.classList.add('hidden');
    icon.style.transform = 'rotate(0deg)';
  }
};

window.calculateRefund = function() {
  const qty = Number(document.getElementById('input-qty').value || 0);
  const refundCost = Number(document.getElementById('input-unit-refund').value || 0);
  const total = qty * refundCost;
  document.getElementById('input-amount').value = formatCurrency(total);
};

// Dynamic dropdown selectors loading
function populateDropdowns() {
  const suppSelect = document.getElementById('input-supp');
  const filterSupp = document.getElementById('filter-supplier');

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

  // Load POs depending on supplier
  window.handleSupplierChange();
}

window.handleSupplierChange = function() {
  const suppVal = document.getElementById('input-supp').value;
  const poSelect = document.getElementById('input-po-ref');
  if (!poSelect) return;

  poSelect.innerHTML = '<option value="">Select Purchase Order *</option>';
  
  if (!suppVal) return;

  const orders = appState.purchases || [];
  // Load Sent or Received POs
  const matchedOrders = orders.filter(o => o.supplier === suppVal && (o.status === 'Sent' || o.status === 'Received'));
  
  matchedOrders.forEach(o => {
    poSelect.innerHTML += `<option value="${o.id}">${escapeHtml(o.id)} (Amount: ${formatCurrency(o.total)})</option>`;
  });
};

window.handlePOChange = function() {
  const poId = document.getElementById('input-po-ref').value;
  if (!poId) return;

  const orders = appState.purchases || [];
  const po = orders.find(o => o.id === poId);
  if (po) {
    document.getElementById('input-qty').value = po.qty || 0;
    document.getElementById('input-unit-refund').value = po.unitCost || 0;
    window.calculateRefund();
  }
};

// Transition: Approve & Dispatch (Draft -> Dispatched)
window.dispatchReturn = function(id) {
  const list = getList();
  const record = list.find(item => item.id === id);
  if (!record || record.status !== 'Draft') return;

  if (confirm(`Approve and dispatch return ${id}? This immediately reduces active warehouse stock levels.`)) {
    record.status = 'Dispatched';
    record.dispatchDate = new Date().toISOString().split('T')[0];

    // Outflow: decrement warehouse stock
    const orders = appState.purchases || [];
    const po = orders.find(o => o.id === record.poRef);
    const prodId = po ? po.productId : 1;

    const product = appState.inventory.find(i => i.id === Number(prodId));
    if (product) {
      if (!product.warehouseStock) {
        product.warehouseStock = {};
      }
      const defaultWh = product.defaultWarehouse || "WH-001";
      if (!product.warehouseStock[defaultWh]) {
        product.warehouseStock[defaultWh] = 0;
      }
      // Decrement stock
      product.warehouseStock[defaultWh] = Math.max(0, product.warehouseStock[defaultWh] - Number(record.qty));
      product.stock = Object.values(product.warehouseStock).reduce((sum, curr) => sum + curr, 0);
    }

    saveAppState();
    renderAll();
  }
};

// Transition: Resolve Return (Dispatched -> Resolved)
window.resolveReturn = function(id) {
  const list = getList();
  const record = list.find(item => item.id === id);
  if (!record || record.status !== 'Dispatched') return;

  if (confirm(`Mark return ${id} as Resolved? This records the supplier refund in accounting logs.`)) {
    record.status = 'Resolved';

    // Accounting ledger refund inflow record
    const netBalance = appState.accounting[appState.accounting.length - 1]?.balance || 0;
    appState.accounting.push({
      ref: `TXN-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString().split('T')[0],
      account: "Purchase Returns & Allowances",
      desc: `Supplier refund for return ${record.id} - ${record.supplier}`,
      debit: 0.00,
      credit: Number(record.amount),
      balance: netBalance + Number(record.amount)
    });

    saveAppState();
    renderAll();
  }
};

// Form submit
window.handleSubmit = function(event) {
  event.preventDefault();
  const list = getList();

  const supplier = document.getElementById('input-supp').value;
  const poRef = document.getElementById('input-po-ref').value;
  const date = document.getElementById('input-date').value;
  const reason = document.getElementById('input-reason').value;
  const qty = Number(document.getElementById('input-qty').value);
  const unitRefund = Number(document.getElementById('input-unit-refund').value);
  const amount = qty * unitRefund;

  // Advanced fields
  const dispatchDate = document.getElementById('input-dispatch-date').value;
  const carrier = document.getElementById('input-carrier').value;
  const tracking = document.getElementById('input-tracking').value;
  const notes = document.getElementById('input-notes').value;

  if (currentEditingId) {
    const record = list.find(item => item.id === currentEditingId);
    if (record) {
      if (record.status === 'Draft') {
        record.supplier = supplier;
        record.poRef = poRef;
        record.qty = qty;
        record.unitCost = unitRefund;
        record.amount = amount;
        record.reason = reason;
      }
      record.date = date;
      record.dispatchDate = dispatchDate;
      record.carrier = carrier;
      record.tracking = tracking;
      record.notes = notes;
    }
  } else {
    const nextIdNum = list.length > 0 ? Math.max(...list.map(item => Number(item.id.replace('PR-', '')))) + 1 : 1;
    const newId = `PR-${String(100 + nextIdNum).slice(1)}`;
    const newRecord = {
      id: newId,
      supplier,
      poRef,
      date,
      qty,
      unitCost: unitRefund,
      amount,
      reason,
      status: "Draft",
      dispatchDate,
      carrier,
      tracking,
      notes
    };
    list.push(newRecord);
  }

  saveAppState();
  window.showMainView();
  renderAll();
};

// Edit return record
window.editRecord = function(id) {
  const list = getList();
  const record = list.find(item => item.id === id);
  if (!record) return;

  currentEditingId = id;
  document.getElementById('return-form-title').innerText = `Edit Purchase Return: ${id}`;

  document.getElementById('input-supp').value = record.supplier;
  window.handleSupplierChange();
  
  document.getElementById('input-po-ref').value = record.poRef || '';
  document.getElementById('input-date').value = record.date;
  document.getElementById('input-reason').value = record.reason;
  document.getElementById('input-qty').value = record.qty;
  document.getElementById('input-unit-refund').value = record.unitCost || '';

  // Advanced fields
  document.getElementById('input-dispatch-date').value = record.dispatchDate || '';
  document.getElementById('input-carrier').value = record.carrier || '';
  document.getElementById('input-tracking').value = record.tracking || '';
  document.getElementById('input-notes').value = record.notes || '';

  // Lock form inputs if Approved or Dispatched
  const isLocked = record.status === 'Dispatched' || record.status === 'Resolved';
  document.getElementById('input-supp').disabled = isLocked;
  document.getElementById('input-po-ref').disabled = isLocked;
  document.getElementById('input-qty').disabled = isLocked;
  document.getElementById('input-unit-refund').disabled = isLocked;
  document.getElementById('input-reason').disabled = isLocked;

  window.calculateRefund();
  window.showFormView();
};

// Delete return record
window.deleteRecord = function(id) {
  const list = getList();
  const index = list.findIndex(item => item.id === id);
  if (index === -1) return;

  const record = list[index];
  if (record.status === 'Resolved') {
    alert("Resolved returns represent processed refund ledgers and cannot be deleted.");
    return;
  }

  if (confirm(`Are you sure you want to delete return record ${id}?`)) {
    list.splice(index, 1);
    saveAppState();
    renderAll();
  }
};

// Render Metrics Header Cards
function renderMetrics() {
  const list = getList();
  const container = document.getElementById('purchases-returns-metrics');
  if (!container) return;

  const totalReturns = list.length;
  const totalRefunded = list.filter(item => item.status === 'Resolved').reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const pendingCount = list.filter(item => item.status === 'Dispatched').length;
  const draftCount = list.filter(item => item.status === 'Draft').length;

  container.innerHTML = `
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Returns</span>
      <span class="text-xl font-extrabold text-slate-950 block mt-2">${totalReturns} runs</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-emerald-200 bg-emerald-50/20 premium-shadow">
      <span class="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Total Refunded Value</span>
      <span class="text-xl font-extrabold text-emerald-700 block mt-2">${formatCurrency(totalRefunded)}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-blue-200 bg-blue-50/20 premium-shadow">
      <span class="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">Pending Shipments</span>
      <span class="text-xl font-extrabold text-blue-700 block mt-2">${pendingCount} transit</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Draft Returns</span>
      <span class="text-xl font-extrabold text-amber-600 block mt-2">${draftCount} drafts</span>
    </div>
  `;
}

// Render data table rows
window.renderTable = function() {
  const tbody = document.getElementById('purchases-returns-body');
  if (!tbody) return;

  tbody.innerHTML = '';
  const search = (document.getElementById('purchases-returns-search-input')?.value || '').toLowerCase();
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
      const queryMatches = 
        item.id.toLowerCase().includes(search) ||
        item.supplier.toLowerCase().includes(search) ||
        item.poRef.toLowerCase().includes(search) ||
        item.reason.toLowerCase().includes(search);

      if (!queryMatches) return false;
    }

    return true;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" class="p-8 text-center text-slate-400 font-semibold">No return records found.</td></tr>`;
    return;
  }

  filtered.forEach(item => {
    let badgeClass = "bg-slate-50 text-slate-700 border-slate-200";
    if (item.status === 'Resolved') badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (item.status === 'Dispatched') badgeClass = "bg-blue-50 text-blue-700 border-blue-200";
    if (item.status === 'Draft') badgeClass = "bg-amber-50 text-amber-700 border-amber-200";
    if (item.status === 'Cancelled') badgeClass = "bg-rose-50 text-rose-700 border-rose-200";

    tbody.innerHTML += `
      <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100">
        <td class="p-4 pl-6 font-bold text-slate-900">${escapeHtml(item.id)}</td>
        <td class="p-4 font-semibold text-slate-900">${escapeHtml(item.supplier)}</td>
        <td class="p-4 text-slate-650 font-bold">${escapeHtml(item.poRef)}</td>
        <td class="p-4 text-center font-semibold text-slate-700">${item.qty}</td>
        <td class="p-4 text-right font-bold text-rose-600">${formatCurrency(item.amount)}</td>
        <td class="p-4 text-slate-500 font-semibold">${escapeHtml(item.reason)}</td>
        <td class="p-4 text-slate-500 font-medium">${escapeHtml(item.date)}</td>
        <td class="p-4 text-center">
          <span class="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${badgeClass}">
            ${item.status}
          </span>
        </td>
        <td class="p-4">
          <div class="flex items-center justify-center gap-2">
            ${item.status === 'Draft' ? `
              <button onclick="window.dispatchReturn('${item.id}')" title="Approve & Dispatch" class="p-1.5 hover:bg-blue-50 text-blue-600 hover:text-blue-700 rounded-lg border border-slate-100 hover:border-blue-200 transition-colors cursor-pointer">
                <i data-lucide="check" class="w-3.5 h-3.5"></i>
              </button>
            ` : ''}
            ${item.status === 'Dispatched' ? `
              <button onclick="window.resolveReturn('${item.id}')" title="Mark Resolved" class="p-1.5 hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700 rounded-lg border border-slate-100 hover:border-emerald-200 transition-colors cursor-pointer">
                <i data-lucide="check" class="w-3.5 h-3.5"></i>
              </button>
            ` : ''}
            <button onclick="window.editRecord('${item.id}')" title="View/Edit" class="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-slate-800 rounded-lg border border-slate-100 transition-colors cursor-pointer">
              <i data-lucide="eye" class="w-3.5 h-3.5"></i>
            </button>
            ${item.status !== 'Resolved' ? `
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
