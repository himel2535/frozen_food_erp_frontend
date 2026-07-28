import { appReadyPromise, appState, saveAppState, initIcons } from '/js/shared.js';

function escapeHtml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function getList() {
  if (!appState.settingsRoles) {
    appState.settingsRoles = [
      { id: "ROL-001", name: "Admin", category: "Security", desc: "System administration and configuration privileges.", grants: ["crm", "inventory", "sales", "hrm", "purchases", "accounting"] },
      { id: "ROL-002", name: "Manager", category: "Executive", desc: "Access to business records, manager approvals, reporting panels.", grants: ["crm", "sales", "hrm", "purchases"] },
      { id: "ROL-003", name: "Staff", category: "Staff", desc: "Data entry, status updates, client relationship logs.", grants: ["crm", "sales"] },
      { id: "ROL-004", name: "Viewer", category: "Staff", desc: "Read-only access across enabled workflows.", grants: [] }
    ];
    saveAppState();
  }
  return appState.settingsRoles;
}

window.showMainView = function() {
  document.getElementById('settings-roles-main-view').classList.remove('hidden');
  document.getElementById('settings-roles-form-view').classList.add('hidden');
};

window.showFormView = function() {
  document.getElementById('settings-roles-main-view').classList.add('hidden');
  document.getElementById('settings-roles-form-view').classList.remove('hidden');
};

window.openRoleForm = function(index = null) {
  const form = document.getElementById('settings-roles-form');
  if (form) form.reset();

  const titleEl = document.getElementById('role-form-title');
  const indexInput = document.getElementById('input-role-index');

  // Collapse advanced section by default
  const advancedSec = document.getElementById('settings-roles-advanced-section');
  const advancedIcon = document.getElementById('settings-roles-advanced-icon');
  if (advancedSec) advancedSec.classList.add('hidden');
  if (advancedIcon) {
    advancedIcon.style.transform = 'rotate(0deg)';
    advancedIcon.setAttribute('data-lucide', 'chevron-down');
  }

  if (index !== null) {
    if (titleEl) titleEl.textContent = "Edit Role";
    const role = getList()[index];
    if (indexInput) indexInput.value = index;

    document.getElementById('input-name').value = role.name || '';
    document.getElementById('input-category').value = role.category || 'Staff';
    document.getElementById('input-desc').value = role.desc || '';

    // Check grants
    const grants = role.grants || [];
    document.getElementById('grant-crm').checked = grants.includes('crm');
    document.getElementById('grant-inventory').checked = grants.includes('inventory');
    document.getElementById('grant-sales').checked = grants.includes('sales');
    document.getElementById('grant-hrm').checked = grants.includes('hrm');
    document.getElementById('grant-purchases').checked = grants.includes('purchases');
    document.getElementById('grant-accounting').checked = grants.includes('accounting');
  } else {
    if (titleEl) titleEl.textContent = "Create Role";
    if (indexInput) indexInput.value = '';
    
    document.getElementById('grant-crm').checked = false;
    document.getElementById('grant-inventory').checked = false;
    document.getElementById('grant-sales').checked = false;
    document.getElementById('grant-hrm').checked = false;
    document.getElementById('grant-purchases').checked = false;
    document.getElementById('grant-accounting').checked = false;
  }

  window.showFormView();
  initIcons();
};

window.toggleAdvancedFields = function() {
  const sec = document.getElementById('settings-roles-advanced-section');
  const icon = document.getElementById('settings-roles-advanced-icon');
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

window.handleRoleSubmit = function(event) {
  event.preventDefault();
  const list = getList();
  const index = document.getElementById('input-role-index').value;

  const grants = [];
  if (document.getElementById('grant-crm').checked) grants.push('crm');
  if (document.getElementById('grant-inventory').checked) grants.push('inventory');
  if (document.getElementById('grant-sales').checked) grants.push('sales');
  if (document.getElementById('grant-hrm').checked) grants.push('hrm');
  if (document.getElementById('grant-purchases').checked) grants.push('purchases');
  if (document.getElementById('grant-accounting').checked) grants.push('accounting');

  const roleRecord = {
    id: index !== '' ? list[index].id : `ROL-${String(100 + list.length + 1).slice(1)}`,
    name: document.getElementById('input-name').value,
    category: document.getElementById('input-category').value,
    desc: document.getElementById('input-desc').value,
    grants: grants
  };

  if (index !== '') {
    list[index] = roleRecord;
  } else {
    list.push(roleRecord);
  }

  saveAppState();
  window.showMainView();
  renderAll();
};

window.deleteRole = function(index) {
  const roleName = getList()[index].name;
  if (confirm(`Are you sure you want to delete the role "${roleName}"?`)) {
    getList().splice(index, 1);
    saveAppState();
    renderAll();
  }
};

window.renderTable = function() {
  const tbody = document.getElementById('settings-roles-body');
  if (!tbody) return;

  tbody.innerHTML = '';
  const search = document.getElementById('settings-roles-search-input')?.value.toLowerCase() || '';
  const list = getList();
  const users = appState.users || [];

  const filtered = list.map((role, idx) => ({ ...role, originalIndex: idx })).filter(item => {
    return !search || 
      item.name.toLowerCase().includes(search) || 
      item.category.toLowerCase().includes(search) || 
      item.desc.toLowerCase().includes(search);
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-slate-400 font-semibold">No roles found matching criteria.</td></tr>`;
    return;
  }

  filtered.forEach(item => {
    // Count associated users dynamically matching this role name
    const count = users.filter(u => String(u.role).toLowerCase() === String(item.name).toLowerCase()).length;
    
    tbody.innerHTML += `
      <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100">
        <td class="p-4 font-bold text-slate-900">${escapeHtml(item.id)}</td>
        <td class="p-4 font-bold text-indigo-600">${escapeHtml(item.name)}</td>
        <td class="p-4 font-semibold text-slate-500">${escapeHtml(item.category)}</td>
        <td class="p-4 text-slate-400 font-medium">${escapeHtml(item.desc || '—')}</td>
        <td class="p-4"><span class="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-bold">${count} Users</span></td>
        <td class="p-4 text-right">
          <div class="flex items-center justify-end gap-2">
            <button onclick="window.openRoleForm(${item.originalIndex})" class="p-1.5 text-slate-450 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer" title="Edit Role">
              <i data-lucide="eye" class="w-3.5 h-3.5"></i>
            </button>
            <button onclick="window.deleteRole(${item.originalIndex})" class="p-1.5 text-slate-450 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer" title="Delete Role">
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
  const metricsContainer = document.getElementById('settings-roles-metrics');
  if (!metricsContainer) return;

  const totalRoles = list.length;
  const securityRoles = list.filter(r => r.category === 'Security').length;
  const operationRoles = list.filter(r => r.category === 'Operations' || r.category === 'Staff').length;

  metricsContainer.innerHTML = `
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Security Roles</span>
      <span class="text-xl font-extrabold text-indigo-650 block mt-2">${totalRoles}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Security-critical Roles</span>
      <span class="text-xl font-extrabold text-purple-600 block mt-2">${securityRoles}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Operational Roles</span>
      <span class="text-xl font-extrabold text-slate-900 block mt-2">${operationRoles}</span>
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
