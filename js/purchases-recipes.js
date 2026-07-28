// Mock Data
let rawMaterials = [
  { id: 'RM-001', name: 'Injection Mold', unit: 'pcs', price: 2.50 },
  { id: 'RM-002', name: 'Pen Body', unit: 'pcs', price: 0.80 },
  { id: 'RM-003', name: 'Plastic Handle', unit: 'pcs', price: 0.40 },
  { id: 'RM-004', name: 'Battery', unit: 'pcs', price: 0.60 },
  { id: 'RM-005', name: 'Speaker', unit: 'pcs', price: 1.50 },
  { id: 'RM-006', name: 'PCB Board', unit: 'pcs', price: 2.00 },
  { id: 'RM-007', name: 'IC Chip', unit: 'pcs', price: 0.80 },
  { id: 'RM-008', name: 'Wire', unit: 'meter', price: 0.10 }
];

let semiCompleteProducts = [
  { id: 'SC-001', name: 'Sound Module', unit: 'pcs', price: 4.50 }
];

let recipes = [
  {
    id: 'REC-001',
    name: 'Interactive Book',
    sku: 'IB-100',
    type: 'Complete Product',
    componentsCount: 5,
    totalCost: 12.90
  },
  {
    id: 'REC-002',
    name: 'Sound Module',
    sku: 'SM-200',
    type: 'Semi-Complete Product',
    componentsCount: 4,
    totalCost: 4.50
  }
];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  renderRecipesTable();
});

// View Navigation
window.showRecipeMainView = function() {
  document.getElementById('manufacturing-recipes-main-view').classList.remove('hidden');
  document.getElementById('manufacturing-recipes-main-view').classList.add('flex');
  document.getElementById('manufacturing-recipes-form-view').classList.add('hidden');
};

window.showRecipeFormView = function() {
  document.getElementById('manufacturing-recipes-main-view').classList.add('hidden');
  document.getElementById('manufacturing-recipes-main-view').classList.remove('flex');
  document.getElementById('manufacturing-recipes-form-view').classList.remove('hidden');
  
  const form = document.getElementById('recipe-form');
  form.reset();
  document.getElementById('bom-table-body').innerHTML = '';
  document.getElementById('recipe-code').value = 'REC-' + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  
  // Add one empty row by default
  addBOMRow();
  calculateBOMTotals();
  
  if (window.lucide) {
    window.lucide.createIcons();
  }
};

// Render Table
window.renderRecipesTable = function() {
  const tbody = document.getElementById('recipes-table-body');
  const emptyState = document.getElementById('recipes-empty-state');
  const searchInput = (document.getElementById('recipe-search-input') ? document.getElementById('recipe-search-input').value.toLowerCase() : '');
  
  let filtered = recipes.filter(r => r.name.toLowerCase().includes(searchInput) || r.sku.toLowerCase().includes(searchInput));
  
  tbody.innerHTML = '';
  
  if (filtered.length === 0) {
    tbody.parentElement.classList.add('hidden');
    emptyState.classList.remove('hidden');
    emptyState.classList.add('flex');
  } else {
    tbody.parentElement.classList.remove('hidden');
    emptyState.classList.add('hidden');
    emptyState.classList.remove('flex');
    
    filtered.forEach(recipe => {
      const typeBadgeColor = recipe.type === 'Complete Product' ? 'bg-indigo-100 text-indigo-700' : 
                             (recipe.type === 'Semi-Complete Product' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700');
                             
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-slate-50 transition-colors group bg-white';
      tr.innerHTML = `
        <td class="py-3 px-4 border-b border-slate-100">
          <p class="text-sm font-bold text-slate-800">${recipe.name}</p>
          <p class="text-[10px] text-slate-500">${recipe.id}</p>
        </td>
        <td class="py-3 px-4 border-b border-slate-100 text-sm text-slate-600">${recipe.sku}</td>
        <td class="py-3 px-4 border-b border-slate-100">
          <span class="px-2 py-1 ${typeBadgeColor} text-[10px] font-bold rounded-md">${recipe.type}</span>
        </td>
        <td class="py-3 px-4 border-b border-slate-100 text-sm font-semibold text-slate-700 text-right">${recipe.componentsCount} items</td>
        <td class="py-3 px-4 border-b border-slate-100 text-sm font-bold text-indigo-600 text-right">${recipe.totalCost.toFixed(2)}</td>
        <td class="py-3 px-4 border-b border-slate-100 text-center">
          <button type="button" class="text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer" title="Edit">
            <i data-lucide="edit" class="w-4 h-4"></i>
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });
    
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }
};

// Dynamic BOM Table Logic
window.addBOMRow = function() {
  const tbody = document.getElementById('bom-table-body');
  const tr = document.createElement('tr');
  tr.className = 'bom-row group bg-white hover:bg-slate-50 transition-colors';
  
  tr.innerHTML = `
    <td class="p-2 border-b border-slate-100">
      <select onchange="window.handleComponentTypeChange(this)" class="bom-type w-full px-2 py-1.5 rounded bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-indigo-500 cursor-pointer">
        <option value="">Select Type</option>
        <option value="Raw Material">Raw Material</option>
        <option value="Semi-Complete Product">Semi-Complete Product</option>
      </select>
    </td>
    <td class="p-2 border-b border-slate-100">
      <select onchange="window.handleComponentSelection(this)" class="bom-item w-full px-2 py-1.5 rounded bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-indigo-500 cursor-pointer" disabled>
        <option value="">Select Component...</option>
      </select>
    </td>
    <td class="p-2 border-b border-slate-100">
      <input type="number" min="0.01" step="0.01" value="1" oninput="window.calculateBOMTotals()" class="bom-qty w-full px-2 py-1.5 rounded bg-white border border-slate-200 text-xs focus:outline-none focus:border-indigo-500 text-right">
    </td>
    <td class="p-2 border-b border-slate-100">
      <div class="flex items-center gap-1">
        <input type="number" min="0" step="0.01" value="0.00" oninput="window.calculateBOMTotals()" class="bom-price w-full px-2 py-1.5 rounded bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-indigo-500 text-right text-slate-500" readonly>
        <span class="bom-unit text-[10px] text-slate-400 w-6"></span>
      </div>
    </td>
    <td class="p-2 border-b border-slate-100">
      <input type="number" min="0" max="100" step="0.1" value="0" oninput="window.calculateBOMTotals()" class="bom-wastage w-full px-2 py-1.5 rounded bg-white border border-slate-200 text-xs focus:outline-none focus:border-indigo-500 text-right">
    </td>
    <td class="p-2 border-b border-slate-100 text-right">
      <span class="bom-row-total text-sm font-bold text-slate-800">0.00</span>
    </td>
    <td class="p-2 border-b border-slate-100 text-center">
      <button type="button" onclick="window.removeBOMRow(this)" class="text-slate-300 hover:text-red-500 transition-colors cursor-pointer">
        <i data-lucide="trash-2" class="w-4 h-4"></i>
      </button>
    </td>
  `;
  tbody.appendChild(tr);
  
  if (window.lucide) {
    window.lucide.createIcons();
  }
};

window.removeBOMRow = function(btn) {
  const row = btn.closest('tr');
  row.remove();
  window.calculateBOMTotals();
};

window.handleComponentTypeChange = function(select) {
  const row = select.closest('tr');
  const itemSelect = row.querySelector('.bom-item');
  const type = select.value;
  
  itemSelect.innerHTML = '<option value="">Select Component...</option>';
  
  if (!type) {
    itemSelect.disabled = true;
    return;
  }
  
  itemSelect.disabled = false;
  let options = type === 'Raw Material' ? rawMaterials : semiCompleteProducts;
  
  options.forEach(opt => {
    const el = document.createElement('option');
    el.value = opt.id;
    el.textContent = opt.name;
    // Attach metadata for easy access
    el.dataset.price = opt.price;
    el.dataset.unit = opt.unit;
    itemSelect.appendChild(el);
  });
  
  // Reset row calculations
  row.querySelector('.bom-price').value = '0.00';
  row.querySelector('.bom-unit').textContent = '';
  window.calculateBOMTotals();
};

window.handleComponentSelection = function(select) {
  const row = select.closest('tr');
  const option = select.options[select.selectedIndex];
  
  if (option.value) {
    row.querySelector('.bom-price').value = parseFloat(option.dataset.price).toFixed(2);
    row.querySelector('.bom-unit').textContent = option.dataset.unit;
  } else {
    row.querySelector('.bom-price').value = '0.00';
    row.querySelector('.bom-unit').textContent = '';
  }
  window.calculateBOMTotals();
};

// Calculation Engine
window.calculateBOMTotals = function() {
  const rows = document.querySelectorAll('.bom-row');
  
  let totalComponents = 0;
  let totalQty = 0;
  let materialCost = 0;
  let wastageCost = 0;
  
  rows.forEach(row => {
    const qty = parseFloat(row.querySelector('.bom-qty').value) || 0;
    const price = parseFloat(row.querySelector('.bom-price').value) || 0;
    const wastagePercent = parseFloat(row.querySelector('.bom-wastage').value) || 0;
    
    if (qty > 0 && row.querySelector('.bom-item').value) {
      totalComponents++;
      totalQty += qty;
      
      const baseCost = qty * price;
      const wCost = baseCost * (wastagePercent / 100);
      const rowFinalCost = baseCost + wCost;
      
      materialCost += baseCost;
      wastageCost += wCost;
      
      row.querySelector('.bom-row-total').textContent = rowFinalCost.toFixed(2);
    } else {
      row.querySelector('.bom-row-total').textContent = '0.00';
    }
  });
  
  // Extra costs
  const prodCost = parseFloat(document.getElementById('cost-production').value) || 0;
  const packCost = parseFloat(document.getElementById('cost-packaging').value) || 0;
  const laborCost = parseFloat(document.getElementById('cost-labor').value) || 0;
  const otherCost = parseFloat(document.getElementById('cost-other').value) || 0;
  
  const extraTotal = prodCost + packCost + laborCost + otherCost;
  const grandTotal = materialCost + wastageCost + extraTotal;
  
  // Update UI Summary
  document.getElementById('summary-components').textContent = totalComponents;
  document.getElementById('summary-qty').textContent = totalQty.toFixed(2);
  
  document.getElementById('summary-material-cost').textContent = materialCost.toFixed(2) + ' BDT';
  document.getElementById('summary-wastage-cost').textContent = wastageCost.toFixed(2) + ' BDT';
  document.getElementById('summary-production-cost').textContent = prodCost.toFixed(2) + ' BDT';
  document.getElementById('summary-packaging-cost').textContent = packCost.toFixed(2) + ' BDT';
  document.getElementById('summary-other-cost').textContent = (laborCost + otherCost).toFixed(2) + ' BDT';
  
  document.getElementById('summary-grand-total').innerHTML = grandTotal.toFixed(2) + ' <span class="text-lg">BDT</span>';
  
  // Assuming 1 unit is produced for Complete Product by default. 
  // If we had a "Batch Size" field we would divide by it. For now, unit cost = grand total.
  document.getElementById('summary-unit-cost').textContent = grandTotal.toFixed(2) + ' BDT';
};

window.handleRecipeFormSubmit = function(e) {
  e.preventDefault();
  
  const name = document.getElementById('recipe-name').value.trim();
  const type = document.querySelector('input[name="recipe-type"]:checked').value;
  const rows = document.querySelectorAll('.bom-row');
  
  let validRows = 0;
  rows.forEach(row => {
    if (row.querySelector('.bom-item').value && parseFloat(row.querySelector('.bom-qty').value) > 0) {
      validRows++;
    }
  });
  
  if (validRows === 0) {
    alert('Please add at least one valid component to the BOM.');
    return;
  }
  
  // Calculate total to save
  let materialCost = 0;
  let wastageCost = 0;
  rows.forEach(row => {
    const qty = parseFloat(row.querySelector('.bom-qty').value) || 0;
    const price = parseFloat(row.querySelector('.bom-price').value) || 0;
    const wastage = parseFloat(row.querySelector('.bom-wastage').value) || 0;
    if (qty > 0 && row.querySelector('.bom-item').value) {
      materialCost += (qty * price);
      wastageCost += (qty * price) * (wastage / 100);
    }
  });
  
  const prodCost = parseFloat(document.getElementById('cost-production').value) || 0;
  const packCost = parseFloat(document.getElementById('cost-packaging').value) || 0;
  const laborCost = parseFloat(document.getElementById('cost-labor').value) || 0;
  const otherCost = parseFloat(document.getElementById('cost-other').value) || 0;
  const grandTotal = materialCost + wastageCost + prodCost + packCost + laborCost + otherCost;
  
  // Push dummy
  const newId = document.getElementById('recipe-code').value;
  recipes.push({
    id: newId,
    name: name,
    sku: document.getElementById('recipe-sku').value || 'N/A',
    type: type,
    componentsCount: validRows,
    totalCost: grandTotal
  });
  
  window.showRecipeMainView();
  window.renderRecipesTable();
};
