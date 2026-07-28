import"./lucide-CU5-AOMs.js";import"./layout-wQjH3XYy.js";import{n as e,o as t,s as n,t as r}from"./shared-Det_SasC.js";function i(e){return String(e??``).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#39;`)}function a(e){return`$${Number(e||0).toLocaleString(`en-US`,{minimumFractionDigits:2,maximumFractionDigits:2})}`}function o(){return e.inventoryStockAdjustments||(e.inventoryStockAdjustments=[{id:`SA-001`,product:`Indigo Dye`,warehouse:`Main WH`,type:`Decrease`,qty:5,unitValue:50,date:`2026-06-21`,reasonCode:`Damage`,referenceDoc:`AUD-100`,notes:`Container cracked`,status:`Completed`},{id:`SA-002`,product:`Cotton Yarn`,warehouse:`Raw Material WH`,type:`Increase`,qty:20,unitValue:12,date:`2026-06-22`,reasonCode:`Found Item`,referenceDoc:`AUD-101`,notes:`Found during weekly cycle count`,status:`Completed`},{id:`SA-003`,product:`Denim Fabric`,warehouse:`Finished Goods WH`,type:`Decrease`,qty:2,unitValue:120,date:`2026-06-23`,reasonCode:`Shrinkage`,referenceDoc:``,notes:`Unexplained shortage`,status:`Pending`}],n()),e.inventoryStockAdjustments}window.showMainView=function(){document.getElementById(`inventory-adjustments-main-view`).classList.remove(`hidden`),document.getElementById(`inventory-adjustments-form-view`).classList.add(`hidden`)},window.showFormView=function(){document.getElementById(`inventory-adjustments-main-view`).classList.add(`hidden`),document.getElementById(`inventory-adjustments-form-view`).classList.remove(`hidden`)},window.openAdjustmentModal=function(){let e=document.getElementById(`inventory-adjustments-form`);e&&e.reset();let t=document.getElementById(`inventory-adjustments-advanced-section`),n=document.getElementById(`inventory-adjustments-advanced-icon`);t&&!t.classList.contains(`hidden`)&&(t.classList.add(`hidden`),n&&(n.style.transform=`rotate(0deg)`));let r=document.getElementById(`adjustment-form-title`);r&&(r.textContent=`Create Adjustment`),window.showFormView()},window.toggleAdvancedFields=function(){let e=document.getElementById(`inventory-adjustments-advanced-section`),t=document.getElementById(`inventory-adjustments-advanced-icon`);e.classList.contains(`hidden`)?(e.classList.remove(`hidden`),t&&(t.style.transform=`rotate(180deg)`)):(e.classList.add(`hidden`),t&&(t.style.transform=`rotate(0deg)`))},window.handleSubmit=function(e){e.preventDefault();let t=o(),r=document.getElementById(`input-prod`).value,i=document.getElementById(`input-wh`).value,a=document.getElementById(`input-type`).value,s=parseInt(document.getElementById(`input-qty`).value,10),l=parseFloat(document.getElementById(`input-unit-value`).value),u=document.getElementById(`input-date`).value,d=document.getElementById(`input-reason`).value,f=document.getElementById(`input-ref`).value,p=document.getElementById(`input-notes`).value,m={id:`SA-${String(100+t.length+1).slice(1)}`,product:r,warehouse:i,type:a,qty:s,unitValue:l,date:u,reasonCode:d,referenceDoc:f,notes:p,status:`Completed`};t.push(m),n(),window.showMainView(),c()},window.renderTable=function(){let e=document.getElementById(`inventory-adjustments-body`);if(!e)return;e.innerHTML=``;let t=document.getElementById(`inventory-adjustments-search-input`)?.value.toLowerCase()||``,n=o().filter(e=>!t||Object.values(e).some(e=>String(e).toLowerCase().includes(t)));if(n.length===0){e.innerHTML=`<tr><td colspan="11" class="p-8 text-center text-slate-400">No records found</td></tr>`;return}n.forEach(t=>{let n=t.qty*t.unitValue,r=`bg-slate-100 text-slate-600`;t.status===`Completed`&&(r=`bg-emerald-100 text-emerald-700`),t.status===`Pending`&&(r=`bg-amber-100 text-amber-700`);let o=`text-red-600 bg-red-50`,s=`arrow-down`;t.type===`Increase`&&(o=`text-emerald-600 bg-emerald-50`,s=`arrow-up`),e.innerHTML+=`
      <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100">
        <td class="p-4 font-bold text-slate-900">${i(t.id)}</td>
        <td class="p-4 font-bold text-slate-800">${i(t.product)}</td>
        <td class="p-4">${i(t.warehouse)}</td>
        <td class="p-4">
          <span class="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold ${o}">
            <i data-lucide="${s}" class="w-3 h-3"></i> ${i(t.type)}
          </span>
        </td>
        <td class="p-4 font-semibold ${t.type===`Decrease`?`text-red-600`:`text-emerald-600`}">
          ${t.type===`Decrease`?`-`:`+`}${t.qty}
        </td>
        <td class="p-4">${a(t.unitValue)}</td>
        <td class="p-4 font-semibold ${t.type===`Decrease`?`text-red-600`:`text-emerald-600`}">
          ${t.type===`Decrease`?`-`:`+`}${a(n)}
        </td>
        <td class="p-4">
          <div class="font-medium text-slate-700">${i(t.reasonCode||`-`)}</div>
        </td>
        <td class="p-4">${i(t.date)}</td>
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
    `})};function s(){let e=o(),t=document.getElementById(`inventory-adjustments-metrics`);if(!t)return;let n=e.length,r=0,i=0,s=0,c=0;e.forEach(e=>{let t=e.qty*e.unitValue;e.status===`Completed`?e.type===`Increase`?(r+=e.qty,s+=t):(i+=e.qty,s-=t):e.status===`Pending`&&c++}),t.innerHTML=`
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Adjustments</span>
      <span class="text-xl font-extrabold text-slate-950 block mt-2">${n}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Increased Qty</span>
      <span class="text-xl font-extrabold text-emerald-600 block mt-2">+${r}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Decreased Qty</span>
      <span class="text-xl font-extrabold text-red-600 block mt-2">-${i}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Net Value Change</span>
      <span class="text-xl font-extrabold ${s<0?`text-red-600`:s>0?`text-emerald-600`:`text-slate-950`} block mt-2">${s>0?`+`:``}${a(s)}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pending Audits</span>
      <span class="text-xl font-extrabold text-amber-500 block mt-2">${c}</span>
    </div>
  `}function c(){s(),window.renderTable(),t()}document.addEventListener(`DOMContentLoaded`,async()=>{await r,c()});