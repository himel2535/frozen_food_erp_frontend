import { appReadyPromise, appState, saveAppState, initIcons } from '/js/shared.js';

function escapeHtml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function formatCurrency(value) {
  return `$${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getList() {
  if (!appState.payrollSlips) {
    appState.payrollSlips = [
      {
        id: "SLP-202605-001",
        employee: "Sarah Jenkins",
        period: "2026-05",
        gross: 6500.00,
        deductions: 1200.00,
        net: 5300.00,
        status: "Paid",
        method: "Bank Transfer",
        txnId: "TXN-99001",
        remarks: "May salary disbursed."
      },
      {
        id: "SLP-202605-002",
        employee: "David Chen",
        period: "2026-05",
        gross: 4200.00,
        deductions: 500.00,
        net: 3700.00,
        status: "Paid",
        method: "Bank Transfer",
        txnId: "TXN-99002",
        remarks: "May salary disbursed."
      },
      {
        id: "SLP-202606-001",
        employee: "Emily Stone",
        period: "2026-06",
        gross: 8000.00,
        deductions: 1500.00,
        net: 6500.00,
        status: "Pending",
        method: "",
        txnId: "",
        remarks: "Pending release."
      }
    ];
    saveAppState();
  }
  return appState.payrollSlips;
}

window.showMainView = function() {
  document.getElementById('payroll-slips-main-view').classList.remove('hidden');
  document.getElementById('payroll-slips-form-view').classList.add('hidden');
};

window.showFormView = function() {
  document.getElementById('payroll-slips-main-view').classList.add('hidden');
  document.getElementById('payroll-slips-form-view').classList.remove('hidden');
};

window.openSlipModal = function() {
  const form = document.getElementById('payroll-slips-form');
  if (form) form.reset();
  
  // Collapse advanced fields by default
  const section = document.getElementById('payroll-slips-advanced-section');
  const icon = document.getElementById('payroll-slips-advanced-icon');
  if (section && !section.classList.contains('hidden')) {
    section.classList.add('hidden');
    if (icon) icon.style.transform = 'rotate(0deg)';
  }
  
  const titleEl = document.getElementById('slip-form-title');
  if (titleEl) titleEl.textContent = 'Create Manual Payslip';
  
  document.getElementById('input-net').value = "0.00";
  window.showFormView();
};

window.toggleAdvancedFields = function() {
  const section = document.getElementById('payroll-slips-advanced-section');
  const icon = document.getElementById('payroll-slips-advanced-icon');
  if (section.classList.contains('hidden')) {
    section.classList.remove('hidden');
    if (icon) icon.style.transform = 'rotate(180deg)';
  } else {
    section.classList.add('hidden');
    if (icon) icon.style.transform = 'rotate(0deg)';
  }
};

window.calculateNet = function() {
  const gross = parseFloat(document.getElementById("input-gross").value) || 0;
  const deductions = parseFloat(document.getElementById("input-deductions").value) || 0;
  const net = Math.max(0, gross - deductions);
  document.getElementById("input-net").value = net.toFixed(2);
};

window.handleSubmit = function(event) {
  event.preventDefault();
  const list = getList();
  
  const employee = document.getElementById("input-employee").value;
  const period = document.getElementById("input-period").value;
  const gross = parseFloat(document.getElementById("input-gross").value) || 0;
  const deductions = parseFloat(document.getElementById("input-deductions").value) || 0;
  const net = Math.max(0, gross - deductions);
  
  const method = document.getElementById("input-method").value;
  const txnId = document.getElementById("input-txn-id").value;
  const remarks = document.getElementById("input-remarks").value;
  
  const newRecord = { 
    id: `SLP-${period.replace('-','')}-${String(100 + list.length + 1).slice(1)}`, 
    employee,
    period,
    gross,
    deductions,
    net,
    status: txnId ? "Paid" : "Pending",
    method,
    txnId,
    remarks
  };
  list.push(newRecord);
  
  saveAppState();
  window.showMainView();
  renderAll();
};

window.renderTable = function() {
  const tbody = document.getElementById('payroll-slips-body');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  const search = document.getElementById('payroll-slips-search-input')?.value.toLowerCase() || '';
  
  const filtered = getList().filter(item => {
    return !search || 
           item.id.toLowerCase().includes(search) || 
           item.employee.toLowerCase().includes(search);
  });
  
  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" class="p-8 text-center text-slate-400">No records found</td></tr>`;
    return;
  }
  
  // Sort by ID descending
  filtered.sort((a,b) => b.id.localeCompare(a.id));
  
  filtered.forEach(item => {
    let statusClass = "bg-slate-100 text-slate-600";
    if (item.status === 'Paid') statusClass = "bg-emerald-100 text-emerald-700";
    if (item.status === 'Pending') statusClass = "bg-amber-100 text-amber-700";
    
    tbody.innerHTML += `
      <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100">
        <td class="p-4 font-bold text-slate-900 cursor-pointer hover:text-blue-600 hover:underline">${escapeHtml(item.id)}</td>
        <td class="p-4 font-semibold text-slate-800">${escapeHtml(item.employee)}</td>
        <td class="p-4">${escapeHtml(item.period)}</td>
        <td class="p-4 text-slate-600">${formatCurrency(item.gross)}</td>
        <td class="p-4 text-rose-600">-${formatCurrency(item.deductions)}</td>
        <td class="p-4 font-bold text-blue-600">${formatCurrency(item.net)}</td>
        <td class="p-4">
          <span class="px-2 py-1 rounded-md text-[10px] font-bold ${statusClass}">
            ${escapeHtml(item.status)}
          </span>
        </td>
        <td class="p-4 text-right">
          <button class="text-blue-600 hover:text-blue-800 p-1 cursor-pointer transition-colors" title="Download PDF">
            <i data-lucide="download" class="w-4 h-4"></i>
          </button>
        </td>
      </tr>
    `;
  });
};

function renderMetrics() {
  const list = getList();
  const metricsContainer = document.getElementById('payroll-slips-metrics');
  if (!metricsContainer) return;
  
  const totalSlips = list.length;
  
  const currentMonth = new Date().toISOString().slice(0,7); // YYYY-MM
  let netDisbursedThisMonth = 0;
  
  list.forEach(item => {
    if (item.period === currentMonth && item.status === 'Paid') {
        netDisbursedThisMonth += item.net;
    }
  });
  
  metricsContainer.innerHTML = `
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Slips Generated</span>
      <span class="text-xl font-extrabold text-slate-800 block mt-2">${totalSlips}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Net Disbursed This Month</span>
      <span class="text-xl font-extrabold text-blue-600 block mt-2">${formatCurrency(netDisbursedThisMonth)}</span>
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
