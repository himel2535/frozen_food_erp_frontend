import { appReadyPromise, appState, saveAppState, initIcons } from '/js/shared.js';

function escapeHtml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function formatCurrency(value) {
  return `$${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getList() {
  if (!appState.inventoryStockOut) {
    appState.inventoryStockOut = [
      {
        id: "SO-001",
        product: "Indigo Dye",
        warehouse: "Main WH",
        qty: 15,
        unitValue: 50,
        date: "2026-06-21",
        sourceType: "Sales",
        referenceDoc: "SO-1042",
        status: "Completed",
        reasonCode: "Sales Delivery",
        notes: "Delivered to customer",
        batch: "B-001"
      },
      {
        id: "SO-002",
        product: "Cotton Yarn",
        warehouse: "Raw Material WH",
        qty: 100,
        unitValue: 12,
        date: "2026-06-22",
        sourceType: "Manufacturing",
        referenceDoc: "MO-89",
        status: "Completed",
        reasonCode: "Manufacturing Consumption",
        notes: "Moved to production line 1",
        batch: "B-009"
      },
      {
        id: "SO-003",
        product: "Denim Fabric",
        warehouse: "Finished Goods WH",
        qty: 5,
        unitValue: 120,
        date: "2026-06-23",
        sourceType: "Damage",
        referenceDoc: "",
        status: "Completed",
        reasonCode: "Damage",
        notes: "Water damage in corner",
        batch: ""
      },
      {
        id: "SO-004",
        product: "Linen Thread",
        warehouse: "Main WH",
        qty: 20,
        unitValue: 8,
        date: "2026-06-25",
        sourceType: "Sales",
        referenceDoc: "SO-1045",
        status: "Pending",
        reasonCode: "Sales Delivery",
        notes: "Awaiting pickup",
        batch: ""
      }
    ];
    saveAppState();
  }
  return appState.inventoryStockOut;
}

window.showMainView = function() {
  document.getElementById('inventory-stock-out-main-view').classList.remove('hidden');
  document.getElementById('inventory-stock-out-form-view').classList.add('hidden');
};

window.showFormView = function() {
  document.getElementById('inventory-stock-out-main-view').classList.add('hidden');
  document.getElementById('inventory-stock-out-form-view').classList.remove('hidden');
};

window.openStockoutModal = function() {
  const form = document.getElementById('inventory-stock-out-form');
  if (form) form.reset();
  
  // Collapse advanced fields by default
  const section = document.getElementById('inventory-stock-out-advanced-section');
  const icon = document.getElementById('inventory-stock-out-advanced-icon');
  if (section && !section.classList.contains('hidden')) {
    section.classList.add('hidden');
    if (icon) icon.style.transform = 'rotate(0deg)';
  }
  
  // Update header text dynamically if editing later
  const titleEl = document.getElementById('stock-out-form-title');
  if (titleEl) titleEl.textContent = 'Create Stockout';
  
  window.showFormView();
};

window.toggleAdvancedFields = function() {
  const section = document.getElementById('inventory-stock-out-advanced-section');
  const icon = document.getElementById('inventory-stock-out-advanced-icon');
  if (section.classList.contains('hidden')) {
    section.classList.remove('hidden');
    if (icon) icon.style.transform = 'rotate(180deg)';
  } else {
    section.classList.add('hidden');
    if (icon) icon.style.transform = 'rotate(0deg)';
  }
};

window.handleSubmit = function(event) {
  event.preventDefault();
  const list = getList();
  
  const product = document.getElementById("input-prod").value;
  const warehouse = document.getElementById("input-wh").value;
  const qty = parseInt(document.getElementById("input-qty").value, 10);
  const unitValue = parseFloat(document.getElementById("input-unit-value").value);
  const date = document.getElementById("input-date").value;
  const sourceType = document.getElementById("input-source-type").value;
  
  const referenceDoc = document.getElementById("input-ref").value;
  const reasonCode = document.getElementById("input-reason").value;
  const batch = document.getElementById("input-batch").value;
  const notes = document.getElementById("input-notes").value;
  
  const newRecord = { 
    id: `SO-${String(100 + list.length + 1).slice(1)}`, 
    product,
    warehouse,
    qty,
    unitValue,
    date,
    sourceType,
    status: "Completed", // By default new stockouts are completed
    referenceDoc,
    reasonCode,
    batch,
    notes
  };
  
  list.push(newRecord);
  saveAppState();
  window.showMainView();
  renderAll();
};

window.renderTable = function() {
  const tbody = document.getElementById('inventory-stock-out-body');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  const search = document.getElementById('inventory-stock-out-search-input')?.value.toLowerCase() || '';
  
  const filtered = getList().filter(item => {
    return !search || Object.values(item).some(val => String(val).toLowerCase().includes(search));
  });
  
  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" class="p-8 text-center text-slate-400">No records found</td></tr>`;
    return;
  }
  
  filtered.forEach(item => {
    const totalValue = item.qty * item.unitValue;
    
    // Status Badge Logic
    let statusClass = "bg-slate-100 text-slate-600";
    if (item.status === 'Completed') statusClass = "bg-emerald-100 text-emerald-700";
    if (item.status === 'Pending') statusClass = "bg-amber-100 text-amber-700";
    
    tbody.innerHTML += `
      <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100">
        <td class="p-4 font-bold text-slate-900">${escapeHtml(item.id)}</td>
        <td class="p-4">
          <div class="font-bold text-slate-800">${escapeHtml(item.product)}</div>
          <div class="text-[10px] text-slate-400">${item.batch ? 'Batch: ' + escapeHtml(item.batch) : ''}</div>
        </td>
        <td class="p-4">${escapeHtml(item.warehouse)}</td>
        <td class="p-4 font-semibold">${item.qty}</td>
        <td class="p-4">${formatCurrency(item.unitValue)}</td>
        <td class="p-4 font-semibold">${formatCurrency(totalValue)}</td>
        <td class="p-4">${escapeHtml(item.date)}</td>
        <td class="p-4">
          <div class="font-medium text-slate-700">${escapeHtml(item.sourceType)}</div>
          <div class="text-[10px] text-slate-400">${escapeHtml(item.referenceDoc || '-')}</div>
        </td>
        <td class="p-4">
          <span class="px-2 py-1 rounded-md text-[10px] font-bold ${statusClass}">
            ${escapeHtml(item.status)}
          </span>
        </td>
        <td class="p-4 text-right">
          <button class="text-blue-600 hover:text-blue-800 p-1 cursor-pointer transition-colors" title="Edit">
            <i data-lucide="edit-2" class="w-4 h-4"></i>
          </button>
        </td>
      </tr>
    `;
  });
};

function renderMetrics() {
  const list = getList();
  const metricsContainer = document.getElementById('inventory-stock-out-metrics');
  if (!metricsContainer) return;
  
  const totalRuns = list.length;
  
  let totalQty = 0;
  let totalValue = 0;
  let pendingQty = 0;
  let lostValue = 0;
  
  list.forEach(item => {
    const val = item.qty * item.unitValue;
    if (item.status === 'Completed') {
      totalQty += item.qty;
      totalValue += val;
      
      if (item.sourceType === 'Damage' || item.reasonCode === 'Damage' || item.reasonCode === 'Expiry') {
        lostValue += val;
      }
    } else if (item.status === 'Pending') {
      pendingQty += item.qty;
    }
  });
  
  metricsContainer.innerHTML = `
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Runs</span>
      <span class="text-xl font-extrabold text-slate-950 block mt-2">${totalRuns}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Issued Qty</span>
      <span class="text-xl font-extrabold text-blue-600 block mt-2">${totalQty}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Out Value</span>
      <span class="text-xl font-extrabold text-slate-950 block mt-2">${formatCurrency(totalValue)}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pending Stock-Out</span>
      <span class="text-xl font-extrabold text-amber-500 block mt-2">${pendingQty}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Lost/Damaged Value</span>
      <span class="text-xl font-extrabold text-red-500 block mt-2">${formatCurrency(lostValue)}</span>
    </div>
  `;
}

function renderAll() {
  renderMetrics();
  window.renderTable();
  initIcons();
}

document.addEventListener('DOMContentLoaded', async () => {
  await appReadyPromise;
  renderAll();
});
