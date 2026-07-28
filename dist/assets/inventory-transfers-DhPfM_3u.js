import"./lucide-CU5-AOMs.js";import"./layout-wQjH3XYy.js";import{n as e,o as t,s as n,t as r}from"./shared-Det_SasC.js";function i(e){return String(e??``).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#39;`)}function a(){return e.inventoryStockTransfers||(e.inventoryStockTransfers=[{id:`ST-001`,product:`Silk Satin Blend`,fromWh:`Central Hub`,toWh:`Production WH`,qty:50,date:`2026-06-22`}],n()),e.inventoryStockTransfers}window.showMainView=function(){document.getElementById(`inventory-transfers-main-view`).classList.remove(`hidden`),document.getElementById(`inventory-transfers-form-view`).classList.add(`hidden`)},window.showFormView=function(){document.getElementById(`inventory-transfers-main-view`).classList.add(`hidden`),document.getElementById(`inventory-transfers-form-view`).classList.remove(`hidden`)},window.openTransferModal=function(){let e=document.getElementById(`inventory-transfers-form`);e&&e.reset(),window.showFormView()},window.handleSubmit=function(e){e.preventDefault();let t=a(),r={id:`ST-${String(100+t.length+1).slice(1)}`,product:document.getElementById(`input-prod`).value,fromWh:document.getElementById(`input-from`).value,toWh:document.getElementById(`input-to`).value,qty:parseInt(document.getElementById(`input-qty`).value),date:document.getElementById(`input-date`).value};t.push(r),n(),window.showMainView(),s()},window.renderTable=function(){let e=document.getElementById(`inventory-transfers-body`);if(!e)return;e.innerHTML=``;let t=document.getElementById(`inventory-transfers-search-input`)?.value.toLowerCase()||``,n=a().filter(e=>!t||Object.values(e).some(e=>String(e).toLowerCase().includes(t)));if(n.length===0){e.innerHTML=`<tr><td colspan="10" class="p-8 text-center text-slate-400">No records found</td></tr>`;return}n.forEach(t=>{e.innerHTML+=`
      <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100">
        <td class="p-4 font-bold text-slate-900">${i(t.id)}</td><td class="p-4">${i(t.product)}</td><td class="p-4">${i(t.fromWh)}</td><td class="p-4">${i(t.toWh)}</td><td class="p-4">${t.qty}</td><td class="p-4">${i(t.date)}</td>
      </tr>
    `})};function o(){let e=a(),t=document.getElementById(`inventory-transfers-metrics`);t&&(t.innerHTML=`
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <div class="flex items-center justify-between">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Transfers</span>
        <div class="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><i data-lucide="arrow-right-left" class="w-4 h-4"></i></div>
      </div>
      <span class="text-xl font-extrabold text-slate-950 block mt-2">${e.length}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <div class="flex items-center justify-between">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pending</span>
        <div class="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center"><i data-lucide="clock" class="w-4 h-4"></i></div>
      </div>
      <span class="text-xl font-extrabold text-slate-950 block mt-2">0</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <div class="flex items-center justify-between">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Completed</span>
        <div class="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><i data-lucide="check-circle" class="w-4 h-4"></i></div>
      </div>
      <span class="text-xl font-extrabold text-slate-950 block mt-2">${e.length}</span>
    </div>
  `)}function s(){o(),window.renderTable(),t()}document.addEventListener(`DOMContentLoaded`,async()=>{await r,s()});