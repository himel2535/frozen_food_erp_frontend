import { appReadyPromise, appState, saveAppState, initIcons } from '/js/shared.js';
import {
  ensureCrmState,
  getCustomerList,
  getCustomerProfile,
  createPaymentRecord,
  createActivityEntry,
  upsertCustomerSalesSummary,
  getInvoicePayments,
  getInvoiceById,
  getInvoiceAgingSummary,
  getSalesDashboardSummary,
  getCustomerLedger,
  syncInvoiceBalances,
  approveInvoice,
  transitionInvoiceLifecycle,
  createRecurringInvoiceTemplate,
  generateRecurringInvoice
} from '/js/crm-service.js';

function formatCurrency(value, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(value || 0));
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDate(value) {
  if (!value) return 'N/A';
  return value;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(date, days) {
  const next = new Date(`${date}T00:00:00`);
  next.setDate(next.getDate() + Number(days || 0));
  return next.toISOString().slice(0, 10);
}

function nextInvoiceId() {
  const nextNum = (appState.invoices || []).length + 1;
  return `INV-2026-${String(10000 + nextNum).slice(1)}`;
}

function getCustomers() {
  ensureCrmState(appState);
  return getCustomerList(appState);
}

function getCustomerById(customerId) {
  return getCustomerProfile(appState, customerId);
}

function getInvoices() {
  ensureCrmState(appState);
  syncInvoiceBalances(appState);
  return [...(appState.invoices || [])].sort((a, b) => String(b.issueDate || b.date).localeCompare(String(a.issueDate || a.date)));
}

function getInventoryProduct(productId) {
  return (appState.inventory || []).find((entry) => String(entry.id) === String(productId)) || null;
}

function statusPillClass(status) {
  if (status === 'paid') return 'bg-emerald-50 text-emerald-600';
  if (status === 'partially-paid') return 'bg-amber-50 text-amber-700';
  if (status === 'sent') return 'bg-blue-50 text-blue-700';
  if (status === 'overdue') return 'bg-rose-50 text-rose-600';
  if (status === 'cancelled') return 'bg-slate-100 text-slate-500';
  return 'bg-violet-50 text-violet-700';
}

function approvalPillClass(status) {
  if (status === 'approved') return 'bg-emerald-50 text-emerald-600';
  if (status === 'rejected') return 'bg-rose-50 text-rose-600';
  return 'bg-amber-50 text-amber-700';
}

function collectInvoiceItems() {
  const rows = document.querySelectorAll('.items-row');
  const items = [];
  let subtotal = 0;

  for (const row of rows) {
    const select = row.querySelector('.item-product-select');
    if (!select || !select.value) continue;
    const product = getInventoryProduct(select.value);
    const qty = Number(row.querySelector('.item-qty-input')?.value || 0);
    const price = Number(row.querySelector('.item-price-input')?.value || 0);
    if (!product || qty <= 0) {
      return { ok: false, error: 'Each invoice line needs a valid product and quantity.' };
    }
    const total = qty * price;
    items.push({
      productId: product.id,
      name: product.name,
      quantity: qty,
      price,
      total
    });
    subtotal += total;
  }

  if (!items.length) {
    return { ok: false, error: 'Please add at least one line item.' };
  }

  return { ok: true, items, subtotal };
}

function validateInvoiceInventory(items) {
  for (const item of items) {
    const product = getInventoryProduct(item.productId);
    if (!product) return { ok: false, error: `Product ${item.name} is no longer available.` };
    if (Number(item.quantity || 0) > Number(product.stock || 0)) {
      return {
        ok: false,
        error: `Insufficient stock for "${product.name}". Available: ${product.stock}. Requested: ${item.quantity}.`
      };
    }
  }
  return { ok: true };
}

function applyInvoicePosting(invoice) {
  if (!invoice || invoice.isPosted) return;
  invoice.items.forEach((item) => {
    const product = getInventoryProduct(item.productId);
    if (product) {
      product.stock = Math.max(0, Number(product.stock || 0) - Number(item.quantity || 0));
    }
  });

  const currentLedgerBalance = appState.accounting[appState.accounting.length - 1]?.balance || 0;
  const ref = `TXN-${invoice.id.replace('INV-', '')}`;
  appState.accounting.push({
    ref,
    date: invoice.issueDate,
    account: 'Accounts Receivable',
    desc: `Customer invoice ${invoice.id} posted`,
    debit: Number(invoice.total || 0),
    credit: 0,
    balance: currentLedgerBalance + Number(invoice.total || 0)
  });
  invoice.ledgerRef = ref;
  invoice.postedAt = invoice.postedAt || invoice.issueDate || todayIso();
  invoice.isPosted = true;
}

function reverseInvoicePosting(invoice) {
  if (!invoice?.isPosted) return;
  invoice.items.forEach((item) => {
    const product = getInventoryProduct(item.productId);
    if (product) {
      product.stock = Number(product.stock || 0) + Number(item.quantity || 0);
    }
  });

  const currentLedgerBalance = appState.accounting[appState.accounting.length - 1]?.balance || 0;
  appState.accounting.push({
    ref: `REV-${invoice.id.replace('INV-', '')}`,
    date: todayIso(),
    account: 'Accounts Receivable',
    desc: `Invoice ${invoice.id} cancelled and reversed`,
    debit: 0,
    credit: Number(invoice.total || 0),
    balance: currentLedgerBalance - Number(invoice.total || 0)
  });
  invoice.isPosted = false;
}

function buildCustomerSnapshot(profile) {
  return {
    id: profile.customer.id,
    company: profile.customer.company,
    contactName: profile.customer.name,
    creditLimit: profile.customer.creditLimit || 0,
    paymentTerms: profile.customer.paymentTerms || 'Net 30'
  };
}

function validateCreditExposure(profile, invoice, incomingDue) {
  const customer = profile.customer;
  if (customer.status === 'credit-hold') {
    return { ok: false, error: 'This customer is on credit hold. Clear overdue balance before finalizing invoices.' };
  }

  const projectedDue = Number(profile.financialSummary.totalDue || 0) + Number(incomingDue || 0);
  if (Number(customer.creditLimit || 0) > 0 && projectedDue > Number(customer.creditLimit || 0)) {
    const shouldContinue = confirm(
      `Credit limit warning: projected exposure becomes ${formatCurrency(projectedDue)} while credit limit is ${formatCurrency(customer.creditLimit)}. Continue anyway?`
    );
    if (!shouldContinue) {
      return { ok: false, error: 'Invoice finalization cancelled.' };
    }
  }

  if (Number(profile.financialSummary.overdueReceivables || 0) > 0) {
    const shouldContinue = confirm(
      `${customer.company} already has overdue receivables of ${formatCurrency(profile.financialSummary.overdueReceivables)}. Continue finalizing this invoice?`
    );
    if (!shouldContinue) {
      return { ok: false, error: 'Invoice finalization cancelled.' };
    }
  }

  return { ok: true };
}

function refreshLinkedModules(customerId = null) {
  if (customerId) upsertCustomerSalesSummary(appState, customerId);
  if (window.renderCRMTable) window.renderCRMTable();
  if (window.renderInventoryTable) window.renderInventoryTable();
  if (window.renderAccountingTable) window.renderAccountingTable();
}

function setSalesUiFromControls() {
  appState.salesUi.customerFilter = document.getElementById('sales-customer-filter')?.value || 'all';
  appState.salesUi.statusFilter = document.getElementById('sales-status-filter')?.value || 'all';
  appState.salesUi.riskFilter = document.getElementById('sales-risk-filter')?.value || 'all';
  appState.salesUi.dateStart = document.getElementById('sales-date-start')?.value || '';
  appState.salesUi.dateEnd = document.getElementById('sales-date-end')?.value || '';
  appState.salesUi.search = document.getElementById('sales-search-input')?.value || '';
}

function getFilteredInvoices() {
  setSalesUiFromControls();
  const search = String(appState.salesUi.search || '').trim().toLowerCase();
  const customerFilter = appState.salesUi.customerFilter;
  const statusFilter = appState.salesUi.statusFilter;
  const riskFilter = appState.salesUi.riskFilter;
  const dateStart = appState.salesUi.dateStart;
  const dateEnd = appState.salesUi.dateEnd;

  return getInvoices().filter((invoice) => {
    const profile = getCustomerById(invoice.customerId);
    const customerName = profile?.customer?.company || invoice.customerSnapshot?.company || '';
    const matchesSearch = !search || [invoice.id, customerName, invoice.status, invoice.sourceType || '']
      .some((value) => String(value).toLowerCase().includes(search));
    const matchesCustomer = customerFilter === 'all' || invoice.customerId === customerFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'pending_approval' ? (invoice.status === 'draft' && invoice.approvalStatus !== 'approved') : invoice.status === statusFilter);
    const matchesStart = !dateStart || invoice.issueDate >= dateStart;
    const matchesEnd = !dateEnd || invoice.issueDate <= dateEnd;

    let matchesRisk = true;
    if (riskFilter === 'overdue') matchesRisk = invoice.status === 'overdue';
    if (riskFilter === 'credit') matchesRisk = Number(profile?.financialSummary?.creditLimit || 0) > 0 && Number(profile?.financialSummary?.totalDue || 0) > Number(profile?.financialSummary?.creditLimit || 0);
    if (riskFilter === 'open') matchesRisk = Number(invoice.dueAmount || 0) > 0 && invoice.status !== 'cancelled';

    return matchesSearch && matchesCustomer && matchesStatus && matchesStart && matchesEnd && matchesRisk;
  });
}

function renderCustomerFilterOptions() {
  const select = document.getElementById('sales-customer-filter');
  const formSelect = document.getElementById('invoice-input-customer');
  if (select) {
    const previous = appState.salesUi.customerFilter || 'all';
    select.innerHTML = '<option value="all">All Customers</option>';
    getCustomers().forEach((customer) => {
      select.innerHTML += `<option value="${customer.id}">${escapeHtml(customer.company)}</option>`;
    });
    select.value = previous;
  }
  if (formSelect) {
    const previous = formSelect.value;
    formSelect.innerHTML = '';
    getCustomers().forEach((customer) => {
      formSelect.innerHTML += `<option value="${customer.id}">${escapeHtml(customer.company)} (${escapeHtml(customer.ownerName)})</option>`;
    });
    if (previous) formSelect.value = previous;
  }
}

function renderMetrics() {
  const summary = getSalesDashboardSummary(appState);
  document.getElementById('sales-metric-monthly-sales').textContent = formatCurrency(summary.monthlySales);
  document.getElementById('sales-metric-collected').textContent = formatCurrency(summary.collectedThisMonth);
  document.getElementById('sales-metric-open-receivables').textContent = formatCurrency(summary.openReceivables);
  document.getElementById('sales-metric-overdue').textContent = formatCurrency(summary.overdueReceivables);
  document.getElementById('sales-metric-collection-rate').textContent = `${summary.collectionRate.toFixed(1)}%`;
  document.getElementById('sales-metric-average-invoice').textContent = formatCurrency(summary.averageInvoiceValue);
}

function renderAgingSummary() {
  const aging = getInvoiceAgingSummary(appState);
  document.getElementById('sales-aging-current').textContent = formatCurrency(aging.current);
  document.getElementById('sales-aging-0-30').textContent = formatCurrency(aging.bucket0to30);
  document.getElementById('sales-aging-31-60').textContent = formatCurrency(aging.bucket31to60);
  document.getElementById('sales-aging-61-90').textContent = formatCurrency(aging.bucket61to90);
  document.getElementById('sales-aging-90-plus').textContent = formatCurrency(aging.bucket90plus);
}

function renderRecurringTemplates() {
  const wrap = document.getElementById('sales-recurring-list');
  if (!wrap) return;
  const templates = Object.values(appState.recurringInvoicesById || {}).sort((a, b) => String(a.nextRunDate).localeCompare(String(b.nextRunDate)));
  if (!templates.length) {
    wrap.innerHTML = '<div class="text-xs text-slate-400 font-semibold">No recurring invoice templates yet. Save one from the invoice form to generate future billing cycles.</div>';
    return;
  }

  wrap.innerHTML = templates.map((template) => {
    const profile = getCustomerById(template.customerId);
    return `
      <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <div class="text-xs font-bold text-slate-900">${escapeHtml(profile?.customer?.company || 'Unknown Customer')}</div>
          <div class="text-[11px] text-slate-500 font-medium mt-1">Every ${escapeHtml(template.frequency)} • Next run ${escapeHtml(template.nextRunDate)} • ${escapeHtml(template.status)}</div>
        </div>
        <div class="flex flex-wrap gap-2">
          <button onclick="window.generateRecurringInvoiceNow('${template.id}')" class="border border-slate-200 bg-white hover:bg-slate-100 text-xs font-semibold px-3 py-2 rounded-xl transition-all">Generate Now</button>
        </div>
      </div>
    `;
  }).join('');
}

window.renderSalesTable = function renderSalesTable() {
  ensureCrmState(appState);
  syncInvoiceBalances(appState);
  renderCustomerFilterOptions();
  renderMetrics();
  renderAgingSummary();
  renderRecurringTemplates();

  const tbody = document.getElementById('sales-table-body');
  const invoices = getFilteredInvoices();
  document.getElementById('sales-total-entries').textContent = String(invoices.length);
  document.getElementById('sales-page-start').textContent = invoices.length ? '1' : '0';
  document.getElementById('sales-page-end').textContent = String(invoices.length);

  if (!invoices.length) {
    tbody.innerHTML = '<tr><td colspan="10" class="px-6 py-8 text-center text-slate-400 font-semibold">No invoices found for the current filters.</td></tr>';
    return;
  }

  tbody.innerHTML = invoices.map((invoice) => {
    const profile = getCustomerById(invoice.customerId);
    const customerName = profile?.customer?.company || invoice.customerSnapshot?.company || 'Unknown';
    return `
      <tr class="hover:bg-slate-50/50 transition-colors">
        <td class="px-6 py-4 font-bold text-slate-900">${escapeHtml(invoice.id)}</td>
        <td class="px-6 py-4 font-semibold text-slate-700">${escapeHtml(customerName)}</td>
        <td class="px-6 py-4 text-slate-500 font-medium">${escapeHtml(formatDate(invoice.issueDate))}</td>
        <td class="px-6 py-4 text-slate-500 font-medium">${escapeHtml(formatDate(invoice.dueDate))}</td>
        <td class="px-6 py-4 text-right font-extrabold text-slate-900">${formatCurrency(invoice.total, invoice.currency)}</td>
        <td class="px-6 py-4 text-right font-semibold text-emerald-600">${formatCurrency(invoice.paidAmount, invoice.currency)}</td>
        <td class="px-6 py-4 text-right font-semibold ${invoice.dueAmount > 0 ? 'text-rose-600' : 'text-slate-500'}">${formatCurrency(invoice.dueAmount, invoice.currency)}</td>
        <td class="px-6 py-4">
          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold capitalize ${statusPillClass(invoice.status)}">${escapeHtml(invoice.status)}</span>
        </td>
        <td class="px-6 py-4">
          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold capitalize ${approvalPillClass(invoice.approvalStatus)}">${escapeHtml(invoice.approvalStatus)}</span>
        </td>
        <td class="px-6 py-4 text-center">
          <div class="flex flex-wrap items-center justify-center gap-1.5">
            <button onclick="window.openSalesDrawer('${invoice.id}')" class="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors cursor-pointer" title="View">
              <i data-lucide="eye" class="w-4 h-4 pointer-events-none"></i>
            </button>
            <button onclick="window.prefillPaymentForm('${invoice.id}')" class="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors cursor-pointer" title="Receive Payment">
              <i data-lucide="banknote" class="w-4 h-4 pointer-events-none"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
  
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
};

function renderDrawerActions(invoice) {
  const actions = document.getElementById('sales-drawer-actions');
  if (!actions) return;
  const buttons = [];
  if (invoice.status === 'draft' && invoice.approvalStatus !== 'approved') {
    buttons.push(`<button onclick="window.approveInvoiceAction('${invoice.id}')" class="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl transition-all">Approve</button>`);
  }
  if (invoice.status === 'draft' && invoice.approvalStatus === 'approved') {
    buttons.push(`<button onclick="window.sendInvoiceAction('${invoice.id}')" class="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-all">Mark Sent</button>`);
  }
  if (invoice.status !== 'cancelled' && Number(invoice.paidAmount || 0) === 0) {
    buttons.push(`<button onclick="window.cancelInvoiceAction('${invoice.id}')" class="border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 text-xs font-semibold px-3 py-2 rounded-xl transition-all">Cancel Invoice</button>`);
  }
  buttons.push(`<button onclick="window.printInvoice()" class="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl transition-all">Print</button>`);
  actions.innerHTML = buttons.join('');
}

function renderDrawerRecurring(invoice) {
  const panel = document.getElementById('sales-recurring-panel');
  if (!panel) return;
  const recurring = Object.values(appState.recurringInvoicesById || {}).find((item) => item.invoiceId === invoice.id || item.id === invoice.recurringTemplateId);
  if (!recurring) {
    panel.innerHTML = '<div class="text-xs text-slate-400 font-semibold">No recurring template is linked to this invoice.</div>';
    return;
  }

  panel.innerHTML = `
    <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between gap-3">
      <div>
        <div class="text-xs font-bold text-slate-900">${escapeHtml(recurring.frequency)} schedule</div>
        <div class="text-[11px] text-slate-500 font-medium mt-1">Next run ${escapeHtml(recurring.nextRunDate)} • ${escapeHtml(recurring.status)}</div>
      </div>
      <button onclick="window.generateRecurringInvoiceNow('${recurring.id}')" class="border border-slate-200 bg-white hover:bg-slate-100 text-xs font-semibold px-3 py-2 rounded-xl transition-all">Generate</button>
    </div>
  `;
}

function renderDrawerPaymentHistory(invoice) {
  const tbody = document.getElementById('sales-payment-history-body');
  const payments = getInvoicePayments(appState, invoice.id);
  if (!payments.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="px-4 py-4 text-center text-slate-400 font-semibold">No payments recorded yet.</td></tr>';
    return;
  }

  tbody.innerHTML = payments.map((payment) => `
    <tr>
      <td class="px-4 py-3 font-semibold text-slate-800">${escapeHtml(payment.id)}</td>
      <td class="px-4 py-3 text-slate-500">${escapeHtml(payment.date)}</td>
      <td class="px-4 py-3 text-slate-500">${escapeHtml(payment.method)}</td>
      <td class="px-4 py-3 text-slate-500">${escapeHtml(payment.reference || payment.transactionId || '—')}</td>
      <td class="px-4 py-3 text-right font-bold text-emerald-600">${formatCurrency(payment.allocatedAmount || payment.amount, invoice.currency)}</td>
    </tr>
  `).join('');
}

function renderDrawerLedger(customerId, currency = 'USD') {
  const tbody = document.getElementById('sales-customer-ledger-body');
  const ledger = getCustomerLedger(appState, customerId);
  if (!ledger.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="px-4 py-4 text-center text-slate-400 font-semibold">No ledger activity found.</td></tr>';
    return;
  }

  tbody.innerHTML = ledger.map((row) => `
    <tr>
      <td class="px-4 py-3 text-slate-500">${escapeHtml(row.date)}</td>
      <td class="px-4 py-3 font-semibold text-slate-800 capitalize">${escapeHtml(row.type)}</td>
      <td class="px-4 py-3 text-slate-500">${escapeHtml(row.reference)}</td>
      <td class="px-4 py-3 text-right text-slate-700">${row.debit ? formatCurrency(row.debit, currency) : '—'}</td>
      <td class="px-4 py-3 text-right text-slate-700">${row.credit ? formatCurrency(row.credit, currency) : '—'}</td>
      <td class="px-4 py-3 text-right font-bold text-slate-900">${formatCurrency(row.runningBalance, currency)}</td>
    </tr>
  `).join('');
}

window.openSalesDrawer = function openSalesDrawer(invoiceId) {
  ensureCrmState(appState);
  syncInvoiceBalances(appState);
  const invoice = getInvoiceById(appState, invoiceId);
  if (!invoice) return;
  appState.salesUi.selectedInvoiceId = invoiceId;
  const profile = getCustomerById(invoice.customerId);
  const customer = profile?.customer;
  const primaryContact = profile?.contacts?.[0];

  document.getElementById('invoice-detail-id').textContent = invoice.id;
  document.getElementById('invoice-detail-status').textContent = invoice.status;
  document.getElementById('invoice-detail-status').className = `px-2 py-0.5 text-[9px] font-bold rounded-full ${statusPillClass(invoice.status)}`;
  document.getElementById('invoice-detail-date').textContent = `Issued on ${invoice.issueDate} • Due ${invoice.dueDate}`;
  document.getElementById('invoice-detail-cust-name').textContent = customer?.name || invoice.customerSnapshot?.contactName || 'Unknown Contact';
  document.getElementById('invoice-detail-cust-company').textContent = customer?.company || invoice.customerSnapshot?.company || 'Unknown Company';
  document.getElementById('invoice-detail-cust-email').textContent = primaryContact?.email || 'N/A';
  document.getElementById('invoice-detail-cust-phone').textContent = primaryContact?.phone || 'N/A';
  document.getElementById('invoice-detail-approval').textContent = invoice.approvalStatus;
  document.getElementById('invoice-detail-terms').textContent = invoice.terms;
  document.getElementById('invoice-detail-currency').textContent = invoice.currency;
  document.getElementById('invoice-detail-credit').textContent = formatCurrency(profile?.financialSummary?.creditLimit || 0, invoice.currency);
  document.getElementById('invoice-detail-customer-due').textContent = formatCurrency(profile?.financialSummary?.totalDue || 0, invoice.currency);
  document.getElementById('invoice-detail-aging').textContent = formatCurrency(profile?.financialSummary?.overdueReceivables || 0, invoice.currency);

  const tbody = document.getElementById('invoice-detail-items-tbody');
  tbody.innerHTML = (invoice.items || []).map((item) => `
    <tr>
      <td class="px-4 py-3 font-bold text-slate-800">${escapeHtml(item.name)}</td>
      <td class="px-4 py-3 text-center">${escapeHtml(item.quantity)}</td>
      <td class="px-4 py-3 text-right">${formatCurrency(item.price, invoice.currency)}</td>
      <td class="px-4 py-3 text-right font-extrabold text-slate-900">${formatCurrency(item.total, invoice.currency)}</td>
    </tr>
  `).join('');

  document.getElementById('invoice-detail-subtotal').textContent = formatCurrency(invoice.subtotal, invoice.currency);
  document.getElementById('invoice-detail-discount').textContent = `-${formatCurrency(invoice.discountAmount, invoice.currency)}`;
  document.getElementById('invoice-detail-tax').textContent = `+${formatCurrency(invoice.taxAmount, invoice.currency)}`;
  document.getElementById('invoice-detail-paid').textContent = formatCurrency(invoice.paidAmount, invoice.currency);
  document.getElementById('invoice-detail-due').textContent = formatCurrency(invoice.dueAmount, invoice.currency);
  document.getElementById('invoice-detail-total').textContent = formatCurrency(invoice.total, invoice.currency);

  document.getElementById('payment-input-invoice-id').value = invoice.id;
  document.getElementById('payment-input-date').value = todayIso();
  document.getElementById('payment-input-amount').value = invoice.dueAmount > 0 ? invoice.dueAmount.toFixed(2) : '';
  document.getElementById('payment-input-reference').value = '';
  document.getElementById('payment-input-transaction').value = '';
  document.getElementById('payment-input-notes').value = '';

  renderDrawerActions(invoice);
  renderDrawerPaymentHistory(invoice);
  renderDrawerLedger(invoice.customerId, invoice.currency);
  renderDrawerRecurring(invoice);

  const overlay = document.getElementById('sales-details-drawer-overlay');
  const drawer = document.getElementById('sales-details-drawer');
  overlay.classList.remove('hidden');
  setTimeout(() => {
    drawer.classList.remove('scale-95', 'opacity-0');
    drawer.classList.add('scale-100', 'opacity-100');
  }, 10);
  
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
};

window.closeSalesDrawer = function closeSalesDrawer() {
  const overlay = document.getElementById('sales-details-drawer-overlay');
  const drawer = document.getElementById('sales-details-drawer');
  drawer.classList.remove('scale-100', 'opacity-100');
  drawer.classList.add('scale-95', 'opacity-0');
  setTimeout(() => overlay.classList.add('hidden'), 300);
};

window.prefillPaymentForm = function prefillPaymentForm(invoiceId) {
  window.openSalesDrawer(invoiceId);
  setTimeout(() => {
    document.getElementById('payment-input-amount')?.focus();
  }, 120);
};

window.recordInvoicePayment = function recordInvoicePayment(event) {
  event.preventDefault();
  ensureCrmState(appState);
  syncInvoiceBalances(appState);

  const invoiceId = document.getElementById('payment-input-invoice-id').value;
  const invoice = getInvoiceById(appState, invoiceId);
  if (!invoice) {
    alert('Invoice not found.');
    return;
  }
  if (invoice.status === 'draft' || invoice.status === 'cancelled') {
    alert('Payments can only be recorded against sent invoices.');
    return;
  }

  const amount = Number(document.getElementById('payment-input-amount').value || 0);
  if (!(amount > 0)) {
    alert('Enter a payment amount greater than zero.');
    return;
  }
  if (amount > Number(invoice.dueAmount || 0)) {
    alert('Payment amount cannot exceed the open due amount in this demo flow.');
    return;
  }

  createPaymentRecord(appState, {
    customerId: invoice.customerId,
    invoiceId: invoice.id,
    date: document.getElementById('payment-input-date').value || todayIso(),
    amount,
    method: document.getElementById('payment-input-method').value || 'Bank Transfer',
    reference: document.getElementById('payment-input-reference').value || '',
    transactionId: document.getElementById('payment-input-transaction').value || '',
    notes: document.getElementById('payment-input-notes').value || '',
    status: 'received'
  });

  syncInvoiceBalances(appState);
  createActivityEntry(appState, {
    entityType: 'customer',
    entityId: invoice.customerId,
    activityType: 'financial-event',
    summary: `Payment received for ${invoice.id}`,
    note: `Recorded ${formatCurrency(amount, invoice.currency)} via ${document.getElementById('payment-input-method').value || 'Bank Transfer'}.`,
    scheduledAt: todayIso()
  });
  refreshLinkedModules(invoice.customerId);
  saveAppState();
  window.renderSalesTable();
  window.openSalesDrawer(invoice.id);
};

window.approveInvoiceAction = function approveInvoiceAction(invoiceId) {
  const result = approveInvoice(appState, invoiceId);
  if (!result.ok) {
    alert(result.error);
    return;
  }
  saveAppState();
  window.renderSalesTable();
  window.openSalesDrawer(invoiceId);
};

window.sendInvoiceAction = function sendInvoiceAction(invoiceId) {
  ensureCrmState(appState);
  syncInvoiceBalances(appState);
  const invoice = getInvoiceById(appState, invoiceId);
  if (!invoice) {
    alert('Invoice not found.');
    return;
  }
  const profile = getCustomerById(invoice.customerId);
  const stockCheck = validateInvoiceInventory(invoice.items || []);
  if (!stockCheck.ok) {
    alert(stockCheck.error);
    return;
  }
  const creditCheck = validateCreditExposure(profile, invoice, invoice.total - invoice.paidAmount);
  if (!creditCheck.ok) {
    if (creditCheck.error !== 'Invoice finalization cancelled.') alert(creditCheck.error);
    return;
  }

  applyInvoicePosting(invoice);
  const result = transitionInvoiceLifecycle(appState, invoiceId, 'sent');
  if (!result.ok) {
    alert(result.error);
    return;
  }
  syncInvoiceBalances(appState);
  createActivityEntry(appState, {
    entityType: 'customer',
    entityId: invoice.customerId,
    activityType: 'financial-event',
    summary: `Invoice ${invoice.id} marked sent`,
    note: `Invoice ${invoice.id} posted to receivables and shared with customer.`,
    scheduledAt: todayIso()
  });
  refreshLinkedModules(invoice.customerId);
  saveAppState();
  window.renderSalesTable();
  window.openSalesDrawer(invoiceId);
};

window.cancelInvoiceAction = function cancelInvoiceAction(invoiceId) {
  ensureCrmState(appState);
  syncInvoiceBalances(appState);
  const invoice = getInvoiceById(appState, invoiceId);
  if (!invoice) {
    alert('Invoice not found.');
    return;
  }
  if (Number(invoice.paidAmount || 0) > 0) {
    alert('Paid or partially paid invoices cannot be cancelled in this demo.');
    return;
  }
  if (!confirm(`Cancel ${invoice.id}? This will remove it from receivables and aging.`)) return;
  if (invoice.isPosted) reverseInvoicePosting(invoice);
  const result = transitionInvoiceLifecycle(appState, invoiceId, 'cancelled');
  if (!result.ok) {
    alert(result.error);
    return;
  }
  syncInvoiceBalances(appState);
  refreshLinkedModules(invoice.customerId);
  saveAppState();
  window.renderSalesTable();
  window.openSalesDrawer(invoiceId);
};

window.generateRecurringInvoiceNow = function generateRecurringInvoiceNow(recurringId) {
  const result = generateRecurringInvoice(appState, recurringId);
  if (!result.ok) {
    alert(result.error);
    return;
  }
  result.invoice.isPosted = false;
  result.invoice.postedAt = null;
  applyInvoicePosting(result.invoice);
  syncInvoiceBalances(appState);
  refreshLinkedModules(result.invoice.customerId);
  saveAppState();
  window.renderSalesTable();
  alert(`Generated recurring invoice ${result.invoice.id}.`);
};

window.initInvoiceForm = function initInvoiceForm() {
  renderCustomerFilterOptions();
  document.getElementById('invoice-input-id').value = nextInvoiceId();
  document.getElementById('invoice-input-date').value = todayIso();
  document.getElementById('invoice-input-due-date').value = addDays(todayIso(), 30);
  document.getElementById('invoice-input-status').value = 'draft';
  document.getElementById('invoice-input-terms').value = 'Net 30';
  document.getElementById('invoice-input-currency').value = 'USD';
  document.getElementById('invoice-input-discount').value = '0';
  document.getElementById('invoice-input-tax').value = '10';
  document.getElementById('invoice-input-initial-payment').value = '0';
  document.getElementById('invoice-input-recurring').checked = false;
  document.getElementById('invoice-input-recurring-frequency').value = 'monthly';
  document.getElementById('invoice-input-recurring-next-run').value = todayIso();
  document.getElementById('invoice-items-tbody').innerHTML = '';
  window.addInvoiceItemRow();
  window.calcInvoiceTotals();
};

window.addInvoiceItemRow = function addInvoiceItemRow() {
  const tbody = document.getElementById('invoice-items-tbody');
  if (!tbody) return;

  const rowId = `item-row-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const tr = document.createElement('tr');
  tr.id = rowId;
  tr.className = 'border-b border-slate-100 items-row';

  const productOptions = [
    '<option value="" disabled selected>Select SKU Product</option>',
    ...(appState.inventory || []).map((product) => `<option value="${product.id}" data-price="${product.price}" data-stock="${product.stock}">${escapeHtml(product.name)} (${formatCurrency(product.price)} • Stock: ${escapeHtml(product.stock)})</option>`)
  ].join('');

  tr.innerHTML = `
    <td class="p-2">
      <select class="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:outline-none item-product-select" onchange="window.handleProductRowChange('${rowId}', this)">
        ${productOptions}
      </select>
    </td>
    <td class="p-2 text-center">
      <input type="number" min="1" value="1" class="w-20 px-2 py-1.5 border border-slate-200 bg-slate-50 rounded-lg text-center focus:outline-none item-qty-input" oninput="window.calcInvoiceTotals()" disabled>
    </td>
    <td class="p-2 text-right">
      <input type="number" step="0.01" min="0" value="0.00" class="w-24 px-2 py-1.5 border border-slate-200 bg-slate-50 rounded-lg text-right focus:outline-none item-price-input" oninput="window.calcInvoiceTotals()" disabled>
    </td>
    <td class="p-2 text-right font-extrabold text-slate-800 item-subtotal-span">${formatCurrency(0)}</td>
    <td class="p-2 text-center">
      <button type="button" onclick="document.getElementById('${rowId}').remove(); window.calcInvoiceTotals();" class="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors text-[11px]">Remove</button>
    </td>
  `;

  tbody.appendChild(tr);
};

window.handleProductRowChange = function handleProductRowChange(rowId, selectElement) {
  const row = document.getElementById(rowId);
  if (!row) return;
  const selectedOpt = selectElement.options[selectElement.selectedIndex];
  const price = Number(selectedOpt.getAttribute('data-price') || 0);
  row.querySelector('.item-qty-input').disabled = false;
  row.querySelector('.item-price-input').disabled = false;
  row.querySelector('.item-price-input').value = price.toFixed(2);
  window.calcInvoiceTotals();
};

window.calcInvoiceTotals = function calcInvoiceTotals() {
  const result = collectInvoiceItems();
  const subtotal = result.ok ? result.subtotal : 0;
  const discountPercent = Number(document.getElementById('invoice-input-discount')?.value || 0);
  const taxPercent = Number(document.getElementById('invoice-input-tax')?.value || 0);
  const discountAmount = subtotal * (discountPercent / 100);
  const taxAmount = (subtotal - discountAmount) * (taxPercent / 100);
  const total = subtotal - discountAmount + taxAmount;

  document.querySelectorAll('.items-row').forEach((row) => {
    const qty = Number(row.querySelector('.item-qty-input')?.value || 0);
    const price = Number(row.querySelector('.item-price-input')?.value || 0);
    row.querySelector('.item-subtotal-span').textContent = formatCurrency(qty * price);
  });

  document.getElementById('invoice-calc-subtotal').textContent = formatCurrency(subtotal);
  document.getElementById('invoice-calc-discount').textContent = `-${formatCurrency(discountAmount)}`;
  document.getElementById('invoice-calc-tax').textContent = `+${formatCurrency(taxAmount)}`;
  document.getElementById('invoice-calc-total').textContent = formatCurrency(total);
};

window.handleInvoiceSubmit = function handleInvoiceSubmit(event) {
  event.preventDefault();
  ensureCrmState(appState);

  const invoiceId = document.getElementById('invoice-input-id').value;
  const customerId = document.getElementById('invoice-input-customer').value;
  const issueDate = document.getElementById('invoice-input-date').value || todayIso();
  const dueDate = document.getElementById('invoice-input-due-date').value || issueDate;
  const lifecycle = document.getElementById('invoice-input-status').value;
  const terms = document.getElementById('invoice-input-terms').value || 'Net 30';
  const currency = document.getElementById('invoice-input-currency').value || 'USD';
  const discountPercent = Number(document.getElementById('invoice-input-discount').value || 0);
  const taxPercent = Number(document.getElementById('invoice-input-tax').value || 0);
  let initialPayment = Number(document.getElementById('invoice-input-initial-payment').value || 0);
  const recurringEnabled = document.getElementById('invoice-input-recurring').checked;
  const recurringFrequency = document.getElementById('invoice-input-recurring-frequency').value || 'monthly';
  const recurringNextRun = document.getElementById('invoice-input-recurring-next-run').value || issueDate;

  const profile = getCustomerById(customerId);
  if (!profile) {
    alert('Customer not found.');
    return;
  }

  const itemResult = collectInvoiceItems();
  if (!itemResult.ok) {
    alert(itemResult.error);
    return;
  }
  const stockCheck = validateInvoiceInventory(itemResult.items);
  if (!stockCheck.ok) {
    alert(stockCheck.error);
    return;
  }

  const subtotal = itemResult.subtotal;
  const discountAmount = subtotal * (discountPercent / 100);
  const taxAmount = (subtotal - discountAmount) * (taxPercent / 100);
  const total = subtotal - discountAmount + taxAmount;
  if (lifecycle === 'draft' && initialPayment > 0) {
    alert('Draft invoices cannot take payment until they are sent.');
    return;
  }
  if (lifecycle === 'paid') {
    initialPayment = total;
  }
  if (initialPayment < 0 || initialPayment > total) {
    alert('Initial payment must be between 0 and the invoice total.');
    return;
  }

  const draftDue = Math.max(0, total - initialPayment);
  if (lifecycle !== 'draft') {
    const creditCheck = validateCreditExposure(profile, null, draftDue);
    if (!creditCheck.ok) {
      if (creditCheck.error !== 'Invoice finalization cancelled.') alert(creditCheck.error);
      return;
    }
  }

  const invoice = {
    id: invoiceId,
    customerId,
    issueDate,
    dueDate,
    items: itemResult.items,
    subtotal,
    discountAmount,
    taxAmount,
    total,
    amount: total,
    currency,
    terms,
    approvalStatus: lifecycle === 'draft' ? 'pending' : 'approved',
    postedAt: null,
    sentAt: lifecycle === 'draft' ? null : issueDate,
    isPosted: false,
    customerSnapshot: buildCustomerSnapshot(profile),
    sourceType: null,
    sourceId: null,
    status: lifecycle
  };

  if (lifecycle !== 'draft') {
    applyInvoicePosting(invoice);
  } else {
    appState.invoiceApprovalsById[invoiceId] = {
      invoiceId,
      status: 'pending',
      submittedAt: issueDate,
      submittedBy: appState.currentUser?.name || 'User'
    };
  }

  appState.invoices.push(invoice);

  if (initialPayment > 0) {
    createPaymentRecord(appState, {
      customerId,
      invoiceId,
      date: issueDate,
      amount: initialPayment,
      method: 'Invoice Settlement',
      reference: `INIT-${invoiceId}`,
      transactionId: '',
      notes: 'Initial payment captured on invoice creation.',
      status: 'received'
    });
  }

  syncInvoiceBalances(appState);

  if (recurringEnabled) {
    createRecurringInvoiceTemplate(appState, {
      customerId,
      invoiceId,
      frequency: recurringFrequency,
      nextRunDate: recurringNextRun,
      status: 'active',
      template: {
        items: itemResult.items,
        subtotal,
        discountAmount,
        taxAmount,
        total,
        currency,
        terms,
        customerSnapshot: buildCustomerSnapshot(profile)
      }
    });
  }

  createActivityEntry(appState, {
    entityType: 'customer',
    entityId: customerId,
    activityType: 'financial-event',
    summary: `Invoice ${invoiceId} created`,
    note: `${invoiceId} recorded at ${formatCurrency(total, currency)} with lifecycle ${lifecycle}.`,
    scheduledAt: issueDate
  });

  refreshLinkedModules(customerId);
  saveAppState();
  window.showSalesMainView();
  window.renderSalesTable();
  alert(`Invoice ${invoiceId} recorded with ${lifecycle} lifecycle.`);
};

window.exportSalesCSV = function exportSalesCSV() {
  const invoices = getFilteredInvoices();
  if (!invoices.length) {
    alert('No invoice items found to export.');
    return;
  }
  const csv = [
    ['Invoice ID', 'Customer', 'Issue Date', 'Due Date', 'Total', 'Paid', 'Due', 'Status', 'Approval'].join(','),
    ...invoices.map((invoice) => {
      const profile = getCustomerById(invoice.customerId);
      return [
        invoice.id,
        profile?.customer?.company || invoice.customerSnapshot?.company || 'Unknown',
        invoice.issueDate,
        invoice.dueDate,
        invoice.total,
        invoice.paidAmount,
        invoice.dueAmount,
        invoice.status,
        invoice.approvalStatus
      ].map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',');
    })
  ].join('\n');

  const filename = `Toys Factory ERP_Invoices_Export_${todayIso()}.csv`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

window.showSalesMainView = function showSalesMainView() {
  document.getElementById('sales-main-view').classList.remove('hidden');
  document.getElementById('sales-form-view').classList.add('hidden');
};

window.showSalesFormView = function showSalesFormView() {
  window.initInvoiceForm();
  document.getElementById('sales-main-view').classList.add('hidden');
  document.getElementById('sales-form-view').classList.remove('hidden');
};

window.printInvoice = function printInvoice() {
  window.print();
};

document.addEventListener('DOMContentLoaded', async () => {
  await appReadyPromise;
  ensureCrmState(appState);
  syncInvoiceBalances(appState);
  renderCustomerFilterOptions();
  window.renderSalesTable();
  initIcons();
});
