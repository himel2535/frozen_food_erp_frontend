import { appReadyPromise, appState, saveAppState, initIcons } from '/js/shared.js';

const renderProjectsTable = (...args) => window.renderProjectsTable(...args);

// PROJECTS SUBVIEW CONTROLLER
// ----------------------------------------------------
window.renderProjectsTable = function() {
  const tbody = document.getElementById('projects-table-body');
  if (!tbody) return;
  tbody.innerHTML = '';

  const leadSelect = document.getElementById('project-input-lead');
  if (leadSelect && leadSelect.children.length === 0) {
    appState.employees.forEach(emp => {
      leadSelect.innerHTML += `<option value="${emp.name}">${emp.name}</option>`;
    });
  }

  const activeCount = appState.projects.length;
  const activeMetric = document.getElementById('projects-metric-active');
  if (activeMetric) activeMetric.textContent = activeCount.toString();

  const riskCount = appState.projects.filter(p => p.health === 'At Risk').length;
  const riskMetric = document.getElementById('projects-metric-risk');
  if (riskMetric) riskMetric.textContent = riskCount.toString();

  if (appState.projects.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="px-6 py-8 text-center text-slate-400 font-semibold">No active projects found.</td></tr>`;
    return;
  }

  appState.projects.forEach((p, idx) => {
    let healthClass = "bg-emerald-50 text-emerald-600";
    if (p.health === 'At Risk') healthClass = "bg-rose-50 text-rose-600";

    tbody.innerHTML += `
      <tr class="hover:bg-slate-50/50 transition-colors">
        <td class="px-6 py-4 font-bold text-slate-900">${p.name}</td>
        <td class="px-6 py-4 font-semibold text-slate-700">${p.lead}</td>
        <td class="px-6 py-4 text-slate-555 font-semibold">${p.deadline}</td>
        <td class="px-6 py-4">
          <div class="flex items-center gap-2">
            <div class="w-full bg-slate-200 rounded-full h-2 max-w-[100px]">
              <div class="bg-blue-600 h-2 rounded-full" style="width: ${p.progress}%"></div>
            </div>
            <span class="text-[10px] font-bold text-slate-700">${p.progress}%</span>
          </div>
        </td>
        <td class="px-6 py-4">
          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold capitalize ${healthClass}">
            ${p.health}
          </span>
        </td>
        <td class="px-6 py-4 text-right font-extrabold text-slate-900">$${p.budget.toLocaleString()}</td>
        <td class="px-6 py-4 text-center">
          <button onclick="window.incrementProjectProgress(${idx})" class="text-[10px] font-bold text-blue-600 hover:text-blue-800 transition-colors">Advance Progress</button>
        </td>
      </tr>
    `;
  });
};

window.handleProjectSubmit = function(event) {
  event.preventDefault();
  const name = document.getElementById('project-input-name').value;
  const lead = document.getElementById('project-input-lead').value;
  const deadline = document.getElementById('project-input-deadline').value;
  const budget = parseFloat(document.getElementById('project-input-budget').value) || 0;

  const newProj = {
    name,
    lead,
    deadline,
    progress: 0,
    health: 'On Track',
    budget
  };

  appState.projects.push(newProj);
  saveAppState();
  window.showProjectsMainView();
  document.getElementById('projects-form').reset();
  renderProjectsTable();
};

window.incrementProjectProgress = function(index) {
  const p = appState.projects[index];
  if (p) {
    p.progress = Math.min(100, p.progress + 10);
    if (p.progress === 100) {
      p.health = "Completed";
    }
    saveAppState();
    renderProjectsTable();
  }
};


window.showProjectsMainView = function() {
  document.getElementById('projects-main-view').classList.remove('hidden');
  document.getElementById('projects-form-view').classList.add('hidden');
};

window.showProjectsFormView = function() {
  document.getElementById('projects-main-view').classList.add('hidden');
  document.getElementById('projects-form-view').classList.remove('hidden');
};

window.toggleAdvancedProjectsFields = function() {
  const section = document.getElementById(`projects-advanced-section`);
  const icon = document.getElementById(`projects-advanced-icon`);
  if (!section) return;
  if (section.classList.contains('hidden')) {
    section.classList.remove('hidden');
    if(icon) icon.style.transform = 'rotate(180deg)';
  } else {
    section.classList.add('hidden');
    if(icon) icon.style.transform = 'rotate(0deg)';
  }
};

document.addEventListener('DOMContentLoaded', async () => {
  await appReadyPromise;
  window.renderProjectsTable();
  initIcons();
});
