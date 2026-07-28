import { appReadyPromise, appState, saveAppState, initIcons } from '/js/shared.js';

function escapeHtml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function getList() {
  if (!appState.settingsPermissions) {
    appState.settingsPermissions = [
      { id: "PRM-001", key: "crm:read-write", active: "Enabled", scope: "Customer & Lead Workspace", limit: 1000, ip: "" },
      { id: "PRM-002", key: "inventory:stock-read", active: "Enabled", scope: "Inventory Control", limit: 500, ip: "" },
      { id: "PRM-003", key: "accounting:ledger-read", active: "Enabled", scope: "Financial Books", limit: 200, ip: "192.168.1.0/24" },
      { id: "PRM-004", key: "payroll:run", active: "Disabled", scope: "Salary processing", limit: 100, ip: "" }
    ];
    saveAppState();
  }
  return appState.settingsPermissions;
}

window.showMainView = function() {
  document.getElementById('settings-permissions-main-view').classList.remove('hidden');
  document.getElementById('settings-permissions-form-view').classList.add('hidden');
};

window.showFormView = function() {
  document.getElementById('settings-permissions-main-view').classList.add('hidden');
  document.getElementById('settings-permissions-form-view').classList.remove('hidden');
};

window.openPermissionForm = function(index = null) {
  const form = document.getElementById('settings-permissions-form');
  if (form) form.reset();

  const titleEl = document.getElementById('permission-form-title');
  const indexInput = document.getElementById('input-permission-index');

  // Collapse advanced details
  const advancedSec = document.getElementById('settings-permissions-advanced-section');
  const advancedIcon = document.getElementById('settings-permissions-advanced-icon');
  if (advancedSec) advancedSec.classList.add('hidden');
  if (advancedIcon) {
    advancedIcon.style.transform = 'rotate(0deg)';
    advancedIcon.setAttribute('data-lucide', 'chevron-down');
  }

  if (index !== null) {
    if (titleEl) titleEl.textContent = "Edit Permission";
    const perm = getList()[index];
    if (indexInput) indexInput.value = index;

    document.getElementById('input-key').value = perm.key || '';
    document.getElementById('input-scope').value = perm.scope || '';
    document.getElementById('input-active').value = perm.active || 'Enabled';
    document.getElementById('input-limit').value = perm.limit || '';
    document.getElementById('input-ip').value = perm.ip || '';
  } else {
    if (titleEl) titleEl.textContent = "Create Permission";
    if (indexInput) indexInput.value = '';
  }

  window.showFormView();
  initIcons();
};

window.toggleAdvancedFields = function() {
  const sec = document.getElementById('settings-permissions-advanced-section');
  const icon = document.getElementById('settings-permissions-advanced-icon');
  if (!sec) return;

  const isHidden = sec.classList.contains('hidden');
  if (isHidden) {
    sec.classList.remove('hidden');
    if (icon) icon.style.transform = 'rotate(180deg)';
  } else {
    sec.classList.add('hidden');
    if (icon) icon.style.transform = 'rotate(0deg)';
  }
};

window.handlePermissionSubmit = function(event) {
  event.preventDefault();
  const list = getList();
  const index = document.getElementById('input-permission-index').value;

  const permRecord = {
    id: index !== '' ? list[index].id : `PRM-${String(100 + list.length + 1).slice(1)}`,
    key: document.getElementById('input-key').value,
    scope: document.getElementById('input-scope').value,
    active: document.getElementById('input-active').value,
    limit: parseInt(document.getElementById('input-limit').value) || 0,
    ip: document.getElementById('input-ip').value
  };

  if (index !== '') {
    list[index] = permRecord;
  } else {
    list.push(permRecord);
  }

  saveAppState();
  window.showMainView();
  renderAll();
};

window.deletePermission = function(index) {
  const permKey = getList()[index].key;
  if (confirm(`Are you sure you want to delete permission key "${permKey}"?`)) {
    getList().splice(index, 1);
    saveAppState();
    renderAll();
  }
};

window.renderTable = function() {
  const tbody = document.getElementById('settings-permissions-body');
  if (!tbody) return;

  tbody.innerHTML = '';
  const search = document.getElementById('settings-permissions-search-input')?.value.toLowerCase() || '';
  const list = getList();

  const filtered = list.map((perm, idx) => ({ ...perm, originalIndex: idx })).filter(item => {
    return !search || 
      item.key.toLowerCase().includes(search) || 
      item.scope.toLowerCase().includes(search) ||
      item.active.toLowerCase().includes(search);
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-slate-400 font-semibold">No permissions found matching search.</td></tr>`;
    return;
  }

  filtered.forEach(item => {
    const badgeColor = item.active === 'Enabled' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600';
    tbody.innerHTML += `
      <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100">
        <td class="p-4 font-bold text-slate-900">${escapeHtml(item.id)}</td>
        <td class="p-4 font-bold text-blue-600">${escapeHtml(item.key)}</td>
        <td class="p-4 text-slate-500 font-semibold">${escapeHtml(item.scope)}</td>
        <td class="p-4"><span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold ${badgeColor}">${escapeHtml(item.active)}</span></td>
        <td class="p-4 text-right">
          <div class="flex items-center justify-end gap-2">
            <button onclick="window.openPermissionForm(${item.originalIndex})" class="p-1.5 text-slate-450 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer" title="Edit Permission">
              <i data-lucide="eye" class="w-3.5 h-3.5"></i>
            </button>
            <button onclick="window.deletePermission(${item.originalIndex})" class="p-1.5 text-slate-450 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer" title="Delete Permission">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  });
};

function renderMetrics() {
  const list = getList();
  const metricsContainer = document.getElementById('settings-permissions-metrics');
  if (!metricsContainer) return;

  const totalRules = list.length;
  const enabledCount = list.filter(p => p.active === 'Enabled').length;
  const limitedRules = list.filter(p => p.limit > 0).length;

  metricsContainer.innerHTML = `
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Rules</span>
      <span class="text-xl font-extrabold text-slate-950 block mt-2">${totalRules}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Rules</span>
      <span class="text-xl font-extrabold text-emerald-600 block mt-2">${enabledCount}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Rate Limited Rules</span>
      <span class="text-xl font-extrabold text-blue-600 block mt-2">${limitedRules}</span>
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
