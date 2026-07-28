import"./lucide-CU5-AOMs.js";import"./layout-wQjH3XYy.js";import{D as e,N as t,T as n,g as r,n as i,o as a,s as o,t as s}from"./shared-Det_SasC.js";function c(e){return String(e??``).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#39;`)}function l(){o(),u(),d()}function u(){let e=document.getElementById(`crm-global-timeline`);if(!e)return;let t=Object.values(i.crmData.activitiesById||{}).reverse();if(e.innerHTML=``,!t.length){e.innerHTML=`<div class="text-slate-400 text-xs font-semibold p-4">No recent activity logged.</div>`;return}t.forEach(t=>{e.innerHTML+=`
      <div class="py-3 flex flex-col gap-1 text-xs font-semibold text-slate-700">
        <div class="flex justify-between items-center">
          <span class="font-bold text-slate-900">${c(t.summary)}</span>
          <span class="text-[10px] text-slate-450">${t.timestamp?new Date(t.timestamp).toLocaleString():`—`}</span>
        </div>
        <div class="text-slate-500">${c(t.note)}</div>
      </div>
    `})}function d(){let e=document.getElementById(`crm-global-tasks`);if(!e)return;let t=Object.values(i.crmData.tasksById||{}).filter(e=>!e.completed);if(e.innerHTML=``,!t.length){e.innerHTML=`<div class="text-slate-400 text-xs font-semibold p-4">No pending tasks!</div>`;return}t.forEach(t=>{e.innerHTML+=`
      <div class="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700">
        <input type="checkbox" onclick="window.completeTask('${t.id}')">
        <div>
          <div class="font-bold text-slate-900">${c(t.title)}</div>
          <div class="text-[10px] text-slate-450 mt-1">Due: ${t.dueDate||`—`}</div>
        </div>
      </div>
    `})}window.openTimelineModal=function(){document.getElementById(`crm-timeline-form`).reset();let e=document.getElementById(`crm-timeline-customer`);if(e){let n=t(i);e.innerHTML=`<option value="">Select Customer</option>`,n.forEach(t=>e.innerHTML+=`<option value="${t.id}">${c(t.name)}</option>`)}window.toggleModal(`modal-crm-timeline`,!0),a()},window.handleTimelineSubmit=function(e){e.preventDefault();let t=document.getElementById(`crm-timeline-customer`).value,a=document.getElementById(`crm-timeline-type`).value,o=document.getElementById(`crm-timeline-title`).value.trim(),s=document.getElementById(`crm-timeline-summary`).value.trim();a===`task`?n(i,{title:o,dueDate:document.getElementById(`crm-timeline-date`).value,entityType:`customer`,entityId:t}):r(i,{entityType:`customer`,entityId:t,activityType:a,summary:o,note:s}),window.toggleModal(`modal-crm-timeline`,!1),l()},window.completeTask=function(e){let t=i.crmData.tasksById[e];t&&(t.completed=!0,l())},document.addEventListener(`DOMContentLoaded`,async()=>{await s,e(i),u(),d(),a()});