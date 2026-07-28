import"./lucide-CU5-AOMs.js";import"./layout-wQjH3XYy.js";import{n as e,o as t,s as n,t as r}from"./shared-Det_SasC.js";function i(e){return String(e??``).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#39;`)}var a=null;function o(){return e.hrmDesignations||(e.hrmDesignations=[{id:`DESG-01`,name:`Lead DevOps Architect`,grade:`Grade 8`,status:`Active`,desc:`Coordinates cloud operations, security compliance, and automation.`},{id:`DESG-02`,name:`Full Stack Engineer`,grade:`Grade 6`,status:`Active`,desc:`Builds client-side and backend software integrations.`},{id:`DESG-03`,name:`Operations Director`,grade:`Grade 9`,status:`Active`,desc:`Coordinates production plants, materials flow, and logistics.`},{id:`DESG-04`,name:`HR Specialist`,grade:`Grade 5`,status:`Active`,desc:`Coordinates employee recruitment and benefits allocations.`},{id:`DESG-05`,name:`VP of Sales`,grade:`Grade 9`,status:`Active`,desc:`Directs client acquisition and enterprise relations.`}],n()),e.hrmDesignations}window.showMainView=function(){document.getElementById(`hrm-designations-main-view`).classList.remove(`hidden`),document.getElementById(`hrm-designations-form-view`).classList.add(`hidden`),a=null},window.showFormView=function(){document.getElementById(`hrm-designations-main-view`).classList.add(`hidden`),document.getElementById(`hrm-designations-form-view`).classList.remove(`hidden`)},window.openDesignationModal=function(){a=null;let e=document.getElementById(`hrm-designations-form`);e&&e.reset(),document.getElementById(`desg-form-title`).innerText=`Create Designation`;let t=document.getElementById(`desg-advanced-section`);t&&t.classList.add(`hidden`);let n=document.getElementById(`desg-advanced-icon`);n&&(n.style.transform=`rotate(0deg)`),window.showFormView()},window.toggleAdvancedFields=function(){let e=document.getElementById(`desg-advanced-section`),t=document.getElementById(`desg-advanced-icon`);e.classList.contains(`hidden`)?(e.classList.remove(`hidden`),t.style.transform=`rotate(180deg)`):(e.classList.add(`hidden`),t.style.transform=`rotate(0deg)`)},window.handleSubmit=function(e){e.preventDefault();let t=o(),r=document.getElementById(`input-desg-name`).value.trim(),i=document.getElementById(`input-desg-grade`).value.trim(),s=document.getElementById(`input-desg-status`).value,l=document.getElementById(`input-desg-desc`).value;if(a){let e=t.find(e=>e.id===a);e&&(e.name=r,e.grade=i,e.status=s,e.desc=l)}else{let e=t.length>0?Math.max(...t.map(e=>Number(e.id.replace(`DESG-`,``))))+1:1,n={id:`DESG-${String(100+e).slice(1)}`,name:r,grade:i,status:s,desc:l};t.push(n)}n(),window.showMainView(),c()},window.editRecord=function(e){let t=o().find(t=>t.id===e);t&&(a=e,document.getElementById(`desg-form-title`).innerText=`Edit Designation Details: ${e}`,document.getElementById(`input-desg-name`).value=t.name,document.getElementById(`input-desg-grade`).value=t.grade,document.getElementById(`input-desg-status`).value=t.status,document.getElementById(`input-desg-desc`).value=t.desc||``,window.showFormView())},window.deleteRecord=function(e){let t=o(),r=t.findIndex(t=>t.id===e);r!==-1&&confirm(`Are you sure you want to delete designation ${e}?`)&&(t.splice(r,1),n(),c())};function s(){let e=o(),t=document.getElementById(`hrm-designations-metrics`);t&&(t.innerHTML=`
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Designations</span>
      <span class="text-xl font-extrabold text-slate-950 block mt-2">${e.length} roles</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Roles</span>
      <span class="text-xl font-extrabold text-emerald-600 block mt-2">${e.filter(e=>e.status===`Active`).length} active</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-blue-200 bg-blue-50/20 premium-shadow">
      <span class="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">Hierarchical Grades</span>
      <span class="text-xl font-extrabold text-blue-700 block mt-2">${new Set(e.map(e=>e.grade)).size} levels</span>
    </div>
  `)}window.renderTable=function(){let t=document.getElementById(`hrm-designations-body`);if(!t)return;t.innerHTML=``;let n=(document.getElementById(`hrm-designations-search-input`)?.value||``).toLowerCase(),r=document.getElementById(`filter-desg-status`)?.value||`all`,a=o().filter(e=>!(r!==`all`&&e.status!==r||n&&!(e.name.toLowerCase().includes(n)||e.grade.toLowerCase().includes(n))));if(a.length===0){t.innerHTML=`<tr><td colspan="6" class="p-8 text-center text-slate-400 font-semibold">No designations found.</td></tr>`;return}let s=e.employees||[];a.forEach(e=>{let n=s.filter(t=>t.designation===e.name).length,r=`bg-slate-50 text-slate-700 border-slate-200`;e.status===`Active`&&(r=`bg-emerald-50 text-emerald-700 border-emerald-200`),e.status===`Inactive`&&(r=`bg-rose-50 text-rose-700 border-rose-200`),t.innerHTML+=`
      <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100">
        <td class="p-4 pl-6 font-bold text-slate-900">${i(e.id)}</td>
        <td class="p-4">
          <div class="font-semibold text-slate-900">${i(e.name)}</div>
          ${e.desc?`<div class="text-[10px] text-slate-400 font-medium">${i(e.desc)}</div>`:``}
        </td>
        <td class="p-4 font-semibold text-slate-750">${i(e.grade)}</td>
        <td class="p-4 text-center font-bold text-slate-900">${n} members</td>
        <td class="p-4 text-center">
          <span class="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${r}">
            ${e.status}
          </span>
        </td>
        <td class="p-4">
          <div class="flex items-center justify-center gap-2">
            <button onclick="window.editRecord('${e.id}')" title="Edit Designation" class="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-slate-800 rounded-lg border border-slate-100 transition-colors cursor-pointer">
              <i data-lucide="eye" class="w-3.5 h-3.5"></i>
            </button>
            <button onclick="window.deleteRecord('${e.id}')" title="Delete" class="p-1.5 hover:bg-rose-50 text-rose-600 hover:text-rose-700 rounded-lg border border-slate-100 hover:border-rose-200 transition-colors cursor-pointer">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </td>
      </tr>
    `})};function c(){s(),window.renderTable(),t()}document.addEventListener(`DOMContentLoaded`,async()=>{await r,c()});