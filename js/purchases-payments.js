import { appReadyPromise, appState, saveAppState, initIcons } from '/js/shared.js';

function escapeHtml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function formatCurrency(value) {
  return `$${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getList() {
  if (!appState.purchasesPayments) {
    appState.purchasesPayments = [
      {
        id: "PP-001",
        billRef: "BILL-2026-0001",
        supplier: "Global Dye Chemicals",
        method: "Bank Transfer",
        txnRef: "TXN-99887766",
        date: "2026-06-18",
        amount: 825.00,
        status: "Completed",
        notes: "Paid in full."
      },
      {
        id: "PP-002",
        billRef: "BILL-2026-0012",
        supplier: "Premium Yarns Ltd",
        method: "Credit Card",
        txnRef: "CC-442211",
        date: "2026-06-20",
        amount: 1500.00,
        status: "Pending",
        notes: "Awaiting clearing."
      },
      {
        id: "PP-003",
        billRef: "BILL-2026-0015",
        supplier: "Machinery Spares Co",
        method: "Cheque",
        txnRef: "CHQ-00123",
        date: "2026-06-22",
        amount: 5000.00,
        status: "Failed",
        notes: "Cheque bounced due to signature mismatch."
      }
    ];
    saveAppState();
  }
  return appState.purchasesPayments;
}

window.showMainView = function() {
  document.getElementById('purchases-payments-main-view').classList.remove('hidden');
  document.getElementById('purchases-payments-form-view').classList.add('hidden');
};

window.showFormView = function() {
  document.getElementById('purchases-payments-main-view').classList.add('hidden');
  document.getElementById('purchases-payments-form-view').classList.remove('hidden');
};

window.openPaymentModal = function() {
  const form = document.getElementById('purchases-payments-form');
  if (form) form.reset();
  
  // Collapse advanced fields by default
  const section = document.getElementById('purchases-payments-advanced-section');
  const icon = document.getElementById('purchases-payments-advanced-icon');
  if (section && !section.classList.contains('hidden')) {
    section.classList.add('hidden');
    if (icon) icon.style.transform = 'rotate(0deg)';
  }
  
  // Update header text dynamically if editing later
  const titleEl = document.getElementById('payment-form-title');
  if (titleEl) titleEl.textContent = 'Create Payment';
  
  window.showFormView();
};

window.toggleAdvancedFields = function() {
  const section = document.getElementById('purchases-payments-advanced-section');
  const icon = document.getElementById('purchases-payments-advanced-icon');
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
  
  const billRef = document.getElementById("input-bill-ref").value;
  const supplier = document.getElementById("input-supp").value;
  const method = document.getElementById("input-method").value;
  const amount = parseFloat(document.getElementById("input-amount").value);
  const date = document.getElementById("input-date").value;
  const status = document.getElementById("input-status").value;
  
  const txnRef = document.getElementById("input-txn-ref").value;
  const notes = document.getElementById("input-notes").value;
  
  const newRecord = { 
    id: `PP-${String(100 + list.length + 1).slice(1)}`, 
    billRef,
    supplier,
    method,
    amount,
    date,
    status,
    txnRef,
    notes
  };
  
  list.push(newRecord);
  saveAppState();
  window.showMainView();
  renderAll();
};

window.renderTable = function() {
  const tbody = document.getElementById('purchases-payments-body');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  const search = document.getElementById('purchases-payments-search-input')?.value.toLowerCase() || '';
  
  const filtered = getList().filter(item => {
    return !search || Object.values(item).some(val => String(val).toLowerCase().includes(search));
  });
  
  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" class="p-8 text-center text-slate-400">No records found</td></tr>`;
    return;
  }
  
  filtered.forEach(item => {
    // Status Badge Logic
    let statusClass = "bg-slate-100 text-slate-600";
    if (item.status === 'Completed') statusClass = "bg-emerald-100 text-emerald-700";
    if (item.status === 'Pending') statusClass = "bg-amber-100 text-amber-700";
    if (item.status === 'Failed') statusClass = "bg-red-100 text-red-700";
    
    tbody.innerHTML += `
      <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100">
        <td class="p-4 font-bold text-slate-900">${escapeHtml(item.id)}</td>
        <td class="p-4 font-semibold text-blue-600 cursor-pointer hover:underline">${escapeHtml(item.billRef)}</td>
        <td class="p-4">
          <div class="font-bold text-slate-800">${escapeHtml(item.supplier)}</div>
        </td>
        <td class="p-4">
          <div class="font-medium text-slate-700">${escapeHtml(item.method)}</div>
          <div class="text-[10px] text-slate-400">${escapeHtml(item.txnRef || '-')}</div>
        </td>
        <td class="p-4">${escapeHtml(item.date)}</td>
        <td class="p-4 font-bold text-slate-900">${formatCurrency(item.amount)}</td>
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
  const metricsContainer = document.getElementById('purchases-payments-metrics');
  if (!metricsContainer) return;
  
  const totalPayments = list.length;
  
  let totalPaid = 0;
  let pendingCount = 0;
  
  list.forEach(item => {
    if (item.status === 'Completed') {
        totalPaid += item.amount;
    }
    if (item.status === 'Pending') {
        pendingCount++;
    }
  });
  
  // Calculate average payment based only on completed payments
  const completedCount = list.filter(item => item.status === 'Completed').length;
  const avgPayment = completedCount > 0 ? (totalPaid / completedCount) : 0;
  
  metricsContainer.innerHTML = `
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Payments</span>
      <span class="text-xl font-extrabold text-slate-950 block mt-2">${totalPayments}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Amount Paid</span>
      <span class="text-xl font-extrabold text-emerald-600 block mt-2">${formatCurrency(totalPaid)}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pending Payments</span>
      <span class="text-xl font-extrabold text-amber-500 block mt-2">${pendingCount}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Avg. Payment Size</span>
      <span class="text-xl font-extrabold text-slate-950 block mt-2">${formatCurrency(avgPayment)}</span>
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
