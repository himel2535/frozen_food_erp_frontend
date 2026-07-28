import { appReadyPromise, appState, saveAppState, initIcons } from '/js/shared.js';

const DEFAULT_MACHINES = [
  { id: "MAC-001", name: "Injection Molder A1", model: "HAITIAN MA2500", location: "Floor 1 - Area B", capacity: "250 Ton", status: "Running", installDate: "2020-01-15", lastService: "2026-05-10", runtime: 45000 },
  { id: "MAC-002", name: "Injection Molder B2", model: "HAITIAN MA1200", location: "Floor 1 - Area C", capacity: "120 Ton", status: "Idle", installDate: "2021-03-20", lastService: "2026-04-15", runtime: 32000 },
  { id: "MAC-003", name: "Assembly Conveyor 1", model: "Custom Belt", location: "Floor 2 - Assy", capacity: "50m/min", status: "Under Repair", installDate: "2019-11-05", lastService: "2026-01-20", runtime: 15000 }
];

function getMachines() {
  if (!appState.machines) {
    appState.machines = [...DEFAULT_MACHINES];
    saveAppState();
  }
  return appState.machines;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString('en-US');
}

function getNextMachineId() {
  const maxNumericId = getMachines().reduce((maxValue, item) => {
    const numericId = Number.parseInt(String(item.id || '').replace(/[^\d]/g, ''), 10);
    return Number.isFinite(numericId) ? Math.max(maxValue, numericId) : maxValue;
  }, 0);
  return `MAC-${String(maxNumericId + 1).padStart(3, '0')}`;
}

window.showMainView = function() {
  document.getElementById('machine-main-view').classList.remove('hidden');
  document.getElementById('machine-form-view').classList.add('hidden');
};

window.showFormView = function() {
  document.getElementById('machine-main-view').classList.add('hidden');
  document.getElementById('machine-form-view').classList.remove('hidden');
};

window.toggleAdvancedFields = function() {
  const section = document.getElementById('machine-advanced-section');
  const icon = document.getElementById('machine-advanced-icon');
  if (!section) return;

  const isHidden = section.classList.contains('hidden');
  section.classList.toggle('hidden', !isHidden);

  if (icon) {
    icon.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
  }
};

window.openMachineModal = function(machineId = '') {
  const form = document.getElementById('machine-form');
  if (!form) return;

  form.reset();
  document.getElementById('machine-edit-id').value = '';
  document.getElementById('machine-form-title').textContent = 'Create New Machine';

  if (machineId) {
    const machine = getMachines().find(m => m.id === machineId);
    if (machine) {
      document.getElementById('machine-edit-id').value = machine.id;
      document.getElementById('machine-form-title').textContent = 'Edit Machine';
      document.getElementById('machine-input-name').value = machine.name;
      document.getElementById('machine-input-model').value = machine.model || '';
      document.getElementById('machine-input-location').value = machine.location || '';
      document.getElementById('machine-input-capacity').value = machine.capacity || '';
      document.getElementById('machine-input-status').value = machine.status || 'Running';
      document.getElementById('machine-input-install-date').value = machine.installDate || '';
      document.getElementById('machine-input-last-service').value = machine.lastService || '';
    }
  }

  window.showFormView();
  initIcons();
};

window.handleSubmit = function(event) {
  event.preventDefault();

  const machines = getMachines();
  const editId = document.getElementById('machine-edit-id').value;
  
  const payload = {
    id: editId || getNextMachineId(),
    name: document.getElementById('machine-input-name').value.trim(),
    model: document.getElementById('machine-input-model').value.trim(),
    location: document.getElementById('machine-input-location').value.trim(),
    capacity: document.getElementById('machine-input-capacity').value.trim(),
    status: document.getElementById('machine-input-status').value,
    installDate: document.getElementById('machine-input-install-date').value,
    lastService: document.getElementById('machine-input-last-service').value,
  };

  if (!editId) {
    payload.runtime = 0;
  } else {
    const existing = machines.find(m => m.id === editId);
    payload.runtime = existing ? existing.runtime : 0;
  }

  const existingIndex = machines.findIndex(m => m.id === payload.id);
  if (existingIndex >= 0) {
    machines[existingIndex] = payload;
  } else {
    machines.push(payload);
  }

  saveAppState();
  window.showMainView();
  renderAll();
};

window.renderTable = function() {
  const tbody = document.getElementById('machine-table-body');
  if (!tbody) return;

  const searchValue = String(document.getElementById('machine-search-input')?.value || '').toLowerCase();
  const filterStatus = document.getElementById('machine-filter-status')?.value || 'all';
  
  const machines = getMachines().filter(machine => {
    const searchMatch = !searchValue || [machine.id, machine.name, machine.location, machine.model].join(' ').toLowerCase().includes(searchValue);
    const statusMatch = filterStatus === 'all' || machine.status === filterStatus;
    return searchMatch && statusMatch;
  });

  tbody.innerHTML = '';

  if (machines.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-8 text-center text-slate-400 font-semibold">No machines found.</td></tr>';
    return;
  }

  machines.forEach(machine => {
    let statusClass = 'bg-slate-200 text-slate-600';
    if (machine.status === 'Running') statusClass = 'bg-emerald-50 text-emerald-600';
    if (machine.status === 'Idle') statusClass = 'bg-blue-50 text-blue-600';
    if (machine.status === 'Under Repair') statusClass = 'bg-amber-50 text-amber-600';
    if (machine.status === 'Out of Service') statusClass = 'bg-rose-50 text-rose-600';

    tbody.innerHTML += `
      <tr class="hover:bg-slate-50/70 transition-colors">
        <td class="px-6 py-4 font-bold text-slate-900">${escapeHtml(machine.id)}</td>
        <td class="px-6 py-4">
          <div class="font-bold text-slate-900">${escapeHtml(machine.name)}</div>
          <div class="text-[10px] text-slate-400 font-semibold">${escapeHtml(machine.capacity || 'N/A')}</div>
        </td>
        <td class="px-6 py-4 text-center font-semibold text-slate-900">${escapeHtml(machine.model)}</td>
        <td class="px-6 py-4 text-center font-semibold text-slate-900">${escapeHtml(machine.location)}</td>
        <td class="px-6 py-4 text-center font-semibold text-slate-900">${formatNumber(machine.runtime)} hrs</td>
        <td class="px-6 py-4">
          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${statusClass}">
            ${escapeHtml(machine.status)}
          </span>
        </td>
        <td class="px-6 py-4 text-center">
          <button onclick="window.openMachineModal('${machine.id}')" class="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-bold text-slate-600 transition-colors cursor-pointer">Edit</button>
        </td>
      </tr>
    `;
  });
};

function renderMetrics() {
  const container = document.getElementById('machine-metrics');
  if (!container) return;

  const machines = getMachines();
  const total = machines.length;
  const running = machines.filter(m => m.status === 'Running').length;
  const repair = machines.filter(m => m.status === 'Under Repair').length;
  const out = machines.filter(m => m.status === 'Out of Service').length;

  container.innerHTML = `
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Machines</span>
      <span class="text-xl font-extrabold text-slate-950 block mt-2">${total}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-emerald-200 premium-shadow bg-emerald-50/20">
      <span class="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Running Now</span>
      <span class="text-xl font-extrabold text-emerald-700 block mt-2">${running}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-amber-200 premium-shadow bg-amber-50/20">
      <span class="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">Under Repair</span>
      <span class="text-xl font-extrabold text-amber-700 block mt-2">${repair}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-rose-200 premium-shadow bg-rose-50/20">
      <span class="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">Out of Service</span>
      <span class="text-xl font-extrabold text-rose-700 block mt-2">${out}</span>
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
