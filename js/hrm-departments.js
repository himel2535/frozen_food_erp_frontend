import { appReadyPromise, appState, saveAppState, initIcons } from '/js/shared.js';

function escapeHtml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

let currentEditingId = null;

// Return departments from appState
function getList() {
  if (!appState.hrmDepartments) {
    appState.hrmDepartments = [
      { id: "DEP-01", code: "IT", name: "IT", head: "Sarah Connor", status: "Active", loc: "Building A, Floor 3", desc: "Corporate network and server infrastructure." },
      { id: "DEP-02", code: "Sales", name: "Sales", head: "Marcus Wright", status: "Active", loc: "Tejgaon Floor 2", desc: "Enterprise account management." },
      { id: "DEP-03", code: "HR", name: "HR", head: "Arthur Dent", status: "Active", loc: "Tejgaon Floor 1", desc: "Human resources and payroll management." },
      { id: "DEP-04", code: "Production", name: "Production", head: "Ellen Ripley", status: "Active", loc: "Gazipur Unit 1", desc: "Apparel line manufacture." }
    ];
    saveAppState();
  }
  return appState.hrmDepartments;
}

// Navigation helpers
window.showMainView = function() {
  document.getElementById('hrm-departments-main-view').classList.remove('hidden');
  document.getElementById('hrm-departments-form-view').classList.add('hidden');
  currentEditingId = null;
};

window.showFormView = function() {
  document.getElementById('hrm-departments-main-view').classList.add('hidden');
  document.getElementById('hrm-departments-form-view').classList.remove('hidden');
};

// Open form modal
window.openDepartmentModal = function() {
  currentEditingId = null;
  const form = document.getElementById('hrm-departments-form');
  if (form) form.reset();

  document.getElementById('dept-form-title').innerText = "Create Department";
  
  // Collapse advanced details
  const advancedSection = document.getElementById('dept-advanced-section');
  if (advancedSection) advancedSection.classList.add('hidden');
  const advancedIcon = document.getElementById('dept-advanced-icon');
  if (advancedIcon) advancedIcon.style.transform = 'rotate(0deg)';

  window.showFormView();
};

window.toggleAdvancedFields = function() {
  const section = document.getElementById('dept-advanced-section');
  const icon = document.getElementById('dept-advanced-icon');
  if (section.classList.contains('hidden')) {
    section.classList.remove('hidden');
    icon.style.transform = 'rotate(180deg)';
  } else {
    section.classList.add('hidden');
    icon.style.transform = 'rotate(0deg)';
  }
};

// Populate managers from appState.employees list
function populateManagers() {
  const headSelect = document.getElementById('input-dept-head');
  if (!headSelect) return;

  const employees = appState.employees || [];
  headSelect.innerHTML = '<option value="">Select Manager / Head *</option>';
  employees.forEach(emp => {
    headSelect.innerHTML += `<option value="${escapeHtml(emp.name)}">${escapeHtml(emp.name)} (${escapeHtml(emp.designation)})</option>`;
  });
}

// Form submit
window.handleSubmit = function(event) {
  event.preventDefault();
  const list = getList();

  const code = document.getElementById('input-dept-code').value.toUpperCase().trim();
  const name = document.getElementById('input-dept-name').value.trim();
  const head = document.getElementById('input-dept-head').value;
  const status = document.getElementById('input-dept-status').value;
  
  // Advanced details
  const loc = document.getElementById('input-dept-loc').value;
  const desc = document.getElementById('input-dept-desc').value;

  if (currentEditingId) {
    const record = list.find(item => item.id === currentEditingId);
    if (record) {
      record.code = code;
      record.name = name;
      record.head = head;
      record.status = status;
      record.loc = loc;
      record.desc = desc;
    }
  } else {
    const nextIdNum = list.length > 0 ? Math.max(...list.map(item => Number(item.id.replace('DEP-', '')))) + 1 : 1;
    const newId = `DEP-${String(100 + nextIdNum).slice(1)}`;
    const newRecord = {
      id: newId,
      code,
      name,
      head,
      status,
      loc,
      desc
    };
    list.push(newRecord);
  }

  saveAppState();
  window.showMainView();
  renderAll();
};

// Edit action
window.editRecord = function(id) {
  const list = getList();
  const record = list.find(item => item.id === id);
  if (!record) return;

  currentEditingId = id;
  document.getElementById('dept-form-title').innerText = `Edit Department Details: ${id}`;

  document.getElementById('input-dept-code').value = record.code;
  document.getElementById('input-dept-name').value = record.name;
  document.getElementById('input-dept-head').value = record.head;
  document.getElementById('input-dept-status').value = record.status;
  
  // Advanced fields
  document.getElementById('input-dept-loc').value = record.loc || '';
  document.getElementById('input-dept-desc').value = record.desc || '';

  window.showFormView();
};

// Delete Action
window.deleteRecord = function(id) {
  const list = getList();
  const index = list.findIndex(item => item.id === id);
  if (index === -1) return;

  if (confirm(`Are you sure you want to delete department ${id}?`)) {
    list.splice(index, 1);
    saveAppState();
    renderAll();
  }
};

// Render Metrics Header Cards
function renderMetrics() {
  const list = getList();
  const container = document.getElementById('hrm-departments-metrics');
  if (!container) return;

  const total = list.length;
  const active = list.filter(item => item.status === 'Active').length;
  
  // Total employees active
  const totalEmployees = appState.employees ? appState.employees.length : 0;

  container.innerHTML = `
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Depts</span>
      <span class="text-xl font-extrabold text-slate-950 block mt-2">${total} divisions</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Divisions</span>
      <span class="text-xl font-extrabold text-emerald-600 block mt-2">${active} divisions</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-blue-200 bg-blue-50/20 premium-shadow">
      <span class="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">Total Allocated Staff</span>
      <span class="text-xl font-extrabold text-blue-700 block mt-2">${totalEmployees} employees</span>
    </div>
  `;
}

// Render data table rows
window.renderTable = function() {
  const tbody = document.getElementById('hrm-departments-body');
  if (!tbody) return;

  tbody.innerHTML = '';
  const search = (document.getElementById('hrm-departments-search-input')?.value || '').toLowerCase();
  const statusFilter = document.getElementById('filter-dept-status')?.value || 'all';

  const list = getList();

  const filtered = list.filter(item => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;

    if (search) {
      const queryMatches = 
        item.code.toLowerCase().includes(search) ||
        item.name.toLowerCase().includes(search) ||
        (item.head || '').toLowerCase().includes(search);

      if (!queryMatches) return false;
    }

    return true;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-slate-400 font-semibold">No departments found.</td></tr>`;
    return;
  }

  const employees = appState.employees || [];

  filtered.forEach(item => {
    // Count employees in this department
    const headcount = employees.filter(emp => emp.department === item.name || emp.department === item.code).length;

    let badgeClass = "bg-slate-50 text-slate-700 border-slate-200";
    if (item.status === 'Active') badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (item.status === 'Inactive') badgeClass = "bg-rose-50 text-rose-700 border-rose-200";

    tbody.innerHTML += `
      <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100">
        <td class="p-4 pl-6 font-bold text-slate-900">${escapeHtml(item.code)}</td>
        <td class="p-4">
          <div class="font-semibold text-slate-900">${escapeHtml(item.name)}</div>
          ${item.desc ? `<div class="text-[10px] text-slate-400 font-medium">${escapeHtml(item.desc)}</div>` : ''}
        </td>
        <td class="p-4 font-semibold text-slate-700">${escapeHtml(item.head || 'N/A')}</td>
        <td class="p-4 text-center font-bold text-slate-900">${headcount} members</td>
        <td class="p-4 text-center">
          <span class="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${badgeClass}">
            ${item.status}
          </span>
        </td>
        <td class="p-4">
          <div class="flex items-center justify-center gap-2">
            <button onclick="window.editRecord('${item.id}')" title="Edit Division" class="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-slate-800 rounded-lg border border-slate-100 transition-colors cursor-pointer">
              <i data-lucide="eye" class="w-3.5 h-3.5"></i>
            </button>
            <button onclick="window.deleteRecord('${item.id}')" title="Delete" class="p-1.5 hover:bg-rose-50 text-rose-600 hover:text-rose-700 rounded-lg border border-slate-100 hover:border-rose-200 transition-colors cursor-pointer">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  });
};

function renderAll() {
  renderMetrics();
  window.renderTable();
  initIcons();
}

document.addEventListener('DOMContentLoaded', async () => {
  await appReadyPromise;
  populateManagers();
  renderAll();
});
