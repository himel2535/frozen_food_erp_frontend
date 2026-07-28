import { appReadyPromise, appState, saveAppState, initIcons } from '/js/shared.js';

function escapeHtml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function formatCurrency(value) {
  return `$${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getList() {
  if (!appState.reportCustomers) {
    appState.reportCustomers = [
      { name: "Acme Corp", status: "Active", orders: 24, revenue: 125000.00, outstanding: 5000.00, lastActive: "2026-06-15" },
      { name: "Globex Inc", status: "Active", orders: 12, revenue: 45000.00, outstanding: 3200.00, lastActive: "2026-06-10" },
      { name: "Initech", status: "Active", orders: 8, revenue: 22000.00, outstanding: 750.00, lastActive: "2026-05-28" },
      { name: "Soylent Corp", status: "Inactive", orders: 2, revenue: 8500.00, outstanding: 0.00, lastActive: "2025-11-12" },
      { name: "Umbrella Corp", status: "Active", orders: 45, revenue: 250000.00, outstanding: 12500.00, lastActive: "2026-06-18" }
    ];
    saveAppState();
  }
  return appState.reportCustomers;
}

window.renderAll = function() {
  const list = getList();
  
  const search = document.getElementById('filter-search')?.value.toLowerCase() || '';
  const status = document.getElementById('filter-status')?.value || 'All';
  
  const filtered = list.filter(item => {
    let match = true;
    if (search && !item.name.toLowerCase().includes(search)) match = false;
    if (status !== 'All' && item.status !== status) match = false;
    return match;
  });
  
  // Sort by revenue descending
  filtered.sort((a,b) => b.revenue - a.revenue);
  
  const tbody = document.getElementById('report-body');
  if (tbody) {
    tbody.innerHTML = '';
    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-slate-400">No records found matching filters.</td></tr>`;
    } else {
      filtered.forEach(item => {
        let statusClass = "bg-slate-100 text-slate-600";
        if (item.status === 'Active') statusClass = "bg-emerald-100 text-emerald-700";
        if (item.status === 'Inactive') statusClass = "bg-rose-100 text-rose-700";
        
        tbody.innerHTML += `
          <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100">
            <td class="p-4 font-bold text-slate-900">${escapeHtml(item.name)}</td>
            <td class="p-4">
              <span class="px-2 py-1 rounded-md text-[10px] font-bold ${statusClass}">${escapeHtml(item.status)}</span>
            </td>
            <td class="p-4">${item.orders}</td>
            <td class="p-4 font-bold text-emerald-600">${formatCurrency(item.revenue)}</td>
            <td class="p-4 ${item.outstanding > 0 ? 'text-rose-600 font-bold' : 'text-slate-500'}">${formatCurrency(item.outstanding)}</td>
            <td class="p-4 text-right">${escapeHtml(item.lastActive)}</td>
          </tr>
        `;
      });
    }
  }
  
  const metrics = document.getElementById('report-metrics');
  if (metrics) {
    let totalOutstanding = 0;
    let totalRevenue = 0;
    let activeCustomers = 0;
    
    filtered.forEach(item => {
        totalOutstanding += item.outstanding;
        totalRevenue += item.revenue;
        if (item.status === 'Active') activeCustomers++;
    });
    
    const avgRevenue = filtered.length > 0 ? (totalRevenue / filtered.length) : 0;
    
    metrics.innerHTML = `
      <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Active Customers</span>
        <span class="text-xl font-extrabold text-slate-800 block mt-2">${activeCustomers}</span>
      </div>
      <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Outstanding AR</span>
        <span class="text-xl font-extrabold text-rose-600 block mt-2">${formatCurrency(totalOutstanding)}</span>
      </div>
      <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Avg Revenue per Customer</span>
        <span class="text-xl font-extrabold text-emerald-600 block mt-2">${formatCurrency(avgRevenue)}</span>
      </div>
    `;
  }
  
  initIcons();
};

document.addEventListener('DOMContentLoaded', async () => {
  await appReadyPromise;
  window.renderAll();
});
