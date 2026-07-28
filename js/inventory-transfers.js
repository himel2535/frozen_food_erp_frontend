import { appReadyPromise, appState, saveAppState, initIcons } from '/js/shared.js';

function escapeHtml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function formatCurrency(value) {
  return `$${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getList() {
  if (!appState.inventoryStockTransfers) {
    appState.inventoryStockTransfers = [{ id: "ST-001", product: "Silk Satin Blend", fromWh: "Central Hub", toWh: "Production WH", qty: 50, date: "2026-06-22" }];
    saveAppState();
  }
  return appState.inventoryStockTransfers;
}

window.showMainView = function() {
  document.getElementById('inventory-transfers-main-view').classList.remove('hidden');
  document.getElementById('inventory-transfers-form-view').classList.add('hidden');
};

window.showFormView = function() {
  document.getElementById('inventory-transfers-main-view').classList.add('hidden');
  document.getElementById('inventory-transfers-form-view').classList.remove('hidden');
};

window.openTransferModal = function() {
  const form = document.getElementById('inventory-transfers-form');
  if (form) form.reset();
  window.showFormView();
};

window.handleSubmit = function(event) {
  event.preventDefault();
  const list = getList();
  
    const newRecord = { id: `ST-${String(100 + list.length + 1).slice(1)}`, product: document.getElementById("input-prod").value, fromWh: document.getElementById("input-from").value, toWh: document.getElementById("input-to").value, qty: parseInt(document.getElementById("input-qty").value), date: document.getElementById("input-date").value };
  
  list.push(newRecord);
  saveAppState();
  window.showMainView();
  renderAll();
};

window.renderTable = function() {
  const tbody = document.getElementById('inventory-transfers-body');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  const search = document.getElementById('inventory-transfers-search-input')?.value.toLowerCase() || '';
  
  const filtered = getList().filter(item => {
    return !search || Object.values(item).some(val => String(val).toLowerCase().includes(search));
  });
  
  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" class="p-8 text-center text-slate-400">No records found</td></tr>`;
    return;
  }
  
  filtered.forEach(item => {
    tbody.innerHTML += `
      <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100">
        <td class="p-4 font-bold text-slate-900">${escapeHtml(item.id)}</td><td class="p-4">${escapeHtml(item.product)}</td><td class="p-4">${escapeHtml(item.fromWh)}</td><td class="p-4">${escapeHtml(item.toWh)}</td><td class="p-4">${item.qty}</td><td class="p-4">${escapeHtml(item.date)}</td>
      </tr>
    `;
  });
};

function renderMetrics() {
  const list = getList();
  const metricsContainer = document.getElementById('inventory-transfers-metrics');
  if (!metricsContainer) return;
  
  metricsContainer.innerHTML = `
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <div class="flex items-center justify-between">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Transfers</span>
        <div class="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><i data-lucide="arrow-right-left" class="w-4 h-4"></i></div>
      </div>
      <span class="text-xl font-extrabold text-slate-950 block mt-2">${list.length}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <div class="flex items-center justify-between">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pending</span>
        <div class="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center"><i data-lucide="clock" class="w-4 h-4"></i></div>
      </div>
      <span class="text-xl font-extrabold text-slate-950 block mt-2">0</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <div class="flex items-center justify-between">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Completed</span>
        <div class="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><i data-lucide="check-circle" class="w-4 h-4"></i></div>
      </div>
      <span class="text-xl font-extrabold text-slate-950 block mt-2">${list.length}</span>
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
