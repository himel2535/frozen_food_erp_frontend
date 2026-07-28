import { appReadyPromise, appState, saveAppState, initIcons } from '/js/shared.js';

function escapeHtml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function formatCurrency(value) {
  return `$${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

let currentEditingId = null;

// Get vendor bills list from appState
function getList() {
  if (!appState.purchasesBills) {
    appState.purchasesBills = [
      {
        id: "BIL-2026-0001",
        supplier: "Global Dye Chemicals",
        poRef: "PO-2026-00042",
        date: "2026-06-16",
        dueDate: "2026-07-16",
        subtotal: 825.00,
        taxRate: 0,
        total: 825.00,
        status: "Approved",
        terms: "Net 30",
        billingAddress: "740 Broadway, New York, NY 10003",
        notes: "Matches PO-2026-00042 chemical shipment."
      },
      {
        id: "BIL-2026-0002",
        supplier: "Apex Yarns Ltd",
        poRef: "PO-2026-00041",
        date: "2026-06-17",
        dueDate: "2026-07-17",
        subtotal: 3125.00,
        taxRate: 5,
        total: 3281.25,
        status: "Pending",
        terms: "Net 30",
        billingAddress: "Plot 42, Tejgaon I/A, Dhaka",
        notes: "Pending manager verification."
      }
    ];
    saveAppState();
  }
  return appState.purchasesBills;
}

// Navigation helpers
window.showMainView = function() {
  document.getElementById('purchases-bills-main-view').classList.remove('hidden');
  document.getElementById('purchases-bills-form-view').classList.add('hidden');
  currentEditingId = null;
};

window.showFormView = function() {
  document.getElementById('purchases-bills-main-view').classList.add('hidden');
  document.getElementById('purchases-bills-form-view').classList.remove('hidden');
};

// Form Opening Actions
window.openBillModal = function() {
  currentEditingId = null;
  const form = document.getElementById('purchases-bills-form');
  if (form) form.reset();
  
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('input-date').value = today;
  
  // Set default due date to today + 30 days
  const future = new Date();
  future.setDate(future.getDate() + 30);
  document.getElementById('input-due-date').value = future.toISOString().split('T')[0];

  document.getElementById('bill-form-title').innerText = "Create Vendor Bill";
  
  // Unlock forms
  document.getElementById('input-supp').disabled = false;
  document.getElementById('input-po-ref').disabled = false;
  document.getElementById('input-subtotal').disabled = false;
  document.getElementById('input-tax-rate').disabled = false;

  window.calculateTotal();

  // Hide advanced section
  const advancedSection = document.getElementById('bill-advanced-section');
  if (advancedSection) advancedSection.classList.add('hidden');
  const advancedIcon = document.getElementById('bill-advanced-icon');
  if (advancedIcon) advancedIcon.style.transform = 'rotate(0deg)';

  window.showFormView();
};

window.toggleAdvancedFields = function() {
  const section = document.getElementById('bill-advanced-section');
  const icon = document.getElementById('bill-advanced-icon');
  if (section.classList.contains('hidden')) {
    section.classList.remove('hidden');
    icon.style.transform = 'rotate(180deg)';
  } else {
    section.classList.add('hidden');
    icon.style.transform = 'rotate(0deg)';
  }
};

window.calculateTotal = function() {
  const subtotal = Number(document.getElementById('input-subtotal').value || 0);
  const taxRate = Number(document.getElementById('input-tax-rate').value || 0);
  const total = subtotal + (subtotal * (taxRate / 100));
  document.getElementById('input-total').value = formatCurrency(total);
};

// Dynamic dropdown populators
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

  // Bind POs depending on supplier
  window.handleSupplierChange();
}

window.handleSupplierChange = function() {
  const suppVal = document.getElementById('input-supp').value;
  const poSelect = document.getElementById('input-po-ref');
  if (!poSelect) return;

  poSelect.innerHTML = '<option value="">Select Purchase Order (Optional)</option>';
  
  if (!suppVal) return;

  const orders = appState.purchases || [];
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
    document.getElementById('input-subtotal').value = po.total || 0;
    window.calculateTotal();
  }
};

// Transition: Approve Bill (Pending -> Approved)
window.approveBill = function(id) {
  const list = getList();
  const record = list.find(item => item.id === id);
  if (!record || record.status !== 'Pending') return;

  if (confirm(`Approve vendor invoice ${id}? This logs it as a confirmed payables liability.`)) {
    record.status = 'Approved';
    saveAppState();
    renderAll();
  }
};

// Transition: Record Payment (Approved -> Paid)
window.payBill = function(id) {
  const list = getList();
  const record = list.find(item => item.id === id);
  if (!record || record.status !== 'Approved') return;

  if (confirm(`Record payment for Vendor Bill ${id}? This offsets liability in accounts payables.`)) {
    record.status = 'Paid';

    // Log Cash Outflow in general ledger
    const netBalance = appState.accounting[appState.accounting.length - 1]?.balance || 0;
    appState.accounting.push({
      ref: `TXN-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString().split('T')[0],
      account: "Accounts Payable",
      desc: `Paid Vendor Bill ${record.id} to ${record.supplier}`,
      debit: Number(record.total),
      credit: 0.00,
      balance: netBalance - Number(record.total)
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
  const dueDate = document.getElementById('input-due-date').value;
  const subtotal = Number(document.getElementById('input-subtotal').value);
  const taxRate = Number(document.getElementById('input-tax-rate').value);
  const total = subtotal + (subtotal * (taxRate / 100));

  // Advanced fields
  const terms = document.getElementById('input-terms').value;
  const billingAddress = document.getElementById('input-billing-address').value;
  const notes = document.getElementById('input-notes').value;

  if (currentEditingId) {
    const record = list.find(item => item.id === currentEditingId);
    if (record) {
      if (record.status === 'Pending') {
        record.supplier = supplier;
        record.poRef = poRef;
        record.subtotal = subtotal;
        record.taxRate = taxRate;
        record.total = total;
      }
      record.date = date;
      record.dueDate = dueDate;
      record.terms = terms;
      record.billingAddress = billingAddress;
      record.notes = notes;
    }
  } else {
    const nextIdNum = list.length > 0 ? Math.max(...list.map(item => Number(item.id.replace('BIL-2026-', '')))) + 1 : 1;
    const newId = `BIL-2026-${String(10000 + nextIdNum).slice(1)}`;
    const newRecord = {
      id: newId,
      supplier,
      poRef,
      date,
      dueDate,
      subtotal,
      taxRate,
      total,
      status: "Pending",
      terms,
      billingAddress,
      notes
    };
    list.push(newRecord);
  }

  saveAppState();
  window.showMainView();
  renderAll();
};

// Edit vendor bill
window.editRecord = function(id) {
  const list = getList();
  const record = list.find(item => item.id === id);
  if (!record) return;

  currentEditingId = id;
  document.getElementById('bill-form-title').innerText = `Edit Vendor Bill: ${id}`;

  document.getElementById('input-supp').value = record.supplier;
  window.handleSupplierChange();
  
  document.getElementById('input-po-ref').value = record.poRef || '';
  document.getElementById('input-date').value = record.date;
  document.getElementById('input-due-date').value = record.dueDate;
  document.getElementById('input-subtotal').value = record.subtotal;
  document.getElementById('input-tax-rate').value = record.taxRate;

  // Advanced fields
  document.getElementById('input-terms').value = record.terms || '';
  document.getElementById('input-billing-address').value = record.billingAddress || '';
  document.getElementById('input-notes').value = record.notes || '';

  // Lock editable if Paid or Approved
  const isLocked = record.status === 'Approved' || record.status === 'Paid';
  document.getElementById('input-supp').disabled = isLocked;
  document.getElementById('input-po-ref').disabled = isLocked;
  document.getElementById('input-subtotal').disabled = isLocked;
  document.getElementById('input-tax-rate').disabled = isLocked;

  window.calculateTotal();
  window.showFormView();
};

// Delete vendor bill
window.deleteRecord = function(id) {
  const list = getList();
  const index = list.findIndex(item => item.id === id);
  if (index === -1) return;

  const record = list[index];
  if (record.status === 'Paid') {
    alert("Paid vendor bills cannot be deleted as they represent locked cash ledger records.");
    return;
  }

  if (confirm(`Are you sure you want to delete bill ${id}?`)) {
    list.splice(index, 1);
    saveAppState();
    renderAll();
  }
};

// Render Metrics Header Cards
function renderMetrics() {
  const list = getList();
  const container = document.getElementById('purchases-bills-metrics');
  if (!container) return;

  const totalBilled = list.reduce((sum, item) => sum + Number(item.total || 0), 0);
  const unpaidCount = list.filter(item => item.status === 'Approved' || item.status === 'Pending').length;
  const unpaidTotal = list.filter(item => item.status === 'Approved' || item.status === 'Pending').reduce((sum, item) => sum + Number(item.total || 0), 0);
  const paidCount = list.filter(item => item.status === 'Paid').length;

  container.innerHTML = `
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Billed Amt</span>
      <span class="text-xl font-extrabold text-slate-950 block mt-2">${formatCurrency(totalBilled)}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-blue-200 bg-blue-50/20 premium-shadow">
      <span class="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">Unpaid Bills</span>
      <span class="text-xl font-extrabold text-blue-700 block mt-2">${unpaidCount} bills</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-red-200 bg-red-50/20 premium-shadow">
      <span class="text-[10px] font-bold text-red-600 uppercase tracking-wider block">Outstanding Payables</span>
      <span class="text-xl font-extrabold text-red-700 block mt-2">${formatCurrency(unpaidTotal)}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Paid Invoices</span>
      <span class="text-xl font-extrabold text-emerald-600 block mt-2">${paidCount} closed</span>
    </div>
  `;
}

// Render data table rows
window.renderTable = function() {
  const tbody = document.getElementById('purchases-bills-body');
  if (!tbody) return;

  tbody.innerHTML = '';
  const search = (document.getElementById('purchases-bills-search-input')?.value || '').toLowerCase();
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
        (item.poRef || '').toLowerCase().includes(search);

      if (!queryMatches) return false;
    }

    return true;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" class="p-8 text-center text-slate-400 font-semibold">No vendor bills found.</td></tr>`;
    return;
  }

  filtered.forEach(item => {
    let badgeClass = "bg-slate-50 text-slate-700 border-slate-200";
    if (item.status === 'Paid') badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (item.status === 'Approved') badgeClass = "bg-blue-50 text-blue-700 border-blue-200";
    if (item.status === 'Pending') badgeClass = "bg-amber-50 text-amber-700 border-amber-200";

    tbody.innerHTML += `
      <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100">
        <td class="p-4 pl-6 font-bold text-slate-900">${escapeHtml(item.id)}</td>
        <td class="p-4 font-semibold text-slate-900">${escapeHtml(item.supplier)}</td>
        <td class="p-4 text-slate-650 font-bold">${escapeHtml(item.poRef || 'N/A')}</td>
        <td class="p-4 text-slate-500 font-medium">${escapeHtml(item.date)}</td>
        <td class="p-4 text-slate-500 font-medium">${escapeHtml(item.dueDate)}</td>
        <td class="p-4 text-right font-medium text-slate-650">${item.taxRate}%</td>
        <td class="p-4 text-right font-bold text-slate-900">${formatCurrency(item.total)}</td>
        <td class="p-4 text-center">
          <span class="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${badgeClass}">
            ${item.status}
          </span>
        </td>
        <td class="p-4">
          <div class="flex items-center justify-center gap-2">
            ${item.status === 'Pending' ? `
              <button onclick="window.approveBill('${item.id}')" title="Approve Bill" class="p-1.5 hover:bg-blue-50 text-blue-600 hover:text-blue-700 rounded-lg border border-slate-100 hover:border-blue-200 transition-colors cursor-pointer">
                <i data-lucide="check" class="w-3.5 h-3.5"></i>
              </button>
            ` : ''}
            ${item.status === 'Approved' ? `
              <button onclick="window.payBill('${item.id}')" title="Pay Vendor" class="p-1.5 hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700 rounded-lg border border-slate-100 hover:border-emerald-200 transition-colors cursor-pointer">
                <i data-lucide="credit-card" class="w-3.5 h-3.5"></i>
              </button>
            ` : ''}
            <button onclick="window.editRecord('${item.id}')" title="View/Edit" class="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-slate-800 rounded-lg border border-slate-100 transition-colors cursor-pointer">
              <i data-lucide="eye" class="w-3.5 h-3.5"></i>
            </button>
            ${item.status !== 'Paid' ? `
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
