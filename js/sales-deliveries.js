import { appReadyPromise, appState, saveAppState, initIcons, getInventoryWarehouses } from '/js/shared.js';
import { getCustomerList, ensureCrmState } from '/js/crm-service.js';

function escapeHtml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function actionIcon(file, alt, className = 'w-4 h-4') {
  return `<img src="/images/icons/actions/${file}" alt="${escapeHtml(alt)}" class="${className} object-contain pointer-events-none" />`;
}

function formatCurrency(value) {
  return `$${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDisplayDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function itemDeliveryQty(item) {
  return Number(item?.deliveryQty ?? item?.shippedQty ?? 0);
}

function normalizeDeliveryStatus(status) {
  if (status === 'partially' || status === 'partial') return 'partial';
  if (status === 'delivered' || status === 'completed') return 'delivered';
  if (status === 'pending') return 'pending';
  return status || 'pending';
}

let quickFilter = 'all';

const DEFAULT_SALES_ORDERS = [
  {
    id: 'SO-2026-0001',
    customerId: 1,
    customerName: 'Bell Labs',
    date: '2026-06-18',
    total: 12990.00,
    deliveryStatus: 'partial',
    status: 'confirmed',
    items: [{ productId: '4', name: 'Super Hero Action Figure', quantity: 1000, price: 12.99, total: 12990.00 }]
  },
  {
    id: 'SO-2026-0002',
    customerId: 3,
    customerName: 'General Electric',
    date: '2026-06-19',
    total: 500.00,
    deliveryStatus: 'pending',
    status: 'confirmed',
    items: [{ productId: '3', name: 'Action Figure Arms', quantity: 500, price: 1.00, total: 500.00 }]
  },
  {
    id: 'SO-2026-0003',
    customerId: 2,
    customerName: 'ABC Traders',
    date: '2026-07-10',
    total: 8294.00,
    deliveryStatus: 'pending',
    status: 'confirmed',
    items: [
      { productId: '4', name: 'Super Hero Action Figure', quantity: 600, price: 12.99, total: 7794.00 },
      { productId: '3', name: 'Action Figure Arms', quantity: 500, price: 1.00, total: 500.00 }
    ]
  },
  {
    id: 'SO-2026-0004',
    customerId: 4,
    customerName: 'Rainbow Toys',
    date: '2026-07-12',
    total: 10392.00,
    deliveryStatus: 'partial',
    status: 'confirmed',
    items: [{ productId: '4', name: 'Super Hero Action Figure', quantity: 800, price: 12.99, total: 10392.00 }]
  },
  {
    id: 'SO-2026-0005',
    customerId: 5,
    customerName: 'Kids World',
    date: '2026-07-05',
    total: 1200.00,
    deliveryStatus: 'delivered',
    status: 'completed',
    items: [{ productId: '3', name: 'Action Figure Arms', quantity: 1200, price: 1.00, total: 1200.00 }]
  }
];

const DEFAULT_DELIVERY_CHALLANS = [
  {
    id: 'DC-000001',
    orderId: 'SO-2026-0001',
    customerId: 1,
    customerName: 'Bell Labs',
    date: '2026-06-20',
    warehouse: 'Central Hub',
    value: 3897.00,
    trackingNumber: '',
    vehicleNumber: 'DHAKA-METRO-GA-9922',
    driverName: 'Robert Khan',
    driverMobile: '01711-111111',
    deliveryMethod: 'Own Vehicle',
    deliveryLocation: 'Gulshan-2, Dhaka',
    contactPerson: 'Alexander Graham',
    contactNumber: '01711-100100',
    notes: 'Unload at warehouse gate. Handle toys carefully.',
    status: 'delivered',
    items: [
      { productId: '4', name: 'Super Hero Action Figure', orderedQty: 1000, previousQty: 0, deliveryQty: 300, remainingQty: 700, price: 12.99 }
    ]
  },
  {
    id: 'DC-000002',
    orderId: 'SO-2026-0002',
    customerId: 3,
    customerName: 'General Electric',
    date: '2026-06-19',
    warehouse: 'Central Hub',
    value: 500.00,
    trackingNumber: 'TRK5432109',
    vehicleNumber: 'DHAKA-METRO-T-5511',
    driverName: 'Rahim Uddin',
    driverMobile: '01722-222222',
    deliveryMethod: 'Courier',
    deliveryLocation: 'Agrabad, Chittagong',
    contactPerson: 'Thomas Edison',
    contactNumber: '01812-200200',
    notes: 'Fragile parts — keep upright.',
    status: 'draft',
    items: [
      { productId: '3', name: 'Action Figure Arms', orderedQty: 500, previousQty: 0, deliveryQty: 500, remainingQty: 0, price: 1.00 }
    ]
  },
  {
    id: 'DC-000003',
    orderId: 'SO-2026-0001',
    customerId: 1,
    customerName: 'Bell Labs',
    date: '2026-07-08',
    warehouse: 'Central Hub',
    value: 5196.00,
    trackingNumber: '',
    vehicleNumber: 'DHAKA-METRO-GA-9922',
    driverName: 'Robert Khan',
    driverMobile: '01711-111111',
    deliveryMethod: 'Own Vehicle',
    deliveryLocation: 'Gulshan-2, Dhaka',
    contactPerson: 'Alexander Graham',
    contactNumber: '01711-100100',
    notes: 'Second partial shipment for remaining action figures.',
    status: 'delivered',
    items: [
      { productId: '4', name: 'Super Hero Action Figure', orderedQty: 1000, previousQty: 300, deliveryQty: 400, remainingQty: 300, price: 12.99 }
    ]
  },
  {
    id: 'DC-000004',
    orderId: 'SO-2026-0003',
    customerId: 2,
    customerName: 'ABC Traders',
    date: '2026-07-18',
    warehouse: 'Central Hub',
    value: 5196.00,
    trackingNumber: '',
    vehicleNumber: 'DHAKA-METRO-KA-3344',
    driverName: 'Karim Hossain',
    driverMobile: '01733-333333',
    deliveryMethod: 'Own Vehicle',
    deliveryLocation: 'Mirpur-10, Dhaka',
    contactPerson: 'Hasan Ali',
    contactNumber: '01911-300300',
    notes: 'First delivery planned — confirm gate pass before unload.',
    status: 'draft',
    items: [
      { productId: '4', name: 'Super Hero Action Figure', orderedQty: 600, previousQty: 0, deliveryQty: 400, remainingQty: 200, price: 12.99 },
      { productId: '3', name: 'Action Figure Arms', orderedQty: 500, previousQty: 0, deliveryQty: 0, remainingQty: 500, price: 1.00 }
    ]
  },
  {
    id: 'DC-000005',
    orderId: 'SO-2026-0004',
    customerId: 4,
    customerName: 'Rainbow Toys',
    date: '2026-07-15',
    warehouse: 'Central Hub',
    value: 2598.00,
    trackingNumber: 'TRK7788123',
    vehicleNumber: 'CTG-GA-7788',
    driverName: 'Salma Begum',
    driverMobile: '01744-444444',
    deliveryMethod: 'Courier',
    deliveryLocation: 'GEC Circle, Chittagong',
    contactPerson: 'Nusrat Jahan',
    contactNumber: '01611-400400',
    notes: 'Partial delivery — remaining qty next week.',
    status: 'delivered',
    items: [
      { productId: '4', name: 'Super Hero Action Figure', orderedQty: 800, previousQty: 0, deliveryQty: 200, remainingQty: 600, price: 12.99 }
    ]
  },
  {
    id: 'DC-000006',
    orderId: 'SO-2026-0003',
    customerId: 2,
    customerName: 'ABC Traders',
    date: '2026-07-12',
    warehouse: 'Central Hub',
    value: 1299.00,
    trackingNumber: '',
    vehicleNumber: 'DHAKA-METRO-KA-3344',
    driverName: 'Karim Hossain',
    driverMobile: '01733-333333',
    deliveryMethod: 'Own Vehicle',
    deliveryLocation: 'Mirpur-10, Dhaka',
    contactPerson: 'Hasan Ali',
    contactNumber: '01911-300300',
    notes: 'Cancelled — customer requested reschedule.',
    status: 'cancelled',
    items: [
      { productId: '4', name: 'Super Hero Action Figure', orderedQty: 600, previousQty: 0, deliveryQty: 100, remainingQty: 500, price: 12.99 }
    ]
  },
  {
    id: 'DC-000007',
    orderId: 'SO-2026-0005',
    customerId: 5,
    customerName: 'Kids World',
    date: '2026-07-07',
    warehouse: 'Central Hub',
    value: 1200.00,
    trackingNumber: '',
    vehicleNumber: 'DHAKA-METRO-CHA-1122',
    driverName: 'Jamal Ahmed',
    driverMobile: '01755-555555',
    deliveryMethod: 'Customer Pickup',
    deliveryLocation: 'Uttara Sector-7, Dhaka',
    contactPerson: 'Rina Akter',
    contactNumber: '01511-500500',
    notes: 'Full delivery — customer picked up from factory gate.',
    status: 'delivered',
    items: [
      { productId: '3', name: 'Action Figure Arms', orderedQty: 1200, previousQty: 0, deliveryQty: 1200, remainingQty: 0, price: 1.00 }
    ]
  }
];

function getDeliveriesList() {
  if (!Array.isArray(appState.salesDeliveries) || !appState._deliveryChallanSeededV2) {
    appState.salesDeliveries = DEFAULT_DELIVERY_CHALLANS.map((d) => ({
      ...d,
      items: (d.items || []).map((item) => ({ ...item }))
    }));
    appState._deliveryChallanSeededV2 = true;
    saveAppState();
  }

  appState.salesDeliveries.forEach((d) => {
    if (!['draft', 'delivered', 'cancelled'].includes(d.status)) {
      d.status = d.status === 'delivered' ? 'delivered' : 'draft';
    }
    (d.items || []).forEach((item) => {
      if (item.deliveryQty == null && item.shippedQty != null) {
        item.deliveryQty = item.shippedQty;
      }
    });
  });

  return appState.salesDeliveries;
}

function getSalesOrders() {
  if (!Array.isArray(appState.salesOrders) || !appState._deliveryOrdersSeededV2) {
    appState.salesOrders = DEFAULT_SALES_ORDERS.map((so) => ({
      ...so,
      items: (so.items || []).map((item) => ({ ...item }))
    }));
    appState._deliveryOrdersSeededV2 = true;
    saveAppState();
  }

  appState.salesOrders.forEach((so) => {
    if (so.deliveryStatus === 'partially') so.deliveryStatus = 'partial';
  });

  return appState.salesOrders;
}

function getWarehouses() {
  return getInventoryWarehouses();
}

function getCustomers() {
  ensureCrmState(appState);
  return getCustomerList(appState);
}

function getCompanyConfig() {
  const cfg = appState.companyConfig || {};
  return {
    name: cfg.name || 'TOYS FACTORY',
    address: cfg.address || '',
    phone: cfg.phone || '',
    email: cfg.email || ''
  };
}

function generateChallanNumber() {
  const list = getDeliveriesList();
  let maxNum = 0;
  list.forEach((d) => {
    const match = String(d.id || '').match(/DC-(\d+)/i);
    if (match) maxNum = Math.max(maxNum, parseInt(match[1], 10));
  });
  return `DC-${String(maxNum + 1).padStart(6, '0')}`;
}

function getPreviousDeliveredQty(orderId, productId) {
  return getDeliveriesList()
    .filter((d) => d.orderId === orderId && d.status === 'delivered')
    .reduce((sum, d) => {
      const matchingItem = (d.items || []).find((di) => String(di.productId) === String(productId));
      return sum + (matchingItem ? itemDeliveryQty(matchingItem) : 0);
    }, 0);
}

function lookupProductMeta(productId) {
  const inventory = Array.isArray(appState.inventory) ? appState.inventory : [];
  const product = inventory.find(
    (p) => String(p.id) === String(productId) || String(p.sku) === String(productId)
  );
  return {
    sku: product?.sku || String(productId || '—'),
    uom: String(product?.uom || 'PCS').toUpperCase()
  };
}

function findInventoryProduct(productId) {
  const inventory = Array.isArray(appState.inventory) ? appState.inventory : [];
  return inventory.find(
    (p) => String(p.id) === String(productId) || String(p.sku) === String(productId)
  );
}

function getWarehouseStock(productId, warehouseName) {
  const product = findInventoryProduct(productId);
  if (!product) return 0;

  const warehouses = getWarehouses();
  const wh = warehouses.find((w) => w.name === warehouseName || w.id === warehouseName);
  if (wh && product.warehouseStock && product.warehouseStock[wh.id] != null) {
    return Number(product.warehouseStock[wh.id] || 0);
  }
  return Number(product.stock || 0);
}

function stockLabelClass(stock, remaining) {
  if (stock <= 0) return 'text-rose-600';
  if (stock < remaining) return 'text-amber-600';
  return 'text-emerald-600';
}

function getSalesOrderProgress(orderId) {
  const salesOrder = getSalesOrders().find((so) => so.id === orderId);
  if (!salesOrder) return { lines: [], orderQty: 0, deliveredQty: 0, remainingQty: 0 };

  const lines = (salesOrder.items || []).map((item) => {
    const orderQty = Number(item.quantity || 0);
    const deliveredQty = getPreviousDeliveredQty(orderId, item.productId);
    const remainingQty = Math.max(0, orderQty - deliveredQty);
    return {
      productId: item.productId,
      name: item.name,
      orderQty,
      deliveredQty,
      remainingQty
    };
  });

  const orderQty = lines.reduce((s, l) => s + l.orderQty, 0);
  const deliveredQty = lines.reduce((s, l) => s + l.deliveredQty, 0);
  const remainingQty = lines.reduce((s, l) => s + l.remainingQty, 0);
  return { lines, orderQty, deliveredQty, remainingQty };
}

function updateSalesOrderDeliveryStatus(orderId) {
  const salesOrder = getSalesOrders().find((so) => so.id === orderId);
  if (!salesOrder) return;

  const progress = getSalesOrderProgress(orderId);
  if (progress.remainingQty <= 0 && progress.orderQty > 0) {
    salesOrder.deliveryStatus = 'delivered';
    salesOrder.status = 'completed';
  } else if (progress.deliveredQty > 0) {
    salesOrder.deliveryStatus = 'partial';
  } else {
    salesOrder.deliveryStatus = 'pending';
  }
}

function deductInventoryStock(productId, warehouseName, qty) {
  const product = findInventoryProduct(productId);
  if (!product || qty <= 0) return;

  product.stock = Math.max(0, Number(product.stock || 0) - qty);

  const warehouses = getWarehouses();
  const wh = warehouses.find((w) => w.name === warehouseName || w.id === warehouseName);
  if (wh && product.warehouseStock) {
    const current = Number(product.warehouseStock[wh.id] || 0);
    product.warehouseStock[wh.id] = Math.max(0, current - qty);
  }
}

function populateOrderSelect(selectedId, forceIncludeId) {
  const orderSelect = document.getElementById('input-order-ref');
  if (!orderSelect) return;

  orderSelect.innerHTML = '<option value="">Select Sales Order</option>';
  getSalesOrders().forEach((so) => {
    const status = normalizeDeliveryStatus(so.deliveryStatus);
    if (status !== 'delivered' || so.id === forceIncludeId) {
      const selected = so.id === selectedId ? ' selected' : '';
      orderSelect.innerHTML += `<option value="${so.id}"${selected}>${escapeHtml(so.id)} (${escapeHtml(so.customerName)})</option>`;
    }
  });
}

function populateWarehouseSelect(selectedName) {
  const whSelect = document.getElementById('input-warehouse');
  if (!whSelect) return;

  whSelect.innerHTML = '<option value="">Select Warehouse</option>';
  getWarehouses().forEach((wh) => {
    const selected = wh.name === selectedName ? ' selected' : '';
    whSelect.innerHTML += `<option value="${escapeHtml(wh.name)}"${selected}>${escapeHtml(wh.name)} (${escapeHtml(wh.location)})</option>`;
  });
}

function setFormHeaderTitle(title, subtitle) {
  const header = document.getElementById('delivery-form-header');
  if (header) {
    header.setAttribute('title', title);
    if (subtitle) header.setAttribute('subtitle', subtitle);
  }
}

function renderItemRows(orderRef, prefillItems) {
  const itemsBody = document.getElementById('delivery-form-items-body');
  const salesOrder = getSalesOrders().find((so) => so.id === orderRef);
  if (!salesOrder) return;

  const warehouse = document.getElementById('input-warehouse')?.value || '';
  const items = salesOrder.items || [];
  if (items.length === 0) {
    itemsBody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-slate-400 font-medium">This order has no items.</td></tr>`;
    return;
  }

  const prefillMap = {};
  (prefillItems || []).forEach((it) => {
    prefillMap[String(it.productId)] = itemDeliveryQty(it);
  });

  itemsBody.innerHTML = '';
  items.forEach((item) => {
    const previousQty = getPreviousDeliveredQty(orderRef, item.productId);
    const orderQty = Number(item.quantity || 0);
    const remaining = Math.max(0, orderQty - previousQty);
    const stock = getWarehouseStock(item.productId, warehouse);
    const defaultQty = prefillMap[String(item.productId)] != null
      ? Math.min(prefillMap[String(item.productId)], remaining)
      : remaining;
    const remainingAfter = Math.max(0, remaining - defaultQty);

    itemsBody.innerHTML += `
      <tr class="border-b border-slate-100 items-row"
          data-product-id="${escapeHtml(item.productId)}"
          data-product-name="${escapeHtml(item.name)}"
          data-price="${item.price || 0}"
          data-order-qty="${orderQty}"
          data-previous-qty="${previousQty}"
          data-remaining-limit="${remaining}">
        <td class="p-3">
          <p class="font-bold text-slate-900">${escapeHtml(item.name)}</p>
        </td>
        <td class="p-3 text-center font-bold text-slate-500">${orderQty}</td>
        <td class="p-3 text-center font-bold text-slate-500">${previousQty}</td>
        <td class="p-3 text-center font-bold text-slate-400 remaining-qty-label">${remainingAfter}</td>
        <td class="p-3 text-center font-bold stock-qty-label ${stockLabelClass(stock, remaining)}">${stock}</td>
        <td class="p-3 text-center">
          <input type="number" min="0" max="${remaining}" value="${defaultQty}"
            class="w-24 px-2 py-1 rounded-lg border border-slate-200 text-center font-bold focus:outline-none focus:border-blue-500 delivery-qty-input cursor-text"
            oninput="window.handleDeliveryQtyChange(this)">
        </td>
      </tr>
    `;
  });
}

// ----------------------------------------------------
// ROUTING
// ----------------------------------------------------
window.showMainView = function() {
  document.getElementById('sales-deliveries-main-view').classList.remove('hidden');
  document.getElementById('sales-deliveries-form-view').classList.add('hidden');
  document.getElementById('sales-deliveries-detail-view').classList.add('hidden');
  renderAll();
};

window.showFormView = function() {
  document.getElementById('sales-deliveries-main-view').classList.add('hidden');
  document.getElementById('sales-deliveries-form-view').classList.remove('hidden');
  document.getElementById('sales-deliveries-detail-view').classList.add('hidden');
};

window.showDetailView = function(deliveryId) {
  document.getElementById('sales-deliveries-main-view').classList.add('hidden');
  document.getElementById('sales-deliveries-form-view').classList.add('hidden');
  document.getElementById('sales-deliveries-detail-view').classList.remove('hidden');
  renderDetailView(deliveryId);
};

window.toggleAdvancedFields = function() {
  const panel = document.getElementById('sales-deliveries-advanced-section');
  const icon = document.getElementById('sales-deliveries-advanced-icon');
  if (!panel || !icon) return;
  const isHidden = panel.classList.contains('hidden');
  panel.classList.toggle('hidden', !isHidden);
  icon.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
};

window.toggleMoreFilters = function() {
  const panel = document.getElementById('more-filters-panel');
  const icon = document.getElementById('more-filters-icon');
  if (!panel) return;
  const isHidden = panel.classList.contains('hidden');
  panel.classList.toggle('hidden', !isHidden);
  if (icon) icon.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
  initIcons();
};

window.setQuickFilter = function(key) {
  quickFilter = key || 'all';
  document.querySelectorAll('.quick-chip').forEach((btn) => {
    const active = btn.getAttribute('data-quick') === quickFilter;
    btn.className = active
      ? 'quick-chip px-2.5 py-1 rounded-full text-[10px] font-bold border border-blue-500 bg-blue-50 text-blue-700 cursor-pointer'
      : 'quick-chip px-2.5 py-1 rounded-full text-[10px] font-bold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 cursor-pointer';
  });

  if (key === 'draft') {
    const statusSelect = document.getElementById('filter-status');
    if (statusSelect) statusSelect.value = 'draft';
  } else if (document.getElementById('filter-status')?.value === 'draft' && key !== 'draft') {
    document.getElementById('filter-status').value = 'all';
  }

  window.renderTable();
};

// ----------------------------------------------------
// FORM
// ----------------------------------------------------
window.openDeliveriesModal = function(preselectOrderId) {
  const form = document.getElementById('sales-deliveries-form');
  if (form) form.reset();

  document.getElementById('input-challan-edit-id').value = '';
  document.getElementById('input-challan-no').value = generateChallanNumber();
  document.getElementById('input-date').value = todayISO();
  setFormHeaderTitle('Create Delivery Challan', 'Select sales order and delivery quantities.');

  const advanced = document.getElementById('sales-deliveries-advanced-section');
  const advancedIcon = document.getElementById('sales-deliveries-advanced-icon');
  if (advanced) advanced.classList.add('hidden');
  if (advancedIcon) advancedIcon.style.transform = 'rotate(0deg)';

  document.getElementById('delivery-form-items-body').innerHTML = `
    <tr>
      <td colspan="6" class="p-4 text-center text-slate-400 font-medium">Select a Sales Order to load items.</td>
    </tr>
  `;

  populateOrderSelect(preselectOrderId || '');
  populateWarehouseSelect('');

  window.showFormView();
  initIcons();

  if (preselectOrderId) {
    document.getElementById('input-order-ref').value = preselectOrderId;
    window.handleOrderSelectionChange();
  }
};

window.editDraftChallan = function(deliveryId) {
  const delivery = getDeliveriesList().find((d) => d.id === deliveryId);
  if (!delivery || delivery.status !== 'draft') {
    alert('Only draft challans can be edited.');
    return;
  }

  const form = document.getElementById('sales-deliveries-form');
  if (form) form.reset();

  document.getElementById('input-challan-edit-id').value = delivery.id;
  document.getElementById('input-challan-no').value = delivery.id;
  document.getElementById('input-date').value = delivery.date || todayISO();
  setFormHeaderTitle(`Edit Draft — ${delivery.id}`, 'Update quantities and transport details.');

  populateOrderSelect(delivery.orderId, delivery.orderId);
  populateWarehouseSelect(delivery.warehouse);

  document.getElementById('input-customer-name').value = delivery.customerName || '';
  document.getElementById('input-customer-id').value = delivery.customerId || '';
  document.getElementById('input-method').value = delivery.deliveryMethod || 'Own Vehicle';
  document.getElementById('input-vehicle').value = delivery.vehicleNumber || '';
  document.getElementById('input-driver').value = delivery.driverName || '';
  document.getElementById('input-driver-mobile').value = delivery.driverMobile || '';
  document.getElementById('input-tracking').value = delivery.trackingNumber || '';
  document.getElementById('input-location').value = delivery.deliveryLocation || '';
  document.getElementById('input-contact-person').value = delivery.contactPerson || '';
  document.getElementById('input-contact-phone').value = delivery.contactNumber || '';
  document.getElementById('input-notes').value = delivery.notes || '';

  const advanced = document.getElementById('sales-deliveries-advanced-section');
  const advancedIcon = document.getElementById('sales-deliveries-advanced-icon');
  const hasTransport = delivery.vehicleNumber || delivery.driverName || delivery.deliveryLocation;
  if (advanced) advanced.classList.toggle('hidden', !hasTransport);
  if (advancedIcon) advancedIcon.style.transform = hasTransport ? 'rotate(180deg)' : 'rotate(0deg)';

  renderItemRows(delivery.orderId, delivery.items);
  window.showFormView();
  initIcons();
};

window.handleOrderSelectionChange = function() {
  const orderRef = document.getElementById('input-order-ref').value;
  const customerNameInput = document.getElementById('input-customer-name');
  const customerIdInput = document.getElementById('input-customer-id');
  const itemsBody = document.getElementById('delivery-form-items-body');

  if (!orderRef) {
    customerNameInput.value = '';
    customerIdInput.value = '';
    itemsBody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-slate-400 font-medium">Select a Sales Order to load items.</td></tr>`;
    return;
  }

  const salesOrder = getSalesOrders().find((so) => so.id === orderRef);
  if (!salesOrder) return;

  customerNameInput.value = salesOrder.customerName;
  customerIdInput.value = salesOrder.customerId || '';

  const customer = getCustomers().find((c) => String(c.id) === String(salesOrder.customerId));
  if (customer) {
    document.getElementById('input-location').value = customer.address || customer.company || '';
    document.getElementById('input-contact-person').value = customer.name || '';
    document.getElementById('input-contact-phone').value = customer.phone || '';
  }

  renderItemRows(orderRef);
};

window.refreshItemStockLabels = function() {
  const warehouse = document.getElementById('input-warehouse')?.value || '';
  document.querySelectorAll('.items-row').forEach((row) => {
    const productId = row.getAttribute('data-product-id');
    const remaining = Number(row.getAttribute('data-remaining-limit') || 0);
    const stock = getWarehouseStock(productId, warehouse);
    const label = row.querySelector('.stock-qty-label');
    if (label) {
      label.textContent = String(stock);
      label.className = `p-3 text-center font-bold stock-qty-label ${stockLabelClass(stock, remaining)}`;
    }
  });
};

window.fillAllRemainingQty = function() {
  document.querySelectorAll('.items-row').forEach((row) => {
    const remainingLimit = Number(row.getAttribute('data-remaining-limit') || 0);
    const input = row.querySelector('.delivery-qty-input');
    if (input) {
      input.value = remainingLimit;
      window.handleDeliveryQtyChange(input);
    }
  });
};

window.handleDeliveryQtyChange = function(input) {
  const row = input.closest('tr');
  if (!row) return;
  const remainingLimit = Number(row.getAttribute('data-remaining-limit') || 0);
  let val = parseInt(input.value || 0, 10);
  if (Number.isNaN(val) || val < 0) val = 0;
  if (val > remainingLimit) {
    val = remainingLimit;
    input.value = remainingLimit;
  }
  const remainingLabel = row.querySelector('.remaining-qty-label');
  if (remainingLabel) {
    remainingLabel.textContent = String(remainingLimit - val);
  }
};

window.saveDelivery = function(mode) {
  const orderId = document.getElementById('input-order-ref').value;
  const customerId = document.getElementById('input-customer-id').value;
  const customerName = document.getElementById('input-customer-name').value;
  const date = document.getElementById('input-date').value;
  const warehouse = document.getElementById('input-warehouse').value;
  const editId = document.getElementById('input-challan-edit-id').value;
  const challanNo = document.getElementById('input-challan-no').value || generateChallanNumber();

  if (!orderId || !date || !warehouse) {
    alert('Please fill Sales Order, Delivery Date, and Warehouse.');
    return;
  }

  const itemRows = document.querySelectorAll('.items-row');
  const items = [];
  let deliveryValue = 0;

  itemRows.forEach((row) => {
    const productId = row.getAttribute('data-product-id');
    const name = row.getAttribute('data-product-name');
    const price = parseFloat(row.getAttribute('data-price') || 0);
    const orderedQty = Number(row.getAttribute('data-order-qty') || 0);
    const previousQty = Number(row.getAttribute('data-previous-qty') || 0);
    const remainingLimit = Number(row.getAttribute('data-remaining-limit') || 0);
    const deliveryQty = parseInt(row.querySelector('.delivery-qty-input')?.value || 0, 10);
    const remainingQty = Math.max(0, remainingLimit - deliveryQty);

    if (deliveryQty > 0) {
      items.push({
        productId,
        name,
        orderedQty,
        previousQty,
        deliveryQty,
        remainingQty,
        price
      });
      deliveryValue += deliveryQty * price;
    }
  });

  if (items.length === 0) {
    alert('Please enter a Delivery Qty greater than 0 for at least one item.');
    return;
  }

  const list = getDeliveriesList();
  const record = {
    id: editId || challanNo,
    orderId,
    customerId: customerId ? parseInt(customerId, 10) : '',
    customerName,
    date,
    warehouse,
    value: deliveryValue,
    deliveryMethod: document.getElementById('input-method').value,
    trackingNumber: document.getElementById('input-tracking').value || '',
    vehicleNumber: document.getElementById('input-vehicle').value || '',
    driverName: document.getElementById('input-driver').value || '',
    driverMobile: document.getElementById('input-driver-mobile').value || '',
    deliveryLocation: document.getElementById('input-location').value || '',
    contactPerson: document.getElementById('input-contact-person').value || '',
    contactNumber: document.getElementById('input-contact-phone').value || '',
    notes: document.getElementById('input-notes').value || '',
    status: 'draft',
    items
  };

  if (editId) {
    const idx = list.findIndex((d) => d.id === editId);
    if (idx === -1 || list[idx].status !== 'draft') {
      alert('This draft challan can no longer be edited.');
      return;
    }
    list[idx] = { ...list[idx], ...record, id: editId, status: 'draft' };
  } else {
    let finalId = challanNo;
    if (list.some((d) => d.id === finalId)) {
      finalId = generateChallanNumber();
      document.getElementById('input-challan-no').value = finalId;
    }
    record.id = finalId;
    list.push(record);
  }

  const finalId = record.id;
  saveAppState();

  if (mode === 'generate') {
    window.showDetailView(finalId);
    setTimeout(() => window.printDeliveryNote(finalId), 150);
  } else {
    window.showMainView();
  }
};

// ----------------------------------------------------
// STATUS ACTIONS (Draft / Delivered / Cancelled)
// ----------------------------------------------------
window.markStatus = function(deliveryId, nextStatus) {
  const list = getDeliveriesList();
  const delivery = list.find((d) => d.id === deliveryId);
  if (!delivery) return;
  if (delivery.status !== 'draft') return;
  if (!['delivered', 'cancelled'].includes(nextStatus)) return;

  if (nextStatus === 'delivered') {
    const shortages = [];
    (delivery.items || []).forEach((item) => {
      const qty = itemDeliveryQty(item);
      const available = getWarehouseStock(item.productId, delivery.warehouse);
      if (qty > available) {
        shortages.push(`${item.name}: need ${qty}, available ${available}`);
      }
    });

    if (shortages.length > 0) {
      alert(`Insufficient stock to mark delivered:\n\n${shortages.join('\n')}`);
      return;
    }

    (delivery.items || []).forEach((item) => {
      deductInventoryStock(item.productId, delivery.warehouse, itemDeliveryQty(item));
    });

    delivery.status = 'delivered';
    updateSalesOrderDeliveryStatus(delivery.orderId);
  } else if (nextStatus === 'cancelled') {
    delivery.status = 'cancelled';
  }

  saveAppState();
  renderDetailView(deliveryId);
};

// ----------------------------------------------------
// PRINT — factory format with companyConfig
// ----------------------------------------------------
let currentDetailDeliveryId = null;

window.printCurrentDeliveryChallan = function() {
  if (currentDetailDeliveryId) {
    window.printDeliveryNote(currentDetailDeliveryId);
  }
};

window.printDeliveryNote = function(deliveryId) {
  const delivery = getDeliveriesList().find((d) => d.id === deliveryId);
  if (!delivery) return;

  const printContainer = document.getElementById('print-delivery-note-container');
  if (!printContainer) return;

  const company = getCompanyConfig();
  const items = Array.isArray(delivery.items) ? delivery.items : [];
  const totalQty = items.reduce((sum, item) => sum + itemDeliveryQty(item), 0);
  const primaryUnit = items.length
    ? lookupProductMeta(items[0].productId).uom
    : 'PCS';

  const itemRows = items.map((item, index) => {
    const meta = lookupProductMeta(item.productId);
    const qty = itemDeliveryQty(item);
    return `
      <tr>
        <td style="border:1px solid #0f172a;padding:8px;text-align:center;">${String(index + 1).padStart(2, '0')}</td>
        <td style="border:1px solid #0f172a;padding:8px;">${escapeHtml(item.name)}</td>
        <td style="border:1px solid #0f172a;padding:8px;text-align:right;">${qty}</td>
        <td style="border:1px solid #0f172a;padding:8px;text-align:center;">${escapeHtml(meta.uom)}</td>
      </tr>
    `;
  }).join('');

  printContainer.innerHTML = `
    <div style="font-family:Inter,Arial,sans-serif;color:#0f172a;font-size:13px;line-height:1.5;max-width:720px;margin:0 auto;">
      <div style="text-align:center;margin-bottom:20px;">
        <h1 style="margin:0;font-size:22px;font-weight:800;letter-spacing:0.06em;">${escapeHtml(company.name)}</h1>
        ${company.address ? `<p style="margin:4px 0 0;font-size:11px;color:#475569;">${escapeHtml(company.address)}</p>` : ''}
        <h2 style="margin:8px 0 0;font-size:16px;font-weight:800;letter-spacing:0.08em;">DELIVERY CHALLAN</h2>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px 24px;margin-bottom:16px;">
        <div><strong>Challan No:</strong> ${escapeHtml(delivery.id)}</div>
        <div><strong>Date:</strong> ${escapeHtml(formatDisplayDate(delivery.date))}</div>
        <div><strong>Sales Order:</strong> ${escapeHtml(delivery.orderId)}</div>
      </div>

      <div style="margin-bottom:16px;">
        <div><strong>Customer:</strong> ${escapeHtml(delivery.customerName)}</div>
        <div><strong>Address:</strong> ${escapeHtml(delivery.deliveryLocation || '—')}</div>
      </div>

      <table style="width:100%;border-collapse:collapse;margin-bottom:12px;">
        <thead>
          <tr style="background:#f8fafc;">
            <th style="border:1px solid #0f172a;padding:8px;width:48px;">SL</th>
            <th style="border:1px solid #0f172a;padding:8px;text-align:left;">Product</th>
            <th style="border:1px solid #0f172a;padding:8px;text-align:right;">Quantity</th>
            <th style="border:1px solid #0f172a;padding:8px;width:72px;">Unit</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows || `<tr><td colspan="4" style="border:1px solid #0f172a;padding:12px;text-align:center;">No items</td></tr>`}
        </tbody>
      </table>

      <p style="font-weight:800;margin:0 0 16px;"><strong>Total Quantity:</strong> ${totalQty} ${escapeHtml(primaryUnit)}</p>

      <div style="margin-bottom:28px;">
        <div><strong>Vehicle No:</strong> ${escapeHtml(delivery.vehicleNumber || '—')}</div>
        <div><strong>Driver:</strong> ${escapeHtml(delivery.driverName || '—')}</div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:24px;margin-top:40px;">
        <div style="text-align:center;">
          <div style="border-top:1px solid #0f172a;padding-top:8px;font-weight:700;">Prepared By</div>
        </div>
        <div style="text-align:center;">
          <div style="border-top:1px solid #0f172a;padding-top:8px;font-weight:700;">Delivered By</div>
        </div>
        <div style="text-align:center;">
          <div style="border-top:1px solid #0f172a;padding-top:8px;font-weight:700;">Received By</div>
        </div>
      </div>
    </div>
  `;

  printContainer.classList.remove('hidden');
  window.print();
  printContainer.classList.add('hidden');
};

// ----------------------------------------------------
// DETAIL VIEW
// ----------------------------------------------------
function statusBadgeClass(status) {
  if (status === 'delivered') return 'bg-emerald-50 text-emerald-600';
  if (status === 'cancelled') return 'bg-rose-50 text-rose-600';
  if (status === 'draft') return 'bg-amber-50 text-amber-700';
  return 'bg-amber-50 text-amber-700';
}

function renderDetailView(deliveryId) {
  const delivery = getDeliveriesList().find((d) => d.id === deliveryId);
  if (!delivery) return;

  currentDetailDeliveryId = delivery.id;

  const headerPrintBtn = document.getElementById('detail-print-challan-btn');
  if (headerPrintBtn) {
    headerPrintBtn.classList.toggle('hidden', delivery.status === 'cancelled');
  }

  document.getElementById('detail-id').textContent = delivery.id;
  document.getElementById('detail-date-label').textContent = `Created on ${formatDisplayDate(delivery.date)}`;
  document.getElementById('detail-order-ref').textContent = delivery.orderId;
  document.getElementById('detail-customer-name').textContent = delivery.customerName;
  document.getElementById('detail-warehouse').textContent = delivery.warehouse;
  document.getElementById('detail-value').textContent = formatCurrency(delivery.value);

  document.getElementById('detail-location').textContent = delivery.deliveryLocation || '—';
  document.getElementById('detail-contact-person').textContent = delivery.contactPerson || '—';
  document.getElementById('detail-contact-phone').textContent = delivery.contactNumber || '—';
  document.getElementById('detail-notes').textContent = delivery.notes || 'No instructions specified.';

  document.getElementById('detail-method').textContent = delivery.deliveryMethod || '—';
  document.getElementById('detail-vehicle').textContent = delivery.vehicleNumber || '—';
  document.getElementById('detail-driver').textContent = delivery.driverName || '—';
  document.getElementById('detail-driver-mobile').textContent = delivery.driverMobile || '—';
  document.getElementById('detail-tracking').textContent = delivery.trackingNumber || '—';

  const badge = document.getElementById('detail-status');
  badge.textContent = delivery.status.toUpperCase();
  badge.className = `px-2.5 py-1 rounded-full text-[10px] font-bold mt-1 inline-block ${statusBadgeClass(delivery.status)}`;

  const progress = getSalesOrderProgress(delivery.orderId);
  document.getElementById('detail-so-totals').innerHTML = `
    <span><span class="text-slate-400">Order Qty:</span> <strong class="text-slate-900">${progress.orderQty.toLocaleString()}</strong></span>
    <span><span class="text-slate-400">Delivered:</span> <strong class="text-emerald-600">${progress.deliveredQty.toLocaleString()}</strong></span>
    <span><span class="text-slate-400">Remaining:</span> <strong class="text-amber-600">${progress.remainingQty.toLocaleString()}</strong></span>
  `;

  const soBody = document.getElementById('detail-so-progress-body');
  soBody.innerHTML = progress.lines.map((line) => `
    <tr>
      <td class="p-2 font-bold text-slate-900">${escapeHtml(line.name)}</td>
      <td class="p-2 text-center">${line.orderQty}</td>
      <td class="p-2 text-center text-emerald-600 font-bold">${line.deliveredQty}</td>
      <td class="p-2 text-center text-amber-600 font-bold">${line.remainingQty}</td>
    </tr>
  `).join('') || `<tr><td colspan="4" class="p-3 text-center text-slate-400">No order items</td></tr>`;

  const tbody = document.getElementById('detail-items-body');
  tbody.innerHTML = '';
  (delivery.items || []).forEach((item) => {
    const qty = itemDeliveryQty(item);
    tbody.innerHTML += `
      <tr class="hover:bg-slate-50 border-b border-slate-100">
        <td class="p-3"><p class="font-bold text-slate-900">${escapeHtml(item.name)}</p></td>
        <td class="p-3 text-center font-bold text-slate-500">${item.orderedQty}</td>
        <td class="p-3 text-center font-extrabold text-blue-600">${qty}</td>
        <td class="p-3 text-center font-bold text-slate-400">${item.remainingQty ?? Math.max(0, Number(item.orderedQty || 0) - qty)}</td>
      </tr>
    `;
  });

  const actionsContainer = document.getElementById('detail-actions-container');
  actionsContainer.innerHTML = '';

  if (delivery.status === 'draft') {
    actionsContainer.innerHTML += `
      <button onclick="window.editDraftChallan('${delivery.id}')" class="w-full border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold py-2.5 px-4 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2">
        ${actionIcon('edit.png', 'Edit Challan', 'w-4 h-4')} Edit Challan
      </button>
      <button onclick="window.markStatus('${delivery.id}', 'delivered')" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-all shadow-md shadow-emerald-500/10 cursor-pointer">
        Mark Delivered
      </button>
      <button onclick="window.printDeliveryNote('${delivery.id}')" class="w-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold py-2.5 px-4 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2">
        ${actionIcon('print.png', 'Print Challan', 'w-4 h-4')} Print Challan
      </button>
      <button onclick="window.markStatus('${delivery.id}', 'cancelled')" class="w-full border border-slate-200 text-slate-400 hover:text-slate-600 text-xs font-semibold py-2 px-4 rounded-xl transition-all cursor-pointer">
        Cancel
      </button>
    `;
  } else if (delivery.status === 'delivered') {
    actionsContainer.innerHTML += `
      <button onclick="window.printDeliveryNote('${delivery.id}')" class="w-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold py-2.5 px-4 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2">
        ${actionIcon('print.png', 'Print Challan', 'w-4 h-4')} Print Challan
      </button>
    `;
  } else {
    actionsContainer.innerHTML += `
      <p class="text-xs text-slate-400 font-medium text-center py-2">This challan is cancelled.</p>
    `;
  }

  initIcons();
}

// ----------------------------------------------------
// LIST TABLE & METRICS
// ----------------------------------------------------
function startOfWeekISO() {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  return d.toISOString().slice(0, 10);
}

window.renderTable = function() {
  const tbody = document.getElementById('sales-deliveries-body');
  if (!tbody) return;

  tbody.innerHTML = '';
  const search = document.getElementById('sales-deliveries-search-input')?.value.toLowerCase() || '';
  const filterStatus = document.getElementById('filter-status')?.value || 'all';
  const filterWarehouse = document.getElementById('filter-warehouse')?.value || 'all';
  const filterMethod = document.getElementById('filter-method')?.value || 'all';
  const filterCustomer = document.getElementById('filter-customer')?.value || 'all';
  const filterDateStart = document.getElementById('filter-date-start')?.value || '';
  const filterDateEnd = document.getElementById('filter-date-end')?.value || '';
  const today = todayISO();
  const weekStart = startOfWeekISO();

  const filtered = getDeliveriesList().filter((item) => {
    const matchesSearch = !search
      || item.id.toLowerCase().includes(search)
      || item.orderId.toLowerCase().includes(search)
      || item.customerName.toLowerCase().includes(search)
      || (item.vehicleNumber && item.vehicleNumber.toLowerCase().includes(search))
      || (item.trackingNumber && item.trackingNumber.toLowerCase().includes(search));

    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    const matchesWH = filterWarehouse === 'all' || item.warehouse === filterWarehouse;
    const matchesMethod = filterMethod === 'all' || item.deliveryMethod === filterMethod;
    const matchesCustomer = filterCustomer === 'all' || String(item.customerId) === filterCustomer;

    let matchesDate = true;
    if (filterDateStart) matchesDate = matchesDate && item.date >= filterDateStart;
    if (filterDateEnd) matchesDate = matchesDate && item.date <= filterDateEnd;

    let matchesQuick = true;
    if (quickFilter === 'today') matchesQuick = item.date === today;
    else if (quickFilter === 'week') matchesQuick = item.date >= weekStart && item.date <= today;
    else if (quickFilter === 'draft') matchesQuick = item.status === 'draft';

    return matchesSearch && matchesStatus && matchesWH && matchesMethod && matchesCustomer && matchesDate && matchesQuick;
  });

  if (filtered.length === 0) {
    const hasAny = getDeliveriesList().length > 0;
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="px-6 py-12 text-center">
          <div class="flex flex-col items-center gap-3">
            <div class="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
              <i data-lucide="package" class="w-6 h-6 text-slate-400"></i>
            </div>
            <p class="text-sm font-bold text-slate-700">${hasAny ? 'No challans match your filters.' : 'No delivery challans yet.'}</p>
            <p class="text-xs text-slate-400 font-medium">${hasAny ? 'Try clearing filters or search.' : 'Create your first challan from a sales order.'}</p>
            ${!hasAny ? `
            <button type="button" onclick="window.openDeliveriesModal()" class="mt-1 inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-xs hover:bg-blue-700 cursor-pointer">
              <i data-lucide="plus" class="w-3.5 h-3.5"></i> Create First Challan
            </button>` : ''}
          </div>
        </td>
      </tr>
    `;
    initIcons();
    return;
  }

  filtered.forEach((item) => {
    const totalQty = (item.items || []).reduce((s, it) => s + itemDeliveryQty(it), 0);
    const uom = (item.items || []).length ? lookupProductMeta(item.items[0].productId).uom : 'PCS';

    tbody.innerHTML += `
      <tr class="hover:bg-slate-50/70 transition-colors">
        <td class="px-6 py-4">
          <div class="font-bold text-slate-900">${escapeHtml(item.id)}</div>
          <div class="text-[10px] text-slate-400 font-semibold mt-0.5">${totalQty.toLocaleString()} ${escapeHtml(uom)}</div>
        </td>
        <td class="px-6 py-4 text-[11px] font-semibold text-slate-600">${escapeHtml(item.date)}</td>
        <td class="px-6 py-4">
          <span class="text-xs font-bold text-blue-600">${escapeHtml(item.orderId)}</span>
        </td>
        <td class="px-6 py-4 font-bold text-slate-700">${escapeHtml(item.customerName)}</td>
        <td class="px-6 py-4 font-bold text-slate-700">${escapeHtml(item.vehicleNumber || 'N/A')}</td>
        <td class="px-6 py-4">
          <div class="font-bold text-slate-700">${escapeHtml(item.driverName || 'N/A')}</div>
          <div class="text-[10px] text-slate-400">${escapeHtml(item.driverMobile || '')}</div>
        </td>
        <td class="px-6 py-4">
          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${statusBadgeClass(item.status)}">${escapeHtml(item.status)}</span>
        </td>
        <td class="px-6 py-4 text-center">
          <div class="inline-flex items-center justify-center gap-1 rounded-xl border border-sky-100 bg-sky-50 p-1">
            <button onclick="window.showDetailView('${item.id}')" title="View" class="p-1 rounded-lg hover:bg-white/80 transition-all cursor-pointer">
              ${actionIcon('view.png', 'View', 'w-5 h-5')}
            </button>
            ${item.status === 'draft' ? `
            <button onclick="window.editDraftChallan('${item.id}')" title="Edit Draft" class="p-1 rounded-lg hover:bg-white/80 transition-all cursor-pointer">
              ${actionIcon('edit.png', 'Edit Draft', 'w-5 h-5')}
            </button>` : ''}
            ${item.status !== 'cancelled' ? `
            <button onclick="window.printDeliveryNote('${item.id}')" title="Print Challan" class="p-1 rounded-lg hover:bg-white/80 transition-all cursor-pointer">
              ${actionIcon('print.png', 'Print Challan', 'w-5 h-5')}
            </button>` : ''}
          </div>
        </td>
      </tr>
    `;
  });

  initIcons();
};

function renderMetrics() {
  const list = getDeliveriesList();
  const metricsContainer = document.getElementById('sales-deliveries-metrics');
  if (!metricsContainer) return;

  const total = list.length;
  const draft = list.filter((item) => item.status === 'draft').length;
  const delivered = list.filter((item) => item.status === 'delivered').length;
  const cancelled = list.filter((item) => item.status === 'cancelled').length;

  metricsContainer.innerHTML = `
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Challans</span>
      <span class="text-xl font-extrabold text-slate-950 block mt-2">${total}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-amber-200 premium-shadow bg-amber-50/20">
      <span class="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">Draft</span>
      <span class="text-xl font-extrabold text-amber-700 block mt-2">${draft}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-emerald-200 premium-shadow bg-emerald-50/20">
      <span class="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Delivered</span>
      <span class="text-xl font-extrabold text-emerald-700 block mt-2">${delivered}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-rose-200 premium-shadow bg-rose-50/20">
      <span class="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">Cancelled</span>
      <span class="text-xl font-extrabold text-rose-700 block mt-2">${cancelled}</span>
    </div>
  `;
}

function populateFilters() {
  const filterCust = document.getElementById('filter-customer');
  if (filterCust && filterCust.options.length <= 1) {
    getCustomers().forEach((c) => {
      filterCust.innerHTML += `<option value="${c.id}">${escapeHtml(c.company || c.name)}</option>`;
    });
  }

  const filterWH = document.getElementById('filter-warehouse');
  if (filterWH && filterWH.options.length <= 1) {
    getWarehouses().forEach((wh) => {
      filterWH.innerHTML += `<option value="${wh.name}">${escapeHtml(wh.name)}</option>`;
    });
  }
}

function renderAll() {
  renderMetrics();
  window.renderTable();
  initIcons();
}

function handleUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const soId = params.get('so');
  if (soId) {
    window.openDeliveriesModal(soId);
    window.history.replaceState({}, '', window.location.pathname);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await appReadyPromise;
  populateFilters();
  renderAll();
  handleUrlParams();
});
