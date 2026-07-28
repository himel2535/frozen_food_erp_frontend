import { appReadyPromise, appState, saveAppState, initIcons } from '/js/shared.js';
import {
  ensureCrmState,
  getCustomerList,
  getCustomerProfile,
  createPaymentRecord,
  createActivityEntry,
  syncInvoiceBalances,
  getUserContext,
  getInvoiceById
} from '/js/crm-service.js';

let activeReportTab = 'collection';

function escapeHtml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function formatCurrency(value) {
  return `$${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

// Helper to get all payment records
function getPaymentsList() {
  ensureCrmState(appState);
  return Object.values(appState.crmData.paymentsById || {}).sort((a, b) => String(b.date || b.createdAt || '').localeCompare(String(a.date || a.createdAt || '')));
}

// Helper to get invoice details
function getInvoicesList() {
  ensureCrmState(appState);
  return appState.invoices || [];
}

// Show/Hide views
window.showSalesMainView = function() {
  document.getElementById('sales-payments-main-view').classList.remove('hidden');
  document.getElementById('sales-payments-form-view').classList.add('hidden');
  renderAll();
};

window.showFormView = function() {
  document.getElementById('sales-payments-main-view').classList.add('hidden');
  document.getElementById('sales-payments-form-view').classList.remove('hidden');
};

// Toggle Advanced Form Fields
window.toggleAdvancedFields = function() {
  const section = document.getElementById('payments-advanced-section');
  const icon = document.getElementById('payments-advanced-icon');
  if (section.classList.contains('hidden')) {
    section.classList.remove('hidden');
    icon.style.transform = 'rotate(180deg)';
  } else {
    section.classList.add('hidden');
    icon.style.transform = 'rotate(0deg)';
  }
};

// Reset search and filters
window.resetFilters = function() {
  document.getElementById('sales-payments-search-input').value = '';
  document.getElementById('filter-customer').value = 'all';
  document.getElementById('filter-method').value = 'all';
  document.getElementById('filter-status').value = 'all';
  document.getElementById('filter-date-start').value = '';
  document.getElementById('filter-date-end').value = '';
  document.getElementById('filter-invoice-id').value = '';
  document.getElementById('filter-bank-account').value = 'all';
  document.getElementById('filter-amount-min').value = '';
  document.getElementById('filter-amount-max').value = '';
  window.renderTable();
};

// Populate dropdown lists for forms & filters
function populateDropdowns() {
  const customerFilter = document.getElementById('filter-customer');
  const formCustomer = document.getElementById('input-customer');
  const formInvoice = document.getElementById('input-invoice-id');

  if (!customerFilter || !formCustomer || !formInvoice) return;

  const customers = getCustomerList(appState);
  
  // 1. Customers Filter
  const prevCustomerFilter = customerFilter.value;
  customerFilter.innerHTML = '<option value="all">All Customers</option>';
  customers.forEach(c => {
    customerFilter.innerHTML += `<option value="${c.id}">${escapeHtml(c.company)}</option>`;
  });
  if (prevCustomerFilter) customerFilter.value = prevCustomerFilter;

  // 2. Form Customer Dropdown
  formCustomer.innerHTML = '<option value="">Select Customer</option>';
  customers.forEach(c => {
    formCustomer.innerHTML += `<option value="${c.id}">${escapeHtml(c.company)}</option>`;
  });

  // 3. Form Invoice Dropdown (only show invoices that are open, sent, partially paid or overdue)
  const invoices = getInvoicesList().filter(inv => {
    return inv.status !== 'cancelled' && inv.status !== 'draft' && inv.status !== 'paid';
  });

  formInvoice.innerHTML = '<option value="">Select Invoice to Pay</option>';
  invoices.forEach(inv => {
    const cust = customers.find(c => c.id === inv.customerId);
    const company = cust ? cust.company : 'Unknown Customer';
    formInvoice.innerHTML += `<option value="${inv.id}" data-customer-id="${inv.customerId}" data-balance="${inv.dueAmount}">${escapeHtml(inv.id)} — ${escapeHtml(company)} (Due: ${formatCurrency(inv.dueAmount)})</option>`;
  });
}

// Handle invoice selection in the form
window.handleInvoiceSelection = function() {
  const select = document.getElementById('input-invoice-id');
  const customerSelect = document.getElementById('input-customer');
  const balanceInput = document.getElementById('invoice-remaining-balance');
  const amountInput = document.getElementById('input-amount');

  if (!select || select.selectedIndex === 0) {
    if (customerSelect) customerSelect.value = '';
    if (balanceInput) balanceInput.value = '';
    if (amountInput) amountInput.value = '';
    return;
  }

  const selectedOpt = select.options[select.selectedIndex];
  const customerId = selectedOpt.getAttribute('data-customer-id');
  const balance = parseFloat(selectedOpt.getAttribute('data-balance') || 0);

  if (customerSelect) customerSelect.value = customerId;
  if (balanceInput) balanceInput.value = balance.toFixed(2);
  if (amountInput) amountInput.value = balance.toFixed(2);
};

// Open form for adding a payment
window.openPaymentForm = function() {
  const form = document.getElementById('sales-payments-form');
  if (form) form.reset();

  document.getElementById('edit-payment-id').value = '';
  document.getElementById('payments-advanced-section').classList.add('hidden');
  document.getElementById('payments-advanced-icon').style.transform = 'rotate(0deg)';
  
  // Header title update
  const formHeader = document.getElementById('payment-form-header');
  if (formHeader) {
    formHeader.setAttribute('title', 'Record Customer Payment');
    formHeader.setAttribute('subtitle', 'Record customer collection and settle invoice outstanding balances.');
  }

  populateDropdowns();
  
  document.getElementById('input-date').value = todayIso();
  document.getElementById('input-invoice-id').disabled = false;
  document.getElementById('invoice-remaining-balance').value = '';

  window.showFormView();
};

// Open form for editing a payment (only if not reconciled / refunded / failed)
window.editPayment = function(paymentId) {
  ensureCrmState(appState);
  const payment = appState.crmData.paymentsById[paymentId];
  if (!payment) return;

  if (payment.status === 'refunded' || payment.status === 'failed') {
    alert('This payment is reconciled/refunded/failed and cannot be modified.');
    return;
  }

  window.openPaymentForm();

  // Update header text
  const formHeader = document.getElementById('payment-form-header');
  if (formHeader) {
    formHeader.setAttribute('title', `Edit Payment (${paymentId})`);
    formHeader.setAttribute('subtitle', 'Update reference numbers, accounts, or payment notes.');
  }

  // Populate data
  document.getElementById('edit-payment-id').value = payment.id;
  
  const formInvoice = document.getElementById('input-invoice-id');
  // Temporarily append the invoice if it's already paid and not in the default dropdown list
  if (payment.invoiceId && !Array.from(formInvoice.options).some(o => o.value === payment.invoiceId)) {
    const cust = getCustomerList(appState).find(c => c.id === payment.customerId);
    const company = cust ? cust.company : 'Customer';
    const opt = document.createElement('option');
    opt.value = payment.invoiceId;
    opt.setAttribute('data-customer-id', payment.customerId);
    opt.setAttribute('data-balance', payment.amount);
    opt.text = `${payment.invoiceId} — ${company} (Editing Settle Amount)`;
    formInvoice.add(opt);
  }

  formInvoice.value = payment.invoiceId || '';
  formInvoice.disabled = true; // Invoices are locked during editing to preserve transaction allocation flows
  
  document.getElementById('input-customer').value = payment.customerId || '';
  document.getElementById('invoice-remaining-balance').value = payment.amount.toFixed(2);
  document.getElementById('input-date').value = payment.date || todayIso();
  document.getElementById('input-amount').value = payment.amount.toFixed(2);
  document.getElementById('input-method').value = payment.method || 'Cash';
  document.getElementById('input-bank-account').value = payment.bankAccount || 'Main Bank Account';
  document.getElementById('input-ref').value = payment.reference || '';
  document.getElementById('input-notes').value = payment.notes || '';
  
  // Advanced fields
  document.getElementById('input-txn-id').value = payment.transactionId || '';
  document.getElementById('input-exchange-rate').value = payment.exchangeRate || '';
  document.getElementById('input-processing-fee').value = payment.processingFee || '';

  if (payment.transactionId || payment.exchangeRate || payment.processingFee) {
    window.toggleAdvancedFields();
  }

  window.showFormView();
};

// Form submission handler (handles create & update)
window.handleSubmit = function(event) {
  event.preventDefault();
  ensureCrmState(appState);
  
  const paymentId = document.getElementById('edit-payment-id').value;
  const invoiceId = document.getElementById('input-invoice-id').value;
  const customerId = document.getElementById('input-customer').value;
  const date = document.getElementById('input-date').value || todayIso();
  const amount = parseFloat(document.getElementById('input-amount').value || 0);
  const method = document.getElementById('input-method').value;
  const bankAccount = document.getElementById('input-bank-account').value;
  const reference = document.getElementById('input-ref').value;
  const notes = document.getElementById('input-notes').value;
  
  const transactionId = document.getElementById('input-txn-id').value;
  const exchangeRate = parseFloat(document.getElementById('input-exchange-rate').value || 1);
  const processingFee = parseFloat(document.getElementById('input-processing-fee').value || 0);

  if (!invoiceId || !customerId) {
    alert('Please select a valid invoice.');
    return;
  }

  const invoice = getInvoiceById(appState, invoiceId);
  if (!invoice) {
    alert('Selected invoice not found.');
    return;
  }

  // Validate amount doesn't exceed the invoice balance (except when editing the same record)
  let currentInvoiceBalance = parseFloat(invoice.dueAmount || 0);
  if (paymentId) {
    // If editing, add back the current payment amount to the invoice balance to validate properly
    const existingPayment = appState.crmData.paymentsById[paymentId];
    if (existingPayment) {
      currentInvoiceBalance += parseFloat(existingPayment.amount || 0);
    }
  }

  if (amount > currentInvoiceBalance + 0.01) {
    alert(`Payment amount (${formatCurrency(amount)}) exceeds remaining invoice balance (${formatCurrency(currentInvoiceBalance)}).`);
    return;
  }

  const user = getUserContext(appState);

  if (paymentId) {
    // Editing Payment Flow
    const payment = appState.crmData.paymentsById[paymentId];
    if (payment) {
      payment.date = date;
      payment.amount = amount;
      payment.method = method;
      payment.bankAccount = bankAccount;
      payment.reference = reference;
      payment.notes = notes;
      payment.transactionId = transactionId;
      payment.exchangeRate = exchangeRate;
      payment.processingFee = processingFee;
      payment.recordedBy = user.name;

      // Update Allocation
      const allocation = Object.values(appState.paymentAllocationsById || {}).find(a => a.paymentId === paymentId);
      if (allocation) {
        allocation.amount = amount;
        allocation.allocatedAt = date;
      }
    }
  } else {
    // Create New Payment Flow
    const payload = {
      customerId,
      invoiceId,
      date,
      amount,
      method,
      reference,
      transactionId,
      notes,
      status: 'received'
    };

    const res = createPaymentRecord(appState, payload);
    const newPaymentId = res.paymentId;
    
    // Save additional fields not set by default createPaymentRecord
    const newPayment = appState.crmData.paymentsById[newPaymentId];
    if (newPayment) {
      newPayment.bankAccount = bankAccount;
      newPayment.exchangeRate = exchangeRate;
      newPayment.processingFee = processingFee;
      newPayment.recordedBy = user.name;
    }

    createActivityEntry(appState, {
      entityType: 'customer',
      entityId: customerId,
      activityType: 'financial-event',
      summary: `Payment received for ${invoiceId}`,
      note: `Recorded ${formatCurrency(amount)} via ${method} (Account: ${bankAccount}).`,
      scheduledAt: date
    });
  }

  syncInvoiceBalances(appState);
  saveAppState();
  window.showSalesMainView();
};

// Delete Payment
window.deletePayment = function(paymentId) {
  if (!confirm(`Are you sure you want to permanently delete payment record ${paymentId}? This will restore outstanding balances on the linked invoice.`)) {
    return;
  }

  ensureCrmState(appState);

  // 1. Delete matching allocations
  const allocations = Object.keys(appState.paymentAllocationsById || {});
  allocations.forEach(allocId => {
    if (appState.paymentAllocationsById[allocId].paymentId === paymentId) {
      delete appState.paymentAllocationsById[allocId];
    }
  });

  // 2. Delete payment itself
  delete appState.crmData.paymentsById[paymentId];

  // 3. Settle State
  syncInvoiceBalances(appState);
  saveAppState();
  window.closePaymentDrawer();
  renderAll();
};

// Refund Payment
window.refundPayment = function(paymentId) {
  const reason = prompt('Please enter the reason for refunding this payment:');
  if (reason === null) return; // cancelled
  if (!reason.trim()) {
    alert('A reason is required to process a refund.');
    return;
  }

  ensureCrmState(appState);
  const payment = appState.crmData.paymentsById[paymentId];
  if (!payment) return;

  // Change payment status to refunded
  payment.status = 'refunded';
  payment.notes = `[Refunded: ${reason}] \n${payment.notes || ''}`;

  // Set allocations of this payment to 0 so the invoice due balance is restored
  const allocations = Object.values(appState.paymentAllocationsById || {});
  allocations.forEach(alloc => {
    if (alloc.paymentId === paymentId) {
      alloc.amount = 0;
    }
  });

  // Log refund activity
  createActivityEntry(appState, {
    entityType: 'customer',
    entityId: payment.customerId,
    activityType: 'financial-event',
    summary: `Refunded payment ${paymentId}`,
    note: `Refunded ${formatCurrency(payment.amount)} for invoice ${payment.invoiceId}. Reason: ${reason}`,
    scheduledAt: todayIso()
  });

  syncInvoiceBalances(appState);
  saveAppState();
  window.closePaymentDrawer();
  renderAll();
};

// Detail Drawer Operations
window.openPaymentDrawer = function(paymentId) {
  ensureCrmState(appState);
  const payment = appState.crmData.paymentsById[paymentId];
  if (!payment) return;

  const customers = getCustomerList(appState);
  const cust = customers.find(c => c.id === payment.customerId);
  const customerName = cust ? cust.company : 'Unknown Customer';

  document.getElementById('drawer-payment-id').textContent = payment.id;
  document.getElementById('drawer-customer-name').textContent = customerName;
  document.getElementById('drawer-invoice-id').textContent = `Settled Invoice: ${payment.invoiceId || 'N/A'}`;
  document.getElementById('drawer-payment-date').textContent = `Recorded on ${payment.date || 'N/A'}`;
  document.getElementById('drawer-amount').textContent = formatCurrency(payment.amount);
  
  // Status Pill
  const statusPill = document.getElementById('drawer-payment-status');
  statusPill.textContent = payment.status === 'received' ? 'Completed' : payment.status;
  statusPill.className = `px-2.5 py-1 text-[9px] font-bold rounded-full ${
    payment.status === 'received' ? 'bg-emerald-50 text-emerald-600' :
    payment.status === 'refunded' ? 'bg-rose-50 text-rose-600' :
    'bg-slate-100 text-slate-500'
  }`;

  document.getElementById('drawer-method').textContent = payment.method || 'N/A';
  document.getElementById('drawer-bank-account').textContent = payment.bankAccount || 'Main Bank Account';
  document.getElementById('drawer-reference').textContent = payment.reference || '—';
  document.getElementById('drawer-recorded-by').textContent = payment.recordedBy || 'System Admin';
  document.getElementById('drawer-notes').textContent = payment.notes || 'No notes added.';

  // Advanced metadata
  document.getElementById('drawer-txn-id').textContent = payment.transactionId || 'N/A';
  document.getElementById('drawer-exchange-rate').textContent = payment.exchangeRate ? payment.exchangeRate.toFixed(4) : '1.0000';
  document.getElementById('drawer-processing-fee').textContent = payment.processingFee ? formatCurrency(payment.processingFee) : '$0.00';

  // Allocations Table
  const allocBody = document.getElementById('drawer-allocations-body');
  allocBody.innerHTML = '';
  const allocations = Object.values(appState.paymentAllocationsById || {}).filter(a => a.paymentId === paymentId);
  
  if (allocations.length === 0) {
    allocBody.innerHTML = `<tr><td colspan="3" class="p-3 text-center text-slate-400">No allocations linked.</td></tr>`;
  } else {
    allocations.forEach(alloc => {
      allocBody.innerHTML += `
        <tr class="border-b border-slate-100">
          <td class="p-3 font-bold text-blue-600">${escapeHtml(alloc.invoiceId)}</td>
          <td class="p-3 text-right font-bold text-slate-900">${formatCurrency(alloc.amount)}</td>
          <td class="p-3 text-slate-500">${escapeHtml(alloc.allocatedAt || payment.date)}</td>
        </tr>
      `;
    });
  }

  // Footer buttons based on status
  const footerActions = document.getElementById('drawer-footer-actions');
  footerActions.innerHTML = '';
  
  if (payment.status === 'received') {
    footerActions.innerHTML += `
      <button onclick="window.editPayment('${payment.id}')" class="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all">Edit Details</button>
      <button onclick="window.refundPayment('${payment.id}')" class="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all">Refund Payment</button>
    `;
  }
  
  // Admin / delete option (restricted but allowed in sandbox)
  footerActions.innerHTML += `
    <button onclick="window.deletePayment('${payment.id}')" class="border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-500 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all">Delete Record</button>
  `;

  // Animate drawer entrance
  const overlay = document.getElementById('payment-details-drawer-overlay');
  const drawer = document.getElementById('payment-details-drawer');
  overlay.classList.remove('hidden');
  setTimeout(() => {
    drawer.classList.remove('drawer-hidden');
    drawer.classList.add('drawer-visible');
  }, 10);
};

window.closePaymentDrawer = function() {
  const overlay = document.getElementById('payment-details-drawer-overlay');
  const drawer = document.getElementById('payment-details-drawer');
  if (drawer) {
    drawer.classList.remove('drawer-visible');
    drawer.classList.add('drawer-hidden');
  }
  setTimeout(() => {
    if (overlay) overlay.classList.add('hidden');
  }, 300);
};

// Render Main Payments Grid Table
window.renderTable = function() {
  const tbody = document.getElementById('sales-payments-body');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  const search = document.getElementById('sales-payments-search-input')?.value.toLowerCase() || '';
  const customerFilter = document.getElementById('filter-customer').value;
  const methodFilter = document.getElementById('filter-method').value;
  const statusFilter = document.getElementById('filter-status').value;
  const dateStart = document.getElementById('filter-date-start').value;
  const dateEnd = document.getElementById('filter-date-end').value;
  const invoiceIdFilter = document.getElementById('filter-invoice-id').value.toLowerCase();
  const bankAccountFilter = document.getElementById('filter-bank-account').value;
  const minAmount = parseFloat(document.getElementById('filter-amount-min').value || 0);
  const maxAmount = parseFloat(document.getElementById('filter-amount-max').value || Infinity);

  const payments = getPaymentsList();
  const customers = getCustomerList(appState);
  
  const filtered = payments.filter(p => {
    const cust = customers.find(c => c.id === p.customerId);
    const company = cust ? cust.company : 'Unknown Customer';
    
    // Search filter
    const matchesSearch = !search || 
      p.id.toLowerCase().includes(search) || 
      (p.invoiceId && p.invoiceId.toLowerCase().includes(search)) || 
      company.toLowerCase().includes(search) ||
      (p.reference && p.reference.toLowerCase().includes(search));

    // Standard Dropdowns filters
    const matchesCustomer = customerFilter === 'all' || p.customerId === customerFilter;
    const matchesMethod = methodFilter === 'all' || p.method === methodFilter;
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesBank = bankAccountFilter === 'all' || (p.bankAccount || 'Main Bank Account') === bankAccountFilter;
    
    // Advanced fields
    const matchesInvoiceRef = !invoiceIdFilter || (p.invoiceId && p.invoiceId.toLowerCase().includes(invoiceIdFilter));
    const matchesDate = (!dateStart || p.date >= dateStart) && (!dateEnd || p.date <= dateEnd);
    const matchesAmount = p.amount >= minAmount && p.amount <= maxAmount;

    return matchesSearch && matchesCustomer && matchesMethod && matchesStatus && matchesBank && matchesInvoiceRef && matchesDate && matchesAmount;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" class="p-8 text-center text-slate-400 font-semibold">No payment records match the current criteria.</td></tr>`;
    return;
  }

  filtered.forEach(p => {
    const cust = customers.find(c => c.id === p.customerId);
    const company = cust ? cust.company : 'Unknown Customer';
    const statusText = p.status === 'received' ? 'Completed' : (p.status || 'Received');
    
    const pillClass = p.status === 'received' ? 'bg-emerald-50 text-emerald-600' :
                       p.status === 'refunded' ? 'bg-rose-50 text-rose-600' :
                       'bg-slate-100 text-slate-500';

    tbody.innerHTML += `
      <tr class="hover:bg-slate-50/50 transition-colors border-b border-slate-100">
        <td class="p-4 font-bold text-slate-900">${escapeHtml(p.id)}</td>
        <td class="p-4 font-bold text-blue-600 cursor-pointer" onclick="window.openInvoiceLink('${p.invoiceId}')">${escapeHtml(p.invoiceId || 'N/A')}</td>
        <td class="p-4 font-semibold text-slate-800">${escapeHtml(company)}</td>
        <td class="p-4 text-slate-500">${escapeHtml(p.date || 'N/A')}</td>
        <td class="p-4 font-medium text-slate-650">${escapeHtml(p.method)}</td>
        <td class="p-4 text-slate-400 font-semibold">${escapeHtml(p.reference || '—')}</td>
        <td class="p-4 text-slate-500 font-medium">${escapeHtml(p.bankAccount || 'Main Bank Account')}</td>
        <td class="p-4 font-extrabold text-emerald-600 text-right">${formatCurrency(p.amount)}</td>
        <td class="p-4">
          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${pillClass}">${escapeHtml(statusText)}</span>
        </td>
        <td class="p-4 text-center">
          <div class="flex items-center justify-center gap-1.5">
            <button onclick="window.openPaymentDrawer('${p.id}')" class="p-1 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors text-[11px] font-bold">Details</button>
          </div>
        </td>
      </tr>
    `;
  });
};

// Redirection or links helper
window.openInvoiceLink = function(invoiceId) {
  if (!invoiceId) return;
  // Route to sales invoices page with invoice reference search parameter
  window.location.href = `/sales-invoices.html?search=${invoiceId}`;
};

// Render KPIs metrics
function renderMetrics() {
  ensureCrmState(appState);
  syncInvoiceBalances(appState);

  const payments = Object.values(appState.crmData.paymentsById || {});
  const activePayments = payments.filter(p => p.status === 'received');

  const totalCount = payments.length;
  const totalCollected = activePayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
  const avgSize = activePayments.length ? totalCollected / activePayments.length : 0;

  // Outstanding Accounts Receivable
  const outstandingAR = getInvoicesList()
    .filter(inv => inv.status !== 'cancelled')
    .reduce((sum, inv) => sum + parseFloat(inv.dueAmount || 0), 0);

  // Overdue Invoices Value
  const overdueAR = getInvoicesList()
    .filter(inv => inv.status === 'overdue')
    .reduce((sum, inv) => sum + parseFloat(inv.dueAmount || 0), 0);

  document.getElementById('metric-total-count').textContent = totalCount;
  document.getElementById('metric-total-collected').textContent = formatCurrency(totalCollected);
  document.getElementById('metric-outstanding-receivables').textContent = formatCurrency(outstandingAR);
  document.getElementById('metric-overdue-invoices').textContent = formatCurrency(overdueAR);
  document.getElementById('metric-avg-size').textContent = formatCurrency(avgSize);
}

// Switching report tabs
window.switchReportTab = function(tabName) {
  activeReportTab = tabName;
  
  // Highlight active tab
  ['collection', 'outstanding', 'aging', 'method'].forEach(t => {
    const btn = document.getElementById(`tab-btn-${t}`);
    if (!btn) return;
    if (t === tabName) {
      btn.className = 'px-3 py-1.5 font-bold transition-all bg-slate-100 text-slate-800 border-r border-slate-200';
    } else {
      btn.className = 'px-3 py-1.5 font-semibold transition-all bg-white text-slate-650 border-r border-slate-200';
    }
  });

  renderReports();
};

// Render Report content
function renderReports() {
  const container = document.getElementById('reports-container');
  if (!container) return;

  ensureCrmState(appState);

  if (activeReportTab === 'collection') {
    // 1. Payment Collection Report (Grouped by Month/Date)
    const payments = getPaymentsList().filter(p => p.status === 'received');
    const groupings = {};
    payments.forEach(p => {
      const month = p.date ? p.date.substring(0, 7) : 'Unknown';
      if (!groupings[month]) groupings[month] = { count: 0, total: 0 };
      groupings[month].count++;
      groupings[month].total += p.amount;
    });

    let html = `
      <div class="overflow-x-auto rounded-xl border border-slate-150">
        <table class="w-full text-left">
          <thead>
            <tr class="bg-slate-50 text-slate-400 font-bold border-b border-slate-150">
              <th class="p-3">Collection Period</th>
              <th class="p-3 text-center">Transactions Count</th>
              <th class="p-3 text-right">Total Amount Collected</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 font-semibold text-slate-700">`;

    const sortedMonths = Object.keys(groupings).sort().reverse();
    if (sortedMonths.length === 0) {
      html += `<tr><td colspan="3" class="p-4 text-center text-slate-400">No collected payments recorded yet.</td></tr>`;
    } else {
      sortedMonths.forEach(m => {
        html += `
          <tr>
            <td class="p-3 text-slate-900 font-bold">${escapeHtml(m)}</td>
            <td class="p-3 text-center text-slate-500">${groupings[m].count}</td>
            <td class="p-3 text-right text-emerald-600 font-extrabold">${formatCurrency(groupings[m].total)}</td>
          </tr>
        `;
      });
    }

    html += `</tbody></table></div>`;
    container.innerHTML = html;

  } else if (activeReportTab === 'outstanding') {
    // 2. Outstanding Receivables Report
    const invoices = getInvoicesList().filter(inv => inv.status !== 'cancelled' && inv.dueAmount > 0);
    const customers = getCustomerList(appState);

    let html = `
      <div class="overflow-x-auto rounded-xl border border-slate-150">
        <table class="w-full text-left">
          <thead>
            <tr class="bg-slate-50 text-slate-400 font-bold border-b border-slate-150">
              <th class="p-3">Invoice Ref</th>
              <th class="p-3">Customer</th>
              <th class="p-3">Due Date</th>
              <th class="p-3 text-right">Invoice Total</th>
              <th class="p-3 text-right">Paid Amount</th>
              <th class="p-3 text-right">Remaining Due</th>
              <th class="p-3">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 font-semibold text-slate-750">`;

    if (invoices.length === 0) {
      html += `<tr><td colspan="7" class="p-4 text-center text-slate-400">No outstanding receivables found. All invoices fully paid!</td></tr>`;
    } else {
      invoices.forEach(inv => {
        const cust = customers.find(c => c.id === inv.customerId);
        const company = cust ? cust.company : 'Unknown Customer';
        const isOverdue = inv.status === 'overdue';
        html += `
          <tr>
            <td class="p-3 font-bold text-slate-900">${escapeHtml(inv.id)}</td>
            <td class="p-3">${escapeHtml(company)}</td>
            <td class="p-3 text-slate-500">${escapeHtml(inv.dueDate || 'N/A')}</td>
            <td class="p-3 text-right text-slate-800">${formatCurrency(inv.total)}</td>
            <td class="p-3 text-right text-emerald-600">${formatCurrency(inv.paidAmount)}</td>
            <td class="p-3 text-right font-extrabold ${isOverdue ? 'text-rose-600' : 'text-blue-600'}">${formatCurrency(inv.dueAmount)}</td>
            <td class="p-3">
              <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                isOverdue ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-700'
              }">${escapeHtml(inv.status)}</span>
            </td>
          </tr>
        `;
      });
    }

    html += `</tbody></table></div>`;
    container.innerHTML = html;

  } else if (activeReportTab === 'aging') {
    // 3. Aging Report (Bucketed)
    const invoices = getInvoicesList().filter(inv => inv.status !== 'cancelled' && inv.dueAmount > 0);
    const aging = {
      current: { amount: 0, invoices: [] },
      bucket0to30: { amount: 0, invoices: [] },
      bucket31to60: { amount: 0, invoices: [] },
      bucket61to90: { amount: 0, invoices: [] },
      bucket90plus: { amount: 0, invoices: [] }
    };

    const getDaysDiff = (date) => {
      if (!date) return 0;
      const base = new Date(date);
      const now = new Date(todayIso());
      return Math.max(0, Math.floor((now - base) / 86400000));
    };

    invoices.forEach(inv => {
      if (inv.dueDate >= todayIso()) {
        aging.current.amount += inv.dueAmount;
        aging.current.invoices.push(inv);
      } else {
        const ageDays = getDaysDiff(inv.dueDate);
        if (ageDays <= 30) {
          aging.bucket0to30.amount += inv.dueAmount;
          aging.bucket0to30.invoices.push(inv);
        } else if (ageDays <= 60) {
          aging.bucket31to60.amount += inv.dueAmount;
          aging.bucket31to60.invoices.push(inv);
        } else if (ageDays <= 90) {
          aging.bucket61to90.amount += inv.dueAmount;
          aging.bucket61to90.invoices.push(inv);
        } else {
          aging.bucket90plus.amount += inv.dueAmount;
          aging.bucket90plus.invoices.push(inv);
        }
      }
    });

    let html = `
      <div class="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        <div class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center">
          <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Current (Not Overdue)</span>
          <div class="text-sm font-extrabold text-slate-900 mt-1">${formatCurrency(aging.current.amount)}</div>
          <span class="text-[10px] text-slate-400 font-semibold">${aging.current.invoices.length} Invoices</span>
        </div>
        <div class="rounded-xl border border-amber-200 bg-amber-50/40 px-4 py-3 text-center">
          <span class="text-[9px] font-bold text-amber-500 uppercase tracking-wider">1-30 Days Overdue</span>
          <div class="text-sm font-extrabold text-amber-700 mt-1">${formatCurrency(aging.bucket0to30.amount)}</div>
          <span class="text-[10px] text-amber-500 font-semibold">${aging.bucket0to30.invoices.length} Invoices</span>
        </div>
        <div class="rounded-xl border border-orange-200 bg-orange-50/40 px-4 py-3 text-center">
          <span class="text-[9px] font-bold text-orange-500 uppercase tracking-wider">31-60 Days Overdue</span>
          <div class="text-sm font-extrabold text-orange-700 mt-1">${formatCurrency(aging.bucket31to60.amount)}</div>
          <span class="text-[10px] text-orange-500 font-semibold">${aging.bucket31to60.invoices.length} Invoices</span>
        </div>
        <div class="rounded-xl border border-rose-200 bg-rose-50/40 px-4 py-3 text-center">
          <span class="text-[9px] font-bold text-rose-500 uppercase tracking-wider">61-90 Days Overdue</span>
          <div class="text-sm font-extrabold text-rose-700 mt-1">${formatCurrency(aging.bucket61to90.amount)}</div>
          <span class="text-[10px] text-rose-500 font-semibold">${aging.bucket61to90.invoices.length} Invoices</span>
        </div>
        <div class="rounded-xl border border-rose-300 bg-rose-50/60 px-4 py-3 text-center">
          <span class="text-[9px] font-bold text-rose-600 uppercase tracking-wider">90+ Days Overdue</span>
          <div class="text-sm font-extrabold text-rose-800 mt-1">${formatCurrency(aging.bucket90plus.amount)}</div>
          <span class="text-[10px] text-rose-600 font-semibold">${aging.bucket90plus.invoices.length} Invoices</span>
        </div>
      </div>
      <div class="text-[11px] text-slate-500 font-semibold">Aging status dynamically tracks and alerts based on due dates configuration.</div>`;
    container.innerHTML = html;

  } else if (activeReportTab === 'method') {
    // 4. Payment Method Analysis
    const payments = getPaymentsList().filter(p => p.status === 'received');
    const breakdown = {
      'Cash': { count: 0, amount: 0 },
      'Bank Transfer': { count: 0, amount: 0 },
      'Mobile Banking': { count: 0, amount: 0 },
      'Cheque': { count: 0, amount: 0 },
      'Card': { count: 0, amount: 0 },
      'Online Gateway': { count: 0, amount: 0 }
    };

    payments.forEach(p => {
      const m = p.method || 'Cash';
      if (!breakdown[m]) breakdown[m] = { count: 0, amount: 0 };
      breakdown[m].count++;
      breakdown[m].amount += p.amount;
    });

    let html = `
      <div class="overflow-x-auto rounded-xl border border-slate-150">
        <table class="w-full text-left">
          <thead>
            <tr class="bg-slate-50 text-slate-400 font-bold border-b border-slate-150">
              <th class="p-3">Payment Method</th>
              <th class="p-3 text-center">Transactions Count</th>
              <th class="p-3 text-right">Total Settle Volume</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 font-semibold text-slate-750">`;

    Object.keys(breakdown).forEach(method => {
      html += `
        <tr>
          <td class="p-3 text-slate-900 font-bold">${escapeHtml(method)}</td>
          <td class="p-3 text-center text-slate-500">${breakdown[method].count}</td>
          <td class="p-3 text-right text-emerald-600 font-extrabold">${formatCurrency(breakdown[method].amount)}</td>
        </tr>
      `;
    });

    html += `</tbody></table></div>`;
    container.innerHTML = html;
  }
}

// Master rendering pipeline
function renderAll() {
  renderMetrics();
  populateDropdowns();
  window.renderTable();
  renderReports();
  initIcons();
}

document.addEventListener('DOMContentLoaded', async () => {
  await appReadyPromise;
  
  // Detect if redirect URL has search params (e.g., invoice link click)
  const params = new URLSearchParams(window.location.search);
  const searchVal = params.get('search');
  if (searchVal) {
    setTimeout(() => {
      const searchInput = document.getElementById('sales-payments-search-input');
      if (searchInput) {
        searchInput.value = searchVal;
        window.renderTable();
      }
    }, 150);
  }
  
  renderAll();
});
