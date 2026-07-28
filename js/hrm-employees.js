import { appReadyPromise, appState, saveAppState, initIcons } from '/js/shared.js';

function escapeHtml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

let currentEditingId = null;

// Return lists
function getList() {
  return appState.employees || [];
}

// Navigation helpers
window.showMainView = function() {
  document.getElementById('hrm-employees-main-view').classList.remove('hidden');
  document.getElementById('hrm-employees-form-view').classList.add('hidden');
  currentEditingId = null;
};

window.showFormView = function() {
  document.getElementById('hrm-employees-main-view').classList.add('hidden');
  document.getElementById('hrm-employees-form-view').classList.remove('hidden');
};

// Open form mode
window.openEmployeeModal = function() {
  currentEditingId = null;
  const form = document.getElementById('hrm-employees-form');
  if (form) form.reset();

  document.getElementById('employee-form-title').innerText = "Register New Employee";
  
  // Set default joining date to today
  document.getElementById('input-emp-joining').value = new Date().toISOString().split('T')[0];

  // Collapse advanced details
  const advancedSection = document.getElementById('employee-advanced-section');
  if (advancedSection) advancedSection.classList.add('hidden');
  const advancedIcon = document.getElementById('employee-advanced-icon');
  if (advancedIcon) advancedIcon.style.transform = 'rotate(0deg)';

  window.showFormView();
};

window.toggleAdvancedFields = function() {
  const section = document.getElementById('employee-advanced-section');
  const icon = document.getElementById('employee-advanced-icon');
  if (section.classList.contains('hidden')) {
    section.classList.remove('hidden');
    icon.style.transform = 'rotate(180deg)';
  } else {
    section.classList.add('hidden');
    icon.style.transform = 'rotate(0deg)';
  }
};

// Populators for departments & designations dropdown selectors
function populateDropdowns() {
  const deptSelect = document.getElementById('input-emp-dept');
  const filterDept = document.getElementById('filter-department');
  const desgSelect = document.getElementById('input-emp-desg');
  const filterDesg = document.getElementById('filter-designation');

  // Load departments
  const departments = appState.hrmDepartments || [{id: "DEP-01", name: "Production"}, {id: "DEP-02", name: "IT"}];
  if (deptSelect) {
    deptSelect.innerHTML = '<option value="">Select Department *</option>';
    departments.forEach(d => {
      deptSelect.innerHTML += `<option value="${escapeHtml(d.name)}">${escapeHtml(d.name)}</option>`;
    });
  }
  if (filterDept) {
    filterDept.innerHTML = '<option value="all">All Departments</option>';
    departments.forEach(d => {
      filterDept.innerHTML += `<option value="${escapeHtml(d.name)}">${escapeHtml(d.name)}</option>`;
    });
  }

  // Load designations
  const designations = appState.hrmDesignations || [{id: "DESG-01", name: "Developer"}, {id: "DESG-02", name: "Director"}];
  if (desgSelect) {
    desgSelect.innerHTML = '<option value="">Select Designation *</option>';
    designations.forEach(d => {
      desgSelect.innerHTML += `<option value="${escapeHtml(d.name)}">${escapeHtml(d.name)}</option>`;
    });
  }
  if (filterDesg) {
    filterDesg.innerHTML = '<option value="all">All Designations</option>';
    designations.forEach(d => {
      filterDesg.innerHTML += `<option value="${escapeHtml(d.name)}">${escapeHtml(d.name)}</option>`;
    });
  }
}

// Form Submission handling
window.handleSubmit = function(event) {
  event.preventDefault();
  const list = getList();

  const name = document.getElementById('input-emp-name').value;
  const phone = document.getElementById('input-emp-phone').value;
  const department = document.getElementById('input-emp-dept').value;
  const designation = document.getElementById('input-emp-desg').value;
  const joiningDate = document.getElementById('input-emp-joining').value;
  
  // Advanced fields
  const email = document.getElementById('input-emp-email').value;
  const status = document.getElementById('input-emp-status').value;
  const notes = document.getElementById('input-emp-notes').value;

  if (currentEditingId) {
    const record = list.find(item => item.id === currentEditingId);
    if (record) {
      record.name = name;
      record.phone = phone;
      record.department = department;
      record.designation = designation;
      record.joiningDate = joiningDate;
      record.email = email;
      record.status = status;
      record.notes = notes;
    }
  } else {
    const nextIdNum = list.length > 0 ? Math.max(...list.map(item => Number(item.id.replace('EMP-', '')))) + 1 : 1;
    const newId = `EMP-${String(1000 + nextIdNum).slice(1)}`;
    const newRecord = {
      id: newId,
      name,
      phone,
      department,
      designation,
      joiningDate,
      email,
      status,
      notes
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
  document.getElementById('employee-form-title').innerText = `Edit Employee Details: ${id}`;

  document.getElementById('input-emp-name').value = record.name;
  document.getElementById('input-emp-phone').value = record.phone;
  document.getElementById('input-emp-dept').value = record.department;
  document.getElementById('input-emp-desg').value = record.designation;
  document.getElementById('input-emp-joining').value = record.joiningDate;

  // Advanced fields
  document.getElementById('input-emp-email').value = record.email || '';
  document.getElementById('input-emp-status').value = record.status || 'active';
  document.getElementById('input-emp-notes').value = record.notes || '';

  window.showFormView();
};

// Delete Action
window.deleteRecord = function(id) {
  const index = appState.employees.findIndex(item => item.id === id);
  if (index === -1) return;

  if (confirm(`Are you sure you want to remove employee ${id}? This deletes their corporate records.`)) {
    appState.employees.splice(index, 1);
    saveAppState();
    renderAll();
  }
};

// Metrics
function renderMetrics() {
  const list = getList();
  const container = document.getElementById('hrm-employees-metrics');
  if (!container) return;

  const total = list.length;
  const active = list.filter(item => item.status === 'active').length;
  const onLeave = list.filter(item => item.status === 'on-leave').length;
  const inactive = list.filter(item => item.status === 'inactive').length;

  container.innerHTML = `
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Employees</span>
      <span class="text-xl font-extrabold text-slate-950 block mt-2">${total} registered</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Staff</span>
      <span class="text-xl font-extrabold text-emerald-600 block mt-2">${active} online</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-blue-200 bg-blue-50/20 premium-shadow">
      <span class="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">On Outbound Leave</span>
      <span class="text-xl font-extrabold text-blue-700 block mt-2">${onLeave} leave</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Suspended / Inactive</span>
      <span class="text-xl font-extrabold text-slate-500 block mt-2">${inactive} accounts</span>
    </div>
  `;
}

// Render data table rows
window.renderTable = function() {
  const tbody = document.getElementById('hrm-employees-body');
  if (!tbody) return;

  tbody.innerHTML = '';
  const search = (document.getElementById('hrm-employees-search-input')?.value || '').toLowerCase();
  const deptFilter = document.getElementById('filter-department')?.value || 'all';
  const desgFilter = document.getElementById('filter-designation')?.value || 'all';
  const statusFilter = document.getElementById('filter-status')?.value || 'all';

  const list = getList();

  const filtered = list.filter(item => {
    if (deptFilter !== 'all' && item.department !== deptFilter) return false;
    if (desgFilter !== 'all' && item.designation !== desgFilter) return false;
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;

    if (search) {
      const queryMatches = 
        item.id.toLowerCase().includes(search) ||
        item.name.toLowerCase().includes(search) ||
        (item.designation || '').toLowerCase().includes(search) ||
        (item.department || '').toLowerCase().includes(search);

      if (!queryMatches) return false;
    }

    return true;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="p-8 text-center text-slate-400 font-semibold">No employees found in directory.</td></tr>`;
    return;
  }

  filtered.forEach(item => {
    let badgeClass = "bg-slate-50 text-slate-700 border-slate-200";
    if (item.status === 'active') badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (item.status === 'on-leave') badgeClass = "bg-blue-50 text-blue-700 border-blue-200";
    if (item.status === 'inactive') badgeClass = "bg-rose-50 text-rose-700 border-rose-200";

    tbody.innerHTML += `
      <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100">
        <td class="p-4 pl-6 font-bold text-slate-900">${escapeHtml(item.id)}</td>
        <td class="p-4">
          <div class="font-semibold text-slate-900">${escapeHtml(item.name)}</div>
          ${item.email ? `<div class="text-[10px] text-slate-400 font-medium">${escapeHtml(item.email)}</div>` : ''}
        </td>
        <td class="p-4 font-semibold text-slate-700">${escapeHtml(item.department)}</td>
        <td class="p-4 font-semibold text-slate-600">${escapeHtml(item.designation)}</td>
        <td class="p-4 font-medium text-slate-650">${escapeHtml(item.phone)}</td>
        <td class="p-4 text-slate-500 font-medium">${escapeHtml(item.joiningDate || 'N/A')}</td>
        <td class="p-4 text-center">
          <span class="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${badgeClass}">
            ${item.status}
          </span>
        </td>
        <td class="p-4">
          <div class="flex items-center justify-center gap-2">
            <button onclick="window.editRecord('${item.id}')" title="Edit Profile" class="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-slate-800 rounded-lg border border-slate-100 transition-colors cursor-pointer">
              <i data-lucide="eye" class="w-3.5 h-3.5"></i>
            </button>
            <button onclick="window.deleteRecord('${item.id}')" title="Delete Profile" class="p-1.5 hover:bg-rose-50 text-rose-600 hover:text-rose-700 rounded-lg border border-slate-100 hover:border-rose-200 transition-colors cursor-pointer">
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
  populateDropdowns();
  renderAll();
});
