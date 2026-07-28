// ----------------------------------------------------
// Dues & Ageing Module — Toys Factory ERP MPA
// ----------------------------------------------------
import { appReadyPromise, initIcons } from '/js/shared.js';

let duesList = [
  { id: 'CUST-001', name: 'Acme Corp', type: 'Receivable', buckets: { b30: 1250.00, b60: 450.00, b90: 0, b90plus: 0 } },
  { id: 'CUST-002', name: 'TechStart LLC', type: 'Receivable', buckets: { b30: 0, b60: 890.00, b90: 120.00, b90plus: 0 } },
  { id: 'SUPP-001', name: 'Global Wood Suppliers', type: 'Payable', buckets: { b30: 3400.00, b60: 0, b90: 0, b90plus: 0 } },
  { id: 'SUPP-002', name: 'MetalWorks Inc', type: 'Payable', buckets: { b30: 0, b60: 0, b90: 2100.00, b90plus: 450.00 } },
];

window.renderTable = function() {
  const tbody = document.getElementById('accounting-dues-body');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  const search = document.getElementById('accounting-dues-search-input')?.value.toLowerCase() || '';
  const typeFilter = document.getElementById('accounting-dues-type-filter')?.value || 'all';
  
  const filtered = duesList.filter(item => {
    const searchMatch = !search || item.name.toLowerCase().includes(search) || item.id.toLowerCase().includes(search);
    const typeMatch = typeFilter === 'all' || item.type.toLowerCase() === typeFilter.toLowerCase();
    return searchMatch && typeMatch;
  });
  
  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="p-8 text-center text-slate-400">No pending dues found matching filters</td></tr>`;
    return;
  }
  
  filtered.forEach(item => {
    const total = item.buckets.b30 + item.buckets.b60 + item.buckets.b90 + item.buckets.b90plus;
    const typeColor = item.type === 'Receivable' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700';

    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-50 transition-colors group';
    tr.innerHTML = `
      <td class="p-4">
        <div class="font-bold text-slate-900">${item.name}</div>
        <div class="text-[10px] text-slate-400">${item.id}</div>
      </td>
      <td class="p-4">
        <span class="px-2 py-1 rounded-lg text-[10px] font-bold ${typeColor}">${item.type}</span>
      </td>
      <td class="p-4 text-right font-medium text-slate-600">$${item.buckets.b30.toFixed(2)}</td>
      <td class="p-4 text-right font-medium text-amber-600">$${item.buckets.b60.toFixed(2)}</td>
      <td class="p-4 text-right font-medium text-orange-600">$${item.buckets.b90.toFixed(2)}</td>
      <td class="p-4 text-right font-bold text-rose-600">$${item.buckets.b90plus.toFixed(2)}</td>
      <td class="p-4 text-right font-extrabold text-slate-900">$${total.toFixed(2)}</td>
      <td class="p-4 text-center">
        <button onclick="alert('Payment reminder sent to ${item.name}!')" class="border border-blue-200 bg-white hover:bg-blue-50 text-blue-600 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all shadow-sm">Remind</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  
  initIcons();
};

window.renderMetrics = function() {
  const container = document.getElementById('accounting-ledger-metrics');
  if (!container) return;

  container.innerHTML = `
    <div class="bg-white p-5 rounded-2xl border border-slate-200 premium-shadow">
      <p class="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Total Receivables</p>
      <p class="text-2xl font-extrabold text-slate-900 mt-1">$2,710.00</p>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200 premium-shadow">
      <p class="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Total Payables</p>
      <p class="text-2xl font-extrabold text-slate-900 mt-1">$5,950.00</p>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200 premium-shadow">
      <p class="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Over 60 Days Old</p>
      <p class="text-2xl font-extrabold text-slate-900 mt-1">$2,670.00</p>
    </div>
  `;
};

document.addEventListener('DOMContentLoaded', async () => {
  await appReadyPromise;
  window.renderMetrics();
  window.renderTable();
});
