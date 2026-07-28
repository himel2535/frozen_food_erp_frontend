import { appReadyPromise, appState, saveAppState, initIcons } from '/js/shared.js';

function escapeHtml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function formatCurrency(value) {
  return `$${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getList() {
  if (!appState.reportFinancial) {
    appState.reportFinancial = [
      { date: "2026-06-01", ref: "TXN-001", type: "Income", category: "Sales Revenue", amount: 15000.00 },
      { date: "2026-06-05", ref: "TXN-002", type: "Expense", category: "Raw Materials", amount: 4500.00 },
      { date: "2026-06-10", ref: "TXN-003", type: "Expense", category: "Office Supplies", amount: 350.00 },
      { date: "2026-06-15", ref: "TXN-004", type: "Income", category: "Sales Revenue", amount: 8200.00 },
      { date: "2026-06-25", ref: "TXN-005", type: "Expense", category: "Payroll", amount: 12500.00 }
    ];
    saveAppState();
  }
  return appState.reportFinancial;
}

window.renderAll = function() {
  const list = getList();
  
  const start = document.getElementById('filter-start')?.value || '';
  const end = document.getElementById('filter-end')?.value || '';
  const type = document.getElementById('filter-type')?.value || 'All';
  
  const filtered = list.filter(item => {
    let match = true;
    if (start && item.date < start) match = false;
    if (end && item.date > end) match = false;
    if (type !== 'All' && item.type !== type) match = false;
    return match;
  });
  
  filtered.sort((a,b) => new Date(b.date) - new Date(a.date));
  
  const tbody = document.getElementById('report-body');
  if (tbody) {
    tbody.innerHTML = '';
    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-slate-400">No records found matching filters.</td></tr>`;
    } else {
      filtered.forEach(item => {
        let typeClass = "bg-emerald-100 text-emerald-700";
        if (item.type === 'Expense') typeClass = "bg-rose-100 text-rose-700";
        
        const amountClass = item.type === 'Income' ? 'text-emerald-600' : 'text-rose-600';
        const amountPrefix = item.type === 'Income' ? '+' : '-';
        
        tbody.innerHTML += `
          <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100">
            <td class="p-4">${escapeHtml(item.date)}</td>
            <td class="p-4 font-bold text-slate-900">${escapeHtml(item.ref)}</td>
            <td class="p-4">
              <span class="px-2 py-1 rounded-md text-[10px] font-bold ${typeClass}">${escapeHtml(item.type)}</span>
            </td>
            <td class="p-4">${escapeHtml(item.category)}</td>
            <td class="p-4 text-right font-bold ${amountClass}">${amountPrefix}${formatCurrency(item.amount)}</td>
          </tr>
        `;
      });
    }
  }
  
  const metrics = document.getElementById('report-metrics');
  if (metrics) {
    let inflows = 0;
    let outflows = 0;
    
    filtered.forEach(item => {
        if (item.type === 'Income') inflows += item.amount;
        if (item.type === 'Expense') outflows += item.amount;
    });
    
    const netCashFlow = inflows - outflows;
    
    metrics.innerHTML = `
      <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Inflows (Income)</span>
        <span class="text-xl font-extrabold text-emerald-600 block mt-2">${formatCurrency(inflows)}</span>
      </div>
      <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Outflows (Expense)</span>
        <span class="text-xl font-extrabold text-rose-600 block mt-2">${formatCurrency(outflows)}</span>
      </div>
      <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Net Cash Flow</span>
        <span class="text-xl font-extrabold ${netCashFlow >= 0 ? 'text-blue-600' : 'text-rose-600'} block mt-2">${formatCurrency(netCashFlow)}</span>
      </div>
    `;
  }
  
  initIcons();
};

document.addEventListener('DOMContentLoaded', async () => {
  await appReadyPromise;
  window.renderAll();
});
