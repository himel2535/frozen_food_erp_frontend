import { appReadyPromise, appState, saveAppState, initIcons, getInventoryWarehouses, getInventoryUnits } from '/js/shared.js';

const PRODUCT_TYPES = ['Raw Materials', 'Semi-Finished Goods', 'Finished Goods', 'Service (non-stock)'];
const FALLBACK_CATEGORIES = ['Yarn', 'Dyes', 'Fabrics'];

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatCurrency(value) {
  return `$${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function parseNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getCategoryNames() {
  const masterCategories = Array.isArray(appState.inventoryCategories)
    ? appState.inventoryCategories.map((category) => String(category?.name || '').trim()).filter(Boolean)
    : [];
  const productCategories = (appState.inventory || [])
    .map((product) => String(product?.category || '').trim())
    .filter(Boolean);

  const source = masterCategories.length || productCategories.length
    ? masterCategories.concat(productCategories)
    : FALLBACK_CATEGORIES;

  return Array.from(new Set(source));
}

function getWarehouseRecords() {
  const warehouses = getInventoryWarehouses();
  const activeWarehouses = warehouses.filter((warehouse) => String(warehouse.status || '').toLowerCase() === 'active');
  return activeWarehouses.length ? activeWarehouses : warehouses;
}

function normalizeWarehouseStock(product, warehouses) {
  const rawWarehouseStock = product?.warehouseStock && typeof product.warehouseStock === 'object'
    ? product.warehouseStock
    : {};
  const normalized = {};

  warehouses.forEach((warehouse) => {
    const byId = parseNumber(rawWarehouseStock[warehouse.id]);
    const byName = parseNumber(rawWarehouseStock[warehouse.name]);
    normalized[warehouse.id] = byId || byName || 0;
  });

  return normalized;
}

function normalizeProduct(product, index, warehouses, categories) {
  const warehouseStock = normalizeWarehouseStock(product, warehouses);
  const stockFromWarehouses = Object.values(warehouseStock).reduce((sum, quantity) => sum + parseNumber(quantity), 0);

  return {
    id: product?.id ?? Date.now() + index,
    name: String(product?.name || '').trim(),
    sku: String(product?.sku || '').trim(),
    category: String(product?.category || categories[0] || FALLBACK_CATEGORIES[0]).trim(),
    productType: PRODUCT_TYPES.includes(product?.productType) ? product.productType : 'Finished Goods',
    cost: parseNumber(product?.cost),
    price: parseNumber(product?.price),
    wholesalePrice: parseNumber(product?.wholesalePrice),
    taxRate: parseNumber(product?.taxRate),
    stock: stockFromWarehouses || parseNumber(product?.stock),
    warehouseStock,
    minStock: parseNumber(product?.minStock),
    reorderLevel: parseNumber(product?.reorderLevel),
    defaultWarehouse: String(product?.defaultWarehouse || warehouses[0]?.id || ''),
    description: String(product?.description || '').trim(),
    uom: String(product?.uom || '').trim(),
    reserved: parseNumber(product?.reserved),
    discontinued: Boolean(product?.discontinued)
  };
}

function syncInventoryState() {
  const warehouses = getWarehouseRecords();
  const categories = getCategoryNames();
  const currentProducts = Array.isArray(appState.inventory) ? appState.inventory : [];
  const normalizedProducts = currentProducts.map((product, index) => normalizeProduct(product, index, warehouses, categories));
  const hasChanges = JSON.stringify(currentProducts) !== JSON.stringify(normalizedProducts);

  appState.inventory = normalizedProducts;
  return { warehouses, categories, hasChanges };
}

function getProducts() {
  const { hasChanges } = syncInventoryState();
  if (hasChanges) saveAppState();
  return appState.inventory;
}

function getDerivedStatus(product) {
  if (product.discontinued) {
    return { label: 'Discontinued', className: 'bg-slate-100 text-slate-500' };
  }

  if (product.stock === 0) {
    return { label: 'Out of Stock', className: 'bg-rose-50 text-rose-600' };
  }

  if (product.stock > 0 && product.stock < product.minStock) {
    return { label: 'Low Stock', className: 'bg-amber-50 text-amber-600' };
  }

  return { label: 'In Stock', className: 'bg-emerald-50 text-emerald-600' };
}

function getAvailableStock(product) {
  return Math.max(product.stock - product.reserved, 0);
}

function renderCategoryOptions() {
  const categories = getCategoryNames();
  const filterSelect = document.getElementById('inv-category-filter');
  const formSelect = document.getElementById('inv-input-category');
  const currentFilter = filterSelect?.value || 'all';
  const currentFormValue = formSelect?.value || '';

  if (filterSelect) {
    filterSelect.innerHTML = [`<option value="all">${escapeHtml(window.t ? window.t('inventory.all_categories') : 'All Categories')}</option>`]
      .concat(categories.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`))
      .join('');
    filterSelect.value = categories.includes(currentFilter) ? currentFilter : 'all';
  }

  if (formSelect) {
    formSelect.innerHTML = [`<option value="" disabled>${escapeHtml(window.t ? window.t('inventory.select_category') : 'Select Category')}</option>`]
      .concat(categories.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`))
      .join('');
    formSelect.value = categories.includes(currentFormValue) ? currentFormValue : (categories[0] || '');
  }
}

function renderWarehouseOptions(selectedWarehouseId = '') {
  const select = document.getElementById('inv-input-default-wh');
  if (!select) return;

  const warehouses = getWarehouseRecords();
  select.innerHTML = warehouses
    .map((warehouse) => `<option value="${escapeHtml(warehouse.id)}">${escapeHtml(warehouse.name)} (${escapeHtml(warehouse.id)})</option>`)
    .join('');

  select.value = warehouses.some((warehouse) => warehouse.id === selectedWarehouseId)
    ? selectedWarehouseId
    : (warehouses[0]?.id || '');
}

function renderUnitOptions(selectedUom = '') {
  const select = document.getElementById('inv-input-uom');
  if (!select) return;

  const units = getInventoryUnits().filter((unit) => unit.status === 'Active');
  const selected = String(selectedUom || '').trim();
  const hasSelected = units.some((unit) => unit.code === selected || unit.symbol === selected);

  select.innerHTML = [`<option value="">${escapeHtml(window.t ? window.t('inventory.select_unit') : 'Select Unit')}</option>`]
    .concat(units.map((unit) => {
      const value = unit.code || unit.symbol;
      return `<option value="${escapeHtml(value)}">${escapeHtml(unit.name)} (${escapeHtml(value)})</option>`;
    }))
    .join('');

  if (selected && !hasSelected) {
    select.innerHTML += `<option value="${escapeHtml(selected)}">${escapeHtml(selected)}</option>`;
  }

  select.value = selected || '';
}

function renderWarehouseStockFields(product = null) {
  const container = document.getElementById('inv-warehouse-stock-fields');
  if (!container) return;

  const warehouses = getWarehouseRecords();
  const stockMap = normalizeWarehouseStock(product, warehouses);

  container.innerHTML = warehouses.map((warehouse) => `
    <div>
      <label class="block mb-2">${escapeHtml(warehouse.name)} Stock</label>
      <input
        type="number"
        min="0"
        value="${stockMap[warehouse.id] || 0}"
        data-warehouse-id="${escapeHtml(warehouse.id)}"
        class="inv-warehouse-stock-input w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
      >
    </div>
  `).join('');
}

function setAdvancedSection(open) {
  const section = document.getElementById('inventory-advanced-section');
  const icon = document.getElementById('inventory-advanced-icon');
  if (!section) return;

  section.classList.toggle('hidden', !open);
  if (icon) {
    icon.style.transform = open ? 'rotate(180deg)' : 'rotate(0deg)';
  }
}

function resetProductForm() {
  const form = document.getElementById('inv-form-product');
  if (form) form.reset();

  document.getElementById('inv-input-id').value = '';
  document.getElementById('product-form-title').textContent = window.t ? window.t('inventory.create_product') : 'Create Product';
  document.querySelector('#inv-form-product button[type="submit"]').textContent = window.t ? window.t('inventory.save_product') : 'Save Product';

  renderCategoryOptions();
  renderWarehouseOptions();
  renderUnitOptions();
  renderWarehouseStockFields();

  document.getElementById('inv-input-reserved').value = '0';
  document.getElementById('inv-input-discontinued').checked = false;
  setAdvancedSection(false);
}

function populateProductForm(product) {
  resetProductForm();

  document.getElementById('inv-input-id').value = String(product.id);
  document.getElementById('inv-input-name').value = product.name;
  document.getElementById('inv-input-sku').value = product.sku;
  document.getElementById('inv-input-category').value = product.category;
  document.getElementById('inv-input-product-type').value = product.productType;
  document.getElementById('inv-input-cost').value = product.cost;
  document.getElementById('inv-input-price').value = product.price;
  renderUnitOptions(product.uom);
  document.getElementById('inv-input-reserved').value = product.reserved;
  document.getElementById('inv-input-wholesale').value = product.wholesalePrice || '';
  document.getElementById('inv-input-tax').value = product.taxRate || '';
  document.getElementById('inv-input-min').value = product.minStock || '';
  document.getElementById('inv-input-reorder').value = product.reorderLevel || '';
  document.getElementById('inv-input-description').value = product.description;
  document.getElementById('inv-input-discontinued').checked = product.discontinued;

  renderWarehouseOptions(product.defaultWarehouse);
  renderWarehouseStockFields(product);

  document.getElementById('product-form-title').textContent = window.t ? window.t('inventory.edit_product') : 'Edit Product';
  document.querySelector('#inv-form-product button[type="submit"]').textContent = window.t ? window.t('inventory.update_product') : 'Update Product';
}

function collectWarehouseStockFromForm() {
  const warehouseStock = {};

  document.querySelectorAll('.inv-warehouse-stock-input').forEach((input) => {
    const warehouseId = input.getAttribute('data-warehouse-id');
    warehouseStock[warehouseId] = parseNumber(input.value);
  });

  return warehouseStock;
}

function buildProductPayload(existingId = null) {
  const warehouseStock = collectWarehouseStockFromForm();
  const stock = Object.values(warehouseStock).reduce((sum, quantity) => sum + parseNumber(quantity), 0);

  return {
    id: existingId || Date.now(),
    name: document.getElementById('inv-input-name').value.trim(),
    sku: document.getElementById('inv-input-sku').value.trim(),
    category: document.getElementById('inv-input-category').value,
    productType: document.getElementById('inv-input-product-type').value,
    cost: parseNumber(document.getElementById('inv-input-cost').value),
    price: parseNumber(document.getElementById('inv-input-price').value),
    wholesalePrice: parseNumber(document.getElementById('inv-input-wholesale').value),
    taxRate: parseNumber(document.getElementById('inv-input-tax').value),
    stock,
    warehouseStock,
    minStock: parseNumber(document.getElementById('inv-input-min').value),
    reorderLevel: parseNumber(document.getElementById('inv-input-reorder').value),
    defaultWarehouse: document.getElementById('inv-input-default-wh').value,
    description: document.getElementById('inv-input-description').value.trim(),
    uom: document.getElementById('inv-input-uom').value.trim(),
    reserved: parseNumber(document.getElementById('inv-input-reserved').value),
    discontinued: document.getElementById('inv-input-discontinued').checked
  };
}

function renderMetrics(products) {
  const activeProducts = products.filter((product) => !product.discontinued);
  const totalStock = products.reduce((sum, product) => sum + product.stock, 0);
  const lowStockAlerts = products.filter((product) => !product.discontinued && product.stock > 0 && product.stock < product.minStock).length;
  const outOfStockCount = products.filter((product) => !product.discontinued && product.stock === 0).length;
  const inventoryValue = products.reduce((sum, product) => sum + (product.stock * product.cost), 0);

  document.getElementById('inv-total-skus').textContent = String(activeProducts.length);
  document.getElementById('inv-total-stock').textContent = window.t
    ? window.t('inventory.units_count', { n: totalStock.toLocaleString() })
    : `${totalStock.toLocaleString()} units`;
  document.getElementById('inv-low-alerts').textContent = String(lowStockAlerts);
  document.getElementById('inv-out-of-stock').textContent = String(outOfStockCount);
  document.getElementById('inv-total-val').textContent = formatCurrency(inventoryValue);
}

function renderTableMeta(count) {
  document.getElementById('inv-total-count').textContent = String(count);
  document.getElementById('inv-page-start').textContent = count > 0 ? '1' : '0';
  document.getElementById('inv-page-end').textContent = String(count);
}

function renderInventoryRows(products) {
  const tbody = document.getElementById('inventory-table-body');
  if (!tbody) return;

  if (products.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" class="px-6 py-10 text-center text-slate-400 font-semibold">${escapeHtml(window.t ? window.t('inventory.no_match') : 'No catalog products match the selected filters.')}</td></tr>`;
    return;
  }

  const warehouses = getWarehouseRecords();
  tbody.innerHTML = products.map((product) => {
    const status = getDerivedStatus(product);
    const warehouseBadges = warehouses
      .filter((warehouse) => parseNumber(product.warehouseStock?.[warehouse.id]) > 0)
      .map((warehouse) => `<span class="inline-flex items-center rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">${escapeHtml(warehouse.name)}: ${parseNumber(product.warehouseStock?.[warehouse.id])}</span>`)
      .join(' ');

    return `
      <tr class="hover:bg-slate-50/60 transition-colors">
        <td class="px-6 py-4">
          <div class="flex items-start gap-3">
            <div class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
              <i data-lucide="package" class="w-4 h-4"></i>
            </div>
            <div class="space-y-1">
              <div class="font-bold text-slate-900">${escapeHtml(product.name)}</div>
              <div class="text-[11px] font-semibold text-slate-500">${escapeHtml(product.sku)}${product.uom ? ` • ${escapeHtml(product.uom)}` : ''}${product.productType ? ` • ${escapeHtml(product.productType)}` : ''}</div>
            </div>
          </div>
        </td>
        <td class="px-6 py-4"><span class="inline-flex items-center rounded-lg bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-600">${escapeHtml(product.category)}</span></td>
        <td class="px-6 py-4 text-center">
          <div class="font-extrabold text-slate-900">${product.stock.toLocaleString()}</div>
          <div class="mt-1 flex flex-wrap justify-center gap-1">${warehouseBadges || `<span class="text-[10px] text-slate-400">${escapeHtml(window.t ? window.t('inventory.no_allocation') : 'No allocation')}</span>`}</div>
        </td>
        <td class="px-6 py-4 text-center font-semibold text-slate-600">${product.reserved.toLocaleString()}</td>
        <td class="px-6 py-4 text-center font-extrabold text-blue-600">${getAvailableStock(product).toLocaleString()}</td>
        <td class="px-6 py-4 text-right font-semibold text-slate-600">${formatCurrency(product.cost)}</td>
        <td class="px-6 py-4 text-right font-extrabold text-slate-900">${formatCurrency(product.price)}</td>
        <td class="px-6 py-4"><span class="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold ${status.className}">${status.label}</span></td>
        <td class="px-6 py-4">
          <div class="flex flex-wrap items-center justify-center gap-2">
            <button type="button" onclick="window.showInventoryFormView('${escapeHtml(String(product.id))}')" class="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-50 cursor-pointer">Edit</button>
            <button type="button" onclick="window.toggleProductDiscontinued('${escapeHtml(String(product.id))}')" class="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-50 cursor-pointer">${product.discontinued ? 'Restore' : 'Discontinue'}</button>
            <button type="button" onclick="window.deleteProductSKU('${escapeHtml(String(product.id))}')" class="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-100 cursor-pointer">Delete</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

window.renderInventoryTable = function renderInventoryTable() {
  const products = getProducts();
  const categoryFilter = document.getElementById('inv-category-filter')?.value || 'all';
  const typeFilter = document.getElementById('inv-type-filter')?.value || 'all';
  const searchValue = String(document.getElementById('inv-search-input')?.value || '').trim().toLowerCase();

  renderMetrics(products);

  const filteredProducts = products.filter((product) => {
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    const matchesType = typeFilter === 'all' || product.productType === typeFilter;
    const haystack = [product.name, product.sku, product.description].join(' ').toLowerCase();
    const matchesSearch = !searchValue || haystack.includes(searchValue);
    return matchesCategory && matchesType && matchesSearch;
  });

  renderTableMeta(filteredProducts.length);
  renderInventoryRows(filteredProducts);
  initIcons();
};

window.showInventoryMainView = function showInventoryMainView() {
  document.getElementById('inventory-main-view').classList.remove('hidden');
  document.getElementById('inventory-form-view').classList.add('hidden');
  resetProductForm();
  window.renderInventoryTable();
};

window.showInventoryFormView = function showInventoryFormView(editId = null) {
  document.getElementById('inventory-main-view').classList.add('hidden');
  document.getElementById('inventory-form-view').classList.remove('hidden');

  const normalizedEditId = editId === false ? null : editId;
  const product = normalizedEditId
    ? getProducts().find((item) => String(item.id) === String(normalizedEditId))
    : null;

  if (product) {
    populateProductForm(product);
    setAdvancedSection(true);
  } else {
    resetProductForm();
  }

  initIcons();
};

window.toggleAdvancedInventoryFields = function toggleAdvancedInventoryFields() {
  const section = document.getElementById('inventory-advanced-section');
  setAdvancedSection(section?.classList.contains('hidden'));
};

window.handleProductFormSubmit = function handleProductFormSubmit(event) {
  event.preventDefault();

  const editId = document.getElementById('inv-input-id').value;
  const payload = buildProductPayload(editId ? Number(editId) : null);
  const existingIndex = appState.inventory.findIndex((product) => String(product.id) === String(payload.id));

  if (existingIndex >= 0) {
    appState.inventory[existingIndex] = payload;
  } else {
    appState.inventory.push(payload);
  }

  saveAppState();
  window.showInventoryMainView();
};

window.deleteProductSKU = function deleteProductSKU(id) {
  if (!confirm('Are you sure you want to remove this product from inventory?')) return;

  appState.inventory = getProducts().filter((product) => String(product.id) !== String(id));
  saveAppState();
  window.renderInventoryTable();
};

window.toggleProductDiscontinued = function toggleProductDiscontinued(id) {
  const product = getProducts().find((item) => String(item.id) === String(id));
  if (!product) return;

  product.discontinued = !product.discontinued;
  saveAppState();
  window.renderInventoryTable();
};

function initializeProductsScreen() {
  syncInventoryState();
  renderCategoryOptions();
  renderWarehouseOptions();
  renderWarehouseStockFields();
  resetProductForm();
  window.renderInventoryTable();
}

document.addEventListener('DOMContentLoaded', async () => {
  await appReadyPromise;
  initializeProductsScreen();
});

window.addEventListener('hookerp:state-synced', () => {
  initializeProductsScreen();
});

window.addEventListener('hookerp:language-changed', () => {
  initializeProductsScreen();
});
