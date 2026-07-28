import"./lucide-CU5-AOMs.js";import"./layout-wQjH3XYy.js";import{n as e,o as t,s as n,t as r}from"./shared-Det_SasC.js";function i(e){return String(e??``).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#39;`)}function a(e){return`$${Number(e||0).toLocaleString(`en-US`,{minimumFractionDigits:2,maximumFractionDigits:2})}`}function o(){return e.accountingBalanceSheet||(e.accountingBalanceSheet=[{group:`Assets`,name:`Cash at Bank`,amount:45e3},{group:`Liabilities`,name:`Accounts Payable`,amount:1260}],n()),e.accountingBalanceSheet}window.showMainView=function(){document.getElementById(`accounting-balance-main-view`).classList.remove(`hidden`),document.getElementById(`accounting-balance-form-view`).classList.add(`hidden`)},window.showFormView=function(){document.getElementById(`accounting-balance-main-view`).classList.add(`hidden`),document.getElementById(`accounting-balance-form-view`).classList.remove(`hidden`)},window.openBalancesheetModal=function(){let e=document.getElementById(`accounting-balance-form`);e&&e.reset(),window.showFormView()},window.handleSubmit=function(e){e.preventDefault();let t=o(),r={group:document.getElementById(`input-class`).value,name:document.getElementById(`input-name`).value,amount:parseFloat(document.getElementById(`input-amount`).value)};t.push(r),n(),window.showMainView(),c()},window.renderTable=function(){let e=document.getElementById(`accounting-balance-body`);if(!e)return;e.innerHTML=``;let t=document.getElementById(`accounting-balance-search-input`)?.value.toLowerCase()||``,n=o().filter(e=>!t||Object.values(e).some(e=>String(e).toLowerCase().includes(t)));if(n.length===0){e.innerHTML=`<tr><td colspan="10" class="p-8 text-center text-slate-400">No records found</td></tr>`;return}n.forEach(t=>{e.innerHTML+=`
      <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100">
        <td class="p-4 font-bold text-slate-900">${i(t.group)}</td><td class="p-4">${i(t.name)}</td><td class="p-4 font-bold text-indigo-600">${a(t.amount)}</td>
      </tr>
    `})};function s(){let e=o(),t=document.getElementById(`accounting-balance-metrics`);if(!t)return;let n=e.filter(e=>e.group.toLowerCase().includes(`asset`)).reduce((e,t)=>e+(t.amount||0),0)||45e3,r=e.filter(e=>e.group.toLowerCase().includes(`liabilit`)).reduce((e,t)=>e+(t.amount||0),0)||12500;t.innerHTML=`
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <div class="flex items-center justify-between">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Asset Value</span>
        <div class="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center"><i data-lucide="landmark" class="w-4 h-4"></i></div>
      </div>
      <span class="text-xl font-extrabold text-slate-950 block mt-2">${a(n)}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <div class="flex items-center justify-between">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Liabilities</span>
        <div class="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center"><i data-lucide="trending-down" class="w-4 h-4"></i></div>
      </div>
      <span class="text-xl font-extrabold text-slate-950 block mt-2">${a(r)}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <div class="flex items-center justify-between">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Net Equity</span>
        <div class="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><i data-lucide="scale" class="w-4 h-4"></i></div>
      </div>
      <span class="text-xl font-extrabold text-slate-950 block mt-2">${a(n-r)}</span>
    </div>
  `}function c(){s(),window.renderTable(),t()}document.addEventListener(`DOMContentLoaded`,async()=>{await r,c()});