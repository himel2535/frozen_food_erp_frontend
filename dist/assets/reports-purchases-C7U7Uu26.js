import"./lucide-CU5-AOMs.js";import"./layout-wQjH3XYy.js";import{n as e,o as t,s as n,t as r}from"./shared-Det_SasC.js";function i(e){return String(e??``).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#39;`)}function a(e){return`$${Number(e||0).toLocaleString(`en-US`,{minimumFractionDigits:2,maximumFractionDigits:2})}`}function o(){return e.reportPurchases||(e.reportPurchases=[{date:`2026-06-02`,ref:`PO-2026-001`,supplier:`Global Dye Chemicals`,status:`Received`,total:12e3},{date:`2026-06-06`,ref:`PO-2026-002`,supplier:`Premium Yarns Ltd`,status:`Pending`,total:8500},{date:`2026-06-11`,ref:`PO-2026-003`,supplier:`Machinery Spares Co`,status:`Received`,total:2200},{date:`2026-06-15`,ref:`PO-2026-004`,supplier:`Office Supplies Depot`,status:`Pending`,total:350}],n()),e.reportPurchases}window.renderAll=function(){let e=o(),n=document.getElementById(`filter-search`)?.value.toLowerCase()||``,r=document.getElementById(`filter-start`)?.value||``,s=document.getElementById(`filter-end`)?.value||``,c=document.getElementById(`filter-status`)?.value||`All`,l=e.filter(e=>{let t=!0;return n&&!e.ref.toLowerCase().includes(n)&&!e.supplier.toLowerCase().includes(n)&&(t=!1),r&&e.date<r&&(t=!1),s&&e.date>s&&(t=!1),c!==`All`&&e.status!==c&&(t=!1),t});l.sort((e,t)=>new Date(t.date)-new Date(e.date));let u=document.getElementById(`report-body`);u&&(u.innerHTML=``,l.length===0?u.innerHTML=`<tr><td colspan="5" class="p-8 text-center text-slate-400">No records found matching filters.</td></tr>`:l.forEach(e=>{let t=`bg-slate-100 text-slate-600`;e.status===`Received`&&(t=`bg-emerald-100 text-emerald-700`),e.status===`Pending`&&(t=`bg-amber-100 text-amber-700`),u.innerHTML+=`
          <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100">
            <td class="p-4">${i(e.date)}</td>
            <td class="p-4 font-bold text-slate-900">${i(e.ref)}</td>
            <td class="p-4">${i(e.supplier)}</td>
            <td class="p-4">
              <span class="px-2 py-1 rounded-md text-[10px] font-bold ${t}">${i(e.status)}</span>
            </td>
            <td class="p-4 text-right font-bold text-rose-600">${a(e.total)}</td>
          </tr>
        `}));let d=document.getElementById(`report-metrics`);if(d){let e=0;l.forEach(t=>e+=t.total);let t=l.length>0?e/l.length:0;d.innerHTML=`
      <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Spend</span>
        <span class="text-xl font-extrabold text-rose-600 block mt-2">${a(e)}</span>
      </div>
      <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total POs</span>
        <span class="text-xl font-extrabold text-slate-800 block mt-2">${l.length}</span>
      </div>
      <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Average PO Value</span>
        <span class="text-xl font-extrabold text-blue-600 block mt-2">${a(t)}</span>
      </div>
    `}t()},document.addEventListener(`DOMContentLoaded`,async()=>{await r,window.renderAll()});