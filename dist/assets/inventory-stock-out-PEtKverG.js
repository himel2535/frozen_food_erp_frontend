import"./lucide-CU5-AOMs.js";import"./layout-wQjH3XYy.js";import{n as e,o as t,s as n,t as r}from"./shared-Det_SasC.js";function i(e){return String(e??``).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#39;`)}function a(e){return`$${Number(e||0).toLocaleString(`en-US`,{minimumFractionDigits:2,maximumFractionDigits:2})}`}function o(){return e.inventoryStockOut||(e.inventoryStockOut=[{id:`SO-001`,product:`Indigo Dye`,warehouse:`Main WH`,qty:15,unitValue:50,date:`2026-06-21`,sourceType:`Sales`,referenceDoc:`SO-1042`,status:`Completed`,reasonCode:`Sales Delivery`,notes:`Delivered to customer`,batch:`B-001`},{id:`SO-002`,product:`Cotton Yarn`,warehouse:`Raw Material WH`,qty:100,unitValue:12,date:`2026-06-22`,sourceType:`Manufacturing`,referenceDoc:`MO-89`,status:`Completed`,reasonCode:`Manufacturing Consumption`,notes:`Moved to production line 1`,batch:`B-009`},{id:`SO-003`,product:`Denim Fabric`,warehouse:`Finished Goods WH`,qty:5,unitValue:120,date:`2026-06-23`,sourceType:`Damage`,referenceDoc:``,status:`Completed`,reasonCode:`Damage`,notes:`Water damage in corner`,batch:``},{id:`SO-004`,product:`Linen Thread`,warehouse:`Main WH`,qty:20,unitValue:8,date:`2026-06-25`,sourceType:`Sales`,referenceDoc:`SO-1045`,status:`Pending`,reasonCode:`Sales Delivery`,notes:`Awaiting pickup`,batch:``}],n()),e.inventoryStockOut}window.showMainView=function(){document.getElementById(`inventory-stock-out-main-view`).classList.remove(`hidden`),document.getElementById(`inventory-stock-out-form-view`).classList.add(`hidden`)},window.showFormView=function(){document.getElementById(`inventory-stock-out-main-view`).classList.add(`hidden`),document.getElementById(`inventory-stock-out-form-view`).classList.remove(`hidden`)},window.openStockoutModal=function(){let e=document.getElementById(`inventory-stock-out-form`);e&&e.reset();let t=document.getElementById(`inventory-stock-out-advanced-section`),n=document.getElementById(`inventory-stock-out-advanced-icon`);t&&!t.classList.contains(`hidden`)&&(t.classList.add(`hidden`),n&&(n.style.transform=`rotate(0deg)`));let r=document.getElementById(`stock-out-form-title`);r&&(r.textContent=`Create Stockout`),window.showFormView()},window.toggleAdvancedFields=function(){let e=document.getElementById(`inventory-stock-out-advanced-section`),t=document.getElementById(`inventory-stock-out-advanced-icon`);e.classList.contains(`hidden`)?(e.classList.remove(`hidden`),t&&(t.style.transform=`rotate(180deg)`)):(e.classList.add(`hidden`),t&&(t.style.transform=`rotate(0deg)`))},window.handleSubmit=function(e){e.preventDefault();let t=o(),r=document.getElementById(`input-prod`).value,i=document.getElementById(`input-wh`).value,a=parseInt(document.getElementById(`input-qty`).value,10),s=parseFloat(document.getElementById(`input-unit-value`).value),l=document.getElementById(`input-date`).value,u=document.getElementById(`input-source-type`).value,d=document.getElementById(`input-ref`).value,f=document.getElementById(`input-reason`).value,p=document.getElementById(`input-batch`).value,m=document.getElementById(`input-notes`).value,h={id:`SO-${String(100+t.length+1).slice(1)}`,product:r,warehouse:i,qty:a,unitValue:s,date:l,sourceType:u,status:`Completed`,referenceDoc:d,reasonCode:f,batch:p,notes:m};t.push(h),n(),window.showMainView(),c()},window.renderTable=function(){let e=document.getElementById(`inventory-stock-out-body`);if(!e)return;e.innerHTML=``;let t=document.getElementById(`inventory-stock-out-search-input`)?.value.toLowerCase()||``,n=o().filter(e=>!t||Object.values(e).some(e=>String(e).toLowerCase().includes(t)));if(n.length===0){e.innerHTML=`<tr><td colspan="10" class="p-8 text-center text-slate-400">No records found</td></tr>`;return}n.forEach(t=>{let n=t.qty*t.unitValue,r=`bg-slate-100 text-slate-600`;t.status===`Completed`&&(r=`bg-emerald-100 text-emerald-700`),t.status===`Pending`&&(r=`bg-amber-100 text-amber-700`),e.innerHTML+=`
      <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100">
        <td class="p-4 font-bold text-slate-900">${i(t.id)}</td>
        <td class="p-4">
          <div class="font-bold text-slate-800">${i(t.product)}</div>
          <div class="text-[10px] text-slate-400">${t.batch?`Batch: `+i(t.batch):``}</div>
        </td>
        <td class="p-4">${i(t.warehouse)}</td>
        <td class="p-4 font-semibold">${t.qty}</td>
        <td class="p-4">${a(t.unitValue)}</td>
        <td class="p-4 font-semibold">${a(n)}</td>
        <td class="p-4">${i(t.date)}</td>
        <td class="p-4">
          <div class="font-medium text-slate-700">${i(t.sourceType)}</div>
          <div class="text-[10px] text-slate-400">${i(t.referenceDoc||`-`)}</div>
        </td>
        <td class="p-4">
          <span class="px-2 py-1 rounded-md text-[10px] font-bold ${r}">
            ${i(t.status)}
          </span>
        </td>
        <td class="p-4 text-right">
          <button class="text-blue-600 hover:text-blue-800 p-1 cursor-pointer transition-colors" title="Edit">
            <i data-lucide="edit-2" class="w-4 h-4"></i>
          </button>
        </td>
      </tr>
    `})};function s(){let e=o(),t=document.getElementById(`inventory-stock-out-metrics`);if(!t)return;let n=e.length,r=0,i=0,s=0,c=0;e.forEach(e=>{let t=e.qty*e.unitValue;e.status===`Completed`?(r+=e.qty,i+=t,(e.sourceType===`Damage`||e.reasonCode===`Damage`||e.reasonCode===`Expiry`)&&(c+=t)):e.status===`Pending`&&(s+=e.qty)}),t.innerHTML=`
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Runs</span>
      <span class="text-xl font-extrabold text-slate-950 block mt-2">${n}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Issued Qty</span>
      <span class="text-xl font-extrabold text-blue-600 block mt-2">${r}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Out Value</span>
      <span class="text-xl font-extrabold text-slate-950 block mt-2">${a(i)}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pending Stock-Out</span>
      <span class="text-xl font-extrabold text-amber-500 block mt-2">${s}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Lost/Damaged Value</span>
      <span class="text-xl font-extrabold text-red-500 block mt-2">${a(c)}</span>
    </div>
  `}function c(){s(),window.renderTable(),t()}document.addEventListener(`DOMContentLoaded`,async()=>{await r,c()});