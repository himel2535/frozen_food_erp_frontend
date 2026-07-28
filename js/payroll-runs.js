import { appReadyPromise, appState, saveAppState, initIcons } from '/js/shared.js';

function escapeHtml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function formatCurrency(value) {
  return `$${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getList() {
  if (!appState.payrollRuns) {
    appState.payrollRuns = [
      {
        id: "RUN-2026-004",
        period: "2026-04",
        date: "2026-04-28",
        department: "All",
        totalGross: 45000.00,
        totalNet: 38500.00,
        status: "Processed",
        notes: "April Salary",
        approvalRef: "AUTH-04001",
        bankId: "ACH-22004"
      },
      {
        id: "RUN-2026-005",
        period: "2026-05",
        date: "2026-05-28",
        department: "All",
        totalGross: 48000.00,
        totalNet: 41000.00,
        status: "Processed",
        notes: "May Salary (Includes bonuses)",
        approvalRef: "AUTH-05001",
        bankId: "ACH-22005"
      },
      {
        id: "RUN-2026-006",
        period: "2026-06",
        date: "2026-06-25",
        department: "Engineering",
        totalGross: 15000.00,
        totalNet: 12500.00,
        status: "Draft",
        notes: "June Engineering Review",
        approvalRef: "",
        bankId: ""
      }
    ];
    saveAppState();
  }
  return appState.payrollRuns;
}

window.showMainView = function() {
  document.getElementById('payroll-runs-main-view').classList.remove('hidden');
  document.getElementById('payroll-runs-form-view').classList.add('hidden');
};

window.showFormView = function() {
  document.getElementById('payroll-runs-main-view').classList.add('hidden');
  document.getElementById('payroll-runs-form-view').classList.remove('hidden');
};

window.openRunModal = function() {
  const form = document.getElementById('payroll-runs-form');
  if (form) form.reset();
  
  // Collapse advanced fields by default
  const section = document.getElementById('payroll-runs-advanced-section');
  const icon = document.getElementById('payroll-runs-advanced-icon');
  if (section && !section.classList.contains('hidden')) {
    section.classList.add('hidden');
    if (icon) icon.style.transform = 'rotate(0deg)';
  }
  
  const titleEl = document.getElementById('run-form-title');
  if (titleEl) titleEl.textContent = 'Execute Payroll Run';
  
  window.showFormView();
};

window.toggleAdvancedFields = function() {
  const section = document.getElementById('payroll-runs-advanced-section');
  const icon = document.getElementById('payroll-runs-advanced-icon');
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
  
  const period = document.getElementById("input-period").value;
  const date = document.getElementById("input-date").value;
  const department = document.getElementById("input-department").value;
  const notes = document.getElementById("input-notes").value;
  const approvalRef = document.getElementById("input-approval-ref").value;
  const bankId = document.getElementById("input-bank-id").value;
  
  // Mock payroll calculation for the MVP
  const dummyGross = Math.floor(Math.random() * (50000 - 10000 + 1) + 10000);
  const dummyNet = dummyGross * 0.85; // 15% deductions simulated
  
  const newRecord = { 
    id: `RUN-${period.replace('-','')}-${String(100 + list.length + 1).slice(1)}`, 
    period,
    date,
    department,
    totalGross: dummyGross,
    totalNet: dummyNet,
    status: "Draft",
    notes,
    approvalRef,
    bankId
  };
  list.push(newRecord);
  
  saveAppState();
  window.showMainView();
  renderAll();
};

window.renderTable = function() {
  const tbody = document.getElementById('payroll-runs-body');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  const search = document.getElementById('payroll-runs-search-input')?.value.toLowerCase() || '';
  
  const filtered = getList().filter(item => {
    return !search || 
           item.id.toLowerCase().includes(search) || 
           item.period.toLowerCase().includes(search) ||
           item.notes.toLowerCase().includes(search);
  });
  
  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" class="p-8 text-center text-slate-400">No records found</td></tr>`;
    return;
  }
  
  // Sort by date descending
  filtered.sort((a,b) => new Date(b.date) - new Date(a.date));
  
  filtered.forEach(item => {
    let statusClass = "bg-slate-100 text-slate-600";
    if (item.status === 'Processed') statusClass = "bg-emerald-100 text-emerald-700";
    if (item.status === 'Approved') statusClass = "bg-blue-100 text-blue-700";
    if (item.status === 'Draft') statusClass = "bg-amber-100 text-amber-700";
    
    tbody.innerHTML += `
      <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100">
        <td class="p-4 font-bold text-slate-900 cursor-pointer hover:text-blue-600 hover:underline">${escapeHtml(item.id)}</td>
        <td class="p-4 font-semibold text-slate-800">${escapeHtml(item.period)}</td>
        <td class="p-4">${escapeHtml(item.date)}</td>
        <td class="p-4">${escapeHtml(item.department)}</td>
        <td class="p-4">${formatCurrency(item.totalGross)}</td>
        <td class="p-4 font-bold text-blue-600">${formatCurrency(item.totalNet)}</td>
        <td class="p-4">
          <span class="px-2 py-1 rounded-md text-[10px] font-bold ${statusClass}">
            ${escapeHtml(item.status)}
          </span>
        </td>
        <td class="p-4 text-right">
          <button class="text-blue-600 hover:text-blue-800 p-1 cursor-pointer transition-colors" title="View Details">
            <i data-lucide="eye" class="w-4 h-4"></i>
          </button>
        </td>
      </tr>
    `;
  });
};

function renderMetrics() {
  const list = getList();
  const metricsContainer = document.getElementById('payroll-runs-metrics');
  if (!metricsContainer) return;
  
  let totalRuns = list.length;
  let totalCostYTD = 0;
  let lastRunNet = 0;
  
  if (totalRuns > 0) {
    const sorted = [...list].sort((a,b) => new Date(b.date) - new Date(a.date));
    lastRunNet = sorted[0].totalNet;
  }
  
  list.forEach(item => {
    if (item.status === 'Processed') {
        totalCostYTD += item.totalGross;
    }
  });
  
  metricsContainer.innerHTML = `
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Payroll Runs</span>
      <span class="text-xl font-extrabold text-slate-800 block mt-2">${totalRuns}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Cost (YTD Processed Gross)</span>
      <span class="text-xl font-extrabold text-rose-600 block mt-2">${formatCurrency(totalCostYTD)}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Last Run Net Disbursed</span>
      <span class="text-xl font-extrabold text-emerald-600 block mt-2">${formatCurrency(lastRunNet)}</span>
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
