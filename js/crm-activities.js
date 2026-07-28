import { appReadyPromise, appState, saveAppState, initIcons } from '/js/shared.js';
import {
  ensureCrmState,
  getCustomerList,
  createActivityEntry,
  createTask
} from '/js/crm-service.js';

function escapeHtml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function saveAndRender() {
  saveAppState();
  renderTimeline();
  renderTasks();
}

function renderTimeline() {
  const container = document.getElementById('crm-global-timeline');
  if (!container) return;
  
  const activities = Object.values(appState.crmData.activitiesById || {}).reverse();
  container.innerHTML = '';
  
  if (!activities.length) {
    container.innerHTML = '<div class="text-slate-400 text-xs font-semibold p-4">No recent activity logged.</div>';
    return;
  }
  
  activities.forEach(item => {
    container.innerHTML += `
      <div class="py-3 flex flex-col gap-1 text-xs font-semibold text-slate-700">
        <div class="flex justify-between items-center">
          <span class="font-bold text-slate-900">${escapeHtml(item.summary)}</span>
          <span class="text-[10px] text-slate-450">${item.timestamp ? new Date(item.timestamp).toLocaleString() : '—'}</span>
        </div>
        <div class="text-slate-500">${escapeHtml(item.note)}</div>
      </div>
    `;
  });
}

function renderTasks() {
  const container = document.getElementById('crm-global-tasks');
  if (!container) return;
  
  const tasks = Object.values(appState.crmData.tasksById || {}).filter(t => !t.completed);
  container.innerHTML = '';
  
  if (!tasks.length) {
    container.innerHTML = '<div class="text-slate-400 text-xs font-semibold p-4">No pending tasks!</div>';
    return;
  }
  
  tasks.forEach(task => {
    container.innerHTML += `
      <div class="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700">
        <input type="checkbox" onclick="window.completeTask('${task.id}')">
        <div>
          <div class="font-bold text-slate-900">${escapeHtml(task.title)}</div>
          <div class="text-[10px] text-slate-450 mt-1">Due: ${task.dueDate || '—'}</div>
        </div>
      </div>
    `;
  });
}

window.openTimelineModal = function() {
  document.getElementById('crm-timeline-form').reset();
  const select = document.getElementById('crm-timeline-customer');
  if (select) {
    const customers = getCustomerList(appState);
    select.innerHTML = '<option value="">Select Customer</option>';
    customers.forEach(c => select.innerHTML += `<option value="${c.id}">${escapeHtml(c.name)}</option>`);
  }
  window.toggleModal('modal-crm-timeline', true);
  initIcons();
};

window.handleTimelineSubmit = function(event) {
  event.preventDefault();
  const customerId = document.getElementById('crm-timeline-customer').value;
  const type = document.getElementById('crm-timeline-type').value;
  const title = document.getElementById('crm-timeline-title').value.trim();
  const summary = document.getElementById('crm-timeline-summary').value.trim();
  
  if (type === 'task') {
    createTask(appState, {
      title,
      dueDate: document.getElementById('crm-timeline-date').value,
      entityType: 'customer',
      entityId: customerId
    });
  } else {
    createActivityEntry(appState, {
      entityType: 'customer',
      entityId: customerId,
      activityType: type,
      summary: title,
      note: summary
    });
  }

  window.toggleModal('modal-crm-timeline', false);
  saveAndRender();
};

window.completeTask = function(taskId) {
  const task = appState.crmData.tasksById[taskId];
  if (task) {
    task.completed = true;
    saveAndRender();
  }
};

document.addEventListener('DOMContentLoaded', async () => {
  await appReadyPromise;
  ensureCrmState(appState);
  renderTimeline();
  renderTasks();
  initIcons();
});
