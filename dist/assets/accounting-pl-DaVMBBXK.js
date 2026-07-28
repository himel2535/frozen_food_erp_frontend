import"./lucide-CU5-AOMs.js";import"./layout-wQjH3XYy.js";import{n as e,o as t,s as n,t as r}from"./shared-Det_SasC.js";function i(e){return String(e??``).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#39;`)}function a(e){return`$${Number(e||0).toLocaleString(`en-US`,{minimumFractionDigits:2,maximumFractionDigits:2})}`}function o(){return e.accountingPL||(e.accountingPL=[{category:`Revenue`,item:`Sales Revenues`,amount:12450},{category:`Expenses`,item:`Internet Fiber monthly fee`,amount:-120}],n()),e.accountingPL}window.showMainView=function(){document.getElementById(`accounting-pl-main-view`).classList.remove(`hidden`),document.getElementById(`accounting-pl-form-view`).classList.add(`hidden`)},window.showFormView=function(){document.getElementById(`accounting-pl-main-view`).classList.add(`hidden`),document.getElementById(`accounting-pl-form-view`).classList.remove(`hidden`)},window.openProfitlossModal=function(){let e=document.getElementById(`accounting-pl-form`);e&&e.reset(),window.showFormView()},window.handleSubmit=function(e){e.preventDefault();let t=o(),r={category:document.getElementById(`input-cat`).value,item:document.getElementById(`input-name`).value,amount:parseFloat(document.getElementById(`input-amount`).value)};t.push(r),n(),window.showMainView(),c()},window.renderTable=function(){let e=document.getElementById(`accounting-pl-body`);if(!e)return;e.innerHTML=``;let t=document.getElementById(`accounting-pl-search-input`)?.value.toLowerCase()||``,n=o().filter(e=>!t||Object.values(e).some(e=>String(e).toLowerCase().includes(t)));if(n.length===0){e.innerHTML=`<tr><td colspan="10" class="p-8 text-center text-slate-400">No records found</td></tr>`;return}n.forEach(t=>{e.innerHTML+=`
      <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100">
        <td class="p-4 font-bold">${i(t.category)}</td><td class="p-4">${i(t.item)}</td><td class="p-4 font-bold ${t.amount>=0?`text-emerald-600`:`text-rose-600`}">${a(t.amount)}</td>
      </tr>
    `})};function s(){let e=o(),t=document.getElementById(`accounting-pl-metrics`);if(!t)return;let n=e.filter(e=>e.category.toLowerCase().includes(`revenue`)||e.category.toLowerCase().includes(`income`)).reduce((e,t)=>e+(t.amount||0),0)||12e4,r=e.filter(e=>e.category.toLowerCase().includes(`expense`)||e.category.toLowerCase().includes(`cost`)).reduce((e,t)=>e+(t.amount||0),0)||107670,i=n-r;t.innerHTML=`
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <div class="flex items-center justify-between">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Gross Revenue</span>
        <div class="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center"><i data-lucide="trending-up" class="w-4 h-4"></i></div>
      </div>
      <span class="text-xl font-extrabold text-slate-950 block mt-2">${a(n)}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <div class="flex items-center justify-between">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Expenses</span>
        <div class="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center"><i data-lucide="trending-down" class="w-4 h-4"></i></div>
      </div>
      <span class="text-xl font-extrabold text-slate-950 block mt-2">${a(r)}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <div class="flex items-center justify-between">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Net Income</span>
        <div class="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><i data-lucide="dollar-sign" class="w-4 h-4"></i></div>
      </div>
      <span class="text-xl font-extrabold text-emerald-600 block mt-2">${a(i)}</span>
    </div>
  `}function c(){s(),window.renderTable(),t()}document.addEventListener(`DOMContentLoaded`,async()=>{await r,c()});