import"./lucide-CU5-AOMs.js";import"./layout-wQjH3XYy.js";import{a as e,n as t,o as n,s as r,t as i}from"./shared-Det_SasC.js";function a(e){return String(e??``).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#39;`)}function o(e){return`$${Number(e||0).toLocaleString(`en-US`,{minimumFractionDigits:2,maximumFractionDigits:2})}`}function s(e){return Number(e||0).toLocaleString(`en-US`)}function c(){return e()}function l(e){return t.inventory.reduce((t,n)=>{let r=Number(n.warehouseStock?.[e]||0);return r<=0?t:(t.currentStock+=r,t.stockValueStored+=r*Number(n.cost||0),t.activeProductsCount+=1,t)},{currentStock:0,stockValueStored:0,activeProductsCount:0})}function u(e){let t=l(e.id),n=Number(e.capacity||0),r=n>0?t.currentStock/n*100:0;return{...e,...t,utilizationPercent:r}}function d(){let e=c().map(u),t=e.reduce((e,t)=>e+Number(t.capacity||0),0),n=e.reduce((e,t)=>e+t.currentStock,0),r=e.filter(e=>e.status===`Active`).length;return{warehouses:e,totalCapacity:t,totalCurrentStock:n,activeWarehouses:r,inactiveWarehouses:e.length-r,utilizationPercent:t>0?n/t*100:0}}function f(){let e=document.getElementById(`inventory-warehouses-advanced-section`),t=document.getElementById(`inventory-warehouses-advanced-icon`);e&&e.classList.add(`hidden`),t&&(t.style.transform=`rotate(0deg)`)}function p(){let e=c().reduce((e,t)=>{let n=Number.parseInt(String(t.id||``).replace(/[^\d]/g,``),10);return Number.isFinite(n)?Math.max(e,n):e},0);return`WH-${String(e+1).padStart(3,`0`)}`}window.showMainView=function(){document.getElementById(`inventory-warehouses-main-view`).classList.remove(`hidden`),document.getElementById(`inventory-warehouses-form-view`).classList.add(`hidden`)},window.showFormView=function(){document.getElementById(`inventory-warehouses-main-view`).classList.add(`hidden`),document.getElementById(`inventory-warehouses-form-view`).classList.remove(`hidden`)},window.toggleAdvancedFields=function(){let e=document.getElementById(`inventory-warehouses-advanced-section`),t=document.getElementById(`inventory-warehouses-advanced-icon`);if(!e)return;let n=e.classList.contains(`hidden`);e.classList.toggle(`hidden`,!n),t&&(t.style.transform=n?`rotate(180deg)`:`rotate(0deg)`)},window.openWarehouseModal=function(e=``){let t=document.getElementById(`inventory-warehouses-form`);if(t){if(t.reset(),document.getElementById(`warehouse-edit-id`).value=``,document.getElementById(`warehouse-form-title`).textContent=`Create Warehouse`,f(),e){let t=c().find(t=>t.id===e);t&&(document.getElementById(`warehouse-edit-id`).value=t.id,document.getElementById(`warehouse-form-title`).textContent=`Edit Warehouse`,document.getElementById(`warehouse-input-name`).value=t.name,document.getElementById(`warehouse-input-location`).value=t.location,document.getElementById(`warehouse-input-capacity`).value=Number(t.capacity||0),document.getElementById(`warehouse-input-type`).value=t.type,document.getElementById(`warehouse-input-status`).value=t.status,document.getElementById(`warehouse-input-manager`).value=t.manager||``,document.getElementById(`warehouse-input-contact`).value=t.contact||``,document.getElementById(`warehouse-input-product-types`).value=t.allowedProductTypes||``,document.getElementById(`warehouse-input-storage-rules`).value=t.storageRules||``)}window.showFormView(),n()}},window.handleSubmit=function(e){e.preventDefault();let t=c(),n={id:document.getElementById(`warehouse-edit-id`).value||p(),name:document.getElementById(`warehouse-input-name`).value.trim(),location:document.getElementById(`warehouse-input-location`).value.trim(),capacity:Number.parseInt(document.getElementById(`warehouse-input-capacity`).value,10)||0,type:document.getElementById(`warehouse-input-type`).value,manager:document.getElementById(`warehouse-input-manager`).value.trim(),contact:document.getElementById(`warehouse-input-contact`).value.trim(),status:document.getElementById(`warehouse-input-status`).value,allowedProductTypes:document.getElementById(`warehouse-input-product-types`).value.trim(),storageRules:document.getElementById(`warehouse-input-storage-rules`).value.trim()},i=t.findIndex(e=>e.id===n.id);i>=0?t[i]=n:t.push(n),r(),window.showMainView(),h()},window.toggleWarehouseStatus=function(e){let t=c().find(t=>t.id===e);t&&(t.status=t.status===`Active`?`Inactive`:`Active`,r(),h())},window.renderTable=function(){let e=document.getElementById(`inventory-warehouses-body`);if(!e)return;let t=String(document.getElementById(`inventory-warehouses-search-input`)?.value||``).trim().toLowerCase(),n=c().map(u).filter(e=>t?[e.id,e.name,e.location,e.manager,e.type,e.status].join(` `).toLowerCase().includes(t):!0);if(e.innerHTML=``,n.length===0){e.innerHTML=`<tr><td colspan="11" class="px-6 py-8 text-center text-slate-400 font-semibold">No warehouses matched your search.</td></tr>`;return}n.forEach(t=>{let n=t.status===`Active`?`bg-emerald-50 text-emerald-600`:`bg-slate-200 text-slate-600`,r=t.utilizationPercent>=85?`bg-rose-500`:t.utilizationPercent>=60?`bg-amber-500`:`bg-blue-500`,i=Math.min(100,Math.max(0,t.utilizationPercent));e.innerHTML+=`
      <tr class="hover:bg-slate-50/70 transition-colors">
        <td class="px-6 py-4 font-bold text-slate-900">${a(t.id)}</td>
        <td class="px-6 py-4">
          <div class="font-bold text-slate-900">${a(t.name)}</div>
          <div class="text-[10px] text-slate-400 font-semibold">${a(t.manager||`No manager assigned`)}</div>
        </td>
        <td class="px-6 py-4">${a(t.location)}</td>
        <td class="px-6 py-4">${a(t.type)}</td>
        <td class="px-6 py-4 text-right font-semibold text-slate-900">${s(t.capacity)} units</td>
        <td class="px-6 py-4 text-right font-semibold text-slate-900">${s(t.currentStock)} units</td>
        <td class="px-6 py-4 min-w-[170px]">
          <div class="flex items-center justify-between gap-3 text-[11px] font-bold text-slate-600 mb-1">
            <span>${t.utilizationPercent.toFixed(1)}%</span>
            <span>${s(t.currentStock)} / ${s(t.capacity)}</span>
          </div>
          <div class="h-2 rounded-full bg-slate-100 overflow-hidden">
            <div class="h-full rounded-full ${r}" style="width: ${i}%;"></div>
          </div>
        </td>
        <td class="px-6 py-4 text-right font-semibold text-emerald-700">${o(t.stockValueStored)}</td>
        <td class="px-6 py-4 text-center font-bold text-slate-900">${t.activeProductsCount}</td>
        <td class="px-6 py-4">
          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${n}">
            ${a(t.status)}
          </span>
        </td>
        <td class="px-6 py-4 text-center">
          <div class="inline-flex items-center gap-2">
            <button onclick="window.openWarehouseModal('${t.id}')" class="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-bold text-slate-600 transition-colors cursor-pointer">Edit</button>
            <button onclick="window.toggleWarehouseStatus('${t.id}')" class="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-bold text-slate-600 transition-colors cursor-pointer">
              ${t.status===`Active`?`Deactivate`:`Activate`}
            </button>
          </div>
        </td>
      </tr>
    `})};function m(){let e=document.getElementById(`inventory-warehouses-metrics`);if(!e)return;let{warehouses:t,totalCapacity:n,totalCurrentStock:r,activeWarehouses:i,inactiveWarehouses:a,utilizationPercent:o}=d();e.innerHTML=`
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Warehouses</span>
      <span class="text-xl font-extrabold text-slate-950 block mt-2">${t.length}</span>
      <span class="text-[11px] text-slate-500 font-semibold mt-2 block">${i} active · ${a} inactive</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Stock Capacity</span>
      <span class="text-xl font-extrabold text-slate-950 block mt-2">${s(n)}</span>
      <span class="text-[11px] text-slate-500 font-semibold mt-2 block">units across all facilities</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-blue-200 premium-shadow bg-blue-50/20">
      <div class="flex items-center justify-between gap-3">
        <span class="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">Current Stock Utilization</span>
        <span class="text-[11px] font-bold text-blue-700">${o.toFixed(1)}%</span>
      </div>
      <span class="text-xl font-extrabold text-slate-950 block mt-2">${s(r)} / ${s(n)}</span>
      <div class="h-2 rounded-full bg-blue-100 overflow-hidden mt-3">
        <div class="h-full rounded-full bg-blue-600" style="width: ${Math.min(100,Math.max(0,o))}%;"></div>
      </div>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-emerald-200 premium-shadow bg-emerald-50/20">
      <span class="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Active Warehouses</span>
      <span class="text-xl font-extrabold text-emerald-700 block mt-2">${i}</span>
      <span class="text-[11px] text-emerald-700 font-semibold mt-2 block">ready for receiving and dispatch</span>
    </div>
  `}function h(){m(),window.renderTable(),n()}document.addEventListener(`DOMContentLoaded`,async()=>{await i,h()});