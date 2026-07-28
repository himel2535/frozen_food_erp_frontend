import"./lucide-CU5-AOMs.js";import"./layout-wQjH3XYy.js";import{n as e,o as t,s as n,t as r}from"./shared-Det_SasC.js";function i(e){return String(e??``).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#39;`)}function a(e){return`$${Number(e||0).toLocaleString(`en-US`,{minimumFractionDigits:2,maximumFractionDigits:2})}`}function o(){return e.purchasesGoodsReceived||(e.purchasesGoodsReceived=[{id:`GRN-001`,orderId:`PO-2026-0001`,supplier:`Global Dye Chemicals`,warehouse:`Raw Material WH`,receivedQty:500,totalValue:25e3,date:`2026-06-16`,status:`Received`,deliveryNote:`DN-4491`,carrierInfo:`DHL Express`,notes:`Checked and verified against PO.`},{id:`GRN-002`,orderId:`PO-2026-0012`,supplier:`Premium Yarns Ltd`,warehouse:`Raw Material WH`,receivedQty:1e3,totalValue:12e3,date:`2026-06-20`,status:`Quality Check`,deliveryNote:`DN-9922`,carrierInfo:`Internal Truck`,notes:`Waiting for QA lab tests on thread strength.`},{id:`GRN-003`,orderId:`PO-2026-0015`,supplier:`Machinery Spares Co`,warehouse:`Maintenance WH`,receivedQty:50,totalValue:5e3,date:`2026-06-22`,status:`Rejected`,deliveryNote:`DN-001X`,carrierInfo:`FedEx`,notes:`Wrong parts delivered. RTV requested.`}],n()),e.purchasesGoodsReceived}window.showMainView=function(){document.getElementById(`purchases-goods-received-main-view`).classList.remove(`hidden`),document.getElementById(`purchases-goods-received-form-view`).classList.add(`hidden`)},window.showFormView=function(){document.getElementById(`purchases-goods-received-main-view`).classList.add(`hidden`),document.getElementById(`purchases-goods-received-form-view`).classList.remove(`hidden`)},window.openGoodsModal=function(){let e=document.getElementById(`purchases-goods-received-form`);e&&e.reset();let t=document.getElementById(`purchases-goods-received-advanced-section`),n=document.getElementById(`purchases-goods-received-advanced-icon`);t&&!t.classList.contains(`hidden`)&&(t.classList.add(`hidden`),n&&(n.style.transform=`rotate(0deg)`));let r=document.getElementById(`grn-form-title`);r&&(r.textContent=`Create Goods Receipt Note (GRN)`),window.showFormView()},window.toggleAdvancedFields=function(){let e=document.getElementById(`purchases-goods-received-advanced-section`),t=document.getElementById(`purchases-goods-received-advanced-icon`);e.classList.contains(`hidden`)?(e.classList.remove(`hidden`),t&&(t.style.transform=`rotate(180deg)`)):(e.classList.add(`hidden`),t&&(t.style.transform=`rotate(0deg)`))},window.handleSubmit=function(e){e.preventDefault();let t=o(),r=document.getElementById(`input-ref`).value,i=document.getElementById(`input-supp`).value,a=document.getElementById(`input-wh`).value,s=parseInt(document.getElementById(`input-qty`).value,10),l=parseFloat(document.getElementById(`input-value`).value),u=document.getElementById(`input-date`).value,d=document.getElementById(`input-status`).value,f=document.getElementById(`input-delivery-note`).value,p=document.getElementById(`input-carrier`).value,m=document.getElementById(`input-notes`).value,h={id:`GRN-${String(100+t.length+1).slice(1)}`,orderId:r,supplier:i,warehouse:a,receivedQty:s,totalValue:l,date:u,status:d,deliveryNote:f,carrierInfo:p,notes:m};t.push(h),n(),window.showMainView(),c()},window.renderTable=function(){let e=document.getElementById(`purchases-goods-received-body`);if(!e)return;e.innerHTML=``;let t=document.getElementById(`purchases-goods-received-search-input`)?.value.toLowerCase()||``,n=o().filter(e=>!t||Object.values(e).some(e=>String(e).toLowerCase().includes(t)));if(n.length===0){e.innerHTML=`<tr><td colspan="10" class="p-8 text-center text-slate-400">No records found</td></tr>`;return}n.forEach(t=>{let n=`bg-slate-100 text-slate-600`;t.status===`Received`&&(n=`bg-emerald-100 text-emerald-700`),t.status===`Quality Check`&&(n=`bg-amber-100 text-amber-700`),t.status===`Rejected`&&(n=`bg-red-100 text-red-700`),e.innerHTML+=`
      <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100">
        <td class="p-4 font-bold text-slate-900">${i(t.id)}</td>
        <td class="p-4 font-semibold text-blue-600 cursor-pointer hover:underline">${i(t.orderId)}</td>
        <td class="p-4">
          <div class="font-bold text-slate-800">${i(t.supplier)}</div>
        </td>
        <td class="p-4">${i(t.warehouse)}</td>
        <td class="p-4 font-semibold">${t.receivedQty}</td>
        <td class="p-4">${a(t.totalValue)}</td>
        <td class="p-4">${i(t.date)}</td>
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
    `})};function s(){let e=o(),t=document.getElementById(`purchases-goods-received-metrics`);if(!t)return;let n=e.length,r=0,i=0,s=0;e.forEach(e=>{(e.status===`Received`||e.status===`Quality Check`)&&(r+=e.qty||e.receivedQty,i+=e.totalValue),e.status===`Quality Check`&&s++}),t.innerHTML=`
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Receipts</span>
      <span class="text-xl font-extrabold text-slate-950 block mt-2">${n}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Received Qty</span>
      <span class="text-xl font-extrabold text-blue-600 block mt-2">${r}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Value Received</span>
      <span class="text-xl font-extrabold text-slate-950 block mt-2">${a(i)}</span>
    </div>
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pending Quality Check</span>
      <span class="text-xl font-extrabold text-amber-500 block mt-2">${s}</span>
    </div>
  `}function c(){s(),window.renderTable(),t()}document.addEventListener(`DOMContentLoaded`,async()=>{await r,c()});