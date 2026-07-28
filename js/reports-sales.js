import { appReadyPromise, appState, saveAppState, initIcons } from '/js/shared.js';

function escapeHtml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function formatCurrency(value) {
  return `$${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getList() {
  if (!appState.reportSales) {
    appState.reportSales = [
      { date: "2026-06-01", ref: "INV-2026-001", customer: "Acme Corp", status: "Paid", total: 5000.00 },
      { date: "2026-06-05", ref: "INV-2026-002", customer: "Globex Inc", status: "Unpaid", total: 3200.00 },
      { date: "2026-06-10", ref: "INV-2026-003", customer: "Initech", status: "Partial", total: 1500.00 },
      { date: "2026-06-12", ref: "INV-2026-004", customer: "Soylent Corp", status: "Paid", total: 8500.00 },
      { date: "2026-06-15", ref: "INV-2026-005", customer: "Umbrella Corp", status: "Unpaid", total: 420.00 }
    ];
    saveAppState();
  }
  return appState.reportSales;
}

window.renderAll = function() {
  const list = getList();
  
  const search = document.getElementById('filter-search')?.value.toLowerCase() || '';
  const start = document.getElementById('filter-start')?.value || '';
  const end = document.getElementById('filter-end')?.value || '';
  const status = document.getElementById('filter-status')?.value || 'All';
  
  const filtered = list.filter(item => {
    let match = true;
    if (search && !item.ref.toLowerCase().includes(search) && !item.customer.toLowerCase().includes(search)) match = false;
    if (start && item.date < start) match = false;
    if (end && item.date > end) match = false;
    if (status !== 'All' && item.status !== status) match = false;
    return match;
  });
  
  // Sort descending by date
  filtered.sort((a,b) => new Date(b.date) - new Date(a.date));
  
  const tbody = document.getElementById('report-body');
  if (tbody) {
    tbody.innerHTML = '';
    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-slate-400">No records found matching filters.</td></tr>`;
    } else {
      filtered.forEach(item => {
        let statusClass = "bg-slate-100 text-slate-600";
        if (item.status === 'Paid') statusClass = "bg-emerald-100 text-emerald-700";
        if (item.status === 'Unpaid') statusClass = "bg-rose-100 text-rose-700";
        if (item.status === 'Partial') statusClass = "bg-blue-100 text-blue-700";
        
        tbody.innerHTML += `
          <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100">
            <td class="p-4">${escapeHtml(item.date)}</td>
            <td class="p-4 font-bold text-slate-900">${escapeHtml(item.ref)}</td>
            <td class="p-4">${escapeHtml(item.customer)}</td>
            <td class="p-4">
              <span class="px-2 py-1 rounded-md text-[10px] font-bold ${statusClass}">${escapeHtml(item.status)}</span>
            </td>
            <td class="p-4 text-right font-bold text-blue-600">${formatCurrency(item.total)}</td>
          </tr>
        `;
      });
    }
  }
  
  const metrics = document.getElementById('report-metrics');
  if (metrics) {
    let totalRevenue = 0;
    filtered.forEach(item => totalRevenue += item.total);
    const avgOrder = filtered.length > 0 ? (totalRevenue / filtered.length) : 0;
    
    metrics.innerHTML = `
      <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Revenue</span>
        <span class="text-xl font-extrabold text-blue-600 block mt-2">${formatCurrency(totalRevenue)}</span>
      </div>
      <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Orders</span>
        <span class="text-xl font-extrabold text-slate-800 block mt-2">${filtered.length}</span>
      </div>
      <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Average Order Value</span>
        <span class="text-xl font-extrabold text-emerald-600 block mt-2">${formatCurrency(avgOrder)}</span>
      </div>
    `;
  }
  
  initIcons();
};

document.addEventListener('DOMContentLoaded', async () => {
  await appReadyPromise;
  window.renderAll();
});
