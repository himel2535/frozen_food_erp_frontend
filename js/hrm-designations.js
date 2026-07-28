import { appReadyPromise, appState, saveAppState, initIcons } from '/js/shared.js';

function escapeHtml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

let currentEditingId = null;

// Return list
function getList() {
  if (!appState.hrmDesignations) {
    appState.hrmDesignations = [
      { id: "DESG-01", name: "Lead DevOps Architect", grade: "Grade 8", status: "Active", desc: "Coordinates cloud operations, security compliance, and automation." },
      { id: "DESG-02", name: "Full Stack Engineer", grade: "Grade 6", status: "Active", desc: "Builds client-side and backend software integrations." },
      { id: "DESG-03", name: "Operations Director", grade: "Grade 9", status: "Active", desc: "Coordinates production plants, materials flow, and logistics." },
      { id: "DESG-04", name: "HR Specialist", grade: "Grade 5", status: "Active", desc: "Coordinates employee recruitment and benefits allocations." },
      { id: "DESG-05", name: "VP of Sales", grade: "Grade 9", status: "Active", desc: "Directs client acquisition and enterprise relations." }
    ];
    saveAppState();
  }
  return appState.hrmDesignations;
}

// Navigation helpers
window.showMainView = function() {
  document.getElementById('hrm-designations-main-view').classList.remove('hidden');
  document.getElementById('hrm-designations-form-view').classList.add('hidden');
  currentEditingId = null;
};

window.showFormView = function() {
  document.getElementById('hrm-designations-main-view').classList.add('hidden');
  document.getElementById('hrm-designations-form-view').classList.remove('hidden');
};

// Open form modal
window.openDesignationModal = function() {
  currentEditingId = null;
  const form = document.getElementById('hrm-designations-form');
  if (form) form.reset();

  document.getElementById('desg-form-title').innerText = "Create Designation";
  
  // Collapse advanced details
  const advancedSection = document.getElementById('desg-advanced-section');
  if (advancedSection) advancedSection.classList.add('hidden');
  const advancedIcon = document.getElementById('desg-advanced-icon');
  if (advancedIcon) advancedIcon.style.transform = 'rotate(0deg)';

  window.showFormView();
};

window.toggleAdvancedFields = function() {
  const section = document.getElementById('desg-advanced-section');
  const icon = document.getElementById('desg-advanced-icon');
  if (section.classList.contains('hidden')) {
    section.classList.remove('hidden');
    icon.style.transform = 'rotate(180deg)';
  } else {
    section.classList.add('hidden');
    icon.style.transform = 'rotate(0deg)';
  }
};

// Form submit
window.handleSubmit = function(event) {
  event.preventDefault();
  const list = getList();

  const name = document.getElementById('input-desg-name').value.trim();
  const grade = document.getElementById('input-desg-grade').value.trim();
  const status = document.getElementById('input-desg-status').value;
  
  // Advanced details
  const desc = document.getElementById('input-desg-desc').value;

  if (currentEditingId) {
    const record = list.find(item => item.id === currentEditingId);
    if (record) {
      record.name = name;
      record.grade = grade;
      record.status = status;
      record.desc = desc;
    }
  } else {
    const nextIdNum = list.length > 0 ? Math.max(...list.map(item => Number(item.id.replace('DESG-', '')))) + 1 : 1;
    const newId = `DESG-${String(100 + nextIdNum).slice(1)}`;
    const newRecord = {
      id: newId,
      name,
      grade,
      status,
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
  document.getElementById('desg-form-title').innerText = `Edit Designation Details: ${id}`;

  document.getElementById('input-desg-name').value = record.name;
  document.getElementById('input-desg-grade').value = record.grade;
  document.getElementById('input-desg-status').value = record.status;
  
  // Advanced fields
  document.getElementById('input-desg-desc').value = record.desc || '';

  window.showFormView();
};

// Delete Action
window.deleteRecord = function(id) {
  const list = getList();
  const index = list.findIndex(item => item.id === id);
  if (index === -1) return;

  if (confirm(`Are you sure you want to delete designation ${id}?`)) {
    list.splice(index, 1);
    saveAppState();
    renderAll();
  }
};

// Render Metrics Header Cards
function renderMetrics() {
  const list = getList();
  const container = document.getElementById('hrm-designations-metrics');
  if (!container) return;

  const total = list.length;
  const active = list.filter(item => item.status === 'Active').length;
  
  // Calculate top hierarchy level grade count
  const distinctGrades = new Set(list.map(item => item.grade)).size;

  container.innerHTML = `
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Designations</span>
      <span class="text-xl font-extrabold text-slate-950 block mt-2">${total} roles</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Roles</span>
      <span class="text-xl font-extrabold text-emerald-600 block mt-2">${active} active</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-blue-200 bg-blue-50/20 premium-shadow">
      <span class="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">Hierarchical Grades</span>
      <span class="text-xl font-extrabold text-blue-700 block mt-2">${distinctGrades} levels</span>
    </div>
  `;
}

// Render data table rows
window.renderTable = function() {
  const tbody = document.getElementById('hrm-designations-body');
  if (!tbody) return;

  tbody.innerHTML = '';
  const search = (document.getElementById('hrm-designations-search-input')?.value || '').toLowerCase();
  const statusFilter = document.getElementById('filter-desg-status')?.value || 'all';

  const list = getList();

  const filtered = list.filter(item => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;

    if (search) {
      const queryMatches = 
        item.name.toLowerCase().includes(search) ||
        item.grade.toLowerCase().includes(search);

      if (!queryMatches) return false;
    }

    return true;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-slate-400 font-semibold">No designations found.</td></tr>`;
    return;
  }

  const employees = appState.employees || [];

  filtered.forEach(item => {
    // Count employees with this designation
    const headcount = employees.filter(emp => emp.designation === item.name).length;

    let badgeClass = "bg-slate-50 text-slate-700 border-slate-200";
    if (item.status === 'Active') badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (item.status === 'Inactive') badgeClass = "bg-rose-50 text-rose-700 border-rose-200";

    tbody.innerHTML += `
      <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100">
        <td class="p-4 pl-6 font-bold text-slate-900">${escapeHtml(item.id)}</td>
        <td class="p-4">
          <div class="font-semibold text-slate-900">${escapeHtml(item.name)}</div>
          ${item.desc ? `<div class="text-[10px] text-slate-400 font-medium">${escapeHtml(item.desc)}</div>` : ''}
        </td>
        <td class="p-4 font-semibold text-slate-750">${escapeHtml(item.grade)}</td>
        <td class="p-4 text-center font-bold text-slate-900">${headcount} members</td>
        <td class="p-4 text-center">
          <span class="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${badgeClass}">
            ${item.status}
          </span>
        </td>
        <td class="p-4">
          <div class="flex items-center justify-center gap-2">
            <button onclick="window.editRecord('${item.id}')" title="Edit Designation" class="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-slate-800 rounded-lg border border-slate-100 transition-colors cursor-pointer">
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
  renderAll();
});
