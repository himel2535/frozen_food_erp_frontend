import { appReadyPromise, appState, saveAppState, initIcons } from '/js/shared.js';

const FOLDERS = [
  { key: 'all', label: 'All' },
  { key: 'Open', label: 'Open' },
  { key: 'In Progress', label: 'In Progress' },
  { key: 'Resolved', label: 'Resolved' },
  { key: 'Closed', label: 'Closed' },
  { key: 'high', label: 'High priority' }
];

const SEED_COMPLAINTS = [
  {
    id: 'CMP-001',
    customerId: '',
    customerName: 'Bell Labs',
    date: '2026-07-12',
    subject: 'Missing parts in shipment',
    description: 'Carton arrived short — 2 ABS pellet bags missing from PO-4412. Need replacement ASAP.',
    priority: 'High',
    status: 'Open',
    resolution: ''
  },
  {
    id: 'CMP-002',
    customerId: '',
    customerName: 'Radium Co',
    date: '2026-07-14',
    subject: 'Damaged packaging on arrival',
    description: 'Outer cartons crushed in transit. Product intact but retail packaging unsellable.',
    priority: 'Medium',
    status: 'Open',
    resolution: ''
  },
  {
    id: 'CMP-003',
    customerId: '',
    customerName: 'General Electric',
    date: '2026-07-10',
    subject: 'Wrong SKU delivered',
    description: 'Ordered SKU-PLST-01 but received dye colorant cases. Please arrange swap.',
    priority: 'High',
    status: 'In Progress',
    resolution: 'Warehouse verifying pick list; pickup scheduled for Jul 21.'
  },
  {
    id: 'CMP-004',
    customerId: '',
    customerName: 'Wardenclyffe',
    date: '2026-07-08',
    subject: 'Late delivery — festival order',
    description: 'Promised Jul 5 delivery missed. Customer needed stock for weekend fair.',
    priority: 'Medium',
    status: 'In Progress',
    resolution: 'Expedited truck assigned; ETA Jul 20 evening.'
  },
  {
    id: 'CMP-005',
    customerId: '',
    customerName: 'Bell Labs',
    date: '2026-06-28',
    subject: 'Color mismatch on finished toys',
    description: 'Red batch appears orange under store lights. Photos attached in email thread.',
    priority: 'Low',
    status: 'Resolved',
    resolution: 'Issued credit note and replacement lot with corrected dye ratio.'
  },
  {
    id: 'CMP-006',
    customerId: '',
    customerName: 'Radium Co',
    date: '2026-06-15',
    subject: 'Invoice quantity dispute',
    description: 'Invoice shows 120 units; GRN confirms 100 received. Need correction.',
    priority: 'Low',
    status: 'Closed',
    resolution: 'Revised invoice issued; credit applied to next statement.'
  }
];

let activeFolder = 'all';
let selectedComplaintId = null;

function escapeHtml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function getCustomers() {
  if (Array.isArray(appState.crmCustomers) && appState.crmCustomers.length) {
    return appState.crmCustomers;
  }
  return [];
}

function getCustomerById(id) {
  if (!id && id !== 0) return null;
  return getCustomers().find((c) => String(c.id) === String(id)) || null;
}

function customerDisplay(complaint) {
  const customer = getCustomerById(complaint.customerId);
  if (customer) return customer.name || customer.company || 'Unknown';
  return complaint.customerName || 'Unknown';
}

const COMPLAINTS_SEED_VERSION = 1;

function ensureSeedComplaints() {
  const needsSeed = !Array.isArray(appState.complaints)
    || appState.complaints.length === 0
    || Number(appState.complaintsSeedVersion || 0) < COMPLAINTS_SEED_VERSION;

  if (!needsSeed) return;

  const customers = getCustomers();
  const byCompany = Object.fromEntries(
    customers.map((c) => [String(c.company || c.name || '').toLowerCase(), c])
  );
  appState.complaints = SEED_COMPLAINTS.map((seed) => {
    const match = byCompany[String(seed.customerName || '').toLowerCase()];
    return {
      ...seed,
      customerId: match ? String(match.id) : seed.customerId || ''
    };
  });
  appState.complaintsSeedVersion = COMPLAINTS_SEED_VERSION;
  saveAppState();
}

function getComplaints() {
  ensureSeedComplaints();
  return appState.complaints;
}

function getNextComplaintId() {
  const maxNumericId = getComplaints().reduce((maxValue, item) => {
    const numericId = Number.parseInt(String(item.id || '').replace(/[^\d]/g, ''), 10);
    return Number.isFinite(numericId) ? Math.max(maxValue, numericId) : maxValue;
  }, 0);
  return `CMP-${String(maxNumericId + 1).padStart(3, '0')}`;
}

function folderCounts() {
  const all = getComplaints();
  return {
    all: all.length,
    Open: all.filter((c) => c.status === 'Open').length,
    'In Progress': all.filter((c) => c.status === 'In Progress').length,
    Resolved: all.filter((c) => c.status === 'Resolved').length,
    Closed: all.filter((c) => c.status === 'Closed').length,
    high: all.filter((c) => c.priority === 'High').length
  };
}

function getFilteredComplaints() {
  const searchValue = String(document.getElementById('complaints-search-input')?.value || '').toLowerCase().trim();
  return getComplaints().filter((c) => {
    const name = customerDisplay(c);
    const searchString = [c.id, c.subject, name, c.customerName].join(' ').toLowerCase();
    const searchMatch = !searchValue || searchString.includes(searchValue);

    let folderMatch = true;
    if (activeFolder === 'high') folderMatch = c.priority === 'High';
    else if (activeFolder !== 'all') folderMatch = c.status === activeFolder;

    return searchMatch && folderMatch;
  }).sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
}

function statusPillClass(status) {
  if (status === 'Open') return 'bg-rose-50 text-rose-700 border-rose-100';
  if (status === 'In Progress') return 'bg-amber-50 text-amber-700 border-amber-100';
  if (status === 'Resolved') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  if (status === 'Closed') return 'bg-slate-100 text-slate-600 border-slate-200';
  return 'bg-slate-50 text-slate-600 border-slate-200';
}

function priorityFlagClass(priority) {
  if (priority === 'High') return 'text-rose-600';
  if (priority === 'Medium') return 'text-amber-600';
  return 'text-blue-600';
}

function formatDateShort(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function cmdBtnActive(enabled) {
  return enabled
    ? 'inline-flex items-center gap-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl cursor-pointer'
    : 'inline-flex items-center gap-1.5 border border-slate-200 bg-slate-100 text-slate-400 text-xs font-semibold px-3 py-2 rounded-xl cursor-not-allowed';
}

function updateCommandBar() {
  const selected = selectedComplaintId ? getComplaints().find((c) => c.id === selectedComplaintId) : null;
  const canAct = !!selected;
  const canProgress = canAct && selected.status === 'Open';
  const canResolve = canAct && (selected.status === 'Open' || selected.status === 'In Progress');

  const progressBtn = document.getElementById('complaints-cmd-progress');
  const resolveBtn = document.getElementById('complaints-cmd-resolve');
  const editBtn = document.getElementById('complaints-cmd-edit');

  if (progressBtn) {
    progressBtn.disabled = !canProgress;
    progressBtn.className = cmdBtnActive(canProgress);
  }
  if (resolveBtn) {
    resolveBtn.disabled = !canResolve;
    resolveBtn.className = cmdBtnActive(canResolve);
  }
  if (editBtn) {
    editBtn.disabled = !canAct;
    editBtn.className = cmdBtnActive(canAct);
  }
}

function renderFolderPane() {
  const counts = folderCounts();
  const list = document.getElementById('complaints-folder-list');
  const chips = document.getElementById('complaints-folder-chips');

  const folderHtml = (folder, compact = false) => {
    const active = activeFolder === folder.key;
    const count = counts[folder.key] ?? 0;
    const base = compact
      ? `px-2.5 py-1 rounded-full text-[10px] font-bold border cursor-pointer ${active ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`
      : `flex items-center justify-between gap-2 w-full text-left px-2.5 py-2 rounded-lg text-xs font-semibold cursor-pointer ${active ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-white'}`;
    return `<button type="button" onclick="window.setComplaintFolder('${folder.key}')" class="${base}">
      <span>${escapeHtml(folder.label)}</span>
      <span class="${compact ? '' : 'text-[10px] font-bold text-slate-400'}">${count}</span>
    </button>`;
  };

  if (list) list.innerHTML = FOLDERS.map((f) => folderHtml(f, false)).join('');
  if (chips) chips.innerHTML = FOLDERS.map((f) => folderHtml(f, true)).join('');
}

function renderComplaintList() {
  const body = document.getElementById('complaints-list-body');
  const countEl = document.getElementById('complaints-list-count');
  if (!body) return;

  const items = getFilteredComplaints();
  if (countEl) countEl.textContent = `${items.length} item${items.length === 1 ? '' : 's'}`;

  if (!items.length) {
    body.innerHTML = `
      <div class="px-4 py-12 text-center">
        <p class="text-sm font-bold text-slate-500">No complaints in this folder</p>
        <p class="text-xs text-slate-400 font-medium mt-1 mb-4">Try another folder or create a new complaint.</p>
        <button type="button" onclick="window.openComplaintModal()" class="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl cursor-pointer">New</button>
      </div>
    `;
    return;
  }

  if (selectedComplaintId && !items.some((c) => c.id === selectedComplaintId)) {
    selectedComplaintId = items[0]?.id || null;
  }
  if (!selectedComplaintId && items[0]) selectedComplaintId = items[0].id;

  body.innerHTML = items.map((c) => {
    const selected = c.id === selectedComplaintId;
    const isOpen = c.status === 'Open';
    return `
      <button type="button" onclick="window.selectComplaint('${escapeHtml(c.id)}')"
        class="w-full text-left px-3 py-3 border-b border-slate-100 transition-colors cursor-pointer ${selected ? 'bg-blue-50 border-l-2 border-l-blue-600' : 'hover:bg-slate-50 border-l-2 border-l-transparent'}">
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-1.5">
              ${isOpen ? '<span class="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0"></span>' : ''}
              <span class="text-xs font-bold text-slate-900 truncate ${isOpen ? '' : 'font-semibold'}">${escapeHtml(c.subject)}</span>
            </div>
            <div class="text-[10px] text-slate-500 font-semibold mt-0.5 truncate">${escapeHtml(customerDisplay(c))} · ${escapeHtml(c.id)}</div>
          </div>
          <div class="shrink-0 text-right">
            <div class="text-[10px] font-semibold text-slate-400">${escapeHtml(formatDateShort(c.date))}</div>
            <div class="text-[9px] font-bold mt-0.5 ${priorityFlagClass(c.priority)}">${escapeHtml(c.priority)}</div>
          </div>
        </div>
      </button>
    `;
  }).join('');
}

function readingPaneHtml(complaint) {
  if (!complaint) return '';
  const name = customerDisplay(complaint);
  return `
    <div class="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
      <div class="min-w-0">
        <h3 class="text-base font-extrabold text-slate-900">${escapeHtml(complaint.subject)}</h3>
        <div class="flex flex-wrap items-center gap-2 mt-2 text-[11px] font-semibold text-slate-500">
          <span>${escapeHtml(name)}</span>
          <span>·</span>
          <span>${escapeHtml(complaint.date || '—')}</span>
          <span>·</span>
          <span>${escapeHtml(complaint.id)}</span>
        </div>
        <div class="flex flex-wrap gap-1.5 mt-2">
          <span class="inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold border ${statusPillClass(complaint.status)}">${escapeHtml(complaint.status)}</span>
          <span class="inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold border border-slate-200 bg-white ${priorityFlagClass(complaint.priority)}">${escapeHtml(complaint.priority)} priority</span>
        </div>
      </div>
      <div class="flex flex-wrap gap-2">
        ${complaint.status === 'Open' ? '<button type="button" onclick="window.markSelectedInProgress()" class="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl cursor-pointer">Mark in progress</button>' : ''}
        ${(complaint.status === 'Open' || complaint.status === 'In Progress') ? '<button type="button" onclick="window.resolveSelectedComplaint()" class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-2 rounded-xl cursor-pointer">Resolve</button>' : ''}
        <button type="button" onclick="window.editSelectedComplaint()" class="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-2 rounded-xl cursor-pointer">Edit</button>
      </div>
    </div>
    <div>
      <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Description</div>
      <p class="text-xs font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">${escapeHtml(complaint.description || '—')}</p>
    </div>
    <div class="bg-slate-50 border border-slate-100 rounded-xl p-4">
      <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Resolution</div>
      <p class="text-xs font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">${escapeHtml(complaint.resolution || 'No resolution notes yet.')}</p>
    </div>
  `;
}

function renderReadingPane() {
  const empty = document.getElementById('complaints-reading-empty');
  const content = document.getElementById('complaints-reading-content');
  const mobile = document.getElementById('complaints-reading-mobile');
  const mobileBody = document.getElementById('complaints-reading-mobile-body');
  const complaint = selectedComplaintId ? getComplaints().find((c) => c.id === selectedComplaintId) : null;

  if (!complaint) {
    empty?.classList.remove('hidden');
    content?.classList.add('hidden');
    if (content) content.innerHTML = '';
    mobile?.classList.add('hidden');
    return;
  }

  const html = readingPaneHtml(complaint);
  empty?.classList.add('hidden');
  content?.classList.remove('hidden');
  if (content) content.innerHTML = html;
  if (mobileBody) mobileBody.innerHTML = html;
}

window.renderComplaints = function renderComplaints() {
  renderFolderPane();
  renderComplaintList();
  renderReadingPane();
  updateCommandBar();
  initIcons();
};

window.setComplaintFolder = function setComplaintFolder(key) {
  activeFolder = key;
  selectedComplaintId = null;
  window.renderComplaints();
};

window.selectComplaint = function selectComplaint(id) {
  selectedComplaintId = id;
  window.renderComplaints();
  if (window.matchMedia('(max-width: 1023px)').matches) {
    document.getElementById('complaints-reading-mobile')?.classList.remove('hidden');
  }
};

window.closeMobileReading = function closeMobileReading() {
  document.getElementById('complaints-reading-mobile')?.classList.add('hidden');
};

window.showMainView = function showMainView() {
  document.getElementById('complaints-main-view')?.classList.remove('hidden');
  document.getElementById('complaints-form-view')?.classList.add('hidden');
  window.renderComplaints();
};

window.showFormView = function showFormView() {
  document.getElementById('complaints-main-view')?.classList.add('hidden');
  document.getElementById('complaints-form-view')?.classList.remove('hidden');
  document.getElementById('complaints-reading-mobile')?.classList.add('hidden');
};

window.toggleAdvancedComplaintFields = function toggleAdvancedComplaintFields() {
  const section = document.getElementById('complaints-advanced-section');
  const icon = document.getElementById('complaints-advanced-icon');
  if (!section) return;
  section.classList.toggle('hidden');
  if (icon) icon.style.transform = section.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
};

function populateDropdowns() {
  const select = document.getElementById('complaints-input-customer');
  if (!select) return;
  const customers = getCustomers();
  select.innerHTML = '<option value="">Select customer...</option>' + customers.map((c) => {
    return `<option value="${escapeHtml(String(c.id))}">${escapeHtml(c.name || c.company)} (${escapeHtml(String(c.id))})</option>`;
  }).join('');
}

window.openComplaintModal = function openComplaintModal(complaintId = '') {
  const form = document.getElementById('complaints-form');
  if (!form) return;

  form.reset();
  document.getElementById('complaints-edit-id').value = '';
  document.getElementById('complaints-form-title').textContent = 'Log complaint';
  document.getElementById('complaints-input-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('complaints-advanced-section')?.classList.add('hidden');
  const icon = document.getElementById('complaints-advanced-icon');
  if (icon) icon.style.transform = 'rotate(0deg)';

  populateDropdowns();

  if (complaintId) {
    const complaint = getComplaints().find((c) => c.id === complaintId);
    if (complaint) {
      document.getElementById('complaints-edit-id').value = complaint.id;
      document.getElementById('complaints-form-title').textContent = 'Edit complaint';
      document.getElementById('complaints-input-customer').value = complaint.customerId || '';
      document.getElementById('complaints-input-date').value = complaint.date || '';
      document.getElementById('complaints-input-subject').value = complaint.subject || '';
      document.getElementById('complaints-input-desc').value = complaint.description || '';
      document.getElementById('complaints-input-priority').value = complaint.priority || 'Medium';
      document.getElementById('complaints-input-status').value = complaint.status || 'Open';
      document.getElementById('complaints-input-resolution').value = complaint.resolution || '';
      if (complaint.resolution) {
        document.getElementById('complaints-advanced-section')?.classList.remove('hidden');
        if (icon) icon.style.transform = 'rotate(180deg)';
      }
    }
  }

  window.showFormView();
  initIcons();
};

window.editSelectedComplaint = function editSelectedComplaint() {
  if (!selectedComplaintId) return;
  window.openComplaintModal(selectedComplaintId);
};

function updateSelectedStatus(status, resolutionNote) {
  if (!selectedComplaintId) return;
  const complaints = getComplaints();
  const index = complaints.findIndex((c) => c.id === selectedComplaintId);
  if (index < 0) return;
  complaints[index] = {
    ...complaints[index],
    status,
    resolution: resolutionNote !== undefined
      ? resolutionNote
      : complaints[index].resolution
  };
  saveAppState();
  window.renderComplaints();
}

window.markSelectedInProgress = function markSelectedInProgress() {
  const complaint = getComplaints().find((c) => c.id === selectedComplaintId);
  if (!complaint || complaint.status !== 'Open') return;
  updateSelectedStatus('In Progress');
};

window.resolveSelectedComplaint = function resolveSelectedComplaint() {
  const complaint = getComplaints().find((c) => c.id === selectedComplaintId);
  if (!complaint || (complaint.status !== 'Open' && complaint.status !== 'In Progress')) return;
  const note = complaint.resolution?.trim()
    ? complaint.resolution
    : `Resolved on ${new Date().toISOString().slice(0, 10)}.`;
  updateSelectedStatus('Resolved', note);
};

window.handleSubmit = function handleSubmit(event) {
  event.preventDefault();

  const complaints = getComplaints();
  const editId = document.getElementById('complaints-edit-id').value;
  const customerId = document.getElementById('complaints-input-customer').value;
  const customer = getCustomerById(customerId);

  const payload = {
    id: editId || getNextComplaintId(),
    customerId,
    customerName: customer?.name || customer?.company || '',
    date: document.getElementById('complaints-input-date').value,
    subject: document.getElementById('complaints-input-subject').value.trim(),
    description: document.getElementById('complaints-input-desc').value.trim(),
    priority: document.getElementById('complaints-input-priority').value,
    status: document.getElementById('complaints-input-status').value,
    resolution: document.getElementById('complaints-input-resolution').value.trim()
  };

  const existingIndex = complaints.findIndex((c) => c.id === payload.id);
  if (existingIndex >= 0) complaints[existingIndex] = payload;
  else complaints.push(payload);

  selectedComplaintId = payload.id;
  saveAppState();
  window.showMainView();
};

// Back-compat alias if anything still calls renderTable
window.renderTable = window.renderComplaints;

document.addEventListener('DOMContentLoaded', async () => {
  await appReadyPromise;
  ensureSeedComplaints();
  window.renderComplaints();
});
