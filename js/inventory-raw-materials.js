// Mock Data
let rawMaterials = [
  { id: 'RM-001', name: 'Injection Mold', category: 'Equipment', unit: 'pcs', quantity: 5, price: 15000.00, supplierId: 'SUP-001', threshold: 2, lastUpdated: '2026-07-20T10:00:00Z' },
  { id: 'RM-002', name: 'Plastic Pellets (Red)', category: 'Plastic', unit: 'kg', quantity: 1200, price: 85.50, supplierId: 'SUP-002', threshold: 500, lastUpdated: '2026-07-21T14:30:00Z' },
  { id: 'RM-003', name: 'Small Screws (2mm)', category: 'Hardware', unit: 'box', quantity: 15, price: 250.00, supplierId: 'SUP-003', threshold: 50, lastUpdated: '2026-07-22T09:00:00Z' },
  { id: 'RM-004', name: 'Cardboard Box (Small)', category: 'Packaging', unit: 'pcs', quantity: 5000, price: 12.00, supplierId: 'SUP-004', threshold: 2000, lastUpdated: '2026-07-21T09:00:00Z' },
  { id: 'RM-005', name: 'Cardboard Box (Large)', category: 'Packaging', unit: 'pcs', quantity: 2000, price: 25.00, supplierId: 'SUP-004', threshold: 1000, lastUpdated: '2026-07-21T09:15:00Z' },
  { id: 'RM-006', name: 'Lithium Battery (AA)', category: 'Electronics', unit: 'pcs', quantity: 800, price: 45.00, supplierId: 'SUP-005', threshold: 1000, lastUpdated: '2026-07-22T10:00:00Z' },
  { id: 'RM-007', name: 'DC Motor (5V)', category: 'Electronics', unit: 'pcs', quantity: 350, price: 120.00, supplierId: 'SUP-005', threshold: 200, lastUpdated: '2026-07-20T11:00:00Z' },
  { id: 'RM-008', name: 'Rubber Tires (Mini)', category: 'Rubber', unit: 'pcs', quantity: 4500, price: 8.50, supplierId: 'SUP-006', threshold: 1000, lastUpdated: '2026-07-19T14:00:00Z' },
  { id: 'RM-009', name: 'Plastic Pellets (Blue)', category: 'Plastic', unit: 'kg', quantity: 850, price: 85.50, supplierId: 'SUP-002', threshold: 500, lastUpdated: '2026-07-21T14:35:00Z' },
  { id: 'RM-010', name: 'Steel Axles', category: 'Metal', unit: 'kg', quantity: 120, price: 350.00, supplierId: 'SUP-007', threshold: 150, lastUpdated: '2026-07-18T09:00:00Z' },
  { id: 'RM-011', name: 'Sticker Sheets', category: 'Packaging', unit: 'pcs', quantity: 15000, price: 2.50, supplierId: 'SUP-008', threshold: 5000, lastUpdated: '2026-07-22T08:00:00Z' },
  { id: 'RM-012', name: 'Super Glue', category: 'Chemicals', unit: 'liter', quantity: 25, price: 850.00, supplierId: 'SUP-009', threshold: 10, lastUpdated: '2026-07-15T10:00:00Z' },
  { id: 'RM-013', name: 'Nylon Thread', category: 'Textile', unit: 'meter', quantity: 10000, price: 5.00, supplierId: 'SUP-010', threshold: 2000, lastUpdated: '2026-07-16T12:00:00Z' },
  { id: 'RM-014', name: 'Copper Wire', category: 'Electronics', unit: 'meter', quantity: 5000, price: 15.00, supplierId: 'SUP-005', threshold: 1000, lastUpdated: '2026-07-20T15:00:00Z' },
  { id: 'RM-015', name: 'Springs', category: 'Metal', unit: 'pcs', quantity: 1200, price: 3.50, supplierId: 'SUP-007', threshold: 2000, lastUpdated: '2026-07-22T11:00:00Z' }
];

let suppliers = [
  { id: 'SUP-001', name: 'ABC Plastic Industries Ltd.' },
  { id: 'SUP-002', name: 'RFL Plastics' },
  { id: 'SUP-003', name: 'Bengal Chemicals' },
  { id: 'SUP-004', name: 'Toy Packaging Ltd.' },
  { id: 'SUP-005', name: 'Color Chem Bangladesh' },
  { id: 'SUP-006', name: 'RubberWorks BD' },
  { id: 'SUP-007', name: 'SteelCraft Industries' },
  { id: 'SUP-008', name: 'ElectroComponents Ltd' },
  { id: 'SUP-009', name: 'Fast Screws Co.' },
  { id: 'SUP-010', name: 'Textile Hub' }
];

// Pagination State
window.currentPage = 1;
window.itemsPerPage = 15;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  renderRawMaterialsTable();
  renderSupplierDropdown();
});

// View Navigation
window.showRawMaterialMainView = function() {
  document.getElementById('inventory-raw-materials-main-view').classList.remove('hidden');
  document.getElementById('inventory-raw-materials-main-view').classList.add('flex');
  document.getElementById('inventory-raw-materials-form-view').classList.add('hidden');
  document.getElementById('inventory-raw-materials-form-view').classList.remove('flex');
};

window.showRawMaterialFormView = function(rmId = null) {
  document.getElementById('inventory-raw-materials-main-view').classList.add('hidden');
  document.getElementById('inventory-raw-materials-main-view').classList.remove('flex');
  document.getElementById('inventory-raw-materials-form-view').classList.remove('hidden');
  document.getElementById('inventory-raw-materials-form-view').classList.add('flex');
  
  const form = document.getElementById('rm-form');
  const title = document.getElementById('rm-form-title');
  form.reset();
  document.getElementById('rm-id').value = '';
  document.getElementById('rm-live-total').textContent = '0.00 BDT';
  
  if (rmId) {
    const rm = rawMaterials.find(r => r.id === rmId);
    if (rm) {
      title.textContent = 'Edit Raw Material';
      document.getElementById('rm-id').value = rm.id;
      document.getElementById('rm-name').value = rm.name;
      document.getElementById('rm-category').value = rm.category || '';
      document.getElementById('rm-unit').value = rm.unit;
      document.getElementById('rm-qty').value = rm.quantity;
      document.getElementById('rm-price').value = rm.price;
      document.getElementById('rm-supplier').value = rm.supplierId;
      document.getElementById('rm-supplier-price').value = rm.supplierPrice || '';
      document.getElementById('rm-threshold').value = rm.threshold || 0;
      document.getElementById('rm-notes').value = rm.notes || '';
      window.updateLiveTotalPreview();
    }
  } else {
    title.textContent = 'Add Raw Material';
    document.getElementById('rm-category').value = '';
  }
};

// Render Table
window.renderRawMaterialsTable = function() {
  const tbody = document.getElementById('raw-materials-table-body');
  const emptyState = document.getElementById('rm-empty-state');
  const searchInput = (document.getElementById('rm-search-input') ? document.getElementById('rm-search-input').value.toLowerCase() : '');
  
  let filtered = rawMaterials.filter(rm => {
    const supplier = suppliers.find(s => s.id === rm.supplierId);
    const supplierName = supplier ? supplier.name.toLowerCase() : '';
    return rm.name.toLowerCase().includes(searchInput) || supplierName.includes(searchInput) || (rm.category && rm.category.toLowerCase().includes(searchInput));
  });
  
  // Sort by Name implicitly
  filtered.sort((a, b) => a.name.localeCompare(b.name));
  
  tbody.innerHTML = '';
  
  if (filtered.length === 0) {
    tbody.parentElement.classList.add('hidden');
    emptyState.classList.remove('hidden');
    document.getElementById('rm-pagination').classList.add('hidden');
  } else {
    tbody.parentElement.classList.remove('hidden');
    emptyState.classList.add('hidden');
    document.getElementById('rm-pagination').classList.remove('hidden');
    document.getElementById('rm-pagination').classList.add('flex');
    
    // Pagination Logic
    const totalPages = Math.ceil(filtered.length / window.itemsPerPage);
    if (window.currentPage > totalPages) window.currentPage = totalPages;
    if (window.currentPage < 1) window.currentPage = 1;
    
    const startIndex = (window.currentPage - 1) * window.itemsPerPage;
    const paginatedItems = filtered.slice(startIndex, startIndex + window.itemsPerPage);
    
    paginatedItems.forEach(rm => {
      const totalValue = rm.quantity * rm.price;
      const supplier = suppliers.find(s => s.id === rm.supplierId);
      const supplierName = supplier ? supplier.name : 'Unknown';
      
      const isLowStock = rm.quantity < (rm.threshold || 100);
      const lowStockBadge = isLowStock 
        ? `<span class="ml-2 px-1.5 py-0.5 bg-red-50 text-red-500 border border-red-100 rounded text-[9px] font-bold whitespace-nowrap">Low Stock</span>`
        : '';
        
      const statusBadge = `<span class="px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-md text-[10px] font-bold lowercase">active</span>`;
        
      const tr = document.createElement('tr');
      tr.className = 'bg-white hover:bg-slate-50/50 transition-colors border-b border-slate-100';
      tr.innerHTML = `
        <td class="px-6 py-4">
          <div class="flex items-center">
            <span class="font-bold text-slate-800 text-xs">${rm.name}</span>
            ${lowStockBadge}
          </div>
        </td>
        <td class="px-6 py-4 text-slate-600">${rm.category || 'Uncategorized'}</td>
        <td class="px-6 py-4 text-slate-600">${rm.unit}</td>
        <td class="px-6 py-4 text-slate-600">${rm.quantity}</td>
        <td class="px-6 py-4 text-slate-600">${rm.threshold || 0}</td>
        <td class="px-6 py-4 text-slate-600">${rm.price.toFixed(2)}</td>
        <td class="px-6 py-4 text-slate-600">${totalValue.toFixed(2)}</td>
        <td class="px-6 py-4">${statusBadge}</td>
        <td class="px-6 py-4 text-center">
          <button onclick="window.showRawMaterialFormView('${rm.id}')" class="px-4 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-lg text-[11px] font-bold transition-all shadow-sm cursor-pointer">
            Edit
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });
    
    // Update count display
    const countDisplay = document.getElementById('rm-count-display');
    if (countDisplay) {
      countDisplay.textContent = `Showing ${filtered.length} materials`;
    }
    
    const pageInfo = document.getElementById('rm-page-info');
    if (pageInfo) {
      pageInfo.textContent = `Page ${window.currentPage} of ${totalPages || 1}`;
    }
    
    // Re-initialize lucide icons for newly added HTML
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }
};

window.prevPage = function() {
  if (window.currentPage > 1) {
    window.currentPage--;
    window.renderRawMaterialsTable();
  }
};

window.nextPage = function() {
  const searchInput = (document.getElementById('rm-search-input') ? document.getElementById('rm-search-input').value.toLowerCase() : '');
  const filtered = rawMaterials.filter(rm => rm.name.toLowerCase().includes(searchInput));
  const totalPages = Math.ceil(filtered.length / window.itemsPerPage);
  if (window.currentPage < totalPages) {
    window.currentPage++;
    window.renderRawMaterialsTable();
  }
};

// Form Logic
window.updateLiveTotalPreview = function() {
  const qty = parseFloat(document.getElementById('rm-qty').value) || 0;
  const price = parseFloat(document.getElementById('rm-price').value) || 0;
  const total = qty * price;
  document.getElementById('rm-live-total').textContent = total.toFixed(2) + ' BDT';
};

window.renderSupplierDropdown = function() {
  const select = document.getElementById('rm-supplier');
  const currentVal = select.value;
  select.innerHTML = '<option value="">Select Supplier...</option>';
  suppliers.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = s.name;
    select.appendChild(opt);
  });
  if (currentVal && suppliers.find(s => s.id === currentVal)) {
    select.value = currentVal;
  }
};

window.toggleQuickAddSupplier = function() {
  const form = document.getElementById('rm-quick-supplier-form');
  const select = document.getElementById('rm-supplier');
  if (form.classList.contains('hidden')) {
    form.classList.remove('hidden');
    select.parentElement.classList.add('pb-2');
    document.getElementById('rm-new-supplier-name').focus();
  } else {
    form.classList.add('hidden');
    select.parentElement.classList.remove('pb-2');
    document.getElementById('rm-new-supplier-name').value = '';
  }
};

window.saveQuickSupplier = function() {
  const name = document.getElementById('rm-new-supplier-name').value.trim();
  if (!name) return alert('Supplier name is required');
  
  const newId = 'SUP-' + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  suppliers.push({ id: newId, name });
  
  window.renderSupplierDropdown();
  document.getElementById('rm-supplier').value = newId;
  window.toggleQuickAddSupplier();
};

window.toggleAdvancedFields = function() {
  const section = document.getElementById('rm-advanced-section');
  const icon = document.getElementById('rm-advanced-icon');
  if (section.classList.contains('hidden')) {
    section.classList.remove('hidden');
    icon.classList.add('rotate-180');
  } else {
    section.classList.add('hidden');
    icon.classList.remove('rotate-180');
  }
};

window.handleRawMaterialFormSubmit = function(e) {
  e.preventDefault();
  
  const id = document.getElementById('rm-id').value;
  const name = document.getElementById('rm-name').value.trim();
  const category = document.getElementById('rm-category').value.trim();
  const unit = document.getElementById('rm-unit').value;
  const quantity = parseFloat(document.getElementById('rm-qty').value);
  const price = parseFloat(document.getElementById('rm-price').value);
  const supplierId = document.getElementById('rm-supplier').value;
  const supplierPrice = parseFloat(document.getElementById('rm-supplier-price').value) || price;
  const threshold = parseInt(document.getElementById('rm-threshold').value) || 0;
  const notes = document.getElementById('rm-notes').value.trim();
  
  if (quantity <= 0) return alert('Quantity must be greater than 0');
  if (price <= 0) return alert('Price must be greater than 0');
  
  // Duplicate check
  const duplicate = rawMaterials.find(r => r.name.toLowerCase() === name.toLowerCase() && r.id !== id);
  if (duplicate) return alert('A raw material with this name already exists.');
  
  const timestamp = new Date().toISOString();
  
  if (id) {
    // Update
    const index = rawMaterials.findIndex(r => r.id === id);
    if (index !== -1) {
      rawMaterials[index] = { ...rawMaterials[index], name, category, unit, quantity, price, supplierId, supplierPrice, threshold, notes, lastUpdated: timestamp };
    }
  } else {
    // Create
    const newId = 'RM-' + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    rawMaterials.push({ id: newId, name, category, unit, quantity, price, supplierId, supplierPrice, threshold, notes, lastUpdated: timestamp });
  }
  
  // Note: Supplier Auto-Link Logic would ideally go here, dispatching an event or calling a global function 
  // to sync this new material linkage to the Supplier records database.
  console.log(`[Supplier Link Updated]: Supplier ${supplierId} provides ${name} at ${supplierPrice} BDT.`);
  
  window.renderRawMaterialsTable();
  window.showRawMaterialMainView();
};

window.deleteRawMaterial = function(id) {
  if (confirm('Are you sure you want to delete this raw material?')) {
    rawMaterials = rawMaterials.filter(rm => rm.id !== id);
    window.renderRawMaterialsTable();
  }
};
