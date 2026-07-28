import { appReadyPromise, appState, saveAppState, initIcons } from '/js/shared.js';

function escapeHtml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

let currentEditingId = null;

// Return leaves list
function getList() {
  if (!appState.hrmLeaves) {
    appState.hrmLeaves = [
      { id: "LR-001", employeeId: "EMP-004", type: "Casual Leave", start: "2026-06-15", end: "2026-06-18", days: 3, reason: "Family event travel", status: "Approved" },
      { id: "LR-002", employeeId: "EMP-001", type: "Sick Leave", start: "2026-06-20", end: "2026-06-21", days: 1, reason: "Medical appointment", status: "Pending" }
    ];
    saveAppState();
  }
  return appState.hrmLeaves;
}

// Navigation helpers
window.showMainView = function() {
  document.getElementById('hrm-leave-main-view').classList.remove('hidden');
  document.getElementById('hrm-leave-form-view').classList.add('hidden');
  currentEditingId = null;
};

window.showFormView = function() {
  document.getElementById('hrm-leave-main-view').classList.add('hidden');
  document.getElementById('hrm-leave-form-view').classList.remove('hidden');
};

// Open form modal
window.openLeaveModal = function() {
  currentEditingId = null;
  const form = document.getElementById('hrm-leave-form');
  if (form) form.reset();

  document.getElementById('leave-form-title').innerText = "Request Leave";
  
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('input-leave-start').value = today;
  document.getElementById('input-leave-end').value = today;

  // Collapse advanced details
  const advancedSection = document.getElementById('leave-advanced-section');
  if (advancedSection) advancedSection.classList.add('hidden');
  const advancedIcon = document.getElementById('leave-advanced-icon');
  if (advancedIcon) advancedIcon.style.transform = 'rotate(0deg)';

  window.showFormView();
};

window.toggleAdvancedFields = function() {
  const section = document.getElementById('leave-advanced-section');
  const icon = document.getElementById('leave-advanced-icon');
  if (section.classList.contains('hidden')) {
    section.classList.remove('hidden');
    icon.style.transform = 'rotate(180deg)';
  } else {
    section.classList.add('hidden');
    icon.style.transform = 'rotate(0deg)';
  }
};

// Populate employees dynamic dropdown
function populateEmployees() {
  const empSelect = document.getElementById('input-leave-emp');
  if (!empSelect) return;

  const employees = appState.employees || [];
  empSelect.innerHTML = '<option value="">Select Employee *</option>';
  employees.forEach(emp => {
    empSelect.innerHTML += `<option value="${escapeHtml(emp.id)}">${escapeHtml(emp.name)} (${escapeHtml(emp.id)})</option>`;
  });
}

// Helper to calculate total days between start/end dates
function calculateDays(startStr, endStr) {
  if (!startStr || !endStr) return 1;
  const start = new Date(startStr);
  const end = new Date(endStr);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays || 1;
}

// Transition: Approve Leave
window.approveLeave = function(id) {
  const list = getList();
  const record = list.find(item => item.id === id);
  if (!record || record.status !== 'Pending') return;

  if (confirm(`Approve leave request ${id}? This updates employee status to On Leave.`)) {
    record.status = 'Approved';
    
    // Auto update employee status to on-leave
    const employee = appState.employees?.find(emp => emp.id === record.employeeId);
    if (employee) {
      employee.status = 'on-leave';
    }

    saveAppState();
    renderAll();
  }
};

// Transition: Reject Leave
window.rejectLeave = function(id) {
  const list = getList();
  const record = list.find(item => item.id === id);
  if (!record || record.status !== 'Pending') return;

  if (confirm(`Reject leave request ${id}?`)) {
    record.status = 'Rejected';
    saveAppState();
    renderAll();
  }
};

// Form submit
window.handleSubmit = function(event) {
  event.preventDefault();
  const list = getList();

  const employeeId = document.getElementById('input-leave-emp').value;
  const type = document.getElementById('input-leave-type').value;
  const start = document.getElementById('input-leave-start').value;
  const end = document.getElementById('input-leave-end').value;
  const reason = document.getElementById('input-leave-reason').value;

  const days = calculateDays(start, end);

  if (currentEditingId) {
    const record = list.find(item => item.id === currentEditingId);
    if (record) {
      if (record.status === 'Pending') {
        record.employeeId = employeeId;
        record.type = type;
        record.start = start;
        record.end = end;
        record.days = days;
      }
      record.reason = reason;
    }
  } else {
    const nextIdNum = list.length > 0 ? Math.max(...list.map(item => Number(item.id.replace('LR-', '')))) + 1 : 1;
    const newId = `LR-${String(100 + nextIdNum).slice(1)}`;
    const newRecord = {
      id: newId,
      employeeId,
      type,
      start,
      end,
      days,
      reason,
      status: "Pending"
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
  document.getElementById('leave-form-title').innerText = `Edit Leave Request: ${id}`;

  document.getElementById('input-leave-emp').value = record.employeeId;
  document.getElementById('input-leave-type').value = record.type;
  document.getElementById('input-leave-start').value = record.start;
  document.getElementById('input-leave-end').value = record.end;
  
  // Advanced fields
  document.getElementById('input-leave-reason').value = record.reason || '';

  // Lock parameters if Approved or Rejected
  const isLocked = record.status !== 'Pending';
  document.getElementById('input-leave-emp').disabled = isLocked;
  document.getElementById('input-leave-type').disabled = isLocked;
  document.getElementById('input-leave-start').disabled = isLocked;
  document.getElementById('input-leave-end').disabled = isLocked;

  window.showFormView();
};

// Delete Action
window.deleteRecord = function(id) {
  const list = getList();
  const index = list.findIndex(item => item.id === id);
  if (index === -1) return;

  const record = list[index];
  if (record.status === 'Approved') {
    alert("Approved leave logs cannot be deleted.");
    return;
  }

  if (confirm(`Are you sure you want to delete leave request ${id}?`)) {
    list.splice(index, 1);
    saveAppState();
    renderAll();
  }
};

// Render Metrics Header Cards
function renderMetrics() {
  const list = getList();
  const container = document.getElementById('hrm-leave-metrics');
  if (!container) return;

  const total = list.length;
  const pending = list.filter(item => item.status === 'Pending').length;
  const approved = list.filter(item => item.status === 'Approved').length;
  const totalDays = list.filter(item => item.status === 'Approved').reduce((s, c) => s + c.days, 0);

  container.innerHTML = `
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Requests</span>
      <span class="text-xl font-extrabold text-slate-950 block mt-2">${total} filings</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-orange-200 bg-orange-50/20 premium-shadow">
      <span class="text-[10px] font-bold text-orange-600 uppercase tracking-wider block">Pending Approvals</span>
      <span class="text-xl font-extrabold text-orange-700 block mt-2">${pending} requests</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Approved Logs</span>
      <span class="text-xl font-extrabold text-emerald-600 block mt-2">${approved} closed</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-blue-200 bg-blue-50/20 premium-shadow">
      <span class="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">Total Leave Days</span>
      <span class="text-xl font-extrabold text-blue-700 block mt-2">${totalDays} days</span>
    </div>
  `;
}

// Render data table rows
window.renderTable = function() {
  const tbody = document.getElementById('hrm-leave-body');
  if (!tbody) return;

  tbody.innerHTML = '';
  const search = (document.getElementById('hrm-leave-search-input')?.value || '').toLowerCase();
  const typeFilter = document.getElementById('filter-leave-type')?.value || 'all';
  const statusFilter = document.getElementById('filter-leave-status')?.value || 'all';

  const list = getList();

  const filtered = list.filter(item => {
    if (typeFilter !== 'all' && item.type !== typeFilter) return false;
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;

    if (search) {
      const employees = appState.employees || [];
      const emp = employees.find(e => e.id === item.employeeId);
      const empName = emp ? emp.name.toLowerCase() : '';

      const queryMatches = 
        item.employeeId.toLowerCase().includes(search) ||
        empName.includes(search);

      if (!queryMatches) return false;
    }

    return true;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" class="p-8 text-center text-slate-400 font-semibold">No leave logs found.</td></tr>`;
    return;
  }

  const employees = appState.employees || [];

  filtered.forEach(item => {
    const emp = employees.find(e => e.id === item.employeeId);
    const empName = emp ? emp.name : 'Unknown Employee';

    let badgeClass = "bg-slate-50 text-slate-700 border-slate-200";
    if (item.status === 'Approved') badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (item.status === 'Pending') badgeClass = "bg-amber-50 text-amber-700 border-amber-200";
    if (item.status === 'Rejected') badgeClass = "bg-rose-50 text-rose-700 border-rose-200";

    const isPending = item.status === 'Pending';

    tbody.innerHTML += `
      <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100">
        <td class="p-4 pl-6 font-bold text-slate-900">${escapeHtml(item.id)}</td>
        <td class="p-4 font-semibold text-slate-900">${escapeHtml(empName)}</td>
        <td class="p-4 font-semibold text-slate-700">${escapeHtml(item.type)}</td>
        <td class="p-4 text-center text-slate-500 font-medium">${escapeHtml(item.start)}</td>
        <td class="p-4 text-center text-slate-500 font-medium">${escapeHtml(item.end)}</td>
        <td class="p-4 text-center font-bold text-slate-900">${item.days} days</td>
        <td class="p-4 text-slate-500 font-medium">${escapeHtml(item.reason || 'N/A')}</td>
        <td class="p-4 text-center">
          <span class="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${badgeClass}">
            ${item.status}
          </span>
        </td>
        <td class="p-4">
          <div class="flex items-center justify-center gap-2">
            ${isPending ? `
              <button onclick="window.approveLeave('${item.id}')" title="Approve Request" class="p-1.5 hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700 rounded-lg border border-slate-100 hover:border-emerald-200 transition-colors cursor-pointer">
                <i data-lucide="check" class="w-3.5 h-3.5"></i>
              </button>
              <button onclick="window.rejectLeave('${item.id}')" title="Reject Request" class="p-1.5 hover:bg-rose-50 text-rose-600 hover:text-rose-700 rounded-lg border border-slate-100 hover:border-rose-200 transition-colors cursor-pointer">
                <i data-lucide="x" class="w-3.5 h-3.5"></i>
              </button>
            ` : ''}
            <button onclick="window.editRecord('${item.id}')" title="View/Edit" class="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-slate-800 rounded-lg border border-slate-100 transition-colors cursor-pointer">
              <i data-lucide="eye" class="w-3.5 h-3.5"></i>
            </button>
            ${!isPending ? '' : `
              <button onclick="window.deleteRecord('${item.id}')" title="Delete" class="p-1.5 hover:bg-rose-50 text-rose-600 hover:text-rose-700 rounded-lg border border-slate-100 hover:border-rose-200 transition-colors cursor-pointer">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
              </button>
            `}
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
  populateEmployees();
  renderAll();
});
