import { appReadyPromise, appState, saveAppState, initIcons } from '/js/shared.js';

function escapeHtml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function formatCurrency(value) {
  return `$${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getList() {
  if (!appState.reportInventory) {
    appState.reportInventory = [
      { sku: "RAW-001", name: "Cotton Yarn 40s", category: "Raw Materials", warehouse: "Main Warehouse", qty: 5000, cost: 2.50 },
      { sku: "RAW-002", name: "Red Dye #4", category: "Raw Materials", warehouse: "Main Warehouse", qty: 150, cost: 15.00 },
      { sku: "FIN-001", name: "Basic T-Shirt (M)", category: "Finished Goods", warehouse: "Factory Floor", qty: 300, cost: 5.50 },
      { sku: "FIN-002", name: "Premium Polo (L)", category: "Finished Goods", warehouse: "Main Warehouse", qty: 1200, cost: 8.00 },
      { sku: "RAW-003", name: "Elastic Bands", category: "Raw Materials", warehouse: "Factory Floor", qty: 10, cost: 0.50 } // Low stock
    ];
    saveAppState();
  }
  return appState.reportInventory;
}

window.renderAll = function() {
  const list = getList();
  
  const search = document.getElementById('filter-search')?.value.toLowerCase() || '';
  const category = document.getElementById('filter-category')?.value || 'All';
  const warehouse = document.getElementById('filter-warehouse')?.value || 'All';
  
  const filtered = list.filter(item => {
    let match = true;
    if (search && !item.sku.toLowerCase().includes(search) && !item.name.toLowerCase().includes(search)) match = false;
    if (category !== 'All' && item.category !== category) match = false;
    if (warehouse !== 'All' && item.warehouse !== warehouse) match = false;
    return match;
  });
  
  const tbody = document.getElementById('report-body');
  if (tbody) {
    tbody.innerHTML = '';
    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="p-8 text-center text-slate-400">No records found matching filters.</td></tr>`;
    } else {
      filtered.forEach(item => {
        const totalValue = item.qty * item.cost;
        const isLowStock = item.qty < 50;
        
        tbody.innerHTML += `
          <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100">
            <td class="p-4 font-bold text-slate-900">${escapeHtml(item.sku)}</td>
            <td class="p-4">${escapeHtml(item.name)}</td>
            <td class="p-4">${escapeHtml(item.category)}</td>
            <td class="p-4">${escapeHtml(item.warehouse)}</td>
            <td class="p-4 ${isLowStock ? 'text-rose-600 font-bold' : ''}">${item.qty} ${isLowStock ? '⚠️' : ''}</td>
            <td class="p-4">${formatCurrency(item.cost)}</td>
            <td class="p-4 text-right font-bold text-blue-600">${formatCurrency(totalValue)}</td>
          </tr>
        `;
      });
    }
  }
  
  const metrics = document.getElementById('report-metrics');
  if (metrics) {
    let totalValuation = 0;
    let lowStockCount = 0;
    
    filtered.forEach(item => {
        totalValuation += (item.qty * item.cost);
        if (item.qty < 50) lowStockCount++;
    });
    
    metrics.innerHTML = `
      <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Inventory Valuation</span>
        <span class="text-xl font-extrabold text-blue-600 block mt-2">${formatCurrency(totalValuation)}</span>
      </div>
      <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total SKUs</span>
        <span class="text-xl font-extrabold text-slate-800 block mt-2">${filtered.length}</span>
      </div>
      <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Low Stock Items</span>
        <span class="text-xl font-extrabold ${lowStockCount > 0 ? 'text-rose-600' : 'text-emerald-600'} block mt-2">${lowStockCount}</span>
      </div>
    `;
  }
  
  initIcons();
};

document.addEventListener('DOMContentLoaded', async () => {
  await appReadyPromise;
  window.renderAll();
});
