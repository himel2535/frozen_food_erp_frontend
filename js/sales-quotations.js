import { appReadyPromise, appState, saveAppState, initIcons } from '/js/shared.js';
import { ensureCrmState, getCustomerList, getDealList, getOwnerOptions } from '/js/crm-service.js';

function escapeHtml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function formatCurrency(value, currency = 'BDT') {
  const symbolMap = { USD: '$', EUR: '€', GBP: '£', BDT: '৳' };
  const symbol = symbolMap[currency] || '৳';
  return `${symbol}${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

// ----------------------------------------------------
// STATE & SEED DATA INITIALIZATION
// ----------------------------------------------------
function getQuotationsList() {
  ensureCrmState(appState);
  if (!appState.salesQuotations) {
    appState.salesQuotations = [
      {
        id: "QT-2026-0001",
        customerId: 1,
        customerName: "Bell Labs",
        dealId: "DEAL-0001",
        dealName: "Orbital Textiles Annual Supply",
        date: "2026-06-18",
        validUntil: "2026-07-18",
        status: "sent",
        ownerId: "EMP-005",
        ownerName: "Marcus Wright",
        lastUpdated: "2026-06-18",
        currency: "USD",
        refNum: "REF-9901",
        items: [
          { productId: "1", name: "Premium Cotton Yarn", description: "Standard grade cotton yarn", quantity: 100, price: 12.50, discount: 0, tax: 5, total: 1312.50 }
        ],
        subtotal: 1250.00,
        discountAmount: 0.00,
        taxAmount: 62.50,
        shipping: 50.00,
        total: 1362.50,
        deliveryTerms: "FOB Origin",
        paymentTerms: "Net 30",
        warrantyConditions: "1 Year Standard Warranty",
        notes: "Thank you for choosing Toys Factory ERP Solutions.",
        rejectionReason: "",
        activities: [
          { date: "2026-06-18 10:00:00", type: "Created", user: "Marcus Wright" },
          { date: "2026-06-18 10:05:00", type: "Sent", user: "Marcus Wright" }
        ]
      },
      {
        id: "QT-2026-0002",
        customerId: 2,
        customerName: "Radium Co",
        dealId: "",
        dealName: "",
        date: "2026-06-19",
        validUntil: "2026-07-19",
        status: "accepted",
        ownerId: "EMP-001",
        ownerName: "Sarah Connor",
        lastUpdated: "2026-06-20",
        currency: "USD",
        refNum: "REF-8822",
        items: [
          { productId: "2", name: "Indigo Dye Concentrate", description: "Concentrated organic dye", quantity: 5, price: 85.00, discount: 10, tax: 10, total: 420.75 }
        ],
        subtotal: 425.00,
        discountAmount: 42.50,
        taxAmount: 38.25,
        shipping: 20.00,
        total: 440.75,
        deliveryTerms: "Delivered to warehouse",
        paymentTerms: "COD",
        warrantyConditions: "N/A",
        notes: "Client requested quick dispatch.",
        rejectionReason: "",
        activities: [
          { date: "2026-06-19 14:00:00", type: "Created", user: "Sarah Connor" },
          { date: "2026-06-20 11:20:00", type: "Accepted", user: "Sarah Connor" }
        ]
      }
    ];
    saveAppState();
  }
  return appState.salesQuotations;
}

function getCustomers() {
  return getCustomerList(appState);
}

function getDeals() {
  return getDealList(appState);
}

function getSalesReps() {
  return getOwnerOptions(appState);
}

function getInventoryProduct(productId) {
  return (appState.inventory || []).find(entry => String(entry.id) === String(productId)) || null;
}

// ----------------------------------------------------
// ROUTING & INLINE VIEW CONTROLS
// ----------------------------------------------------
window.showMainView = function() {
  document.getElementById('sales-quotations-main-view').classList.remove('hidden');
  document.getElementById('sales-quotations-form-view').classList.add('hidden');
  document.getElementById('sales-quotations-detail-view').classList.add('hidden');
  renderAll();
};

window.showFormView = function() {
  document.getElementById('sales-quotations-main-view').classList.add('hidden');
  document.getElementById('sales-quotations-form-view').classList.remove('hidden');
  document.getElementById('sales-quotations-detail-view').classList.add('hidden');
};

window.showDetailView = function() {
  document.getElementById('sales-quotations-main-view').classList.add('hidden');
  document.getElementById('sales-quotations-form-view').classList.add('hidden');
  document.getElementById('sales-quotations-detail-view').classList.remove('hidden');
};

// ----------------------------------------------------
// DROPDOWNS POPULATION
// ----------------------------------------------------
function populateDropdowns() {
  const customerSelect = document.getElementById('input-customer');
  if (customerSelect) {
    customerSelect.innerHTML = '<option value="">Select Customer</option>';
    getCustomers().forEach(c => {
      customerSelect.innerHTML += `<option value="${c.id}">${escapeHtml(c.company || c.name)}</option>`;
    });
  }

  const dealSelect = document.getElementById('input-deal');
  if (dealSelect) {
    dealSelect.innerHTML = '<option value="">Select Deal (Optional)</option>';
    getDeals().forEach(d => {
      dealSelect.innerHTML += `<option value="${d.id}">${escapeHtml(d.title)}</option>`;
    });
  }

  const ownerSelect = document.getElementById('input-owner');
  if (ownerSelect) {
    ownerSelect.innerHTML = '<option value="">Select Salesperson</option>';
    getSalesReps().forEach(o => {
      ownerSelect.innerHTML += `<option value="${o.id}">${escapeHtml(o.name)}</option>`;
    });
  }

  // Also populate Filters
  const filterCust = document.getElementById('filter-customer');
  if (filterCust && filterCust.options.length <= 1) {
    getCustomers().forEach(c => {
      filterCust.innerHTML += `<option value="${c.id}">${escapeHtml(c.company || c.name)}</option>`;
    });
  }

  const filterRep = document.getElementById('filter-salesperson');
  if (filterRep && filterRep.options.length <= 1) {
    getSalesReps().forEach(o => {
      filterRep.innerHTML += `<option value="${o.id}">${escapeHtml(o.name)}</option>`;
    });
  }

  const filterDeal = document.getElementById('filter-deal');
  if (filterDeal && filterDeal.options.length <= 1) {
    getDeals().forEach(d => {
      filterDeal.innerHTML += `<option value="${d.id}">${escapeHtml(d.title)}</option>`;
    });
  }
}

// ----------------------------------------------------
// COLLAPSIBLE ADVANCED DETAILS PANEL
// ----------------------------------------------------
window.toggleAdvancedFields = function() {
  const panel = document.getElementById('sales-quotations-advanced-section');
  const icon = document.getElementById('sales-quotations-advanced-icon');
  if (panel && icon) {
    const isHidden = panel.classList.contains('hidden');
    if (isHidden) {
      panel.classList.remove('hidden');
      icon.style.transform = 'rotate(180deg)';
    } else {
      panel.classList.add('hidden');
      icon.style.transform = 'rotate(0deg)';
    }
  }
};

// ----------------------------------------------------
// DYNAMIC LINE ITEMS MANAGEMENT
// ----------------------------------------------------
window.addQuotationItemRow = function(productId = '', description = '', qty = 1, price = 0, discount = 0, tax = 0) {
  const tbody = document.getElementById('quotation-items-tbody');
  if (!tbody) return;

  const rowId = `quote-row-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const tr = document.createElement('tr');
  tr.id = rowId;
  tr.className = 'border-b border-slate-100 items-row';

  const productOptions = [
    '<option value="" disabled selected>Select SKU Product</option>',
    ...(appState.inventory || []).map(p => {
      const selected = String(p.id) === String(productId) ? 'selected' : '';
      return `<option value="${p.id}" data-price="${p.price}" data-name="${escapeHtml(p.name)}" ${selected}>${escapeHtml(p.name)} (${formatCurrency(p.price)} • Stock: ${p.stock})</option>`;
    })
  ].join('');

  tr.innerHTML = `
    <td class="p-2">
      <select class="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:outline-none item-product-select" onchange="window.handleProductRowChange('${rowId}', this)">
        ${productOptions}
      </select>
    </td>
    <td class="p-2">
      <input type="text" class="w-full px-2 py-1.5 border border-slate-200 bg-slate-50 rounded-lg focus:outline-none item-description-input" value="${escapeHtml(description)}" placeholder="Description...">
    </td>
    <td class="p-2 text-center">
      <input type="number" min="1" value="${qty}" class="w-16 px-2 py-1.5 border border-slate-200 bg-slate-50 rounded-lg text-center focus:outline-none item-qty-input" oninput="window.calcQuotationTotals()">
    </td>
    <td class="p-2 text-right">
      <input type="number" step="0.01" min="0" value="${Number(price).toFixed(2)}" class="w-24 px-2 py-1.5 border border-slate-200 bg-slate-50 rounded-lg text-right focus:outline-none item-price-input" oninput="window.calcQuotationTotals()">
    </td>
    <td class="p-2 text-center">
      <input type="number" min="0" max="100" value="${discount}" class="w-16 px-2 py-1.5 border border-slate-200 bg-slate-50 rounded-lg text-center focus:outline-none item-discount-input" oninput="window.calcQuotationTotals()">
    </td>
    <td class="p-2 text-center">
      <input type="number" min="0" max="100" value="${tax}" class="w-16 px-2 py-1.5 border border-slate-200 bg-slate-50 rounded-lg text-center focus:outline-none item-tax-input" oninput="window.calcQuotationTotals()">
    </td>
    <td class="p-2 text-right font-extrabold text-slate-800 item-subtotal-span">${formatCurrency(0)}</td>
    <td class="p-2 text-center">
      <button type="button" onclick="document.getElementById('${rowId}').remove(); window.calcQuotationTotals();" class="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors text-[11px]">Remove</button>
    </td>
  `;

  tbody.appendChild(tr);
  window.calcQuotationTotals();
  initIcons();
};

window.handleProductRowChange = function(rowId, selectElement) {
  const row = document.getElementById(rowId);
  if (!row) return;
  const selectedOpt = selectElement.options[selectElement.selectedIndex];
  const price = Number(selectedOpt.getAttribute('data-price') || 0);
  const name = selectedOpt.getAttribute('data-name') || '';
  
  row.querySelector('.item-price-input').value = price.toFixed(2);
  row.querySelector('.item-description-input').value = `Standard delivery of ${name}`;
  window.calcQuotationTotals();
};

window.calcQuotationTotals = function() {
  const rows = document.querySelectorAll('.items-row');
  let subtotal = 0;
  let totalDiscount = 0;
  let totalTax = 0;

  rows.forEach(row => {
    const productSelect = row.querySelector('.item-product-select');
    if (!productSelect || !productSelect.value) return;

    const qty = Number(row.querySelector('.item-qty-input').value || 1);
    const price = Number(row.querySelector('.item-price-input').value || 0);
    const discPercent = Number(row.querySelector('.item-discount-input').value || 0);
    const taxPercent = Number(row.querySelector('.item-tax-input').value || 0);

    const baseTotal = qty * price;
    const discAmt = baseTotal * (discPercent / 100);
    const taxedTotal = baseTotal - discAmt;
    const taxAmt = taxedTotal * (taxPercent / 100);
    const rowTotal = taxedTotal + taxAmt;

    row.querySelector('.item-subtotal-span').textContent = formatCurrency(rowTotal);

    subtotal += baseTotal;
    totalDiscount += discAmt;
    totalTax += taxAmt;
  });

  const shipping = Number(document.getElementById('input-shipping')?.value || 0);
  const grandTotal = subtotal - totalDiscount + totalTax + shipping;

  const subtotalEl = document.getElementById('quotation-calc-subtotal');
  if (subtotalEl) subtotalEl.textContent = formatCurrency(subtotal);

  const discountEl = document.getElementById('quotation-calc-discount');
  if (discountEl) discountEl.textContent = `-${formatCurrency(totalDiscount)}`;

  const taxEl = document.getElementById('quotation-calc-tax');
  if (taxEl) taxEl.textContent = `+${formatCurrency(totalTax)}`;

  const totalEl = document.getElementById('quotation-calc-total');
  if (totalEl) totalEl.textContent = formatCurrency(grandTotal);
};

// ----------------------------------------------------
// CREATION & EDITING INLINE FORM MANAGEMENT
// ----------------------------------------------------
window.openQuotationForm = function(id = null) {
  const form = document.getElementById('sales-quotations-form');
  if (form) form.reset();

  populateDropdowns();

  document.getElementById('quotation-items-tbody').innerHTML = '';
  document.getElementById('sales-quotations-advanced-section').classList.add('hidden');
  document.getElementById('sales-quotations-advanced-icon').style.transform = 'rotate(0deg)';

  const formHeader = document.getElementById('quotations-form-header');
  const statusContainer = document.getElementById('form-rejection-reason-container');
  if (statusContainer) statusContainer.classList.add('hidden');

  if (id) {
    // Edit existing quotation
    const quote = getQuotationsList().find(q => q.id === id);
    if (!quote) return;

    if (formHeader) {
      formHeader.setAttribute('title', `Edit Quotation - ${quote.id}`);
      formHeader.setAttribute('subtitle', `Update custom pricing, validity, or items.`);
    }

    document.getElementById('edit-quotation-id').value = quote.id;
    document.getElementById('input-customer').value = quote.customerId;
    document.getElementById('input-deal').value = quote.dealId || '';
    document.getElementById('input-owner').value = quote.ownerId;
    document.getElementById('input-date').value = quote.date;
    document.getElementById('input-valid-until').value = quote.validUntil;
    document.getElementById('input-currency').value = quote.currency || 'USD';
    document.getElementById('input-status').value = quote.status;
    document.getElementById('input-ref').value = quote.refNum || '';
    document.getElementById('input-delivery-terms').value = quote.deliveryTerms || '';
    document.getElementById('input-payment-terms').value = quote.paymentTerms || '';
    document.getElementById('input-warranty').value = quote.warrantyConditions || '';
    document.getElementById('input-notes').value = quote.notes || '';
    document.getElementById('input-shipping').value = Number(quote.shipping || 0).toFixed(2);
    document.getElementById('input-rejection-reason').value = quote.rejectionReason || '';

    if (quote.status === 'rejected') {
      statusContainer.classList.remove('hidden');
    }

    // Populate rows
    if (quote.items && quote.items.length > 0) {
      quote.items.forEach(it => {
        window.addQuotationItemRow(it.productId, it.description, it.quantity, it.price, it.discount, it.tax);
      });
    } else {
      window.addQuotationItemRow();
    }
  } else {
    // Create new
    if (formHeader) {
      formHeader.setAttribute('title', 'Create Quotation');
      formHeader.setAttribute('subtitle', 'Provide customer quotation details below.');
    }
    document.getElementById('edit-quotation-id').value = '';
    document.getElementById('input-date').value = todayIso();
    
    // Set default expiry date to 30 days from today
    const expDate = new Date();
    expDate.setDate(expDate.getDate() + 30);
    document.getElementById('input-valid-until').value = expDate.toISOString().slice(0, 10);
    document.getElementById('input-shipping').value = '0.00';

    window.addQuotationItemRow();
  }

  // Handle dynamic rejection reason visibility during status change inside the form
  const statusSelect = document.getElementById('input-status');
  if (statusSelect) {
    statusSelect.onchange = () => {
      if (statusSelect.value === 'rejected') {
        statusContainer.classList.remove('hidden');
      } else {
        statusContainer.classList.add('hidden');
      }
    };
  }

  window.showFormView();
};

window.handleSubmit = function(event) {
  event.preventDefault();

  const list = getQuotationsList();
  const editId = document.getElementById('edit-quotation-id').value;

  const customerSelect = document.getElementById('input-customer');
  const customerId = Number(customerSelect.value);
  const customerName = customerSelect.options[customerSelect.selectedIndex].text;

  const dealSelect = document.getElementById('input-deal');
  const dealId = dealSelect.value;
  const dealName = dealSelect.selectedIndex > 0 ? dealSelect.options[dealSelect.selectedIndex].text : '';

  const ownerSelect = document.getElementById('input-owner');
  const ownerId = ownerSelect.value;
  const ownerName = ownerSelect.options[ownerSelect.selectedIndex].text;

  // Compile items
  const items = [];
  const rows = document.querySelectorAll('.items-row');
  let subtotal = 0;
  let totalDiscount = 0;
  let totalTax = 0;

  rows.forEach(row => {
    const productSelect = row.querySelector('.item-product-select');
    if (!productSelect || !productSelect.value) return;

    const productId = productSelect.value;
    const name = productSelect.options[productSelect.selectedIndex].getAttribute('data-name');
    const description = row.querySelector('.item-description-input').value;
    const quantity = Number(row.querySelector('.item-qty-input').value || 1);
    const price = Number(row.querySelector('.item-price-input').value || 0);
    const discount = Number(row.querySelector('.item-discount-input').value || 0);
    const tax = Number(row.querySelector('.item-tax-input').value || 0);

    const baseTotal = quantity * price;
    const discVal = baseTotal * (discount / 100);
    const taxVal = (baseTotal - discVal) * (tax / 100);
    const finalTotal = baseTotal - discVal + taxVal;

    items.push({ productId, name, description, quantity, price, discount, tax, total: finalTotal });

    subtotal += baseTotal;
    totalDiscount += discVal;
    totalTax += taxVal;
  });

  const shipping = Number(document.getElementById('input-shipping').value || 0);
  const grandTotal = subtotal - totalDiscount + totalTax + shipping;
  const currency = document.getElementById('input-currency').value;
  const status = document.getElementById('input-status').value;
  const refNum = document.getElementById('input-ref').value;
  const deliveryTerms = document.getElementById('input-delivery-terms').value;
  const paymentTerms = document.getElementById('input-payment-terms').value;
  const warrantyConditions = document.getElementById('input-warranty').value;
  const notes = document.getElementById('input-notes').value;
  const rejectionReason = document.getElementById('input-rejection-reason').value;

  if (editId) {
    // Modify existing quote
    const quoteIndex = list.findIndex(q => q.id === editId);
    if (quoteIndex !== -1) {
      const orig = list[quoteIndex];
      orig.customerId = customerId;
      orig.customerName = customerName;
      orig.dealId = dealId;
      orig.dealName = dealName;
      orig.date = document.getElementById('input-date').value;
      orig.validUntil = document.getElementById('input-valid-until').value;
      orig.ownerId = ownerId;
      orig.ownerName = ownerName;
      orig.currency = currency;
      orig.status = status;
      orig.refNum = refNum;
      orig.deliveryTerms = deliveryTerms;
      orig.paymentTerms = paymentTerms;
      orig.warrantyConditions = warrantyConditions;
      orig.notes = notes;
      orig.items = items;
      orig.subtotal = subtotal;
      orig.discountAmount = totalDiscount;
      orig.taxAmount = totalTax;
      orig.shipping = shipping;
      orig.total = grandTotal;
      orig.rejectionReason = rejectionReason;
      orig.lastUpdated = todayIso();
      orig.activities.push({ date: todayIso() + " " + new Date().toTimeString().slice(0,8), type: "Edited", user: ownerName });
    }
  } else {
    // Generate new quotation
    const id = `QT-2026-${String(10000 + list.length + 1).slice(1)}`;
    const newQuote = {
      id, customerId, customerName, dealId, dealName,
      date: document.getElementById('input-date').value,
      validUntil: document.getElementById('input-valid-until').value,
      ownerId, ownerName, currency, status, refNum,
      deliveryTerms, paymentTerms, warrantyConditions, notes,
      items, subtotal, discountAmount: totalDiscount, taxAmount: totalTax, shipping, total: grandTotal,
      rejectionReason, lastUpdated: todayIso(),
      activities: [
        { date: todayIso() + " " + new Date().toTimeString().slice(0,8), type: "Created", user: ownerName }
      ]
    };
    list.push(newQuote);
  }

  saveAppState();
  window.showMainView();
};

// ----------------------------------------------------
// DETAILED INLINE VIEW & STATUS TRANSITIONS
// ----------------------------------------------------
window.viewQuotationDetail = function(id) {
  const quote = getQuotationsList().find(q => q.id === id);
  if (!quote) return;

  // If status is 'sent', automatically mark it as 'viewed'
  if (quote.status === 'sent') {
    quote.status = 'viewed';
    quote.lastUpdated = todayIso();
    quote.activities.push({ date: todayIso() + " " + new Date().toTimeString().slice(0,8), type: "Viewed", user: "Customer Portal Sync" });
    saveAppState();
  }

  document.getElementById('detail-quote-number').textContent = quote.id;
  document.getElementById('detail-issue-date').textContent = `Issued: ${quote.date}`;
  document.getElementById('detail-expiry-date').textContent = `Expires: ${quote.validUntil}`;
  document.getElementById('detail-ref-number').textContent = `Ref: ${quote.refNum || '—'}`;
  document.getElementById('detail-customer-company').textContent = quote.customerName;

  // Details
  const customerProfile = (appState.crmCustomers || []).find(c => c.id === quote.customerId || c.company === quote.customerName);
  document.getElementById('detail-customer-name').textContent = customerProfile ? customerProfile.name : 'Primary Representative';
  document.getElementById('detail-customer-email').textContent = customerProfile ? customerProfile.email : 'No email provided';
  document.getElementById('detail-customer-phone').textContent = customerProfile ? customerProfile.phone : 'No phone recorded';

  document.getElementById('detail-owner-name').textContent = quote.ownerName;
  document.getElementById('detail-deal-ref').textContent = quote.dealName || 'None';
  document.getElementById('detail-last-updated').textContent = quote.lastUpdated || quote.date;

  // Status Pill styling
  const statusPill = document.getElementById('detail-status-pill');
  statusPill.textContent = quote.status;
  statusPill.className = `px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
    quote.status === 'accepted' ? 'bg-emerald-50 text-emerald-600' :
    quote.status === 'sent' ? 'bg-blue-50 text-blue-600' :
    quote.status === 'viewed' ? 'bg-indigo-50 text-indigo-600' :
    quote.status === 'rejected' ? 'bg-rose-50 text-rose-600' :
    quote.status === 'expired' ? 'bg-amber-50 text-amber-600' :
    quote.status === 'cancelled' ? 'bg-slate-100 text-slate-500' : 'bg-slate-50 text-slate-500'
  }`;

  // Render items
  const itemsBody = document.getElementById('detail-items-body');
  itemsBody.innerHTML = '';
  quote.items.forEach(it => {
    itemsBody.innerHTML += `
      <tr class="border-b border-slate-100 hover:bg-slate-50/50">
        <td class="p-3 font-bold text-slate-900">${escapeHtml(it.name)}</td>
        <td class="p-3 text-slate-500">${escapeHtml(it.description || '—')}</td>
        <td class="p-3 text-center font-bold text-slate-800">${it.quantity}</td>
        <td class="p-3 text-right font-semibold">${formatCurrency(it.price, quote.currency)}</td>
        <td class="p-3 text-center text-rose-500 font-semibold">${it.discount}%</td>
        <td class="p-3 text-center text-slate-500">${it.tax}%</td>
        <td class="p-3 text-right font-extrabold text-slate-900">${formatCurrency(it.total, quote.currency)}</td>
      </tr>
    `;
  });

  // Financial values
  document.getElementById('detail-subtotal').textContent = formatCurrency(quote.subtotal, quote.currency);
  document.getElementById('detail-discount').textContent = `-${formatCurrency(quote.discountAmount, quote.currency)}`;
  document.getElementById('detail-tax').textContent = `+formatCurrency(${quote.taxAmount}, ${quote.currency})`.startsWith('+format') ? `+${formatCurrency(quote.taxAmount, quote.currency)}` : `+${formatCurrency(quote.taxAmount, quote.currency)}`;
  document.getElementById('detail-shipping').textContent = `+${formatCurrency(quote.shipping, quote.currency)}`;
  document.getElementById('detail-total').textContent = formatCurrency(quote.total, quote.currency);

  // T&C Panel
  const tcPanel = document.getElementById('detail-terms-panel');
  tcPanel.innerHTML = '';
  if (quote.deliveryTerms) tcPanel.innerHTML += `<p class="text-xs text-slate-500 font-medium"><strong class="text-slate-800 font-bold block mb-0.5">Delivery Terms</strong>${escapeHtml(quote.deliveryTerms)}</p>`;
  if (quote.paymentTerms) tcPanel.innerHTML += `<p class="text-xs text-slate-500 font-medium"><strong class="text-slate-800 font-bold block mb-0.5">Payment Terms</strong>${escapeHtml(quote.paymentTerms)}</p>`;
  if (quote.warrantyConditions) tcPanel.innerHTML += `<p class="text-xs text-slate-500 font-medium"><strong class="text-slate-800 font-bold block mb-0.5">Warranty Conditions</strong>${escapeHtml(quote.warrantyConditions)}</p>`;

  // Notes Panel
  const notesPanel = document.getElementById('detail-notes-panel');
  if (quote.notes) {
    notesPanel.innerHTML = `<strong class="text-slate-800 block font-bold mb-1">Notes:</strong>${escapeHtml(quote.notes)}`;
    notesPanel.classList.remove('hidden');
  } else {
    notesPanel.classList.add('hidden');
  }

  // Rejection reason panel
  const rejectionPanel = document.getElementById('detail-rejection-panel');
  if (quote.status === 'rejected' && quote.rejectionReason) {
    document.getElementById('detail-rejection-reason').textContent = quote.rejectionReason;
    rejectionPanel.classList.remove('hidden');
  } else {
    rejectionPanel.classList.add('hidden');
  }

  // Logs / Activities
  const activityContainer = document.getElementById('detail-activity-history');
  activityContainer.innerHTML = '';
  quote.activities.forEach(act => {
    activityContainer.innerHTML += `
      <div class="flex items-center justify-between text-[11px] font-semibold border-b border-slate-50 pb-2">
        <span class="text-slate-400 font-bold">${act.date}</span>
        <span class="text-slate-700">Action: <span class="text-blue-600 font-bold capitalize">${act.type}</span> by ${escapeHtml(act.user)}</span>
      </div>
    `;
  });

  // Render Workflow buttons based on status
  const actionsContainer = document.getElementById('detail-workflow-actions');
  actionsContainer.innerHTML = '';

  const printBtn = `<button onclick="window.print()" class="no-print border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer"><i data-lucide="printer" class="w-4 h-4"></i> Print PDF</button>`;
  
  if (quote.status !== 'accepted' && quote.status !== 'converted' && quote.status !== 'cancelled') {
    actionsContainer.innerHTML += `
      <button onclick="window.openQuotationForm('${quote.id}')" class="no-print border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl transition-all cursor-pointer">Edit</button>
      <button onclick="window.duplicateQuotation('${quote.id}')" class="no-print border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl transition-all cursor-pointer">Duplicate</button>
      <button onclick="window.updateQuotationStatus('${quote.id}', 'sent')" class="no-print bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-all shadow-md shadow-blue-500/10 cursor-pointer">Send</button>
      <button onclick="window.updateQuotationStatus('${quote.id}', 'accepted')" class="no-print bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-all shadow-md shadow-emerald-500/10 cursor-pointer">Mark Accepted</button>
      <button onclick="window.promptRejection('${quote.id}')" class="no-print border border-rose-250 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold px-3 py-2 rounded-xl transition-all cursor-pointer">Mark Rejected</button>
      <button onclick="window.updateQuotationStatus('${quote.id}', 'cancelled')" class="no-print border border-slate-250 bg-slate-50 hover:bg-slate-100 text-slate-500 text-xs font-semibold px-3 py-2 rounded-xl transition-all cursor-pointer">Cancel</button>
    `;
  } else if (quote.status === 'accepted') {
    actionsContainer.innerHTML += `
      <button onclick="window.convertQuotationToSalesOrder('${quote.id}')" class="no-print bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-all shadow-md shadow-violet-500/10 cursor-pointer">Convert to Sales Order</button>
      <button onclick="window.promptRejection('${quote.id}')" class="no-print border border-rose-250 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold px-3 py-2 rounded-xl transition-all cursor-pointer">Mark Rejected</button>
    `;
  }

  actionsContainer.innerHTML += printBtn;
  window.showDetailView();
  initIcons();
};

window.duplicateQuotation = function(id) {
  const list = getQuotationsList();
  const quote = list.find(q => q.id === id);
  if (!quote) return;

  const newId = `QT-2026-${String(10000 + list.length + 1).slice(1)}`;
  const duplicate = JSON.parse(JSON.stringify(quote));
  duplicate.id = newId;
  duplicate.status = 'draft';
  duplicate.date = todayIso();
  duplicate.validUntil = todayIso();
  duplicate.lastUpdated = todayIso();
  duplicate.activities = [
    { date: todayIso() + " " + new Date().toTimeString().slice(0,8), type: "Duplicated from " + quote.id, user: "System" }
  ];

  list.push(duplicate);
  saveAppState();
  window.showMainView();
};

window.promptRejection = function(id) {
  const reason = prompt("Please provide a rejection reason:");
  if (reason !== null) {
    window.updateQuotationStatus(id, 'rejected', reason);
  }
};

window.updateQuotationStatus = function(id, nextStatus, rejectionReason = '') {
  const list = getQuotationsList();
  const quote = list.find(q => q.id === id);
  if (!quote) return;

  quote.status = nextStatus;
  quote.rejectionReason = rejectionReason;
  quote.lastUpdated = todayIso();
  quote.activities.push({
    date: todayIso() + " " + new Date().toTimeString().slice(0,8),
    type: `Status updated to ${nextStatus}`,
    user: quote.ownerName
  });

  saveAppState();
  window.viewQuotationDetail(id);
};

// ----------------------------------------------------
// SALES ORDER CONVERSION WORKFLOW
// ----------------------------------------------------
window.convertQuotationToSalesOrder = function(id) {
  const list = getQuotationsList();
  const quote = list.find(q => q.id === id);
  if (!quote) return;

  // Check if salesOrders list exists in appState
  if (!appState.salesOrders) {
    appState.salesOrders = [
      { id: "SO-2026-0001", customerId: 1, customerName: "Bell Labs", date: "2026-06-18", total: 1250.00, deliveryStatus: "pending", status: "confirmed" }
    ];
  }

  const nextSoId = `SO-2026-${String(10000 + appState.salesOrders.length + 1).slice(1)}`;
  
  const newSo = {
    id: nextSoId,
    customerId: quote.customerId,
    customerName: quote.customerName,
    date: todayIso(),
    total: quote.total,
    deliveryStatus: "pending",
    status: "confirmed",
    // Link meta fields
    quotationId: quote.id,
    items: quote.items,
    notes: quote.notes,
    currency: quote.currency
  };

  appState.salesOrders.push(newSo);
  quote.status = 'accepted';
  quote.activities.push({
    date: todayIso() + " " + new Date().toTimeString().slice(0,8),
    type: `Converted to Sales Order ${nextSoId}`,
    user: quote.ownerName
  });

  saveAppState();
  alert(`Quotation ${quote.id} successfully converted to Sales Order ${nextSoId}!`);
  window.viewQuotationDetail(quote.id);
};

// ----------------------------------------------------
// SEARCH, FILTER & RENDER ENGINE
// ----------------------------------------------------
window.renderTable = function() {
  const tbody = document.getElementById('sales-quotations-body');
  if (!tbody) return;

  tbody.innerHTML = '';
  const search = document.getElementById('sales-quotations-search-input')?.value.toLowerCase() || '';

  const filterStatus = document.getElementById('filter-status')?.value || 'all';
  const filterCust = document.getElementById('filter-customer')?.value || 'all';
  const filterRep = document.getElementById('filter-salesperson')?.value || 'all';
  const filterDeal = document.getElementById('filter-deal')?.value || 'all';
  const filterDateStart = document.getElementById('filter-date-start')?.value || '';
  const filterDateEnd = document.getElementById('filter-date-end')?.value || '';
  const filterAmtMin = parseFloat(document.getElementById('filter-amount-min')?.value || '0');
  const filterAmtMax = parseFloat(document.getElementById('filter-amount-max')?.value || 'Infinity');
  const filterExpiry = document.getElementById('filter-expiry-date')?.value || '';

  const filtered = getQuotationsList().filter(item => {
    // Search keyword
    const matchSearch = !search || 
      item.id.toLowerCase().includes(search) ||
      item.customerName.toLowerCase().includes(search) ||
      (item.dealName && item.dealName.toLowerCase().includes(search));

    // Standard Select fields
    const matchStatus = filterStatus === 'all' || item.status === filterStatus;
    const matchCust = filterCust === 'all' || String(item.customerId) === filterCust;
    const matchRep = filterRep === 'all' || item.ownerId === filterRep;
    const matchDeal = filterDeal === 'all' || item.dealId === filterDeal;

    // Dates
    const matchDateStart = !filterDateStart || item.date >= filterDateStart;
    const matchDateEnd = !filterDateEnd || item.date <= filterDateEnd;
    const matchExpiry = !filterExpiry || item.validUntil === filterExpiry;

    // Amount Range
    const totalAmt = item.total || 0;
    const matchAmt = totalAmt >= filterAmtMin && (filterAmtMax === 0 || isNaN(filterAmtMax) || totalAmt <= filterAmtMax);

    return matchSearch && matchStatus && matchCust && matchRep && matchDeal && matchDateStart && matchDateEnd && matchExpiry && matchAmt;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" class="p-8 text-center text-slate-400 font-bold">No records found matching filters</td></tr>`;
    return;
  }

  filtered.forEach(item => {
    tbody.innerHTML += `
      <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100">
        <td class="p-4 font-bold text-slate-900 flex items-center gap-1.5">
          <span class="hover:underline cursor-pointer" onclick="window.viewQuotationDetail('${item.id}')">${escapeHtml(item.id)}</span>
        </td>
        <td class="p-4">${escapeHtml(item.customerName)}</td>
        <td class="p-4 text-slate-500">${escapeHtml(item.dealName || '—')}</td>
        <td class="p-4">${escapeHtml(item.date)}</td>
        <td class="p-4">${escapeHtml(item.validUntil)}</td>
        <td class="p-4 font-extrabold text-slate-900 text-right">${formatCurrency(item.total, item.currency)}</td>
        <td class="p-4">
          <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
            item.status === 'accepted' ? 'bg-emerald-50 text-emerald-600' :
            item.status === 'sent' ? 'bg-blue-50 text-blue-600' :
            item.status === 'viewed' ? 'bg-indigo-50 text-indigo-600' :
            item.status === 'rejected' ? 'bg-rose-50 text-rose-600' :
            item.status === 'expired' ? 'bg-amber-50 text-amber-600' :
            item.status === 'cancelled' ? 'bg-slate-100 text-slate-500' : 'bg-slate-50 text-slate-500'
          }">${escapeHtml(item.status)}</span>
        </td>
        <td class="p-4 text-slate-500">${escapeHtml(item.ownerName)}</td>
        <td class="p-4 text-slate-400 font-semibold">${escapeHtml(item.lastUpdated || item.date)}</td>
        <td class="p-4 text-center">
          <div class="flex items-center justify-center gap-2">
            <button onclick="window.viewQuotationDetail('${item.id}')" class="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[10px] font-extrabold text-slate-700 transition-all cursor-pointer">View</button>
            <button onclick="window.openQuotationForm('${item.id}')" class="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[10px] font-extrabold text-slate-700 transition-all cursor-pointer">Edit</button>
            <button onclick="window.deleteQuotation('${item.id}')" class="px-2.5 py-1 rounded-lg border border-rose-200 bg-white hover:bg-rose-50 text-[10px] font-extrabold text-rose-600 transition-all cursor-pointer">Delete</button>
          </div>
        </td>
      </tr>
    `;
  });
};

window.deleteQuotation = function(id) {
  if (confirm(`Are you sure you want to delete quotation ${id}?`)) {
    const list = getQuotationsList();
    const idx = list.findIndex(q => q.id === id);
    if (idx !== -1) {
      list.splice(idx, 1);
      saveAppState();
      renderAll();
    }
  }
};

function renderMetrics() {
  const list = getQuotationsList();
  const metricsContainer = document.getElementById('sales-quotations-metrics');
  if (!metricsContainer) return;

  const count = list.length;
  const draft = list.filter(q => q.status === 'draft').length;
  const sent = list.filter(q => q.status === 'sent').length;
  const viewed = list.filter(q => q.status === 'viewed').length;
  const accepted = list.filter(q => q.status === 'accepted').length;
  const rejected = list.filter(q => q.status === 'rejected').length;
  const expired = list.filter(q => q.status === 'expired').length;
  const totalVal = list.reduce((sum, item) => sum + (item.total || 0), 0);

  // Conversion rate: Accepted / Total
  const conversionRate = count > 0 ? ((accepted / count) * 100).toFixed(1) : '0.0';

  metricsContainer.innerHTML = `
    <div class="bg-white p-4 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Total Quotations</span>
      <span class="text-base font-extrabold text-slate-950 block mt-1">${count}</span>
    </div>
    <div class="bg-white p-4 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Drafts</span>
      <span class="text-base font-extrabold text-slate-600 block mt-1">${draft}</span>
    </div>
    <div class="bg-white p-4 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Sent</span>
      <span class="text-base font-extrabold text-blue-600 block mt-1">${sent}</span>
    </div>
    <div class="bg-white p-4 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Viewed</span>
      <span class="text-base font-extrabold text-indigo-600 block mt-1">${viewed}</span>
    </div>
    <div class="bg-white p-4 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Accepted / Conversion</span>
      <span class="text-base font-extrabold text-emerald-600 block mt-1">${accepted} <span class="text-[10px] text-slate-400 font-semibold">(${conversionRate}%)</span></span>
    </div>
    <div class="bg-white p-4 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Declined / Expired</span>
      <span class="text-base font-extrabold text-rose-600 block mt-1">${rejected} <span class="text-[10px] text-amber-500 font-semibold">/ ${expired}</span></span>
    </div>
    <div class="bg-white p-4 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Total Pipeline Value</span>
      <span class="text-base font-extrabold text-violet-600 block mt-1">${formatCurrency(totalVal)}</span>
    </div>
  `;
}

function renderAll() {
  populateDropdowns();
  renderMetrics();
  window.renderTable();
  initIcons();
}

// ----------------------------------------------------
// DOCUMENT INIT
// ----------------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
  await appReadyPromise;
  renderAll();
});
