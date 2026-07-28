import"./lucide-CU5-AOMs.js";import"./layout-wQjH3XYy.js";import{n as e,o as t,s as n,t as r}from"./shared-Det_SasC.js";function i(e){return String(e??``).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#39;`)}function a(e){return`$${Number(e||0).toLocaleString(`en-US`,{minimumFractionDigits:2,maximumFractionDigits:2})}`}function o(){return e.reportSales||(e.reportSales=[{date:`2026-06-01`,ref:`INV-2026-001`,customer:`Acme Corp`,status:`Paid`,total:5e3},{date:`2026-06-05`,ref:`INV-2026-002`,customer:`Globex Inc`,status:`Unpaid`,total:3200},{date:`2026-06-10`,ref:`INV-2026-003`,customer:`Initech`,status:`Partial`,total:1500},{date:`2026-06-12`,ref:`INV-2026-004`,customer:`Soylent Corp`,status:`Paid`,total:8500},{date:`2026-06-15`,ref:`INV-2026-005`,customer:`Umbrella Corp`,status:`Unpaid`,total:420}],n()),e.reportSales}window.renderAll=function(){let e=o(),n=document.getElementById(`filter-search`)?.value.toLowerCase()||``,r=document.getElementById(`filter-start`)?.value||``,s=document.getElementById(`filter-end`)?.value||``,c=document.getElementById(`filter-status`)?.value||`All`,l=e.filter(e=>{let t=!0;return n&&!e.ref.toLowerCase().includes(n)&&!e.customer.toLowerCase().includes(n)&&(t=!1),r&&e.date<r&&(t=!1),s&&e.date>s&&(t=!1),c!==`All`&&e.status!==c&&(t=!1),t});l.sort((e,t)=>new Date(t.date)-new Date(e.date));let u=document.getElementById(`report-body`);u&&(u.innerHTML=``,l.length===0?u.innerHTML=`<tr><td colspan="5" class="p-8 text-center text-slate-400">No records found matching filters.</td></tr>`:l.forEach(e=>{let t=`bg-slate-100 text-slate-600`;e.status===`Paid`&&(t=`bg-emerald-100 text-emerald-700`),e.status===`Unpaid`&&(t=`bg-rose-100 text-rose-700`),e.status===`Partial`&&(t=`bg-blue-100 text-blue-700`),u.innerHTML+=`
          <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100">
            <td class="p-4">${i(e.date)}</td>
            <td class="p-4 font-bold text-slate-900">${i(e.ref)}</td>
            <td class="p-4">${i(e.customer)}</td>
            <td class="p-4">
              <span class="px-2 py-1 rounded-md text-[10px] font-bold ${t}">${i(e.status)}</span>
            </td>
            <td class="p-4 text-right font-bold text-blue-600">${a(e.total)}</td>
          </tr>
        `}));let d=document.getElementById(`report-metrics`);if(d){let e=0;l.forEach(t=>e+=t.total);let t=l.length>0?e/l.length:0;d.innerHTML=`
      <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Revenue</span>
        <span class="text-xl font-extrabold text-blue-600 block mt-2">${a(e)}</span>
      </div>
      <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Orders</span>
        <span class="text-xl font-extrabold text-slate-800 block mt-2">${l.length}</span>
      </div>
      <div class="bg-white p-5 rounded-2xl border border-slate-200/80 premium-shadow">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Average Order Value</span>
        <span class="text-xl font-extrabold text-emerald-600 block mt-2">${a(t)}</span>
      </div>
    `}t()},document.addEventListener(`DOMContentLoaded`,async()=>{await r,window.renderAll()});