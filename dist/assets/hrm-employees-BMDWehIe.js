import"./lucide-CU5-AOMs.js";import"./layout-wQjH3XYy.js";import{n as e,o as t,s as n,t as r}from"./shared-Det_SasC.js";function i(e){return String(e??``).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#39;`)}var a=null;function o(){return e.employees||[]}window.showMainView=function(){document.getElementById(`hrm-employees-main-view`).classList.remove(`hidden`),document.getElementById(`hrm-employees-form-view`).classList.add(`hidden`),a=null},window.showFormView=function(){document.getElementById(`hrm-employees-main-view`).classList.add(`hidden`),document.getElementById(`hrm-employees-form-view`).classList.remove(`hidden`)},window.openEmployeeModal=function(){a=null;let e=document.getElementById(`hrm-employees-form`);e&&e.reset(),document.getElementById(`employee-form-title`).innerText=`Register New Employee`,document.getElementById(`input-emp-joining`).value=new Date().toISOString().split(`T`)[0];let t=document.getElementById(`employee-advanced-section`);t&&t.classList.add(`hidden`);let n=document.getElementById(`employee-advanced-icon`);n&&(n.style.transform=`rotate(0deg)`),window.showFormView()},window.toggleAdvancedFields=function(){let e=document.getElementById(`employee-advanced-section`),t=document.getElementById(`employee-advanced-icon`);e.classList.contains(`hidden`)?(e.classList.remove(`hidden`),t.style.transform=`rotate(180deg)`):(e.classList.add(`hidden`),t.style.transform=`rotate(0deg)`)};function s(){let t=document.getElementById(`input-emp-dept`),n=document.getElementById(`filter-department`),r=document.getElementById(`input-emp-desg`),a=document.getElementById(`filter-designation`),o=e.hrmDepartments||[{id:`DEP-01`,name:`Production`},{id:`DEP-02`,name:`IT`}];t&&(t.innerHTML=`<option value="">Select Department *</option>`,o.forEach(e=>{t.innerHTML+=`<option value="${i(e.name)}">${i(e.name)}</option>`})),n&&(n.innerHTML=`<option value="all">All Departments</option>`,o.forEach(e=>{n.innerHTML+=`<option value="${i(e.name)}">${i(e.name)}</option>`}));let s=e.hrmDesignations||[{id:`DESG-01`,name:`Developer`},{id:`DESG-02`,name:`Director`}];r&&(r.innerHTML=`<option value="">Select Designation *</option>`,s.forEach(e=>{r.innerHTML+=`<option value="${i(e.name)}">${i(e.name)}</option>`})),a&&(a.innerHTML=`<option value="all">All Designations</option>`,s.forEach(e=>{a.innerHTML+=`<option value="${i(e.name)}">${i(e.name)}</option>`}))}window.handleSubmit=function(e){e.preventDefault();let t=o(),r=document.getElementById(`input-emp-name`).value,i=document.getElementById(`input-emp-phone`).value,s=document.getElementById(`input-emp-dept`).value,c=document.getElementById(`input-emp-desg`).value,u=document.getElementById(`input-emp-joining`).value,d=document.getElementById(`input-emp-email`).value,f=document.getElementById(`input-emp-status`).value,p=document.getElementById(`input-emp-notes`).value;if(a){let e=t.find(e=>e.id===a);e&&(e.name=r,e.phone=i,e.department=s,e.designation=c,e.joiningDate=u,e.email=d,e.status=f,e.notes=p)}else{let e=t.length>0?Math.max(...t.map(e=>Number(e.id.replace(`EMP-`,``))))+1:1,n={id:`EMP-${String(1e3+e).slice(1)}`,name:r,phone:i,department:s,designation:c,joiningDate:u,email:d,status:f,notes:p};t.push(n)}n(),window.showMainView(),l()},window.editRecord=function(e){let t=o().find(t=>t.id===e);t&&(a=e,document.getElementById(`employee-form-title`).innerText=`Edit Employee Details: ${e}`,document.getElementById(`input-emp-name`).value=t.name,document.getElementById(`input-emp-phone`).value=t.phone,document.getElementById(`input-emp-dept`).value=t.department,document.getElementById(`input-emp-desg`).value=t.designation,document.getElementById(`input-emp-joining`).value=t.joiningDate,document.getElementById(`input-emp-email`).value=t.email||``,document.getElementById(`input-emp-status`).value=t.status||`active`,document.getElementById(`input-emp-notes`).value=t.notes||``,window.showFormView())},window.deleteRecord=function(t){let r=e.employees.findIndex(e=>e.id===t);r!==-1&&confirm(`Are you sure you want to remove employee ${t}? This deletes their corporate records.`)&&(e.employees.splice(r,1),n(),l())};function c(){let e=o(),t=document.getElementById(`hrm-employees-metrics`);t&&(t.innerHTML=`
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Employees</span>
      <span class="text-xl font-extrabold text-slate-950 block mt-2">${e.length} registered</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Staff</span>
      <span class="text-xl font-extrabold text-emerald-600 block mt-2">${e.filter(e=>e.status===`active`).length} online</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-blue-200 bg-blue-50/20 premium-shadow">
      <span class="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">On Outbound Leave</span>
      <span class="text-xl font-extrabold text-blue-700 block mt-2">${e.filter(e=>e.status===`on-leave`).length} leave</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Suspended / Inactive</span>
      <span class="text-xl font-extrabold text-slate-500 block mt-2">${e.filter(e=>e.status===`inactive`).length} accounts</span>
    </div>
  `)}window.renderTable=function(){let e=document.getElementById(`hrm-employees-body`);if(!e)return;e.innerHTML=``;let t=(document.getElementById(`hrm-employees-search-input`)?.value||``).toLowerCase(),n=document.getElementById(`filter-department`)?.value||`all`,r=document.getElementById(`filter-designation`)?.value||`all`,a=document.getElementById(`filter-status`)?.value||`all`,s=o().filter(e=>!(n!==`all`&&e.department!==n||r!==`all`&&e.designation!==r||a!==`all`&&e.status!==a||t&&!(e.id.toLowerCase().includes(t)||e.name.toLowerCase().includes(t)||(e.designation||``).toLowerCase().includes(t)||(e.department||``).toLowerCase().includes(t))));if(s.length===0){e.innerHTML=`<tr><td colspan="8" class="p-8 text-center text-slate-400 font-semibold">No employees found in directory.</td></tr>`;return}s.forEach(t=>{let n=`bg-slate-50 text-slate-700 border-slate-200`;t.status===`active`&&(n=`bg-emerald-50 text-emerald-700 border-emerald-200`),t.status===`on-leave`&&(n=`bg-blue-50 text-blue-700 border-blue-200`),t.status===`inactive`&&(n=`bg-rose-50 text-rose-700 border-rose-200`),e.innerHTML+=`
      <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100">
        <td class="p-4 pl-6 font-bold text-slate-900">${i(t.id)}</td>
        <td class="p-4">
          <div class="font-semibold text-slate-900">${i(t.name)}</div>
          ${t.email?`<div class="text-[10px] text-slate-400 font-medium">${i(t.email)}</div>`:``}
        </td>
        <td class="p-4 font-semibold text-slate-700">${i(t.department)}</td>
        <td class="p-4 font-semibold text-slate-600">${i(t.designation)}</td>
        <td class="p-4 font-medium text-slate-650">${i(t.phone)}</td>
        <td class="p-4 text-slate-500 font-medium">${i(t.joiningDate||`N/A`)}</td>
        <td class="p-4 text-center">
          <span class="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${n}">
            ${t.status}
          </span>
        </td>
        <td class="p-4">
          <div class="flex items-center justify-center gap-2">
            <button onclick="window.editRecord('${t.id}')" title="Edit Profile" class="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-slate-800 rounded-lg border border-slate-100 transition-colors cursor-pointer">
              <i data-lucide="eye" class="w-3.5 h-3.5"></i>
            </button>
            <button onclick="window.deleteRecord('${t.id}')" title="Delete Profile" class="p-1.5 hover:bg-rose-50 text-rose-600 hover:text-rose-700 rounded-lg border border-slate-100 hover:border-rose-200 transition-colors cursor-pointer">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </td>
      </tr>
    `})};function l(){c(),window.renderTable(),t()}document.addEventListener(`DOMContentLoaded`,async()=>{await r,s(),l()});