import"./lucide-CU5-AOMs.js";import"./layout-wQjH3XYy.js";import{n as e,o as t,s as n,t as r}from"./shared-Det_SasC.js";var i=(...e)=>window.renderProjectsTable(...e);window.renderProjectsTable=function(){let t=document.getElementById(`projects-table-body`);if(!t)return;t.innerHTML=``;let n=document.getElementById(`project-input-lead`);n&&n.children.length===0&&e.employees.forEach(e=>{n.innerHTML+=`<option value="${e.name}">${e.name}</option>`});let r=e.projects.length,i=document.getElementById(`projects-metric-active`);i&&(i.textContent=r.toString());let a=e.projects.filter(e=>e.health===`At Risk`).length,o=document.getElementById(`projects-metric-risk`);if(o&&(o.textContent=a.toString()),e.projects.length===0){t.innerHTML=`<tr><td colspan="7" class="px-6 py-8 text-center text-slate-400 font-semibold">No active projects found.</td></tr>`;return}e.projects.forEach((e,n)=>{let r=`bg-emerald-50 text-emerald-600`;e.health===`At Risk`&&(r=`bg-rose-50 text-rose-600`),t.innerHTML+=`
      <tr class="hover:bg-slate-50/50 transition-colors">
        <td class="px-6 py-4 font-bold text-slate-900">${e.name}</td>
        <td class="px-6 py-4 font-semibold text-slate-700">${e.lead}</td>
        <td class="px-6 py-4 text-slate-555 font-semibold">${e.deadline}</td>
        <td class="px-6 py-4">
          <div class="flex items-center gap-2">
            <div class="w-full bg-slate-200 rounded-full h-2 max-w-[100px]">
              <div class="bg-blue-600 h-2 rounded-full" style="width: ${e.progress}%"></div>
            </div>
            <span class="text-[10px] font-bold text-slate-700">${e.progress}%</span>
          </div>
        </td>
        <td class="px-6 py-4">
          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold capitalize ${r}">
            ${e.health}
          </span>
        </td>
        <td class="px-6 py-4 text-right font-extrabold text-slate-900">$${e.budget.toLocaleString()}</td>
        <td class="px-6 py-4 text-center">
          <button onclick="window.incrementProjectProgress(${n})" class="text-[10px] font-bold text-blue-600 hover:text-blue-800 transition-colors">Advance Progress</button>
        </td>
      </tr>
    `})},window.handleProjectSubmit=function(t){t.preventDefault();let r={name:document.getElementById(`project-input-name`).value,lead:document.getElementById(`project-input-lead`).value,deadline:document.getElementById(`project-input-deadline`).value,progress:0,health:`On Track`,budget:parseFloat(document.getElementById(`project-input-budget`).value)||0};e.projects.push(r),n(),window.showProjectsMainView(),document.getElementById(`projects-form`).reset(),i()},window.incrementProjectProgress=function(t){let r=e.projects[t];r&&(r.progress=Math.min(100,r.progress+10),r.progress===100&&(r.health=`Completed`),n(),i())},window.showProjectsMainView=function(){document.getElementById(`projects-main-view`).classList.remove(`hidden`),document.getElementById(`projects-form-view`).classList.add(`hidden`)},window.showProjectsFormView=function(){document.getElementById(`projects-main-view`).classList.add(`hidden`),document.getElementById(`projects-form-view`).classList.remove(`hidden`)},window.toggleAdvancedProjectsFields=function(){let e=document.getElementById(`projects-advanced-section`),t=document.getElementById(`projects-advanced-icon`);e&&(e.classList.contains(`hidden`)?(e.classList.remove(`hidden`),t&&(t.style.transform=`rotate(180deg)`)):(e.classList.add(`hidden`),t&&(t.style.transform=`rotate(0deg)`)))},document.addEventListener(`DOMContentLoaded`,async()=>{await r,window.renderProjectsTable(),t()});