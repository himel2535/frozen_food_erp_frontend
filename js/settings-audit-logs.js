// ----------------------------------------------------
// Security Audit Logs Module — Toys Factory ERP MPA
// ----------------------------------------------------
import { appReadyPromise, initIcons } from '/js/shared.js';

let logsList = [
  { ts: '2026-06-28 10:45:12', user: 'Admin User', type: 'CREATE', module: 'Sales', desc: 'Approved Invoice INV-2026-001', ip: '192.168.1.10' },
  { ts: '2026-06-28 09:32:00', user: 'HR Manager', type: 'UPDATE', module: 'HRM', desc: 'Updated employee records', ip: '192.168.1.45' },
  { ts: '2026-06-28 09:15:33', user: 'Admin User', type: 'LOGIN', module: 'Auth', desc: 'Successful login', ip: '192.168.1.10' },
  { ts: '2026-06-27 16:22:10', user: 'Sales Rep 1', type: 'CREATE', module: 'Sales', desc: 'Created Draft Memo INV-2026-002', ip: '10.0.0.5' },
  { ts: '2026-06-27 14:10:05', user: 'System', type: 'BACKGROUND', module: 'Payroll', desc: 'Auto-calculated weekly wages', ip: '127.0.0.1' },
];

window.renderTable = function() {
  const tbody = document.getElementById('settings-audit-logs-body');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  const search = document.getElementById('settings-audit-logs-search-input')?.value.toLowerCase() || '';
  
  const filtered = logsList.filter(item => {
    return !search || Object.values(item).some(val => String(val).toLowerCase().includes(search));
  });
  
  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-slate-400">No logs found</td></tr>`;
    return;
  }
  
  filtered.forEach(item => {
    const typeColor = item.type === 'CREATE' ? 'text-emerald-600 bg-emerald-50' :
                      item.type === 'UPDATE' ? 'text-blue-600 bg-blue-50' :
                      item.type === 'LOGIN' ? 'text-purple-600 bg-purple-50' :
                      'text-slate-600 bg-slate-100';

    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-50 transition-colors group';
    tr.innerHTML = `
      <td class="p-4 pl-6 font-medium text-slate-500 whitespace-nowrap">${item.ts}</td>
      <td class="p-4 font-bold text-slate-900">${item.user}</td>
      <td class="p-4">
        <span class="px-2 py-1 rounded-md text-[10px] font-bold ${typeColor}">${item.type}</span>
      </td>
      <td class="p-4 font-semibold text-slate-600">${item.module}</td>
      <td class="p-4 text-slate-700">${item.desc}</td>
      <td class="p-4 text-right font-mono text-[11px] text-slate-400">${item.ip}</td>
    `;
    tbody.appendChild(tr);
  });
  
  initIcons();
};

document.addEventListener('DOMContentLoaded', async () => {
  await appReadyPromise;
  window.renderTable();
});
