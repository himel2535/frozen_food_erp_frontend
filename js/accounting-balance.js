import { appReadyPromise, appState, saveAppState, initIcons } from '/js/shared.js';

function escapeHtml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function formatCurrency(value) {
  return `$${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getList() {
  if (!appState.accountingBalanceSheet) {
    appState.accountingBalanceSheet = [{ group: "Assets", name: "Cash at Bank", amount: 45000.00 }, { group: "Liabilities", name: "Accounts Payable", amount: 1260.00 }];
    saveAppState();
  }
  return appState.accountingBalanceSheet;
}

window.showMainView = function() {
  document.getElementById('accounting-balance-main-view').classList.remove('hidden');
  document.getElementById('accounting-balance-form-view').classList.add('hidden');
};

window.showFormView = function() {
  document.getElementById('accounting-balance-main-view').classList.add('hidden');
  document.getElementById('accounting-balance-form-view').classList.remove('hidden');
};

window.openBalancesheetModal = function() {
  const form = document.getElementById('accounting-balance-form');
  if (form) form.reset();
  window.showFormView();
};

window.handleSubmit = function(event) {
  event.preventDefault();
  const list = getList();
  
    const newRecord = { group: document.getElementById("input-class").value, name: document.getElementById("input-name").value, amount: parseFloat(document.getElementById("input-amount").value) };
  
  list.push(newRecord);
  saveAppState();
  window.showMainView();
  renderAll();
};

window.renderTable = function() {
  const tbody = document.getElementById('accounting-balance-body');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  const search = document.getElementById('accounting-balance-search-input')?.value.toLowerCase() || '';
  
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
        <td class="p-4 font-bold text-slate-900">${escapeHtml(item.group)}</td><td class="p-4">${escapeHtml(item.name)}</td><td class="p-4 font-bold text-indigo-600">${formatCurrency(item.amount)}</td>
      </tr>
    `;
  });
};

function renderMetrics() {
  const list = getList();
  const metricsContainer = document.getElementById('accounting-balance-metrics');
  if (!metricsContainer) return;
  
  const totalAssets = list.filter(i => i.group.toLowerCase().includes('asset')).reduce((sum, item) => sum + (item.amount || 0), 0) || 45000;
  const totalLiabilities = list.filter(i => i.group.toLowerCase().includes('liabilit')).reduce((sum, item) => sum + (item.amount || 0), 0) || 12500;
  
  metricsContainer.innerHTML = `
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <div class="flex items-center justify-between">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Asset Value</span>
        <div class="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center"><i data-lucide="landmark" class="w-4 h-4"></i></div>
      </div>
      <span class="text-xl font-extrabold text-slate-950 block mt-2">${formatCurrency(totalAssets)}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <div class="flex items-center justify-between">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Liabilities</span>
        <div class="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center"><i data-lucide="trending-down" class="w-4 h-4"></i></div>
      </div>
      <span class="text-xl font-extrabold text-slate-950 block mt-2">${formatCurrency(totalLiabilities)}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <div class="flex items-center justify-between">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Net Equity</span>
        <div class="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><i data-lucide="scale" class="w-4 h-4"></i></div>
      </div>
      <span class="text-xl font-extrabold text-slate-950 block mt-2">${formatCurrency(totalAssets - totalLiabilities)}</span>
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
