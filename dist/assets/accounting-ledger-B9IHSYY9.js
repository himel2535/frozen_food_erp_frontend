import"./lucide-CU5-AOMs.js";import"./layout-wQjH3XYy.js";import{n as e,o as t,s as n,t as r}from"./shared-Det_SasC.js";function i(e){return String(e??``).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#39;`)}function a(e){return`$${Number(e||0).toLocaleString(`en-US`,{minimumFractionDigits:2,maximumFractionDigits:2})}`}function o(){return e.accountingLedger||(e.accountingLedger=[{id:`TXN-001`,account:`Office Expenses`,desc:`Internet monthly fiber fee`,debit:120,credit:0,balance:12330,date:`2026-06-15`}],n()),e.accountingLedger}window.showMainView=function(){document.getElementById(`accounting-ledger-main-view`).classList.remove(`hidden`),document.getElementById(`accounting-ledger-form-view`).classList.add(`hidden`)},window.showFormView=function(){document.getElementById(`accounting-ledger-main-view`).classList.add(`hidden`),document.getElementById(`accounting-ledger-form-view`).classList.remove(`hidden`)},window.openLedgerModal=function(){let e=document.getElementById(`accounting-ledger-form`);e&&e.reset(),window.showFormView()},window.handleSubmit=function(e){e.preventDefault();let t=o(),r={id:`TXN-${String(100+t.length+1).slice(1)}`,account:document.getElementById(`input-account`).value,desc:document.getElementById(`input-desc`).value,debit:parseFloat(document.getElementById(`input-debit`).value||0),credit:parseFloat(document.getElementById(`input-credit`).value||0),balance:12330,date:document.getElementById(`input-date`).value};t.push(r),n(),window.showMainView(),c()},window.renderTable=function(){let e=document.getElementById(`accounting-ledger-body`);if(!e)return;e.innerHTML=``;let t=document.getElementById(`accounting-ledger-search-input`)?.value.toLowerCase()||``,n=document.getElementById(`accounting-ledger-type-filter`)?.value||`all`,r=o().filter(e=>{let r=!t||Object.values(e).some(e=>String(e).toLowerCase().includes(t)),i=n===`all`||String(e.account).toLowerCase().includes(n);return r&&i});if(r.length===0){e.innerHTML=`<tr><td colspan="10" class="p-8 text-center text-slate-400">No records found</td></tr>`;return}r.forEach(t=>{e.innerHTML+=`
      <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100">
        <td class="p-4 font-bold text-slate-900">${i(t.id)}</td><td class="p-4">${i(t.account)}</td><td class="p-4">${i(t.desc)}</td><td class="p-4 font-bold">${a(t.debit)}</td><td class="p-4 font-bold">${a(t.credit)}</td><td class="p-4 font-extrabold text-indigo-600">${a(t.balance)}</td><td class="p-4">${i(t.date)}</td>
      </tr>
    `})};function s(){let e=o(),t=document.getElementById(`accounting-ledger-metrics`);if(!t)return;let n=e.reduce((e,t)=>e+(t.debit||0),0),r=e.reduce((e,t)=>e+(t.credit||0),0);t.innerHTML=`
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <div class="flex items-center justify-between">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Net Ledger Balance</span>
        <div class="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center"><i data-lucide="scale" class="w-4 h-4"></i></div>
      </div>
      <span class="text-xl font-extrabold text-slate-950 block mt-2">${a(n-r)}</span>
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