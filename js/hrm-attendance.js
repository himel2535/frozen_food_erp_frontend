import { appReadyPromise, appState, saveAppState, initIcons } from '/js/shared.js';

function escapeHtml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

let currentEditingId = null;

// Return attendance from appState
function getList() {
  if (!appState.attendance) {
    appState.attendance = [
      { date: "2026-06-16", employeeId: "EMP-001", checkIn: "08:45 AM", checkOut: "05:15 PM", status: "Present", workingHours: 8.5 },
      { date: "2026-06-16", employeeId: "EMP-002", checkIn: "09:15 AM", checkOut: "06:00 PM", status: "Late", workingHours: 8.75 },
      { date: "2026-06-16", employeeId: "EMP-003", checkIn: "08:30 AM", checkOut: "05:00 PM", status: "Present", workingHours: 8.5 },
      { date: "2026-06-16", employeeId: "EMP-004", checkIn: "--", checkOut: "--", status: "On Leave", workingHours: 0 },
      { date: "2026-06-16", employeeId: "EMP-005", checkIn: "--", checkOut: "--", status: "Absent", workingHours: 0 },
      { date: "2026-06-17", employeeId: "EMP-001", checkIn: "08:50 AM", checkOut: "", status: "Present", workingHours: 0 },
      { date: "2026-06-17", employeeId: "EMP-002", checkIn: "09:35 AM", checkOut: "", status: "Late", workingHours: 0 },
      { date: "2026-06-17", employeeId: "EMP-003", checkIn: "", checkOut: "", status: "Absent", workingHours: 0 },
      { date: "2026-06-17", employeeId: "EMP-004", checkIn: "--", checkOut: "--", status: "On Leave", workingHours: 0 }
    ];
    saveAppState();
  }
  return appState.attendance;
}

// Navigation helpers
window.showMainView = function() {
  document.getElementById('hrm-attendance-main-view').classList.remove('hidden');
  document.getElementById('hrm-attendance-form-view').classList.add('hidden');
  currentEditingId = null;
};

window.showFormView = function() {
  document.getElementById('hrm-attendance-main-view').classList.add('hidden');
  document.getElementById('hrm-attendance-form-view').classList.remove('hidden');
};

// Open form modal
window.openFaceScanModal = function() {
  const modal = document.getElementById('face-scan-modal');
  if (modal) {
    modal.classList.remove('hidden');
    setTimeout(() => {
      document.getElementById('face-scan-status').textContent = "Identity verified: Safiul Alom";
      document.getElementById('face-scan-status').classList.remove('text-indigo-600', 'animate-pulse');
      document.getElementById('face-scan-status').classList.add('text-emerald-600');
      setTimeout(() => {
        window.closeFaceScanModal();
        alert('Check-in logged successfully.');
      }, 1500);
    }, 2500);
  }
};

window.closeFaceScanModal = function() {
  const modal = document.getElementById('face-scan-modal');
  if (modal) {
    modal.classList.add('hidden');
    // reset state
    const status = document.getElementById('face-scan-status');
    status.textContent = "Scanning...";
    status.className = "text-sm font-bold text-indigo-600 animate-pulse";
  }
};

// Open form modal
window.openAttendanceModal = function() {
  currentEditingId = null;
  const form = document.getElementById('hrm-attendance-form');
  if (form) form.reset();

  document.getElementById('att-form-title').innerText = "Add Attendance Record";
  
  // Set default date
  document.getElementById('input-att-date').value = new Date().toISOString().split('T')[0];

  // Collapse advanced details
  const advancedSection = document.getElementById('att-advanced-section');
  if (advancedSection) advancedSection.classList.add('hidden');
  const advancedIcon = document.getElementById('att-advanced-icon');
  if (advancedIcon) advancedIcon.style.transform = 'rotate(0deg)';

  window.showFormView();
};

window.toggleAdvancedFields = function() {
  const section = document.getElementById('att-advanced-section');
  const icon = document.getElementById('att-advanced-icon');
  if (section.classList.contains('hidden')) {
    section.classList.remove('hidden');
    icon.style.transform = 'rotate(180deg)';
  } else {
    section.classList.add('hidden');
    icon.style.transform = 'rotate(0deg)';
  }
};

// Populate employees select
function populateEmployees() {
  const empSelect = document.getElementById('input-att-emp');
  if (!empSelect) return;

  const employees = appState.employees || [];
  empSelect.innerHTML = '<option value="">Select Employee *</option>';
  employees.forEach(emp => {
    empSelect.innerHTML += `<option value="${escapeHtml(emp.id)}">${escapeHtml(emp.name)} (${escapeHtml(emp.id)})</option>`;
  });
}

// Helper to parse time string like "08:45 AM" into hours
function timeStringToHours(timeStr) {
  if (!timeStr || timeStr === '--' || !timeStr.includes(':')) return 0;
  const parts = timeStr.trim().split(' ');
  const hm = parts[0].split(':');
  let h = parseInt(hm[0]) || 0;
  const m = parseInt(hm[1]) || 0;
  const isPm = parts[1]?.toUpperCase() === 'PM';
  if (isPm && h < 12) h += 12;
  if (!isPm && h === 12) h = 0;
  return h + (m / 60);
}

// Form submit
window.handleSubmit = function(event) {
  event.preventDefault();
  const list = getList();

  const employeeId = document.getElementById('input-att-emp').value;
  const date = document.getElementById('input-att-date').value;
  const status = document.getElementById('input-att-status').value;
  
  // Advanced details
  const checkIn = document.getElementById('input-att-checkin').value || '--';
  const checkOut = document.getElementById('input-att-checkout').value || '--';
  const notes = document.getElementById('input-att-notes').value;

  // Calculate working hours
  let workingHours = 0;
  if (checkIn !== '--' && checkOut !== '--') {
    const inH = timeStringToHours(checkIn);
    const outH = timeStringToHours(checkOut);
    if (outH > inH) {
      workingHours = parseFloat((outH - inH).toFixed(2));
    }
  }

  if (currentEditingId) {
    const record = list.find(item => `${item.employeeId}_${item.date}` === currentEditingId);
    if (record) {
      record.employeeId = employeeId;
      record.date = date;
      record.status = status;
      record.checkIn = checkIn;
      record.checkOut = checkOut;
      record.workingHours = workingHours;
      record.notes = notes;
    }
  } else {
    // Check if record already exists for this employee and date
    const exists = list.find(item => item.employeeId === employeeId && item.date === date);
    if (exists) {
      alert(`Attendance record already exists for employee ${employeeId} on ${date}. Please edit that record instead.`);
      return;
    }

    const newRecord = {
      employeeId,
      date,
      status,
      checkIn,
      checkOut,
      workingHours,
      notes
    };
    list.push(newRecord);
  }

  saveAppState();
  window.showMainView();
  renderAll();
};

// Edit action
window.editRecord = function(employeeId, date) {
  const list = getList();
  const record = list.find(item => item.employeeId === employeeId && item.date === date);
  if (!record) return;

  currentEditingId = `${employeeId}_${date}`;
  document.getElementById('att-form-title').innerText = `Edit Attendance Details: ${employeeId}`;

  document.getElementById('input-att-emp').value = record.employeeId;
  document.getElementById('input-att-date').value = record.date;
  document.getElementById('input-att-status').value = record.status;
  
  // Advanced fields
  document.getElementById('input-att-checkin').value = record.checkIn !== '--' ? record.checkIn : '';
  document.getElementById('input-att-checkout').value = record.checkOut !== '--' ? record.checkOut : '';
  document.getElementById('input-att-notes').value = record.notes || '';

  window.showFormView();
};

// Delete Action
window.deleteRecord = function(employeeId, date) {
  const list = getList();
  const index = list.findIndex(item => item.employeeId === employeeId && item.date === date);
  if (index === -1) return;

  if (confirm(`Are you sure you want to delete attendance log for employee ${employeeId} on ${date}?`)) {
    list.splice(index, 1);
    saveAppState();
    renderAll();
  }
};

// Render Metrics Header Cards
function renderMetrics() {
  const list = getList();
  const container = document.getElementById('hrm-attendance-metrics');
  if (!container) return;

  const totalLogs = list.length;
  const presentCount = list.filter(item => item.status === 'Present').length;
  const lateCount = list.filter(item => item.status === 'Late').length;
  const absentCount = list.filter(item => item.status === 'Absent').length;

  container.innerHTML = `
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Logs Checked</span>
      <span class="text-xl font-extrabold text-slate-950 block mt-2">${totalLogs} records</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">On Time (Present)</span>
      <span class="text-xl font-extrabold text-emerald-600 block mt-2">${presentCount} checks</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-orange-200 bg-orange-50/20 premium-shadow">
      <span class="text-[10px] font-bold text-orange-600 uppercase tracking-wider block">Late Clock Ins</span>
      <span class="text-xl font-extrabold text-orange-700 block mt-2">${lateCount} lates</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-rose-200 bg-rose-50/20 premium-shadow">
      <span class="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">Absent Logs</span>
      <span class="text-xl font-extrabold text-rose-700 block mt-2">${absentCount} absents</span>
    </div>
  `;
}

// Render data table rows
window.renderTable = function() {
  const tbody = document.getElementById('hrm-attendance-body');
  if (!tbody) return;

  tbody.innerHTML = '';
  const search = (document.getElementById('hrm-attendance-search-input')?.value || '').toLowerCase();
  const statusFilter = document.getElementById('filter-att-status')?.value || 'all';
  const dateFilter = document.getElementById('filter-att-date')?.value || '';

  const list = getList();

  const filtered = list.filter(item => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (dateFilter && item.date !== dateFilter) return false;

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
    tbody.innerHTML = `<tr><td colspan="8" class="p-8 text-center text-slate-400 font-semibold">No attendance records found.</td></tr>`;
    return;
  }

  const employees = appState.employees || [];

  filtered.forEach(item => {
    const emp = employees.find(e => e.id === item.employeeId);
    const empName = emp ? emp.name : 'Unknown Employee';

    let badgeClass = "bg-slate-50 text-slate-700 border-slate-200";
    if (item.status === 'Present') badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (item.status === 'Late') badgeClass = "bg-amber-50 text-amber-700 border-amber-200";
    if (item.status === 'Absent') badgeClass = "bg-rose-50 text-rose-700 border-rose-200";
    if (item.status === 'On Leave') badgeClass = "bg-blue-50 text-blue-700 border-blue-200";

    tbody.innerHTML += `
      <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100">
        <td class="p-4 pl-6 font-bold text-slate-900">${escapeHtml(item.employeeId)}</td>
        <td class="p-4 font-semibold text-slate-900">${escapeHtml(empName)}</td>
        <td class="p-4 text-center text-slate-500 font-bold">${escapeHtml(item.checkIn)}</td>
        <td class="p-4 text-center text-slate-500 font-bold">${escapeHtml(item.checkOut)}</td>
        <td class="p-4 text-center font-bold text-slate-900">${item.workingHours || 0} hrs</td>
        <td class="p-4 text-slate-500 font-medium">${escapeHtml(item.date)}</td>
        <td class="p-4 text-center">
          <span class="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${badgeClass}">
            ${item.status}
          </span>
        </td>
        <td class="p-4">
          <div class="flex items-center justify-center gap-2">
            <button onclick="window.editRecord('${item.employeeId}', '${item.date}')" title="Edit Log" class="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-slate-800 rounded-lg border border-slate-100 transition-colors cursor-pointer">
              <i data-lucide="eye" class="w-3.5 h-3.5"></i>
            </button>
            <button onclick="window.deleteRecord('${item.employeeId}', '${item.date}')" title="Delete" class="p-1.5 hover:bg-rose-50 text-rose-600 hover:text-rose-700 rounded-lg border border-slate-100 hover:border-rose-200 transition-colors cursor-pointer">
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
  populateEmployees();
  renderAll();
});
