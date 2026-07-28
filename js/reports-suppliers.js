import { appReadyPromise, appState, saveAppState, initIcons } from '/js/shared.js';

function escapeHtml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function formatCurrency(value) {
  return `$${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getList() {
  if (!appState.reportSuppliers) {
    appState.reportSuppliers = [
      { name: "Global Dye Chemicals", status: "Active", pos: 18, spend: 85000.00, outstanding: 0.00, lastOrder: "2026-06-02" },
      { name: "Premium Yarns Ltd", status: "Active", pos: 32, spend: 150000.00, outstanding: 1500.00, lastOrder: "2026-06-06" },
      { name: "Machinery Spares Co", status: "Active", pos: 5, spend: 12000.00, outstanding: 2500.00, lastOrder: "2026-06-11" },
      { name: "Office Supplies Depot", status: "Inactive", pos: 1, spend: 350.00, outstanding: 0.00, lastOrder: "2025-08-15" }
    ];
    saveAppState();
  }
  return appState.reportSuppliers;
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
  
  // Sort by spend descending
  filtered.sort((a,b) => b.spend - a.spend);
  
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
            <td class="p-4">${item.pos}</td>
            <td class="p-4 font-bold text-rose-600">${formatCurrency(item.spend)}</td>
            <td class="p-4 ${item.outstanding > 0 ? 'text-amber-600 font-bold' : 'text-slate-500'}">${formatCurrency(item.outstanding)}</td>
            <td class="p-4 text-right">${escapeHtml(item.lastOrder)}</td>
          </tr>
        `;
      });
    }
  }
  
  const metrics = document.getElementById('report-metrics');
  if (metrics) {
    let totalOutstanding = 0;
    let activeSuppliers = 0;
    let topSupplierName = "N/A";
    let topSupplierSpend = 0;
    
    filtered.forEach(item => {
        totalOutstanding += item.outstanding;
        if (item.status === 'Active') activeSuppliers++;
        if (item.spend > topSupplierSpend) {
            topSupplierSpend = item.spend;
            topSupplierName = item.name;
        }
    });
    
    metrics.innerHTML = `
      <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Active Suppliers</span>
        <span class="text-xl font-extrabold text-slate-800 block mt-2">${activeSuppliers}</span>
      </div>
      <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Outstanding AP</span>
        <span class="text-xl font-extrabold text-amber-600 block mt-2">${formatCurrency(totalOutstanding)}</span>
      </div>
      <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow overflow-hidden">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Top Supplier</span>
        <span class="text-lg font-extrabold text-blue-600 block mt-2 truncate" title="${escapeHtml(topSupplierName)}">${escapeHtml(topSupplierName)}</span>
      </div>
    `;
  }
  
  initIcons();
};

document.addEventListener('DOMContentLoaded', async () => {
  await appReadyPromise;
  window.renderAll();
});
