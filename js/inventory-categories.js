import { appReadyPromise, appState, saveAppState, initIcons, getInventoryCategories } from '/js/shared.js';

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

function createCategoryCode(name) {
  const cleaned = String(name || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim();

  if (!cleaned) return '';

  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length === 1) {
    return words[0].slice(0, 4);
  }

  return words.map((word) => word[0]).join('').slice(0, 4);
}

function getCategories() {
  return getInventoryCategories();
}

function getProducts() {
  return Array.isArray(appState.inventory) ? appState.inventory : [];
}

function getCategoryById(categoryId) {
  return getCategories().find((category) => category.id === categoryId) || null;
}

function getCategoryProductStats(categoryName) {
  return getProducts().reduce((summary, product) => {
    if (String(product?.category || '').trim() !== categoryName) return summary;

    summary.productCount += 1;
    summary.totalStockValue += parseNumber(product?.stock) * parseNumber(product?.cost);
    return summary;
  }, {
    productCount: 0,
    totalStockValue: 0
  });
}

function getCategoryViewModels() {
  return getCategories().map((category) => {
    const stats = getCategoryProductStats(category.name);
    const parentCategory = getCategoryById(category.parentId);

    return {
      ...category,
      parentCategoryName: parentCategory?.name || '—',
      productCount: stats.productCount,
      totalStockValue: stats.totalStockValue
    };
  });
}

function getCategoryMetrics() {
  const categories = getCategoryViewModels();
  const activeCategories = categories.filter((category) => category.status === 'Active').length;
  const emptyCategories = categories.filter((category) => category.productCount === 0).length;
  const topCategory = categories.reduce((currentTop, category) => (
    category.totalStockValue > (currentTop?.totalStockValue || 0) ? category : currentTop
  ), null);

  return {
    categories,
    activeCategories,
    emptyCategories,
    topCategory
  };
}

function getNextCategoryId() {
  const maxNumericId = getCategories().reduce((maxValue, category) => {
    const numericId = Number.parseInt(String(category.id || '').replace(/[^\d]/g, ''), 10);
    return Number.isFinite(numericId) ? Math.max(maxValue, numericId) : maxValue;
  }, 0);

  return `CAT-${String(maxNumericId + 1).padStart(3, '0')}`;
}

function setAdvancedSection(open) {
  const section = document.getElementById('inventory-categories-advanced-section');
  const icon = document.getElementById('inventory-categories-advanced-icon');
  if (!section) return;

  section.classList.toggle('hidden', !open);
  if (icon) {
    icon.style.transform = open ? 'rotate(180deg)' : 'rotate(0deg)';
  }
}

function resetCategoryForm() {
  document.getElementById('inventory-categories-form')?.reset();
  document.getElementById('inventory-category-edit-id').value = '';
  document.getElementById('inventory-category-form-title').textContent = 'Create Category';
  document.querySelector('#inventory-categories-form button[type="submit"]').textContent = 'Save Category';
  populateParentCategoryOptions();
  setAdvancedSection(false);
}

function populateParentCategoryOptions(selectedParentId = '', editId = '') {
  const parentSelect = document.getElementById('inventory-category-parent');
  if (!parentSelect) return;

  parentSelect.innerHTML = ['<option value="">No Parent Category</option>']
    .concat(getCategories()
      .filter((category) => category.id !== editId)
      .map((category) => `
        <option value="${escapeHtml(category.id)}">${escapeHtml(category.name)}${category.code ? ` (${escapeHtml(category.code)})` : ''}</option>
      `))
    .join('');

  parentSelect.value = getCategories().some((category) => category.id === selectedParentId) ? selectedParentId : '';
}

function populateCategoryForm(categoryId) {
  const category = getCategoryById(categoryId);
  if (!category) return;

  document.getElementById('inventory-category-edit-id').value = category.id;
  document.getElementById('inventory-category-form-title').textContent = 'Edit Category';
  document.querySelector('#inventory-categories-form button[type="submit"]').textContent = 'Update Category';
  document.getElementById('inventory-category-name').value = category.name;
  document.getElementById('inventory-category-code').value = category.code || '';
  document.getElementById('inventory-category-type').value = category.type;
  document.getElementById('inventory-category-status').value = category.status;
  document.getElementById('inventory-category-description').value = category.description;
  document.getElementById('inventory-category-tax-rate').value = category.defaultTaxRate || '';
  document.getElementById('inventory-category-unit-type').value = category.defaultUnitType || '';
  document.getElementById('inventory-category-stock-policy').value = category.stockPolicy || '';
  populateParentCategoryOptions(category.parentId || '', category.id);

  const shouldOpenAdvanced = Boolean(category.defaultTaxRate || category.defaultUnitType || category.stockPolicy);
  setAdvancedSection(shouldOpenAdvanced);
}

function renderMetrics() {
  const metricsContainer = document.getElementById('inventory-categories-metrics');
  if (!metricsContainer) return;

  const {
    categories,
    activeCategories,
    emptyCategories,
    topCategory
  } = getCategoryMetrics();

  metricsContainer.innerHTML = `
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Categories</span>
      <span class="text-xl font-extrabold text-slate-950 block mt-2">${categories.length}</span>
      <span class="text-[11px] text-slate-500 font-semibold mt-2 block">organized product groups in the master list</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-emerald-200 bg-emerald-50/20 premium-shadow">
      <span class="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Active Categories</span>
      <span class="text-xl font-extrabold text-emerald-700 block mt-2">${activeCategories}</span>
      <span class="text-[11px] text-emerald-700 font-semibold mt-2 block">available for product assignment</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-amber-200 bg-amber-50/20 premium-shadow">
      <span class="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">Empty Categories</span>
      <span class="text-xl font-extrabold text-amber-700 block mt-2">${emptyCategories}</span>
      <span class="text-[11px] text-amber-700 font-semibold mt-2 block">currently have no linked products</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-blue-200 bg-blue-50/20 premium-shadow">
      <span class="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">Top Category By Stock Value</span>
      <span class="text-xl font-extrabold text-slate-950 block mt-2">${escapeHtml(topCategory?.name || 'No stocked category yet')}</span>
      <span class="text-[11px] text-blue-700 font-semibold mt-2 block">${topCategory ? formatCurrency(topCategory.totalStockValue) : 'Assign products to surface the leader'}</span>
    </div>
  `;
}

window.renderInventoryCategoriesTable = function() {
  const tbody = document.getElementById('inventory-categories-body');
  if (!tbody) return;

  const searchValue = String(document.getElementById('inventory-categories-search-input')?.value || '').trim().toLowerCase();
  const categories = getCategoryViewModels().filter((category) => {
    if (!searchValue) return true;

    const haystack = [
      category.id,
      category.code,
      category.name,
      category.type,
      category.description,
      category.parentCategoryName,
      category.status
    ].join(' ').toLowerCase();

    return haystack.includes(searchValue);
  });

  tbody.innerHTML = '';

  if (categories.length === 0) {
    tbody.innerHTML = '<tr><td colspan="10" class="px-6 py-8 text-center text-slate-400 font-semibold">No categories matched your search.</td></tr>';
    return;
  }

  categories.forEach((category) => {
    const statusClass = category.status === 'Active'
      ? 'bg-emerald-50 text-emerald-600'
      : 'bg-slate-200 text-slate-600';

    tbody.innerHTML += `
      <tr class="hover:bg-slate-50/70 transition-colors">
        <td class="px-6 py-4 font-bold text-slate-900">${escapeHtml(category.id)}</td>
        <td class="px-6 py-4 font-semibold text-slate-500">${escapeHtml(category.code || '—')}</td>
        <td class="px-6 py-4">
          <div class="font-bold text-slate-900">${escapeHtml(category.name)}</div>
          <div class="text-[10px] text-slate-400 font-semibold">${escapeHtml(category.type)}</div>
        </td>
        <td class="px-6 py-4">${escapeHtml(category.type)}</td>
        <td class="px-6 py-4 text-slate-500 min-w-[260px]">${escapeHtml(category.description)}</td>
        <td class="px-6 py-4">${escapeHtml(category.parentCategoryName)}</td>
        <td class="px-6 py-4 text-center font-bold text-slate-900">${category.productCount}</td>
        <td class="px-6 py-4 text-right font-bold text-emerald-700">${formatCurrency(category.totalStockValue)}</td>
        <td class="px-6 py-4">
          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${statusClass}">
            ${escapeHtml(category.status)}
          </span>
        </td>
        <td class="px-6 py-4 text-center">
          <div class="inline-flex items-center gap-2">
            <button onclick="window.openInventoryCategoryForm('${category.id}')" class="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-bold text-slate-600 transition-colors cursor-pointer">Edit</button>
            <button onclick="window.deleteInventoryCategory('${category.id}')" class="px-3 py-1.5 rounded-lg border border-rose-200 bg-white hover:bg-rose-50 text-[11px] font-bold text-rose-600 transition-colors cursor-pointer">Delete</button>
          </div>
        </td>
      </tr>
    `;
  });
};

window.showInventoryCategoriesMainView = function() {
  document.getElementById('inventory-categories-main-view').classList.remove('hidden');
  document.getElementById('inventory-categories-form-view').classList.add('hidden');
};

window.showInventoryCategoriesFormView = function() {
  document.getElementById('inventory-categories-main-view').classList.add('hidden');
  document.getElementById('inventory-categories-form-view').classList.remove('hidden');
};

window.toggleInventoryCategoryAdvancedFields = function() {
  const section = document.getElementById('inventory-categories-advanced-section');
  if (!section) return;

  setAdvancedSection(section.classList.contains('hidden'));
};

window.openInventoryCategoryForm = function(categoryId = '') {
  resetCategoryForm();

  if (categoryId) {
    populateCategoryForm(categoryId);
  }

  window.showInventoryCategoriesFormView();
  initIcons();
};

window.handleInventoryCategorySubmit = function(event) {
  event.preventDefault();

  const categories = getCategories();
  const editId = document.getElementById('inventory-category-edit-id').value;
  const existingCategory = editId ? getCategoryById(editId) : null;
  const name = document.getElementById('inventory-category-name').value.trim();
  const normalizedName = name.toLowerCase();
  const duplicate = categories.find((category) => category.id !== editId && category.name.toLowerCase() === normalizedName);

  if (duplicate) {
    window.alert('A category with this name already exists. Please choose a different category name.');
    return;
  }

  const payload = {
    id: editId || getNextCategoryId(),
    code: String(document.getElementById('inventory-category-code').value || createCategoryCode(name)).trim().toUpperCase(),
    name,
    type: document.getElementById('inventory-category-type').value,
    description: document.getElementById('inventory-category-description').value.trim(),
    parentId: document.getElementById('inventory-category-parent').value,
    status: document.getElementById('inventory-category-status').value,
    defaultTaxRate: parseNumber(document.getElementById('inventory-category-tax-rate').value),
    defaultUnitType: document.getElementById('inventory-category-unit-type').value,
    stockPolicy: document.getElementById('inventory-category-stock-policy').value
  };

  const existingIndex = categories.findIndex((category) => category.id === payload.id);
  if (existingIndex >= 0) {
    categories[existingIndex] = payload;
  } else {
    categories.push(payload);
  }

  if (existingCategory && existingCategory.name !== payload.name) {
    getProducts().forEach((product) => {
      if (String(product?.category || '').trim() === existingCategory.name) {
        product.category = payload.name;
      }
    });
  }

  saveAppState();
  window.showInventoryCategoriesMainView();
  renderAll();
};

window.deleteInventoryCategory = function(categoryId) {
  const category = getCategoryById(categoryId);
  if (!category) return;

  const assignedProducts = getProducts().filter((product) => String(product?.category || '').trim() === category.name);
  if (assignedProducts.length > 0) {
    window.alert(`"${category.name}" still has ${assignedProducts.length} linked product(s). Reassign those products before deleting the category.`);
    return;
  }

  if (!window.confirm(`Delete category "${category.name}"?`)) {
    return;
  }

  const childCategories = getCategories().filter((item) => item.parentId === categoryId);
  childCategories.forEach((childCategory) => {
    childCategory.parentId = '';
  });

  appState.inventoryCategories = getCategories().filter((item) => item.id !== categoryId);
  saveAppState();
  renderAll();
};

function renderAll() {
  renderMetrics();
  populateParentCategoryOptions();
  window.renderInventoryCategoriesTable();
  initIcons();
}

document.addEventListener('DOMContentLoaded', async () => {
  await appReadyPromise;
  renderAll();
});

window.addEventListener('hookerp:state-synced', () => {
  renderAll();
});
