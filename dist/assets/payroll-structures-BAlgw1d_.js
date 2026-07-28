import"./lucide-CU5-AOMs.js";import"./layout-wQjH3XYy.js";import{n as e,o as t,s as n,t as r}from"./shared-Det_SasC.js";function i(e){return String(e??``).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#39;`)}function a(e){return`$${Number(e||0).toLocaleString(`en-US`,{minimumFractionDigits:2,maximumFractionDigits:2})}`}function o(){return e.payrollStructures||(e.payrollStructures=[{id:`STR-001`,name:`Entry Level Package`,base:3e3,hra:500,transport:100,otherAllowance:0,tax:300,insurance:150,otherDeduction:0,status:`Active`},{id:`STR-002`,name:`Mid Level Package`,base:5e3,hra:1e3,transport:200,otherAllowance:100,tax:600,insurance:200,otherDeduction:0,status:`Active`},{id:`STR-003`,name:`Senior Management`,base:1e4,hra:2500,transport:500,otherAllowance:1e3,tax:2e3,insurance:300,otherDeduction:0,status:`Active`}],n()),e.payrollStructures}window.showMainView=function(){document.getElementById(`payroll-structures-main-view`).classList.remove(`hidden`),document.getElementById(`payroll-structures-form-view`).classList.add(`hidden`)},window.showFormView=function(){document.getElementById(`payroll-structures-main-view`).classList.add(`hidden`),document.getElementById(`payroll-structures-form-view`).classList.remove(`hidden`)},window.openStructureModal=function(){let e=document.getElementById(`payroll-structures-form`);e&&e.reset();let t=document.getElementById(`payroll-structures-advanced-section`),n=document.getElementById(`payroll-structures-advanced-icon`);t&&!t.classList.contains(`hidden`)&&(t.classList.add(`hidden`),n&&(n.style.transform=`rotate(0deg)`));let r=document.getElementById(`structure-form-title`);r&&(r.textContent=`Create Salary Structure`),window.showFormView()},window.toggleAdvancedFields=function(){let e=document.getElementById(`payroll-structures-advanced-section`),t=document.getElementById(`payroll-structures-advanced-icon`);e.classList.contains(`hidden`)?(e.classList.remove(`hidden`),t&&(t.style.transform=`rotate(180deg)`)):(e.classList.add(`hidden`),t&&(t.style.transform=`rotate(0deg)`))},window.handleSubmit=function(e){e.preventDefault();let t=o(),r=document.getElementById(`input-name`).value,i=document.getElementById(`input-status`).value,a=parseFloat(document.getElementById(`input-base`).value)||0,s=parseFloat(document.getElementById(`input-hra`).value)||0,l=parseFloat(document.getElementById(`input-transport`).value)||0,u=parseFloat(document.getElementById(`input-other-allowance`).value)||0,d=parseFloat(document.getElementById(`input-tax`).value)||0,f=parseFloat(document.getElementById(`input-insurance`).value)||0,p=parseFloat(document.getElementById(`input-other-deduction`).value)||0,m={id:`STR-${String(100+t.length+1).slice(1)}`,name:r,status:i,base:a,hra:s,transport:l,otherAllowance:u,tax:d,insurance:f,otherDeduction:p};t.push(m),n(),window.showMainView(),c()},window.renderTable=function(){let e=document.getElementById(`payroll-structures-body`);if(!e)return;e.innerHTML=``;let t=document.getElementById(`payroll-structures-search-input`)?.value.toLowerCase()||``,n=o().filter(e=>!t||e.name.toLowerCase().includes(t));if(n.length===0){e.innerHTML=`<tr><td colspan="10" class="p-8 text-center text-slate-400">No records found</td></tr>`;return}n.forEach(t=>{let n=`bg-slate-100 text-slate-600`;t.status===`Active`&&(n=`bg-emerald-100 text-emerald-700`),t.status===`Inactive`&&(n=`bg-rose-100 text-rose-700`);let r=t.hra+t.transport+t.otherAllowance,o=t.tax+t.insurance+t.otherDeduction,s=t.base+r-o;e.innerHTML+=`
      <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100">
        <td class="p-4 font-bold text-slate-900">${i(t.name)}</td>
        <td class="p-4">${a(t.base)}</td>
        <td class="p-4 text-emerald-600">+${a(r)}</td>
        <td class="p-4 text-rose-600">-${a(o)}</td>
        <td class="p-4 font-bold text-blue-600">${a(s)}</td>
        <td class="p-4">
          <span class="px-2 py-1 rounded-md text-[10px] font-bold ${n}">
            ${i(t.status)}
          </span>
        </td>
        <td class="p-4 text-right">
          <button class="text-blue-600 hover:text-blue-800 p-1 cursor-pointer transition-colors" title="Edit">
            <i data-lucide="edit-2" class="w-4 h-4"></i>
          </button>
        </td>
      </tr>
    `})};function s(){let e=o(),t=document.getElementById(`payroll-structures-metrics`);if(!t)return;let n=e.filter(e=>e.status===`Active`).length,r=0,i=0;e.forEach(e=>{if(e.status===`Active`){r+=e.base;let t=e.hra+e.transport+e.otherAllowance,n=e.tax+e.insurance+e.otherDeduction,a=e.base+t-n;a>i&&(i=a)}}),t.innerHTML=`
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Structures</span>
      <span class="text-xl font-extrabold text-slate-800 block mt-2">${n}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Avg. Base Salary</span>
      <span class="text-xl font-extrabold text-blue-600 block mt-2">${a(n>0?r/n:0)}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Highest Net Package</span>
      <span class="text-xl font-extrabold text-emerald-600 block mt-2">${a(i)}</span>
    </div>
  `}function c(){s(),window.renderTable(),t()}document.addEventListener(`DOMContentLoaded`,async()=>{await r,c()});