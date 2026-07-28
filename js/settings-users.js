import { appReadyPromise, appState, saveAppState, initIcons } from '/js/shared.js';

function escapeHtml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function getList() {
  if (!appState.users) {
    appState.users = [
      { name: "John Doe", email: "john.doe@hookerp.com", role: "Admin", status: "active", lastLogin: "Jun 17, 2026 · 09:14 AM", phone: "+1 (555) 019-9234", jobTitle: "Chief Executive Officer", department: "Executive", bio: "Co-founder & CEO." },
      { name: "Sarah Connor", email: "sarah.c@hookerp.com", role: "Admin", status: "active", lastLogin: "Jun 17, 2026 · 08:52 AM", phone: "+1 (555) 018-8743", jobTitle: "Chief Security Officer", department: "Security", bio: "Guarding systems." },
      { name: "Ellen Ripley", email: "ripley@hookerp.com", role: "Manager", status: "active", lastLogin: "Jun 16, 2026 · 05:30 PM", phone: "+1 (555) 017-7654", jobTitle: "Warrant Officer", department: "Operations", bio: "Experienced dispatcher." },
      { name: "Arthur Dent", email: "dent@hookerp.com", role: "Staff", status: "on-leave", lastLogin: "Jun 10, 2026 · 03:12 PM", phone: "+1 (555) 012-3456", jobTitle: "Hitchhiker Specialist", department: "Logistics", bio: "Always carries a towel." }
    ];
    saveAppState();
  }
  return appState.users;
}

window.showMainView = function() {
  document.getElementById('settings-users-main-view').classList.remove('hidden');
  document.getElementById('settings-users-form-view').classList.add('hidden');
};

window.showFormView = function() {
  document.getElementById('settings-users-main-view').classList.add('hidden');
  document.getElementById('settings-users-form-view').classList.remove('hidden');
};

window.openUserForm = function(index = null) {
  const form = document.getElementById('settings-users-form');
  if (form) form.reset();

  const titleEl = document.getElementById('user-form-title');
  const indexInput = document.getElementById('input-user-index');
  
  // Collapse advanced section by default
  const advancedSec = document.getElementById('settings-users-advanced-section');
  const advancedIcon = document.getElementById('settings-users-advanced-icon');
  if (advancedSec) advancedSec.classList.add('hidden');
  if (advancedIcon) {
    advancedIcon.style.transform = 'rotate(0deg)';
    advancedIcon.setAttribute('data-lucide', 'chevron-down');
  }

  if (index !== null) {
    if (titleEl) titleEl.textContent = "Edit User";
    const user = getList()[index];
    if (indexInput) indexInput.value = index;
    
    document.getElementById('input-name').value = user.name || '';
    document.getElementById('input-email').value = user.email || '';
    document.getElementById('input-role').value = user.role || 'Staff';
    document.getElementById('input-status').value = user.status || 'active';
    document.getElementById('input-phone').value = user.phone || '';
    document.getElementById('input-job-title').value = user.jobTitle || '';
    document.getElementById('input-department').value = user.department || '';
    document.getElementById('input-bio').value = user.bio || '';
  } else {
    if (titleEl) titleEl.textContent = "Create User";
    if (indexInput) indexInput.value = '';
  }
  
  window.showFormView();
  initIcons();
};

window.toggleAdvancedFields = function() {
  const sec = document.getElementById('settings-users-advanced-section');
  const icon = document.getElementById('settings-users-advanced-icon');
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

window.handleUserSubmit = function(event) {
  event.preventDefault();
  const list = getList();
  const index = document.getElementById('input-user-index').value;

  const userRecord = {
    name: document.getElementById('input-name').value,
    email: document.getElementById('input-email').value,
    role: document.getElementById('input-role').value,
    status: document.getElementById('input-status').value,
    phone: document.getElementById('input-phone').value,
    jobTitle: document.getElementById('input-job-title').value,
    department: document.getElementById('input-department').value,
    bio: document.getElementById('input-bio').value,
    lastLogin: index !== '' ? list[index].lastLogin : 'Never'
  };

  if (index !== '') {
    list[index] = userRecord;
  } else {
    list.push(userRecord);
  }

  saveAppState();
  window.showMainView();
  renderAll();
};

window.deleteUser = function(index) {
  if (confirm(`Are you sure you want to delete user ${getList()[index].name}?`)) {
    getList().splice(index, 1);
    saveAppState();
    renderAll();
  }
};

window.renderUsers = function() {
  const tbody = document.getElementById('settings-users-tbody');
  if (!tbody) return;

  tbody.innerHTML = '';
  const search = document.getElementById('settings-users-search')?.value.toLowerCase() || '';
  const list = getList();

  const filtered = list.map((user, index) => ({ ...user, originalIndex: index })).filter(user => {
    return !search || 
      user.name.toLowerCase().includes(search) || 
      user.email.toLowerCase().includes(search) ||
      user.role.toLowerCase().includes(search) ||
      user.status.toLowerCase().includes(search);
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-slate-450">No users found matching search criteria.</td></tr>`;
    return;
  }

  filtered.forEach(user => {
    let statusClass = "bg-slate-100 text-slate-600";
    if (user.status === 'active') statusClass = "bg-emerald-50 text-emerald-600";
    if (user.status === 'on-leave') statusClass = "bg-amber-50 text-amber-600";
    if (user.status === 'inactive') statusClass = "bg-slate-100 text-slate-400";
    if (user.status === 'pending') statusClass = "bg-blue-50 text-blue-600";

    const roleClass = user.role === 'Admin' ? 'bg-purple-50 text-purple-600' : user.role === 'Manager' ? 'bg-blue-50 text-blue-600' : user.role === 'Staff' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-150 text-slate-500';

    const avatarInitials = user.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U';

    tbody.innerHTML += `
      <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100">
        <td class="p-4">
          <div class="flex items-center gap-3">
            <div class="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
              ${escapeHtml(avatarInitials)}
            </div>
            <div>
              <span class="font-bold text-slate-900 block">${escapeHtml(user.name)}</span>
              <span class="text-[10px] text-slate-400 block">${escapeHtml(user.jobTitle || 'No Title')}</span>
            </div>
          </div>
        </td>
        <td class="p-4">${escapeHtml(user.email || '—')}</td>
        <td class="p-4"><span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${roleClass}">${escapeHtml(user.role)}</span></td>
        <td class="p-4"><span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${statusClass}">${escapeHtml(user.status)}</span></td>
        <td class="p-4 text-slate-400 font-medium">${escapeHtml(user.lastLogin)}</td>
        <td class="p-4 text-right">
          <div class="flex items-center justify-end gap-2">
            <button onclick="window.openUserForm(${user.originalIndex})" class="p-1.5 text-slate-450 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer" title="Edit User">
              <i data-lucide="eye" class="w-3.5 h-3.5"></i>
            </button>
            <button onclick="window.deleteUser(${user.originalIndex})" class="p-1.5 text-slate-450 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer" title="Delete User">
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
  const metricsContainer = document.getElementById('settings-users-metrics');
  if (!metricsContainer) return;

  const totalUsers = list.length;
  const activeUsers = list.filter(u => u.status === 'active').length;
  const pendingUsers = list.filter(u => u.status === 'pending').length;
  
  // Calculate distinct roles dynamically
  const distinctRoles = new Set(list.map(u => u.role)).size;

  metricsContainer.innerHTML = `
    <div class="premium-card p-5 premium-shadow bg-white rounded-2xl border border-slate-200/80">
      <div class="flex items-center justify-between">
        <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Users</span>
        <div class="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><i data-lucide="users" class="w-4 h-4"></i></div>
      </div>
      <div class="mt-3">
        <span class="text-xl font-extrabold tracking-tight text-slate-900 block">${totalUsers}</span>
        <span class="text-[10px] text-slate-400 font-medium block mt-0.5">Active team credentials</span>
      </div>
    </div>
    <div class="premium-card p-5 premium-shadow bg-white rounded-2xl border border-slate-200/80">
      <div class="flex items-center justify-between">
        <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Credentials</span>
        <div class="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center"><i data-lucide="user" class="w-4 h-4"></i></div>
      </div>
      <div class="mt-3">
        <span class="text-xl font-extrabold tracking-tight text-slate-900 block">${activeUsers}</span>
        <span class="text-[10px] text-emerald-550 font-medium block mt-0.5">● Ready for operation</span>
      </div>
    </div>
    <div class="premium-card p-5 premium-shadow bg-white rounded-2xl border border-slate-200/80">
      <div class="flex items-center justify-between">
        <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pending Invites</span>
        <div class="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center"><i data-lucide="mail" class="w-4 h-4"></i></div>
      </div>
      <div class="mt-3">
        <span class="text-xl font-extrabold tracking-tight text-slate-900 block">${pendingUsers}</span>
        <span class="text-[10px] text-amber-550 font-medium block mt-0.5">Awaiting setup completion</span>
      </div>
    </div>
    <div class="premium-card p-5 premium-shadow bg-white rounded-2xl border border-slate-200/80">
      <div class="flex items-center justify-between">
        <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Defined Roles</span>
        <div class="h-8 w-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center"><i data-lucide="settings" class="w-4 h-4"></i></div>
      </div>
      <div class="mt-3">
        <span class="text-xl font-extrabold tracking-tight text-slate-900 block">${distinctRoles}</span>
        <span class="text-[10px] text-slate-400 font-medium block mt-0.5">Access permission structures</span>
      </div>
    </div>
  `;
}

function renderAll() {
  renderMetrics();
  window.renderUsers();
  initIcons();
}

document.addEventListener('DOMContentLoaded', async () => {
  await appReadyPromise;
  renderAll();
});
