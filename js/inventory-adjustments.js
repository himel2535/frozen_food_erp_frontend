import { appReadyPromise, appState, saveAppState, initIcons } from '/js/shared.js';

function escapeHtml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function formatCurrency(value) {
  return `$${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getList() {
  if (!appState.inventoryStockAdjustments) {
    appState.inventoryStockAdjustments = [
      {
        id: "SA-001",
        product: "Indigo Dye",
        warehouse: "Main WH",
        type: "Decrease",
        qty: 5,
        unitValue: 50,
        date: "2026-06-21",
        reasonCode: "Damage",
        referenceDoc: "AUD-100",
        notes: "Container cracked",
        status: "Completed"
      },
      {
        id: "SA-002",
        product: "Cotton Yarn",
        warehouse: "Raw Material WH",
        type: "Increase",
        qty: 20,
        unitValue: 12,
        date: "2026-06-22",
        reasonCode: "Found Item",
        referenceDoc: "AUD-101",
        notes: "Found during weekly cycle count",
        status: "Completed"
      },
      {
        id: "SA-003",
        product: "Denim Fabric",
        warehouse: "Finished Goods WH",
        type: "Decrease",
        qty: 2,
        unitValue: 120,
        date: "2026-06-23",
        reasonCode: "Shrinkage",
        referenceDoc: "",
        notes: "Unexplained shortage",
        status: "Pending"
      }
    ];
    saveAppState();
  }
  return appState.inventoryStockAdjustments;
}

window.showMainView = function() {
  document.getElementById('inventory-adjustments-main-view').classList.remove('hidden');
  document.getElementById('inventory-adjustments-form-view').classList.add('hidden');
};

window.showFormView = function() {
  document.getElementById('inventory-adjustments-main-view').classList.add('hidden');
  document.getElementById('inventory-adjustments-form-view').classList.remove('hidden');
};

window.openAdjustmentModal = function() {
  const form = document.getElementById('inventory-adjustments-form');
  if (form) form.reset();
  
  // Collapse advanced fields by default
  const section = document.getElementById('inventory-adjustments-advanced-section');
  const icon = document.getElementById('inventory-adjustments-advanced-icon');
  if (section && !section.classList.contains('hidden')) {
    section.classList.add('hidden');
    if (icon) icon.style.transform = 'rotate(0deg)';
  }
  
  // Update header text dynamically if editing later
  const titleEl = document.getElementById('adjustment-form-title');
  if (titleEl) titleEl.textContent = 'Create Adjustment';
  
  window.showFormView();
};

window.toggleAdvancedFields = function() {
  const section = document.getElementById('inventory-adjustments-advanced-section');
  const icon = document.getElementById('inventory-adjustments-advanced-icon');
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
  const type = document.getElementById("input-type").value;
  const qty = parseInt(document.getElementById("input-qty").value, 10);
  const unitValue = parseFloat(document.getElementById("input-unit-value").value);
  const date = document.getElementById("input-date").value;
  
  const reasonCode = document.getElementById("input-reason").value;
  const referenceDoc = document.getElementById("input-ref").value;
  const notes = document.getElementById("input-notes").value;
  
  const newRecord = { 
    id: `SA-${String(100 + list.length + 1).slice(1)}`, 
    product,
    warehouse,
    type,
    qty,
    unitValue,
    date,
    reasonCode,
    referenceDoc,
    notes,
    status: "Completed" // Default for now
  };
  
  list.push(newRecord);
  saveAppState();
  window.showMainView();
  renderAll();
};

window.renderTable = function() {
  const tbody = document.getElementById('inventory-adjustments-body');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  const search = document.getElementById('inventory-adjustments-search-input')?.value.toLowerCase() || '';
  
  const filtered = getList().filter(item => {
    return !search || Object.values(item).some(val => String(val).toLowerCase().includes(search));
  });
  
  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="11" class="p-8 text-center text-slate-400">No records found</td></tr>`;
    return;
  }
  
  filtered.forEach(item => {
    const totalValue = item.qty * item.unitValue;
    
    // Status Badge Logic
    let statusClass = "bg-slate-100 text-slate-600";
    if (item.status === 'Completed') statusClass = "bg-emerald-100 text-emerald-700";
    if (item.status === 'Pending') statusClass = "bg-amber-100 text-amber-700";

    // Type styling
    let typeClass = "text-red-600 bg-red-50";
    let typeIcon = "arrow-down";
    if (item.type === 'Increase') {
      typeClass = "text-emerald-600 bg-emerald-50";
      typeIcon = "arrow-up";
    }
    
    tbody.innerHTML += `
      <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100">
        <td class="p-4 font-bold text-slate-900">${escapeHtml(item.id)}</td>
        <td class="p-4 font-bold text-slate-800">${escapeHtml(item.product)}</td>
        <td class="p-4">${escapeHtml(item.warehouse)}</td>
        <td class="p-4">
          <span class="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold ${typeClass}">
            <i data-lucide="${typeIcon}" class="w-3 h-3"></i> ${escapeHtml(item.type)}
          </span>
        </td>
        <td class="p-4 font-semibold ${item.type === 'Decrease' ? 'text-red-600' : 'text-emerald-600'}">
          ${item.type === 'Decrease' ? '-' : '+'}${item.qty}
        </td>
        <td class="p-4">${formatCurrency(item.unitValue)}</td>
        <td class="p-4 font-semibold ${item.type === 'Decrease' ? 'text-red-600' : 'text-emerald-600'}">
          ${item.type === 'Decrease' ? '-' : '+'}${formatCurrency(totalValue)}
        </td>
        <td class="p-4">
          <div class="font-medium text-slate-700">${escapeHtml(item.reasonCode || '-')}</div>
        </td>
        <td class="p-4">${escapeHtml(item.date)}</td>
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
  const metricsContainer = document.getElementById('inventory-adjustments-metrics');
  if (!metricsContainer) return;
  
  const totalRuns = list.length;
  
  let totalIncreasedQty = 0;
  let totalDecreasedQty = 0;
  let netValue = 0;
  let pendingCount = 0;
  
  list.forEach(item => {
    const val = item.qty * item.unitValue;
    if (item.status === 'Completed') {
      if (item.type === 'Increase') {
        totalIncreasedQty += item.qty;
        netValue += val;
      } else {
        totalDecreasedQty += item.qty;
        netValue -= val;
      }
    } else if (item.status === 'Pending') {
      pendingCount++;
    }
  });
  
  const netValueColor = netValue < 0 ? "text-red-600" : (netValue > 0 ? "text-emerald-600" : "text-slate-950");
  const netValuePrefix = netValue > 0 ? "+" : "";

  metricsContainer.innerHTML = `
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Adjustments</span>
      <span class="text-xl font-extrabold text-slate-950 block mt-2">${totalRuns}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Increased Qty</span>
      <span class="text-xl font-extrabold text-emerald-600 block mt-2">+${totalIncreasedQty}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Decreased Qty</span>
      <span class="text-xl font-extrabold text-red-600 block mt-2">-${totalDecreasedQty}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Net Value Change</span>
      <span class="text-xl font-extrabold ${netValueColor} block mt-2">${netValuePrefix}${formatCurrency(netValue)}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pending Audits</span>
      <span class="text-xl font-extrabold text-amber-500 block mt-2">${pendingCount}</span>
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
