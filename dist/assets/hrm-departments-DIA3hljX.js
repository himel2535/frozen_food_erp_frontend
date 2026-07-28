import"./lucide-CU5-AOMs.js";import"./layout-wQjH3XYy.js";import{n as e,o as t,s as n,t as r}from"./shared-Det_SasC.js";function i(e){return String(e??``).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#39;`)}var a=null;function o(){return e.hrmDepartments||(e.hrmDepartments=[{id:`DEP-01`,code:`IT`,name:`IT`,head:`Sarah Connor`,status:`Active`,loc:`Building A, Floor 3`,desc:`Corporate network and server infrastructure.`},{id:`DEP-02`,code:`Sales`,name:`Sales`,head:`Marcus Wright`,status:`Active`,loc:`Tejgaon Floor 2`,desc:`Enterprise account management.`},{id:`DEP-03`,code:`HR`,name:`HR`,head:`Arthur Dent`,status:`Active`,loc:`Tejgaon Floor 1`,desc:`Human resources and payroll management.`},{id:`DEP-04`,code:`Production`,name:`Production`,head:`Ellen Ripley`,status:`Active`,loc:`Gazipur Unit 1`,desc:`Apparel line manufacture.`}],n()),e.hrmDepartments}window.showMainView=function(){document.getElementById(`hrm-departments-main-view`).classList.remove(`hidden`),document.getElementById(`hrm-departments-form-view`).classList.add(`hidden`),a=null},window.showFormView=function(){document.getElementById(`hrm-departments-main-view`).classList.add(`hidden`),document.getElementById(`hrm-departments-form-view`).classList.remove(`hidden`)},window.openDepartmentModal=function(){a=null;let e=document.getElementById(`hrm-departments-form`);e&&e.reset(),document.getElementById(`dept-form-title`).innerText=`Create Department`;let t=document.getElementById(`dept-advanced-section`);t&&t.classList.add(`hidden`);let n=document.getElementById(`dept-advanced-icon`);n&&(n.style.transform=`rotate(0deg)`),window.showFormView()},window.toggleAdvancedFields=function(){let e=document.getElementById(`dept-advanced-section`),t=document.getElementById(`dept-advanced-icon`);e.classList.contains(`hidden`)?(e.classList.remove(`hidden`),t.style.transform=`rotate(180deg)`):(e.classList.add(`hidden`),t.style.transform=`rotate(0deg)`)};function s(){let t=document.getElementById(`input-dept-head`);if(!t)return;let n=e.employees||[];t.innerHTML=`<option value="">Select Manager / Head *</option>`,n.forEach(e=>{t.innerHTML+=`<option value="${i(e.name)}">${i(e.name)} (${i(e.designation)})</option>`})}window.handleSubmit=function(e){e.preventDefault();let t=o(),r=document.getElementById(`input-dept-code`).value.toUpperCase().trim(),i=document.getElementById(`input-dept-name`).value.trim(),s=document.getElementById(`input-dept-head`).value,c=document.getElementById(`input-dept-status`).value,u=document.getElementById(`input-dept-loc`).value,d=document.getElementById(`input-dept-desc`).value;if(a){let e=t.find(e=>e.id===a);e&&(e.code=r,e.name=i,e.head=s,e.status=c,e.loc=u,e.desc=d)}else{let e=t.length>0?Math.max(...t.map(e=>Number(e.id.replace(`DEP-`,``))))+1:1,n={id:`DEP-${String(100+e).slice(1)}`,code:r,name:i,head:s,status:c,loc:u,desc:d};t.push(n)}n(),window.showMainView(),l()},window.editRecord=function(e){let t=o().find(t=>t.id===e);t&&(a=e,document.getElementById(`dept-form-title`).innerText=`Edit Department Details: ${e}`,document.getElementById(`input-dept-code`).value=t.code,document.getElementById(`input-dept-name`).value=t.name,document.getElementById(`input-dept-head`).value=t.head,document.getElementById(`input-dept-status`).value=t.status,document.getElementById(`input-dept-loc`).value=t.loc||``,document.getElementById(`input-dept-desc`).value=t.desc||``,window.showFormView())},window.deleteRecord=function(e){let t=o(),r=t.findIndex(t=>t.id===e);r!==-1&&confirm(`Are you sure you want to delete department ${e}?`)&&(t.splice(r,1),n(),l())};function c(){let t=o(),n=document.getElementById(`hrm-departments-metrics`);n&&(n.innerHTML=`
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Depts</span>
      <span class="text-xl font-extrabold text-slate-950 block mt-2">${t.length} divisions</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Divisions</span>
      <span class="text-xl font-extrabold text-emerald-600 block mt-2">${t.filter(e=>e.status===`Active`).length} divisions</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-blue-200 bg-blue-50/20 premium-shadow">
      <span class="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">Total Allocated Staff</span>
      <span class="text-xl font-extrabold text-blue-700 block mt-2">${e.employees?e.employees.length:0} employees</span>
    </div>
  `)}window.renderTable=function(){let t=document.getElementById(`hrm-departments-body`);if(!t)return;t.innerHTML=``;let n=(document.getElementById(`hrm-departments-search-input`)?.value||``).toLowerCase(),r=document.getElementById(`filter-dept-status`)?.value||`all`,a=o().filter(e=>!(r!==`all`&&e.status!==r||n&&!(e.code.toLowerCase().includes(n)||e.name.toLowerCase().includes(n)||(e.head||``).toLowerCase().includes(n))));if(a.length===0){t.innerHTML=`<tr><td colspan="6" class="p-8 text-center text-slate-400 font-semibold">No departments found.</td></tr>`;return}let s=e.employees||[];a.forEach(e=>{let n=s.filter(t=>t.department===e.name||t.department===e.code).length,r=`bg-slate-50 text-slate-700 border-slate-200`;e.status===`Active`&&(r=`bg-emerald-50 text-emerald-700 border-emerald-200`),e.status===`Inactive`&&(r=`bg-rose-50 text-rose-700 border-rose-200`),t.innerHTML+=`
      <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100">
        <td class="p-4 pl-6 font-bold text-slate-900">${i(e.code)}</td>
        <td class="p-4">
          <div class="font-semibold text-slate-900">${i(e.name)}</div>
          ${e.desc?`<div class="text-[10px] text-slate-400 font-medium">${i(e.desc)}</div>`:``}
        </td>
        <td class="p-4 font-semibold text-slate-700">${i(e.head||`N/A`)}</td>
        <td class="p-4 text-center font-bold text-slate-900">${n} members</td>
        <td class="p-4 text-center">
          <span class="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${r}">
            ${e.status}
          </span>
        </td>
        <td class="p-4">
          <div class="flex items-center justify-center gap-2">
            <button onclick="window.editRecord('${e.id}')" title="Edit Division" class="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-slate-800 rounded-lg border border-slate-100 transition-colors cursor-pointer">
              <i data-lucide="eye" class="w-3.5 h-3.5"></i>
            </button>
            <button onclick="window.deleteRecord('${e.id}')" title="Delete" class="p-1.5 hover:bg-rose-50 text-rose-600 hover:text-rose-700 rounded-lg border border-slate-100 hover:border-rose-200 transition-colors cursor-pointer">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </td>
      </tr>
    `})};function l(){c(),window.renderTable(),t()}document.addEventListener(`DOMContentLoaded`,async()=>{await r,s(),l()});