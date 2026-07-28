import"./lucide-CU5-AOMs.js";import"./layout-wQjH3XYy.js";import{n as e,o as t,s as n,t as r}from"./shared-Det_SasC.js";function i(e){return String(e??``).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#39;`)}function a(e){return`$${Number(e||0).toLocaleString(`en-US`,{minimumFractionDigits:2,maximumFractionDigits:2})}`}function o(){return e.accountingTrialBalance||(e.accountingTrialBalance=[{account:`Cash`,debit:5e4,credit:0},{account:`Sales Revenue`,debit:0,credit:5e4}],n()),e.accountingTrialBalance}window.showMainView=function(){document.getElementById(`accounting-trial-main-view`).classList.remove(`hidden`),document.getElementById(`accounting-trial-form-view`).classList.add(`hidden`)},window.showFormView=function(){document.getElementById(`accounting-trial-main-view`).classList.add(`hidden`),document.getElementById(`accounting-trial-form-view`).classList.remove(`hidden`)},window.openTrialModal=function(){let e=document.getElementById(`accounting-trial-form`);e&&e.reset(),window.showFormView()},window.handleSubmit=function(e){e.preventDefault();let t=o(),r={account:document.getElementById(`input-account`).value,debit:parseFloat(document.getElementById(`input-debit`).value||0),credit:parseFloat(document.getElementById(`input-credit`).value||0)};t.push(r),n(),window.showMainView(),c()},window.renderTable=function(){let e=document.getElementById(`accounting-trial-body`);if(!e)return;e.innerHTML=``;let t=document.getElementById(`accounting-trial-search-input`)?.value.toLowerCase()||``,n=o().filter(e=>!t||Object.values(e).some(e=>String(e).toLowerCase().includes(t)));if(n.length===0){e.innerHTML=`<tr><td colspan="10" class="p-8 text-center text-slate-400">No records found</td></tr>`;return}n.forEach(t=>{e.innerHTML+=`
      <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100">
        <td class="p-4 font-bold text-slate-900">${i(t.account)}</td><td class="p-4 text-emerald-600 font-bold">${a(t.debit)}</td><td class="p-4 text-rose-600 font-bold">${a(t.credit)}</td>
      </tr>
    `})};function s(){let e=o(),t=document.getElementById(`accounting-trial-metrics`);if(!t)return;let n=e.reduce((e,t)=>e+(t.debit||0),0),r=e.reduce((e,t)=>e+(t.credit||0),0);t.innerHTML=`
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <div class="flex items-center justify-between">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Trial Status</span>
        <div class="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center"><i data-lucide="scale" class="w-4 h-4"></i></div>
      </div>
      <span class="text-xl font-extrabold text-emerald-600 block mt-2">Balanced</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <div class="flex items-center justify-between">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Debit</span>
        <div class="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><i data-lucide="arrow-down-to-line" class="w-4 h-4"></i></div>
      </div>
      <span class="text-xl font-extrabold text-slate-950 block mt-2">${a(n)}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <div class="flex items-center justify-between">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Credit</span>
        <div class="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center"><i data-lucide="arrow-up-from-line" class="w-4 h-4"></i></div>
      </div>
      <span class="text-xl font-extrabold text-slate-950 block mt-2">${a(r)}</span>
    </div>
  `}function c(){s(),window.renderTable(),t()}document.addEventListener(`DOMContentLoaded`,async()=>{await r,c()});