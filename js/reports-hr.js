import { appReadyPromise, appState, saveAppState, initIcons } from '/js/shared.js';

function escapeHtml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function formatCurrency(value) {
  return `$${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getList() {
  if (!appState.reportHR) {
    appState.reportHR = [
      { id: "EMP-001", name: "Sarah Jenkins", dept: "Sales", role: "Sales Manager", status: "Active", hireDate: "2024-01-15", salary: 6500.00 },
      { id: "EMP-002", name: "David Chen", dept: "Engineering", role: "Frontend Dev", status: "Active", hireDate: "2025-03-01", salary: 5200.00 },
      { id: "EMP-003", name: "Emily Stone", dept: "Management", role: "CEO", status: "Active", hireDate: "2023-01-01", salary: 12000.00 },
      { id: "EMP-004", name: "Mark Zuckerberg", dept: "Engineering", role: "Intern", status: "Terminated", hireDate: "2025-06-01", salary: 1500.00 },
      { id: "EMP-005", name: "Amanda Waller", dept: "Sales", role: "SDR", status: "Active", hireDate: "2026-02-10", salary: 4000.00 }
    ];
    saveAppState();
  }
  return appState.reportHR;
}

window.renderAll = function() {
  const list = getList();
  
  const search = document.getElementById('filter-search')?.value.toLowerCase() || '';
  const dept = document.getElementById('filter-dept')?.value || 'All';
  const status = document.getElementById('filter-status')?.value || 'All';
  
  const filtered = list.filter(item => {
    let match = true;
    if (search && !item.id.toLowerCase().includes(search) && !item.name.toLowerCase().includes(search)) match = false;
    if (dept !== 'All' && item.dept !== dept) match = false;
    if (status !== 'All' && item.status !== status) match = false;
    return match;
  });
  
  // Sort by hire date descending
  filtered.sort((a,b) => new Date(b.hireDate) - new Date(a.hireDate));
  
  const tbody = document.getElementById('report-body');
  if (tbody) {
    tbody.innerHTML = '';
    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="p-8 text-center text-slate-400">No records found matching filters.</td></tr>`;
    } else {
      filtered.forEach(item => {
        let statusClass = "bg-slate-100 text-slate-600";
        if (item.status === 'Active') statusClass = "bg-emerald-100 text-emerald-700";
        if (item.status === 'Terminated') statusClass = "bg-rose-100 text-rose-700";
        
        tbody.innerHTML += `
          <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100">
            <td class="p-4 font-bold text-slate-900">${escapeHtml(item.id)}</td>
            <td class="p-4 font-bold text-blue-600">${escapeHtml(item.name)}</td>
            <td class="p-4">${escapeHtml(item.dept)}</td>
            <td class="p-4">${escapeHtml(item.role)}</td>
            <td class="p-4">
              <span class="px-2 py-1 rounded-md text-[10px] font-bold ${statusClass}">${escapeHtml(item.status)}</span>
            </td>
            <td class="p-4">${escapeHtml(item.hireDate)}</td>
            <td class="p-4 text-right">${formatCurrency(item.salary)}</td>
          </tr>
        `;
      });
    }
  }
  
  const metrics = document.getElementById('report-metrics');
  if (metrics) {
    let totalActive = 0;
    let totalSalary = 0;
    
    filtered.forEach(item => {
        if (item.status === 'Active') {
            totalActive++;
            totalSalary += item.salary;
        }
    });
    
    const avgSalary = totalActive > 0 ? (totalSalary / totalActive) : 0;
    
    metrics.innerHTML = `
      <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Headcount</span>
        <span class="text-xl font-extrabold text-slate-800 block mt-2">${totalActive}</span>
      </div>
      <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Monthly Base Cost (Active)</span>
        <span class="text-xl font-extrabold text-rose-600 block mt-2">${formatCurrency(totalSalary)}</span>
      </div>
      <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Average Salary</span>
        <span class="text-xl font-extrabold text-blue-600 block mt-2">${formatCurrency(avgSalary)}</span>
      </div>
    `;
  }
  
  initIcons();
};

document.addEventListener('DOMContentLoaded', async () => {
  await appReadyPromise;
  window.renderAll();
});
