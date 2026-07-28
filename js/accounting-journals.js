import { appReadyPromise, appState, saveAppState, initIcons } from '/js/shared.js';

function escapeHtml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function formatCurrency(value) {
  return `$${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getList() {
  if (!appState.accountingJournals) {
    appState.accountingJournals = [{ id: "JRN-001", account: "Cash", desc: "Capital introduction", debit: 50000.00, credit: 0.00, date: "2026-06-01" }];
    saveAppState();
  }
  return appState.accountingJournals;
}

window.showMainView = function() {
  document.getElementById('accounting-journals-main-view').classList.remove('hidden');
  document.getElementById('accounting-journals-form-view').classList.add('hidden');
};

window.showFormView = function() {
  document.getElementById('accounting-journals-main-view').classList.add('hidden');
  document.getElementById('accounting-journals-form-view').classList.remove('hidden');
};

window.openJournalModal = function() {
  const form = document.getElementById('accounting-journals-form');
  if (form) form.reset();
  window.showFormView();
};

window.handleSubmit = function(event) {
  event.preventDefault();
  const list = getList();
  
    const newRecord = { id: `JRN-${String(100 + list.length + 1).slice(1)}`, account: document.getElementById("input-account").value, desc: document.getElementById("input-desc").value, debit: parseFloat(document.getElementById("input-debit").value || 0), credit: parseFloat(document.getElementById("input-credit").value || 0), date: document.getElementById("input-date").value };
  
  list.push(newRecord);
  saveAppState();
  window.showMainView();
  renderAll();
};

window.renderTable = function() {
  const tbody = document.getElementById('accounting-journals-body');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  const search = document.getElementById('accounting-journals-search-input')?.value.toLowerCase() || '';
  
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
        <td class="p-4 font-bold text-slate-900">${escapeHtml(item.id)}</td><td class="p-4">${escapeHtml(item.account)}</td><td class="p-4">${escapeHtml(item.desc)}</td><td class="p-4 text-emerald-600 font-bold">${formatCurrency(item.debit)}</td><td class="p-4 text-rose-600 font-bold">${formatCurrency(item.credit)}</td><td class="p-4">${escapeHtml(item.date)}</td>
      </tr>
    `;
  });
};

function renderMetrics() {
  const list = getList();
  const metricsContainer = document.getElementById('accounting-journals-metrics');
  if (!metricsContainer) return;
  
  const totalDebit = list.reduce((sum, item) => sum + (item.debit || 0), 0);
  
  metricsContainer.innerHTML = `
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <div class="flex items-center justify-between">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Entries</span>
        <div class="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center"><i data-lucide="file-text" class="w-4 h-4"></i></div>
      </div>
      <span class="text-xl font-extrabold text-slate-950 block mt-2">${list.length}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <div class="flex items-center justify-between">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Debit Volume</span>
        <div class="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><i data-lucide="arrow-down-to-line" class="w-4 h-4"></i></div>
      </div>
      <span class="text-xl font-extrabold text-slate-950 block mt-2">${formatCurrency(totalDebit)}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <div class="flex items-center justify-between">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pending Approvals</span>
        <div class="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center"><i data-lucide="clock" class="w-4 h-4"></i></div>
      </div>
      <span class="text-xl font-extrabold text-slate-950 block mt-2">0</span>
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
