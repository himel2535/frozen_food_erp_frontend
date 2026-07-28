import { appReadyPromise, appState, saveAppState, initIcons } from '/js/shared.js';

function escapeHtml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function formatCurrency(value) {
  return `$${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getList() {
  if (!appState.payrollStructures) {
    appState.payrollStructures = [
      {
        id: "STR-001",
        name: "Entry Level Package",
        base: 3000.00,
        hra: 500.00,
        transport: 100.00,
        otherAllowance: 0,
        tax: 300.00,
        insurance: 150.00,
        otherDeduction: 0,
        status: "Active"
      },
      {
        id: "STR-002",
        name: "Mid Level Package",
        base: 5000.00,
        hra: 1000.00,
        transport: 200.00,
        otherAllowance: 100.00,
        tax: 600.00,
        insurance: 200.00,
        otherDeduction: 0,
        status: "Active"
      },
      {
        id: "STR-003",
        name: "Senior Management",
        base: 10000.00,
        hra: 2500.00,
        transport: 500.00,
        otherAllowance: 1000.00,
        tax: 2000.00,
        insurance: 300.00,
        otherDeduction: 0,
        status: "Active"
      }
    ];
    saveAppState();
  }
  return appState.payrollStructures;
}

window.showMainView = function() {
  document.getElementById('payroll-structures-main-view').classList.remove('hidden');
  document.getElementById('payroll-structures-form-view').classList.add('hidden');
};

window.showFormView = function() {
  document.getElementById('payroll-structures-main-view').classList.add('hidden');
  document.getElementById('payroll-structures-form-view').classList.remove('hidden');
};

window.openStructureModal = function() {
  const form = document.getElementById('payroll-structures-form');
  if (form) form.reset();
  
  // Collapse advanced fields by default
  const section = document.getElementById('payroll-structures-advanced-section');
  const icon = document.getElementById('payroll-structures-advanced-icon');
  if (section && !section.classList.contains('hidden')) {
    section.classList.add('hidden');
    if (icon) icon.style.transform = 'rotate(0deg)';
  }
  
  const titleEl = document.getElementById('structure-form-title');
  if (titleEl) titleEl.textContent = 'Create Salary Structure';
  
  window.showFormView();
};

window.toggleAdvancedFields = function() {
  const section = document.getElementById('payroll-structures-advanced-section');
  const icon = document.getElementById('payroll-structures-advanced-icon');
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
  
  const name = document.getElementById("input-name").value;
  const status = document.getElementById("input-status").value;
  const base = parseFloat(document.getElementById("input-base").value) || 0;
  
  const hra = parseFloat(document.getElementById("input-hra").value) || 0;
  const transport = parseFloat(document.getElementById("input-transport").value) || 0;
  const otherAllowance = parseFloat(document.getElementById("input-other-allowance").value) || 0;
  
  const tax = parseFloat(document.getElementById("input-tax").value) || 0;
  const insurance = parseFloat(document.getElementById("input-insurance").value) || 0;
  const otherDeduction = parseFloat(document.getElementById("input-other-deduction").value) || 0;
  
  // Simple create (we could add edit support but skipping for MVP to keep code lean)
  const newRecord = { 
    id: `STR-${String(100 + list.length + 1).slice(1)}`, 
    name,
    status,
    base,
    hra,
    transport,
    otherAllowance,
    tax,
    insurance,
    otherDeduction
  };
  list.push(newRecord);
  
  saveAppState();
  window.showMainView();
  renderAll();
};

window.renderTable = function() {
  const tbody = document.getElementById('payroll-structures-body');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  const search = document.getElementById('payroll-structures-search-input')?.value.toLowerCase() || '';
  
  const filtered = getList().filter(item => {
    return !search || item.name.toLowerCase().includes(search);
  });
  
  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" class="p-8 text-center text-slate-400">No records found</td></tr>`;
    return;
  }
  
  filtered.forEach(item => {
    let statusClass = "bg-slate-100 text-slate-600";
    if (item.status === 'Active') statusClass = "bg-emerald-100 text-emerald-700";
    if (item.status === 'Inactive') statusClass = "bg-rose-100 text-rose-700";
    
    const totalAllowances = item.hra + item.transport + item.otherAllowance;
    const totalDeductions = item.tax + item.insurance + item.otherDeduction;
    const netPackage = item.base + totalAllowances - totalDeductions;
    
    tbody.innerHTML += `
      <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100">
        <td class="p-4 font-bold text-slate-900">${escapeHtml(item.name)}</td>
        <td class="p-4">${formatCurrency(item.base)}</td>
        <td class="p-4 text-emerald-600">+${formatCurrency(totalAllowances)}</td>
        <td class="p-4 text-rose-600">-${formatCurrency(totalDeductions)}</td>
        <td class="p-4 font-bold text-blue-600">${formatCurrency(netPackage)}</td>
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
  const metricsContainer = document.getElementById('payroll-structures-metrics');
  if (!metricsContainer) return;
  
  const activeStructures = list.filter(s => s.status === 'Active').length;
  
  let totalBase = 0;
  let highestPackage = 0;
  
  list.forEach(item => {
    if (item.status === 'Active') {
        totalBase += item.base;
        const totalAllowances = item.hra + item.transport + item.otherAllowance;
        const totalDeductions = item.tax + item.insurance + item.otherDeduction;
        const netPackage = item.base + totalAllowances - totalDeductions;
        if (netPackage > highestPackage) {
            highestPackage = netPackage;
        }
    }
  });
  
  const avgBase = activeStructures > 0 ? (totalBase / activeStructures) : 0;
  
  metricsContainer.innerHTML = `
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Structures</span>
      <span class="text-xl font-extrabold text-slate-800 block mt-2">${activeStructures}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Avg. Base Salary</span>
      <span class="text-xl font-extrabold text-blue-600 block mt-2">${formatCurrency(avgBase)}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Highest Net Package</span>
      <span class="text-xl font-extrabold text-emerald-600 block mt-2">${formatCurrency(highestPackage)}</span>
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
