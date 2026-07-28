import { appReadyPromise, appState, saveAppState, initIcons } from '/js/shared.js';
import { getCustomerList, ensureCrmState } from '/js/crm-service.js';

function escapeHtml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function formatCurrency(value) {
  return `$${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getList() {
  if (!appState.salesReturns) {
    appState.salesReturns = [
      {
        id: "SR-2026-0001",
        invoiceId: "INV-2025-00142",
        customerId: 4,
        customerName: "Wardenclyffe",
        date: "2026-06-12",
        reason: "Defective Fabric",
        type: "Refund",
        amount: 450.00,
        status: "refunded",
        taxAdjustment: 0.00,
        discountReversal: 0.00,
        condition: "Defective",
        warehouseStatus: "Scrapped",
        notes: "Fabric has print misalignment across the roll. Scrapped in main facility.",
        items: [
          { productId: "prod-yarn", name: "Premium Wool Yarn", quantity: 2, price: 225.00, total: 450.00 }
        ]
      }
    ];
    saveAppState();
  }
  return appState.salesReturns;
}

function getCustomers() {
  ensureCrmState(appState);
  return getCustomerList(appState);
}

function getInvoices() {
  ensureCrmState(appState);
  return appState.invoices || [];
}

window.showMainView = function() {
  document.getElementById('sales-returns-main-view').classList.remove('hidden');
  document.getElementById('sales-returns-form-view').classList.add('hidden');
};

window.showFormView = function() {
  document.getElementById('sales-returns-main-view').classList.add('hidden');
  document.getElementById('sales-returns-form-view').classList.remove('hidden');
};

window.toggleAdvancedFields = function() {
  const advancedSection = document.getElementById('sales-returns-advanced-section');
  const advancedIcon = document.getElementById('sales-returns-advanced-icon');
  if (advancedSection.classList.contains('hidden')) {
    advancedSection.classList.remove('hidden');
    advancedIcon.style.transform = 'rotate(180deg)';
  } else {
    advancedSection.classList.add('hidden');
    advancedIcon.style.transform = 'rotate(0deg)';
  }
};

window.openReturnsModal = function() {
  const form = document.getElementById('sales-returns-form');
  if (form) form.reset();

  document.getElementById('input-return-id').value = '';
  document.getElementById('return-form-title').textContent = 'Create Sales Return';
  document.getElementById('input-customer-name').value = '';
  document.getElementById('input-date').value = new Date().toISOString().slice(0, 10);
  document.getElementById('input-status-display').value = 'Pending';
  document.getElementById('input-status-display').className = 'w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-xs font-bold text-amber-600 focus:outline-none';
  
  // Reset items tbody
  document.getElementById('input-items-tbody').innerHTML = `
    <tr>
      <td colspan="5" class="p-6 text-center text-slate-400">Please select an Invoice Reference first.</td>
    </tr>
  `;

  document.getElementById('calc-subtotal').textContent = '$0.00';
  document.getElementById('input-tax-adjustment').value = '0.00';
  document.getElementById('input-discount-reversal').value = '0.00';
  document.getElementById('input-amount').value = '0.00';
  
  // Enable form controls
  toggleFormControls(false);

  // Populate Invoices Dropdown
  const selectInvoice = document.getElementById('input-invoice-id');
  if (selectInvoice) {
    selectInvoice.innerHTML = '<option value="">Select Linked Invoice</option>';
    getInvoices().forEach(inv => {
      selectInvoice.innerHTML += `<option value="${inv.id}">${escapeHtml(inv.id)} (${inv.customerSnapshot?.company || 'Unknown Client'} - ${formatCurrency(inv.total)})</option>`;
    });
  }

  // Hide workflow actions container when adding new return
  document.getElementById('workflow-actions-container').innerHTML = '';
  document.getElementById('btn-save').classList.remove('hidden');

  window.showFormView();
};

window.handleInvoiceSelection = function(invoiceId) {
  if (!invoiceId) {
    document.getElementById('input-customer-name').value = '';
    document.getElementById('input-items-tbody').innerHTML = `
      <tr>
        <td colspan="5" class="p-6 text-center text-slate-400">Please select an Invoice Reference first.</td>
      </tr>
    `;
    return;
  }

  const invoice = getInvoices().find(inv => inv.id === invoiceId);
  if (!invoice) {
    alert("Invoice details not found.");
    return;
  }

  // Populate Customer Name
  const clientName = invoice.customerSnapshot?.company || 'Walk-in Customer';
  document.getElementById('input-customer-name').value = clientName;

  // Render line items for returns
  const tbody = document.getElementById('input-items-tbody');
  tbody.innerHTML = '';

  const items = invoice.items || [];
  if (items.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-slate-400">This invoice has no items.</td></tr>`;
    return;
  }

  items.forEach((item, idx) => {
    // Generate row with inputs
    tbody.innerHTML += `
      <tr class="hover:bg-slate-50 transition-colors" data-product-id="${escapeHtml(item.productId)}" data-product-name="${escapeHtml(item.name)}" data-price="${item.price}">
        <td class="p-3 font-bold text-slate-900">${escapeHtml(item.name)}</td>
        <td class="p-3 text-right text-slate-500 font-semibold">${item.quantity}</td>
        <td class="p-3 text-center">
          <input type="number" min="0" max="${item.quantity}" value="0" 
            oninput="window.calculateRefundTotals()" 
            class="item-return-qty-input w-20 px-2 py-1 rounded-lg border border-slate-200 text-center font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/10">
        </td>
        <td class="p-3 text-right text-slate-650 font-bold">${formatCurrency(item.price)}</td>
        <td class="p-3 text-right font-extrabold text-slate-900 item-total-refund-span">$0.00</td>
      </tr>
    `;
  });

  window.calculateRefundTotals();
};

window.calculateRefundTotals = function() {
  let subtotal = 0;
  const rows = document.querySelectorAll('#input-items-tbody tr[data-product-id]');
  
  rows.forEach(row => {
    const price = parseFloat(row.getAttribute('data-price') || 0);
    const qtyInput = row.querySelector('.item-return-qty-input');
    const qty = parseFloat(qtyInput ? qtyInput.value : 0) || 0;
    
    // Check constraint max
    const maxQty = parseFloat(qtyInput.getAttribute('max') || 9999);
    if (qty > maxQty) {
      qtyInput.value = maxQty;
    }

    const rowTotal = qty * price;
    subtotal += rowTotal;

    const span = row.querySelector('.item-total-refund-span');
    if (span) {
      span.textContent = formatCurrency(rowTotal);
    }
  });

  document.getElementById('calc-subtotal').textContent = formatCurrency(subtotal);

  const tax = parseFloat(document.getElementById('input-tax-adjustment').value || 0) || 0;
  const disc = parseFloat(document.getElementById('input-discount-reversal').value || 0) || 0;
  const finalTotal = Math.max(0, subtotal + tax - disc);

  document.getElementById('input-amount').value = finalTotal.toFixed(2);
};

function toggleFormControls(disabled) {
  const inputs = [
    'input-invoice-id',
    'input-date',
    'input-reason',
    'input-type',
    'input-tax-adjustment',
    'input-discount-reversal',
    'input-condition',
    'input-warehouse-status',
    'input-images',
    'input-notes'
  ];

  inputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.disabled = disabled;
  });

  const qtyInputs = document.querySelectorAll('.item-return-qty-input');
  qtyInputs.forEach(input => {
    input.disabled = disabled;
  });
}

window.viewReturnDetail = function(returnId) {
  const record = getList().find(item => item.id === returnId);
  if (!record) return;

  window.showFormView();
  
  document.getElementById('return-form-title').textContent = `Sales Return Detail: ${record.id}`;
  document.getElementById('input-return-id').value = record.id;
  document.getElementById('input-customer-name').value = record.customerName;
  document.getElementById('input-date').value = record.date;
  document.getElementById('input-reason').value = record.reason;
  document.getElementById('input-type').value = record.type;
  
  // Setup display status
  const statusDisp = document.getElementById('input-status-display');
  statusDisp.value = record.status.toUpperCase();
  if (record.status === 'refunded' || record.status === 'processed') {
    statusDisp.className = 'w-full px-4 py-2.5 rounded-xl border border-emerald-200 bg-emerald-50 text-xs font-bold text-emerald-600 focus:outline-none';
  } else if (record.status === 'approved') {
    statusDisp.className = 'w-full px-4 py-2.5 rounded-xl border border-blue-250 bg-blue-50 text-xs font-bold text-blue-600 focus:outline-none';
  } else if (record.status === 'rejected') {
    statusDisp.className = 'w-full px-4 py-2.5 rounded-xl border border-rose-250 bg-rose-50 text-xs font-bold text-rose-600 focus:outline-none';
  } else {
    statusDisp.className = 'w-full px-4 py-2.5 rounded-xl border border-amber-250 bg-amber-50 text-xs font-bold text-amber-600 focus:outline-none';
  }

  // Populate Invoices Dropdown to show selected
  const selectInvoice = document.getElementById('input-invoice-id');
  selectInvoice.innerHTML = `<option value="${record.invoiceId}">${escapeHtml(record.invoiceId)}</option>`;
  selectInvoice.value = record.invoiceId;

  // Load items
  const tbody = document.getElementById('input-items-tbody');
  tbody.innerHTML = '';
  record.items.forEach(item => {
    tbody.innerHTML += `
      <tr data-product-id="${escapeHtml(item.productId)}" data-price="${item.price}">
        <td class="p-3 font-bold text-slate-900">${escapeHtml(item.name)}</td>
        <td class="p-3 text-right text-slate-500 font-semibold">-</td>
        <td class="p-3 text-center">
          <span class="font-extrabold text-slate-950">${item.quantity}</span>
        </td>
        <td class="p-3 text-right text-slate-650 font-bold">${formatCurrency(item.price)}</td>
        <td class="p-3 text-right font-extrabold text-slate-900">${formatCurrency(item.total)}</td>
      </tr>
    `;
  });

  document.getElementById('calc-subtotal').textContent = formatCurrency(record.items.reduce((sum, i) => sum + i.total, 0));
  document.getElementById('input-tax-adjustment').value = (record.taxAdjustment || 0).toFixed(2);
  document.getElementById('input-discount-reversal').value = (record.discountReversal || 0).toFixed(2);
  document.getElementById('input-amount').value = (record.amount || 0).toFixed(2);

  // Advanced section
  document.getElementById('input-condition').value = record.condition || 'Good';
  document.getElementById('input-warehouse-status').value = record.warehouseStatus || 'Restocked';
  document.getElementById('input-images').value = record.images || '';
  document.getElementById('input-notes').value = record.notes || '';

  // Only disable the form fully if the return is already completed or rejected
  if (record.status === 'refunded' || record.status === 'processed' || record.status === 'rejected') {
    toggleFormControls(true);
  } else {
    toggleFormControls(false);
    // Invoice ID cannot be changed once created
    const invEl = document.getElementById('input-invoice-id');
    if (invEl) {
      invEl.disabled = true;
      invEl.classList.add('opacity-60', 'cursor-not-allowed');
    }
  }

  // Render workflow action buttons
  renderWorkflowButtons(record);
};

function renderWorkflowButtons(record) {
  const container = document.getElementById('workflow-actions-container');
  container.innerHTML = '';
  
  // Hide save button if status isn't pending (or if viewing details only)
  const saveBtn = document.getElementById('btn-save');
  saveBtn.classList.add('hidden');

  if (record.status === 'pending') {
    container.innerHTML = `
      <button type="button" onclick="window.handleWorkflowAction('${record.id}', 'approve')" class="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-md shadow-blue-500/10">Approve Request</button>
      <button type="button" onclick="window.handleWorkflowAction('${record.id}', 'reject')" class="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-md shadow-rose-500/10">Reject Request</button>
    `;
  } else if (record.status === 'approved') {
    container.innerHTML = `
      <button type="button" onclick="window.handleWorkflowAction('${record.id}', 'process')" class="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-md shadow-indigo-500/10">Process inventory adjust</button>
    `;
  } else if (record.status === 'processed') {
    const actionLabel = record.type === 'Credit Note' ? 'Generate Credit Note' : 'Issue Refund';
    container.innerHTML = `
      <button type="button" onclick="window.handleWorkflowAction('${record.id}', 'refund')" class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-md shadow-emerald-500/10">${actionLabel}</button>
    `;
  }
}

window.handleWorkflowAction = function(returnId, action) {
  const list = getList();
  const record = list.find(item => item.id === returnId);
  if (!record) return;

  if (action === 'approve') {
    record.status = 'approved';
    alert(`Sales Return ${record.id} approved successfully.`);
  } else if (action === 'reject') {
    const reason = prompt("Enter rejection reason:");
    if (reason === null) return;
    record.status = 'rejected';
    record.notes = (record.notes ? record.notes + "\n" : "") + `[Rejection Reason]: ${reason}`;
    alert(`Sales Return ${record.id} has been rejected.`);
  } else if (action === 'process') {
    // Inventory Impact Adjustments
    if (record.warehouseStatus === 'Restocked') {
      ensureCrmState(appState);
      if (!Array.isArray(appState.inventory)) {
        appState.inventory = [];
      }
      record.items.forEach(item => {
        const product = appState.inventory.find(p => String(p.id) === String(item.productId));
        if (product) {
          product.stock = Number(product.stock || 0) + Number(item.quantity);
        }
      });
      alert(`Warehouse stock updated. Items restocked successfully.`);
    } else {
      alert(`Processed return. Warehouse inventory status logged as: ${record.warehouseStatus}. No stock adjustment performed.`);
    }
    record.status = 'processed';
  } else if (action === 'refund') {
    record.status = 'refunded';
    alert(`Refund issued / Credit note applied for ${formatCurrency(record.amount)}.`);
  }

  saveAppState();
  window.showMainView();
  renderAll();
};

window.handleSubmit = function(event) {
  event.preventDefault();
  
  const list = getList();
  const invoiceId = document.getElementById('input-invoice-id').value;
  const customerName = document.getElementById('input-customer-name').value;
  
  // Find linked invoice to extract customerId
  const invoice = getInvoices().find(inv => inv.id === invoiceId);
  const customerId = invoice ? invoice.customerId : '';

  // Extract selected items
  const returnedItems = [];
  const rows = document.querySelectorAll('#input-items-tbody tr[data-product-id]');
  rows.forEach(row => {
    const qtyInput = row.querySelector('.item-return-qty-input');
    const qty = parseInt(qtyInput ? qtyInput.value : 0) || 0;
    if (qty > 0) {
      returnedItems.push({
        productId: row.getAttribute('data-product-id'),
        name: row.getAttribute('data-product-name'),
        quantity: qty,
        price: parseFloat(row.getAttribute('data-price') || 0),
        total: qty * parseFloat(row.getAttribute('data-price') || 0)
      });
    }
  });

  if (returnedItems.length === 0) {
    alert("Please select at least one item and set a return quantity greater than 0.");
    return;
  }

  const amount = parseFloat(document.getElementById('input-amount').value || 0);

  const newRecord = {
    id: `SR-2026-${String(10000 + list.length + 1).slice(1)}`,
    invoiceId,
    customerId,
    customerName,
    date: document.getElementById('input-date').value,
    reason: document.getElementById('input-reason').value,
    type: document.getElementById('input-type').value,
    amount,
    status: 'pending',
    taxAdjustment: parseFloat(document.getElementById('input-tax-adjustment').value || 0) || 0,
    discountReversal: parseFloat(document.getElementById('input-discount-reversal').value || 0) || 0,
    condition: document.getElementById('input-condition').value,
    warehouseStatus: document.getElementById('input-warehouse-status').value,
    images: document.getElementById('input-images').value,
    notes: document.getElementById('input-notes').value,
    items: returnedItems
  };
  
  list.push(newRecord);
  saveAppState();
  window.showMainView();
  renderAll();
};

window.renderTable = function() {
  const tbody = document.getElementById('sales-returns-body');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  const search = document.getElementById('sales-returns-search-input')?.value.toLowerCase() || '';
  const customerFilter = document.getElementById('sales-returns-customer-filter')?.value || 'all';
  const statusFilter = document.getElementById('sales-returns-status-filter')?.value || 'all';
  const typeFilter = document.getElementById('sales-returns-type-filter')?.value || 'all';
  const dateStart = document.getElementById('sales-returns-date-start')?.value || '';
  const dateEnd = document.getElementById('sales-returns-date-end')?.value || '';

  const filtered = getList().filter(item => {
    // Search filter
    const matchesSearch = !search || 
      String(item.id).toLowerCase().includes(search) || 
      String(item.invoiceId).toLowerCase().includes(search) || 
      String(item.customerName).toLowerCase().includes(search) || 
      String(item.reason).toLowerCase().includes(search);
    
    // Dropdown filters
    const matchesCustomer = customerFilter === 'all' || String(item.customerId) === String(customerFilter);
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesType = typeFilter === 'all' || item.type === typeFilter;
    
    // Date range filters
    const matchesDateStart = !dateStart || item.date >= dateStart;
    const matchesDateEnd = !dateEnd || item.date <= dateEnd;

    return matchesSearch && matchesCustomer && matchesStatus && matchesType && matchesDateStart && matchesDateEnd;
  });
  
  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" class="p-8 text-center text-slate-400 font-semibold">No return requests found</td></tr>`;
    return;
  }
  
  filtered.forEach(item => {
    let statusPillClass = 'bg-amber-50 text-amber-700 border border-amber-250';
    if (item.status === 'refunded' || item.status === 'processed') {
      statusPillClass = 'bg-emerald-50 text-emerald-600 border border-emerald-200';
    } else if (item.status === 'approved') {
      statusPillClass = 'bg-blue-50 text-blue-700 border border-blue-200';
    } else if (item.status === 'rejected') {
      statusPillClass = 'bg-rose-50 text-rose-600 border border-rose-250';
    }

    tbody.innerHTML += `
      <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100">
        <td class="p-4 pl-6 font-bold text-slate-900">${escapeHtml(item.id)}</td>
        <td class="p-4 font-bold text-blue-600 cursor-pointer" onclick="window.viewReturnDetail('${item.id}')">${escapeHtml(item.invoiceId)}</td>
        <td class="p-4 font-semibold text-slate-800">${escapeHtml(item.customerName)}</td>
        <td class="p-4 text-slate-500 font-medium">${escapeHtml(item.date)}</td>
        <td class="p-4 font-medium text-slate-650">${escapeHtml(item.reason)}</td>
        <td class="p-4"><span class="font-bold text-slate-600">${escapeHtml(item.type)}</span></td>
        <td class="p-4 font-extrabold text-right text-rose-600">${formatCurrency(item.amount)}</td>
        <td class="p-4 text-center">
          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${statusPillClass}">${item.status.toUpperCase()}</span>
        </td>
        <td class="p-4 text-center">
          <button onclick="window.viewReturnDetail('${item.id}')" class="text-blue-600 hover:text-blue-700 text-xs font-bold transition-all px-2.5 py-1 rounded-lg hover:bg-blue-50 cursor-pointer">
            View / Approve
          </button>
        </td>
      </tr>
    `;
  });
};

function renderMetrics() {
  const list = getList();
  const metricsContainer = document.getElementById('sales-returns-metrics');
  if (!metricsContainer) return;
  
  const total = list.length;
  const pending = list.filter(item => item.status === 'pending').length;
  const refunded = list.filter(item => item.status === 'refunded').length;
  const rejected = list.filter(item => item.status === 'rejected').length;
  const totalRefundVal = list
    .filter(item => ['approved', 'processed', 'refunded'].includes(item.status))
    .reduce((sum, item) => sum + (item.amount || 0), 0);
  
  metricsContainer.innerHTML = `
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Returns</span>
      <span class="text-xl font-extrabold text-slate-950 block mt-2">${total}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-amber-200/80 premium-shadow bg-amber-50/10">
      <span class="text-[10px] font-bold text-amber-500 uppercase tracking-wider block">Pending Returns</span>
      <span class="text-xl font-extrabold text-amber-600 block mt-2">${pending}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-rose-250 premium-shadow bg-rose-50/10">
      <span class="text-[10px] font-bold text-rose-500 uppercase tracking-wider block">Total Refund Value</span>
      <span class="text-xl font-extrabold text-rose-600 block mt-2">${formatCurrency(totalRefundVal)}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-emerald-250 premium-shadow bg-emerald-50/10">
      <span class="text-[10px] font-bold text-emerald-500 uppercase tracking-wider block">Completed Returns</span>
      <span class="text-xl font-extrabold text-emerald-600 block mt-2">${refunded}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Rejected Returns</span>
      <span class="text-xl font-extrabold text-slate-950 block mt-2">${rejected}</span>
    </div>
  `;
}

function populateCustomerFilter() {
  const select = document.getElementById('sales-returns-customer-filter');
  if (!select) return;
  
  select.innerHTML = '<option value="all">All Customers</option>';
  getCustomers().forEach(c => {
    select.innerHTML += `<option value="${c.id}">${escapeHtml(c.company || c.name)}</option>`;
  });
}

function renderAll() {
  populateCustomerFilter();
  renderMetrics();
  window.renderTable();
  initIcons();
}

document.addEventListener('DOMContentLoaded', async () => {
  await appReadyPromise;
  renderAll();
});
