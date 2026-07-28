import"./lucide-CU5-AOMs.js";import"./layout-wQjH3XYy.js";import{n as e,o as t,s as n,t as r}from"./shared-Det_SasC.js";function i(e){return String(e??``).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#39;`)}var a=null;function o(){return e.hrmLeaves||(e.hrmLeaves=[{id:`LR-001`,employeeId:`EMP-004`,type:`Casual Leave`,start:`2026-06-15`,end:`2026-06-18`,days:3,reason:`Family event travel`,status:`Approved`},{id:`LR-002`,employeeId:`EMP-001`,type:`Sick Leave`,start:`2026-06-20`,end:`2026-06-21`,days:1,reason:`Medical appointment`,status:`Pending`}],n()),e.hrmLeaves}window.showMainView=function(){document.getElementById(`hrm-leave-main-view`).classList.remove(`hidden`),document.getElementById(`hrm-leave-form-view`).classList.add(`hidden`),a=null},window.showFormView=function(){document.getElementById(`hrm-leave-main-view`).classList.add(`hidden`),document.getElementById(`hrm-leave-form-view`).classList.remove(`hidden`)},window.openLeaveModal=function(){a=null;let e=document.getElementById(`hrm-leave-form`);e&&e.reset(),document.getElementById(`leave-form-title`).innerText=`Request Leave`;let t=new Date().toISOString().split(`T`)[0];document.getElementById(`input-leave-start`).value=t,document.getElementById(`input-leave-end`).value=t;let n=document.getElementById(`leave-advanced-section`);n&&n.classList.add(`hidden`);let r=document.getElementById(`leave-advanced-icon`);r&&(r.style.transform=`rotate(0deg)`),window.showFormView()},window.toggleAdvancedFields=function(){let e=document.getElementById(`leave-advanced-section`),t=document.getElementById(`leave-advanced-icon`);e.classList.contains(`hidden`)?(e.classList.remove(`hidden`),t.style.transform=`rotate(180deg)`):(e.classList.add(`hidden`),t.style.transform=`rotate(0deg)`)};function s(){let t=document.getElementById(`input-leave-emp`);if(!t)return;let n=e.employees||[];t.innerHTML=`<option value="">Select Employee *</option>`,n.forEach(e=>{t.innerHTML+=`<option value="${i(e.id)}">${i(e.name)} (${i(e.id)})</option>`})}function c(e,t){if(!e||!t)return 1;let n=new Date(e),r=new Date(t),i=Math.abs(r-n);return Math.ceil(i/(1e3*60*60*24))+1||1}window.approveLeave=function(t){let r=o().find(e=>e.id===t);if(!(!r||r.status!==`Pending`)&&confirm(`Approve leave request ${t}? This updates employee status to On Leave.`)){r.status=`Approved`;let t=e.employees?.find(e=>e.id===r.employeeId);t&&(t.status=`on-leave`),n(),u()}},window.rejectLeave=function(e){let t=o().find(t=>t.id===e);!t||t.status!==`Pending`||confirm(`Reject leave request ${e}?`)&&(t.status=`Rejected`,n(),u())},window.handleSubmit=function(e){e.preventDefault();let t=o(),r=document.getElementById(`input-leave-emp`).value,i=document.getElementById(`input-leave-type`).value,s=document.getElementById(`input-leave-start`).value,l=document.getElementById(`input-leave-end`).value,d=document.getElementById(`input-leave-reason`).value,f=c(s,l);if(a){let e=t.find(e=>e.id===a);e&&(e.status===`Pending`&&(e.employeeId=r,e.type=i,e.start=s,e.end=l,e.days=f),e.reason=d)}else{let e=t.length>0?Math.max(...t.map(e=>Number(e.id.replace(`LR-`,``))))+1:1,n={id:`LR-${String(100+e).slice(1)}`,employeeId:r,type:i,start:s,end:l,days:f,reason:d,status:`Pending`};t.push(n)}n(),window.showMainView(),u()},window.editRecord=function(e){let t=o().find(t=>t.id===e);if(!t)return;a=e,document.getElementById(`leave-form-title`).innerText=`Edit Leave Request: ${e}`,document.getElementById(`input-leave-emp`).value=t.employeeId,document.getElementById(`input-leave-type`).value=t.type,document.getElementById(`input-leave-start`).value=t.start,document.getElementById(`input-leave-end`).value=t.end,document.getElementById(`input-leave-reason`).value=t.reason||``;let n=t.status!==`Pending`;document.getElementById(`input-leave-emp`).disabled=n,document.getElementById(`input-leave-type`).disabled=n,document.getElementById(`input-leave-start`).disabled=n,document.getElementById(`input-leave-end`).disabled=n,window.showFormView()},window.deleteRecord=function(e){let t=o(),r=t.findIndex(t=>t.id===e);if(r!==-1){if(t[r].status===`Approved`){alert(`Approved leave logs cannot be deleted.`);return}confirm(`Are you sure you want to delete leave request ${e}?`)&&(t.splice(r,1),n(),u())}};function l(){let e=o(),t=document.getElementById(`hrm-leave-metrics`);t&&(t.innerHTML=`
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Requests</span>
      <span class="text-xl font-extrabold text-slate-950 block mt-2">${e.length} filings</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-orange-200 bg-orange-50/20 premium-shadow">
      <span class="text-[10px] font-bold text-orange-600 uppercase tracking-wider block">Pending Approvals</span>
      <span class="text-xl font-extrabold text-orange-700 block mt-2">${e.filter(e=>e.status===`Pending`).length} requests</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Approved Logs</span>
      <span class="text-xl font-extrabold text-emerald-600 block mt-2">${e.filter(e=>e.status===`Approved`).length} closed</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-blue-200 bg-blue-50/20 premium-shadow">
      <span class="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">Total Leave Days</span>
      <span class="text-xl font-extrabold text-blue-700 block mt-2">${e.filter(e=>e.status===`Approved`).reduce((e,t)=>e+t.days,0)} days</span>
    </div>
  `)}window.renderTable=function(){let t=document.getElementById(`hrm-leave-body`);if(!t)return;t.innerHTML=``;let n=(document.getElementById(`hrm-leave-search-input`)?.value||``).toLowerCase(),r=document.getElementById(`filter-leave-type`)?.value||`all`,a=document.getElementById(`filter-leave-status`)?.value||`all`,s=o().filter(t=>{if(r!==`all`&&t.type!==r||a!==`all`&&t.status!==a)return!1;if(n){let r=(e.employees||[]).find(e=>e.id===t.employeeId),i=r?r.name.toLowerCase():``;if(!(t.employeeId.toLowerCase().includes(n)||i.includes(n)))return!1}return!0});if(s.length===0){t.innerHTML=`<tr><td colspan="9" class="p-8 text-center text-slate-400 font-semibold">No leave logs found.</td></tr>`;return}let c=e.employees||[];s.forEach(e=>{let n=c.find(t=>t.id===e.employeeId),r=n?n.name:`Unknown Employee`,a=`bg-slate-50 text-slate-700 border-slate-200`;e.status===`Approved`&&(a=`bg-emerald-50 text-emerald-700 border-emerald-200`),e.status===`Pending`&&(a=`bg-amber-50 text-amber-700 border-amber-200`),e.status===`Rejected`&&(a=`bg-rose-50 text-rose-700 border-rose-200`);let o=e.status===`Pending`;t.innerHTML+=`
      <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100">
        <td class="p-4 pl-6 font-bold text-slate-900">${i(e.id)}</td>
        <td class="p-4 font-semibold text-slate-900">${i(r)}</td>
        <td class="p-4 font-semibold text-slate-700">${i(e.type)}</td>
        <td class="p-4 text-center text-slate-500 font-medium">${i(e.start)}</td>
        <td class="p-4 text-center text-slate-500 font-medium">${i(e.end)}</td>
        <td class="p-4 text-center font-bold text-slate-900">${e.days} days</td>
        <td class="p-4 text-slate-500 font-medium">${i(e.reason||`N/A`)}</td>
        <td class="p-4 text-center">
          <span class="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${a}">
            ${e.status}
          </span>
        </td>
        <td class="p-4">
          <div class="flex items-center justify-center gap-2">
            ${o?`
              <button onclick="window.approveLeave('${e.id}')" title="Approve Request" class="p-1.5 hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700 rounded-lg border border-slate-100 hover:border-emerald-200 transition-colors cursor-pointer">
                <i data-lucide="check" class="w-3.5 h-3.5"></i>
              </button>
              <button onclick="window.rejectLeave('${e.id}')" title="Reject Request" class="p-1.5 hover:bg-rose-50 text-rose-600 hover:text-rose-700 rounded-lg border border-slate-100 hover:border-rose-200 transition-colors cursor-pointer">
                <i data-lucide="x" class="w-3.5 h-3.5"></i>
              </button>
            `:``}
            <button onclick="window.editRecord('${e.id}')" title="View/Edit" class="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-slate-800 rounded-lg border border-slate-100 transition-colors cursor-pointer">
              <i data-lucide="eye" class="w-3.5 h-3.5"></i>
            </button>
            ${o?`
              <button onclick="window.deleteRecord('${e.id}')" title="Delete" class="p-1.5 hover:bg-rose-50 text-rose-600 hover:text-rose-700 rounded-lg border border-slate-100 hover:border-rose-200 transition-colors cursor-pointer">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
              </button>
            `:``}
          </div>
        </td>
      </tr>
    `})};function u(){l(),window.renderTable(),t()}document.addEventListener(`DOMContentLoaded`,async()=>{await r,s(),u()});