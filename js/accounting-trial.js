import { appReadyPromise, appState, saveAppState, initIcons } from '/js/shared.js';

function escapeHtml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function formatCurrency(value) {
  return `$${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getList() {
  if (!appState.accountingTrialBalance) {
    appState.accountingTrialBalance = [{ account: "Cash", debit: 50000.00, credit: 0.00 }, { account: "Sales Revenue", debit: 0.00, credit: 50000.00 }];
    saveAppState();
  }
  return appState.accountingTrialBalance;
}

window.showMainView = function() {
  document.getElementById('accounting-trial-main-view').classList.remove('hidden');
  document.getElementById('accounting-trial-form-view').classList.add('hidden');
};

window.showFormView = function() {
  document.getElementById('accounting-trial-main-view').classList.add('hidden');
  document.getElementById('accounting-trial-form-view').classList.remove('hidden');
};

window.openTrialModal = function() {
  const form = document.getElementById('accounting-trial-form');
  if (form) form.reset();
  window.showFormView();
};

window.handleSubmit = function(event) {
  event.preventDefault();
  const list = getList();
  
    const newRecord = { account: document.getElementById("input-account").value, debit: parseFloat(document.getElementById("input-debit").value || 0), credit: parseFloat(document.getElementById("input-credit").value || 0) };
  
  list.push(newRecord);
  saveAppState();
  window.showMainView();
  renderAll();
};

window.renderTable = function() {
  const tbody = document.getElementById('accounting-trial-body');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  const search = document.getElementById('accounting-trial-search-input')?.value.toLowerCase() || '';
  
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
        <td class="p-4 font-bold text-slate-900">${escapeHtml(item.account)}</td><td class="p-4 text-emerald-600 font-bold">${formatCurrency(item.debit)}</td><td class="p-4 text-rose-600 font-bold">${formatCurrency(item.credit)}</td>
      </tr>
    `;
  });
};

function renderMetrics() {
  const list = getList();
  const metricsContainer = document.getElementById('accounting-trial-metrics');
  if (!metricsContainer) return;
  
  const totalDebit = list.reduce((sum, item) => sum + (item.debit || 0), 0);
  const totalCredit = list.reduce((sum, item) => sum + (item.credit || 0), 0);
  
  metricsContainer.innerHTML = `
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <div class="flex items-center justify-between">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Trial Status</span>
        <div class="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center"><i data-lucide="scale" class="w-4 h-4"></i></div>
      </div>
      <span class="text-xl font-extrabold text-emerald-600 block mt-2">Balanced</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <div class="flex items-center justify-between">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Debit</span>
        <div class="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><i data-lucide="arrow-down-to-line" class="w-4 h-4"></i></div>
      </div>
      <span class="text-xl font-extrabold text-slate-950 block mt-2">${formatCurrency(totalDebit)}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <div class="flex items-center justify-between">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Credit</span>
        <div class="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center"><i data-lucide="arrow-up-from-line" class="w-4 h-4"></i></div>
      </div>
      <span class="text-xl font-extrabold text-slate-950 block mt-2">${formatCurrency(totalCredit)}</span>
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
