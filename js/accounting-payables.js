import { appReadyPromise, appState, saveAppState, initIcons } from '/js/shared.js';

function escapeHtml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function formatCurrency(value) {
  return `$${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getList() {
  if (!appState.accountingPayables) {
    appState.accountingPayables = [
      {
        id: "PAY-001",
        billRef: "BILL-2026-0001",
        vendor: "Global Dye Chemicals",
        dueDate: "2026-06-18",
        totalAmount: 825.00,
        balanceDue: 0.00,
        status: "Paid",
        method: "Bank Transfer",
        refNo: "TXN-99887766",
        notes: "Paid in full."
      },
      {
        id: "PAY-002",
        billRef: "BILL-2026-0012",
        vendor: "Premium Yarns Ltd",
        dueDate: "2026-06-12",
        totalAmount: 1500.00,
        balanceDue: 1500.00,
        status: "Overdue",
        method: "",
        refNo: "",
        notes: "Awaiting approval to pay."
      },
      {
        id: "PAY-003",
        billRef: "BILL-2026-0015",
        vendor: "Machinery Spares Co",
        dueDate: "2026-06-30",
        totalAmount: 5000.00,
        balanceDue: 2500.00,
        status: "Partial",
        method: "Cheque",
        refNo: "CHQ-00123",
        notes: "50% advance given."
      }
    ];
    saveAppState();
  }
  return appState.accountingPayables;
}

window.showMainView = function() {
  document.getElementById('accounting-payables-main-view').classList.remove('hidden');
  document.getElementById('accounting-payables-form-view').classList.add('hidden');
};

window.showFormView = function() {
  document.getElementById('accounting-payables-main-view').classList.add('hidden');
  document.getElementById('accounting-payables-form-view').classList.remove('hidden');
};

window.openPayableModal = function() {
  const form = document.getElementById('accounting-payables-form');
  if (form) form.reset();
  
  // Collapse advanced fields by default
  const section = document.getElementById('accounting-payables-advanced-section');
  const icon = document.getElementById('accounting-payables-advanced-icon');
  if (section && !section.classList.contains('hidden')) {
    section.classList.add('hidden');
    if (icon) icon.style.transform = 'rotate(0deg)';
  }
  
  const titleEl = document.getElementById('payable-form-title');
  if (titleEl) titleEl.textContent = 'Make Payment';
  
  window.showFormView();
};

window.toggleAdvancedFields = function() {
  const section = document.getElementById('accounting-payables-advanced-section');
  const icon = document.getElementById('accounting-payables-advanced-icon');
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
  
  const vendor = document.getElementById("input-vendor").value;
  const billRef = document.getElementById("input-bill").value;
  const amount = parseFloat(document.getElementById("input-amount").value);
  const date = document.getElementById("input-date").value;
  
  const method = document.getElementById("input-method").value;
  const refNo = document.getElementById("input-ref-no").value;
  const notes = document.getElementById("input-notes").value;
  
  // Find if bill exists, update balance, else create new
  const existing = list.find(item => item.billRef === billRef);
  
  if (existing) {
      existing.balanceDue = Math.max(0, existing.balanceDue - amount);
      if (existing.balanceDue === 0) {
          existing.status = "Paid";
      } else if (existing.balanceDue < existing.totalAmount) {
          existing.status = "Partial";
      }
      existing.method = method;
      existing.refNo = refNo;
      existing.notes = notes;
  } else {
      const newRecord = { 
        id: `PAY-${String(100 + list.length + 1).slice(1)}`, 
        billRef,
        vendor,
        dueDate: date, // Assuming due date is payment date for simplicity if new
        totalAmount: amount, // Assuming fully paid
        balanceDue: 0,
        status: "Paid",
        method,
        refNo,
        notes
      };
      list.push(newRecord);
  }
  
  saveAppState();
  window.showMainView();
  renderAll();
};

window.renderTable = function() {
  const tbody = document.getElementById('accounting-payables-body');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  const search = document.getElementById('accounting-payables-search-input')?.value.toLowerCase() || '';
  
  const filtered = getList().filter(item => {
    return !search || Object.values(item).some(val => String(val).toLowerCase().includes(search));
  });
  
  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" class="p-8 text-center text-slate-400">No records found</td></tr>`;
    return;
  }
  
  filtered.forEach(item => {
    let statusClass = "bg-slate-100 text-slate-600";
    if (item.status === 'Paid') statusClass = "bg-emerald-100 text-emerald-700";
    if (item.status === 'Partial') statusClass = "bg-blue-100 text-blue-700";
    if (item.status === 'Open' || item.status === 'Overdue') statusClass = "bg-red-100 text-red-700";
    
    tbody.innerHTML += `
      <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100">
        <td class="p-4 font-bold text-slate-900 cursor-pointer hover:text-blue-600 hover:underline">${escapeHtml(item.billRef)}</td>
        <td class="p-4 font-semibold text-slate-800">${escapeHtml(item.vendor)}</td>
        <td class="p-4">${escapeHtml(item.dueDate)}</td>
        <td class="p-4">${formatCurrency(item.totalAmount)}</td>
        <td class="p-4 font-bold ${item.balanceDue > 0 ? 'text-amber-600' : 'text-slate-500'}">${formatCurrency(item.balanceDue)}</td>
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
  const metricsContainer = document.getElementById('accounting-payables-metrics');
  if (!metricsContainer) return;
  
  let totalPayables = 0;
  let overdueAmount = 0;
  let paidAmount = 0;
  
  const today = new Date().toISOString().split('T')[0];
  
  list.forEach(item => {
    totalPayables += item.balanceDue;
    if (item.dueDate < today && item.balanceDue > 0) {
        overdueAmount += item.balanceDue;
    }
    paidAmount += (item.totalAmount - item.balanceDue);
  });
  
  metricsContainer.innerHTML = `
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Outstanding Payables</span>
      <span class="text-xl font-extrabold text-amber-600 block mt-2">${formatCurrency(totalPayables)}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Overdue Amount</span>
      <span class="text-xl font-extrabold text-rose-600 block mt-2">${formatCurrency(overdueAmount)}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Paid</span>
      <span class="text-xl font-extrabold text-emerald-600 block mt-2">${formatCurrency(paidAmount)}</span>
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
