import { appReadyPromise, appState, saveAppState, initIcons } from '/js/shared.js';

function escapeHtml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function formatCurrency(value) {
  return `$${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getList() {
  if (!appState.accountingPL) {
    appState.accountingPL = [{ category: "Revenue", item: "Sales Revenues", amount: 12450.00 }, { category: "Expenses", item: "Internet Fiber monthly fee", amount: -120.00 }];
    saveAppState();
  }
  return appState.accountingPL;
}

window.showMainView = function() {
  document.getElementById('accounting-pl-main-view').classList.remove('hidden');
  document.getElementById('accounting-pl-form-view').classList.add('hidden');
};

window.showFormView = function() {
  document.getElementById('accounting-pl-main-view').classList.add('hidden');
  document.getElementById('accounting-pl-form-view').classList.remove('hidden');
};

window.openProfitlossModal = function() {
  const form = document.getElementById('accounting-pl-form');
  if (form) form.reset();
  window.showFormView();
};

window.handleSubmit = function(event) {
  event.preventDefault();
  const list = getList();
  
    const newRecord = { category: document.getElementById("input-cat").value, item: document.getElementById("input-name").value, amount: parseFloat(document.getElementById("input-amount").value) };
  
  list.push(newRecord);
  saveAppState();
  window.showMainView();
  renderAll();
};

window.renderTable = function() {
  const tbody = document.getElementById('accounting-pl-body');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  const search = document.getElementById('accounting-pl-search-input')?.value.toLowerCase() || '';
  
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
        <td class="p-4 font-bold">${escapeHtml(item.category)}</td><td class="p-4">${escapeHtml(item.item)}</td><td class="p-4 font-bold ${item.amount >= 0 ? "text-emerald-600" : "text-rose-600"}">${formatCurrency(item.amount)}</td>
      </tr>
    `;
  });
};

function renderMetrics() {
  const list = getList();
  const metricsContainer = document.getElementById('accounting-pl-metrics');
  if (!metricsContainer) return;
  
  const totalRevenue = list.filter(i => i.category.toLowerCase().includes('revenue') || i.category.toLowerCase().includes('income')).reduce((sum, item) => sum + (item.amount || 0), 0) || 120000;
  const totalExpenses = list.filter(i => i.category.toLowerCase().includes('expense') || i.category.toLowerCase().includes('cost')).reduce((sum, item) => sum + (item.amount || 0), 0) || 107670;
  const netIncome = totalRevenue - totalExpenses;
  
  metricsContainer.innerHTML = `
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <div class="flex items-center justify-between">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Gross Revenue</span>
        <div class="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center"><i data-lucide="trending-up" class="w-4 h-4"></i></div>
      </div>
      <span class="text-xl font-extrabold text-slate-950 block mt-2">${formatCurrency(totalRevenue)}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <div class="flex items-center justify-between">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Expenses</span>
        <div class="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center"><i data-lucide="trending-down" class="w-4 h-4"></i></div>
      </div>
      <span class="text-xl font-extrabold text-slate-950 block mt-2">${formatCurrency(totalExpenses)}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <div class="flex items-center justify-between">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Net Income</span>
        <div class="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><i data-lucide="dollar-sign" class="w-4 h-4"></i></div>
      </div>
      <span class="text-xl font-extrabold text-emerald-600 block mt-2">${formatCurrency(netIncome)}</span>
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
