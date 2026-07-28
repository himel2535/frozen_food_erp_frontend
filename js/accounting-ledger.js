import { appReadyPromise, appState, saveAppState, initIcons } from '/js/shared.js';

function escapeHtml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function formatCurrency(value) {
  return `$${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getList() {
  if (!appState.accountingLedger) {
    appState.accountingLedger = [{ id: "TXN-001", account: "Office Expenses", desc: "Internet monthly fiber fee", debit: 120.00, credit: 0.00, balance: 12330.00, date: "2026-06-15" }];
    saveAppState();
  }
  return appState.accountingLedger;
}

window.showMainView = function() {
  document.getElementById('accounting-ledger-main-view').classList.remove('hidden');
  document.getElementById('accounting-ledger-form-view').classList.add('hidden');
};

window.showFormView = function() {
  document.getElementById('accounting-ledger-main-view').classList.add('hidden');
  document.getElementById('accounting-ledger-form-view').classList.remove('hidden');
};

window.openLedgerModal = function() {
  const form = document.getElementById('accounting-ledger-form');
  if (form) form.reset();
  window.showFormView();
};

window.handleSubmit = function(event) {
  event.preventDefault();
  const list = getList();
  
    const newRecord = { id: `TXN-${String(100 + list.length + 1).slice(1)}`, account: document.getElementById("input-account").value, desc: document.getElementById("input-desc").value, debit: parseFloat(document.getElementById("input-debit").value || 0), credit: parseFloat(document.getElementById("input-credit").value || 0), balance: 12330.00, date: document.getElementById("input-date").value };
  
  list.push(newRecord);
  saveAppState();
  window.showMainView();
  renderAll();
};

window.renderTable = function() {
  const tbody = document.getElementById('accounting-ledger-body');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  const search = document.getElementById('accounting-ledger-search-input')?.value.toLowerCase() || '';
  const typeFilter = document.getElementById('accounting-ledger-type-filter')?.value || 'all';
  
  const filtered = getList().filter(item => {
    const searchMatch = !search || Object.values(item).some(val => String(val).toLowerCase().includes(search));
    const typeMatch = typeFilter === 'all' || String(item.account).toLowerCase().includes(typeFilter);
    return searchMatch && typeMatch;
  });
  
  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" class="p-8 text-center text-slate-400">No records found</td></tr>`;
    return;
  }
  
  filtered.forEach(item => {
    tbody.innerHTML += `
      <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100">
        <td class="p-4 font-bold text-slate-900">${escapeHtml(item.id)}</td><td class="p-4">${escapeHtml(item.account)}</td><td class="p-4">${escapeHtml(item.desc)}</td><td class="p-4 font-bold">${formatCurrency(item.debit)}</td><td class="p-4 font-bold">${formatCurrency(item.credit)}</td><td class="p-4 font-extrabold text-indigo-600">${formatCurrency(item.balance)}</td><td class="p-4">${escapeHtml(item.date)}</td>
      </tr>
    `;
  });
};

function renderMetrics() {
  const list = getList();
  const metricsContainer = document.getElementById('accounting-ledger-metrics');
  if (!metricsContainer) return;
  
  const totalDebit = list.reduce((sum, item) => sum + (item.debit || 0), 0);
  const totalCredit = list.reduce((sum, item) => sum + (item.credit || 0), 0);
  const netBalance = totalDebit - totalCredit;
  
  metricsContainer.innerHTML = `
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <div class="flex items-center justify-between">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Net Ledger Balance</span>
        <div class="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center"><i data-lucide="scale" class="w-4 h-4"></i></div>
      </div>
      <span class="text-xl font-extrabold text-slate-950 block mt-2">${formatCurrency(netBalance)}</span>
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
