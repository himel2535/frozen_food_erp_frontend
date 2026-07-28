import { appReadyPromise, appState, saveAppState, initIcons, getInventoryWarehouses } from '/js/shared.js';
import { getCustomerList, ensureCrmState, createPaymentRecord, createActivityEntry } from '/js/crm-service.js';

function escapeHtml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function formatCurrency(value) {
  return `$${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

// ----------------------------------------------------
// STATE INITIALIZATION
// ----------------------------------------------------
function getOrders() {
  if (!appState.salesOrders) {
    appState.salesOrders = [
      {
        id: "SO-2026-0001",
        customerId: 1,
        customerName: "Bell Labs",
        date: "2026-06-18",
        expectedDeliveryDate: "2026-06-28",
        warehouse: "Main Warehouse",
        salesperson: "Marcus Wright",
        shippingAddress: "100 Innovation Way, Murray Hill, NJ",
        shippingContactName: "Alexander Graham",
        shippingContactPhone: "+1 555-0199",
        quoteRef: "",
        notes: "Deliver by truck. Handle with care.",
        subtotal: 1250.00,
        discountAmount: 0.00,
        taxAmount: 0.00,
        shippingCost: 0.00,
        total: 1250.00,
        status: "confirmed",
        deliveryStatus: "pending",
        invoiceStatus: "not",
        paymentStatus: "unpaid",
        cancellationReason: "",
        isReserved: true,
        items: [
          { productId: 1, name: "Premium Cotton Yarn", quantity: 100, price: 12.50, discount: 0, tax: 0, total: 1250.00 }
        ],
        statusHistory: [
          { status: "draft", date: "2026-06-18", notes: "Initial creation." },
          { status: "confirmed", date: "2026-06-18", notes: "Order confirmed by sales team." }
        ]
      },
      {
        id: "SO-2026-0002",
        customerId: 3,
        customerName: "General Electric",
        date: "2026-06-19",
        expectedDeliveryDate: "2026-06-30",
        warehouse: "Warehouse A",
        salesperson: "Marcus Wright",
        shippingAddress: "3135 Easton Turnpike, Fairfield, CT",
        shippingContactName: "Thomas Edison",
        shippingContactPhone: "+1 555-9832",
        quoteRef: "QT-2026-0002",
        notes: "Express delivery.",
        subtotal: 8880.00,
        discountAmount: 0.00,
        taxAmount: 0.00,
        shippingCost: 20.00,
        total: 8900.00,
        status: "completed",
        deliveryStatus: "delivered",
        invoiceStatus: "fully",
        paymentStatus: "paid",
        cancellationReason: "",
        isReserved: false,
        items: [
          { productId: 3, name: "Silk Satin Blend Fabric", quantity: 370, price: 24.00, discount: 0, tax: 0, total: 8880.00 }
        ],
        statusHistory: [
          { status: "draft", date: "2026-06-19", notes: "Created from quotation QT-2026-0002." },
          { status: "confirmed", date: "2026-06-19", notes: "Order confirmed." },
          { status: "completed", date: "2026-06-20", notes: "Delivered and settled." }
        ]
      }
    ];
    saveAppState();
  }
  appState.salesOrders.forEach((so) => {
    if (so.deliveryStatus === 'partially') so.deliveryStatus = 'partial';
  });
  return appState.salesOrders;
}

function getCustomers() {
  ensureCrmState(appState);
  return getCustomerList(appState);
}

function getSalespersons() {
  return (appState.employees || []).filter(e => e.department === 'Sales' || e.designation?.toLowerCase().includes('sales'));
}

function getInventoryProduct(productId) {
  return (appState.inventory || []).find(p => String(p.id) === String(productId)) || null;
}

function getWarehouseNames() {
  const sharedNames = getInventoryWarehouses().map((warehouse) => warehouse.name);
  const orderNames = getOrders().map((order) => order.warehouse).filter(Boolean);
  return [...new Set([...sharedNames, ...orderNames])];
}

function renderWarehouseOptions(selectId, includeAllOption = false, selectedValue = '') {
  const select = document.getElementById(selectId);
  if (!select) return;

  const optionMarkup = getWarehouseNames().map((warehouseName) => (
    `<option value="${escapeHtml(warehouseName)}">${escapeHtml(warehouseName)}</option>`
  ));

  select.innerHTML = `${includeAllOption ? '<option value="all">All Warehouses</option>' : ''}${optionMarkup.join('')}`;

  if (selectedValue && getWarehouseNames().includes(selectedValue)) {
    select.value = selectedValue;
  } else if (includeAllOption) {
    select.value = 'all';
  } else if (select.options.length > 0) {
    select.selectedIndex = 0;
  }
}

// ----------------------------------------------------
// VIEW NAVIGATION
// ----------------------------------------------------
window.showMainView = function() {
  document.getElementById('sales-orders-main-view').classList.remove('hidden');
  document.getElementById('sales-orders-form-view').classList.add('hidden');
  document.getElementById('sales-orders-detail-view').classList.add('hidden');
  renderAll();
};

window.showFormView = function() {
  document.getElementById('sales-orders-main-view').classList.add('hidden');
  document.getElementById('sales-orders-form-view').classList.remove('hidden');
  document.getElementById('sales-orders-detail-view').classList.add('hidden');
};

window.showDetailView = function(orderId) {
  document.getElementById('sales-orders-main-view').classList.add('hidden');
  document.getElementById('sales-orders-form-view').classList.add('hidden');
  document.getElementById('sales-orders-detail-view').classList.remove('hidden');
  window.openOrderDetail(orderId);
};

// ----------------------------------------------------
// FORM & ROW BUILDERS
// ----------------------------------------------------
window.openOrdersForm = function(editId = null) {
  const form = document.getElementById('sales-orders-form');
  if (form) form.reset();

  const titleHeader = document.getElementById('sales-order-form-header');
  const editIdInput = document.getElementById('edit-order-id');

  // Customer dropdown
  const customerSelect = document.getElementById('input-customer');
  customerSelect.innerHTML = `<option value="" disabled selected>${window.t ? window.t('common.select_customer') : 'Select Customer'}</option>`;
  getCustomers().forEach(c => {
    customerSelect.innerHTML += `<option value="${c.id}">${escapeHtml(c.company)}</option>`;
  });

  // Salesperson dropdown
  const repSelect = document.getElementById('input-salesperson');
  repSelect.innerHTML = '<option value="" disabled selected>Select Salesperson</option>';
  const salesReps = getSalespersons();
  if (salesReps.length) {
    salesReps.forEach(r => {
      repSelect.innerHTML += `<option value="${escapeHtml(r.name)}">${escapeHtml(r.name)} (${escapeHtml(r.designation)})</option>`;
    });
  } else {
    repSelect.innerHTML += `<option value="Marcus Wright">Marcus Wright</option>`;
  }

  // Quote References
  const quoteSelect = document.getElementById('input-quote-ref');
  quoteSelect.innerHTML = '<option value="">No Reference</option>';
  if (appState.salesQuotations) {
    appState.salesQuotations.forEach(q => {
      quoteSelect.innerHTML += `<option value="${escapeHtml(q.id)}">${escapeHtml(q.id)} (${escapeHtml(q.customerName)} - ${escapeHtml(q.status)})</option>`;
    });
  }

  renderWarehouseOptions('input-warehouse', false);

  // Date defaults
  document.getElementById('input-date').value = todayIso();
  document.getElementById('input-expected-delivery').value = '';
  document.getElementById('input-shipping-address').value = '';
  document.getElementById('input-shipping-contact-name').value = '';
  document.getElementById('input-shipping-contact-phone').value = '';
  document.getElementById('notes').value = '';
  document.getElementById('input-shipping').value = '0.00';
  document.getElementById('input-status').value = 'draft';
  document.getElementById('form-cancellation-reason-container').classList.add('hidden');
  document.getElementById('input-cancellation-reason').value = '';

  const itemsTbody = document.getElementById('order-items-tbody');
  itemsTbody.innerHTML = '';

  if (editId) {
    titleHeader.setAttribute('title', 'Edit Sales Order');
    editIdInput.value = editId;
    const order = getOrders().find(o => o.id === editId);
    if (order) {
      customerSelect.value = order.customerId;
      quoteSelect.value = order.quoteRef || '';
      repSelect.value = order.salesperson;
      document.getElementById('input-date').value = order.date;
      document.getElementById('input-expected-delivery').value = order.expectedDeliveryDate || '';
      renderWarehouseOptions('input-warehouse', false, order.warehouse);
      document.getElementById('input-shipping-address').value = order.shippingAddress || '';
      document.getElementById('input-shipping-contact-name').value = order.shippingContactName || '';
      document.getElementById('input-shipping-contact-phone').value = order.shippingContactPhone || '';
      document.getElementById('notes').value = order.notes || '';
      document.getElementById('input-shipping').value = Number(order.shippingCost || 0).toFixed(2);
      document.getElementById('input-status').value = order.status;

      if (order.status === 'cancelled') {
        document.getElementById('form-cancellation-reason-container').classList.remove('hidden');
        document.getElementById('input-cancellation-reason').value = order.cancellationReason || '';
      }

      order.items.forEach(item => {
        window.addOrderItemRow(item);
      });
    }
  } else {
    titleHeader.setAttribute('title', 'Create Sales Order');
    editIdInput.value = '';
    window.addOrderItemRow();
  }

  window.calcOrderTotals();
  window.showFormView();
};

window.addOrderItemRow = function(itemData = null) {
  const tbody = document.getElementById('order-items-tbody');
  if (!tbody) return;

  const rowId = `item-row-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const tr = document.createElement('tr');
  tr.id = rowId;
  tr.className = 'border-b border-slate-100 items-row';

  const productOptions = [
    '<option value="" disabled selected>Select SKU Product</option>',
    ...(appState.inventory || []).map(p => `<option value="${p.id}" data-price="${p.price}" data-stock="${p.stock}">${escapeHtml(p.name)} (${formatCurrency(p.price)} • Stock: ${p.stock})</option>`)
  ].join('');

  tr.innerHTML = `
    <td class="p-2">
      <select class="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:outline-none item-product-select" onchange="window.handleProductRowChange('${rowId}', this)">
        ${productOptions}
      </select>
    </td>
    <td class="p-2">
      <input type="text" class="w-full px-2 py-1.5 border border-slate-200 bg-slate-50 rounded-lg focus:outline-none item-desc-input" placeholder="Description...">
    </td>
    <td class="p-2 text-center">
      <input type="number" min="1" value="1" class="w-20 px-2 py-1.5 border border-slate-200 bg-slate-50 rounded-lg text-center focus:outline-none item-qty-input" oninput="window.calcOrderTotals()" disabled>
    </td>
    <td class="p-2 text-right">
      <input type="number" step="0.01" min="0" value="0.00" class="w-24 px-2 py-1.5 border border-slate-200 bg-slate-50 rounded-lg text-right focus:outline-none item-price-input" oninput="window.calcOrderTotals()" disabled>
    </td>
    <td class="p-2 text-center">
      <input type="number" min="0" max="100" value="0" class="w-14 px-2 py-1.5 border border-slate-200 bg-slate-50 rounded-lg text-center focus:outline-none item-disc-input" oninput="window.calcOrderTotals()" disabled>
    </td>
    <td class="p-2 text-center">
      <input type="number" min="0" max="100" value="0" class="w-14 px-2 py-1.5 border border-slate-200 bg-slate-50 rounded-lg text-center focus:outline-none item-tax-input" oninput="window.calcOrderTotals()" disabled>
    </td>
    <td class="p-2 text-right font-extrabold text-slate-800 item-subtotal-span">${formatCurrency(0)}</td>
    <td class="p-2 text-center">
      <button type="button" onclick="document.getElementById('${rowId}').remove(); window.calcOrderTotals();" class="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors text-[11px]">Remove</button>
    </td>
  `;

  tbody.appendChild(tr);

  // If itemData is provided, prefill the row
  if (itemData) {
    const select = tr.querySelector('.item-product-select');
    select.value = itemData.productId;
    tr.querySelector('.item-qty-input').disabled = false;
    tr.querySelector('.item-price-input').disabled = false;
    tr.querySelector('.item-disc-input').disabled = false;
    tr.querySelector('.item-tax-input').disabled = false;

    tr.querySelector('.item-qty-input').value = itemData.quantity;
    tr.querySelector('.item-price-input').value = Number(itemData.price).toFixed(2);
    tr.querySelector('.item-disc-input').value = itemData.discount || 0;
    tr.querySelector('.item-tax-input').value = itemData.tax || 0;
    tr.querySelector('.item-desc-input').value = itemData.description || '';
  }
};

window.handleProductRowChange = function(rowId, selectElement) {
  const row = document.getElementById(rowId);
  if (!row) return;
  const selectedOpt = selectElement.options[selectElement.selectedIndex];
  const price = Number(selectedOpt.getAttribute('data-price') || 0);

  row.querySelector('.item-qty-input').disabled = false;
  row.querySelector('.item-price-input').disabled = false;
  row.querySelector('.item-disc-input').disabled = false;
  row.querySelector('.item-tax-input').disabled = false;

  row.querySelector('.item-price-input').value = price.toFixed(2);
  window.calcOrderTotals();
};

window.calcOrderTotals = function() {
  const rows = document.querySelectorAll('.items-row');
  let subtotal = 0;
  let totalDiscount = 0;
  let totalTax = 0;

  rows.forEach(row => {
    const select = row.querySelector('.item-product-select');
    if (!select || !select.value) return;

    const qty = Number(row.querySelector('.item-qty-input').value || 0);
    const price = Number(row.querySelector('.item-price-input').value || 0);
    const discPercent = Number(row.querySelector('.item-disc-input').value || 0);
    const taxPercent = Number(row.querySelector('.item-tax-input').value || 0);

    const lineSub = qty * price;
    const lineDisc = lineSub * (discPercent / 100);
    const lineTax = (lineSub - lineDisc) * (taxPercent / 100);
    const lineTotal = lineSub - lineDisc + lineTax;

    row.querySelector('.item-subtotal-span').textContent = formatCurrency(lineTotal);

    subtotal += lineSub;
    totalDiscount += lineDisc;
    totalTax += lineTax;
  });

  const shippingCost = Number(document.getElementById('input-shipping').value || 0);
  const grandTotal = subtotal - totalDiscount + totalTax + shippingCost;

  document.getElementById('order-calc-subtotal').textContent = formatCurrency(subtotal);
  document.getElementById('order-calc-discount').textContent = `-${formatCurrency(totalDiscount)}`;
  document.getElementById('order-calc-tax').textContent = `+${formatCurrency(totalTax)}`;
  document.getElementById('order-calc-total').textContent = formatCurrency(grandTotal);
};

window.toggleAdvancedFields = function() {
  const section = document.getElementById('sales-orders-advanced-section');
  const icon = document.getElementById('sales-orders-advanced-icon');
  if (section.classList.contains('hidden')) {
    section.classList.remove('hidden');
    icon.style.transform = 'rotate(180deg)';
  } else {
    section.classList.add('hidden');
    icon.style.transform = 'rotate(0deg)';
  }
};

// Toggle reason field if cancelled chosen in form status
document.getElementById('input-status')?.addEventListener('change', (e) => {
  const container = document.getElementById('form-cancellation-reason-container');
  if (e.target.value === 'cancelled') {
    container.classList.remove('hidden');
    document.getElementById('input-cancellation-reason').setAttribute('required', 'true');
  } else {
    container.classList.add('hidden');
    document.getElementById('input-cancellation-reason').removeAttribute('required');
  }
});

// ----------------------------------------------------
// FORM SUBMIT
// ----------------------------------------------------
window.handleSubmit = function(event) {
  event.preventDefault();
  const orders = getOrders();

  const editId = document.getElementById('edit-order-id').value;
  const customerSelect = document.getElementById('input-customer');
  const customerId = Number(customerSelect.value);
  const customerName = customerSelect.options[customerSelect.selectedIndex].text;

  const rows = document.querySelectorAll('.items-row');
  const items = [];
  let subtotal = 0;
  let discountAmount = 0;
  let taxAmount = 0;

  for (const row of rows) {
    const select = row.querySelector('.item-product-select');
    if (!select || !select.value) continue;

    const productId = Number(select.value);
    const productName = select.options[select.selectedIndex].text.split(' ($')[0];
    const qty = Number(row.querySelector('.item-qty-input').value || 0);
    const price = Number(row.querySelector('.item-price-input').value || 0);
    const discPercent = Number(row.querySelector('.item-disc-input').value || 0);
    const taxPercent = Number(row.querySelector('.item-tax-input').value || 0);
    const description = row.querySelector('.item-desc-input').value || '';

    const lineSub = qty * price;
    const lineDisc = lineSub * (discPercent / 100);
    const lineTax = (lineSub - lineDisc) * (taxPercent / 100);
    const lineTotal = lineSub - lineDisc + lineTax;

    items.push({
      productId,
      name: productName,
      quantity: qty,
      price,
      discount: discPercent,
      tax: taxPercent,
      description,
      total: lineTotal
    });

    subtotal += lineSub;
    discountAmount += lineDisc;
    taxAmount += lineTax;
  }

  if (!items.length) {
    alert('Please add at least one line item.');
    return;
  }

  const shippingCost = Number(document.getElementById('input-shipping').value || 0);
  const total = subtotal - discountAmount + taxAmount + shippingCost;
  const status = document.getElementById('input-status').value;
  const date = document.getElementById('input-date').value || todayIso();

  let orderRecord;
  if (editId) {
    orderRecord = orders.find(o => o.id === editId);
    if (!orderRecord) return;

    orderRecord.customerId = customerId;
    orderRecord.customerName = customerName;
    orderRecord.date = date;
    orderRecord.expectedDeliveryDate = document.getElementById('input-expected-delivery').value;
    orderRecord.warehouse = document.getElementById('input-warehouse').value;
    orderRecord.salesperson = document.getElementById('input-salesperson').value;
    orderRecord.shippingAddress = document.getElementById('input-shipping-address').value;
    orderRecord.shippingContactName = document.getElementById('input-shipping-contact-name').value;
    orderRecord.shippingContactPhone = document.getElementById('input-shipping-contact-phone').value;
    orderRecord.quoteRef = document.getElementById('input-quote-ref').value;
    orderRecord.notes = document.getElementById('notes').value;
    orderRecord.items = items;
    orderRecord.subtotal = subtotal;
    orderRecord.discountAmount = discountAmount;
    orderRecord.taxAmount = taxAmount;
    orderRecord.shippingCost = shippingCost;
    orderRecord.total = total;

    if (status !== orderRecord.status) {
      orderRecord.status = status;
      orderRecord.statusHistory.push({
        status,
        date: todayIso(),
        notes: `Status updated via inline editing to: ${status}`
      });
    }

    if (status === 'cancelled') {
      orderRecord.cancellationReason = document.getElementById('input-cancellation-reason').value;
      orderRecord.isReserved = false;
    }
  } else {
    const nextIdNum = orders.length + 1;
    const orderId = `SO-2026-${String(10000 + nextIdNum).slice(1)}`;

    orderRecord = {
      id: orderId,
      customerId,
      customerName,
      date,
      expectedDeliveryDate: document.getElementById('input-expected-delivery').value,
      warehouse: document.getElementById('input-warehouse').value,
      salesperson: document.getElementById('input-salesperson').value,
      shippingAddress: document.getElementById('input-shipping-address').value,
      shippingContactName: document.getElementById('input-shipping-contact-name').value,
      shippingContactPhone: document.getElementById('input-shipping-contact-phone').value,
      quoteRef: document.getElementById('input-quote-ref').value,
      notes: document.getElementById('notes').value,
      items,
      subtotal,
      discountAmount,
      taxAmount,
      shippingCost,
      total,
      status,
      deliveryStatus: 'pending',
      invoiceStatus: 'not',
      paymentStatus: 'unpaid',
      cancellationReason: '',
      isReserved: status === 'confirmed' || status === 'processing',
      statusHistory: [
        { status: 'draft', date: todayIso(), notes: 'Order created.' }
      ]
    };

    if (status !== 'draft') {
      orderRecord.statusHistory.push({
        status,
        date: todayIso(),
        notes: `Initial state set to: ${status}`
      });
    }

    orders.push(orderRecord);
  }

  // Stock availability check / reservation
  if (orderRecord.status === 'confirmed' || orderRecord.status === 'processing') {
    let warningMsg = '';
    orderRecord.items.forEach(item => {
      const invProduct = getInventoryProduct(item.productId);
      if (invProduct && item.quantity > invProduct.stock) {
        warningMsg += `\n- SKU: ${invProduct.sku} ("${invProduct.name}"): Requested: ${item.quantity}, Available: ${invProduct.stock}`;
      }
    });

    if (warningMsg) {
      alert(`⚠️ Stock Availability Warning: Fulfillment inventory is insufficient for:${warningMsg}\n\nThe order will be confirmed, but stock reservation is in pending status.`);
      orderRecord.isReserved = false;
    } else {
      orderRecord.isReserved = true;
    }
  }

  saveAppState();
  window.showMainView();
};

// ----------------------------------------------------
// DETAILS VIEW RENDERING
// ----------------------------------------------------
window.openOrderDetail = function(orderId) {
  const order = getOrders().find(o => o.id === orderId);
  if (!order) return;

  ensureCrmState(appState);
  const profile = getCustomers().find(c => Number(c.id) === Number(order.customerId));

  document.getElementById('detail-order-number').textContent = order.id;
  document.getElementById('detail-order-status-pill').textContent = order.status;
  document.getElementById('detail-order-status-pill').className = `px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
    order.status === 'completed' || order.status === 'delivered' ? 'bg-emerald-50 text-emerald-600' :
    order.status === 'confirmed' || order.status === 'processing' ? 'bg-blue-50 text-blue-600' :
    order.status === 'cancelled' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-500'
  }`;

  document.getElementById('detail-order-date').textContent = `Order Date: ${order.date}`;
  document.getElementById('detail-expected-date').textContent = `Expected Delivery: ${order.expectedDeliveryDate || 'N/A'}`;
  document.getElementById('detail-quote-reference').textContent = order.quoteRef ? `Quote Reference: ${order.quoteRef}` : 'Quote Reference: —';

  // Client profile
  document.getElementById('detail-customer-company').textContent = order.customerName;
  document.getElementById('detail-customer-name').textContent = profile?.name || 'Walk-in customer';
  document.getElementById('detail-customer-email').textContent = profile?.email || 'N/A';
  document.getElementById('detail-customer-phone').textContent = profile?.phone || 'N/A';

  // Logistics
  document.getElementById('detail-salesperson-name').textContent = order.salesperson;
  document.getElementById('detail-warehouse-location').textContent = order.warehouse;
  document.getElementById('detail-shipping-address').textContent = order.shippingAddress || '—';
  document.getElementById('detail-shipping-contact').textContent = order.shippingContactName ? `${order.shippingContactName} (${order.shippingContactPhone})` : '—';

  // Ordered items tbody
  const itemsTbody = document.getElementById('detail-items-body');
  itemsTbody.innerHTML = order.items.map(item => `
    <tr class="border-b border-slate-100">
      <td class="p-3 font-bold text-slate-800">${escapeHtml(item.name)}</td>
      <td class="p-3 text-slate-500 font-medium">${escapeHtml(item.description || '—')}</td>
      <td class="p-3 text-center font-semibold text-slate-900">${item.quantity}</td>
      <td class="p-3 text-right font-semibold text-slate-700">${formatCurrency(item.price)}</td>
      <td class="p-3 text-center text-slate-400 font-medium">${item.discount || 0}%</td>
      <td class="p-3 text-center text-slate-400 font-medium">${item.tax || 0}%</td>
      <td class="p-3 text-right font-extrabold text-slate-900">${formatCurrency(item.total)}</td>
    </tr>
  `).join('');

  // Totals calculations
  document.getElementById('detail-subtotal').textContent = formatCurrency(order.subtotal);
  document.getElementById('detail-discount').textContent = `-${formatCurrency(order.discountAmount)}`;
  document.getElementById('detail-tax').textContent = `+${formatCurrency(order.taxAmount)}`;
  document.getElementById('detail-shipping').textContent = `+${formatCurrency(order.shippingCost)}`;
  document.getElementById('detail-total').textContent = formatCurrency(order.total);

  // Cancellation block
  const cancelPanel = document.getElementById('detail-cancellation-panel');
  if (order.status === 'cancelled') {
    cancelPanel.classList.remove('hidden');
    document.getElementById('detail-cancellation-reason').textContent = order.cancellationReason || 'No cancellation reason provided.';
  } else {
    cancelPanel.classList.add('hidden');
  }

  // Inventory Allocation status card
  const invAllocPanel = document.getElementById('detail-inventory-allocation-panel');
  let hasStockCheckErr = false;
  let itemsCheckHtml = '';
  order.items.forEach(item => {
    const invProduct = getInventoryProduct(item.productId);
    if (invProduct) {
      const isShortage = item.quantity > invProduct.stock;
      if (isShortage) hasStockCheckErr = true;
      itemsCheckHtml += `
        <div class="flex justify-between items-center text-[10px] border-b border-slate-100 py-1.5 font-medium">
          <span>${escapeHtml(item.name)}</span>
          <span class="${isShortage ? 'text-rose-600 font-bold' : 'text-slate-500'}">Req: ${item.quantity} / Avail: ${invProduct.stock}</span>
        </div>
      `;
    }
  });

  invAllocPanel.innerHTML = `
    <h4 class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Inventory Stock Allocations</h4>
    <div class="space-y-1">
      ${itemsCheckHtml}
    </div>
    <div class="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center gap-2">
      <span class="w-2.5 h-2.5 rounded-full ${order.isReserved ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}"></span>
      <span class="font-bold text-xs ${order.isReserved ? 'text-emerald-700' : 'text-amber-700'}">
        ${order.isReserved ? 'Inventory Stock Reserved' : hasStockCheckErr ? 'Allocation Blocked (Stock Shortage)' : 'Draft / Waiting Reservation'}
      </span>
    </div>
  `;

  // Shipping Notes
  document.getElementById('detail-notes-panel').innerHTML = `
    <h4 class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Delivery Notes</h4>
    <p>${escapeHtml(order.notes || 'No shipping comments recorded.')}</p>
  `;

  // Load history list logs
  const histLogs = document.getElementById('detail-activity-history');
  histLogs.innerHTML = (order.statusHistory || []).map(h => `
    <div class="flex items-start gap-3 border-l-2 border-slate-200 pl-4 py-1">
      <span class="text-[9px] font-bold text-slate-400 whitespace-nowrap min-w-[70px]">${h.date}</span>
      <span class="px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase ${
        h.status === 'confirmed' ? 'bg-blue-50 text-blue-600' :
        h.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'
      }">${h.status}</span>
      <span class="text-slate-500 font-medium">${escapeHtml(h.notes)}</span>
    </div>
  `).join('');

  // Linked deliveries
  const deliveryHist = document.getElementById('detail-delivery-history');
  const matchingDeliveries = (appState.salesDeliveries || []).filter(d => d.orderId === order.id);
  if (matchingDeliveries.length === 0) {
    deliveryHist.innerHTML = '<div class="text-[11px] font-medium text-slate-400">No shipments generated yet.</div>';
  } else {
    deliveryHist.innerHTML = matchingDeliveries.map(d => `
      <div class="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold flex items-center justify-between">
        <div>
          <span class="text-slate-900 font-bold block">${escapeHtml(d.id)}</span>
          <span class="text-[10px] text-slate-400 block font-medium mt-0.5">${escapeHtml(d.carrier)} • Tracking: ${escapeHtml(d.trackingNumber || 'N/A')}</span>
        </div>
        <span class="px-2 py-0.5 rounded-full text-[9px] font-bold ${
          d.status === 'delivered' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
        }">${escapeHtml(d.status)}</span>
      </div>
    `).join('');
  }

  // Linked invoices
  const invoiceHist = document.getElementById('detail-invoice-history');
  const matchingInvoices = (appState.invoices || []).filter(i => i.sourceId === order.id);
  if (matchingInvoices.length === 0) {
    invoiceHist.innerHTML = '<div class="text-[11px] font-medium text-slate-400">No invoices billed yet.</div>';
  } else {
    invoiceHist.innerHTML = matchingInvoices.map(inv => {
      // Find payments on this invoice
      const payments = (appState.paymentRecords || []).filter(p => p.invoiceId === inv.id);
      const paymentsHtml = payments.length ? `
        <div class="mt-2 pt-1.5 border-t border-slate-200 text-[10px] text-slate-500 font-medium space-y-1">
          <span class="font-bold text-slate-400">Settlements:</span>
          ${payments.map(p => `<div>- Paid ${formatCurrency(p.amount)} via ${p.method} (${p.date})</div>`).join('')}
        </div>
      ` : '';

      return `
        <div class="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold space-y-2">
          <div class="flex items-center justify-between">
            <div>
              <span class="text-slate-900 font-bold block">${escapeHtml(inv.id)}</span>
              <span class="text-[10px] text-slate-400 font-medium block">Total: ${formatCurrency(inv.total)} • Due: ${formatCurrency(inv.dueAmount)}</span>
            </div>
            <span class="px-2 py-0.5 rounded-full text-[9px] font-bold ${
              inv.status === 'paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-700'
            }">${escapeHtml(inv.status)}</span>
          </div>
          ${paymentsHtml}
          ${inv.dueAmount > 0 ? `
            <div class="pt-1 select-none">
              <button onclick="window.recordDirectPayment('${inv.id}')" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold py-1.5 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-500/10"><i data-lucide="credit-card" class="w-3.5 h-3.5"></i> Capture Payment</button>
            </div>
          ` : ''}
        </div>
      `;
    }).join('');
  }

  // Actions Workflow panel
  const actionPanel = document.getElementById('detail-workflow-actions');
  let buttons = [];

  if (order.status === 'draft') {
    buttons.push(`<button onclick="window.confirmOrderAction('${order.id}')" class="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-all shadow-md shadow-blue-500/10">Confirm Order</button>`);
  }

  if (order.status !== 'cancelled' && order.status !== 'completed') {
    // Stock reservation button if not already reserved
    if (!order.isReserved && order.status !== 'draft') {
      buttons.push(`<button onclick="window.forceReserveStock('${order.id}')" class="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl transition-all">Force Reserve Stock</button>`);
    }

    if (order.status === 'confirmed' || order.status === 'processing' || order.status === 'ready-delivery') {
      if (order.deliveryStatus !== 'delivered') {
        buttons.push(`<button onclick="window.generateDeliveryAction('${order.id}')" class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-all shadow-md shadow-emerald-500/10">Create Delivery Challan</button>`);
      }
      if (order.invoiceStatus !== 'fully') {
        buttons.push(`<button onclick="window.generateInvoiceAction('${order.id}')" class="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-all shadow-md shadow-indigo-500/10">Generate Invoice</button>`);
      }
    }

    buttons.push(`<button onclick="window.cancelOrderAction('${order.id}')" class="border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 text-xs font-semibold px-3 py-2 rounded-xl transition-all">Cancel Order</button>`);
  }

  buttons.push(`<button onclick="window.printOrder()" class="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl transition-all flex items-center gap-1.5"><i data-lucide="printer" class="w-3.5 h-3.5"></i> Print</button>`);

  actionPanel.innerHTML = buttons.join('');
  initIcons();
};

// ----------------------------------------------------
// WORKFLOW ACTIONS LOGIC
// ----------------------------------------------------
window.confirmOrderAction = function(orderId) {
  const orders = getOrders();
  const order = orders.find(o => o.id === orderId);
  if (!order) return;

  let warningMsg = '';
  order.items.forEach(item => {
    const invProduct = getInventoryProduct(item.productId);
    if (invProduct && item.quantity > invProduct.stock) {
      warningMsg += `\n- SKU: ${invProduct.sku} ("${invProduct.name}"): Requested: ${item.quantity}, Available: ${invProduct.stock}`;
    }
  });

  if (warningMsg) {
    const proceed = confirm(`⚠️ Stock Shortage Alert! The following items are short on stock:${warningMsg}\n\nDo you want to confirm this order anyway and queue reservation?`);
    if (!proceed) return;
    order.isReserved = false;
  } else {
    order.isReserved = true;
  }

  order.status = 'confirmed';
  order.statusHistory.push({
    status: 'confirmed',
    date: todayIso(),
    notes: order.isReserved ? 'Order confirmed. Stock allocated and reserved.' : 'Order confirmed. Reservation pending stock availability.'
  });

  saveAppState();
  window.openOrderDetail(orderId);
};

window.forceReserveStock = function(orderId) {
  const orders = getOrders();
  const order = orders.find(o => o.id === orderId);
  if (!order) return;

  let shortage = false;
  order.items.forEach(item => {
    const invProduct = getInventoryProduct(item.productId);
    if (invProduct && item.quantity > invProduct.stock) {
      shortage = true;
    }
  });

  if (shortage) {
    alert('Cannot reserve stock: Inventory shortages still persist.');
    return;
  }

  order.isReserved = true;
  order.statusHistory.push({
    status: order.status,
    date: todayIso(),
    notes: 'Inventory stock reservation manually executed.'
  });

  saveAppState();
  window.openOrderDetail(orderId);
};

window.cancelOrderAction = function(orderId) {
  const orders = getOrders();
  const order = orders.find(o => o.id === orderId);
  if (!order) return;

  const reason = prompt('Please enter a cancellation reason:');
  if (reason === null) return; // cancelled prompt
  if (!reason.trim()) {
    alert('Cancellation reason is required.');
    return;
  }

  order.status = 'cancelled';
  order.cancellationReason = reason;
  order.isReserved = false;
  order.statusHistory.push({
    status: 'cancelled',
    date: todayIso(),
    notes: `Order cancelled. Reason: ${reason}`
  });

  saveAppState();
  window.openOrderDetail(orderId);
};

window.generateDeliveryAction = function(orderId) {
  const orders = getOrders();
  const order = orders.find(o => o.id === orderId);
  if (!order) return;
  window.location.href = `/sales-deliveries.html?so=${encodeURIComponent(orderId)}`;
};

window.generateInvoiceAction = function(orderId) {
  const orders = getOrders();
  const order = orders.find(o => o.id === orderId);
  if (!order) return;

  if (!appState.invoices) {
    appState.invoices = [];
  }

  const nextInvNum = appState.invoices.length + 1;
  const invoiceId = `INV-2026-${String(10000 + nextInvNum).slice(1)}`;

  // Create invoice snapshot items
  const invoiceItems = order.items.map(item => ({
    productId: item.productId,
    name: item.name,
    quantity: item.quantity,
    price: item.price,
    total: item.total
  }));

  const invoiceRecord = {
    id: invoiceId,
    customerId: order.customerId,
    issueDate: todayIso(),
    dueDate: todayIso(),
    items: invoiceItems,
    subtotal: order.subtotal,
    discountAmount: order.discountAmount,
    taxAmount: order.taxAmount,
    total: order.total,
    amount: order.total,
    paidAmount: 0.00,
    dueAmount: order.total,
    currency: 'USD',
    terms: 'Due on Receipt',
    approvalStatus: 'approved',
    postedAt: todayIso(),
    sentAt: todayIso(),
    isPosted: true,
    customerSnapshot: {
      id: order.customerId,
      company: order.customerName,
      contactName: order.shippingContactName || 'Customer Support',
      creditLimit: 0,
      paymentTerms: 'Net 30'
    },
    sourceType: 'sales_order',
    sourceId: order.id,
    status: 'sent'
  };

  appState.invoices.push(invoiceRecord);

  // Update order statuses
  order.invoiceStatus = 'fully';
  order.status = 'invoiced';
  order.statusHistory.push({
    status: 'invoiced',
    date: todayIso(),
    notes: `Invoice document ${invoiceId} generated for billing.`
  });

  saveAppState();
  window.openOrderDetail(order.id);
};

window.recordDirectPayment = function(invoiceId) {
  const amountStr = prompt(`Enter payment amount captured against ${invoiceId}:`);
  if (amountStr === null) return;
  const amount = parseFloat(amountStr);
  if (isNaN(amount) || amount <= 0) {
    alert('Invalid amount entered.');
    return;
  }

  const invoice = (appState.invoices || []).find(i => i.id === invoiceId);
  if (!invoice) return;

  if (amount > invoice.dueAmount) {
    alert('Payment cannot exceed invoice due amount.');
    return;
  }

  if (!appState.paymentRecords) {
    appState.paymentRecords = [];
  }

  const payId = `PAY-2026-${String(10000 + appState.paymentRecords.length + 1).slice(1)}`;
  appState.paymentRecords.push({
    id: payId,
    customerId: invoice.customerId,
    invoiceId: invoice.id,
    date: todayIso(),
    amount,
    method: 'Cash / Settlement',
    reference: `DIR-SO`,
    transactionId: payId,
    notes: 'Direct Payment logged from Sales Order fulfiller panel.',
    status: 'received'
  });

  invoice.paidAmount += amount;
  invoice.dueAmount = Math.max(0, invoice.total - invoice.paidAmount);
  if (invoice.dueAmount === 0) {
    invoice.status = 'paid';
  } else {
    invoice.status = 'partially-paid';
  }

  // Update original sales order payment status and check completion
  const orders = getOrders();
  const order = orders.find(o => o.id === invoice.sourceId);
  if (order) {
    if (invoice.status === 'paid') {
      order.paymentStatus = 'paid';
    } else {
      order.paymentStatus = 'partially';
    }

    // Check complete fulfillment
    if (order.deliveryStatus === 'delivered' && order.paymentStatus === 'paid') {
      order.status = 'completed';
      order.statusHistory.push({
        status: 'completed',
        date: todayIso(),
        notes: 'Order fully delivered and settled. Fulfillment completed.'
      });
    }
  }

  saveAppState();
  if (order) {
    window.openOrderDetail(order.id);
  } else {
    renderAll();
  }
};

window.printOrder = function() {
  window.print();
};

// ----------------------------------------------------
// MAIN TABLE & METRICS RENDERERS
// ----------------------------------------------------
window.renderTable = function() {
  const tbody = document.getElementById('sales-orders-body');
  if (!tbody) return;

  tbody.innerHTML = '';
  const search = document.getElementById('sales-orders-search-input')?.value.toLowerCase() || '';

  const filterOrderStatus = document.getElementById('filter-order-status')?.value || 'all';
  const filterDeliveryStatus = document.getElementById('filter-delivery-status')?.value || 'all';
  const filterInvoiceStatus = document.getElementById('filter-invoice-status')?.value || 'all';
  const filterPaymentStatus = document.getElementById('filter-payment-status')?.value || 'all';
  const filterCustomer = document.getElementById('filter-customer')?.value || 'all';
  const filterSalesperson = document.getElementById('filter-salesperson')?.value || 'all';
  const filterWarehouse = document.getElementById('filter-warehouse')?.value || 'all';

  const filtered = getOrders().filter(item => {
    const matchesSearch = !search || [
      item.id,
      item.customerName,
      item.salesperson,
      item.warehouse,
      item.status
    ].some(val => String(val).toLowerCase().includes(search));

    const matchesOrderStatus = filterOrderStatus === 'all' || item.status === filterOrderStatus;
    const matchesDelivery = filterDeliveryStatus === 'all' || item.deliveryStatus === filterDeliveryStatus;
    const matchesInvoice = filterInvoiceStatus === 'all' || item.invoiceStatus === filterInvoiceStatus;
    const matchesPayment = filterPaymentStatus === 'all' || item.paymentStatus === filterPaymentStatus;
    const matchesCustomer = filterCustomer === 'all' || String(item.customerId) === String(filterCustomer);
    const matchesSalesperson = filterSalesperson === 'all' || item.salesperson === filterSalesperson;
    const matchesWarehouse = filterWarehouse === 'all' || item.warehouse === filterWarehouse;

    return matchesSearch && matchesOrderStatus && matchesDelivery && matchesInvoice && matchesPayment && matchesCustomer && matchesSalesperson && matchesWarehouse;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" class="p-8 text-center text-slate-400 font-semibold">No records found</td></tr>`;
    return;
  }

  filtered.forEach(item => {
    tbody.innerHTML += `
      <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100">
        <td class="p-4 font-bold text-slate-900 cursor-pointer-all" onclick="window.showDetailView('${item.id}')">${escapeHtml(item.id)}</td>
        <td class="p-4">${escapeHtml(item.customerName)}</td>
        <td class="p-4">${escapeHtml(item.date)}</td>
        <td class="p-4 text-slate-400 font-medium">${escapeHtml(item.expectedDeliveryDate || 'N/A')}</td>
        <td class="p-4 font-extrabold text-slate-900 text-right">${formatCurrency(item.total)}</td>
        <td class="p-4 text-slate-500">${escapeHtml(item.warehouse)}</td>
        <td class="p-4 text-slate-500">${escapeHtml(item.salesperson)}</td>
        <td class="p-4">
          <span class="px-2 py-0.5 rounded-full text-[9px] font-bold capitalize ${
            item.deliveryStatus === 'delivered' ? 'bg-emerald-50 text-emerald-600' :
            (item.deliveryStatus === 'partial' || item.deliveryStatus === 'partially') ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-700'
          }">${escapeHtml(item.deliveryStatus === 'partially' ? 'partial' : item.deliveryStatus)}</span>
        </td>
        <td class="p-4">
          <span class="px-2 py-0.5 rounded-full text-[9px] font-bold capitalize ${
            item.status === 'completed' || item.status === 'delivered' ? 'bg-emerald-50 text-emerald-600' :
            item.status === 'confirmed' || item.status === 'processing' ? 'bg-blue-50 text-blue-600' :
            item.status === 'cancelled' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-500'
          }">${escapeHtml(item.status)}</span>
        </td>
        <td class="p-4 text-center">
          <div class="flex items-center justify-center gap-2">
            <button onclick="window.showDetailView('${item.id}')" class="p-1 hover:bg-slate-100 rounded text-blue-600 font-bold">View</button>
            <button onclick="window.openOrdersForm('${item.id}')" class="p-1 hover:bg-slate-100 rounded text-slate-500">Edit</button>
          </div>
        </td>
      </tr>
    `;
  });
};

function renderMetrics() {
  const list = getOrders();
  const metricsContainer = document.getElementById('sales-orders-metrics');
  if (!metricsContainer) return;

  const total = list.length;
  const pending = list.filter(item => item.deliveryStatus === 'pending' && item.status !== 'cancelled').length;
  const processing = list.filter(item => item.status === 'processing').length;
  const delivered = list.filter(item => item.deliveryStatus === 'delivered').length;
  const cancelled = list.filter(item => item.status === 'cancelled').length;
  const totalVal = list.filter(item => item.status !== 'cancelled').reduce((sum, item) => sum + (item.total || 0), 0);

  metricsContainer.innerHTML = `
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Total Orders</span>
      <span class="text-lg font-extrabold text-slate-950 block mt-2">${total}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Pending Delivery</span>
      <span class="text-lg font-extrabold text-amber-600 block mt-2">${pending}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Processing</span>
      <span class="text-lg font-extrabold text-blue-600 block mt-2">${processing}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Delivered</span>
      <span class="text-lg font-extrabold text-emerald-600 block mt-2">${delivered}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Cancelled</span>
      <span class="text-lg font-extrabold text-rose-600 block mt-2">${cancelled}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Booked Value</span>
      <span class="text-lg font-extrabold text-indigo-600 block mt-2">${formatCurrency(totalVal)}</span>
    </div>
  `;
}

function renderFilters() {
  const customerFilter = document.getElementById('filter-customer');
  if (customerFilter && customerFilter.options.length <= 1) {
    getCustomers().forEach(c => {
      customerFilter.innerHTML += `<option value="${c.id}">${escapeHtml(c.company)}</option>`;
    });
  }

  const salespersonFilter = document.getElementById('filter-salesperson');
  if (salespersonFilter && salespersonFilter.options.length <= 1) {
    const list = getOrders();
    const reps = [...new Set(list.map(o => o.salesperson))];
    reps.forEach(r => {
      salespersonFilter.innerHTML += `<option value="${escapeHtml(r)}">${escapeHtml(r)}</option>`;
    });
  }

  renderWarehouseOptions('filter-warehouse', true, document.getElementById('filter-warehouse')?.value || 'all');
}

function renderAll() {
  renderMetrics();
  renderFilters();
  window.renderTable();
  initIcons();
}

// ----------------------------------------------------
// DOCUMENT LIFECYCLE
// ----------------------------------------------------
document.addEventListener('DOMContentLoaded', async () => {
  await appReadyPromise;
  renderAll();
});

window.addEventListener('hookerp:language-changed', () => {
  if (typeof renderAll === 'function') renderAll();
});
