import"./lucide-CU5-AOMs.js";import"./layout-wQjH3XYy.js";import{n as e,o as t,s as n,t as r}from"./shared-Det_SasC.js";function i(e){return String(e??``).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#39;`)}function a(e){return`$${Number(e||0).toLocaleString(`en-US`,{minimumFractionDigits:2,maximumFractionDigits:2})}`}function o(){return e.payrollRuns||(e.payrollRuns=[{id:`RUN-2026-004`,period:`2026-04`,date:`2026-04-28`,department:`All`,totalGross:45e3,totalNet:38500,status:`Processed`,notes:`April Salary`,approvalRef:`AUTH-04001`,bankId:`ACH-22004`},{id:`RUN-2026-005`,period:`2026-05`,date:`2026-05-28`,department:`All`,totalGross:48e3,totalNet:41e3,status:`Processed`,notes:`May Salary (Includes bonuses)`,approvalRef:`AUTH-05001`,bankId:`ACH-22005`},{id:`RUN-2026-006`,period:`2026-06`,date:`2026-06-25`,department:`Engineering`,totalGross:15e3,totalNet:12500,status:`Draft`,notes:`June Engineering Review`,approvalRef:``,bankId:``}],n()),e.payrollRuns}window.showMainView=function(){document.getElementById(`payroll-runs-main-view`).classList.remove(`hidden`),document.getElementById(`payroll-runs-form-view`).classList.add(`hidden`)},window.showFormView=function(){document.getElementById(`payroll-runs-main-view`).classList.add(`hidden`),document.getElementById(`payroll-runs-form-view`).classList.remove(`hidden`)},window.openRunModal=function(){let e=document.getElementById(`payroll-runs-form`);e&&e.reset();let t=document.getElementById(`payroll-runs-advanced-section`),n=document.getElementById(`payroll-runs-advanced-icon`);t&&!t.classList.contains(`hidden`)&&(t.classList.add(`hidden`),n&&(n.style.transform=`rotate(0deg)`));let r=document.getElementById(`run-form-title`);r&&(r.textContent=`Execute Payroll Run`),window.showFormView()},window.toggleAdvancedFields=function(){let e=document.getElementById(`payroll-runs-advanced-section`),t=document.getElementById(`payroll-runs-advanced-icon`);e.classList.contains(`hidden`)?(e.classList.remove(`hidden`),t&&(t.style.transform=`rotate(180deg)`)):(e.classList.add(`hidden`),t&&(t.style.transform=`rotate(0deg)`))},window.handleSubmit=function(e){e.preventDefault();let t=o(),r=document.getElementById(`input-period`).value,i=document.getElementById(`input-date`).value,a=document.getElementById(`input-department`).value,s=document.getElementById(`input-notes`).value,l=document.getElementById(`input-approval-ref`).value,u=document.getElementById(`input-bank-id`).value,d=Math.floor(Math.random()*40001+1e4),f=d*.85,p={id:`RUN-${r.replace(`-`,``)}-${String(100+t.length+1).slice(1)}`,period:r,date:i,department:a,totalGross:d,totalNet:f,status:`Draft`,notes:s,approvalRef:l,bankId:u};t.push(p),n(),window.showMainView(),c()},window.renderTable=function(){let e=document.getElementById(`payroll-runs-body`);if(!e)return;e.innerHTML=``;let t=document.getElementById(`payroll-runs-search-input`)?.value.toLowerCase()||``,n=o().filter(e=>!t||e.id.toLowerCase().includes(t)||e.period.toLowerCase().includes(t)||e.notes.toLowerCase().includes(t));if(n.length===0){e.innerHTML=`<tr><td colspan="10" class="p-8 text-center text-slate-400">No records found</td></tr>`;return}n.sort((e,t)=>new Date(t.date)-new Date(e.date)),n.forEach(t=>{let n=`bg-slate-100 text-slate-600`;t.status===`Processed`&&(n=`bg-emerald-100 text-emerald-700`),t.status===`Approved`&&(n=`bg-blue-100 text-blue-700`),t.status===`Draft`&&(n=`bg-amber-100 text-amber-700`),e.innerHTML+=`
      <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100">
        <td class="p-4 font-bold text-slate-900 cursor-pointer hover:text-blue-600 hover:underline">${i(t.id)}</td>
        <td class="p-4 font-semibold text-slate-800">${i(t.period)}</td>
        <td class="p-4">${i(t.date)}</td>
        <td class="p-4">${i(t.department)}</td>
        <td class="p-4">${a(t.totalGross)}</td>
        <td class="p-4 font-bold text-blue-600">${a(t.totalNet)}</td>
        <td class="p-4">
          <span class="px-2 py-1 rounded-md text-[10px] font-bold ${n}">
            ${i(t.status)}
          </span>
        </td>
        <td class="p-4 text-right">
          <button class="text-blue-600 hover:text-blue-800 p-1 cursor-pointer transition-colors" title="View Details">
            <i data-lucide="eye" class="w-4 h-4"></i>
          </button>
        </td>
      </tr>
    `})};function s(){let e=o(),t=document.getElementById(`payroll-runs-metrics`);if(!t)return;let n=e.length,r=0,i=0;n>0&&(i=[...e].sort((e,t)=>new Date(t.date)-new Date(e.date))[0].totalNet),e.forEach(e=>{e.status===`Processed`&&(r+=e.totalGross)}),t.innerHTML=`
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Payroll Runs</span>
      <span class="text-xl font-extrabold text-slate-800 block mt-2">${n}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Cost (YTD Processed Gross)</span>
      <span class="text-xl font-extrabold text-rose-600 block mt-2">${a(r)}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Last Run Net Disbursed</span>
      <span class="text-xl font-extrabold text-emerald-600 block mt-2">${a(i)}</span>
    </div>
  `}function c(){s(),window.renderTable(),t()}document.addEventListener(`DOMContentLoaded`,async()=>{await r,c()});